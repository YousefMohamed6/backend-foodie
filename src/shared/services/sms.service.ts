import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: twilio.Twilio | null = null;

  constructor(private configService: ConfigService) {
    const smsConfig = this.configService.get('sms');

    if (
      smsConfig?.twilioAccountSid &&
      smsConfig?.twilioAuthToken &&
      smsConfig.twilioAccountSid.startsWith('AC')
    ) {
      try {
        this.twilioClient = twilio(
          smsConfig.twilioAccountSid,
          smsConfig.twilioAuthToken,
        );
        this.logger.log('Twilio SMS service initialized');
      } catch (error) {
        this.logger.error('Failed to initialize Twilio client:', error);
        this.logger.warn(
          'SMS service not configured. SMS will be logged to console.',
        );
      }
    } else {
      this.logger.warn(
        'SMS service not configured. SMS will be logged to console.',
      );
    }
  }

  async sendSms(to: string, message: string): Promise<void> {
    const smsConfig = this.configService.get('sms');

    if (!this.twilioClient) {
      this.logger.log(`[SMS] To: ${to}, Message: ${message}`);
      return;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from: smsConfig.twilioPhoneNumber,
        to,
      });
      this.logger.log(`SMS sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
      throw new Error('Failed to send SMS');
    }
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<void> {
    const message = `Your verification code is: ${otp}. Valid for 5 minutes.`;
    await this.sendSms(phoneNumber, message);
  }
}
