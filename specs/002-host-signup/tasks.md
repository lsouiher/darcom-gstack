# Tasks: Self-Serve Host Signup

**Feature**: 002-host-signup
**Branch**: `002-host-signup`
**Input**: `specs/002-host-signup/` — plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

Tests are included per Constitution §IX (backend Jest + Supertest, real MongoDB).

---

## Phase 1: Setup

- [ ] T001 Confirm prerequisite — 001-host-admin-portal tenant isolation merged; if not, halt (per research §R8)
- [ ] T002 Add `libphonenumber-js` to `backend/package.json` dependencies
- [ ] T003 Add `twilio` SDK to `backend/package.json` dependencies
- [ ] T004 Add `express-rate-limit` to `backend/package.json` dependencies (skip if already present)
- [ ] T005 [P] Add `DW_TWILIO_ACCOUNT_SID`, `DW_TWILIO_AUTH_TOKEN`, `DW_TWILIO_VERIFY_SERVICE_SID`, `DW_SIGNUP_ALLOWED_COUNTRY_CODES`, `DW_SIGNUP_SESSION_SECRET` to `backend/src/config/env.config.ts` and `.env.example`
- [ ] T006 [P] Add new i18n string keys (signup wizard + checklist labels + admin review) to `frontend/src/lang/en.ts` and `frontend/src/lang/fr.ts`
- [ ] T007 [P] Add new i18n string keys (checklist + pending-review filter + approve button) to `admin/src/lang/en.ts` and `admin/src/lang/fr.ts`

## Phase 2: Foundational (blocking prerequisites)

- [ ] T008 [P] Add `OnboardingStep` enum to `packages/darywin-types/src/enums/OnboardingStep.ts` and export from package root
- [ ] T009 [P] Extend `User` interface in `packages/darywin-types/src/interfaces/User.ts` with `phoneVerified`, `firstPayoutApproved`, `onboardingStep`
- [ ] T010 [P] Add payload types in `packages/darywin-types/src/payloads/`: `HostSignupStartPayload.ts`, `VerifyPhonePayload.ts`, `HostSignupDetailsPayload.ts`, `HostSignupResponse.ts`, `OnboardingChecklistResponse.ts`; export from package root
- [ ] T011 Build `packages/darywin-types` and re-link consuming apps (`backend`, `frontend`, `admin`)
- [ ] T012 Extend Mongoose `User` schema in `backend/src/models/User.ts` with `phoneVerified` (default false), `firstPayoutApproved` (default false), `onboardingStep` (enum, default 'done'); add compound index `{ type: 1, firstPayoutApproved: 1 }`
- [ ] T013 Write and run backfill script `backend/src/scripts/backfill-host-fields.ts` to set `phoneVerified=true`, `firstPayoutApproved=true`, `onboardingStep='done'` on all existing agencies
- [ ] T014 [P] Create phone utility `backend/src/utils/phone.ts` wrapping `libphonenumber-js` (parse, normalise, country-code allow-list check)
- [ ] T015 [P] Create SMS provider service `backend/src/services/smsProvider.ts` exposing `sendCode(phone)` and `verifyCode(phone, code)` over Twilio Verify
- [ ] T016 [P] Create rate-limit middleware `backend/src/middlewares/rateLimit.ts` with helpers for IP-scoped and phone-scoped limits
- [ ] T017 [P] Create signed signup-session cookie helper `backend/src/utils/signupSession.ts` (sign/verify using `DW_SIGNUP_SESSION_SECRET`)

---

## Phase 3: User Story 1 — Host self-signup from public landing page (P1) 🎯 MVP

**Goal**: A visitor completes the public wizard end-to-end and lands in the admin portal as an active Agency user.

**Independent Test**: Fresh visitor → `/become-a-host` → complete all four steps on mobile viewport → arrive signed-in in admin portal. Also: phone collision rejected; mid-wizard resume works.

### Backend models & session

- [ ] T018 [US1] Create `backend/src/models/HostSignupSession.ts` Mongoose model per data-model.md (fields + TTL index on `createdAt` 86400s + index on `phone`)

### Backend controller & routes

