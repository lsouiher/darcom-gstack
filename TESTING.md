# Local Testing Guide

This guide covers how to set up and run tests locally for the Movin' In platform.

## Overview

Currently, only the **backend** application has automated tests. The test suite uses:
- **Jest** - Test runner and assertion framework
- **Supertest** - HTTP assertion library for Express API testing
- **MongoDB** - Real database for integration tests

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MongoDB** running locally or accessible via connection string
3. **Backend dependencies** installed

## Quick Start

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env

# Run all tests
npm run test
```

## Environment Setup

### Required Environment Variables

Create a `.env` file in the `backend/` directory with these minimum settings:

```bash
# Database - use a separate test database to avoid data conflicts
MI_DB_URI=mongodb://localhost:27017/movinin_test

# Admin account for test setup
MI_ADMIN_EMAIL=admin@test.local

# Security (use any values for local testing)
MI_JWT_SECRET=test-jwt-secret-key
MI_COOKIE_SECRET=test-cookie-secret-key
MI_JWT_EXPIRE_AT=86400000
MI_TOKEN_EXPIRE_AT=86400000

# Backend URL
MI_BACKEND_HOST=http://localhost:4002

# CDN paths
MI_CDN_USERS=./cdn/users
MI_CDN_TEMP_USERS=./cdn/temp/users
MI_CDN_PROPERTIES=./cdn/properties
MI_CDN_TEMP_PROPERTIES=./cdn/temp/properties
MI_CDN_LOCATIONS=./cdn/locations
MI_CDN_TEMP_LOCATIONS=./cdn/temp/locations
MI_CDN_COUNTRIES=./cdn/countries

# Optional - for payment tests
MI_STRIPE_SECRET_KEY=sk_test_xxx
MI_PAYPAL_SANDBOX=true
MI_PAYPAL_CLIENT_ID=xxx
MI_PAYPAL_CLIENT_SECRET=xxx

# Optional - for email tests
MI_SMTP_HOST=smtp.example.com
MI_SMTP_PORT=587
MI_SMTP_USER=test@example.com
MI_SMTP_PASS=password
```

### Using Docker for MongoDB

If you don't have MongoDB installed locally:

```bash
# Start MongoDB only
docker run -d -p 27017:27017 --name movinin-mongo mongo:latest

# Or use docker-compose
docker-compose -f docker-compose.dev.yml up -d mongo
```

## Running Tests

### Run All Tests

```bash
cd backend
npm run test
```

This command:
1. Clears previous coverage reports
2. Builds TypeScript to JavaScript
3. Runs Jest with ESM module support
4. Generates coverage reports

### Run a Single Test File

```bash
cd backend
npm run build
npx jest __tests__/user.test.ts
```

### Run Tests Matching a Pattern

```bash
cd backend
npm run build
npx jest --testNamePattern="should create a user"
```

### Run Tests in Watch Mode

```bash
cd backend
npm run build
npx jest --watch
```

### Run Tests with Verbose Output

```bash
cd backend
npm run build
npx jest --verbose
```

## Test Files

All tests are located in `backend/__tests__/`:

| File | Description |
|------|-------------|
| `agency.test.ts` | Agency CRUD and validation |
| `authHelper.test.ts` | Authentication helper functions |
| `booking.test.ts` | Booking creation, updates, payments |
| `config.test.ts` | Environment configuration |
| `country.test.ts` | Country management |
| `database.test.ts` | Database connections |
| `helper.test.ts` | Utility functions |
| `index.test.ts` | App initialization |
| `ipinfo.test.ts` | IP geolocation |
| `location.test.ts` | Location CRUD |
| `logger.test.ts` | Logging functionality |
| `mail.test.ts` | Email service |
| `middleware.test.ts` | Auth and HTTP middleware |
| `miscellaneous.test.ts` | Validation utilities |
| `notification.test.ts` | Notification system |
| `paypal.test.ts` | PayPal integration |
| `property.test.ts` | Property management |
| `sentry.test.ts` | Error monitoring |
| `stripe.test.ts` | Stripe integration |
| `user.test.ts` | User CRUD and authentication |

## Test Helpers

The `testHelper.ts` module provides utilities for tests:

```typescript
import * as testHelper from './testHelper'

