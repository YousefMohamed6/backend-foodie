import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { APP_SETTINGS } from '../settings/settings.constants';
import { CreateOrderDto } from './dto/create-order.dto';
import { calculateDistance } from './orders.helper';

@Injectable()
export class OrderPricingService {
  constructor(
    private prisma: PrismaService,
    private couponsService: CouponsService,
  ) {}

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
      include: { subscriptionPlan: true },
    });
    if (!vendor) throw new NotFoundException('VENDOR_NOT_FOUND');

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
      const couponResult = await this.couponsService.validate(
        createOrderDto.couponCode,
        createOrderDto.vendorId,
        subtotal,
      );
      discountAmount = couponResult.discountValue;
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
