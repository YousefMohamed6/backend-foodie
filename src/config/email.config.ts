import { registerAs } from '@nestjs/config';
import { EnvKeys } from '../common/constants/env-keys.constants';

export default registerAs('email', () => ({
  provider: process.env[EnvKeys.EMAIL_PROVIDER] || 'smtp', // 'smtp' | 'sendgrid' | 'ses'

  // SMTP
  smtpHost: process.env[EnvKeys.SMTP_HOST] || 'smtp.gmail.com',
  smtpPort: parseInt(process.env[EnvKeys.SMTP_PORT] || '587', 10),
  smtpSecure: process.env[EnvKeys.SMTP_SECURE] === 'true',
  smtpUser: process.env[EnvKeys.SMTP_USER],
  smtpPassword: process.env[EnvKeys.SMTP_PASSWORD],
  smtpFrom: process.env[EnvKeys.SMTP_FROM] || 'noreply@foodie.com',

  // SendGrid
  sendgridApiKey: process.env[EnvKeys.SENDGRID_API_KEY],

  // AWS SES
  sesRegion: process.env[EnvKeys.SES_REGION] || 'us-east-1',
  sesAccessKeyId: process.env[EnvKeys.SES_ACCESS_KEY_ID],
  sesSecretAccessKey: process.env[EnvKeys.SES_SECRET_ACCESS_KEY],
}));