- [ ] T019 [US1] Implement `hostSignupStart` in `backend/src/controllers/userController.ts` — validate phone, check country-code allow-list, check phone uniqueness on `User`, create `HostSignupSession`, call `smsProvider.sendCode`, set signed session cookie, return `{ sessionId }`
- [ ] T020 [US1] Implement `verifyHostPhone` in `backend/src/controllers/userController.ts` — read session cookie, call `smsProvider.verifyCode`, flip `session.phoneVerified=true`, return `{ phoneVerified, nextStep }`; enforce attempt counter
- [ ] T021 [US1] Implement `hostSignupDetails` in `backend/src/controllers/userController.ts` — validate email/password/agencyName/locationId, hash password, require `session.phoneVerified`, check email uniqueness, persist to session
- [ ] T022 [US1] Implement `hostSignupComplete` in `backend/src/controllers/userController.ts` — promote session to `User{type:Agency, active:true, phoneVerified:true, firstPayoutApproved:false, onboardingStep:'property'}`, create optional teaser `Property`, write `HostSignupAudit` entry (see T033), delete session, issue JWT, return `{ token, user }`
- [ ] T023 [US1] Register public paths in `backend/src/config/userRoutes.config.ts`: `POST /signup/host/start`, `POST /signup/host/verify-phone`, `POST /signup/host/details`, `POST /signup/host/complete`
- [ ] T024 [US1] Wire handlers in `backend/src/routes/userRoutes.ts` with rate-limit middleware applied to start + verify-phone

### Frontend landing + wizard

- [ ] T025 [P] [US1] Create public landing page `frontend/src/pages/BecomeAHost.tsx` (hero, value prop, 3-step how-it-works, CTA → `/signup/host`), MUI-styled, mobile-first, all strings from `lang/`
- [ ] T026 [P] [US1] Create `frontend/src/services/hostSignup.ts` with `startSignup`, `verifyPhone`, `submitDetails`, `completeSignup` functions using `axiosInstance`, typed against `darywin-types`
- [ ] T027 [US1] Create multi-step wizard page `frontend/src/pages/HostSignupWizard.tsx` (Steps: Phone+OTP → Email+Password → Agency name+Location → Optional teaser property → Redirect to admin portal with JWT); MUI stepper, mobile-first, error states for 409/429/503
- [ ] T028 [US1] Register routes in `frontend/src/App.tsx` (or equivalent router config): `/become-a-host` (public) and `/signup/host` (public)

### Tests (backend)

- [ ] T029 [US1] Add `backend/__tests__/hostSignup.test.ts`: happy-path full signup (start → verify → details → complete returns valid JWT and persists User)
- [ ] T030 [US1] Extend `backend/__tests__/hostSignup.test.ts`: phone-collision returns 409; unsupported country code returns 400; OTP wrong code returns 403 with remaining attempts then 429 on exhaustion
- [ ] T031 [US1] Extend `backend/__tests__/hostSignup.test.ts`: tenant isolation negative test — host B cannot read host A's properties (depends on 001-host-admin-portal scoping)

**Checkpoint**: Story 1 delivers the MVP — named hosts can onboard themselves end-to-end without admin intervention.

---

## Phase 4: User Story 2 — In-portal onboarding checklist (P2)

**Goal**: Host sees a progressive checklist on the admin dashboard and can navigate directly to each incomplete item.

**Independent Test**: New host logs in → sees checklist with accurate state → adds one property → checklist updates.

### Backend

- [ ] T032 [US2] Implement `getOnboardingChecklist` in `backend/src/controllers/userController.ts` — compute checklist from `user.phoneVerified`, `user.emailVerified`, `Property.countDocuments({agencyId})`, `user.payoutAccountId`, `Booking.exists({agencyId, paid})`
- [ ] T033 [US2] Register `GET /api/host/onboarding` in `backend/src/config/userRoutes.config.ts` and `backend/src/routes/userRoutes.ts` behind `authJwt.verifyToken` + Agency role check
- [ ] T034 [US2] On property creation and payout-account save, advance `user.onboardingStep` forward (never backward) in the existing controller paths (`propertyController.createProperty`, payout save handler)

### Admin UI

- [ ] T035 [P] [US2] Create `admin/src/services/onboarding.ts` with `getOnboardingChecklist()` via `axiosInstance`
- [ ] T036 [US2] Create `admin/src/pages/HostOnboardingChecklist.tsx` component rendering the five checklist items with per-item CTA links
- [ ] T037 [US2] Integrate checklist into `admin/src/pages/Dashboard.tsx` — render only for `UserType.Agency` users; hide for platform admins

### Tests

