# Foodie Vendor Backend Service (NestJS)

[![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

The production-ready API service powering the Foodie ecosystem. This backend provides secure, scalable, and type-safe endpoints for Vendor, Driver, and Customer applications, with a comprehensive feature set for food delivery operations.

---

## 🚀 Key Features

### 🔐 **Security-First Authentication**
- **Dual-Token System**: Short-lived access tokens (15m) + long-lived refresh tokens (7d)
- **🆕 Secure Social Login**: Cryptographic verification of Google & Apple tokens
  - ✅ Token signature validation using Google/Apple public keys
  - ✅ Prevention of identity spoofing and account takeover
  - ✅ Native mobile SDK support (no browser required)
- **Token Rotation**: Automatic refresh token rotation to prevent replay attacks
- **Device Binding**: Tokens bound to specific devices via deviceId and userAgent
- **Theft Detection**: Automatic revocation of all tokens on suspicious activity
- **Bcrypt Hashing**: Secure password storage with salt rounds

### 💰 **Financial Management**
- **ACID-Compliant Wallet System**: Secure transaction handling with atomic database transactions
- **Multi-Gateway Payments**: Stripe, PayPal, Razorpay, Fawaterak support
- **Cashback System**: Automated cashback calculation and distribution
- **Gift Cards**: Digital gift card management
- **Withdrawal System**: Vendor payout management

### 📍 **Geospatial Services**
- **PostGIS Integration**: Advanced location-based queries
- **Nearest Vendor Discovery**: Distance-based vendor search
- **Delivery Zone Validation**: Polygon-based zone checking
- **Dynamic Delivery Charges**: Distance-calculated pricing
- **Real-time Driver Tracking**: Live coordinate updates

### 🔔 **Communication & Notifications**
- **Push Notifications**: Firebase Cloud Messaging integration
- **Email Service**: SMTP, SendGrid, and AWS SES support
- **SMS Service**: Twilio integration for OTP and notifications
- **Real-time WebSocket**: Order tracking and live chat
- **Redis Pub/Sub**: Multi-instance WebSocket scaling

### 📦 **File & Media Management**
- **AWS S3 Integration**: Cloud storage for images and videos
- **Local Storage Fallback**: Development-friendly file system storage
- **Image Processing**: Sharp-powered resizing and optimization
- **Video Thumbnails**: FFmpeg-based thumbnail generation

### 🔄 **Background Processing**
- **Bull Queues**: Redis-backed job queues
- **Email Queue**: Asynchronous email sending
- **Notification Queue**: Push notification batching
- **Order Processing**: Automated workflow execution

### 📚 **Documentation**
- **Interactive Swagger**: Auto-generated OpenAPI documentation
- **Compodoc**: Structural documentation with dependency graphs
- **Architecture Guides**: Comprehensive technical documentation

---

## 🛠 Tech Stack

### Core Framework
- **NestJS** (v11) - Progressive Node.js framework
- **TypeScript** (v5) - Type-safe development
- **Node.js** (v18+) - JavaScript runtime

### Database & ORM
- **PostgreSQL** - Primary relational database
- **PostGIS** - Geospatial extension for PostgreSQL
- **Prisma** (v5) - Next-generation ORM
- **Redis** - Caching, queues, and pub/sub

### Authentication & Security
- **Passport.js** - Authentication middleware
- **JWT** - JSON Web Token implementation
- **google-auth-library** - Google token verification
- **apple-signin-auth** - Apple token verification
- **bcrypt** - Password hashing

### Real-time & Background Jobs
- **Socket.io** - WebSocket communication
- **Bull** - Redis-based job queues
- **@socket.io/redis-adapter** - Multi-instance scaling

### Third-Party Services
- **Firebase Admin SDK** - Push notifications
- **Twilio** - SMS service
- **Nodemailer** - Email service
- **AWS SDK** - S3 file storage
- **Sharp** - Image processing

### Documentation & API
- **Swagger/OpenAPI** - Interactive API docs
- **Compodoc** - Code documentation generator
- **@nestjs/swagger** - Swagger integration

---

## 🏗 Project Architecture

The project follows a clean, modular architecture with clear separation of concerns:

```
backend/
├── src/
│   ├── modules/              # Feature modules
│   │   ├── auth/            # Authentication & social login
│   │   │   ├── services/    # 🆕 GoogleAuthService, AppleAuthService
│   │   │   ├── strategies/  # JWT, Google OAuth, Apple OAuth
│   │   │   └── dto/         # Data transfer objects
│   │   ├── users/           # User management
│   │   ├── vendors/         # Vendor management
│   │   ├── products/        # Product catalog
│   │   ├── orders/          # Order processing
│   │   ├── wallet/          # Financial transactions
│   │   ├── drivers/         # Driver management
│   │   ├── chat/            # Real-time messaging
│   │   └── ...              # 40+ feature modules
│   ├── shared/              # Shared services
│   │   ├── services/        # Email, SMS, FCM, Payment, etc.
│   │   └── jobs/            # Background job processors
│   ├── config/              # Configuration files
│   ├── common/              # Guards, decorators, filters
│   └── prisma/              # Prisma service
├── prisma/
│   ├── schema.prisma        # Database schema (single source of truth)
│   └── migrations/          # Migration history
├── documentation/           # Architecture & API docs
└── test/                    # E2E tests
```

### Key Modules

| Module | Description |
|--------|-------------|
| **auth** | Authentication, social login, JWT management |
| **users** | User profiles, preferences, FCM tokens |
| **vendors** | Vendor profiles, menus, working hours |
| **products** | Product catalog, variants, attributes |
| **orders** | Order lifecycle, status tracking, history |
| **wallet** | Digital wallet, transactions, withdrawals |
| **drivers** | Driver profiles, availability, earnings |
| **payment** | Multi-gateway payment processing |
| **chat** | Real-time messaging between users |
| **notifications** | Push, email, and SMS notifications |
| **maps** | Geolocation, routing, zone validation |

---

## 🔒 Security & Authentication

### Standard Authentication Flow

1. **Registration/Login**: User receives `access_token` (15m) and `refresh_token` (7d)
2. **API Access**: Include `Authorization: Bearer <access_token>` in requests
3. **Token Refresh**: Call `/api/v1/auth/refresh` with `refresh_token` when access token expires
4. **Rotation**: Old refresh token is revoked, new pair issued
5. **Logout**: `/api/v1/auth/logout` revokes all tokens

### 🆕 Social Login (Google & Apple)

#### Mobile App Integration (Flutter)

The backend now supports **secure social login** for Flutter mobile apps using direct platform authentication:

**Key Features:**
- ✅ **Cryptographic Verification**: Tokens verified with Google/Apple servers
- ✅ **Identity Proven**: Email extracted from verified token, not trusted from client
- ✅ **Account Takeover Prevention**: Impossible to spoof identity
- ✅ **Mobile SDK Support**: Compatible with `google_sign_in` and `sign_in_with_apple`
- ✅ **No Browser Required**: Native Android/iOS login dialogs

**How It Works:**
```
1. Flutter app → Native Google/Apple login
2. User authenticates → Receives signed idToken
3. Flutter sends idToken to backend
4. Backend verifies token with Google/Apple ✅
5. If valid → Extract verified email → Login user
6. If invalid → Reject with 401
```

**Documentation:**
- 📄 [**README_SOCIAL_LOGIN.md**](README_SOCIAL_LOGIN.md) - Executive summary
- 🔐 [**SOCIAL_LOGIN_SECURITY_FIX.md**](SOCIAL_LOGIN_SECURITY_FIX.md) - Security improvements
- 📱 [**FLUTTER_INTEGRATION_GUIDE.md**](FLUTTER_INTEGRATION_GUIDE.md) - Flutter setup guide
- 🔧 [**SOCIAL_LOGIN_IMPLEMENTATION.md**](SOCIAL_LOGIN_IMPLEMENTATION.md) - Technical details
- ✅ [**IMPLEMENTATION_CHECKLIST.md**](IMPLEMENTATION_CHECKLIST.md) - Status & checklist

---

## 🚦 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14+) with PostGIS extension
- **Redis** (v6+) for caching and queues
- **npm** or **yarn** package manager

### Installation

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd backend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/foodie_db?schema=public"

# JWT Secrets
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Application
PORT=3000
APP_URL=http://localhost:3000

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Social Login (REQUIRED for Google/Apple Sign-In)
# Get Web Client ID from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your_google_web_client_id
GOOGLE_IOS_CLIENT_ID=your_ios_client_id_if_different

# Get Service ID from: https://developer.apple.com/account/resources/identifiers
APPLE_CLIENT_ID=your_apple_service_id

# Optional: Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Optional: SMS Service (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Optional: Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# Optional: AWS S3 (File Storage)
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your_bucket_name

# Optional: Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### 4. Database Setup

```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# (Optional) Seed database
npx prisma db seed
```

#### 5. Start the Server

```bash
# Development mode (with auto-reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

---

## 📖 API Documentation

### Interactive Documentation

Once the server is running, access:

- **Swagger UI**: http://localhost:3000/api
- **API Base**: http://localhost:3000/api/v1

### Available Endpoints

The API is versioned and follows RESTful conventions:

| Category | Base Path | Description |
|----------|-----------|-------------|
| Authentication | `/api/v1/auth` | Login, register, social login, refresh |
| Users | `/api/v1/users` | User profiles and preferences |
| Vendors | `/api/v1/vendors` | Vendor management |
| Products | `/api/v1/products` | Product catalog |
| Orders | `/api/v1/orders` | Order management |
| Wallet | `/api/v1/wallet` | Financial transactions |
| Drivers | `/api/v1/drivers` | Driver management |
| Payments | `/api/v1/payment` | Payment processing |
| Maps | `/api/v1/maps` | Geocoding and routing |
| Chat | `/api/v1/chat` | Messaging |

### Example: Social Login

```bash
POST /api/v1/auth/social-login
Content-Type: application/json

{
  "provider": "google",
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}

# Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

## 🗄 Database Management

### Prisma Commands

```bash
# Open Prisma Studio (Database GUI)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Generate Prisma Client (after schema changes)
npx prisma generate

# Sync schema without migrations (prototyping)
npx prisma db push
```

### Database Schema

The database schema is defined in `prisma/schema.prisma`. Key models include:

- **User**: User accounts with authentication
- **Vendor**: Restaurant/vendor profiles
- **Product**: Menu items with variants
- **Order**: Order records with line items
- **WalletTransaction**: Financial transactions
- **Driver**: Driver profiles and availability
- **RefreshToken**: Secure token storage
- **Zone**: Delivery zones with PostGIS geometry

---

## 🧪 Testing

### Social Login Testing

Test the secure social login implementation:

```bash
# Run automated verification
./test-social-login.sh
```

### Manual Testing

```bash
# Test with a real Google token from your Flutter app
curl -X POST http://localhost:3000/api/v1/auth/social-login \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "google",
    "idToken": "REAL_TOKEN_FROM_FLUTTER"
  }'

# Expected: 200 OK with access_token
# With fake token: 401 Unauthorized
```

---

## 📚 Documentation Files

### Architecture & Implementation
- [`IMPLEMENTATION_SUMMARY.md`](IMPLEMENTATION_SUMMARY.md) - Feature implementation summary
- [`SETUP_GUIDE.md`](SETUP_GUIDE.md) - Detailed setup instructions
- [`DEPLOYMENT.md`](DEPLOYMENT.md) - Deployment guide
- [`PRISMA_MIGRATION_STATUS.md`](PRISMA_MIGRATION_STATUS.md) - Migration progress

### Social Login (New)
- [`README_SOCIAL_LOGIN.md`](README_SOCIAL_LOGIN.md) - **START HERE** for social login
- [`SOCIAL_LOGIN_SECURITY_FIX.md`](SOCIAL_LOGIN_SECURITY_FIX.md) - Security improvements
- [`FLUTTER_INTEGRATION_GUIDE.md`](FLUTTER_INTEGRATION_GUIDE.md) - Flutter setup
- [`SOCIAL_LOGIN_IMPLEMENTATION.md`](SOCIAL_LOGIN_IMPLEMENTATION.md) - Technical details
- [`IMPLEMENTATION_CHECKLIST.md`](IMPLEMENTATION_CHECKLIST.md) - Implementation status

### API Contracts
- [`documentation/BACKEND_API_CONTRACT.md`](documentation/BACKEND_API_CONTRACT.md) - API endpoints
- [`documentation/DATABASE_CONTRACT.md`](documentation/DATABASE_CONTRACT.md) - Database schema
- [`documentation/NESTJS_ARCHITECTURE.md`](documentation/NESTJS_ARCHITECTURE.md) - Architecture guide

---

## 🔧 Development

### Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format

# Build
npm run build

# Watch mode (auto-rebuild)
npm run start:dev
```

### Generate Documentation

```bash
# Generate Compodoc documentation
npm run doc:build

# Serve documentation
npm run doc
# Visit http://localhost:8080
```

---

## 🚀 Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for detailed deployment instructions for:
- Vercel
- Heroku
- AWS
- DigitalOcean
- Self-hosted servers

### Environment Variables Checklist

Before deploying to production, ensure these are configured:

- ✅ `DATABASE_URL` - PostgreSQL connection string
- ✅ `JWT_SECRET` - Strong random secret
- ✅ `JWT_REFRESH_SECRET` - Strong random secret
- ✅ `GOOGLE_CLIENT_ID` - For social login
- ✅ `APPLE_CLIENT_ID` - For social login
- ✅ `FIREBASE_SERVICE_ACCOUNT` - For push notifications
- ✅ `SMTP_*` or email service credentials
- ✅ `AWS_*` credentials (if using S3)
- ✅ `REDIS_URL` - Redis connection string

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is [UNLICENSED](LICENSE).

---

## 🆘 Support

For issues and questions:

1. Check the documentation files listed above
2. Review Swagger API documentation at `/api`
3. Check existing GitHub issues
4. Create a new issue with detailed description

---

## 🎯 Project Status

- ✅ **Core Features**: Complete
- ✅ **Authentication**: Email/Password + Social Login
- ✅ **Security**: Production-ready with token verification
- ✅ **Documentation**: Comprehensive guides
- ✅ **Database**: Prisma ORM with PostgreSQL
- ✅ **Real-time**: WebSocket support
- ✅ **File Storage**: S3 integration
- ✅ **Payments**: Multi-gateway support
- ✅ **Notifications**: Push, Email, SMS

- ✅ **Stability & Scalability**: Refactored services + Redis caching
- ✅ **Error Handling**: Standardized with Flutter-friendly error codes

**Status**: Production-Ready & Optimized ✅

---

**Built with ❤️ using NestJS, Prisma, and TypeScript**
