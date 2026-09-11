# Runtime-agnostic spawning: Codex CLI (GPT-6 Astra) as a second runtime

**Date:** 2026-09-11 · **Status:** design, awaiting owner review · **Target:** agentic-workflow v1.51.0

## 1. Goal

Let any plugin role (builder, designer, reviewer, planner, …) run on OpenAI's
Codex CLI with GPT-6 Astra instead of a Claude subagent, chosen per agent or
per brief, with no change to the protocol and no behaviour change for a
project that never opts in. "Fable plans, Astra executes" is the first use;
the shape is vendor-neutral so a third runtime is one adapter script later.

Non-goals: running Codex on the §10 remote executor; Gemini or other CLIs;
changing how Claude subagents are spawned today; automatic vendor fallback.

## 2. Why it fits

The protocol already separates *what a role does* (a markdown prompt that
opens with "read §10") from *how it is spawned* (the Claude Agent tool). The
mission machinery already makes the planner do all exploration and hands
executors a pre-resolved brief; the context firewall (§6.2) already demands a
bounded distillate back. A Codex run is that same contract with the tool call
replaced by a file exchange: brief in, JSON distillate out. Nothing in the
protocol prose is Claude-specific.

## 3. Verified facts the design rests on

| Fact | Source |
|---|---|
| Claude Code's Agent tool runs Claude models only; `model:` is a Claude tier. | harness |
| `codex exec [PROMPT]` supports `-a never`, `-s read-only\|workspace-write`, `-C <dir>`, `--search`, `--json`, `-o <file>`, `--output-schema <file>`, `-c key=value`, `exec resume <id>`. | `codex-cli 0.146.0 --help` |
| Owner's Codex default model is `gpt-6-astra`, `model_reasoning_effort = "low"`, and profiles with `approval_mode = "approve"` exist. | `~/.codex/config.toml` |
| Codex reads `AGENTS.md` (root → cwd, concatenated, 32 KiB cap); no `@file` import syntax; a direct prompt overrides `AGENTS.md`. | `codex-rs/core/src/agents_md.rs`, `models-manager/prompt.md` |
| Codex enforces execpolicy `.rules` (Starlark `prefix_rule`, `decision = "forbidden"`); user-level file is `~/.codex/rules/default.rules`. Project-level load path: **probe during implementation**. | `codex-rs/execpolicy/README.md` |
| `workspace-write` sandbox disables network unless `sandbox_workspace_write.network_access=true`; shell env is not fully inherited unless `shell_environment_policy.inherit=all`. | Codex config docs |
| Claude Code's `CLAUDE.md` supports `@path` imports. | harness |
| `templates/WORKFLOW.md` is 93 KB, far over the 32 KiB `AGENTS.md` cap. | `wc -c` |
| Plugin hooks (push/merge block, close-keyword guard, docs-reminder, beat-enforcer) fire only on Claude tool calls. | `hooks/hooks.json` |
| Role prompts reference Claude skills: `plain-report` (chronicler, reviewer) and a probe for `.claude/skills/impeccable/` (frontend, reviewer). | `agents/*.md` |
| Role `tools:` frontmatter falls into three shapes: read-only (`Read, Bash?, Grep, Glob`), write (`+ Write, Edit`), web (`+ WebSearch, WebFetch`). | `agents/*.md` |

## 4. Architecture

```
                 ┌──────────────── protocol (unchanged) ────────────────┐
                 │  docs/WORKFLOW.md   agents/<role>.md   .plans/ briefs │
                 └──────────────────────────┬───────────────────────────┘
                                            │ runtime: claude | codex
                     ┌──────────────────────┴──────────────────────┐
                     ▼                                             ▼
          Claude adapter (today)                          Codex adapter (new)
          Agent tool, subagent_type,                      tools/run-codex.mjs
          frontmatter model:                              → codex exec … -o distillate.json
                     │                                             │
                     └──────────── distillate (same schema) ───────┘
                                            │
                                    orchestrator: ledger row, commit, next brief
```

Five components, each with one job:

| Component | Does | Depends on |
|---|---|---|
| **Runtime selector** | Resolves `runtime` (+ `model`, `effort`) for a spawn: brief field → tune override → `claude`. | `.claude/agents/<role>.md` frontmatter, brief header |
| **Codex adapter** `tools/run-codex.mjs` | Assembles the prompt, derives sandbox flags from the role's `tools:`, runs `codex exec`, captures thread id + usage, writes the distillate, post-checks high-impact files. | codex binary, role prompt, §10, brief, schema, rules |
| **Conventions pointer** `AGENTS.md` (+ `CLAUDE.md` → `@AGENTS.md`) | The file every runtime reads at start. Points at §10, role prompts, brief contract. Never inlines the protocol. | bootstrap / sync / conform |
| **Guardrail parity** `templates/codex.rules` | Forbids push, merge, commit, tag push inside Codex. | Codex execpolicy |
| **Health + setup** `/connect codex`, `/doctor` probe | Proven round-trip before §10 records the runtime; later sessions probe binary, auth, model, MCP list. | codex CLI |

## 5. Runtime selection

Precedence, first match wins:

1. Brief header field `runtime: codex[:<model>] [effort=<low|medium|high>]` (planner may set it; the orchestrator honours it).
2. Tune override `.claude/agents/<role>.md` frontmatter: `runtime: codex`, `model: gpt-6-astra`, `effort: high`.
3. Default `claude` — the Agent tool exactly as today.

