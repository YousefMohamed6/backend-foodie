import { registerAs } from '@nestjs/config';
import { EnvKeys } from '../common/constants/env-keys.constants';

export default registerAs('redis', () => ({
  host: process.env[EnvKeys.REDIS_HOST] || 'localhost',
  port: parseInt(process.env[EnvKeys.REDIS_PORT] || '6379', 10),
  url: process.env[EnvKeys.REDIS_URL] || 'redis://localhost:6379',
  password: process.env[EnvKeys.REDIS_PASSWORD],
  db: parseInt(process.env[EnvKeys.REDIS_DB] || '0', 10),
}));
