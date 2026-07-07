---
description: Autopilot mode — drive an idea through the full venture lifecycle (V0→V5, then a V6 handoff) with the bare-minimum human input, pausing only at genuinely irreversible or spending gates.
argument-hint: "<one-line idea or goal for an existing project>" | continue
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch, Task, SlashCommand]
---

Take the idea (or, for an existing project, the goal) in `$ARGUMENTS` and drive
it toward a launched product with as little human intervention as safely
possible (Agentic Workflow §11). Autopilot works greenfield (a raw idea, from
V0) and brownfield (an existing repo — adopt first per step 0.5 below, then
resume mid-lifecycle). You orchestrate the agents and stages; you do NOT skip
the safety boundary.

**You are an orchestrator — protect your context.** Ingest agent reports and
stage artifacts, never corpora: spawn agents for all reading and building, and
let `/mission` carry V3 (its ledger, not your transcript, holds the detail).
Your durable state lives in files — the flight plan, `decision-log.md`, the
stage artifacts, the status page — never only in this conversation.

**Context discipline**: when your context is filling (roughly past two-thirds),
finish the CURRENT stage cleanly — decision log current, status page
republished, stage artifact written — then end, telling the human to relaunch
with `/autopilot continue`. A clean stage boundary beats a degraded launch.

**`continue` mode**: re-derive where the venture stands from files alone — the
flight plan (standing authorization), `decision-log.md` (choices already made:
do not re-decide them), the stage artifacts present (idea.md → PRD →
skeleton/CI → `.plans/` ledger → audits → launch prep), and `/check-workflow`.
Resume at the first stage whose exit gate isn't met. Losing the transcript
must never lose the venture.

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
  stage". This also selects the `/mission` gate policy: hard-gates-only
  authorizes `batch` (phases merge into a mission integration branch, one human
  merge at the end); check-in-each-stage keeps `human-merge` per phase.

Record this as `docs/product/flight-plan.md`, from the bundled template
(`${CLAUDE_PLUGIN_ROOT}/templates/flight-plan.md`). It is your standing
authorization; anything outside it comes back to the human.

## 0.5 Existing project? Adopt first, then resume mid-lifecycle

If the repo already contains product code, do NOT assume V0. Run the `/adopt`
procedure first — profile bootstrap, conversion of existing plans into the
trio, stage-gap audit (its fill mode only if the flight plan authorizes
drafting the missing documents). Then:

- Resume at the **first stage whose exit gate isn't met** — the same
  file-derivation logic `continue` mode uses — instead of starting at V0.
- The adaptation report's red/yellow rows become the first work items: route
  each by altitude (a gap-closing `/mission`, a session, or `/quick-fix`),
  then continue the normal stage sequence toward launch.
- Artifacts that already exist (idea.md, a PRD, CI) are settled history —
  improve what the gate audit flags; never re-litigate or regenerate them.
- `$ARGUMENTS` here is a goal for the existing product ("take it to launch",
  "harden and ship v2") — fold it into the flight plan's Idea field.

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
  record it; otherwise present the options and pause once. Spawn `business` to
  propose the model + pricing hypothesis (`docs/product/business/`) — fold the
  proposal into the same single V1 pause (scope + brand + model together);
  never set live prices autonomously.
- **V2 Foundation** — `/init-workflow`, then scaffold the deployable skeleton;
  spawn `devops` to lay the CI + deploy pipeline (gates, health checks, scoped
  permissions, SHA-pinned actions) alongside the fail-closed config guard, env
  validation, and seed.
- **V3 Build** — for anything beyond a single sitting, run `/mission` with the
  gate policy from the flight plan's check-in level (the `planner` decomposes it
  into a phased trio; you drive it). Implement via
  `backend` / `frontend` / `devops` specialists in parallel where slices are
  independent, honoring the chosen design system. Run a `reviewer` checkpoint at
  each phase; auto-apply one corrective pass on REQUEST CHANGES, then surface if
  it still fails (one-corrective-retry).
- **V4 Harden** — run the four pillar audits as an **adversarial multi-vote**
  (§5): 2–3 fresh lens-partitioned `reviewer` instances in parallel, conservative
  merge (any REQUEST CHANGES blocks; findings unioned). `security` implements
  hardening; fix or record findings. The pre-launch review at V5 repeats the
  multi-vote with a full six-lens scorecard.
- **V5 Launch prep** — `devops` stages everything up to the button (deploy
  config, `/release` version cut, runbook, monitoring wired, rollback tested
  against a staging/preview where possible). In parallel, spawn `marketing` to
  draft the launch assets under `docs/product/launch/` — one file per
  deliverable (positioning, landing copy, per-channel announcements in the
  flight plan's voice, post-launch content plan), indexed by `launch-plan.md`
  with the channel plan; and `business` to finalize pricing against measured
  costs and refresh the executive summary. Publish-ready assets and the final
  pricing are part of the consolidated launch confirmation — publishing and
  live prices are the human's.
- **V6 Operate (handoff)** — autopilot does not run operations. Alongside the
  consolidated launch confirmation, deliver a **V6 operating brief**: the
  feedback channels to watch, the launch metrics and channel plan to review
  (from `marketing`'s launch plan), a ranked growth-mission backlog (each
  runnable via `/mission`), and the retro cadence (`/retro`). Then autopilot
  ends; V6 is the owner's continuous loop.

## 2. The safety boundary (never crossed autonomously)

These require an explicit human confirmation every time, even in autopilot mode
— pre-authorization in the flight plan lets you *prepare* them, not *fire* them:

- **Merging the default branch** — you open PRs; the human (HITL) merges.
  Exception: if the flight plan's **Merge authority** (recorded as the §10 Merge
  policy) says `agent-may-merge`, you may merge reviewer-APPROVEd PRs yourself —
  the delegation is the human's explicit, recorded decision, covers only
  APPROVEd PRs, and never extends to direct pushes or anything below.
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
- Keep a `docs/product/decision-log.md` (from the bundled template,
  `${CLAUDE_PLUGIN_ROOT}/templates/decision-log.md`): each autonomous decision,
  the options, why you chose, and how to reverse it. This is how a hands-off
  owner audits you.
- If the harness provides push notifications, use one for the moments that need
  them (a kill-stop, the one brand choice, the launch confirmation) — not
  routine progress.

## Output

Between stages, a short status: stage reached, key decisions (linked to the log),
next gate. At the launch boundary, the consolidated confirmation. If you stop
early (kill criteria, blocked, budget, or a needed human decision), say exactly
why and what you need to continue.
