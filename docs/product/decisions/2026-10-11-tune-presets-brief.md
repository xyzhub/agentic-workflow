# Feature brief — tune-presets (2026-10-11)

Interviewee: Baker. Everything below the interview block is drafted.

## Problem

Every project today starts on the plugin's implicit tier rules (Opus 5.5 builders, Fable gates + planner, Sonnet record roles) and changes them one agent at a time with `/tune`. There is no way to choose a whole spend/effort posture at project start, so a throwaway prototype pays production-grade gate tokens and an unattended loop runs with the same shape as an interactive mission. Separately, the owner's Haiku rule (Haiku 5.5 minimum, autocompact at 100k, **Haiku only**) cannot be expressed today: Claude Code's only token-based compaction knob (`CLAUDE_CODE_AUTO_COMPACT_WINDOW`) is process-wide and there is no per-agent compaction field.

## Interview (owner's answers, verbatim choices)

- **Presets (4)**: Lean / Balanced / Rigorous / Unattended ("Frugal" renamed Lean at owner request). Each row = model + effort per agent class.
- **Haiku isolation**: A — `run-claude.mjs` adapter (child `claude -p --agent <role>` with `CLAUDE_CODE_AUTO_COMPACT_WINDOW=100000` set only in that process; JSON distillate) AND B — Haiku roles capped under 100K by construction (`maxTurns` + small read budget; overflow returns `blocked` → re-route to Sonnet). Owner (verbatim): "the autocompact at 100k must only be enabled for haiku not the other models"; "haiku 5.5 is the minimum acceptable haiku model".
- **Lean gates**: reviewer + plan-judge may run on Opus 5.5 with §5 rule-7 boundary escalation kept.
- **Unattended**: carries its own per-tick token ceiling (`tick_budget`) beyond the 1.5× session stop.
- **Priority / posture**: normal, top of backlog — runs before operate-triage. Fable plan-judge + Fable checkpoint; human-merge.
- **OUT of v1 (final)**: a second override syntax inside the preset command; switching preset while a mission ledger is open (`/doctor` flags it); user-authored presets. **Codex rows stay IN** (presets may name `runtime: codex` where a project has it; unavailable today, #122).
- **Clarified (owner: "agreed")**: per-agent `/tune <agent> …` keeps working after a preset and wins for that agent; the preset is the baseline.
- **Defaults**: Balanced is the default when a project does not answer; this repo adopts Balanced.
- **Success**: preset apply is reversible + lint-clean; Haiku isolation proven on one real run; bootstrap/adopt ask the preset and `/doctor` flags drift.
- **Builder tier rule (owner 2026-10-11)**: Opus 5.5 (`claude-opus-5-5`), not 4.8.

## Preset matrix (drafted; model ids pinned)

Classes: **Gates** reviewer, advisor · **Shape** planner / architect, compass · **Builders** backend, frontend, devops, security · **Research** researcher, brainstormer, designer, business, marketing, ops, analyst · **Record** chronicler, writer, curator, intake.

| Class | Lean | Balanced | Rigorous | Unattended |
|---|---|---|---|---|
| Gates | opus-5-5 · medium | fable-5-1 · high | fable-5-1 · high | fable-5-1 · high |
| Shape | planner opus-5-5 · high; others medium | planner fable-5-1 · high; others opus-5-5 · medium | fable-5-1 · high | planner fable-5-1 · high; others opus-5-5 · medium |
| Builders | sonnet-5-5 · medium | opus-5-5 · medium | opus-5-5 · high | sonnet-5-5 · medium |
| Research | sonnet-5-5 · low | sonnet-5-5 · medium | opus-5-5 · medium | sonnet-5-5 · low |
| Record | **haiku-5-5 · low · runtime claude-p · compact 100k** | sonnet-5-5 · low | sonnet-5-5 · medium | **haiku-5-5 · low · runtime claude-p · compact 100k** |
| Extra | — | — | — | `tick_budget: <tokens>` |

Invariants in every preset: boundary-class diffs escalate to Fable (rule 7) unless `boundary_escalation: off`; the plan-judge runs at the gate tier; Haiku is never below 5.5 and never runs in the shared session process.

## Acceptance criteria (stable ids)

**J1 — a project picks a posture**
- AC-1 `templates/tune-presets.json` holds the four presets, pinned to model ids (`claude-fable-5-1`, `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`), effort per agent, and per-preset extras (`tick_budget` for Unattended; `runtime: claude-p` + `compact_window: 100000` on Haiku rows).
- AC-2 `/agentic-workflow:tune preset <name>` writes one stamped shadow per plugin agent (banner names the preset + plugin version + base hash), `tune preset show` prints the resolved matrix with per-agent deviations marked, `tune preset reset` removes preset-authored shadows only (hand-authored ones report-don't-delete, as today).
- AC-3 A later per-agent `/tune <agent> …` wins for that agent; `tune diff` shows it against the preset baseline.
- AC-4 `/bootstrap` and `/adopt` ask ONE preset question (Balanced recommended; Rigorous recommended when the interview names payments/auth/PII), write a §10 **Tune preset** row, and apply it. Unanswered → Balanced, row says `balanced (default)`.
- AC-5 `/doctor` flags (a) a shadow that drifts from the §10 preset without a per-agent tune banner, (b) a preset switch while any `.plans/*.state.md` lacks `Closed:`.

**J2 — a Haiku role runs**
- AC-6 `plugins/agentic-workflow/tools/run-claude.mjs` (beside `run-codex.mjs`) spawns `claude -p --agent <role>` with `CLAUDE_CODE_AUTO_COMPACT_WINDOW=100000` in the child env only, passes the brief by `<file>#<anchor>` like `run-codex.mjs`, writes the distillate JSON per `templates/distillate.schema.json`, maps exit codes `0 done · 3 blocked · 1 failed`, and never inherits that env var into the parent.
- AC-7 Haiku-tier agent shadows carry `maxTurns` and the brief template's Haiku read budget so a run stays under 100K by construction; an overflow returns `blocked` with `blocked_reason: budget: …`, and `mission.md` re-routes it to the preset's Sonnet row once.
- AC-8 `mission.md` resolves `runtime: claude-p` like `codex` (Bash in background, read the distillate file, orchestrator commits changed paths).
- AC-9 One real run is recorded: chronicler on `claude-haiku-5-5` via the adapter returns a valid distillate; evidence that the 100000 window was in effect in the child (or the cap returned `blocked` cleanly); the parent session's compaction setting unchanged.

**J3 — an unattended loop runs**
- AC-10 Unattended's `tick_budget` is read by the loop/autopilot path: a tick that exceeds it stops, writes the ledger, and surfaces (owner channel when configured) instead of starting another brief; the mission-budget hook prints it next to `session k/N`.

**J4 — record**
- AC-11 `templates/WORKFLOW.md` §10 gains the **Tune preset** row; §5 gains one sentence pointing at presets (no restated rule — the dedup guard binds); README + CHANGELOG; `docs/WORKFLOW.md` mirror; this repo's row = `balanced`.
- AC-12 Lint: `tune-presets.json` validates (4 presets × 20 agents, known model ids, effort ∈ {low,medium,high}, Haiku rows carry `runtime: claude-p` + `compact_window: 100000`, no Haiku below 5.5); `tools/lint-test.mjs` fixtures prove a bad id, a missing agent and a Haiku row without the window all fail. All budgets from v1.55.0 stay green with zero `warn:`.

## Value sourcing (per AC — every produced value names its source)

| AC | Value | Source kind | Where |
|---|---|---|---|
| AC-1 | model ids | locked decision | claude-api reference table (2026-10-06 cache): `claude-fable-5-1`, `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5` |
| AC-1 | matrix cells | locked decision | this brief, Preset matrix (owner interview 2026-10-11) |
| AC-1/6 | `compact_window` 100000 | locked decision | owner rule 2026-10-11; env var floor is 100K (code.claude.com/docs/en/env-vars) |
| AC-2 | stamp format | derivation | `plugins/agentic-workflow/commands/tune.md` existing banner (v1.54.0, #92) |
| AC-6 | distillate shape, exit codes | derivation | `plugins/agentic-workflow/templates/distillate.schema.json`; `tools/run-codex.mjs` EXIT map |
| AC-7 | Haiku read budget, `maxTurns` | open question | architect memo D2 recommends numbers; owner confirms at approval |
| AC-10 | `tick_budget` default | open question | architect memo D3; financial counsel sizes it |
| AC-4 | Rigorous trigger words | derivation | `commands/bootstrap.md` / `adopt.md` interview answers naming payments/auth/PII |

## Shape decisions needing memos (architect)
- D1 Preset storage + apply mechanics: one JSON vs four files; how the banner distinguishes preset-authored from hand-authored shadows; how `reset` and `rebase` treat them.
- D2 Haiku cap by construction: `maxTurns` value and read-budget number; how the brief template expresses a Haiku budget; overflow → `blocked` → re-route semantics.
- D3 `tick_budget` for Unattended: where it lives (ledger header vs §10 vs preset), who reads it (loop tick / autopilot / mission-budget hook), default number.
- D4 `run-claude.mjs` shape: reuse of run-codex's brief extraction + distillate writer; what `--agent` resolution means with a project shadow present; sandbox/permission flags for a child `claude -p`.

## Locked decisions (owner, 2026-10-11, after counsel + spike)
- 2026-10-11 — **Shape**: `phases`, 3 phases, `Estimate: 6` (3 briefs + 3 Fable checkpoints). P1 = `templates/tune-presets.json` + lint/fixtures + registry schema minor bump + `tune preset apply|show|reset` (AC-1, 2, 3, 12). P2 = `run-claude.mjs` adapter + Haiku shadows + mission.md `claude-p` resolution + AC-9 with chronicler AND intake runs (AC-6, 7, 8, 9). P3 = bootstrap/adopt question + §10 row + `/doctor` drift checks + tick/mission budgets + hook + docs (AC-4, 5, 10, 11). Gate policy human-merge; one release per phase (v1.57.0 / v1.58.0 / v1.59.0).
- 2026-10-11 — **Haiku adapter stays in v1 (A and B)**: owner kept A after financial counsel showed ≤$0.14/mission saving; reason: the Haiku-only compaction rule holds mechanically only with it, the spike proved the transport (`claude -p --agent agentic-workflow:chronicler --model claude-haiku-5-5`, 1 turn, 9,887-token first request, parent env untouched, no nesting refusal on 2.1.296), and under the no-return rule a demoted adapter is never built. AC-9 adds a deliberate ~120K overflow probe as the only witness of the window.
- 2026-10-11 — **D1 semantics**: one `templates/tune-presets.json`; a shadow is written only where a preset cell differs from the agent's base frontmatter — Balanced on this repo = §10 row `balanced`, zero files; preset-authored := banner kind `preset:<name>` AND `effective == JSON row` (the same computation as `preset show`'s deviation mark); `apply` skips-and-reports any existing shadow lacking a `preset:` banner (hand tune wins); `reset` deletes only preset-authored shadows, reports composed ones; re-apply idempotent.
- 2026-10-11 — **Child isolation (D4)**: adapter strips `CLAUDECODE` and `CLAUDE_CODE_ENTRYPOINT` from the child env by design, passes `--strict-mcp-config`, `--max-turns`, `--permission-mode acceptEdits --permission-prompts none` (never bypass, never `--bare`), `--output-format stream-json --verbose --json-schema templates/distillate.schema.json`; sets `AGENTIC_WORKFLOW_CHILD=1` and the four UserPromptSubmit hooks + beat-enforcer exit 0 when set (hook-test fixture). `exit 0` with no `result` line → `failed`. `CLAUDE_CODE_AUTO_COMPACT_WINDOW=100000` set on the child env object only.
- 2026-10-11 — **Haiku tool allowlist**: Haiku rows in the JSON carry an explicit `allowed_tools` list; lint rejects bare `Bash` on a Haiku row; the adapter refuses to spawn with one. Haiku rows also carry `fallback: {model: claude-sonnet-5-5, effort: low, runtime: claude}`, `maxTurns: 24` (also passed as `--max-turns 24`), and a per-role `read_budget` (default 500 lines; JOURNEY.md is 744 lines so the chronicler uses ranged reads). Starting values; AC-9 may move them as a dated note.
- 2026-10-11 — **Gate tier per preset**: the plan-judge is Fable in ALL four presets; Lean's Opus 5.5 gate applies to the checkpoint reviewer only, with §5 rule-7 boundary escalation widened in mission.md from "codex reviewer tune" to "any non-Fable reviewer tune".
- 2026-10-11 — **Budgets (D3)**: a tick = one brief + its gate + at most one corrective. `tick_budget` default **750,000** tokens (Unattended preset; planner copies it to the ledger header as `Tick budget: <int>`); add cumulative `Mission budget: <int>` = Σ tick tokens. Orchestrator writes running `Tick tokens: <int>` after every brief and resets at tick start; `mission-budget.sh` prints `tick k/N tokens` and `🛑 TICK BUDGET` / `🛑 MISSION BUDGET` — print only, never block; the only in-flight stop is the child's `--max-turns`. The memo's "would have stopped the 779,762 run" claim is struck.
- 2026-10-11 — **Matrix amendments**: Unattended builders → Opus 5.5 · medium (same as Balanced); Lean keeps Sonnet 5.5 builders with a JSON `note`: "saving unmeasured until 3 Lean briefs record their corrective count vs the 0.6/brief baseline".
- 2026-10-11 — **Metrics**: add `wc -c` baselines for tune.md, mission.md, doctor.md, bootstrap.md, adopt.md (zero `warn:` must hold); the metrics doc's Haiku cliff section compares to the Sonnet baseline, not Haiku-to-Haiku.
- 2026-10-11 — **Priority**: top of backlog; runs before operate-triage. Defaults: Balanced when unanswered; this repo = Balanced.
