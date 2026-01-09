import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../shared/services/redis.service';
import {
  AnalyticsConfig,
  getCustomerSegment,
  getPerformanceRating,
  OrderLifecycleEventType,
  SnapshotType,
} from './analytics.constants';

@Injectable()
export class AnalyticsQueryService {
  private readonly logger = new Logger(AnalyticsQueryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Get vendor performance metrics
   */
  async getVendorPerformance(
    vendorId: string,
    days: number = AnalyticsConfig.DEFAULT_TIME_RANGES.MONTHLY,
  ) {
    const cacheKey = `analytics:vendor:${vendorId}:${days}d`;

    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get latest snapshot
    const snapshot = await this.prisma.vendorMetricsSnapshot.findFirst({
      where: {
        vendorId,
        snapshotType: SnapshotType.DAILY,
        snapshotDate: { gte: startDate },
      },
      orderBy: { snapshotDate: 'desc' },
    });

    // Get real-time stats for today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayOrders = await this.prisma.order.count({
      where: {
        vendorId,
        createdAt: { gte: todayStart },
      },
    });

    const todayRevenue = await this.prisma.order.aggregate({
      where: {
        vendorId,
        status: OrderStatus.COMPLETED,
        createdAt: { gte: todayStart },
      },
      _sum: { orderTotal: true },
    });

    const result = {
      vendorId,
      period: `${days} days`,
      snapshot: snapshot || null,
      today: {
        orders: todayOrders,
        revenue: todayRevenue._sum.orderTotal || 0,
      },
      performance: snapshot
        ? {
            acceptanceRating: getPerformanceRating(
              Number(snapshot.acceptanceRate || 0),
              {
                excellent:
                  AnalyticsConfig.PERFORMANCE_THRESHOLDS
                    .VENDOR_ACCEPTANCE_RATE_EXCELLENT,
                good: AnalyticsConfig.PERFORMANCE_THRESHOLDS
                  .VENDOR_ACCEPTANCE_RATE_GOOD,
              },
              true,
            ),
            revenueRating:
              Number(snapshot.totalRevenue) > 10000
                ? 'EXCELLENT'
                : Number(snapshot.totalRevenue) > 5000
                  ? 'GOOD'
                  : 'AVERAGE',
          }
        : null,
    };

