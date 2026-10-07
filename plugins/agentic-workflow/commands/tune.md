---
description: Retune an agent for THIS project via a reviewable, reversible shadow in .claude/agents/ — a Claude model tier, a second runtime (codex), per-agent effort, its tool list, its skills, the reviewer's boundary-escalation, or a prompt edit — each stamped with the plugin base version and a base hash, with diff, rebase and reset.
argument-hint: '[agent] [<model> | codex[:<model>] | effort <level> | tools <a,b,…> | skills <a,b,…> | prompt | boundary-escalation on|off | diff | rebase | reset]'
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

Tune an agent for THIS project. Mechanism: a copy of the plugin agent in
`.claude/agents/<agent>.md` shadows the plugin's version. When a shadow exists,
orchestrators run THAT copy of the agent. A shadow is a file, so every tune is reviewable
(commit it like any harness change, §8) and reversible (`reset` deletes it).

A shadow may change the **model**, the **runtime** (codex), the **effort**, the
**tools** list, the **skills** list, the reviewer's **boundary-escalation**, or
the **prompt** body — each composes with the others and each is stamped.

## No arguments → show the tuning table

Render the table FROM the registry tool (never re-parse frontmatter by hand, so
the table and a wrapper never drift):

```
node ${CLAUDE_PLUGIN_ROOT}/tools/agents.mjs --json --project .
```

One row per agent: **agent · source · phase · model · runtime · effort · skills ·
override kinds · base version** — `source` is `plugin` or `project` (a
`.claude/agents` file shadowing no plugin agent, listed too), `phase` is the
lifecycle phase or `on-demand` when no phase maps the role, `model`/`runtime`/
`effort`/`skills` from each agent's `effective`, `override kinds` from
`override.kind` (`—` when `override` is null; always `—` for a project-only
agent), `base version` from `override.base_version`. Close with the one-liners:

- `/agentic-workflow:tune <agent> <model>` — opus · sonnet · haiku · inherit · a full id
- `/agentic-workflow:tune <agent> codex[:<model>]` — run the role on the Codex CLI
- `/agentic-workflow:tune <agent> effort <low|medium|high|xhigh|max>`
- `/agentic-workflow:tune <agent> tools <a,b,…>` · `skills <a,b,…>`
- `/agentic-workflow:tune reviewer boundary-escalation on|off`
- `/agentic-workflow:tune <agent> prompt` · `diff` · `rebase` · `reset`

## How every tune writes the shadow

1. **Fresh copy, then compose.** Copy the plugin's current
   `${CLAUDE_PLUGIN_ROOT}/agents/<agent>.md` **fresh** (never edit a stale
   body — the base prompt may have moved), then re-apply every frontmatter key
   the OLD shadow already carried (`model`, `runtime`, `effort`,
   `boundary_escalation`, `tools`, `skills`) plus the one this tune sets, so
   tunes compose. **Exception:** if the old shadow is a **prompt** override (its
   body differs from the base), do NOT recopy — edit its frontmatter in place
   and recommend `/agentic-workflow:tune <agent> rebase` so the body catches up
   to the new base. A first-time tune and a `prompt` tune always copy fresh.
2. **Stamp the banner.** One banner form for every tune, as the first body line:

   ```
   > Tuned from agentic-workflow v<plugin version> (base sha256:<hash>) — <kind> override[ (<details>)]. Reset with /tune <agent> reset.
   ```

   `<hash>` is the first 12 hex of the base file's sha256:

   ```
   shasum -a 256 ${CLAUDE_PLUGIN_ROOT}/agents/<agent>.md | cut -c1-12
   ```

   (`override.base_sha` in the registry is this stamp read back from the
   banner; `rebase` re-hashes the cached old base and compares.) `<kind>` names what changed (`model`,
   `runtime`, `effort`, `boundary-escalation`, `tools`, `skills`, `prompt`);
   when several compose, list them. Pre-1.54 shadows whose banner has no
   `(base sha256:…)` stay valid — `reset` still deletes them and the registry
   reports `base_sha: null`.
