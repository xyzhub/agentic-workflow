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

## Locked decisions (owner, 2026-10-16, at the single approval)

- **L1 Old installs:** "Yes, all mine" — every install is on an
  owner-controlled machine. Use Claude Code's native `renames` marketplace
  entry (memo D2-A); no frozen old build, no J4 session-start notice from the
  old plugin. J4 becomes: after `renames` moves the setting, the owner
  reinstalls once per machine and the new plugin's conform check tells the
  project to run `/xyz:sync`. The frozen-build design stays in the memo as
  the fallback if installs outside owner machines ever appear.
- **L2 Scope:** "Full rename to xyz" — plugin name and prefix `xyz`, folder
  `plugins/xyz/` (D1), migrator `tools/rename.mjs` in `/xyz:sync` (D3),
  rename every identifier with read-both where old data outlives code (D4),
  product name **The XYZ Protocol** (D5), version **2.0.0** (D6) — with the
  technical counsel conditions that still apply under D2-A: new hooks read
  `XYZ_CHILD || AGENTIC_WORKFLOW_CHILD`; `rename.mjs` rewrites
  `enabledPlugins` and `pluginConfigs` and reports (never rewrites)
  `permissions.allow` rules naming the old plugin; line-level `legacy-name`
  allowlist markers; no new `xyz:` hook-message prefix; the Missions change
  list is a P1 deliverable; one scratch-marketplace probe that `renames`
  validates and moves the setting, before the marketplace change ships.
- **L3 Repo name:** "Keep it out, note it" — `xyzhub/agentic-workflow` keeps
  its name; the rename is knowingly partial (the repo slug stays on the J2
  allowlist).
- **L4 Timing:** "Queue behind current goal item" — normal queue, careful
  posture: Fable plan-judge and checkpoints, human merges to `main`. The
  Orderly and Missions moves are obligation rows with estimates.
- **L5 Notice cadence:** superseded by L1 (no old-plugin notice).
- **Why the cheaper "public name only" option lost:** the owner chose the
  full rename at the approval with the counsel brief in hand (2026-10-16).
