---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: tune-presets — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the expensive
exploration happens once, here. Deploys to `.plans/tune-presets.sessions.md`._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/tune-presets.md` · Ledger: `.plans/tune-presets.state.md`
Source docs: `docs/product/decisions/2026-10-11-tune-presets-{brief,memos,metrics,counsel}.md`.
Catalog: none (§10 — markdown plugin, no routes/schema; nothing to regenerate).
`P` = `plugins/agentic-workflow`. Line numbers measured 2026-10-11 at `11e04fb`.
Both briefs run on `claude` (no `runtime:` field — codex unavailable, #122).

Token economies (owner, 2026-10-11 — bind every session): one builder per
phase; a corrective **resumes** that builder with a narrow note, never a fresh
spawn; the checkpoint reviewer re-runs the gates, verdicts per cited AC, and
applies only the lenses the diff touched — ≤ one page; a post-corrective pass
reviews the corrective diff only; no counsel at checkpoints; the chronicler
runs once, at mission close.

## Large-files table

| File | Lines | Bytes (ceiling / warn) |
|---|---|---|
| `tools/hook-test.mjs` | 1772 | — |
| `tools/context-attrib.mjs` | 1446 | — (not read) |
| `P/templates/WORKFLOW.md` | 1360 | **106,973 / 120,000 (warn ≥ 108,000)** |
| `docs/WORKFLOW.md` | 1324 | — (mirror; lint never reads it) |
| `CHANGELOG.md` | 1293 | — |
| `tools/lint.mjs` | 1119 | — |
| `docs/product/JOURNEY.md` | 744 | — (AC-9 overflow-probe input only) |
| `tools/run-codex-test.mjs` | 733 | — |
| `P/tools/run-codex.mjs` | 577 | — |
| `P/commands/mission.md` | 327 | **21,384 / 24,000 (warn ≥ 21,600)** |
| `tools/marker-test.mjs` | 274 | — (not read) |
| `tools/agents-test.mjs` | 231 | — |
| `P/commands/settle.md` | 225 | — (not read) |
| `tools/lint-test.mjs` | 222 | — |
| `P/tools/agents.mjs` | 220 | — |
| `P/commands/tune.md` | 217 | 12,213 / 24,000 |
| `P/commands/autopilot.md` | 202 | 13,009 / 24,000 |
| `P/hooks/hooks.json` | 192 | — |
| `docs/product/decisions/2026-10-11-tune-presets-memos.md` | 177 | — |
| `P/commands/bootstrap.md` | 172 | 10,718 / 24,000 |
| `P/agents/chronicler.md` | 154 | 9,087 / 16,000 |
| `P/agents/planner.md` | 154 | 9,161 / 16,000 |
| `P/templates/mission-state.md` | 141 | — |
| `P/commands/adopt.md` | 131 | 8,025 / 24,000 |
| `P/commands/doctor.md` | 117 | 7,699 / 24,000 |
| `P/templates/distillate.schema.json` | 109 | — |
| `docs/product/decisions/2026-10-11-tune-presets-brief.md` | 88 | — |
| `P/hooks/lib/mission-budget.sh` | 86 | — |
| `docs/product/decisions/2026-10-11-tune-presets-metrics.md` | 80 | — |
| `P/agents/curator.md` | 78 | 4,872 / 16,000 |
| `README.md` | 68 | — |
| `P/agents/intake.md` | 65 | 3,699 / 16,000 |
| `.plans/OBLIGATIONS.md` | 64 | — |
| `P/agents/writer.md` | 61 | 3,381 / 16,000 |
| `P/templates/agents-registry.schema.json` | 61 | — |
| `P/templates/mission-sessions.md` | 55 | — |
| `P/hooks/lib/beat-enforcer-pretooluse.sh` | 49 | — |
| `P/hooks/lib/beat-enforcer-stop.sh` | 105 | — |
| `docs/product/decisions/2026-10-11-tune-presets-counsel.md` | 26 | — |
| `P/.claude-plugin/plugin.json` | 11 | — |
| `P/templates/tune-presets.json` | new (S1) | — |
| `P/tools/run-claude.mjs` · `tools/run-claude-test.mjs` | new (S2) | — |

## Phase 1 — configuration (branch: `mission/tune-presets-p1`, release v1.57.0)

_Not parallel-safe (one brief). Checkpoint reviewer: **Opus 5.5** (planner
recommendation — markdown + JSON + lint code, no auth / money / schema /
boundary; §5 rule 7 does not require Fable). Builder: `devops`._

### S1 — presets JSON + lint/fixtures + registry bump + `tune preset` verbs + bootstrap/adopt question + `/doctor` checks + docs (v1.57.0)

- **ACs**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-11, AC-12.
- **Reads** (≈1,260 lines):
  - `docs/product/decisions/2026-10-11-tune-presets-brief.md` 1-88 whole (matrix 22-35, ACs 37-57, value sourcing 59-70, **Locked decisions 78-88**).
  - `…-memos.md` 1-18 (shared facts) and §D1 20-57 (apply/reset/show mechanics + "Values this decision settles").
  - `…-metrics.md` 40-80 (§4 AC-12 measurement, §5 acceptance tests (a) and (c), §6).
  - `.plans/tune-presets.md` §Tasks 1-7, §Value sourcing, §Locked decisions (the planner refinements: comparator, fixture mechanics, Haiku frontmatter keys, `--allowedTools` grammar, byte ceilings).
  - `P/commands/tune.md` 1-217 whole (frontmatter + `argument-hint` 1-5; registry table 16-37; banner/stamp steps 39-72; per-verb sections 74-203; `rebase` 173-195; `reset` 196-203).
  - `tools/lint.mjs` 1-58 (header, `fail`, `allMd`, `frontmatter`), 482-525 (`checkRunCodexHarness` / `checkAgentsRegistryHarness` — the gate-wrapper shape), 895-960 (`BUDGETS`, `budgetVerdict`, `checkBudgets` — the pure-function + wrapper pattern), 1086-1119 (`export {…}` at 1090; the check list at 1113 — append `checkTunePresets`; also export `tunePresetFindings`).
  - `tools/lint-test.mjs` 1-30 (header, import line 23), 125-140 (`BUDGET_CASES` shape), 196-222 (runner — add `PRESET_CASES` to the loop and the `total`).
  - `P/templates/agents-registry.schema.json` 1-61 whole (`override` object at 43-55 — add `preset`, required).
  - `P/tools/agents.mjs` 45-60 (`BANNER_RE` at 50 — the kind text follows the `—`), 98-165 (`overrideKind` 105-116, `registry()` 118-165 — add `preset` parsed from the banner's kind list).
  - `tools/agents-test.mjs` 1-60 (helpers; `shadow()` fixture builder 44-55), 105-140 (registry cases — add the preset and composed-preset fixtures).
  - `P/commands/bootstrap.md` 11-35 (step 1 detect list — add the ONE preset question beside Test policy 28-30), 69-80 (step 2 writes §10 — add the row + apply), 85-91 (AUTH.md auth-surface signal = the Rigorous trigger).
  - `P/commands/adopt.md` 14-27 (step 1 — Test policy row sentence at 24-27; add the Tune preset row the same way).
  - `P/commands/doctor.md` 62-97 (§2 profile truthfulness — add the two preset checks after "Mission budget fields" 79-81; §3 "Stale tunes" 93-96 is the sibling pattern).
  - `P/commands/mission.md` 76-82 (rule 7 — widen "codex reviewer tune" → "any non-Fable reviewer tune"; add the clause "the plan-judge runs on Fable under every preset"), 180-187 ("Reviewer tier survives the runtime switch" — same widening). Trim in place; `wc -c` < 21,600 is the gate.
  - `P/templates/WORKFLOW.md` 612-618 (§5 "Roles are runtime-neutral" paragraph — the ONE preset sentence goes after it), 905-915 (§9 "Tunes are files" bullet — one clause naming `tune preset`), 973-1003 (§10 table — add **Tune preset** row after **Runtimes** 992, placeholder prose like the Test policy row at 988).
  - `docs/WORKFLOW.md` 601-607 (mirror of the §5 paragraph), 897-903 (§9 mirror), 956-983 (§10 — add `| **Tune preset** | balanced (default, applied 2026-10-11) |` after the Runtimes row 975; name = first token).
  - `README.md` 30-50 (tools/templates listing 36-37 + runtime paragraph 41-45 — one line for presets).
  - `CHANGELOG.md` 1-12 (`## [Unreleased]` → `## [1.57.0] — <date>`); `P/.claude-plugin/plugin.json` 1-11 (version).
  - All 20 `P/agents/*.md` lines 1-6 (frontmatter: `tools:` for `allowed_tools`; `model:` — only analyst/chronicler/writer carry `model: sonnet`, no agent carries `effort:`), plus `P/agents/chronicler.md` 18-24 and 140-144 (the `git log` / `gh pr list` commands the Haiku allowlist scopes).
