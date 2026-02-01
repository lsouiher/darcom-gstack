# FLOWS.md - Movin' In Application Flows

This document provides comprehensive documentation of all major application flows in the Movin' In rental property management platform.

## Table of Contents

1. [Authentication Flow](#1-authentication-flow)
2. [User Registration & Activation](#2-user-registration--activation)
3. [Booking Flow](#3-booking-flow)
4. [Property Management Flow](#4-property-management-flow)
5. [Agency Management Flow](#5-agency-management-flow)
6. [Location & Country Management](#6-location--country-management)
7. [Email Notification System](#7-email-notification-system)
8. [Payment Processing](#8-payment-processing)

---

## 1. Authentication Flow

### 1.1 User Types & Role-Based Access Control

```typescript
enum UserType {
  Admin = 'ADMIN',    // System administrators
  Agency = 'AGENCY',  // Property agencies/landlords
  User = 'USER',      // Renters/customers
}
```

**Access Matrix:**

| App | Allowed User Types |
|-----|-------------------|
| Frontend (Customer) | User only |
| Admin Panel | Admin, Agency |
| Mobile App | User (no type restriction at middleware) |

### 1.2 Sign In Flow

**Endpoint:** `POST /api/sign-in/{appType}`

**Process:**
1. User submits email and password
2. Backend validates credentials against bcrypt hash
3. RBAC check: verify user type matches app type
4. Generate JWT token (HS256, default 24h expiry)
5. Set httpOnly signed cookie (web) or return token in body (mobile)
6. Frontend stores user data in localStorage

**JWT Token Structure:**
```typescript
type SessionData = {
  id: string  // MongoDB ObjectId
}
```

**Cookie Configuration:**
```typescript
{
  httpOnly: true,     // Prevents XSS
  signed: true,       // Prevents tampering
  secure: HTTPS,      // HTTPS only in production
  sameSite: 'strict'  // Prevents CSRF
}
```

**Cookie Names:**
- Frontend: `mi-x-access-token-frontend`
- Admin: `mi-x-access-token-admin`
- Mobile: `x-access-token` (header)

### 1.3 Token Validation Middleware

**File:** `backend/src/middlewares/authJwt.ts`

```
Request → Extract Token (cookie/header) → Decrypt JWT →
Validate Signature → Check User Exists → Verify User Type →
Grant/Deny Access
```

**Response Codes:**
- `200` - Access granted
- `401` - Invalid/expired token
- `403` - No token provided

### 1.4 Social Login

**Supported Providers:** Google, Facebook, Apple

**Endpoint:** `POST /api/social-sign-in`

**Process:**
1. Frontend receives OAuth token from provider
2. Backend validates token against provider's API:
   - Google: `googleapis.com/oauth2/v3/tokeninfo`
   - Apple: JWT validation with email claim check
   - Facebook: Signed request structure validation
3. Find or create user (auto-verified, auto-activated)
4. Generate JWT and set cookie

### 1.5 Sign Out

**Endpoint:** `POST /api/sign-out`

**Process:**
1. Clear localStorage (`mi-fe-user`)
2. Clear all cookies
3. Backend clears auth cookie
4. Redirect to home/sign-in

---

## 2. User Registration & Activation

### 2.1 Sign Up Flow

**Endpoint:** `POST /api/sign-up`

**Frontend Validation:**
- Email format and uniqueness
- Phone format (mobile phone validator)
- Birth date (minimum age: 18)
- Password (minimum 6 characters)
- Password confirmation match
- reCAPTCHA v3 token

**Backend Process:**
1. Normalize email (trim whitespace)
2. Hash password with bcrypt
3. Create user document (`active: false`, `verified: false`)
4. Handle avatar upload (temp → permanent CDN)
5. Generate verification token
6. Send activation email via SMTP

### 2.2 Email Verification

**Link Format:** `/activate/?u={userId}&e={email}&t={token}`

**Token Validation Endpoint:** `GET /api/check-token/{userId}/{email}/{token}/{appType}`

**Activation Endpoint:** `POST /api/activate`

**Process:**
1. Validate token exists in Token collection
2. User sets/confirms password
3. Mark user as `active: true`, `verified: true`
4. Clear TTL expiration (`expireAt: undefined`)

### 2.3 Password Reset Flow

**Forgot Password:** `POST /api/resend/{appType}/{email}/true`

1. Generate new token
2. Send password reset email
3. Link: `/reset-password/?u={userId}&e={email}&t={token}`

**Reset Password:** Similar to activation but `reset=true` flag

### 2.4 Password Change (Authenticated)

**Endpoint:** `POST /api/change-password`

**Payload:**
```typescript
{
  _id: string,
  password: string,     // Current password
  newPassword: string,
  strict: boolean       // Verify current password if true
}
```

---

## 3. Booking Flow

### 3.1 Property Search

**Endpoint:** `POST /api/frontend-properties/{page}/{size}`

**Search Parameters:**
```typescript
{
  agencies: string[],        // Filter by agency IDs
  location: string,          // Location ID (includes children)
  types: PropertyType[],     // Property types
  rentalTerms: RentalTerm[], // Monthly/Weekly/Daily/Yearly
  from: Date,                // Rental start date
  to: Date                   // Rental end date
}
```

**Availability Algorithm:**
1. Match properties: agencies, location, types, rental terms
2. Filter: `available: true`, `hidden: false`
3. Exclude properties from blacklisted agencies
4. Check booking overlap for date range:
   - Overlap exists if: `booking.to >= from AND booking.from <= to`
   - Only blocking statuses: `PAID`, `RESERVED`, `DEPOSIT`
5. Apply `blockOnPay` filter:
   - Include if `blockOnPay=false` OR no overlapping bookings
6. Sort by daily price (ascending)

### 3.2 Checkout Flow

**Endpoint:** `POST /api/checkout`

**File:** `backend/src/controllers/bookingController.ts`

**Payload:**
```typescript
interface CheckoutPayload {
  agency: string,
  property: string,
  renter: string,
  location: string,
  from: Date,
  to: Date,
  status: BookingStatus,
  cancellation: boolean,
  price: number,
  payLater?: boolean
}
```

**Process:**
1. Validate property availability for date range
2. Create booking with initial status
3. Handle payment gateway (Stripe/PayPal)
4. On payment success: Update status to `PAID`
5. Send confirmation email to renter
6. Create notification for agency
7. Optionally notify admin

### 3.3 Booking Statuses

```typescript
enum BookingStatus {
  Void = 'VOID',           // Cancelled/invalid
  Pending = 'PENDING',     // Awaiting payment
  Deposit = 'DEPOSIT',     // Deposit paid
  Paid = 'PAID',           // Fully paid
  Reserved = 'RESERVED',   // Reserved without payment
  Cancelled = 'CANCELLED'  // Cancelled by user/agency
}
```

**Status Transitions:**
```
PENDING → PAID (on payment success)
PENDING → CANCELLED (on user cancel)
PAID → CANCELLED (refund process)
* → VOID (admin action)
```

### 3.4 Booking Cancellation

**Endpoint:** `POST /api/cancel-booking/{id}`

**Process:**
1. Validate booking ownership
2. Update status to `CANCELLED`
3. Notify agency
4. Handle refund if applicable

### 3.5 Checkout Session (Stripe)

**File:** `frontend/src/pages/CheckoutSession.tsx`

**Process:**
1. User redirected from Stripe checkout
2. Extract `sessionId` from URL
3. Check session status via `StripeService.checkCheckoutSession()`
4. Retrieve booking ID via `BookingService.getBookingId()`
5. Display success/error status

---

## 4. Property Management Flow

### 4.1 Property Schema

```typescript
interface Property {
  name: string,
  type: PropertyType,           // HOUSE, APARTMENT, TOWNHOUSE, etc.
  agency: ObjectId,             // Reference to agency user
  description: string,          // HTML content
  available: boolean,
  image: string,                // Main image filename
  images: string[],             // Additional images
  bedrooms: number,
  bathrooms: number,
  kitchens: number,
  parkingSpaces: number,
  size?: number,
  petsAllowed: boolean,
  furnished: boolean,
  aircon: boolean,
  minimumAge: number,           // 18-99
  location: ObjectId,
  address: string,
  latitude: number,
  longitude: number,
  price: number,
  hidden: boolean,
  cancellation: number,         // Cancellation fee
  rentalTerm: RentalTerm,
  blockOnPay: boolean           // Block availability on paid bookings
}
```

### 4.2 Property Types

```typescript
enum PropertyType {
  House = 'HOUSE',
  Apartment = 'APARTMENT',
  Townhouse = 'TOWNHOUSE',
  Plot = 'PLOT',
  Farm = 'FARM',
  Commercial = 'COMMERCIAL',
  Industrial = 'INDUSTRIAL'
}
```

### 4.3 Create Property

**Endpoint:** `POST /api/create-property`

**Image Upload Flow:**
1. Upload main image to temp directory
2. Upload additional images to temp directory
3. Submit property form
4. Backend migrates images from temp to permanent CDN
5. Image naming: `{propertyId}_{timestamp}.{ext}`

### 4.4 Update Property

**Endpoint:** `PUT /api/update-property`

**Process:**
1. Update property fields
2. Handle image changes:
   - New main image: migrate from temp, delete old
   - New additional images: migrate from temp
   - Deleted images: remove from CDN and array

### 4.5 Delete Property

**Endpoint:** `DELETE /api/delete-property/{id}`

**Cascade Operations:**
1. Delete property document
2. Delete main image from CDN
3. Delete all additional images
4. Delete all associated bookings

### 4.6 Image Management Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload-property-image` | POST | Upload to temp directory |
| `/api/delete-temp-property-image/{fileName}` | POST | Delete from temp |
| `/api/delete-property-image/{property}/{image}` | POST | Delete permanent image |

---

## 5. Agency Management Flow

### 5.1 Agency Entity

Agencies are stored in the User model with `type: UserType.Agency`

**Key Fields:**
- `fullName` - Agency name (unique, case-insensitive)
- `email` - Contact email
- `phone` - Contact phone
- `location` - Address
- `bio` - Description
- `avatar` - Logo image
- `payLater` - Enable pay-later option
- `blacklisted` - Block agency operations

### 5.2 Create Agency

**Process:**
1. Validate agency name uniqueness
2. Create user with `type: Agency`
3. Upload avatar if provided
4. Send activation email

### 5.3 Delete Agency

**Endpoint:** `DELETE /api/delete-agency/{id}`

**Cascade Operations:**
1. Delete all agency notifications
2. Delete notification counters
3. Delete all agency bookings
4. Delete all agency properties (and their images)
5. Delete agency avatar
6. Delete agency user document

### 5.4 Agency Blacklisting

When an agency is blacklisted:
- Properties excluded from frontend search
- Agency staff cannot access admin panel
- Existing bookings remain but no new bookings allowed

---

## 6. Location & Country Management

### 6.1 Hierarchy

```
Country
  └── Location
        └── Child Location (optional)
```

### 6.2 Multi-Language Support

Both countries and locations support i18n via `LocationValue` documents:

```typescript
interface LocationValue {
  language: 'en' | 'fr',
  value: string  // Translated name
}
```

### 6.3 Location Schema

```typescript
interface Location {
  country: ObjectId,
  latitude?: number,
  longitude?: number,
  values: ObjectId[],         // LocationValue references
  image?: string,
  parentLocation?: ObjectId   // For sub-locations
}
```

### 6.4 Create Location

**Endpoint:** `POST /api/create-location`

**Process:**
1. Create LocationValue for each language
2. Create Location linking values
3. Move image from temp to CDN if provided

### 6.5 Delete Location

**Endpoint:** `DELETE /api/delete-location/{id}`

**Validation:**
- Cannot delete if used by any property
- Cannot delete if has child locations

**Cascade:**
- Delete all LocationValue translations
- Delete location image

### 6.6 Location Search

**Endpoint:** `GET /api/locations-with-position/{language}`

Returns locations with latitude/longitude for map displays.

---

## 7. Email Notification System

### 7.1 SMTP Configuration

**Environment Variables:**
- `MI_SMTP_HOST` - SMTP server hostname
- `MI_SMTP_PORT` - SMTP port
- `MI_SMTP_USER` - Authentication username
- `MI_SMTP_PASS` - Authentication password
- `MI_SMTP_FROM` - Sender email address
- `MI_ADMIN_EMAIL` - Admin notification recipient

### 7.2 Email Types

| Trigger | Recipient | Subject |
|---------|-----------|---------|
| User signup | User | Account Activation |
| Password reset | User | Password Reset |
| Booking confirmed | Renter | Your booking is confirmed |
| Booking status change | Renter | Booking status updated |
| New booking | Agency | New booking notification |
| Booking update | Agency/Admin | Booking notification |
| Contact form | Admin | New message from contact form |

### 7.3 Booking Confirmation Email

**Content:**
- Booking ID and confirmation status
- Agency and property details
- Check-in/check-out dates (timezone-aware)
- Property address with Google Maps link
- Instructions (ID required, warranty, etc.)
- Link to booking in frontend

### 7.4 User Notification Preferences

**Field:** `user.enableEmailNotifications` (boolean, default: true)

**When Checked:**
- Booking status change emails
- Agency/admin notification emails

**Always Sent (Regardless of Setting):**
- Account activation emails
- Booking confirmation emails

### 7.5 In-App Notifications

**Models:**
- `Notification` - Individual notification records
- `NotificationCounter` - Unread count per user

**Fields:**
```typescript
interface Notification {
  user: ObjectId,
  message: string,
  booking?: ObjectId,
  isRead: boolean,
  createdAt: Date
}
```

### 7.6 Push Notifications

**System:** Expo Server SDK

**When Sent:** Booking status changes (asynchronous, non-blocking)

**Storage:** `PushToken` model stores Expo push tokens per user

---

## 8. Payment Processing

### 8.1 Supported Gateways

```typescript
enum PaymentGateway {
  Stripe = 'STRIPE',
  PayPal = 'PAYPAL'
}
```

### 8.2 Stripe Integration

**Files:**
- `backend/src/payment/stripe.ts`
- `backend/src/controllers/stripeController.ts`
- `frontend/src/services/StripeService.ts`

**Checkout Flow:**
1. Create Stripe Checkout Session
2. Redirect user to Stripe hosted checkout
3. Stripe redirects to `/checkout-session/{sessionId}`
4. Backend verifies session status
5. Update booking on payment success

**Key Endpoints:**
- `POST /api/create-checkout-session` - Create Stripe session
- `GET /api/check-checkout-session/{sessionId}` - Verify session

### 8.3 PayPal Integration

**Files:**
- `backend/src/payment/paypal.ts`
- `backend/src/controllers/paypalController.ts`
- `frontend/src/services/PayPalService.ts`

**Checkout Flow:**
1. Create PayPal order
2. User completes payment in PayPal widget
3. Capture payment on approval
4. Update booking status

**Key Endpoints:**
- `POST /api/create-paypal-order` - Create order
- `POST /api/capture-paypal-order/{orderId}` - Capture payment

### 8.4 Pay Later Option

When `payLater: true`:
- Booking created with `PENDING` status
- No payment gateway interaction
- Renter pays directly to agency
- Confirmation email still sent

**Eligibility:**
- Agency must have `payLater: true` enabled
- User must select pay-later option at checkout

---

## Appendix: Key File Paths

### Backend Controllers
- `backend/src/controllers/userController.ts` - Authentication, user management
- `backend/src/controllers/bookingController.ts` - Booking operations
- `backend/src/controllers/propertyController.ts` - Property CRUD
- `backend/src/controllers/agencyController.ts` - Agency operations
- `backend/src/controllers/locationController.ts` - Location management
- `backend/src/controllers/countryController.ts` - Country management
- `backend/src/controllers/notificationController.ts` - Notifications
- `backend/src/controllers/stripeController.ts` - Stripe payments
- `backend/src/controllers/paypalController.ts` - PayPal payments

### Backend Middleware
- `backend/src/middlewares/authJwt.ts` - JWT authentication

### Backend Models
- `backend/src/models/User.ts` - User (includes Agency)
- `backend/src/models/Booking.ts` - Bookings
- `backend/src/models/Property.ts` - Properties
- `backend/src/models/Location.ts` - Locations
- `backend/src/models/Country.ts` - Countries
- `backend/src/models/Notification.ts` - Notifications

### Frontend Services
- `frontend/src/services/UserService.ts` - Auth & user API
- `frontend/src/services/BookingService.ts` - Booking API
- `frontend/src/services/PropertyService.ts` - Property API
- `frontend/src/services/StripeService.ts` - Stripe API
- `frontend/src/services/PayPalService.ts` - PayPal API

### Frontend Pages
- `frontend/src/pages/SignIn.tsx` - Sign in
- `frontend/src/pages/SignUp.tsx` - Registration
- `frontend/src/pages/Activate.tsx` - Account activation
- `frontend/src/pages/Checkout.tsx` - Checkout flow
- `frontend/src/pages/CheckoutSession.tsx` - Stripe redirect
- `frontend/src/pages/Search.tsx` - Property search
- `frontend/src/pages/Bookings.tsx` - User bookings

### Shared Types
- `packages/movinin-types/index.ts` - Enums and interfaces

---

## Document Generation

**Status:** Not implemented

The platform currently has no PDF/document generation for:
- Invoices
- Contracts
- Booking receipts

All document-related communication is handled via:
- HTML emails (booking confirmations, status updates)
- Web pages (booking details, receipts)
- Payment gateway receipts (Stripe/PayPal)
