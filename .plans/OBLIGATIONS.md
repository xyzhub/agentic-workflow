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

- [ ] OB-1 · added 2026-08-11 (.plans/compaction-continuity.state.md:75) — do: re-measure the handoff-budget n=1 compaction bands (the ≈6.73 bytes/token anchor and the trigger threshold are single-observation, config-dependent figures) — when: upstream compaction behavior changes OR the local transcript corpus gains ≥3 new true-compaction records — probe: manual
- [ ] OB-2 · added 2026-08-11 (.plans/compaction-continuity.md:142) — do: run the D4b cross-mission token re-measurement so quoted figures outgrow n=1 per corpus — when: ≥2 further missions' transcripts exist post-v1.43 — probe: manual
- [ ] OB-3 · added 2026-08-11 (.plans/deferred-obligations.state.md S4) — do: reap the three concluded integration branches (mission/compaction-continuity-integration, mission/context-economy-integration, mission/sales-doc-architecture-integration), local and remote — their merge PRs are closed and CI was green on each merge commit, but the protected set in commands/settle.md shields all mission/*-integration branches unconditionally — when: the human rules the concluded-integration class reapable (or the protected-set clause is refined to shield only unconcluded missions) — probe: manual
