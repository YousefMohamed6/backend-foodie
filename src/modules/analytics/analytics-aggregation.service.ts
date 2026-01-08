import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
import {
    AnalyticsConfig,
    DeliveryEventType,
    OrderLifecycleEventType,
    SnapshotType,
} from './analytics.constants';

@Injectable()
export class AnalyticsAggregationService {
    private readonly logger = new Logger(AnalyticsAggregationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    /**
     * Run daily aggregation at midnight
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async runDailyAggregation() {
        this.logger.log('Starting daily metrics aggregation...');

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        try {
            await Promise.all([
                this.aggregateVendorMetrics(yesterday, SnapshotType.DAILY),
                this.aggregateDriverMetrics(yesterday, SnapshotType.DAILY),
                this.aggregateCustomerMetrics(yesterday, SnapshotType.DAILY),
                this.aggregatePlatformMetrics(yesterday, SnapshotType.DAILY),
                this.aggregateZoneMetrics(yesterday, SnapshotType.DAILY),
                this.aggregateProductMetrics(yesterday, SnapshotType.DAILY),
            ]);

            this.logger.log('Daily aggregation completed successfully');
        } catch (error) {
            this.logger.error(`Daily aggregation failed: ${error.message}`, error.stack);
        }
    }

    /**
     * Run weekly aggregation every Monday at 1 AM
     */
    @Cron('0 1 * * 1') // Every Monday at 01:00
    async runWeeklyAggregation() {
        this.logger.log('Starting weekly metrics aggregation...');

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        lastWeek.setHours(0, 0, 0, 0);

        try {
            await Promise.all([
                this.aggregateVendorMetrics(lastWeek, SnapshotType.WEEKLY),
                this.aggregateDriverMetrics(lastWeek, SnapshotType.WEEKLY),
                this.aggregateCustomerMetrics(lastWeek, SnapshotType.WEEKLY),
                this.aggregatePlatformMetrics(lastWeek, SnapshotType.WEEKLY),
                this.aggregateZoneMetrics(lastWeek, SnapshotType.WEEKLY),
            ]);

            this.logger.log('Weekly aggregation completed successfully');
        } catch (error) {
            this.logger.error(`Weekly aggregation failed: ${error.message}`, error.stack);
        }
    }

    /**
     * Run monthly aggregation on 1st of each month at 2 AM
     */
    @Cron('0 2 1 * *') // 1st of every month at 02:00
    async runMonthlyAggregation() {
        this.logger.log('Starting monthly metrics aggregation...');

        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        lastMonth.setDate(1);
        lastMonth.setHours(0, 0, 0, 0);

        try {
            await Promise.all([
                this.aggregateVendorMetrics(lastMonth, SnapshotType.MONTHLY),
                this.aggregateDriverMetrics(lastMonth, SnapshotType.MONTHLY),
                this.aggregateCustomerMetrics(lastMonth, SnapshotType.MONTHLY),
                this.aggregatePlatformMetrics(lastMonth, SnapshotType.MONTHLY),
            ]);

            this.logger.log('Monthly aggregation completed successfully');
        } catch (error) {
            this.logger.error(`Monthly aggregation failed: ${error.message}`, error.stack);
        }
    }

    /**
     * Aggregate vendor performance metrics
     */
    async aggregateVendorMetrics(date: Date, type: string) {
        const vendors = await this.prisma.vendor.findMany({
            select: { id: true, authorId: true },
        });

        const { start, end } = this.getDateRange(date, type);

        for (const vendor of vendors) {
            try {
                // Get vendor's active subscription
                const subscription = await this.prisma.subscription.findFirst({
                    where: {
                        userId: vendor.authorId,
                        status: 'ACTIVE',
                    },
                    include: { plan: true },
                });

                // Get order stats
                const orders = await this.prisma.order.findMany({
                    where: {
                        vendorId: vendor.id,
                        createdAt: { gte: start, lt: end },
                    },
                    select: {
                        id: true,
                        status: true,
                        orderSubtotal: true,
                        orderTotal: true,
                        adminCommissionAmount: true,
                        authorId: true,
                        discountAmount: true,
                    },
                });

                const totalOrders = orders.length;
                const completedOrders = orders.filter(
                    (o) => o.status === OrderStatus.COMPLETED,
                ).length;
                const cancelledOrders = orders.filter(
                    (o) => o.status === OrderStatus.CANCELLED,
                ).length;

                // Get vendor rejection count from lifecycle events
                const vendorRejections = await this.prisma.orderLifecycleEvent.count({
                    where: {
                        order: { vendorId: vendor.id },
                        eventType: OrderLifecycleEventType.VENDOR_REJECTED,
                        eventTimestamp: { gte: start, lt: end },
                    },
                });

                // Calculate revenue
                const totalRevenue = orders
                    .filter((o) => o.status === OrderStatus.COMPLETED)
                    .reduce((sum, o) => sum + Number(o.orderTotal || 0), 0);

                const commissionPaid = orders
                    .filter((o) => o.status === OrderStatus.COMPLETED)
                    .reduce((sum, o) => sum + Number(o.adminCommissionAmount || 0), 0);

                const netRevenue = totalRevenue - commissionPaid;

                const averageOrderValue =
                    completedOrders > 0 ? totalRevenue / completedOrders : 0;

                // Get average vendor acceptance time
                const acceptanceEvents = await this.prisma.orderLifecycleEvent.findMany({
                    where: {
                        order: { vendorId: vendor.id },
                        eventType: OrderLifecycleEventType.VENDOR_ACCEPTED,
                        eventTimestamp: { gte: start, lt: end },
                        timeSincePrevious: { not: null },
                    },
                    select: { timeSincePrevious: true },
                });

                const averageAcceptanceTime =
                    acceptanceEvents.length > 0
                        ? Math.round(
                            acceptanceEvents.reduce(
                                (sum, e) => sum + (e.timeSincePrevious || 0),
                                0,
                            ) / acceptanceEvents.length,
                        )
                        : null;

                const acceptanceRate =
                    totalOrders > 0
                        ? ((totalOrders - vendorRejections) / totalOrders) * 100
                        : null;

                // Get unique customers
                const uniqueCustomers = new Set(orders.map((o) => o.authorId)).size;

                // Get repeat customers (ordered more than once)
                const customerOrderCounts = orders.reduce((acc, order) => {
                    acc[order.authorId] = (acc[order.authorId] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const repeatCustomers = Object.values(customerOrderCounts).filter(
                    (count: number) => count > 1,
                ).length;

                // Get new customers (first order in this period)
                const newCustomersCount = await this.countNewCustomers(
                    vendor.id,
                    start,
                    end,
                );

                // Get active products count
                const activeProducts = await this.prisma.product.count({
                    where: { vendorId: vendor.id, isActive: true },
                });

                // Get products ordered
                const productsOrdered = await this.prisma.orderItem.groupBy({
                    by: ['productId'],
                    where: {
                        order: {
                            vendorId: vendor.id,
                            createdAt: { gte: start, lt: end },
                        },
                    },
                });

                // Get total products sold
                const totalProductsSold = await this.prisma.orderItem.aggregate({
                    where: {
                        order: {
                            vendorId: vendor.id,
                            status: OrderStatus.COMPLETED,
                            createdAt: { gte: start, lt: end },
                        },
                    },
                    _sum: { quantity: true },
                });

                // Get total discounts given
                const totalDiscounts = orders.reduce(
                    (sum, o) => sum + Number(o.discountAmount || 0),
                    0,
                );

                // Upsert metrics
                await this.prisma.vendorMetricsSnapshot.upsert({
                    where: {
                        vendorId_snapshotDate_snapshotType: {
                            vendorId: vendor.id,
                            snapshotDate: date,
                            snapshotType: type,
                        },
                    },
                    create: {
                        vendorId: vendor.id,
                        snapshotDate: date,
                        snapshotType: type,
                        totalOrders,
                        completedOrders,
                        cancelledOrders,
                        vendorRejectedOrders: vendorRejections,
                        totalRevenue,
                        netRevenue,
                        commissionPaid,
                        averageOrderValue,
                        averageAcceptanceTime,
                        acceptanceRate,
                        subscriptionPlanId: subscription?.planId,
                        isOnFreePlan: Number(subscription?.plan?.price || 0) === 0,
                        uniqueCustomers,
                        repeatCustomers,
                        newCustomers: newCustomersCount,
                        activeProducts,
                        productsOrdered: productsOrdered.length,
                        totalProductsSold: totalProductsSold._sum.quantity || 0,
                        totalDiscountsGiven: totalDiscounts,
                    },
                    update: {
                        totalOrders,
                        completedOrders,
                        cancelledOrders,
                        vendorRejectedOrders: vendorRejections,
                        totalRevenue,
                        netRevenue,
                        commissionPaid,
                        averageOrderValue,
                        averageAcceptanceTime,
                        acceptanceRate,
                        subscriptionPlanId: subscription?.planId,
                        isOnFreePlan: Number(subscription?.plan?.price || 0) === 0,
                        uniqueCustomers,
                        repeatCustomers,
                        newCustomers: newCustomersCount,
                        activeProducts,
                        productsOrdered: productsOrdered.length,
                        totalProductsSold: totalProductsSold._sum.quantity || 0,
                        totalDiscountsGiven: totalDiscounts,
                    },
                });

                this.logger.debug(
                    `Aggregated ${type} metrics for vendor: ${vendor.id}`,
                );
            } catch (error) {
                this.logger.error(
                    `Failed to aggregate vendor ${vendor.id}: ${error.message}`,
                );
            }
        }

        // Invalidate cache
        await this.redis.del(AnalyticsConfig.CACHE_KEYS.VENDOR_RANKINGS);
    }

    /**
     * Aggregate driver performance metrics
     */
    async aggregateDriverMetrics(date: Date, type: string) {
        const drivers = await this.prisma.user.findMany({
            where: { role: UserRole.DRIVER },
            select: { id: true },
        });

        const { start, end } = this.getDateRange(date, type);

        for (const driver of drivers) {
            try {
                // Get driver's orders
                const orders = await this.prisma.order.findMany({
                    where: {
                        driverId: driver.id,
                        createdAt: { gte: start, lt: end },
                    },
                    select: {
                        id: true,
                        status: true,
                        driverNet: true,
                        driverCommissionValue: true,
                        tipAmount: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });

                const totalAssignments = orders.length;
                const completedDeliveries = orders.filter(
                    (o) => o.status === OrderStatus.COMPLETED,
                ).length;

                // Get acceptance/rejection counts
                const acceptedCount = await this.prisma.orderLifecycleEvent.count({
                    where: {
                        order: { driverId: driver.id },
                        eventType: OrderLifecycleEventType.DRIVER_ACCEPTED,
                        eventTimestamp: { gte: start, lt: end },
                    },
                });

                const rejectedCount = await this.prisma.orderLifecycleEvent.count({
                    where: {
                        order: { driverId: driver.id },
                        eventType: OrderLifecycleEventType.DRIVER_REJECTED,
                        eventTimestamp: { gte: start, lt: end },
                    },
                });

                // Calculate earnings
                const totalEarnings = orders
                    .filter((o) => o.status === OrderStatus.COMPLETED)
                    .reduce((sum, o) => sum + Number(o.driverNet || 0), 0);

                const commissionPaid = orders
                    .filter((o) => o.status === OrderStatus.COMPLETED)
                    .reduce((sum, o) => sum + Number(o.driverCommissionValue || 0), 0);

                const netEarnings = totalEarnings - commissionPaid;

                const totalTips = orders
                    .filter((o) => o.status === OrderStatus.COMPLETED)
                    .reduce((sum, o) => sum + Number(o.tipAmount || 0), 0);

                // Get average delivery time from delivery events
                const deliveryTimes = await this.prisma.deliveryEvent.findMany({
                    where: {
                        driverId: driver.id,
                        eventType: DeliveryEventType.DELIVERED,
                        eventTimestamp: { gte: start, lt: end },
                        duration: { not: null },
                    },
                    select: { duration: true },
                });

                const averageDeliveryTime =
                    deliveryTimes.length > 0
                        ? Math.round(
                            deliveryTimes.reduce((sum, e) => sum + (e.duration || 0), 0) /
                            deliveryTimes.length /
                            60,
                        )
                        : null;

                // Get average rating
                const ratings = await this.prisma.review.findMany({
                    where: {
                        driverId: driver.id,
                        createdAt: { gte: start, lt: end },
                    },
                    select: { rating: true },
                });

                const averageRating =
                    ratings.length > 0
                        ? ratings.reduce((sum, r) => sum + Number(r.rating), 0) /
                        ratings.length
                        : null;

                // Get total distance from delivery events
                const distanceData = await this.prisma.deliveryEvent.aggregate({
                    where: {
                        driverId: driver.id,
                        eventTimestamp: { gte: start, lt: end },
                        distanceCovered: { not: null },
                    },
                    _sum: { distanceCovered: true },
                });

                // Get unique vendors
                const uniqueVendors = new Set(
                    orders.map((o) => o.id), // Would need vendorId from order
                ).size;

                // Get driver profile for zone
                const driverProfile = await this.prisma.driverProfile.findUnique({
                    where: { userId: driver.id },
                    include: {
                        user: {
                            select: { zoneId: true },
                        },
                    },
                });

                // Upsert metrics
                await this.prisma.driverMetricsSnapshot.upsert({
                    where: {
                        driverId_snapshotDate_snapshotType: {
                            driverId: driver.id,
                            snapshotDate: date,
                            snapshotType: type,
                        },
                    },
                    create: {
                        driverId: driver.id,
                        snapshotDate: date,
                        snapshotType: type,
                        totalAssignments,
                        acceptedAssignments: acceptedCount,
                        rejectedAssignments: rejectedCount,
                        completedDeliveries,
                        averageDeliveryTime,
                        averageRating,
                        totalRatings: ratings.length,
                        totalEarnings,
                        netEarnings,
                        commissionPaid,
                        totalTips,
                        totalDistanceKm: distanceData._sum.distanceCovered,
                        zoneId: driverProfile?.user?.zoneId,
                        uniqueVendors,
                    },
                    update: {
                        totalAssignments,
                        acceptedAssignments: acceptedCount,
                        rejectedAssignments: rejectedCount,
                        completedDeliveries,
                        averageDeliveryTime,
                        averageRating,
                        totalRatings: ratings.length,
                        totalEarnings,
                        netEarnings,
                        commissionPaid,
                        totalTips,
                        totalDistanceKm: distanceData._sum.distanceCovered,
                        zoneId: driverProfile?.user?.zoneId,
                        uniqueVendors,
                    },
                });

                this.logger.debug(`Aggregated ${type} metrics for driver: ${driver.id}`);
            } catch (error) {
                this.logger.error(
                    `Failed to aggregate driver ${driver.id}: ${error.message}`,
                );
            }
        }

        // Invalidate cache
        await this.redis.del(AnalyticsConfig.CACHE_KEYS.DRIVER_RANKINGS);
    }

    /**
     * Aggregate customer engagement metrics
     */
    async aggregateCustomerMetrics(date: Date, type: string) {
        const customers = await this.prisma.user.findMany({
            where: { role: UserRole.CUSTOMER },
            select: { id: true },
        });

        const { start, end } = this.getDateRange(date, type);

        for (const customer of customers) {
            try {
                // Get customer orders
                const orders = await this.prisma.order.findMany({
                    where: {
                        authorId: customer.id,
                        createdAt: { gte: start, lt: end },
                    },
                    select: {
                        id: true,
                        status: true,
                        orderTotal: true,
                        vendorId: true,
                        createdAt: true,
                    },
                });

                const totalOrders = orders.length;
                const completedOrders = orders.filter(
                    (o) => o.status === OrderStatus.COMPLETED,
                ).length;
                const cancelledOrders = orders.filter(
                    (o) => o.status === OrderStatus.CANCELLED,
                ).length;

                const totalSpent = orders
                    .filter((o) => o.status === OrderStatus.COMPLETED)
                    .reduce((sum, o) => sum + Number(o.orderTotal || 0), 0);

                const averageOrderValue =
                    completedOrders > 0 ? totalSpent / completedOrders : 0;

                // Get unique vendors
                const vendorCounts = orders.reduce((acc, order) => {
                    acc[order.vendorId] = (acc[order.vendorId] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const uniqueVendorsOrdered = Object.keys(vendorCounts).length;

                const favoriteVendorId =
                    uniqueVendorsOrdered > 0
                        ? (Object.entries(vendorCounts).sort(
                            ([, a], [, b]) => (b as number) - (a as number),
                        )[0]?.[0] ?? null)
                        : null;

                // Get days since last order
                const lastOrder = await this.prisma.order.findFirst({
                    where: {
                        authorId: customer.id,
                        status: OrderStatus.COMPLETED,
                    },
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true },
                });

                const daysSinceLastOrder = lastOrder
                    ? Math.floor(
                        (Date.now() - lastOrder.createdAt.getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                    : null;

                // Get referrals given
                const referralsGiven = await this.prisma.referral.count({
                    where: { referrerId: customer.id },
                });

                // Get reviews written
                const reviewsWritten = await this.prisma.review.count({
                    where: {
                        customerId: customer.id,
                        createdAt: { gte: start, lt: end },
                    },
                });

                // Get wallet balance
                const customerProfile = await this.prisma.customerProfile.findUnique({
                    where: { userId: customer.id },
                    select: { walletAmount: true },
                });

                // Get wallet top-ups
                const walletTopUps = await this.prisma.walletTransaction.count({
                    where: {
                        userId: customer.id,
                        type: 'DEPOSIT',
                        isTopup: true,
                        createdAt: { gte: start, lt: end },
                    },
                });

                // Upsert metrics
                await this.prisma.customerEngagementMetrics.upsert({
                    where: {
                        customerId_snapshotDate_snapshotType: {
                            customerId: customer.id,
                            snapshotDate: date,
                            snapshotType: type,
                        },
                    },
                    create: {
                        customerId: customer.id,
                        snapshotDate: date,
                        snapshotType: type,
                        totalOrders,
                        completedOrders,
                        cancelledOrders,
                        totalSpent,
                        averageOrderValue,
                        uniqueVendorsOrdered,
                        favoriteVendorId,
                        daysSinceLastOrder,
                        referralsGiven,
                        reviewsWritten,
                        walletBalance: customerProfile?.walletAmount || 0,
                        walletTopUps,
                    },
                    update: {
                        totalOrders,
                        completedOrders,
                        cancelledOrders,
                        totalSpent,
                        averageOrderValue,
                        uniqueVendorsOrdered,
                        favoriteVendorId,
                        daysSinceLastOrder,
                        referralsGiven,
                        reviewsWritten,
                        walletBalance: customerProfile?.walletAmount || 0,
                        walletTopUps,
                    },
                });

                this.logger.debug(
                    `Aggregated ${type} metrics for customer: ${customer.id}`,
                );
            } catch (error) {
                this.logger.error(
                    `Failed to aggregate customer ${customer.id}: ${error.message}`,
                );
            }
        }

        // Invalidate cache
        await this.redis.del(AnalyticsConfig.CACHE_KEYS.CUSTOMER_SEGMENTS);
    }

    /**
     * Aggregate platform-wide metrics
     */
    async aggregatePlatformMetrics(date: Date, type: string) {
        const { start, end } = this.getDateRange(date, type);

        try {
            // Get all orders in period
            const orders = await this.prisma.order.findMany({
                where: {
                    createdAt: { gte: start, lt: end },
                },
                select: {
                    id: true,
                    status: true,
                    orderTotal: true,
                    adminCommissionAmount: true,
                    driverCommissionValue: true,
                },
            });

            const totalOrders = orders.length;
            const completedOrders = orders.filter(
                (o) => o.status === OrderStatus.COMPLETED,
            ).length;
            const cancelledOrders = orders.filter(
                (o) => o.status === OrderStatus.CANCELLED,
            ).length;

            const gmv = orders
                .filter((o) => o.status === OrderStatus.COMPLETED)
                .reduce((sum, o) => sum + Number(o.orderTotal || 0), 0);

            const averageOrderValue = completedOrders > 0 ? gmv / completedOrders : 0;

            const vendorCommissions = orders
                .filter((o) => o.status === OrderStatus.COMPLETED)
                .reduce((sum, o) => sum + Number(o.adminCommissionAmount || 0), 0);

            const driverCommissions = orders
                .filter((o) => o.status === OrderStatus.COMPLETED)
                .reduce((sum, o) => sum + Number(o.driverCommissionValue || 0), 0);

            const platformRevenue = vendorCommissions + driverCommissions;

            // Get subscription revenue
            const subscriptionRevenue = await this.getSubscriptionRevenue(start, end);

            // Get active users
            const activeCustomers = await this.prisma.user.count({
                where: {
                    role: UserRole.CUSTOMER,
                    ordersAsAuthor: {
                        some: {
                            createdAt: { gte: start, lt: end },
                        },
                    },
                },
            });

            const activeVendors = await this.prisma.vendor.count({
                where: {
                    orders: {
                        some: {
                            createdAt: { gte: start, lt: end },
                        },
                    },
                },
            });

            const activeDrivers = await this.prisma.user.count({
                where: {
                    role: UserRole.DRIVER,
                    ordersAsDriver: {
                        some: {
                            createdAt: { gte: start, lt: end },
                        },
                    },
                },
            });

            // Get new users
            const newCustomers = await this.prisma.user.count({
                where: {
                    role: UserRole.CUSTOMER,
                    createdAt: { gte: start, lt: end },
                },
            });

            const newVendors = await this.prisma.vendor.count({
                where: { createdAt: { gte: start, lt: end } },
            });

            const newDrivers = await this.prisma.user.count({
                where: {
                    role: UserRole.DRIVER,
                    createdAt: { gte: start, lt: end },
                },
            });

            // Get total searches
            const totalSearches = await this.prisma.userActivityLog.count({
                where: {
                    activityType: { contains: 'SEARCH' },
                    timestamp: { gte: start, lt: end },
                },
            });

            // Get total reviews
            const totalReviews = await this.prisma.review.count({
                where: { createdAt: { gte: start, lt: end } },
            });

            // Upsert platform metrics
            await this.prisma.platformMetricsSummary.upsert({
                where: {
                    summaryDate_summaryType: {
                        summaryDate: date,
                        summaryType: type,
                    },
                },
                create: {
                    summaryDate: date,
                    summaryType: type,
                    totalOrders,
                    completedOrders,
                    cancelledOrders,
                    averageOrderValue,
                    grossMerchandiseValue: gmv,
                    totalRevenue: gmv,
                    vendorCommissions,
                    driverCommissions,
                    platformRevenue,
                    subscriptionRevenue,
                    activeCustomers,
                    activeVendors,
                    activeDrivers,
                    newCustomers,
                    newVendors,
                    newDrivers,
                    totalSearches,
                    totalReviews,
                },
                update: {
                    totalOrders,
                    completedOrders,
                    cancelledOrders,
                    averageOrderValue,
                    grossMerchandiseValue: gmv,
                    totalRevenue: gmv,
                    vendorCommissions,
                    driverCommissions,
                    platformRevenue,
                    subscriptionRevenue,
                    activeCustomers,
                    activeVendors,
                    activeDrivers,
                    newCustomers,
                    newVendors,
                    newDrivers,
                    totalSearches,
                    totalReviews,
                },
            });

            // Emit metric update event
            this.eventEmitter.emit('analytics.metric.updated', {
                metricType: 'platform_summary',
                value: { gmv, platformRevenue, totalOrders },
            });

            this.logger.log(`Aggregated ${type} platform metrics`);
        } catch (error) {
            this.logger.error(
                `Failed to aggregate platform metrics: ${error.message}`,
            );
        }
    }

    /**
     * Aggregate zone performance metrics
     */
    async aggregateZoneMetrics(date: Date, type: string) {
        const zones = await this.prisma.zone.findMany({
            select: { id: true },
        });

        const { start, end } = this.getDateRange(date, type);

        for (const zone of zones) {
            try {
                // Get zone vendors
                const zoneVendors = await this.prisma.vendor.findMany({
                    where: { zoneId: zone.id },
                    select: { id: true },
                });

                const vendorIds = zoneVendors.map((v) => v.id);

                // Get zone orders
                const orders = await this.prisma.order.findMany({
                    where: {
                        vendorId: { in: vendorIds },
                        createdAt: { gte: start, lt: end },
                    },
                    select: {
                        id: true,
                        status: true,
                        orderTotal: true,
                        authorId: true,
                    },
                });

                const totalOrders = orders.length;
                const completedOrders = orders.filter(
                    (o) => o.status === OrderStatus.COMPLETED,
                ).length;

                const totalRevenue = orders
                    .filter((o) => o.status === OrderStatus.COMPLETED)
                    .reduce((sum, o) => sum + Number(o.orderTotal || 0), 0);

                const averageOrderValue =
                    completedOrders > 0 ? totalRevenue / completedOrders : 0;

                // Get average delivery time for zone
                const deliveryTimes = await this.prisma.deliveryEvent.findMany({
                    where: {
                        order: {
                            vendorId: { in: vendorIds },
                        },
                        eventType: 'DELIVERED',
                        eventTimestamp: { gte: start, lt: end },
                        duration: { not: null },
                    },
                    select: { duration: true },
                });

                const averageDeliveryTime =
                    deliveryTimes.length > 0
                        ? Math.round(
                            deliveryTimes.reduce((sum, e) => sum + (e.duration || 0), 0) /
                            deliveryTimes.length /
                            60,
                        )
                        : null;

                // Get active vendors/drivers in zone
                const activeVendors = zoneVendors.length;

                const activeDrivers = await this.prisma.driverProfile.count({
                    where: {
                        user: {
                            zoneId: zone.id,
                        },
                    },
                });

                // Get unique customers
                const totalCustomers = new Set(orders.map((o) => o.authorId)).size;

                // Get cash collections from manager
                const cashCollections = await this.prisma.managerCashConfirmation.aggregate({
                    where: {
                        order: {
                            vendor: {
                                zoneId: zone.id,
                            },
                        },
                        createdAt: { gte: start, lt: end },
                    },
                    _sum: { amount: true },
                });

                // Upsert zone metrics
                await this.prisma.zonePerformanceMetrics.upsert({
                    where: {
                        zoneId_snapshotDate_snapshotType: {
                            zoneId: zone.id,
                            snapshotDate: date,
                            snapshotType: type,
                        },
                    },
                    create: {
                        zoneId: zone.id,
                        snapshotDate: date,
                        snapshotType: type,
                        totalOrders,
                        completedOrders,
                        averageDeliveryTime,
                        totalRevenue,
                        averageOrderValue,
                        activeVendors,
                        activeDrivers,
                        totalCustomers,
                        cashCollections: Number(cashCollections._sum.amount || 0),
                    },
                    update: {
                        totalOrders,
                        completedOrders,
                        averageDeliveryTime,
                        totalRevenue,
                        averageOrderValue,
                        activeVendors,
                        activeDrivers,
                        totalCustomers,
                        cashCollections: Number(cashCollections._sum.amount || 0),
                    },
                });

                this.logger.debug(`Aggregated ${type} metrics for zone: ${zone.id}`);
            } catch (error) {
                this.logger.error(
                    `Failed to aggregate zone ${zone.id}: ${error.message}`,
                );
            }
        }
    }

    /**
     * Aggregate product performance metrics
     */
    async aggregateProductMetrics(date: Date, type: string) {
        const { start, end } = this.getDateRange(date, type);

        // Get all products that had orders in this period
        const productOrders = await this.prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                order: {
                    createdAt: { gte: start, lt: end },
                },
            },
            _sum: {
                quantity: true,
                price: true,
            },
            _count: {
                orderId: true,
            },
        });

        for (const po of productOrders) {
            try {
                const product = await this.prisma.product.findUnique({
                    where: { id: po.productId },
                    select: { id: true, vendorId: true },
                });

                if (!product) continue;

                // Get product view count
                const totalViews = await this.prisma.userActivityLog.count({
                    where: {
                        activityType: 'VIEW_PRODUCT',
                        resourceId: po.productId,
                        timestamp: { gte: start, lt: end },
                    },
                });

                // Get favorites count
                const totalFavorites = await this.prisma.favoriteProduct.count({
                    where: { productId: po.productId },
                });

                // Get unique customers
                const customerIds = await this.prisma.orderItem.findMany({
                    where: {
                        productId: po.productId,
                        order: {
                            createdAt: { gte: start, lt: end },
                        },
                    },
                    select: { order: { select: { authorId: true } } },
                    distinct: ['orderId'],
                });

                const uniqueCustomers = new Set(
                    customerIds.map((item) => item.order.authorId),
                ).size;

                const totalOrders = po._count.orderId;
                const totalQuantitySold = po._sum.quantity || 0;
                const totalRevenue = po._sum.price || 0;
                const averagePrice =
                    totalQuantitySold > 0 ? Number(totalRevenue) / totalQuantitySold : 0;

                const conversionRate =
                    totalViews > 0 ? (totalOrders / totalViews) * 100 : null;

                // Upsert product metrics
                await this.prisma.productPerformanceMetrics.upsert({
                    where: {
                        productId_snapshotDate_snapshotType: {
                            productId: po.productId,
                            snapshotDate: date,
                            snapshotType: type,
                        },
                    },
                    create: {
                        productId: po.productId,
                        vendorId: product.vendorId,
                        snapshotDate: date,
                        snapshotType: type,
                        totalOrders,
                        totalQuantitySold,
                        totalRevenue,
                        averagePrice,
                        totalViews,
                        totalFavorites,
                        uniqueCustomers,
                        conversionRate,
                    },
                    update: {
                        totalOrders,
                        totalQuantitySold,
                        totalRevenue,
                        averagePrice,
                        totalViews,
                        totalFavorites,
                        uniqueCustomers,
                        conversionRate,
                    },
                });
            } catch (error) {
                this.logger.error(
                    `Failed to aggregate product ${po.productId}: ${error.message}`,
                );
            }
        }

        this.logger.log(`Aggregated ${type} product metrics`);
    }

    /**
     * Helper: Get date range for aggregation type
     */
    private getDateRange(date: Date, type: string) {
        const start = new Date(date);
        const end = new Date(date);

        if (type === 'DAILY') {
            start.setHours(0, 0, 0, 0);
            end.setDate(end.getDate() + 1);
            end.setHours(0, 0, 0, 0);
        } else if (type === 'WEEKLY') {
            // Start of week (Monday)
            const day = start.getDay();
            const diff = start.getDate() - day + (day === 0 ? -6 : 1);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);
            end.setDate(start.getDate() + 7);
            end.setHours(0, 0, 0, 0);
        } else if (type === 'MONTHLY') {
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(end.getMonth() + 1);
            end.setDate(1);
            end.setHours(0, 0, 0, 0);
        }

        return { start, end };
    }

    /**
     * Helper: Count new customers for a vendor
     */
    private async countNewCustomers(
        vendorId: string,
        start: Date,
        end: Date,
    ): Promise<number> {
        const orders = await this.prisma.order.findMany({
            where: {
                vendorId,
                createdAt: { gte: start, lt: end },
            },
            select: { authorId: true },
            distinct: ['authorId'],
        });

        let newCount = 0;

        for (const order of orders) {
            const previousOrder = await this.prisma.order.findFirst({
                where: {
                    vendorId,
                    authorId: order.authorId,
                    createdAt: { lt: start },
                },
            });

            if (!previousOrder) {
                newCount++;
            }
        }

        return newCount;
    }

    /**
     * Helper: Get subscription revenue for period
     */
    private async getSubscriptionRevenue(
        start: Date,
        end: Date,
    ): Promise<number> {
        // Query the event log to capture all subscription-related payments
        // This includes new subscriptions, renewals, and upgrades
        const logs = await this.prisma.subscriptionEventLog.aggregate({
            where: {
                eventTimestamp: { gte: start, lt: end },
                paymentStatus: 'COMPLETED', // Ensure we only count paid events
            },
            _sum: { amountPaid: true },
        });

        return Number(logs._sum.amountPaid || 0);
    }
}
