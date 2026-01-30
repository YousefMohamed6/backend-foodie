export class EnvKeys {
    static readonly NODE_ENV = 'NODE_ENV';
    static readonly PORT = 'PORT';
    static readonly DATABASE_URL = 'DATABASE_URL';
    static readonly DATABASE_HOST = 'DATABASE_HOST';
    static readonly DATABASE_PORT = 'DATABASE_PORT';
    static readonly DATABASE_USER = 'DATABASE_USER';
    static readonly DATABASE_PASSWORD = 'DATABASE_PASSWORD';
    static readonly DATABASE_NAME = 'DATABASE_NAME';

    // App Config
    static readonly APP_URL = 'APP_URL';
    static readonly APP_BASE_URL = 'APP_BASE_URL';

    // Security & Auth
    static readonly JWT_SECRET = 'JWT_SECRET';
    static readonly JWT_EXPIRATION = 'JWT_EXPIRATION';
    static readonly JWT_REFRESH_SECRET = 'JWT_REFRESH_SECRET';
    static readonly JWT_REFRESH_EXPIRATION = 'JWT_REFRESH_EXPIRATION';
    static readonly SESSION_SECRET = 'SESSION_SECRET';
    static readonly ALLOWED_ORIGINS = 'ALLOWED_ORIGINS';
    static readonly SECURE_API_KEY = 'SECURE_API_KEY';
    static readonly ALLOWED_GOOGLE_CLIENT_IDS = 'ALLOWED_GOOGLE_CLIENT_IDS';
    static readonly APPLE_CLIENT_ID = 'APPLE_CLIENT_ID';

    // Services
    static readonly GOOGLE_MAPS_API_KEY = 'GOOGLE_MAPS_API_KEY';
    static readonly REDIS_HOST = 'REDIS_HOST';
    static readonly REDIS_PORT = 'REDIS_PORT';
    static readonly REDIS_URL = 'REDIS_URL';
    static readonly REDIS_PASSWORD = 'REDIS_PASSWORD';
    static readonly REDIS_DB = 'REDIS_DB';

    // Firebase/FCM
    static readonly FIREBASE_PROJECT_ID = 'FIREBASE_PROJECT_ID';
    static readonly FIREBASE_CLIENT_EMAIL = 'FIREBASE_CLIENT_EMAIL';
    static readonly FIREBASE_PRIVATE_KEY = 'FIREBASE_PRIVATE_KEY';
    static readonly FIREBASE_SERVICE_ACCOUNT = 'FIREBASE_SERVICE_ACCOUNT';

    // Email
    static readonly EMAIL_PROVIDER = 'EMAIL_PROVIDER';
    static readonly SMTP_HOST = 'SMTP_HOST';
    static readonly SMTP_PORT = 'SMTP_PORT';
    static readonly SMTP_SECURE = 'SMTP_SECURE';
    static readonly SMTP_USER = 'SMTP_USER';
    static readonly SMTP_PASSWORD = 'SMTP_PASSWORD';
    static readonly SMTP_FROM = 'SMTP_FROM';
    static readonly SENDGRID_API_KEY = 'SENDGRID_API_KEY';
    static readonly SES_REGION = 'SES_REGION';
    static readonly SES_ACCESS_KEY_ID = 'SES_ACCESS_KEY_ID';
    static readonly SES_SECRET_ACCESS_KEY = 'SES_SECRET_ACCESS_KEY';

    // SMS
    static readonly SMS_PROVIDER = 'SMS_PROVIDER';
    static readonly TWILIO_ACCOUNT_SID = 'TWILIO_ACCOUNT_SID';
    static readonly TWILIO_AUTH_TOKEN = 'TWILIO_AUTH_TOKEN';
    static readonly TWILIO_PHONE_NUMBER = 'TWILIO_PHONE_NUMBER';
    static readonly SNS_REGION = 'SNS_REGION';
    static readonly SNS_ACCESS_KEY_ID = 'SNS_ACCESS_KEY_ID';
    static readonly SNS_SECRET_ACCESS_KEY = 'SNS_SECRET_ACCESS_KEY';

    // Storage
    static readonly STORAGE_PROVIDER = 'STORAGE_PROVIDER';
    static readonly USE_LOCAL_STORAGE = 'USE_LOCAL_STORAGE';
    static readonly AWS_ACCESS_KEY_ID = 'AWS_ACCESS_KEY_ID';
    static readonly AWS_SECRET_ACCESS_KEY = 'AWS_SECRET_ACCESS_KEY';
    static readonly AWS_REGION = 'AWS_REGION';
    static readonly AWS_S3_BUCKET = 'AWS_S3_BUCKET';
    static readonly UPLOAD_DIR = 'UPLOAD_DIR';
}
