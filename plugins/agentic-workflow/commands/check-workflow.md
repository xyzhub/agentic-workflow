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
3. **Rebase status** — `git fetch origin -q; git rev-list --count HEAD..origin/<default>`:
   how far behind the default branch.
4. **Gates** — optionally run the project test/typecheck gates for a green/red
   signal (skip if unchanged since last run).
5. **Mission ledger** — if `.plans/*.state.md` exists, report `Next up:` and any
   blocked items.
6. **Stage** — name the current venture stage (V0–V6) and the next gate.
7. **Protocol drift** — if `docs/WORKFLOW.md` exists, compare its
   `<!-- protocol-master: vX.Y.Z -->` stamp against the installed plugin
   version (`${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`). Older or
   missing stamp → 🟡 with the upgrade procedure: re-copy the bundled master,
   restore §10 (project profile) and the **Local amendments** section verbatim,
   write the new stamp, and diff-review the result like any other change.

## Output

🟢 / 🟡 / 🔴 overall, with the one or two things that most need attention next.
