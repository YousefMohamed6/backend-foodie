# 🛡️ Security Vulnerability Report & Remediation Plan

**Date:** Jan 25, 2026  
**Status:** 🔴 **Unsafe for Production**  
**Auditor:** AI Security Architect

---

## 🚨 Executive Summary
A security audit of the **Foodie** application (Flutter Mobile App + NestJS Backend) has identified **3 Critical**, **1 High**, and **2 Medium** priority vulnerabilities. Immediate action is required before any public release or production deployment.

This document serves as a step-by-step guide for developers to fix these issues.

---

## 📊 Priority Matrix

| ID | Severity | Component | Issue | Fix Effort | Status |
|---|---|---|---|---|---|
| **SEC-01** | 🔴 **CRITICAL** | **Flutter** | Hardcoded Payment Gateway Token | Low | ❌ Open |
| **SEC-02** | 🔴 **CRITICAL** | **Flutter** | Missing SSL Pinning | Medium | ❌ Open |
| **SEC-03** | 🔴 **CRITICAL** | **Flutter** | Cleartext HTTP & IP Config | Low | ❌ Open |
| **SEC-04** | 🟠 **HIGH** | **Backend** | Predictable OTP Generation | Low | ❌ Open |
| **SEC-05** | 🟡 **MEDIUM** | **Backend** | PII Exposed in Cache | Low | ❌ Open |
| **SEC-06** | 🟡 **MEDIUM** | **Flutter** | No Root/Jailbreak Detection | Medium | ❌ Open |

---

## 🛠️ Remediation Tasks

### 🔴 SEC-01: Hardcoded Payment Secrets (Immediate Action)
**Risk:** An attacker can extract the `accessToken` from the app binary and use it to abuse the Fawaterak payment quota or create fraudulent invoices on behalf of the merchant.
**Affected File:** `customer/lib/core/shared/services/fatwaterak_service.dart`

**Current Code (VULNERABLE):**
```dart
final accessToken = 'd83a5d07aaeb8442dcbe259e6dae80a3f2e21a3a581e1a5acd'; // ❌ EXPOSED
```

**Fix Instructions:**
1.  **Revoke Token:** Immediately log in to the Fawaterak dashboard and revoke this specific API token.
2.  **Delete Client Logic:** Delete the file `customer/lib/core/shared/services/fatwaterak_service.dart`.
3.  **Move to Backend:**
    *   Create a payment service in NestJS (`backend/src/modules/payment`).
    *   Store the *new* API token in `backend/.env`.
    *   Expose an endpoint `POST /api/v1/payment/create-link` that accepts order details and returns the payment URL.
4.  **Update App:** The Flutter app should only call your backend endpoint, never Fawaterak directly.

---

### 🔴 SEC-02: User Data & Traffic Interception (SSL Pinning)
**Risk:** The app uses standard HTTP clients without SSL pinning. Attackers using tools like Charles Proxy (MITM) can decrypt all traffic, stealing user passwords, session tokens, and location data.
**Affected File:** `customer/lib/core/shared/services/api_service.dart`

**Fix Instructions:**
1.  **Switch to Dio (Recommended):** The project already has `dio` in `pubspec.yaml`. Use it instead of `http`.
2.  **Implement Pinning:**
    *   Extract the **Subject Public Key Info (SPKI)** SHA-256 hash from your API's SSL certificate.
    *   Configure Dio to reject any certificate that doesn't match this hash.
    *   *Note:* Do not pin the leaf certificate itself (it expires too often); pin the public key.

**Example Implementation Plan:**
```dart
// lib/core/config/dio_config.dart
dio.interceptors.add(CertificatePinningInterceptor(
  allowedSHAFingerprints: ["YOUR_PUBLIC_KEY_HASH"]
));
```

---

### 🔴 SEC-03: Cleartext Network Configuration
**Risk:** The app communicates over `http://` to a hardcoded local IP (`192.168.1.8`). In a real environment, this exposes all data in cleartext to anyone on the same Wi-Fi network.
**Affected File:** `customer/lib/core/shared/config/api_config.dart`

**Fix Instructions:**
1.  **Use HTTPS:** Ensure the production server has a valid SSL certificate (e.g., via LetsEncrypt).
2.  **Environment Variables:** Do not hardcode IPs. Use `flutter build --dart-define` or a `.env` file for Flutter.
3.  **Android Security Config:**
    *   Update `android/app/src/main/AndroidManifest.xml`.
    *   Set `android:usesCleartextTraffic="false"` (except for debug builds).

---

### 🟠 SEC-04: Predictable OTP Generation
**Risk:** The backend uses `Math.random()` to generate OTPs. This is cryptographically insecure and predictable, allowing attackers to potentially bypass 2FA.
**Affected File:** `backend/src/modules/auth/auth.service.ts`

**Current Code (VULNERABLE):**
```typescript
const otp = Math.floor(100000 + Math.random() * 900000).toString(); // ❌ PREDICTABLE
```

**Fix Instructions:**
1.  Use the Node.js `crypto` module for secure random number generation.

**Secure Code:**
```typescript
import { randomInt } from 'crypto';

// Generates a cryptographically secure integer
const otp = randomInt(100000, 1000000).toString();
```

---

### 🟡 SEC-05: PII Exposure in Redis Cache
**Risk:** The `findMe` method caches the entire User object, including Personally Identifiable Information (PII) like phone numbers and emails, in Redis. If Redis is compromised, all user data is leaked.
**Affected File:** `backend/src/modules/users/users.service.ts`

**Fix Instructions:**
1.  **Sanitize Data:** Create a specific DTO (e.g., `CachedUserDto`) that includes *only* what is necessary for the app to function (e.g., `id`, `role`, `firstName`).
2.  **Update Logic:** Map the Database User entitity to this DTO *before* storing it in `redisService.set()`.

---

### 🟡 SEC-06: Missing Root/Jailbreak Detection
**Risk:** The app runs on compromised devices (Rooted/Jailbroken). Malicious apps on the same device can hook into the runtime (using Frida) to steal keys or bypass logic.

**Fix Instructions:**
1.  **Add Dependency:** Add `flutter_jailbreak_detection` or `safe_device` to `pubspec.yaml`.
2.  **App Start Check:**
    ```dart
    bool isSafe = await SafeDevice.isSafeDevice;
    if (!isSafe) {
      // Option A: Warn user
      // Option B: Disable sensitive features (Payments)
      // Option C: Graceful exit (Strict)
    }
    ```

---

## 🏁 Verification Checklist

After applying fixes, verify:
- [ ] Fawaterak token is revoked and no longer in client code.
- [ ] App refuses to connect to any server with an invalid SSL certificate (MITM test).
- [ ] OTPs are generated using `crypto.randomInt`.
- [ ] Redis cache keys for users do not contain full PII blobs.
- [ ] Rooted devices are detected on launch.
