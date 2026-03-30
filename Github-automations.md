# Automating 12 GitHub repos from zero to full CI/CD in four phases

**You can go from zero automation to a fully automated multi-stack engineering workflow in roughly 4 weeks, spending under $100/month total.** The 2025-2026 tooling ecosystem has matured to the point where a solo engineer with Claude Code can set up CI/CD, quality gates, AI-assisted review, and autonomous monitoring across Node/TS, Python, .NET, and Next.js projects using mostly free-tier services. This guide provides the exact tools, configurations, and implementation order — organized as four sequential phases that each build on the last.

The strategy: start with GitHub Actions as the universal automation backbone (Phase 1), layer on automated quality enforcement (Phase 2), supercharge your Claude Code workflow with proper project configuration (Phase 3), then tie everything together with OpenClaw for autonomous monitoring and notifications (Phase 4).

---

## Phase 1: CI/CD foundation with GitHub Actions

### Reusable workflow architecture saves you from maintaining 12 copies

The single most impactful decision for a 12-repo setup is **centralizing your CI workflows in a shared repository**. GitHub supports two abstraction mechanisms: **reusable workflows** (invoked via `workflow_call`, occupy a full job) and **composite actions** (bundled steps within a job). Use reusable workflows for job orchestration and composite actions for shared step sequences — don't mix responsibilities.

Create a `shared-workflows` repository containing one reusable CI workflow per stack. Each of your 12 repos then calls these with a lightweight 10-line caller file. Pin workflow references to semantic version tags (e.g., `@v1.0.0`), not `@main`, in production.

**Node.js/TypeScript reusable workflow:**
```yaml
# shared-workflows/.github/workflows/node-ci.yml
name: Node.js CI
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: '20'
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
      fail-fast: false
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - run: npm test
```

**Python reusable workflow:**
```yaml
name: Python CI
on:
  workflow_call:
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.11', '3.12', '3.13']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: ${{ matrix.python-version }}
          cache: 'pip'
      - run: pip install -r requirements.txt
      - run: ruff check .
      - run: mypy .
      - run: python -m pytest
```

**.NET reusable workflow:**
```yaml
name: .NET CI
on:
  workflow_call:
    inputs:
      dotnet-version:
        type: string
        default: '8.0.x'
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    env:
      DOTNET_CLI_TELEMETRY_OPTOUT: 1
      DOTNET_NOLOGO: true
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ inputs.dotnet-version }}
          cache: true
      - run: dotnet restore
      - run: dotnet build --no-restore --configuration Release
      - run: dotnet test --no-build --configuration Release
```

Each repo's caller workflow is minimal:
```yaml
# In each repo: .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
jobs:
  ci:
    uses: my-org/shared-workflows/.github/workflows/node-ci.yml@v1.0.0
    secrets: inherit
```

**Current recommended action versions** (as of early 2026): `actions/checkout@v4` (v5 emerging), `actions/setup-node@v4`, `actions/setup-python@v5`, `actions/setup-dotnet@v4`, `actions/cache@v4` (v2/v3 deprecated and will fail). Always use built-in caching (`cache: 'npm'`, `cache: 'pip'`, `cache: true` for dotnet) before reaching for manual `actions/cache` — it yields **40–80% build time reduction** with zero configuration overhead. GitHub's cache limit is 10 GB per repository, with unused caches auto-evicted after 7 days.

### Which deployment platform for which project type

The deployment landscape has consolidated around five platforms, each with a clear sweet spot. Here's the decision matrix based on current pricing:

| Platform | Free Tier | Paid Starting | Best For | GitHub DX |
|----------|-----------|---------------|----------|-----------|
| **Vercel** | Yes — 100GB bandwidth, serverless included | $20/user/mo (Pro) | Next.js, React frontends | Best-in-class PR previews |
| **Cloudflare Pages** | Yes — 500 builds/mo, unlimited bandwidth | $5/mo (Workers Paid) | Static sites, edge functions | Good auto-deploy |
| **Render** | Yes — free web services (sleep after 15 min) | $7/mo per service | Node/Python APIs, Heroku replacement | Native git deploys |
| **Railway** | No free tier — $5 trial credit only | $5/mo Hobby (usage-based) | Multi-stack APIs, rapid prototyping | Excellent, visual canvas |
| **Fly.io** | No free tier | ~$3.19/mo minimum VM | Globally distributed, latency-sensitive | CLI-only, manual setup |

**The recommended split for your 12 repos:**

