import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private firebaseAdmin: admin.app.App | null = null;

  constructor(private configService: ConfigService) {
    const fcmConfig = this.configService.get('fcm');

    if (
      fcmConfig?.serviceAccount &&
      fcmConfig.serviceAccount.private_key &&
      fcmConfig.serviceAccount.project_id &&
      fcmConfig.serviceAccount.client_email
    ) {
      try {
        if (!admin.apps.length) {
          this.firebaseAdmin = admin.initializeApp({
            credential: admin.credential.cert(fcmConfig.serviceAccount),
          });
        } else {
          this.firebaseAdmin = admin.app();
        }
        this.logger.log('Firebase Admin SDK initialized');
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin SDK:', error);
        this.logger.warn(
          'FCM service not configured. Push notifications will be logged to console.',
        );
      }
    } else {
      this.logger.warn(
        'FCM service not configured. Push notifications will be logged to console.',
      );
    }
  }

  async sendNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    if (!this.firebaseAdmin) {
      this.logger.log(
        `[FCM] Token: ${fcmToken}, Title: ${title}, Body: ${body}`,
      );
      return;
    }

    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data
          ? Object.fromEntries(
              Object.entries(data).map(([k, v]) => [k, String(v)]),
            )
          : {},
        android: {
          priority: 'high',
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
        },
      };

      await admin.messaging().send(message);
      this.logger.log(`Push notification sent successfully to ${fcmToken}`);
    } catch (error: any) {
      this.logger.error(`Failed to send FCM notification:`, error);

      // Handle invalid tokens
      if (
        error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered'
      ) {
        this.logger.warn(`Invalid FCM token: ${fcmToken}`);
        // Token should be removed from database
      }
    }
  }

  async sendMulticast(
    fcmTokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<admin.messaging.BatchResponse | null> {
    if (!this.firebaseAdmin) {
      this.logger.log(
        `[FCM Multicast] Tokens: ${fcmTokens.length}, Title: ${title}, Body: ${body}`,
      );
      return null;
    }

    const message: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: {
        title,
        body,
      },
      data: data
        ? Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)]),
          )
        : {},
      android: {
        priority: 'high',
      },
      apns: {
        headers: {
          'apns-priority': '10',
        },
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(
        `Multicast notification sent. Success: ${response.successCount}, Failed: ${response.failureCount}`,
      );
      return response;
    } catch (error) {
      this.logger.error('Failed to send multicast notification:', error);
      return null;
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.firebaseAdmin) {
      this.logger.log(
        `[FCM] Subscribe ${tokens.length} tokens to topic: ${topic}`,
      );
      return;
    }

    try {
      await admin.messaging().subscribeToTopic(tokens, topic);
      this.logger.log(`Subscribed ${tokens.length} tokens to topic: ${topic}`);
    } catch (error) {
      this.logger.error('Failed to subscribe to topic:', error);
    }
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    if (!this.firebaseAdmin) {
      this.logger.log(
        `[FCM Topic] Topic: ${topic}, Title: ${title}, Body: ${body}`,
      );
      return;
    }

    const message: admin.messaging.Message = {
      topic,
      notification: {
        title,
        body,
      },
      data: data
        ? Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)]),
          )
        : {},
    };

    try {
      await admin.messaging().send(message);
      this.logger.log(`Topic notification sent to: ${topic}`);
    } catch (error) {
      this.logger.error('Failed to send topic notification:', error);
    }
  }
}
