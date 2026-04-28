# Quickstart: Self-Serve Host Signup

**Feature**: 002-host-signup

## Prerequisites

- 001-host-admin-portal tenant-isolation work merged (hard dependency — see research §R8).
- Twilio account with a Verify Service SID (provisioned by Ops).
- Env vars set in `backend/.env`:
  - `DW_TWILIO_ACCOUNT_SID=…`
  - `DW_TWILIO_AUTH_TOKEN=…`
  - `DW_TWILIO_VERIFY_SERVICE_SID=…`
  - `DW_SIGNUP_ALLOWED_COUNTRY_CODES=AE,SA,EG`  (founder confirms the launch list before release)
  - `DW_SIGNUP_SESSION_SECRET=…`  (for signed session cookie)
- Founder has written down the target host cohort (names, phones, property types, cities) per the design doc's Assignment.

## Local dev

```bash
# 1. Start the stack
docker-compose -f docker-compose.dev.yml up -d

# 2. Backend dev
cd backend && npm run dev               # port 4004

# 3. Frontend (public landing + wizard)
cd frontend && npm run dev              # port 3004 → http://localhost:3004/become-a-host

# 4. Admin portal
cd admin && npm run dev                 # port 3003
```

## Smoke test (happy path)

1. Visit `http://localhost:3004/become-a-host` on a mobile viewport.
2. Click CTA → Wizard step 1: enter phone in allow-listed country → submit → check Twilio test console for OTP (or use Twilio magic codes in dev).
3. Step 2: enter code → verified.
4. Step 3: enter email + password, agency name, pick location.
5. Step 4: skip teaser property → submit.
6. Redirected to admin portal (port 3003) signed in as the new Agency user.
7. Dashboard shows onboarding checklist: phone ✓, email ☐, property ☐, payout ☐, booking ☐.
8. Add a property → return to dashboard → "First property added" ✓.

## Admin review flow

1. Sign in as a platform admin.
2. Navigate to Agencies → filter "Pending review".
3. The new host appears with `firstPayoutApproved: false`.
4. Click "Approve first payout" → flag flips.
5. Refresh → host no longer in Pending review.

## Regression check (existing admin-provisioned flow — FR-010 / SC-006)

1. As a platform admin, use the existing `CreateAgency` page.
2. Confirm the new agency is created exactly as before, with `onboardingStep: 'done'`, `phoneVerified: true`, `firstPayoutApproved: true` (backfilled defaults).

## Tenant isolation negative test

1. Sign up host A, add property.
2. Sign up host B (different phone/email), log in.
3. Call `GET /api/properties` as host B → MUST NOT return host A's property.

## Backend tests

```bash
cd backend && npm run test -- __tests__/hostSignup.test.ts
```

Cases to cover: happy-path end-to-end, phone collision (409), OTP wrong code → attempts exhaust, details step validation, tenant isolation negative, admin approve-first-payout idempotency, rate limit triggers 429.

## Observability

- `HostSignupAudit` collection is the source of truth for "who signed up when". Query in `mongo-express` at `http://localhost:8081`.
- Track SC-003 (conversion) via landing-page page views ÷ completed signups; add lightweight analytics once the flow is live.

## Rollback

Feature is additive:
- Disable the public route in `userRoutes.config.ts`.
- Existing agencies are unaffected (backfilled defaults match prior behaviour).
- No destructive migration to roll back.
