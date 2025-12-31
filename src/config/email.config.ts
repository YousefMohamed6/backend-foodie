import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  provider: process.env.EMAIL_PROVIDER || 'smtp', // 'smtp' | 'sendgrid' | 'ses'
  
  // SMTP
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpFrom: process.env.SMTP_FROM || 'noreply@foodie.com',
  
  // SendGrid
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  
  // AWS SES
  sesRegion: process.env.SES_REGION || 'us-east-1',
  sesAccessKeyId: process.env.SES_ACCESS_KEY_ID,
  sesSecretAccessKey: process.env.SES_SECRET_ACCESS_KEY,
}));

