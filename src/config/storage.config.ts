import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  provider: process.env.STORAGE_PROVIDER || 'local', // 'local' | 's3' | 'cloudinary'
  useLocalStorage: process.env.USE_LOCAL_STORAGE === 'true',

  // AWS S3
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsS3Bucket: process.env.AWS_S3_BUCKET,

  // Local storage
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
}));
