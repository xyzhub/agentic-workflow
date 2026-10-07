---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: gatehouse-asks — master plan

_Authored by the `planner` 2026-10-07 on `mission/gatehouse-asks` (cut from
main @ eaac7fe). Scope = the Proposal sections of GitHub issues #91–#96
("Gatehouse asks"), treated as locked; this plan decomposes, it does not
re-decide. Ships as plugin v1.54.0._

Issue: #91, #92, #93, #94, #95, #96

Goal: every Gatehouse ask (#91–#96) lands in the plugin exactly as proposed —
reviewer boundary-escalation tune, first-class prompt/tools tunes with
stamp/diff/rebase/reset, a machine-readable agent registry, `effort:` on the
claude runtime, `skills:` honoured by the codex adapter, and a multi-executor
fleet in §10 — with lint green, new tools tested, CHANGELOG + version bumped.

Estimate: 2 sessions (one brief S1 + its Fable checkpoint — corrected from 1 by the plan-judge, 2026-10-07; no `phases`). The
six asks are prose edits to 6 command/agent/template files plus one new tool
(`agents.mjs` + test + schema) and ~60 lines in `run-codex.mjs` + tests: ~600
lines of pre-resolved reads, ~1,000 lines written. Dense but single-surface
(the tune/spawn machinery), so one builder keeps the pieces coherent.
Fallback split if the owner prefers: P1 = #91 #92 #93 #94 (the `/tune`
cluster), P2 = #95 #96 (adapter + fleet) → 4 sessions (2 briefs + 2 ckpts).

## Tasks

