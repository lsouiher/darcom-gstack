# Phase 1 Data Model: Self-Serve Host Signup

**Feature**: 002-host-signup
**Date**: 2026-04-12

## Overview

Additive changes only. Extend the existing `User` model with three fields; add two new collections (`HostSignupSession` for in-flight wizards, `HostSignupAudit` for post-signup audit trail). No breaking changes to existing schemas.

---

## 1. `User` (extended) — `backend/src/models/User.ts`

### New fields (additive, safe defaults)

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `phoneVerified` | `boolean` | `false` | Set `true` on successful OTP verify. Required for account activation. |
| `firstPayoutApproved` | `boolean` | `false` | Admin flips to `true` after first-payout review. Payout release code must check this. |
| `onboardingStep` | `'phone' \| 'email' \| 'details' \| 'property' \| 'payout' \| 'done'` | `'done'` for existing admin-created agencies; new self-signups progress `phone → email → details → property → payout → done`. | Drives the in-portal onboarding checklist. |

### Existing fields (unchanged, referenced here)

- `type: UserType` — must be `Agency` for self-signed-up hosts.
- `active: boolean` — flipped to `true` when `phoneVerified` becomes `true`.
- `phone: string` — normalised via `libphonenumber-js` before save; unique index.
- `email: string` — unique index (existing).
- `emailVerified: boolean` — reuse existing field if present; otherwise add as part of this feature.
- `password: string` — hashed via existing bcrypt flow.

### Validation rules

- `phone` MUST parse via `libphonenumber-js` and be in the configured country-code allow-list.
- `email` MUST match standard format; unique across all `User`.
- `onboardingStep` MUST progress forward only (no backward transitions).
- `firstPayoutApproved` may only flip `false → true`, never back.

### Indexes

- `phone` (unique) — already required; verify exists.
- `email` (unique) — already required.
- `type + firstPayoutApproved` (compound) — admin "Pending review" filter.

### Migration

Additive. Existing admin-created agencies get backfilled on first boot or via script:
- `phoneVerified = true` (admin-provisioned, trusted)
- `firstPayoutApproved = true`
- `onboardingStep = 'done'`

One-shot migration script in `backend/src/scripts/` — run once pre-deploy.

---

## 2. `HostSignupSession` (new) — `backend/src/models/HostSignupSession.ts`

Short-lived state for in-flight wizard; promoted to a `User` on completion.

| Field | Type | Notes |
|-------|------|-------|
| `_id` | `ObjectId` | Session id (opaque, referenced via signed cookie). |
| `phone` | `string` | Entered in step 1; normalised. |
| `phoneVerified` | `boolean` | Flips `true` on OTP verify. |
| `otpRequestedAt` | `Date` | Rate-limit / replay protection. |
| `otpAttempts` | `number` | Counter; exceed threshold → block. |
| `email` | `string?` | Step 2. |
| `passwordHash` | `string?` | Step 2 — hashed immediately; never stored in plaintext. |
| `agencyName` | `string?` | Step 3. |
| `locationId` | `ObjectId?` | Step 3, references existing `Location`. |
| `teaserProperty` | `{...}?` | Step 4 optional. |
| `ip` | `string` | For audit. |
| `userAgent` | `string` | For audit. |
| `createdAt` | `Date` | TTL index — 24h auto-expiry. |

### Indexes

- `createdAt` (TTL 86400s) — auto-cleanup of abandoned sessions.
- `phone` — lookup on OTP verify.

### Lifecycle

1. Client hits `POST /api/signup/host/start` → session created, OTP sent via Twilio Verify.
2. Client calls `POST /api/signup/host/verify-phone` → `phoneVerified = true`.
3. Subsequent steps patch the session record.
4. Final step promotes session → new `User(type: Agency, active: true, phoneVerified: true, onboardingStep: 'property' | later)`, emits `HostSignupAudit`, deletes the session.

---

## 3. `HostSignupAudit` (new) — `backend/src/models/HostSignupAudit.ts`

Append-only record, one per completed signup. Admin-readable, never mutated after write.

| Field | Type | Notes |
|-------|------|-------|
| `_id` | `ObjectId` | |
| `userId` | `ObjectId` | Ref → `User`. |
| `event` | `'host_signup'` | Enum-like (extensible later). |
| `ip` | `string` | |
| `userAgent` | `string` | |
| `flags` | `string[]` | e.g., `['duplicate_address']`. Empty for clean signups. |
| `createdAt` | `Date` | |

### Indexes

- `userId` — admin lookup per host.
- `createdAt` — sort newest-first in admin views.

---

## 4. Shared Types (`packages/darywin-types`)

### New payloads

- `HostSignupStartPayload { phone: string }`
- `HostSignupStartResponse { sessionId: string } // sessionId also set as signed cookie`
- `VerifyPhonePayload { code: string }`
- `HostSignupDetailsPayload { email, password, agencyName, locationId, teaserProperty? }`
- `HostSignupResponse { token: string, user: User }` — final step returns JWT + user.

### Extended interfaces

- `User` interface gains `phoneVerified`, `firstPayoutApproved`, `onboardingStep`.

### New enum

- `OnboardingStep = 'phone' | 'email' | 'details' | 'property' | 'payout' | 'done'`

---

## 5. Derived view: Onboarding Checklist

Not a stored entity. Computed server-side per-request:

| Item | Source |
|------|--------|
| Phone verified | `user.phoneVerified` |
| Email verified | `user.emailVerified` |
| First property added | `Property.countDocuments({ agencyId: user._id }) > 0` |
| Payout account added | `user.payoutAccountId != null` (existing field) |
| First booking received | `Booking.exists({ agencyId: user._id, status: paid })` |

Exposed via `GET /api/host/onboarding` for the admin-portal dashboard.

---

## State transitions

```
(no account)
      │
      ▼   POST /signup/host/start (phone)
HostSignupSession {phoneVerified:false}
      │
      ▼   POST /signup/host/verify-phone (code)
HostSignupSession {phoneVerified:true}
      │
      ▼   POST /signup/host/details (email, pw, agency, location)
HostSignupSession {+details}
      │
      ▼   POST /signup/host/complete
User {type:Agency, active:true, phoneVerified:true, firstPayoutApproved:false, onboardingStep:'property'}
+ HostSignupAudit entry
- HostSignupSession deleted
      │
      ▼   (host adds property) → onboardingStep:'payout'
      ▼   (host adds payout account) → onboardingStep:'done' (checklist complete; admin still gates first payout)
      ▼   (admin approves) → firstPayoutApproved:true
```
