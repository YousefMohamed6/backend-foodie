import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsGateway } from './analytics.gateway';
import type { UserActivityData } from './interfaces/analytics.interfaces';

@Injectable()
export class AnalyticsEventsService {
  private readonly logger = new Logger(AnalyticsEventsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly analyticsGateway: AnalyticsGateway,
  ) {}

  /**
   * Handle user activity events async
   * This runs in the background without blocking requests
   */
  @OnEvent('analytics.user.activity')
  async handleUserActivity(data: UserActivityData) {
    try {
      await this.prisma.userActivityLog.create({
        data: {
          userId: data.userId,
          activityType: data.activityType,
          activityCategory: data.activityCategory,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          sessionId: data.sessionId,
          devicePlatform: data.devicePlatform as any,
          appVersion: data.appVersion,
          latitude: data.latitude,
          longitude: data.longitude,
          metadata: data.metadata,
          timestamp: new Date(),
        },
      });

      this.logger.debug(
        `Tracked user activity: ${data.activityType} by ${data.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle user activity: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle order lifecycle events and broadcast to dashboard
   */
  @OnEvent('analytics.order.lifecycle')
  async handleOrderLifecycle(event: any) {
    try {
      // Broadcast to real-time dashboard
      this.analyticsGateway.broadcastOrderEvent(event);

      this.logger.debug(`Broadcast order lifecycle event: ${event.eventType}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast order lifecycle: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle delivery events and broadcast driver location
   */
  @OnEvent('analytics.delivery.event')
  async handleDeliveryEvent(event: any) {
    try {
      // Broadcast to real-time tracking
      this.analyticsGateway.broadcastDeliveryUpdate(event);

      this.logger.debug(`Broadcast delivery event: ${event.eventType}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast delivery event: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle payment transaction events
   */
  @OnEvent('analytics.payment.transaction')
  async handlePaymentTransaction(transaction: any) {
    try {
      // Broadcast payment status for dashboards
      this.analyticsGateway.broadcastPaymentUpdate(transaction);

      this.logger.debug(`Broadcast payment transaction: ${transaction.status}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast payment transaction: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle subscription events
   */
  @OnEvent('analytics.subscription.event')
  async handleSubscriptionEvent(event: any) {
    try {
      // Broadcast subscription change
      this.analyticsGateway.broadcastSubscriptionUpdate(event);

      this.logger.debug(`Broadcast subscription event: ${event.eventType}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast subscription event: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle metric updates (from aggregation jobs)
   */
  @OnEvent('analytics.metric.updated')
  async handleMetricUpdate(data: { metricType: string; value: any }) {
    try {
      // Broadcast to admin dashboard
      this.analyticsGateway.broadcastMetricUpdate(data.metricType, data.value);

      this.logger.debug(`Broadcast metric update: ${data.metricType}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast metric update: ${error.message}`,
        error.stack,
      );
    }
  }
}
