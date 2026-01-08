import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CouponsService } from '../coupons/coupons.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { calculateDistance } from './orders.helper';

@Injectable()
export class OrderPricingService {
    constructor(
        private prisma: PrismaService,
        private couponsService: CouponsService,
    ) { }

    async calculatePricing(createOrderDto: CreateOrderDto, subtotal: number) {
        const settings = await this.prisma.setting.findMany({
            where: { key: { in: ['vendor_commission_rate', 'driver_commission_rate', 'min_delivery_fee', 'delivery_fee_per_km'] } },
        });

        const commissionPercentSetting = Number(settings.find((s) => s.key === 'vendor_commission_rate')?.value || 0);
        const minDeliveryFee = Number(settings.find((s) => s.key === 'min_delivery_fee')?.value || 0);
        const deliveryFeePerKm = Number(settings.find((s) => s.key === 'delivery_fee_per_km')?.value || 0);

        const vendor = await this.prisma.vendor.findUnique({
            where: { id: createOrderDto.vendorId },
            include: { subscriptionPlan: true },
        });
        if (!vendor) throw new NotFoundException('VENDOR_NOT_FOUND');

        const address = await this.prisma.address.findUnique({ where: { id: createOrderDto.addressId } });
        if (!address) throw new NotFoundException('ADDRESS_NOT_FOUND');

        const distance = calculateDistance(
            Number(vendor.latitude),
            Number(vendor.longitude),
            Number(address.latitude),
            Number(address.longitude),
        );

        // deliveryFee = max(calculatedDistanceFee, settings.minDeliveryFee)
        const calculatedDistanceFee = distance * deliveryFeePerKm;
        const deliveryCharge = Math.max(calculatedDistanceFee, minDeliveryFee);

        let adminCommissionPercentage = 0;
        if (vendor.subscriptionPlan && Number(vendor.subscriptionPlan.price.toString()) === 0) {
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
        let totalAmount = subtotal + deliveryCharge + (createOrderDto.tipAmount || 0) - discountAmount;
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
