# API Authorization Changes: Host Admin Portal

**Date**: 2026-04-11
**Feature**: 001-host-admin-portal

## Overview

No new endpoints are created. No API signatures change. The only change is adding server-side authorization enforcement to existing endpoints. Admin users experience zero behavioral changes.

## Middleware Change: authJwt.verifyToken

**Current behavior**: Verifies JWT token, checks user exists and has correct type. Discards user info.

**New behavior**: After successful verification, attaches `_userId` (ObjectId) and `_userType` (UserType enum) to `req.body` for downstream controllers.

## Property Endpoints

### POST /api/properties (getProperties)

**Current**: Accepts `body.agencies` array, returns all matching properties.
**New for Agency users**: Ignores `body.agencies`, forces filter to `[authenticatedUser._id]`.
**Admin behavior**: Unchanged.

### POST /api/create-property (create)

**Current**: Accepts `body.agency`, creates property for that agency.
**New for Agency users**: Ignores `body.agency`, forces `property.agency = authenticatedUser._id`.
**Admin behavior**: Unchanged.

### PUT /api/update-property/:id (update)

**Current**: Updates any property by ID.
**New for Agency users**: Validates `property.agency === authenticatedUser._id` before allowing update. Returns 403 if mismatch.
**Admin behavior**: Unchanged.

### DELETE /api/delete-property/:id (deleteProperty)

**Current**: Deletes any property by ID.
**New for Agency users**: Validates `property.agency === authenticatedUser._id` before allowing delete. Returns 403 if mismatch.
**Admin behavior**: Unchanged.

## Booking Endpoints

### POST /api/bookings (getBookings)

**Current**: Accepts `body.agencies` array, returns all matching bookings.
**New for Agency users**: Ignores `body.agencies`, forces filter to `[authenticatedUser._id]`.
**Admin behavior**: Unchanged.

### PUT /api/update-booking/:id (update)

**Current**: Updates any booking by ID.
**New for Agency users**: Validates booking's property belongs to authenticated agency before allowing update. Returns 403 if mismatch.
**Admin behavior**: Unchanged.

## User Endpoints

### POST /api/users (getUsers / user list)

**Current**: Returns users filtered by type.
**New for Agency users**: Additionally filters to show only (a) the agency's own account and (b) users who have bookings on the agency's properties.
**Admin behavior**: Unchanged.

## Location Endpoints

### POST /api/create-location (create)
### PUT /api/update-location/:id (update)
### DELETE /api/delete-location/:id (deleteLocation)

**Current**: No role checks.
**New**: Returns 403 if `_userType !== UserType.Admin`.
**Read/list endpoints**: Unchanged (accessible to all authenticated users).

## Country Endpoints

### POST /api/create-country (create)
### PUT /api/update-country/:id (update)
### DELETE /api/delete-country/:id (deleteCountry)

**Current**: No role checks.
**New**: Returns 403 if `_userType !== UserType.Admin`.
**Read/list endpoints**: Unchanged (accessible to all authenticated users).

## Agency Endpoints

### PUT /api/update-user (update — self-management)

**Current**: Updates any user by ID.
**New for Agency users**: Can only update their own profile (`body._id === authenticatedUser._id`). Returns 403 for other users.
**Admin behavior**: Unchanged.

## Error Response Format

All new 403 responses use the existing pattern:

```
HTTP 403 Forbidden
```

No response body changes. Consistent with existing error handling in the codebase.
