# Mission: orchestrator-governance — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide. Deploys to `.plans/orchestrator-governance.md`._

<!-- Shaped from `docs/product/features/orchestrator-governance/idea.md` (2026-07-23,
converged via /agentic-workflow:brainstorm). That doc is the source of truth; its
locked decisions arrive here locked, not re-litigated. -->

Goal: give the main orchestrator a two-axis governance layer — hooks that keep it
on **protocol** (tactical) and two agents (`intake`, `compass`) that keep it on
**purpose** (strategic) — built cheapest/safest → hardest so each layer is felt
and reviewed before the next.

## Problem (see `idea.md`)

The orchestrator continuously drifts off-protocol in three concrete ways: the
**front door is bypassed** (a plain-English request escapes the slash-prefixed
protocol), **beats are forgotten** (a required spawn — chronicler at close,
reviewer at a checkpoint — never happens because nothing reminds it at the due
moment), and **purpose is lost** (work drifts from the end-goal, nobody holds the
big picture). The first two are tactical ("done right?"), the third strategic
("worth doing?"). The machinery to govern both cheaply already exists — hooks
(always-on, ~free, can't-itself-drift), the greppable ledger, and the §12 owner
channel — and just isn't pointed at the problem.

## Design — three layers, cheapest/safest → hardest

1. **Reflexes (hooks)** — a `UserPromptSubmit` **router**, a `UserPromptSubmit`
   **thread-keeper**, and a **beat-enforcer** (`PreToolUse` + `Stop`). Deterministic
   backbone; the felt validation of "nudges get heeded".
2. **`intake` agent** (tactical) — classifies a chat request's altitude, shapes it,
   returns the route; the orchestrator drives (subagents can't run slash commands).
3. **`compass` agent** (strategic, riskiest) — owns a north-star/charter artifact,
   runs at strategic beats, notifies the owner (§12) on strategic drift; ships in
   **shadow mode** (flag, don't notify) so it earns trust first.

## Tasks

_Numbered, each with acceptance criteria a reviewer can check against the diff._

1. **Shape memo** — the `architect` digests every technical open question below
   into a decision-ready options memo (2–3 options each, tradeoffs, reversal cost,
   a recommendation); the human locks the shape. Acceptance: a memo under
   `docs/product/features/orchestrator-governance/` answers each (b)-question, and
   the locked choices are recorded as dated **Locked decisions** here before P2
   starts.

2. **Router hook** — a `UserPromptSubmit` hook injects a directive to route an
   un-prefixed work-request through the protocol / hand it to `intake`, and stays
   silent on plain conversation (no command-ifying everything). Acceptance:
   `node tools/lint.mjs` prints `lint: clean` (the new command passes `checkHooks`
   bash-syntax); a felt trial shows a bare "add feature X" request gets the nudge
   and a plain question does not.

3. **Thread-keeper hook** — a `UserPromptSubmit` hook, every turn, injects the
   active ledger's current phase + `Next up:` + the next required-but-unchecked
   beat, pulled by grep from `.plans/*.state.md`. Acceptance: lint clean; against
   a live ledger the injected line names the correct `Next up:` and the first
   unchecked beat; no ledger → silent.

4. **Beat-enforcer hook** — a `PreToolUse` (git commit / phase-advance) hook plus a
   `Stop` hook nudge when the orchestrator tries to close/advance while a required
   ledger beat (chronicler/reviewer) is still unchecked. Acceptance: lint clean; a
   `[~]`/unchecked chronicler beat triggers the nudge at commit/close; a fully
   checked ledger stays silent.

5. **`intake` agent + router→intake wiring** — `agents/intake.md` (mirrors
   `advisor`/`brainstormer` shape) classifies altitude, shapes the request, and
   returns the route (fuzzy → `/agentic-workflow:brainstorm`; defined feature →
   `/agentic-workflow:plan`→`/agentic-workflow:mission`; small → `/agentic-workflow:fix`),
   with a hard NEVER boundary (routes + shapes; never runs/merges/builds). Acceptance:
   lint clean (name=filename, tools valid, cross-refs — mentioned in both READMEs +
   master WORKFLOW.md §6); the router directive and the agent name each other.

6. **`compass` agent + north-star artifact + shadow-mode §12 notify** —
   `agents/compass.md` owns a north-star/charter artifact (schema + location per the
   P1 memo, seeded from a new template), runs at strategic beats, and evaluates
   trajectory-vs-purpose. It ships in **shadow mode**: it FLAGS strategic drift in
   its return, does not yet fire §12 notifications. Boundary: holds direction +
   flags; never decides/kills/builds/merges; distinct from `advisor` and `analyst`.
   Acceptance: lint clean (incl. cross-refs); the charter template exists and
   resolves; the agent body states shadow mode explicitly and reuses the §12 send
   path (no secrets in transcript) for the later live phase.

7. **Docs + eval + version bump** — master `templates/WORKFLOW.md` gains the two
   §6 role paragraphs, the §3 guardrail-table rows for the three hooks, and any §4
   amendment; both READMEs gain the agent rows + a hooks note; `plugin.json`
   1.38.0 → 1.39.0; `CHANGELOG.md` `[Unreleased]` entry; a governance eval scenario
   under `evals/scenarios/`; then `/agentic-workflow:sync` propagates master →
   `docs/WORKFLOW.md` ONCE. Acceptance: `node tools/lint.mjs` clean; the new eval
   scenario green; version + changelog updated.

## Locked decisions

_From `idea.md`, dated 2026-07-23. Never re-litigated mid-flight; a decision new
evidence invalidates becomes an open question below (unlocking is the human's call)._

- **2026-07-23 — Mechanism reality.** Hooks are the only always-on/deterministic
  layer (the backbone that must not itself drift); agents are invoked, born fresh
  (the judgment). No persistent LLM watcher — the harness can't offer one and it
  would itself drift.
- **2026-07-23 — Interventions by axis.** Protocol drift → steer/correct (soft
  nudge) + enforce required beats. Strategic drift → notify the human (their call).
- **2026-07-23 — Build order.** Reflexes (hooks) → `intake` → `compass`, cheapest/
  safest → hardest/riskiest; each phase felt + reviewed before the next.
- **2026-07-23 — `compass` notifies live from day one (human override).** The human
  chose live §12 notifications from the start over shadow-mode-first — matching the
  original "notify me when something's off" intent. Mitigation kept: strict
  **Alert-tier only + severity/frequency gating** so it doesn't cry wolf (a muted
  channel is worse than a quiet one). Beat-enforcer and router stay **soft** (nudge /
  soft directive, never blocking); a blocking escalation remains a separate future go.
- **2026-07-23 — Constraints honored.** Fit the plugin (markdown/hooks/agents, no
  heavy infra); token-cost sane (hooks free; agents only at beats/trips, never per
  step); no new ceremony (nudges reduce rework, they don't add a per-turn gate).
- **2026-07-23 (shape lock — S1 memo → human).** Locked per
  `docs/product/features/orchestrator-governance/shape-memo.md`:
  - **D1 drift-signatures** — hooks catch only crisp shell signals (no-slash prefix,
    `[~]`-while-advancing, unchecked required beat, large read); semantic drift routes
    to `intake` judgment, not a fragile transcript scan.
  - **D2 router** — cheap keyword/no-slash prefilter → a **soft** "route via `intake`
    if this is work" directive; orchestrator decides; **never `exit 2`** (erases the prompt).
  - **D3 thread-keeper** — active ledger = newest-mtime non-complete `.plans/*.state.md`
    (branch-name tie-break); inject `Next up:` + the first `[ ]`/`[~]` row; silent if none.
  - **D4 beat-enforcer** — both, soft: `PreToolUse`-on-commit/phase-advance echo + a
    non-blocking `Stop` backstop. Blocking escalation deferred.
  - **D5 north-star** — `docs/product/north-star.md` from a new `templates/north-star.md`;
    Purpose (human-owned) + worthy-progress definition + live done-vs-roadmap; `compass`
    maintains the rollup, points at idea.md/PRD for the "what".
  - **D6 `intake`** — new `agents/intake.md` (a bare chat request needs a subagent, not
    a command); classification mirrors `/next`'s decision tree.
  - **D7 `compass`** — standalone `agents/compass.md` that `/operate` also calls;
    **live §12 notify from day one** (per the override above), Alert-tier + gated.
  - **D8 `intake`↔`compass`** — independent now; an advisory, non-gating purpose-fit flag
    later; never a hard gate.

## Risks

- **Nudges tuned out under context pressure** (the riskiest assumption, tactical
  tier) → P2 is the cheap felt test; if injected directives don't change behavior,
  the premise is in doubt before `intake`/`compass` are built. Mitigation: front-
  load P2 as the felt validation gate; kill/rethink if it fails.
- **Hooks are a security surface** (they run shell on every prompt/tool call and
  read the ledger) → the P2 checkpoint reviewer leads with the security lens; hook
  commands must fail closed, quote inputs, and never execute ledger content.
- **`compass` cries wolf** → shadow mode first; gating (severity/frequency) is a
  P1 memo question; live notify is out of scope until it's trusted.
- **Drift signatures may not be shell-detectable** → the router/thread-keeper/
  beat-enforcer detectability is the P1 memo's central question; anything not
  cleanly detectable becomes agent judgment (`intake`), not a hook.
- **Lint cross-refs fail mid-mission** — a new agent must be named in both READMEs
  + master WORKFLOW.md or `checkCrossRefs` fails. Mitigation: the agent-creating
  session (S4, S5) adds the minimal doc mentions to stay lint-green; S6 does the
  full role paragraphs and polish.

## Open questions

_Split for the orchestrator: (a) plain scope/policy calls for the human; (b)
technical questions routed through the P1 `architect` memo (the human still
decides from digested options). Resolve (a) before execution; (b) are the S1 brief._

### (a) For the human — scope / policy

- **Gate policy.** Recorded default is **human-merge**; last mission
  (portfolio-commons, 2026-07-18) used the *stacked-phases, one-merge-at-end*
  variant. **Recommendation:** confirm stacked-one-merge again — five small phases
  editing shared files (hooks.json, WORKFLOW master) merge cleanly as one PR, and
  `/agentic-workflow:sync` runs once at the end. The orchestrator confirms at mission start.
- **Governance eval scope.** Which drift(s) does the S6 eval guard?
  **Recommendation:** two scenarios mirroring the felt test — a plain-English
  work-request gets routed (not freewheeled), and a forgotten chronicler beat gets
  caught at close — matching the existing `routing-altitude` / `reviewer-checkpoint`
  shape.
- **P1 memo review depth.** Does the shape memo go to the human alone, or also
  through `/agentic-workflow:counsel` advisors? **Recommendation:** human alone —
  this is tactical shaping of a decided feature, not a go/no-go gate; keep advisors
  for the real gates.

### (b) For the P1 architect memo — technical

_These mirror `idea.md`'s open questions; the memo digests each into options._

- Exact hook **drift-signatures**: which drifts are shell-detectable vs need agent
  judgment; how the router distinguishes a work-request (→ route) from plain
  conversation (→ just answer) without command-ifying everything.
- **Thread-keeper mechanics**: how to locate the *active* ledger among multiple
  `.plans/*.state.md`, and derive "next expected step" + "required-but-unchecked
  beat" from the schema (`[ ]`/`[~]`/`[x]` rows, `Next up:`, checkpoint rows).
- **Beat-enforcer placement**: `Stop` hook vs `PreToolUse` on commit/phase-advance
  — expressibility in `hooks.json` and which fires at the overdue moment.
- **North-star/charter artifact**: where it lives, its schema, its relation to
  `idea.md`/PRD, and how `compass` keeps done-vs-roadmap current.
- **`intake` shape**: a new agent, or an extension of `/agentic-workflow:next` /
  `/agentic-workflow:welcome`? **`compass` shape**: standalone agent, or an
  extension of `/agentic-workflow:operate`?
- **`compass` notification gating** (severity/frequency) to avoid crying wolf.
- **`intake`↔`compass` coupling**: does `compass` gate `intake`'s routing (a
  purpose check before the orchestrator drives a request through the protocol)?

---
_The `.plans/orchestrator-governance.sessions.md` briefs execute these tasks;
`.plans/orchestrator-governance.state.md` tracks progress. Resolve every (a) open
question before execution starts; the (b) questions are answered by S1's memo._
