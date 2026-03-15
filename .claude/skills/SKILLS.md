# Claude Code Skills

Skills are reusable slash commands that give Claude Code specialized workflows for common tasks in this monorepo. Invoke them by typing `/<skill-name>` in the Claude Code CLI.

## Available Skills

### /audit-env

Scans all `.env`, `.env.example`, and `.env.docker.example` files across the monorepo to find environment variable issues.

**Detects:**
- Variables declared but never referenced in code
- Variables referenced in code but missing from `.env.example`
- Backend vars not prefixed with `DW_`, frontend/admin vars not prefixed with `VITE_`
- Inconsistencies between apps

**Usage:**
```
/audit-env              # Scan and report only
/audit-env --cleanup    # Scan, then offer to fix issues (creates backup branch first)
```

---

### /debug

Systematic debugging that enforces root-cause analysis before attempting fixes. Follows a strict investigate → analyze → hypothesize → fix cycle.

**Usage:**
```
/debug booking creation fails with 500 error when property has no availability
/debug frontend shows stale user data after profile update
/debug backend tests timeout on CI but pass locally
```

---

### /dev-logs

Starts dev servers and tails logs for monitoring and debugging.

**Usage:**
```
/dev-logs backend       # Start and monitor backend only
/dev-logs frontend      # Start and monitor frontend only
/dev-logs admin         # Start and monitor admin only
/dev-logs all           # Start all services via Docker and tail combined logs
```

---

### /remove-dead-code

Finds unused exports, imports, components, CSS classes, lang keys, service methods, and routes. Removes them after confirmation.

**Usage:**
```
/remove-dead-code              # Scan all apps
/remove-dead-code backend      # Scan backend only
/remove-dead-code frontend     # Scan frontend only
```

Creates a backup branch before any removals and validates builds afterward.

---

### /tdd

Test-driven development workflow for the backend. Enforces the RED → GREEN → REFACTOR cycle: write a failing test first, then implement the minimal code to pass it.

**Usage:**
```
/tdd add endpoint to archive expired bookings
/tdd fix duplicate notification bug when booking is cancelled
```

**Note:** Only applies to the backend (the only app with tests). Always builds before running tests since Jest runs against `dist/`.

---

### /verify

Runs fresh builds, tests, linting, and type-checking across affected apps before claiming work is complete.

**Usage:**
```
/verify backend         # Build + test backend
/verify frontend        # Build + stylelint frontend
/verify admin           # Build + stylelint admin
/verify all             # Run all checks
```

If shared packages were modified, also runs `npm run pre-commit` at the root.

## Adding New Skills

Skills live in `.claude/skills/<skill-name>/SKILL.md`. Each file has YAML frontmatter defining the name, description, and allowed tools, followed by markdown instructions that guide Claude Code's behavior when the skill is invoke