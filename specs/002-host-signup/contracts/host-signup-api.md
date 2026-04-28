# API Contracts: Self-Serve Host Signup

**Feature**: 002-host-signup
**Base URL**: `/api`
**Auth**: All signup endpoints are **public** (no JWT). Admin approval endpoint requires `UserType.Admin` JWT. Onboarding checklist requires `UserType.Agency` JWT.

All request / response shapes live in `packages/darywin-types`.

---

## POST `/api/signup/host/start`

Create a signup session and dispatch OTP.

**Public.** Rate-limited: 5/hour/IP.

### Request

```json
{ "phone": "+971501234567" }
```

### Response 200

```json
{ "sessionId": "65f0a1b2c3d4e5f6a7b8c9d0" }
```

Sets `Set-Cookie: dw_signup_session=<signed-sessionId>; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`.

### Errors

- `400` — invalid phone, unsupported country code.
- `409` — phone already belongs to an existing `User`.
- `429` — rate-limited.
- `503` — SMS provider unavailable.

---

## POST `/api/signup/host/verify-phone`

Verify OTP.

**Public.** Requires signup session cookie. Rate-limited: 5 attempts / 15 min / phone.

### Request

```json
{ "code": "123456" }
```

### Response 200

```json
{ "phoneVerified": true, "nextStep": "email" }
```

### Errors

- `400` — bad code format.
- `401` — missing/invalid session cookie.
- `403` — wrong code; returns remaining attempts.
- `429` — attempts exhausted.

---

## POST `/api/signup/host/details`

Submit email, password, agency name, location, optional property teaser.

**Public.** Requires session with `phoneVerified:true`.

### Request

```json
{
  "email": "host@example.com",
  "password": "…",
  "agencyName": "Al Noor Rentals",
  "locationId": "65e9…",
  "teaserProperty": { "name": "Flat 2B", "type": "Apartment" }
}
```

### Response 200

```json
{ "nextStep": "complete" }
```

### Errors

- `400` — validation failure (weak password, bad email, missing agencyName).
- `401` — session missing/unverified phone.
- `409` — email already registered.

---

## POST `/api/signup/host/complete`

Promote session → `User`, issue JWT, emit audit entry.

**Public.** Requires session with all prior steps populated.

### Response 200

```json
{
  "token": "eyJ…",
  "user": {
    "_id": "…",
    "type": "Agency",
    "email": "host@example.com",
    "agencyName": "Al Noor Rentals",
    "phoneVerified": true,
    "emailVerified": false,
    "firstPayoutApproved": false,
    "onboardingStep": "property"
  }
}
```

Clears signup-session cookie.

### Errors

- `401` — session missing or incomplete.
- `409` — race: phone or email just taken.

---

## GET `/api/host/onboarding`

Return the computed onboarding checklist for the authenticated host.

**Auth**: `UserType.Agency` JWT.

### Response 200

```json
{
  "items": [
    { "key": "phoneVerified",       "done": true },
    { "key": "emailVerified",       "done": false, "cta": "/admin/profile#email" },
    { "key": "firstPropertyAdded",  "done": false, "cta": "/admin/properties/new" },
    { "key": "payoutAccountAdded",  "done": false, "cta": "/admin/settings/payout" },
    { "key": "firstBookingReceived","done": false }
  ],
  "onboardingStep": "property"
}
```

---

## GET `/api/admin/agencies?filter=pending-review`

List self-signed-up agencies awaiting first-payout approval or flagged by heuristics.

**Auth**: `UserType.Admin` JWT.

### Response 200

```json
{
  "agencies": [
    {
      "_id": "…",
      "agencyName": "…",
      "email": "…",
      "createdAt": "…",
      "flags": ["duplicate_address"],
      "firstPayoutApproved": false
    }
  ]
}
```

---

## PATCH `/api/admin/agencies/:id/approve-first-payout`

Flip `firstPayoutApproved` to `true`. Idempotent.

**Auth**: `UserType.Admin` JWT.

### Response 200

```json
{ "firstPayoutApproved": true }
```

### Errors

- `403` — caller not admin.
- `404` — agency not found.

---

## Email verification (existing pattern)

Reuses existing email-verification endpoint if present; otherwise adds `GET /api/verify-email?token=…`. Not part of the signup wizard critical path (soft-verify per R6).
