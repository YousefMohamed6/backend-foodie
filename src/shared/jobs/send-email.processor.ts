import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { EmailService } from '../services/email.service';

@Processor('email')
export class SendEmailProcessor {
  private readonly logger = new Logger(SendEmailProcessor.name);

  constructor(private emailService: EmailService) {}

  @Process('send')
  async handleSendEmail(job: Job<{ to: string; subject: string; html: string; text?: string }>) {
    this.logger.log(`Processing email job ${job.id}`);
    const { to, subject, html, text } = job.data;
    
    try {
      await this.emailService.sendEmail(to, subject, html, text);
      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }
}

