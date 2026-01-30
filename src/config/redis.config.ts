import { registerAs } from '@nestjs/config';
import { EnvKeys } from '../common/constants/env-keys.constants';

export default registerAs('redis', () => {
  const host = process.env[EnvKeys.REDIS_HOST] || 'localhost';
  const port = parseInt(process.env[EnvKeys.REDIS_PORT] || '6379', 10);
  const password = process.env[EnvKeys.REDIS_PASSWORD];
  const url = process.env[EnvKeys.REDIS_URL] || `redis://${password ? ':' + password + '@' : ''}${host}:${port}`;

  return {
    host,
    port,
    url,
    password,
    db: parseInt(process.env[EnvKeys.REDIS_DB] || '0', 10),
  };
});
