import { registerAs } from '@nestjs/config';
import { EnvKeys } from '../common/constants/env-keys.constants';

export default registerAs('storage', () => ({
  provider: process.env[EnvKeys.STORAGE_PROVIDER] || 'local', // 'local' | 's3' | 'cloudinary'
  useLocalStorage: process.env[EnvKeys.USE_LOCAL_STORAGE] === 'true',

  // AWS S3
  awsAccessKeyId: process.env[EnvKeys.AWS_ACCESS_KEY_ID],
  awsSecretAccessKey: process.env[EnvKeys.AWS_SECRET_ACCESS_KEY],
  awsRegion: process.env[EnvKeys.AWS_REGION] || 'us-east-1',
  awsS3Bucket: process.env[EnvKeys.AWS_S3_BUCKET],

  // Local storage
  uploadDir: process.env[EnvKeys.UPLOAD_DIR] || 'uploads',
  appUrl: process.env[EnvKeys.APP_URL] || 'http://localhost:3000',
}));
