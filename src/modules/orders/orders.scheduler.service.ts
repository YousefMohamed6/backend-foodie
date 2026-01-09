import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrderStatus, PaymentMethod, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../../shared/services/notification.service';
import { SettingsService } from '../settings/settings.service';
import { WalletService } from '../wallet/wallet.service';

import { AnalyticsTrackingService } from '../analytics/analytics-tracking.service';
import { APP_SETTINGS } from '../settings/settings.constants';
import { WalletTransactionDescriptions } from '../wallet/wallet-transaction.constants';
import {
  AnalyticsEventType,
  OrderConstants,
  ORDERS_NOTIFICATIONS,
} from './orders.constants';

@Injectable()
export class OrdersSchedulerService {
  private readonly logger = new Logger(OrdersSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly analyticsTrackingService: AnalyticsTrackingService,
    private readonly settingsService: SettingsService,
    private readonly walletService: WalletService,
  ) {}

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
        ORDERS_NOTIFICATIONS.ORDER_READY,
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
            ORDERS_NOTIFICATIONS.MANAGER_ORDER_READY,
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
        eventType: AnalyticsEventType.ORDER_PREPARED,
        previousStatus: order.status, // Status doesn't change here
        newStatus: order.status,
        actorId: OrderConstants.SYSTEM_ACTOR_ID, // System triggered
        actorRole: undefined,
        metadata: {
          estimatedReadyAt: order.estimatedReadyAt,
          actualReadyAt: new Date(),
        },
      });

      this.logger.log(`Sent order ready notification for order ${order.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process ready order ${order.id}: ${error.message}`,
      );
    }
  }

  /**
   * Auto-cancel orders that vendors haven't accepted within the timeout period
   * Runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoCancelUnacceptedOrders() {
    this.logger.debug('Checking for unaccepted orders to auto-cancel...');

    try {
      // Check if auto-cancel is enabled
      const isEnabled = await this.settingsService
        .findOne(APP_SETTINGS.VENDOR_AUTO_CANCEL_ENABLED)
        .catch(() => 'true');

      if (isEnabled !== 'true') {
        this.logger.debug('Vendor auto-cancel is disabled. Skipping.');
        return;
      }

      // Get timeout in minutes
      const timeoutMinutesStr = await this.settingsService
        .findOne(APP_SETTINGS.ORDER_TIMEOUT_MINUTES)
        .catch(() => '30');
      const timeoutMinutes = parseInt(timeoutMinutesStr || '30', 10);

      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - timeoutMinutes);

      // Find orders that are still in PLACED status and created before cutoff
      const ordersToCancel = await this.prisma.order.findMany({
        where: {
          status: OrderStatus.PLACED,
          createdAt: {
            lte: cutoffTime,
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

      if (ordersToCancel.length > 0) {
        this.logger.log(
          `Found ${ordersToCancel.length} orders to auto-cancel due to vendor timeout`,
        );
      }

      for (const order of ordersToCancel) {
        await this.handleOrderAutoCancel(order, timeoutMinutes);
      }
    } catch (error) {
      this.logger.error(
        `Failed to check for unaccepted orders: ${error.message}`,
        error.stack,
      );
    }
  }

  private async handleOrderAutoCancel(order: any, timeoutMinutes: number) {
    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Update order status to CANCELLED
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
          },
        });

        // 2. If wallet payment, refund the customer
        if (order.paymentMethod === PaymentMethod.wallet) {
          // Check if there's a held balance to refund
          const heldBalance = await tx.heldBalance.findUnique({
            where: { orderId: order.id },
          });

          if (heldBalance) {
            // Refund the held amount
            await this.walletService.refund(
              order.authorId,
              Number(heldBalance.totalAmount),
              WalletTransactionDescriptions.autoCancelRefund(
                order.id,
                timeoutMinutes,
              ).en,
              WalletTransactionDescriptions.autoCancelRefund(
                order.id,
                timeoutMinutes,
              ).ar,
              order.id,
              tx,
            );

            // Update held balance status
            await tx.heldBalance.update({
              where: { orderId: order.id },
              data: {
                status: 'REFUNDED',
                releasedAt: new Date(),
              },
            });
          } else {
            // Direct refund if no held balance record
            await this.walletService.refund(
              order.authorId,
              Number(order.totalAmount),
              WalletTransactionDescriptions.autoCancelRefund(
                order.id,
                timeoutMinutes,
              ).en,
              WalletTransactionDescriptions.autoCancelRefund(
                order.id,
                timeoutMinutes,
              ).ar,
              order.id,
              tx,
            );
          }

          this.logger.log(
            `Refunded wallet payment for auto-cancelled order ${order.id}`,
          );
        }
      });

      // 3. Send notification to customer
      await this.notificationService.sendOrderNotification(
        order.authorId,
        ORDERS_NOTIFICATIONS.ORDER_AUTO_CANCELLED,
        {
          orderId: order.id,
          vendorName: order.vendor?.title || 'Vendor',
          reason: `Order was automatically cancelled because the vendor did not accept it within ${timeoutMinutes} minutes. If you paid via wallet, your payment has been refunded.`,
          status: OrderStatus.CANCELLED,
        },
      );

      // 4. Notify zone managers about the auto-cancellation
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

        if (managers.length > 0) {
          await this.notificationService.sendBulkNotifications(
            managers.map((m) => m.id),
            ORDERS_NOTIFICATIONS.MANAGER_ORDER_AUTO_CANCELLED,
            {
              orderId: order.id,
              vendorName: order.vendor.title,
              reason: `Vendor did not accept within ${timeoutMinutes} minutes`,
            },
          );
        }
      }

      // 5. Track the cancellation
      this.analyticsTrackingService.trackOrderLifecycle({
        orderId: order.id,
        eventType: AnalyticsEventType.ORDER_CANCELLED,
        previousStatus: OrderStatus.PLACED,
        newStatus: OrderStatus.CANCELLED,
        actorId: OrderConstants.SYSTEM_ACTOR_ID,
        actorRole: undefined,
        metadata: {
          reason: 'VENDOR_TIMEOUT',
          timeoutMinutes,
          createdAt: order.createdAt,
        },
      });

      this.logger.log(
        `Auto-cancelled order ${order.id} due to vendor timeout (${timeoutMinutes} min)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to auto-cancel order ${order.id}: ${error.message}`,
        error.stack,
      );
    }
  }
}
