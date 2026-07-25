---
status: semi-static
owner-agent: analyst
refresh-trigger: release
---

# {{PROJECT_NAME}} — Proof points

The measured evidence the rest of the kit cites: the numbers, and — once there are
real clients — the case studies. This is the **one doc in the kit the `marketing`
agent does not fill with claims**: every number here comes from the `analyst`, and
an unmeasured value stays `_unmeasured_`. The discipline is the whole point — a
fabricated proof point is worse than none, because it's the number a buyer checks.

## The no-fabrication rule (read before editing)

- **Numbers come ONLY from the `analyst`.** The `analyst` reads the tracking plan
  and reports measured values; no one else writes a number into this file. If the
  `analyst` hasn't measured it, it is `_unmeasured_` — never estimated, rounded up,
  or borrowed from a competitor's deck.
- **`_unmeasured_` stays `_unmeasured_`.** The sentinel is the honest resting
  state. A rep citing this doc shows only filled rows; an `_unmeasured_` metric is
  silent, never guessed.
- **Case studies are claim-gated on real clients.** No invented customers, no
  composite "a typical user", no anonymized fiction. The case-study section stays a
  template until a real, named (or genuinely consented-anonymous) client exists —
  deferred per the brief's "NOT in v1", not denied.
- **Every number carries its source.** Metric, value, the event/measurement it
  came from, and the date — so a stale or contested number is auditable.

## Measured metrics

The numbers, each sourced to the `analyst`'s tracking plan. Fill a value only when
it's measured; leave `_unmeasured_` otherwise.

<!-- data:metrics -->
| Metric | Value | Source (event / measurement) | As of |
|---|---|---|---|
| _(e.g. time-to-first-value)_ | `_unmeasured_` | _(the tracking-plan event that would measure it)_ | _(date, once measured)_ |
| _(e.g. task success rate)_ | `_unmeasured_` | _(measurement source)_ | `_unmeasured_` |
| _(e.g. cost per run)_ | `_unmeasured_` | _(measurement source)_ | `_unmeasured_` |
<!-- /data:metrics -->

_Seed rows are **illustrative** — replace the metric names with this venture's
real success metrics from `prd.md`; the values stay `_unmeasured_` until the
`analyst` measures them. The `analyst` owns what goes inside the markers._

## Case studies _(claim-gated — deferred until real clients exist)_

**Empty by design.** A case study requires a real client, real consent, and a real
outcome. Until one exists, this section is a template — writing a fictional or
composite case study here is a fabrication, and the kit forbids it (brief: "NOT in
v1").

When a real client and consent exist, one entry per study:

- **Client:** _(real, named or genuinely-consented-anonymous — never invented)._
- **Situation:** _(the problem they had, in their words)._
- **What shipped:** _(the capability, cited to `feature-benefit-catalog.md`)._
- **Measured result:** _(the number, from the `analyst` — `_unmeasured_` if not
  yet measured; never estimated)._
- **Consent:** _(dated confirmation the client approved being cited)._

## How the kit reads this file

- **`sell-sheet.md` / `playbook.md`** cite a metric here only when it's filled —
  an `_unmeasured_` value never reaches a pitch.
- **`objections-faq.md`** points here for the "how do I know it works?" answer;
  the honest answer is the measured number, or "not yet measured", never a guess.

---
_Numbers come ONLY from the `analyst`; `_unmeasured_` stays `_unmeasured_`; case
studies are claim-gated on real, consented clients (deferred per "NOT in v1").
Every number carries its source and date. The `analyst` owns this doc — the one
kit doc `marketing` does not fill with claims._
