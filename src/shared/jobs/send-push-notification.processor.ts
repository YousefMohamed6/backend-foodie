import { Process, Processor } from '@nestjs/bull';
import { PrismaService } from '../../prisma/prisma.service';
import { FcmService } from '../services/fcm.service';

@Processor('push-notification')
export class SendPushNotificationProcessor {
  constructor(
    private readonly fcmService: FcmService,
    private readonly prisma: PrismaService,
  ) {}

  @Process()
  async handlePushNotificationJob(job: any) {
    const { userId, title, body, data } = job.data || {};
    if (!userId || !title || !body) {
      return;
    }

    // Get user's FCM token
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (!user?.fcmToken) {
      return;
    }

    // Send notification
    await this.fcmService.sendNotification(user.fcmToken, title, body, data);
  }
}
