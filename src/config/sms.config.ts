import { registerAs } from '@nestjs/config';
import { EnvKeys } from '../common/constants/env-keys.constants';

export default registerAs('sms', () => ({
  provider: process.env[EnvKeys.SMS_PROVIDER] || 'twilio', // 'twilio' | 'sns' | 'mock'

  // Twilio
  twilioAccountSid: process.env[EnvKeys.TWILIO_ACCOUNT_SID],
  twilioAuthToken: process.env[EnvKeys.TWILIO_AUTH_TOKEN],
  twilioPhoneNumber: process.env[EnvKeys.TWILIO_PHONE_NUMBER],

  // AWS SNS
  snsRegion: process.env[EnvKeys.SNS_REGION] || 'us-east-1',
  snsAccessKeyId: process.env[EnvKeys.SNS_ACCESS_KEY_ID],
  snsSecretAccessKey: process.env[EnvKeys.SNS_SECRET_ACCESS_KEY],
}));
