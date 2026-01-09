import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FcmService } from '../../shared/services/fcm.service';

interface NotificationTemplate {
  en: {
    subject: string;
    message: string;
  };
  ar: {
    subject: string;
    message: string;
  };
}

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private fcmService: FcmService,
  ) {}

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

    // Fetch template from settings
    const setting = await this.prisma.setting.findUnique({
      where: { key: templateKey },
    });

    if (!setting) {
      // Fallback if template not found
      return {
        subject: 'Notification',
        message: 'You have a new notification',
      };
    }

    try {
      const template: NotificationTemplate = JSON.parse(setting.value);

      // Return the message in user's preferred language
      // Fallback to Arabic if the language doesn't exist in template
      const content = template[language] || template.ar || template.en;

      if (data) {
        Object.keys(data).forEach((key) => {
          const placeholder = `{${key}}`;
          content.message = content.message.replace(
            new RegExp(placeholder, 'g'),
            data[key],
          );
          content.subject = content.subject.replace(
            new RegExp(placeholder, 'g'),
            data[key],
          );
        });
      }

      return content;
    } catch (error) {
      // If JSON parse fails or structure is invalid
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
