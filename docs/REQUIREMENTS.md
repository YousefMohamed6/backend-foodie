# Project Overview

This application facilitates the order and delivery process involving four key roles: Customer, Vendor, Manager, and Delivery Driver. The workflow includes order placement, acceptance by the vendor, notification of the manager for shipping, and final delivery to the customer.

---

# Key Requirements

## 1. Payment Handling & Timing

### Wallet Payment (Prepaid)
- **Placement**: Total amount (Order Subtotal + Delivery Fee + Tip) is immediately deducted from the customer's wallet and moved to HELD state.
- **SHIPPED**: HeldBalance record is updated with calculated vendor/driver/admin amounts. Funds remain HELD.
- **DELIVERED**: Driver marks delivered. Customer is notified to confirm receipt. Funds still HELD.
- **CONFIRMED**: Upon customer confirmation, OTP validation, or auto-release timeout, funds are distributed:
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
- **Wallet**: 100% digital credit to Driver's wallet
- **COD**: Tips kept physically by driver, NOT credited digitally, NOT included in debt
- Neither platform nor vendor takes any share

---

## 3. Financial Safety & Safeguards

### Driver Debt Limit
- Configurable `max_driver_debt` limit
- Managers prevented from assigning new COD orders if debt would exceed limit

### Negative Balance Prevention
- Wallet transactions are atomic
- Refunds and reversals handled strictly based on order state

---

## 4. Cancellations and Refunds

### Pre-Shipping Cancellations
- Wallet orders: Full refund to customer (including tip)
- COD orders: No wallet action needed

### Post-Shipping Cancellations
- Wallet orders: Platform reverses credits and refunds customer
- Tips only reversed if order never reached delivery attempt

### Post-Delivery (Completed)
- Financial transactions are final. No automated reversals.

---

## 5. Wallet Protection & Dispute Handling

### 5.1 Core Principle
Wallet balance is NEVER released immediately upon driver confirmation alone. Funds remain in a HELD state until delivery confirmation is verified.

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
| `PHOTO_PROOF` | Photo evidence validated (future) | Admin/AI validation |
| `TIMEOUT_RELEASE` | Auto-release after N days (default: 7) | System cron job |
| `ADMIN_RESOLUTION` | Manual resolution by admin/manager | Admin dashboard |

### 5.4 Transaction Flow

1. **Payment**: Customer pays → Funds deducted → HeldBalance created → Status: HELD
2. **Shipped**: Driver picks up → HeldBalance updated with amounts → Funds still HELD
3. **Delivered**: Driver marks complete → Customer notified → Funds still HELD
4. **Released**: One of confirmation types triggers → Funds distributed to vendor/driver/admin

### 5.5 Dispute Handling

When customer reports non-receipt:
- Transaction status → DISPUTED
- Funds remain in HELD state
- Auto-release timer disabled
- Driver and vendor notified
- Dispute record created
- Escalated to admin/manager

### 5.6 Resolution Outcomes

| Outcome | Wallet Action |
|---------|---------------|
| Customer Wins | Full refund to customer |
| Driver Wins | Funds released to vendor/driver/admin |
| Partial Refund | Split proportionally |
| Fraud Suspected | Lock wallet, flag account |

### 5.7 Anti-Fraud Safeguards

**Per-User Tracking**:
- Dispute count (30 days and lifetime)
- Dispute win rate
- Fraud risk score (0-100)

**Escalation Rules**:
- 3+ disputes in 30 days → Require admin approval
- 80%+ win rate with 5+ disputes → Flag for review
- Driver with 3+ disputes → Require OTP for all deliveries
- Multiple disputes from same address → Flag as high-risk

**Dynamic Confirmation Strictness**:
- Low Risk (0-30): 7-day auto-release allowed
- Medium Risk (31-60): 3-day auto-release, encourage confirmation
- High Risk (61-100): Require OTP, no auto-release, admin review required

### 5.8 Database Models

**HeldBalance**: Tracks held funds per order with vendor/driver/admin amounts, status, and auto-release date

**Dispute**: Manages dispute lifecycle with customer/driver evidence, status, assigned admin, and resolution

**DisputeAuditLog**: Immutable audit trail for all dispute actions

**WalletTransaction**: Extended with balanceType, heldBalanceId, deliveryConfirmationType fields

### 5.9 Configuration Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `wallet_auto_release_enabled` | true | Enable auto-release feature |
| `wallet_auto_release_days` | 7 | Days before auto-release |
| `wallet_otp_required_risk_threshold` | 61 | Risk score requiring OTP |
| `wallet_dispute_max_per_month` | 3 | Max disputes per user/month |
| `wallet_require_customer_confirmation` | false | Require confirmation for all |

---

## 6. Order Auto-Cancellation

### Vendor Timeout
- Orders in PLACED status auto-cancelled if vendor doesn't accept within timeout
- Default timeout: 30 minutes (configurable via `order_timeout_minutes`)
- Wallet payments automatically refunded
- Customer notified with reason

### Configuration Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `vendor_auto_cancel_enabled` | true | Enable auto-cancel feature |
| `order_timeout_minutes` | 30 | Minutes before auto-cancel |

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
| Customer Confirmation Endpoint | ✅ Implemented |
| Vendor Timeout Auto-Cancel | ✅ Implemented |
| OTP Verification | ⏳ Future Enhancement |
| Photo Proof Validation | ⏳ Future Enhancement |

---

**Last Updated**: 2026-01-09
