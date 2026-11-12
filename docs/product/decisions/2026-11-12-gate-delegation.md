# Gate delegation — decision record (2026-11-12)

_Owner and orchestrator, in the xyzhub/agentic-workflow session. A decision
record, not a plan: part 1 goes into the continuous-operation replan; part 2
is a later plan after continuous-operation closes._

## The owner's words (verbatim)

- "a separate independent agent could run on behalf of the human in the loop
  and answers the gates and questions as they come"
- "or an MCP tool that allows the runner to communicate the gates to any LLM
  the project owner is using, where it can notify the human using whatever LLM
  provider they're using, and can be configured to auto answer some questions
  based on the human's settings"
- "why can't the compass agent with a set north-star answer the gates?"
- "why can't we do the same for other types of gates? for example business
  agent or a new accounting agent can answer money and commitments gates, the
  marketing agent can answer the publishing gates, and if a post is
  questionable, it can rely on the human or another agent to validate. and so
  on."
- "also we can create a human agent, that learns from each decision a human
  makes on the gates until it becomes ready to answer for them."
- On the recommendation below: "go".

## The model: delegated authority with limits

Gates can be answered by agents the way staff approve within limits an owner
sets. The protocol already allows it: the human-fired defaults are the owner's
rules, and a dated, scoped delegation can hand a gate type to an agent. Five
conditions make it safe:

1. **Hard limits live outside the agent** — spend caps on the account itself,
   publish rights only via tokens scoped to named accounts. A wrong or tricked
   agent still cannot exceed them.
2. **Proposer never approves its own proposal** — e.g. marketing drafts, a
   separate reviewer approves; ideally a different model.
3. **Agents that read untrusted public text recommend, never approve**
   (Open Canvas ideas and bug reports).
4. **Reversible first** — staging releases, drafts, small spends delegate
   early; production releases, client email, contracts last and tighter.
5. **Every automatic answer is logged and revocable** — who answered, under
   which rule; one switch returns a gate type to the owner.

Intended mapping (owner's settings decide; nothing here is enabled by
default):

| Gate type | Answerer | Back to the owner when |
|---|---|---|
| Direction and priority | compass (north star) | a large change of direction |
| Money and commitments | business or a new accounting agent | over the cap, or a new recurring cost |
| Publishing | marketing proposes, a separate reviewer approves | reviewer unsure, or a named person or client |
| Releases | reviewer + green checks (staging first) | production, unless a specific signed delegation |
| Facts only the owner knows | nobody | always |

**The human agent (owner's twin)** earns trust by evidence:

1. **Shadow mode** — before the owner answers each gate, it records a
   predicted answer; it does not answer.
2. **Agreement per gate type** is measured (e.g. 29 of the last 30).
3. **The owner promotes a type** past a bar the owner sets (e.g. ≥ 95 % over
   30); promotion is always the owner's explicit action.
4. **Spot checks continue** (~1 in 10 still goes to the owner); a
   disagreement demotes the type back to shadow.
5. It learns from the recorded decisions and the owner's reasons, not from
   retraining; anything unseen goes to the owner.

## Part 1 — in the continuous-operation replan (now)

`gate.mjs` is designed so delegation can be added later without rework:

- every gate carries a **type** (direction, money, publish, release, fact,
  other);
- an owner-written **policy file** says, per type, who answers: `owner`,
  `rule` (exact match on an owner-written rule), or a named agent, with
  limits; default for every type is `owner`; nothing auto-answers unless the
  owner wrote it;
- every answer records its **source** (owner via which channel, rule id, or
  agent) and is revocable per type;
- **shadow predictions are logged from day one**: a field for a predicted
  answer and its predictor, so the twin can start learning from the first
  gate. v1 may log only, with no predictor running;
- an answer relayed by another model is never the owner's consent: an
  owner answer must carry proof it came from the owner (the channel's own
  identity, or a one-time confirmation).

## Part 2 — a later plan, after continuous-operation closes

- the answering agents (compass for direction, business/accounting for money,
  marketing + separate reviewer for publishing) with external hard limits;
- the owner's twin: shadow predictor, agreement measure, promote/demote;
- an MCP gate channel so gates reach whatever AI assistant the owner uses,
  with owner-answer proof;
- the Missions app as one more channel (missions-engine L5 asks).
