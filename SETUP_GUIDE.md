# Setup Guide

This guide will help you configure and run the Foodie Restaurant backend with all the new features.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Redis (optional, for queues and caching)
- FFmpeg (optional, for video thumbnail generation)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/foodie_db"

# Application
PORT=3000
APP_URL=http://localhost:3000
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d

# Redis (Optional - for queues and caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# Storage
STORAGE_PROVIDER=local
USE_LOCAL_STORAGE=true
# For S3:
# AWS_ACCESS_KEY_ID=your-access-key
# AWS_SECRET_ACCESS_KEY=your-secret-key
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=your-bucket-name

# Email (Optional)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@foodie.com

# SMS (Optional - Twilio)
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase Cloud Messaging (Optional)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_PROJECT_ID=your-project-id

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key
APPLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/apple/callback
```

## Database Setup

1. Generate Prisma client:
```bash
npx prisma generate
```

2. Run database migrations:
```bash
npx prisma migrate dev
```

3. (Optional) Seed the database:
```bash
# Seeders will run automatically on module initialization
npm run start:dev
```

## Running the Application

### Development
```bash
npm run start:dev
```

The application will be available at:
- API: `http://localhost:3000/api/v1`
- Swagger Documentation: `http://localhost:3000/api`

### Production
```bash
npm run build
npm run start:prod
```

## Service Configuration

### Redis (Optional but Recommended)

Redis is used for:
- WebSocket scaling
- Rate limiting
- **Global Settings & Category Caching** (Highly Recommended for Performance)
- Job queues (BullMQ)

If Redis is not available, the application will:
- Log jobs to console instead of processing them
- Use in-memory WebSocket connections (single instance only)
- Use in-memory rate limiting

To install Redis:
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:alpine
```

### File Storage

**Local Storage (Default)**
- Files are stored in the `uploads/` directory
- Accessible via `http://localhost:3000/uploads/...`

**AWS S3**
1. Create an S3 bucket
2. Configure IAM user with S3 permissions
3. Set environment variables:
   - `STORAGE_PROVIDER=s3`
   - `USE_LOCAL_STORAGE=false`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `AWS_S3_BUCKET`

### Email Service

**SMTP (Gmail Example)**
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASSWORD`

**SendGrid**
1. Create a SendGrid account
2. Get API key
3. Set `EMAIL_PROVIDER=sendgrid`
4. Set `SENDGRID_API_KEY`

### SMS Service (Twilio)

1. Create a Twilio account: https://www.twilio.com/
2. Get Account SID and Auth Token from dashboard
3. Purchase a phone number
4. Set environment variables

### Firebase Cloud Messaging

1. Create a Firebase project: https://console.firebase.google.com/
2. Generate a service account key:
   - Project Settings → Service Accounts → Generate New Private Key
3. Copy the JSON content and set as `FIREBASE_SERVICE_ACCOUNT` (stringified)
4. Set `FIREBASE_PROJECT_ID`

### OAuth Setup

**Google OAuth**
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

**Apple Sign-In**
1. Go to Apple Developer Portal
2. Create App ID and Service ID
3. Generate a private key
4. Configure environment variables

## Testing the Setup

1. **Check API Health:**
```bash
curl http://localhost:3000/api/v1
```

2. **View Swagger Documentation:**
Open `http://localhost:3000/api` in your browser

3. **Test Authentication:**
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

4. **Test Delivery Charge Calculation:**
```bash
curl -X GET "http://localhost:3000/api/v1/delivery/charge?vendorId=xxx&latitude=30.0444&longitude=31.2357" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

5. **Test Payment Settings:**
```bash
curl -X GET http://localhost:3000/api/v1/payment/settings \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Port Already in Use
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Redis Connection Issues
- Check if Redis is running: `redis-cli ping`
- Verify Redis URL in environment variables
- Application will continue without Redis (with limited functionality)

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running
- Run migrations: `npx prisma migrate dev`

### Build Errors
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure production database
- [ ] Set up Redis cluster
- [ ] Configure S3 or production storage
- [ ] Set up email service (SMTP/SendGrid/SES)
- [ ] Configure SMS service (if needed)
- [ ] Set up Firebase for push notifications
- [ ] Configure OAuth providers
- [ ] Set up monitoring and logging
- [ ] Configure CORS for production domains
- [ ] Set up SSL/TLS certificates
- [ ] Configure rate limiting thresholds
- [ ] Set up backup strategy
- [ ] Configure environment-specific variables

## Support

For issues or questions, refer to:
- `IMPLEMENTATION_SUMMARY.md` - Feature documentation
- Swagger API documentation at `/api`

