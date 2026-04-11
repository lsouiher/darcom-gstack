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
**Scale/Scope**: ~13 files modified across backend and admin apps

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
│   │   └── authJwt.ts           # Attach req.user after token verification
│   ├── controllers/
│   │   ├── propertyController.ts  # Agency-scoped property queries + ownership checks
│   │   ├── bookingController.ts   # Agency-scoped booking queries
│   │   ├── userController.ts      # Agency-scoped user lists
│   │   ├── locationController.ts  # Admin-only mutations (403 for agencies)
│   │   └── countryController.ts   # Admin-only mutations (403 for agencies)
│   └── utils/
│       └── authHelper.ts         # Possible helper for agency scope enforcement
└── __tests__/                    # Existing test files

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

No constitution violations. No complexity justifications needed.
