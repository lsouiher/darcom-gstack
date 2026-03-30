# Spec-Kit × GStack: Unified Development Cycle

**Status:** Integration Strategy v2 (March 2026)
**Scope:** Spec-Kit for definition, GStack for execution — no Paperclip, no OpenClaw
**Audience:** Solo developer / small team workflow architects

---

## Executive Summary

Spec-Kit and GStack form a complete software development system when combined. They cover two complementary, non-overlapping phases:

- **Spec-Kit** = Define (specifications, planning, task breakdown)
- **GStack** = Deliver (reviewing, testing, shipping, reflecting)

This document covers how to leverage both in the same development cycle, the correct extension and preset APIs to bridge them, and concrete artifact flow between the two tools.

**Core insight:** Spec-Kit artifacts become the single source of truth that GStack consumes at every step. GStack execution generates findings that refine Spec-Kit specs. The loop closes when `/retro` measures what the spec predicted vs. what actually shipped.

---

## Part 1: How They Complement Each Other

### What Each Tool Actually Does

**Spec-Kit** is GitHub's open-source toolkit for spec-driven development. It provides a CLI (`specify`) that scaffolds projects with slash commands for Claude Code, Copilot, Gemini CLI, and 20+ other agents. The workflow is: `/speckit.constitution` (set principles) → `/speckit.specify` (describe what to build) → `/speckit.plan` (technical architecture) → `/speckit.tasks` (ordered implementation units) → `/speckit.implement` (execute). It supports extensions (new commands/templates) and presets (template overrides) via a 4-layer resolution system.

**GStack** is Garry Tan's open-source skill pack for Claude Code. It provides 28 slash commands that activate specialist roles: CEO (`/plan-ceo-review`), eng manager (`/plan-eng-review`), designer (`/plan-design-review`), staff engineer (`/review`), QA lead (`/qa`), security officer (`/cso`), and release engineer (`/ship`). Skills chain in sprint order: Think → Plan → Build → Review → Test → Ship → Reflect. It includes a real Chromium browser for QA and design review.

### Where They Live

| Concern | Spec-Kit | GStack |
|---------|----------|--------|
| Installation | `uv tool install specify-cli` (global CLI) | `git clone` into `~/.claude/skills/gstack/` |
| Project files | `.specify/` folder + `.claude/commands/` | `.claude/skills/gstack/` (copied per-repo) |
| Planning artifacts | `.specify/specs/<branch>/spec.md`, `plan.md`, `tasks.md` | `~/.gstack/projects/<name>.md` (design docs) |
| Principles | `.specify/memory/constitution.md` | `CLAUDE.md` gstack section + `ETHOS.md` |
| Templates | `.specify/templates/` (4-layer resolution) | `SKILL.md` per skill folder |
| Extension system | `specify extension add <name>` / `specify preset add <name>` | Copy + `./setup` (no extension system) |

### The Gap They Fill for Each Other

| Phase | Without integration | With integration |
|-------|-------------------|-----------------|
| Define | Spec-Kit produces plan.md but nobody challenges it | GStack `/plan-ceo-review` + `/plan-eng-review` challenge the spec artifacts |
| Plan → Code handoff | Manual. Developer reads spec, starts coding | `/speckit.gstack-handoff` synthesizes a GStack design doc from spec artifacts |
| Code review | GStack `/review` has no spec context | `/review` checks code against acceptance criteria from spec.md |
| QA | GStack `/qa` tests whatever it finds | `/qa` tests the specific user flows defined in spec.md |
| Feedback loop | None. Spec drifts silently | Review and QA findings annotate the spec artifacts |
| Metrics | GStack `/retro` tracks LOC but not spec completion | `/retro` can reference tasks.md completion rate |

---

## Part 2: The Unified Development Cycle

### Phase Flow

