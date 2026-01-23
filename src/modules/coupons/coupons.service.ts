import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { VendorsService } from '../vendors/vendors.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => VendorsService))
    private vendorsService: VendorsService,
  ) { }

  async create(createCouponDto: CreateCouponDto, user: User) {
    let vendorId = createCouponDto.vendorId || null;
    if (user.role === UserRole.VENDOR) {
      const vendor = await this.vendorsService.findByAuthor(user.id);
      vendorId = vendor?.id || null;
    }
    return this.prisma.coupon.create({
      data: {
        code: createCouponDto.code,
        name: createCouponDto.name,
        discount: String(createCouponDto.discount),
        discountType: createCouponDto.discountType || 'percentage',
        expiresAt: new Date(createCouponDto.expiresAt),
        isActive: createCouponDto.isActive ?? true,
        image: createCouponDto.image,
        minOrderAmount: createCouponDto.minOrderAmount || 0,
        maxDiscount: createCouponDto.maxDiscount || 0,
        isPublic: createCouponDto.isPublic || false,
        vendorId,
      },
    });
  }

  async findAll(
    query: { isPublic?: string | boolean; vendorId?: string } = {},
    user?: User,
  ) {
    const where: Prisma.CouponWhereInput = {};

    const isAdmin = user?.role === UserRole.ADMIN;
    const isVendor = user?.role === UserRole.VENDOR;

    if (isAdmin) {
      // Admin sees all coupons, optionally filtered by vendorId
      if (query.vendorId) {
        where.vendorId = query.vendorId;
      }
    } else if (isVendor) {
      // Vendor sees only their own active coupons
      const currentVendor = await this.vendorsService.findByAuthor(user.id);
      if (currentVendor) {
        where.vendorId = currentVendor.id;
        where.isActive = true;
      } else {
        // Vendor without a vendor profile sees nothing
        return [];
      }
    } else {
      // Customer or unauthenticated user sees only public and active coupons
      where.isActive = true;
      where.isPublic = true;
      if (query.vendorId) {
        where.vendorId = query.vendorId;
      }
    }

    // Allow admin to filter by isPublic if specified
    if (isAdmin && query.isPublic !== undefined) {
      where.isPublic = query.isPublic === 'true' || query.isPublic === true;
    }

    return this.prisma.coupon.findMany({
      where,
      include: {
        vendor: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByZone(user: User) {
    if (!user.zoneId) return [];
    return this.prisma.coupon.findMany({
      where: {
        isActive: true,
        isPublic: true,
        vendor: {
          zoneId: user.zoneId,
          isActive: true,
          subscriptionExpiryDate: { gt: new Date() },
        },
      },
      include: {
        vendor: {
          include: {
            vendorType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    return coupon;
  }

  async update(id: string, updateCouponDto: UpdateCouponDto) {
    await this.findOne(id); // Check existence

    // transform dto dates/types if needed
    const data: Prisma.CouponUpdateInput = {
      ...updateCouponDto,
      expiresAt: updateCouponDto.expiresAt
        ? new Date(updateCouponDto.expiresAt)
        : undefined,
      discount: updateCouponDto.discount
        ? String(updateCouponDto.discount)
        : undefined,
    };

    return this.prisma.coupon.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, user: User) {
    const coupon = await this.findOne(id);

    if (!coupon) {
      throw new NotFoundException('COUPON_NOT_FOUND');
    }

    // Vendors can only delete their own coupons
    if (user.role === UserRole.VENDOR) {
      const vendor = await this.vendorsService.findByAuthor(user.id);
      if (!vendor || coupon.vendorId !== vendor.id) {
        throw new BadRequestException('UNAUTHORIZED_COUPON_DELETE');
      }
    }

    return this.prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async validate(code: string, vendorId: string | null, orderAmount: number) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code },
    });
    if (!coupon) {
      throw new NotFoundException('INVALID_COUPON');
    }
    if (!coupon.isActive) {
      throw new BadRequestException('COUPON_INACTIVE');
    }
    if (new Date(coupon.expiresAt).getTime() < Date.now()) {
      throw new BadRequestException('COUPON_EXPIRED');
    }
    if (orderAmount < Number(coupon.minOrderAmount || 0)) {
      throw new BadRequestException('ORDER_AMOUNT_TOO_LOW');
    }
    if (
      !coupon.isPublic &&
      coupon.vendorId &&
      vendorId &&
      coupon.vendorId !== vendorId
    ) {
      throw new BadRequestException('COUPON_VENDOR_MISMATCH');
    }
    let discountValue = 0;
    if ((coupon.discountType || 'percentage') === 'percentage') {
      discountValue = (orderAmount * Number(coupon.discount)) / 100;
      if (coupon.maxDiscount) {
        discountValue = Math.min(discountValue, Number(coupon.maxDiscount));
      }
    } else {
      discountValue = Number(coupon.discount);
    }
    const finalAmount = Math.max(orderAmount - discountValue, 0);
    return { coupon, discountValue, finalAmount };
  }
}
