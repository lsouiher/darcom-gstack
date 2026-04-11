# Quickstart: Host Admin Portal

## Prerequisites

- MongoDB running locally or via Docker
- Backend and admin apps can start (`npm run dev`)
- At least one Admin user and one Agency user in the database

## Testing the Feature

### 1. Start the dev stack

```bash
# Option A: Docker (recommended)
docker-compose -f docker-compose.dev.yml up -d

# Option B: Individual services
cd backend && npm run dev    # Port 4004
cd admin && npm run dev      # Port 3003
```

### 2. Verify agency-scoped navigation

1. Open `https://localhost:3003` (or your admin URL)
2. Log in as an **Agency** user
3. Verify the sidebar shows: Dashboard, Scheduler, Locations, Properties, Bookings, Users, About, ToS, Contact
4. Verify the sidebar does NOT show: Agencies, Countries
5. Navigate to `/agencies` directly — should see Unauthorized page
6. Navigate to `/countries` directly — should see Unauthorized page

### 3. Verify data isolation

1. While logged in as Agency:
   - Properties page shows only your agency's properties
   - Bookings page shows only bookings for your properties
   - Users page shows only renters who booked your properties
2. Log in as Admin in a different browser:
   - All pages show all data (no filtering)

### 4. Verify backend enforcement

```bash
# Get an agency user's auth token (from browser cookies or login API)
TOKEN="your-agency-jwt-token"

# Try to list another agency's properties (should be ignored — returns only your own)
curl -X POST https://localhost:4004/api/properties \
  -H "Cookie: x-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agencies": ["ANOTHER_AGENCY_ID"]}'

# Try to create a property for another agency (should force your agency ID)
curl -X POST https://localhost:4004/api/create-property \
  -H "Cookie: x-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"agency": "ANOTHER_AGENCY_ID", "name": "Test"}'

# Try to create a location (should return 403)
curl -X POST https://localhost:4004/api/create-location \
  -H "Cookie: x-access-token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"names": [{"language": "en", "name": "Test"}]}'
```

### 5. Verify agency self-management

1. Log in as Agency user
2. Navigate to Settings
3. Update agency name, avatar, or contact info
4. Verify changes persist after page refresh

### 6. Run existing tests

```bash
cd backend
npm run test
```

All existing tests MUST pass without modification (admin user behavior is unchanged).

## Seed Data

If you need test agencies, use the backend setup:

```bash
cd backend
npm run setup
```

This creates the default admin and sample agencies per the seed configuration.
