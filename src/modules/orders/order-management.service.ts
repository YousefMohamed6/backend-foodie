import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  User,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { mapOrderResponse, orderInclude } from './orders.helper';

@Injectable()
export class OrderManagementService {
  constructor(private prisma: PrismaService) { }

  async getManagerZoneId(managerId: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { zoneId: true },
    });
    if (!manager?.zoneId) {
      throw new ForbiddenException('MANAGER_NO_ZONE');
    }
    return manager.zoneId;
  }

  async validateManagerZoneAccess(
    managerId: string,
    vendorZoneId: string | null,
  ) {
    const zoneId = await this.getManagerZoneId(managerId);
    if (vendorZoneId !== zoneId) {
      throw new ForbiddenException('ORDER_OUTSIDE_ZONE');
    }
    return zoneId;
  }

  async getManagerPendingCashOrders(user: User) {
    if (user.role !== UserRole.MANAGER) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    try {
      const zoneId = await this.getManagerZoneId(user.id);

      const orders = await this.prisma.order.findMany({
        where: {
          paymentMethod: PaymentMethod.cash,
          status: OrderStatus.COMPLETED,
          paymentStatus: PaymentStatus.UNPAID,
          vendor: { zoneId },
        },
        include: orderInclude,
        orderBy: { updatedAt: 'desc' },
      });

      return orders.map((order) => mapOrderResponse(order));
    } catch (error) {
      if (
        error instanceof ForbiddenException &&
        error.message === 'MANAGER_NO_ZONE'
      ) {
        return [];
      }
      throw error;
    }
  }

  async getManagerCashSummary(user: User, date: string) {
    if (user.role !== UserRole.MANAGER) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const confirmations = await this.prisma.managerCashConfirmation.findMany({
      where: {
        managerId: user.id,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const totalCash = confirmations.reduce(
      (sum, conf) => sum + Number(conf.amount),
      0,
    );

    return {
      date,
      totalOrders: confirmations.length,
      totalCash,
    };
  }

  async getDriverPendingCashOrders(driverId: string, user: User) {
    if (user.role === UserRole.DRIVER && user.id !== driverId) {
      throw new ForbiddenException('ACCESS_DENIED');
    }

    const orders = await (async () => {
      try {
        let managerZoneId: string | undefined;
        if (user.role === UserRole.MANAGER) {
          managerZoneId = await this.getManagerZoneId(user.id);
        }

        const driver = await this.prisma.user.findUnique({
          where: { id: driverId },
          select: { zoneId: true },
        });

        if (user.role === UserRole.MANAGER && driver?.zoneId !== managerZoneId) {
          throw new ForbiddenException('DRIVER_OUTSIDE_ZONE');
        }

        return this.prisma.order.findMany({
          where: {
            driverId: driverId,
            paymentMethod: PaymentMethod.cash,
            status: OrderStatus.COMPLETED,
            paymentStatus: PaymentStatus.UNPAID,
          },
          include: orderInclude,
          orderBy: { updatedAt: 'desc' },
        });
      } catch (error) {
        if (
          error instanceof ForbiddenException &&
          error.message === 'MANAGER_NO_ZONE'
        ) {
          return [];
        }
        throw error;
      }
    })();

    const totalCash = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0,
    );

    return {
      driverId,
      totalOrders: orders.length,
      totalCash,
      orders: orders.map((order) => mapOrderResponse(order)),
    };
  }
}
