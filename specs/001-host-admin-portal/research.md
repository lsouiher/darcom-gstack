# Research: Host Admin Portal

**Date**: 2026-04-11
**Feature**: 001-host-admin-portal

## R1: How to attach user identity to Express requests

**Decision**: Extend `authJwt.verifyToken` middleware to set `req.body._userId` and `req.body._userType` after successful token verification, using the user document already queried from MongoDB during verification.

**Rationale**: The middleware already queries the User model to validate the token (it does `User.findOne()` with role-based matching). The user document is available but discarded. By attaching it to `req.body`, downstream controllers gain user context with zero additional DB queries. Using `req.body` prefixed with underscore keeps it consistent with Express conventions in this codebase (which already passes data via body).

**Alternatives considered**:
- `req.user` property: Would require TypeScript type augmentation of Express.Request. More conventional, but this codebase doesn't use Express type augmentation anywhere. Adding it would be a new pattern.
- Custom header injection: Non-standard, fragile.
- Re-decrypt JWT in each controller: Duplicates work, violates DRY.

**Note**: After further review, `req.body` mutation is the simplest path since controllers already read from `req.body`. The underscore prefix (`_userId`, `_userType`) avoids collision with client-supplied fields.

## R2: Agency scoping pattern for controllers

**Decision**: Add a guard at the top of each agency-sensitive controller function. For Agency-type users, override the `agencies` filter with `[req.body._userId]` (since the agency user's `_id` IS the agency ID in the data model). For admin users, pass through unchanged.

**Rationale**: The existing pattern in `propertyController.getProperties()` already accepts `body.agencies` as an array of ObjectIds for filtering. The fix is surgical: for Agency users, ignore the client-supplied value and force it to `[authenticatedUserId]`. This requires no API signature changes — admin callers continue to work identically.

**Alternatives considered**:
- Middleware-level query rewriting: Would require a new middleware layer that understands each controller's query structure. Over-engineered for this use case.
- Separate agency-specific endpoints: Violates Simplicity First. Same logic, different URL — unnecessary duplication.

## R3: Admin-only route protection pattern (frontend)

**Decision**: Create a simple inline check in `App.tsx` routes. For admin-only routes, wrap the component with a conditional that checks `user.type === RecordType.Admin` and renders `<Unauthorized />` otherwise.

**Rationale**: The admin app already has an `<Unauthorized />` component. The existing `helper.admin(user)` function provides the role check. No new components or HOCs needed.

**Alternatives considered**:
- React Router `<ProtectedRoute>` wrapper component: Adds an abstraction for ~5 routes. Simpler to inline.
- Redirect to home: Less informative than showing Unauthorized.

## R4: Agency profile self-management in Settings

**Decision**: Extend the existing Settings page to detect if the user is an Agency type. If so, render additional fields for agency profile (name, avatar, contact info) using the existing agency update service.

**Rationale**: The admin app already has `AgencyService.update()` and the agency update endpoint. Settings.tsx already handles user profile updates. Adding agency fields is an extension of the same page, not a new page.

**Alternatives considered**:
- Separate "Agency Profile" page: Adds navigation complexity for a single-use page. Settings is the natural home.
- Reuse the existing Agency update page (`/update-agency/:id`): This page allows editing ANY agency. For self-management, the simpler path is to embed it in Settings with the user's own agency ID.

## R5: Location/Country mutation protection

**Decision**: Add a `UserType` check at the top of `create`, `update`, and `delete` functions in `locationController.ts` and `countryController.ts`. If `req.body._userType !== UserType.Admin`, return 403.

**Rationale**: Simplest possible guard. No new middleware, no new patterns. Two lines of code per function.

**Alternatives considered**:
- Route-level middleware: Would require modifying route files and creating a new `adminOnly` middleware. More moving parts for the same result.
- Separate admin-only router: Over-engineered for 6 functions.
