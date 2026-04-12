# API Authorization Changes: Host Admin Portal

**Date**: 2026-04-11 (revised after CEO + Eng review)
**Feature**: 001-host-admin-portal
**Supersedes**: original 2026-04-11 version

## Overview

No new endpoints. No API signatures change. Two new structural pieces:
1. `authJwt.verifyToken` injects `req.user` (NOT `req.body._userId`) and re-fetches the user document on every request.
2. New `tenantScope` middleware enforces default-deny authorization based on per-route markers.

Admin users experience zero behavioral changes.

## Middleware Changes

### authJwt.verifyToken (modified)

**Current**: Verifies JWT, queries user once, discards user document.

**New**: After successful verification, attaches the freshly-loaded user document to `req.user` (typed via `backend/src/types/express.d.ts`). User is re-fetched on every authenticated request to enforce role freshness (closes spec edge case "role change while logged in").

**Rejected pattern**: mutating `req.body._userId` (original choice). Body-validators can strip the field, body-logging leaks identity, GET requests have no body.

### tenantScope (NEW)

Runs immediately after `authJwt`. Reads per-route metadata markers:

| Marker | Behavior |
|--------|----------|
| `@AdminOnly` | Only `req.user.type === Admin` passes. Else 403. |
| `@TenantScoped` | Sets `req.tenantFilter`. Admin → `{}` (sees all). Agency → `{ agency: req.user._id }`. |
| `@Public` | Pass through. Used for webhooks, public assets, login. |
| (no marker) | `strict`: 403 default-deny. `warn`: pass + log. |

**Invariant**: `req.tenantFilter === {}` for non-admin → throw + CRITICAL log. Must never happen.

**Env flag**: `DW_TENANT_ENFORCE=off|warn|strict`.

## Route Authorization Matrix

| Route | Method | Marker | Notes |
|-------|--------|--------|-------|
| **Property** | | | |
| /api/properties | POST | @TenantScoped | Agency sees own; admin sees all (controller uses `req.tenantFilter`) |
| /api/create-property | POST | @TenantScoped | Force `property.agency = req.user._id` for agency users |
| /api/update-property/:id | PUT | @TenantScoped | Controller verifies `property.agency === req.user._id` |
| /api/delete-property/:id | DELETE | @TenantScoped | Same as update |
| **Booking** | | | |
| /api/bookings | POST | @TenantScoped | Agency sees only own |
| /api/update-booking/:id | PUT | @TenantScoped | Verify booking's property belongs to agency |
| **User** | | | |
| /api/users | POST | @TenantScoped | Agency: own + renters of own properties. Admin: all. |
| /api/update-user | PUT | @TenantScoped | Agency may only update self (`body._id === req.user._id`) |
| **Location** | | | |
| /api/locations (list/get) | GET/POST | @TenantScoped | Agency may read; admin manages |
| /api/create-location | POST | @AdminOnly | |
| /api/update-location/:id | PUT | @AdminOnly | |
| /api/delete-location/:id | DELETE | @AdminOnly | |
| **Country** | | | |
| /api/countries (list/get) | GET/POST | @TenantScoped | Agency may read |
| /api/create-country | POST | @AdminOnly | |
| /api/update-country/:id | PUT | @AdminOnly | |
| /api/delete-country/:id | DELETE | @AdminOnly | |
| **Agency** | | | |
| /api/agencies (list) | POST | @AdminOnly | Agency users cannot list other agencies |
| /api/get-agency/:id | GET | @TenantScoped | Agency may read self only (controller checks) |
| /api/update-agency/:id | PUT | @TenantScoped | Agency may update self only |
| /api/create-agency | POST | @AdminOnly | |
| /api/delete-agency/:id | DELETE | @AdminOnly | |
| **Notification** | | | |
| /api/notifications | POST | @TenantScoped | Agency: own notifications only (already scoped per data-model) |
| **Stripe** | | | |
| /api/stripe/webhook | POST | @Public | Signature verified; no req.user |
| /api/stripe/refund | POST | @TenantScoped | Controller verifies booking ownership before Stripe call |
| /api/stripe/create-payment-intent | POST | @TenantScoped | Same |
| **PayPal** | | | |
| /api/paypal/webhook | POST | @Public | Signature verified |
| /api/paypal/refund | POST | @TenantScoped | Verify booking ownership |
| **IPInfo / Auth / Public** | | | |
| /api/signin, /api/signup | POST | @Public | |
| /api/ipinfo | GET | @Public | |

## Endpoint Detail (Behavior Changes)

### Property — POST /api/properties (getProperties)
- **Currently**: accepts `body.agencies` array
- **New**: middleware sets `req.tenantFilter`. Controller does `Property.find({ ...req.tenantFilter, ...otherFilters })`. Client-supplied `body.agencies` is ignored for non-admin users.

### Property — POST /api/create-property
- **New**: For agency users, `property.agency` is forced to `req.user._id` regardless of body content. **Decision**: silent rewrite (recommended) or 400 reject. Controller comment must document the chosen behavior.

### Property — PUT /api/update-property/:id
- **New**: Controller fetches existing property, asserts `existing.agency.equals(req.user._id)` for agency users. Mismatch → 403.

### Stripe/PayPal webhooks
- **Currently**: may or may not be authenticated. Confirm.
- **New**: explicitly `@Public`. Signature verification is the auth boundary. Handler must verify the signed payload's resource (booking, customer) matches the affected database record.

### Stripe/PayPal refund
- **New**: Before any Stripe/PayPal API call, controller verifies the booking belongs to `req.user._id` for agency users. Money operations have zero margin for cross-tenant access.

## Observability Endpoints (NEW, internal)

The `tenantScope` middleware emits structured logs and metrics consumed by the existing observability stack. No new HTTP endpoints. See `backend/src/observability/tenantAccessLog.ts`.

## Backwards Compatibility

- Existing admin client requests work identically (`@AdminOnly` and `@TenantScoped` both pass admin through unchanged).
- Existing agency users gain restrictions where they previously had unintended access.
- Frontend admin app: existing routes continue to work. New `<Unauthorized />` rendering for admin-only routes is additive.
- Mobile app: unaffected.
