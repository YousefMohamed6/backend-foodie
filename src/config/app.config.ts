import { registerAs } from '@nestjs/config';
import { EnvKeys } from '../common/constants/env-keys.constants';

export default registerAs('app', () => ({
  port: parseInt(process.env[EnvKeys.PORT] || '3000', 10),
  jwtSecret: process.env[EnvKeys.JWT_SECRET],
  jwtExpiration: process.env[EnvKeys.JWT_EXPIRATION] || '15m',
  jwtRefreshSecret: process.env[EnvKeys.JWT_REFRESH_SECRET],
  jwtRefreshExpiration: process.env[EnvKeys.JWT_REFRESH_EXPIRATION] || '7d',
  url: process.env[EnvKeys.APP_URL] || 'http://localhost:3000',
  baseUrl: process.env[EnvKeys.APP_BASE_URL] || 'http://localhost:3001',
  secureApiKey: process.env[EnvKeys.SECURE_API_KEY],
}));
