# Mission: {{MISSION_NAME}} — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide. Deploys to `.plans/{{MISSION_NAME}}.md`._

<!-- If this trio was made from an existing plan document, keep the provenance:
Converted from `<path>`, <YYYY-MM-DD>. -->
<!-- Each replan appends a dated line: Replan <YYYY-MM-DD> — what changed and why. -->

Goal: _one sentence — the outcome this mission delivers._

## Tasks

_Numbered, each with concrete acceptance criteria a reviewer can check against
the diff. Keep them outcome-shaped, not step-shaped._

1. **_Task name_** — _what it does._ Acceptance: _the observable condition that
   proves it's done (a test asserts X; endpoint returns Y; existing tests stay
   green)._

## Locked decisions

_Dated entries the execution sessions must honor — never re-litigated mid-flight.
A decision that new evidence invalidates becomes an open question below, not a
silent change (unlocking is the human's call)._

- _YYYY-MM-DD — the decision, stated so a fresh agent needs no more context._

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
