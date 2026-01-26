import { Injectable } from '@nestjs/common';
import { OrderStatus, User, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EarningsService {
    constructor(private prisma: PrismaService) { }

    private async getVendorIdForUser(user: User): Promise<string | null> {
        if (user.role === UserRole.VENDOR) {
            const vendor = await this.prisma.vendor.findUnique({
                where: { authorId: user.id },
            });
            if (!vendor) {
                return null;
            }
            return vendor.id;
        } else if (user.role === UserRole.MANAGER) {
            return user.vendorId || null;
        } else if (user.role === UserRole.ADMIN) {
            return null; // Admin should specify vendorId, but let's return null for now to avoid crash
        }
        return null;
    }

    async getDailyEarnings(user: User, date: Date) {
        const vendorId = await this.getVendorIdForUser(user);
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        if (!vendorId) {
            return {
                vendorId: null,
                date: startOfDay,
                totalEarnings: 0,
                totalOrders: 0,
                hourlyEarnings: Array.from({ length: 24 }, (_, i) => ({ hour: i, earnings: 0, count: 0 })),
                orders: [],
            };
        }

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const orders = await this.prisma.order.findMany({
            where: {
                vendorId,
                status: OrderStatus.COMPLETED,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            select: {
                id: true,
                vendorEarnings: true,
                createdAt: true,
            },
        });

        const totalEarnings = orders.reduce(
            (sum, order) => sum + Number(order.vendorEarnings || 0),
            0,
        );

        const hourlyEarnings = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            earnings: 0,
            count: 0,
        }));

        orders.forEach((order) => {
            const hour = order.createdAt.getHours();
            hourlyEarnings[hour].earnings += Number(order.vendorEarnings || 0);
            hourlyEarnings[hour].count += 1;
        });

        return {
            vendorId,
            date: startOfDay,
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            totalOrders: orders.length,
            hourlyEarnings,
            orders,
        };
    }

    async getMonthlyEarnings(user: User, date: Date) {
        const vendorId = await this.getVendorIdForUser(user);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

        if (!vendorId) {
            return {
                vendorId: null,
                date: startOfMonth,
                totalEarnings: 0,
                totalOrders: 0,
                dailyEarnings: Array.from({ length: endOfMonth.getDate() }, (_, i) => ({ day: i + 1, earnings: 0, count: 0 })),
                orders: [],
            };
        }

        const orders = await this.prisma.order.findMany({
            where: {
                vendorId,
                status: OrderStatus.COMPLETED,
                createdAt: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            select: {
                id: true,
                vendorEarnings: true,
                createdAt: true,
            },
        });

        const totalEarnings = orders.reduce(
            (sum, order) => sum + Number(order.vendorEarnings || 0),
            0,
        );

        // Group by day
        const daysInMonth = endOfMonth.getDate();
        const dailyEarnings = Array.from({ length: daysInMonth }, (_, i) => ({
            day: i + 1,
            earnings: 0,
            count: 0,
        }));

        orders.forEach((order) => {
            const day = order.createdAt.getDate();
            dailyEarnings[day - 1].earnings += Number(order.vendorEarnings || 0);
            dailyEarnings[day - 1].count += 1;
        });

        return {
            vendorId,
            date: startOfMonth,
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            totalOrders: orders.length,
            dailyEarnings,
            orders,
        };
    }

    async getYearlyEarnings(user: User, date: Date) {
        const vendorId = await this.getVendorIdForUser(user);
        const startOfYear = new Date(date.getFullYear(), 0, 1);

        if (!vendorId) {
            return {
                vendorId: null,
                date: startOfYear,
                totalEarnings: 0,
                totalOrders: 0,
                monthlyEarnings: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, earnings: 0, count: 0 })),
                orders: [],
            };
        }

        const endOfYear = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

        const orders = await this.prisma.order.findMany({
            where: {
                vendorId,
                status: OrderStatus.COMPLETED,
                createdAt: {
                    gte: startOfYear,
                    lte: endOfYear,
                },
            },
            select: {
                id: true,
                vendorEarnings: true,
                createdAt: true,
            },
        });

        const totalEarnings = orders.reduce(
            (sum, order) => sum + Number(order.vendorEarnings || 0),
            0,
        );

        // Group by month
        const monthlyEarnings = Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            earnings: 0,
            count: 0,
        }));

        orders.forEach((order) => {
            const month = order.createdAt.getMonth();
            monthlyEarnings[month].earnings += Number(order.vendorEarnings || 0);
            monthlyEarnings[month].count += 1;
        });

        return {
            vendorId,
            date: startOfYear,
            totalEarnings: Math.round(totalEarnings * 100) / 100,
            totalOrders: orders.length,
            monthlyEarnings,
            orders,
        };
    }
}
