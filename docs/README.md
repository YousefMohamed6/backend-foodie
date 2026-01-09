# Foodie Vendor Backend Service

[![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Production-ready API service powering the Foodie ecosystem. Provides secure, scalable endpoints for Vendor, Driver, and Customer applications.

---

## Key Features

### Security & Authentication
| Feature | Description |
|---------|-------------|
| Dual-Token System | Short-lived access (15m) + long-lived refresh (7d) tokens |
| Social Login | Cryptographic verification of Google & Apple tokens |
| Token Rotation | Automatic refresh token rotation |
| Password Security | Bcrypt hashing with salt rounds |

### Financial Management
| Feature | Description |
|---------|-------------|
| Wallet System | ACID-compliant transactions with atomic operations |
| Wallet Protection | Held balance system for delivery disputes |
| Multi-Gateway Payments | Fawaterak, Stripe, PayPal support |
| Cashback System | Automated calculation and distribution |
| Driver Debt Tracking | COD collection and settlement |

### Order Management
| Feature | Description |
|---------|-------------|
| Status Tracking | Complete lifecycle from placement to delivery |
| Commission Calculations | Vendor, driver, and platform splits |
| Auto-Cancellation | Automatic cancellation for unaccepted orders |
| Dispute Resolution | Customer confirmation and dispute handling |

### Geospatial Services
| Feature | Description |
|---------|-------------|
| PostGIS Integration | Advanced location-based queries |
| Nearest Vendor Discovery | Distance-based vendor search |
| Zone Validation | Polygon-based delivery boundaries |
| Dynamic Pricing | Distance-calculated delivery charges |

### Communication
| Feature | Description |
|---------|-------------|
| Push Notifications | Firebase Cloud Messaging |
| Email Service | SMTP, SendGrid support |
| Real-time WebSocket | Order tracking and updates |
| Redis Pub/Sub | Multi-instance scaling |

---

## Tech Stack

### Core
| Technology | Purpose |
|------------|---------|
| NestJS v11 | Framework |
| TypeScript v5 | Language |
| Node.js v18+ | Runtime |

### Database
| Technology | Purpose |
|------------|---------|
| PostgreSQL | Primary database |
| PostGIS | Geospatial extension |
| Prisma v5 | ORM |
| Redis | Caching and queues |

### Authentication
| Technology | Purpose |
|------------|---------|
| Passport.js | Auth middleware |
| JWT | Token implementation |
| bcrypt | Password hashing |

### Services
| Technology | Purpose |
|------------|---------|
| Firebase Admin SDK | Push notifications |
| Nodemailer | Email service |
| Socket.io | WebSocket |
| Bull | Job queues |

---

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `src/modules/` | Feature modules (40+ modules) |
| `src/shared/` | Shared services |
| `src/common/` | Guards, decorators, filters |
| `src/prisma/` | Prisma service |
| `prisma/` | Schema and migrations |
| `scripts/` | Seed and utility scripts |
| `docs/` | Documentation |

### Key Modules

| Module | Description |
|--------|-------------|
| auth | Authentication, social login, JWT |
| users | User profiles, preferences |
| vendors | Vendor management, menus |
| products | Product catalog |
| orders | Order lifecycle, tracking |
| wallet | Transactions, protection, disputes |
| drivers | Driver profiles, availability |
| settings | Application configuration |
| analytics | Event tracking |

---

## Scheduled Jobs

| Job | Frequency | Description |
|-----|-----------|-------------|
| Order Preparation Check | Every minute | Notify when orders ready |
| Vendor Auto-Cancel | Every 5 minutes | Cancel unaccepted orders |
| Wallet Auto-Release | Every hour | Release held funds |

---

## Getting Started

### Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | v18+ |
| PostgreSQL | v14+ with PostGIS |
| Redis | v6+ |
| npm/yarn | Latest |

### Installation Steps

1. Clone repository
2. Install dependencies: `npm install`
3. Configure `.env` file
4. Run migrations: `npx prisma migrate dev`
5. Generate client: `npx prisma generate`
6. Seed settings: `npx ts-node scripts/seed-add-app-settings.ts`
7. Start server: `npm run start:dev`

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection |
| JWT_SECRET | Yes | Token signing secret |
| JWT_REFRESH_SECRET | Yes | Refresh token secret |
| REDIS_HOST | Yes | Redis server host |
| GOOGLE_CLIENT_ID | Optional | Google Sign-In |
| APPLE_CLIENT_ID | Optional | Apple Sign-In |
| FIREBASE_SERVICE_ACCOUNT | Optional | Push notifications |
| AWS_S3_BUCKET | Optional | File storage |

---

## API Documentation

### Endpoints

| Category | Path | Description |
|----------|------|-------------|
| Authentication | /api/v1/auth | Login, register, social |
| Users | /api/v1/users | User management |
| Vendors | /api/v1/vendors | Vendor operations |
| Products | /api/v1/products | Product catalog |
| Orders | /api/v1/orders | Order management |
| Wallet | /api/v1/wallet | Financial operations |
| Drivers | /api/v1/drivers | Driver management |
| Settings | /api/v1/settings | Configuration |

### Swagger UI
Available at: `http://localhost:3000/api`

---

## Database Commands

| Command | Description |
|---------|-------------|
| `npx prisma studio` | Database GUI |
| `npx prisma migrate dev` | Create migration |
| `npx prisma migrate deploy` | Apply migrations |
| `npx prisma generate` | Generate client |
| `npx prisma db push` | Sync schema |

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Development mode |
| `npm run build` | Build for production |
| `npm run start:prod` | Production mode |
| `npm run lint` | Run linter |
| `npm run format` | Format code |

---

## Documentation

| File | Description |
|------|-------------|
| `docs/REQUIREMENTS.md` | Business requirements |
| `docs/BACKEND_API_CONTRACT.md` | API endpoints |
| `docs/NESTJS_ARCHITECTURE.md` | Architecture guide |
| `docs/DATABASE_CONTRACT.md` | Database schema |
| `docs/DEPLOYMENT.md` | Deployment guide |
| `docs/WALLET_PROTECTION_IMPLEMENTATION.md` | Wallet protection |
| `docs/WALLET_PROTECTION_QUICK_REF.md` | Quick reference |

---

## Project Status

### Completed Features

| Feature | Status |
|---------|--------|
| Core Authentication | ✅ |
| Social Login (Google/Apple) | ✅ |
| Order Management | ✅ |
| Wallet System | ✅ |
| Wallet Protection | ✅ |
| Commission Calculations | ✅ |
| Driver Debt Tracking | ✅ |
| Auto-Cancellation | ✅ |
| Dispute System | ✅ |
| Push Notifications | ✅ |
| Real-time WebSocket | ✅ |
| File Storage (S3) | ✅ |
| Multi-gateway Payments | ✅ |

### Future Enhancements

| Feature | Status |
|---------|--------|
| OTP Delivery Verification | ⏳ |
| Photo Proof Validation | ⏳ |
| Fraud Risk Scoring | ⏳ |

---

**Status**: Production-Ready ✅

**Last Updated**: 2026-01-09

---

Built with NestJS, Prisma, and TypeScript
