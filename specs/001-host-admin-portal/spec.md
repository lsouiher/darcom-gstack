# Feature Specification: Host Admin Portal

**Feature Branch**: `001-host-admin-portal`
**Created**: 2026-04-11
**Status**: Draft
**Input**: User description: "Individual admin panel for hosts (agencies), same view as current admin features but restricted to their properties only."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agency Data Isolation (Priority: P1)

As a platform operator, I need the system to enforce that agency users can only access data belonging to their own agency, so that one agency cannot view or modify another agency's properties, bookings, or associated users — even if API requests are manually crafted.

**Why this priority**: This is the security foundation. Without server-side enforcement, all other agency-scoping features are cosmetic and bypassable. A data breach between agencies would be a critical trust violation.

**Independent Test**: Authenticate as an agency user, then make direct API calls supplying another agency's ID. Every request MUST return 403 Forbidden.

**Acceptance Scenarios**:

1. **Given** an agency user is authenticated, **When** they request the property list, **Then** only properties belonging to their agency are returned — regardless of what agency IDs are sent in the request body.
2. **Given** an agency user is authenticated, **When** they attempt to update a property belonging to another agency, **Then** the system returns 403 Forbidden and no data is modified.
3. **Given** an agency user is authenticated, **When** they request the booking list, **Then** only bookings for their own properties are returned.
4. **Given** an agency user creates a property, **When** the request body contains a different agency's ID, **Then** the system ignores the supplied ID and assigns the property to the authenticated agency.
5. **Given** an agency user is authenticated, **When** they attempt to create, update, or delete a location or country, **Then** the system returns 403 Forbidden.

---

### User Story 2 - Agency-Scoped Navigation and Views (Priority: P2)

As an agency user, I see a streamlined admin panel that only shows pages and controls relevant to my role, so I am not confused by admin-only features and I can focus on managing my own properties and bookings.

**Why this priority**: After security is enforced server-side, the frontend needs to reflect the correct scope. This is the core UX of the host portal — making it feel purpose-built rather than a restricted admin view.

**Independent Test**: Log in as an agency user and verify that the sidebar only shows relevant items, admin-only URLs show an Unauthorized page, and all data views display only the agency's own data.

**Acceptance Scenarios**:

1. **Given** an agency user is logged in, **When** they view the sidebar menu, **Then** they see: Dashboard, Scheduler, Locations, Properties, Bookings, Users, About, ToS, Contact — but NOT Agencies or Countries.
2. **Given** an agency user is logged in, **When** they navigate directly to /agencies or /countries via URL, **Then** they see an Unauthorized message.
3. **Given** an agency user is logged in, **When** they visit the Locations page, **Then** they can browse all locations but do not see any create, edit, or delete controls.
4. **Given** an agency user is logged in, **When** they visit the Users page, **Then** they see only users who have bookings on their properties, plus their own agency account.
5. **Given** an agency user is logged in, **When** they visit the Properties page, **Then** they see only their own properties with no agency filter dropdown.

---

### User Story 3 - Agency Profile Self-Management (Priority: P2)

As an agency user, I can update my own agency profile (name, avatar, contact information) from within the admin portal, so I can keep my public-facing information current without needing to contact the platform administrator.

**Why this priority**: Agencies need autonomy over their own branding and contact details. This reduces admin overhead and empowers hosts.

**Independent Test**: Log in as an agency user, navigate to Settings, update the agency name and avatar, and verify the changes persist and display correctly.

**Acceptance Scenarios**:

1. **Given** an agency user is logged in, **When** they navigate to Settings, **Then** they see their agency profile fields (name, avatar, contact info) and can edit them.
2. **Given** an agency user updates their agency name, **When** they save the changes, **Then** the updated name appears across the portal immediately.
3. **Given** an agency user attempts to view or modify another agency's profile, **Then** the system prevents access and returns an error.

---

### User Story 4 - Agency-Scoped Dashboard and Notifications (Priority: P3)

As an agency user, my dashboard displays metrics and notifications relevant only to my own properties and bookings, so I get an accurate picture of my business performance without noise from other agencies.

**Why this priority**: Nice-to-have polish that completes the host portal experience. The core functionality works without this, but it provides a better day-to-day experience.

**Independent Test**: Log in as an agency user and verify that dashboard stats reflect only their own properties/bookings, and notifications are relevant to their agency only.

**Acceptance Scenarios**:

1. **Given** an agency user is logged in, **When** they view the dashboard, **Then** all metrics (booking count, revenue, occupancy) reflect only their own properties.
2. **Given** an agency user is logged in, **When** they view notifications, **Then** they see only notifications related to their own properties and bookings.
3. **Given** an agency has zero properties, **When** they view the dashboard, **Then** they see empty states with guidance, not errors or other agencies' data.

