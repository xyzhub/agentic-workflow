---
status: semi-static
owner-agent: marketing
refresh-trigger: release
---

# {{PROJECT_NAME}} — Sales playbook

The coaching doc: how a rep *presents* {{PROJECT_NAME}} and closes a client. It
turns the sales kit's facts into a spoken performance — what to say, in what
order, and where to let the product do the talking. Claims trace to
`positioning.md` (the single source); facts trace to the feature → benefit
catalog. The rep adds delivery, never new claims.

> **Last refreshed**: _(YYYY-MM-DD)_ · **Refresh trigger**: release. Semi-static —
> watched for staleness, never auto-rewritten. Bump the date when you refresh.

> Live regions marked `<!-- data:* -->` are STATIC placeholders in this version —
> the chronicler wires them to the catalog in a later phase. Until then, fill
> them by hand from the catalog's filled rows.

## §1 — Product in one breath

Three lengths of the same truth. Each must survive being read aloud.

- **30 seconds (the hallway):** _For **(ICP)** who **(problem)**,
  {{PROJECT_NAME}} is a **(category)** that **(key benefit)** — unlike
  **(alternative)**, it **(differentiator)**._ (Lift verbatim from
  `positioning.md`; do not re-invent it here.)
- **2 minutes (the intro call):** the 30s line, plus the one problem it kills
  and the single proof that it does.
- **10 minutes (the demo framing):** the 2-minute version, plus the three
  capabilities that matter to *this* buyer and the outcome each unlocks.

## §2 — Who buys / why now

- **Who buys:** the economic buyer vs. the champion vs. the end user — name each
  and what each cares about. From the ICP in `positioning.md`.
- **Why now:** the change in the buyer's world that makes this urgent *today*
  (a cost that just grew, a tool that just failed, a deadline). Never
  manufactured urgency — a real trigger the research found.

## §3 — Talk track

The spine of the conversation, in order:

1. **Problem** — name the client's Tuesday: the recurring pain in their words.
2. **Cost of inaction** — what staying put keeps costing (time, money, risk).
3. **Solution** — how {{PROJECT_NAME}} removes that specific cost.
4. **Proof** — the demo-moment or metric from the catalog that makes it real.

Run it as a conversation, not a monologue: land each step only once the buyer
agrees with the one before.

## §4 — Framing capabilities as outcomes

Never sell a feature; sell the client's Tuesday it fixes. For each capability,
say the outcome first ("so you can…"), then show the feature as the reason to
believe. Draw these live from the catalog's top filled rows.

<!-- data:top-capabilities -->
| Capability | The client's Tuesday it fixes | Proof to show |
|---|---|---|
| _(from catalog)_ | _(so you can… — the filled outcome)_ | _(demo-moment / metric)_ |
<!-- /data:top-capabilities -->

_Static until wired: paste the top 5 filled (non-`_unwritten_`) rows from the
feature → benefit catalog. An `_unwritten_` outcome never appears in a pitch._

## §5 — Discovery questions

Earn the right to pitch by diagnosing first. Open questions that surface the
problem, its cost, and who decides:

- _What does **(the problem area)** cost you in a normal week?_
- _What have you tried, and where did it fall short?_
- _Who else feels this, and who signs off on fixing it?_
- _If this were solved, what would change for you?_

Adapt to the ICP; listen for the language the buyer uses and reuse it.

## §6 — Demo choreography

The live path, staged for effect — show the outcome, not the feature tour:

1. **Open on the pain** — start where the buyer already hurts.
2. **One capability, one outcome** — demo the single moment that lands hardest
   for this buyer (from §4), not the whole surface.
3. **Let the proof happen live** — run the demo-moment from the catalog; don't
   narrate over it.
4. **Close the loop** — tie what they saw back to the cost from §3.

Rehearse the failure modes: what you show if the live path breaks.

## §7 — Objections & the pricing conversation

- Handle objections by returning to evidence, not by pushing — see the deployed
  `objections-faq.md` and `battlecard.md` for the catalogued responses.
- **Pricing:** anchor on the value established in §3 before the number, then
  reference `business/pricing.md` for the live figure — never quote a price this
  doc restates (it would go stale). Let the cost-of-inaction frame the price as
  small beside it.

## §8 — Tone & anti-patterns

The pitch tells the truth, spoken. The writer's anti-manipulation rule (§0.2 —
no fabricated urgency, no confirm-shaming, no guilt copy) applies to the *spoken*
pitch exactly as it does to written copy:

- **No manufactured scarcity** — no "only today", no invented deadlines.
- **No confirm-shaming or guilt** — never make declining feel shameful.
- **No claim beyond the evidence** — if it isn't in `positioning.md` or the
  catalog's proof column, it isn't said aloud. An unproven capability stays
  silent, never embellished.
- **Match the buyer's register** — the venture's voice from the copy kit, not
  generic sales-speak.

## §9 — What's new this release

The one or two shipped changes worth leading with this release — auto-appended
from the catalog's newest rows.

<!-- data:whats-new -->
- _(newest capability + its outcome, once filled — else omit)_
<!-- /data:whats-new -->

_Static until wired: paste this release's new catalog rows whose outcome is
filled. Nothing `_unwritten_` is ever pitched._

---
_Claims trace to `positioning.md`; facts to the feature → benefit catalog. The
rep supplies delivery, never new claims. Live `data:*` regions are static
placeholders here — wired to the catalog in a later phase._
