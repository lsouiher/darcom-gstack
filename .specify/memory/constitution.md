<!--
  Sync Impact Report
  ==================
  Version change: 0.0.0 → 1.0.0 (MAJOR — initial ratification)

  Added principles:
    I.    Simplicity First
    II.   Shared Types Are the Contract
    III.  Layered Architecture
    IV.   Dependencies
    V.    Data and MongoDB
    VI.   APIs and Backend Logic
    VII.  Authentication and Authorization
    VIII. Frontend and Mobile
    IX.   Testing
    X.    Security

  Added sections:
    - Core Principles (10 principles)
    - Monorepo Discipline
    - Governance

  Removed sections: none (initial fill from template)

  Templates checked:
    ✅ plan-template.md — "Constitution Check" section exists; gates
       are dynamically derived from constitution at plan time. No update needed.
    ✅ spec-template.md — requirements and success criteria sections align
       with principles (testing, performance, security). No update needed.
    ✅ tasks-template.md — phase structure supports security hardening,
       and testing tasks. No update needed.
    ✅ No `.specify/templates/commands/` directory exists.

  Follow-up TODOs:
    - RATIFICATION_DATE set to today (2026-04-11). Update if a
      different adoption date is intended.
-->

# DaryWin Constitution

> This document is the law. It supersedes all other conventions.
> Deviations require a comment explaining why.

## Core Principles

### I. Simplicity First

Every decision defaults to the simplest option that works.

- Prefer one file over two. Prefer one query over two. Prefer one
  component over two.
- If a feature can ship without a new abstraction, ship it without
  one.
- Complexity MUST be justified in a comment. If you cannot explain
  why it is complex, make it simple.
- No speculative architecture. Build for today's requirements, not
  imagined future ones.
- When two approaches are equally valid, choose the one that is
  easier to delete.

### II. Shared Types Are the Contract

`packages/darywin-types/` is the single source of truth for all
cross-app interfaces, enums, and payload shapes.

- NEVER redefine a type that exists in `darywin-types`. Import it.
- New enums and interfaces that are consumed by more than one app
  MUST live in `darywin-types`, not in any individual app.
- Changes to `darywin-types` MUST be followed by a build and type
  check across all consuming apps (backend, frontend, admin, mobile)
  before committing.
- API request/response shapes MUST have a corresponding payload
  interface in `darywin-types`.
- Use the `:darywin-types` path alias in backend imports. Use the
  npm package name in frontend/admin/mobile imports.

### III. Layered Architecture

Each app separates concerns into clear layers. Mixing layers
creates coupling that is expensive to untangle.

**Backend:**
- Route config (`src/config/*Routes.config.ts`): URL path definitions
  only.
- Route handlers (`src/routes/`): middleware composition and request
  dispatch only.
- Controllers (`src/controllers/`): business logic, validation,
  orchestration.
- Models (`src/models/`): Mongoose schemas and data access.
- Controllers MUST stay focused. Extract repeated logic into utility
  functions in `src/utils/` or model methods — not into new
  abstraction layers.

**Frontend / Admin / Mobile:**
- Services (`src/services/`): all API calls via `axiosInstance`. No
  direct axios usage outside this layer.
- Pages/Screens: composition of components and service calls.
- Components: presentation. No direct API calls.
- Context: shared state only. No business logic in context providers.

### IV. Dependencies

Every new dependency is a long-term maintenance cost.

- Every dependency MUST be justified before being added.
- Prefer fewer, well-maintained dependencies over many narrow ones.
- Never add a library to solve a problem that can be handled with
  a small utility function.
- Dead dependencies MUST be removed immediately.
- Each app manages its own `package.json`. Never hoist app-specific
  dependencies to the root.

### V. Data and MongoDB

- Mongoose schemas in `backend/src/models/` are the authoritative
  definition of data shape. Keep them consistent with
  `darywin-types` interfaces.
- Every field used in a query filter or sort MUST have a
  corresponding index. No unindexed queries on large collections.
- No N+1 queries. If a view needs parent + children, use
  `.populate()` or aggregate in one call.
- Schema changes require verifying all downstream consumers
  (controllers, frontend services, admin services, mobile services).
- Use `mongoose.Types.ObjectId` for ID references. Validate IDs
  before querying with `helper.isValidObjectId()`.

### VI. APIs and Backend Logic

- All data mutations happen server-side. Client code MUST NOT
  bypass the API to touch the database.
