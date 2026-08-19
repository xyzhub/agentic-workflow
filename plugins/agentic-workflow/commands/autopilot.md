---
description: Autopilot mode — drive an idea through the full venture lifecycle (V0→V5, then a V6 handoff) with the bare-minimum human input, pausing only at genuinely irreversible or spending gates.
argument-hint: '"<one-line idea or goal for an existing project>" | continue'
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, WebSearch, WebFetch, Task, SlashCommand, Artifact, AskUserQuestion]
---

Take the idea (or, for an existing project, the goal) in `$ARGUMENTS` and drive
it toward a launched product with as little human intervention as safely
possible (Agentic Workflow §11). Autopilot works greenfield (a raw idea, from
V0) and brownfield (an existing repo — adopt first per step 0.5 below, then
resume mid-lifecycle). You orchestrate the agents and stages; you do NOT skip
the safety boundary.

**You are an orchestrator — protect your context.** Ingest agent reports and
stage artifacts, never corpora: spawn agents for all reading and building, and
let `/agentic-workflow:mission` carry V3 (its ledger, not your transcript, holds the detail).
Your durable state lives in files — the flight plan, `decision-log.md`, the
stage artifacts, the status page — never only in this conversation.

**Context discipline**: when your context is filling (roughly past two-thirds),
finish the CURRENT stage cleanly — decision log current, status page
republished, stage artifact written — then end, telling the human to relaunch
with `/agentic-workflow:autopilot continue`. A clean stage boundary beats a degraded launch.

**`continue` mode**: re-derive where the venture stands from files alone — the
flight plan (standing authorization), `decision-log.md` (choices already made:
do not re-decide them), the stage artifacts present (idea.md → PRD →
skeleton/CI → `.plans/` ledger → audits → launch prep), and `/agentic-workflow:check`.
Resume at the first stage whose exit gate isn't met. Losing the transcript
must never lose the venture. `continue` is also the **loop mode**: driven
recurringly (`/loop /autopilot continue`, or a scheduled agent), each tick
advances one clean stage boundary, then ends — same rules. A `/loop` tick does
NOT reset the context window: `/loop` is session-scoped, and ticks accrete in
the same transcript, so the context discipline above still applies. Genuine
fresh context requires `/clear`, a new session, or a scripted `claude -p`.
What makes loop mode safe is that state lives in files: any tick can be run
from a fresh context without losing anything.

## 0. Get the flight plan (the only upfront ask)

Before starting, collect the **bare minimum** from the human — ask all at once
(via AskUserQuestion where available), accept "you decide" for any:

- **Idea** — the one-liner (already in `$ARGUMENTS`; expand if thin).
- **Guardrails** — budget ceiling for any paid services; risk tolerance
  (conservative / balanced / aggressive) governing how much validation before
  building.
- **Brand** — a preference, or "you choose" (the `designer` surfaces options).
- **Deploy target** — where it should ship, and whether credentials exist yet.
- **Check-in level** — "only stop at hard gates" (default) vs. "check in each
  stage". This also selects the `/agentic-workflow:mission` gate policy (§5): hard-gates-only
  authorizes `batch`; check-in-each-stage keeps `human-merge` per phase.
- **Session estimate** — you write it, the human sees it: `Estimate: N
  sessions` for the whole flight, per stage, in the flight plan AND mirrored
  into the active mission ledger's header once V3 has one (the planner refines
  V3's share). This is the number the overrun stop measures against.

**The convergence rules bind autopilot exactly as they bind a mission (§5,
orderly §12 LA-1/5/6/7).** Increment `Sessions used:` in the active ledger
**write-ahead** at every stage step, brief, corrective and `continue` tick.
When the mission-budget hook prints 🛑 OVERRUN (`Sessions used` ≥ 1.5×
`Estimate`) you MUST NOT start another stage or brief: send the scope decision
to the owner (ship what exists as a defined subset / continue at a revised
estimate / abort) via the owner channel (§12) or the next interactive turn,
record the answer as a dated locked decision in `decision-log.md`, revise
`Estimate:`, and only then continue. Never keep a standing/resident agent
(supervisor, advisor, reviewer) alive across beats — counsel, review and audit
are one-shot spawns at gates; a resident agent needs an explicit owner line in
the ledger and is beaten on decisions only, with its running cost re-quoted
every ~3 beats. Write the ledger and decision log at every merge and gate
verdict as they happen, not at stage end. Design-quality tooling (impeccable,
§0.2) runs at the checkpoint cadence, never as a per-turn feed — if the
venture's own impeccable `Stop` hook is on, ask the owner to quiet it for the
autonomous run (drop its `Stop` entry, or `IMPECCABLE_HOOK_DISABLED=1` — `IMPECCABLE_HOOK_QUIET` only mutes clean acks) or note in the decision log that
its hints are advisory and not worked.

Record this as `docs/product/flight-plan.md`, from the bundled template
(`${CLAUDE_PLUGIN_ROOT}/templates/flight-plan.md`). It is your standing
authorization; anything outside it comes back to the human.

## 0.5 Existing project? Adopt first, then resume mid-lifecycle

