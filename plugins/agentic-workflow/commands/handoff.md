---
description: Snapshot the live session's working state to a re-read manifest so a FRESH agent can continue without the diluting auto-summary. Use mid-session when context is filling — it writes pointers, not a transcript. Git-independent; unlike /end it does not commit or close the work.
argument-hint: '[resume]'
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

Protect the main agent from context-window bloat (Agentic Workflow §2, principle
1; §6.2). The window fills mostly with tool output, and when it nears the limit
the harness auto-summarizes older context — a paraphrase that **dilutes
fidelity**. This command's job is to make that auto-summary unnecessary: capture
the working state in a file a **fresh session re-reads verbatim**, so nothing is
compressed.

Not `/agentic-workflow:end`: this does not commit, push, or close the session — it can run many
times mid-work. Not the `remember` skill either — this is the workflow's own,
tuned to its artifacts (ledger, decision log, plan file).

## Default — write the handoff

Write `docs/product/session-handoff.md` (from
`${CLAUDE_PLUGIN_ROOT}/templates/session-handoff.md` if missing) as a **re-read
manifest — pointers, not corpora**:

- **Goal** — what this session is achieving.
- **Locked decisions + why** — so the fresh agent never reopens them.
- **State** — done / in-flight (to what state) / **next** (the exact next step).
- **Pointers** — branch, PRs, plan/ledger path, the `path:line-range` files in
  play, and the verify command + last signal. Name them; never paste their
  bodies (that is the bloat we're avoiding).
- **Open questions** — each with a recommendation.

When a mission is active, its `.plans/<mission>.state.md` ledger is the richer
record — update THAT and keep this snapshot light, pointing at it. Do not copy
file contents into the manifest; a reader follows the pointers on demand.

## Then — signal the fresh start (the human fires)

Tell the human plainly: context is filling, the handoff is written, and the
clean move is to **start a fresh session** (`/clear` or a new run) and say
"resume" — a new agent will read the manifest and continue. A fresh agent at low
context is sharper than a tired one near the limit; a clean re-read beats a
lossy summary. Only the human opens a new session — you prepare, they fire.

## `resume` — continue from a handoff

Read `docs/product/session-handoff.md`, follow only the pointers you need into a
clean read budget, and continue from **Next**. No transcript replay — the files
are the memory. (`/agentic-workflow:start` also loads this manifest when present.)

## Output

Confirm the manifest was written (path), the single **Next** action it records,
and — in default mode — the one-line instruction to start fresh and resume.
