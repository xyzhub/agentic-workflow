# tune-presets — metrics, baselines, acceptance tests (2026-10-11)

Source brief: `docs/product/decisions/2026-10-11-tune-presets-brief.md`.
All baselines pulled 2026-10-11 from this repo at branch `mission/tune-presets` (HEAD 06c2d62 + uncommitted brief).
Labels: **measured** (command cited) / **estimated** (arithmetic shown) / **unmeasured**.

## 1. Baselines NOW

| # | Quantity | Value | Class | Source |
|---|---|---|---|---|
| B1 | Plugin agents | 20 | measured | `ls plugins/agentic-workflow/agents/*.md \| wc -l` |
| B2 | Project shadows in `.claude/agents/` | 2 (`backend.md`, `devops.md`), both hand-tuned, neither a preset banner; both pin `model: claude-opus-4-8` (stale vs Opus 5.5 rule); backend also `codex:gpt-6-astra` (runtime unavailable, #122) | measured | `ls .claude/agents`; `head` of each file |
| B3 | Preset-authored shadows | 0 | measured | no preset banner exists; `grep -c preset tune.md` = 0 |
| B4 | `node tools/lint.mjs` | exit 0, "lint: clean", 0 `warn:` lines | measured | run 2026-10-11 |
| B5 | `node tools/agents-test.mjs` | exit 0, 27 cases, "clean" | measured | run 2026-10-11 |
| B6 | `preset` occurrences in `plugins/agentic-workflow/commands/tune.md` | 0 | measured | `grep -c preset` |
| B7 | `tune-presets.json`, `run-claude.mjs` | do not exist. Note: `run-codex.mjs` lives at `plugins/agentic-workflow/tools/`, not root `tools/`; the brief's `tools/run-claude.mjs` path must be settled by the architect (D4) | measured | `ls` |
| B8 | §10 "Tune preset" row in `docs/WORKFLOW.md` | absent (0 matches) | measured | grep |
| B9 | Per-role token spend, ledgers | **unmeasured** for chronicler/intake/writer/curator. Greps of `.plans/*.state.md` and `docs/product/JOURNEY.md` found only role-name mentions (routing notes), no token or session-cost figures | measured absence | grep 2026-10-11 |
| B10 | Chronicler run size | ≈30–33k subagent tokens per run, n=3 (this session, 2026-10-11). Observed by the orchestrator, not in a ledger; n=3 is too small for a distribution | observed, n=3 |
| B11 | intake / writer / curator run size | unmeasured | unmeasured | — |

Implication of B10 (inference): a chronicler run is ~30% of the 100K cap, so the "under 100K by construction" premise is plausible for chronicler but unproven for the other Record roles (B11).

## 2. Haiku 5.5 price cliff (why the 100k window matters)

Rates (claude-api skill reference, cached 2026-10-06; not re-verified today): $0.10 in / $0.50 out per MTok at ≤100K prompt tokens; $0.50 in / $2.50 out beyond.
Assumption: the higher tier applies to the whole request once the prompt exceeds 100K. Output 4K tokens assumed for both rows (illustrative, estimated).

| Run | Input | Output (4K) | Total (estimated) |
|---|---|---|---|
| 90K prompt | 0.090 × $0.10 = $0.0090 | 0.004 × $0.50 = $0.0020 | **$0.0110** |
| 150K prompt | 0.150 × $0.50 = $0.0750 | 0.004 × $2.50 = $0.0100 | **$0.0850** |

A 150K run costs ~7.7× a 90K run (0.0850 / 0.0110) for 1.67× the tokens. Crossing 100K is a 5× rate step on every token, so the 100K compaction cap (and the by-construction budget) keeps Haiku in the cheap tier. Per-turn prompts re-bill history, so a multi-turn run pays this per turn; the table is one turn only (conservative).

## 3. Success definitions

| Success definition (brief) | Exact measurement | Baseline NOW | Pass threshold |
|---|---|---|---|
| S1 Preset apply is reversible | Acceptance test (a) below | no preset command (B6) | every step of (a) passes |
| S1b Lint-clean | `node tools/lint.mjs` exit code + count of `warn:` lines, after every (a) step | exit 0, 0 warn (B4) | exit 0, 0 `warn:` |
| S1c Tune machinery not regressed | `node tools/agents-test.mjs` case count and exit | 27 cases, exit 0 (B5) | exit 0, cases ≥ 27 (new cases only add) |
| S2 Haiku isolation proven on one real run | Acceptance test (b) = AC-9 | no adapter (B7) | (b) passes, evidence file cited |
| S3 Bootstrap/adopt ask the preset; `/doctor` flags drift | Acceptance test (c) | no §10 row (B8) | (c) passes |

## 4. AC-9 and AC-12 measurements

**AC-9 (one real Haiku run).** Measure: chronicler run through `run-claude.mjs` on `claude-haiku-5-5`.
- Distillate JSON validates against `plugins/agentic-workflow/templates/distillate.schema.json` (schema validator exit 0). Baseline: 0 runs. Threshold: 1 valid run.
- Window evidence: child transcript contains a `compact_boundary` event at ~100K prompt tokens, OR the run's peak prompt stayed under 100K and the transcript shows no compaction. Baseline: unmeasured. Threshold: one of the two, with peak-token figure quoted from the transcript. A run that returns `blocked` with `blocked_reason: budget:` also passes only if exit code is 3 and the distillate is still schema-valid.
- Parent isolation: `printenv CLAUDE_CODE_AUTO_COMPACT_WINDOW` in the parent shell/process empty before AND after. Baseline: unknown until checked at test time (record the value). Threshold: unset at both points.
- Model proof: transcript/usage shows `claude-haiku-5-5`, not a fallback. Threshold: exact id.

**AC-12 (lint).** Measure: `node tools/lint.mjs` plus `node tools/lint-test.mjs`.
- `tune-presets.json` validates: 4 presets × 20 agents = 80 cells (agent count taken from B1; must equal the live agent count at test time). Baseline: file absent. Threshold: 80/80 cells valid, ids in the 4 pinned set, effort ∈ {low, medium, high}, every Haiku row has `runtime: claude-p` and `compact_window: 100000`, none below 5.5.
- Negative fixtures: bad model id, missing agent, Haiku row without the window each make lint fail (3/3 red). Baseline: 0 fixtures. Threshold: 3/3.
- v1.55.0 budgets: zero `warn:` lines. Baseline: 0 (B4). Threshold: 0.

## 5. Acceptance tests

**(a) Preset round-trip.** Run on a scratch copy of the repo (never the live `.claude/agents/`, which holds B2's hand-authored shadows). For each preset P in {Lean, Balanced, Rigorous, Unattended}:
1. `tune preset P` → count of shadows carrying the preset banner = 20 (banner names preset, plugin version, base hash). Lint exit 0 + 0 warn; agents-test exit 0.
2. `tune diff` → empty.
3. `tune preset reset` → preset-banner shadows = 0; the hand-authored backend/devops shadows (B2) untouched and reported, not deleted. Lint + agents-test green.
Pass: 4 of 4 presets × 3 steps green (12 checks, plus lint/agents-test at each = 24 gate runs).
Extra: a per-agent `/tune <agent>` after a preset wins and appears in `tune diff` (AC-3).

**(b) Haiku real run.** Exactly AC-9 above; evidence recorded in the mission ledger and the PR.

**(c) Bootstrap/adopt and /doctor.**
1. Bootstrap or adopt on a scratch project: exactly one preset question; §10 contains a **Tune preset** row. Unanswered → `balanced (default)`. Payments/auth/PII answer → Rigorous recommended. Baseline: row count 0 (B8). Threshold: 1 row.
2. Seed drift: edit one preset shadow without a per-agent tune banner → `/doctor` emits a finding (AC-5a). Seed an open ledger (`.plans/*.state.md` without `Closed:`) and switch preset → finding (AC-5b). Threshold: 2 of 2 seeded drifts flagged; 0 findings on the unseeded clean state.

## 6. Unmeasured / open

- Per-run tokens for intake, writer, curator (B11) and a ledger-grade chronicler figure (B10 is n=3, session-observed).
- Haiku rate card not re-verified since 2026-10-06 cache.
- Real parent-env value of `CLAUDE_CODE_AUTO_COMPACT_WINDOW`: read at (b) time.
- AC-7 `maxTurns`/read-budget numbers and AC-10 `tick_budget` default are open (brief, architect memo D2/D3); no threshold set here.