```
DEFINE (Spec-Kit)              DELIVER (GStack)              FEEDBACK
┌─────────────────┐           ┌──────────────────┐          ┌──────────┐
│ /speckit.        │           │ /office-hours     │          │ Update   │
│  constitution    │           │ (optional pre-    │          │ spec     │
│ /speckit.specify │           │  design framing)  │          │ artifacts│
│ /speckit.plan    │           └────────┬─────────┘          │ with     │
│ /speckit.tasks   │                    │                     │ findings │
└────────┬────────┘           ┌────────▼─────────┐          └────▲─────┘
         │                    │ /plan-ceo-review  │               │
    spec.md ─────────────────►│ /plan-eng-review  │               │
    plan.md ─────────────────►│ (challenge + lock │               │
    tasks.md                  │  architecture)    │               │
         │                    └────────┬─────────┘               │
         │                             │                          │
         │                    ┌────────▼─────────┐               │
         │                    │ Implement code    │               │
         │                    │ (task by task)    │               │
         │                    └────────┬─────────┘               │
         │                             │                          │
         │                    ┌────────▼─────────┐               │
         │                    │ /review           │───findings───►│
         │                    │ /qa               │───bugs───────►│
         │                    │ /cso              │───vulns──────►│
         │                    └────────┬─────────┘               │
         │                             │                          │
         │                    ┌────────▼─────────┐               │
         │                    │ /ship             │               │
         │                    │ /retro            │───metrics────►│
         │                    └──────────────────┘
```

### Phase 1: Define (Spec-Kit Drives)

**Duration:** 30 min – 2 hours
**Environment:** Claude Code with Spec-Kit commands

```
1. /speckit.constitution
   → Project principles, coding standards, constraints
   → With gstack-ready preset: includes GStack ethos + review gate expectations

2. /speckit.specify "Build a task management app with real-time collaboration"
   → User stories, requirements, acceptance criteria
   → With gstack-ready preset: includes structured test dimensions table

3. /speckit.plan "Use Next.js, Prisma, PostgreSQL, WebSockets for real-time"
   → Architecture, data model, API contracts, tech stack
   → With gstack-ready preset: includes architecture diagram section + test plan

4. /speckit.tasks
   → Ordered, dependency-aware tasks with implementation notes
   → With gstack-ready preset: includes delivery gate checkboxes per task

5. /speckit.analyze (optional)
   → Cross-artifact consistency check before moving to execution
```

**Exit criteria:** spec.md is reviewable, plan.md has architecture + test strategy, tasks.md has ordered units with clear scope.

### Phase 2: Challenge (GStack Reviews Spec-Kit Artifacts)

**Duration:** 30 min – 1 hour
**Environment:** Claude Code with GStack skills

Before writing code, GStack's review skills pressure-test the plan. This is where the two tools connect:

```
1. /speckit.gstack-handoff (bridge command)
   → Reads spec.md + plan.md + tasks.md
   → Writes a GStack design doc to ~/.gstack/projects/<project>.md
   → Now GStack review skills can find and read the plan

2. /plan-ceo-review (optional but recommended for new features)
   → Reads the design doc
   → Challenges: Is this the right thing to build?
   → Four modes: Expansion / Selective Expansion / Hold Scope / Reduction
   → If scope changes → update spec.md and re-run handoff

3. /plan-eng-review (required gate)
   → Reads the design doc
   → Locks architecture, data flow, edge cases, test strategy
   → Forces hidden assumptions into diagrams
   → Writes test plan that /qa picks up later
   → Review Readiness Dashboard shows pass/fail

4. /plan-design-review (if UI changes)
   → 80-item design audit with letter grades
   → AI slop detection
   → Report only — doesn't touch code
```

**Exit criteria:** Eng Review shows CLEARED on the Readiness Dashboard.

### Phase 3: Build (Both Tools Active)

**Duration:** 2–4 hours per task
**Environment:** Claude Code with both Spec-Kit context and GStack skills

