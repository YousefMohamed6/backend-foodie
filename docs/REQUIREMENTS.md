# Project Overview

This application is a comprehensive multi-vendor food delivery and service ecosystem involving five key roles: Customer, Vendor, Manager, Delivery Driver, and Admin. The platform supports complex operations including real-time order tracking, secure wallet-based payments, table bookings, loyalty programs (Referrals, Cashback), and tiered vendor subscriptions.

The core workflow involves a customer placing an order, its acceptance by a vendor, automated assignment or manual notification of a manager/driver for shipping, and secure final delivery via OTP verification.

---

# Key Requirements

## 1. Payment Handling & Timing

### Wallet Payment (Prepaid)
- **Placement**: Total amount (Order Subtotal + Delivery Fee + Tip) is immediately deducted from the customer's wallet and moved to HELD state.
- **SHIPPED**: HeldBalance record is updated with calculated vendor/driver/admin amounts. Funds remain HELD.
- **DELIVERED**: Driver marks delivered. Customer is notified to confirm receipt. Funds still HELD.
- **COMPLETED**: Upon customer confirmation, OTP validation, or auto-release timeout, funds are distributed:
  - **Vendor**: Receives (Subtotal - Admin Commission)
  - **Driver**: Receives (Driver Portion of Delivery Fee + 100% of Tip)
  - **Admin**: Receives (Vendor Commission + Admin Portion of Delivery Fee)

### Cash on Delivery (COD)
- **Placement**: No wallet deduction.
- **DELIVERED**: Wallet credits occur only when the order is marked complete:
  - Vendor, Driver, Admin credited as per standard split
  - **Driver Debt**: Full cash collected (Subtotal + Fee) recorded as debt against driver's wallet

---

## 2. Commission & Pricing Logic

### Delivery Fee Calculation
- Calculated as `Distance (km) × Delivery_Fee_Per_Km`
- **Floor**: Must never be lower than `min_delivery_fee`

### Admin Commission (Vendor)
- Percentage of order subtotal
- Waived if vendor is on premium/paid subscription plan (Price > 0)

### Admin Commission (Delivery)
- Platform takes `driver_commission_rate` from delivery fee
- **Driver Safety Floor**: Driver receives at least `min_delivery_pay`. Platform commission reduced if necessary.

### Tips
- **Wallet**: 100% digital credit to Driver's wallet.
- **COD**: Tips kept physically by driver, NOT credited digitally, NOT included in debt.
- Neither platform nor vendor takes any share.

---

## 3. Financial Safety & Safeguards

### Driver Debt Limit
- Configurable `max_driver_debt` limit.
- Managers prevented from assigning new COD orders if debt would exceed limit.

### Negative Balance Prevention
- Wallet transactions are atomic using database transactions.
- Refunds and reversals handled strictly based on valid order state transitions.

### Manual Withdrawals
- **Eligibility**: Support for `VENDOR`, `DRIVER`, and `MANAGER` roles.
- **Process**: Users submit a withdrawal request choosing from their saved `Payout Accounts`. Admin reviews and completes the request.
- **Transactional Safety**: Funds are debited directly from the profile balance (`walletAmount`) upon completion to prevent concurrent overdrafts.
- **Driver Debt**: Driver withdrawals are prevented if the resulting balance would fall below zero (accounting for cash collection debt).

### Payout Accounts
- **Functionality**: Users can save multiple payout methods (Stripe, PayPal, Bank Transfer).
- **Details**: Specific account details (IBAN, Email, Account No) are stored securely as JSON.
- **Default Selection**: One account can be marked as default for automatic selection in withdrawal requests.

---

## 4. Cancellations and Refunds

### Pre-Shipping Cancellations
- Wallet orders: Full refund to customer (including tip).
- COD orders: No wallet action needed.

### Post-Shipping Cancellations
- Wallet orders: Platform reverses credits and refunds customer.
- Tips only reversed if order never reached delivery attempt.

### Post-Delivery (Completed)
- Financial transactions are final. No automated reversals.

---

## 5. Wallet Protection & Dispute Handling

### 5.1 Core Principle
Wallet balance is NEVER released immediately upon driver confirmation alone for prepaid orders. Funds remain in a HELD state until delivery confirmation is verified.

### 5.2 Wallet Balance States

| State | Description |
|-------|-------------|
| `AVAILABLE_BALANCE` | Funds freely available for use/withdrawal |
| `HELD_BALANCE` | Funds locked pending delivery verification |
| `RELEASED_BALANCE` | Funds moved to available after delivery confirmation |
| `REFUNDED_BALANCE` | Funds returned to customer due to dispute resolution |

### 5.3 Delivery Confirmation Types

| Type | Description | Trigger |
|------|-------------|---------|
| `CUSTOMER_CONFIRMATION` | Customer confirms receipt via app | Customer action |
| `OTP_CONFIRMED` | Valid OTP entered at delivery | Driver enters customer OTP |
| `TIMEOUT_RELEASE` | Auto-release after N days (default: 7) | System cron job |
| `ADMIN_RESOLUTION` | Manual resolution by admin/manager | Admin dashboard |

---

## 6. Order Auto-Cancellation

### Vendor Timeout
- Orders in PLACED status auto-cancelled if vendor doesn't accept within timeout.
- Default timeout: 30 minutes (configurable via `order_timeout_minutes`).
- Wallet payments automatically refunded.

---

## 7. Implementation Status