- [ ] T038 [US2] Add checklist test in `backend/__tests__/hostSignup.test.ts`: fresh signup returns phone ✓, others ☐; after property added, property item ✓

**Checkpoint**: Signup converts to first property listed.

---

## Phase 5: User Story 3 — Admin-gated first payout with pending-review queue (P2)

**Goal**: Platform admins can filter self-signed-up hosts awaiting review, approve, and unblock future payouts.

**Independent Test**: Admin filters Agencies by "Pending review" → sees test host → approves → flag flips → host no longer in queue.

### Backend

- [ ] T039 [US3] Extend `backend/src/controllers/userController.ts` with `listPendingReviewAgencies` — query `User{type:Agency, firstPayoutApproved:false}`, join latest `HostSignupAudit.flags`, return list
- [ ] T040 [US3] Implement `approveFirstPayout` in `backend/src/controllers/userController.ts` — PATCH flip `firstPayoutApproved` to `true` (idempotent), require Admin role
- [ ] T041 [US3] Register admin routes in `backend/src/config/userRoutes.config.ts` / `routes/userRoutes.ts`: `GET /api/admin/agencies?filter=pending-review`, `PATCH /api/admin/agencies/:id/approve-first-payout`; both behind `authJwt.verifyToken` + Admin role
- [ ] T042 [US3] Ensure payout-release code path (existing payout logic) checks `user.firstPayoutApproved`; hold payout if false and surface in an admin pending-payout view (add/update `payoutController` check)

### Admin UI

- [ ] T043 [P] [US3] Extend `admin/src/services/agencies.ts` with `listPendingReview()` and `approveFirstPayout(agencyId)`
- [ ] T044 [US3] Add "Pending review" filter to `admin/src/pages/Agencies.tsx` with columns: agency name, email, createdAt, flags, approve button
- [ ] T045 [US3] Wire approve button → `approveFirstPayout` service call → refresh list

### Tests

- [ ] T046 [US3] Add payout-gate test in `backend/__tests__/hostSignup.test.ts`: self-signed-up host has `firstPayoutApproved=false` by default; PATCH approve flips it; PATCH is idempotent; non-admin caller returns 403

**Checkpoint**: Fraud containment gate operational before any real payouts.

---

## Phase 6: User Story 4 — Trust heuristics soft-flag (P3)

**Goal**: Suspicious signups are created but flagged for admin review.

**Independent Test**: Two signups with overlapping address → second appears in admin flagged view with `duplicate_address`.

- [ ] T047 [US4] In `hostSignupComplete` (T022), after User creation, compute trust flags: if teaser property's address geocodes within small radius of an existing `Property.location`, add `"duplicate_address"` to the `HostSignupAudit.flags` array
- [ ] T048 [US4] Ensure `listPendingReviewAgencies` (T039) surfaces agencies with any `HostSignupAudit.flags` even if `firstPayoutApproved` is already true (flagged view is a superset)
- [ ] T049 [US4] Extend `admin/src/pages/Agencies.tsx` pending-review filter to display flags as chips
- [ ] T050 [US4] Add soft-flag test in `backend/__tests__/hostSignup.test.ts`: two signups at same address → second has `flags:['duplicate_address']` in audit; first has no flags

**Checkpoint**: Heuristic signal available to admins; does not block legitimate duplicates.

---

## Phase 6.5: CEO Review Expansions (SELECTIVE EXPANSION mode, accepted 2026-04-12)

Source: `~/.gstack/projects/Projects-darcom/ceo-plans/2026-04-12-host-signup.md`.
Most of these ride User Story 1 (MVP) — implement alongside Phase 3 unless noted.

### Analytics + funnel instrumentation

- [ ] C01 [P] Add PostHog SDK to `backend/package.json` (or wire existing analytics lib); add `DW_POSTHOG_KEY`, `DW_ANALYTICS_BACKEND` env vars
- [ ] C02 [P] Create `backend/src/services/analytics.ts` with fire-and-forget `track(event, props)` — swallows errors, logs WARN
- [ ] C03 [P] Create `frontend/src/services/analytics.ts` mirror for client-side events
- [ ] C04 [US1] Emit `landing_view` on `BecomeAHost.tsx` mount, `cta_click` on signup CTA, `step_N_enter` / `step_N_complete` on each wizard step, `signup_complete` on final
- [ ] C05 [US1] Emit server-side `signup_started`, `signup_completed`, `signup_failed` (with reason) in `userController.ts`

