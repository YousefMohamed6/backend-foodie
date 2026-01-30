import { registerAs } from '@nestjs/config';
import { EnvKeys } from '../common/constants/env-keys.constants';

export default registerAs('app', () => ({
  port: parseInt(process.env[EnvKeys.PORT] || '3001', 10),
  jwtSecret: process.env[EnvKeys.JWT_SECRET],
  jwtExpiration: process.env[EnvKeys.JWT_EXPIRATION] || '15m',
  jwtRefreshSecret: process.env[EnvKeys.JWT_REFRESH_SECRET],
  jwtRefreshExpiration: process.env[EnvKeys.JWT_REFRESH_EXPIRATION] || '7d',
  url: process.env[EnvKeys.APP_URL] || 'http://localhost:3001',
  baseUrl: process.env[EnvKeys.APP_BASE_URL] || 'http://localhost:3001',
  secureApiKey: process.env[EnvKeys.SECURE_API_KEY],
  google: {
    allowedClientIds: (() => {
      try {
        const ids = process.env[EnvKeys.ALLOWED_GOOGLE_CLIENT_IDS];
        return ids ? JSON.parse(ids) : [];
      } catch (e) {
        console.error('Error parsing ALLOWED_GOOGLE_CLIENT_IDS:', e);
        return [];
      }
    })(),
  },
  apple: {
    clientId: process.env[EnvKeys.APPLE_CLIENT_ID],
  },
}));