- **Next.js/React frontends → Vercel** (free Hobby tier gives you automatic preview deployments per PR, instant rollbacks, and first-class Next.js optimization)
- **Static sites and documentation → Cloudflare Pages** (the most generous free tier with unlimited bandwidth across 334 global edge locations)
- **Node.js and Python API services → Render** (predictable $7/mo per always-on service, free tier for development, `render.yaml` infrastructure-as-code)
- **.NET API services → Railway** (best auto-detection of .NET projects via Nixpacks, usage-based pricing means you only pay for actual compute)

Fly.io is powerful but requires more DevOps knowledge and has no built-in CI/CD — skip it unless you need multi-region edge deployment.

### Dockerfile best practices for multi-stack projects

**Always use multi-stage builds.** The pattern is identical across stacks: fat build stage with full SDK, slim production stage with runtime only. This typically reduces image sizes by 60–80%.

**Node.js (130MB vs 500MB+ single-stage):**
```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S appuser -u 1001
COPY --from=build --chown=appuser:nodejs /app/dist ./dist
COPY --from=build --chown=appuser:nodejs /app/node_modules ./node_modules
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Python:**
```dockerfile
FROM python:3.12-slim AS build
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim AS production
WORKDIR /app
RUN adduser --disabled-password --gecos '' appuser
COPY --from=build /install /usr/local
COPY . .
USER appuser
EXPOSE 8000
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:8000"]
```

**.NET (~200MB vs 880MB with full SDK):**
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY *.csproj ./
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS production
WORKDIR /app
RUN adduser --disabled-password --gecos '' appuser
COPY --from=build /app/publish .
USER appuser
EXPOSE 8080
ENTRYPOINT ["dotnet", "MyApi.dll"]
```

For Docker layer caching in GitHub Actions, use the GHA cache backend with BuildKit:
```yaml
- uses: docker/setup-buildx-action@v4
- uses: docker/build-push-action@v7
  with:
    context: .
    push: true
    tags: user/app:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

The `mode=max` setting caches all intermediate layers, not just the final image. Note the **10 GB per-repo cache limit** — use `scope` parameters to separate caches when building multiple images.

### Template repositories for consistent project scaffolding

Create four GitHub template repos — one per stack — containing your standard CI/CD configs, linting setup, Dockerfile, and boilerplate. Enable via **Settings → General → Template repository**. Each new project starts with "Use this template" and inherits everything.

A template repo should include:
```
template-node-ts/
├── .github/
│   ├── workflows/ci.yml          # Calls shared reusable workflow
│   ├── dependabot.yml            # Automated dependency updates
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
├── src/
├── tests/
├── Dockerfile
├── .dockerignore
├── .gitignore
├── biome.json (or eslint.config.mjs + .prettierrc)
├── tsconfig.json
├── package.json
├── CLAUDE.md
└── README.md
```

For organization-wide defaults, create an `org/.github` repository with community health files (CODE_OF_CONDUCT.md, CONTRIBUTING.md, SECURITY.md) that automatically apply to every repo in your org.

---

## Phase 2: Automated quality gates that block bad code

### The AI code review landscape has two clear winners

After evaluating every major tool, the optimal setup for a solo engineer with 12 repos combines **one AI-powered reviewer** with **one rule-based quality gate system**. Here's the full comparison:

| Tool | Price | Type | Best Strength |
|------|-------|------|---------------|
| **CodeRabbit** | Free (OSS) / $24/dev/mo Pro | AI-native | Purpose-built PR reviews, line-by-line fixes |
| **GitHub Copilot Review** | Included with Copilot ($10–19/mo) | AI-native | Deepest GitHub integration, 60M+ reviews |
| **Sourcery** | Free (OSS) / $12/dev/mo | Hybrid | Python-focused refactoring suggestions |
| **SonarCloud** | Free ≤50K LoC / €30/mo Team | Rule-based | Measurable quality gates, coverage tracking |
| **Codacy** | Free (OSS) / ~$15/user/mo | Rule-based | 30+ languages, code smell detection |

**Recommended combination: GitHub Copilot Code Review + CodeRabbit.** If you already pay for Copilot ($10/mo), you get code review included — request it directly in the PR reviewer selector or via `gh pr edit --add-reviewer @copilot`. It uses an agentic architecture that gathers full repo context before commenting, surfaces actionable feedback in **71% of reviews**, and stays silent on the rest to minimize noise. Studies show **75% reduction in PR review time**.

CodeRabbit adds a second AI perspective for **$24/dev/mo** (free for OSS). Its 2-click GitHub App installation means zero configuration — it reviews every PR automatically with line-by-line comments, one-click fixes, and an agentic chat via `@coderabbitai`. Configure via `.coderabbit.yaml`:

```yaml
reviews:
  high_level_summary: true
  auto_review:
    enabled: true
    drafts: false
    path_filters:
      - "!dist/**"
      - "!.next/**"
    instructions: |
      This is a TypeScript/Next.js project. Flag: missing null checks,
      unhandled promise rejections, hardcoded secrets.