---

### Edge Cases

- **Agency with zero properties**: All pages (Properties, Bookings, Scheduler, Users, Dashboard) MUST show graceful empty states, not errors.
- **Agency user bookmarks admin-only URL**: Navigating to /agencies or /countries MUST show an Unauthorized page, not a blank screen or crash.
- **Agency deleted while logged in**: The next API request MUST fail authentication and redirect to sign-in.
- **Location deleted by admin while in use by agency's property**: The agency's property page MUST show a graceful fallback (e.g., "Location removed") rather than crash.
- **Same renter books with multiple agencies**: Each agency sees only their own bookings with that renter, not all of the renter's bookings.
- **Multi-tab session with role change**: If an admin changes an agency's user type while they're logged in, the next API call MUST enforce the new permissions.
- **Property creation with spoofed agency ID**: The system MUST ignore the client-supplied agency ID and use the authenticated user's ID.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST derive the authenticated user's identity from the server-side session/token, never from client-supplied request parameters.
- **FR-002**: For agency-type users, the system MUST automatically scope all property queries to only return properties owned by the authenticated agency.
- **FR-003**: For agency-type users, the system MUST automatically scope all booking queries to only return bookings on properties owned by the authenticated agency.
- **FR-004**: For agency-type users, the system MUST scope user lists to show only: (a) the agency's own account and (b) end-users who have bookings on that agency's properties.
- **FR-005**: When an agency user creates a property, the system MUST assign the property to the authenticated agency, ignoring any client-supplied agency identifier.
- **FR-006**: Location and country create/update/delete operations MUST be restricted to admin-type users only, returning 403 for all other user types.
- **FR-007**: Location and country read/list operations MUST remain accessible to agency-type users.
- **FR-008**: The admin panel sidebar MUST conditionally display menu items based on user type — hiding Agencies and Countries entries for non-admin users.
- **FR-009**: Direct URL access to admin-only pages by agency users MUST display an Unauthorized message.
- **FR-010**: Agency users MUST be able to edit their own agency profile (name, avatar, contact information) via Settings.
- **FR-011**: Agency users MUST NOT be able to view or modify other agencies' profiles.
- **FR-012**: Dashboard metrics MUST be scoped to the authenticated agency's own properties and bookings.
- **FR-013**: Notifications MUST be filtered to show only those relevant to the authenticated agency's properties and bookings.

### Key Entities

- **Agency (Host)**: A property management entity that owns properties, manages bookings, and has associated renters. Key attributes: name, avatar, contact info, status.
- **Property**: A rental listing owned by exactly one agency. Linked to a location. Key relationship: agency ownership determines visibility scope.
- **Booking**: A reservation on a property. Visible to the owning agency and the renter. Links an agency's property to a user.
- **Location**: A geographic area where properties are listed. Global reference data managed by admins, browseable by agencies.
- **Country**: A top-level geographic entity containing locations. Global reference data managed exclusively by admins.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An authenticated agency user making direct API calls with another agency's ID receives 403 on all property, booking, and user endpoints — zero cross-agency data leakage.
- **SC-002**: Agency users see exactly 9 sidebar menu items (Dashboard, Scheduler, Locations, Properties, Bookings, Users, About, ToS, Contact) and do not see Agencies or Countries.
- **SC-003**: Agency users see only their own properties; the count matches a database query filtered by their agency ID.
- **SC-004**: Agency users see only bookings for their own properties.
- **SC-005**: Agency users see only users with bookings on their properties, plus their own account.
- **SC-006**: Agency users can browse locations but cannot find create/edit/delete controls; direct API calls to mutate locations return 403.
- **SC-007**: Agency users navigating to /agencies or /countries see an Unauthorized page.
- **SC-008**: When an agency user creates a property, the backend assigns the authenticated user's agency ID regardless of request body content.
- **SC-009**: Agency users can update their own agency profile and see changes reflected immediately.
- **SC-010**: Dashboard stats for an agency user reflect only their own properties and bookings.

## Assumptions

- "Hosts" refers to Agency-type users (`UserType.Agency`) in the existing system — no new user type is being created.
- The existing admin app at admin.darywin.com continues to serve both admin and agency users — this is not a separate application.
- The existing authentication flow (JWT-based) is reused. No changes to how agencies log in.
- Locations and Countries are global reference data. Agencies browse locations to assign them to properties but do not manage them.
- The mobile app is out of scope for this feature — it serves end-users (renters), not agencies.
- The frontend customer-facing app is unaffected by this feature.
- Existing admin users retain full unrestricted access to all data and features.
