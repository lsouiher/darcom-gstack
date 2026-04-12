# Implementation Plan: Host Admin Portal

**Branch**: `001-host-admin-portal` | **Date**: 2026-04-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-host-admin-portal/spec.md`

## Summary

Complete agency-scoped admin portal by: (1) enforcing server-side data isolation so agency users can only access their own properties, bookings, and users, (2) scoping the admin frontend navigation and views to hide admin-only features and filter data by agency, (3) making locations read-only for agencies, and (4) adding agency profile self-management.

## Technical Context

**Language/Version**: TypeScript (Node.js backend, React 19 frontend)
**Primary Dependencies**: Express.js, Mongoose, MUI, Vite
**Storage**: MongoDB via Mongoose ODM
**Testing**: Jest + Supertest (backend only, against real MongoDB)
**Target Platform**: Web (admin.darywin.com)
**Project Type**: Web application (monorepo: backend + admin)
**Performance Goals**: No regression from current admin panel performance
**Constraints**: No new dependencies. No schema changes. No breaking changes to admin API for existing admin users.
**Scale/Scope**: ~18 files modified across backend and admin apps (revised from CEO review)
**Approach**: Defense-in-depth — a new `tenantScope` middleware enforces default-deny authorization, in addition to per-controller scoping helpers. Ship behind `DW_TENANT_ENFORCE=off|warn|strict` env flag for staged rollout.

## Authorization Model (added by CEO review)

- New middleware `backend/src/middlewares/tenantScope.ts` runs after `authJwt`. It reads per-route metadata markers (`@AdminOnly`, `@TenantScoped`, `@Public`) and either: rejects with 403, attaches `req.tenantFilter = { agency: req.user._id }`, or passes through. Routes without any marker default-deny.
- Identity is injected into `req.user` (NOT `req.body`). One-time Express type augmentation in `backend/src/types/express.d.ts`: `declare global { namespace Express { interface Request { user?: { _id: ObjectId; type: UserType } } } }`. Avoids body-validator stripping, body-logging leaks, and GET-request mismatch.
- `authJwt.ts` is updated to re-fetch `req.user` from MongoDB on every authenticated request (closes the multi-tab role-change attack window from spec edge cases). User lookup is indexed; cost is negligible.
- A test asserts that every route file has 100% marker coverage. Coverage gap = test failure.
- An invariant assertion in `tenantScope.ts` throws + emits a CRITICAL log if the resolved scope filter is `{}` for a non-admin user.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Simplicity First | PASS | Reuses existing patterns (helper.admin(), agency filter). No new abstractions. |
| II. Shared Types Are the Contract | PASS | Uses existing `UserType` enum. No new types needed in darywin-types. |
| III. Layered Architecture | PASS | Backend changes in middleware + controllers. Frontend changes in pages + components. Layers stay separate. |
| IV. Dependencies | PASS | Zero new dependencies added. |
| V. Data and MongoDB | PASS | No schema changes. Agency filtering uses existing indexed `agency` field on Property model. |
| VI. APIs and Backend Logic | PASS | Enforces server-side agency scoping. Uses existing error patterns (403). |
| VII. Authentication and Authorization | PASS | Extends authJwt.ts to attach user context. Enforces least privilege per route. |
| VIII. Frontend and Mobile | PASS | Uses existing axiosInstance, MUI patterns. Mobile app unaffected. |
| IX. Testing | PASS | Existing backend tests continue to pass. New authorization tests use testHelper.ts. |
| X. Security | PASS | Core purpose is closing the security gap — server-side enforcement of agency isolation. |
| Monorepo Discipline | PASS | Changes scoped to backend + admin only. No cross-app coupling introduced. |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-host-admin-portal/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-changes.md   # Backend API authorization changes
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── middlewares/
│   │   ├── authJwt.ts           # Re-fetch req.user from DB each request
│   │   └── tenantScope.ts       # NEW — default-deny authorization, scope injection
│   ├── controllers/
│   │   ├── propertyController.ts      # Use req.tenantFilter; ownership checks
│   │   ├── bookingController.ts       # Use req.tenantFilter
│   │   ├── userController.ts          # Scope user list to agency's renters + self
│   │   ├── locationController.ts      # @AdminOnly markers on mutations
│   │   ├── countryController.ts       # @AdminOnly markers on mutations
│   │   ├── notificationController.ts  # NEW SCOPE — agency's notifications only
│   │   ├── agencyController.ts        # @AdminOnly on list/other; self-read/update for agency
│   │   ├── paypalController.ts        # Verify booking ownership before any payment op
│   │   └── stripeController.ts        # Verify booking ownership before any payment op
│   ├── utils/
│   │   └── tenantOwnership.ts   # NEW — requireAgencyOwnership(resourceType) helper
│   └── observability/
│       └── tenantAccessLog.ts   # NEW — structured logs + denial counter
└── __tests__/
    ├── tenantScope.test.ts      # NEW — middleware unit tests (6 paths)
    ├── authorizationMatrix.test.ts  # NEW — table-driven route × role matrix
    └── crossTenantAttack.test.ts    # NEW — adversarial integration tests

admin/
├── src/
│   ├── App.tsx                   # Route guards for admin-only pages
│   ├── components/
│   │   └── Header.tsx            # Conditional sidebar menu items
│   └── pages/
│       ├── Users.tsx             # Agency-scoped user list
│       ├── Locations.tsx         # Hide mutation controls for agencies
│       ├── CreateLocation.tsx    # Block route for agencies
│       ├── UpdateLocation.tsx    # Block route for agencies
│       └── Settings.tsx          # Agency profile self-management
```

