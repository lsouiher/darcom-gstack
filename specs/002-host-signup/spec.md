# Feature Specification: Self-Serve Host Signup

**Feature Branch**: `002-host-signup`
**Created**: 2026-04-12
**Status**: Draft
**Input**: Source design doc: `~/.gstack/projects/Projects-darcom/leosouiher-001-host-admin-portal-design-20260412-011128.md` (Approved — Approach B: Full host funnel)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Host self-signup from public landing page (Priority: P1)

A property owner discovers DaryWin (via a shared link or search), lands on the "Become a Host" page, reads the value proposition, clicks the signup CTA, and completes a multi-step signup (phone verification, email + password, agency name + location, optional first property teaser). On completion they are dropped into the existing admin portal as an active agency account, ready to list properties — without any platform-admin intervention.

**Why this priority**: This is the core wedge. Without self-signup, every new host continues to require manual provisioning, which is the bottleneck this feature exists to remove. Shipping just this story delivers the MVP: named hosts can onboard themselves end-to-end.

**Independent Test**: A fresh visitor (no prior account) navigates to `/become-a-host`, completes the full wizard with a real phone number and email, and arrives at the admin portal able to view an empty property list. Verified by end-to-end walkthrough on desktop and mobile web.

**Acceptance Scenarios**:

1. **Given** a visitor with no existing account, **When** they complete every signup step with valid inputs and a successful phone OTP, **Then** an agency account is created, they are signed in to the admin portal, and they can reach the "Add Property" screen.
2. **Given** a visitor entering a phone number already associated with an existing account, **When** they submit the phone step, **Then** they are asked to use a different number (or sign in) and cannot proceed with that phone.
3. **Given** a visitor on mobile web, **When** they complete the wizard, **Then** every step renders and functions correctly on a small viewport (no horizontal scroll, all controls reachable).
4. **Given** a visitor who closes the browser mid-wizard after phone verification, **When** they return via the same link/session, **Then** they resume at the next unfinished step rather than starting over.

---

### User Story 2 - In-portal onboarding checklist guiding host to first listing (Priority: P2)

After signup, the host sees a clear, progressive onboarding checklist inside the admin portal showing what they still need to do to start collecting rent: verify phone ✓, verify email, add first property, add payout account, receive first booking. Each item links directly to the screen that completes it.

**Why this priority**: Signup without activation is vanity. The checklist converts "account created" into "first property listed," which is the real success metric. Depends on Story 1 but is independently valuable once signup exists.

**Independent Test**: A freshly signed-up host logs in and sees the checklist on their dashboard with accurate completion state; clicking each incomplete item navigates to the right screen; completing an item flips its state to ✓ on return.

**Acceptance Scenarios**:

1. **Given** a newly signed-up host with no properties, **When** they open the admin dashboard, **Then** the checklist shows phone verified ✓, and remaining items (email, property, payout) as incomplete with clear CTAs.
2. **Given** a host who has added one property, **When** they return to the dashboard, **Then** the "Add first property" item is marked complete.

---

### User Story 3 - Admin-gated first payout with pending-review queue (Priority: P2)

Platform admins see a "Pending review" filter on the Agencies screen listing self-signed-up hosts whose first payout has not yet been approved. An admin reviews the account, approves, and subsequent payouts for that host flow automatically.

**Why this priority**: This is the fraud-containment gate that makes lightweight signup safe. Without it, self-signup opens a money-movement vector. Ships alongside signup; not strictly required before first signup but required before first payout.

**Independent Test**: An admin filters Agencies by "Pending review," sees the test host, clicks approve, and the host's first-payout gate is lifted. Subsequent payout release simulations succeed without additional gating.

**Acceptance Scenarios**:

1. **Given** a self-signed-up host with no admin approval, **When** a payout would be triggered, **Then** the payout is held and appears on an admin pending-payout list.
2. **Given** an admin viewing the pending-review queue, **When** they approve a host, **Then** the host's first-payout gate is lifted and future payouts are released without manual intervention.

---

### User Story 4 - Trust heuristics flag suspicious signups for admin review (Priority: P3)