### WhatsApp-first OTP

- [ ] C06 [US1] Extend `backend/src/services/smsProvider.ts` to prefer `channel=whatsapp` via Twilio Verify; on delivery failure fall back to `channel=sms` and invalidate prior code
- [ ] C07 [US1] Add `DW_TWILIO_WHATSAPP_ENABLED` env var (default true); when false, behave as SMS-only
- [ ] C08 [US1] Wizard OTP step shows which channel the code was sent via + "try SMS instead" link that regenerates

### Cross-device resume link

- [ ] C09 [US1] After step 2 (email captured), send signed resume link `/signup/host/resume?t=…` via transactional email (reuse existing sender; if none, add Resend)
- [ ] C10 [US1] Implement `GET /api/signup/host/resume` — verify signed token (24h TTL, single-use), set session cookie, redirect to correct step
- [ ] C11 [US1] Invalidate resume token on signup completion

### Founder alert

- [ ] C12 [US1] On `hostSignupComplete`, POST payload `{agencyName, phone, city, flags}` to `DW_FOUNDER_ALERT_WEBHOOK` (Slack-compatible). Fire-and-forget. Skip if env var unset.

### Failure-event audit

- [ ] C13 [US1] Extend `HostSignupAudit.event` enum: `'host_signup' | 'otp_failed' | 'phone_collision' | 'rate_limited' | 'country_blocked' | 'email_collision'`
- [ ] C14 [US1] Write audit row on each failure path in `userController.ts`. Hash phone with SHA256 + pepper (`DW_AUDIT_PEPPER`) for failure events; keep raw phone on success rows (which reference the User)

### Property-ownership expectation copy

- [ ] C15 [P] [US1] Add lang keys and render a one-line note on wizard step 3 confirmation area: "We'll verify property ownership before your first payout." (EN + FR)

### Security hardening (from Section 3)

- [ ] C16 [US1] Generic 409 copy on phone + email collision: avoid confirming whether phone/email exists; phrase as "use a different X or sign in"

### Quality refactor (from Section 5)

- [ ] C17 [US1] Extract `backend/src/middlewares/loadSignupSession.ts` — one source for cookie parse + session load + stale check; apply to all `/signup/host/*` post-start endpoints
- [ ] C18 [US1] Extract `promoteSessionToUser` and `emitSignupSideEffects` helpers from `hostSignupComplete` to keep cyclomatic ≤ 5

### Edge-case coverage (from Section 4)

- [ ] C19 [US1] Two-tab stale completion: if session has been promoted, return 410 Gone on second `/complete` call with "session no longer valid, please sign in"

### Observability (from Section 8)

- [ ] C20 [P] Emit metrics: `signup_started_total`, `signup_completed_total`, `otp_sent_total{channel}`, `otp_verify_failed_total`, `signup_duration_seconds` (histogram) via existing metrics lib (or add `prom-client` if none)
- [ ] C21 [P] Build day-1 funnel dashboard (PostHog funnel view + per-country + per-channel + audit-flag distribution). Record dashboard URL in `specs/002-host-signup/quickstart.md`
- [ ] C22 [P] Add 2 alerts: (a) funnel completion ratio < 0.3 over rolling 24h, (b) `otp_verify_failed_total` spike (>3σ over baseline)
- [ ] C23 [P] Write `docs/runbooks/twilio-outage.md` and `docs/runbooks/posthog-outage.md` (one page each)

### Performance (from Section 7)

- [ ] C24 [US3] Ensure admin pending-review query uses Mongo aggregation `$lookup` to join `HostSignupAudit.flags` once — NOT per-agency loop

### Deploy safety (from Section 9)

- [ ] C25 [P] Add `DW_SIGNUP_PUBLIC_ENABLED` env var (default `true`). When `false`, public signup routes return 503 "signup temporarily closed"; existing admin-provisioned flow unaffected
- [ ] C26 Verify SPF/DKIM on sending domain before enabling C09 (resume-link email)

### Wizard UX gaps (from Section 11)

- [ ] C27 [US1] Distinguishable error copy per wizard step: phone ("format"/"unsupported country"/"already registered" → generic per C16), OTP ("wrong code, N left" / "too many attempts, restart"), email ("already registered" → generic per C16)
- [ ] C28 [US1] Preserve entered OTP value when user navigates back and forward
- [ ] C29 [US1] "Session expired" recovery: on any 401 from expired session, redirect to `/become-a-host` with a toast "Your session expired, please start again"

