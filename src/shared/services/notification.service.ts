import { Injectable } from '@nestjs/common';
import { FcmService } from './fcm.service';
import { EmailService } from './email.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(
    private fcmService: FcmService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

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

  async sendEmail(
    userId: string,
    template: string,
    data: any,
  ): Promise<void> {
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
    // Create notification record
    await this.prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        metadata,
      },
    });

    // Send push notification
    await this.sendPushToUser(userId, title, body, metadata);
  }
}