1. **#91 reviewer `boundary_escalation` tune** — `tune reviewer
   boundary-escalation on|off` writes the frontmatter key + `TUNED
   (boundary-escalation: off) — ` prefix + banner; `mission.md` §0 rule 7, step
   2 "Reviewer tier survives…" and `agents/reviewer.md` "Model tier keys on
   RISK CLASS" honour `off` (tuned model/runtime handles boundary diffs; the
   reviewer still files a process finding when it judges the tier miscalled);
   `templates/WORKFLOW.md` LA-5 paragraph names the opt-out. Acceptance: the
   four texts agree; default (`on`/absent) is unchanged behaviour; `reset`
   removes it; autopilot records the change in `decision-log.md`.
2. **#92 prompt/tools tunes + stamp/diff/rebase/reset** — one banner form for
   every tune: `> Tuned from agentic-workflow v<ver> (base sha256:<12 hex>) —
   <kind> override[ (<details>)]. Reset with /tune <agent> reset.`; `tune
   <agent> prompt` stamps a fresh copy for body editing; `tune <agent> diff`
   prints `diff -u` plugin base vs shadow; `tune <agent> rebase` three-way
   merges (`git merge-file -p`) shadow onto the current base using the
   stamped old base, writes only on a clean merge, prints the conflict markers
   otherwise; `tune <agent> tools <a,b,…>` sets `tools:` and prints the sandbox
   note (Write/Edit → workspace-write; WebSearch/WebFetch → search, per
   `deriveFlags`); `reset` deletes any shadow whose banner matches `^> Tuned
   from agentic-workflow v` (old or new form); un-bannered files keep
   report-don't-delete. Acceptance: every subcommand documented in tune.md
   with exact commands; `argument-hint` lists them; lint green.
3. **#93 `tools/agents.mjs --json [--project <repo>]`** — prints
   `{plugin_version, agents:[{name, description, summary, phase, model, tools,
   effective:{model, runtime, effort, boundary_escalation, skills},
   override: null | {path, kind:[…], base_version, base_sha}}]}` validated by
   `templates/agents-registry.schema.json` (strict: `additionalProperties:
   false`, every property required). `tune.md` no-arg table is rendered FROM
   this output. Acceptance: `node tools/agents-test.mjs` (repo root, style of
   `run-codex-test.mjs`) passes — schema strictness, 20 agents listed, a
   fixture project with a tuned shadow yields the right `effective`/`override`
   (old-banner shadow → `base_sha: null`), un-bannered shadow → kind includes
   `prompt`; lint registers it as `checkAgentsRegistryHarness` next to
   `checkRunCodexHarness`, fail-closed on a missing runner.
4. **#94 `effort:` on claude** — `tune <agent> effort <level>` standalone
   (`low|medium|high|xhigh|max`, banner kind `effort`, model/runtime
   untouched); `mission.md` step 2 `claude` bullet: when the resolved tune has
   `effort:`, pass the Agent tool's effort parameter where the harness exposes
   one AND prepend `Effort: <level>. …` as the first prompt line otherwise;
   the tune report says which applies. Acceptance: tune.md + mission.md texts;
   `run-codex.mjs` `parseArgs` accepts `xhigh|max` for `--effort` (pass-through,
   no validation narrowing) with a test case.
5. **#95 codex adapter honours `skills:`** — `resolveSkills(roleText, cwd)` in
   `run-codex.mjs`: parse `skills:` (inline `[a, b]`, `a, b`, or YAML `- a`
   list); validate `^[a-z0-9][a-z0-9-]*(:[a-z0-9][a-z0-9-]*)?$` BEFORE any
   path is built; `agentic-workflow:<name>` → plugin skills only; bare name →
   `<cwd>/.claude/skills/<name>/SKILL.md` → `$HOME/.claude/skills/…` →
   `${PLUGIN_ROOT}/skills/…`; block header `# Skill: <name> (preloaded — listed
   in skills:)`, deduped against `namedSkills`; unresolved/invalid names →
   `d.deviations` entries `skill "<name>" listed in skills: not found (searched
   project, personal, plugin)` on EVERY written distillate (done and failed
   paths). Acceptance: `run-codex-test.mjs` cases — project skill inlined,
   personal (HOME-overridden) fallback, plugin-prefixed form, dedupe, invalid
   name never touches the filesystem outside skills dirs and is reported,
   missing → deviations; existing 592-line harness stays green.
   Plus `tune <agent> skills <a,b,…>`: validates each name with the same
   regex, writes `skills: [a, b]` into the shadow (banner kind `skills`,
   composes with other tunes, `reset` removes it), works on both runtimes
   (claude loads `skills:` natively; codex via the new inlining); the no-arg
   table and the registry `effective.skills` show it.
6. **#96 executor fleet** — `templates/WORKFLOW.md` §10: `### 10.1 Executors`
   table (`name · ssh alias · repo path · labels · default`) under the profile
   table; legacy single **Remote executor** row = the default executor;
   gate rows may end `→ executor:<label>`; `mission.md` "Remote gates"
   paragraph: resolve brief `executor:` pin → label → default → local, probe
   `ssh -o BatchMode=yes <alias> true` first, fall back to the next matching
   row and log the switch in the ledger Deviations, none healthy → block (never
   green), per-mission checkout `<path>/.worktrees/<mission>`; `connect.md`
   `server <host> [--label a,b] [--name n]` appends a row (migrating a legacy
   row to the table as `default`), `server remove <name>` drops one;
   `doctor.md` probes every row and reports each. Acceptance: the four texts
   agree on the table shape and the resolution order; a project with only the
   legacy row needs no edit.
