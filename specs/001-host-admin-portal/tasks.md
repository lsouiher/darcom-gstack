# Tasks: Host Admin Portal

**Input**: Design documents from `/specs/001-host-admin-portal/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/api-changes.md

**Tests**: Not explicitly requested in the feature specification. Test tasks are omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`
- **Admin**: `admin/src/`

---

## Phase 1: Setup

**Purpose**: No new project initialization needed — all changes modify existing files. This phase is empty.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend auth middleware to attach user identity to requests. ALL user stories depend on this.

**CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T001 Extend `authJwt.verifyToken` to attach `_userId` (ObjectId) and `_userType` (UserType enum) to `req.body` after successful token verification, using the user document already queried during verification in `backend/src/middlewares/authJwt.ts`
- [ ] T002 Verify existing backend tests still pass after middleware change by running `cd backend && npm run build && npm run test`

**Checkpoint**: Middleware now provides user context to all downstream controllers. User story implementation can begin.

---

## Phase 3: User Story 1 - Agency Data Isolation (Priority: P1) MVP

**Goal**: Backend enforces that agency users can only access data belonging to their own agency. Closes the critical security gap where client-supplied agency IDs are trusted without validation.

**Independent Test**: Authenticate as an agency user, make direct API calls supplying another agency's ID in the request body. Every property/booking/user endpoint MUST return only the authenticated agency's data. Mutation endpoints MUST return 403 for cross-agency attempts.

### Implementation for User Story 1

- [ ] T003 [P] [US1] Add agency-scoping guard to `getProperties()` in `backend/src/controllers/propertyController.ts` — for Agency users, override `body.agencies` with `[req.body._userId]`
- [ ] T004 [P] [US1] Add agency-scoping guard to `getBookingProperties()` in `backend/src/controllers/propertyController.ts` — for Agency users, force `body.agency` to `req.body._userId`
- [ ] T005 [P] [US1] Add agency ownership enforcement to `create()` in `backend/src/controllers/propertyController.ts` — for Agency users, force `body.agency = req.body._userId` ignoring client value
- [ ] T006 [P] [US1] Add agency ownership validation to `update()` in `backend/src/controllers/propertyController.ts` — for Agency users, verify `property.agency === req.body._userId` before allowing update, return 403 if mismatch
- [ ] T007 [P] [US1] Add agency ownership validation to `deleteProperty()` in `backend/src/controllers/propertyController.ts` — for Agency users, verify `property.agency === req.body._userId` before allowing delete, return 403 if mismatch
- [ ] T008 [P] [US1] Add agency-scoping guard to `getBookings()` in `backend/src/controllers/bookingController.ts` — for Agency users, override `body.agencies` with `[req.body._userId]`
- [ ] T009 [P] [US1] Add agency ownership validation to booking `update()` in `backend/src/controllers/bookingController.ts` — for Agency users, verify booking's agency matches `req.body._userId`, return 403 if mismatch
- [ ] T010 [P] [US1] Add agency-scoping to user list endpoint in `backend/src/controllers/userController.ts` — for Agency users, filter to show only (a) agency's own account and (b) users with bookings on the agency's properties
- [ ] T011 [P] [US1] Add admin-only guard to `create()`, `update()`, `deleteLocation()` in `backend/src/controllers/locationController.ts` — return 403 if `_userType !== UserType.Admin`
- [ ] T012 [P] [US1] Add admin-only guard to `create()`, `update()`, `deleteCountry()` in `backend/src/controllers/countryController.ts` — return 403 if `_userType !== UserType.Admin`
- [ ] T013 [US1] Verify all existing backend tests still pass after controller changes by running `cd backend && npm run build && npm run test`

**Checkpoint**: Backend now enforces complete agency data isolation. All endpoints return scoped data for Agency users. Cross-agency access returns 403. Admin behavior unchanged.

---

## Phase 4: User Story 2 - Agency-Scoped Navigation and Views (Priority: P2)

**Goal**: Admin panel frontend shows only relevant pages and controls for agency users. Admin-only pages are hidden from navigation and blocked via route guards. Data views filter to agency's own data.

**Independent Test**: Log in as agency user — sidebar shows 9 items (not Agencies/Countries). Navigate to /agencies or /countries via URL — see Unauthorized page. Properties/Bookings/Users pages show only own data. Locations page is browse-only (no create/edit/delete controls).

### Implementation for User Story 2

- [ ] T014 [P] [US2] Add conditional rendering to sidebar navigation in `admin/src/components/Header.tsx` (lines ~303-319) — hide "Agencies" and "Countries" menu items when `user.type !== RecordType.Admin`
- [ ] T015 [P] [US2] Add route guards in `admin/src/App.tsx` — for admin-only routes (/agencies, /create-agency, /update-agency/:id, /countries, /create-country, /update-country/:id), render `<Unauthorized />` component when user is not admin
- [ ] T016 [P] [US2] Add agency-scoping to Users page in `admin/src/pages/Users.tsx` — apply the same pattern from Properties.tsx: if not admin, set agencies filter to `[user._id]` and hide user type filter
- [ ] T017 [P] [US2] Hide mutation controls on Locations page in `admin/src/pages/Locations.tsx` — hide "New Location" button when user is not admin
- [ ] T018 [P] [US2] Add route guards for location mutation routes in `admin/src/App.tsx` — render `<Unauthorized />` for /create-location and /update-location/:id when user is not admin
- [ ] T019 [P] [US2] Hide edit/delete controls on individual location pages (e.g., in `admin/src/pages/UpdateLocation.tsx` or location detail views) when user is not admin