- All secrets are server-side only. API keys, tokens, and
  credentials MUST never reach the client.
- Error responses MUST be consistent: use standard HTTP status
  codes and the existing error handling patterns in controllers.
- Stripe and PayPal webhook events are the source of truth for
  payment state. Never trust a synchronous payment API response
  alone — always reconcile via the webhook.
- Environment variables in backend are prefixed with `DW_` and
  accessed via `src/config/env.config.ts`. Never read `process.env`
  directly in business logic.

### VII. Authentication and Authorization

- JWT authentication is centralized in
  `backend/src/middlewares/authJwt.ts`. All protected routes MUST
  use `authJwt.verifyToken` middleware.
- Access control is role-based via `UserType` enum (Admin, Agency,
  User). Route handlers compose auth middleware inline.
- Never trust client-supplied identity claims. Always verify the
  JWT server-side.
- Principle of least privilege: each route MUST check that the
  authenticated user's role is authorized for the operation.

### VIII. Frontend and Mobile

- All HTTP calls go through `axiosInstance` with its configured
  interceptors. Never create a standalone axios instance.
- Service functions are pure async functions — one function per API
  operation, returning typed promises using `darywinTypes`.
- No inline styles. Use MUI's styling system (frontend/admin) or
  React Native's StyleSheet (mobile).
- Form validation MUST run on both client and server. Client
  validation is for UX. Server validation is for correctness.
- i18n: all user-facing strings MUST go through the `lang/`
  translation files. Never hardcode display text in components.
  Support both English and French.
- Accessibility is not optional. Semantic HTML, keyboard navigation,
  and sufficient contrast are baseline requirements.

### IX. Testing

- Backend tests use Jest + Supertest against a real MongoDB
  instance. No mocking the database.
- Tests run serially (`maxWorkers: 1`) to avoid database conflicts.
- Test business logic and API behavior, not implementation details.
  Assert HTTP status codes and response shapes, not internal method
  calls.
- Tests MUST build before running (`npm run build` then `jest`)
  because Jest executes against `dist/`.
- Use `testHelper.ts` utilities for setup/teardown, user creation,
  and authentication. Do not duplicate this boilerplate.
- CI blocks merges on failing tests. A broken test is never merged
  and fixed later.

### X. Security

- Secrets MUST never touch version control. Use `.env` files
  (gitignored) and `DW_` prefixed environment variables.
- Rotate any secret that is accidentally committed.
- All user-supplied content is treated as untrusted. Sanitize before
  storing. Escape before rendering.
- Dependencies MUST be audited regularly. Check for known
  vulnerabilities before each release.
- The pre-commit hook enforces lint, type-check, and a 5MB file
  size limit. These gates are non-negotiable.

## Monorepo Discipline

- Each app (backend, frontend, admin, mobile) owns its own build,
  lint, and dependency management. No cross-app build coupling
  except through `packages/`.
- Shared code goes in `packages/` as separate npm packages. Never
  copy-paste utilities between apps.
- The root `npm run pre-commit` MUST pass before any code is pushed.
  It runs lint, type-check, and file size validation across all
  apps.
- Docker dev stack (`docker-compose.dev.yml`) is the canonical way
  to run all services together. Individual `npm run dev` commands
  are for focused single-app development.
- Changes to `packages/darywin-types` or `packages/darywin-helper`
  require rebuilding and testing every consuming app.

## Governance

- **This constitution supersedes all other conventions.** If a
  framework's docs, a tutorial, or a library's recommended pattern
  conflicts with this document, this document wins.
- **Amendments require a written reason.** No silent updates. If a
  rule changes, document why.
- **Complexity MUST be justified.** Any PR that introduces a new
  abstraction, a new dependency, or a new pattern requires a
  one-paragraph explanation.
- **When in doubt, do less.** Ship the simpler version. Extend
  based on real usage, not assumptions.
- **Sensitive areas require extra care.** Database schemas
  (`backend/src/models/*`), shared types (`packages/darywin-types`),
  and payment gateway flows (Stripe/PayPal) are high-impact. Changes
  to these areas require thorough testing across all apps.
- **Versioning policy:** MAJOR for principle removals or
  redefinitions. MINOR for new principles or materially expanded
  guidance. PATCH for clarifications and wording fixes.

**Version**: 1.0.0 | **Ratified**: 2026-04-11 | **Last Amended**: 2026-04-11