3. **Stamp the description.** Prefix the frontmatter `description:` with
   `TUNED (<kind>: <value>) — ` (e.g. `TUNED (model: opus) — `).
4. **Report.** The tune takes effect the next time the agent runs; recommend
   committing the shadow. During autopilot, also record the change in
   `decision-log.md` (a stronger model, a runtime switch, a boundary opt-out —
   each is a cost or posture change the owner should see).

## `/agentic-workflow:tune <agent> <model>`

Validate the agent exists in the plugin and the argument is a known Claude tier
(`opus` / `sonnet` / `haiku` / `inherit`) or a full Claude model id. Set
`model: <model>` in the shadow; banner kind `model`. The model, runtime, effort,
tools, skills and boundary-escalation are independent — a model tune leaves the
others untouched.

## `/agentic-workflow:tune <agent> codex[:<model>]` — runtime

The shadow is ALSO a Claude Code project agent, so `model:` must stay a **valid
Claude tier/id** — leave it at the plugin default (or the current tuned tier),
never a foreign id (a `model: gpt-6-astra` here would break running the same
role under Claude Code, including the locked Fable override for security-boundary
reviews). The Codex model rides in the runtime value. Set:

- `runtime: codex:<model>` (default `<model>` is `gpt-6-astra`, the adapter's
  default, when bare `codex` is given);
- `effort: <effort>` — default `high` for `reviewer`, `planner`, `advisor`,
  `architect`; `medium` otherwise (an explicit `effort` in the args wins).

Banner kind `runtime` (compose with `effort` when both are set).

### `/agentic-workflow:tune reviewer codex` — print the boundary constraint

