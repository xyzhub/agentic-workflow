---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: continuous-operation — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the
expensive exploration happened once, here (2026-10-27, main at 1949231,
plugin v1.69.1, node v24.12.0)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/continuous-operation.md` · Ledger: `.plans/continuous-operation.state.md`
Source brief: `docs/product/decisions/2026-10-27-continuous-operation-brief.md` (201 lines — read whole in S0; **Source of truth + Docs vs code `:60–78`, L1 `:163`, L2 `:181`, L3 `:184`, L4 `:196`, L5 `:199–201`** in every session; the `## P0 probe record` S0 appends is what S1/S2 depend on).
Specs: `docs/product/decisions/2026-10-27-continuous-operation-memos.md` (669 lines — ranged reads below; D1-C, D2's cron watchdog + systemd, D5-B/C's session surface and local `answer`, D6-B are NOT read: L1 struck them).
Copy: `docs/product/decisions/2026-10-27-continuous-operation-journeys.md` (212 lines — ranged reads; J5 and every systemd/relay/local-answer row are NOT read).
Numbers: `docs/product/decisions/2026-10-27-continuous-operation-metrics.md` (93 lines — §1 and §4 in S3, §2 and §5 in S5).

**Path convention.** `<plugin>/` = `plugins/agentic-workflow/`; `tools/` with
no prefix = the repo-root lint/test harnesses. Prefix `/agentic-workflow:`,
version **1.70.0** (this mission runs before the rebrand, L5).