```
For each task in tasks.md:

1. git checkout -b feature/<NNN>-<description>

2. Implement the task
   → Use /speckit.implement (auto-reads task context)
   → Or code directly with Claude Code (spec.md + plan.md as reference)
   → Constitution keeps output consistent

3. /review
   → Staff engineer persona inspects the diff
   → Auto-fixes obvious issues (formatting, imports, naming)
   → Flags deeper concerns (race conditions, N+1 queries, missing error handling)
   → Smart routing: design review for UI, eng review for backend

4. /qa
   → Reads git diff to identify affected pages/routes
   → Opens real Chromium browser
   → Tests user flows (informed by spec.md acceptance criteria)
   → Finds bugs → fixes with atomic commits → re-verifies
   → Generates regression tests

5. /cso (if task touches auth, payments, or user data)
   → OWASP Top 10 + STRIDE threat modeling
   → Run before shipping anything security-sensitive

6. /ship
   → Syncs branch with main
   → Bootstraps test framework if none exists
   → Runs all tests, audits coverage
   → Auto-invokes /document-release (updates README, ARCHITECTURE, etc.)
   → Opens PR

7. Update tasks.md
   → Mark delivery gates as complete for the shipped task
```

### Phase 4: Reflect (GStack Drives)

**Duration:** 15 min weekly

```
/retro
  → Per-task velocity: lines added, commits, net LOC
  → Shipping streaks, test health trends
  → Growth opportunities: what slowed us down?
  → Compare velocity against tasks.md estimates
```

---

## Part 3: The Spec-Kit Extension (`gstack-bridge`)

This extension adds new slash commands that bridge Spec-Kit's outputs into GStack's inputs.

### Correct Extension Structure

Per spec-kit's actual extension system (installed via `specify extension add`):

```
gstack-bridge/
├── extension.yml           # Manifest (spec-kit reads this)
├── config-template.yml     # User-configurable options
├── commands/
│   ├── gstack-handoff.md   # /speckit.gstack-handoff
│   ├── gstack-review.md    # /speckit.gstack-review (review with spec context)
│   ├── gstack-qa.md        # /speckit.gstack-qa (QA with acceptance criteria)
│   ├── gstack-ship.md      # /speckit.gstack-ship (ship + update task status)
│   └── gstack-sprint.md    # /speckit.gstack-sprint (full cycle per task)
├── templates/
│   └── design-doc-template.md
├── README.md
├── LICENSE
└── CHANGELOG.md
```

### extension.yml

```yaml
id: gstack-bridge
name: GStack Bridge
version: 1.0.0
description: >
  Bridges Spec-Kit artifacts into GStack's delivery pipeline.
  Converts specs into GStack design docs, runs reviews with spec
  context, and updates task status on ship.
author: your-github-handle
speckit_version: ">=0.4.0"
categories:
  - workflow
  - integration
commands:
  - id: gstack-handoff
    file: commands/gstack-handoff.md
    description: Synthesize spec artifacts into a GStack design doc
  - id: gstack-review
    file: commands/gstack-review.md
    description: Run GStack /review with spec.md acceptance criteria as context
  - id: gstack-qa
    file: commands/gstack-qa.md
    description: Run GStack /qa with spec.md test flows
  - id: gstack-ship
    file: commands/gstack-ship.md
    description: Run GStack /ship and mark tasks.md gates as complete
  - id: gstack-sprint
    file: commands/gstack-sprint.md
    description: Full per-task cycle (implement → review → QA → ship)
templates:
  - id: design-doc-template
    file: templates/design-doc-template.md
    description: GStack-compatible design doc synthesized from spec artifacts
```

### Command Details

#### `/speckit.gstack-handoff` — The Critical Bridge

**What it does:** Reads `.specify/specs/<branch>/spec.md`, `plan.md`, and `tasks.md` and synthesizes them into a GStack design doc at `~/.gstack/projects/<project-name>.md`.

**Why it matters:** GStack's `/plan-ceo-review` and `/plan-eng-review` look for design docs in `~/.gstack/projects/`. Without this command, you'd manually restate your spec in GStack's format. The handoff automates this.

**Prompt template (commands/gstack-handoff.md):**

