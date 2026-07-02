---
description: Autonomous mode — drive an idea through the full venture lifecycle (V0→V5) with the bare-minimum human input, pausing only at genuinely irreversible or spending gates.
argument-hint: "<one-line idea>"
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch]
---

Take the idea in `$ARGUMENTS` and drive it toward a launched product with as
little human intervention as safely possible (Venture Workflow §11). You
orchestrate the agents and stages; you do NOT skip the safety boundary.

## 0. Get the flight plan (the only upfront ask)

Before starting, collect the **bare minimum** from the human — ask all at once,
accept "you decide" for any:

- **Idea** — the one-liner (already in `$ARGUMENTS`; expand if thin).
- **Guardrails** — budget ceiling for any paid services; risk tolerance
  (conservative / balanced / aggressive) governing how much validation before
  building.
- **Brand** — a preference, or "you choose" (the `designer` surfaces options).
- **Deploy target** — where it should ship, and whether credentials exist yet.
- **Check-in level** — "only stop at hard gates" (default) vs. "check in each
  stage".

Record this as `docs/product/flight-plan.md`. It is your standing authorization;
anything outside it comes back to the human.

## 1. Drive the lifecycle

Run V0→V5, making the reviewer-verified gates yourself and surfacing only the
human-owned ones. At each stage, the `chronicler` updates the status page so the
owner can watch live.

- **V0 Validate** — spawn `researcher`; write `idea.md`. Evaluate against kill
  criteria. If the evidence says stop, **stop and report** (do not build a thing
  the research killed). If it clearly passes, note "proceeding because …" and
  continue. If it's genuinely borderline, that's a human gate — surface it.
- **V1 Define** — write the PRD + MVP scope with an explicit "NOT in v1" list;
  choose the smallest scope that delivers the core value. Spawn `designer` for
  brand/UX directions; if brand = "you choose", pick one with rationale and
  record it; otherwise present the options and pause once.
- **V2 Foundation** — `/workflow-init`, then scaffold the deployable skeleton;
  spawn `devops` to lay the CI + deploy pipeline (gates, health checks, scoped
  permissions, SHA-pinned actions) alongside the fail-closed config guard, env
  validation, and seed.
- **V3 Build** — for anything beyond a single sitting, run `/mission` (the
  `planner` decomposes it into a phased trio; you drive it). Implement via
  `backend` / `frontend` / `devops` specialists in parallel where slices are
  independent, honoring the chosen design system. Run a `reviewer` checkpoint at
  each phase; auto-apply one corrective pass on REQUEST CHANGES, then surface if
  it still fails (one-corrective-retry).
- **V4 Harden** — run the four pillar audits (`security` implements hardening;
  `reviewer` verifies; UX/DX/efficiency passes). Fix or record findings.
- **V5 Launch prep** — `devops` stages everything up to the button (deploy
  config, `/release` version cut, runbook, monitoring wired, rollback tested
  against a staging/preview where possible).

## 2. The safety boundary (never crossed autonomously)

These require an explicit human confirmation every time, even in autonomous mode
— pre-authorization in the flight plan lets you *prepare* them, not *fire* them:

- **Merging the default branch** — you open PRs; the human (HITL) merges.
- **Deploying to production / going live** — you stage it; the human triggers it.
- **Spending money or committing to paid services** beyond the flight-plan ceiling.
- **Publishing outward** (domains, app stores, public posts) or sending anything
  on the owner's behalf.
- **Destructive or irreversible actions** on data or infrastructure.

Batch these: when you reach the launch boundary, present ONE consolidated
"ready to launch" summary (what will happen, what it costs, what's irreversible)
for a single confirmation, rather than nagging along the way.

## 3. Keep the human oriented without blocking

- The **status page** (`docs/product/overview.html`) is their window — republish
  after each stage via the Artifact tool.
- Keep a `docs/product/decision-log.md`: each autonomous decision, the options,
  why you chose, and how to reverse it. This is how a hands-off owner audits you.
- Use a push notification for the moments that need them (a kill-stop, the one
  brand choice, the launch confirmation) — not routine progress.

## Output

Between stages, a short status: stage reached, key decisions (linked to the log),
next gate. At the launch boundary, the consolidated confirmation. If you stop
early (kill criteria, blocked, budget, or a needed human decision), say exactly
why and what you need to continue.
