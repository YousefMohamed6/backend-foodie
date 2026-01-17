import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DiscountType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { APP_SETTINGS } from '../settings/settings.constants';
import { SpecialDiscountsService } from '../special-discounts/special-discounts.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ORDERS_ERRORS } from './orders.constants';
import { calculateDistance } from './orders.helper';

@Injectable()
export class OrderPricingService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => CouponsService))
    private couponsService: CouponsService,
    private specialDiscountsService: SpecialDiscountsService,
  ) { }

  async calculatePricing(
    createOrderDto: CreateOrderDto,
    subtotal: number,
    userId?: string,
  ) {
    const settings = await this.prisma.setting.findMany({
      where: {
        key: {
          in: [
            APP_SETTINGS.VENDOR_COMMISSION_RATE,
            APP_SETTINGS.DRIVER_COMMISSION_RATE,
            APP_SETTINGS.MIN_DELIVERY_FEE,
            APP_SETTINGS.DELIVERY_FEE_PER_KM,
            APP_SETTINGS.FIRST_ORDER_FREE_DELIVERY_ENABLED,
          ],
        },
      },
    });

    const commissionPercentSetting = Number(
      settings.find((s) => s.key === APP_SETTINGS.VENDOR_COMMISSION_RATE)
        ?.value || 0,
    );
    const minDeliveryFee = Number(
      settings.find((s) => s.key === APP_SETTINGS.MIN_DELIVERY_FEE)?.value || 0,
    );
    const deliveryFeePerKm = Number(
      settings.find((s) => s.key === APP_SETTINGS.DELIVERY_FEE_PER_KM)?.value ||
      0,
    );
    const firstOrderFreeDeliveryEnabled =
      settings.find(
        (s) => s.key === APP_SETTINGS.FIRST_ORDER_FREE_DELIVERY_ENABLED,
      )?.value === 'true';

    const vendor = await this.prisma.vendor.findUnique({
      where: { id: createOrderDto.vendorId },
      include: {
        subscriptionPlan: true,
        schedules: {
          where: { isActive: true },
        },
      },
    });

    if (!vendor) throw new NotFoundException('VENDOR_NOT_FOUND');

    // --- CHECK IF VENDOR IS OPEN ---
    const now = new Date();
    const currentDayId = now.getDay();
    const daySchedules = vendor.schedules.filter(
      (s) => s.dayId === currentDayId,
    );

    let isOpen = false;
    if (daySchedules.length > 0) {
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      isOpen = daySchedules.some(
        (s) =>
          s.openTime &&
          s.closeTime &&
          currentTime >= s.openTime &&
          currentTime <= s.closeTime,
      );
    }

    if (!isOpen) {
      throw new BadRequestException('VENDOR_CLOSED');
    }
    // -------------------------------

    const address = await this.prisma.address.findUnique({
      where: { id: createOrderDto.addressId },
    });
    if (!address) throw new NotFoundException('ADDRESS_NOT_FOUND');

    const distance = calculateDistance(
      Number(vendor.latitude),
      Number(vendor.longitude),
      Number(address.latitude),
      Number(address.longitude),
    );

    // deliveryFee = max(calculatedDistanceFee, settings.minDeliveryFee)
    const calculatedDistanceFee = distance * deliveryFeePerKm;
    let deliveryCharge = Math.max(calculatedDistanceFee, minDeliveryFee);

    if (firstOrderFreeDeliveryEnabled && userId) {
      const previousOrdersCount = await this.prisma.order.count({
        where: { authorId: userId },
      });
      if (previousOrdersCount === 0) {
        deliveryCharge = 0;
      }
    }

    let adminCommissionPercentage = 0;
    if (
      vendor.subscriptionPlan &&
      Number(vendor.subscriptionPlan.price.toString()) === 0
    ) {
      adminCommissionPercentage = commissionPercentSetting;
    }

    const adminCommissionAmount = subtotal * (adminCommissionPercentage / 100);
    let discountAmount = 0;
    if (createOrderDto.couponCode) {
      try {
        // 1. Try Special Discounts (Vendor Specific)
        const specialDiscount =
          await this.specialDiscountsService.validateCoupon({
            couponCode: createOrderDto.couponCode,
            vendorId: createOrderDto.vendorId,
          });

        if (specialDiscount.success) {
          if (specialDiscount.discountType === DiscountType.PERCENTAGE) {
            discountAmount = subtotal * (specialDiscount.discount / 100);
          } else {
            discountAmount = specialDiscount.discount; // Flat amount
          }
        }
      } catch (e) {
        // 2. Fallback to Standard Coupons
        try {
          const couponResult = await this.couponsService.validate(
            createOrderDto.couponCode,
            createOrderDto.vendorId,
            subtotal,
          );
          discountAmount = couponResult.discountValue;
        } catch (e2) {
          // Both failed
          throw new BadRequestException(ORDERS_ERRORS.INVALID_COUPON_CODE);
        }
      }
    }

    const vendorEarnings = subtotal - adminCommissionAmount - discountAmount;
    let totalAmount =
      subtotal +
      deliveryCharge +
      (createOrderDto.tipAmount || 0) -
      discountAmount;
    totalAmount = Math.max(totalAmount, 0);

    return {
      vendor,
      address,
      distance,
      adminCommissionPercentage,
      adminCommissionAmount,
      discountAmount,
      vendorEarnings,
      totalAmount,
      deliveryCharge,
    };
  }
}
