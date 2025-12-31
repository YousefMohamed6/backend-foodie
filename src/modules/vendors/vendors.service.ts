import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { ReviewsService } from '../reviews/reviews.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

interface VendorPhoto {
  id: string;
  url: string;
  vendorId: string;
}

interface VendorMenuPhoto {
  id: string;
  url: string;
  vendorId: string;
}

type VendorWithRelations = Prisma.VendorGetPayload<{
  include: {
    photos: true;
    restaurantMenuPhotos: true;
  };
}>;

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
  ) { }

  async create(createVendorDto: CreateVendorDto, user: User) {
    const { photos, restaurantMenuPhotos, ...rest } = createVendorDto;

    const vendor = await this.prisma.vendor.create({
      data: {
        ...rest,
        authorId: user.id,
        photos: photos
          ? { create: photos.map((url) => ({ url })) }
          : undefined,
        restaurantMenuPhotos: restaurantMenuPhotos
          ? { create: restaurantMenuPhotos.map((url) => ({ url })) }
          : undefined,
      },
      include: {
        photos: true,
        restaurantMenuPhotos: true,
      },
    });

    return this.mapVendorResponse(vendor);
  }

  async findAll() {
    const vendors = await this.prisma.vendor.findMany({
      include: {
        photos: true,
        restaurantMenuPhotos: true,
      },
    });
    return vendors.map((v) => this.mapVendorResponse(v));
  }

  async findOne(id: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id },
      include: {
        photos: true,
        restaurantMenuPhotos: true,
      },
    });
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }
    return this.mapVendorResponse(vendor);
  }

  async update(id: string, updateVendorDto: UpdateVendorDto) {
    const { photos, restaurantMenuPhotos, ...rest } = updateVendorDto;

    const vendor = await this.prisma.vendor.update({
      where: { id },
      data: {
        ...rest,
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
      },
      include: {
        photos: true,
        restaurantMenuPhotos: true,
      },
    });

    return this.mapVendorResponse(vendor);
  }

  async remove(id: string) {
    return this.prisma.vendor.delete({ where: { id } });
  }

  async findByAuthor(authorId: string) {
    const vendor = await this.prisma.vendor.findUnique({
      where: { authorId },
      include: {
        photos: true,
        restaurantMenuPhotos: true,
      },
    });
    return this.mapVendorResponse(vendor);
  }

  async findNearest(
    latitude: number,
    longitude: number,
    radius: number = 10,
    isDining?: boolean,
    categoryId?: string,
  ) {
    // 1. Get vendors within radius using raw SQL (Haversine formula)
    // Note: Prisma returns dates as Date objects and decimals as logic objects, but usually fine for strict comparison if cast query appropriately.
    // For simplicity, we just fetch IDs effectively.
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

    // 2. Filter by status, subscription, dining, and category using Prisma
    const now = new Date();

    const vendors = await this.prisma.vendor.findMany({
      where: {
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
      },
      include: {
        categories: true,
        photos: true,
        restaurantMenuPhotos: true,
      },
    });

    return vendors.map((v) => this.mapVendorResponse(v));
  }

  async getProducts(vendorId: string) {
    return this.productsService.findAll({ vendorId });
  }

  async getReviews(vendorId: string) {
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
    return this.couponsService.findAll({ vendorId });
  }

  async getReviewAttributes(vendorId: string) {
    return this.reviewsService.getVendorReviewAttributes(vendorId);
  }

  async getStats(vendorId: string) {
    const productsCount = await this.productsService.count({ vendorId });
    const reviews = await this.reviewsService.findAll({ vendorId });
    // TODO: refactor ordersService.findAll to be compatible or use prisma count/aggregate
    const ordersResult = await this.ordersService.findAll(
      { id: '', role: UserRole.VENDOR },
      { vendorId },
    );

    // Handle case where firstOrder query returns { isFirstOrder: boolean }
    const orders = Array.isArray(ordersResult) ? ordersResult : [];
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (acc, order) => acc + Number(order?.totalAmount || 0),
      0,
    );
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((acc, review) => acc + (review?.rating || 0), 0) /
        reviews.length
        : 0;

    return {
      totalOrders,
      totalRevenue,
      totalProducts: productsCount,
      totalReviews: reviews.length,
      averageRating,
    };
  }

  async search(query: string) {
    const vendors = await this.prisma.vendor.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      include: {
        photos: true,
        restaurantMenuPhotos: true,
      },
    });
    return vendors.map((v) => this.mapVendorResponse(v));
  }
  private mapVendorResponse(vendor: VendorWithRelations | null) {
    if (!vendor) return null;
    const { photos, restaurantMenuPhotos, ...rest } = vendor;
    return {
      ...rest,
      photos: photos?.map((p) => p.url) || [],
      restaurantMenuPhotos: restaurantMenuPhotos?.map((p) => p.url) || [],
    };
  }
}
