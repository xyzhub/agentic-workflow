---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: tune-presets — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide. Deploys to `.plans/tune-presets.md`._

Converted from `docs/product/decisions/2026-10-11-tune-presets-brief.md`
(+ `-memos.md`, `-metrics.md`, `-counsel.md`), 2026-10-11. Every line of the
brief's **Locked decisions** block arrives locked; where a lock amends a memo,
the lock wins. This plan adds only tactical refinements (marked `planner`).

Goal: a project picks one spend/effort posture (Lean / Balanced / Rigorous /
Unattended) at bootstrap or with one `/tune preset` command, Haiku 5.5 record
roles run isolated under a 100K compaction window through a `claude -p`
adapter, and an unattended loop carries a per-tick token ceiling — shipped as
v1.57.0 (configuration) and v1.58.0 (runtime).

Platform note (plan-judge, 2026-10-11): `claude --help` on 2.1.296 lists a
**per-process** compaction knob, `--autocompact <auto|tokens>` (100k–1M), beside
the process-wide env var; a **per-agent** compaction field still does not exist —
the brief's Problem statement holds for the agent file, and the adapter uses both
per-process knobs on the child.

Estimate: 4 sessions — `phases` mode, 2 phases, owner-amended 2026-10-11 (see
Locked decisions, "Shape amended"): 2 briefs + 2 checkpoints. Per phase:
P1 = 1 brief (presets JSON + lint + registry + tune verbs + bootstrap/adopt +
doctor + docs) + 1 checkpoint (Opus 5.5); P2 = 1 brief (adapter + hook
silencer + Haiku shadows + mission.md `claude-p` + AC-9 runs + tick budget) +
1 checkpoint (Fable). No corrective is pre-booked.

## Tasks

_Acceptance criteria reuse the brief's stable ids `AC-1..AC-12` (full wording:
the brief §"Acceptance criteria"; the condensed form here is what the reviewer
checks). `P` = `plugins/agentic-workflow`._

**Phase 1 — configuration (branch `mission/tune-presets-p1`, v1.57.0)**

1. **`P/templates/tune-presets.json`** — AC-1: one JSON, four presets
   (`lean`, `balanced`, `rigorous`, `unattended`) × the 20 live agents, rows
   per agent with a `class` label (gates · shape · builders · research ·
   record), `model` pinned to one of `claude-fable-5-1` / `claude-opus-5-5` /
   `claude-sonnet-5-5` / `claude-haiku-5-5`, `effort` ∈ {low, medium, high};
   matrix per the brief as amended (Unattended builders Opus 5.5 · medium;
   Lean builders Sonnet 5.5 · medium with the JSON `note`; plan-judge Fable
   in all four — a mission.md rule, not a cell). Haiku rows (Lean +
   Unattended record class: chronicler, writer, curator, intake) carry
   `runtime: claude-p`, `compact_window: 100000`, `maxTurns: 24`,
   `read_budget` (500; chronicler 500 with the ranged-JOURNEY note),
   `allowed_tools` (explicit, scoped Bash only — no bare `Bash`), and
   `fallback: {model: claude-sonnet-5-5, effort: low, runtime: claude}`.
   `unattended.tick_budget: 750000`. Acceptance: `node tools/lint.mjs` green
   with the new check; the file round-trips through `tune preset show`.
2. **Lint + fixtures** — AC-12: `tools/lint.mjs` gains `checkTunePresets`
   built on an exported pure function `tunePresetFindings(json, agentNames)`
   (house "Fixture mechanics" pattern) asserting: exactly those 4 preset
   names; every preset covers exactly the live agent list; model ids in the
   pinned set; effort enum; Haiku rows carry runtime `claude-p` +
   `compact_window` 100000 + integer `maxTurns`/`read_budget` + an
   `allowed_tools` list with no bare `Bash` + a non-Haiku `fallback`; no model
   id matching `haiku` other than `claude-haiku-5-5`; `unattended.tick_budget`
   a positive integer. `tools/lint-test.mjs` gains `PRESET_CASES`: the real
   file → 0 findings (1 positive); four mutated copies → a bad id, a missing
   agent, a Haiku row without the window, a Haiku row with bare `Bash` each
   fail (4/4 red). Acceptance: `lint: clean`, zero `warn:` lines, `lint-test:
   clean (N cases)` with N ≥ today's + 5.
