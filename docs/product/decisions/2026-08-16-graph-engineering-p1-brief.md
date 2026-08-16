# Feature brief — Graph-engineering P1 (improvement-graph hardening)

**Date:** 2026-08-16
**Branch:** `feat/graph-engineering-p1` (settle close committed at `6562f11`)
**Class:** mission (2–3 sessions)
**Status:** DRAFT — awaiting the single consolidated approval

## Problem

The plugin is already a well-formed **work graph** — 20 specialized agents as
nodes, 27 commands and 5 wired hook events as edges, the `.plans/` trio and
`.plans/OBLIGATIONS.md` as shared state. What it lacks is a hardened
**improvement graph**: the loops that are supposed to watch, constrain, and
correct each other largely do not know about one another.

Three failure modes are already documented in this repo's own artifacts:

| Failure mode | Evidence in this repo |
|---|---|
| **Measurement decay** — the sensor drifts while the dashboard stays green | Context-economy P0 "calibrated the fixtures" *during* a mission — tuning the test set to the system under test. OB-1/OB-2 are stuck on n=1 figures that cannot be honestly re-measured against a contaminated set. The Fable council ranked verification as **gap #1**. |
| **Goodhart** — the optimized metric detaches from value | Context-economy optimized character count (−401.4k chars / −19%) with no paired counter-metric for output quality; the mission's premise was later **retracted** and P1 dropped. |
| **Inter-loop conflict** — one loop silently gates another | OB-9, verbatim: three merged PRs deferred the version bump, and *"OB-5/6/8's install conditions silently depended on it."* |

A fourth mode, **upward blindness**, is already solved — the `compass` agent
owns `north-star.md` and fires gated drift alerts. Nothing to build there.

This mission builds the **instrument**, not a feature. Every downstream
decision — the OB-10 memory-accelerator trial, reviving the parked
portfolio-learning mission — needs a held-out set and a counter-metric
discipline to be judged honestly rather than on vendor claims.

## Scope — three changes

### 1. FROZEN NODES — a held-out eval set
Declare a subset of the 12 scenarios under `evals/scenarios/` non-tunable, and
add a `checkFrozenFixtures()` to `tools/lint.mjs` that fails the push when a
frozen fixture is edited. Precedent to follow: `checkObfuscation()`
(`tools/lint.mjs`) — `git ls-files` + a per-file rule + a hard `fail()`. That
check exists because of the 2026-07 supply-chain incident; this one is the same
shape applied to measurement integrity.

### 2. PAIRED METRICS — a counter-metric row
One row in `plugins/agentic-workflow/templates/mission-state.md`: every
optimization target must name the thing it could degrade. Declared in prose by
the mission author; no tooling computes the numbers in v1.

### 3. DECLARED EDGES — `depends-on:` in the register grammar
Extend the `.plans/OBLIGATIONS.md` row grammar with an optional
`depends-on: OB-<n>` field, plus lint enforcement that the reference resolves
to a real row. Generalizes OB-9 from a one-off patch into a class: any loop
whose firing condition depends on another loop's output declares that edge.

### Folded in
This mission touches `tools/lint.mjs`, `commands/settle.md`, and
`templates/mission-state.md` — which is **exactly** the `when:` condition on
OB-7 and OB-9. Both are folded in and fired as part of this mission:

- **OB-7** (four sub-items): the >140-char-row harness case in `hook-test`; a
  carrying-commit command in `settle.md` recipe #2; the digitless `→ OB-`
  promotion-ref lint leak; extending the clock-leak pattern to `after N <units>`.
- **OB-9**: the `## Closing` template gains a "version bumped + stamped, if the
  mission's CHANGELOG entry names a version" row, so settle's close gate
  refuses an unversioned ship.

## Interview answers (the human's words — verbatim selections)

| Question | Answer |
|---|---|
| Which eval fixtures become frozen? | **Hold out a subset** — freeze ~4 of the 12 scenarios as a held-out set; the other 8 stay tunable as the working set |
| How hard should the frozen check fail? | **Hard fail + logged escape hatch** — lint fails the push, but a frozen entry can change via a manifest bump carrying a dated reason, so the change is visible and reviewable rather than impossible |
| What is NOT in v1? | *"not sure"* — the orchestrator proposed the list below; the human corrects it at the approval gate |
| What counts as done? | **Mechanism + both obligations fired** — all three changes land, lint proves each fails correctly on a deliberately-bad input, and OB-7 + OB-9 are fired. Register goes 7 open → 5 |

## Acceptance criteria

1. A held-out subset of `evals/scenarios/` is declared frozen in a manifest,
   and `node tools/lint.mjs` **fails** when a frozen fixture is edited without
   a manifest bump — proven by a deliberately-bad input in the test harness.
2. The escape hatch works and is legible: bumping the manifest with a dated
   reason makes lint pass again, and the reason is recorded in-repo.
3. `templates/mission-state.md` carries the paired-metric row, and a mission
   ledger authored from the template without a counter-metric is caught.
4. `.plans/OBLIGATIONS.md` grammar documents `depends-on: OB-<n>`, and lint
   **fails** on a `depends-on:` that references a non-existent row.
5. OB-7's four sub-items are implemented; OB-7 and OB-9 are ticked `[x]` with
   evidence lines. Register: 7 open → 5.
6. Gates: `node tools/lint.mjs` clean and `node tools/hook-test.mjs` clean.
   Testing is layers 1–2 only — **no live install, no staging channel**
   (the staging gap is recorded separately as OB-11).

## NOT in v1 — deferred, not denied

Proposed by the orchestrator after the human answered *"not sure"*; correctable
at the approval gate.

| Deferred | Rationale |
|---|---|
| Transitive `depends-on:` cycle detection (A→B→A) | YAGNI at 11 register rows; v1 resolves the reference only |
| Retrofitting paired metrics to the 6 existing mission ledgers | The human chose "mechanism + obligations", not the retro-application option |
| Auto-computing or verifying net-context numbers | Explicitly OB-10's job, not this mission's |
| Freezing `tools/hook-test.mjs` fixtures | The eval fixtures are the surface that was actually calibrated; hook-test is not the contaminated set |

## Non-goals

- No new agents. No graph framework (LangGraph/AutoGen). No memory database.
- No changes to `compass` — upward blindness is already solved.
- No live-install verification; that is OB-5/OB-8-class work with its own triggers.

## Open shape decisions (for the architect)

1. How is the frozen set recorded — content hashes in a manifest, a
   `frozen: true` marker per scenario, or path globs? Reversal cost of each.
2. How does the escape hatch capture its dated reason so it is reviewable in a
   diff rather than buried?
3. Where does `depends-on:` sit in the row grammar so the existing lint checks
   (including the clock-leak and promotion-ref patterns) do not false-positive?

## Locked decisions

_(populated at the single approval gate — dated)_