### Tests (from Section 6) — add to `backend/__tests__/hostSignup.test.ts`

- [ ] C30 [US1] WA→SMS fallback: mock Twilio WA send fail, assert SMS send called and WA code invalidated
- [ ] C31 [US1] Resume link: valid token redirects to correct step; expired 401; tampered 401; reused 401
- [ ] C32 [US1] Analytics fire-and-forget: PostHog unreachable does not fail signup (assert `signup_complete` returns 200 with mocked analytics throwing)
- [ ] C33 [US1] Slack alert fire-and-forget: bad webhook URL does not fail signup
- [ ] C34 [US1] Failure audit: each failure path produces correct `event` enum + hashed phone
- [ ] C35 [US1] Two-tab stale completion: second `/complete` returns 410
- [ ] C36 [US1] `loadSignupSession` middleware: missing cookie 401, bad signature 401, expired 401

---

## Phase 6.75: Eng Review Additions (2026-04-12)

Source: `/plan-eng-review` on commit eccc461. Adds 1 architecture check, 2 quality refactors, 18 tests, 1 perf tweak.

### Architecture

- [ ] A01 [US1] Verify tenant-isolation middleware from 001-host-admin-portal correctly skips `@Public`-annotated signup routes (or add a path allow-list if annotation not supported). Add smoke test: unauthenticated `POST /api/signup/host/start` → 400 (missing phone), not 401. If middleware does not support public routes, modify it in this PR.

### Code quality refactors

- [ ] Q01 [US1] Create `backend/src/utils/audit.ts` exporting `writeAudit(event, {userId?, phoneHash?, flags?, ip, ua})`. Use from all 5+ call sites (success + 4 failure paths). Keep phone-raw on success events, hashed on failure events.
- [ ] Q02 [US1] Create `backend/src/utils/fireAndForget.ts` exporting `fireAndForget(label: string, promise: Promise<unknown>)` — catches, WARN-logs with label, never throws. Use for analytics, slack webhook, resume-link email, audit write.
- [ ] Q03 [US1] In `backend/src/services/smsProvider.ts` map typed Twilio errors to our error shape: rate-limit (20429) → our 429; carrier unreachable (60203/60200) + 5xx → 503 with distinct user copy per reason. No generic `catch (e)`.

### Performance

- [ ] P01 [P] Set `Cache-Control: public, max-age=300` on `GET /become-a-host` (or whatever the hosting layer uses for static-ish public pages).

### Additional backend tests (Jest + Supertest) — add to `backend/__tests__/hostSignup.test.ts`

- [ ] T100 [US1] `hostSignupStart`: invalid phone format → 400; unparseable phone → 400
- [ ] T101 [US1] `hostSignupStart`: country-code blocked → 400 + `HostSignupAudit.event='country_blocked'`
- [ ] T102 [US1] `hostSignupStart`: smsProvider WA+SMS both fail → 503, session retained, audit `'otp_send_failed'`
- [ ] T103 [US1] `hostSignupStart`: IP rate limit triggers → 429
- [ ] T104 [US1] `hostSignupDetails`: weak password 400; bad email 400; email collision 409 with enumeration-safe copy
- [ ] T105 [US1] `hostSignupDetails`: session without `phoneVerified` → 401
- [ ] T106 [US1] `hostSignupComplete`: phone race (another signup finished first) → 409 + audit `'phone_collision'`
- [ ] T107 [US1] `hostSignupComplete`: email race → 409
- [ ] T108 [US1] `hostSignupComplete`: teaser-property present → `Property` created + `onboardingStep='payout'`; teaser absent → `onboardingStep='property'`
- [ ] T109 [US1] `hostSignupComplete`: audit write throws → signup still returns 200 (fire-and-forget via Q02)
- [ ] T110 [US2] `getOnboardingChecklist`: each of 5 items flips correctly (phone, email, property, payout, booking)
- [ ] T111 [US3] `listPendingReviewAgencies`: aggregation returns flags joined; assert query count via Mongoose hooks (NO N+1)
- [ ] T112 [P] `smsProvider`: `DW_TWILIO_WHATSAPP_ENABLED=false` → SMS-only path; typed Twilio error mapping per Q03
- [ ] T113 [P] `signupEnabledGuard` middleware: `DW_SIGNUP_PUBLIC_ENABLED=true` → pass-through; `false` → 503 on all 4 public endpoints; existing admin `CreateAgency` unaffected
- [ ] T114 [P] `utils/phone.ts`: normalise E.164; allow/deny by country code; unparseable throws
- [ ] T115 [P] `utils/audit.ts` (Q01): hashes phone for failure events; raw for success events; deterministic hash with `DW_AUDIT_PEPPER`
- [ ] T116 [US1] Wizard cookie-only resume: existing session → advances to last completed step; expired → 401
- [ ] T117 [US1] Session-expired recovery: expired cookie on any wizard endpoint → 401 with consistent error shape for client redirect
- [ ] T118 [Polish] **Regression:** automated Jest test for existing admin-provisioned `CreateAgency` flow — create agency via existing path, assert backfilled defaults (`phoneVerified=true`, `firstPayoutApproved=true`, `onboardingStep='done'`), assert agency can log in. Upgrade from manual T055.

