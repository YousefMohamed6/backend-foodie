import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { FcmService } from '../services/fcm.service';

@Processor('push-notification')
export class SendPushNotificationProcessor {
  private readonly logger = new Logger(SendPushNotificationProcessor.name);

  constructor(private fcmService: FcmService) {}

  @Process('send')
  async handleSendPush(job: Job<{ fcmToken: string; title: string; body: string; data?: any }>) {
    this.logger.log(`Processing push notification job ${job.id}`);
    const { fcmToken, title, body, data } = job.data;
    
    try {
      await this.fcmService.sendNotification(fcmToken, title, body, data);
      this.logger.log(`Push notification sent successfully`);
    } catch (error) {
      this.logger.error(`Failed to send push notification:`, error);
      throw error;
    }
  }
}

