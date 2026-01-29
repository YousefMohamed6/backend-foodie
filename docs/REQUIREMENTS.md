# Project Overview

This application is a comprehensive multi-vendor food delivery and service ecosystem involving five key roles: Customer, Vendor, Manager, Delivery Driver, and Admin. The platform supports complex operations including real-time order tracking, secure wallet-based payments, table bookings, loyalty programs (Referrals, Cashback), and tiered vendor subscriptions.

The core workflow involves a customer placing an order, its acceptance by a vendor, automated assignment or manual notification of a manager/driver for shipping, and secure final delivery via OTP verification.

---

# Key Requirements

## 1. Payment Handling & Timing

### Wallet Payment (Prepaid)
- **Placement**: Total amount (Order Subtotal + Delivery Fee + Tip - Discount) is immediately deducted from the customer's wallet and moved to HELD state.
- **SHIPPED**: HeldBalance record is updated with calculated vendor/driver/admin amounts. Funds remain HELD.
- **DELIVERED**: Driver marks delivered. Customer is notified to confirm receipt. Funds still HELD.
- **COMPLETED**: Upon customer confirmation, OTP validation, or auto-release timeout, funds are distributed:
  - **Vendor**: Receives `(Subtotal - Discount - Vendor Commission)`
  - **Driver**: Receives `(Delivery Fee - Driver Commission + 100% of Tip)`
  - **Platform**: Receives `(Vendor Commission + Driver Commission)`

### Cash on Delivery (COD)
- **Placement**: No wallet deduction.
- **DELIVERED**: Wallet credits occur only when the order is marked complete:
  - Vendor, Driver, Platform credited as per standard split
  - **Driver Debt**: Cash collected `(Order Total - Tip)` recorded as debt against driver's wallet
  - Tips are NOT included in driver debt (driver keeps cash tips)

---

## 2. Commission & Pricing Logic

### Delivery Fee Calculation
- Calculated as `Distance (km) × Delivery_Fee_Per_Km`
- **Floor**: Must never be lower than `min_delivery_fee`
- **Takeaway Orders**: Delivery fee is always `0` when `takeAway = true`

### Vendor Commission (Platform Fee)
- **Base Amount**: `orderSubtotal - discountAmount` (NEVER includes delivery or tips)
- **Calculation**: `vendorCommission = baseAmount × vendorCommissionRate`
- **Waived**: If vendor is on premium/paid subscription plan (Price > 0)
- **CRITICAL**: Vendor is NOT entitled to delivery fees or tips under any circumstance

### Driver Commission (Platform Fee)
- Platform takes `driver_commission_rate` from delivery fee
- **Driver Safety Floor**: Driver receives at least `min_delivery_pay`. Platform commission reduced if necessary.
- **Calculation**: `driverNet = max(minPay, deliveryCharge - driverCommission)`

### Tips
- **100% to Driver**: Tips are NEVER shared with vendor or platform.
- **Wallet**: 100% digital credit to Driver's wallet.
- **COD**: Tips kept physically by driver, NOT credited digitally, NOT included in debt.

---

## 3. Financial Domain Isolation (CRITICAL)

### Core Principle
Each monetary unit must flow **exactly once** to its rightful owner. The platform has four independent financial stakeholders with strictly separated money domains:

| Stakeholder | Entitled To | NOT Entitled To |
|-------------|-------------|------------------|
| **Customer** | Pays full order total | — |
| **Vendor** | Product subtotal minus discount & commission | Delivery fees, Tips |
| **Driver** | Delivery fee minus commission + 100% tips | Vendor commission |
| **Platform** | Vendor commission + Driver commission | Tips |

### Financial Formulas

```
orderTotal = orderSubtotal + deliveryCharge + tipAmount - discountAmount

vendorBaseAmount = orderSubtotal - discountAmount
vendorNet = vendorBaseAmount - vendorCommission

driverNet = max(minPay, deliveryCharge - driverCommission)
driverTotal = driverNet + tipAmount

platformTotal = vendorCommission + driverCommission
```

### Balance Equation Verification
```
customerPays = vendorNet + vendorCommission + driverNet + driverCommission + tipAmount
            = orderTotal ✓
```

---

## 4. Financial Safety & Safeguards

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

## 5. Cancellations and Refunds

### Pre-Shipping Cancellations
- Wallet orders: Full refund to customer (including tip).
- COD orders: No wallet action needed.

### Post-Shipping Cancellations
- Wallet orders: Platform reverses credits and refunds customer.
- Tips only reversed if order never reached delivery attempt.

### Post-Delivery (Completed)
- Financial transactions are final. No automated reversals.

---

## 6. Wallet Protection & Dispute Handling

### 6.1 Core Principle
Wallet balance is NEVER released immediately upon driver confirmation alone for prepaid orders. Funds remain in a HELD state until delivery confirmation is verified.

### 6.2 Wallet Balance States

| State | Description |
|-------|-------------|
| `AVAILABLE_BALANCE` | Funds freely available for use/withdrawal |
| `HELD_BALANCE` | Funds locked pending delivery verification |
| `RELEASED_BALANCE` | Funds moved to available after delivery confirmation |
| `REFUNDED_BALANCE` | Funds returned to customer due to dispute resolution |

### 6.3 Delivery Confirmation Types

| Type | Description | Trigger |
|------|-------------|---------|
| `CUSTOMER_CONFIRMATION` | Customer confirms receipt via app | Customer action |
| `OTP_CONFIRMED` | Valid OTP entered at delivery | Driver enters customer OTP |
| `TIMEOUT_RELEASE` | Auto-release after N days (default: 7) | System cron job |
| `ADMIN_RESOLUTION` | Manual resolution by admin/manager | Admin dashboard |

