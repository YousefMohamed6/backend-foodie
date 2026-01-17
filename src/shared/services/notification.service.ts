import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FcmService } from '../../shared/services/fcm.service';



@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private fcmService: FcmService,
  ) { }

  /**
   * Get user's preferred language or default to Arabic
   */
  private async getUserLanguage(userId: string): Promise<'ar' | 'en'> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferredLanguage: true },
    });

    // Default to Arabic if not set or invalid
    const lang = user?.preferredLanguage?.toLowerCase();
    return lang === 'en' ? 'en' : 'ar';
  }


  /**
   * Get notification template with user's preferred language
   */
  async getLocalizedNotification(
    userId: string,
    templateKey: string,
    data?: Record<string, any>,
  ): Promise<{ subject: string; message: string }> {
    // Get user's preferred language
    const language = await this.getUserLanguage(userId);

    // Fetch template from notification templates
    const template = await this.prisma.notificationTemplate.findUnique({
      where: { key: templateKey },
    });

    if (!template) {
      // Fallback if template not found
      return {
        subject: 'Notification',
        message: 'You have a new notification',
      };
    }

    try {
      let subject = language === 'en' ? template.subjectEn : template.subjectAr;
      let message = language === 'en' ? template.bodyEn : template.bodyAr;

      // Ensure we have a string, fallback if missing in preferred language
      subject = subject || template.subjectAr || template.subjectEn;
      message = message || template.bodyAr || template.bodyEn;

      if (data) {
        Object.keys(data).forEach((key) => {
          const placeholder = `{${key}}`;
          // Replace all occurrences
          message = message.replace(new RegExp(placeholder, 'g'), data[key]);
          subject = subject.replace(new RegExp(placeholder, 'g'), data[key]);
        });
      }

      return { subject, message };
    } catch (error) {
      // Should not happen with direct column access, but keeping safety
      return {
        subject: 'Notification',
        message: 'You have a new notification',
      };
    }
  }

  /**
   * Send order notification to user with their preferred language
   */
  async sendOrderNotification(
    userId: string,
    templateKey: string,
    orderData?: Record<string, any>,
  ): Promise<void> {
    // Get user with FCM token
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true, preferredLanguage: true },
    });

    if (!user?.fcmToken) {
      return;
    }

    // Get localized notification
    const notification = await this.getLocalizedNotification(
      userId,
      templateKey,
      orderData,
    );

    // Send notification
    await this.fcmService.sendNotification(
      user.fcmToken,
      notification.subject,
      notification.message,
      orderData,
    );

    // Optionally save to notifications table
    await this.prisma.notification.create({
      data: {
        userId,
        title: notification.subject,
        body: notification.message,
        metadata: orderData,
      },
    });
  }

  /**
   * Send notification to multiple users with their individual language preferences
   */
  async sendBulkNotifications(
    userIds: string[],
    templateKey: string,
    data?: Record<string, any>,
  ): Promise<void> {
    for (const userId of userIds) {
      try {
        await this.sendOrderNotification(userId, templateKey, data);
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
      }
    }
  }

  /**
   * Send notification to all users of a specific role
   */
  async sendToRole(
    role: UserRole,
    title: { en: string; ar: string },
    message: { en: string; ar: string },
    data?: Record<string, any>,
  ): Promise<{ sent: number; failed: number }> {
    // Get all active users with the specified role and FCM token
    const users = await this.prisma.user.findMany({
      where: {
        role,
        isActive: true,
        fcmToken: { not: null },
      },
      select: {
        id: true,
        fcmToken: true,
        preferredLanguage: true,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const language =
          user.preferredLanguage?.toLowerCase() === 'en' ? 'en' : 'ar';

        // Send notification in user's preferred language
        await this.fcmService.sendNotification(
          user.fcmToken!,
          title[language],
          message[language],
          data,
        );

        // Save to notifications table
        await this.prisma.notification.create({
          data: {
            userId: user.id,
            title: title[language],
            body: message[language],
            metadata: data,
          },
        });

        sent++;
      } catch (error) {
        console.error(`Failed to send notification to user ${user.id}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Send custom notification to specific users
   */
  async sendCustomNotification(
    userIds: string[],
    title: { en: string; ar: string },
    message: { en: string; ar: string },
    data?: Record<string, any>,
  ): Promise<{ sent: number; failed: number }> {
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
        fcmToken: { not: null },
      },
      select: {
        id: true,
        fcmToken: true,
        preferredLanguage: true,
      },
    });

    let sent = 0;
    let failed = 0;

    for (const user of users) {
      try {
        const language =
          user.preferredLanguage?.toLowerCase() === 'en' ? 'en' : 'ar';

        await this.fcmService.sendNotification(
          user.fcmToken!,
          title[language],
          message[language],
          data,
        );

        await this.prisma.notification.create({
          data: {
            userId: user.id,
            title: title[language],
            body: message[language],
            metadata: data,
          },
        });

        sent++;
      } catch (error) {
        console.error(`Failed to send notification to user ${user.id}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }
}