`/tune` grows: `/tune <role> codex[:<model>] [effort]`. The banner line becomes
`TUNED (runtime: codex, model: gpt-6-astra, effort: high) — …`. `reset` unchanged.
The no-arg table gains a **runtime** column. Alias validation accepts `codex`,
`codex:<model>`, and the existing Claude tiers. Default effort when omitted:
`high` for `reviewer`, `planner`, `advisor`, `architect`; `medium` otherwise.
(Owner's global `low` is deliberately overridden per spawn.)

## 6. The Codex adapter — `tools/run-codex.mjs`

Invocation by the orchestrator (mission step 2, or an interactive spawn):

```
node $CLAUDE_PLUGIN_ROOT/tools/run-codex.mjs \
  --role backend --brief .plans/<mission>.md#S3 \
  --cwd <worktree> --out .plans/runs/<mission>-S3.json \
  [--model gpt-6-astra] [--effort medium] [--resume <thread-id>] [--note "<corrective>"]
```

Run with the Bash tool's `run_in_background: true`; the harness re-invokes
the orchestrator on exit. No custom detach.

**Prompt assembly** (in order, each a labelled block):

1. Role prompt body — `agents/<role>.md` with frontmatter stripped (the tune override's body if one exists, so prompt parity with Claude holds).
2. `docs/WORKFLOW.md` §10 verbatim (small; the same read every Claude role does first).
3. Inlined skill text for any skill the role prompt names (`plain-report` → its `SKILL.md`); the `impeccable` probe stays as-is since it is a filesystem check the run can do itself.
4. The brief (the `## S<n>` section of the mission plan, or the ad-hoc text).
5. The return contract: "your final message MUST be JSON matching the schema" plus the schema path. Also the standing rules: never edit `.plans/`, never commit, never push, never merge, stop and report `blocked` on anything requiring an owner.
6. `--note` corrective text, on a retry.

`AGENTS.md` is read by Codex automatically and is *in addition* to this; the
prompt is authoritative.

**Flags derived from the role's `tools:`** (no per-role config):

| Role tools contain | Flags |
|---|---|
| no `Write`/`Edit` | `-s read-only` |
| `Write` or `Edit` | `-s workspace-write` |
| role ∈ {backend, frontend, devops, security} | `-c sandbox_workspace_write.network_access=true` (installs, `gh` reads) |
| `WebSearch` or `WebFetch` | `--search` |
| always | `-a never -C <cwd> --json -o <last-message-file> --output-schema templates/distillate.schema.json -c model_reasoning_effort=<effort> -c shell_environment_policy.inherit=all -m <model>` |
| rules | the project-level execpolicy file (see §8); load path confirmed at implementation |

Sessions persist (no `--ephemeral`) so a corrective retry can `codex exec resume <thread-id>`.

**Post-run**, the adapter writes the distillate file by merging:

- the model's last message (schema-validated JSON; on parse failure `status: "failed"`, `first_error: "distillate not valid JSON"`, raw saved beside it);
- `thread_id` from the `--json` event stream;
- `usage` (input/output tokens, model) from the event stream;
- `changed_paths` from `git status --porcelain` in `--cwd` (trust the tree, not the model's claim);
- `high_impact_touched`: intersection of changed paths with the §10 high-impact list — the docs-reminder hook's job, done here.

**Exit code**: 0 on `done`, 3 on `blocked`, 1 on `failed`. The orchestrator
never reads Codex's stdout; it reads the distillate file.

## 7. The distillate schema — `templates/distillate.schema.json`

One schema for every runtime. Claude subagents already return this shape in
prose (§6.2 bounded return); Codex returns it as JSON. Fields:

```
status:          "done" | "blocked" | "failed"
summary:         string  (≤ 3 lines)
changed_paths:   string[]
gates:           { name: string, result: "green" | "red" | "skipped", first_error?: string }[]
deviations:      string[]   (references, not content)
next:            string[]   (what to re-verify / what's next)
blocked_reason?: string
runtime:         { name: "codex", model: string, effort: string, thread_id?: string }
usage?:          { input_tokens: number, output_tokens: number }
high_impact_touched?: string[]
```

The orchestrator uses it to: mark the ledger row (`[x]` on done+green, `[~]`
on blocked, retry-then-stop on failed), append the handoff line including
`runtime · model · tokens`, and decide the commit.

## 8. Guardrail parity — `templates/codex.rules`

Plugin hooks do not fire inside Codex. The execpolicy file restores the
mechanical ones as `forbidden` prefix rules with justifications that read
like the hook messages:

- `git push` (any form, incl. `git -C … push`) — the orchestrator pushes.
- `gh pr merge`, `gh pr create` — human/orchestrator actions.
- `git commit` — **Codex never commits**; the orchestrator commits from the distillate, which keeps the close-keyword guard and commit-format reminder in force.
- `git push --tags`, `git tag` — release actions.
- paid-promotion and publish hosts — same host patterns as the §14 hook.

Each rule carries `match` / `not_match` examples so `codex execpolicy check`
doubles as the test. Sandbox mode covers the rest (read-only roles cannot
write; network off for reviewers).

What is *not* replicated and why: the docs-reminder (`Write|Edit` hook) is
covered by `high_impact_touched` in the distillate; the beat-enforcer keys on
closing commands, which Codex cannot run; the mission-budget and handoff
hooks act on the orchestrator's own prompts and are unaffected.

## 9. Conventions pointer — `AGENTS.md` primary, `CLAUDE.md` imports it

- **bootstrap** creates `AGENTS.md` if absent (template: `templates/agents-md.md`) and creates or patches `CLAUDE.md` so its first non-blank line is `@AGENTS.md`. Claude-only notes stay in `CLAUDE.md` below the import.
- **conform** (`tools/conform.mjs`): `conventionsFile()` prefers `AGENTS.md`; a new ladder entry `agents-md-primary` (since 1.51.0) reports: missing `AGENTS.md`; `CLAUDE.md` present without the `@AGENTS.md` import; both present and `AGENTS.md` lacks the pointer block. The existing anchor check runs on `AGENTS.md`.
- **sync** applies the ladder. When a project has a rich `CLAUDE.md` and no/stale `AGENTS.md`, sync moves the runtime-neutral content into `AGENTS.md` once, leaves the import in `CLAUDE.md`, and reports the move line by line. Never silent.
- `AGENTS.md` content (pointer only, well under the 32 KiB cap): read `docs/WORKFLOW.md` §10 first; role prompts live at `<plugin>/agents/` with overrides in `.claude/agents/`; obey the brief; return the distillate; never edit `.plans/`, never commit/push/merge.

For a Claude-only project nothing changes in practice: Claude reads the same
text through one import hop.

## 10. Setup and health

**`/connect codex`** (new mode, same proven-round-trip pattern as `server`):

1. `codex --version` ≥ 0.146; `codex login status` (or equivalent) authenticated.
2. Dry run: `codex exec -a never -s read-only --output-schema <schema> -o <tmp> "Reply with a distillate whose summary is OK"` and validate the file. This is the round-trip.
3. If §10 names a code index with a stdio MCP command, `codex mcp add codegraph -- <cmd>` (skip with a note if already registered).
4. Install the rules file where Codex loads project rules (path from the implementation probe); verify with `codex execpolicy check --rules … git push origin main` → forbidden.
5. Only then write the §10 row: **Runtimes** `claude (default) · codex: gpt-6-astra (connected <date>) · rules: <path>`.

**`/doctor`** adds one probe group, advisory when the §10 row is absent
("Runtimes: claude only — not configured") and a failure only when the row
names codex and any of binary/auth/rules/schema is missing.

## 11. Orchestrator changes

- **mission.md step 2**: "Spawn it with the brief" becomes "resolve the runtime (§5), then spawn: `claude` → Agent tool as today; `codex` → `tools/run-codex.mjs` in the background; on return read the distillate". Step 3 gains: for codex runs, the orchestrator marks the ledger row and commits the changed paths itself (the run never touches `.plans/` or git history). The one-corrective-retry rule passes `--resume <thread_id> --note …`.
- **planner.md**: optional brief header field `runtime:`; the planner sets it only when the mission's tune table already puts that role on codex, or the owner asked.
- **WORKFLOW.md**: §3 gains one row explaining hook parity inside foreign runtimes is the rules file; §6 gains a paragraph "roles are runtime-neutral: the prompt is the role, the runtime is a spawn detail"; §9 maps the new tools/commands; §10 gains the Runtimes row.
- **README / CHANGELOG**: 1.51.0 entry. `package.json`-equivalent pin: `.claude-plugin/plugin.json` version.

## 12. Error handling

| Situation | Behaviour |
|---|---|
| codex binary missing / unauthenticated | adapter exits 3, distillate `blocked` with reason; orchestrator surfaces to owner; no fallback to Claude |
| model returns non-JSON | `failed`, raw saved; one corrective retry with `--note "return only the JSON distillate"`; then stop |
| rules forbid a command mid-run | Codex reports the rejection; the model is instructed to end with `blocked` naming the command |
| run exceeds owner patience | no adapter timeout; the orchestrator's background task can be stopped; thread id in the partial distillate allows resume |
| `changed_paths` empty on `done` | orchestrator treats as suspicious: marks `[~]`, asks reviewer to confirm before `[x]` |

## 13. Testing

- **Unit** (`tools/run-codex.test.mjs`, no network): a fake `codex` shim on PATH records argv and emits canned `--json` events + last message. Assert: flag derivation for the three tool shapes; prompt block order; skill inlining; schema validation and the non-JSON path; `changed_paths` from a temp git repo; `high_impact_touched`; exit codes.
- **Rules**: `codex execpolicy check --rules templates/codex.rules …` over the `match`/`not_match` examples, run by the hook-test harness.
- **Conform**: fixture projects for the three `agents-md-primary` gap states.
- **Eval** (`evals/scenarios`): one scenario where the orchestrator must route a brief marked `runtime: codex` to the adapter and never call the Agent tool.
- **n=1** (owner-fired): one real mission brief on Astra, in this repo, reviewed by a Claude reviewer; record tokens on both sides in the ledger.

## 14. Decisions locked (2026-09-11, owner: "go" with defaults)

1. Codex never commits; the orchestrator commits from the distillate.
2. Shell env inherited in full for local runs; the sandbox still bounds effects.
3. Setup is a `/connect codex` mode with a round-trip proof, not a `/doctor fix` side effect.
4. `AGENTS.md` is the primary conventions file; `CLAUDE.md` imports it.
5. No automatic vendor fallback.

## 15. Deferred (to the obligations register on merge)

- Codex on the §10 remote executor.
- A second foreign runtime (Gemini CLI) to prove the adapter boundary.
- Claude subagents emitting the JSON distillate too, so the orchestrator parses one shape everywhere.
