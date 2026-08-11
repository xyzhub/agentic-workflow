---
status: living
owner-agent: planner
refresh-trigger: event
---

# Obligations register

_The repo-level parking place for deferred obligations that outlive a single
mission (WORKFLOW.md §5) — a promised action with an observable condition and
no trigger yet, probed at beats (`/agentic-workflow:settle`, the
`obligations-due` hook, `check.md`) instead of being lost the moment a
mission's own `## Closing` block closes. Deploys to `.plans/OBLIGATIONS.md`. A
`[~]` row in any mission ledger's `## Closing` block promotes here with a
verbatim copy and a `→ OB-<n>` back-reference — this file is where that
promise survives its mission._

_Grammar, one line each:_ `- [ ] OB-<n> · added YYYY-MM-DD (<source>) — do:
<action> — when: <observable condition> — probe: <command | manual>` _where
`<n>` is the next unused integer, `<source>` names who added the row (a
mission-ledger path or an agent name), and `<observable condition>` is a state
a probe can check — **never a clock** ("weekly" is not a condition; "a new
compaction record exists in the corpus" is). `probe:` is either a runnable
command (backticked) or the literal word `manual` when no command can decide
it. Rows are **never deleted**: a fired row keeps its line and appends
`· fired YYYY-MM-DD (<evidence>)`._

<!-- - [ ] OB-1 · added 2026-01-01 (planner) — do: re-measure the X threshold — when: a new Y record exists in the corpus — probe: `grep -c Y-marker .plans/*.log` -->

(none)
