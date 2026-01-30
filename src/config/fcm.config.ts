import { registerAs } from '@nestjs/config';
import { EnvKeys } from '../common/constants/env-keys.constants';

export default registerAs('fcm', () => ({
  serviceAccount: (() => {
    try {
      const sa = process.env[EnvKeys.FIREBASE_SERVICE_ACCOUNT];
      return sa ? JSON.parse(sa) : null;
    } catch (e) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', e);
      return null;
    }
  })(),
  projectId: process.env[EnvKeys.FIREBASE_PROJECT_ID],
}));
