---
status: semi-static
owner-agent: marketing
refresh-trigger: release
---

# {{PROJECT_NAME}} — Demo script

The choreographed golden-path demo: the exact sequence that shows the product
solving the buyer's problem, staged for effect. Built from the in-scope user
journeys in the PRD (`prd.md`) — it walks the journey the buyer will actually
live, not a feature tour. Every capability shown traces to a filled row in
`feature-benefit-catalog.md`; nothing `_unwritten_` is demoed. Show the outcome,
not the surface.

> **Last refreshed**: _(YYYY-MM-DD)_ · **Refresh trigger**: release. Semi-static —
> watched for staleness, never auto-rewritten. Bump the date when you refresh.

> **Design note — re-validate each release.** Product moves; a demo path that
> worked last release can break silently. Before every demo cycle, run this
> script end-to-end against the live build. The `refresh-trigger: release` cadence
> exists for exactly this — a stale demo that breaks live costs more than no demo.

## Setup (before the buyer joins)

- **State primed:** the account/data/fixture the golden path needs, staged so the
  demo starts *at the pain*, not at a login screen.
- **Path rehearsed:** you've run the exact sequence below on the current build
  today (see the re-validate note).
- **Fallbacks ready:** the screenshot/recording for each act, in case a live step
  breaks (see "Fallbacks" below).
- **One journey chosen:** pick the single PRD journey that maps to *this* buyer's
  problem — don't demo all of them.

## The three-act flow

Structured as a story, from the buyer's pain to the resolved outcome. Each act is
one journey beat from the PRD, not a menu of features.

### Act 1 — Open on the pain

Start where the buyer already hurts. Reproduce the "before" state — the problem in
their world — so the payoff has something to land against.

- **Show:** _(the starting state / the manual pain the journey begins in)._
- **Say:** _(name the buyer's Tuesday — the recurring cost from discovery)._

### Act 2 — One capability, one outcome (the turn)

Demo the single capability that resolves that pain — live. This is the heart:
outcome first ("so you can…"), the feature as the reason to believe.

- **Show:** _(the one capability from the catalog that turns the problem — run it
  live, don't narrate over it)._
- **Say:** _(the filled outcome from `feature-benefit-catalog.md` — never an
  `_unwritten_` one)._

### Act 3 — Land the outcome

Close the loop: tie what they just saw back to the cost from Act 1, and to the
value that frames the price.

- **Show:** _(the resolved "after" state — the proof-moment made real)._
- **Say:** _(the before/after contrast, then the single next step)._

## "Wow" beats

The one or two moments engineered to land hardest — the beats a buyer repeats to
their team afterward. Each is a real demo-moment from the catalog's proof column,
not a scripted flourish:

- **Beat 1:** _(the demo-moment that makes the value undeniable — let it happen
  live, don't talk over it)._
- **Beat 2 (optional):** _(the "and it also…" moment, only if it serves this
  buyer's journey)._

## Fallbacks (if a live step breaks)

Rehearse the failure modes so a broken step never breaks the demo:

- **Per act, hold a fallback:** a screenshot or short recording of the working
  path, ready to drop in.
- **Narrate the recovery, don't hide it:** _"Let me show you that from a run I
  captured earlier"_ — honesty keeps trust; scrambling loses it.
- **Know the abort line:** if the live build is genuinely broken, stop the demo
  and reschedule — never fake a result.

_Seed acts and beats are **illustrative** — replace them with this venture's real
golden path from the `prd.md` journeys once the first journey ships._

---
_Built from the in-scope journeys in `prd.md`; every capability shown traces to a
filled row in `feature-benefit-catalog.md` (nothing `_unwritten_`). **Re-validate
end-to-end each release** — a stale demo breaks live. The `marketing` agent owns
this doc._
