# Tasks: Host Admin Portal

**Input**: Design documents from `/specs/001-host-admin-portal/`
**Prerequisites**: plan.md, spec.md, research.md, contracts/api-changes.md
**Tests**: Required. Mandatory test tasks are integrated into each phase.
**Generated**: 2026-04-11 (revised after CEO + Eng review — supersedes prior task list)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US4) or cross-cutting (XC)

---

## Phase 1: Type & Middleware Foundation

**Purpose**: Set up `req.user` injection and tenantScope middleware. ALL user stories depend on this.

- [X] T001 [XC] Create `backend/src/types/express.d.ts` with Express Request augmentation for `user?: { _id; type }` and `tenantFilter?: { agency?: ObjectId }`
- [X] T002 [XC] Modify `backend/src/middlewares/authJwt.ts`: re-fetch User from MongoDB on every authenticated request and assign to `req.user`. Remove any `req.body._userId/_userType` mutation.
- [X] T003 [XC] Create `backend/src/middlewares/tenantScope.ts` with default-deny semantics, marker support (`@AdminOnly`, `@TenantScoped`, `@Public`), env flag `DW_TENANT_ENFORCE=off|warn|strict`, invariant check that scope filter is non-empty for non-admin users
- [X] T004 [XC] Add ASCII diagram comment block at top of `tenantScope.ts` explaining marker decision tree and default-deny invariant
- [X] T005 [XC] Create `backend/src/observability/tenantAccessLog.ts` with structured log emitter and counter metrics (`tenant_access_denied_total`, `tenant_filter_empty_blocked_total`)
- [X] T006 [XC] Wire `tenantScope` middleware into the Express app pipeline (after `authJwt`, before route handlers) in `backend/src/server.ts` (or equivalent app entrypoint)
- [X] T007 [XC] Add route marker helpers to `backend/src/routes/_markers.ts` (or extend an existing utility) — wraps `router.get/post/put/delete` to attach metadata
- [X] T008 [XC] [TEST] Create `backend/__tests__/tenantScope.test.ts` covering 9 paths (admin pass, agency scoped, public pass, default-deny, warn-mode pass, missing user 500, scope-empty invariant, marker-coverage, env flag toggle)
- [X] T009 [XC] [TEST] Create `backend/__tests__/authJwt.test.ts` covering 4 paths (valid token + populated user, user deleted, user type changed, DB unavailable on re-fetch)
- [X] T010 [XC] [TEST] Create `backend/__tests__/markerCoverage.test.ts` asserting every route file uses marker helpers (no bare `router.get` calls)

**Checkpoint**: Auth pipeline complete. Middleware enforces in `warn` mode by default. All marker tests green. Existing routes still work because warn mode does not block.

---

## Phase 2: Route Marker Migration (US1 prerequisite)

**Purpose**: Annotate every existing route with a marker so default-deny becomes safe to enable.

- [X] T011 [P] [XC] Mark all routes in `backend/src/routes/propertyRoutes.ts` (mostly `@TenantScoped`)
- [X] T012 [P] [XC] Mark all routes in `backend/src/routes/bookingRoutes.ts` (mostly `@TenantScoped`)
- [X] T013 [P] [XC] Mark all routes in `backend/src/routes/userRoutes.ts` (mix of `@TenantScoped` and `@Public` for signin/signup)
- [X] T014 [P] [XC] Mark all routes in `backend/src/routes/locationRoutes.ts` (reads `@TenantScoped`, mutations `@AdminOnly`)
- [X] T015 [P] [XC] Mark all routes in `backend/src/routes/countryRoutes.ts` (same pattern)
- [X] T016 [P] [XC] Mark all routes in `backend/src/routes/agencyRoutes.ts` (list/create/delete `@AdminOnly`; self-read/self-update `@TenantScoped`)
- [X] T017 [P] [XC] Mark all routes in `backend/src/routes/notificationRoutes.ts` (`@TenantScoped`)
- [X] T018 [P] [XC] Mark all routes in `backend/src/routes/stripeRoutes.ts` (webhook `@Public`, refund/payment-intent `@TenantScoped`)
- [X] T019 [P] [XC] Mark all routes in `backend/src/routes/paypalRoutes.ts` (webhook `@Public`, refund `@TenantScoped`)
- [X] T020 [P] [XC] Mark all routes in `backend/src/routes/ipinfoRoutes.ts` (`@Public`)

