# Wallet Protection & Dispute Handling - Implementation Summary

## Overview

This document outlines the wallet-based protection mechanism that prevents loss of customer funds in delivery disputes. The system implements a **held balance** approach where funds are not immediately released upon driver confirmation but remain pending until delivery is verified.

---

## ✅ Implementation Status: COMPLETE

All phases have been implemented and integrated into the codebase.

---

## 1. Database Schema

### New Enums

| Enum | Values | Purpose |
|------|--------|---------|
| `BalanceType` | PAYMENT, HELD, RELEASED, REFUNDED | Track wallet transaction state |
| `DeliveryConfirmationType` | CUSTOMER_CONFIRMATION, OTP_CONFIRMED, PHOTO_PROOF, TIMEOUT_RELEASE, ADMIN_RESOLUTION | How funds were released |
| `HeldBalanceStatus` | HELD, RELEASED, REFUNDED, DISPUTED | Current state of held funds |
| `DisputeStatus` | PENDING, UNDER_REVIEW, RESOLVED_CUSTOMER_WIN, RESOLVED_DRIVER_WIN, RESOLVED_PARTIAL, FRAUD_DETECTED | Dispute lifecycle state |

### New Models

| Model | Description |
|-------|-------------|
| `HeldBalance` | Tracks held funds per order with vendor/driver/admin amounts |
| `Dispute` | Manages dispute lifecycle and evidence |
| `DisputeAuditLog` | Immutable audit trail for dispute actions |

### Updated Models

| Model | Changes |
|-------|---------|
| `WalletTransaction` | Added balanceType, heldBalanceId, deliveryConfirmationType, deliveryConfirmationTime, resolutionReason |
| `Order` | Added heldBalance relation (one-to-one), disputes relation (one-to-many) |

---

## 2. Configuration Settings

| Setting Key | Default | Description |
|-------------|---------|-------------|
| `wallet_auto_release_enabled` | true | Enable/disable auto-release feature |
| `wallet_auto_release_days` | 7 | Days to wait before auto-release |
| `wallet_otp_required_risk_threshold` | 61 | Risk score requiring OTP (0-100) |
| `wallet_dispute_max_per_month` | 3 | Max disputes per user per month |
| `wallet_require_customer_confirmation` | false | Require confirmation for all deliveries |

---

## 3. Service Layer

### WalletProtectionService

**Location**: `src/modules/wallet/wallet-protection.service.ts`

| Method | Description |
|--------|-------------|
| `createHeldBalance()` | Creates held balance when customer pays via wallet |
| `releaseHeldBalance()` | Releases funds to vendor/driver/admin |
| `refundHeldBalance()` | Refunds funds to customer |
| `createDispute()` | Customer reports non-receipt |
| `addDriverResponse()` | Driver responds to dispute |
| `resolveDispute()` | Admin resolves dispute |
| `getPendingAutoReleases()` | Gets orders ready for auto-release |
| `processAutoReleases()` | Cron job to auto-release eligible orders |

### WalletProtectionScheduler

**Location**: `src/modules/wallet/wallet-protection.scheduler.ts`

- Runs every hour
- Processes auto-releases for orders past timeout period
- Checks if auto-release is enabled via settings

---

## 4. API Endpoints

### Customer Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/orders/:id/confirm-delivery` | POST | Customer confirms delivery receipt - releases funds |
| `/orders/:id/dispute` | POST | Customer disputes non-receipt |
| `/orders/:id/protection-status` | GET | Get wallet protection status for order |

### Request/Response

**Confirm Delivery**: No body required. Returns success message and released amount.

**Create Dispute**: Body contains reason and optional evidence (photos, notes).

**Protection Status**: Returns held balance status, dispute info, and action availability flags.

---

## 5. Order Flow Integration

### Order Creation (Wallet Payment)

1. Customer pays via wallet
2. WalletTransaction created with balanceType: HELD
3. Amount deducted from customer wallet
4. HeldBalance record created with auto-release date
5. Order status set to PAID

### Pickup (SHIPPED)

1. Driver picks up order
2. HeldBalance updated with:
   - Driver ID
   - Calculated vendor/driver/admin amounts
   - Updated auto-release date (7 days from shipped)
3. **Funds remain HELD** - NOT released

### Delivery (COMPLETED)

1. Driver marks order as delivered
2. For wallet payments:
   - Customer receives notification to confirm delivery
   - **Funds remain HELD** - NOT released
3. Customer must explicitly confirm OR wait for auto-release

### Release Triggers

Funds released from HELD to recipients when:
- Customer clicks "Confirm Delivery" in app
- OTP verified (future enhancement)
- Auto-release timeout expires (default: 7 days)
- Admin manually resolves

---

## 6. Dispute Workflow

### Filing a Dispute

1. Customer clicks "I didn't receive my order"
2. System validates order is completed and has held balance
3. Dispute record created (status: PENDING)
4. HeldBalance marked as DISPUTED
5. Auto-release timer disabled
6. Driver notified

### Driver Response

1. Driver submits response and evidence
2. Dispute status → UNDER_REVIEW

### Admin Resolution

Admin can resolve with outcomes:
- **Customer Wins**: Full refund to customer
- **Driver Wins**: Funds released to vendor/driver/admin
- **Partial Refund**: Split proportionally
- **Fraud Detected**: Lock and flag account

---

## 7. Anti-Fraud Safeguards

### Implemented

- Atomic transactions for all fund movements
- Immutable audit trail (DisputeAuditLog)
- Status validation prevents double-processing
- Role-based access for dispute resolution
- Evidence storage for review

### Future Enhancements

- Fraud risk scoring per user
- Dispute count and win rate tracking
- OTP verification for high-risk deliveries
- Photo proof with AI validation

---

## 8. File Reference

### Database
- `prisma/schema.prisma` - Schema with new models and enums

### Services
- `src/modules/wallet/wallet-protection.service.ts` - Core logic
- `src/modules/wallet/wallet-protection.scheduler.ts` - Cron job
- `src/modules/wallet/wallet.module.ts` - Module configuration

### Orders Integration
- `src/modules/orders/orders.service.ts` - HeldBalance integration
- `src/modules/orders/orders.controller.ts` - Wallet protection endpoints

### DTOs
- `src/modules/wallet/dto/wallet-protection.dto.ts` - Request/response types

---

## 9. Expected Behavior

### Scenario 1: Successful Delivery

1. Customer pays ₹100 → Funds HELD
2. Driver picks up → Amounts calculated, funds still HELD
3. Driver delivers → Customer notified, funds still HELD
4. Customer confirms → Funds released to vendor/driver/admin

### Scenario 2: Customer Disputes

1. Customer pays → Driver delivers → Order complete
2. Customer disputes non-receipt
3. Funds remain HELD, auto-release disabled
4. Driver responds with evidence
5. Admin reviews and decides winner
6. Funds either refunded to customer or released to sellers

### Scenario 3: Auto-Release

1. Customer pays → Driver delivers → Order complete
2. Customer takes no action for 7 days
3. Cron job triggers auto-release
4. Funds distributed to vendor/driver/admin

---

## 10. Implementation Constraints

### DO NOT
- ❌ Auto-release funds on driver confirmation alone
- ❌ Modify existing delivery UX for drivers
- ❌ Rely on UI interactions for fund release
- ❌ Assume delivery honesty without verification

### MUST
- ✅ Make wallet authoritative for fund state
- ✅ Ensure all transactions are atomic
- ✅ Log every state transition
- ✅ Provide admin override capability

---

**Implementation Status**: ✅ COMPLETE  
**Build Status**: ✅ Passing  
**Last Updated**: 2026-01-09
