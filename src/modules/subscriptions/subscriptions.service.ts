import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionPlanDto } from './dto/create-subscription-plan.dto';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) { }

  async create(createDto: CreateSubscriptionPlanDto) {
    const { features, arabicName, englishName, ...planData } = createDto;
    return this.prisma.subscriptionPlan.create({
      data: {
        ...planData,
        arabicName,
        englishName,
        features: {
          create: features,
        },
      },
      include: { features: true },
    });
  }

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      include: { features: true },
    });
  }

  async getPlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { features: true },
    });
    if (!plan) {
      throw new NotFoundException('PLAN_NOT_FOUND');
    }
    return plan;
  }

  async getHistory(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async subscribe(userId: string, subscribeDto: SubscribeDto) {
    const plan = await this.getPlan(subscribeDto.planId);

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.durationDays);

    return this.prisma.$transaction(async (tx) => {
      // Create subscription record
      const subscription = await tx.subscription.create({
        data: {
          userId,
          planId: plan.id,
          startDate,
          endDate,
          amountPaid: plan.price,
          paymentMethod: subscribeDto.paymentMethod,
          paymentId: subscribeDto.paymentId,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      // Update vendor's subscription info
      const vendor = await tx.vendor.findFirst({
        where: { authorId: userId },
      });

      if (vendor) {
        await tx.vendor.update({
          where: { id: vendor.id },
          data: {
            subscriptionPlanId: plan.id,
            subscriptionExpiryDate: endDate,
            subscriptionTotalOrders: plan.totalOrders,
            subscriptionProductsLimit: plan.productsLimit,
            subscriptionId: subscription.id,
          },
        });
      }

      // Also update the User record's subscription fields
      await tx.user.update({
        where: { id: userId },
        data: {
          subscriptionPlanId: plan.id,
          subscriptionExpiryDate: endDate,
        },
      });

      return subscription;
    });
  }
}
