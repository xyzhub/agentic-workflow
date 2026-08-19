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

- A durable rule → edit `docs/WORKFLOW.md` — in its **Local amendments**
  section, so `/agentic-workflow:sync` preserves it — via PR like any other change.
- A stale doc → fix it now (stale-doc rule).
- **Any action that is work rather than a rule** (a fix to make, a guard to
  add later, a re-measure) → an issue in the queue (§4; `gh issue create
  --label type/debt --label size/…`), not a bullet in a markdown file. The
  retro's output links the numbers.
- **A guardrail written during the incident** (a script, a runner, a check in
  the scratchpad) → commit it in THIS session (orderly §12 LA-4: one sat in a
  scratchpad for a day, protecting nothing).
- A project-specific fact → the conventions file (CLAUDE.md/AGENTS.md) — with
  an **anchor** (path/script/symbol), **rewriting in place** any line it
  supersedes (§6.1: never append a second truth; the conform ladder checks the
  anchors every session start).
- A standing steer that proved durable across missions → graduate it from the
  ledger's `## Standing steers` into the conventions file (same anchor +
  rewrite-in-place rules); the steer stays in the ledger as history.
- An agent-behavioral lesson → auto-memory (not both places).
- A missing guardrail → propose a hook change.
- A behavioral regression an automated check could have caught → add a scenario
  to the project's eval suite (§10), if it has one.
- A "have we tried this before?" moment → if §10 records a memory/recall store,
  save the lesson there too — repo docs remain the system of record.

## Output

A short list: lesson → action taken (or PR opened). Retro findings that change
the protocol are themselves reviewed and merged like source.
