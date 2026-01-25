import { registerAs } from '@nestjs/config';
import { EnvKeys } from '../common/constants/env-keys.constants';

export default registerAs('database', () => ({
  host: process.env[EnvKeys.DATABASE_HOST],
  port: parseInt(process.env[EnvKeys.DATABASE_PORT] || '5432', 10),
  username: process.env[EnvKeys.DATABASE_USER],
  password: process.env[EnvKeys.DATABASE_PASSWORD],
  name: process.env[EnvKeys.DATABASE_NAME],
}));
