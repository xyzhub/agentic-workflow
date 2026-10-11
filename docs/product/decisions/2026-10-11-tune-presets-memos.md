---
status: frozen
owner-agent: architect
refresh-trigger: never
---

# agentic-workflow — Decision memos: tune-presets D1–D4 (2026-10-11)

_Shape-before-build memos for `docs/product/decisions/2026-10-11-tune-presets-brief.md`. Four decisions, one recommendation each; the human picks. Labels: **F** fact (cited) · **I** inference · **A** assumption. Platform facts were checked against code.claude.com docs today and `claude -v` = 2.1.296 on this machine._

Shared facts the four memos lean on:
- **F** `CLAUDE_CODE_AUTO_COMPACT_WINDOW` is process-wide, plain-integer tokens, floor 100000, ceiling 1M; it outranks `/autocompact`, `--autocompact` and `autoCompactWindow` (env-vars + model-config docs). **F** Haiku 5.5 runs a 1M window, compacts at ~967K by default, and "costs more per token when its prompt is longer than 100K tokens" (model-config) — the 100K cap is a price cliff as well as an owner rule.
- **F** Subagent frontmatter supports `maxTurns` ("returns its output marked as partial", v2.1.246+), `model` (tier or full id), `tools`, `permissionMode` (ignored for plugin subagents), `skills`, `effort` (sub-agents docs). **F** Precedence by location: `--agents` flag > `.claude/agents/` > `~/.claude/agents/` > plugin `agents/`.
- **F** Measured output-side band in this repo: 1.99–3.26 chars/token (`docs/product/engineering/context-economy-metrics.md` A9/B-vs-M). Default brief read budget: "NN lines (≤30% of context, ~1,500)" (`templates/mission-sessions.md:46`).
- **F** This repo's ledgers: one brief ≈ 124K–210K subagent tokens (pr-economy: planner 209,558 · plan-judge 123,904 · builder 184,088 · reviewer 172,765); the one Codex brief with a corrective hit 779,762 in (n1-codex-astra).
- **F** Lint byte budgets: agent 16,000 B · command 24,000 B · skill 6,000 B (`tools/lint.mjs:897`); `templates/agents-registry.schema.json` is strict (`additionalProperties:false`) — any new field is a minor bump + CHANGELOG line.

---

## D1 — Preset storage + apply mechanics

**The question.** Where the four presets live and how `tune preset <name>` lands them, so that the registry, `/doctor`, `reset` and `rebase` can tell a preset-authored shadow from a hand-tuned one without parsing prose. Constrains: the lint fixture (AC-12), the registry schema, and every later `/tune` verb.

