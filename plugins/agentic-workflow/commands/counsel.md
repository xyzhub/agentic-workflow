---
description: Convene the advisor red-team on a pending decision — 2–3 lens-partitioned advisors in parallel, merged into a one-page counsel brief appended to the decision log. The human decides with the case against in hand.
argument-hint: '"<the pending decision>" [lenses e.g. technical,market,financial]'
allowed-tools: [Read, Write, Edit, Grep, Glob, Task]
---

Convene independent counsel on the decision in `$ARGUMENTS` (Agentic Workflow
§6 — the `advisor` role). Use at the human gates — a borderline V0 go/no-go,
the V1 scope+brand+model approval, V4 accept-findings-in-writing, the V5 launch
confirmation, growth-mission selection — or whenever the human asks. Not
ambient: counsel is convened, never volunteered at every step.

## 1. Frame the decision

State in one paragraph: the decision as pending, the current recommendation
and whose it is, and the artifacts behind it (idea.md, PRD, business docs,
architect memos, gap/audit reports — whatever applies). Ambiguity in the
framing is the first finding — resolve it before spawning anyone.

## 2. Spawn the advisors (parallel, lens-partitioned)

Default lenses: **technical**, **market**, **financial** — add **behavioral**
when the decision is engagement-critical (onboarding scope, pricing-page
design, notification strategy, game mechanics). Drop a lens that plainly
doesn't apply, honor an explicit lens list in `$ARGUMENTS`. Spawn one fresh
`advisor` per lens, in parallel, each given the framing plus its lens.
Each returns: the case against (ranked, evidence-classed), what would change
its mind, and a counsel verdict (proceed / proceed-with-changes / hold).

## 3. Merge into ONE page

- Union the risks; where two lenses independently surface the same risk, say
  so — convergent counsel carries more weight.
- Report the verdict **spread honestly** (e.g. "technical: proceed; financial:
  hold for measured costs") — do not average it into mush or bury a hold.
- Close with the cheapest evidence that would resolve the biggest disagreement.

## 4. Record

Append the brief to `docs/product/decision-log.md` (create from the bundled
template `${CLAUDE_PLUGIN_ROOT}/templates/decision-log.md` if missing), dated,
beside the decision it examined. When the human decides, the decision is
recorded as a dated locked decision pointing at the brief.

## Output

The one-page counsel brief. The human decides — counsel never blocks a gate,
and a unanimous "proceed" is still not an approval, just well-argued input.
