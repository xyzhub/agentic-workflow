---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: runtime-agnostic-codex — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the expensive
exploration happened once, here._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/runtime-agnostic-codex.md` · Ledger:
`.plans/runtime-agnostic-codex.state.md`

Design source (read the named ranges, never whole):
`docs/product/engineering/runtime-agnostic-codex.md` — owner-approved, its §14
decisions are locked in the master plan.

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
| Eval suite | `node evals/run.mjs [scenario]` | 2 — P2 only, never CI, ~$1–5/scenario |
| Staging verify (§10 Staging = none) | lint green on the phase branch + `claude --plugin-dir` load in a consumer session | at each checkpoint |

**Codex CLI facts already probed (do not re-probe, 0.146.0 at
`/Users/baker/.local/bin/codex`)**: `codex exec` accepts `-a`, `-s
read-only|workspace-write|danger-full-access`, `-C/--cd`, `-m`, `-c key=value`,
`--search` (via the search feature flag set), `--json`, `-o/--output-last-message`,
`--output-schema <FILE>`, `--ephemeral`, `--ignore-rules`, `--ignore-user-config`,
`-p/--profile`, and `exec resume`. `codex execpolicy check --rules <PATH>
<COMMAND>…` exists (`-r/--rules` is repeatable). `codex debug prompt-input`
renders the model-visible prompt input as JSON.

**Execpolicy facts — settled by the owner 2026-09-11 from the Codex sources
(`codex-rs/core/src/exec_policy.rs`, `config/src/loader/mod.rs`); do not
re-probe**: rules load automatically from every config layer's `rules/` folder,
and the Project layer is `$(git rev-parse --show-toplevel)/.codex/rules/*.rules`.
The guardrail file ships as `<repo>/.codex/rules/agentic-workflow.rules`,
committed in the consumer repo, written from `templates/codex.rules` — no
user-level copy. Project-layer rules are loaded but **disabled until the project
is trusted**: a user-layer `[projects."<abs repo path>"] trust_level = "trusted"`
entry in `~/.codex/config.toml`. This repo is NOT trusted today; adding that entry
is `/connect codex`'s explicitly owner-approved step (S4), never a silent edit.
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
| `README.md` | 59 |
| `plugins/agentic-workflow/commands/tune.md` | 53 |

## Phase 1 — mechanics (branch: `mission/runtime-agnostic-codex-p1`, from `feat/runtime-agnostic-codex`)

Not parallel-safe: S2 extends the file S1 creates, S3 is independent but shares
the branch. Run S1 → S2 → S3.

### S1 — the rules file, the distillate schema, the harness skeleton

- **Reads**: `docs/product/engineering/runtime-agnostic-codex.md` lines 26–41
  (§3 verified facts) and 111–205 (§6 flags → §7 schema → §8 rules → §10 setup)
  — 239-line file, ranged only; `plugins/agentic-workflow/tools/ci-wait.mjs`
  lines 1–60 (134 total — the shipped-tool style: zero deps, arg parsing,
  self-test convention); `tools/lint.mjs` lines 1–60 (helpers `fail`, `read`,
  `spawnSync` imports), lines 400–435 (`checkCatalogSelftest` +
  `checkCiWaitSelftest` — copy this shape exactly), lines 800–832 (the check
  registry / run block where a new check is registered); `tools/hook-test.mjs`
  lines 1–28 (harness conventions, exit 0 = pass).
- **Catalog**: none.
- **Do**: (the load-path probe is gone — the owner settled it from the Codex
  sources on 2026-09-11; read the "Execpolicy facts" block above and treat it as
  given. Do NOT run `codex exec`.)
  1. Write `plugins/agentic-workflow/templates/distillate.schema.json` per memo
     §7: `status`, `summary`, `changed_paths`, `gates[]`
     (`name`/`result`/`first_error`), `deviations[]`, `next[]`,
     `blocked_reason`, `runtime` (`name`/`model`/`effort`/`thread_id`), `usage`
     (`input_tokens`/`output_tokens`), `high_impact_touched`. Strict-mode safe:
     `"additionalProperties": false` on every object and EVERY property listed
     in `required`, with the memo's optional fields as nullable unions
     (`["string","null"]`, `["object","null"]`, `["array","null"]`). Not a `.md`
     file, so the template-frontmatter lint rule does not apply.
  2. Write `plugins/agentic-workflow/templates/codex.rules` per memo §8 —
     Starlark `prefix_rule` entries with `decision = "forbidden"` and a
     justification string that reads like the matching guardrail hook message,
     covering: `git push` in every form (including `git -C <dir> push`),
     `git commit`, `git tag` and `git push --tags` / `--follow-tags`,
     `gh pr create`, `gh pr merge`, and the §14 paid-promotion/publish hosts.
     Give every rule `match` / `not_match` example command lines in a
     machine-readable comment block (one command per line, a stable prefix like
     `# match:` / `# not_match:`) so the harness can enumerate them. Add a header
     comment naming the deployed location — `<repo>/.codex/rules/agentic-workflow.rules`,
     Codex's Project config layer — and the trust requirement (the file is inert
     until `[projects."<abs repo path>"] trust_level = "trusted"` exists in
     `~/.codex/config.toml`; `/connect codex` adds it with the owner's okay).
  3. Create `tools/run-codex-test.mjs` (repo root, zero deps, exit 0 = pass,
     1 = fail, same header-comment style as `tools/hook-test.mjs`) with two case
     groups: (a) schema — parses, strictness invariant (every object's
     `required` covers its `properties`, `additionalProperties: false`
     everywhere), the memo §7 field set present; (b) rules — structural
     assertions always (each required command family has a rule, every rule has
     a justification and at least one `match` + one `not_match` example), plus
     binary-backed assertions that run `codex execpolicy check --rules
     <templates/codex.rules> <example>` for every enumerated example and assert
     forbidden/allowed accordingly, printing `SKIP (no codex binary)` when
     `codex` is not on PATH.
  4. Wire the harness into `tools/lint.mjs` as a tier-1.5 check (numbered after
     the existing `ci-wait` one, e.g. `// ── 10.7 run-codex adapter harness`),
     fail-closed when the runner is missing, with the same `spawnSync` +
     detail-extraction body as `checkCiWaitSelftest`, and register it in the run
     block.
- **Verify**: `node tools/run-codex-test.mjs` exits 0 and prints the case
  counts (with the SKIP line only if the binary is absent — it is present on
  this machine, so expect real verdicts); `node tools/lint.mjs` exits 0;
  `codex execpolicy check --rules plugins/agentic-workflow/templates/codex.rules
  git push origin main` returns a forbidden verdict and the same check on
  `git status` does not (paste both verdicts into the handoff entry); confirm in
  the handoff entry that no `codex exec` ran.
- **Read budget**: ~320 lines. Suits: `devops` (shipped tooling + policy files).
  Security-boundary brief: the rules file and the sandbox flag table are the
  guardrail parity mechanism.

### S2 — the codex adapter

- **Reads**: `docs/product/engineering/runtime-agnostic-codex.md` lines 85–135
  (§6 invocation, prompt assembly, flag derivation, post-run merge) and 209–218
  (§12 error handling); `plugins/agentic-workflow/tools/ci-wait.mjs` whole (134
  — the closest shipped-tool model: argv parsing, background-friendly exit
  codes); the three files S1 created (`templates/distillate.schema.json`,
  `templates/codex.rules`, `tools/run-codex-test.mjs`);
  `docs/WORKFLOW.md` lines 821–844 (§10 profile — the **High-impact files** row
  the adapter intersects against); `plugins/agentic-workflow/skills/plain-report/SKILL.md`
  whole (91 — the skill whose text gets inlined when a role names it).
  **Grep, do not read**: `grep -n "^tools:" plugins/agentic-workflow/agents/*.md`
  for the three `tools:` shapes (read-only / write / web) — the planner verified
  they are exactly those three; `grep -rn "plain-report\|impeccable"
  plugins/agentic-workflow/agents/` for which roles name a skill.
- **Catalog**: none.
- **Do**: write `plugins/agentic-workflow/tools/run-codex.mjs` — zero deps,
  Node ≥ 18:
  - argv: `--role --brief --cwd --out [--model] [--effort] [--resume] [--note]`,
    plus `--help`; invalid/missing args exit 1 with usage.
  - prompt assembly in the memo §6 order: role prompt body with frontmatter
    stripped (prefer `.claude/agents/<role>.md` when it exists, so a tune
    override's body wins), `docs/WORKFLOW.md` §10 verbatim, inlined text for any
    skill the role prompt names, the brief (`## S<n>` section of the named plan
    file, or ad-hoc text), the return contract (JSON matching the schema, plus
    the standing rules: never edit `.plans/`, never commit, never push, never
    merge, report `blocked` on anything needing an owner), then `--note`.
  - flags derived from the role's `tools:`: no `Write`/`Edit` → `-s read-only`;
    `Write`/`Edit` → `-s workspace-write`; role in {backend, frontend, devops,
    security} → `-c sandbox_workspace_write.network_access=true`;
    `WebSearch`/`WebFetch` → `--search`; always `-a never -C <cwd> --json -o
    <tmp last-message file> --output-schema <schema> -c
    model_reasoning_effort=<effort> -c shell_environment_policy.inherit=all -m
    <model>`; no `--ephemeral` (sessions persist for resume); `--resume
    <thread-id>` uses `codex exec resume`. **Never** pass `--ignore-rules`: it
    would disable the project-layer guardrail file that is the whole parity
    mechanism (locked decision, 2026-09-11).
  - post-run merge into `--out`: schema-validate the last message (on parse
    failure write `status: "failed"`, `first_error: "distillate not valid
    JSON"`, and save the raw beside it), then attach `thread_id` and `usage`
    from the JSONL event stream (tolerate absent fields → null, never throw),
    `changed_paths` from `git status --porcelain` in `--cwd` (the tree, not the
    model's claim), and `high_impact_touched` as the intersection with the §10
    high-impact list.
  - exit 0 on `done`, 3 on `blocked`, 1 on `failed`; never print the model's
    stdout as the result — the distillate file is the interface.
  Then extend `tools/run-codex-test.mjs` with the fake `codex` shim (an
  executable script on a temp PATH that records argv and emits canned JSONL
  events plus a last message) and the memo §13 unit assertions: flag derivation
  for the three tool shapes, prompt block order, skill inlining, schema
  validation and the non-JSON path, `changed_paths` from a temp git repo,
  `high_impact_touched`, all three exit codes, and — from the shim's recorded
  argv — that `--ignore-rules` appears on NO invocation (including the
  `--resume` path).
- **Verify**: `node tools/run-codex-test.mjs` exits 0 with every named case
  asserted; `node tools/lint.mjs` exits 0; `node
  plugins/agentic-workflow/tools/run-codex.mjs --help` prints usage and exits 1
  on missing args; state in the handoff entry that the shim, not the API, served
  every case.
- **Read budget**: ~520 lines. Suits: `backend`.

### S3 — `AGENTS.md` primary, the conform ladder entry, bootstrap/sync/adopt

- **Reads**: `plugins/agentic-workflow/tools/conform.mjs` whole (199 — anchors:
  `conventionsFile()` at line 78, `deadClaudeMdAnchors()` at 82, the `LADDER`
  array at 109–172, the `--brief`/`--json` output at 188–199);
  `plugins/agentic-workflow/commands/bootstrap.md` lines 120–159 (159 total —
  anchor: "If `AGENTS.md` or `CLAUDE.md` exists, add a short pointer near the
  top" at line 137); `plugins/agentic-workflow/commands/sync.md` lines 1–30 and
  90–130 (157 total — anchor: "## 3.7 Apply the structure ladder" at line 97);
  `plugins/agentic-workflow/commands/adopt.md` lines 50–70 (anchor: "Existing
  conventions" at line 57); `tools/lint.mjs` lines 232–254
  (`checkTemplateFrontmatter` — the rule every new `templates/*.md` must satisfy);
  `docs/product/engineering/runtime-agnostic-codex.md` lines 178–187 (§9).
- **Catalog**: none.
- **Do**:
  1. `plugins/agentic-workflow/templates/agents-md.md` — frontmatter `status:
     living`, `owner-agent: chronicler`, `refresh-trigger: event` (lint checks
     all three and that `owner-agent` is a real agent stem); body is a POINTER
     only, well under the 32 KiB cap: read `docs/WORKFLOW.md` §10 first; role
     prompts live under the plugin's `agents/` with project overrides in
     `.claude/agents/`; obey the brief; return the distillate; never edit
     `.plans/`, never commit, never push, never merge.
  2. `tools/conform.mjs` — `conventionsFile()` prefers `AGENTS.md` over
     `CLAUDE.md`; new ladder entry `{ id: 'agents-md-primary', since: '1.51.0' }`
     reporting the three gap states (no `AGENTS.md`; `CLAUDE.md` present without
     the `@AGENTS.md` import; both present but `AGENTS.md` lacks the pointer
     block) with a fix line naming `/agentic-workflow:sync`; the existing
     dead-anchor check keeps running on whatever `conventionsFile()` returns.
  3. `commands/bootstrap.md` — create `AGENTS.md` from the template when absent,
     and create or patch `CLAUDE.md` so its first non-blank line is
     `@AGENTS.md`, with Claude-only notes below the import.
  4. `commands/sync.md` step 3.7 — the one-time move: a rich `CLAUDE.md` with
     no/stale `AGENTS.md` → runtime-neutral content moves to `AGENTS.md`, the
     import stays in `CLAUDE.md`, and the move is reported line by line, never
     silently.
  5. `commands/adopt.md` — one line recording the conventions precedence.
  6. Dogfood: create this repo's root `AGENTS.md` from the new template (no root
     `CLAUDE.md` exists, so there is nothing to patch) so the repo stays
     conformant against its own new ladder entry. Every backticked path in it
     must resolve — `conform.mjs`'s dead-anchor check now reads this file.
- **Verify**: `node tools/lint.mjs` exits 0 (template frontmatter + dead-anchor
  rules included); three throwaway fixtures under the scratch dir prove the
  ladder — `node plugins/agentic-workflow/tools/conform.mjs --root <fixture>
  --plugin plugins/agentic-workflow --json` names `agents-md-primary` for each
  gap state and omits it for a conformant fixture (paste the four verdicts into
  the handoff entry); `node plugins/agentic-workflow/tools/conform.mjs --root .
  --plugin plugins/agentic-workflow --brief` reports no new gap for this repo.
- **Read budget**: ~400 lines. Suits: `devops`.

**Checkpoint ckpt-p1** ends phase 1 — the independent `reviewer` (fresh context,
one-shot). **Fable required**: the diff carries the execpolicy rules file and the
sandbox/network flag derivation, which are a security boundary (§5 convergence
rule 7). The reviewer re-runs `node tools/lint.mjs`, `node
tools/run-codex-test.mjs`, the three conform fixtures, and the binary-backed
`codex execpolicy check` verdicts locally; diff-reviews
`main..mission/runtime-agnostic-codex-p1`; and confirms that no code path can
reach a real `codex exec` from a test or a gate and that `--ignore-rules` appears
nowhere in the adapter. Then staging → verify (lint
green on the phase branch + `claude --plugin-dir` load in a consumer session) →
PR to `main` for the human to merge (gate policy `human-merge`).

## Phase 2 — commands, protocol, record (branch: `mission/runtime-agnostic-codex-p2`, from `staging` after P1 lands)

Not parallel-safe: S5 and S6 both touch protocol/record prose that S4's wording
must already be settled for.

### S4 — `/tune` runtime selector, `/connect codex`, `/doctor` probe

- **Reads**: `plugins/agentic-workflow/commands/tune.md` whole (53);
  `plugins/agentic-workflow/commands/connect.md` lines 1–30 (frontmatter, the
  mode dispatch line, the secret rule) and 100–166 (the "Record (only after the
  round-trip passed)" step and the whole `server` mode — copy its
  proven-round-trip shape); `plugins/agentic-workflow/commands/doctor.md` whole
  (101 — the probe-group style and the 🟢/🟡/🔴 contract);
  `docs/product/engineering/runtime-agnostic-codex.md` lines 70–84 (§5 selection
  + `/tune` grammar) and 188–202 (§10 setup + health);
  `plugins/agentic-workflow/commands/bootstrap.md` lines 130–159 (the scaffolding
  tail S3 already edited — 159 total).
- **Catalog**: none.
- **Do**:
  1. `tune.md` — `argument-hint` gains the runtime forms; alias validation
     accepts `codex`, `codex:<model>` and the existing Claude tiers; the fresh
     copy into `.claude/agents/<role>.md` sets `runtime:`/`model:`/`effort:`;
     the banner becomes `TUNED (runtime: codex, model: <model>, effort:
     <effort>) — `; the no-arg table gains a **runtime** column; default effort
     `high` for `reviewer`, `planner`, `advisor`, `architect` and `medium`
     otherwise (the owner's global `low` is deliberately overridden per spawn);
     `reset` unchanged. `/agentic-workflow:tune reviewer codex` must PRINT the
     locked constraint in its report: a codex reviewer covers ROUTINE checkpoints
     only, and a checkpoint whose diff touches a security boundary (auth, session
     credential, authorization, tenancy, money, schema, migrations — including the
     rules file and the sandbox flag derivation) stays on Fable per §5 convergence
     rule 7, where the orchestrator overrides the tune.
  2. `connect.md` — a `codex` MODE beside `server`: the dispatch line near the
     top, then a section with these steps in order, each verified before the next
     and nothing recorded until the round trip proves out:
     (i) `codex --version` ≥ 0.146 and an authenticated login;
     (ii) copy `templates/codex.rules` to `.codex/rules/agentic-workflow.rules`
     in the target repo (Codex's Project config layer) and verify the file decides
     with `codex execpolicy check --rules .codex/rules/agentic-workflow.rules git
     push origin main` → forbidden;
     (iii) **trust**: project-layer rules are inert until the repo is trusted, so
     ask the owner with AskUserQuestion and, only on an explicit okay, add
     `[projects."<absolute repo path>"] trust_level = "trusted"` to
     `~/.codex/config.toml` — never a silent user-config edit; refuse to continue
     (and write no §10 row) if the owner declines, reporting that the guardrails
     would be loaded-but-disabled;
     (iv) register the §10 code index as an MCP server with `codex mcp add` when
     one exists — a no-op-with-a-note in this repo, whose §10 **Code index** is
     `none`;
     (v) **round-trip proof**: one cheap read-only `codex exec` (`-a never -s
     read-only --output-schema <schema> -o <tmp>`) whose prompt asks the model to
     run `git push --dry-run origin main` and report the execpolicy rejection in
     its distillate — the proof is a valid distillate naming the rejection, which
     demonstrates the binary, the auth, the schema, the rules file AND the trust
     entry in one run;
     (vi) only then write the §10 **Runtimes** row: `claude (default) · codex:
     <model> (connected <date>) · rules: .codex/rules/agentic-workflow.rules ·
     trust: user-layer entry present`.
  3. `doctor.md` — one probe group: advisory "Runtimes: claude only — not
     configured" when the §10 row is absent; **fails closed** when the row names
     codex and any of binary / auth / `.codex/rules/agentic-workflow.rules` /
     the `trust_level = "trusted"` entry for this repo / the schema file is
     missing, each red row carrying exactly one fix
     (`/agentic-workflow:connect codex`). A missing trust entry is a RED, not a
     yellow: the rules file is present but inert, which reads as protection that
     is not there.
  4. `commands/bootstrap.md` — one line: when a project already records a codex
     runtime in §10, bootstrap writes `.codex/rules/agentic-workflow.rules` from
     the template alongside the other scaffolding; the trust entry and the
     round-trip stay `/agentic-workflow:connect codex`'s job (a user-config edit
     is never a bootstrap side effect).
  Every `templates/…` path named must be one S1/S3 created (lint resolves
  template references); every command mention must use the namespaced
  `/agentic-workflow:<cmd>` form; keep `": "` out of unquoted frontmatter values.
- **Verify**: `node tools/lint.mjs` exits 0; re-read the three files and confirm
  each states its own failure mode (what is NOT recorded when a step fails);
  paste the new §10 Runtimes row grammar into the handoff entry. Do NOT run the
  round-trip `codex exec` from this brief — it is the owner's interactive step;
  the brief only authors the command text.
- **Read budget**: ~330 lines. Suits: `devops`.

### S5 — orchestrator routing, planner brief field, protocol text

- **Reads**: `plugins/agentic-workflow/commands/mission.md` lines 112–200
  (§"2. Run — brief by brief" through the checkpoint branches — 238 total);
  `plugins/agentic-workflow/agents/planner.md` lines 25–60 (the trio-authoring
  section where a brief's fields are defined — 128 total);
  `plugins/agentic-workflow/templates/WORKFLOW.md` lines 250–281 (§3 guardrail
  table and its closing paragraph), 538–560 (§6 opening), 830–891 (§9 mapping),
  891–922 (§10 profile table) — 1221 total, ranged only; `docs/WORKFLOW.md`
  lines 821–844 (this repo's §10 table, where its own Runtimes row goes);
  `docs/product/engineering/runtime-agnostic-codex.md` lines 203–208 (§11).
- **Catalog**: none.
- **Do**:
  1. `mission.md` step 2 item 2 — resolve the runtime by the locked precedence
     (brief header field → tune override → `claude`), then spawn: `claude` via
     the Agent tool exactly as today, `codex` via
     `node $CLAUDE_PLUGIN_ROOT/tools/run-codex.mjs …` with the Bash tool's
     `run_in_background: true`, and on return read the distillate FILE (never the
     run's stdout). Step 3 gains: for codex runs the orchestrator marks the
     ledger row from the distillate's `status`, commits the `changed_paths`
     itself (the run touches neither `.plans/` nor git history), passes
     `--resume <thread_id> --note "<corrective>"` for the one-corrective-retry
     rule, and treats `changed_paths` empty on `done` as suspicious (`[~]` +
     reviewer confirmation before `[x]`). Step 3 must also state the locked
     reviewer rule: a codex `reviewer` tune covers ROUTINE checkpoints only, and
     when the diff's risk class demands Fable (auth, session credential,
     authorization, tenancy, money, schema, migrations, any security boundary —
     including the rules file and the sandbox flag derivation) **the orchestrator
     overrides the tune and spawns the Claude reviewer on Fable**; a miscalled
     tier is a reviewer process finding (§5 convergence rule 7).
  2. `planner.md` — the optional brief header field `runtime: codex[:<model>]
     [effort=<low|medium|high>]`, set only when the mission's tune table already
     puts that role on codex or the owner asked.
  3. `templates/WORKFLOW.md` — §3 gains one table row: hooks fire only on Claude
     tool calls, so inside a foreign runtime the mechanical guardrails are the
     execpolicy rules file (`templates/codex.rules`, deployed to
     `.codex/rules/agentic-workflow.rules` and inert until the repo carries a
     user-layer `trust_level = "trusted"` entry) plus sandbox mode, and the
     docs-reminder is replaced by the distillate's `high_impact_touched`; §6
     gains a short paragraph "roles are runtime-neutral: the prompt is the role,
     the runtime is a spawn detail"; §9 gains the new machinery (the adapter, the
     distillate schema, the rules file, the `agents-md.md` template,
     `/agentic-workflow:connect codex`, `/agentic-workflow:tune`'s runtime
     argument); §10's profile table gains the **Runtimes** row with its default
     (`claude (default)` and what a connected codex row looks like).
  4. `docs/WORKFLOW.md` §10 — this repo's own **Runtimes** row, `claude
     (default) · codex: not connected (repo not trusted in ~/.codex/config.toml)`
     until `/agentic-workflow:connect codex` runs. Do not
     re-stamp the protocol version here; `/agentic-workflow:sync` owns that.
- **Verify**: `node tools/lint.mjs` exits 0 — specifically its section check
  (every `§N` written must exist as a WORKFLOW heading; do NOT introduce a new
  numbered section), its cross-reference check (namespaced command mentions
  only), and its template-reference check; confirm `mission.md`'s
  `allowed-tools` already contains `Bash` (it does) so no frontmatter change is
  needed.
- **Read budget**: ~380 lines. Suits: `devops` (protocol prose + command files).

### S6 — record, version, eval scenario

- **Reads**: `CHANGELOG.md` lines 1–40 (the `## [Unreleased]` block and the
  1.50.1 entry as the format model — 991 total); `README.md` whole (59);
  `plugins/agentic-workflow/README.md` — grep first
  (`grep -n "tune\|connect\|templates/\|tools/" plugins/agentic-workflow/README.md`)
  then read only the two matching ranges, ~90 of 303 lines; `evals/run.mjs`
  lines 96–178 (the scenario loop, `checks.mjs` contract, artifacts, judging);
  `evals/scenarios/mission-plan/scenario.md` + `checks.mjs` + `rubric.md` (43
  total — the three-file scenario shape and its frontmatter keys);
  `plugins/agentic-workflow/.claude-plugin/plugin.json` (10).
- **Catalog**: none.
- **Do**:
  1. New eval scenario `evals/scenarios/codex-routing/`: `scenario.md`
     (frontmatter `budget-usd`, `pass-bar`, `judge-files`; the prompt drives
     `/agentic-workflow:mission "<name>" continue` over a fixture whose brief
     header carries `runtime: codex`), `fixture/` (an adopted mini-project: a
     `docs/WORKFLOW.md` §10 with a Runtimes row, a trio in `.plans/` whose S1
     brief is marked `runtime: codex`, and a fake `codex` shim the fixture puts
     on PATH so nothing reaches the API), `checks.mjs` (deterministic: the
     adapter was invoked with `--role`/`--brief`/`--out`, a distillate file was
     written, the ledger row and `Sessions used:` advanced, and the Agent tool
     was NOT used for that brief), `rubric.md` (weighted `- [w=N] id:
     criterion` lines per the runner's parser).
  2. `CHANGELOG.md` — a `## [1.51.0] — <date>` entry moved out of
     `## [Unreleased]`, in the house voice: what shipped, why (the memo), and
     what a Claude-only project sees (one import hop, nothing else).
  3. Version bump `plugins/agentic-workflow/.claude-plugin/plugin.json` →
     `1.51.0` (the §10 **Version pin**).
  4. Both READMEs — the runtime selector, the adapter, `AGENTS.md` as the primary
     conventions file, `/agentic-workflow:connect codex`, and the `/doctor`
     probe, in the existing prose shape.
- **Verify**: `node tools/lint.mjs` exits 0 (its reverse cross-reference duty:
  everything named must resolve, and no new command/agent was added);
  `node evals/run.mjs codex-routing` — tier 2, run ONLY with the owner's spend
  okay (~$1–5); without that okay, record in the ledger that the scenario is
  authored and deferred to the ckpt-p2 gate and say so in the report. Confirm
  the fixture shim means the scenario never calls the real Codex API.
- **Read budget**: ~330 lines. Suits: `devops`.

**Checkpoint ckpt-p2** ends phase 2 — the independent `reviewer` (fresh context,
one-shot); default tier unless the P2 diff reopened the rules file or the flag
derivation, in which case Fable again. It re-runs `node tools/lint.mjs`, the
adapter harness, and the eval scenario (owner spend permitting); diff-reviews
`main..mission/runtime-agnostic-codex-p2`; checks that a Claude-only project's
behaviour is unchanged (the opt-in claim) and that the CHANGELOG and version
match. Then staging → verify → PR to `main` for the human to merge.

---
_Size every brief to its read budget; split any that can't fit and note the
split. Each session's outcome and any deviation lands in
`.plans/runtime-agnostic-codex.state.md`, never only in chat._
