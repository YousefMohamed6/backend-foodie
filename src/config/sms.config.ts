import { registerAs } from '@nestjs/config';

export default registerAs('sms', () => ({
  provider: process.env.SMS_PROVIDER || 'twilio', // 'twilio' | 'sns' | 'mock'
  
  // Twilio
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
  
  // AWS SNS
  snsRegion: process.env.SNS_REGION || 'us-east-1',
  snsAccessKeyId: process.env.SNS_ACCESS_KEY_ID,
  snsSecretAccessKey: process.env.SNS_SECRET_ACCESS_KEY,
}));

