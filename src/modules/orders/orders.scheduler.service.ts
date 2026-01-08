import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../shared/services/notification.service';

import { AnalyticsTrackingService } from '../analytics/analytics-tracking.service';

@Injectable()
export class OrdersSchedulerService {
    private readonly logger = new Logger(OrdersSchedulerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationService: NotificationService,
        private readonly analyticsTrackingService: AnalyticsTrackingService,
    ) { }

    /**
     * Check for orders that are estimated to be ready
     * Runs every minute
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async checkOrderPreparationTimes() {
        this.logger.debug('Checking order preparation times...');

        try {
            const now = new Date();

            // Find orders that:
            // 1. Have an estimated ready time
            // 2. Are past that time (estimatedReadyAt <= now)
            // 3. Haven't sent the notification yet
            // 4. Are still in a relevant status (not cancelled or completed)
            const orders = await this.prisma.order.findMany({
                where: {
                    estimatedReadyAt: {
                        lte: now,
                    },
                    isReadyNotificationSent: false,
                    status: {
                        in: [
                            OrderStatus.VENDOR_ACCEPTED,
                            OrderStatus.DRIVER_PENDING,
                            OrderStatus.DRIVER_ACCEPTED,
                        ],
                    },
                },
                include: {
                    vendor: {
                        select: {
                            id: true,
                            title: true,
                            zoneId: true,
                        },
                    },
                },
            });

            if (orders.length > 0) {
                this.logger.log(`Found ${orders.length} orders ready for notification`);
            }

            for (const order of orders) {
                await this.handleOrderReady(order);
            }
        } catch (error) {
            this.logger.error(
                `Failed to check order preparation times: ${error.message}`,
                error.stack,
            );
        }
    }

    private async handleOrderReady(order: any) {
        try {
            // 1. Send notification to customer
            await this.notificationService.sendOrderNotification(
                order.authorId,
                'notification_template_order_ready',
                {
                    orderId: order.id,
                    vendorName: order.vendor.title,
                    status: 'READY',
                },
            );

            // 2. Send notification to zone managers
            if (order.vendor?.zoneId) {
                const managers = await this.prisma.user.findMany({
                    where: {
                        role: UserRole.MANAGER,
                        zoneId: order.vendor.zoneId,
                        isActive: true,
                        fcmToken: { not: null },
                    },
                    select: { id: true },
                });

                const managerIds = managers.map((m) => m.id);
                if (managerIds.length > 0) {
                    await this.notificationService.sendBulkNotifications(
                        managerIds,
                        'notification_template_manager_order_ready',
                        {
                            orderId: order.id,
                            vendorName: order.vendor.title,
                            status: 'READY',
                        },
                    );
                    this.logger.log(
                        `Sent manager ready notification for order ${order.id} to ${managerIds.length} managers`,
                    );
                }
            }

            // 3. Mark notification as sent to avoid duplicates
            await this.prisma.order.update({
                where: { id: order.id },
                data: {
                    isReadyNotificationSent: true,
                },
            });

            // Track Order Prepared/Ready
            this.analyticsTrackingService.trackOrderLifecycle({
                orderId: order.id,
                eventType: 'ORDER_PREPARED',
                previousStatus: order.status, // Status doesn't change here
                newStatus: order.status,
                actorId: 'system', // System triggered
                actorRole: undefined,
                metadata: {
                    estimatedReadyAt: order.estimatedReadyAt,
                    actualReadyAt: new Date(),
                }
            });

            this.logger.log(`Sent order ready notification for order ${order.id}`);
        } catch (error) {
            this.logger.error(
                `Failed to process ready order ${order.id}: ${error.message}`,
            );
        }
    }
}
