---
name: dev-logs
description: Start dev servers and tail logs across backend, frontend, and admin for monitoring and debugging
user-invocable: true
allowed-tools: Bash, Read, Grep
argument-hint: "[app-name] e.g. backend, frontend, admin, all"
---

# Dev Logs

Start and monitor development servers across the DaryWin monorepo.

## Usage

Based on `$ARGUMENTS`:

### Single app
```bash
cd <app> && npm run dev
```

### All apps (Docker)
```bash
docker-compose -f docker-compose.dev.yml up -d
docker-compose -f docker-compose.dev.yml logs -f --tail=50
```

### Docker single service
```bash
docker-compose -f docker-compose.dev.yml logs -f --tail=100 dw-<app>
```

## When monitoring logs, watch for:

- **Backend**: MongoDB connection errors, JWT auth failures, Stripe/PayPal webhook issues, unhandled promise rejections
- **Frontend/Admin**: Vite HMR errors, API 401/403 responses, chunk load failures
- **General**: CORS errors, environment variable missing warnings, port conflicts

## Report findings

Summarize any errors or warnings found, with the relevant log lines and suggested fixes.