```

For **measurable quality enforcement** (coverage thresholds, code duplication limits), add **SonarCloud** (free for up to 50K lines of code, Team plan from €30/mo). Its Quality Gates block merges when code doesn't meet defined thresholds — no new bugs, no security hotspots, minimum coverage percentage.

### Linting and formatting: the Rust-powered revolution

The 2025-2026 linting landscape is dominated by Rust-based tools that are **10–100x faster** than their predecessors. Here are the current best choices per stack:

**TypeScript/JavaScript/React** — **Biome** for new projects, **ESLint v9 + Prettier** for existing ones:

Biome 2.0 (released June 2025) combines linting, formatting, and import sorting in a single binary. It's **10–25x faster** than ESLint + Prettier combined, with 423+ lint rules and 97% Prettier-compatible output. For new projects, it's the clear winner — one config file, one tool.

```json
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",
  "formatter": { "enabled": true, "indentStyle": "space", "lineWidth": 100 },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "assist": { "actions": { "source": { "organizeImports": "on" } } }
}
```

For existing projects with deep ESLint plugin dependencies (React hooks, framework-specific rules), **ESLint v9** with flat config (`eslint.config.js`) remains the standard. Note that ESLint v10 (February 2026) removes legacy `.eslintrc` support entirely.

**Python** — **Ruff** is the undisputed winner. It replaces Flake8, Black, isort, pyupgrade, and autoflake in a single tool. Written in Rust, it lints CPython's entire codebase in under 1 second. Adopted by FastAPI, Pandas, SciPy, and most major Python projects.

```toml
# pyproject.toml
[tool.ruff]
line-length = 88
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "S", "N"]

[tool.ruff.format]
docstring-code-format = true
```

Integrate in CI with a single line: `uses: astral-sh/ruff-action@v3`.

**.NET/C#** — **dotnet format** (built into the SDK, reads rules from `.editorconfig`) plus **CSharpier** (opinionated Prettier-style formatter). Enforce in CI with `dotnet format --verify-no-changes` and `dotnet csharpier --check .`.

### Security scanning: the free tier is usually enough

**The cost-effective security stack** for a solo engineer:

1. **GitHub Dependabot** (free) — Enable on every repo. Add a `dependabot.yml` covering npm, pip, NuGet, and github-actions ecosystems with weekly update schedules. Groups dev dependencies to reduce PR noise.

2. **GitHub CodeQL** (free for public repos, $30/committer/mo for private) — Semantic SAST analysis for JavaScript/TypeScript, Python, and C#. Deep data-flow analysis catches vulnerabilities that pattern-matching tools miss.

```yaml
# .github/workflows/codeql.yml
name: CodeQL
on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 6 * * 1'
jobs:
  analyze:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    strategy:
      matrix:
        language: ['javascript-typescript', 'python', 'csharp']
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: security-extended
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
```

3. **GitHub Secret Protection** ($19/committer/mo) or **Gitleaks** (free, open-source) for secret leak prevention.

**Important security note**: Trivy, a popular open-source container scanner, suffered **two supply chain attacks in March 2026** — compromised GitHub Actions tags and Docker images. If you use Trivy, **pin to verified commit SHAs only**, never version tags. Consider Grype (by Anchore) as a safer container scanning alternative.

### Enforcing quality gates with GitHub Repository Rulesets

**Repository Rulesets** are the modern replacement for branch protection rules (2024+). Key advantages: they can be applied **organization-wide** across multiple repos, support an "Evaluate" mode for testing without enforcement, and offer bypass controls for specific roles.

Set up at **Organization Settings → Repository → Rulesets → New Branch Ruleset**, targeting `main` across all repos. Required status checks should include your standardized job names: `lint`, `test`, `security-scan`. Standardize job names across all workflows to make ruleset configuration consistent.

For the 12-repo setup, org-level rulesets require **GitHub Team** ($4/user/mo) or higher. This is worth the investment — one ruleset configuration protects all repos.

---

## Phase 3: Claude Code workflow that compounds productivity

### Writing CLAUDE.md files that actually work

CLAUDE.md is loaded at the start of every Claude Code session, providing persistent context. The most critical insight from both Anthropic's official documentation and community research: **less is more**. Claude Code's system prompt already uses ~50 instructions, and LLMs follow **~150–200 instructions** with reasonable consistency. Keep your CLAUDE.md under **60–100 lines**, and never exceed 300.

**The WHAT / WHY / HOW framework:**

```markdown
# Project Overview
Brief description of what this project does and why it exists