**Structure Decision**: Existing monorepo structure (backend + admin). No new directories or packages. All changes are modifications to existing files.

## Complexity Tracking

One justified abstraction: `tenantScope` middleware. Rationale: makes agency isolation a structural invariant rather than a per-controller convention. A new endpoint added later cannot accidentally leak — the system enforces opt-in marking. Cost is one new file + one wrapper around route declarations. Reviewed and accepted in CEO review.

## Observability (added by CEO review)

- Structured log line on every authorization decision: `{userId, userType, route, decision, scope}`. JSON.
- Counter metric `tenant_access_denied_total{role, route, reason}`.
- Counter metric `tenant_filter_empty_blocked_total` — must remain 0 in steady state.
- Alert: any single user causing >10 denials/min → page on-call.
- Dashboard panel: denial rate per route, per role, last 24h.
- Runbook: "Agency reports they can't see their property" → check denial counter for that user.

## Rollout Plan (added by CEO review)

1. Deploy backend with `DW_TENANT_ENFORCE=warn`. Middleware logs would-be denials but does not block.
2. Soak 24-48h. Review log volume per route. Confirm zero unexpected denials for legitimate admin traffic.
3. Flip env to `DW_TENANT_ENFORCE=strict`. Denials now return 403.
4. Deploy admin frontend (sidebar/route guards). Backend already enforcing.
5. Drop `warn` mode after 7 days of clean strict operation.
6. Rollback: flip env to `off` (instant) or revert middleware commit (~5 min).

## Design Spec (added by Design review)

### Sidebar (agency user)
Order: Dashboard, Properties, Bookings, Scheduler, Locations, Users, Settings, About, ToS, Contact (9 items + Settings added Phase 6).

**Render strategy:** Render a 9-item MUI `<Skeleton>` placeholder block matching the agency layout immediately on app load. Swap to real items once `UserContext` resolves. Prevents flash-of-admin-content (FOAC). Admin users see the full admin sidebar via the same skeleton-then-swap pattern (different item count).

### Unauthorized page
Reuse existing `<Unauthorized />` component, polish copy:
- `<h1>` (MUI Typography variant=h4 on md+, h5 on xs): "You don't have access to this area"
- `<p>` (variant=body1): "Only platform admins can view this section. If you need access, contact support."
- Primary button (filled, color=primary, brand red): "Back to Dashboard" → router.push('/')
- Secondary text link below: "Contact support" → /contact