- **Catalog**: none.
- **Do** (smallest change per task; master plan Tasks 1-7):
  1. Write `P/templates/tune-presets.json`: `schema_version: 1` (sourced: master plan Value sourcing AC-1 row → `agents-registry.schema.json:4`), `models` (4 pinned ids), `tier_aliases` (`opus`/`sonnet`/`haiku` → pinned ids; `inherit` → "balanced cell"), `classes` (5 lists = 20 agents), `presets.{lean,balanced,rigorous,unattended}.agents.<name>` rows `{class, model, effort[, runtime, compact_window, maxTurns, read_budget, allowed_tools, fallback]}`; `lean.note`; `unattended.tick_budget: 750000`. Haiku rows (lean + unattended × chronicler, writer, curator, intake): `runtime: claude-p`, `compact_window: 100000`, `maxTurns: 24`, `read_budget: 500`, `allowed_tools` = the role's `tools:` with `Bash` → `Bash(git log:*)`, `Bash(gh pr list:*)` (chronicler) or dropped (curator, writer, intake have no Bash command in their bodies), `fallback: {model: claude-sonnet-5-5, effort: low, runtime: claude}`.
  2. `tools/lint.mjs`: `export function tunePresetFindings(json, agentNames)` (returns `string[]`; rules in master plan Task 2) + `checkTunePresets()` wrapper reading the file and `agentNames()` from `P/agents/*.md`; add to the export line and the check list. `tools/lint-test.mjs`: `PRESET_CASES` — real file → `[]`; mutate model id → ≥1 finding naming the id; delete one agent from one preset → finding naming the agent; delete `compact_window` from one Haiku row → finding; plus a bare-`Bash` Haiku row → finding (4 negative, 1 positive; label provenance `planner`/`brief AC-12`).
  3. `P/tools/agents.mjs`: parse `preset:<name>` from the banner kind text → `override.preset` (null when absent); schema adds `"preset": {"type": ["string","null"]}` to `override.properties` + `required`; agents-test adds the two fixtures (banner `… — preset:lean override (model: claude-haiku-5-5, effort: low, runtime: claude-p, maxTurns: 24). Reset with …` → `preset: "lean"`; composed `preset:lean, model` → `preset: "lean"`, kind includes `model`); assert the registry still validates.
  4. `P/commands/tune.md`: `argument-hint` gains `preset <lean|balanced|rigorous|unattended> | preset show | preset reset`; new section `## /agentic-workflow:tune preset …` with apply / show / reset exactly per master plan Task 4 (comparator; skip-and-report unbannered; §10 row rewrite; open-ledger warning; idempotence; `show` matrix with `*`; `reset` preset-authored only). One-liner added to the no-arg table footer. Keep `P/commands/tune.md` prose tight (target ≤ 17,000 B).
  5. `P/commands/bootstrap.md` + `P/commands/adopt.md`: the ONE question (Balanced recommended; Rigorous recommended when payments / auth / PII named — reuse the AUTH.md signal), the §10 **Tune preset** row `<name> (applied YYYY-MM-DD)`, apply; unanswered → `balanced (default, applied YYYY-MM-DD)`; every reader parses the name as the first token.
  6. `P/commands/doctor.md` §2: **Preset drift** (🟡) and **Preset switch while open** (🔴) per master plan Task 6; clean state → silent.
  7. Docs: `P/templates/WORKFLOW.md` §5 one sentence (pointer only — no mechanics; the dedup guard keys on the four rule ids, but keep it a pointer anyway), §9 clause, §10 row; `docs/WORKFLOW.md` mirror with `balanced (default, applied 2026-10-11)`; `P/commands/mission.md` rule-7 widening + plan-judge clause; README line; CHANGELOG `## [1.57.0]` (Added: presets JSON + lint, `tune preset`, registry `override.preset` minor bump, bootstrap/adopt question, doctor checks); `plugin.json` 1.57.0; metrics doc §1 gains row B12 `wc -c` baselines: tune.md 12,213 · mission.md 21,384 · doctor.md 7,699 · bootstrap.md 10,718 · adopt.md 8,025 · templates/WORKFLOW.md 106,973.
