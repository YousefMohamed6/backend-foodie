# Foodie App Backend - API & Architecture Specification

This repository contains the backend system for a comprehensive Food Delivery/Restaurant application. The architecture is engineered to ensure maximum financial precision, real-time responsiveness, and seamless scalability.

## 🚀 Technical Stack
* **Framework:** NestJS (Node.js)
* **Primary Database:** PostgreSQL (Reliability, Financial Integrity)
* **Caching/Real-time:** Redis (Driver Tracking, User Sessions)
* **ORM:** Prisma (Type-safety & Auto-migrations)
* **API Protocol:** REST (v1) & WebSockets (Real-time updates)

---

## 🏗️ Database Architecture

To minimize technical debt as the project scales, a **Hybrid Database Approach** has been selected:

### 1. PostgreSQL (The Core Engine)
Responsible for mission-critical data that requires high consistency:
* **Financial Transactions:** The Wallet and Transaction systems utilize PostgreSQL’s **ACID compliance** to ensure 100% accuracy in balance deductions and deposits.
* **Geospatial Engine:** Enabled via the `PostGIS` extension to handle "Nearest Vendor" queries and delivery radius calculations with high mathematical precision.
* **Flexibility:** Leveraging `JSONB` fields for dynamic product "Extras" and variable "Review Attributes" to provide NoSQL-like flexibility within a relational structure.

### 2. Redis (The Velocity Layer)
Handles high-frequency, transient data to reduce load on the primary database:
* **Live Driver Tracking:** Driver GPS coordinates are streamed and updated in Redis every second, with only the final location persisted to PostgreSQL upon order completion.
* **Real-time Messaging:** Acts as a Message Broker (Pub/Sub) to power WebSockets for Chat and Order Status notifications.
* **Authentication:** Stores JWT blacklists, OTPs, and active user sessions for sub-millisecond verification.

---

## 🛠️ Schema Highlights & Relationships

Based on the `BACKEND_API_CONTRACT.md`, the schema is designed as follows:

* **Users:** Multi-role support (Customer, Vendor, Driver, Admin) with centralized authentication.
* **Vendors & Zones:** Geographic Polygon support to define delivery boundaries, dynamic taxes, and localized delivery charges.
* **Orders:** A robust state machine tracking the lifecycle from `Order Placed` to `Order Completed`.
* **Analytics:** Comprehensive event tracking via `OrderLifecycleEvents`, `DeliveryEvents`, and `UserActivityLogs` for business intelligence.
* **Wallet System:** A strict audit trail linking every transaction to a `userId`, ensuring no balance discrepancies during high concurrency.

---

## 📡 Key API Modules

The implementation strictly follows the provided Contract Specification:
* `POST /api/v1/auth/register` - Role-based user onboarding.
* `GET /api/v1/vendors/nearest` - Geography-based restaurant discovery.
* `POST /api/v1/orders` - Order creation with integrated coupon and cashback validation.
* `PATCH /api/v1/user/me/location` - High-frequency driver updates (handled via Redis).

---

## ⚙️ Developer Guidelines
1. **Migrations:** Manual database changes are strictly prohibited. All updates must be performed via `npx prisma migrate dev`.
2. **Environment:** Ensure `DATABASE_URL` (PostgreSQL) and `REDIS_URL` are correctly configured in the `.env` file.
3. **Media Storage:** Do not store binary image/video data in the database. Upload files to **S3** or **Cloudinary** and store only the secure URLs.
4. **Validation:** Implement `class-validator` and `class-transformer` globally to enforce the API contract at the DTO level.
5. **Rate Limiting:** Adhere to the specified limits: 60 rpm for public and 120 rpm for authenticated endpoints.