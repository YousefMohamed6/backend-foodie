import { Process, Processor } from '@nestjs/bull';
import { NotificationService } from '../services/notification.service';

@Processor('push-notification')
export class SendPushNotificationProcessor {
  constructor(private readonly notificationService: NotificationService) {}

  @Process()
  async handlePushNotificationJob(job: any) {
    const { userId, title, body, type, metadata } = job.data || {};
    if (!userId || !title || !body) {
      return;
    }
    await this.notificationService.sendNotification(
      userId,
      title,
      body,
      type,
      metadata,
    );
  }
}