7. **Release hygiene** — `plugin.json` 1.53.2 → 1.54.0; CHANGELOG `## [1.54.0]
   — 2026-10-07` with Added (#91–#94, #96) / Fixed (#95) bullets naming the
   issues; README.md + plugin README `/tune` rows mention diff/rebase/tools/
   effort/boundary-escalation and `connect server` fleet. Acceptance:
   `node tools/lint.mjs` green; PR body carries `Closes #91 … #96`.

## Locked decisions

- 2026-10-07 — Issues #91–#96 Proposal sections are the scope, INCLUDING the
  optional `tune <agent> skills <a,b,…>` of #95 (owner 2026-10-07: "we need
  to be able to give each agent special skills as well"). No other extras.
- 2026-10-07 — Version 1.54.0 (minor: features). `docs/WORKFLOW.md` (this
  repo's own §10 copy) is NOT edited in this mission — it has no executor and
  `/sync` carries template §5 wording after release.
- 2026-10-07 — Banner: `> Tuned from agentic-workflow v<ver> (base
  sha256:<first 12 hex of sha256 over the plugin agent file's exact bytes>) —
  <kind> override[ (<details>)]. Reset with /tune <agent> reset.` Both tune.md
  (`shasum -a 256 … | cut -c1-12`) and `agents.mjs` (`node:crypto`) hash the
  same bytes. Banners without `(base sha256:…)` (pre-1.54 shadows) stay
  valid: reset deletes them; registry reports `base_sha: null`.
- 2026-10-07 — Tunes compose: when a bannered shadow exists, a model / runtime
  / effort / boundary-escalation / tools / skills tune copies the base fresh and
  re-applies the frontmatter keys read from the old shadow, EXCEPT when the
  old shadow is a prompt override (body differs from base) — then edit its
  frontmatter in place and recommend `rebase`. `prompt` and first-time tunes
  copy fresh.
- 2026-10-07 — `rebase` old base = `${CLAUDE_PLUGIN_ROOT}/../<base_version>/
  agents/<agent>.md` (the versioned plugin cache sibling) when its sha256
  matches the stamp; otherwise report "old base unavailable" and print the
  `diff` for a manual merge — never guess. Merge via `git merge-file -p
  <shadow> <old> <new>`; non-zero exit → print markers, write nothing.
- 2026-10-07 — Registry `override.kind` is an ARRAY from {model, runtime,
  effort, boundary_escalation, tools, skills, prompt}, derived by comparing the shadow
  against the current base (frontmatter keys differing; body minus banner
  differing → `prompt`), not parsed from the banner, so hand edits classify
  too. `effective.model` keeps the literal `inherit` (no session to resolve
  it). `effective.effort` is `null` when unset. `boundary_escalation` is
  `"on"` for reviewer by default, `null` for every other agent. `summary` =
  description up to the first `. ` or ` — `; `phase` from a fixed map in
  agents.mjs (intake/brainstormer/researcher → discover; designer/architect/
  business → define; planner/advisor → plan; backend/frontend/security/devops
  → build; reviewer → review; chronicler/writer/curator → record; marketing →
  launch; ops/analyst/compass → operate).
- 2026-10-07 — `effort` levels accepted everywhere: `low|medium|high|xhigh|
  max`; `xhigh`/`max` carry a tune-time note "only where the model supports
  it"; the codex adapter passes them through unchanged.
- 2026-10-07 — `tune <agent> skills` writes the inline form `skills: [a, b]`
  (one line — `frontmatterValue` reads it; the list parser of task 5 also
  accepts the YAML `- a` form Gatehouse may write). Names are validated with
  the #95 regex before writing; existence is NOT required at tune time (a
  missing skill surfaces as a codex deviation / a Claude load warning), but
  the report names which of project / personal / plugin resolved each one.
- 2026-10-07 — `boundary-escalation` is accepted for `reviewer` only (any
  other agent → validation error naming the rule).
- 2026-10-07 — Executors live in a `### 10.1 Executors` sub-table (not extra
  rows in the 2-column profile table). A brief pins with an optional
  `executor: <name>` header field, documented in mission.md step 2 only.
- 2026-10-07 — Checkpoint reviewer tier: **Fable** — #95 changes prompt
  assembly + file-path resolution (path-escape validation) in the codex
  adapter, #92/#93 touch the `tools:` → sandbox derivation contract, and #91
  rewrites the boundary-review rule itself (§5 rule 7).

## Risks

- One dense brief → the last asks (#96) get thinner treatment. Mitigation:
  the brief orders work #95 → #93 → #92 → #94 → #91 → #96 → release, and
  the reviewer checks each issue's Proposal line-by-line.
- `frontmatterValue` is single-line; a YAML `skills:` list breaks it.
  Mitigation: task 5 adds a list-aware parser with tests for all three forms.
- Old-base lookup for `rebase` depends on the versioned cache layout.
  Mitigation: fail to "manual merge + diff", never guess (locked).
- Lint's `checkTemplateRefs` fails on any `templates/<file>` mention that
  doesn't exist → create `agents-registry.schema.json` before writing docs.

## Open questions

(none — every ambiguity resolved as a locked decision above)

---
_`.plans/gatehouse-asks.sessions.md` executes these tasks;
`.plans/gatehouse-asks.state.md` tracks progress._