    // Cache for 5 minutes
    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      AnalyticsConfig.CACHE_TTL.PLATFORM_SUMMARY,
    );

    return result;
  }

  /**
   * Get driver performance metrics
   */
  async getDriverPerformance(
    driverId: string,
    days: number = AnalyticsConfig.DEFAULT_TIME_RANGES.MONTHLY,
  ) {
    const cacheKey = `analytics:driver:${driverId}:${days}d`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const snapshot = await this.prisma.driverMetricsSnapshot.findFirst({
      where: {
        driverId,
        snapshotType: SnapshotType.DAILY,
        snapshotDate: { gte: startDate },
      },
      orderBy: { snapshotDate: 'desc' },
    });

    // Get today's orders
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayDeliveries = await this.prisma.order.count({
      where: {
        driverId,
        status: OrderStatus.COMPLETED,
        createdAt: { gte: todayStart },
      },
    });

    const result = {
      driverId,
      period: `${days} days`,
      snapshot: snapshot || null,
      today: {
        deliveries: todayDeliveries,
      },
      performance: snapshot
        ? {
            deliveryTimeRating: getPerformanceRating(
              snapshot.averageDeliveryTime || 0,
              {
                excellent:
                  AnalyticsConfig.PERFORMANCE_THRESHOLDS
                    .DRIVER_DELIVERY_TIME_EXCELLENT,
                good: AnalyticsConfig.PERFORMANCE_THRESHOLDS
                  .DRIVER_DELIVERY_TIME_GOOD,
              },
              false, // lower is better
            ),
            ratingScore: Number(snapshot.averageRating || 0),
          }
        : null,
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      AnalyticsConfig.CACHE_TTL.PLATFORM_SUMMARY,
    );

    return result;
  }

  /**
   * Get customer segments
   */
  async getCustomerSegments() {
    const cacheKey = AnalyticsConfig.CACHE_KEYS.CUSTOMER_SEGMENTS;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get latest customer metrics
    const metrics = await this.prisma.customerEngagementMetrics.findMany({
      where: {
        snapshotType: SnapshotType.MONTHLY,
      },
      orderBy: { snapshotDate: 'desc' },
      take: 1000, // Top 1000 customers
    });

    const segments: {
      VIP: any[];
      ACTIVE: any[];
      AT_RISK: any[];
      CHURNED: any[];
      NEW: any[];
    } = {
      VIP: [],
      ACTIVE: [],
      AT_RISK: [],
      CHURNED: [],
      NEW: [],
    };

    metrics.forEach((m) => {
      const segment = getCustomerSegment({
        daysSinceLastOrder: m.daysSinceLastOrder,
        totalOrders: m.totalOrders,
        totalSpent: Number(m.totalSpent),
      });

      segments[segment].push({
        customerId: m.customerId,
        totalOrders: m.totalOrders,
        totalSpent: Number(m.totalSpent),
        daysSinceLastOrder: m.daysSinceLastOrder,
      });
    });

    const result = {
      segments,
      summary: {
        vip: segments.VIP.length,
        active: segments.ACTIVE.length,
        atRisk: segments.AT_RISK.length,
        churned: segments.CHURNED.length,
        new: segments.NEW.length,
      },
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      AnalyticsConfig.CACHE_TTL.CUSTOMER_SEGMENTS,
    );

    return result;
  }

  /**
   * Get top vendors
   */
  async getTopVendors(
    limit: number = AnalyticsConfig.DEFAULT_LIMITS.TOP_VENDORS,
    sortBy: 'revenue' | 'orders' | 'rating' = 'revenue',
  ) {
    const cacheKey = `${AnalyticsConfig.CACHE_KEYS.VENDOR_RANKINGS}:${sortBy}:${limit}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const orderByField =
      sortBy === 'revenue'
        ? { totalRevenue: 'desc' as const }
        : sortBy === 'orders'
          ? { totalOrders: 'desc' as const }
          : { acceptanceRate: 'desc' as const };

    const topVendors = await this.prisma.vendorMetricsSnapshot.findMany({
      where: {
        snapshotType: SnapshotType.DAILY,
      },
      orderBy: orderByField,
      take: limit,
      include: {
        vendor: {
          select: {
            id: true,
            title: true,
            logo: true,
          },
        },
      },
    });

    const result = topVendors.map((v, index) => ({
      rank: index + 1,
      vendorId: v.vendorId,
      vendorName: v.vendor.title,
      vendorLogo: v.vendor.logo,
      totalRevenue: Number(v.totalRevenue),
      totalOrders: v.totalOrders,
      completedOrders: v.completedOrders,
      acceptanceRate: Number(v.acceptanceRate || 0),
      averageOrderValue: Number(v.averageOrderValue),
    }));

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      AnalyticsConfig.CACHE_TTL.VENDOR_RANKINGS,
    );

    return result;
  }

  /**
   * Get top drivers
   */
  async getTopDrivers(
    limit: number = AnalyticsConfig.DEFAULT_LIMITS.TOP_DRIVERS,
    sortBy: 'deliveries' | 'earnings' | 'rating' = 'deliveries',
  ) {
    const cacheKey = `${AnalyticsConfig.CACHE_KEYS.DRIVER_RANKINGS}:${sortBy}:${limit}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const orderByField =
      sortBy === 'deliveries'
        ? { completedDeliveries: 'desc' as const }
        : sortBy === 'earnings'
          ? { totalEarnings: 'desc' as const }
          : { averageRating: 'desc' as const };

    const topDrivers = await this.prisma.driverMetricsSnapshot.findMany({
      where: {
        snapshotType: SnapshotType.DAILY,
      },
      orderBy: orderByField,
      take: limit,
      include: {
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureURL: true,
          },
        },
      },
    });

    const result = topDrivers.map((d, index) => ({
      rank: index + 1,
      driverId: d.driverId,
      driverName: `${d.driver.firstName} ${d.driver.lastName}`,
      driverPhoto: d.driver.profilePictureURL,
      completedDeliveries: d.completedDeliveries,
      totalEarnings: Number(d.totalEarnings),
      averageRating: Number(d.averageRating || 0),
      averageDeliveryTime: d.averageDeliveryTime,
    }));

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      AnalyticsConfig.CACHE_TTL.DRIVER_RANKINGS,
    );

    return result;
  }

  /**
   * Get top products
   */
  async getTopProducts(
    limit: number = AnalyticsConfig.DEFAULT_LIMITS.TOP_PRODUCTS,
  ) {
    const cacheKey = `${AnalyticsConfig.CACHE_KEYS.PRODUCT_RANKINGS}:${limit}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const topProducts = await this.prisma.productPerformanceMetrics.findMany({
      where: {
        snapshotType: SnapshotType.DAILY,
      },
      orderBy: {
        totalRevenue: 'desc',
      },
      take: limit,
    });

    const result = topProducts.map((p, index) => ({
      rank: index + 1,
      productId: p.productId,
      vendorId: p.vendorId,
      totalOrders: p.totalOrders,
      totalQuantitySold: p.totalQuantitySold,
      totalRevenue: Number(p.totalRevenue),
      conversionRate: Number(p.conversionRate || 0),
    }));

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      AnalyticsConfig.CACHE_TTL.PRODUCT_RANKINGS,
    );

    return result;
  }

  /**
   * Get order funnel analytics
   */
  async getOrderFunnelAnalytics(
    days: number = AnalyticsConfig.DEFAULT_TIME_RANGES.MONTHLY,
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await this.prisma.orderLifecycleEvent.groupBy({
      by: ['eventType'],
      where: {
        eventTimestamp: { gte: startDate },
      },
      _count: { id: true },
    });

    const funnel = events.reduce(
      (acc, curr) => {
        acc[curr.eventType] = curr._count.id;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calculate conversion rates
    const placed = funnel[OrderLifecycleEventType.PLACED] || 0;
    const vendorAccepted = funnel[OrderLifecycleEventType.VENDOR_ACCEPTED] || 0;
    const delivered = funnel[OrderLifecycleEventType.DELIVERED] || 0;

    return {
      funnel,
      conversionRates: {
        vendorAcceptanceRate: placed > 0 ? (vendorAccepted / placed) * 100 : 0,
        completionRate: placed > 0 ? (delivered / placed) * 100 : 0,
      },
      dropOffPoints: {
        afterPlaced: placed - vendorAccepted,
        afterVendorAccepted: vendorAccepted - delivered,
      },
    };
  }

  /**
   * Get platform health metrics
   */
  async getPlatformHealth() {
    const cacheKey = AnalyticsConfig.CACHE_KEYS.PLATFORM_SUMMARY;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const latestSummary = await this.prisma.platformMetricsSummary.findFirst({
      where: {
        summaryType: SnapshotType.DAILY,
      },
      orderBy: { summaryDate: 'desc' },
    });

    if (!latestSummary) {
      return null;
    }

    const result = {
      date: latestSummary.summaryDate,
      gmv: Number(latestSummary.grossMerchandiseValue),
      totalOrders: latestSummary.totalOrders,
      completedOrders: latestSummary.completedOrders,
      cancelledOrders: latestSummary.cancelledOrders,
      completionRate:
        latestSummary.totalOrders > 0
          ? (latestSummary.completedOrders / latestSummary.totalOrders) * 100
          : 0,
      averageOrderValue: Number(latestSummary.averageOrderValue),
      platformRevenue: Number(latestSummary.platformRevenue),
      subscriptionRevenue: Number(latestSummary.subscriptionRevenue),
      activeUsers: {
        customers: latestSummary.activeCustomers,
        vendors: latestSummary.activeVendors,
        drivers: latestSummary.activeDrivers,
      },
      newSignups: {
        customers: latestSummary.newCustomers,
        vendors: latestSummary.newVendors,
        drivers: latestSummary.newDrivers,
      },
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      AnalyticsConfig.CACHE_TTL.PLATFORM_SUMMARY,
    );

    return result;
  }

  /**
   * Get payment analytics
   */
  async getPaymentAnalytics(
    days: number = AnalyticsConfig.DEFAULT_TIME_RANGES.MONTHLY,
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const payments = await this.prisma.paymentTransactionLog.groupBy({
      by: ['status', 'paymentMethod'],
      where: {
        initiatedAt: { gte: startDate },
      },
      _count: { id: true },
      _sum: { amount: true },
    });

    const byStatus: Record<string, { count: number; amount: number }> = {};
    const byMethod: Record<string, { count: number; amount: number }> = {};

    payments.forEach((p) => {
      // By status
      if (!byStatus[p.status]) {
        byStatus[p.status] = { count: 0, amount: 0 };
      }
      byStatus[p.status].count += p._count.id;
      byStatus[p.status].amount += Number(p._sum.amount || 0);

      // By method
      if (!byMethod[p.paymentMethod]) {
        byMethod[p.paymentMethod] = { count: 0, amount: 0 };
      }
      byMethod[p.paymentMethod].count += p._count.id;
      byMethod[p.paymentMethod].amount += Number(p._sum.amount || 0);
    });

    const total = Object.values(byStatus).reduce(
      (sum: number, s: any) => sum + s.count,
      0,
    );
    const completed = byStatus['COMPLETED']?.count || 0;

    return {
      byStatus,
      byMethod,
      summary: {
        total,
        completed,
        failed: total - completed,
        successRate: total > 0 ? (completed / total) * 100 : 0,
      },
    };
  }

  /**
   * Get zone performance
   */
  async getZonePerformance(zoneId: string) {
    const cacheKey = AnalyticsConfig.CACHE_KEYS.ZONE_PERFORMANCE(zoneId);

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const latestMetrics = await this.prisma.zonePerformanceMetrics.findFirst({
      where: {
        zoneId,
        snapshotType: SnapshotType.DAILY,
      },
      orderBy: { snapshotDate: 'desc' },
      include: {
        zone: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!latestMetrics) {
      return null;
    }

    const result = {
      zoneId,
      zoneName: latestMetrics.zone.name,
      totalOrders: latestMetrics.totalOrders,
      completedOrders: latestMetrics.completedOrders,
      totalRevenue: Number(latestMetrics.totalRevenue),
      averageDeliveryTime: latestMetrics.averageDeliveryTime,
      activeVendors: latestMetrics.activeVendors,
      activeDrivers: latestMetrics.activeDrivers,
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      AnalyticsConfig.CACHE_TTL.ZONE_PERFORMANCE,
    );

    return result;
  }
}
