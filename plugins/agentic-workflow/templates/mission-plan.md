---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: {{MISSION_NAME}} — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide. Deploys to `.plans/{{MISSION_NAME}}.md`._

<!-- If this trio was made from an existing plan document, keep the provenance:
Converted from `<path>`, <YYYY-MM-DD>. -->
<!-- Each replan appends a dated line: Replan <YYYY-MM-DD> — what changed and why. -->

Goal: _one sentence — the outcome this mission delivers._

Estimate: _1 session (the default: one brief, one one-shot review, staging →
verify → PR). With `phases`: N sessions — count every brief + every checkpoint
only (a corrective is counted when it fires, never pre-booked), and justify the
number per phase below. The ledger mirrors this as `Estimate: N sessions`; a rise
is a dated locked decision, never a silent edit._

## Tasks

_Numbered, each with concrete acceptance criteria a reviewer can check against
the diff. Keep them outcome-shaped, not step-shaped. Number every criterion
`AC-N` — ids are stable for the mission's life; briefs and verdicts cite them._

1. **_Task name_** — _what it does._
   - AC-1 _the observable condition that proves it's done (a test asserts X;
     endpoint returns Y; existing tests stay green)._
   - AC-2 _…_

## Value sourcing

_Every value the feature produces or displays (a total, a date, a tenant, a
currency rule, a constant) → where it comes from, so no builder invents one
mid-build. Source kinds: `input` (a field/form) · `column` (`table.column`) ·
`derivation` (a formula with operands — must cite file:line or an issue
comment, else it is an `open question`) · `locked decision` (`YYYY-MM-DD` +
memo path, lifted from the memo's "Values this decision settles") · `open
question` (routed to Open questions below, never a REVISE). A literal
`none — no values produced` row is valid when the table is otherwise empty._

| AC | Value | Source kind | Where |
|---|---|---|---|
| _AC-1_ | _order total_ | _derivation_ | _`sum(line.qty × line.unit_price)` — `server/orders.ts:42`_ |

## Locked decisions

_Dated entries the execution sessions must honor — never re-litigated mid-flight.
A decision that new evidence invalidates becomes an open question below, not a
silent change (unlocking is the human's call). An owner's "build anyway" over a
builder's `deviation` stop lands here as `Assumed <date> — owes <decision>;
built on <assumption>; authorized by <who>`, mirrored as one line in the
ledger's Open questions, and stays until ratification **edits that line in
place** to `ratified <date>` (`/agentic-workflow:settle` surfaces it until then; it
never blocks a merge)._

- _YYYY-MM-DD — the decision, stated so a fresh agent needs no more context._
- _Assumed YYYY-MM-DD — owes <decision>; built on <assumption>; authorized by <who>._

## Risks

_What could go wrong and the mitigation. "None significant" is a valid answer for
a small, single-surface mission — say so rather than inventing risk._

- _the risk → how it's handled or bounded._

## Open questions

_Anything unresolved that execution needs — each carrying the planner's
**recommended** option so the human decides between digested choices, never from
scratch. These go to the human BEFORE `/agentic-workflow:mission` drives execution._

- _the question — **Recommendation:** the option the planner would pick, and why._

---
_The `.plans/{{MISSION_NAME}}.sessions.md` briefs execute these tasks;
`.plans/{{MISSION_NAME}}.state.md` tracks progress. Resolve every open question
before execution starts._
