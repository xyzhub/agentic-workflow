# {{PROJECT_NAME}} — Product Requirements (V1)

_What the MVP is — and, just as load-bearing, what it deliberately is NOT. The
V1 definition deliverable: the `designer` owns the journeys and IA, the
`architect` shapes the data model and stack as option memos, the `analyst`
defines success, the `business` agent supplies the model. The exit gate is a
human approval of scope — no implementation without acceptance criteria (§0)._

## Problem recap
_Carried from `docs/product/idea.md`, tightened: who has the problem, who pays,
and the one-paragraph shape of the solution. Don't restate the whole idea doc —
link it and summarize what V1 commits to._

## MVP scope
_The smallest set of capabilities that delivers the core value. Each is a
capability, not a task list._

## NOT in this version
_The explicit deferred list (deferred ≠ denied). This is the efficiency pillar's
scope discipline (§0.2) — writing down what's out is what keeps V1 shippable._

- _feature / surface / integration held for later._

## User journeys → the UX brief
_The personas, journeys, and information architecture live in the `designer`'s
UX brief (`docs/product/ux-brief.md`) — the single home for "who and how", so it
isn't duplicated (and left to drift) here. This section carries only what scope
approval needs: the **list of in-scope journeys** and their acceptance criteria
(the stop-the-line hook — no build without them). Detail lives in the brief._

→ _`docs/product/ux-brief.md`_

- _Journey name — **acceptance criteria** the V1 gate approves._

## Data model sketch
_The core entities and relationships at V1 resolution — the shape, not the full
schema. Authored as an option memo by the `architect` under
`docs/product/decisions/`; link the chosen memo here rather than re-deciding._

→ _`docs/product/decisions/<date>-data-model.md`_

## Stack decision
_The stack/runtime/hosting choice, likewise an `architect` option memo
(2–3 options, reversal cost, recommendation). Link the memo; the human's pick is
a dated locked decision._

→ _`docs/product/decisions/<date>-stack.md`_

## Success metrics
_Owned by the `analyst`: the observable number(s) that say "the MVP works" —
each with the event that measures it and the baseline. Unmeasured stays
"unmeasured"; don't invent a target._

## Business model
_Link the `business` agent's model and pricing hypothesis
(`docs/product/business/`) — the value metric shapes both scope and the data
model above, so it belongs in scope review, not after it._

---
_Exit V1 → V2 when the **human approves this scope** (with the business model and
a chosen brand direction). `/agentic-workflow:counsel` convenes the `advisor` red-team on the
approval first. Stop-the-line: no implementation without acceptance criteria._
