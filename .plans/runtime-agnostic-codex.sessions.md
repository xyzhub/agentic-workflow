---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: runtime-agnostic-codex — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the expensive
exploration happened once, here._

Replan 2026-09-11: collapsed from 6 briefs / 2 phases to 3 briefs / 1 phase /
1 checkpoint on the owner's estimate ruling, with issue #79 (permanent
plan-judge) folded in; then, on the plan-judge's over-full finding and the
owner's ruling _"Split now, Estimate 5"_, the record work split out as S4 —
**4 briefs / 1 phase / 1 checkpoint**. No brief had started; every read below was
re-resolved for the current shape.

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/runtime-agnostic-codex.md` · Ledger:
`.plans/runtime-agnostic-codex.state.md`

Design source (read the named ranges, never whole):
`docs/product/engineering/runtime-agnostic-codex.md` — owner-approved, its §14
decisions are locked in the master plan. Issue source for S3's plan-judge:
`gh issue view 79 --repo xyzhub/agentic-workflow` (read it, don't re-derive it).

**Catalog**: none for every brief — this repo's §10 **Catalog** row is
`none — markdown-only plugin` (decided 2026-08-19). No catalog reads, no catalog
regeneration in any Verify step.

**Gates available in this repo** (§10):

| Gate | Command | Tier |
|---|---|---|
| Test / lint gate (CI runs it) | `node tools/lint.mjs` | 1 — every brief |
| Hook behavior harness | `node tools/hook-test.mjs` | 1.5 — reached by lint |
| Clock-guard cases | `node tools/lint-test.mjs` | 1.5 — reached by lint |
| Adapter harness (new, this mission) | `node tools/run-codex-test.mjs` | 1.5 — reached by lint after S1 |
| Eval suite | `node evals/run.mjs [scenario]` | 2 — S3 only, never CI, ~$1–5/scenario |
| Staging verify (§10 Staging = none) | lint green on the phase branch + `claude --plugin-dir` load in a consumer session | at the checkpoint |

**Codex CLI facts already probed (do not re-probe; 0.146.0 at
`/Users/baker/.local/bin/codex`)** — corrected 2026-09-11 by the plan-judge
against the binary; where these differ from the design memo, **these win** and
the memo is corrected in S3:

- **Argv order matters.** `-a/--ask-for-approval` and `--search` are TOP-LEVEL
  options, not `exec` flags: `codex exec -a never …` exits 2 with "unexpected
  argument", while `codex -a never --search exec …` parses. Globals come BEFORE
  the `exec` subcommand.
- `codex exec` (exec-only) accepts `-s read-only|workspace-write|danger-full-access`,
  `-C/--cd`, `-m`, `-c key=value`, `--json`, `-o/--output-last-message`,
  `--output-schema <FILE>`, `--ephemeral`, `--ignore-rules`,
  `--ignore-user-config`, `-p/--profile`.
- **`codex exec resume <id>` is a different shape**: it accepts `-c`, `-m`,
  `--json`, `-o`, `--output-schema` but NOT `-s`, `-C` or `-a`. The working
  directory comes from the child process's own `cwd`, and the sandbox is
  inherited from the persisted session.
- `codex execpolicy check --rules <PATH> <COMMAND>…` exists (`-r/--rules`
  repeatable). It is a **syntax/decision check on the file only** — it does NOT
  consult the trust layer, so a `forbidden` verdict here says nothing about
  whether the rules are live in a session.
- **`prefix_rule` tokens are literal — there are no globs** (`*` matches a
  literal `*`). Alternatives are expressed as nested lists, e.g.
  `["git", ["push", "commit", "tag"]]`, `["gh", "pr", ["create", "merge"]]`.
  Host patterns cannot be expressed at all.
- `codex debug prompt-input` renders the model-visible prompt input as JSON.

**Execpolicy facts — settled by the owner 2026-09-11 from the Codex sources
(`codex-rs/core/src/exec_policy.rs`, `config/src/loader/mod.rs`); do not
re-probe**: rules load automatically from every config layer's `rules/` folder,
and the Project layer is `$(git rev-parse --show-toplevel)/.codex/rules/*.rules`.
The guardrail file ships as `<repo>/.codex/rules/agentic-workflow.rules`,
committed in the consumer repo, written from `templates/codex.rules` — no
user-level copy. Project-layer rules are loaded but **disabled until the project
is trusted**: a user-layer `[projects."<abs repo path>"] trust_level = "trusted"`
entry in `~/.codex/config.toml`. This repo is NOT trusted today; adding that entry
is `/connect codex`'s explicitly owner-approved step (S2), never a silent edit.
The adapter must never pass `--ignore-rules`.

**No `codex exec` run against the API in any brief.** The only real `codex exec`
in the shipped machinery is `/connect codex`'s round-trip proof, which the owner
fires interactively (locked decisions, 2026-09-11).

## Large-files table

| File | Lines |
|---|---|
| `tools/context-attrib.mjs` | 1446 |
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 1221 |
| `tools/hook-test.mjs` | 1211 |
| `docs/WORKFLOW.md` | 1153 |
| `CHANGELOG.md` | 991 |
| `tools/lint.mjs` | 832 |
| `plugins/agentic-workflow/tools/catalog.mjs` | 333 |
| `plugins/agentic-workflow/README.md` | 303 |
| `docs/product/engineering/runtime-agnostic-codex.md` | 239 |
| `plugins/agentic-workflow/commands/mission.md` | 238 |
| `plugins/agentic-workflow/tools/conform.mjs` | 199 |
| `plugins/agentic-workflow/agents/reviewer.md` | 180 |
| `evals/run.mjs` | 178 |
| `plugins/agentic-workflow/commands/connect.md` | 165 |
| `plugins/agentic-workflow/commands/bootstrap.md` | 159 |
| `plugins/agentic-workflow/commands/sync.md` | 157 |
| `tools/lint-test.mjs` | 154 |
| `plugins/agentic-workflow/tools/ci-wait.mjs` | 134 |
| `plugins/agentic-workflow/agents/planner.md` | 128 |
| `plugins/agentic-workflow/commands/adopt.md` | 126 |
| `plugins/agentic-workflow/templates/mission-state.md` | 121 |
| `plugins/agentic-workflow/commands/doctor.md` | 101 |
| `plugins/agentic-workflow/skills/plain-report/SKILL.md` | 91 |
| `plugins/agentic-workflow/commands/plan.md` | 87 |
| `plugins/agentic-workflow/templates/mission-plan.md` | 61 |
| `README.md` | 59 |
| `plugins/agentic-workflow/commands/tune.md` | 53 |

## Phase 1 — the whole mission (branch: `mission/runtime-agnostic-codex`, from `feat/runtime-agnostic-codex`)

One branch, one staging landing, one PR to `main`. Not parallel-safe: S2 and S3
name files S1 creates, S4 documents what S3 writes, and lint's
template-reference check fails if markdown names a template that does not exist
yet. Run S1 → S2 → S3 → S4.

### S1 — mechanics: adapter, schema, rules, harness

- **Reads**: `docs/product/engineering/runtime-agnostic-codex.md` lines 26–41
  (§3 verified facts), 85–176 (§6 adapter → §7 schema → §8 rules) and 209–218
  (§12 error handling) — 239-line file, ranged only;
  `plugins/agentic-workflow/tools/ci-wait.mjs` whole (134 — the shipped-tool
  model: zero deps, argv parsing, self-test convention, meaningful exit codes);
  `tools/lint.mjs` lines 1–60 (helpers `fail`, `read`, the `spawnSync` import),
  400–435 (`checkCatalogSelftest` + `checkCiWaitSelftest` — copy this shape
  exactly), 800–832 (the run block where a check is registered);
  `tools/hook-test.mjs` lines 1–28 (harness conventions, exit 0 = pass);
  `docs/WORKFLOW.md` lines 821–844 (§10 profile — the **High-impact files** row
  the adapter intersects against);
  `plugins/agentic-workflow/skills/plain-report/SKILL.md` whole (91 — the skill
  text that gets inlined when a role prompt names it).
  **Grep, do not read**: `grep -n "^tools:" plugins/agentic-workflow/agents/*.md`
  (the three `tools:` shapes are read-only / write / web — already verified);
  `grep -rn "plain-report\|impeccable" plugins/agentic-workflow/agents/`.
- **Catalog**: none.
- **Do**: (no probes — the execpolicy facts above are settled; never run
  `codex exec`.)
  1. `plugins/agentic-workflow/templates/distillate.schema.json` per memo §7:
     `status`, `summary`, `changed_paths`, `gates[]`
     (`name`/`result`/`first_error`), `deviations[]`, `next[]`, `blocked_reason`,
     `runtime` (`name`/`model`/`effort`/`thread_id`), `usage`
     (`input_tokens`/`output_tokens`), `high_impact_touched`. Strict-mode safe:
     `"additionalProperties": false` on every object and EVERY property listed in
     `required`, the memo's optional fields as nullable unions
     (`["string","null"]`, `["object","null"]`, `["array","null"]`). Not a `.md`
     file, so the template-frontmatter lint rule does not apply.
  2. `plugins/agentic-workflow/templates/codex.rules` — Starlark `prefix_rule`
     entries with `decision = "forbidden"` and a justification that reads like the
     matching guardrail hook message. **Tokens are literal; there are no globs**,
     so express alternatives as nested lists and do NOT attempt the memo's
     "every form" or host-pattern wording (memo §8 is wrong here; S3 corrects it):
     `["git", ["push", "commit", "tag"]]`, `["gh", "pr", ["create", "merge"]]`,
     plus a blanket forbidden `["git", "-C"]` — the adapter always sets the
     child's working directory, so `git -C` inside a run is never legitimate and
     blocking it closes the `git -C <dir> push` bypass that no glob could catch.
     **Drop the §14 paid-promotion/publish host rules**: prefix rules cannot
     express host patterns. That parity gap is deliberate and named — see the
     master plan's Risks block, the `## Closing` row, and the WORKFLOW §3 row S3
     writes. Every rule carries `match` / `not_match`
     example command lines in a machine-readable comment block (one command per
     line, stable `# match:` / `# not_match:` prefixes) so the harness can
     enumerate them. Header comment names the deployed location —
     `<repo>/.codex/rules/agentic-workflow.rules`, Codex's Project config layer —
     and the trust gate (inert until `[projects."<abs repo path>"] trust_level =
     "trusted"` exists in `~/.codex/config.toml`; `/connect codex` adds it with
     the owner's okay).
  3. `plugins/agentic-workflow/tools/run-codex.mjs` — zero deps, Node ≥ 18:
     - argv `--role --brief --cwd --out [--model] [--effort] [--resume] [--note]`
       plus `--help`; invalid/missing args exit 1 with usage.
     - prompt assembly in the memo §6 order: role prompt body with frontmatter
       stripped (prefer `.claude/agents/<role>.md` when present so a tune
       override's body wins), `docs/WORKFLOW.md` §10 verbatim, inlined text for
       any skill the role prompt names, the brief (the `## S<n>` section of the
       named plan file, or ad-hoc text), the return contract (JSON matching the
       schema plus the standing rules: never edit `.plans/`, never commit, never
       push, never merge, report `blocked` on anything needing an owner), then
       `--note`.
     - **argv order (memo §6's flag table is wrong; the binary decides)**: global
       options FIRST, then `exec`, then exec-only flags —
       `codex -a never [--search] exec -s <mode> -C <cwd> -m <model> --json -o
       <tmp last-message file> --output-schema <schema> -c
       model_reasoning_effort=<effort> -c shell_environment_policy.inherit=all
       [-c sandbox_workspace_write.network_access=true]`. Derivation is unchanged:
       no `Write`/`Edit` → `-s read-only`; `Write`/`Edit` → `-s workspace-write`;
       role in {backend, frontend, devops, security} → the network-access `-c`;
       `WebSearch`/`WebFetch` → the global `--search`. No `--ephemeral` (sessions
       persist for resume). **Never** pass `--ignore-rules` — it would disable the
       project-layer guardrail file that is the whole parity mechanism.
     - **resume is a second, narrower shape**: `codex [-a never] exec resume
       <thread-id> [-c …] [-m …] --json -o <file> --output-schema <schema>` —
       `resume` accepts NO `-s`, `-C` or `-a` on the subcommand, so the working
       directory is set with the child process's own `cwd` option and the sandbox
       is inherited from the persisted session. Build the two argv shapes in
       separate functions so the harness can pin each.
     - **binary resolution**: use `process.env.CODEX_BIN` when set, else `codex`
       from PATH. Document the override in `--help` — it is what lets tests and
       the eval fixture point at a shim without touching PATH.
     - post-run merge into `--out`: schema-validate the last message (on parse
       failure write `status: "failed"`, `first_error: "distillate not valid
       JSON"`, save the raw beside it), then attach `thread_id` and `usage` from
       the JSONL event stream (tolerate absent fields → null, never throw),
       `changed_paths` from `git status --porcelain` in `--cwd` (the tree, not
       the model's claim), and `high_impact_touched` as the intersection with the
       §10 high-impact list.
     - exit 0 on `done`, 3 on `blocked`, 1 on `failed`; the distillate file is the
       interface, never stdout.
  4. `tools/run-codex-test.mjs` (repo root, zero deps, exit 0 = pass, same
     header-comment style as `tools/hook-test.mjs`): a fake `codex` shim pointed
     at by `CODEX_BIN` that records argv and emits canned JSONL events plus a last
     message, a temp git repo for tree-derived assertions, and these groups —
     schema (parses; strictness invariant: every object's `required` covers its
     `properties` and `additionalProperties: false` everywhere; memo §7 field set
     present); rules (structural always: every required command family has a rule
     with a justification and at least one `match` + one `not_match`, and NO rule
     relies on a glob or a host pattern; plus binary-backed `codex execpolicy
     check --rules <file> <example>` verdicts for every enumerated example,
     printing `SKIP (no codex binary)` when `codex` is absent — never a silent
     skip); adapter — flag derivation for the three tool shapes, **argv ORDER**
     (globals before `exec`, exec-only flags after — the case that would have
     caught the exit-2 "unexpected argument" bug), the **resume argv shape**
     (no `-s`/`-C`/`-a`, cwd passed as the child's `cwd`), `CODEX_BIN` winning
     over a `codex` that is also on PATH, prompt block order, skill inlining,
     schema validation and the non-JSON path, `changed_paths`,
     `high_impact_touched`, all three exit codes, and `--ignore-rules` absent from
     EVERY recorded invocation including the resume path.
  5. Wire the harness into `tools/lint.mjs` as a tier-1.5 check (numbered after
     the ci-wait one, e.g. `// ── 10.7 run-codex adapter harness`), fail-closed
     when the runner is missing, same `spawnSync` + detail-extraction body as
     `checkCiWaitSelftest`, registered in the run block.
- **Verify**: `node tools/run-codex-test.mjs` exits 0 with every named case
  asserted and real (not skipped) execpolicy verdicts on this machine;
  `node tools/lint.mjs` exits 0; `codex execpolicy check --rules
  plugins/agentic-workflow/templates/codex.rules <cmd>` (a **syntax/decision check
  on the file only** — it never consults the trust layer) is forbidden for
  `git push origin main`, `git commit -m x`, `gh pr create` and
  `git -C /tmp push`, and is NOT forbidden for `git status` (paste all five
  verdicts into the handoff entry);
  `node plugins/agentic-workflow/tools/run-codex.mjs --help`
  prints usage; state in the handoff entry that the shim, not the API, served
  every case.
- **Read budget**: ~540 lines read, ~830 lines written — the heaviest brief, at
  the ceiling but inside it. If it runs long, the split point is clean: steps
  1–2 + 4's schema/rules groups in one session; steps 3 + 4's adapter group **and
  step 5's lint wiring** in the next (the wiring travels with the adapter half so
  the gate never references a harness whose adapter cases do not exist yet); log
  it as a deviation rather than rushing the adapter. Suits: `backend`.
  Security-boundary brief: the rules file and the sandbox flag derivation are the
  guardrail parity mechanism.

### S2 — conventions + commands: `AGENTS.md`, conform ladder, `/tune`, `/connect codex`, `/doctor`

- **Reads**: `plugins/agentic-workflow/tools/conform.mjs` whole (199 — anchors:
  `conventionsFile()` line 78, `deadClaudeMdAnchors()` line 82, the `LADDER`
  array 109–172, the output block 188–199);
  `plugins/agentic-workflow/commands/bootstrap.md` lines 120–159 (159 total —
  anchor: "If `AGENTS.md` or `CLAUDE.md` exists, add a short pointer near the
  top", line 137); `plugins/agentic-workflow/commands/sync.md` lines 1–30 and
  90–130 (157 total — anchor: "## 3.7 Apply the structure ladder", line 97);
  `plugins/agentic-workflow/commands/adopt.md` lines 50–70 (anchor: "Existing
  conventions", line 57); `tools/lint.mjs` lines 232–254
  (`checkTemplateFrontmatter` — the rule every new `templates/*.md` must satisfy);
  `plugins/agentic-workflow/commands/tune.md` whole (53);
  `plugins/agentic-workflow/commands/connect.md` lines 1–30 (frontmatter, mode
  dispatch, the secret rule) and 100–166 (the "Record (only after the round-trip
  passed)" step and the whole `server` mode — copy its proven-round-trip shape);
  `plugins/agentic-workflow/commands/doctor.md` whole (101 — probe-group style,
  the 🟢/🟡/🔴 contract);
  `docs/product/engineering/runtime-agnostic-codex.md` lines 70–84 (§5 selection
  + `/tune` grammar), 178–187 (§9 conventions) and 188–202 (§10 setup + health).
- **Catalog**: none.
- **Do**:
  1. `plugins/agentic-workflow/templates/agents-md.md` — frontmatter `status:
     living`, `owner-agent: chronicler`, `refresh-trigger: event` (lint checks all
     three, and that `owner-agent` is a real agent stem); body is a POINTER only,
     well under the 32 KiB cap: read `docs/WORKFLOW.md` §10 first; role prompts
     live under the plugin's `agents/` with project overrides in
     `.claude/agents/`; obey the brief; return the distillate; never edit
     `.plans/`, never commit, never push, never merge.
  2. `tools/conform.mjs` — `conventionsFile()` prefers `AGENTS.md`; new ladder
     entry `{ id: 'agents-md-primary', since: '1.51.0' }` reporting the three gap
     states (no `AGENTS.md`; `CLAUDE.md` present without the `@AGENTS.md` import;
     both present but `AGENTS.md` lacks the pointer block), fix line naming
     `/agentic-workflow:sync`; the dead-anchor check keeps running on whatever
     `conventionsFile()` returns.
  3. `commands/bootstrap.md` — create `AGENTS.md` from the template when absent,
     create or patch `CLAUDE.md` so its first non-blank line is `@AGENTS.md`
     (Claude-only notes below it); plus one line: when §10 already records a codex
     runtime, bootstrap writes `.codex/rules/agentic-workflow.rules` from the
     template — the trust entry and the round trip stay `/connect codex`'s job (a
     user-config edit is never a bootstrap side effect).
  4. `commands/sync.md` step 3.7 — the one-time move: a rich `CLAUDE.md` with
     no/stale `AGENTS.md` → runtime-neutral content moves to `AGENTS.md`, the
     import stays in `CLAUDE.md`, reported line by line, never silently.
  5. `commands/adopt.md` — one line recording the conventions precedence.
  6. Dogfood: create this repo's root `AGENTS.md` from the new template and a
     root `CLAUDE.md` whose first non-blank line is `@AGENTS.md` (neither file
     exists today — verified), so the repo stays conformant against its own new
     ladder entry. Every backticked path in `AGENTS.md` must resolve —
     `conform.mjs`'s dead-anchor check now reads it.
  7. `commands/tune.md` — `argument-hint` gains the runtime forms; alias
     validation accepts `codex`, `codex:<model>` and the existing Claude tiers;
     the fresh copy into `.claude/agents/<role>.md` sets `runtime:` and `effort:`.
     **`model:` must stay a valid Claude tier** (memo §5 is wrong to put
     `model: gpt-6-astra` there; S3 corrects it): that file is also a Claude Code
     project agent, so a foreign model id would break the Claude spawn of the same
     role — including the locked Fable override for security-boundary reviews. The
     Codex model rides in the runtime value, `runtime: codex:gpt-6-astra`. Banner
     becomes `TUNED (runtime: codex:<model>, effort: <effort>) — `; the no-arg
     table gains a **runtime** column;
     default effort `high` for `reviewer`, `planner`, `advisor`, `architect`,
     `medium` otherwise (the owner's global `low` is deliberately overridden per
     spawn); `reset` unchanged. `/agentic-workflow:tune reviewer codex` must PRINT
     the locked constraint: a codex reviewer covers ROUTINE checkpoints only, and
     a checkpoint whose diff touches a security boundary (auth, session
     credential, authorization, tenancy, money, schema, migrations — including the
     rules file and the sandbox flag derivation) stays on Fable per §5 convergence
     rule 7, where the orchestrator overrides the tune.
  8. `commands/connect.md` — a `codex` MODE beside `server`. Edit the
     frontmatter `description` and `argument-hint` (lines 2–3, which enumerate the
     modes) as well as the dispatch line near the top, then add a section with
     these steps, each verified before the next and nothing recorded until the
     round trip proves out:
     (i) `codex --version` ≥ 0.146 and an authenticated login;
     (ii) copy `templates/codex.rules` to `.codex/rules/agentic-workflow.rules` in
     the target repo and run `codex execpolicy check --rules
     .codex/rules/agentic-workflow.rules git push origin main` → forbidden.
     **Label this step a syntax check**: `execpolicy check` reads the file only
     and never consults the trust layer, so it passes in an untrusted repo and
     proves nothing about whether the rules are live;
     (iii) **trust**: project-layer rules are inert until the repo is trusted, so
     ask with AskUserQuestion and, only on an explicit okay, add
     `[projects."<absolute repo path>"] trust_level = "trusted"` to
     `~/.codex/config.toml` — never a silent user-config edit; then RE-READ
     `~/.codex/config.toml` and confirm the `[projects."<absolute repo path>"]`
     table is present with `trust_level = "trusted"` (a write that did not land,
     or landed under a different path spelling, is the failure this re-read
     catches). If the owner declines, stop, write no §10 row, and report that the
     guardrails would be loaded-but-disabled;
     (iv) register the §10 code index as an MCP server with `codex mcp add` when
     one exists — a no-op-with-a-note here, whose §10 **Code index** is `none`;
     (v) **round-trip proof**: one cheap read-only `codex exec` (globals first:
     `codex -a never exec -s read-only --json --output-schema <schema> -o <tmp>`)
     whose prompt asks the model to run a command that the sandbox would otherwise
     ALLOW — `git commit --dry-run` or `gh pr create --help`, never
     `git push --dry-run` (a push fails on the read-only sandbox's network denial
     with or without trust, so it cannot distinguish the two and is a false
     positive). Read the rejection from the `--json` EVENT STREAM, not the model's
     prose; the proof is an execpolicy-rejection event plus a valid distillate,
     which together demonstrate binary, auth, schema, rules AND trust;
     (vi) only then the §10 **Runtimes** row: `claude (default) · codex: <model>
     (connected <date>) · rules: .codex/rules/agentic-workflow.rules · trust:
     user-layer entry present`.
  9. `commands/doctor.md` — one probe group: advisory "Runtimes: claude only —
     not configured" when the §10 row is absent; **fails closed** when the row
     names codex and any of binary / auth / the rules file / this repo's
     `trust_level = "trusted"` entry / the schema file is missing, each red row
     carrying exactly one fix (`/agentic-workflow:connect codex`). Probe the trust
     entry by READING `~/.codex/config.toml` for the `[projects."<abs repo path>"]`
     table — never by running `execpolicy check`, which returns `forbidden` in an
     untrusted repo and would report protection that is not live. A missing trust
     entry is RED, not yellow: the rules file is present but inert.
- **Verify**: `node tools/lint.mjs` exits 0 (template frontmatter, dead anchors,
  namespaced `/agentic-workflow:<cmd>` mentions, and the template-reference check
  — every `templates/…` path named here exists because S1 created it); three
  throwaway fixtures under the scratch dir prove the ladder — `node
  plugins/agentic-workflow/tools/conform.mjs --root <fixture> --plugin
  plugins/agentic-workflow --json` names `agents-md-primary` for each gap state
  and omits it for a conformant fixture (paste the four verdicts into the handoff
  entry); `node plugins/agentic-workflow/tools/conform.mjs --root . --plugin
  plugins/agentic-workflow --brief` reports no new gap for this repo. Do NOT run
  the round-trip `codex exec` — that is the owner's interactive step; this brief
  only authors the command text.
- **Read budget**: ~640 lines read, ~270 written. Suits: `devops`.

### S3 — routing, protocol, and the permanent plan-judge (issue #79)

- **Reads**: `gh issue view 79 --repo xyzhub/agentic-workflow` (the plan-judge
  problem, proposal, checklist and scope — the authority for step 4);
  `plugins/agentic-workflow/commands/mission.md` lines 83–111 (§1 Plan / replan —
  where the plan-judge step goes) and 112–200 (§2 Run + §3 Checkpoint — 238
  total); `plugins/agentic-workflow/commands/plan.md` lines 55–90 (§3 approval →
  §4 decompose → Boundaries — 87 total);
  `plugins/agentic-workflow/agents/planner.md` lines 25–76 (trio authoring + the
  estimate rule at line 68 — 128 total);
  `plugins/agentic-workflow/agents/reviewer.md` lines 44–90 (checkpoint protocol —
  the mode the plan-judge sits beside) and 155–180 (Output — 180 total);
  `plugins/agentic-workflow/templates/WORKFLOW.md` lines 250–281 (§3 guardrail
  table + closing paragraph), 375–390 (§5 convergence rules, incl. the estimate
  rule at line 381), 538–560 (§6 opening), 830–891 (§9 mapping), 891–922 (§10
  profile table) — 1221 total, ranged only;
  `plugins/agentic-workflow/templates/mission-plan.md` lines 15–30 (the estimate
  paragraph at line 22); `docs/WORKFLOW.md` lines 821–844 (this repo's §10);
  `docs/product/engineering/runtime-agnostic-codex.md` lines 203–208 (§11).
- **Catalog**: none.
- **Do**:
  1. `commands/mission.md` — step 2 item 2 resolves the runtime by the locked
     precedence (brief header field → tune override → `claude`), then spawns:
     `claude` via the Agent tool exactly as today, `codex` via `node
     $CLAUDE_PLUGIN_ROOT/tools/run-codex.mjs …` with the Bash tool's
     `run_in_background: true`, reading the distillate FILE on return (never
     stdout). Step 3 gains: for codex runs the orchestrator marks the ledger row
     from the distillate's `status`, commits the `changed_paths` itself (the run
     touches neither `.plans/` nor git history), passes `--resume <thread_id>
     --note "<corrective>"` for the one-corrective-retry rule, and treats
     `changed_paths` empty on `done` as suspicious (`[~]` + reviewer confirmation
     before `[x]`). Step 3 also states the locked reviewer rule: a codex
     `reviewer` tune covers ROUTINE checkpoints only, and when the diff's risk
     class demands Fable (auth, session credential, authorization, tenancy, money,
     schema, migrations, any security boundary — including the rules file and the
     sandbox flag derivation) **the orchestrator overrides the tune and spawns the
     Claude reviewer on Fable**; a miscalled tier is a reviewer process finding.
  2. `agents/planner.md` — the optional brief header field `runtime:
     codex[:<model>] [effort=<low|medium|high>]`, set only when the mission's tune
     table already puts that role on codex or the owner asked.
  3. `templates/WORKFLOW.md` — §3 gains one table row: hooks fire only on Claude
     tool calls, so inside a foreign runtime the mechanical guardrails are the
     execpolicy rules file (`templates/codex.rules`, deployed to
     `.codex/rules/agentic-workflow.rules` and inert until the repo carries a
     user-layer `trust_level = "trusted"` entry) plus sandbox mode, with the
     docs-reminder replaced by the distillate's `high_impact_touched`. The same
     row states plainly what is NOT replicated: prefix rules cannot express host
     patterns, so the §14 paid-promotion/publish host guards do not exist inside
     Codex — read-only roles are covered by the network-off sandbox, and a builder
     role running with network access on is a named, accepted gap (Risks block +
     `## Closing` row). §6 gains a
     short paragraph "roles are runtime-neutral: the prompt is the role, the
     runtime is a spawn detail"; §9 gains the new machinery (the adapter, the
     distillate schema, the rules file, the `agents-md.md` template,
     `/agentic-workflow:connect codex`, `/agentic-workflow:tune`'s runtime
     argument, and the plan-judge); §10's profile table gains the **Runtimes** row.
     Also `docs/WORKFLOW.md` §10 — this repo's own **Runtimes** row, `claude
     (default) · codex: not connected (repo not trusted in ~/.codex/config.toml)`.
     Do not re-stamp the protocol version; `/agentic-workflow:sync` owns that.
  4. **Plan-judge (issue #79), permanent**: a plan-judge step in
     `commands/mission.md` §1 — after the planner returns, automatically in
     `plan` mode and on `replan`, spawn a fresh read-only one-shot `reviewer` in
     plan-judge mode over the trio; APPROVE → surface the open questions as
     today; REVISE → the planner revises once, a second REVISE surfaces to the
     owner. The same step in `commands/plan.md` §4 (decompose) before the hand-off
     in §5. A **plan-judge mode** section in `agents/reviewer.md` carrying the
     issue's checklist verbatim in substance (done criteria a named gate verifies ·
     reads pre-resolved with line ranges · no probe a doc lookup settles ·
     decisions consistent with the source memo/issue · size within budget ·
     security-boundary flag set where the Fable tier applies · `Estimate:` =
     briefs + checkpoints only), read-only tools, output ≤ one page with per-brief
     findings and a single APPROVE/REVISE verdict. A `templates/WORKFLOW.md` §5
     paragraph describing the step. Then fix the estimate rule at its three sites
     so the protocol and the judge agree: `agents/planner.md:68`,
     `templates/WORKFLOW.md:381`, `templates/mission-plan.md:22` — briefs +
     checkpoints; a corrective counts when it fires, never pre-booked.
- **Verify**: `node tools/lint.mjs` exits 0 — specifically the section check
  (every `§N` written must exist as a WORKFLOW heading; do NOT add a new numbered
  section), the cross-reference checks (namespaced command mentions; every
  agent/command named in both READMEs and WORKFLOW.md — no new agent or command
  ships, the plan-judge is a `reviewer` MODE), and the template-reference check;
  confirm `mission.md`'s `allowed-tools` already contains `Bash` and `Task` (it
  does). Re-read the plan-judge mode against issue #79 and confirm every
  checklist item from the issue appears; confirm the estimate rule now reads the
  same at all three sites. No eval run in this brief (S4 authors the scenario).
- **Read budget**: ~560 lines read, ~320 written. Suits: `devops`.

### S4 — record: memo corrections, CHANGELOG, version, READMEs, eval scenario

**Ordering**: S4 runs AFTER S3 — its CHANGELOG entry, README lines and eval
scenario describe behaviour S3's routing and plan-judge edits must already
state, and the `codex-routing` scenario drives the `mission.md` routing S3
writes. Running it earlier would document text that does not exist yet.

- **Reads**: `docs/product/engineering/runtime-agnostic-codex.md` — the ranges
  being corrected: 26–41 (§3 fact rows), 70–84 (§5 `/tune` grammar), 111–135
  (§6 flag table), 157–176 (§7/§8) — 239 total; `CHANGELOG.md` lines 1–40 (the
  `## [Unreleased]` block + the 1.50.1 entry as the format model — 991 total);
  `README.md` whole (59); `plugins/agentic-workflow/README.md` — grep first
  (`grep -n "tune\|connect\|templates/\|tools/" plugins/agentic-workflow/README.md`)
  then read only the two matching ranges, ~90 of 303; `evals/run.mjs` lines
  96–178 (the scenario loop, the child spawn at ~120–123, the `checks.mjs`
  contract, judging — 178 total); `evals/scenarios/mission-plan/scenario.md` +
  `checks.mjs` + `rubric.md` (43 total — the three-file scenario shape);
  `plugins/agentic-workflow/.claude-plugin/plugin.json` (10). The mission's own
  trio is context, not a read — S3's handoff entry names what landed.
- **Catalog**: none.
- **Do**:
  1. **Correct the design memo** (`docs/product/engineering/runtime-agnostic-codex.md`)
     where the binary proved it wrong — this is part of the record, not a silent
     fix: §3's fact row 31 and §6's flag table (globals before `exec`; the narrower
     `exec resume` shape), §8 (literal tokens, nested-list alternatives, no globs
     and no host patterns), §5 (`model:` stays a Claude tier; the Codex model rides
     in `runtime: codex:<model>`), and §3's project-rules row (settled path + the
     trust gate). Each correction dated, with the source noted — the memo stays the
     design record, so a stale claim there is a future defect.
  2. New eval scenario `evals/scenarios/codex-routing/` — `scenario.md`
     (frontmatter `budget-usd`, `pass-bar`, `judge-files`; the prompt drives
     `/agentic-workflow:mission "<name>" continue` over the fixture), `fixture/`
     (an adopted mini-project: `docs/WORKFLOW.md` §10 with a Runtimes row, a trio
     in `.plans/` whose S1 brief carries `runtime: codex`, and a fake `codex` shim
     at `fixture/bin/codex`), `checks.mjs` (deterministic: the adapter was invoked
     with `--role`/`--brief`/`--out`, a distillate file was written, the ledger row
     and `Sessions used:` advanced, and the Agent tool was NOT used for that
     brief), `rubric.md` (weighted `- [w=N] id: criterion` lines).
  3. A **2-line edit to `evals/run.mjs`** (near the scenario spawn, lines
     ~120–123) setting `CODEX_BIN=<fixture>/bin/codex` in the child env when the
     fixture provides that file. Without it the runner spawns `claude` with the
     inherited env and the scenario reaches the REAL codex binary, breaking the
     no-real-run decision; "a shim on PATH" is not a mechanism the runner has.
  4. `CHANGELOG.md` — a `## [1.51.0] — <date>` entry moved out of
     `## [Unreleased]`, naming the plan-judge (#79) as well; the version bump in
     `plugins/agentic-workflow/.claude-plugin/plugin.json` → `1.51.0`; and both
     READMEs — the runtime selector, the adapter, `AGENTS.md` as the primary
     conventions file, `/agentic-workflow:connect codex`, the `/doctor` probe, and
     the plan-judge.
- **Verify**: `node tools/lint.mjs` exits 0 (the reverse cross-reference duty:
  everything named resolves; no new command or agent ships);
  `node evals/run.mjs codex-routing` — tier 2, run ONLY with the owner's spend
  okay (~$1–5); without it, record in the ledger that the scenario is authored and
  deferred to the checkpoint, and say so in the report. Either way, prove the
  fixture cannot reach the real binary: with `CODEX_BIN` unset the adapter
  resolves `codex` from PATH, so assert the runner exports
  `CODEX_BIN=<fixture>/bin/codex` for this scenario before any spend. Confirm the
  memo carries no claim the binary has disproved.
- **Read budget**: ~420 lines read, ~250 written. Suits: `devops`.

**Checkpoint ckpt-p1** ends the mission, after S4 — ONE independent `reviewer`
(fresh context, one-shot) over the whole diff. **Fable required**: the diff carries the
execpolicy rules file and the sandbox/network flag derivation, a security
boundary (§5 convergence rule 7). It re-runs `node tools/lint.mjs`, `node
tools/run-codex-test.mjs`, the conform fixtures, the binary-backed `codex
execpolicy check` verdicts and the eval scenario (owner spend permitting);
diff-reviews `main..mission/runtime-agnostic-codex`; confirms no code path reaches
a real `codex exec` from a test or a gate, that `--ignore-rules` appears nowhere
in the adapter, that a Claude-only project's behaviour is unchanged (the opt-in
claim), and that the CHANGELOG, the version and issue #79's scope all match.

From the plan-judge's "not verified" list, the reviewer must also settle with the
REAL binary: does a shell wrapper defeat the prefix rules? Run `codex execpolicy
check --rules <file> zsh -lc "git push"` (and the `bash -lc` form) and record the
verdict. If the wrapper is NOT caught, that is a blocking finding — the rules
need a `["zsh","-lc"]`/`["bash","-lc"]` treatment or the gap goes in the
WORKFLOW §3 row and the `## Closing` register alongside the host-pattern gap. The
`--json` event shape (`thread_id`, `usage`) stays deferred to the owner-fired
n=1 — the reviewer confirms the adapter degrades cleanly on absent fields rather
than claiming the shape is verified. Then
staging → verify (lint green on the phase branch + `claude --plugin-dir` load in
a consumer session) → ONE PR to `main` for the human to merge, its body carrying
the closing keyword for #79 (gate policy `human-merge`).

---
_Size every brief to its read budget; split any that can't fit and note the
split. Each session's outcome and any deviation lands in
`.plans/runtime-agnostic-codex.state.md`, never only in chat._
