# Foodie App Backend - Database Architecture

This document describes the database architecture for the Food Delivery application backend.

---

## Technical Stack

| Technology | Purpose |
|------------|---------|
| NestJS | Node.js framework |
| PostgreSQL | Primary database with PostGIS |
| Redis | Caching and real-time features |
| Prisma | ORM with type-safety |
| REST + WebSockets | API protocols |

---

## Database Architecture

### PostgreSQL (Primary)

| Purpose | Implementation |
|---------|----------------|
| Financial Transactions | ACID compliance for wallet operations |
| Geospatial Queries | PostGIS extension for vendor proximity and delivery radius |
| Dynamic Data | JSONB fields for product extras and review attributes |
| Audit Trails | Complete transaction and activity logging |

### Redis (Cache Layer)

| Purpose | Implementation |
|---------|----------------|
| Driver Tracking | Real-time GPS coordinates |
| Message Broker | Pub/Sub for WebSocket notifications |
| Authentication | JWT blacklists, OTPs, sessions |
| Settings Cache | Application configuration caching |

---

## Core Models

### User Management
- **User**: Multi-role support (Customer, Vendor, Driver, Admin, Manager)
- **CustomerProfile**: Customer-specific data
- **DriverProfile**: Driver-specific data with wallet and debt tracking
- **Address**: User delivery addresses

### Vendor System
- **Vendor**: Restaurant/store information (Requires `zoneId` and `vendorTypeId`)
- **Zone**: Geographic delivery boundaries with pricing
- **VendorCategory**: Category organization, **Product**: Menu items with extras
- **SubscriptionPlan**: Tiered plans for vendors (Includes `totalOrders` limit)

### Order System
- **Order**: Complete order lifecycle with state machine
- **OrderItem**: Individual items with extras
- **HeldBalance**: Wallet protection for pending deliveries
- **Dispute**: Non-receipt claims and resolution

### Financial System
- **WalletTransaction**: All wallet movements with audit trail
- **AdminWallet**: Platform revenue tracking
- **Coupon**: Discount codes
- **Cashback**: Reward system

### Analytics
- **OrderLifecycleEvent**: Order state changes
- **DeliveryEvent**: Driver delivery tracking
- **UserActivityLog**: User actions

---

## Key Enums

### Order Status Flow
PLACED → VENDOR_ACCEPTED → DRIVER_PENDING → DRIVER_ACCEPTED → SHIPPED → COMPLETED

### Payment Methods
- wallet (Prepaid)
- cash (Cash on Delivery)
- fawaterak (Payment Gateway)

### Wallet Protection States
- HELD → RELEASED (delivery confirmed)
- HELD → REFUNDED (dispute won by customer)
- HELD → DISPUTED (under investigation)

---

## Developer Guidelines

| Rule | Description |
|------|-------------|
| Migrations | Use `npx prisma migrate dev` for all schema changes |
| Environment | Configure DATABASE_URL and REDIS_URL in .env |
| Media Storage | Store files in S3/Cloudinary, save URLs only |
| Validation | Use class-validator on all DTOs |
| Rate Limiting | 60 rpm public, 120 rpm authenticated |

---

**Last Updated**: 2026-01-09