3. **Registry minor bump** — AC-2 (machine side): `P/tools/agents.mjs` parses
   `preset:<name>` from the banner kind list into `override.preset:
   string|null`; `P/templates/agents-registry.schema.json` adds the field
   (strict shape → minor bump + CHANGELOG line); `tools/agents-test.mjs` adds
   a preset-banner shadow fixture (preset parsed) and a composed one
   (`preset:lean, model` → preset parsed, kind includes `model`).
4. **`/agentic-workflow:tune preset <name> | show | reset`** — AC-2, AC-3 in
   `P/commands/tune.md` under the D1 lock: apply = for every agent whose
   preset cell differs from its base (comparator below), fresh copy + banner
   kind `preset:<name>` (`> Tuned from agentic-workflow v<ver> (base
   sha256:<12hex>) — preset:<name> override (model: …, effort: …[, runtime: …,
   maxTurns: …]). Reset with /tune <agent> reset.`) + description prefix
   `TUNED (preset: <name>) — `; skips-and-reports any existing shadow lacking a
   `preset:` banner (hand tune wins); rewrites the §10 **Tune preset** row to
   `<name> (applied YYYY-MM-DD)`, with `default` noted when unanswered — `balanced (default, applied YYYY-MM-DD)`; every reader parses the preset name as the first token; warns (never blocks) when an active ledger
   (no `Closed:`, `Sessions used:` > 0) exists; idempotent on re-run. `show` =
   the matrix from `agents.mjs --json` + the JSON, `*` where `effective` ≠ the
   row. `reset` = delete only shadows that are preset-authored (banner kind
   exactly `[preset:<name>]` AND effective == row); composed or unbannered →
   report, keep. Per-agent verbs unchanged; `diff` already shows a composed
   tune against the preset shadow's base. Acceptance: metrics test (a) on a
   scratch copy — 4 presets × apply/diff/reset green, lint + agents-test green
   at each step; the per-agent-wins case (AC-3) shown in `tune diff`.
5. **Bootstrap / adopt question + §10 row** — AC-4: `P/commands/bootstrap.md`
   step 1 gains ONE preset question (Balanced recommended; Rigorous
   recommended when the interview names payments / auth / PII — the same
   signals that seed AUTH.md) and step 2 writes the §10 **Tune preset** row and
   applies the preset (no files for Balanced); `P/commands/adopt.md` step 1
   adds the row if absent, same question; unanswered → `balanced (default,
   applied YYYY-MM-DD)` (name = first token).
6. **`/doctor` checks** — AC-5: `P/commands/doctor.md` §2 gains (a) **Preset
   drift** — a `preset:<name>` shadow whose effective ≠ the §10 preset's row
   with no composed kind → 🟡 naming the agent; (b) **Preset switch while
   open** — the §10 row's first token ≠ the `preset:` name on any shadow (or no
   §10 row while preset shadows exist) AND any `.plans/*.state.md` lacks `Closed:`
   with `Sessions used:` > 0 → 🔴 "preset switched mid-mission (OUT of v1):
   revert or close the mission first". Clean state → no finding.
7. **Record (P1 share)** — AC-11: `P/templates/WORKFLOW.md` §10 gains the
   **Tune preset** row (placeholder prose naming the grammar `<name> (applied
   YYYY-MM-DD)` / `balanced (default, applied YYYY-MM-DD)`) and §5 gains one
   sentence after the "Roles are runtime-neutral" paragraph pointing at
   presets (`tune preset`, `templates/tune-presets.json`) — no mechanics
   restated; `docs/WORKFLOW.md` mirror with this repo's row = `balanced`;
   README one line; CHANGELOG `## [1.57.0]`; `plugin.json` 1.57.0;
   `P/commands/mission.md` rule 7 wording widened from "codex reviewer tune"
   to "any non-Fable reviewer tune" + one clause "the plan-judge runs on Fable
   under every preset"; metrics doc gains the `wc -c` baselines row (lock).

**Phase 2 — runtime (branch `mission/tune-presets-p2`, cut from the P1 head, v1.58.0)**