| Feature | Status |
|---------|--------|
| Wallet Payment Flow | ✅ Implemented |
| COD Payment Flow | ✅ Implemented |
| Commission Calculations | ✅ Implemented |
| Driver Debt Tracking | ✅ Implemented |
| Cancel/Refund Logic | ✅ Implemented |
| Wallet Protection (HeldBalance) | ✅ Implemented |
| Dispute System | ✅ Implemented |
| Auto-Release Scheduler | ✅ Implemented |
| OTP Verification (Wallet Orders) | ✅ Implemented |
| Vendor Working Hours | ✅ Implemented |
| Address-Zone Sync | ✅ Implemented |
| Zone-Filtered Products| ✅ Implemented |
| Manual Withdrawals | ✅ Implemented |
| Payout Accounts | ✅ Implemented |
| Vendor Subscriptions (Limits) | ✅ Implemented |
| Subscription Expiry Scheduler | ✅ Implemented |
| Order & Product Limit Enforcement | ✅ Implemented |
| Dine-in Table Bookings | ✅ Implemented |
| Referrals & Promo Codes | ✅ Implemented |
| Cashback System | ✅ Implemented |
| Gift Cards (Purchase & Redeem) | ✅ Implemented |
| Multi-Vendor Chat | ✅ Implemented |
| Business Analytics Reports | ✅ Implemented |
| Product Visibility (Soft Delete) | ✅ Implemented |
| Advertisement System | [/] In Progress |

---

## 8. Vendor Working Hours

### 8.1 Core Principle
Vendors have configurable working hours for each day of the week. The application determines if a vendor is "Open" or "Closed" dynamically.

### 8.2 Working Hours Logic
- **Multiple Timeslots**: Supports split shifts (e.g., Lunch and Dinner sessions).
- **Validation**: Orders are blocked if the vendor status is "Closed".

---

## 9. Geospatial Logic & Zone-Based Filtering

### 9.1 Address-Zone Synchronization
- Automatically maps a customer's default address to a delivery `Zone` using point-in-polygon logic.
- Updates the user profile with `zoneId` for targeted product discovery.

### 9.2 Zone-Filtered Product Discovery
- Customers only see products from vendors operating within their current active zone.
- Ensures delivery feasibility at the browsing stage.

---

## 10. Vendor Subscriptions & Capacity Limits

### 10.1 Core Principle
Subscription plans control vendor capabilities and capacity. Plans are categorized by price (Free vs. Paid).

### 10.2 Capability Limits
- **Order Limit**: Paid plans may have a fixed quota of orders (`totalOrders`).
- **Product Limit**: Controls how many active products a vendor can manage simultaneously (`productsLimit`).
- **Feature Toggles**: Controls access to specific modules like Dine-in, Chat, or Mobile App.

### 10.3 Enforcement
- **Soft Limit**: Vendors are prevented from creating new products if they exceed their plan's `productsLimit`.
- **Order Blocking**: Vendors on limited plans cannot accept new orders if their quota is exhausted.

---

## 11. Secure Delivery Verification (OTP)

### 11.1 Purpose
Mandatory for **Wallet (Prepaid)** orders to ensure funds are only released upon physical verification of receipt.

### 11.2 The Workflow
1. **Generation**: Unique 6-digit OTP created when order status becomes `SHIPPED`.
2. **Access**: Customer views OTP in order details.
3. **Verification**: Driver must enter the correct OTP in their app to transition the order to `COMPLETED`.
4. **Safety**: Blocks fraudulent "marked delivered" claims by drivers without physical contact.

---

## 12. Vendor Document Verification

### 12.1 Regulatory Compliance
Vendors must upload identity and business documents.
- **Workflow**: Upload → `PENDING` → Admin Review → `ACCEPTED` / `REJECTED`.
- **Integrity**: Any document update resets status to `PENDING`, triggering a new review cycle.

---

## 13. Special Discounts & Coupons

### 13.1 Vendor Coupons
Vendors create flat or percentage discounts with configurable limits:
- **Scope**: Can be public (visible on profile) or private (code-based).
- **Constraints**: Minimum order amount, maximum discount cap, and expiry date.

---

## 14. Product Visibility & Soft Deletion

### 14.1 Status Definitions
- **isActive**: Internal flag for deletion. If `false`, the product is "deleted" and hidden from all users (Vendors & Customers).
- **isPublish**: Visibility flag for customers.
  - `isPublish = true`: Visible to everyone.
  - `isPublish = false`: Visible only to the Vendor for management purposes.

### 14.2 Business Rules
- **Creation**: New products are automatically initialized as `isActive = true`.
- **Soft Delete**: When a vendor "deletes" a product, `isActive` and `isPublish` are both set to `false`. These records are preserved in the DB for order history integrity but removed from all listings.

---

## 15. Dine-in Table Bookings

### 15.1 Core Principle
Allows customers to reserve tables at restaurant-type vendors for specific dates and times.
- **Tracking**: Manage upcoming vs. past bookings.
- **Availability**: Integrated with vendor working hours to ensure bookings only occur during operational hours.

---

## 16. Loyalty & Growth Systems

### 16.1 Referrals
- Custom referral codes for every user.
- Rewards (Wallet credits) applied to the referrer upon successful referral registration or first order.

### 16.2 Cashback
- Percentage-based cashback on orders that credits the customer's wallet after completion.
- Configurable per-campaign or per-vendor.

### 16.3 Gift Cards
- **Purchase**: Digital gift cards purchased via wallet or payment gateway.
- **Redemption**: Unique codes that instantly top-up the recipient's wallet balance upon redemption.

---

## 17. Business Intelligence & Analytics

### 17.1 Reporting
Comprehensive data aggregation for Admin and Vendors:
- **Revenue Tracking**: Daily/Weekly/Monthly income reports.
- **Order Analytics**: Success vs. Cancellation rates.
- **Product Performance**: Top selling items and low-performing categories.

**Last Updated**: 2026-01-19