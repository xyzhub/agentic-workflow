# {{PROJECT_NAME}} — Decision memo: {{DECISION_SLUG}}

_A shape-before-build decision, digested so the human chooses between options
instead of doing the analysis. Authored by the `architect` (WORKFLOW.md §6);
one file per decision under `docs/product/decisions/<date>-<slug>.md`. This is
NOT the autopilot `decision-log.md` (that logs choices already made) — this is
the analysis that PRECEDES a choice. Label every claim **fact** (cited) /
**inference** / **assumption**, as the researcher does; verify library and
platform claims against current docs, not memory._

## The question
_One sentence — the decision to be made — plus what it constrains downstream (the
schema, the stack, the sync strategy… the things that get expensive to change
later). The most expensive decisions are cheapest to get right here; V2's own
math says retrofitting costs 10×._

## Options
_2–3 genuinely different options — not tints of one. An option that fights the
repo's existing conventions or stack is not an option. Boring-first: simple infra
until scale is a measured problem._

### Option A — _name_
- **How it works here** — _in THIS repo's reality (files, stack, team), not in
  the abstract._
- **Tradeoffs** — _what it's good and bad at._
- **Operational cost** — _what it costs to run and maintain._
- **Cost of reversal** — _how hard it is to leave later. The option that's cheap
  to walk back is worth a premium._

### Option B — _name_
- **How it works here** — _…_
- **Tradeoffs** — _…_
- **Operational cost** — _…_
- **Cost of reversal** — _…_

## Recommendation
_The option the architect would pick, with rationale — AND the strongest case
against it, stated here rather than left for the reader to guess. Prefer designs
where misuse is unrepresentable (constraints, types, additive migrations) over
designs guarded by discipline._

## What would change the answer
_The evidence or scale threshold at which a different option wins — the
measurement that would justify the more complex path. Names the trigger to
revisit this decision._

---
_The architect consults; the **human decides**. The choice lands as a dated
locked decision (in the mission master plan or `decision-log.md`) pointing at
this memo. The `advisor` may argue against it at its gate — this memo is the
advisor's input, not its rival._