### Kill-switch middleware (supersedes C25's route-level approach)

- [ ] K01 [US1] Create `backend/src/middlewares/signupEnabledGuard.ts` reading `DW_SIGNUP_PUBLIC_ENABLED`. Apply to all 4 `/api/signup/host/*` routes in one place. Existing admin routes unaffected. Replaces C25's route-level checks.

---

## Phase 6.9: Design Review Additions (2026-04-12)

Source: `/plan-design-review`. DESIGN.md written to repo root. All tasks ride US1 unless noted.

### Landing page (BecomeAHost.tsx)

- [ ] D01 [US1] Implement IA per Pass 1: hero (brand mark top-left, headline "List your property. Get paid without chasing tenants.", supporting sentence, primary CTA "Become a host", "Already a host? Sign in" secondary micro-link bottom of hero); How-it-works as **horizontal numbered journey** (01/02/03 with connecting scroll line on desktop; vertical narrative on mobile — NO icon-in-circle grid); trust line "We verify property ownership before your first payout."; minimal footer with EN/FR toggle.
- [ ] D02 [US1] Hero composition: full-bleed, left-aligned body, cardless, one accent panel in `--color-surface-2`. No hero image/video/illustration v1.
- [ ] D03 [US1] `<noscript>` fallback with a plain-text "Email us to sign up" line (JS load failure safety net).

### Wizard (HostSignupWizard.tsx)

- [ ] D04 [US1] Per-step IA: progress indicator (Step N of 4) top, single focused question, helper text, primary action, back affordance (except step 1). Single-column, max-width 480px desktop, sticky-bottom CTA on mobile.
- [ ] D05 [US1] OTP input: **single** `<input type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]*" maxlength="6">` — NOT 6 separate boxes. Auto-submits at 6 digits.
- [ ] D06 [US1] Post-OTP-verify: 250ms check-mark tick micro-interaction before advancing.
- [ ] D07 [US1] Step 4 skip action: clearly labeled secondary button "Skip, I'll add it later" with equal weight to "Add property now" (not a small link).
- [ ] D08 [US1] Step 3 empty-location-results state: message + "add a city" affordance (deferred if out of scope → see TODO).

### Admin (Dashboard + Agencies)

- [ ] D09 [US2] Onboarding checklist empty state (first login): warm copy "Welcome aboard. Here's your path to your first booking." with 5 items and inline CTAs.
- [ ] D10 [US2] Onboarding checklist fetch-fail state: "Couldn't load your progress. Retry." with retry button.
- [ ] D11 [US2] Checklist item-flip micro-interaction: 250ms tick + row highlight that fades in 400ms.
- [ ] D12 [US3] Pending-review empty state: "You're caught up. No hosts waiting on first-payout approval." (not default "No items found").
- [ ] D13 [US3] "Approve first payout" button opens confirmation dialog with focus trap; confirms agency name + first payout gate lift.

### Accessibility

- [ ] D14 [P] [US1] Wizard step-change announces via `aria-live="polite"` region.
- [ ] D15 [P] [US1] Progress indicator: `role="progressbar"` with `aria-valuenow/min/max`.
- [ ] D16 [P] [US1] Error messages link to inputs via `aria-describedby`.
- [ ] D17 [P] [US1] Focus ring style per DESIGN.md (`outline: 2px solid var(--color-accent); outline-offset: 2px`) applied globally.

### Design system plumbing

