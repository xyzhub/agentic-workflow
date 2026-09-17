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

> **Corrections 2026-09-17** — implementation probed the Codex binary (0.146.0)
> and the sources; where this memo differed, the binary/source won. Recorded
> here so the design record stays truthful (a stale claim here is a future
> defect). The bodies of §5, §6, §8, §10, §13 and §14 below are corrected in
> place to match.
>
> - **§3 / §6 argv order** — `-a/--ask-for-approval` and `--search` are
>   TOP-LEVEL options that come BEFORE the `exec` subcommand: `codex exec -a
>   never …` exits 2 ("unexpected argument"); `codex -a never --search exec …`
>   parses. Source: `codex 0.146.0` argv probe.
> - **§6 `exec resume`** — the resume shape accepts only `-c -m --json -o
>   --output-schema`; NOT `-s`, `-C` or `-a`. The cwd comes from the child
>   process; the sandbox is inherited from the persisted session.
> - **§3 project rules / §10 trust** — project rules load from
>   `$(git rev-parse --show-toplevel)/.codex/rules/*.rules`, but are DISABLED
>   until a user-layer `[projects."<abs repo path>"] trust_level = "trusted"`
>   entry exists (`/connect codex`'s owner-approved step). `codex execpolicy
>   check` is syntax-only and ignores the trust layer, so its verdict proves
>   nothing about a live session. Source: `codex-rs/core/src/exec_policy.rs`,
>   `config/src/loader/mod.rs`.
> - **§5 tune model** — `.claude/agents/<role>.md` `model:` stays a valid Claude
>   tier (the file is also a Claude Code agent); the Codex model rides in
>   `runtime: codex:gpt-6-astra`, never in `model:`.
> - **§8 rules grammar** — `prefix_rule` tokens are literal (no globs);
>   alternatives are nested lists (`["git", ["push","commit","tag"]]`) plus a
>   blanket `["git","-C"]`; the §14 host-pattern rules are NOT expressible and
>   ship as a named parity gap, not a rule.
> - **§13 testing** — the adapter harness is `tools/run-codex-test.mjs` (reached
>   by lint check 10.7), not `run-codex.test.mjs`; the eval reaches the fake
>   binary through `CODEX_BIN`, not "a shim on PATH".

| Fact | Source |
|---|---|
| Claude Code's Agent tool runs Claude models only; `model:` is a Claude tier. | harness |
| `codex` supports `-a never`, `--search` (**top-level, before `exec`** — corrected 2026-09-17) and, on the `exec` subcommand, `-s read-only\|workspace-write`, `-C <dir>`, `--json`, `-o <file>`, `--output-schema <file>`, `-c key=value`; `exec resume <id>` is a narrower shape (`-c -m --json -o --output-schema` only). | `codex-cli 0.146.0 --help` |
| Owner's Codex default model is `gpt-6-astra`, `model_reasoning_effort = "low"`, and profiles with `approval_mode = "approve"` exist. | `~/.codex/config.toml` |
| Codex reads `AGENTS.md` (root → cwd, concatenated, 32 KiB cap); no `@file` import syntax; a direct prompt overrides `AGENTS.md`. | `codex-rs/core/src/agents_md.rs`, `models-manager/prompt.md` |
| Codex enforces execpolicy `.rules` (Starlark `prefix_rule`, `decision = "forbidden"`). Project-level load path (settled 2026-09-17): `$(git rev-parse --show-toplevel)/.codex/rules/*.rules`, loaded from every config layer but **disabled until the project is trusted** via a user-layer `[projects."<abs path>"] trust_level = "trusted"` entry. No user-level copy ships. | `codex-rs/core/src/exec_policy.rs`, `config/src/loader/mod.rs` |
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
2. Tune override `.claude/agents/<role>.md` frontmatter: `runtime: codex:gpt-6-astra`, `effort: high`. (Corrected 2026-09-17: `model:` stays a valid Claude tier — the file is also a Claude Code agent — and the Codex model rides in `runtime: codex:<model>`, never in `model:`.)
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
| always | `-a never` and `--search` are TOP-LEVEL (before `exec`); the `exec` subcommand then takes `-C <cwd> --json -o <last-message-file> --output-schema templates/distillate.schema.json -c model_reasoning_effort=<effort> -c shell_environment_policy.inherit=all -m <model>` (corrected 2026-09-17 — `codex exec -a never …` exits 2) |
| rules | the project-level execpolicy file `<repo>/.codex/rules/*.rules` (see §8), live only once the project is trusted (§10) |

Sessions persist (no `--ephemeral`) so a corrective retry can `codex exec resume
<thread-id>`. That resume shape is narrower (corrected 2026-09-17): it accepts
only `-c -m --json -o --output-schema` — no `-s`, `-C` or `-a`; the cwd comes
from the child process and the sandbox is inherited from the persisted session.

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

Corrected 2026-09-17: `prefix_rule` tokens are **literal — there are no globs**
(`*` matches a literal `*`). Alternatives are expressed as nested lists, so one
rule covers several subcommands. The rules that ship:

- `git push` / `git commit` / `git tag` (as `["git", ["push","commit","tag"]]`) — the orchestrator pushes, commits and tags; **Codex never commits**, which keeps the close-keyword guard and commit-format reminder in force.
- a blanket `["git", "-C"]` — the `git -C <dir> …` form is the bypass no narrower pattern can catch (literal tokens can't look past `-C`), so the whole prefix is forbidden.
- `gh pr` create/merge (as `["gh", "pr", ["create","merge"]]`) — human/orchestrator actions.

Each rule carries `match` / `not_match` examples that `codex execpolicy check`
runs. **That check is syntax-only** (corrected 2026-09-17): it validates the
rule file and ignores the trust layer, so a verdict here proves the file parses,
not that the rules are live in a session (see §10). Sandbox mode covers the rest
(read-only roles cannot write; network off for reviewers).

**Named parity gap:** the §14 paid-promotion / publish-host guards are
host-pattern rules, which `prefix_rule` cannot express at all. They are recorded
as a deliberate, accepted gap — not shipped as a rule.

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
2. Dry run (corrected 2026-09-17 — globals before `exec`): `codex -a never exec -s read-only --output-schema <schema> -o <tmp> "Reply with a distillate whose summary is OK"` and validate the file. This is the round-trip.
3. If §10 names a code index with a stdio MCP command, `codex mcp add codegraph -- <cmd>` (skip with a note if already registered).
4. Install the rules file at `<repo>/.codex/rules/agentic-workflow.rules`; add the owner-approved user-layer trust entry (`[projects."<abs repo path>"] trust_level = "trusted"`) and re-read to confirm. **Prove the rule is live, not just parseable** (corrected 2026-09-17): `codex execpolicy check` is syntax-only and ignores trust, so it cannot show a rule firing in a session. Instead run a command that would otherwise succeed in read-only and read the rejection from the `--json` event stream — that reads through the trust layer.
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

- **Adapter harness** (`tools/run-codex-test.mjs`, no network; corrected 2026-09-17 — the file is `run-codex-test.mjs`, reached by lint check 10.7, not `run-codex.test.mjs` nor the hook-test harness): a fake `codex` reached through `CODEX_BIN` records argv and emits canned `--json` events + last message. Assert: flag derivation for the three tool shapes; argv order (globals before `exec`); the narrower `exec resume` shape; prompt block order; skill inlining; schema validation and the non-JSON path; `changed_paths` from a temp git repo; `high_impact_touched`; exit codes; that `--ignore-rules` never appears.
- **Rules**: the harness also runs every `match`/`not_match` example in `templates/codex.rules` through `codex execpolicy check` for a real syntax verdict.
- **Conform**: fixture projects for the three `agents-md-primary` gap states.
- **Eval** (`evals/scenarios/codex-routing`): one scenario where the orchestrator must route a brief marked `runtime: codex` to the adapter and never call the Agent tool. The fixture ships a fake `codex` at `fixture/bin/codex`; `evals/run.mjs` exports `CODEX_BIN=<fixture>/bin/codex` so the scenario cannot reach the real binary (corrected 2026-09-17 — a shim on PATH is not a mechanism the runner has).
- **n=1** (owner-fired): one real mission brief on Astra, in this repo, reviewed by a Claude reviewer; record tokens on both sides in the ledger.

## 14. Decisions locked (2026-09-11, owner: "go" with defaults)

1. Codex never commits; the orchestrator commits from the distillate.
2. Shell env inherited in full for local runs; the sandbox still bounds effects.
3. Setup is a `/connect codex` mode with a round-trip proof, not a `/doctor fix` side effect.
4. `AGENTS.md` is the primary conventions file; `CLAUDE.md` imports it.
5. No automatic vendor fallback.
6. (2026-09-17) The n=1 real-mission proof on Astra is owner-fired **after
   merge** — it lands as a `## Closing` obligation row, never pre-booked into the
   session estimate.
7. (2026-09-17) A codex reviewer tune covers **routine checkpoints only**;
   risk-class diffs (security boundary, publishing) override to the Claude
   reviewer on Fable.
8. (2026-09-17) Estimate 5 = 4 briefs + 1 checkpoint. Correctives are counted
   only when they fire — never pre-booked into the estimate.

## 15. Deferred (to the obligations register on merge)

- Codex on the §10 remote executor.
- A second foreign runtime (Gemini CLI) to prove the adapter boundary.
- Claude subagents emitting the JSON distillate too, so the orchestrator parses one shape everywhere.
