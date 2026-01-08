import { Injectable } from '@nestjs/common';
import { CommissionSource, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

export interface CommissionCalculation {
    rate: number;
    value: number;
    baseAmount: number;
}

export interface CommissionSnapshotData {
    orderId: string;
    vendorId?: string;
    driverId?: string;
    source: CommissionSource;
    commissionRate: number;
    commissionValue: number;
    baseAmount: number;
}

@Injectable()
export class CommissionService {
    constructor(
        private prisma: PrismaService,
        private settingsService: SettingsService,
    ) { }

    calculateVendorCommission(orderTotal: number, rate: number): CommissionCalculation {
        const value = (orderTotal * rate) / 100;
        return {
            rate,
            value: Math.round(value * 100) / 100,
            baseAmount: orderTotal,
        };
    }

    calculateDriverCommission(deliveryFee: number, rate: number): CommissionCalculation {
        const value = (deliveryFee * rate) / 100;
        return {
            rate,
            value: Math.round(value * 100) / 100,
            baseAmount: deliveryFee,
        };
    }

    async getVendorCommissionRate(): Promise<number> {
        return this.settingsService.getCommissionRate('vendor');
    }

    async getDriverCommissionRate(): Promise<number> {
        return this.settingsService.getCommissionRate('driver');
    }

    async createCommissionSnapshot(
        data: CommissionSnapshotData,
        tx?: Prisma.TransactionClient,
    ) {
        const client = tx || this.prisma;
        return client.orderCommissionSnapshot.create({
            data: {
                orderId: data.orderId,
                vendorId: data.vendorId,
                driverId: data.driverId,
                source: data.source,
                commissionRate: data.commissionRate,
                commissionValue: data.commissionValue,
                baseAmount: data.baseAmount,
            },
        });
    }

    async isVendorOnFreePlan(vendorId: string): Promise<boolean> {
        const vendor = await this.prisma.vendor.findUnique({
            where: { id: vendorId },
            include: {
                subscriptionPlan: true,
                subscription: {
                    include: {
                        plan: true,
                    },
                },
            },
        });

        if (!vendor) return false;

        const plan = vendor.subscription?.plan || vendor.subscriptionPlan;
        if (!plan) return true;

        return Number(plan.price) === 0;
    }

    async getOrderCommissionSnapshots(orderId: string) {
        return this.prisma.orderCommissionSnapshot.findMany({
            where: { orderId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getPlatformCommissionTotal(startDate?: Date, endDate?: Date) {
        const dateFilter: Prisma.OrderWhereInput = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: startDate,
                lte: endDate,
            };
        }

        const result = await this.prisma.order.aggregate({
            where: {
                ...dateFilter,
                vendorCommissionApplied: true,
                driverCommissionApplied: true,
            },
            _sum: {
                platformTotalCommission: true,
                vendorCommissionValue: true,
                driverCommissionValue: true,
            },
        });

        return {
            platformTotalCommission: Number(result._sum.platformTotalCommission) || 0,
            vendorCommissionTotal: Number(result._sum.vendorCommissionValue) || 0,
            driverCommissionTotal: Number(result._sum.driverCommissionValue) || 0,
        };
    }

    async getVendorNetReceivables(vendorId: string, startDate?: Date, endDate?: Date) {
        const dateFilter: Prisma.OrderWhereInput = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: startDate,
                lte: endDate,
            };
        }

        const result = await this.prisma.order.aggregate({
            where: {
                vendorId,
                vendorCommissionApplied: true,
                ...dateFilter,
            },
            _sum: {
                vendorNet: true,
                orderTotal: true,
                vendorCommissionValue: true,
            },
            _count: true,
        });

        return {
            totalOrders: result._count,
            totalOrderValue: Number(result._sum.orderTotal) || 0,
            totalCommissionPaid: Number(result._sum.vendorCommissionValue) || 0,
            netReceivables: Number(result._sum.vendorNet) || 0,
        };
    }

    async getDriverEarnings(driverId: string, startDate?: Date, endDate?: Date) {
        const dateFilter: Prisma.OrderWhereInput = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: startDate,
                lte: endDate,
            };
        }

        const result = await this.prisma.order.aggregate({
            where: {
                driverId,
                driverCommissionApplied: true,
                ...dateFilter,
            },
            _sum: {
                driverNet: true,
                deliveryCharge: true,
                driverCommissionValue: true,
            },
            _count: true,
        });

        return {
            totalDeliveries: result._count,
            totalDeliveryFees: Number(result._sum.deliveryCharge) || 0,
            totalCommissionPaid: Number(result._sum.driverCommissionValue) || 0,
            netEarnings: Number(result._sum.driverNet) || 0,
        };
    }

    async getMonthlyCommissionReport(year: number, month: number) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        return this.getPlatformCommissionTotal(startDate, endDate);
    }

    async getCommissionSnapshotsBySource(source: CommissionSource, startDate?: Date, endDate?: Date) {
        const dateFilter: Prisma.OrderCommissionSnapshotWhereInput = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                gte: startDate,
                lte: endDate,
            };
        }

        const result = await this.prisma.orderCommissionSnapshot.aggregate({
            where: {
                source,
                ...dateFilter,
            },
            _sum: {
                commissionValue: true,
                baseAmount: true,
            },
            _count: true,
        });

        return {
            totalSnapshots: result._count,
            totalBaseAmount: Number(result._sum.baseAmount) || 0,
            totalCommissionValue: Number(result._sum.commissionValue) || 0,
        };
    }
}
