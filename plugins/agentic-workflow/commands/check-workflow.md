---
description: Quick health check of the current work — branch, gates, ledger, stage.
allowed-tools: [Read, Bash, Grep, Glob]
---

Quick workflow health check. Report a traffic-light status at the end.

## Checks

1. **Branch** — `git branch --show-current`: on a feature branch, not the default
   one? Working tree clean, or document what's uncommitted.
2. **Commits ahead** — `git log origin/<default>..HEAD --oneline`: conventional
   format, descriptive messages.
3. **Rebase status** — if a remote exists: `git fetch origin -q; git rev-list
   --count HEAD..origin/<default>`: how far behind the default branch (skip
   when there's no origin yet).
4. **Gates** — optionally run the project test/typecheck gates for a green/red
   signal (skip if unchanged since last run).
5. **Mission ledger** — if `.plans/*.state.md` exists, report `Next up:` and any
   blocked items.
6. **Stage** — name the current venture stage (V0–V6) and the next gate.
7. **Protocol drift** — if `docs/WORKFLOW.md` exists, compare its
   `<!-- protocol-master: vX.Y.Z -->` stamp against the installed plugin
   version (`${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`). Older or
   missing stamp → 🟡, recommend `/upgrade-workflow` (it re-copies the master,
   preserving §10 and the Local amendments section verbatim).

## Output

🟢 / 🟡 / 🔴 overall, with the one or two things that most need attention next.
