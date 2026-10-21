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

Write the **local handoff** — a file git never tracks — from
`${CLAUDE_PLUGIN_ROOT}/templates/session-handoff.md` as a **re-read manifest —
pointers, not corpora**. Its path is `git rev-parse --git-path
agentic-workflow/session-handoff.md` (inside the git dir: per worktree, nothing
to commit, no `.gitignore`); `mkdir -p` its directory first. Outside a git repo:
`${XDG_STATE_HOME:-~/.local/state}/agentic-workflow/<cwd basename>/session-handoff.md`.

**When the handoff gate's block message names `handoff=`, `branch=` and `now=`,
use those values verbatim** — do not resolve or `mkdir` (the directory already
exists). Under the gate the only Bash this command may run is exactly
`git rev-parse --git-path agentic-workflow/session-handoff.md`,
`git branch --show-current` or `date -u +%Y-%m-%dT%H:%M:%SZ`; Read, Grep, Glob
and the Write/Edit of the handoff path are always allowed. Write
`docs/product/session-handoff.md` (tracked, shared) only when the human asks for
a shared handoff.

**Not the memory directory.** The agent's memory folder (`~/.claude/projects/…/memory/`,
`MEMORY.md`) is never a handoff: no hook reads it, so state written there is lost
at the next compaction. The handoff is the local file above.

- **Provenance stamp** — the single line under the title, refreshed on EVERY
  write: `_Written: <ISO-8601 UTC> · session <id> · branch <branch>_`. The
  timestamp must be exactly `date -u +%Y-%m-%dT%H:%M:%SZ` — the compact-resume
  hook parses this shape to judge freshness, preferring it over file mtime
  (copies and checkouts perturb mtime; content survives). A malformed stamp
  silently falls back to mtime, so a wrong stamp is worse than none. Write
  `session unknown` unless the gate or a snapshot named the session id — no hook
  relies on it (the gate's own marker proves this session wrote the file).
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

Read the local handoff first (the path above), then
`docs/product/session-handoff.md` if present — the newer `_Written:` stamp wins.
Follow only the pointers you need into a clean read budget, and continue from
**Next**. No transcript replay — the files
are the memory. (`/agentic-workflow:start` also loads this manifest when present.)

## Output

Confirm the manifest was written (path), the single **Next** action it records,
and — in default mode — the one-line instruction to start fresh and resume.
