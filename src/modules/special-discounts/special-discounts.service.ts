import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DiscountType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSpecialDiscountDto } from './dto/create-special-discount.dto';
import { ValidateSpecialDiscountDto } from './dto/validate-coupon.dto';

@Injectable()
export class SpecialDiscountsService {
    constructor(private prisma: PrismaService) { }

    async createOrUpdate(userId: string, createDto: CreateSpecialDiscountDto) {
        const vendor = await this.prisma.vendor.findUnique({
            where: { authorId: userId },
        });

        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }

        return this.prisma.$transaction(async (tx) => {
            // If discounts are provided, overwrite existing ones
            if (createDto.discount) {
                // Delete all existing discounts for this vendor
                await tx.specialDiscount.deleteMany({
                    where: { vendorId: vendor.id },
                });

                // Create new discounts
                for (const discountDto of createDto.discount) {
                    let type: DiscountType = DiscountType.PERCENTAGE;
                    const inputType = discountDto.discountType?.toLowerCase();
                    if (inputType === 'amount' || inputType === 'fixed' || inputType === 'flat') {
                        type = DiscountType.FIXED;
                    }

                    await tx.specialDiscount.create({
                        data: {
                            vendorId: vendor.id,
                            endDate: new Date(discountDto.endDate),
                            discount: Number(discountDto.discount),
                            couponCode: discountDto.couponCode,
                            photo: discountDto.photo,
                            discountType: type,
                            enable: discountDto.enable,
                            public: discountDto.public,
                        },
                    });
                }
            }

            return { success: true };
        });
    }

    async findOne(userId: string) {
        const vendor = await this.prisma.vendor.findUnique({
            where: { authorId: userId },
            include: {
                specialDiscounts: true,
            },
        });

        if (!vendor) {
            throw new NotFoundException('Vendor not found');
        }

        // Map to DTO structure
        return {
            discount: vendor.specialDiscounts.map((sd) => ({
                endDate: sd.endDate.toISOString(),
                discount: Number(sd.discount),
                couponCode: sd.couponCode,
                photo: sd.photo,
                discountType: sd.discountType,
                enable: sd.enable,
                public: sd.public,
            })),
        };
    }

    async validateCoupon(dto: ValidateSpecialDiscountDto) {
        const discount = await this.prisma.specialDiscount.findFirst({
            where: {
                vendorId: dto.vendorId,
                couponCode: dto.couponCode,
                enable: true,
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
}
