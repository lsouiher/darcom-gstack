# Phase 0 Research: Self-Serve Host Signup

**Feature**: 002-host-signup
**Date**: 2026-04-12

Resolves unknowns flagged in the design doc's Open Questions and `plan.md`'s Technical Context.

---

## R1 — SMS / OTP provider

**Decision**: **Twilio Verify API** for day one.

**Rationale**:
- Purpose-built for phone OTP (no hand-rolled code generation, expiry, retry, or rate limiting — all handled server-side by Twilio).
- Broadest country coverage, including the MENA / LatAm / Africa / SE Asia geographies the founder identified as target markets.
- Node SDK is mature and matches the backend's existing TypeScript + ESM + Babel setup.
- Day-one cost (hundreds of signups/month) is negligible; switching later is cheap because the wrapper lives in `backend/src/services/smsProvider.ts`.

**Alternatives considered**:
- **MessageBird Verify** — similar feature set, slightly cheaper in some geos, less familiar; defer unless cost becomes material.
- **Africa's Talking / MSG91 / local providers** — cheapest per-SMS in specific regions, but multi-provider setup on day one violates Simplicity First. Revisit once geography is confirmed and volume justifies a regional split.
- **Self-rolled SMS via raw carrier API + custom OTP store** — rejected; reinvents expiry, rate-limiting, fraud controls. Explicit Constitution §IV violation (add a well-maintained lib vs. write the problem).

**Implementation note**: Wrap Twilio behind `services/smsProvider.ts` with `sendCode(phone)` and `verifyCode(phone, code)` methods. Provider swap later is a one-file change.

---

## R2 — Launch geography (phone country-code allow-list)

**Decision**: **Restrict to a small allow-list at launch** (initially the home country of the named host cohort; configurable via `DW_SIGNUP_ALLOWED_COUNTRY_CODES` env var). Default list captures the founder's known cohort; can be expanded per-deploy without code change.

**Rationale**:
- Matches FR-018 (restrict to supported launch geographies).
- Env-var-driven so Ops can expand without a code release.
- Twilio Verify charges per destination country; an allow-list caps runaway cost from signups in countries we don't serve.

**Alternatives considered**:
- **Global allow-list** — risks fraud signups from high-abuse regions and SMS cost surprises. Rejected for MVP.
- **Hardcoded list** — inflexible; every geography change becomes a deploy. Rejected.

**Follow-up**: Founder confirms the initial allow-list before release; tracked in `quickstart.md`.

---

## R3 — Wizard resume / partial-state persistence

**Decision**: **Short-lived signup session cookie** carrying a `signupSessionId` (opaque, signed). Server stores partial state in a small `HostSignupSession` collection keyed by that id, TTL 24 hours. On each step the backend updates the session; on final step, the session is promoted to a `User` record and the session deleted.

**Rationale**:
- Keeps partial (unverified) data out of the real `User` collection — no half-created agencies, no cleanup cron.
- Allows resume-on-return without exposing state to the client beyond the opaque id.
- TTL auto-cleans abandoned wizards. Matches the "partial records are not visible to admins as active agencies" edge case.

**Alternatives considered**:
- **Create `User` with `active:false` on step 1** — contaminates the real collection, complicates all User queries with `active:true` filters, conflicts with edge case "partial records not visible".
- **Client-only state (localStorage)** — loses state across devices; phone-verified tokens held client-side widen the attack surface.
- **JWT-in-cookie for partial state** — verification state inside the token means every step rewrites the JWT; harder to revoke mid-flow. Session record is simpler.

---

## R4 — Admin first-payout approval mechanism

**Decision**: Add `firstPayoutApproved: boolean` (default `false`) on `User`. Payout-release code (existing or future) checks this flag on the host's user record before releasing funds. Admin approval is a single PATCH on a new admin-only endpoint that flips the flag and records an audit entry.

**Rationale**:
- Additive, minimal, reversible.
- Keeps payout rail choice (Stripe Connect / PayPal / bank / mobile money — out of scope per spec) independent from the gate.
- One flag, one endpoint, one audit row — fits Simplicity First.

**Alternatives considered**:
- **Separate `PayoutApproval` collection with status workflow** — premature; one boolean covers the MVP requirement. Can evolve later if multi-step review becomes necessary.

---

## R5 — Trust heuristic implementation (soft-flag)

**Decision**: During signup finalization, run two cheap checks:
1. Phone number already on another `User` (uniqueness collision — hard-block per FR-008; returns error).
2. Address geocode matches an existing `Property.location` within a small radius (soft-flag: account still created, but `HostSignupAudit.flags` records `"duplicate_address"`).

Display flagged accounts in the admin "Pending review" view alongside unapproved-first-payout accounts.

**Rationale**:
- Leverages existing `Location` / `Property` data. No new infrastructure.
- Soft-flag preserves conversion for legitimate duplicates (e.g., husband/wife listing same building).
- Admin's first-payout gate is the hard backstop; heuristics are advisory signal.

**Alternatives considered**:
- **Third-party fraud service (Sift, Arkose)** — overkill for MVP volumes; Constitution §IV (dependency justification) fails.
- **ML / behavioural signals** — premature; we don't have the data yet.

---

## R6 — Email verification flow

**Decision**: Soft-verify. On signup, generate a token, store it on `User.emailVerifyToken` with 24h expiry, send a verification link. Account is active immediately; `emailVerified` stays `false` until the link is clicked. Sensitive follow-up actions (payout account setup) are gated on `emailVerified === true`.

**Rationale**: Matches FR-004 ("email verification MAY complete asynchronously") and reduces wizard drop-off. Consistent with existing patterns in the codebase for email-based flows.

**Alternatives considered**:
- **Hard block until verified** — higher drop-off, no measurable fraud benefit on top of phone + admin payout gate.

---

## R7 — Rate limiting

**Decision**: Apply IP + phone-number-scoped rate limits on `/api/signup/host/start` and `/api/signup/host/verify-phone`. Use `express-rate-limit` if not already present (small, well-trusted, one file). Limits (tunable): 5 signup starts/hour/IP, 5 OTP verify attempts per phone per 15 min.

**Rationale**: FR-017. Standard defense against OTP enumeration and signup spam. Library is tiny; swap later if we outgrow in-memory store.

**Alternatives considered**:
- **Twilio Verify built-in rate limiting** — covers OTP verify; does not cover the signup-start endpoint. We still need our own limiter for that.
- **Redis-backed store** — not justified at expected volume; in-memory is fine until we have >1 backend instance.

---

## R8 — Tenant isolation prerequisite (001-host-admin-portal)

**Decision**: **Hard dependency.** 002-host-signup MUST NOT ship before 001-host-admin-portal's tenant-isolation work is merged and verified. The design doc explicitly calls this out: "without that, this feature is a security hole."

**Rationale**: Self-signed-up hosts must be server-side-scoped to their own agency on every query. The spec's FR-009 depends on 001's scoping.

**Gate**: Phase 2 tasks for 002 should include a smoke-test task: "Verify tenant isolation negative test — host A cannot read host B's properties/bookings."

---

## All NEEDS CLARIFICATION items resolved. Phase 1 unblocked.
