# Research: Host Admin Portal

**Date**: 2026-04-11 (revised after CEO + Eng review)
**Feature**: 001-host-admin-portal
**Supersedes**: original 2026-04-11 version (per-controller guard approach)

## R1: How to attach user identity to Express requests

**Decision**: Inject identity into `req.user` (typed via Express type augmentation), not `req.body`. `authJwt.verifyToken` re-fetches the user document from MongoDB on every authenticated request and assigns the result to `req.user`.

**Implementation**:
```ts
// backend/src/types/express.d.ts (NEW, ~8 lines)
import { ObjectId } from 'mongoose'
import { UserType } from ':darywin-types'

declare global {
  namespace Express {
    interface Request {
      user?: { _id: ObjectId; type: UserType }
      tenantFilter?: { agency?: ObjectId }  // set by tenantScope middleware
    }
  }
}
```

**Rationale**: `req.user` is the industry-standard injection point in Express + TypeScript. The original choice of mutating `req.body._userId` was rejected during eng review for three reasons: (1) body-validation libraries can strip unknown fields, silently dropping identity and leaving controllers to fall back to client-supplied `agency` → leak; (2) request bodies are commonly logged for debugging, leaking identity into log streams; (3) GET requests have no body, so the pattern doesn't apply uniformly. The type augmentation is a one-time 8-line addition.

**Per-request DB re-fetch**: spec edge case ("role change while logged in, next request must reflect") requires authoritative role data on every request. JWT claims are not authoritative because they're frozen at issue time. The cost is one indexed `User.findById()` per request (~1-3ms). Not cached — caching would defeat the freshness invariant.

**Alternatives considered**:
- `req.body._userId` mutation: original choice, rejected (see above)
- Custom header injection: non-standard, fragile
- Re-decrypt JWT in each controller: duplicates work, no DB freshness check

## R2: Authorization architecture — defense-in-depth middleware

**Decision**: A new `tenantScope.ts` middleware runs after `authJwt`. It reads per-route metadata markers (`@AdminOnly`, `@TenantScoped`, `@Public`) and either: rejects with 403, attaches `req.tenantFilter = { agency: req.user._id }` for downstream controllers to consume, or passes through. **Routes without any marker default-deny** in `strict` mode.

**Rationale**: The original choice of inline per-controller guards was rejected during CEO review. Per-controller scoping is a "remember to check" convention, not a structural invariant. A new endpoint added six months from now can silently leak data because no compiler/runtime force enforces scoping. The middleware approach makes leakage a test failure (marker coverage test) rather than a code review oversight.

**Cost**: One new file (`tenantScope.ts`, ~150 lines), one wrapper around `router.get/post/etc` to attach markers, one assertion test that every route file has 100% marker coverage. CC implementation time: ~30-45 min beyond Approach A.

**Marker semantics**:
- `@AdminOnly` — only `req.user.type === UserType.Admin` passes; everyone else 403
- `@TenantScoped` — populates `req.tenantFilter`; admin gets `{}` (sees all), agency gets `{ agency: req.user._id }`
- `@Public` — passes through with no role check (used for webhooks, login, public assets)
- (no marker) — default-deny in `strict` mode; warn-and-pass in `warn` mode

**Invariant**: if `req.tenantFilter` resolves to `{}` for a non-admin user, throw + emit a CRITICAL log. This must never happen in steady state.

**Alternatives considered**:
- Per-controller inline guards (Approach A, original choice): rejected — no structural guarantee
- Mongoose schema-level row security plugin (Approach C): rejected as over-engineered; affects admin queries unexpectedly, hard to debug, requires escape hatches that reintroduce the original problem

## R3: Admin-only route protection (frontend)

**Decision**: Inline check in `App.tsx` for admin-only routes — wrap component with conditional rendering of `<Unauthorized />`. Optional improvement: a `<RoleGuard requires={[UserType.Admin]} />` wrapper component once, reused everywhere — eliminates per-route boilerplate and prevents future routes from forgetting the guard.

**Rationale**: Frontend guard is defense-in-depth (backend is authoritative). The wrapper component is ~10 lines and prevents the same drift problem as the backend (new routes, forgotten guards).

## R4: Agency profile self-management in Settings

**Decision**: Extend `Settings.tsx` to detect Agency user type and render agency profile fields (name, avatar, contact info) using existing `AgencyService.update()`. Backend enforces ownership via `tenantScope` middleware: the agency self-update route is `@TenantScoped`, and the controller verifies `body._id === req.user._id`.

**Rationale**: Settings is the natural home. Existing service + endpoint reused. No new pages.

**Email/phone change policy** (decision needed at implementation time): If email or phone is editable here, requires re-verification flow. If the platform admin must mediate sensitive contact changes, lock those fields. **Default recommendation: lock email; allow phone with confirmation SMS.** Confirm with product before implementation.

## R5: Location/Country mutation protection

**Decision**: Mark `create`, `update`, `deleteLocation` and equivalents in `countryController.ts` as `@AdminOnly` at the route level. No per-controller role check needed — middleware handles it.

**Rationale**: Single source of truth (the marker on the route). Per-controller checks were rejected because they duplicate the middleware's logic and create a second place to forget.

## R6: Money-handling endpoints (Stripe, PayPal)

**Decision**: Stripe and PayPal webhook routes marked `@Public` (signature verification is the auth boundary, not session). Customer-facing payment endpoints (refund, payment intent creation) marked `@TenantScoped` and the controller verifies the booking's `agency` matches `req.user._id` before any Stripe/PayPal API call. **No money operation may proceed without ownership confirmation.**

**Rationale**: Webhooks have no `req.user` (Stripe is the caller). Marking them `@Public` and validating the signed payload identity is the standard pattern. Refund/payment endpoints are the highest-blast-radius leakage path in the system — explicit ownership check before any external API call.

## R7: Observability for tenant access

**Decision**: A new `backend/src/observability/tenantAccessLog.ts` module emits a structured log line on every authorization decision: `{ userId, userType, route, decision: allow|deny, scope, requestId }`. Counter metrics `tenant_access_denied_total{role, route, reason}` and `tenant_filter_empty_blocked_total`. Alert on >10 denials/min from a single user.

**Rationale**: Security boundary without observability is blind. Detects probes, configuration bugs, and missed-route 403 storms.

## R8: Rollout strategy

**Decision**: Ship middleware behind `DW_TENANT_ENFORCE` env var with three modes:
- `off` — middleware disabled (rollback escape hatch)
- `warn` — log all decisions, never block (initial deploy)
- `strict` — enforce default-deny (final state)

Soak in `warn` for 24-48h, label every existing route from the warn logs, then flip to `strict`. Marker-coverage assertion test only fails the build in `strict` mode.

**Rationale**: Default-deny will 403 everything until every route is marked. Big-bang flip risks breaking working endpoints. Two-phase rollout converts unknown unknowns into known unknowns.
