import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
    AnalyticsConfig,
    PaymentTransactionStatus,
} from './analytics.constants';
import {
    DeliveryEventData,
    EntityChangeData,
    OrderLifecycleEventData,
    PaymentTransactionData,
    SubscriptionEventData,
    UserActivityData,
} from './interfaces/analytics.interfaces';

@Injectable()
export class AnalyticsTrackingService {
    private readonly logger = new Logger(AnalyticsTrackingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2,
    ) { }

    /**
     * Track order lifecycle events
     * Called when order status changes
     */
    async trackOrderLifecycle(
        data: OrderLifecycleEventData,
        tx?: Prisma.TransactionClient,
    ) {
        const prisma = tx || this.prisma;

        try {
            const event = await prisma.orderLifecycleEvent.create({
                data: {
                    orderId: data.orderId,
                    eventType: data.eventType,
                    previousStatus: data.previousStatus as any,
                    newStatus: data.newStatus as any,
                    actorId: data.actorId,
                    actorRole: data.actorRole as any,
                    timeSincePrevious: data.timeSincePrevious,
                    metadata: data.metadata,
                    locationLat: data.locationLat,
                    locationLng: data.locationLng,
                    eventTimestamp: new Date(),
                },
            });

            // Emit event for real-time dashboard
            this.eventEmitter.emit('analytics.order.lifecycle', event);

            return event;
        } catch (error) {
            this.logger.error(
                `Failed to track order lifecycle: ${error.message}`,
                error.stack,
            );
            // Don't throw - analytics failures shouldn't break business logic
            return null;
        }
    }

    /**
     * Track delivery events (distance, speed, etc.)
     */
    async trackDeliveryEvent(
        data: DeliveryEventData,
        tx?: Prisma.TransactionClient,
    ) {
        const prisma = tx || this.prisma;

        if (!data.driverId) {
            this.logger.warn('Delivery event tracked without driverId, skipping');
            return null;
        }

        try {
            const event = await prisma.deliveryEvent.create({
                data: {
                    orderId: data.orderId,
                    driverId: data.driverId,
                    vendorId: data.vendorId,
                    eventType: data.eventType,
                    status: data.status as any,
                    latitude: data.latitude ?? 0,
                    longitude: data.longitude ?? 0,
                    distanceCovered: data.distanceCovered,
                    duration: data.duration,
                    averageSpeed: data.averageSpeed,
                    metadata: data.metadata,
                    eventTimestamp: new Date(),
                },
            });

            // Emit for real-time tracking
            this.eventEmitter.emit('analytics.delivery.event', event);

            return event;
        } catch (error) {
            this.logger.error(
                `Failed to track delivery event: ${error.message}`,
                error.stack,
            );
            return null;
        }
    }

    /**
     * Track user activity (async - uses event emitter)
     * This is non-blocking for better performance
     */
    trackUserActivity(data: UserActivityData) {
        // Emit async event - handled by listener
        this.eventEmitter.emit('analytics.user.activity', data);
    }

    /**
     * Track payment transactions
     */
    async trackPaymentTransaction(
        data: PaymentTransactionData,
        tx?: Prisma.TransactionClient,
    ) {
        const prisma = tx || this.prisma;

        try {
            const transaction = await prisma.paymentTransactionLog.create({
                data: {
                    transactionType: data.transactionType,
                    referenceId: data.referenceId,
                    referenceType: data.referenceType,
                    userId: data.userId,
                    userRole: data.userRole as any,
                    amount: data.amount,
                    currency: data.currency || AnalyticsConfig.DEFAULT_CURRENCY,
                    paymentMethod: data.paymentMethod,
                    paymentGateway: data.paymentGateway,
                    status: data.status,
                    previousStatus: data.previousStatus,
                    gatewayTransactionId: data.gatewayTransactionId,
                    gatewayResponse: data.gatewayResponse,
                    errorCode: data.errorCode,
                    errorMessage: data.errorMessage,
                    completedAt: data.completedAt,
                    metadata: data.metadata,
                    initiatedAt: new Date(),
                },
            });

            // Emit for real-time financial dashboard
            this.eventEmitter.emit('analytics.payment.transaction', transaction);

            return transaction;
        } catch (error) {
            this.logger.error(
                `Failed to track payment transaction: ${error.message}`,
                error.stack,
            );
            return null;
        }
    }

