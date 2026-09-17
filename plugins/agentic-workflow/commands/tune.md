---
description: Upgrade an underperforming agent to a more capable model, route it to a different runtime (codex) — or reset it to its default — via a project-level override in .claude/agents/ (reviewable, reversible, survives plugin updates).
argument-hint: [agent] [opus|sonnet|haiku|inherit | codex | codex:<model> | reset]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

Tune an agent's model — or its runtime — for THIS project. Mechanism: a copy of
the plugin agent in `.claude/agents/<agent>.md` shadows the plugin's version —
same prompt, a different `model:` and/or a `runtime:`. It's a file, so tuning is
reviewable (commit it like any harness change, §8) and reversal is deletion.

## No arguments → show the tuning table

One row per plugin agent (`${CLAUDE_PLUGIN_ROOT}/agents/*.md`): agent ·
default model (`model:` from the plugin file, else `inherit`) · **runtime**
(`claude` default, else the override's `runtime:`) · active override (from
`.claude/agents/`, if any) · stamp version. Close with the one-liners:
`/agentic-workflow:tune <agent> <model>`, `/agentic-workflow:tune <agent> codex[:<model>]`,
and `/agentic-workflow:tune <agent> reset`.

## `/agentic-workflow:tune <agent> <model>` — upgrade (or downgrade)

1. Validate: the agent exists in the plugin; the argument is a known Claude
   alias (`opus` / `sonnet` / `haiku` / `inherit`) or a full Claude model id, OR
   a runtime form (`codex` / `codex:<model>`).
2. Copy the plugin's agent file **fresh** to `.claude/agents/<agent>.md`
   (never edit a stale copy — the base prompt may have changed), then:
   - **Claude tier tune** — set `model: <model>` in the frontmatter; prefix the
     description with `TUNED (model: <model>) — `; body line:
     `> Tuned from agentic-workflow v<plugin version> — model override only.
     Reset with /tune <agent> reset.`
   - **Runtime tune** (`codex` / `codex:<model>`) — the file is ALSO a Claude
     Code project agent, so `model:` must stay a **valid Claude tier/id**: leave
     it at the plugin default (or the current tuned tier), never a foreign id —
     a `model: gpt-6-astra` here would break running the same role under Claude
     Code, including the locked Fable override for security-boundary reviews. The Codex
     model rides in the runtime value. Set:
     - `runtime: codex:<model>` (default `<model>` is `gpt-6-astra` — the
       adapter's default — when bare `codex` is given);
     - `effort: <effort>` — default `high` for `reviewer`, `planner`, `advisor`,
       `architect`; `medium` otherwise (the owner's global `low` is deliberately
       overridden per role here; an explicit `effort=` in the args wins).
     - prefix the description with `TUNED (runtime: codex:<model>, effort: <effort>) — `;
     - body line: `> Tuned from agentic-workflow v<plugin version> — runtime
       override (codex:<model>, effort: <effort>). Reset with /tune <agent> reset.`
3. Report: takes effect the next time the agent runs; recommend committing
   the override; during autopilot, also record the change in `decision-log.md`
   (a stronger model is a per-token cost change — the owner should see it).

### `/agentic-workflow:tune reviewer codex` — print the boundary constraint

When the agent is `reviewer` and the target is a codex runtime, PRINT this
locked constraint alongside the report: a codex reviewer covers **routine
checkpoints only**. A checkpoint whose diff touches a security boundary — auth,
session credential, authorization, tenancy, money, schema, migrations, and
specifically the `.codex/rules/agentic-workflow.rules` guardrail file and the
sandbox-flag derivation — **stays on Fable** per WORKFLOW.md §5 convergence
rule 7, where the orchestrator overrides this tune for that one review. The tune
records the routine default; it never lowers the boundary review.

## `/agentic-workflow:tune <agent> reset` — back to default

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
- Tuning changes the MODEL or the RUNTIME, never the prompt. If the fix you
  want is behavioral, that's a plugin/protocol change via PR — not a tune.
