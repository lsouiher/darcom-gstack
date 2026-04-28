# Implementation Plan: Self-Serve Host Signup

**Branch**: `002-host-signup` | **Date**: 2026-04-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-host-signup/spec.md`

## Summary

Add a public "Become a Host" landing page plus a multi-step signup wizard in the frontend app, a public signup API in the backend, and an in-portal onboarding checklist + pending-review queue in the admin app. Accounts reuse the existing Agency user type; trust is gated on day one by phone OTP + admin-approved first payout. Tenant isolation from feature 001-host-admin-portal is the prerequisite that keeps this safe.

## Technical Context

**Language/Version**: TypeScript (Node.js 20 backend via ESM+Babel; React 19 + Vite frontend/admin)
**Primary Dependencies**: Express.js, Mongoose, jose (JWT), MUI, axios (existing); add `libphonenumber-js` (phone validation), SMS provider SDK (see research), existing bcrypt/argon2 via existing User model
**Storage**: MongoDB via Mongoose — extend `User` collection, add `HostSignupAudit` collection
**Testing**: Jest + Supertest against real MongoDB (backend only, per constitution §IX); no frontend tests in this repo
**Target Platform**: Linux server (backend container); evergreen browsers incl. mobile web (frontend/admin)
**Project Type**: Web application (existing backend + frontend + admin; no mobile changes)
**Performance Goals**: Signup API p95 < 500ms excluding SMS provider round-trip; landing page LCP < 2.5s on 4G mobile
**Constraints**: Must not break the existing admin-provisioned Agency creation flow; tenant isolation (001-host-admin-portal) must be in place; launch geography is a limited country-code allow-list
**Scale/Scope**: Low hundreds of signups in first 30 days; no scale pressure. Scope: 1 new public page, 1 wizard, ~4 new backend endpoints, ~2 new User fields, 1 new audit collection, 1 admin filter view + approval action.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicity First** — Reuse `User { type: Agency }`. No new UserType, no new app, no new layer. Onboarding checklist is a derived view, not a stored entity. ✅
- **II. Shared Types Are the Contract** — New payloads (`HostSignupPayload`, `VerifyPhonePayload`, `HostSignupResponse`, flag additions on `User`) go into `packages/darywin-types`. All consuming apps rebuild. ✅
- **III. Layered Architecture** — New routes in `backend/src/config/userRoutes.config.ts` + `src/routes/`, logic in `src/controllers/userController.ts` (or a thin `hostSignupController.ts` if it bloats). No business logic in route handlers. Frontend calls go through `axiosInstance` + a new `src/services/hostSignup.ts`. ✅
- **IV. Dependencies** — Adding `libphonenumber-js` (phone parse/validate — tiny, well-maintained, justified) and one SMS provider SDK (TBD in research — pick one, justify). No other deps. ✅
- **V. Data and MongoDB** — Additive `User` fields with safe defaults: `phoneVerified: boolean`, `firstPayoutApproved: boolean`, `onboardingStep: enum`. Index `phone` (already used for uniqueness check); new `HostSignupAudit` collection with index on `userId` + `createdAt`. No unindexed queries on filter fields. ✅
- **VI. APIs and Backend Logic** — Signup and OTP happen server-side; client never touches DB. Standard HTTP codes + existing error shape. SMS provider key read via `DW_` env var through `env.config.ts`. ✅
- **VII. Authentication and Authorization** — Public endpoints (`/api/signup/host/*`) marked clearly; once signup completes, the issued JWT carries `UserType.Agency` and hits the same `authJwt.verifyToken` middleware as existing agencies. Admin-only "approve first payout" endpoint gated on `UserType.Admin`. Tenant scoping from 001-host-admin-portal governs everything the host can see. ✅
- **VIII. Frontend and Mobile** — New page + wizard in `frontend/src/pages/` using MUI. All strings in `lang/en.ts` and `lang/fr.ts`. Client validation for UX; server re-validates. No inline styles. No mobile-app changes. ✅
- **IX. Testing** — Backend Jest + Supertest covering: happy-path signup, phone collision, OTP verify success/fail, admin approve-first-payout, tenant isolation negative test (signed-up host cannot read another agency). No DB mocking. ✅
- **X. Security** — Rate limit signup + OTP endpoints (per FR-017); SMS provider key in `.env` only; audit log captures IP + UA; sanitize agency name/location inputs; phone numbers normalised via `libphonenumber-js` before storage. ✅

**No violations. Complexity Tracking section empty.**

## CEO Review Expansions (2026-04-12, SELECTIVE EXPANSION)

Accepted cherry-picks from `/plan-ceo-review`. Full record: `~/.gstack/projects/Projects-darcom/ceo-plans/2026-04-12-host-signup.md`. Task-level breakdown: `tasks.md` Phase 6.5 (C01–C36).

**Additional dependencies introduced:**
- `posthog-node` (backend analytics; `posthog-js` on frontend) — justified for SC-003 measurability.
- `resend` (only if no existing transactional email sender is found in `backend/src/`) — needed for C09 resume-link.
- `prom-client` (only if metrics library not already present).

**Additional env vars:**
- `DW_POSTHOG_KEY`, `DW_ANALYTICS_BACKEND`
- `DW_TWILIO_WHATSAPP_ENABLED`
- `DW_FOUNDER_ALERT_WEBHOOK`
- `DW_AUDIT_PEPPER` (HMAC pepper for hashing phone in failure-audit rows)
- `DW_SIGNUP_PUBLIC_ENABLED` (kill switch)

**Rolled-up effort delta:** ~M+ (2–3 CC hours) on top of the base plan's ~1 day.

## Project Structure

### Documentation (this feature)

```text
specs/002-host-signup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── host-signup-api.md
├── checklists/
│   └── requirements.md
├── spec.md
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/
│   │   └── userRoutes.config.ts        # + public signup/OTP paths
│   ├── routes/
│   │   └── userRoutes.ts               # + host signup handlers
│   ├── controllers/
│   │   ├── userController.ts           # + hostSignup, verifyHostPhone, approveFirstPayout
│   │   └── (optional) hostSignupController.ts
│   ├── models/
│   │   ├── User.ts                     # + phoneVerified, firstPayoutApproved, onboardingStep
│   │   └── HostSignupAudit.ts          # NEW
│   ├── services/
│   │   └── smsProvider.ts              # NEW — thin wrapper over chosen SMS SDK
│   ├── middlewares/
│   │   └── rateLimit.ts                # NEW or reuse if present
│   └── utils/
│       └── phone.ts                    # NEW — libphonenumber-js helpers
└── __tests__/
    └── hostSignup.test.ts              # NEW

frontend/
├── src/
│   ├── pages/
│   │   ├── BecomeAHost.tsx             # NEW — public landing page
│   │   └── HostSignupWizard.tsx        # NEW — multi-step wizard
│   ├── services/
│   │   └── hostSignup.ts               # NEW
│   └── lang/
│       ├── en.ts                       # + new strings
│       └── fr.ts                       # + new strings

admin/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx               # + onboarding checklist (for Agency viewers)
│   │   ├── HostOnboardingChecklist.tsx # NEW component (if split out)
│   │   └── Agencies.tsx                # + "Pending review" filter + approve action
│   ├── services/
│   │   └── agencies.ts                 # + approveFirstPayout
│   └── lang/ (en.ts, fr.ts)            # + new strings

packages/
└── darywin-types/
    └── src/
        ├── payloads/
        │   ├── HostSignupPayload.ts         # NEW
        │   ├── VerifyPhonePayload.ts        # NEW
        │   └── HostSignupResponse.ts        # NEW
        └── interfaces/
            └── User.ts                      # + new flags + onboardingStep enum
```

**Structure Decision**: Web application layout. Changes touch `backend`, `frontend`, `admin`, and `packages/darywin-types`. `mobile` is out of scope (the design doc does not require mobile-app changes; web hosts on mobile browsers suffice for the wedge).

## Complexity Tracking

> No Constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR (SELECTIVE EXPANSION) | 6 expansions proposed, 6 accepted, 6 deferred to TODOS; 0 critical gaps; 0 unresolved |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 5 issues (1 arch A01, 3 quality Q01–Q03, 1 perf P01) + 19 new tests (T100–T118); 0 critical gaps; 0 unresolved |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR (FULL) | score 5/10 → 9/10; 23 decisions added (D01–D23); DESIGN.md written; 0 unresolved |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **UNRESOLVED:** 0
- **VERDICT:** CEO + ENG + DESIGN CLEARED — ready to implement. DESIGN.md committed to repo root as source of truth. Mockup generation failed (OpenAI org verification) — not required to proceed.