    /**
     * Track subscription events
     */
    async trackSubscriptionEvent(
        data: SubscriptionEventData,
        tx?: Prisma.TransactionClient,
    ) {
        const prisma = tx || this.prisma;

        try {
            const event = await prisma.subscriptionEventLog.create({
                data: {
                    subscriptionId: data.subscriptionId,
                    vendorId: data.vendorId,
                    userId: data.userId,
                    eventType: data.eventType,
                    previousPlanId: data.previousPlanId,
                    newPlanId: data.newPlanId,
                    planName: data.planName,
                    planPrice: data.planPrice,
                    amountPaid: data.amountPaid,
                    paymentMethod: data.paymentMethod,
                    paymentStatus: data.paymentStatus,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    metadata: data.metadata,
                    eventTimestamp: new Date(),
                },
            });

            // Emit for subscription dashboard
            this.eventEmitter.emit('analytics.subscription.event', event);

            return event;
        } catch (error) {
            this.logger.error(
                `Failed to track subscription event: ${error.message}`,
                error.stack,
            );
            return null;
        }
    }

    /**
     * Track entity changes (CRUD audit trail)
     */
    async trackEntityChange(data: EntityChangeData, tx?: Prisma.TransactionClient) {
        const prisma = tx || this.prisma;

        try {
            const change = await prisma.entityChangeLog.create({
                data: {
                    entityType: data.entityType,
                    entityId: data.entityId,
                    changeType: data.changeType,
                    actorId: data.actorId,
                    actorRole: data.actorRole as any,
                    previousValue: data.previousValue,
                    newValue: data.newValue,
                    changedFields: data.changedFields || [],
                    ipAddress: data.ipAddress,
                    userAgent: data.userAgent,
                    timestamp: new Date(),
                },
            });

            return change;
        } catch (error) {
            this.logger.error(
                `Failed to track entity change: ${error.message}`,
                error.stack,
            );
            return null;
        }
    }

    /**
     * Batch track multiple order lifecycle events
     * Useful for bulk operations
     */
    async batchTrackOrderLifecycle(
        events: OrderLifecycleEventData[],
        tx?: Prisma.TransactionClient,
    ) {
        const prisma = tx || this.prisma;

        try {
            const created = await prisma.orderLifecycleEvent.createMany({
                data: events.map((event) => ({
                    orderId: event.orderId,
                    eventType: event.eventType,
                    previousStatus: event.previousStatus as any,
                    newStatus: event.newStatus as any,
                    actorId: event.actorId,
                    actorRole: event.actorRole as any,
                    timeSincePrevious: event.timeSincePrevious,
                    metadata: event.metadata,
                    locationLat: event.locationLat,
                    locationLng: event.locationLng,
                    eventTimestamp: new Date(),
                })),
            });

            this.logger.log(`Batch tracked ${created.count} order lifecycle events`);

            return created;
        } catch (error) {
            this.logger.error(
                `Failed to batch track order lifecycle: ${error.message}`,
                error.stack,
            );
            return null;
        }
    }

    /**
     * Get order funnel metrics
     */
    async getOrderFunnel(startDate: Date, endDate: Date) {
        const events = await this.prisma.orderLifecycleEvent.groupBy({
            by: ['eventType'],
            where: {
                eventTimestamp: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            _count: {
                id: true,
            },
        });

        return events.reduce(
            (acc, curr) => {
                acc[curr.eventType] = curr._count.id;
                return acc;
            },
            {} as Record<string, number>,
        );
    }

    /**
     * Get average time between order events
     */
    async getAverageOrderTiming(eventType: string, days: number = AnalyticsConfig.DEFAULT_TIME_RANGES.MONTHLY) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const result = await this.prisma.orderLifecycleEvent.aggregate({
            where: {
                eventType,
                eventTimestamp: { gte: startDate },
                timeSincePrevious: { not: null },
            },
            _avg: {
                timeSincePrevious: true,
            },
            _count: {
                id: true,
            },
        });

        return {
            eventType,
            averageSeconds: result._avg.timeSincePrevious,
            averageMinutes: result._avg.timeSincePrevious
                ? result._avg.timeSincePrevious / 60
                : null,
            totalEvents: result._count.id,
        };
    }

    /**
     * Get payment success rate
     */
    async getPaymentSuccessRate(days: number = AnalyticsConfig.DEFAULT_TIME_RANGES.MONTHLY) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const payments = await this.prisma.paymentTransactionLog.groupBy({
            by: ['status'],
            where: {
                initiatedAt: { gte: startDate },
            },
            _count: {
                id: true,
            },
        });

        const total = payments.reduce((sum, p) => sum + p._count.id, 0);
        const completed =
            payments.find((p) => p.status === PaymentTransactionStatus.COMPLETED)?._count.id || 0;

        return {
            total,
            completed,
            failed: total - completed,
            successRate: total > 0 ? (completed / total) * 100 : 0,
            breakdown: payments,
        };
    }
}
