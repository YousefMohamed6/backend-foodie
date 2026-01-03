import { registerAs } from '@nestjs/config';

export default registerAs('fcm', () => ({
  serviceAccount: process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null,
  projectId: process.env.FIREBASE_PROJECT_ID,
}));
