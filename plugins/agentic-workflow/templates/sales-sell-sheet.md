---
status: living
owner-agent: chronicler
refresh-trigger: every-ship
---

# {{PROJECT_NAME}} — Sell sheet

The one-page leave-behind: what {{PROJECT_NAME}} does, the three benefits that
matter, the proof, and what to do next. As a **client-facing** leave-behind it
must **never display an `_unwritten_` sentinel** — so its two `data:*` regions are
owned by different hands, and neither ever leaves a placeholder on the page:

- **`data:top-benefits` — marketing-owned.** Marketing curates the top three from
  the feature → benefit catalog's already-*filled* (non-`_unwritten_`) rows. Because
  it draws only from filled rows, it never shows a sentinel. The chronicler never
  touches this region.
- **`data:whats-new` — chronicler-owned facts.** Every ship the chronicler writes
  the one-line release/version *fact* of the newest capability ("shipped X in vY",
  PR-cited) — a finished fact, never a benefit line, never `_unwritten_`.

Claims trace to `positioning.md`; facts trace to the catalog. This wiring is
**live** (Phase 3): the chronicler refreshes `data:whats-new` on every ship and
marketing curates `data:top-benefits` at its fill beat — no hand-copying needed.

## Value proposition

_One sentence, lifted from `positioning.md`: for **(ICP)** who **(problem)**,
{{PROJECT_NAME}} **(key benefit)**. This is the whole sheet's headline — do not
re-invent it here._

## Top 3 benefits

Marketing-owned. The three outcomes that close *this* audience — curated from the
catalog's filled (non-`_unwritten_`) rows, ranked. Because it draws only from
filled rows, an `_unwritten_` outcome never appears here.

<!-- data:top-benefits -->
1. **_(outcome, "so you can…")_** — _(the one-line reason to believe)_
2. **_(outcome)_** — _(reason to believe)_
3. **_(outcome)_** — _(reason to believe)_
<!-- /data:top-benefits -->

## Proof

_The evidence that the benefits are real: the demo-moment, the metric, or the
citation from the catalog's proof column. Unmeasured stays unmeasured — no
invented numbers._

## Price

_Do not restate the price here — it goes stale. Reference `business/pricing.md`
for the live figure and the tier that fits this buyer, framed against the value
above._

## Call to action

_The single next step you want the reader to take (book a demo, start a trial,
reply to this email) — one ask, unambiguous, with how to do it._

## What's new

Chronicler-owned facts. Every ship, the chronicler writes the one-line
release/version fact of the newest capability here ("shipped X in vY", PR-cited) —
a finished fact, never a benefit line, never `_unwritten_`.

<!-- data:whats-new -->
_(this release's newest shipped capability — one factual, PR-cited line)_
<!-- /data:whats-new -->

---
_Living (Phase-3 wired): `data:whats-new` is refreshed every ship by the chronicler
(release/version facts, PR-cited); `data:top-benefits` is curated by marketing from
the catalog's filled rows. Both regions are always finished — as a client-facing
leave-behind, this sheet never shows an `_unwritten_` sentinel. Claims trace to
`positioning.md`, facts to the catalog, price to `business/pricing.md`._