8. **`P/tools/run-claude.mjs`** — AC-6 under the D4 + child-isolation locks:
   sibling importing run-codex's exported helpers (`briefText`, `section`,
   `roleFile`, `frontmatterValue`, `toolsOf`, `validate`, `statusSnapshot`,
   `changedPaths`, `highImpactPatterns`, `highImpactTouched`, `SCHEMA_PATH`);
   CLI `--role --brief <file>#<anchor> --cwd --out [--model] [--effort]
   [--max-turns] [--compact-window] [--allowed-tools] [--resume] [--note]`
   (`--compact-window` feeds BOTH the child env var and `--autocompact`);
   child argv `claude -p --agent <role | agentic-workflow:role> --model <id>
   --max-turns <n> --autocompact <compact> --effort <level> --permission-mode
   acceptEdits --permission-prompts none --allowedTools <list> --strict-mcp-config
   --output-format stream-json --verbose --json-schema <distillate.schema.json>
   <prompt>` — never `--bare`, never `bypassPermissions`; env = parent env
   minus `CLAUDECODE`, `CLAUDE_CODE_ENTRYPOINT`, plus
   `CLAUDE_CODE_AUTO_COMPACT_WINDOW=<compact>` and `AGENTIC_WORKFLOW_CHILD=1`,
   on the child env object only; stdin `'ignore'`; events saved to
   `<out>.events.jsonl`; only the final `result` line parsed (`subtype`,
   `num_turns`, `session_id` → `thread_id`, `usage`, `structured_output`,
   `modelUsage` → `runtime.model`); peak per-request prompt scanned →
   `deviations: "peak context ≈ N tokens; window W"`; refuses to spawn when
   `--allowed-tools` carries bare `Bash`. EXIT: `success` → by `status`;
   `error_max_turns` / `error_max_budget_usd` → `blocked`, `blocked_reason:
   budget: …`, 3; `error_during_execution`, schema retries exhausted, exit 0
   with no `result` line → `failed`, 1; binary ENOENT / not logged in →
   `blocked`, 3. `runtime.name: "claude-p"`. `tools/run-claude-test.mjs`
   (shim via `CLAUDE_BIN`, mirrors run-codex-test) + `checkRunClaudeHarness`
   in lint. Acceptance: harness green; lint green.
9. **Hook silencer** — child-isolation lock: the four `UserPromptSubmit` hooks
   (branch warning, router, mission-budget, handoff-budget) and both
   beat-enforcers (`PreToolUse`, `Stop`) exit 0 first thing when
   `AGENTIC_WORKFLOW_CHILD=1`; `tools/hook-test.mjs` gains one case per hook
   (env set → silent, exit 0) via its `env:` option. Acceptance: hook-test
   green; the §3 hooks table says so in one clause.
10. **Haiku shadows + budget line + re-route** — AC-7: the preset apply (task 4)
    writes Haiku shadows with frontmatter `model: claude-haiku-5-5`, `effort:
    low`, `runtime: claude-p`, `maxTurns: 24`; `P/templates/mission-sessions.md`
    read-budget line gains "Haiku tier: ≤500 lines, maxTurns 24";
    `P/commands/mission.md` step 3: a `blocked` whose `blocked_reason` starts
    `budget:` from a `claude-p` run is re-spawned ONCE on the row's `fallback`
    via the Agent tool (this IS the one corrective retry; increments
    `Sessions used:`); a second budget block surfaces.
11. **`mission.md` `claude-p` resolution** — AC-8: step 2 gains a `claude-p`
    bullet mirroring `codex` (Bash `run_in_background: true`, read the
    distillate FILE, orchestrator commits `changed_paths`); the "Codex runs —
    you own the ledger and git" paragraph generalizes to foreign runtimes
    (`codex`, `claude-p`) rather than duplicating. `mission.md` stays < 21,600 B.