# Tech Stack
- TypeScript strict mode, Node.js 22, pnpm
- Next.js 15 App Router, Tailwind CSS, Shadcn/UI
- PostgreSQL with Prisma ORM

# Key Commands
- `pnpm dev` — development server
- `pnpm test` — vitest
- `pnpm lint` — biome check
- `pnpm type-check` — TypeScript strict

# Code Conventions
- Server components by default; "use client" only when needed
- Zod for validation at API boundaries
- Functional composition over class hierarchies

# Testing
- TDD: write failing tests BEFORE implementation
- 80% coverage target for production code
- Run single tests: `pnpm test -- --testPathPattern=auth`

# Additional Context
- API patterns: see docs/api-patterns.md
- Database schema: see docs/database-schema.md
```

**Key principles for effective CLAUDE.md:**

Every line must apply to most sessions — ask "Would removing this cause Claude to make mistakes?" If not, cut it. Don't duplicate what linters enforce; use actual tools for formatting rules and PostToolUse hooks to auto-format. Use emphasis ("IMPORTANT", "YOU MUST") for critical instructions. Keep task-specific documentation in separate files and reference by path — CLAUDE.md supports `@path/to/file` for progressive disclosure.

**Hierarchical locations**: `~/.claude/CLAUDE.md` (global), `./CLAUDE.md` (project root, committed to git), and child directory CLAUDE.md files (loaded on demand). For monorepos, parent directory files apply to all subdirectories.

### TDD with Claude Code is the highest-leverage pattern

Anthropic calls TDD "the single strongest pattern for working with agentic coding tools." Without explicit instruction, Claude writes implementation first and then generates passing tests — which defeats the purpose. The sequence must be explicit:

1. **Red**: "Write failing tests for the auth module using pytest. Do NOT write implementation."
2. **Verify**: "Run the tests. They should all fail."
3. **Commit the failing tests** (prevents Claude from modifying them)
4. **Green**: "Write the implementation. Do NOT modify the tests. Keep going until all pass."

For advanced isolation, use **multi-agent TDD** with separate subagent definitions in `.claude/agents/`: a RED agent that only writes tests, a GREEN agent that only writes implementation, and a REFACTOR agent that cleans up. This prevents context pollution where Claude "remembers" the implementation when writing tests.

**Automate test validation with PostToolUse hooks:**
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "command": "npm test --watchAll=false 2>&1 | head -20"
    }]
  }
}
```

This runs tests automatically every time Claude edits a file, catching regressions immediately.

### Claude Code's review capabilities rival dedicated tools

Claude Code Review is now available as a **managed multi-agent review system** for Teams and Enterprise plans. When a PR opens, five specialized agents analyze the diff in parallel — checking CLAUDE.md compliance, bug detection, git history context, previous PR comments, and code comment verification. Each finding is scored 0–100, and only issues at **≥80 confidence** are posted. At Anthropic's own usage, substantive review comments jumped from 16% to 54% of PRs, with less than a **1% false positive rate**.

For the free alternative, use `anthropics/claude-code-action@beta` in GitHub Actions:
```yaml
name: Claude Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@beta
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          direct_prompt: |
            Analyze changes focusing on bugs, performance, security, 
            and correctness. If no critical issues, provide simple approval.
```

### Headless mode and the Agent SDK unlock CI/CD integration

Claude Code's `-p` (print) flag runs non-interactively, enabling scripts and CI pipelines:

```bash
# Review a PR diff
gh pr diff "$1" | claude -p "Review for security vulnerabilities" --output-format json

# Generate tests for changed files
claude -p "Generate tests for @src/auth.ts" --allowedTools Read,Write --bare

# Batch migration
for file in src/**/*.js; do
  claude -p "Convert to TypeScript with strict types: @$file" --allowedTools Read,Write --bare
done
```

