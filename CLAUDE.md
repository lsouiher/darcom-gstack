# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DaryWin is a Rental Property Management Platform built as a TypeScript monorepo with four main applications and shared packages. It supports single-agency and multi-agency modes with Stripe and PayPal payment gateways.

## Repository Structure

```
├── backend/          # Node.js/Express REST API (MongoDB, JWT auth, Stripe/PayPal)
├── frontend/         # React customer-facing web app (Vite)
├── admin/            # React admin panel for agencies (Vite)
├── mobile/           # React Native Expo mobile app
└── packages/
    ├── darywin-types/           # Shared TypeScript interfaces and enums
    ├── darywin-helper/          # Shared utility functions
    ├── currency-converter/      # Currency conversion utilities
    ├── disable-react-devtools/  # Production DevTools disabler
    └── reactjs-social-login/    # OAuth social login components
```

## Common Commands

### Backend
```bash
cd backend
npm run dev              # Start dev server with nodemon (port 4004)
npm run build            # TypeScript + Babel build
npm run test             # Jest tests with coverage (builds first)
npm run setup            # Database seeding
npm run reset            # Database reset
```

### Frontend / Admin
```bash
cd frontend  # or: cd admin
npm run dev              # Vite dev server (frontend: 3004, admin: 3003)
npm run build            # Production build
npm run stylelint        # CSS linting
```

### Mobile
```bash
cd mobile
npm run start            # Expo dev server (port 8081)
npm run android          # Run on Android
npm run ios              # Run on iOS
```

### Root
```bash
npm run pre-commit       # Runs lint, type-check, and file size validation across all apps
```

## Running Tests

Only the backend has tests. Tests require a running MongoDB instance and run serially (`maxWorkers: 1`).

Run all tests (builds automatically):
```bash
cd backend
npm run test
```

Run a single test file (requires building first since Jest runs against `dist/`):
```bash
cd backend
npm run build && npx jest __tests__/user.test.ts
```

Run tests matching a pattern:
```bash
cd backend
npm run build && npx jest --testNamePattern="should create a user"
```

## Architecture

### Backend
- **Express.js** with routes -> controllers -> models pattern
- **MongoDB** with Mongoose ODM
- **JWT authentication** via jose library
- **Dual payment gateways**: Stripe and PayPal
- Route paths are defined separately in `src/config/*Routes.config.ts`, handlers in `src/routes/`, business logic in `src/controllers/`
- Keep controllers slim -- complex business logic lives in services or model methods
- Models in `src/models/` (User, Booking, Property, Location, Country, Notification)
- Auth middleware in `src/middlewares/authJwt.ts`
- Uses path alias `:darywin-types` to import shared types (configured in tsconfig.json `paths` and resolved by Babel)

### Frontend/Admin
- **React 19** with Vite bundler
- **Material-UI (MUI)** for components
- Service layer pattern: API calls in `src/services/`, axios instance with interceptors in `services/axiosInstance.ts`
- Context API for state: UserContext, NotificationContext
- Pages in `src/pages/`, reusable components in `src/components/`

### Mobile
- **React Native** with Expo
- **React Navigation** for routing
- Same service/context pattern as web apps
- Screens in `screens/`, components in `components/`

### Shared Types
`packages/darywin-types/` exports enums and interfaces used across all apps:
- `UserType`, `PropertyType`, `BookingStatus`, `RentalTerm`, `PaymentGateway`
- Payload interfaces for API contracts (e.g., `CreatePropertyPayload`, `BookingPayload`)
- Changes here affect all consuming apps -- rebuild and test accordingly

## Code Style

- **Semicolons**: Never (no semicolons)
- **Quotes**: Single quotes
- **Indent**: 2 spaces
- **ESLint**: Each app has its own `eslint.config.js`
- Pre-commit hooks (husky) enforce linting, type-checking, and a 5MB file size limit

## Key Patterns

- Each app manages its own dependencies and build process
- Shared code goes in `packages/` as separate npm packages
- i18n via lang files in each app's `lang/` directory (English and French)
- Environment config in `config/env.config.ts` per app; backend env vars are prefixed with `DW_`
- Backend uses ESM (`"type": "module"`) with Babel transpilation for the build step

## Sensitive Areas

Changes to these require extra care and testing:
- **Database schemas** (`backend/src/models/*`) and shared types in `packages/darywin-types` -- widely consumed across all apps
- **Payment gateway flows** (Stripe/PayPal) -- sensitive logic with external side effects

## Docker Development

```bash
docker-compose -f docker-compose.dev.yml up -d    # Start all services
docker-compose -f docker-compose.dev.yml down     # Stop services
```

Services: MongoDB, mongo-express, dw-backend, dw-admin, dw-frontend.

Host ports (remapped from the parent `darcom` repo so both can run side-by-side): frontend 8091, admin 3013, backend 4005, mongo-express 8085, mongo 27019. In-container ports are unchanged. Services use `restart: unless-stopped` — containers do not auto-start on Docker Desktop launch after an explicit `down`. See `DOCKER-QUICKSTART.md` and `LOCAL-SETUP.md` for details.

The pre-commit hook auto-detects running Docker containers and runs checks inside them when available, otherwise runs locally.

## gstack

Use the /browse skill from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.

Available skills: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /design-shotgun, /design-html, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /connect-chrome, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex, /cso, /autoplan, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade, /learn.

If gstack skills aren't working, run `cd .claude/skills/gstack && ./setup` to build the binary and register skills.

## Active Technologies
- TypeScript (Node.js backend, React 19 frontend) + Express.js, Mongoose, MUI, Vite (001-host-admin-portal)
- MongoDB via Mongoose ODM (001-host-admin-portal)
- TypeScript (Node.js 20 backend via ESM+Babel; React 19 + Vite frontend/admin) + Express.js, Mongoose, jose (JWT), MUI, axios (existing); add `libphonenumber-js` (phone validation), SMS provider SDK (see research), existing bcrypt/argon2 via existing User model (002-host-signup)
- MongoDB via Mongoose — extend `User` collection, add `HostSignupAudit` collection (002-host-signup)

## Recent Changes
- 001-host-admin-portal: Added TypeScript (Node.js backend, React 19 frontend) + Express.js, Mongoose, MUI, Vite

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