12. **AC-9 real runs** — recorded in the ledger handoff + `.plans/tune-presets.artifacts/`:
    in a scratch clone with `tune preset lean` applied, (1) chronicler via the
    adapter on `claude-haiku-5-5` → valid distillate, `modelUsage` =
    haiku only, `system/init` tool list recorded, first-request tokens, parent
    `printenv CLAUDE_CODE_AUTO_COMPACT_WINDOW` empty before and after; (2)
    intake the same way; (3) the deliberate ~120K overflow probe (a brief that
    reads `CHANGELOG.md` + `docs/product/JOURNEY.md` + `docs/WORKFLOW.md` whole,
    `--max-turns 40`) → either a `compact_boundary` event near 100K in the
    event stream or a clean `blocked budget:` exit 3 with a schema-valid
    distillate; peak prompt quoted. AC-9 may move `maxTurns`/`read_budget` as a
    dated note in the ledger (lock).
13. **Tick + mission budgets** — AC-10 under the D3 lock: ledger header fields
    `Tick budget: <int>` (planner, from `unattended.tick_budget` when §10 names
    Unattended), `Tick tokens: <int>` (orchestrator, reset at tick start,
    written after every brief), `Mission budget: <int>` (orchestrator, Σ tick
    tokens); `hooks/lib/mission-budget.sh` prints `· tick <k>/<N> tokens` on
    the status line, `🛑 TICK BUDGET` at k ≥ N, `🛑 MISSION BUDGET` when
    `Mission budget` ≥ `Tick budget × ceil(Estimate / 2)` (planner derivation —
    `Estimate` counts briefs + checkpoints while a tick = brief + gate + ≤1
    corrective, so ticks ≈ Estimate / 2; no new field); print only, exit 0; silent when the fields are absent; hook-test
    cases (absent → unchanged; under → line; tick over → stop text; mission
    over → stop text). `P/commands/autopilot.md` continue paragraph and
    `mission.md` loop rule: on a tick stop, no new brief, ledger written, owner
    channel when configured, tick ends. `P/templates/mission-state.md` header
    documents the three optional lines; `P/agents/planner.md` one sentence
    (copy `tick_budget` → `Tick budget:`). `P/templates/WORKFLOW.md` §5 Loop
    mode paragraph carries the one canonical sentence; §3 mission-budget row
    one clause.
14. **Record (P2 share)** — `P/templates/WORKFLOW.md` §9 runtime-adapters
    bullet names `run-claude.mjs`; §10 **Runtimes** placeholder names
    `claude-p`; `docs/WORKFLOW.md` mirror (Runtimes row gains `claude-p:
    tools/run-claude.mjs, proven 2026-10-11 on claude 2.1.296`); README;
    CHANGELOG `## [1.58.0]`; `plugin.json` 1.58.0; `templates/WORKFLOW.md`
    stays < 108,000 B (trim the §3 Foreign-runtime row to a runtime-neutral
    form if needed).

## Value sourcing

