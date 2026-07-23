# Orchestrator Governance — Idea & Validation (V0, feature-scoped)

> **Feature of the `agentic-workflow` plugin**, not a standalone venture. Shapes a
> capability the plugin would gain; the plugin's own product-of-record stays
> `docs/product/idea.md`. Authored 2026-07-23 via `/agentic-workflow:brainstorm`.

## The problem

Using the workflow on a real project, the **main orchestrator continuously drifts
off-protocol**. Three concrete failures, on two different axes:

- **Front door bypassed** — a plain-English request (no `/` prefix) gets an ad-hoc
  answer instead of being routed into the matching agentic-workflow command. The
  protocol is opt-in via a slash prefix; normal conversation escapes it.
- **Forgotten beats** — the orchestrator omits a *required* spawn (the chronicler
  at session close, the reviewer at a checkpoint) because nothing reminds it at the
  moment it's due. Omissions: the required action just never happens.
- **Purpose lost** — over time the project wanders from its actual end-goal; work
  happens that doesn't advance the purpose, and no one is holding the big picture.

The first two are **tactical** (is this being done *right*?); the third is
**strategic** (is this *worth doing*?). Today nothing governs either continuously.

## Who it's for / who "pays"

Internal tooling — the owner running ventures with the workflow. The "payment" is
trust: the orchestrator can be left running (autopilot/loop) and stay on both
protocol and purpose without the human catching every slip by hand.

## Why now

The machinery to do this cheaply already exists and just isn't pointed at the
problem: **hooks** are the one always-on, per-action, ~free, can't-itself-drift
layer (the guardrail hooks + the large-read warning already inject protocol
reminders); the **ledger** is machine-parseable ground truth; §12 gives an owner
channel to notify; §8 ("the loop improves the loop") welcomes protocol additions.

## The rough shape — three layers, cheapest/safest → hardest

1. **Reflexes — hooks (deterministic, ~free, the mechanical backbone).**
   - **Router** (`UserPromptSubmit`): an un-prefixed work-request → inject a
     directive to route it through the protocol / hand it to `intake`, not freewheel.
   - **Thread-keeper** (`UserPromptSubmit`, every turn): inject the current phase +
     the **next expected protocol step** pulled from the ledger — the anti-forgetting
     mechanism (the required beat sits in fresh context each turn instead of decaying).
   - **Beat-enforcer** (`PreToolUse` on commit/phase-advance + a `Stop` hook): when
     the orchestrator tries to close/advance while a required ledger step
     (chronicler/reviewer) is unchecked → nudge at the overdue moment.
2. **`intake` agent — tactical judgment.** Takes any feature request from normal
   chat, classifies its altitude, shapes it, and returns the routing (fuzzy idea →
   `/brainstorm`; defined feature → `/plan`→`/mission`; small → `/fix`). It classifies
   and hands off; the **orchestrator drives** (a subagent can't run slash commands or
   spawn agents). Boundary: routes + shapes; never itself runs/merges/builds.
3. **`compass` agent — strategic judgment (the ambitious one).** Owns a
   **north-star / charter artifact** (the project's purpose, the definition of
   "worthy progress", and the live done-vs-roadmap). Runs at strategic beats (a new
   `intake` request, phase-ends, a periodic sweep, on demand); evaluates whether the
   trajectory advances the end-goal; **notifies the owner (§12)** on strategic drift.
   Boundary: holds direction + flags; does not decide/kill (the human's call), build,
   or merge. Distinct from `advisor` (argues one pending decision on demand) and
   `analyst` (measures).

Composition: hook detects a bare request → orchestrator spawns `intake` →
`intake` (with `compass` checking purpose-fit) returns the route → orchestrator
drives it, thread-keeper/beat-enforcer keeping it from dropping a step.

## Locked decisions (dated 2026-07-23)

- **Mechanism reality**: hooks are the only always-on/deterministic layer (the
  backbone that "must not itself drift"); agents are *invoked, born fresh* (the
  judgment). No persistent LLM watcher — the harness can't offer one, and it would
  itself drift.
- **Interventions by axis**: protocol drift → **steer/correct** (soft nudge) +
  enforce required beats; strategic drift → **notify the human** (their call).
- **Build order**: reflexes (hooks) → `intake` → `compass` — cheapest/safest to
  hardest/riskiest; each phase felt + reviewed before the next.
- **Constraints (all honored)**: fit the plugin (markdown/hooks/agents, no heavy
  infra); token-cost sane (hooks free; agents only at beats/trips, never per step);
  no new ceremony (nudges reduce rework, don't add a gate at every turn).

## The riskiest assumption

Two, one per agent tier:
- **(reflexes/intake)** That **injected nudges actually get heeded** rather than
  tuned out as context fills — and that the named drifts have a shell-detectable
  signature (or a clean intake trigger).
- **(compass)** That **strategic alignment is judgeable reliably enough to
  interrupt on** — a compass that cries wolf gets muted, and "does this serve the
  purpose?" is subjective. It must earn trust before it's trusted to notify.

## Cheapest test of that assumption

**Phase 1 is the test.** Build the felt hooks slice first (router + thread-keeper)
and use it on real turns: does a plain request get routed, and does a forgotten
chronicler get caught? If the injected directives don't change behavior, the whole
premise (mechanical nudges govern the orchestrator) is in doubt — cheaply, before
`intake`/`compass` are built. The `compass` earns its interrupt-privilege only after
it's shown (shadow mode: flag but don't notify) that its alignment calls are trusted.

## Kill criteria

- Injected nudges are demonstrably ignored under context pressure → hooks alone
  can't govern; rethink (stronger placement, or hard-block the crisp cases).
- `compass` false-alarm rate is high enough that its notifications get muted → it's
  noise, not governance; keep it on-demand only, not always-on.
- The layer adds friction (command-ifies plain chat, nags on legitimate actions) that
  makes the workflow slower than the drift it prevents.

## Open questions (for planning / architect)

- Exact hook drift-signatures (which drifts are shell-detectable vs need agent judgment).
- The north-star/charter artifact — where it lives, its schema, its relation to
  idea.md/PRD; how `compass` keeps done-vs-roadmap current.
- Is `intake` a new agent or an extension of `/next`/`/welcome`? Is `compass`
  standalone or an extension of `/operate`?
- How the router distinguishes a work-request (→ route) from plain conversation
  (→ just answer) without command-ifying everything.
- How `compass` notifications are gated (severity/frequency) to avoid crying wolf.
- The `intake`↔`compass` coupling: does `compass` gate `intake`'s routing (purpose
  check before we drive a request through the protocol)?

---
_Exit V0 → V1 when the human gives an explicit go, informed by the phase-1 felt test._