```markdown
---
description: "Synthesize Spec-Kit artifacts into a GStack design doc"
---

Read the following Spec-Kit artifacts for the current branch:
1. .specify/specs/<current-branch>/spec.md (or latest spec directory)
2. .specify/specs/<current-branch>/plan.md
3. .specify/specs/<current-branch>/tasks.md
4. .specify/memory/constitution.md

Synthesize them into a single GStack design doc with this structure:

# <Project Name> — Design Doc

## Problem Statement
(From spec.md: the user problem, user stories, and why this matters)

## Recommended Approach
(From plan.md: architecture, tech stack decisions, data model)

## Architecture
(From plan.md: system diagram, data flow, component boundaries)

## Edge Cases & Failure Modes
(From plan.md: error paths, fallbacks, boundary conditions)

## Test Plan
(From plan.md + spec.md: what to test, acceptance criteria mapped to test types)

## Tasks
(From tasks.md: ordered implementation units with dependencies)

## Source Artifacts
- Spec: .specify/specs/<branch>/spec.md
- Plan: .specify/specs/<branch>/plan.md
- Tasks: .specify/specs/<branch>/tasks.md
- Constitution: .specify/memory/constitution.md

Write the design doc to ~/.gstack/projects/<project-name>.md.
Confirm the file was written and summarize the key decisions.
```

#### `/speckit.gstack-review` — Spec-Aware Code Review

Reads spec.md acceptance criteria, identifies which task the current branch implements, then invokes GStack's `/review` skill with that context injected. The reviewer knows not just "is this code correct" but "does this code fulfill what the spec says."

#### `/speckit.gstack-qa` — Spec-Driven QA

Extracts the test flows and acceptance criteria from spec.md, maps them to the browser actions that `/qa` should execute. Instead of `/qa` discovering what to test from the diff alone, it has the spec's explicit user journeys.

#### `/speckit.gstack-ship` — Ship + Close the Loop

Runs GStack's `/ship`, then on success:
- Updates tasks.md delivery gate checkboxes for the completed task
- Commits the task status update
- If all tasks are complete, notes the feature as shipped

#### `/speckit.gstack-sprint` — Full Per-Task Cycle

One command that chains: identify task → implement → review → QA → ship → update status.

```
/speckit.gstack-sprint "Implement task 3: WebSocket real-time sync"
```

---

## Part 4: The Spec-Kit Preset (`gstack-ready`)

This preset modifies Spec-Kit's core templates so their outputs are natively GStack-compatible. Installed via `specify preset add gstack-ready`.

### Correct Preset Structure

Per spec-kit's actual preset system (4-layer template resolution):

```
gstack-ready/
├── preset.yml              # Manifest
├── templates/
│   ├── spec-template.md    # Override: adds acceptance criteria table + test dimensions
│   ├── plan-template.md    # Override: adds architecture diagram + test plan + review gates
│   ├── tasks-template.md   # Override: adds delivery gate checkboxes per task
│   └── constitution-template.md  # Override: appends GStack ethos + review matrix
├── commands/
│   └── speckit.plan.md     # Override: /plan also writes design doc skeleton
└── README.md
```

### preset.yml

```yaml
id: gstack-ready
name: GStack-Ready Templates
version: 1.0.0
description: >
  Restructures Spec Kit templates so outputs are directly consumable
  by GStack skills. Specs include structured acceptance criteria,
  plans include architecture diagrams and test plans, tasks include
  delivery gate checkboxes.
author: your-github-handle
speckit_version: ">=0.4.0"
categories:
  - workflow
  - integration
templates:
  - id: spec-template
    file: templates/spec-template.md
  - id: plan-template
    file: templates/plan-template.md
  - id: tasks-template
    file: templates/tasks-template.md
  - id: constitution-template
    file: templates/constitution-template.md
commands:
  - id: speckit.plan
    file: commands/speckit.plan.md
    type: command
```

### Template Overrides

#### constitution-template.md — Adds GStack Integration Matrix

Appends to standard constitution:

```markdown
## GStack Integration Matrix

Reference this during execution to ensure the right specialist roles are engaged.

| Role | Skill | When | Gate Criteria |
|------|-------|------|---------------|
| CEO / Founder | /plan-ceo-review | Before design lock | Scope decision made |
| Eng Manager | /plan-eng-review | Before coding starts | Test matrix defined, architecture locked |
| Senior Designer | /plan-design-review | UI changes only | Design approval, no AI slop |
| Staff Engineer | /review | Before /ship | No critical findings |
| QA Lead | /qa | After implementation | All spec flows passing in real browser |
| Security Officer | /cso | Auth/data/payments changes | OWASP + STRIDE pass |
| Release Engineer | /ship | Final gate | Tests pass, coverage meets target, docs updated |

## Test Coverage Gates
- Minimum: 80% on main paths
- Target: 100% on auth + payments
- /ship audits this automatically

## Documentation Standards
- README, ARCHITECTURE: auto-updated by /document-release on every /ship
- Code comments: only non-obvious logic
```

#### spec-template.md — Adds Test Dimensions + Acceptance Criteria Table

Appends to standard spec:

```markdown
## Acceptance Criteria

Each criterion maps to a testable action for GStack /qa:

| ID | Criterion | Verification | Priority |
|----|-----------|-------------|----------|
| AC-01 | [User can do X] | [browser/unit/integration] | [P0/P1/P2] |
| AC-02 | [Error case Y shows message Z] | [browser] | [P0/P1/P2] |

## Test Dimensions

For /qa to know which flows matter:

| Flow | Type | Browsers | Data Setup |
|------|------|----------|------------|
| Happy path: [describe] | Functional | Chrome | None |
| Edge case: [describe] | Boundary | Chrome + Safari | Fixture |
| Auth boundary: [describe] | Security | Chrome | Custom roles |

## Design Considerations

For /plan-design-review (if UI changes):

- Target aesthetic: [describe the feel]
- Key screens/views: [list primary UI surfaces]
- Design system reference: [DESIGN.md if exists]
```

#### plan-template.md — Adds Architecture Diagram + Test Plan + Review Gates

Appends to standard plan:

```markdown
## Architecture Diagram

(Mermaid, ASCII, or description — /plan-eng-review validates system boundaries against this)

## Data Flow

(Sequence diagram or description of request lifecycle)

## Edge Cases & Failure Modes

| Scenario | Expected Behavior | Fallback |
|----------|------------------|----------|
| [What can go wrong] | [Desired handling] | [Degraded behavior] |

## Test Plan

This section feeds directly into GStack /qa:

### Unit Tests
- [What modules/functions to test]

### Integration Tests
- [API contracts, data flow validation]

### Browser Tests (for /qa)
- [User flows to verify with real Chromium]

### Security Considerations (for /cso)
- [Items to audit: auth, injection, XSS, CSRF]

## Review Gate Readiness

Run this checklist before starting /plan-eng-review:

- [ ] Architecture diagram present (boxes + arrows)
- [ ] Error path defined for each external API call
- [ ] Test strategy covers unit + integration + E2E
- [ ] Security touch points identified (if applicable)
- [ ] Documentation plan: which docs need updating?
```

#### tasks-template.md — Adds Delivery Gate Checkboxes

Wraps each task with GStack gates:

```markdown
### Task NNN: [Title]

**Dependencies:** [list]
**Estimated complexity:** [S/M/L]
**GStack skills needed:** [/review, /qa, /cso, etc.]

#### Implementation Notes
[What to build, constraints, references to plan.md]

#### Success Criteria
- [ ] [Specific, testable criterion from spec.md]
- [ ] [Another criterion]

#### Delivery Gates
- [ ] Code complete
- [ ] /review passed (no critical findings)
- [ ] /qa passed (browser tests green)
- [ ] /cso passed (if auth/data involved)
- [ ] /ship executed (tests pass, coverage OK, PR opened)
```

---

## Part 5: Shared Artifact Conventions

### Where Artifacts Live