| AC | Value | Source kind | Where |
|---|---|---|---|
| AC-1 | model ids `claude-fable-5-1` · `claude-opus-5-5` · `claude-sonnet-5-5` · `claude-haiku-5-5` | locked decision | 2026-10-11 brief "Value sourcing" row 1 (claude-api reference table, 2026-10-06 cache) |
| AC-1 | matrix cells (per class × preset) | locked decision | 2026-10-11 brief "Preset matrix" + lock "Matrix amendments" (Unattended builders Opus 5.5 · medium; Lean Sonnet builders + `note`) |
| AC-1 | class membership: gates {reviewer, advisor} · shape {planner, architect, compass} · builders {backend, frontend, devops, security} · research {researcher, brainstormer, designer, business, marketing, ops, analyst} · record {chronicler, writer, curator, intake} | locked decision | 2026-10-11 brief "Preset matrix" Classes line (20 agents = B1) |
| AC-1 / AC-6 | `compact_window` 100000 | locked decision | 2026-10-11 brief row 3 (owner rule; env-var floor 100K) |
| AC-1 / AC-7 | `maxTurns` 24 · `read_budget` 500 · `fallback {claude-sonnet-5-5, low, claude}` | locked decision | 2026-10-11 lock "Haiku tool allowlist" → memos.md §D2 "Values this decision settles" |
| AC-1 | Haiku `allowed_tools` per role | derivation | role `tools:` lines with `Bash` replaced by the scoped commands the role body names: chronicler `agents/chronicler.md:4,20-21,142` → `Bash(git log:*)`, `Bash(gh pr list:*)`; curator `agents/curator.md:4` (no Bash command named in the body → drop Bash); writer `:4`, intake `:4` (no Bash) |
| AC-1 | Lean `note` text | locked decision | 2026-10-11 lock "Matrix amendments": "saving unmeasured until 3 Lean briefs record their corrective count vs the 0.6/brief baseline" |
| AC-1 / AC-10 | `tick_budget` 750000 | locked decision | 2026-10-11 lock "Budgets (D3)" (counsel financial #3 sizing) |
| AC-2 | banner kind token `preset:<name>`; composed kinds append (`preset:lean, model`); description prefix `TUNED (preset: <name>) — ` | locked decision | 2026-10-11 memos.md §D1 "Values this decision settles" |
| AC-2 | stamp format (version + `base sha256:` 12 hex) | derivation | `P/commands/tune.md:53-61` (existing banner, v1.54.0) |
| AC-2 | preset-authored := banner `preset:<name>` AND `effective == JSON row`; apply skips unbannered shadows; reset deletes only preset-authored | locked decision | 2026-10-11 lock "D1 semantics" |
| AC-2 | registry field `override.preset: string\|null` | locked decision | 2026-10-11 memos.md §D1 values; schema rule `P/templates/agents-registry.schema.json:4` (strict → minor bump) |
| AC-2 | comparator for "cell differs from base": `inherit` and an absent `effort` in the base resolve to the agent's **Balanced** cell; tier aliases `opus`/`sonnet`/`haiku` → the pinned 5.5/5.1 id (a `tier_aliases` map in the JSON) | derivation (planner) | `docs/product/decisions/2026-10-11-tune-presets-brief.md:7` ("the plugin's implicit tier rules" ARE Balanced) + `:81` lock "D1 semantics" ("Balanced on this repo = zero files"); only reading under which both hold |
| AC-4 | question text + default `balanced (default, applied YYYY-MM-DD)` (the brief's `balanced (default)` under the unified row grammar below); Rigorous trigger words payments / auth / PII | locked decision | 2026-10-11 brief AC-4; auth signal reuses `P/commands/bootstrap.md:87-91` (AUTH.md auth-surface detection) |
| AC-4 / AC-5 | §10 row grammar `**Tune preset** \| <name> (applied YYYY-MM-DD)`; unanswered → `balanced (default, applied YYYY-MM-DD)`; parse: name = first token | derivation (planner) | `docs/product/decisions/2026-10-11-tune-presets-memos.md:107-111` (§D3 Option B: §10 records the posture, the ledger the live state) + brief `:43` (AC-4 `balanced (default)`) |
| AC-6 | distillate shape, EXIT map `0 done · 3 blocked · 1 failed` | derivation | `P/templates/distillate.schema.json`; `P/tools/run-codex.mjs:468` (`EXIT`), `:471-577` (`main`) |
| AC-6 | child argv + env strip + flags | locked decision | 2026-10-11 lock "Child isolation (D4)" → memos.md §D4 values |
| AC-6 | `--allowedTools` entry grammar `Bash(git log:*)` (colon form) | derivation (planner) | `claude --help` 2.1.296 `--allowedTools` (its example is the space-glob form `Bash(git *)`; the colon form stays valid); AC-9 run 1 records the `system/init` tool list as the witness |
| AC-6 | `--autocompact <compact_window>` passed beside the env var | derivation (plan-judge) | `claude --help` 2.1.296 lists `--autocompact <auto\|tokens>` (100k–1M); lock "Child isolation (D4)" keeps the env var |
| AC-1 | `schema_version: 1` in `tune-presets.json` | derivation (planner) | `P/templates/agents-registry.schema.json:4` (the registry's versioning rule: shape changes ship as a plugin minor bump — the JSON mirrors it with an explicit integer) |
| AC-7 | `blocked_reason` prefix `budget:`; compaction → `deviations` line, not a block; re-route once to `fallback` = the corrective retry | locked decision | 2026-10-11 memos.md §D2 values + lock "Haiku adapter stays in v1" |
| AC-9 | overflow probe size ≈120K; evidence fields | locked decision | 2026-10-11 lock "Haiku adapter stays in v1" + metrics.md §4 AC-9 |
| AC-10 | fields `Tick budget:` · `Tick tokens:` · `Mission budget:`; tick = brief + gate + ≤1 corrective; print-only | locked decision | 2026-10-11 lock "Budgets (D3)" |
| AC-10 | 🛑 MISSION BUDGET threshold = `Tick budget × ceil(Estimate / 2)` | derivation (planner) | `Estimate` counts briefs + checkpoints (`docs/WORKFLOW.md:393-394`), a tick = brief + gate + ≤1 corrective (lock "Budgets (D3)") → ticks ≈ Estimate / 2; `hooks/lib/mission-budget.sh:62-70` integer-math pattern |
| AC-11 | byte ceilings to hold: `mission.md` < 21,600 B · `templates/WORKFLOW.md` < 108,000 B (90 % warn bands) | derivation | `tools/lint.mjs:897-907` (`BUDGETS` 24,000 / 120,000, warn 90 %); measured 2026-10-11: 21,384 B / 106,973 B |
| AC-12 | version numbers 1.57.0 / 1.58.0 | locked decision | 2026-10-11 lock "Shape" (one release per phase) as amended (2 phases) |

## Locked decisions

_Owner, 2026-10-11, after counsel + spike — copied from the brief; never
re-litigated. Entries marked `planner` are tactical refinements inside those
decisions._

- 2026-10-11 — **Shape (original)**: `phases`, 3 phases, `Estimate: 6` (P1 JSON + lint + schema + tune verbs; P2 adapter + Haiku + AC-9; P3 bootstrap/adopt/doctor + tick + hook + docs). Gate policy human-merge; one release per phase.
- **Shape amended 2026-10-11 by owner: 2 phases, Estimate 4.** Owner (verbatim): "try to reduce token spending in this mission, 6 sessions is high for a preset configuration." P1 "configuration" = AC-1, 2, 3, 4, 5, 11, 12 (v1.57.0; checkpoint reviewer **Opus 5.5** — planner recommendation: no auth / money / schema / boundary in the diff, §5 rule 7 does not require Fable; the owner sees this at hand-off). P2 "runtime" = AC-6, 7, 8, 9, 10 (v1.58.0; checkpoint reviewer **Fable** — hook stack + a child process's permission flags are boundary-class). Scope and every other lock unchanged. Token economies bind: one builder per phase and the orchestrator **resumes** that builder for a corrective; checkpoint reviewers re-run gates + per-AC verdict + the diff-touched lenses only, ≤ one page, a post-corrective pass reviews the corrective diff only; the chronicler runs ONCE at mission close (orchestrator updates the status page between); the plan-judge is one pass with named cell fixes applied by the planner, no re-judge; AC-9's Haiku runs stay (≈$0.004 each); no counsel at checkpoints.
- 2026-10-11 — **Haiku adapter stays in v1 (A and B)**: owner kept A after financial counsel showed ≤$0.14/mission saving; the spike proved the transport (`claude -p --agent agentic-workflow:chronicler --model claude-haiku-5-5`, 1 turn, 9,887-token first request, parent env untouched, no nesting refusal on 2.1.296); AC-9 adds a deliberate ~120K overflow probe as the only witness of the window.
- 2026-10-11 — **D1 semantics**: one `templates/tune-presets.json`; a shadow is written only where a preset cell differs from the agent's base frontmatter — Balanced on this repo = §10 row `balanced`, zero files; preset-authored := banner kind `preset:<name>` AND `effective == JSON row`; `apply` skips-and-reports any existing shadow lacking a `preset:` banner; `reset` deletes only preset-authored shadows; re-apply idempotent.
- 2026-10-11 — **Child isolation (D4)**: adapter strips `CLAUDECODE` and `CLAUDE_CODE_ENTRYPOINT`, passes `--strict-mcp-config`, `--max-turns`, `--permission-mode acceptEdits --permission-prompts none` (never bypass, never `--bare`), `--output-format stream-json --verbose --json-schema templates/distillate.schema.json`; sets `AGENTIC_WORKFLOW_CHILD=1` and the four UserPromptSubmit hooks + beat-enforcer exit 0 when set (hook-test fixture). `exit 0` with no `result` line → `failed`. `CLAUDE_CODE_AUTO_COMPACT_WINDOW=100000` on the child env object only.
- 2026-10-11 — **Haiku tool allowlist**: Haiku rows carry explicit `allowed_tools`; lint rejects bare `Bash` on a Haiku row; the adapter refuses to spawn with one. Haiku rows also carry `fallback: {model: claude-sonnet-5-5, effort: low, runtime: claude}`, `maxTurns: 24` (also `--max-turns 24`), per-role `read_budget` (default 500; JOURNEY.md is 744 lines → the chronicler uses ranged reads). Starting values; AC-9 may move them as a dated note.
- 2026-10-11 — **Gate tier per preset**: the plan-judge is Fable in ALL four presets; Lean's Opus 5.5 gate applies to the checkpoint reviewer only, with §5 rule-7 boundary escalation widened in mission.md from "codex reviewer tune" to "any non-Fable reviewer tune".
- 2026-10-11 — **Budgets (D3)**: a tick = one brief + its gate + at most one corrective. `tick_budget` default **750,000** (Unattended; planner copies it to the ledger header as `Tick budget: <int>`); cumulative `Mission budget: <int>` = Σ tick tokens; orchestrator writes running `Tick tokens: <int>` after every brief, resets at tick start; `mission-budget.sh` prints `tick k/N tokens` and `🛑 TICK BUDGET` / `🛑 MISSION BUDGET` — print only, never block; the only in-flight stop is the child's `--max-turns`. The memo's "would have stopped the 779,762 run" claim is struck.
- 2026-10-11 — **Matrix amendments**: Unattended builders → Opus 5.5 · medium; Lean keeps Sonnet 5.5 builders with a JSON `note` ("saving unmeasured until 3 Lean briefs record their corrective count vs the 0.6/brief baseline").
- 2026-10-11 — **Metrics**: add `wc -c` baselines for tune.md, mission.md, doctor.md, bootstrap.md, adopt.md to the metrics doc (zero `warn:` must hold); the Haiku cliff section compares to the Sonnet baseline.
- 2026-10-11 — **Priority / defaults**: top of backlog, before operate-triage. Balanced when unanswered; this repo = Balanced.
- 2026-10-11 — **Codex rows stay IN** (presets may name `runtime: codex`; unavailable today, #122). No brief in this mission sets `runtime: codex`; every builder and reviewer runs on Claude.
- 2026-10-11 (planner) — **Comparator for "differs from base"** (implements D1, see Value sourcing AC-2): a base `model: inherit` and an absent `effort` resolve to the agent's Balanced cell; tier aliases map to the pinned ids via a `tier_aliases` object in the JSON. Consequence: `tune preset balanced` writes zero files in every project, not only this one; `preset show` renders Balanced from the JSON (pinned ids) while the registry shows `inherit`.
- 2026-10-11 (planner) — **Lint fixture mechanics**: `tunePresetFindings(json, agentNames)` is an exported pure function; `lint-test.mjs` drives it with the real file (0 findings) and four mutated copies (bad id, missing agent, Haiku row without the window, Haiku row with bare `Bash`), in the house `BUDGET_CASES` shape; `checkTunePresets` is the gate wrapper. No tree copies.
- 2026-10-11 (planner) — **Haiku shadow frontmatter** carries only Claude Code keys + the existing tune keys (`model`, `effort`, `runtime: claude-p`, `maxTurns`); `compact_window`, `allowed_tools`, `read_budget`, `fallback` are read from the JSON row by the adapter (`--preset <name> --role <role>` or explicit flags) and by mission.md's re-route — never invented into frontmatter Claude Code does not know.
- 2026-10-11 (planner) — **`--allowedTools` grammar**: permission-rule colon form (`Bash(git log:*)`); the shadow's `tools:` keeps plain `Bash` so the agent file loads; the allowlist + `--permission-prompts none` deny every other Bash command. AC-9 run 1 witnesses it.
- 2026-10-11 (planner) — **🛑 MISSION BUDGET** fires at `Mission budget ≥ Tick budget × ceil(Estimate / 2)` — `Estimate` counts briefs + checkpoints, a tick = brief + gate + ≤1 corrective; derived, no fourth field.
- 2026-10-11 (planner) — **AC-5(b) qualifier**: "open ledger" = a `.plans/*.state.md` with no `Closed:` stamp AND `Sessions used:` > 0 (a planned-only trio is not a running mission — the same predicate `hooks/lib/active-ledger.sh` uses). Narrower than the brief's bare "lacks `Closed:`"; consequence today: this mission's own ledger (`Sessions used: 0`) does not block a preset switch until S1 starts.
- 2026-10-11 (planner) — **§10 Tune preset row grammar** (one form everywhere): `<name> (applied YYYY-MM-DD)`; unanswered → `balanced (default, applied YYYY-MM-DD)`; every reader (`tune preset show|reset`, `/doctor`, the adapter's `--preset` resolution) parses the preset name as the row's first token.
- 2026-10-11 (planner) — **Byte ceilings**: `mission.md` ends each phase < 21,600 B; `templates/WORKFLOW.md` < 108,000 B (both 90 % warn bands). P2 generalizes the two codex paragraphs in `mission.md` and the §3 Foreign-runtime row rather than appending siblings.
- 2026-10-11 (planner) — **Routing**: S1 → `devops` (lint tooling, JSON, command prose); S2 → `backend` (adapter + harness + hook scripts). Checkpoint p1 Opus 5.5, p2 Fable (owner-amended shape).
- 2026-10-11 (planner) — **Branching**: `mission/tune-presets-p2` cuts from the P1 head (P1's PR may still be open); each phase opens its own PR to `main` after its checkpoint.
- 2026-10-11 (planner) — **No conform rung** for the **Tune preset** row, by precedent (Test policy got none): bootstrap/adopt/tune write it; adopted ventures gain it at their next `/adopt`, or by hand.

## Risks

- **P2 brief density** (≈1,490 lines of reads, adapter + harness + hook silencer + tick budget): the one brief that may not fit. The builder decides the split the moment the adapter + harness are green (not after the budget is blown): AC-10 (tick/mission budget — `mission-budget.sh`, hook-test cases, templates, planner.md) → an `S2b`; that is an `Estimate:` rise to 5 recorded as a dated owner decision (§5 LA-1), never a silent second brief.
- **Byte budgets at 89 %** — `mission.md` (216 B under warn) and `templates/WORKFLOW.md` (1,027 B under warn). Bounded: both briefs carry the ceilings and the named trims (generalize, don't append); builders measure `wc -c` before hand-off and the PR body lists before/after.
- **Balanced ≡ implicit defaults is definitional**: if the Agent tool's unset effort is not "medium" in practice, Balanced-on-paper differs from Balanced-in-practice. Bounded: `preset show` renders the resolution so the gap is visible; a later preset cell change is a JSON edit.
- **`-p --agent` applies the project shadow** is inferred (spike used plugin scope). Bounded: AC-9 run 1 uses the scratch clone's `.claude/agents/chronicler.md`; the `system/init` line names the agent file; the memo's `--system-prompt-file` fallback is pre-described in D4 and would be a deviation entry, not a re-decision.
- **Flag names on 2.1.296**: `--permission-prompts none` / `--json-schema` are documented 2.1.259+; `--max-turns` is NOT listed in `claude --help` 2.1.296 although the spike accepted it — if it is rejected, the documented in-flight stop is `--max-budget-usd` (memos §D2 Option B) as the fallback, with `maxTurns` kept in the shadow frontmatter; `--autocompact` IS listed. The shim harness cannot catch an unknown flag — AC-9 run 1 is the first real witness; a mismatch is a deviation + adapter fix inside S2.
- **Hook silencer scope**: silencing the mission-budget hook inside the child also silences its overrun STOP there — intended (the child is a one-brief worker, the parent orchestrator keeps the ledger). The §3 hooks table says so in one clause.
- **Scratch-clone AC-9 edits**: the Haiku chronicler edits CHANGELOG/JOURNEY in the scratch clone only; nothing from the clone is committed — the evidence is the distillate + events files copied to `.plans/tune-presets.artifacts/`.
- **Registry schema strictness**: adding `override.preset` breaks any external consumer validating the old shape — accepted by the schema's own versioning rule (minor bump + CHANGELOG line).

## Open questions

(none — the owner's locked decisions and the 2026-10-11 shape amendment settle every value; planner refinements are marked and reversible.)

---
_The `.plans/tune-presets.sessions.md` briefs execute these tasks;
`.plans/tune-presets.state.md` tracks progress. Resolve every open question
before execution starts._
