# Feature brief — builder-done-rules (2026-10-11)

Source: inspection of jsmastery-pro/skills (MIT). **Patterns only, no text or code copied** (July-2026 incident rule).
Interviewee: Baker. Everything below the interview block is drafted.

## Problem

Four failure modes recur in missions and are caught late (Fable checkpoint, corrective session) instead of at design or build time:

1. Builders call work "done" with a migration generated but unapplied, old and new code coexisting, or a multi-file rollout half-migrated; deviations from locked decisions are logged after the code exists.
2. Briefs pre-resolve *reads* but never *values*: a produced value (total, date, tenant, currency rule) with no named source gets invented mid-build. Acceptance criteria have no stable ids, so neither the plan-judge nor the reviewer can give a per-criterion verdict, and "specced but never built" slips through (Fable council gap #1).
3. The §5 convergence rules are restated in prose across the plugin — 1.5× overrun in 6 files, one-corrective-retry in 5, Fable-on-boundary-diff in 3, `Next up:` semantics in 13 (analyst, 2026-10-11, scope agents+commands+WORKFLOW.md; whole plugin: 11 and 20) — and drift on every tune (#91 did).
4. Nothing bounds prompt size: agent `description:` fields total 9,687 chars (curator 673, compass 641) and load into every session; `WORKFLOW.md` 106 KB, `mission.md` 21 KB, `reviewer.md` 14 KB with no budget in `tools/lint.mjs`.

## Interview (owner's answers, verbatim choices)

- **Scope v1**: all four — builder done-rules; value sourcing + AC ids; rule dedup; lint budgets.
- **Value-sourcing enforcement**: *Plan-judge REVISEs* (design-time gate; builders follow the table, no builder-side stop).
- **Dedup depth**: *Pointers + lint guard* — restated paragraphs become one-line pointers to §5; lint fails on a second prose statement of a marked rule.
- **Posture / priority**: *Normal, top of backlog* — Fable plan-judge + Fable checkpoint reviewer; human-merge gate; runs next.
- **Extras (owner: "what we leave out we never visit again")**: IN — `/fix` root-cause loop; `Assumed` decision status; reviewer test-policy flag. OUT (final) — refactor before/after `/verify` mode; retro-fitting AC ids into closed trios.
- **Rule home**: *Agent prompts + one WORKFLOW §6 line* (full text where the builder reads it; a protocol citation for the reviewer).
- **Success**: lint fails on seeded violations and is green on the current tree; a fresh planner trio carries AC-N ids and a sourcing table that the plan-judge cites.

## Acceptance criteria (per journey; stable ids — this brief dogfoods them)

**J1 — a builder finishes a slice**
- AC-1 `agents/backend.md` and `agents/frontend.md` state: a data-layer change is done only when the migration is applied and the schema is confirmed live by query, not by reading the migration file.
- AC-2 Both state: superseded code is removed in the same change and proven unreferenced; old and new coexisting = not done.
- AC-3 Both state the rollout sequence: shared primitive first → site by site → gate once at the end → old code removed only when every site landed; a stop before the end reports migrated vs pending paths and is resumable.
- AC-4 Both state: a needed deviation from a dated locked decision is **stop-and-surface before coding**, never a deviation logged after; the owner's "build anyway" lands as an `Assumed` entry (AC-9).
- AC-5 `templates/WORKFLOW.md` §6 carries one "done means" line citing AC-1..AC-4 so the reviewer has a protocol anchor.

**J2 — the planner writes a trio and the judge reads it**
- AC-6 `templates/mission-plan.md` numbers acceptance criteria `AC-N`; `templates/mission-sessions.md` briefs cite the ids they satisfy; the reviewer's verdict format lists pass/fail per cited id and flags any id no brief covers.
- AC-7 The master plan (and the architect memo template, if one exists) carries a **value-sourcing table**: every value the feature produces or displays → its source (input · column · derivation · dated decision). `agents/planner.md` requires it.
- AC-8 The plan-judge mode in `agents/reviewer.md` returns REVISE on any unsourced value or any AC with no covering brief.

**J3 — the owner overrides a stop**
- AC-9 The dated-decision entry (master plan Locked decisions; `decision-log.md` under autopilot — the log exists only there) gains status `Assumed` (owed decision, assumption built on, authorized by, date); `commands/settle.md` probes and surfaces Assumed entries until a dated ratification replaces them; an Assumed entry never blocks a merge.

**J4 — the reviewer judges tests**
- AC-10 §10 profile gains a **Test policy** row (`configured` · `none-by-design` · `none-yet`); `agents/reviewer.md` reads it: `none-by-design` → no missing-test findings; `none-yet` → one note; `configured` → coverage findings as today. `/adopt`/`/bootstrap` seed the row.

**J5 — someone runs `/fix`**
- AC-11 `commands/fix.md` carries the root-cause loop: deterministic reproduction first → one falsifiable hypothesis at a time, discard refuted changes → fix the cause not the symptom → regression test → sibling hunt for the same bad assumption → "if it's a bad decision, say so and route to the architect".

**J6 — a rule is edited**
- AC-12 `templates/WORKFLOW.md` §5 is the single prose home for: 1.5× overrun stop, one-corrective-retry, Fable-on-boundary-diff (incl. `boundary_escalation`), exactly-one-`Next up:`. Every other file (mission.md, autopilot.md, reviewer.md, planner.md, settle.md, hooks' messages excluded) carries a one-line pointer, not a restatement.
- AC-13 `tools/lint.mjs` marks each canonical rule block and fails on a second prose statement of a marked rule outside §5; fixture test proves it.

**J7 — a prompt grows**
- AC-14 `tools/lint.mjs`: agent `description:` ≤ 400 chars; per-file byte budgets for `agents/*`, `commands/*`, `skills/*/SKILL.md`, `templates/WORKFLOW.md`, warning at 90 %, fail over 100 %; ceilings live in one table with a comment that they only ratchet down; fixture test proves fail + warn; current tree green after the description trims.
- AC-15 Measured: description total < 8,000 chars (from 9,687); `mission.md` and `reviewer.md` smaller than at `c12e1c1`; numbers in the PR body.

## NOT in v1 (final — not revisited)
- Refactor before/after `/verify` mode.
- Retro-fitting AC ids into closed `.plans/` trios.
- Builder-side value-sourcing stop (plan-judge only).
- Build-approach field (tracer/skateboard/facade/journey) — locked decisions can carry it ad hoc.

## Shape decisions needing memos (architect)
- D1 How lint detects a "second prose statement" (marker comments + fingerprint vs. canonical-phrase list vs. byte-identical duplicate blocks).
- D2 Where the value-sourcing table lives (master plan only vs. also in architect memos) and its minimum columns.
- D3 Budget ceilings: starting numbers per class and whether `WORKFLOW.md` gets a §-level or whole-file budget.
- D4 `Assumed` status: decision-log only, or also a ledger glyph the status line shows.

## Locked decisions (owner, 2026-10-11, after counsel)
- 2026-10-11 — **Shape**: `phases`, 2 phases, `Estimate: 4` (2 briefs + 2 Fable checkpoints). P1 = lint budgets (AC-14/15) + dedup guard (AC-12/13) + description trims + pointer swaps; lands first so P2 is budget-linted. P2 = builder done-rules (AC-1..5), trio templates/planner/judge (AC-6..8), Assumed + settle (AC-9), test-policy row (AC-10), `/fix` loop (AC-11). Gate policy: human-merge.
- 2026-10-11 — **D1 dedup**: pointers everywhere EXCEPT three byte-identical `<!-- rule-copy: <id> -->` blocks at actor sites — `commands/mission.md` (1.5× stop), `templates/mission-state.md` (ledger header), `agents/reviewer.md` (one-corrective-retry) — byte-diffed against §5 by lint. Detector keys on two mechanics tokens (word-bounded), splits on blank lines AND list/table-row starts, strips HTML comments + backticks, excludes `hooks/`. Seeded fixtures include `reviewer.md:210-212` and `mission.md:176-179`. AC-13 states the guard covers the plugin tree only, not venture `docs/WORKFLOW.md` copies.
- 2026-10-11 — **Deviation status**: a builder that must deviate from a dated locked decision returns a distinct `deviation` hand-off status (not `blocked`); `commands/mission.md` routes it to the owner directly with no corrective retry. It REPLACES "log any deviation in the ledger" at `backend.md:50` / `frontend.md:105`.
- 2026-10-11 — **AC-1 wording**: "applied in the datastore the §10 profile names for the slice and the schema confirmed live by query; where the project coordinates staging migrations (no local DB), the staging apply is a pre-merge Closing row". **AC-2** scoped to code (schema stays additive-only per `reviewer.md:159`, `backend.md:33`) and reconciled with AC-3's legitimate mid-rollout stop.
- 2026-10-11 — **D2 value sourcing**: table in the master plan only (`## Value sourcing`: AC · Value · Source kind {input, column, derivation, locked decision, open question} · Where); decision-memo gains a one-line "Values this decision settles:" bullet. A `derivation` row cites file:line or an issue comment, else `open question` (routed to Open questions, never a REVISE). A literal `none — no values produced` row is valid. Plan-judge REVISEs only on a substantive miss (a brief's Do produces a value no row names; an AC no brief cites); cell defects are named fixes inside the one REVISE.
- 2026-10-11 — **D3 budgets**: agents 16,000 B · commands 24,000 B · `skills/*/SKILL.md` 6,000 B · `description:` 400 chars · `templates/WORKFLOW.md` 120,000 B whole-file (per-§ table printed on warn) · warn 90 % · one BUDGETS object, ratchet-down comment.
- 2026-10-11 — **D4 Assumed**: a Status value on the dated decision entry wherever the mission's locked decisions live (master plan; `decision-log.md` under autopilot); `/settle` probes and surfaces, never blocks; no new ledger glyph, no owner-channel notice.
- 2026-10-11 — **Acceptance test (b)**: no synthetic planner run. This mission's own `.plans/builder-done-rules.md` is the fresh trio (AC ids + sourcing table; its plan-judge verdict cites ids). Negative control → an obligations-register row for the next real mission. **AC-15c** holds (< 14,308 B) via a named trim: `reviewer.md:108-129` impeccable paragraph → pointer to §0.2.
- 2026-10-11 — **Priority**: top of backlog — this IS the next mission.