| Artifact | Location | Written By | Read By |
|----------|----------|------------|---------|
| Spec | `.specify/specs/<branch>/spec.md` | Spec-Kit `/speckit.specify` | GStack (via handoff) |
| Plan | `.specify/specs/<branch>/plan.md` | Spec-Kit `/speckit.plan` | GStack (via handoff) |
| Tasks | `.specify/specs/<branch>/tasks.md` | Spec-Kit `/speckit.tasks` | GStack (via handoff), developer |
| Constitution | `.specify/memory/constitution.md` | Spec-Kit `/speckit.constitution` | Both tools |
| Design Doc | `~/.gstack/projects/<project>.md` | Bridge `/speckit.gstack-handoff` | GStack `/plan-*-review` natively |
| Design System | `DESIGN.md` (repo root) | GStack `/design-consultation` | GStack `/plan-design-review`, `/qa` |
| Test Plan | Inside design doc (test section) | Bridge or `/plan-eng-review` | GStack `/qa` |
| CLAUDE.md | Repo root | Both (append-only sections) | Claude Code sessions |

**Important:** GStack skills operate within Claude Code sessions. They don't write standalone `REVIEW_FINDINGS.md` or `QA_REPORT.md` files to disk by default — their outputs appear in the conversation and in commits. The design doc at `~/.gstack/projects/` and the Review Readiness Dashboard are the persistent artifacts. If you want file-based reports, configure `/review` and `/qa` to write their findings (this is a customization, not default behavior).

### CLAUDE.md Integration

When both tools are installed, your project's CLAUDE.md should include:

```markdown
## spec-kit + gstack

This project uses Spec-Kit for planning and GStack for delivery.

### Workflow
1. Define: /speckit.constitution → /speckit.specify → /speckit.plan → /speckit.tasks
2. Bridge: /speckit.gstack-handoff
3. Review: /plan-ceo-review → /plan-eng-review
4. Build: /speckit.implement (or direct coding with spec context)
5. Deliver: /review → /qa → /cso (if applicable) → /ship
6. Reflect: /retro

### Spec artifacts
- Specs: .specify/specs/<branch>/
- Constitution: .specify/memory/constitution.md

### GStack skills
Use /browse from gstack for all web browsing. Never use mcp__claude-in-chrome__* tools.
Available: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review,
/design-consultation, /review, /ship, /land-and-deploy, /canary, /benchmark,
/browse, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy,
/retro, /investigate, /document-release, /codex, /cso, /autoplan,
/careful, /freeze, /guard, /unfreeze, /gstack-upgrade

### Bridge commands
/speckit.gstack-handoff, /speckit.gstack-review, /speckit.gstack-qa,
/speckit.gstack-ship, /speckit.gstack-sprint
```

---

## Part 6: Project File Structure

```
project-root/
├── .specify/
│   ├── memory/
│   │   └── constitution.md              # Project principles (GStack ethos appended)
│   ├── specs/
│   │   └── feature/NNN-feature-name/
│   │       ├── spec.md                  # User stories, acceptance criteria, test dims
│   │       ├── plan.md                  # Architecture, test plan, review gates
│   │       └── tasks.md                 # Ordered tasks with delivery gates
│   ├── templates/                       # Core templates (layer 4)
│   ├── presets/
│   │   └── gstack-ready/               # GStack-Ready preset (layer 2)
│   │       ├── preset.yml
│   │       └── templates/
│   ├── extensions/
│   │   └── gstack-bridge/              # Bridge extension
│   │       ├── extension.yml
│   │       └── commands/
│   └── scripts/                         # Spec-Kit helper scripts
│
├── .claude/
│   ├── skills/
│   │   └── gstack/                      # GStack skills (28 skills)
│   │       ├── office-hours/SKILL.md
│   │       ├── plan-ceo-review/SKILL.md
│   │       ├── plan-eng-review/SKILL.md
│   │       ├── review/SKILL.md
│   │       ├── qa/SKILL.md
│   │       ├── ship/SKILL.md
│   │       ├── cso/SKILL.md
│   │       ├── retro/SKILL.md
│   │       └── ...
│   └── commands/                         # Slash commands (from spec-kit + bridge)
│       ├── speckit.constitution.md
│       ├── speckit.specify.md
│       ├── speckit.plan.md
│       ├── speckit.tasks.md
│       ├── speckit.implement.md
│       ├── speckit.analyze.md
│       ├── speckit.gstack-handoff.md     # Bridge commands
│       ├── speckit.gstack-review.md
│       ├── speckit.gstack-qa.md
│       ├── speckit.gstack-ship.md
│       └── speckit.gstack-sprint.md
│
├── CLAUDE.md                             # GStack section + spec-kit workflow
├── DESIGN.md                             # From /design-consultation (if UI project)
├── README.md                             # Auto-updated by /document-release
├── src/                                  # Implementation code
└── tests/                                # Tests (from /qa + manual)
```

