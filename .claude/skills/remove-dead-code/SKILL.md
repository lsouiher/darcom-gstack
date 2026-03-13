---
name: remove-dead-code
description: Find and safely remove unused code (exports, functions, components, imports, CSS classes) across the monorepo
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Agent, Edit
argument-hint: "[app-name] e.g. backend, frontend, admin, mobile"
---

# Remove Dead Code

Safety-first dead code detection and removal for the DaryWin monorepo.

## Scope

Target a specific app if provided via `$ARGUMENTS`, otherwise scan all apps.

## Phase 1: Scan (read-only)

Detect candidates in this order:
1. **Unused exports** - Functions, constants, types exported but never imported elsewhere
2. **Unused imports** - Imported symbols never referenced in the file
3. **Unused components** - React components in `components/` never rendered
4. **Unused CSS classes** - Classes in `assets/css/` never referenced in TSX
5. **Unused lang keys** - i18n keys in `lang/` files never used in components
6. **Unused service methods** - Methods in `services/` never called
7. **Unused routes** - Backend routes defined but unreachable

Present findings as a categorized list with file paths and line numbers.

## Phase 2: Remove (with confirmation)

- Create a timestamped backup branch: `backup/dead-code-YYYY-MM-DD`
- Ask user to confirm each category before removal
- Remove confirmed dead code
- Remove any imports that become unused after removal

## Phase 3: Validate

- Run `npm run build` in affected apps
- Run `npm run test` in backend if backend was modified
- Run TypeScript type-check
- If any check fails, report what broke and offer to revert

## Safety Rules

- NEVER remove code that is dynamically referenced (string-based imports, reflection)
- NEVER remove public API surface from `packages/darywin-types`
- NEVER remove re-exports from package index files
- Preserve all test files and test helpers
- When in doubt, keep the code -- false negatives are acceptable, false positives are not
