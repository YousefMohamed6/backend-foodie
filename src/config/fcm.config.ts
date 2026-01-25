import { registerAs } from '@nestjs/config';
import { EnvKeys } from '../common/constants/env-keys.constants';

export default registerAs('fcm', () => ({
  serviceAccount: process.env[EnvKeys.FIREBASE_SERVICE_ACCOUNT]
    ? JSON.parse(process.env[EnvKeys.FIREBASE_SERVICE_ACCOUNT] as string)
    : null,
  projectId: process.env[EnvKeys.FIREBASE_PROJECT_ID],
}));