**Checkpoint**: Agency users see a streamlined admin panel with only relevant navigation items. Admin-only URLs are blocked. All data views show agency-scoped data.

---

## Phase 5: User Story 3 - Agency Profile Self-Management (Priority: P2)

**Goal**: Agency users can edit their own profile (name, avatar, contact info) via the Settings page without contacting the platform admin.

**Independent Test**: Log in as agency user, navigate to Settings, update agency name and avatar, verify changes persist and display correctly across the portal.

### Implementation for User Story 3

- [ ] T020 [US3] Add agency ownership validation to user `update()` in `backend/src/controllers/userController.ts` — for Agency users, verify `body._id === req.body._userId` before allowing profile update, return 403 for other users
- [ ] T021 [US3] Extend Settings page in `admin/src/pages/Settings.tsx` to detect Agency user type and render agency profile fields (name, avatar, phone, location, bio) using the existing user update service

**Checkpoint**: Agency users can self-manage their profile. Saving changes persists to the database and reflects across the portal.

---

## Phase 6: User Story 4 - Agency-Scoped Dashboard and Notifications (Priority: P3)

**Goal**: Dashboard metrics and notifications reflect only the agency's own properties and bookings.

**Independent Test**: Log in as agency user — dashboard shows stats for own properties only. Notifications show only agency-relevant items. Agency with zero properties sees empty states, not errors.

### Implementation for User Story 4

- [ ] T022 [P] [US4] Scope dashboard data in the admin dashboard page — apply agency filter to all stat queries (booking count, revenue, occupancy) when user is not admin, using the same `helper.admin()` pattern
- [ ] T023 [P] [US4] Verify notifications are already scoped by user in the notifications page — confirm existing behavior filters by `user._id` (per data-model.md, notifications are already per-user)
- [ ] T024 [US4] Ensure empty states display correctly on Dashboard, Properties, Bookings, Scheduler, and Users pages when an agency has zero properties — no errors or other agencies' data shown

**Checkpoint**: All user stories are independently functional. Agency users have a complete, scoped admin experience.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup across all stories

- [ ] T025 Run full backend test suite to verify no regressions: `cd backend && npm run test`
- [ ] T026 Run admin build to verify no TypeScript errors: `cd admin && npm run build`
- [ ] T027 Run root pre-commit checks: `npm run pre-commit`
- [ ] T028 Manual end-to-end verification following `specs/001-host-admin-portal/quickstart.md` — test as both Admin and Agency users

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — can start immediately
- **User Story 1 (Phase 3)**: Depends on Phase 2 (middleware must attach user context first)
- **User Story 2 (Phase 4)**: Depends on Phase 2. Can run in parallel with US1 (frontend-only changes)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (backend ownership validation in T020)
- **User Story 4 (Phase 6)**: Depends on Phase 2. Can run in parallel with US1/US2
- **Polish (Phase 7)**: Depends on all previous phases

### User Story Dependencies

- **User Story 1 (P1)**: Backend only. Can start after Phase 2.
- **User Story 2 (P2)**: Frontend only. Can start after Phase 2. Independent of US1.
- **User Story 3 (P2)**: Mixed. Backend (T020) depends on US1 pattern. Frontend (T021) is independent.
- **User Story 4 (P3)**: Frontend only. Can start after Phase 2. Independent of US1/US2.

### Within Each User Story

- Tasks marked [P] can run in parallel (different files)
- T013 (test verification) must run after all US1 controller changes
- T020 must complete before T021 (backend before frontend for US3)

### Parallel Opportunities

- **Phase 3**: T003-T012 can ALL run in parallel (each modifies a different controller function)
- **Phase 4**: T014-T019 can ALL run in parallel (each modifies a different frontend file/section)
- **Phase 3 + Phase 4**: Can run in parallel (backend + frontend are independent)
- **Phase 6**: T022-T023 can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001-T002)
2. Complete Phase 3: User Story 1 (T003-T013)
3. **STOP and VALIDATE**: Test backend security enforcement independently
4. Security gap is closed — deploy if critical

### Incremental Delivery

1. Phase 2 → Foundation ready
2. Phase 3 (US1) → Backend security enforced (MVP!)
3. Phase 4 (US2) → Frontend scoped (complete agency portal UX)
4. Phase 5 (US3) → Agency self-management (empowers hosts)
5. Phase 6 (US4) → Dashboard polish (complete experience)
6. Phase 7 → Final verification

### Parallel Strategy

With backend + frontend developers working simultaneously:

1. Both complete Phase 2 together (1 file)
2. Developer A: Phase 3 (backend controllers)
3. Developer B: Phase 4 (frontend scoping) — in parallel
4. Merge and proceed to Phase 5-7

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- No new dependencies, no schema changes, no new files created
- All changes modify existing files in backend/src/ and admin/src/
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
