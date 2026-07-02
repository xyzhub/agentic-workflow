---
description: Open a work session properly — route the work, branch, and load context.
argument-hint: [issue-number-or-description]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

Open a new work session (Agentic Workflow §4 "Open"). `$ARGUMENTS` is an optional
issue number or short description.

## 1. Route the work (§1)

Name the venture stage, then pick the altitude:
- **Task** — typo/config/one-file fix with an obvious test → branch, fix, PR.
- **Session** — one sitting of focused work → this lifecycle.
- **Mission** — can't pre-resolve all targets in one pass → run `/mission
  "<goal>"` (it spawns the `planner` to author the trio, then drives it) instead
  of starting to code.

## 2. Branch

```bash
git fetch origin -q
git checkout <default> && git pull -q
git checkout -b <type>/<short-description>    # feat/…, fix/…  — never the default branch
```

## 3. Load context

- Read the project's conventions file and `docs/WORKFLOW.md`.
- If continuing a mission, read `.plans/<mission>.state.md` → `Next up:` → that
  brief, and follow it (including its read budget).
- If the work maps to a tracked issue, read it and confirm acceptance criteria
  exist (stop-the-line: no implementation without them).

## Output

State the stage, altitude, branch created, and the acceptance criteria you're
working to. Then begin the smallest change that meets them.
