---
description: Take a feature from a one-liner to a ready-to-run mission in one command — an interactive interview, then the agent team drafts everything (brief, journeys, architect memos, metrics, counsel), one consolidated approval, and the planner authors the trio. The human answers questions; the team does the writing.
argument-hint: '"<feature one-liner>" [priority: top|normal]'
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, AskUserQuestion, Artifact, SlashCommand]
---

Plan the feature in `$ARGUMENTS` end to end — the full proper path (define →
journeys → shape decisions → red-team → decompose) with the human as
INTERVIEWEE and approver, never as author. **Precondition**: the project is
bootstrapped (`docs/WORKFLOW.md` exists); otherwise point at `/agentic-workflow:adopt` or
`/agentic-workflow:bootstrap` and stop. Route check first: if the feature is plainly
one-sitting-sized, say so and recommend `/agentic-workflow:start` (or `/agentic-workflow:fix`) instead of this
machinery — `/agentic-workflow:plan` is for mission-class features.

## 1. The interview (the only typing the human does)

Ask via AskUserQuestion — **batched, 3–4 questions per round, two rounds
max**, every question carrying smart candidate options drafted FROM the repo
and the one-liner (the human picks or corrects; free-text always available):

- **What & who** — what the feature does, who triggers it, the moment it
  matters. Offer interpretations of the one-liner, don't ask them to define it.
- **Scope edges** — propose a concrete NOT-in-v1 list as multi-select
  (deferred ≠ denied); propose the riskiest edge cases and ask which are in.
- **Priority & posture** — top-of-backlog or normal; risk posture (this
  selects checkpoint strictness and the gate policy recommendation);
  deadline if any.
- **Success** — offer 2–3 observable definitions of done (feeds acceptance
  criteria and the analyst's metrics).

Answers are recorded verbatim in the feature brief — they are the human's
words, everything else is drafted.

## 2. The team drafts (parallel, no human involvement)

Write the **feature brief** (`docs/product/decisions/<date>-<feature>-brief.md`:
problem, interview answers, acceptance criteria per journey, NOT-in-v1 list),
then spawn in parallel:

- `designer` — the feature's user journeys + IA (every state: empty, loading,
  error, degraded — the truthful-UI pillar applied to this feature).
- `architect` — option memos for every shape decision the brief exposes
  (2–3 options, tradeoffs, reversal cost, recommendation).
- `analyst` — how success is measured: events to add, the baseline, the
  number that says "done" per the interview's success definition.

Then convene the `/agentic-workflow:counsel` procedure on the consolidated proposal — 2–3
`advisor` instances (technical + financial; behavioral when engagement-
critical), strongest case against, one-page brief.

## 3. ONE approval moment

Present a single consolidated decision package (AskUserQuestion; the owner
channel gate when away, §12): the scope summary, each architect memo's
options as a pick-one question, the counsel brief attached, the priority and
gate-policy recommendation. Every answer lands as a **dated locked decision**
in the brief. This is the only gate — no drip-feed of questions before or
after.

## 4. Decompose and stage

Spawn the `planner` with the brief + locked decisions → the
`.plans/<feature>.{md,sessions.md,state.md}` trio (decisions arrive locked;
briefs pre-resolved; phases named; checkpoints per the chosen gate policy).
Record the priority: top → it IS the next mission (ledger + portfolio
backlog where a registry exists). Update the status page's in-flight region
and republish via the Artifact tool (§6.1 board-currency).

## 5. Hand off — or fire

Report: the trio's phase map, session count, locked decisions, and counsel's
verdict. Then ask ONE last question: start now? Yes → run `/agentic-workflow:mission
"<feature>" run` (SlashCommand); later → the ledger's `Next up:` and `/agentic-workflow:next`
both point at it.

## Boundaries

The human is interviewed and approves — never drafts. All the standing rules
apply unchanged: stop-the-line (the brief IS the acceptance criteria),
architect memos for shape decisions, counsel before commitment, dated locks,
the planner's read budgets. `/agentic-workflow:plan` produces a plan; it never builds,
merges, or deploys.
