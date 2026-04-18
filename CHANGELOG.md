# Changelog

All notable changes to DaryWin will be documented in this file.

## [0.1.0.0] - 2026-04-18

### Added
- Host signup wizard with phone OTP verification via Twilio (WhatsApp + SMS fallback)
- "Become a Host" landing page on the frontend with clear onboarding steps
- Email confirmation page that replaces the old raw-API-response verification flow
- Automatic verification polling so the original tab updates without manual refresh
- Host onboarding checklist in the admin panel showing progress toward first booking
- Pending review agencies page for platform admins to approve new hosts
- Tenant scope middleware isolating agency data across the admin panel
- Role-based route guards preventing non-admin users from accessing admin-only pages
- Rate limiting on all host signup endpoints to prevent abuse
- Signup session cookies with HMAC signing and configurable TTL
- Phone number validation with country-level blocking
- Audit logging for all signup events (OTP attempts, collisions, completions)
- Founder alert webhook on new host signups

### Changed
- Email verification links now point to a frontend page instead of the backend API
- SMTP credentials made optional for local development (MailHog support)
- Allowed HTTP methods updated to include PATCH

### Fixed
- Session cookie HMAC verification hardened against timing oracle attacks
- OTP auto-submit in signup wizard no longer sends stale 5-digit code
- Teaser property inputs validated for price, name length, and coordinate ranges
- SMS dev mode guard requires explicit development/test NODE_ENV
