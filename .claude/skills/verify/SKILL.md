---
name: verify
description: Run verification checks before claiming work is complete -- builds, tests, linting, and type-checking across affected apps
user-invocable: true
allowed-tools: Bash, Read, Grep, Glob
argument-hint: "[app-name] e.g. backend, frontend, admin, all"
---

# Verify Before Completion

**Iron Rule:** No completion claims without fresh verification evidence.

## Process

Determine which apps were affected (from `$ARGUMENTS` or by checking `git diff --name-only`), then run ALL applicable checks:

### Backend
```bash
cd backend && npm run build
cd backend && npm run test
```

### Frontend
```bash
cd frontend && npm run build
cd frontend && npm run stylelint
```

### Admin
```bash
cd admin && npm run build
cd admin && npm run stylelint
```

### Monorepo (if shared packages changed)
```bash
npm run pre-commit
```

## Rules

- Run EVERY check fresh -- do not rely on cached results
- Read the FULL output of each command
- Report exact pass/fail counts for tests
- If anything fails, report what failed and fix it before claiming completion
- Do not use words like "should pass" or "probably works" -- only report observed results
