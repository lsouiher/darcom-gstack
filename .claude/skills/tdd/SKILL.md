---
name: tdd
description: Use test-driven development to implement features or fix bugs in the backend, writing failing tests before production code
user-invocable: true
allowed-tools: Read, Write, Edit, Grep, Glob, Bash, Agent
argument-hint: "<description of feature or bug>"
---

# Test-Driven Development

Implement features or fix bugs using strict RED-GREEN-REFACTOR in the DaryWin backend.

**Iron Rule:** No production code without a failing test first.

## Workflow

### 1. Understand the requirement
- Read `$ARGUMENTS` to understand what needs to be built or fixed
- Explore relevant existing code, models, controllers, routes, and tests

### 2. RED - Write a failing test
- Add test in `backend/__tests__/` following existing patterns (see `testHelper.ts`)
- Test name should describe the desired behavior
- Run: `cd backend && npm run build && npx jest __tests__/<file>.test.ts`
- **Verify the test fails** for the right reason

### 3. GREEN - Write minimal code to pass
- Implement only what is needed to make the test pass
- Follow project patterns: routes config in `src/config/`, handlers in `src/routes/`, logic in `src/controllers/`
- Run the test again and **verify it passes**

### 4. REFACTOR - Clean up
- Remove duplication, improve naming
- Re-run tests to confirm they still pass

### 5. Repeat
- Continue the cycle for the next behavior

## Project-Specific Notes

- Tests run against `dist/` so always build first: `npm run build`
- Tests run serially (`maxWorkers: 1`) and need MongoDB
- Use `testHelper.ts` for test setup utilities
- Backend uses ESM with Babel transpilation
- Path alias `:darywin-types` resolves shared types
- No semicolons, single quotes, 2-space indent
