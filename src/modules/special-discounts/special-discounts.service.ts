import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
import { CreateSpecialDiscountDto, SpecialDiscountDto } from './dto/create-special-discount.dto';
import { ValidateSpecialDiscountDto } from './dto/validate-coupon.dto';

@Injectable()
export class SpecialDiscountsService {
    constructor(
        private prisma: PrismaService,
        private redisService: RedisService,
    ) { }

    private readonly CACHE_KEYS = {
        VENDOR_BY_ID: (id: string) => `vendors:id:${id}`,
        ALL_VENDORS: () => 'vendors:all:*',
        NEAREST_VENDORS: () => 'vendors:nearest:*',
    };

    private async invalidateVendorCache(vendorId: string, zoneId?: string) {
        // Invalidate specific vendor cache
        await this.redisService.del(this.CACHE_KEYS.VENDOR_BY_ID(vendorId));
        // Invalidate all vendor lists (since they include special discounts)
        await this.redisService.delPattern(this.CACHE_KEYS.ALL_VENDORS());
        await this.redisService.delPattern(this.CACHE_KEYS.NEAREST_VENDORS());
    }

    async createOrUpdate(userId: string, createDto: CreateSpecialDiscountDto) {
        const vendor = await this.prisma.vendor.findUnique({
            where: { authorId: userId },
        });

        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }

        const result = await this.prisma.$transaction(async (tx) => {
            if (createDto.discount) {
                const incomingIds = createDto.discount
                    .map(d => d.id)
                    .filter((id): id is string => !!id);

                // Soft delete (set isActive: false) for those NOT in the new list
                await tx.specialDiscount.updateMany({
                    where: {
                        vendorId: vendor.id,
                        id: { notIn: incomingIds },
                        isActive: true,
                    },
                    data: { isActive: false },
                });

                // Upsert/Create the incoming list
                for (const dto of createDto.discount) {
                    let type: DiscountType = DiscountType.PERCENTAGE;
                    const inputType = dto.discountType?.toLowerCase();
                    if (inputType === 'amount' || inputType === 'fixed' || inputType === 'flat') {
                        type = DiscountType.FIXED;
                    }

                    const data = {
                        vendorId: vendor.id,
                        endDate: new Date(dto.endDate),
                        discount: Number(dto.discount),
                        couponCode: dto.couponCode,
                        photo: dto.photo,
                        discountType: type,
                        isPublish: dto.isPublish,
                        isActive: true,
                    };

                    if (dto.id) {
                        await tx.specialDiscount.update({
                            where: { id: dto.id },
                            data,
                        });
                    } else {
                        await tx.specialDiscount.create({
                            data,
                        });
                    }
                }
            }

            return { success: true };
        });

        // Invalidate vendor cache after successful modification
        await this.invalidateVendorCache(vendor.id, vendor.zoneId);

        return result;
    }

    async findOne(userId: string) {
        const vendor = await this.prisma.vendor.findUnique({
            where: { authorId: userId },
            include: {
                specialDiscounts: {
                    where: { isActive: true },
                },
            },
        });

        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }

        // Map to DTO structure
        return {
            discount: vendor.specialDiscounts.map((sd) => ({
                id: sd.id,
                endDate: sd.endDate.toISOString(),
                discount: Number(sd.discount),
                couponCode: sd.couponCode,
                photo: sd.photo,
                discountType: sd.discountType,
                isPublish: sd.isPublish,
                isActive: sd.isActive,
            })),
        };
    }

    async update(userId: string, id: string, dto: Partial<SpecialDiscountDto>) {
        const vendor = await this.prisma.vendor.findUnique({
            where: { authorId: userId },
        });

        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }

        const discount = await this.prisma.specialDiscount.findUnique({
            where: { id, vendorId: vendor.id },
        });

        if (!discount) {
            throw new NotFoundException('Special discount not found');
        }

        let type: DiscountType | undefined;
        if (dto.discountType) {
            const inputType = dto.discountType.toLowerCase();
            type = (inputType === 'amount' || inputType === 'fixed' || inputType === 'flat')
                ? DiscountType.FIXED
                : DiscountType.PERCENTAGE;
        }

        const result = await this.prisma.specialDiscount.update({
            where: { id },
            data: {
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
                discount: dto.discount ? Number(dto.discount) : undefined,
                couponCode: dto.couponCode,
                photo: dto.photo,
                discountType: type,
                isPublish: dto.isPublish,
                isActive: dto.isActive,
            },
        });

        // Invalidate vendor cache after successful update
        await this.invalidateVendorCache(vendor.id, vendor.zoneId);

        return result;
    }

    async remove(userId: string, id: string) {
        const vendor = await this.prisma.vendor.findUnique({
            where: { authorId: userId },
        });

        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }

        const discount = await this.prisma.specialDiscount.findUnique({
            where: { id, vendorId: vendor.id },
        });

        if (!discount) {
            throw new NotFoundException('Special discount not found');
        }

        // Soft delete
        await this.prisma.specialDiscount.update({
            where: { id },
            data: { isActive: false },
        });

        // Invalidate vendor cache after successful removal
        await this.invalidateVendorCache(vendor.id, vendor.zoneId);

        return { success: true };
    }

    async validateCoupon(dto: ValidateSpecialDiscountDto) {
        const discount = await this.prisma.specialDiscount.findFirst({
            where: {
                vendorId: dto.vendorId,
                couponCode: dto.couponCode,
                isPublish: true,
                isActive: true,
            },
        });

        if (!discount) {
            throw new NotFoundException('Invalid or inactive coupon code');
        }

        if (new Date() > discount.endDate) {
            throw new BadRequestException('Coupon expired');
        }

        return {
            success: true,
            id: discount.id,
            discount: Number(discount.discount),
            discountType: discount.discountType,
            couponCode: discount.couponCode,
            photo: discount.photo,
        };
    }

    async findByZone(user: User) {
        if (!user.zoneId) return [];
        return this.prisma.specialDiscount.findMany({
            where: {
                isActive: true,
                isPublish: true,
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
}

