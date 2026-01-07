import { Process, Processor } from '@nestjs/bull';
import { EmailService } from '../services/email.service';

@Processor('email')
export class SendEmailProcessor {
  constructor(private readonly emailService: EmailService) { }

  @Process()
  async handleEmailJob(job: any) {
    const { to, subject, body } = job.data || {};
    if (!to || !subject || !body) {
      return;
    }
    await this.emailService.sendEmail(to, subject, body);
  }
}