No illustration, no icon-in-circle, no decorative elements. Typography + brand color only.

### Settings — agency profile section
Rendered when `user.type === UserType.Agency`. Single-column form, 600px max-width, centered on md+, full-width on xs.

Field order (top to bottom):
1. Avatar — 96px circle, click to upload (reuse `<Avatar>` + `<ImageEditor>`)
2. Agency name — required, single-line `<TextField>`
3. Bio — optional, multi-line `<TextField>` (4 rows)
4. Phone — `<TextField>`, validation via existing helper
5. Email — `<TextField disabled>` with MUI `<Tooltip>` "Contact support to change your email address"
6. Location — reuse existing location selector component
7. Save button — sticky bottom, `<Button color="primary">`, disabled until form is dirty, shows inline spinner during save

Toast on success: "Profile updated" (uses existing NotificationContext).

### Empty state copy (verbatim, all surfaces)

| Surface | Heading | Body | CTA | CTA target |
|---------|---------|------|-----|------------|
| Properties | "No properties yet" | "Add your first property to start receiving bookings." | "Add property" | /create-property |
| Bookings | "No bookings yet" | "When renters book your properties, they'll appear here." | (none — passive state) | — |
| Scheduler | "Nothing on the calendar" | "Add a property to start scheduling availability and bookings." | "Add property" | /create-property |
| Users | "No renters yet" | "Renters who book your properties will appear here." | (none) | — |
| Dashboard | "Welcome to your dashboard" | "Once you add properties and start receiving bookings, you'll see your stats here." | "Add your first property" | /create-property |

Visual: MUI Typography, centered vertically in the content area, 64px gap above heading. No illustration. CTA is `<Button variant="contained" color="primary">`.

### Responsive
MUI breakpoints (xs <600, sm 600-900, md 900-1200, lg 1200+):
- Sidebar: persistent 240px on md+, hamburger-toggled `<Drawer>` on <md
- Settings form: 600px max-width centered on md+, full-width 16px padding on <xs
- Empty states: same on all sizes
- Unauthorized: heading h4 on md+, h5 on xs

### Accessibility
- Sidebar: `<nav aria-label="primary navigation">`
- Unauthorized: `<main role="main">` with heading as `<h1>`
- Empty state CTAs: button text describes action ("Add your first property", not "Click here")
- All form fields use MUI `<TextField label>` for label association
- Touch targets: 44px min (MUI Button default)
- Color contrast: brand red only on filled buttons with white text (WCAG AA)
- Email-disabled tooltip is keyboard-accessible (MUI default)

### Email change policy
**Locked.** Email is the auth identity. Editable email without verification = account-takeover risk via stolen session. Implementing an email-verification flow is out of scope for this PR (would require new backend route + email template). TODO captured for follow-up.

## Out of Scope (added by CEO review)

- Mobile app changes (spec assumption).
- Customer-facing frontend changes (spec assumption).
- New user types / sub-agencies / agency teams.
- Public-facing host signup flow.
- Mongoose schema-level row security plugin (over-engineered for this iteration).

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | CLEAR (HOLD_SCOPE) | 4 proposals, 4 accepted, 0 deferred; 3 critical gaps surfaced and addressed (missing controllers, observability, JWT freshness) |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 9 issues, 0 critical gaps after fixes; identity injection corrected (`req.user` not `req.body`), tasks/research/api-changes regenerated to match plan |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | CLEAR | score: 5/10 → 8/10, 3 decisions made (sidebar skeleton, email locked, full empty-state copy) |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**UNRESOLVED:** 0
**VERDICT:** CEO + ENG + DESIGN CLEARED — ready to implement. Plan, research.md, contracts/api-changes.md, tasks.md, and embedded design spec are all consistent. Implementation can begin from tasks.md.