// Initialize test environment
await testHelper.initialize()

// Create test users
const adminToken = await testHelper.signinAsAdmin()
const user = await testHelper.createUser()

// Create test data
const agency = await testHelper.createAgency()
const location = await testHelper.createLocation()
const property = await testHelper.createProperty(agency._id, location._id)

// Cleanup
await testHelper.close()
```

### Common Test Credentials

- **Admin email**: Set via `MI_ADMIN_EMAIL` environment variable
- **Test password**: `Un1tTest5`

## Writing New Tests

### Basic Test Structure

```typescript
import 'dotenv/config'
import request from 'supertest'
import app from '../src/app'
import * as databaseHelper from '../src/utils/databaseHelper'
import * as testHelper from './testHelper'
import * as env from '../src/config/env.config'

describe('My Feature', () => {
  beforeAll(async () => {
    testHelper.initializeLogger()
    await databaseHelper.connect(env.DB_URI, false, false)
    await testHelper.initialize()
  })

  afterAll(async () => {
    await testHelper.close()
    await databaseHelper.close()
  })

  describe('POST /api/my-endpoint', () => {
    it('should do something', async () => {
      const token = await testHelper.signinAsAdmin()

      const res = await request(app)
        .post('/api/my-endpoint')
        .set(env.X_ACCESS_TOKEN, token)
        .send({ data: 'test' })

      expect(res.statusCode).toBe(200)
      expect(res.body).toHaveProperty('id')
    })
  })
})
```

### Testing Authenticated Endpoints

```typescript
// Sign in as admin
const adminToken = await testHelper.signinAsAdmin()

// Make authenticated request
const res = await request(app)
  .get('/api/protected-route')
  .set(env.X_ACCESS_TOKEN, adminToken)

// Sign in as regular user
const user = await testHelper.createUser()
const userToken = await testHelper.signinAsUser(app, user.email)
```

### Testing File Uploads

```typescript
const res = await request(app)
  .post('/api/upload')
  .set(env.X_ACCESS_TOKEN, token)
  .attach('image', 'path/to/test/image.jpg')

expect(res.statusCode).toBe(200)
```

## Coverage Reports

After running tests, coverage reports are generated in `backend/coverage/`:

- **HTML Report**: Open `coverage/index.html` in a browser
- **Cobertura XML**: `coverage/cobertura-coverage.xml` (for CI/CD)

### View Coverage Summary

```bash
cd backend
npm run test
# Coverage summary prints to console after tests complete
```

## Troubleshooting

### Tests Timeout

Tests have a 5-minute timeout. If tests are timing out:
- Check MongoDB connection
- Ensure database is accessible
- Check network connectivity for external services

### Database Connection Errors

```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand({ ping: 1 })"

# Or with Docker
docker ps | grep mongo
```

### Module Resolution Errors

If you see ES module errors:
```bash
# Ensure build is up to date
cd backend
npm run build

# Clear Jest cache
npx jest --clearCache
```

### Port Already in Use

If tests fail due to port conflicts:
```bash
# Find process using the port
lsof -i :4002

# Kill the process
kill -9 <PID>
```

### Clean Test State

To reset and start fresh:
```bash
cd backend
rm -rf dist coverage node_modules/.cache
npm run build
npm run test
```

## CI/CD Integration

Tests run automatically via GitHub Actions on:
- Pull requests
- Pushes to main branch

The workflow is defined in `.github/workflows/test.yml`.

## Frontend/Admin/Mobile Testing

These applications currently don't have automated tests. However, you can verify code quality with:

```bash
# Linting
cd frontend  # or admin
npm run lint

# Type checking
npm run build
```

## Best Practices

1. **Use a separate test database** - Don't run tests against production or development data
2. **Clean up after tests** - Use `afterAll` hooks to remove test data
3. **Run tests before committing** - The pre-commit hook runs linting and type checks
4. **Keep tests isolated** - Each test should be independent
5. **Mock external services** - For payment gateways in unit tests, consider mocking