**Checkpoint**: Every route has an explicit marker. T010 marker-coverage test passes. Safe to enable strict mode.

---

## Phase 3: User Story 1 — Agency Data Isolation (P1 MVP)

**Goal**: Controllers consume `req.tenantFilter`. Cross-agency mutations return 403.

- [X] T021 [P] [US1] In `backend/src/controllers/propertyController.ts`, replace any client-supplied `body.agencies` filtering with `{ ...req.tenantFilter, ...otherFilters }` in `getProperties()` and `getBookingProperties()`
- [X] T022 [P] [US1] In `propertyController.create()`, force `property.agency = req.user._id` for non-admin users (silent rewrite, document with code comment)
- [X] T023 [P] [US1] In `propertyController.update()` and `deleteProperty()`, fetch existing doc and assert `existing.agency.equals(req.user._id)` for non-admin → 403 if mismatch
- [X] T024 [P] [US1] In `bookingController.ts`, scope `getBookings()` via `req.tenantFilter` and validate ownership in `update()`
- [ ] T025 [P] [US1] In `userController.ts`, implement scoped user list: admin sees all; agency sees self + users with bookings on agency's properties (single aggregation query)
- [ ] T026 [P] [US1] In `notificationController.ts`, ensure scoping uses `req.tenantFilter`/`req.user._id` (verify pre-existing per-user scoping is still correct)
- [X] T027 [P] [US1] In `agencyController.ts`, controller-level check: agency users may only read/update self (`body._id === req.user._id`)
- [ ] T028 [P] [US1] In `stripeController.ts`, before any Stripe API call (refund, payment intent), assert booking's agency matches `req.user._id` for non-admin
- [ ] T029 [P] [US1] In `paypalController.ts`, same ownership assertion before any PayPal API call
- [X] T030 [P] [US1] In `locationController.ts` and `countryController.ts`: remove any inline role checks (now handled by `@AdminOnly` markers); leave read endpoints untouched
- [ ] T031 [US1] [TEST] Create `backend/__tests__/authorizationMatrix.test.ts` — table-driven: every route × every role → expected status (~50-80 cases)
- [X] T032 [US1] [TEST] Create `backend/__tests__/crossTenantAttack.test.ts` — adversarial: spoofed agencyId, refund hijack, notification leak, user list leak
- [ ] T033 [US1] [TEST] Create `backend/__tests__/paymentWebhooks.test.ts` — webhook signature verification + ownership check + cold-start path
- [ ] T034 [US1] Run `cd backend && npm run build && npm run test` — full suite green

**Checkpoint**: Backend enforces full agency isolation. All tests green in warn mode. Ready for staged strict rollout.

---

## Phase 4: Staged Rollout (Cross-cutting)

- [ ] T035 [XC] Deploy backend with `DW_TENANT_ENFORCE=warn` to staging. Run smoke tests.
- [ ] T036 [XC] Soak in `warn` for 24-48h. Review denial logs daily. Confirm zero unexpected denials for legitimate admin traffic.
- [ ] T037 [XC] Add Grafana (or equivalent) dashboard panel: denial rate per route, per role, last 24h.
- [ ] T038 [XC] Add alert: any single user causing >10 denials/min → page on-call.
- [ ] T039 [XC] Document runbook: "Agency reports they can't see their property" → check denial counter for that user.
- [ ] T040 [XC] Flip env to `DW_TENANT_ENFORCE=strict` in staging. Re-run smoke tests. Soak 24h.
- [ ] T041 [XC] Promote to production with `DW_TENANT_ENFORCE=strict`.

---

## Phase 5: User Story 2 — Agency-Scoped Frontend (P2)

