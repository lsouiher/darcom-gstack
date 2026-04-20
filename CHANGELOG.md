# Changelog

All notable changes to DaryWin will be documented in this file.

## [0.1.1.0] - 2026-04-19

### Security

- **Closed cross-app handoff replay window.** The signup-token bridge that
  drops new hosts straight into the admin portal is now structurally safe:
  the JWT travels in a short-TTL httpOnly signed cookie scoped to your auth
  cookie domain (no longer in the URL bar where it would leak via Referer
  headers, browser history, and server logs), the endpoint requires an admin
  Origin, the token is single-use (stamped on the user record so a replay
  inside its 120-second TTL is rejected), and every consumption attempt
  writes an audit row. The session JWT verifier now rejects any token that
  carries a `purpose` claim, so even if the bridge token leaked it could
  never be reused as a regular session cookie.
- **Removed public admin account creation.** `POST /api/admin-sign-up` was
  reachable without authentication and would create a platform admin from
  any unauthenticated request. It now requires an existing admin session.
  Bootstrap the first admin via `backend/src/setup/seed-prod.ts`.
- **Required real secrets at boot.** `DW_JWT_SECRET`, `DW_COOKIE_SECRET`,
  and `DW_AUDIT_PEPPER` previously fell back to the literal string
  "Darywin" if unset. The repo is open source, so the default was publicly
  known. They are now required env vars and the server refuses to boot if
  any of them equals a known-leaked default value.

### Added

- Cross-app `adminUrl()` helper on the frontend, reading `VITE_DW_ADMIN_HOST`
  with a sensible localhost fallback so dev environments work out of the box.
- "Your signup link expired" flash banner on the admin sign-in page (EN + FR)
  for users whose bridge token expired between signup and admin landing.
- 14 new backend tests covering the bridge cookie exchange (success, replay
  rejection, expired/blacklisted/non-Agency rejection, admin-Origin
  enforcement, audit writes, and session-verifier purpose-claim rejection).

### Fixed

- Pre-existing test breakage: `markerCoverage.test.ts` now runs under ESM
  (replaced `__dirname` with `import.meta.url`); `mail.test.ts` matches the
  current nodemailer transport options; `ipinfo.test.ts` honours
  `DW_IPINFO_DEFAULT_COUNTRY` instead of hardcoding US.
- Test isolation: `testHelper.initialize()` wipes leftover
  `@test.darywin.com` users at the start of each suite so partial-unique
  index collisions from prior aborted runs no longer break the suite.

### Operator notes

If you upgrade an existing deployment, set `DW_AUDIT_PEPPER` to a fresh
≥32-byte random value before booting (it was effectively known before this
release). Generate via:
`node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`

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