**Catalog**: none — this repo's §10 **Catalog** row is `none — markdown-only
plugin` (`docs/product/catalog/` does not exist). No catalog reads, no catalog
regeneration in Verify.

**Gates available in this repo** (§10):

| Gate | Command | When |
|---|---|---|
| Test / lint gate (CI `lint.yml`, 18 lines) | `node tools/lint.mjs` | end of every session and at every checkpoint — clean on 1949231 apart from the standing `warn:` on WORKFLOW bytes; runs every `tools/*-test.mjs` harness in its array (`tools/lint.mjs:1402`) |
| Hook harness | `node tools/hook-test.mjs` | after any `hooks/` edit (S0 constants, S2, S4) |
| Runner / fidelity / gate harnesses (new) | `node tools/runner-test.mjs` · `node tools/fidelity-test.mjs` · `node tools/gate-test.mjs` | after every edit to the matching tool |
| headless / run-claude / run-codex / lint-test harnesses | `node tools/headless-test.mjs` · `node tools/run-claude-test.mjs` · `node tools/run-codex-test.mjs` · `node tools/lint-test.mjs` | S1 (headless refactor), S4 (codex.rules), S2 (rule-dedup) |
| Staging verify (§10 Staging = none) | lint green + `claude --plugin-dir <plugin>` loads | at each checkpoint, before the PR is marked ready after S5 |

**Facts already probed (do not re-probe):** `node` v24.12.0. `tools/` is
zero-dep (header idiom `<plugin>/tools/headless.mjs:1–49`; main guard
`:288–290`). `tools/hook-test.mjs` `runHook({event, desc, command, input,
ledgers, files, transcript, bin, env, dir, git})` (`:57`) selects a hook by a
substring of its `description`. `tools/lint.mjs` harness-check shape
`:519–536` (`checkHeadlessHarness`), check array `:1402`, byte budgets
`:1049–1072` (agent 16,000 · command 24,000 · skill 6,000 · WORKFLOW 120,000;
`templates/WORKFLOW.md` is **115,866 B** today → 4,134 B headroom for the whole
mission), `checkRuleDedup` `:1211`. `hooks.json` (215 lines): PreToolUse
groups at `:49–126` (merge-guard `:83–93`, handoff-gate `:116–126`),
SessionStart `:166–200`. `handoff-lib.sh` (334): constants `:70–79`
(`HL_DEFAULT_WINDOW`, `HL_DEFAULT_PCT`, bands 70/85, `HL_FAIL_OPEN=6`),
`hl_paths` `:100–117`, `hl_threshold` `:180–186`, `hl_band` `:191–209`,
`hl_redact` `:225–234`. `handoff-gate.sh` (131): allowlist `:96–110`, block +
fail-open `:112–131`. `mission-budget.sh` (118): field regexes `:73–83`, texts
`:105–112`. `compact-resume.sh` (254): branch 3 text `:250`. `run-claude.mjs`
(458): `DEFAULTS` `:49`, `buildArgv` `:236–257`, `childEnv` `:260–267`,
`FORBIDDEN` `:269`, `parseStream` `:286–324`, max-budget branch `:428`.
`headless.mjs` (290): `claudeArgs` `:82–88`, `turn` `:95–112`, `ledgerState`
`:115–120`, `run` `:155–182`. `ask.mjs` (228): `HEADLESS_ASK_NOTE` `:200`,
`ask()` `:66`, `pendingOf` `:59`. `active-ledger.sh` (83). `ledger.mjs` (277,
header `:1–30` lists every verb). `tune-presets.json:89` `unattended.tick_budget
= 750000`. `.plans/OBLIGATIONS.md` (74) ends at **OB-34**; OB-32 is `:72`,
OB-1 is `:28`. The 15 `AskUserQuestion` sites in `commands/` are listed in
the master plan AC-15. `docs/WORKFLOW.md` is NOT synced in this mission.

Branch: `feat/continuous-operation` (from `plan/continuous-operation`, OQ-5).
Six briefs in sequence on one branch; a one-shot **Fable** checkpoint inside
each session (boundary-class: `hooks/` + `tools/` + `templates/` +
`hooks.json` + `codex.rules` are `security-boundary`,
`templates/gate-classes.md:32`); one PR to `main` after S5; the human merges.
Not parallel (each phase builds on the previous tool's `--help`).

## Large-files table

| File | Lines | Notes |
|---|---|---|
| `tools/hook-test.mjs` | 2,579 | read 20–60, 2236–2260, 2373–2396, 2532–2547 only; new blocks go after the child-silence block (`:2532–2546`), before `:2547` — never inside a `withDir` — with a `// ──` header |
| `CHANGELOG.md` | 1,801 | read 1–12 only (S5) |
| `tools/context-attrib.mjs` | 1,446 | not read |
| `<plugin>/templates/WORKFLOW.md` | 1,431 | 115,866 B; read 595–612 (Loop mode), 858–880 (§6.2), 1044–1054 (§10 rows), 1185–1252 (§12) only |
| `docs/WORKFLOW.md` | 1,420 | not read (not synced here; §10 rows quoted in this file) |
| `tools/lint.mjs` | 1,412 | read 16–34, 519–536, 1049–1072, 1211–1230, 1400–1405 only |
| `<plugin>/tools/browse.mjs` | 1,030 | not read |
| `tools/run-codex-test.mjs` | 748 | read the `codex.rules` cross-check block only (grep `covers`) — S4 |
| `docs/product/decisions/2026-10-27-continuous-operation-memos.md` | 669 | ranged reads only (below) |
| `<plugin>/tools/run-codex.mjs` | 587 | not read |
| `<plugin>/tools/run-claude.mjs` | 458 | read 1–50, 236–270, 286–324, 420–440 |
| `<plugin>/tools/publish-gate.mjs` | 445 | read 1–40 only (S4 — the gate-tool header style) |
| `tools/run-claude-test.mjs` | 376 | not read |
| `<plugin>/README.md` | 363 | read 300–320 only (S5) |
| `<plugin>/commands/mission.md` | 350 | read 20–50, 120–130, 170–180, 296–310 |
| `<plugin>/hooks/lib/handoff-lib.sh` | 334 | read 1–50, 70–79, 100–117, 180–234 |
| `tools/ledger-test.mjs` | 335 | not read |
| `tools/lint-test.mjs` | 310 | read 148–190 only (S2 — the RULE cases) |
| `tools/browse-test.mjs` | 301 | not read |
| `<plugin>/templates/codex.rules` | 294 | read 1–60, 150–245 (S4) |
| `<plugin>/tools/headless.mjs` | 290 | whole (S1) |
| `<plugin>/tools/ledger.mjs` | 277 | read 1–30 only |
| `tools/marker-test.mjs` | 274 | not read |
| `<plugin>/commands/connect.md` | 261 | read 76–123 only (S4) |
| `<plugin>/commands/operate.md` | 255 | read 1–30 only (S1 — the unit prompt) |
| `<plugin>/hooks/lib/compact-resume.sh` | 254 | read 1–70, 240–254 |
| `tools/agents-test.mjs` | 252 | read 1–40 only (harness header style) |
| `<plugin>/commands/settle.md` | 242 | not read |
| `<plugin>/tools/ask.mjs` | 228 | read 1–30, 59–106, 196–228 |
| `<plugin>/commands/autopilot.md` | 224 | read 25–45, 60–75 |
| `<plugin>/commands/bootstrap.md` | 224 | read 110–125 only (S2) |
| `<plugin>/agents/reviewer.md` | 220 | not read (the checkpoint spawn reads it) |
| `<plugin>/hooks/hooks.json` | 215 | read 49–60, 83–93, 116–126 |
| `docs/product/decisions/2026-10-27-continuous-operation-journeys.md` | 212 | ranged reads only |
| `<plugin>/commands/sync.md` | 193 | read 99–115 only (S2) |
| `docs/product/decisions/2026-10-27-continuous-operation-brief.md` | 201 | whole in S0; 60–78 + 163–201 after |
| `<plugin>/commands/doctor.md` | 162 | read 1–15, 130–142 |
| `<plugin>/templates/tune-presets.json` | 139 | read 86–92 only |
| `<plugin>/tools/ci-wait.mjs` | 134 | not read |
| `<plugin>/hooks/lib/handoff-gate.sh` | 131 | whole (S2) |
| `<plugin>/commands/publish.md` | 123 | read 20–26, 54–58, 73–77 (S2 pointer sentences) |
| `<plugin>/hooks/lib/mission-budget.sh` | 118 | read 1–50, 70–118 (S1) |
| `<plugin>/tools/shell-wrappers.mjs` | 101 | read 1–30 only (S4) |
| `<plugin>/templates/gate-classes.md` | 100 | read 20–60 (S4) |
| `docs/product/decisions/2026-10-27-continuous-operation-metrics.md` | 93 | read 9–22 + 59–80 (S3), 23–35 + 82–93 (S5) |
| `<plugin>/templates/engineering-runbook.md` | 83 | whole (S5) |
| `tools/headless-test.mjs` | 83 | whole (S1 — the fake-claude harness to copy) |
| `<plugin>/hooks/lib/active-ledger.sh` | 83 | whole (S1 — the predicate to port) |
| `<plugin>/commands/handoff.md` | 81 | whole (S2) |
| `.plans/OBLIGATIONS.md` | 74 | read 1–12, 28, 72–74 |
| `<plugin>/hooks/lib/pre-compact.sh` | 59 | read 1–30 (S2, S3 — not edited) |
| `<plugin>/templates/session-handoff.md` | 55 | whole (S3 — the seed headings) |
| `<plugin>/commands/next.md` · `plan.md` · `groom.md` · `brainstorm.md` | 84 · 93 · 140 · 64 | the cited ask lines ±3 only (S2) |

## Phase P0 — spike + probes (branch: `feat/continuous-operation`)

### S0 — fire OB-32, run probes (a)–(f), fix the constants if they lie

- **ACs**: AC-1, AC-2, AC-3
- **Suits**: `devops` (live sessions, env experiments, one constants fix;
  no product code). Runtime: `claude` (default; §10 Tune preset `balanced`).
  **Needs the owner**: OB-32 runs on orderly-agents (`.plans/OBLIGATIONS.md:72`
  — `/plugin update` + `/reload-plugins` there first). The probes (b)–(f) run
  on any machine with the plugin installed.
- **Reads** (≈ 620 lines):
  1. Brief whole (201) — Source of truth + Docs vs code `:60–78`, L1–L5 `:163–201`;
     master plan Task 1 + Locked decisions (the three `Assumed` lines) ≈ 90.
  2. Memos 33–78 (what exists + the Claude Code capability table — the
     claims the probes test), 599–604 (the Unverified list), 616–636 (EGM
     plugin-file-read finding) ≈ 70.
  3. `<plugin>/hooks/lib/handoff-lib.sh` 70–79 (constants) + 180–209
     (`hl_threshold`, `hl_band`); `tools/hook-test.mjs` 2373–2396 (the band
     cases that pin 70/85 × the defaults) ≈ 65.
  4. `<plugin>/tools/run-claude.mjs` 236–270 (argv + child env — the
     non-restricted child the probes spawn is this minus `--restricted`,
     `--tools`, `AGENTIC_WORKFLOW_CHILD`) + 420–440 (result subtypes) ≈ 55.
  5. `.plans/OBLIGATIONS.md` 1–12 (row grammar) + 72 (OB-32) ≈ 13;
     `<plugin>/commands/handoff.md` 1–20 (where the local handoff lives) ≈ 20.
- **Prior art**: none — no permission gate is touched in S0. The probes use
  a scratch repo under the scratchpad dir, never this checkout's git dir.
- **Do**:
  1. **OB-32 (AC-1), first.** With the owner on orderly-agents: export
     `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000`, open a real session in an
     adopted repo, drive it to auto-compaction (large ranged reads, no
     builder spawns). Record: snapshot path under `git rev-parse --git-path
     agentic-workflow/snapshots/`; the compact-resume directive text (does it
     name the snapshot?); `/agentic-workflow:doctor` Handoff row; the token
     count at the compaction (the transcript's last `usage` line before the
     `compact` SessionStart) → observed percentage of 400,000. Report the
     `· fired 2026-…` line text for the orchestrator to append to
     `OBLIGATIONS.md:72`. If the observed percentage is not 95 ± 2 →
     change `HL_DEFAULT_PCT` at `handoff-lib.sh:71` and the expected numbers
     in `hook-test.mjs:2373–2396` (keep the 70/85 band constants), run
     `node tools/hook-test.mjs`.
  2. **Probe (a) settings `env` → hooks.** In a scratch git repo, write
     `.claude/settings.json` `{"env":{"CLAUDE_CODE_AUTO_COMPACT_WINDOW":"400000"}}`,
     add a one-line UserPromptSubmit hook in that repo's `.claude/settings.json`
     that prints `env | grep AUTO_COMPACT` to a file, start `claude`, type
     one prompt, read the file. Record: reaches hooks yes/no; needed a new
     session start yes/no.
  3. **Probe (b) plugin-file reads.** Spawn `claude -p --output-format
     stream-json --verbose --permission-mode acceptEdits --permission-prompts
     none "Read ${CLAUDE_PLUGIN_ROOT}/agents/reviewer.md lines 1–5 and
     print them"` (no `--restricted`, no `--tools`) and, in an interactive
     session, an Agent-tool subagent with the same instruction run in the
     background. Record the result or the exact refusal text for both.
  4. **Probe (c) wake path.** In an interactive session: Bash
     `sleep 120; echo woke` with `run_in_background: true`, end the turn,
     do nothing; record whether a new turn arrives with the result, and
     after how long; repeat with `sleep 1200`. Then foreground Bash
     `sleep 600` with `timeout: 600000` — record whether it returns cleanly.
  5. **Probe (d) scheduled fire vs typed prompt.** Add a scratch
     UserPromptSubmit hook that dumps stdin JSON keys to a file; type a
     prompt; `CronCreate` a one-shot 1-minute job with a prompt; diff the two
     key sets. Record: distinguishable yes/no and by which key.
  6. **Probe (e) `continue:false` under `-p`.** Scratch PreToolUse hook on
     `Bash` printing `{"continue":false,"stopReason":"probe"}`; run
     `claude -p --output-format stream-json --verbose "run ls"`; record exit
     code and the `result` event's `subtype`/`is_error`. Then an interactive
     session asks an Agent-tool subagent to run `ls`; record whether the
     stop ends only the subagent (the parent gets a hand-back) or the
     whole session.
  7. **Probe (f) `--max-budget-usd`** — one line: `claude --help | grep -i
     budget`; record the spelling (the subtype is already handled at
     `run-claude.mjs:428`).
  8. Append `## P0 probe record (2026-…)` to the brief after L5 (`:201`): one
     table, columns `probe · invocation (verbatim) · observed · claude
     --version · decides`. Facts only; `could not verify: <why>` when so.
     Commit `docs(continuous-operation): P0 probe record + OB-32 evidence`
     with the §10 Attribution line; push. Do not touch `.plans/`.
- **Verify**:
  - OB-32: the four observations are in the hand-off and the `· fired`
    line text is reported verbatim; `node tools/hook-test.mjs` green after
    any constants change (report whether one was needed).
  - The probe record has six rows, each with a verbatim invocation and the
    CLI version; rows (c) and (e) each name the shipping text they select
    for `commands/run.md` / `handoff-gate.sh` (AC-10, AC-11).
  - `node tools/lint.mjs` → `lint: clean` (WORKFLOW `warn:` allowed).
  - No file outside the brief and (conditionally) `handoff-lib.sh` +
    `hook-test.mjs` changed: `git diff --stat main..HEAD`.
  - Catalog: none, nothing to regenerate.
- **Read budget**: ≈ 620 lines — well inside; the session's cost is
  wall-clock, not reads. Order if time runs short: (e) and (c) first (they
  pick S2's text), then (a), (f), (b), (d); OB-32 can complete after the
  probes on the owner's schedule but S1 does not start until it is fired.

**Checkpoint ckpt-s0** — one-shot `reviewer` on **Fable** inside S0: reads
the probe record and the OB-32 evidence; verdict on whether every row is a
fact with its invocation (not an inference), whether the constants change
(if any) is justified by the observed number, and whether rows (c)/(e) make
an unambiguous pick for S2. APPROVE → ledger `[x]`; `Next up: S1`.

## Phase P1 — the runner (branch: `feat/continuous-operation`)

### S1 — `tools/runner.mjs`, `redact.mjs`, `runner.json`, harness, `headless.mjs run` on the core

- **ACs**: AC-4, AC-5, AC-6, AC-7, AC-8, AC-9
- **Suits**: `backend` (one zero-dep Node CLI + a redaction module + a
  harness; a refactor of one existing tool). Runtime: `claude`.
- **Reads** (≈ 1,420 lines):
  1. Brief 60–78 (source of truth + docs vs code — goes into the round
     prompt verbatim) + 163–201 (L1–L5) + the P0 probe record (≈ 20); master
     plan Task 2 + Value sourcing rows AC-4..AC-9 + Locked decisions ≈ 220.
  2. Memos 82–118 (D1-A), 137–167 (unit selection, exit table, per-round
     caps, gap 10), 216–240 (locks, stops, crash loop, logs + redaction),
     433–446 (auth facts — read for the auth-expired path only; the
     account/API-key sentences are superseded by L3), 642–669 (counsel) ≈ 150.
  3. Journeys 19–40 (voice rules + the round line), 42–74 (J1 table — drop
     the systemd and API-key words), 194–196 (digest line) ≈ 60.
  4. `<plugin>/tools/headless.mjs` whole (290) — `claudeArgs`, `turn`,
     `ledgerState`, `run` are the core to lift; `tools/headless-test.mjs`
     whole (83) — the fake-claude harness shape.
  5. `<plugin>/tools/run-claude.mjs` 1–50 (header + `DEFAULTS`), 236–270
     (argv, `childEnv`, `FORBIDDEN`), 286–324 (`parseStream` — usage fields),
     420–440 (result subtypes) ≈ 120.
  6. `<plugin>/hooks/lib/mission-budget.sh` 1–50 + 70–118 (the arithmetic
     and the texts to mirror) ≈ 100; `<plugin>/hooks/lib/active-ledger.sh`
     whole (83) — port the predicate; `<plugin>/hooks/lib/handoff-lib.sh`
     100–117 (`hl_paths` state-dir idiom) + 225–234 (`hl_redact`) ≈ 30.
  7. `tools/hook-test.mjs` 20–60 (`runHook` — the parity fixture drives
     the hook through it) ≈ 40; `tools/lint.mjs` 519–536 + 1400–1405 ≈ 25;
     `tools/agents-test.mjs` 1–40 (harness header style).
  8. `<plugin>/tools/ask.mjs` 1–30 + 196–228 (`HEADLESS_ASK_NOTE`,
     `pendingOf` — what `ccp run` keeps) ≈ 60; `<plugin>/tools/ledger.mjs`
     1–30 (the verbs the child uses; the runner's one deviation write
     mirrors `handoff` formatting) ≈ 30; `<plugin>/templates/tune-presets.json`
     86–92 (`tick_budget`); `<plugin>/commands/operate.md` 1–30 (the operate
     unit prompt) ≈ 37.
- **Prior art**: `run-claude.mjs:260–269` — the child-env copy and the
  `FORBIDDEN` argv list (re-use, do not re-derive); `handoff-lib.sh:100–117`
  — private state under the git common dir; `mission-budget.sh:73–83` — the
  ledger field regexes (copy them character for character). Permission
  gates: `tools/shell-wrappers.mjs`, `templates/codex.rules`, `hooks/hooks.json`
  — this brief adds NO rule and no refusing hook (the runner is run by the
  parent's own Bash; S4 adds the gate-guard).
- **Do**:
  1. **`<plugin>/templates/runner-config.json`** — the AC-8 schema with
     defaults (`daily_tokens` 5000000, `tick_tokens` 750000, `compact_window`
     200000, `backoff_min` [5,15,60], `operate_per_day` 4, `approver` stub
     `{ "route": "owner" }`) and a `$comment` naming what is NOT here
     (tokens, ids with secrets, any account field).
  2. **`<plugin>/tools/redact.mjs`** (AC-7): `export function redact(text,
     env = process.env)` — the seven `hl_redact` regexes transliterated,
     then exact-value scrub for env names matching
     `/(TOKEN|SECRET|KEY|PASSWORD|CREDENTIAL)/i` with values ≥ 8 chars
     (longest first, `[redacted]`); `export const SECRET_NAME_RE`.
  3. **`<plugin>/tools/runner.mjs`** (AC-4/5/6/8): header in the
     `headless.mjs` style listing every subcommand, flag, exit code and the
     state dir; exports `parseArgs`, `stateDir(cwd)`, `readConfig(cwd)`,
     `pickUnit(state)`, `ledgerBudget(text)` (the five fields, the hook's
     regexes), `budgetVerdict(fields)`, `dailyTotal(state, now)`,
     `backoffFor(history)`, `roundPrompt(unit, cfg)` — the prompt text that
     opens with the **sources rule** ("Rebuild your context ONLY from
     `docs/product/`, the `.plans/` ledgers and `.plans/OBLIGATIONS.md`, and
     the handoff at `<path>` — never a transcript, a compaction summary or
     a memory folder. Before you end, write what the next round needs into
     those files. Docs vs code: a mismatch is never resolved silently —
     report it as a `## Deviations` line; intent (a locked decision, an AC,
     a rule) → the doc wins, fix the code or open a decision gate before
     the decision changes; a description of current behaviour (a path, a
     threshold, how a hook/tool works) → the code wins, update the doc.")
     then the unit command and `HEADLESS_ASK_NOTE` (until S4 swaps it),
     `roundLine(fields)`, `roundOnce(cwd, cfg, deps)` (the whole round:
     lock → spawn → stream to `rounds/<n>.events.jsonl` 0600 → `parseStream`
     usage → ledger/handoff mtime docs check (`0` with neither touched →
     `22 no-record`) → outcome → `round:` line through `redact` → unlock →
     code), `wait(cwd, cfg, deps)`. Child argv: `['-p', '--output-format',
     'stream-json', '--verbose', '--permission-mode', cfg.permission_mode ||
     'acceptEdits', '--permission-prompts', 'none', '--max-turns', …]` +
     `--max-budget-usd` ONLY if probe (f) confirmed the spelling (else a
     comment citing the probe row); never `--restricted`, never `--tools`;
     child env = `{...process.env}` minus `CLAUDECODE`,
     `CLAUDE_CODE_ENTRYPOINT`, `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`,
     plus `AGENTIC_WORKFLOW_UNATTENDED=1`,
     `CLAUDE_CODE_AUTO_COMPACT_WINDOW=<cfg.compact_window>`; assert
     `AGENTIC_WORKFLOW_CHILD` absent. Auth: a result whose text matches
     `/401|Login expired|not logged in|authentication/i` → `75`. Lock:
     `<state>/lock` holding `pid start`, `O_EXCL` create, stale if the pid
     is dead. `STOP` file: `reason UTC`. Daily: `daily.json`
     `{ "<UTC date>": tokens }`. Backoff: `backoff.json` (consecutive codes).
     `next --json` prints the whole preflight; `status` prints the last 5
     `round:` lines + today's tokens/cap + stop state. Gate hook points:
     `if (existsSync(gateTool)) await poll()` — a no-op this phase. The
     runner NEVER treats an `ask.mjs answer` (`ask.mjs:85`) or a
     `questions.jsonl` event as a gate answer: `ask.mjs` stays the `ccp run`
     owner-at-keyboard surface only (harness case).
  4. **`<plugin>/tools/headless.mjs`** `run` (`:155–182`): replace the loop
     body with `roundOnce` from `./runner.mjs` (keep the `answerPending`
     page, the tick count and the `ccp` messages); `turn`/`claudeArgs` stay
     for `chat`. `headless-test.mjs` must stay green unchanged.
  5. **`tools/runner-test.mjs`** (AC-9; `headless-test.mjs` style, fake
     `claude` on `CLAUDE_BIN` writing canned stream-json incl. a `result`
     with `usage`): the AC-4 exit-code table row by row (fixtures per
     outcome); lock busy + stale reclaim; daily cap (two rounds of 2.6M →
     `30 daily-cap`; UTC rollover resets); backoff ladder; crash loop (3 ×
     `1` → `30`); no-progress (2 × `22` → `30`); `22 no-record` when the
     fake child reports progress but touches neither ledger nor handoff;
     parity: the shared ledger fixtures `{k,N,TB,TT,MB}` × {silent, OVERRUN,
     TICK, MISSION} run through `mission-budget.sh` via a copy of `runHook`
     and through `budgetVerdict` → same verdicts; `redact` parity corpus vs
     `bash -c 'source handoff-lib.sh; hl_redact'` and the five-canary
     negative test over the summary line, `rounds.log`, a fake alert body
     and `status`; child env/argv assertions (`UNATTENDED=1`, no `CHILD`,
     no `ANTHROPIC_API_KEY`, no `--restricted`, nothing in `FORBIDDEN`);
     `75` on a fake `Login expired` result; the round prompt contains the
     sources rule and names `docs/product/`, `.plans/`, the handoff path
     and never `transcript`/`.remember`. Print `runner harness: clean — N
     case(s)`; exit 1 on failure.
  6. **`tools/lint.mjs`**: `checkRunnerHarness` (copy of `:519–536`, runner
     `tools/runner-test.mjs`, message "runner harness") wired after
     `checkHeadlessHarness` at `:1402`.
  7. Commit `feat(runner): tools/runner.mjs next/round/wait/stop/pause/resume/status, redact.mjs, runner-config (S1)`
     with the §10 Attribution line; push. Do not touch `.plans/`,
     `hooks/`, `commands/`, `templates/WORKFLOW.md` (S2 owns them).
- **Verify**:
  - `node tools/runner-test.mjs` exits 0 — report the case count (≥ 30) and
    name the parity case, the five-canary case, the `22 no-record` case and
    the sources-rule prompt case.
  - `node tools/headless-test.mjs` exits 0 unchanged.
  - `node <plugin>/tools/runner.mjs next --json` in THIS repo prints a
    preflight naming `.plans/continuous-operation.state.md` as not active
    (Sessions used ≥ 1 by then, so expect `unit: /agentic-workflow:mission
    continuous-operation continue` — do NOT run `round` here); `status`
    prints `no rounds yet`; the state dir exists under
    `$(git rev-parse --git-common-dir)/agentic-workflow/runner/` with mode
    0700 and `git status --porcelain | grep -c runner` → 0.
  - `node tools/lint.mjs` → `lint: clean`.
  - `grep -c "ANTHROPIC_API_KEY" <plugin>/tools/runner.mjs` ≥ 1 and the
    only use is the `delete`.
  - Catalog: none.
- **Read budget**: ≈ 1,420 lines (brief/plan 240 · memos 150 · journeys 60 ·
  headless + test 373 · run-claude 120 · hooks 213 · harness refs 105 ·
  ask/ledger/presets/operate 127) — inside the 1,500 budget. Order if time
  runs short: `redact.mjs` + `runner.mjs` `next`/`round` + harness green →
  `wait`/`status`/backoff → the `headless.mjs` refactor last (if it cannot
  be made green, leave `headless.mjs` untouched, report it, and let the
  orchestrator book a corrective — never a red harness).

**Checkpoint ckpt-s1** — one-shot `reviewer` on **Fable** inside S1 over
`main..HEAD` against AC-4..AC-9 with this red-team list: a child env carrying
`AGENTIC_WORKFLOW_CHILD`, `ANTHROPIC_API_KEY` or missing `UNATTENDED`; any
`FORBIDDEN` argv; a `round:` line, alert or `status` output that can carry
an env value (the canaries); a lock that two `round`s can both take; a daily
total that a round without a usage line can evade; a budget verdict that
disagrees with `mission-budget.sh` on any parity fixture; a `0` exit with no
ledger/handoff write; a round prompt that names a transcript, summary or
memory folder as a source; an events log read anywhere but the harness;
`--max-budget-usd` used without the probe row. APPROVE → `[x]`, `Next up: S2`.

## Phase P2 — `/run`, mode-aware handoff, effective window, settings env, HITL-ask audit (branch: `feat/continuous-operation`)

### S2 — `commands/run.md`, `handoff-gate.sh` unattended, `hl_threshold`, bootstrap/sync env, §6.2 rule + 15 pointers

- **ACs**: AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16
- **Suits**: `backend` (bash hooks + hook-test, four command files, one
  template rule; the probe record decides two texts). Runtime: `claude`.
- **Reads** (≈ 1,480 lines):
  1. Brief 60–78 + 163–201 + the P0 probe record rows (a), (b), (c), (e)
     ≈ 75; master plan Task 3 + Value sourcing AC-10..AC-16 + Locked
     decisions (the D3-B and ask-audit lines) ≈ 230.
  2. Memos 244–292 (D3), 454–521 (D7-B incl. "Gap found" and "How it is
     set"), 616–636 (EGM read-approval) ≈ 140.
  3. Journeys 76–95 (J2 table), 97–114 (J3 table) ≈ 40.
  4. `node <plugin>/tools/runner.mjs --help` (the header, ≈ 50 lines) — the
     exit codes `run.md` reacts to; never read the body.
  5. `<plugin>/hooks/lib/handoff-gate.sh` whole (131);
     `<plugin>/hooks/lib/handoff-lib.sh` 1–50 (contract header), 70–79,
     180–209 ≈ 90; `<plugin>/hooks/lib/compact-resume.sh` 1–70 + 240–254
     ≈ 85; `<plugin>/hooks/lib/pre-compact.sh` 1–30 (not edited — confirm);
     `<plugin>/hooks/hooks.json` 116–126 (gate description) + 94–104 (the
     Read-matcher group shape for AC-16) ≈ 22.
  6. `tools/hook-test.mjs` 20–60 (`runHook`), 2236–2260 (AC-3 block head —
     fixture shape for an urgent transcript), 2373–2396 (band cases),
     2532–2547 (the child-silence block — the new block goes after it, before `:2547`, never inside a `withDir`) ≈ 80.
  7. `<plugin>/commands/handoff.md` whole (81); `<plugin>/commands/mission.md`
     20–50, 120–130, 170–180, 296–310 ≈ 65; `<plugin>/commands/autopilot.md`
     25–45, 60–75 ≈ 36; `plan.md` 18–24 + 55–59; `next.md` 78–84;
     `publish.md` 20–26, 54–58, 73–77; `brainstorm.md` 16–20 + 42–46;
     `groom.md` 66–70 + 103–107 ≈ 50 (the pointer sentences land here).
  8. `<plugin>/commands/bootstrap.md` 110–125; `<plugin>/commands/sync.md`
     99–115; `<plugin>/commands/doctor.md` 1–15 + 130–142 ≈ 55.
  9. `<plugin>/templates/WORKFLOW.md` 404–487 (the §5 rule fences — the
     new block sits after `ceremony-skip`), 595–612 (Loop mode), 858–880
     (§6.2 head — pointer only), 1044–1054 (§10 rows Tune preset → Owner channel) ≈ 50;
     `tools/lint.mjs` 1049–1072 (byte budgets) + 1211–1230 (`checkRuleDedup`
     + `RULES` shape; `:1226–1228` = fence-outside-§5 failure) ≈ 45; `tools/lint-test.mjs` 148–190 (RULE cases) ≈ 43.
- **Prior art**: `hooks/hooks.json:116–126` + `handoff-gate.sh:112–131` —
  the ONE refusing hook this brief edits (extend its unattended branch; do
  not add a second gate); `hooks.json:94–104` — the Read-matcher advisory
  group shape (AC-16 copies the matcher, returns `permissionDecision:
  allow` ONLY under the canonical plugin root, silent otherwise — deny/ask
  rules still win); `commands/bootstrap.md:114–119` — adopt-never-overwrite
  for `.claude/settings.json`; `lint.mjs:1211` — `RULES` registry for the
  new `unattended-ask` fence. `tools/shell-wrappers.mjs` and
  `templates/codex.rules` untouched.
- **Do**:
  1. **`handoff-lib.sh`**: add `hl_unattended()` after `hl_num` (`:81`);
     `hl_threshold` (`:180–186`) gains the AC-13 precedence (env → settings
     `env` key → `autoCompactWindow` → default; `jq -r` on
     `.claude/settings.json` relative to cwd; any non-numeric → next
     source); header comment `:28–31` updated.
  2. **`handoff-gate.sh:112–131`** per AC-11: the unattended last line; on
     `BLOCKS -ge HL_FAIL_OPEN` → managed: today's `⚠️ … failed open` line
     byte-identical; unattended: the J3 5-block line to stderr, then EITHER
     `printf '{"continue":false,"stopReason":"handoff-gate: no handoff after 5 blocks"}'`
     + exit 0 (probe (e) = clean stop with a readable subtype) OR
     `hl_mput "$HL_DIR/state/$SID.gate-stop" …` + exit 2 forever (probe (e)
     = anything else) — write the chosen branch, cite the probe row in the
     comment, delete the other; the stop is skipped (block counted, exit 2)
     when `TOOL` is `Agent`/`Task` or the input carries a subagent marker
     (name the key probe (e) showed, else `agent_id`). `hooks.json:122`
     description: the unattended sentences. `compact-resume.sh:250`:
     `hl_unattended && … "end the round; the runner records it"` else the
     existing text.
  3. **`runner.mjs round`** (small edit, S1's tool): map the stop (result
     subtype or the `.gate-stop` marker) → `21`; append the `handoff-failed:`
     deviation line to the active ledger's `## Deviations` (the ONLY ledger
     write; refuse if the section is missing); ladder 1/2/3 → warn/`30`.
     Runner harness: two cases.
  4. **`tools/hook-test.mjs`** — new block after the child-silence block
     (`:2532–2546`), before `:2547`,
     `// ── continuous-operation S2: unattended gate, effective window ──`:
     unattended urgent block → last stderr line is the `unattended=1 — …`
     line; unattended 6th block → the JSON stop (or the marker + exit 2)
     and `⚠️ … failed open` appears nowhere; managed 6th block →
     byte-identical to today's line; unattended + `tool_name: Agent` 6th
     block → exit 2, no stop; `AGENTIC_WORKFLOW_CHILD=1` → silent;
     compact-resume branch 3 unattended wording; `hl_threshold`: settings
     `env` 200000 and no env var → urgent at 161,500; env var 400000 wins
     over the file; malformed file → 1,000,000 × 95 %.
  5. **`commands/handoff.md`** `## Then` (`:62–68`) and Output (`:78–81`)
     per AC-12 — managed copy from journeys J2; keep ≤ 6,000 B.
  6. **`commands/run.md`** (new, ≤ 9,000 B; frontmatter like `handoff.md:1–5`,
     `allowed-tools: [Read, Bash, Grep, Glob]` — no Write/Edit/Task: the
     parent spawns nothing but the runner): the AC-10 loop with the J1 lines;
     the background OR foreground `--max` variant per probe (c) (write the
     chosen one, strike the other in a one-line note citing the row); the
     parent rules (≤ 60-line reads; docs-only resume; no gates; steers via
     `## Standing steers`); `run status|stop|pause` map to the runner verbs; `resume` is NOT a
     parent verb — the parent prints `node ${CLAUDE_PLUGIN_ROOT}/tools/runner.mjs
     resume` for the human to run at the shell (a STOP-file self-resume
     path is exactly what S4's gate-guard blocks); the stop lines (`🛑 …`) verbatim from J1 minus systemd
     words. `autopilot.md:30–37` and `mission.md:298–308`: one sentence
     each pointing at `/agentic-workflow:run` for fresh context per tick.
  7. **Settings env + §10 row + doctor** (AC-14): `bootstrap.md` paragraph
     after `:119`; `sync.md` §3.7 bullet after `:112`; `templates/WORKFLOW.md`
     §10 new row after **Tune preset** `:1044` (`**Compaction window**`,
     ≤ 350 B); `doctor.md` §1 bullet after `:141` (≤ 400 B).
  8. **Unattended-ask rule** (AC-15): `templates/WORKFLOW.md` §5 — the
     canonical `<!-- rule: unattended-ask -->` … `<!-- /rule -->` block
     after the `ceremony-skip` fence (`:478–486`; `checkRuleDedup`
     `lint.mjs:1226–1228` fails any fence outside §5), and §6.2 after `:880`
     a one-line pointer (≤ 900 B for both;
     names `ask.mjs ask …` now, "S4 upgrades to `gate.mjs open --class
     decision`" is NOT written — S4 edits the text); the 15 pointer
     sentences (`see §6.2 unattended-ask`, ≤ 120 B each); `lint.mjs`
     `RULES` gains `unattended-ask` (name regex `/unattended-ask|AGENTIC_WORKFLOW_UNATTENDED/`);
     `lint-test.mjs` one RULE case (the canonical paragraph →
     `ruleRestatement === true`) and one negative (a pointer sentence → false).
  9. **AC-16 (conditional on probe (b))**: `hooks/lib/plugin-read.sh` +
     the `Read|Grep|Glob` PreToolUse group after `:104`; hook-test: allow
     under root, silent outside, symlink into root refused. If (b) showed
     no refusal: no file, one line in the hand-off citing the row.
  10. `node tools/lint.mjs`; commit `feat(run): /agentic-workflow:run thin
      parent, unattended handoff gate, effective window, settings env,
      unattended-ask rule (S2)` + Attribution; push. Never edit `.plans/`.
- **Verify**:
  - `node tools/hook-test.mjs` green — report the new block's case names
    (≥ 9) and that `failed open` appears in no unattended case output.
  - `node tools/runner-test.mjs` green incl. the two `21` cases.
  - `node tools/lint-test.mjs` green incl. the `unattended-ask` cases;
    `node tools/lint.mjs` → `lint: clean` (no `unattended-ask` dedup
    finding, no "outside §5" finding; no byte-budget finding).
  - `wc -c <plugin>/templates/WORKFLOW.md` ≤ 118,400 (report the number);
    `wc -c <plugin>/commands/run.md` ≤ 9,000; `handoff.md` ≤ 6,000.
  - `grep -c "unattended-ask" <plugin>/commands/*.md` → 15 pointer hits
    across the 9 files named in AC-15 (list them).
  - `grep -n "AGENTIC_WORKFLOW_UNATTENDED" <plugin>/hooks/lib/*.sh` → in
    `handoff-lib.sh` (definition) and nowhere a second definition.
  - `claude --plugin-dir <plugin>` loads and `/agentic-workflow:run status`
    prints the runner's status line (or report skipped with the reason).
  - Catalog: none.
- **Read budget**: ≈ 1,480 lines — at the budget's edge; the order of work
  if time runs short: steps 1–4 (hooks + tests, the mission's core) → 6
  (`run.md`) → 5, 7 → 8 → 9. If step 8's 15 pointers cannot land green,
  stop with the canonical paragraph + the `RULES` entry in and report the
  remaining sites for a corrective; never a red lint.

**Checkpoint ckpt-s2** — one-shot `reviewer` on **Fable** inside S2 over
`main..HEAD` against AC-10..AC-16: the unattended 6th block can never reach
exit 0 without the JSON stop; the managed line is byte-identical; an
`Agent`-tool block never issues the stop; `hl_threshold` cannot read a
non-numeric into arithmetic; the settings write never overwrites; the parent
command cannot Write/Edit/Task; `run.md` names the probe rows for its two
variant choices; every ask site is a pointer, not a restatement; the
`plugin-read.sh` allow (if present) cannot match outside the canonical root;
byte budgets. APPROVE → `[x]`, `Next up: S3`.

## Phase P3 — fidelity test (branch: `feat/continuous-operation`)

### S3 — `tools/fidelity.mjs`, fixtures, `fidelity-test.mjs`, naive-reader prompt + scorer, `fidelity-model.yml`

- **ACs**: AC-17, AC-18
- **Suits**: `backend` (Node harness over existing bash hooks; one GitHub
  workflow). Runtime: `claude`.
- **Reads** (≈ 1,050 lines):
  1. Brief 60–78 (the sources rule — the fixture's "docs-only" case encodes
     it) + 163–180 (L1 fidelity clause) ≈ 37; master plan Task 4 + Value
     sourcing AC-17/18 + Locked decisions (D4-C line) ≈ 110.
  2. Memos 296–334 (D4), 616–628 (Comprehension Goldfish) ≈ 50; metrics
     9–22 (D2–D4, D9) + 59–80 (§4 scoring) ≈ 36.
  3. `<plugin>/templates/session-handoff.md` whole (55) — the seed headings;
     `<plugin>/templates/mission-state.md` 1–60 (ledger header fields the
     seed ledger must carry) ≈ 60.
  4. `tools/hook-test.mjs` 20–60 (`runHook` — import or copy; it is not
     exported today: copy the function into `fidelity-test.mjs` with a
     comment, do not refactor hook-test) + 2532–2547 ≈ 56;
     `<plugin>/hooks/lib/compact-resume.sh` 1–70 + 195–254 (directive
     texts, freshness lines) ≈ 130; `<plugin>/hooks/lib/pre-compact.sh` 1–30
     ≈ 30; `<plugin>/hooks/lib/handoff-lib.sh` 180–209 (the band the
     mismatch fixture tests) ≈ 30.
  5. `node <plugin>/tools/runner.mjs --help` (≈ 50) + `<plugin>/tools/runner.mjs`
     the `roundPrompt` export only (grep it; ≈ 30 lines) — path (b) asserts
     on it.
  6. `tools/lint.mjs` 519–536 + 1400–1405 ≈ 25; `.github/workflows/lint.yml`
     whole (18) — the model workflow copies its pins; `tools/agents-test.mjs`
     1–40 ≈ 40.
  7. `<plugin>/tools/run-claude.mjs` 236–257 (argv shape for the model job's
     `claude -p` call — `--model haiku`, `--autocompact`) ≈ 22.
- **Prior art**: none — no permission gate is touched; the model workflow
  is `workflow_dispatch` only and reads one repository secret by name.
- **Do**:
  1. **Fixtures** `<plugin>/tools/fixtures/fidelity/`: `seed.json` (ids,
     reasons, next step target, pointers, open questions, gate result,
     decoys — per metrics §4 and the master plan AC-17), `handoff.md` and
     `ledger.state.md` rendered from the seed (the handoff in
     `session-handoff.md` headings with a `_Written:` stamp), `rubric.json`
     (required claims per decision/question for the semantic pass), and
     the red variants under `red/`: `dropped-decision/`, `decoy-live/`,
     `stale-stamp/`, `handoff-unnamed/` (a compact-resume run with the
     handoff deleted), `window-mismatch/` (settings `env` 200000 + a
     transcript at 170k tokens: the gate must be urgent), `docs-only/` (a
     transcript tail and a `.remember/now.md` carrying a newer, contradicting
     next step — extracted fields must still equal the docs, and the
     directive/round prompt must name neither as a source).
  2. **`<plugin>/tools/fidelity.mjs`** (~250 lines): `extract <handoff>
     <ledger> [--register <path>]` → JSON of every seeded field class;
     `compare <seed> <extracted>` → exit 0/1 with a per-field report;
     `restate-prompt <handoff> <ledger> [--register] [--docs <dir>]` → the
     naive-reader prompt (ONLY those files, headings as the answer schema,
     "do not use any memory, transcript or summary"); `score <seed>
     <restatement> [--judge <file>]` → exact fields exact, decoys absent,
     invented ids fail, semantic claims `unscored` unless a judge verdict
     file is given. Pure functions exported.
  3. **`tools/fidelity-test.mjs`** (~250 lines): temp git repo per case;
     path (a) drives `pre-compact.sh` then `compact-resume.sh` (`source:
     compact`) with the fixture ledger + handoff → snapshot exists;
     directive names the handoff and the ledger; freshness CURRENT; then
     `extract` + `compare` → green; path (b) `roundPrompt(unit)` names the
     ledger path, the handoff path and the sources rule; every `red/` case →
     `compare` exits 1 naming the field (`window-mismatch` asserts the gate
     band via `hl_band`; `docs-only` asserts no `transcript`/`.remember`
     token in the directive or the prompt and that `extract` ignores them);
     `score` on a hand-written good restatement → pass, on one with an
     invented id → fail. Print `fidelity harness: clean — N case(s)`.
  4. **`tools/lint.mjs`**: `checkFidelityHarness` after `checkRunnerHarness`.
  5. **`.github/workflows/fidelity-model.yml`**: `on: workflow_dispatch`
     only; same checkout/setup-node pins as `lint.yml`; installs the Claude
     CLI (`npm i -g @anthropic-ai/claude-code` — record the exact package
     name from `claude --version`'s package if different); `if: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN != '' }}`
     guard with an `echo "skipped: no secret"` step otherwise; job (a):
     `CLAUDE_CODE_AUTO_COMPACT_WINDOW=100000 claude -p --model haiku
     --output-format stream-json …` with the restate prompt after filler
     reads of the fixture docs until a `compact` event is seen, then the
     restatement; job (b): a fresh `claude -p` with the same prompt; both
     `score` with the judge = a second `claude -p --model haiku` call
     scoring the rubric; one rerun on a semantic flake; artifacts uploaded.
     No PR trigger. README mention deferred to S5.
  6. Commit `test(fidelity): structural fidelity harness in lint, naive-reader
     prompt + scorer, dispatch-only model job (S3)` + Attribution; push.
- **Verify**:
  - `node tools/fidelity-test.mjs` exits 0 — report the case count (≥ 12),
    that all six `red/` cases FAILED in the same run (metrics D4), and the
    `docs-only` case name.
  - `node tools/lint.mjs` → `lint: clean`.
  - `grep -n "on:" -A2 .github/workflows/fidelity-model.yml` shows
    `workflow_dispatch` and nothing else; `grep -c pull_request` → 0.
  - `node <plugin>/tools/fidelity.mjs restate-prompt <fixture handoff>
    <fixture ledger>` prints a prompt that contains `docs/product/` and
    `.plans/` and does not contain `transcript`, `summary` or `.remember`.
  - Catalog: none.
- **Read budget**: ≈ 1,050 lines — inside. Order if time runs short:
  fixtures + `extract`/`compare` + the structural harness green → the red
  cases → `restate-prompt`/`score` → the workflow file last.

**Checkpoint ckpt-s3** — one-shot `reviewer` on **Fable** inside S3: the red
cases are genuinely red (not skipped); `compare` cannot pass on an empty
extraction; no fixture content contains a secret shape; the model workflow
has no PR trigger and no secret echo; the naive-reader prompt names only
docs; the harness never touches this repo's own git dir. APPROVE → `[x]`,
`Next up: S4`.

## Phase P4 — `tools/gate.mjs` (branch: `feat/continuous-operation`)

### S4 — `gate.mjs` open/poll/status/expire, `runner.json` approvers, gate-guard hook + codex rule, `connect approver`, §12/§10 text, harness

- **ACs**: AC-19, AC-20, AC-21, AC-22, AC-23
- **Suits**: `security` (a decision tool whose whole point is who may answer;
  one refusing hook; an execpolicy rule). Runtime: `claude`.
- **Reads** (≈ 1,400 lines):
  1. Brief 163–183 (L1 channel-only + L2) + the OQ-1 answer in the ledger ≈
     50; master plan Task 5 + Value sourcing AC-19..AC-23 + Locked
     decisions + OQ-1/OQ-2 ≈ 230.
  2. Memos 338–366 (D5 core + the L2 reading), 368–372 (option A), 393–398
     (files), 642–662 (counsel 1) ≈ 70.
  3. Journeys 116–160 (J4 — drop the relay row and the local `gate answer`
     clause; 72 h not 24 h) ≈ 45.
  4. `<plugin>/templates/WORKFLOW.md` 1185–1252 (§12 — rules 1–5 + multi-
     project) + 1054 (Owner channel row) ≈ 70; `<plugin>/commands/connect.md`
     76–123 (Slack path + Record + Output — the transport facts and the
     round-trip idiom) ≈ 48; `<plugin>/templates/gate-classes.md` 20–60 ≈ 40.
  5. `node <plugin>/tools/runner.mjs --help` (≈ 50) + the `poll` hook
     points in `runner.mjs` (grep `gateTool`; ≈ 20); `<plugin>/tools/ask.mjs`
     59–106 (`pendingOf`, `ask`, `answer` — the jsonl event idiom to mirror
     for the outbox) ≈ 50; `<plugin>/tools/publish-gate.mjs` 1–40 (the
     gate-tool header + claim-token style) ≈ 40.
  6. `<plugin>/hooks/hooks.json` 83–93 (merge-guard wrapper — copy the
     fail-closed shape) + 49–60 ≈ 25; `<plugin>/hooks/lib/publish-guard.sh`
     1–40 (the refusing-hook body style) ≈ 40; `<plugin>/templates/codex.rules`
     1–60 + 150–245 (rule grammar, `# covers:`, `not_match`) ≈ 155;
     `<plugin>/tools/shell-wrappers.mjs` 1–30 ≈ 30; `tools/run-codex-test.mjs`
     the `covers` cross-check block (grep; ≈ 40).
  7. `tools/hook-test.mjs` 20–60 + 2532–2547 ≈ 56; `tools/lint.mjs` 519–536
     + 1400–1405 ≈ 25; `tools/agents-test.mjs` 1–40 ≈ 40.
  8. `<plugin>/templates/WORKFLOW.md` the §5 `unattended-ask` block (grep
     the fence; ≈ 12) + 858–880 (§6.2 pointer) ≈ 34; `<plugin>/templates/decision-log.md`
     whole (15) — the row the recorded decision appends.
- **Prior art** (permission gate — this brief adds ONE refusing hook and
  ONE execpolicy rule): `hooks/hooks.json:83–93` (merge-guard: wrapper
  passes only exit 0/2, missing script = BLOCK a merge-shaped command) —
  copy the wrapper for `gate-guard.sh`; `hooks/lib/publish-guard.sh` —
  rule ordering + "non-matching command is silent"; `templates/codex.rules:150–245`
  — `prefix` rule + `# covers:` + `not_match` lines, cross-checked by
  `tools/run-codex-test.mjs`; `tools/shell-wrappers.mjs` — the wrapper
  denylist (a `sh -c "node gate.mjs record"` must still be caught: match
  the command TEXT, not the first token).
- **Do**:
  1. **`<plugin>/tools/gate.mjs`** (~400 lines): `open`, `poll`, `status`,
     `expire` per AC-19; transports behind one interface `{send, fetchReplies,
     edit}` with `slack` (`chat.postMessage`, `conversations.replies`,
     `reactions.get`, `chat.update`) and `telegram` (`sendMessage`,
     `getUpdates` with a per-project offset file, `editMessageText`) reading
     tokens by env NAME from `runner.json.approver` (`token_env`,
     `chat_env`), base URL overridable by `GATE_TRANSPORT_URL` for the
     harness; `pending-gates.md` row written BEFORE the send; outbox
     `<state>/outbox.jsonl` flushed in order; verification = sender id ∈
     `owner_ids` or (`client_ids` AND class ∈ `client_may`); grammar
     `yes|no <reason>|hold`; owner-only human-fired classes per AC-20
     (`open` on them posts the link notice; `poll` records a `yes` as
     `acknowledged`, never as `approved`); receipts; reminders 24/48 h;
     expiry 72 h per OQ-1's answer; decision log row via the
     `templates/decision-log.md` grammar with message id + user id + UTC;
     **no `answer`/`record` subcommand exists** — `record()` is an internal
     function `poll` alone calls.
  2. **`runner.mjs`**: `next`/`wait` call `poll()`; a recorded answer →
     the owning unit first; an open blocking gate → `20`; the `round`
     ledger probe treats a new `pending-gates.md` row as `gate-pending`.
     `roundPrompt` swaps `HEADLESS_ASK_NOTE` for the gate note (the runner never
     reads `questions.jsonl` or an `ask.mjs answer` as a gate answer) ("to ask the
     owner a decision: `node ${CLAUDE_PLUGIN_ROOT}/tools/gate.mjs open
     --class decision …`, record the id in the ledger, END the round").
  3. **`hooks/lib/gate-guard.sh`** + the hooks.json group after `:93`
     (AC-21): BLOCK on `gate.mjs` + (`record`|`answer`|`approve`|`expire
     --force`), on `runner.mjs resume` from model Bash, and on
     `>`/`>>`/`tee`/`sed -i` targeting `pending-gates.md` or
     `decision-log.md`; silent otherwise; fail-closed wrapper. **`templates/codex.rules`**:
     the mirrored `prefix` rules with `# covers:` lines; `run-codex-test.mjs`
     cross-check green.
  4. **`tools/gate-test.mjs`** (AC-22; local `http.createServer` fixture as
     the transport; a clock injected): the matrix; outbox order + delayed
     prefix; row-before-send; receipts; reminders/expiry; owner copy on the
     client route; owner-only class `yes` → `acknowledged`; `SECRET` grep
     over `pending-gates.md`, outbox, decision log, stdout = 0 with
     `SLACK_BOT_TOKEN=xoxb-TEST-SECRET-0003` in env; print `gate harness:
     clean — N case(s)`. **hook-test** new block: `gate.mjs record` BLOCKED,
     `gate.mjs open` silent, `tee .plans/pending-gates.md` BLOCKED,
     `runner.mjs resume` BLOCKED, `sh -c 'node … gate.mjs record'` BLOCKED.
     `tools/lint.mjs` `checkGateHarness` after `checkFidelityHarness`.
  5. **Surfaces** (AC-23): `connect.md` new section after `:123`
     (`approver owner|client`: ids are not secrets; round-trip = one test
     gate answered; writes `runner.json.approver` + the §10 clause; ≤ 1,800
     B); `templates/WORKFLOW.md` §12 rule 1 + rule 4 clauses and the Owner
     channel row clause (≤ 900 B total); `gate-classes.md` action table +
     `staging-merge` row (≤ 200 B); the §5 `unattended-ask` block now names
     `gate.mjs open --class decision` (same byte count ± 50); a verified
     `staging-merge` yes authorises the merge but the command still passes
     the merge-guard hook (`hooks.json:83–93`, §10 Merge policy cell) — the
     reply never bypasses it;
     `commands/mission.md:46` sentence mentions the gate tool for the
     overrun decision under `-p`.
  6. Commit `feat(gate): tools/gate.mjs channel-only verified replies,
     gate-guard hook + codex rule, connect approver (S4)` + Attribution;
     push.
- **Verify**:
  - `node tools/gate-test.mjs` exits 0 — report the case count (≥ 30), the
    `SECRET` grep case and the "unlisted sender gets nothing" case.
  - `node tools/hook-test.mjs` green incl. the five gate-guard cases;
    `node tools/run-codex-test.mjs` green (the `covers` cross-check names
    the new rules); `node tools/runner-test.mjs` green.
  - `node tools/lint.mjs` → `lint: clean`; `wc -c <plugin>/templates/WORKFLOW.md`
    ≤ 119,600 (report); `connect.md` ≤ 18,100.
  - `grep -n "record\|answer" <plugin>/tools/gate.mjs | grep case` → no
    CLI `case 'answer'`/`case 'record'`.
  - `node <plugin>/tools/gate.mjs status` in this repo → `no open gates`
    (no network call without a route configured — assert it exits 0 fast).
  - Catalog: none.
- **Read budget**: ≈ 1,400 lines — inside. Order if time runs short:
  `gate.mjs` open/poll + harness (the self-approval surface) → gate-guard +
  codex rule + hook-test → runner wiring → surfaces last (a corrective may
  carry the prose, never the guard).

**Checkpoint ckpt-s4** — one-shot `reviewer` on **Fable** inside S4 (the
mission's sharpest boundary): enumerate every path by which a gate row can
move from pending to answered and show each requires a transport reply from
an allow-listed id; a `yes` on `merge`/`deploy`/`spend`/`publish`/`kill`/
`scope` must never produce an action; a secret must not reach any committed
or logged file; the guard must catch wrapper-shaped commands; `poll` must
be unreachable from a model turn; an `ask.mjs answer` or `questions.jsonl`
write must not move any gate; the codex rule must cover the same
shapes; byte budgets. APPROVE → `[x]`, `Next up: S5`.

## Phase P5 — security pass, live-run setup, release (branch: `feat/continuous-operation`)

### S5 — security pass + fixes, README/runbook/doctor, CHANGELOG 1.70.0 + version, OB rows, pre-merge Closing rows

- **ACs**: AC-24, AC-25, AC-26, AC-27
- **Suits**: `security` for the pass (one-shot `security` agent, Opus,
  findings fixed in-session by the same builder), then `backend` prose.
  Runtime: `claude`.
- **Reads** (≈ 900 lines):
  1. Brief 60–78 + 163–201 ≈ 58; master plan Task 6 + the full Value
     sourcing table + Locked decisions ≈ 260; metrics 23–35 (per-round
     fields) + 82–93 (OB rows) ≈ 25.
  2. `node <plugin>/tools/runner.mjs --help`, `gate.mjs --help`,
     `fidelity.mjs --help` (≈ 150) — the facts the docs state; never the
     bodies.
  3. `<plugin>/README.md` 300–320 (Loop-drivable section — the new section
     goes after `:317`) ≈ 20; `<plugin>/templates/engineering-runbook.md`
     whole (83); `<plugin>/commands/doctor.md` 130–142 + the S2 Compaction
     bullet ≈ 20.
  4. `CHANGELOG.md` 1–12; `<plugin>/.claude-plugin/plugin.json` (11);
     `<plugin>/package.json` (12); `.plans/OBLIGATIONS.md` 1–12, 28, 72–74
     ≈ 45; `.plans/continuous-operation.state.md` `## Closing` (read-only —
     the row texts to fire by evidence) ≈ 20.
  5. For the security pass only (the `security` agent reads, not the
     builder): `git diff --stat main..HEAD`, then the diff of `hooks/`,
     `tools/runner.mjs`, `tools/gate.mjs`, `tools/redact.mjs`,
     `commands/run.md`, `templates/codex.rules`, `.github/workflows/`.
- **Prior art**: none new — the pass audits S2's and S4's gates against
  `hooks/hooks.json`, `templates/codex.rules`, `tools/shell-wrappers.mjs`;
  any fix extends those files, never adds a parallel rule.
- **Do**:
  1. **Security pass (AC-24)**: spawn the one-shot `security` agent with
     the master plan's AC-24 threat list verbatim + the canary strings;
     it returns findings by severity with file:line. Fix every HIGH/MEDIUM
     in-session (re-run the touched harness); a LOW may be recorded as a
     `## Deviations` line with why. Bump `Reviewer runs:` is the
     orchestrator's job.
  2. **README `## Run 24/7`** after `:317` (≤ 2,200 B): three steps (log
     in with the client's subscription on the container; `/agentic-workflow:connect
     approver owner|client`; `/agentic-workflow:run`), what stops it (daily
     cap, overrun, crash loop, no-progress, kill) and the human-run shell line
     `node …/runner.mjs resume` (the session never runs it), where
     the round log lives (`git rev-parse --git-common-dir` +
     `/agentic-workflow/runner/rounds.log`), the docs-are-the-truth sentence,
     deferred items (systemd, relay, API keys) in one line, the dispatch-only
     fidelity model job in one line.
  3. **`templates/engineering-runbook.md`** `## Unattended run` block
     (≤ 1,200 B): the metrics §2 per-round fields as the record the 24 h run
     fills; "owner corrections about lost context — tagged by a human
     reader, must be 0".
  4. **`commands/doctor.md`** §1 **Runner** bullet after the Compaction
     window bullet (≤ 450 B): `runner.json` present + valid; a login present
     (`claude -p` dry call refused → 🔴 "not logged in"); state dir mode
     0700; last `round:` line; open gates via `gate.mjs status`.
  5. **Release (AC-26)**: `plugin.json` + `package.json` → `1.70.0`;
     CHANGELOG `## [1.70.0] — <date>` with the Added/Changed/Deferred lists
     from the master plan AC-26 and one line per P0 probe fact (cite the
     brief's probe record).
  6. `node tools/lint.mjs` clean; `wc -c` on `templates/WORKFLOW.md`
     (≤ 120,000), `commands/run.md`, `connect.md`, `doctor.md`, `handoff.md`
     (≤ 24,000 each) — report all five numbers.
  7. **Fire the pre-merge Closing rows** by evidence (the orchestrator
     ticks them): version bumped + stamped; docs/record synced; probe
     record committed first; no secret in any committed file.
  8. **AC-27 → OB rows** — report these three texts for the orchestrator
     to promote at close (the builder never edits `.plans/`):
     `- [ ] OB-35 · added <date> (promoted from `.plans/continuous-operation.state.md` `## Closing` row "24h live run", planner, 2026-10-27) — do: on one client LXC container logged in with that client's subscription, with `runner.json` configured and an approver route round-trip-verified, run `/agentic-workflow:run` for ≥ 24 h wall clock on one real mission; record per metrics §2: rounds, ≥ 2 compactions/restarts (counted from the round log), handoff writes and latency, gate events with request→answer latency, budget stops with approver notified y/n, tokens per round (`tokens=`), daily total vs the 5M cap, owner corrections about lost context tagged by a human reader (must be 0), and the fidelity `score` at each compaction/restart against the live handoff; the mission reaches its planned checkpoint or a budget stop — when: v1.70.0 is installed from `main` on a client container and a mission ledger is active there — probe: manual`
     `- [ ] OB-36 · added <date> (promoted from `.plans/continuous-operation.state.md` `## Closing` row "OB-1 fold-in", planner, 2026-10-27) — do: once the 24 h run's compaction records (≥ 2) join OB-32's (1) in the corpus, OB-1's condition (≥ 3 new true-compaction records) is met: re-measure the handoff-budget byte bands (bytes/token anchor, trigger threshold) against those records, record the numbers on OB-1 and fire it, and keep or retire the n=1 caveat in `hooks/lib/handoff-lib.sh` header accordingly — when: OB-35 is fired with ≥ 2 compaction records listed — probe: manual`
     `- [ ] OB-37 · added <date> (promoted from `.plans/continuous-operation.state.md` `## Closing` row "runner on a real client container", planner, 2026-10-27) — do: on a client container under that client's own claude.ai subscription (L3): confirm `runner.mjs next` starts with no account check, children carry no `ANTHROPIC_API_KEY`/`ANTHROPIC_AUTH_TOKEN` (`status --json` child env names), `tokens=` lines are attributable to that container, and a deliberate `claude /logout` makes the next round exit `75 auth-expired` with one approver alert and no work lost — when: v1.70.0 is installed on a client container — probe: manual`
  9. Commit `release(continuous-operation): 1.70.0 — security pass, run
     24/7 docs, doctor runner row` + Attribution; push; the orchestrator
     spawns `ckpt-s5`, then staging verify (lint + `--plugin-dir` load) and
     the PR to `main` marked ready; the human merges (L5).
- **Verify**:
  - The security agent's return is in the hand-off with every HIGH/MEDIUM
    marked fixed (file:line) and the harness that proves it.
  - `node tools/lint.mjs` → `lint: clean`; every harness count reported
    (hook, runner, fidelity, gate, headless, run-codex, lint-test).
  - `grep -rn "SECRET\|xoxb-TEST\|ghp_TEST" <plugin> tools .github
    --include=* | grep -v -- "-test.mjs\|fixtures/"` → 0 hits.
  - `grep -n '"version"' <plugin>/.claude-plugin/plugin.json <plugin>/package.json`
    both `1.70.0` and matching the CHANGELOG heading.
  - `claude --plugin-dir <plugin>` loads; `/agentic-workflow:doctor` shows
    the Compaction window and Runner bullets (or report skipped, never
    green when not run).
  - Catalog: none.
- **Read budget**: ≈ 900 lines — inside. Order if time runs short: the
  security pass + fixes first (it gates the PR), then release files, then
  README/runbook/doctor prose.

**Checkpoint ckpt-s5** — one-shot `reviewer` on **Fable** inside S5 over
`main..HEAD` against AC-1..AC-27 (the mission's final gate): re-runs
`node tools/lint.mjs`; confirms every security finding's fix with its
harness case; re-walks the ckpt-s4 answer-path enumeration on the final
tree; checks the CHANGELOG names every new file and every probe fact;
byte budgets; a plain-report read of every owner-facing string
(`run.md` lines, the gate message, the doctor bullets, the README section).
APPROVE → staging verify → PR to `main` marked ready; the human merges.

---
_Each session's outcome and any deviation lands in
`.plans/continuous-operation.state.md`, never only in chat._
