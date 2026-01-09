import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscribeDto } from './dto/subscribe.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({ where: { isActive: true } });
  }

  async getPlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
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

    return this.prisma.subscription.create({
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
  }
}