---

## 7. Order Auto-Cancellation

### Vendor Timeout
- Orders in PLACED status auto-cancelled if vendor doesn't accept within timeout.
- Default timeout: 30 minutes (configurable via `order_timeout_minutes`).
- Wallet payments automatically refunded.

---

## 8. Implementation Status

| Feature | Status |
|---------|--------|
| Wallet Payment Flow | ✅ Implemented |
| COD Payment Flow | ✅ Implemented |
| Commission Calculations | ✅ Implemented |
| Financial Domain Isolation | ✅ Implemented (Audited 2026-01-29) |
| Takeaway Order Pricing | ✅ Implemented |
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

## 9. Vendor Working Hours

### 9.1 Core Principle
Vendors have configurable working hours for each day of the week. The application determines if a vendor is "Open" or "Closed" dynamically.

### 9.2 Working Hours Logic
- **Multiple Timeslots**: Supports split shifts (e.g., Lunch and Dinner sessions).
- **Validation**: Orders are blocked if the vendor status is "Closed".

---

## 10. Geospatial Logic & Zone-Based Filtering

### 10.1 Address-Zone Synchronization
- Automatically maps a customer's default address to a delivery `Zone` using point-in-polygon logic.
- Updates the user profile with `zoneId` for targeted product discovery.

### 10.2 Zone-Filtered Product Discovery
- Customers only see products from vendors operating within their current active zone.
- Ensures delivery feasibility at the browsing stage.

---

## 11. Vendor Subscriptions & Capacity Limits

### 11.1 Core Principle
Subscription plans control vendor capabilities and capacity. Plans are categorized by price (Free vs. Paid).

### 11.2 Capability Limits
- **Order Limit**: Paid plans may have a fixed quota of orders (`totalOrders`).
- **Product Limit**: Controls how many active products a vendor can manage simultaneously (`productsLimit`).
- **Feature Toggles**: Controls access to specific modules like Dine-in, Chat, or Mobile App.

### 11.3 Financial Impact
- **Free Plans (Price = 0)**: Platform takes vendor commission from order subtotal.
- **Paid Plans (Price > 0)**: No vendor commission, but vendor still only receives product subtotal (NOT delivery or tips).

### 11.4 Enforcement
- **Soft Limit**: Vendors are prevented from creating new products if they exceed their plan's `productsLimit`.
- **Order Blocking**: Vendors on limited plans cannot accept new orders if their quota is exhausted.

---

## 12. Secure Delivery Verification (OTP)

### 12.1 Purpose
Mandatory for **Wallet (Prepaid)** orders to ensure funds are only released upon physical verification of receipt.

### 12.2 The Workflow
1. **Generation**: Unique 6-digit OTP created when order status becomes `SHIPPED`.
2. **Access**: Customer views OTP in order details.
3. **Verification**: Driver must enter the correct OTP in their app to transition the order to `COMPLETED`.
4. **Safety**: Blocks fraudulent "marked delivered" claims by drivers without physical contact.

---

## 13. Vendor Document Verification

### 13.1 Regulatory Compliance
Vendors must upload identity and business documents.
- **Workflow**: Upload → `PENDING` → Admin Review → `ACCEPTED` / `REJECTED`.
- **Integrity**: Any document update resets status to `PENDING`, triggering a new review cycle.

---

## 14. Special Discounts & Coupons

### 14.1 Vendor Coupons
Vendors create flat or percentage discounts with configurable limits:
- **Scope**: Can be public (visible on profile) or private (code-based).
- **Constraints**: Minimum order amount, maximum discount cap, and expiry date.

---

## 15. Product Visibility & Soft Deletion

### 15.1 Status Definitions
- **isActive**: Internal flag for deletion. If `false`, the product is "deleted" and hidden from all users (Vendors & Customers).
- **isPublish**: Visibility flag for customers.
  - `isPublish = true`: Visible to everyone.
  - `isPublish = false`: Visible only to the Vendor for management purposes.

### 15.2 Business Rules
- **Creation**: New products are automatically initialized as `isActive = true`.
- **Soft Delete**: When a vendor "deletes" a product, `isActive` and `isPublish` are both set to `false`. These records are preserved in the DB for order history integrity but removed from all listings.

---

## 16. Dine-in Table Bookings

### 16.1 Core Principle
Allows customers to reserve tables at restaurant-type vendors for specific dates and times.
- **Tracking**: Manage upcoming vs. past bookings.
- **Availability**: Integrated with vendor working hours to ensure bookings only occur during operational hours.

---

## 17. Loyalty & Growth Systems

### 17.1 Referrals
- Custom referral codes for every user.
- Rewards (Wallet credits) applied to the referrer upon successful referral registration or first order.

### 17.2 Cashback
- Percentage-based cashback on orders that credits the customer's wallet after completion.
- Configurable per-campaign or per-vendor.

### 17.3 Gift Cards
- **Purchase**: Digital gift cards purchased via wallet or payment gateway.
- **Redemption**: Unique codes that instantly top-up the recipient's wallet balance upon redemption.

---

## 18. Business Intelligence & Analytics

### 18.1 Reporting
Comprehensive data aggregation for Admin and Vendors:
- **Revenue Tracking**: Daily/Weekly/Monthly income reports.
- **Order Analytics**: Success vs. Cancellation rates.
- **Product Performance**: Top selling items and low-performing categories.

---

## Appendix: Financial Audit History

| Date | Auditor | Status | Description |
|------|---------|--------|-------------|
| 2026-01-29 | System Audit | ✅ Passed | Fixed vendor commission base (subtotal only), takeaway pricing, tips isolation |

**Last Updated**: 2026-01-29