- **Verify**:
  - `node tools/lint.mjs` → `lint: clean`, **zero `warn:` lines** (stderr empty); `node tools/lint-test.mjs` → `lint-test: clean (N cases)`, N ≥ today's + 5; `node tools/agents-test.mjs` green (cases ≥ 27 + 2).
  - Metrics test (a) on a scratch copy (`git worktree add /tmp/tp-scratch HEAD` or `cp -R`): for each of the 4 presets, apply → shadow count = the number of cells that differ (Balanced = 0; record the counts), banners carry `preset:<name>` + version + hash, lint + agents-test green; `tune diff` empty for each preset-authored shadow; `tune preset reset` → preset shadows 0, the scratch's hand-authored `backend.md`/`devops.md` untouched and reported. AC-3: `tune chronicler model sonnet` after `tune preset lean` → kind `preset:lean, model`, `tune diff` shows it, `tune preset reset` keeps and reports it.
  - Metrics test (c)-1 reasoning check (prose commands — no synthetic bootstrap run): read back bootstrap/adopt/doctor text against AC-4/AC-5 wording; the reviewer verdicts them per id.
  - `wc -c P/commands/mission.md` < 21,600; `wc -c P/templates/WORKFLOW.md` < 108,000; `wc -c P/commands/tune.md` printed; all four numbers in the handoff + PR body.
  - `claude --plugin-dir plugins/agentic-workflow` loads clean (§10 Staging step).
  - Never touch this repo's live `.claude/agents/` (holds hand-authored shadows, B2).