The **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk` for TypeScript, `claude-agent-sdk` for Python) provides full programmatic control with the same tools and agent loop as the interactive CLI. Use it for complex multi-turn automation, structured output with JSON schemas, and custom hooks. It supports Anthropic API, AWS Bedrock, Google Vertex AI, and Azure AI Foundry.

### Comparing application versions with automated testing

For evaluating different implementations of the same feature, three patterns apply:

**Shadow deployment** mirrors production traffic to both old and new versions, comparing outputs without user impact — best for ML models and performance testing. **Canary deployment** routes 1% → 5% → 25% → 100% of traffic with automated rollback on threshold breach. **Claude-assisted diff analysis** uses headless mode to compare branches:

```bash
git diff main..feature-branch -- src/ | \
claude -p "Compare old vs new implementation for correctness regressions, 
  performance implications, security changes, and API compatibility. 
  Rate each: Better/Same/Worse." --output-format json
```

---

## Phase 4: OpenClaw ties everything together autonomously

### What OpenClaw brings to the table

**OpenClaw** is a free, open-source autonomous AI assistant that runs on your own machine or a cloud VPS. Created by Peter Steinberger (PSPDFKit founder), it launched in November 2025 and rapidly became one of the most popular open-source AI agent projects. It's MIT-licensed, runs on Node.js 22+, and connects to LLMs (Claude, GPT, local models via Ollama) while exposing tools for browser automation, cron scheduling, shell access, and messaging across **20+ channels** including Telegram, Slack, Discord, and WhatsApp.

The software is free. Your only cost is **LLM API usage** ($30–70/month for typical CI/CD monitoring) plus VPS hosting ($5–24/month). Total: roughly **$35–95/month** for complete multi-repo automation.

### GitHub webhook integration for real-time CI/CD awareness

OpenClaw's Gateway exposes HTTP webhook endpoints that receive GitHub events directly. Configure in your OpenClaw settings:

```json5
{
  webhooks: {
    enabled: true,
    endpoints: [{
      name: "github",
      secret: "your-github-webhook-secret",
      prompt: "Process this GitHub event: {{payload}}",
      channel: "telegram",
      validateSignature: true
    }]
  }
}
```

Point your GitHub repository webhooks to your OpenClaw instance's endpoint. OpenClaw processes push events, PR events, CI/CD status changes, and deployment events — then routes intelligent summaries to your chosen channel. It can also use the `gh` CLI and the GitHub MCP server to actively query repositories, monitor workflow runs, and triage issues.

A natural-language automation example: "Monitor GitHub Actions on my-org/my-repo. When a workflow fails on main, fetch logs, identify the failing step, summarize the error, and send a Telegram alert with the summary and a link."

### Telegram notifications: native channel, zero configuration

OpenClaw has **first-class Telegram support**. Once connected, all cron outputs, webhook events, and monitoring alerts route directly to your Telegram chats. For GitHub Actions workflows that run independently of OpenClaw, use `appleboy/telegram-action`:

```yaml
- name: Deploy notification
  uses: appleboy/telegram-action@master
  with:
    to: ${{ secrets.TELEGRAM_TO }}
    token: ${{ secrets.TELEGRAM_TOKEN }}
    format: markdown
    message: |
      *Deploy* to ${{ github.ref }}
      Commit: ${{ github.event.commits[0].message }}
      By: ${{ github.actor }}
```

Setup: Create a bot via @BotFather → get the token → get your chat ID via @userinfobot → store both as GitHub secrets.

### Three scheduling mechanisms for automated tasks across repos

OpenClaw provides three complementary scheduling approaches:

**Cron jobs** for precise, task-specific automation:
```bash
# Weekly project review across all repos
openclaw cron add --name "Weekly review" --cron "0 9 * * 1" \
  --session isolated \
  --message "Weekly review: check all repos for open PRs, merged PRs, CI failures, stale branches" \
  --model opus --thinking high --announce

# Post-deployment smoke test
openclaw cron add --name "Post-Deploy Smoke" --at "5m" \
  --session isolated \
  --message "Verify health check, main page, login flow on production" \
  --deliver --channel telegram --to "DevTeam" --delete-after-run
```

**Heartbeat** (default every 30 minutes) batches routine checks into a single agent turn for cost efficiency. Configure via `HEARTBEAT.md`:
```markdown
- Check CI/CD status on org/repo-1 through org/repo-12
- Alert on any failed workflows in the last 30 minutes
- Summarize open PRs awaiting review
- Flag stale branches older than 14 days
```

**Hooks** fire on internal events (new session, message received) for event-driven orchestration.

For GitHub Actions-native scheduling across repos, use matrix builds with `workflow_dispatch`:
```yaml
on:
  schedule:
    - cron: '0 9 * * 1-5'
  workflow_dispatch:
