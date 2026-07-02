---
description: Retrospective on a session or mission — turn lessons into workflow/doc improvements.
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

Run a retrospective (Agentic Workflow §8). The goal is not a feelings check — it
is to convert what was learned into concrete changes to the workflow, the docs,
or memory.

## Reflect

- **What worked** — patterns worth keeping (reuse of an existing engine, a good
  brief, a caught regression).
- **What bit us** — incidents, rework, surprises. For each: root cause, and the
  rule that would have prevented it.
- **What was slow** — wasted context, exploration that a pre-resolved brief would
  have saved, a gate that was too weak.

## Turn each lesson into an action

- A durable rule → edit `docs/WORKFLOW.md` (a pillar rule, a gotcha, a gate)
  via PR like any other change.
- A stale doc → fix it now (stale-doc rule).
- A project-specific fact → the conventions file or repo docs.
- An agent-behavioral lesson → auto-memory (not both places).
- A missing guardrail → propose a hook change.

## Output

A short list: lesson → action taken (or PR opened). Retro findings that change
the protocol are themselves reviewed and merged like source.