- **Read budget**: ≈1,260 lines (≤30 % of context). Suits: `devops`.

**Checkpoint p1** ends phase 1 — one-shot `reviewer` (**Opus 5.5**, fresh
context): re-run `node tools/lint.mjs` (zero `warn:`), `lint-test`,
`agents-test`; diff-review `main..mission/tune-presets-p1`; per-AC verdict
AC-1, 2, 3, 4, 5, 11, 12; lenses the diff touched only (DX, Efficiency); ≤ one
page. APPROVE → PR to `main` (v1.57.0) for Baker to merge. Corrective → resume
the S1 builder with the finding list; re-review the corrective diff only.

## Phase 2 — runtime (branch: `mission/tune-presets-p2`, cut from the P1 head, release v1.58.0)

_Not parallel-safe (one brief). Checkpoint reviewer: **Fable** (hook stack +
a child process's permission flags — boundary-class, §5 rule 7). Builder:
`backend`. The builder decides the split once the adapter + harness are green
(Do 1-2), not after the budget is blown: if the remainder cannot land within
budget, AC-10 (tick/mission budget) is the split point → `S2b` and `Estimate:` rises to 5 as a dated owner
decision (§5 LA-1) — never a silent second brief._

### S2 — `run-claude.mjs` adapter + harness + hook silencer + Haiku shadows/re-route + `claude-p` in mission.md + AC-9 runs + tick/mission budgets (v1.58.0)

- **ACs**: AC-6, AC-7, AC-8, AC-9, AC-10.
- **Reads** (≈1,490 lines):
  - `…-brief.md` 46-57 (J2/J3 ACs), 78-88 (Locked decisions — "Haiku adapter stays in v1", "Child isolation (D4)", "Haiku tool allowlist", "Budgets (D3)").
  - `…-memos.md` §D2 58-94 (cap sizing, overflow path, re-route), §D3 95-129 (fields, hook prints — the 400K default and "Last tick tokens" are superseded by the lock: 750,000 and `Tick tokens:`/`Mission budget:`), §D4 130-170 (adapter shape, argv, EXIT map, event parsing).
  - `…-counsel.md` 1-26 whole (spike command that worked; technical #1-#5).
  - `…-metrics.md` 44-57 (§4 AC-9 measurement + evidence fields).
  - `.plans/tune-presets.md` §Tasks 8-14, §Locked decisions (planner refinements: Haiku frontmatter keys, `--allowedTools` grammar, 🛑 MISSION BUDGET derivation, byte ceilings).
  - `P/tools/run-codex.mjs` 40-77 (USAGE text — mirror it), 78-145 (`parseArgs`, `stripFrontmatter`, `frontmatterValue`, `roleFile`, `toolsOf`, `section`, `workflowSection10`), 221-232 (`briefText` — the `<file>#<anchor>` contract), 282-340 (`deriveFlags`, `buildExecArgv`, `buildResumeArgv`, `resolveBin` — the argv-builder shape to mirror with `claude` flags), 337-470 (`validate`, `parseEvents`, `statusSnapshot`, `changedPaths`, `highImpactPatterns`, `highImpactTouched`, `EMPTY`, `writeOut`, `EXIT`), 471-577 (`main` — spawn, events file, ENOENT path, tree-derived overwrite, exit mapping, `isEntryPoint`).
  - `tools/run-codex-test.mjs` 1-30 (what the harness proves), 58-120 (the shim binary driven by `SHIM_SPEC`; decoy pattern), 150-180 (`runAdapter` env plumbing — `CODEX_BIN` → `CLAUDE_BIN`).
  - `P/templates/distillate.schema.json` 1-109 whole (`runtime.name` free string — `claude-p` needs no schema change; `usage` shape 93-102).
  - `P/hooks/hooks.json` 1-48 (the four `UserPromptSubmit` entries: branch warning 9, router 20, mission-budget 31, handoff-budget 42 — prefix each inline/scripted command with the `AGENTIC_WORKFLOW_CHILD` exit), 105-140 (beat-enforcer `PreToolUse` 110 + `Stop` 136).
  - `P/hooks/lib/mission-budget.sh` 1-86 whole (header contract 1-40; field greps 62-70 — add `Tick budget:` / `Tick tokens:` / `Mission budget:` in the same `^Key: <int>` grammar; status line 72-77; stop texts 79-85).
  - `P/hooks/lib/beat-enforcer-pretooluse.sh` 20-49 and `P/hooks/lib/beat-enforcer-stop.sh` 16-40 (where the first executable line sits — add the child exit there; `handoff-budget.sh` 1-30 likewise).
  - `tools/hook-test.mjs` 27-60 (`hookCommand`, `runHook` signature — `env:` option exists), 329-410 (mission-budget cases — add the tick/mission budget cases and the `AGENTIC_WORKFLOW_CHILD=1 → silent` case per hook).
  - `P/commands/mission.md` 126-160 (step 2 runtime precedence 131-153 — add the `claude-p` bullet after `codex` 141-147; step 3 corrective rule 154-160 — add the `budget:` re-route-once sentence), 163-187 ("Codex runs — you own the ledger and git" 169-178 → generalize to foreign runtimes; 180-187 reviewer-tier paragraph already widened in P1). **Ceiling: < 21,600 B after edits** — generalize, do not append.
  - `P/commands/autopilot.md` 28-36 (loop mode), 56-66 (convergence rules paragraph — add the tick-stop sentence as a pointer to §5).
  - `P/templates/mission-sessions.md` 46-47 (read-budget line — add "Haiku tier: ≤500 lines, maxTurns 24"); `P/templates/mission-state.md` 16-24 (budget header — document the three optional lines).
  - `P/agents/planner.md` 60-66 (the budget-lines sentence — add "copy `unattended.tick_budget` → `Tick budget:` when §10 names Unattended").
  - `P/templates/tune-presets.json` (from P1): the four Haiku rows + `unattended.tick_budget` (grep `claude-haiku-5-5`, `tick_budget`; ≈60 lines).
  - `P/agents/chronicler.md` 1-8, `P/agents/intake.md` 1-8 (frontmatter — the AC-9 roles).
  - `P/templates/WORKFLOW.md` 266-270 (§3 mission-budget row — one clause for the tick prints + the child silencer), 275 (§3 Foreign-runtime row — make runtime-neutral: Codex + `claude-p`; this is the trim site), 562-568 (§5 Loop mode paragraph — the ONE canonical tick-budget sentence), 958-966 (§9 runtime adapters — name `run-claude.mjs`), 992 (§10 Runtimes placeholder — mention `claude-p`). **Ceiling: < 108,000 B after edits.**
  - `docs/WORKFLOW.md` 258-262 (§3 mirror), 267 (Foreign-runtime mirror), 551-556 (loop mode mirror), 941-947 (§9 mirror), 975 (Runtimes row — append `claude-p: tools/run-claude.mjs (Haiku record roles; proven 2026-10-11, claude 2.1.296)`).
  - `tools/lint.mjs` 482-495 (`checkRunCodexHarness` — clone as `checkRunClaudeHarness`), 1113 (check list).
  - `CHANGELOG.md` 1-12; `P/.claude-plugin/plugin.json` 1-11.
- **Catalog**: none.
- **Do** (master plan Tasks 8-14):
  1. `P/tools/run-claude.mjs` per Task 8 (imports from `./run-codex.mjs`; `CLAUDE_BIN`; `--preset <name>` optional: resolves `compact_window`/`allowed_tools`/`maxTurns`/`read_budget` from the JSON row for `--role`, explicit flags win; default compact window 100000, applied BOTH as `CLAUDE_CODE_AUTO_COMPACT_WINDOW` on the child env and as `--autocompact <compact_window>` (per-process knob, `claude --help` 2.1.296); `# Budget` block in the prompt naming `read_budget` and `maxTurns`; refuses bare `Bash` in the allowlist with exit 3 `blocked`). `tools/run-claude-test.mjs`: shim `claude` records argv + env, emits canned `stream-json` lines; cases — argv order and presence (`-p`, `--agent`, `--model`, `--max-turns`, `--autocompact 100000`, `--permission-mode acceptEdits`, `--permission-prompts none`, `--strict-mcp-config`, `--json-schema`, no `--bare`, no `bypassPermissions`), child env has `CLAUDE_CODE_AUTO_COMPACT_WINDOW=100000` + `AGENTIC_WORKFLOW_CHILD=1` and lacks `CLAUDECODE`/`CLAUDE_CODE_ENTRYPOINT`, parent `process.env` unchanged after the run, `--agent <role>` when `.claude/agents/<role>.md` exists else `agentic-workflow:<role>`, EXIT map (success/done 0; `error_max_turns` → 3 + `budget:` prefix; `error_during_execution` → 1; exit 0 + no result line → 1; ENOENT → 3), bare-Bash refusal, events file written, `--help` names `CLAUDE_BIN`. Lint: `checkRunClaudeHarness`.
  2. Hook silencer: `[ "${AGENTIC_WORKFLOW_CHILD:-0}" = 1 ] && exit 0;` as the first statement of the four UserPromptSubmit commands (inline ones in `hooks.json`; `mission-budget.sh`, `handoff-budget.sh`) and both beat-enforcer scripts; hook-test: six `env: { AGENTIC_WORKFLOW_CHILD: '1' }` cases → `stdout === ''`, exit 0.
  3. AC-7: `tune.md` apply already writes Haiku shadows from the JSON (P1); confirm the frontmatter keys (`model`, `effort`, `runtime: claude-p`, `maxTurns: 24`) and the banner details; `mission-sessions.md` Haiku budget line; `mission.md` step 3 re-route-once sentence (`budget:` → the row's `fallback` via the Agent tool; counts as the corrective retry; second block surfaces).
  4. AC-8: `mission.md` step 2 `claude-p` bullet (`node ${CLAUDE_PLUGIN_ROOT}/tools/run-claude.mjs --role <role> --brief <file>#<anchor> --cwd <repo> --out <distillate.json> [--preset <name>] …` via Bash `run_in_background: true`; read the FILE; never stdout) and the generalized foreign-runtime paragraph (orchestrator owns ledger + git for `codex` and `claude-p` alike).
  5. AC-9: `git worktree add /tmp/tp-ac9 mission/tune-presets-p2` (or clone); in it `tune preset lean` (writes `.claude/agents/chronicler.md` etc.); run (1) chronicler with a 3-line brief in a scratch `.plans/ac9.sessions.md#S1` ("append one line to CHANGELOG Unreleased naming this run; no git"), `--preset lean --model claude-haiku-5-5`; (2) intake with a one-paragraph request brief; (3) overflow probe — brief "read CHANGELOG.md, docs/product/JOURNEY.md and docs/WORKFLOW.md whole, then summarize in 3 lines", `--max-turns 40`. Before and after each: `printenv CLAUDE_CODE_AUTO_COMPACT_WINDOW` in the parent (expect empty). Copy each `<out>.json` + `.events.jsonl` to `.plans/tune-presets.artifacts/ac9-{chronicler,intake,overflow}.*`; record in the handoff: `modelUsage` keys, `num_turns`, first-request prompt tokens, peak prompt tokens, `system/init` tools list (proves the allowlist), `compact_boundary` present/absent, the `--autocompact` flag as the child saw it (argv recorded in the events file), exit code, schema validity, parent var before/after. If a flag is rejected by `claude` 2.1.296 (`--max-turns` is absent from `claude --help` though the spike accepted it), fix the adapter and log the deviation — the documented in-flight stop fallback is `--max-budget-usd`. If `-p --agent <role>` ignores the project shadow (init names the plugin file), log the deviation and apply the D4 `--system-prompt-file` fallback described in memos §D4.
  6. AC-10: `mission-budget.sh` three greps + prints + two stop texts (integer math; absent fields → today's output byte-identical); hook-test cases (4); `mission.md` loop/tick rule pointer + `autopilot.md` sentence; `mission-state.md` header docs; `planner.md` sentence; `templates/WORKFLOW.md` §5 Loop-mode canonical sentence + §3 clause.
  7. Docs: §9 bullet, §10 Runtimes placeholder, `docs/WORKFLOW.md` mirrors incl. the Runtimes row; README one line; CHANGELOG `## [1.58.0]` (Added: `run-claude.mjs` + harness, hook child-silencer, Haiku shadows + re-route, `claude-p` resolution, tick/mission budgets; Evidence: AC-9 numbers); `plugin.json` 1.58.0.
- **Verify**:
  - `node tools/lint.mjs` → `lint: clean`, zero `warn:`; `node tools/run-claude-test.mjs`, `node tools/hook-test.mjs`, `node tools/run-codex-test.mjs` (untouched, still green), `node tools/lint-test.mjs`, `node tools/agents-test.mjs` all green.
  - AC-9 artifacts present under `.plans/tune-presets.artifacts/`; the handoff quotes the numbers; distillates validate (`node -e` with the adapter's exported `validate` against `SCHEMA_PATH`, or the harness's validator).
  - `wc -c P/commands/mission.md` < 21,600; `wc -c P/templates/WORKFLOW.md` < 108,000; both + the AC-9 numbers in the PR body.
  - `bash -c 'AGENTIC_WORKFLOW_CHILD=1 bash P/hooks/lib/mission-budget.sh </dev/null'` prints nothing, exit 0 (manual spot check beside the harness).
  - `claude --plugin-dir plugins/agentic-workflow` loads clean.
- **Read budget**: ≈1,490 lines (≤30 % of context; the densest brief — see the split note above). Suits: `backend`.

**Checkpoint p2** ends phase 2 — one-shot `reviewer` (**Fable**, fresh
context): re-run every harness above; diff-review
`mission/tune-presets-p1..mission/tune-presets-p2`; per-AC verdict AC-6..AC-10
with the AC-9 artifacts read; Security lens on the child flags (never bypass,
never `--bare`, env strip, allowlist) AND on the boundary-class content P1
landed under an Opus checkpoint — re-read the four Haiku `allowed_tools` rows
in `tune-presets.json`, lint's bare-`Bash` rule, and `mission.md`'s widened
rule-7 text; + Efficiency lens; ≤ one page. APPROVE →
PR to `main` (v1.58.0). Corrective → resume the S2 builder; re-review the
corrective diff only. Then the mission close: chronicler ONCE (JOURNEY,
overview, status), `docs/record synced` row fires on the p2 branch.

---
_Size every brief to its read budget; split any that can't fit and note the
split. Each session's outcome and any deviation lands in
`.plans/tune-presets.state.md`, never only in chat._