jobs:
  check-repos:
    strategy:
      matrix:
        repo: [org/repo1, org/repo2, org/repo3]
```

Note: GitHub Actions cron times are UTC, can be delayed 15–20 minutes during high load, and **workflows auto-disable after 60 days of repo inactivity**.

### Browser automation for E2E testing

OpenClaw's built-in browser automation uses Chrome DevTools Protocol with Playwright as the engine. It supports three modes: managed Chromium instances (recommended, fully isolated), extension relay (controls existing Chrome tabs with logged-in sessions), and remote CDP for cloud-hosted browsers.

For CI/CD E2E testing, **Playwright** is the clear recommendation over Cypress in 2025-2026. It offers native free parallelization, cross-browser support (Chromium, Firefox, WebKit), multi-language support (JS, TS, Python, C#), and built-in GitHub Actions integration. Playwright has surpassed Cypress in npm downloads since mid-2024.

```yaml
# Playwright in GitHub Actions
- uses: actions/setup-node@v4
- run: npx playwright install --with-deps chromium
- run: npx playwright test
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report
    path: playwright-report/
```

OpenClaw can also run natural-language E2E tests on a schedule:
```bash
openclaw cron add --name "Daily E2E Suite" --cron "0 6 * * *" \
  --session isolated \
  --message "Navigate to https://myapp.com, verify login, test checkout flow, validate API responses, summarize with screenshots" \
  --deliver --channel telegram --to "DevTeam"
```

### Multi-agent setup for monitoring 12 repos

OpenClaw supports **multiple isolated agents within a single Gateway**. Each agent has its own workspace, state directory, sessions, and model selection. For a 12-repo setup, create specialized agents:

```json5
{
  agents: {
    list: [
      { id: "devops", name: "DevOps Monitor", default: false },
      { id: "reviewer", name: "Code Reviewer", default: false },
      { id: "main", name: "Main Assistant", default: true }
    ],
    bindings: [
      { channel: "telegram", peer: "DevOps-Group", agentId: "devops" },
      { channel: "telegram", peer: "Review-Group", agentId: "reviewer" }
    ]
  }
}
```

The DevOps agent monitors CI/CD across all repos via heartbeat and webhooks. The Code Reviewer agent handles PR review requests routed from GitHub. The Main agent serves as your general-purpose assistant. Each can run on different models — use a powerful model for code review and a cheaper one for routine monitoring to optimize costs.

OpenClaw's native **OpenTelemetry integration** emits traces tagged by agent ID, so you can monitor agent performance, token usage, and success rates via Prometheus, Grafana, or Datadog.

---

## Conclusion: the four-week implementation timeline

**Week 1** — Create the shared-workflows repository and four template repos. Add CI workflows to all 12 repos. Configure Dependabot everywhere. This alone eliminates the "no automation" problem.

**Week 2** — Set up Vercel for frontend repos, Render/Railway for backends. Enable CodeRabbit or Copilot Code Review. Add Ruff, Biome, and dotnet-format to CI pipelines. Create organization-level rulesets requiring all checks to pass.

**Week 3** — Write CLAUDE.md files for each project. Set up Claude Code's PostToolUse hooks for automated test runs. Configure the GitHub Action for AI-assisted code review. Begin TDD workflow with Claude Code on active projects.

**Week 4** — Deploy OpenClaw on a VPS. Connect GitHub webhooks and Telegram. Configure heartbeat monitoring for all 12 repos. Set up Playwright E2E tests for critical user flows. Create specialized agents for DevOps and code review.

**Total monthly cost estimate**: Vercel Hobby (free) + Render free tier or Railway Hobby ($5) + Copilot Pro ($10) + CodeRabbit Pro ($24) + Anthropic API for Claude Code (~$20–50) + OpenClaw LLM usage ($30–70) + VPS ($5–12) = **roughly $95–170/month** for a fully automated, AI-augmented workflow across all 12 repositories. Every tool listed has a free tier or trial — start there and upgrade only when you hit limits.

The key insight across all four phases: **centralize configuration, automate enforcement, and let AI handle the repetitive review work.** The 2025-2026 tooling makes this achievable for a single engineer in a way that wasn't possible even two years ago.