When a signup's phone number or property address matches an existing record suspiciously (same phone on multiple accounts, same geocoded address as another property), the system soft-flags the account for admin review rather than blocking signup outright.

**Why this priority**: Reduces fraud drag without harming conversion for legitimate users. P3 because the admin-gated first payout (Story 3) is the hard fraud backstop; heuristics are additional signal, not the primary defense.

**Independent Test**: Create two signups with overlapping phone/address; verify both accounts exist but the second appears in an admin "flagged" view with the reason.

**Acceptance Scenarios**:

1. **Given** a signup whose address geocodes to a location already associated with another property, **When** signup completes, **Then** the account is created active but flagged with reason "duplicate address" in the admin review view.

---

### Edge Cases

- **Phone OTP provider outage**: Wizard shows a clear "verification unavailable, try again shortly" state and allows retry; signup does not complete with an unverified phone.
- **Host signs up but never adds a property**: Account remains active; after 24h without a property a reminder email is sent; after 30d the host appears on an admin "stale signups" view.
- **Host abandons wizard mid-flow**: Partial state is preserved so they can resume at the last completed step on return; partial records are not visible to admins as active agencies.
- **Email fails to verify**: Signup still completes (soft-verify) but the checklist keeps "verify email" as incomplete and limits sensitive actions (e.g., payout setup) until verified.
- **International phone numbers**: Supported countries are restricted to the launch geography; users entering an unsupported country code see a clear message.
- **Attempted signup with platform-admin email domain or reserved names**: Rejected with a generic error.
- **Duplicate submissions / double-click on final step**: Only one account is created; subsequent submissions are idempotent.

## Requirements *(mandatory)*

### Functional Requirements

**Public landing + signup wizard**

- **FR-001**: System MUST provide a public "Become a Host" landing page reachable without authentication, indexable by search engines, explaining the value proposition and linking to the signup wizard.
- **FR-002**: System MUST provide a multi-step host signup wizard with these steps in order: (1) phone number + OTP verification, (2) email + password, (3) agency name + location, (4) optional first-property teaser.
- **FR-003**: System MUST verify the host's phone number via a one-time code before the account becomes active.
- **FR-004**: System MUST send an email verification message on signup; email verification MAY complete asynchronously (soft-verify) without blocking account activation.
- **FR-005**: System MUST preserve in-progress wizard state so a host can resume after a disconnect without redoing verified steps.
- **FR-006**: System MUST function correctly on mobile web viewports, including all wizard steps and the landing page.

**Account creation**

- **FR-007**: System MUST create a host account reusing the existing Agency user type (no new user type introduced), with initial state: phone-verified, email-pending, first-payout-not-approved.
- **FR-008**: System MUST reject signup if the submitted phone number already belongs to another account, instructing the user to use a different number or sign in.
- **FR-009**: System MUST never allow a self-signed-up host to see or modify data belonging to other agencies (tenant isolation enforced server-side).
- **FR-010**: System MUST leave the existing admin-provisioned agency creation flow fully operational and unchanged for platform admins.

**Post-signup experience**

- **FR-011**: System MUST, on successful signup, sign the host into the existing admin portal and present an onboarding checklist covering: phone verified, email verified, first property added, payout account added, first booking received.
- **FR-012**: System MUST reflect real completion state for each checklist item and provide direct navigation to the screen that completes each item.

**Fraud containment**

- **FR-013**: System MUST hold the first payout for any self-signed-up host until a platform admin explicitly approves that host.
- **FR-014**: System MUST provide platform admins a "Pending review" view listing self-signed-up hosts whose first payout has not been approved.
- **FR-015**: System MUST soft-flag signups whose phone number or property address conflicts with existing records, surfacing the flag and reason in an admin review view, without blocking account creation.
- **FR-016**: System MUST record an audit entry for every host signup capturing at minimum: account identifier, timestamp, originating IP, and user agent.

**Operational safety**

- **FR-017**: System MUST rate-limit signup and OTP endpoints to resist abuse.
- **FR-018**: System MUST restrict signup to supported launch geographies by phone country code, with a clear message for unsupported codes.

