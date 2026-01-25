import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtRefreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  url: process.env.APP_URL || 'http://localhost:3000',
  baseUrl: process.env.APP_BASE_URL || 'http://localhost:3001',
}));