If the repo already contains product code, do NOT assume V0. Run the `/agentic-workflow:adopt`
procedure first — profile bootstrap, conversion of existing plans into the
trio, stage-gap audit (its fill mode only if the flight plan authorizes
drafting the missing documents). Then:

- Resume at the **first stage whose exit gate isn't met** — the same
  file-derivation logic `continue` mode uses — instead of starting at V0.
- The adaptation report's red/yellow rows become the first work items: route
  each by altitude (a gap-closing `/agentic-workflow:mission`, a session, or `/agentic-workflow:fix`),
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
  brand/UX directions and the user journeys/IA; spawn `architect` for the
  stack decision and data-model sketch as option memos; if brand = "you
  choose", pick one with rationale and record it; otherwise present the
  options and pause once. Spawn `business` to propose the model + pricing
  hypothesis (`docs/product/business/`). Fold everything into the same single
  V1 pause (scope + brand + model together) — run `/agentic-workflow:counsel` on it first so
  the human decides with the case against in hand; never set live prices
  autonomously.
- **V2 Foundation** — `/agentic-workflow:bootstrap`, then scaffold the deployable skeleton;
  spawn `devops` to lay the CI + deploy pipeline (gates, health checks, scoped
  permissions, SHA-pinned actions) alongside the fail-closed config guard, env
  validation, and seed.
- **V3 Build** — run `/agentic-workflow:mission` with the gate policy from the
  flight plan's check-in level: one session and one review by default; pass
  `phases` only when the planner says the build honestly needs it, with an
  `Estimate:` you mirror into the flight plan (the `planner` decomposes it into
  a phased trio; you drive it). Implement via `backend` / `frontend` / `devops`
  specialists in parallel where slices are independent, honoring the chosen
  design system. Run a one-shot `reviewer` checkpoint at each phase; each phase
  lands on `staging`, is verified there (`/agentic-workflow:verify` against the
  staging URL), and only then opens its PR to the default branch; auto-apply
  one corrective pass on REQUEST CHANGES, then surface if it still fails
  (one-corrective-retry).
- **V4 Harden** — run the four pillar audits as an **adversarial multi-vote**
  (§5): 2–3 fresh lens-partitioned `reviewer` instances in parallel, conservative
  merge (any REQUEST CHANGES blocks; findings unioned). `security` implements
  hardening; fix or record findings. The pre-launch review at V5 repeats the
  multi-vote with a full six-lens scorecard.
- **V5 Launch prep** — `devops` stages everything up to the button (deploy
  config, `/agentic-workflow:release` version cut, runbook, monitoring wired, rollback tested
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
  (from `marketing`'s launch plan, baselined by the `analyst`), a ranked
  growth-mission backlog (each runnable via `/agentic-workflow:mission`), the `/agentic-workflow:operate` loop
  to run weekly (errors, funnel, costs, economics in one pass — the `ops` and
  `analyst` agents do the reading; recommend setting it up as a weekly
  scheduled agent), and the retro cadence (`/agentic-workflow:retro`). Then
  autopilot ends; V6 is the owner's continuous loop.

## 2. The safety boundary (never crossed autonomously)

These require an explicit human confirmation every time, even in autopilot mode
— pre-authorization in the flight plan lets you *prepare* them, not *fire* them:

- **Merging the default branch** — you open PRs (from a staging-verified
  state, §5); the human (HITL) merges.
  Exception: if the flight plan's **Merge authority** (recorded as the §10 Merge
  policy) says `agent-may-merge`, you may merge reviewer-APPROVEd PRs yourself —
  the delegation is the human's explicit, recorded decision, covers only
  APPROVEd PRs, and never extends to direct pushes or anything below.
- **Deploying to production / going live** — you stage it; the human triggers it.
- **Spending money or committing to paid services** beyond the flight-plan ceiling.
- **Publishing outward** (domains, app stores, public posts) or sending anything
  on the owner's behalf.
- **Launching behavioral experiments on real users** — you propose (hypothesis,
  measurement plan, per §11); the human launches.
- **Destructive or irreversible actions** on data or infrastructure.

Batch these: when you reach the launch boundary, run `/agentic-workflow:counsel` on the launch
decision, then present ONE consolidated "ready to launch" summary (what will
happen, what it costs, what's irreversible — with the counsel brief attached)
for a single confirmation, rather than nagging along the way.

## 3. Keep the human oriented without blocking

- The **status page** (`docs/product/overview.html`) is their window — republish
  after each stage via the Artifact tool.
- Keep a `docs/product/decision-log.md` (from the bundled template,
  `${CLAUDE_PLUGIN_ROOT}/templates/decision-log.md`): each autonomous decision,
  the options, why you chose, and how to reverse it. This is how a hands-off
  owner audits you.
- Gate-tier moments (a kill-stop, the one brand choice, the V1 approval, the
  launch confirmation) go to the **owner channel** (§12) when one is
  configured — decision gates carry Approve/Reject buttons bound to the gate
  id; action gates carry the link the human fires. Fall back to harness push
  notifications, and never message routine progress.

## Output

Between stages, a short status: stage reached, key decisions (linked to the log),
next gate. At the launch boundary, the consolidated confirmation. If you stop
early (kill criteria, blocked, budget, or a needed human decision), say exactly
why and what you need to continue.
