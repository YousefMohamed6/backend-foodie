import { Process, Processor } from '@nestjs/bull';
import { NotificationService } from '../services/notification.service';

@Processor('email')
export class SendEmailProcessor {
  constructor(private readonly notificationService: NotificationService) {}

  @Process()
  async handleEmailJob(job: any) {
    const { userId, template, data } = job.data || {};
    if (!userId || !template) {
      return;
    }
    await this.notificationService.sendEmail(userId, template, data);
  }
}
