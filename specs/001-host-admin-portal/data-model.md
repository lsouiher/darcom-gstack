# Data Model: Host Admin Portal

**Date**: 2026-04-11
**Feature**: 001-host-admin-portal

## Overview

This feature requires **no schema changes**. All necessary fields and relationships already exist in the data model. The work is entirely about enforcing access control on existing data.

## Existing Entities (relevant to this feature)

### User (Agency)

The Agency is a User with `type: UserType.Agency`. When an agency user authenticates, their `user._id` serves as the agency identifier across all related models.

| Field | Type | Relevance |
|-------|------|-----------|
| `_id` | ObjectId | **Primary agency identifier** — used as the `agency` foreign key on Property |
| `type` | UserType enum | Determines access level: Admin (full), Agency (scoped), User (renter) |
| `fullName` | String | Agency display name (editable via self-management) |
| `avatar` | String | Agency avatar/logo (editable via self-management) |
| `phone` | String | Agency contact phone (editable via self-management) |
| `location` | String | Agency location (editable via self-management) |
| `bio` | String | Agency description (editable via self-management) |

### Property

| Field | Type | Relevance |
|-------|------|-----------|
| `_id` | ObjectId | Property identifier |
| `agency` | ObjectId (ref: User) | **Ownership link** — scoping filter. Agency users see only properties where `agency === authenticatedUser._id` |
| `location` | ObjectId (ref: Location) | Location reference — agencies browse locations (read-only) to assign here |

**Index**: `agency` field is already indexed (used in existing queries).

### Booking

| Field | Type | Relevance |
|-------|------|-----------|
| `_id` | ObjectId | Booking identifier |
| `agency` | ObjectId (ref: User) | **Ownership link** — scoping filter for agency users |
| `property` | ObjectId (ref: Property) | Property being booked (owned by agency) |
| `renter` | ObjectId (ref: User) | The end-user who made the booking |

**Index**: `agency` field is used in booking list queries.

### Location

| Field | Type | Relevance |
|-------|------|-----------|
| `_id` | ObjectId | Location identifier |
| `name` | Multilingual | Location display name |
| `country` | ObjectId (ref: Country) | Parent country |

**No agency field** — locations are global reference data. Agencies browse but cannot mutate.

### Country

| Field | Type | Relevance |
|-------|------|-----------|
| `_id` | ObjectId | Country identifier |
| `name` | String | Country name |

**No agency field** — countries are global reference data. Admin-only management.

### Notification

| Field | Type | Relevance |
|-------|------|-----------|
| `_id` | ObjectId | Notification identifier |
| `user` | ObjectId (ref: User) | Recipient — already scoped to individual users |

**Already scoped** — notifications are per-user, so agency users only see their own notifications by default.

## Access Control Matrix

| Entity | Admin | Agency | User (Renter) |
|--------|-------|--------|---------------|
| Property | Full CRUD, all agencies | CRUD own only | Read only (frontend) |
| Booking | Full CRUD, all agencies | Read/Update own only | Read own (frontend) |
| User list | All users | Renters with bookings on own properties | N/A |
| Location | Full CRUD | Read only | Read only (frontend) |
| Country | Full CRUD | No access | Read only (frontend) |
| Agency profile | Full CRUD, all agencies | Update own only | N/A |
| Notification | All | Own only (already works) | Own only |
| Dashboard stats | All agencies | Own agency only | N/A |

## State Transitions

No new state transitions introduced. Booking status transitions (Pending → Confirmed → Cancelled, etc.) remain unchanged. The only change is WHO can trigger transitions — agencies can only manage bookings on their own properties.