### Option A — one `templates/tune-presets.json` + one stamped shadow per agent
- **How it works here.** One JSON: `{ presets: { lean: { gates: {...}, agents: { reviewer: { model, effort, runtime?, compact_window?, maxTurns?, fallback? } } } } }` — rows per **agent** (20), classes kept as a `class:` label per agent for `preset show`. `tune preset <name>` runs today's step 1 (fresh copy of the base) for every plugin agent and writes the existing single banner with kind `preset:<name>`: `> Tuned from agentic-workflow v1.56.0 (base sha256:…) — preset:lean override (model: claude-sonnet-5-5, effort: medium). Reset with /tune <agent> reset.` and description prefix `TUNED (preset: lean) — `. A later `/tune <agent> model opus` edits that shadow in place and composes the kind list: `preset:lean, model` — so "hand tune wins" is a property of the file, not a rule (AC-3). `agents.mjs` gains `override.preset: string|null` parsed from the kind list (schema minor bump); `tune preset show` renders the matrix from the registry and marks `*` where `effective` ≠ the preset row. `reset` (preset-wide) deletes only shadows whose kind list is exactly `[preset:<name>]`; a composed one is reported ("hand-tuned after preset: model — kept; `/tune <agent> reset` drops it") — the same report-don't-delete posture tune.md already takes for unbannered files. Per-agent `reset` is unchanged. `rebase` is unchanged (base sha in the banner). Re-running `tune preset <name>` is idempotent and re-copies fresh bodies, so after a plugin upgrade it doubles as a bulk rebase for non-prompt shadows (prompt-kind shadows keep today's in-place rule).
- **Tradeoffs.** Claude Code honors the file by shape — no spawn site can forget it, and the `claude -p --agent` child (D4) reads `model`/`maxTurns`/`tools` from the same file. Cost: 20 files in `.claude/agents/`, and a frozen body per shadow until re-applied.
- **Operational cost.** One JSON to lint (4 × 20 cells, enums, Haiku invariants). `/doctor` already flags stale `Tuned from` banners (`doctor.md:93`) — the staleness cost is visible, not silent.
- **Cost of reversal.** Low: `tune preset reset` deletes every preset-only shadow; the JSON is inert data.

### Option B — one file per preset (`templates/presets/<name>.json`) + shadows
- **How it works here.** Same apply path; four files, lint globs the folder and cross-checks each against the agent list.
- **Tradeoffs.** Easier per-preset diff; but the invariant "every preset covers every agent with the same ids" is now a cross-file check, and the matrix view (`preset show`) must read four files. User-authored presets are OUT of v1 (brief), which was B's only structural advantage.
- **Operational cost.** 4× boilerplate; lint fixtures ×4.
- **Cost of reversal.** Low (concatenate into A).

### Option C — marker only, resolve at spawn
- **How it works here.** No shadows. §10 `Tune preset` row is the only state; `mission.md` step 2, autopilot, audit, counsel… read the JSON and pass `model`/`effort` per Agent-tool invocation (**F** the per-invocation `model` parameter ranks first in subagent model resolution). The D4 adapter passes `--model`/`--effort` itself. `agents.mjs` computes `effective` = shadow ?? preset row ?? base.
- **Tradeoffs.** Zero files, no stale bodies, "hand tune wins" is free. But it is discipline-guarded: every spawn site in ~8 commands must carry the rule, and any that forgets runs the plugin default silently. The Haiku child still needs `maxTurns` somewhere (adapter flag — fine) but an orchestrator-spawned Record role would not.
- **Operational cost.** New resolution code in agents.mjs + rule copies in every command (the dedup guard binds).
- **Cost of reversal.** Medium: the rule copies are the thing to unwind.

### Recommendation — **A.**
Fail-closed by shape beats a rule in eight files; the registry and tune verbs already model exactly this object. **Strongest case against:** 20 frozen prompt bodies per project, re-frozen on every plugin upgrade — a real maintenance tax C avoids entirely. Mitigation is the idempotent re-apply plus `/doctor`'s stale-tune check; if that proves noisy, C is the retreat.

**Values this decision settles:**
- File: `plugins/agentic-workflow/templates/tune-presets.json`, rows per agent, 4 presets × 20 agents (AC-1 shape).
- Banner kind token: `preset:<name>`; composed kinds append (`preset:lean, model`). Description prefix: `TUNED (preset: <name>) — `.
- Registry: `override.preset: string|null` added to `agents-registry.schema.json` (minor bump + CHANGELOG).
- `tune preset reset` deletes only kind == exactly `[preset:<name>]`; composed shadows are reported, never deleted. Per-agent `reset`/`rebase` unchanged.
- `tune preset <name>` is idempotent; re-running re-copies fresh bodies for non-prompt shadows.
- `tune preset show` deviation mark: `*` where `effective` ≠ preset row (from the registry, never re-parsed).
- Haiku rows carry an explicit `fallback: { model: claude-sonnet-5-5, effort: low, runtime: claude }` (consumed by D2's re-route; no lookup rule).

**What would change the answer.** If `/doctor` reports stale preset shadows on >2 consecutive plugin upgrades in adopted projects, or if a project needs preset switching mid-mission (OUT of v1), move to C.

---

## D2 — Haiku cap by construction

**The question.** Which `maxTurns` and read budget keep a Record-tier run under the 100K window without relying on compaction, and what the overflow path is. Constrains: the four Haiku shadows, the brief template's budget line, the adapter's flags and exit map, and `mission.md`'s retry rule.

Sizing inputs (**I** unless marked): child baseline = system prompt + CLAUDE.md + role prompt (chronicler 9,087 chars ≈ 3K tok at the measured band) + §10 verbatim + brief ≈ 15–20K tokens. One line ≈ 50 chars (**A**) → 15–25 tok/line at the band. The four roles' real work: chronicler reads `git log`, `gh pr list`, a ledger (ranged), CHANGELOG head, JOURNEY tail, one `overview.html` anchor, then 3 edits ≈ 10–12 tool calls; writer/curator read a kit or index + 1–3 files, then edit; intake is Read/Grep/Glob only, 5–8 calls.

### Option A — `maxTurns` + a Haiku read budget + the 100K window as backstop
- **How it works here.** Shadow frontmatter `maxTurns: 24`; the orchestrator (Agent-tool path) prepends `Read budget: 500 lines.` beside the existing `Effort:` line; the adapter (D4) also passes `--max-turns 24` (**F** a documented `-p` flag; **I** frontmatter `maxTurns` applying to a main-thread `--agent` session is undocumented, so the flag is belt-and-braces) and a `# Budget` block in the prompt. Math: 20K base + 500 lines (≤12.5K) + 24 turns × ~1.5–2K (tool results, assistant text) ≈ 70–80K → ~20% headroom under 100K. The env window stays set so a miss compacts instead of dying.
- **Overflow.** `error_max_turns` from the child → distillate `status: blocked`, `blocked_reason: "budget: maxTurns 24 reached after 24 turns"`, exit 3. A compaction observed in the event stream (peak per-request prompt ≥ 100,000) is recorded as a `deviations` line (`budget: compaction fired at 100000`), not a block — the cap did its job. `mission.md`: a `blocked` whose reason starts `budget:` from a `claude-p` run is re-spawned **once** on the row's `fallback` (Balanced's Record cell: Sonnet 5.5 · low) via the normal Agent tool; this *is* the one corrective retry (§5) and increments `Sessions used:`. A second budget block surfaces to the owner.
- **Tradeoffs.** Two layers that fail closed; the numbers are guesses until AC-9 measures them.
- **Operational cost.** Two lines in the brief template, one `# Budget` block in the adapter, one rule sentence in mission.md.
- **Cost of reversal.** Trivial — two integers in the JSON.

### Option B — a money cap only (`--max-budget-usd`)
- **How it works here.** Adapter passes `--max-budget-usd` (**F** print-mode flag; "spend can pass the cap"). No turn/read limits.
- **Tradeoffs.** Bounds cost, not context: Haiku's low price lets a run pile 300K of context before a cent-level cap trips. Estimate-based, so the stop point is not predictable per owner's rule 7 posture.
- **Cost of reversal.** Trivial, but it does not satisfy "under 100K by construction".

### Option C — compaction alone
- **How it works here.** Window env only; no `maxTurns`, no read budget.
- **Tradeoffs.** Simplest; survivable. But a chronicler that compacts mid-run loses what it read and rewrites history from a summary — the exact failure the record roles exist to prevent — and there is no `blocked` signal to re-route on.
- **Cost of reversal.** None.

### Recommendation — **A.**
It is the only option that yields a parseable overflow signal and a cheap re-route. **Strongest case against:** 24/500 are sized from prompt lengths and tool-call counts, not a measured Haiku transcript; AC-9 is the first measurement and must be allowed to move both numbers.

**Values this decision settles:**
- `maxTurns: 24` in every Haiku-tier shadow; the adapter also passes `--max-turns 24`.
- Haiku read budget: **500 lines** total (one third of the 1,500 default); `templates/mission-sessions.md:46` gains "Haiku tier: ≤500 lines, maxTurns 24".
- `blocked_reason` prefix for budget overflows: `budget:`; a compaction is a `deviations` line `budget: compaction fired at <window>`, not a block.
- Re-route: once, to the row's explicit `fallback` (Balanced Record cell `claude-sonnet-5-5 · low · runtime claude`); it counts as the corrective retry.
- Sizing basis recorded for AC-9: 20K baseline + ≤12.5K reads + 24 × ≤2K turns ≈ 80K.

**What would change the answer.** AC-9's peak per-request prompt: <60K → raise the read budget to 800; >90K or a compaction → cut `maxTurns` to 18 before touching the window. Three `budget:` re-routes across missions → the Record class moves to Sonnet in Lean too.

---

## D3 — `tick_budget` for Unattended

**The question.** Where the per-tick token ceiling lives, who reads it, who enforces it, and its default. Constrains: the ledger header grammar `^Key: <int>` the hook parses, `mission.md`/`autopilot.md` loop paragraphs, and the preset JSON.

**F** `hooks/lib/mission-budget.sh` never blocks ("ALWAYS exit 0"), reads only the ledger, and the overrun STOP is a protocol rule the orchestrator obeys. **F** A hook cannot see subagent token counts; only the orchestrator can (Agent-tool result metadata, or the distillate's `usage` for codex/claude-p runs — this is how the ledgers record `builder 184,088`).

### Option A — ledger header fields, hook prints, orchestrator stops
- **How it works here.** Preset JSON `unattended.tick_budget: 400000`. At mission start the planner copies it into the ledger header as `Tick budget: 400000` (next to `Estimate:`), only when §10's preset is Unattended (or the owner sets it). After each tick the orchestrator writes `Last tick tokens: <int>` write-ahead. `mission-budget.sh` gains two greps and prints `· tick 212,000/400,000 tokens` on the status line and `🛑 TICK BUDGET` when k ≥ N. Loop rule (mission.md loop paragraph + autopilot `continue`): on the stop, do not start another brief; write the ledger; post to the owner channel when §10 has one; end the tick.
- **Tradeoffs.** Exact mirror of `Estimate:`/`Sessions used:` — same parser, same STOP shape, same resume surface (a fresh agent reads the ledger alone). Per-mission pinning means a preset switch cannot silently change a running mission's ceiling (fits the OUT-of-v1 rule).
- **Operational cost.** ~12 lines of bash, two template lines, one rule sentence per loop paragraph.
- **Cost of reversal.** Trivial: delete two header lines.

### Option B — §10 `Tune preset` row carries the number; hook reads §10
- **How it works here.** Row: `balanced` or `unattended (tick_budget 400000)`; the hook greps `docs/WORKFLOW.md` each prompt.
- **Tradeoffs.** Project-wide, not per-mission; the hook grows a second file dependency; a resumed session has to read two files for one number. §10 should record the *posture*, the ledger the *live state*.
- **Cost of reversal.** Low.

### Option C — preset-only, orchestrator reads the JSON at tick time
- **How it works here.** No ledger or hook change; the orchestrator consults `tune-presets.json`.
- **Tradeoffs.** Fails AC-10 (hook must print it) and gives the owner no visible line; the number is nowhere a human reads.
- **Cost of reversal.** None.

### Recommendation — **A.**
Same mechanism the owner already trusts for the 1.5× stop; the hook stays advisory and exit-0 by contract. **Strongest case against:** the orchestrator must write `Last tick tokens:` honestly after every tick — a discipline step. It is the same discipline `Sessions used:` relies on today, and the hook's missing-field reminder makes a skipped write visible.

**Values this decision settles:**
- Default `tick_budget` = **400,000 tokens** (Unattended only). Reasoning: one brief ≈ 124K–210K subagent tokens in this repo's ledgers; a tick may legitimately include one corrective retry (§5), so ~2 × 185K ≈ 370K, rounded to 400K; the one measured runaway (779,762) would have stopped.
- Ledger header fields: `Tick budget: <int>` (planner, from the preset) and `Last tick tokens: <int>` (orchestrator, after each tick); both `^Key: <int>`, both optional, hook silent when absent.
- Enforcement: hook **prints** (`· tick k/N tokens`; `🛑 TICK BUDGET` at k ≥ N); orchestrator **stops** (no new brief, ledger written, owner channel when configured). Never a hook block.
- `Tick budget:` applies to loop ticks only (`/loop … continue`, autopilot `continue`); interactive runs keep the 1.5× stop alone.

**What would change the answer.** After 10 recorded unattended ticks, set the default to p90 of `Last tick tokens:` rounded up to 50K. If the owner wants the ceiling to vary per project rather than per mission, move the number into the §10 row (B) and keep the ledger copy as a cache.

---

## D4 — `run-claude.mjs` shape

**The question.** Whether the Haiku adapter is a sibling of `run-codex.mjs` or a generic runner, and the exact child invocation. Constrains: the distillate contract, the lint harness, `mission.md` step 2, and the AC-9 evidence.

### Option A — sibling `tools/run-claude.mjs` importing run-codex's exported helpers
- **How it works here.** `run-codex.mjs` already exports `briefText`, `section`, `roleFile`, `frontmatterValue`, `toolsOf`, `validate`, `parseEvents`, `statusSnapshot`, `changedPaths`, `highImpactPatterns`, `highImpactTouched`, `SCHEMA_PATH`. The sibling imports those (no refactor), keeps its own argv builder, EXIT map and env handling. Same CLI shape: `--role --brief <file>#<anchor> --cwd --out [--model] [--effort] [--max-turns] [--compact-window] [--resume <session_id>] [--note]`.
  - **Resolution.** Build `claude -p --agent <name>`: `<name>` = `<role>` when `.claude/agents/<role>.md` exists (**F** project scope outranks plugin scope), else `agentic-workflow:<role>` (**I** from the scoped-name note; AC-9 proves it). Under a preset every agent has a shadow (D1), so the first branch is the normal one. Always also pass `--model <id>` and `--max-turns <n>` read from the resolved file (belt and braces: `--agent` + `-p` is not shown together in any doc page — **F**; `claude --help` on 2.1.296 lists `--agent` with no `-p` exclusion). Fallback if AC-9 shows `--agent` ignored under `-p`: `--system-prompt-file <stripped role body>` + `--tools` + `--model`, i.e. what run-codex rebuilds by hand. **Never `--bare`** (**F** bare skips `.claude/agents/` and subscription login).
  - **Permissions.** `--permission-mode acceptEdits --permission-prompts none` (**F** 2.1.259+; removes `AskUserQuestion`, denies anything unresolved, tells the model not to retry) plus `--allowedTools` derived from the role's `tools:` the way `deriveFlags` derives the codex sandbox — e.g. chronicler: `Bash(git log *),Bash(gh pr list *)`. Never `bypassPermissions`. Plugin hooks fire inside this child (it is Claude Code), so guardrail parity is free — the one place this adapter is simpler than codex.
  - **Env.** `spawnSync(bin, args, { env: { ...process.env, CLAUDE_CODE_AUTO_COMPACT_WINDOW: String(compact) }, stdio: ['ignore','pipe','pipe'] })` — the var exists only in the child's env object; the parent is untouched by construction and the adapter records `parent CLAUDE_CODE_AUTO_COMPACT_WINDOW=<unset|value>` in `next` as AC-9 evidence. **A** (verify at AC-9): a child `claude` spawned from a Claude Code Bash tool may refuse as a nested session; if so, drop `CLAUDECODE` from the child env and log it as a deviation.
  - **stdin.** Closed (`'ignore'`), as run-codex does and as §10's Runtimes row warns for codex (**F** headless docs: `-p` reads stdin).
  - **Output.** `--output-format stream-json --verbose --json-schema <distillate.schema.json>` (**F** draft-07 schema matches the SDK validator; `structured_output` lands on the final `result` message). The stream is saved as `<out>.events.jsonl`; the adapter parses only the last `result` line for `subtype`, `num_turns`, `session_id` (→ `runtime.thread_id`, resumable with `--resume`), `usage`, `structured_output`, and scans assistant messages for the peak per-request prompt (`input + cache_read + cache_creation`) → `deviations: "peak context ≈ N tokens; window 100000"`. Tree-derived fields overwrite the model's claim exactly as in run-codex.
  - **EXIT map.** `success` + valid `structured_output` → exit by `status` (0/3/1); `error_max_turns` or `error_max_budget_usd` → `blocked`, `blocked_reason: "budget: …"`, 3; `error_during_execution`, `error_max_structured_output_retries`, no `result` line → `failed`, 1; binary ENOENT or "not logged in" → `blocked`, 3 (owner problems, as codex). `runtime.name: "claude-p"`, `runtime.model` from the result's `modelUsage` key when present.
- **Tradeoffs.** Two files, one flag grammar each; the codex-only guardrails (`--ignore-rules` refusal, sandbox derivation) stay where they are.
- **Operational cost.** A second `tools/*-test.mjs` harness with a shim binary (the `CLAUDE_BIN` pattern mirrors `CODEX_BIN`); run-codex's 177 tests untouched.
- **Cost of reversal.** Low: delete one file.

### Option B — extract `tools/lib/run-common.mjs`, both adapters import it
- **How it works here.** Move the shared exports out of run-codex into a lib; both import.
- **Tradeoffs.** Cleaner dependency direction, but touches a High-impact file and its harness for no behavior change, in the same mission that adds the first consumer. Rule of three: do it when a third runtime arrives.
- **Cost of reversal.** Low.

### Option C — generic runner (`run-codex.mjs --runtime claude-p|codex`)
- **How it works here.** One file branches on `--runtime` for argv, env, event parsing and exit mapping.
- **Tradeoffs.** 577 lines already; two unrelated CLI grammars in one argv builder is where flag-order bugs breed (run-codex's own comments record two of them). The filename would lie, and `mission.md`'s `codex` paragraph and tests would need re-wording.
- **Cost of reversal.** Medium.

### Recommendation — **A.**
It ships the Haiku path with zero changes to the proven codex adapter and keeps each runtime's quirks local. **Strongest case against:** importing from a sibling tool rather than a lib is an inverted dependency — accepted here because the next runtime (Option B's trigger) is not in sight and the exports are already public.

**Values this decision settles:**
- File: `plugins/agentic-workflow/tools/run-claude.mjs`; imports helpers from `./run-codex.mjs`; env override `CLAUDE_BIN`.
- Child argv: `claude -p --agent <role|agentic-workflow:role> --model <id> --max-turns <n> --effort <level> --permission-mode acceptEdits --permission-prompts none --allowedTools <derived> --output-format stream-json --verbose --json-schema <schema> <prompt>`; never `--bare`, never `bypassPermissions`.
- `CLAUDE_CODE_AUTO_COMPACT_WINDOW` set only on the child's env object; stdin `'ignore'`; events saved as `<out>.events.jsonl`; only the final `result` line is parsed for content.
- EXIT map: `0 done · 3 blocked (incl. error_max_turns, error_max_budget_usd, no binary, not logged in) · 1 failed (error_during_execution, schema retries exhausted, no result)`.
- Distillate `runtime.name: "claude-p"`; `thread_id` = `session_id`; AC-9 evidence lines: peak per-request prompt tokens and the parent's (unset) window var.
- `mission.md` step 2 gains a `claude-p` bullet mirroring the `codex` one (Bash `run_in_background: true`, read the file, orchestrator commits `changed_paths`).

**What would change the answer.** A third runtime, or a second consumer of the shared helpers, triggers B. If AC-9 shows `-p --agent` does not apply the shadow, the fallback invocation above replaces the `--agent` line and the memo is amended, not re-decided.

---

## Questions only the owner can settle
1. D1: on `tune preset reset`, a shadow that is preset-authored **and** hand-tuned is kept and reported (my recommendation) — or should preset reset also drop the hand tune?
2. D2: accept `maxTurns 24` / 500 lines as the AC-7 starting values, with AC-9 allowed to move them?
3. D3: accept `tick_budget` default 400,000 and the two new ledger header lines?
4. D4: accept that `claude -p --agent` is unproven until AC-9, with the `--system-prompt-file` fallback pre-approved so the n=1 run cannot stall on it?

_The architect consults; the **human decides**. Each choice lands as a dated locked decision in the master plan pointing at this file._
