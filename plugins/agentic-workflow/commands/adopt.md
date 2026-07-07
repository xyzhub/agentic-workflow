---
description: Adopt the Agentic Workflow in an existing project with one command — bootstrap the profile and records, convert existing plans into the trio, and produce a stage-gap adaptation report with recommended next actions. Optional fill mode drafts the missing document deliverables.
argument-hint: [stage e.g. V3|V6] [fill]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task]
---

One-command onboarding for an EXISTING project (for a brand-new idea, use
`/autopilot` or `/init-workflow` at V0; `/autopilot` on an existing repo runs
THIS procedure first, then drives the remaining stages). Auto-adapt as far as
facts allow,
never block on an unknown (`TBD — confirm` and continue), and end with one
consolidated report instead of a stream of questions.

## 1. Bootstrap

Run the `/init-workflow` procedure: detect the project profile, write
`docs/WORKFLOW.md` with §10 filled, seed the record artifacts (CHANGELOG —
reconstructed from git history via the `chronicler` — JOURNEY, status page).
Use the `$ARGUMENTS` stage if given, else infer from repo maturity. Skip
whatever already exists (idempotent). The **Merge policy** row stays
`human-only` unless the human explicitly delegates it — never infer
`agent-may-merge` from the repo.

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

## 4. Fill mode (opt-in: `/adopt fill`)

Without `fill`, deliverable gaps are only reported (step 5). With it, after
the audit, spawn the doc agents for the **document deliverables** the audit
found missing — in parallel where independent, and only those the detected
stage actually claims:

- No `docs/product/idea.md` → `researcher` reconstructs it retroactively from
  the README, code, and any product docs as evidence — marked "retroactive:
  evidence gathered post-build" so nobody mistakes it for pre-build validation.
- No `docs/product/business/` → `business` proposes model, pricing, and the
  executive summary from what exists; every decision marked pending human.
- Stage V4+ and no `docs/product/launch/` → `marketing` drafts the launch
  assets (voice will be a best guess if no flight plan exists — flag it).

Fill mode drafts **documents only**. Engineering gaps (missing CI gates, no
env guard, no tests) are never auto-filled — those are real code changes that
go through missions/sessions with review, and the report says which.

## 5. The adaptation report (the only output that matters)

One consolidated report: detected stage and profile; what was created vs
already present; converted/resumable plans; then the gap table —
green/yellow/red per item, each red/yellow row carrying the ONE recommended
next action (`/mission "adopt-hardening"`, "spawn `business` for model +
pricing", `/quick-fix` for small ones). Rank by risk, not by category. In
fill mode, drafted deliverables appear as "drafted — review in this order,
decisions pending" rather than gaps.

Do NOT commit — leave everything staged for the human to review (HITL rule),
with the report as the review guide. Recommend the single best next command
to run.
