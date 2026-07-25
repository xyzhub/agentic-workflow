---
status: semi-static
owner-agent: analyst
refresh-trigger: event
---

# {{PROJECT_NAME}} — Tracking Plan

_The measurement spec: every event the product emits, the properties it carries,
and — above all — **the question it answers**. Deployed to
`docs/product/engineering/tracking-plan.md`. Owned by the `analyst`, the single
source `marketing` (funnel), `business` (unit economics), and `ops` (trends) all
draw from. It is **semi-static** (refreshed on the event that changes what's
measured: a new surface, a new success definition), kept TRUTHFUL against the
code (stale-doc rule §8): an event the code emits that isn't here — or a row here
no code emits — is a finding. The honesty rule governs every number below:
**unmeasured stays "unmeasured"; a number is never invented.**_

## Success definitions
_What "working" means for this product, stated as measurable outcomes BEFORE the
events that measure them — so an event with no question to answer is caught as
noise. Each carries its **baseline** (where we are now, or `unmeasured`) and its
**"done" number** (the target that says the definition is met)._

| Success definition | Baseline | "Done" number | The event(s) that measure it |
|---|---|---|---|
| _(e.g. new user reaches first value)_ | _(current %, or `unmeasured`)_ | _(the target)_ | _(→ event names below)_ |

## Events
_One row per event: its name, the properties it carries, the question it answers,
the surface that emits it, and whether it's live. An event no question needs is
noise to delete; a question no event answers is a gap to fill._

| Event | Properties | Question it answers | Emitting surface | Instrumentation status |
|---|---|---|---|---|
| _(e.g. `signup_completed`)_ | _(e.g. `method`, `plan`)_ | _(e.g. "how many visitors convert?")_ | _(e.g. web onboarding)_ | _`planned` \| `wired` \| `verified`_ |

_Instrumentation status: **planned** (specified, not built) · **wired** (code
emits it) · **verified** (`analyst` has confirmed it fires with the right
shape). Instrumentation is code — the `analyst` SPECIFIES events as a brief with
acceptance criteria; `backend`/`frontend` wire them through the normal machinery
with review. The `analyst` does not edit product code._

## Baseline & measurement windows
_The reference numbers this plan compares against, each with its source, the time
window, and the date pulled (the honesty rule: measured / estimated / unknown,
never averaged silently). The baseline is what makes a later movement legible._

## Open measurement gaps
_Questions the product should answer but no event yet does — the queue for the
next instrumentation brief. Listing an unknown plainly beats a plausible
invention (the honesty rule)._

---
_The `analyst` authors and maintains this at V3+; it defines launch metrics with
`marketing` at V5 and feeds the V6 operating loop. It specifies and measures —
it never invents a number, and unmeasured stays unmeasured. The `sales-proof-points.md`
kit doc draws its figures ONLY from the events verified here. Related system
shape lives in `docs/product/engineering/architecture.md`._
