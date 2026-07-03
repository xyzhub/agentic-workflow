---
description: Adopt the Agentic Workflow in an existing project with one command — bootstrap the profile and records, convert existing plans into the trio, and produce a stage-gap adaptation report with recommended next actions.
argument-hint: [stage e.g. V3|V6]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

One-command onboarding for an EXISTING project (for a brand-new idea, use
`/autopilot` or `/init-workflow` at V0). Auto-adapt as far as facts allow,
never block on an unknown (`TBD — confirm` and continue), and end with one
consolidated report instead of a stream of questions.

## 1. Bootstrap

Run the `/init-workflow` procedure: detect the project profile, write
`docs/WORKFLOW.md` with §10 filled, seed the record artifacts (CHANGELOG —
reconstructed from git history via the `chronicler` — JOURNEY, status page).
Use the `$ARGUMENTS` stage if given, else infer from repo maturity. Skip
whatever already exists (idempotent).

## 2. Inventory existing process artifacts

Look for what the project already uses and fold it in rather than duplicating:

- **A `.plans/` trio** → note it as a resumable mission (`/mission <name>
  continue`), and recommend `replan` if the ledger has drifted from git.
- **Loose planning docs** (PLAN.md, TODO.md, ROADMAP.md, `docs/*plan*`, open
  milestone docs) → list them; for the one that looks actively driven, spawn
  the `planner` to convert it into the trio (its decisions arrive locked —
  see the planner's conversion rules). Leave the originals untouched.
- **Existing conventions** (CLAUDE.md/AGENTS.md, commit conventions, an
  existing CHANGELOG) → point the protocol at them (§10 high-impact files,
  §4 commit format) instead of replacing them.

## 3. Stage-gap audit

Compare the repo against the detected stage's exit gate (§0) and the pillar
basics every stage inherits, checking mechanically where possible:

- **Foundation (V2-level)** — CI running the gates; fail-closed env/config
  validation; README quickstart; `.env.example`; seed/reset path.
- **Build (V3-level)** — tests that assert behavior; acceptance criteria
  traceable for recent features; eval suite if the product is AI-driven.
- **Hardening/Launch (V4–V5, only if the stage claims them)** — the four
  pillar audits' artifacts, monitoring, rollback story, launch assets
  (`docs/product/launch/`), business docs (`docs/product/business/`).

## 4. The adaptation report (the only output that matters)

One consolidated report: detected stage and profile; what was created vs
already present; converted/resumable plans; then the gap table —
green/yellow/red per item, each red/yellow row carrying the ONE recommended
next action (`/mission "adopt-hardening"`, "spawn `business` for model +
pricing", `/quick-fix` for small ones). Rank by risk, not by category.

Do NOT commit — leave everything staged for the human to review (HITL rule),
with the report as the review guide. Recommend the single best next command
to run.