---

## Part 7: Practical Setup

### New Project (Correct Commands)

```bash
# 1. Install tools (one-time)
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v0.4.2
git clone https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup

# 2. Initialize project
specify init my-project --ai claude
cd my-project

# 3. Install GStack-Ready preset
specify preset add gstack-ready
# (or for local development: specify preset add --dev /path/to/gstack-ready/)

# 4. Install Bridge extension
specify extension add gstack-bridge
# (or: specify extension add --from https://github.com/you/gstack-bridge/archive/v1.0.0.zip)

# 5. Copy GStack skills into project
cp -Rf ~/.claude/skills/gstack .claude/skills/gstack
rm -rf .claude/skills/gstack/.git
cd .claude/skills/gstack && ./setup

# 6. Add GStack section to CLAUDE.md (see Part 5 above)

# 7. Start the define phase in Claude Code
/speckit.constitution
/speckit.specify "Build a task management app with real-time collaboration"
/speckit.plan "Use Next.js, Prisma, PostgreSQL, WebSockets"
/speckit.tasks
/speckit.analyze

# 8. Bridge to GStack
/speckit.gstack-handoff

# 9. GStack reviews
/plan-eng-review

# 10. Build and ship per task
/speckit.gstack-sprint "Implement task 1: database schema and migrations"
```

### Existing Spec-Kit Project (Add GStack)

```bash
# Add GStack skills
cp -Rf ~/.claude/skills/gstack .claude/skills/gstack
rm -rf .claude/skills/gstack/.git && cd .claude/skills/gstack && ./setup

# Install the preset and extension
specify preset add gstack-ready
specify extension add gstack-bridge

# Update CLAUDE.md with gstack section

# Bridge existing specs
/speckit.gstack-handoff

# From here, use /review, /qa, /ship on your next task
```

### Existing GStack Project (Add Spec-Kit)

```bash
# Initialize spec-kit in current directory
specify init . --ai claude --here --force

# Install the preset
specify preset add gstack-ready

# Retrofit specs for your current feature
/speckit.specify   # Describe what you're building (even if code exists)
/speckit.plan      # Capture architecture decisions post-hoc
/speckit.tasks     # Break down remaining work

# Going forward: spec first, then GStack delivery
```

---

## Part 8: Advanced Patterns

### Pattern 1: Parallel Sprints with Spec Isolation

When running 10+ parallel Claude Code sessions via GStack's Conductor:

Each session gets its own spec branch: `feature/001-auth`, `feature/002-dashboard`, etc. Spec-Kit's branch-based spec isolation (`.specify/specs/<branch>/`) naturally keeps them separate. Each session reads the shared constitution but writes isolated spec artifacts. GStack writes session-specific design docs to `~/.gstack/projects/`.

### Pattern 2: Spec-Driven Refactoring

```
/speckit.specify   → Describe current behavior (status quo spec)
/speckit.plan      → Propose refactored architecture, highlight breaking changes
/speckit.tasks     → Incremental migration tasks, parallel-safe decomposition
/plan-eng-review   → Lock migration strategy + compatibility gates
Per-task: implement → /review → /qa → /ship (one task = one safe migration step)
```

### Pattern 3: Spec as Team Contract

Backend team reads spec.md (API contracts) and plan.md (data model). Frontend team reads spec.md (UI requirements) and DESIGN.md (design system). Both share the same spec branch. Each team has their own tasks in tasks.md. GStack's `/review` catches when implementations diverge from the shared spec.

### Pattern 4: `/office-hours` Before `/speckit.specify`

