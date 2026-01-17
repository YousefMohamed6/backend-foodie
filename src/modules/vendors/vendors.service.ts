import {
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { VendorStatusMessages } from '../../common/constants/vendor.constants';
import { normalizePhoneNumber } from '../../common/utils/phone.utils';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
import { CouponsService } from '../coupons/coupons.service';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { ReviewsService } from '../reviews/reviews.service';
import { WalletService } from '../wallet/wallet.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDocumentDto } from './dto/update-vendor-document.dto';
import { UpdateVendorScheduleDto } from './dto/update-vendor-schedule.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VerifyVendorDocumentDto } from './dto/verify-vendor-document.dto';
import {
  VendorDefaults,
  VendorDocumentStatus,
  VendorScheduleDefaults,
} from './vendor.constants';

@Injectable()
export class VendorsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ProductsService))
    private productsService: ProductsService,
    @Inject(forwardRef(() => ReviewsService))
    private reviewsService: ReviewsService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    @Inject(forwardRef(() => CouponsService))
    private couponsService: CouponsService,
    private walletService: WalletService,
    private redisService: RedisService,
  ) { }

  private readonly CACHE_KEYS = {
    ALL_VENDORS: (
      zoneId?: string,
      page?: number | string,
      limit?: number | string,
    ) => `vendors:all:${zoneId || 'no_zone'}:p${page || 1}:l${limit || 20}`,
    VENDOR_BY_ID: (id: string) => `vendors:id:${id}`,
    NEAREST_VENDORS: (
      lat: number,
      lon: number,
      radius: number,
      isDining?: boolean,
      categoryId?: string,
      zoneId?: string,
    ) =>
      `vendors:nearest:${lat}:${lon}:${radius}:${isDining || 'any'}:${categoryId || 'any'}:${zoneId || 'no_zone'}`,
  };

  private async invalidateVendorCache(vendorId?: string, zoneId?: string) {
    // This is a simple invalidation. In a real production app, we might use patterns (keys *) or more specific tagging.
    // For now, let's clear main public lists and the specific vendor.
    if (vendorId) {
      await this.redisService.del(this.CACHE_KEYS.VENDOR_BY_ID(vendorId));
    }
    // Since lists depend on zones/pagination, it's safer to clear or use a shorter TTL.
    // Given the request for "heavy traffic", we'll use a short-ish TTL (e.g. 5-10 mins) for lists
    // and rely on manual invalidation for IDs.
  }

  async create(createVendorDto: CreateVendorDto, user: User) {
    const { photos, restaurantMenuPhotos, categoryIds, ...rest } =
      createVendorDto;

    const {
      subscriptionPlanId,
      subscriptionExpiryDate,
      subscriptionTotalOrders,
      walletAmount,
      reviewsSum,
      reviewsCount,
      isActive,
      isDineInActive,
      restaurantCost,
      subscriptionId,
      ...cleanRest
    } = rest as any;

    if (cleanRest.phoneNumber) {
      cleanRest.phoneNumber = normalizePhoneNumber(cleanRest.phoneNumber);
    }

    const vendor = await this.prisma.$transaction(async (tx) => {
      // Check if user already has a vendor
      const existingVendor = await tx.vendor.findUnique({
        where: { authorId: user.id },
      });
      if (existingVendor) {
        throw new ForbiddenException('USER_ALREADY_HAS_VENDOR');
      }

      // Check if VendorType exists
      const vendorType = await tx.vendorType.findUnique({
        where: { id: cleanRest.vendorTypeId },
      });
      if (!vendorType) {
        throw new NotFoundException('VENDOR_TYPE_NOT_FOUND');
      }

      // Check if Zone exists
      const zone = await tx.zone.findUnique({
        where: { id: cleanRest.zoneId },
      });
      if (!zone) {
        throw new NotFoundException('ZONE_NOT_FOUND');
      }

      // Check if categories exist
      if (categoryIds && categoryIds.length > 0) {
        const categories = await tx.category.findMany({
          where: { id: { in: categoryIds } },
        });
        if (categories.length !== categoryIds.length) {
          throw new NotFoundException('SOME_CATEGORIES_NOT_FOUND');
        }
      }

      // Find Free Plan
      const freePlan = await tx.subscriptionPlan.findFirst({
        where: { price: 0, isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      let expiryDate: Date | null = null;
      if (freePlan) {
        expiryDate = new Date();
        expiryDate.setDate(
          expiryDate.getDate() + (freePlan as any).durationDays,
        );
      }

      let subscription: any = null;
      if (freePlan) {
        subscription = await tx.subscription.create({
          data: {
            userId: user.id,
            planId: freePlan.id,
            startDate: new Date(),
            endDate: expiryDate as Date,
            amountPaid: 0,
            status: 'ACTIVE',
          },
        });
      }

      const newVendor = await tx.vendor.create({
        data: {
          ...cleanRest,
          authorId: user.id,
          subscriptionPlanId: freePlan?.id,
          subscriptionId: subscription?.id,
          subscriptionExpiryDate: expiryDate,
          subscriptionTotalOrders:
            freePlan?.totalOrders ?? VendorDefaults.INITIAL_TOTAL_ORDERS,
          subscriptionProductsLimit: freePlan?.productsLimit ?? 0,
          reviewsSum: VendorDefaults.INITIAL_REVIEWS_SUM,
          reviewsCount: VendorDefaults.INITIAL_REVIEWS_COUNT,
          isActive: VendorDefaults.DEFAULT_STATUS,
          photos: photos ? { create: photos.map((url: string) => ({ url })) } : undefined,
          restaurantMenuPhotos: restaurantMenuPhotos
            ? { create: restaurantMenuPhotos.map((url: string) => ({ url })) }
            : undefined,
          categories:
            categoryIds && categoryIds.length > 0
              ? {
                connect: categoryIds.map((id: string) => ({ id })),
              }
              : undefined,
        },
      });

      // Update user with subscription info
      await tx.user.update({
        where: { id: user.id },
        data: {
          subscriptionPlanId: freePlan?.id,
          subscriptionExpiryDate: expiryDate,
        },
      });

      // Create default schedules for 7 days (IDs 0 to 6)
      await (tx as any).vendorSchedule.createMany({
        data: Array.from({ length: 7 }, (_, i) => ({
          vendorId: newVendor.id,
          dayId: i,
          openTime: VendorScheduleDefaults.DEFAULT_OPEN_TIME,
          closeTime: VendorScheduleDefaults.DEFAULT_CLOSE_TIME,
          isActive: VendorScheduleDefaults.DEFAULT_IS_ACTIVE,
        })),
      });

      return tx.vendor.findUnique({
        where: { id: newVendor.id },
        include: {
          photos: true,
          restaurantMenuPhotos: true,
          schedules: true,
          subscriptionPlan: {
            include: {
              features: true,
            },
          },
          author: true,
          categories: true,
        },
      });
    });

    return await this.mapVendorResponse(vendor as any);
  }

  async findAll(
    query: {
      page?: number | string;
      limit?: number | string;
      zoneId?: string;
    } = {},
    user?: User,
  ) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const zoneId =
      user?.role === UserRole.CUSTOMER && user.zoneId
        ? user.zoneId
        : query.zoneId;
    const cacheKey = this.CACHE_KEYS.ALL_VENDORS(zoneId, page, limit);

    const cached = await this.redisService.get<any[]>(cacheKey);
    if (cached) return cached;

    const where: Prisma.VendorWhereInput = {
      isActive: true,
    };

    if (zoneId) {
      where.zoneId = zoneId;
    }

    const vendors = await this.prisma.vendor.findMany({
      skip,
      take: limit,
      where,
      include: {
        photos: true,
        restaurantMenuPhotos: true,
        schedules: true,
        subscriptionPlan: {
          include: {
            features: true,
          },
        },
        author: true,
        categories: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const response = await Promise.all(
      vendors.map((v) => this.mapVendorResponse(v as any)),
    );

    // Cache for 5 minutes
    await this.redisService.set(cacheKey, response, 300);

    return response;
  }

  async findOne(id: string) {
    const cacheKey = this.CACHE_KEYS.VENDOR_BY_ID(id);
    const cached = await this.redisService.get(cacheKey);
    if (cached) return cached;

    const vendor = await this.prisma.vendor.findFirst({
      where: { id, isActive: true },
      include: {
        photos: true,
        restaurantMenuPhotos: true,
        schedules: true,
        subscriptionPlan: {
          include: {
            features: true,
          },
        },
        author: true,
        categories: true,
      },
    });
    if (!vendor) {
      throw new NotFoundException(VendorStatusMessages.VENDOR_NOT_FOUND);
    }
    const response = await this.mapVendorResponse(vendor as any);

    // Cache for 10 minutes
    await this.redisService.set(cacheKey, response, 600);

    return response;
  }

  async update(id: string, updateVendorDto: UpdateVendorDto) {
    const { photos, restaurantMenuPhotos, categoryIds, ...rest } =
      updateVendorDto as any;

    const {
      subscriptionPlanId,
      subscriptionExpiryDate,
      subscriptionTotalOrders,
      walletAmount,
      reviewsSum,
      reviewsCount,
      isActive,
      isDineInActive,
      restaurantCost,
      subscriptionId,
      ...cleanRest
    } = rest as any;

    if (cleanRest.phoneNumber) {
      cleanRest.phoneNumber = normalizePhoneNumber(cleanRest.phoneNumber);
    }

    const vendor = await this.prisma.vendor.update({
      where: { id },
      data: {
        ...cleanRest,
        subscriptionPlanId,
        photos: photos
          ? {
            deleteMany: {},
            create: photos.map((url) => ({ url })),
          }
          : undefined,
        restaurantMenuPhotos: restaurantMenuPhotos
          ? {
            deleteMany: {},
            create: restaurantMenuPhotos.map((url) => ({ url })),
          }
          : undefined,
        categories:
          categoryIds !== undefined
            ? {
              set: categoryIds.map((id: string) => ({ id })),
            }
            : undefined,
      },
      include: {
        photos: true,
        restaurantMenuPhotos: true,
        schedules: true,
        subscriptionPlan: {
          include: {
            features: true,
          },
        },
        author: true,
        categories: true,
      },
    });

    const response = await this.mapVendorResponse(vendor as any);
    await this.invalidateVendorCache(id, vendor.zoneId);
    return response;
  }

  async remove(id: string) {
    const vendor = await this.prisma.vendor.update({
      where: { id },
      data: { isActive: false },
    });
    await this.invalidateVendorCache(id, vendor.zoneId);
    return vendor;
  }

  async findByAuthor(authorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { authorId },
      include: {
        photos: true,
        restaurantMenuPhotos: true,
        schedules: true,
        subscriptionPlan: {
          include: {
            features: true,
          },
        },
        author: true,
        categories: true,
      },
    });
    return await this.mapVendorResponse(vendor as any);
  }

  async findNearest(
    latitude: number,
    longitude: number,
    radius: number = 10,
    isDining?: boolean,
    categoryId?: string,
    user?: User,
  ) {
    const zoneId =
      user?.role === UserRole.CUSTOMER && user.zoneId ? user.zoneId : undefined;
    // Round lat/lon to 3 decimal places to increase cache hit rate (approx 100m accuracy)
    const latKey = Math.round(latitude * 1000) / 1000;
    const lonKey = Math.round(longitude * 1000) / 1000;

    const cacheKey = this.CACHE_KEYS.NEAREST_VENDORS(
      latKey,
      lonKey,
      radius,
      isDining,
      categoryId,
      zoneId,
    );
    const cached = await this.redisService.get<any[]>(cacheKey);
    if (cached) return cached;

    const nearbyVendorsRaw = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id, 
      (6371 * acos(cos(radians(${latitude})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(latitude)))) AS distance
      FROM vendors
      WHERE (6371 * acos(cos(radians(${latitude})) * cos(radians(latitude)) * cos(radians(longitude) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(latitude)))) <= ${radius}
    `;

    const nearbyIds = nearbyVendorsRaw.map((v) => v.id);

    if (nearbyIds.length === 0) {
      return [];
    }

    const now = new Date();

    const where: Prisma.VendorWhereInput = {
      id: { in: nearbyIds },
      isActive: true,
      ...(isDining !== undefined ? { isDineInActive: isDining } : {}),
      OR: [
        { subscriptionExpiryDate: null },
        { subscriptionExpiryDate: { gt: now } },
      ],
      ...(categoryId
        ? {
          categories: {
            some: {
              id: categoryId,
            },
          },
        }
        : {}),
    };

    if (zoneId) {
      where.zoneId = zoneId;
    }

    const vendors = await this.prisma.vendor.findMany({
      where,
      include: {
        photos: true,
        restaurantMenuPhotos: true,
        schedules: true,
        subscriptionPlan: {
          include: {
            features: true,
          },
        },
        author: true,
        categories: true,
      },
    });

    const response = await Promise.all(
      vendors.map((v) => this.mapVendorResponse(v as any)),
    );

    // Cache for 2 minutes (nearest is more dynamic)
    await this.redisService.set(cacheKey, response, 120);

    return response;
  }

  async getProducts(vendorId: string) {
    await this.findOne(vendorId);
    return this.productsService.findAll({ vendorId, publish: 'all' });
  }

  async getReviews(vendorId: string) {
    await this.findOne(vendorId);
    return this.reviewsService.findAll({ vendorId });
  }

  async getOrders(vendorId: string, query: { status?: string }) {
    return this.ordersService.findAll(
      { id: '', role: UserRole.VENDOR },
      {
        ...query,
        vendorId,
      },
    );
  }

  async getCoupons(vendorId: string) {
    await this.findOne(vendorId);
    return this.couponsService.findAll({ vendorId });
  }

  async getReviewAttributes(vendorId: string) {
    await this.findOne(vendorId);
    return this.reviewsService.getVendorReviewAttributes(vendorId);
  }

  async getStats(vendorId: string) {
    const productsCount = await this.productsService.count({ vendorId });

    const [orderStats, reviewStats] = await Promise.all([
      this.prisma.order.aggregate({
        where: { vendorId },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.review.aggregate({
        where: { vendorId },
        _count: { id: true },
        _avg: { rating: true },
      }),
    ]);

    return {
      totalOrders: orderStats._count.id,
      totalRevenue: orderStats._sum.totalAmount
        ? orderStats._sum.totalAmount.toNumber()
        : 0,
      totalProducts: productsCount,
      totalReviews: reviewStats._count.id,
      averageRating: reviewStats._avg.rating || 0,
    };
  }

  async search(
    query: string,
    page?: string | number,
    limit?: string | number,
    user?: User,
  ) {
    const p = Number(page) || 1;
    const l = Math.min(Number(limit) || 20, 100);
    const skip = (p - 1) * l;

    const where: Prisma.VendorWhereInput = {
      isActive: true,
      title: {
        contains: query,
        mode: 'insensitive',
      },
    };

    if (user?.role === UserRole.CUSTOMER && user.zoneId) {
      where.zoneId = user.zoneId;
    }

    const vendors = await this.prisma.vendor.findMany({
      where,
      include: {
        photos: true,
        restaurantMenuPhotos: true,
        schedules: true,
        subscriptionPlan: {
          include: {
            features: true,
          },
        },
        author: true,
        categories: true,
      },
      skip,
      take: l,
    });
    return Promise.all(vendors.map((v) => this.mapVendorResponse(v as any)));
  }

  async getSchedules(vendorId: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, isActive: true },
    });
    if (!vendor)
      throw new NotFoundException(VendorStatusMessages.VENDOR_NOT_FOUND);

    return (this.prisma as any).vendorSchedule.findMany({
      where: { vendorId },
      include: { day: true },
      orderBy: { dayId: 'asc' },
    });
  }

  async updateSchedule(
    vendorId: string,
    updateScheduleDto: UpdateVendorScheduleDto,
    user: User,
  ) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (!vendor)
      throw new NotFoundException(VendorStatusMessages.VENDOR_NOT_FOUND);

    if (user.role !== UserRole.ADMIN && vendor.authorId !== user.id) {
      throw new ForbiddenException(VendorStatusMessages.FORBIDDEN);
    }

    const { dayId, timeslots } = updateScheduleDto;

    return this.prisma.$transaction(async (tx) => {
      await (tx as any).vendorSchedule.deleteMany({
        where: { vendorId, dayId },
      });

      if (timeslots.length > 0) {
        await (tx as any).vendorSchedule.createMany({
          data: timeslots.map((slot) => ({
            vendorId,
            dayId,
            ...slot,
          })),
        });
      }

      return (tx as any).vendorSchedule.findMany({
        where: { vendorId, dayId },
        include: { day: true },
      });
    });
  }

  async updateDocument(
    user: User,
    updateVendorDocumentDto: UpdateVendorDocumentDto,
  ) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { authorId: user.id },
    });

    if (!vendor) {
      throw new NotFoundException(VendorStatusMessages.VENDOR_NOT_FOUND);
    }

    const { documentId, frontImage, backImage } = updateVendorDocumentDto;

    return (this.prisma as any).vendorDocument.upsert({
      where: {
        vendorId_documentId: {
          vendorId: vendor.id,
          documentId: documentId,
        },
      },
      update: {
        frontImage,
        backImage,
        status: VendorDocumentStatus.PENDING, // Reset status to pending so admin must review again
      },
      create: {
        vendorId: vendor.id,
        documentId,
        frontImage,
        backImage,
        status: VendorDocumentStatus.PENDING,
      },
    });
  }

  async getDocuments(user: User) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { authorId: user.id },
    });

    if (!vendor) {
      throw new NotFoundException(VendorStatusMessages.VENDOR_NOT_FOUND);
    }

    const docs = await (this.prisma as any).vendorDocument.findMany({
      where: { vendorId: vendor.id },
    });

    return {
      documents: docs.map((doc: any) => ({
        ...doc,
        // Ensure fields match frontend expectations
        frontImage: doc.frontImage,
        backImage: doc.backImage,
        documentId: doc.documentId,
      })),
      id: vendor.id,
      type: 'vendor',
    };
  }

  async verifyDocument(dto: VerifyVendorDocumentDto) {
    const { vendorId, documentId, isApproved, rejectionReason } = dto;

    return (this.prisma as any).vendorDocument.update({
      where: {
        vendorId_documentId: {
          vendorId,
          documentId,
        },
      },
      data: {
        status: isApproved
          ? VendorDocumentStatus.ACCEPTED
          : VendorDocumentStatus.REJECTED,
        // In a real app, we might store rejectionReason in a metadata JSON field
        // or a new column if the schema supports it.
      },
    });
  }

  private async mapVendorResponse(vendor: any | null) {
    if (!vendor) return null;
    const { photos, restaurantMenuPhotos, schedules, categories, ...rest } = vendor;

    const walletAmount = await this.walletService.getBalance(vendor.authorId);

    const now = new Date();
    const currentDayId = now.getDay();
    const daySchedules = schedules?.filter(
      (s: any) => s.dayId === currentDayId,
    );

    let isOpen = false;
    if (daySchedules && daySchedules.length > 0) {
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      isOpen = daySchedules.some(
        (s: any) =>
          s.isActive &&
          s.openTime &&
          s.closeTime &&
          currentTime >= s.openTime &&
          currentTime <= s.closeTime,
      );
    }

    const hasValidPlan = !!vendor.subscriptionPlan;
    const isNotExpired = vendor.subscriptionExpiryDate
      ? new Date(vendor.subscriptionExpiryDate) > now
      : true;
    const isWithinLimits =
      hasValidPlan &&
      (Number(vendor.subscriptionPlan.price) <= 0 ||
        vendor.subscriptionPlan.totalOrders === -1 ||
        (vendor.subscriptionTotalOrders ?? 0) > 0);

    const isSubscriptionActive = hasValidPlan && isNotExpired && isWithinLimits;

    return {
      ...rest,
      isOpen,
      isSubscriptionActive,
      walletAmount,
      categoryIds: categories?.map((c: any) => c.id) || [],
      photos: photos?.map((p: any) => p.url) || [],
      restaurantMenuPhotos: restaurantMenuPhotos?.map((p: any) => p.url) || [],
    };
  }
}