When the agent is `reviewer` and the target is a codex runtime, PRINT this
locked constraint alongside the report: a codex reviewer covers **routine
checkpoints only**. A checkpoint whose diff touches a security boundary — auth,
session credential, authorization, tenancy, money, schema, migrations, and
specifically the `.codex/rules/agentic-workflow.rules` guardrail file and the
sandbox-flag derivation — **stays on Fable** per WORKFLOW.md §5 convergence
rule 7, where the orchestrator overrides this tune for that one review — unless
the project's `.claude/agents/reviewer.md` carries `boundary_escalation: off`
(#91). The tune records the routine default; it never lowers the boundary review
unless that opt-out is set.

## `/agentic-workflow:tune <agent> effort <level>` — standalone effort

Accept `low | medium | high | xhigh | max`; `xhigh` and `max` carry a tune-time
note "only where the model supports it". Model and runtime are untouched; banner
kind `effort`. Honoured on **both runtimes**:

- **claude** — the orchestrator passes the Agent tool's effort parameter where
  the harness exposes one; otherwise it prepends `Effort: <level>.` as the first
  line of the role prompt at launch (`mission.md` step 2). The report says which applied.
- **codex** — the adapter passes `--effort <level>` straight through to the
  Codex reasoning-effort config (`model_reasoning_effort=<level>`), unchanged.

## `/agentic-workflow:tune <agent> tools <a,b,…>` — tool list

Set `tools: <a, b, …>` in the shadow; banner kind `tools`. The **codex adapter
derives its sandbox from `tools:`**, so a wider list widens the sandbox
(`deriveFlags`): any of `Write` / `Edit` → `-s workspace-write` (else
`-s read-only`); `WebSearch` / `WebFetch` → `--search`. Print that note so the
owner sees the sandbox consequence before committing.

## `/agentic-workflow:tune <agent> skills <a,b,…>` — skills list

Validate each name against `^[a-z0-9][a-z0-9-]*(:[a-z0-9][a-z0-9-]*)?$` BEFORE
writing (a crafted name must never reach a path); write the inline form
`skills: [a, b]` into the shadow; banner kind `skills`. Existence is not
required at tune time — a missing skill surfaces later (a Claude load warning, a
codex deviation) — but the report names which of **project**
(`.claude/skills/<name>/SKILL.md`) → **personal** (`~/.claude/skills/…`) →
**plugin** (`${CLAUDE_PLUGIN_ROOT}/skills/…`) resolved each one, and flags any
that resolved nowhere. An `agentic-workflow:<name>` entry pins the plugin's own
skill. Honoured on **both runtimes**: claude loads `skills:` natively; codex
inlines each as a `# Skill: <name> (preloaded — listed in skills:)` block via
the adapter (`resolveSkills`).

## `/agentic-workflow:tune <agent> boundary-escalation on|off` — reviewer only

Accepted for `reviewer` only (any other agent → a validation error naming this
rule). Write `boundary_escalation: on | off` into `.claude/agents/reviewer.md`;
banner kind `boundary-escalation`. Default (`on`, or the key absent) preserves
today's behaviour: the orchestrator escalates a boundary-class diff to Fable
regardless of the reviewer's tune (§5 rule 7). `off` means the tuned
model/runtime handles boundary diffs too — the orchestrator's choice stands —
while the reviewer still files a **process finding** when it judges the tier
miscalled. The opt-out is explicit, committed and (in autopilot) logged.

When setting `off` and the reviewer's effective runtime is `codex`, the report
prints one warning line: with escalation off, a Codex reviewer now also reviews
changes to `.codex/rules/agentic-workflow.rules` — the guardrail file that
constrains Codex itself — so a boundary diff that edits those rules is judged by
the runtime they govern. The setting still applies; this is a heads-up, not a
block.

## `/agentic-workflow:tune <agent> prompt` — edit the prompt body

Stamp a fresh copy (banner kind `prompt`) for the owner to edit the body below
the banner. A prompt tune is how a project carries its own house rules in a
role; the body then diverges from the base, so later model/runtime/effort/tools/
skills/boundary tunes edit the frontmatter **in place** (they do not recopy) and
recommend `rebase` when the base prompt moves.

## `/agentic-workflow:tune <agent> diff`

Print the unified diff between the shadow and the pinned plugin base:

```
diff -u ${CLAUDE_PLUGIN_ROOT}/agents/<agent>.md .claude/agents/<agent>.md
```

## `/agentic-workflow:tune <agent> rebase`

Three-way merge the project's edits onto the CURRENT plugin base:

- **old base** = `${CLAUDE_PLUGIN_ROOT}/../<base_version>/agents/<agent>.md`
  (the versioned plugin cache sibling named by the banner's `base_version`) —
  but ONLY when its `shasum -a 256 … | cut -c1-12` matches the banner's
  `base sha256:` stamp. If the sibling is absent or its hash does not match,
  report "old base unavailable" and print `diff` for a manual merge — never
  guess. A pre-1.54 shadow has no stamp, so its old base is always
  unavailable: manual merge via `diff`;
- **new base** = `${CLAUDE_PLUGIN_ROOT}/agents/<agent>.md`;
- merge: `git merge-file -p .claude/agents/<agent>.md <old base> <new base>`.
  On a clean merge (exit 0) write the result back and re-stamp the banner to the
  new base version + hash. On a non-zero exit, print the conflict markers and
  **write nothing** — the owner resolves and re-runs.

## `/agentic-workflow:tune <agent> reset` — back to default

If `.claude/agents/<agent>.md` carries the tuned banner (`^> Tuned from
agentic-workflow v`, old or new form, prompt tunes included) → delete it; the
plugin default takes over on the agent's next run. If the file exists WITHOUT a
banner (hand-rolled beyond tuning) → do NOT delete; report what's in it and let
the human decide.

## When to reach for it

- **Upgrade the model** when an agent repeatedly earns REQUEST CHANGES, keeps
  tripping the one-corrective-retry rule, or its output needs constant human
  repair — a capability signal, not a prompt problem. Typical: `planner` or
  `reviewer` on a gnarly codebase.
- **Downgrade / reset** when the cost math says so, or after the hard phase
  passes. `chronicler`, `analyst`, and `writer` default to a mid-tier model
  deliberately (Efficiency pillar) — upgrade them only on observed quality
  gaps, not on principle.
- **Prompt tune** when the behaviour you want is a **project rule** (a house
  convention, a section specific to this repo). When the fix is behaviour
  **everyone** needs, prefer a plugin/protocol change via PR — a prompt tune is
  for what is this project's alone, not a substitute for improving the plugin.
