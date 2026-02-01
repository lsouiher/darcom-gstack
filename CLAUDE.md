# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Movin' In is a Rental Property Management Platform built as a TypeScript monorepo with four main applications and shared packages.

## Repository Structure

```
├── backend/          # Node.js/Express REST API (MongoDB, JWT auth, Stripe/PayPal)
├── frontend/         # React customer-facing web app (Vite)
├── admin/            # React admin panel for agencies (Vite)
├── mobile/           # React Native Expo mobile app
└── packages/
    ├── movinin-types/           # Shared TypeScript interfaces and enums
    ├── movinin-helper/          # Shared utility functions
    ├── currency-converter/      # Currency conversion utilities
    ├── disable-react-devtools/  # Production DevTools disabler
    └── reactjs-social-login/    # OAuth social login components
```

## Common Commands

### Backend
```bash
cd backend
npm run dev              # Start dev server with nodemon
npm run build            # TypeScript + Babel build
npm run test             # Jest tests with coverage
npm run setup            # Database seeding
npm run reset            # Database reset
```

### Frontend / Admin
```bash
cd frontend  # or: cd admin
npm run dev              # Vite dev server
npm run build            # Production build
npm run stylelint        # CSS linting
```

### Mobile
```bash
cd mobile
npm run start            # Expo dev server
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run build:android    # EAS production build (Android)
npm run build:ios        # EAS production build (iOS)
```

### Root
```bash
npm run pre-commit       # Runs lint, type-check, and file size validation
```

## Running Tests

Backend only has tests. Run a single test file:
```bash
cd backend
npx jest __tests__/user.test.ts
```

Run all tests:
```bash
cd backend
npm run test
```

## Architecture

### Backend
- **Express.js** with routes → controllers → models pattern
- **MongoDB** with Mongoose ODM
- **JWT authentication** via jose library
- **Dual payment gateways**: Stripe and PayPal
- Routes defined in `src/routes/`, business logic in `src/controllers/`
- Models in `src/models/` (User, Booking, Property, Location, Country, Notification)

### Frontend/Admin
- **React 19** with Vite bundler
- **Material-UI (MUI)** for components
- Service layer pattern: API calls in `src/services/`
- Context API for state: UserContext, NotificationContext
- Pages in `src/pages/`, reusable components in `src/components/`

### Mobile
- **React Native** with Expo
- **React Navigation** for routing
- Similar service/context pattern as web apps
- Screens in `screens/`, components in `components/`

### Shared Types
`packages/movinin-types/` exports enums and interfaces used across all apps:
- `UserType`, `PropertyType`, `BookingStatus`, `RentalTerm`, `PaymentGateway`
- Payload interfaces for API contracts (e.g., `CreatePropertyPayload`, `BookingPayload`)

## Code Style

- **Semicolons**: Never (no semicolons)
- **Quotes**: Single quotes
- **Indent**: 2 spaces
- **ESLint**: Each app has its own `eslint.config.js`
- Pre-commit hooks enforce linting and type-checking

## Key Patterns

- Each app manages its own dependencies and build process
- Shared code goes in `packages/` as separate npm packages
- API services use axios with interceptors in `services/axiosInstance.ts`
- i18n via lang files in each app's `lang/` directory (English, French)
- Environment config in `config/env.config.ts` per app

## Docker Development

```bash
docker-compose -f docker-compose.dev.yml up -d    # Start all services
docker-compose -f docker-compose.dev.yml down     # Stop services
```

Services: MongoDB, mongo-express, mi-backend, mi-admin, mi-frontend