For genuinely new products where you haven't crystallized the idea yet, run GStack's `/office-hours` *before* Spec-Kit. The six forcing questions help you find the real product. Then feed those insights into `/speckit.specify`. The design doc from `/office-hours` becomes your starting context.

---

## Part 9: Troubleshooting

### Spec Drift

**Problem:** Code evolves but spec.md stays frozen from week 1.
**Solution:** After each `/ship`, spend 2 minutes updating the relevant spec section. The `/speckit.gstack-ship` bridge command can prompt you to review spec accuracy as part of the ship flow. Also run `/speckit.analyze` periodically to check cross-artifact consistency.

### Review Churn

**Problem:** `/review` keeps finding issues, cycling: implement → review → fix → review → fix.
**Fix:** Front-load with `/plan-eng-review`. Lock architecture before coding. Most review churn comes from undecided design — not from bugs. The good flow is: eng review (lock design) → implement (within guardrails) → review (minor cleanup only) → ship.

### GStack Can't Find the Design Doc

**Problem:** `/plan-ceo-review` or `/plan-eng-review` says no design doc found.
**Fix:** Run `/speckit.gstack-handoff` first. It writes to `~/.gstack/projects/<name>.md`. Confirm the file exists. If your project name has special characters, check the filename.

### Preset Not Applying

**Problem:** Templates don't include GStack sections after installing preset.
**Fix:** Check resolution order: `specify preset resolve spec-template`. It should show the preset layer, not core. If the preset was installed after `specify init`, re-run template generation for existing specs. New specs will use the preset automatically.

---

## Part 10: Metrics

### What to Measure

| Metric | How to Measure | Baseline → Target |
|--------|---------------|-------------------|
| Spec-to-code latency | Time from spec locked to task 1 shipped | Days → Hours |
| Review cycles per task | Commits in branch between first /review and /ship | 3-5 → 1-2 |
| Test coverage | `/ship` coverage audit | 60% → 85%+ |
| Spec flow coverage | Acceptance criteria from spec.md that /qa verifies | Ad-hoc → 100% |
| Documentation freshness | Does /ship + /document-release keep docs current? | Stale → Auto-updated |
| Bugs found post-ship | Production incidents per sprint | 5+ → 0-1 |
| Velocity | `/retro` LOC/week, commits/week | Variable → Consistent trend |

### The Real Metric

The number that matters most isn't LOC or coverage. It's **confidence at ship time.** With this unified cycle, by the time you run `/ship`, the code has been: specified against user stories, planned with architecture diagrams, challenged by CEO and eng review, implemented against a locked plan, reviewed by a staff engineer persona, tested in a real browser against spec acceptance criteria, and audited for security if applicable. That's the value of combining these two tools.

---

## Part 11: Implementation Priority

### Build First (Highest Value, Lowest Effort)

1. **`gstack-ready` preset** — Pure template changes, no code, immediately usable. Just markdown template overrides that restructure spec-kit outputs to include GStack-parseable sections.

2. **`/speckit.gstack-handoff` command** — The single most important bridge. One prompt file that reads spec artifacts and writes a design doc. Everything downstream depends on this.

3. **CLAUDE.md snippet** — Copy-paste into any project. Takes 30 seconds.

### Build Second (High Value, Moderate Effort)

4. **`/speckit.gstack-review`** — Review with spec context. The command prompt reads spec.md and injects acceptance criteria into the review.

5. **`/speckit.gstack-qa`** — QA with spec flows. Extracts test dimensions from spec.md and feeds them into `/qa`.

6. **`/speckit.gstack-ship`** — Close the loop by updating tasks.md delivery gates on successful ship.

### Build Third (Nice to Have)

7. **`/speckit.gstack-sprint`** — The fully automated per-task cycle. Chains all the above.

8. **Publish to spec-kit community catalog** — Submit PR adding gstack-bridge to `extensions/catalog.community.json` and gstack-ready to `presets/catalog.community.json`.

---

**Version:** 2.0
**Last Updated:** March 2026
**Status:** Ready for implementation
