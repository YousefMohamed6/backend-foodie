# NestJS Backend Architecture

## Overview

This document outlines the NestJS backend architecture for the Restaurant/Foodie app. This is a standalone implementation with native Node.js/TypeScript solutions.

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 11.x | Framework |
| TypeScript | 5.x | Language |
| PostgreSQL | 14+ | Primary database with PostGIS |
| Prisma | Latest | ORM with type-safety |
| Redis | Latest | Caching and queues |
| Passport.js | Latest | Authentication strategies |
| Socket.io | Latest | Real-time WebSockets |
| Bull | Latest | Background job queues |
| Swagger | Latest | API documentation |

---

## Project Structure

### Root Directories

| Directory | Purpose |
|-----------|---------|
| `src/` | Application source code |
| `prisma/` | Database schema and migrations |
| `scripts/` | Seed and utility scripts |
| `docs/` | Documentation |
| `test/` | Unit and integration tests |

### Source Organization

| Path | Purpose |
|------|---------|
| `src/main.ts` | Application entry point |
| `src/app.module.ts` | Root module |
| `src/common/` | Decorators, guards, filters, pipes |
| `src/config/` | Configuration files |
| `src/modules/` | Feature modules |
| `src/shared/` | Shared services |
| `src/prisma/` | Prisma service |

---

## Core Modules

### Authentication (`/modules/auth`)
- JWT-based authentication with Passport.js
- Social login (Google, Apple) via token verification
- OTP verification for phone-based auth
- Password reset functionality

### Users (`/modules/users`)
- Multi-role support: Customer, Vendor, Driver, Admin, Manager
- Profile management
- Address management

### Vendors (`/modules/vendors`)
- Restaurant/store management
- Menu and product organization
- Operating hours and status

### Products (`/modules/products`)
- Product CRUD operations
- Categories and extras
- Pricing and discounts

### Orders (`/modules/orders`)
- Complete order lifecycle management
- Status state machine
- Commission calculations
- Wallet protection integration

### Wallet (`/modules/wallet`)
- Wallet transactions and balance tracking
- Wallet protection for delivery disputes
- Auto-release scheduler
- Dispute resolution

### Drivers (`/modules/drivers`)
- Driver profile and documents
- Location tracking
- Debt management

### Settings (`/modules/settings`)
- Application configuration
- Feature flags
- Commission rates

### Analytics (`/modules/analytics`)
- Order lifecycle tracking
- Delivery event tracking
- User activity logging

---

## Shared Services

| Service | Purpose |
|---------|---------|
| `NotificationService` | Push notifications via FCM |
| `EmailService` | Email sending via Nodemailer/SendGrid |
| `RedisService` | Cache and session management |
| `GeolocationService` | Distance and location calculations |

---

## Authentication Flow

### Standard Login
1. User provides email/phone and password
2. Credentials validated against database
3. JWT access and refresh tokens generated
4. Tokens returned to client

### Social Login
1. Client authenticates with Google/Apple
2. ID token sent to backend
3. Token verified with provider
4. User created/matched in database
5. JWT tokens generated and returned

### Protected Endpoints
- All protected routes use `JwtAuthGuard`
- Role-based access via `RolesGuard`
- User extracted via `@Request()` decorator

---

## Order Lifecycle

### Status Flow

| Status | Description |
|--------|-------------|
| PLACED | Order created by customer |
| VENDOR_ACCEPTED | Vendor accepted order |
| DRIVER_PENDING | Waiting for driver assignment |
| DRIVER_ACCEPTED | Driver accepted assignment |
| SHIPPED | Driver picked up order |
| COMPLETED | Order delivered |
| CANCELLED | Order cancelled |

### Payment Processing

**Wallet Payments**:
- Funds deducted at order creation
- Held in HeldBalance until delivery confirmed
- Released to vendor/driver/admin upon confirmation

**Cash on Delivery**:
- No upfront deduction
- Credits applied at delivery completion
- Driver debt recorded for cash collected

---

## Scheduled Jobs

| Job | Module | Frequency | Description |
|-----|--------|-----------|-------------|
| Order Preparation Check | Orders | Every minute | Notify when orders ready |
| Vendor Auto-Cancel | Orders | Every 5 min | Cancel unaccepted orders |
| Wallet Auto-Release | Wallet | Every hour | Release held funds |

---

## WebSocket Events

### Orders Gateway

| Event | Direction | Description |
|-------|-----------|-------------|
| orderUpdate | Server → Client | Order status changed |
| newOrder | Server → Vendor | New order received |
| driverLocation | Client → Server | Driver position update |

---

## API Response Format

All endpoints return standardized responses:

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Request success status |
| message | string | Response message |
| data | object/array | Response payload |

---

## Error Handling

### HTTP Exceptions

| Code | Description |
|------|-------------|
| 400 | Bad Request - validation failed |
| 401 | Unauthorized - invalid/missing token |
| 403 | Forbidden - insufficient permissions |
| 404 | Not Found - resource doesn't exist |
| 409 | Conflict - duplicate resource |
| 500 | Internal Server Error |

### Error Response Format

| Field | Type | Description |
|-------|------|-------------|
| success | false | Always false for errors |
| error | string | Error code (e.g., ORDER_NOT_FOUND) |
| message | string | Human-readable description |

---

## Security Measures

| Feature | Implementation |
|---------|----------------|
| Password Hashing | bcrypt with salt rounds |
| JWT Tokens | Short-lived access, long-lived refresh |
| Rate Limiting | 60 rpm public, 120 rpm authenticated |
| Input Validation | class-validator on all DTOs |
| SQL Injection | Prisma parameterized queries |
| XSS Protection | Response sanitization |

---

## Database Considerations

### Prisma ORM
- Type-safe database queries
- Automatic migrations
- Transaction support

### PostGIS Extension
- Geospatial queries for vendor proximity
- Delivery radius calculations

### Indexes
- User ID, email, phone
- Order status, created date
- Vendor location coordinates

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| REDIS_HOST | Redis server host |
| JWT_SECRET | JWT signing secret |
| FCM_SERVICE_ACCOUNT | Firebase service account JSON |
| AWS_S3_BUCKET | S3 bucket for file uploads |

---

## Testing Strategy

### Unit Tests
- Service methods in isolation
- Mock external dependencies

### Integration Tests
- Controller endpoints
- Database operations

### E2E Tests
- Complete user flows
- Authentication scenarios

---

**Last Updated**: 2026-01-09
