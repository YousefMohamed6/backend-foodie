import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { FcmService } from './fcm.service';

@Injectable()
export class NotificationService {
  constructor(
    private fcmService: FcmService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) { }

  async sendPush(
    fcmToken: string | null,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    if (fcmToken) {
      await this.fcmService.sendNotification(fcmToken, title, body, data);
    }
  }

  async sendPushToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (user?.fcmToken) {
      await this.sendPush(user.fcmToken, title, body, data);
    }
  }

  async sendEmail(userId: string, template: string, data: any): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user?.email) {
      return;
    }

    switch (template) {
      case 'wallet_topup':
        await this.emailService.sendWalletTopupEmail(
          user.email,
          data.amount,
          data.transactionId,
        );
        break;
      case 'order_confirmation':
        await this.emailService.sendOrderConfirmation(
          user.email,
          data.orderId,
          data.orderDetails,
        );
        break;
      default:
        // Generic email
        await this.emailService.sendEmail(
          user.email,
          data.subject || 'Notification',
          data.html || data.message || '',
        );
    }
  }

  async sendNotification(
    userId: string,
    title: string,
    body: string,
    type?: string,
    metadata?: any,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        metadata,
      },
    });

    await this.sendPushToUser(userId, title, body, metadata);
  }

  async sendOrderNotification(
    userId: string,
    templateKey: string,
    orderId: string,
    orderStatus: string,
  ): Promise<void> {
    try {
      const template = await this.getNotificationTemplate(templateKey);
      if (!template) {
        return;
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });

      if (!user?.fcmToken) {
        return;
      }

      await this.fcmService.sendNotification(
        user.fcmToken,
        template.subject,
        template.message,
        {
          orderId,
          orderStatus,
        },
      );
    } catch (error) {
      console.error(`Failed to send order notification:`, error);
    }
  }

  async sendVendorNotification(
    vendorId: string,
    templateKey: string,
    orderId: string,
    orderStatus: string,
  ): Promise<void> {
    try {
      const template = await this.getNotificationTemplate(templateKey);
      if (!template) {
        return;
      }

      const vendor = await this.prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { fcmToken: true },
      });

      if (!vendor?.fcmToken) {
        return;
      }

      await this.fcmService.sendNotification(
        vendor.fcmToken,
        template.subject,
        template.message,
        {
          orderId,
          orderStatus,
        },
      );
    } catch (error) {
      console.error(`Failed to send vendor notification:`, error);
    }
  }

  private async getNotificationTemplate(
    key: string,
  ): Promise<{ subject: string; message: string } | null> {
    try {
      const setting = await this.prisma.setting.findUnique({
        where: { key },
      });

      if (!setting) {
        return null;
      }

      const parsed = JSON.parse(setting.value);
      return {
        subject: parsed.subject || '',
        message: parsed.message || '',
      };
    } catch (error) {
      console.error(`Failed to parse notification template ${key}:`, error);
      return null;
    }
  }
}
