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
            where: { key: { in: ['admin_commission_percentage', 'delivery_price_per_km'] } },
        });

        const commissionPercentSetting = Number(settings.find((s) => s.key === 'admin_commission_percentage')?.value || 0);
        const deliveryPricePerKm = Number(settings.find((s) => s.key === 'delivery_price_per_km')?.value || 0);

        const vendor = await this.prisma.vendor.findUnique({
            where: { id: createOrderDto.vendorId },
            include: { subscriptionPlan: true },
        });
        if (!vendor) throw new NotFoundException('Vendor not found');

        const address = await this.prisma.address.findUnique({ where: { id: createOrderDto.addressId } });
        if (!address) throw new NotFoundException('Delivery address not found');

        const distance = calculateDistance(
            Number(vendor.latitude),
            Number(vendor.longitude),
            Number(address.latitude),
            Number(address.longitude),
        );

        const deliveryCharge = distance * deliveryPricePerKm;
        createOrderDto.deliveryCharge = deliveryCharge;

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
        let totalAmount = subtotal - (discountAmount + (createOrderDto.deliveryCharge || 0) + (createOrderDto.tipAmount || 0));
        totalAmount = Math.max(totalAmount, 0);

        return {
            vendor,
            address,
            distance,
            deliveryPricePerKm,
            adminCommissionPercentage,
            adminCommissionAmount,
            discountAmount,
            vendorEarnings,
            totalAmount,
            deliveryCharge,
        };
    }
}
