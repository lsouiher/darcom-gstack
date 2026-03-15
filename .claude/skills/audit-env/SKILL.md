---
name: audit-env
description: Scan all .env files across the monorepo to find unused, missing, or inconsistent environment variables
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent
argument-hint: "[--cleanup]"
---

# Audit Environment Variables

Scan the DaryWin monorepo for environment variable issues across all apps (backend, frontend, admin, mobile).

## Process

1. **Discover .env files** - Find all `.env*` files across `backend/`, `frontend/`, `admin/`, `mobile/`, and root
2. **Extract declared variables** - Parse each `.env`, `.env.example`, `.env.docker.example` for all declared vars
3. **Find code references** - Search `src/`, config files, and Dockerfiles for usage of each variable (check `process.env.`, `import.meta.env.`, `env.config.ts`)
4. **Cross-reference** - Identify:
   - Variables declared in `.env` but never referenced in code
   - Variables referenced in code but missing from `.env.example`
   - Variables in `.env.example` that differ between apps when they should match
   - Backend vars not prefixed with `DW_` (convention violation)
   - Frontend/admin vars not prefixed with `VITE_` (Vite requirement)
5. **Detect services** - Map variables to services (Stripe, PayPal, MongoDB, Sentry, reCAPTCHA, SMTP)
6. **Generate report** - Output a markdown table per app showing variable status

## If `--cleanup` flag is passed ($ARGUMENTS contains "--cleanup")

- Ask user for confirmation before any changes
- Create a git backup branch before modifications
- Remove confirmed unused variables from `.env` files
- Add missing variables to `.env.example` files
- Run builds to verify nothing broke

## Safety Rules

- NEVER delete variables that might be used via dynamic access patterns (e.g., `process.env[key]`)
- NEVER modify `.env` files that contain actual secrets -- only modify `.env.example` files without confirmation
- Always preserve `.env.example` and `.env.docker.example` as documentation
- When in doubt, flag as "needs review" rather than removing
