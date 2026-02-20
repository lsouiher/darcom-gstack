# Copilot / AI Agent Instructions for this repository

This file gives concise, repository-specific guidance for AI coding agents so they can be productive immediately.

- **Monorepo overview:** This is a TypeScript monorepo with four main apps and shared packages: `backend/`, `frontend/`, `admin/`, `mobile/`, and `packages/` (shared types and helpers).

- **Big picture architecture:**
  - Backend: Node/Express REST API (routes → controllers → models) using MongoDB via Mongoose. See [backend/src](backend/src).
  - Frontend/Admin: React apps built with Vite. Service layer for API calls in `src/services/`. See [frontend/src](frontend/src) and [admin/src](admin/src).
  - Mobile: React Native (Expo) app following similar `services/` + `context/` patterns. See [mobile/src](mobile/src) and `app.json`.
  - Shared types/utilities: `packages/movinin-types/` and `packages/movinin-helper/` are authoritative sources for enums/interfaces and helpers used across apps.

- **Where to look first (quick tour):**
  - API surface and business logic: [backend/src/routes](backend/src/routes), [backend/src/controllers](backend/src/controllers), [backend/src/models](backend/src/models)
  - Client API usage: [frontend/src/services](frontend/src/services), [admin/src/services](admin/src/services)
  - Shared contracts: [packages/movinin-types](packages/movinin-types)

- **Key integration points to be aware of:**
  - MongoDB (dev via `docker-compose.dev.yml`), see `docker-compose*.yml` for service names.
  - Payments: Stripe and PayPal integrations live under backend payment modules (search for `stripe` and `paypal` in `backend/src`).
  - Auth: JWT-based auth implemented in backend; check `src/middlewares` and `src/controllers/auth`.

- **Commands & developer workflows (explicit):**
  - Backend dev: `cd backend` → `npm run dev` (nodemon) ; build: `npm run build`; tests: `npm run test` (Jest)
  - Frontend/Admin dev: `cd frontend` or `cd admin` → `npm run dev` (Vite)
  - Mobile (Expo): `cd mobile` → `npm run start` ; device runs: `npm run android` / `npm run ios`
  - Root pre-commit checks: at repo root run `npm run pre-commit` (lint + types)
  - Docker dev stack: `docker-compose -f docker-compose.dev.yml up -d`

- **Testing and CI pointers:**
  - Backend contains the Jest test suite under `backend/__tests__/`. Prefer running focused tests during development: `npx jest __tests__/some.test.ts`.
  - When changing shared types (`packages/movinin-types`), run builds and tests in all consuming apps to catch type regressions.

- **Code style & conventions (explicit):**
  - No semicolons. Single quotes. 2-space indent. Each app has its own `eslint.config.js`.
  - Service-layer pattern: API calls live in `src/services/` and are consumed by pages/components.
  - Backend pattern: routes → controller functions → model layer. Keep controllers slim; business logic often lives in services or model methods.

- **Patterns and examples to follow:**
  - API client with interceptors: look for `axiosInstance` or similar in `src/services/` and mirror its usage for new HTTP interactions.
  - Shared enums/interfaces: import from `packages/movinin-types` rather than redefining types.
  - i18n: language files live in each app's `lang/` directory — follow existing keys and structure when adding text.

- **Debugging tips:**
  - Backend: use `npm run dev` and inspect logs from `nodemon`; Docker dev stack exposes services under names in `docker-compose.dev.yml`.
  - Frontend/Admin: use Vite console and React devtools (devtool disabling is handled by `disable-react-devtools` package for production builds).

- **Files to reference when making changes / PR checklist:**
  - Use `packages/movinin-types` for shared payload types.
  - Update affected `package.json` scripts only in the app you modify.
  - Run `npm run pre-commit` at repo root and app-level linters before opening a PR.

- **What not to change without review:**
  - Database schemas (`backend/src/models/*`) and shared types in `packages/movinin-types` — these are widely consumed and require coordination.
  - Payment gateway flows (Stripe/PayPal) — sensitive logic and external side effects.

If anything here is unclear or you want additional examples (small code snippets or specific file links), tell me which section to expand.
