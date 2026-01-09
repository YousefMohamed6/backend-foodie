# Wallet Protection - Quick Reference

A developer quick reference for the wallet protection system.

---

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Held Balance** | Funds deducted from customer but not released to sellers until delivery confirmed |
| **Auto-Release** | Automatic release of held funds after timeout period (default: 7 days) |
| **Dispute** | Customer claims non-receipt, triggering investigation and fund freeze |

---

## Balance States

| State | Description |
|-------|-------------|
| HELD | Funds locked pending delivery |
| RELEASED | Distributed to vendor/driver/admin |
| REFUNDED | Returned to customer |
| DISPUTED | Under investigation |

---

## Confirmation Types

| Type | Trigger |
|------|---------|
| CUSTOMER_CONFIRMATION | Customer clicks confirm in app |
| OTP_CONFIRMED | Driver enters customer OTP |
| TIMEOUT_RELEASE | Cron job after N days |
| ADMIN_RESOLUTION | Admin manual action |
| PHOTO_PROOF | Future enhancement |

---

## API Endpoints

| Endpoint | Method | Role | Description |
|----------|--------|------|-------------|
| `/orders/:id/confirm-delivery` | POST | CUSTOMER | Confirm receipt, release funds |
| `/orders/:id/dispute` | POST | CUSTOMER | Report non-receipt |
| `/orders/:id/protection-status` | GET | ALL | Get held balance status |

---

## Service Methods

### WalletProtectionService

| Method | Purpose |
|--------|---------|
| `createHeldBalance()` | Create held balance on wallet payment |
| `releaseHeldBalance()` | Release funds to sellers |
| `refundHeldBalance()` | Refund to customer |
| `createDispute()` | File dispute |
| `addDriverResponse()` | Driver responds to dispute |
| `resolveDispute()` | Admin resolves dispute |
| `processAutoReleases()` | Cron: auto-release eligible orders |

---

## Configuration Settings

| Key | Default | Description |
|-----|---------|-------------|
| `wallet_auto_release_enabled` | true | Enable auto-release |
| `wallet_auto_release_days` | 7 | Days before auto-release |
| `wallet_otp_required_risk_threshold` | 61 | Risk score requiring OTP |
| `wallet_dispute_max_per_month` | 3 | Max disputes per user/month |
| `wallet_require_customer_confirmation` | false | Require confirmation for all |

---

## Order Lifecycle (Wallet Payment)

| Stage | Funds State | Action |
|-------|-------------|--------|
| Order Created | HELD | Customer wallet deducted |
| Pickup (SHIPPED) | HELD | Amounts calculated |
| Delivered (COMPLETED) | HELD | Customer notified |
| Customer Confirms | RELEASED | Funds distributed |
| Customer Disputes | DISPUTED | Under investigation |
| Timeout (7 days) | RELEASED | Auto-release triggered |

---

## Dispute Outcomes

| Outcome | Action |
|---------|--------|
| Customer Wins | Full refund |
| Driver Wins | Full release |
| Partial | Split proportionally |
| Fraud | Lock account |

---

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | HeldBalance, Dispute, DisputeAuditLog models |
| `wallet-protection.service.ts` | Core business logic |
| `wallet-protection.scheduler.ts` | Auto-release cron job |
| `wallet-protection.dto.ts` | Request/response DTOs |
| `orders.service.ts` | Integration with order flow |
| `orders.controller.ts` | API endpoints |

---

## Scheduler Jobs

| Job | Frequency | Description |
|-----|-----------|-------------|
| `processAutoReleases()` | Every hour | Release orders past timeout |
| `autoCancelUnacceptedOrders()` | Every 5 min | Cancel orders vendors didn't accept |

---

**Last Updated**: 2026-01-09
