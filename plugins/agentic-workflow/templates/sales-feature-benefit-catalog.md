---
status: living
owner-agent: chronicler
refresh-trigger: every-ship
---

# {{PROJECT_NAME}} — Feature → benefit catalog

The **living substrate** the whole sales kit stands on. It maps every shipped
capability to the client outcome it unlocks, with the proof and the demo-moment a
rep needs to make it land. The playbook's live top-5, the sell-sheet's benefits,
and the battlecard all draw their *facts* from here — this file is where facts
enter, and nowhere else restates them.

## The substrate contract

Two hands write this file, and the split is the whole point:

- **The chronicler writes the facts, every ship.** When a capability ships, the
  chronicler appends one row inside the `data:capabilities` markers — sourced
  from the CHANGELOG/ledger and cited to the merged PR — with the **client
  outcome left `_unwritten_`**. It records *what shipped and the proof*; it
  **never authors a benefit claim**. (This is live: the chronicler refreshes this
  region on every ship, guarded by the marker-only-mutation fixture in lint.)
- **Marketing fills the outcomes, at its own beat.** Every `_unwritten_` in the
  outcome column is marketing's queue: it replaces the sentinel with
  evidence-gated "so you can…" language, each claim tracing to shipped behavior
  or research, and derives the framing from `launch-positioning.md` (the single
  source of claims). No separate state file — the `_unwritten_` sentinel *is* the
  hand-off marker, grepped across `docs/product/sales/` by `/agentic-workflow:next`
  and named in the chronicler's return.

Two invariants keep it honest:

1. **Append-only.** The region only ever *gains* rows, and only from merged PRs —
   a capability is never edited away or reworded once recorded. Corrections land
   as a new row, not a rewrite.
2. **No claim from the chronicler.** The outcome column is the only place a claim
   ever appears, and only marketing may write it. A fact with an `_unwritten_`
   outcome is the correct, expected resting state between the two beats.

## Capabilities

The append-only fact table. Everything inside the markers is chronicler-owned
(facts) and marketing-filled (the outcome column). Seed rows below are
**illustrative** — replace them with this venture's real, shipped capabilities;
delete the examples once the first real row lands.

<!-- data:capabilities -->
| Capability | Shipped-ref | Client outcome ("so you can…") | Proof | Demo-moment | Since-version |
|---|---|---|---|---|---|
| _e.g._ One-command project bootstrap | CHANGELOG `v0.2.0` · PR #12 | so you can go from empty repo to deployable skeleton before the coffee's cold | Green CI on the seeded skeleton | Run the one-liner live; show the passing pipeline | v0.2.0 |
| _e.g._ Auto-refreshing owner status page | JOURNEY 2026-07-14 · PR #31 | _unwritten_ | Published status page updates itself after each session | Ship a change, refresh the page, watch it move | v0.4.0 |
<!-- /data:capabilities -->

## How the kit reads this file

- **`sales-playbook.md` §4** pulls the live top-5 outcomes as "the client's
  Tuesday it fixes."
- **`sales-sell-sheet.md`** draws its top benefits from the filled (non-
  `_unwritten_`) rows.
- **`sales-battlecard.md` / `sales-objections-faq.md`** cite the proof column
  when a claim is challenged.

If a row's outcome is still `_unwritten_`, the kit shows nothing for it — an
unclaimed capability is silent, never guessed at.

---
_Facts enter here (chronicler, every ship, PR-cited, outcome `_unwritten_`);
claims are filled here (marketing, evidence-gated, from `launch-positioning.md`).
Append-only; the chronicler never authors a claim._
