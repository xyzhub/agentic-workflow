---
description: Upgrade an underperforming agent to a more capable model — or reset it to its default — via a project-level override in .claude/agents/ (reviewable, reversible, survives plugin updates).
argument-hint: [agent] [opus|sonnet|haiku|inherit | reset]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

Tune an agent's model for THIS project. Mechanism: a copy of the plugin agent
in `.claude/agents/<agent>.md` shadows the plugin's version — same prompt,
different `model:`. It's a file, so tuning is reviewable (commit it like any
harness change, §8) and reversal is deletion.

## No arguments → show the tuning table

One row per plugin agent (`${CLAUDE_PLUGIN_ROOT}/agents/*.md`): agent ·
default model (`model:` from the plugin file, else `inherit`) · active
override (from `.claude/agents/`, if any) · stamp version. Close with the two
one-liners: `/tune <agent> <model>` and `/tune <agent> reset`.

## `/tune <agent> <model>` — upgrade (or downgrade)

1. Validate: the agent exists in the plugin; the model is a known alias
   (`opus` / `sonnet` / `haiku` / `inherit`) or a full model id.
2. Copy the plugin's agent file **fresh** to `.claude/agents/<agent>.md`
   (never edit a stale copy — the base prompt may have changed), then:
   - set `model: <model>` in the frontmatter;
   - prefix the description with `TUNED (model: <model>) — ` so routers and
     humans see which variant is which;
   - add a first body line:
     `> Tuned from agentic-workflow v<plugin version> — model override only.
     Reset with /tune <agent> reset.`
3. Report: takes effect the next time the agent runs; recommend committing
   the override; during autopilot, also record the change in `decision-log.md`
   (a stronger model is a per-token cost change — the owner should see it).

## `/tune <agent> reset` — back to default

If `.claude/agents/<agent>.md` carries the tuned banner → delete it; the
plugin default takes over on the agent's next run. If the file exists WITHOUT the banner
(hand-rolled or hand-edited beyond tuning), do NOT delete — report what's in
it and let the human decide.

## When to reach for it

- **Upgrade** when an agent repeatedly earns REQUEST CHANGES, keeps tripping
  the one-corrective-retry rule, or its output needs constant human repair —
  that's a capability signal, not a prompt problem. Typical: `planner` or
  `reviewer` on a gnarly codebase.
- **Downgrade / reset** when the cost math says so, or after the hard phase
  passes. `chronicler`, `analyst`, and `writer` default to a mid-tier model
  deliberately (Efficiency pillar) — upgrade them only on observed quality
  gaps, not on principle.
- Tuning changes the MODEL, never the prompt. If the fix you want is
  behavioral, that's a plugin/protocol change via PR — not a tune.