**Expanded scope (CEO review 2026-04-12, SELECTIVE EXPANSION)**

- **FR-019**: System MUST emit funnel analytics events at landing view, each wizard step enter/complete, and signup completion, such that conversion rate (SC-003) is measurable.
- **FR-020**: System MUST prefer WhatsApp as the OTP delivery channel with automatic fallback to SMS on WhatsApp delivery failure; switching channels MUST invalidate any prior in-flight code.
- **FR-021**: After the email step, System MUST send a signed, single-use, 24h-TTL resume link to the host's email so the wizard can be resumed on any device.
- **FR-022**: On signup completion System MUST, if a founder-alert webhook is configured, notify the founder with agency name, phone, city, and any flags; failure of this notification MUST NOT block signup.
- **FR-023**: System MUST write an audit entry for failed signup attempts (OTP failures, phone collisions, rate-limit trips, country-code rejections) with the phone number stored as a salted hash for failure events.
- **FR-024**: System MUST surface a user-visible expectation that property ownership will be verified before the first payout (copy line in the wizard).
- **FR-025**: System MUST support a runtime kill switch (`DW_SIGNUP_PUBLIC_ENABLED`) that disables public signup without a deploy; the existing admin-provisioned agency creation MUST remain unaffected when the switch is off.
- **FR-026**: Error copy on phone or email collision MUST NOT disclose whether a given phone/email is already registered (enumeration resistance).
- **FR-027**: System MUST not couple signup completion success to the availability of analytics, webhook, or email-send side effects (fire-and-forget; local log on failure).

### Key Entities

- **Host Account**: An agency-type user created via self-serve signup. Key attributes: phone-verified flag, email-verified flag, first-payout-approved flag, onboarding step, creation timestamp. Reuses the existing user/agency record; adds the new flags and onboarding-step field.
- **Signup Audit Entry**: One record per signup attempt/completion capturing account reference, timestamp, IP, user agent, and any trust flags raised. Append-only; admin-readable.
- **Onboarding Checklist (derived view)**: Not a separately stored entity; a computed view over the host account and its related property/payout/booking records.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A net-new host can go from landing-page click to first property published in **under 15 minutes** on both desktop and mobile web.
- **SC-002**: The named cohort of prospective hosts identified pre-launch are onboarded via the self-serve flow within **2 weeks** of launch, with zero manual provisioning required.
- **SC-003**: Landing-page-view-to-completed-signup conversion is **at least 25%** during the first 30 days post-launch.
- **SC-004**: Confirmed-fraudulent signups are **under 5%** of total signups in the first 30 days.
- **SC-005**: First payout for a self-signed-up host is processed within **7 days** of the host's first received booking payment.
- **SC-006**: Existing admin-provisioned agency flow shows **zero regressions** (verified by existing admin walkthroughs and any existing tests continuing to pass).
- **SC-007**: At least **90%** of hosts who complete signup reach "first property added" within 24 hours.

## Assumptions

- Tenant isolation work from feature 001-host-admin-portal is in place before this feature is released; self-signed-up hosts cannot otherwise be safely scoped.
- The existing agency data model can be extended with a small number of additional flags and an onboarding-step field without disruptive migration (additive, default-safe).
- Phone verification via one-time code is acceptable as the day-one trust gate; identity-document verification is out of scope for this feature.
- Email verification is soft (does not block account activation) to reduce drop-off; stricter enforcement can be added later if fraud signal warrants.
- Launch geography is constrained to a known set of countries; supporting global phone numbers on day one is out of scope.
- The choice of SMS provider, the payout rail itself (bank transfer vs. card processor vs. mobile money), and WhatsApp-based onboarding are out of scope for this feature and tracked separately.
- Converting an existing renter account (non-agency user) into a host account is out of scope for v1.
- Property ownership verification (deed, legal proof) is out of scope for v1 and gated behind the admin first-payout review.
- The platform admin team has capacity to review pending first-payout approvals within the 7-day SLA implied by SC-005.