- [X] T042 [P] [US2] In `admin/src/components/Header.tsx`, hide "Agencies" and "Countries" menu items when `user.type !== UserType.Admin`. Render skeleton/null until UserContext loads to prevent flash-of-admin-content.
- [X] T043 [P] [US2] Create `admin/src/components/RoleGuard.tsx` (~10 lines): `<RoleGuard requires={[UserType.Admin]}>{children}</RoleGuard>` renders `<Unauthorized />` if user lacks role.
- [X] T044 [P] [US2] In `admin/src/App.tsx`, wrap admin-only routes with `<RoleGuard>`: /agencies, /create-agency, /update-agency/:id, /countries, /create-country, /update-country/:id, /create-location, /update-location/:id
- [X] T045 [P] [US2] In `admin/src/pages/Users.tsx`, apply Properties.tsx scoping pattern: agency users get scoped data, no user-type filter.
- [X] T046 [P] [US2] In `admin/src/pages/Locations.tsx`, hide "New Location" button and any edit/delete affordances when not admin.
- [X] T047 [P] [US2] Polish `<Unauthorized />` page: friendly copy ("You don't have access to this area"), link back to Dashboard.

**Checkpoint**: Agency users see streamlined nav. Direct-URL admin pages show Unauthorized. No flash of admin items.

---

## Phase 6: User Story 3 — Agency Profile Self-Management (P2)

- [X] T048 [US3] In `admin/src/pages/Settings.tsx`, detect Agency user type and render agency profile fields (name, avatar, contact info) using existing `AgencyService.update()`.
- [ ] T049 [US3] Decide email/phone change policy with product (default: lock email; phone needs SMS confirmation). Implement accordingly.
- [ ] T050 [US3] Manual QA: agency edits name → save → header updates immediately.

**Checkpoint**: Agency self-management works.

---

## Phase 7: User Story 4 — Agency-Scoped Dashboard & Notifications (P3)

- [ ] T051 [P] [US4] Scope dashboard stat queries to agency's own properties (booking count, revenue, occupancy). Apply same `req.tenantFilter` pattern in dashboard endpoint.
- [X] T052 [P] [US4] Verify notifications scoping (T026) works end-to-end on the frontend Notifications page.
- [ ] T053 [US4] Implement empty states for Dashboard, Properties, Bookings, Scheduler, Users when agency has zero properties — friendly copy + CTA, no errors.

**Checkpoint**: Full host portal experience.

---

## Phase 8: Polish & Verification

- [ ] T054 [XC] Run `cd backend && npm run test` — full suite green
- [ ] T055 [XC] Run `cd admin && npm run build` — no TypeScript errors
- [ ] T056 [XC] Run `npm run pre-commit` from repo root
- [ ] T057 [XC] End-to-end manual verification per `quickstart.md` — both admin and agency personas
- [ ] T058 [XC] Drop `warn` mode from rollout config 7 days after strict mode is stable in production

---

## Dependencies & Execution Order

### Phase Dependencies
- Phase 1 → Phase 2 → Phase 3 (sequential)
- Phase 4 starts after Phase 3 (rollout requires backend complete)
- Phase 5 can begin after Phase 1 (frontend doesn't need backend done — just the type contract)
- Phase 6 depends on Phase 3 (controller ownership check) AND Phase 5 (Settings page)
- Phase 7 depends on Phase 3 + Phase 5
- Phase 8 depends on all

### Parallelization Lanes
- **Lane A (backend core, sequential)**: Phase 1 → Phase 2 → Phase 3 → Phase 4
- **Lane B (frontend, after Phase 1)**: Phase 5 → Phase 6 (T048+) → Phase 7 (T053)
- **Lane C (observability)**: T037-T039 in parallel with Phase 3-4

### MVP Cut
Phase 1 + Phase 2 + Phase 3 + Phase 4 → security gap closed. Deploy.
Then Phase 5 → Phase 6 → Phase 7 → Phase 8 over subsequent days.

---

## Notes

- Every backend code path has an explicit test task. No "tests omitted" exception.
- Frontend has no Jest setup; manual QA via quickstart.md is the fallback. Flagged as known coverage gap.
- All identity injection uses `req.user`. Any `req.body._userId` pattern in existing code must be removed in T002.
- Default-deny middleware ships in `warn` mode first to surface missed routes before they break production.
