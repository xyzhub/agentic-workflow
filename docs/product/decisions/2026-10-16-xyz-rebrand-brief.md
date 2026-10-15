# Feature brief — xyz-rebrand (2026-10-16)

## Problem

The plugin's command prefix `agentic-workflow:` is long to type and read
(1,027 mentions across 156 files in this repo). Since v1.62.0 the default
attribution credits "The XYZ Protocol" while the product is still called
"Agentic Workflow" — two names for one thing. The owner asked to plan a rename.

## Interview answers (owner's words, 2026-10-16)

- **What:** "Full rebrand to xyz" — the product becomes **The XYZ Protocol**;
  the plugin name and command prefix become `xyz` (`/xyz:mission`, install
  `xyz@xyz`).
- **Not in v1:** "GitHub repo rename, Missions app changes, Rewriting history,
  Old-name alias".
- **Priority & posture:** "Normal queue, careful" — queued after the current
  goal-statement item; Fable checkpoints; the human merges the PR to `main`.
- **Success:** "Zero live old references, Fresh install works, Existing
  project migrates, Old install told how to move".

## Acceptance criteria, per journey

**J1 — fresh install.** Installing `xyz@xyz` in a clean session lists the
`/xyz:*` commands and skills, every hook fires, and `claude plugin validate`
passes.

**J2 — this repo (dogfood).** A grep for `agentic-workflow:` (and the bare
plugin id `agentic-workflow` used as an identifier: paths, `enabledPlugins`,
cache paths, rule files) across live instructions — commands, skills, agents,
hooks, templates, tools, README, `docs/WORKFLOW.md`, AGENTS.md/CLAUDE.md,
`.codex/rules` — returns nothing outside an explicit allowlist (history
records, the migration code itself). Every test suite is green.

**J3 — existing project migrates.** `/xyz:sync` on an already-adopted project
(e.g. Orderly) rewrites that project's live references (its
`docs/WORKFLOW.md`, AGENTS.md/CLAUDE.md, open ledgers' command mentions,
`.claude/settings.json` `enabledPlugins`, tunes in `.claude/agents/`) and its
next session works with no manual edits. Closed history is left alone.

**J4 — old install told how to move.** A final `agentic-workflow` release
prints a clear one-time notice at session start: uninstall
`agentic-workflow@xyz`, install `xyz@xyz`, run `/xyz:sync`.

## NOT in v1 (deferred, not denied)

- Renaming the GitHub repo `xyzhub/agentic-workflow`.
- Changes inside the Missions app (it adapts in its own session; this mission
  documents what it must change — folds into OB-30).
- Rewriting history: old ledgers, CHANGELOG entries, JOURNEY, decision
  records keep the old name.
- An old-name alias / compatibility shim plugin.