- [ ] D18 [P] Extend MUI theme (`frontend/src/theme.ts` and `admin/src/theme.ts`): override palette → `--color-accent`; Button radius 4px; remove default Button elevation; `tabular-nums` on step indicators. Read tokens from CSS vars.
- [ ] D19 [P] Include Inter Tight + Inter fonts via `<link rel="preconnect">` on Google Fonts or self-hosted. No system-stack fallback on brand surfaces.
- [ ] D20 [P] Add CSS variables from `DESIGN.md` to `frontend/src/index.css` and `admin/src/index.css` on `:root`.

### Copy / i18n

- [ ] D21 [P] [US1] Landing page EN + FR strings in lang files. Reserve 30% extra button width for FR.
- [ ] D22 [P] [US1] Resume-link email (EN + FR): Subject "Finish becoming a host on DaryWin" / body "You started signing up. Your link expires in 24 hours. Finish in 3 minutes — [button]. If this wasn't you, ignore this email." Warm + specific tone.
- [ ] D23 [P] [US1] Founder Slack alert copy: "New host signup: {agencyName} · {phone} · {city}{flags?}. Call them this week."

---

## Phase 7: Polish & Cross-Cutting

- [ ] T051 Create `backend/src/models/HostSignupAudit.ts` Mongoose model per data-model.md (fields + indexes on `userId` and `createdAt`) — NOTE: create this in Phase 2 if T022 is worked on first; placed here only if skipped earlier
- [ ] T052 [P] Run `npm run pre-commit` at repo root — fix any lint/type-check/file-size issues
- [ ] T053 [P] Run `cd backend && npm run test` — full suite must pass
- [ ] T054 [P] Manually execute the quickstart.md smoke test on desktop and mobile viewport
- [ ] T055 Confirm SC-006 regression: admin-provisioned `CreateAgency` flow still works unchanged
- [ ] T056 Confirm launch geography allow-list with founder; set `DW_SIGNUP_ALLOWED_COUNTRY_CODES` in deploy env
- [ ] T057 Document the feature in `CHANGELOG` / release notes

> **Note on T051**: `HostSignupAudit` is first written in T022 (User Story 1). The model must therefore exist before T022. Move T051 to Phase 2 during execution; it is listed here only as a reminder for polish-phase validation that the model exists with the correct indexes.

---

## Dependencies

```
Phase 1 (Setup) ─┐
                 ├─> Phase 2 (Foundational: types, schema, SMS, session) ─┐
                 │                                                        ├─> Phase 3 (US1 — MVP)
                 │                                                        ├─> Phase 4 (US2)  depends on US1
                 │                                                        ├─> Phase 5 (US3)  independent of US2; can run parallel
                 │                                                        └─> Phase 6 (US4)  depends on US1 (extends T022)
                                                                              │
                                                                              └─> Phase 7 (Polish)
```

- **US2 depends on US1** (needs an authenticated host account to test).
- **US3 depends on US1** (needs self-signed-up hosts in DB); **independent of US2**.
- **US4 depends on US1** (extends the complete-signup flow) and on **US3** (uses the admin pending-review view to surface flags).

## Parallel Execution Examples

**Phase 1 (Setup)** — after package.json edits are sequential, these can parallelize:
- T005, T006, T007 in parallel.

**Phase 2 (Foundational)** — after T011 (types build), run in parallel:
- T012 (User schema) and T014 (phone util) and T015 (SMS wrapper) and T016 (rate-limit) and T017 (session helper) — different files.

**Phase 3 (US1)** — after backend endpoints (T023/T024), run in parallel:
- T025 (BecomeAHost.tsx), T026 (hostSignup service), T027 (wizard — depends on T026).

**Phase 5 (US3)** — backend (T039-T042) and admin UI service (T043) in parallel with US2 Phase 4.

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (User Story 1).** Ship this first; it delivers the core wedge (self-onboard, no admin in the loop).

Then incrementally:
1. **+ US3** (payout gate) — required before any real money moves through self-signed-up hosts.
2. **+ US2** (checklist) — activation boost; converts signup to first listing.
3. **+ US4** (trust flags) — additive fraud signal; safe to defer.
4. **+ Polish** — release gates and deploy.

---

## Validation

- Every task has checkbox, ID, and file path. ✅
- User-story tasks carry `[US#]` label; setup/foundational/polish do not. ✅
- Each user story is independently testable per its "Independent Test" criterion. ✅
- Parallel tasks (`[P]`) touch different files with no ordering dependency on other incomplete tasks. ✅
