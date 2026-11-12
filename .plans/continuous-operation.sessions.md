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

_**Replanned 2026-11-12** at `feat/continuous-op` 1a6bafb (master plan
`## Replan 2026-11-12`). S0 is history and its brief is left as written.
The pending briefs S1, S1b, S2, S3, S4, S4b, S5 were re-resolved: no plugin
file changed on the branch, so every `<plugin>/` anchor still holds.
**Run order: `ckpt-s0` → S1 → S1b → S2 → S3 → S4 → S4b → S5.**
**`tools/hook-test.mjs` anchors**: the orchestrator merges `main` into the
branch before S1 (a merge commit — the branch is signed and never rebased);
`main` adds 10 lines at `:20–29`, so the file is 2,589 lines and the
anchors are: `function runHook` `:67` · `// ── AC-3 handoff gate ──`
`:2246` · `// ── AC-4 token bands ──` `:2383` · `// ── child silence for
the two new hooks` `:2542–2556` · `// ── Child silencer (tune-presets D4)`
`:2557`. The pending briefs below use these numbers; grep the header string
if a number is off. **Ledger beats**: `ledger.mjs … mark` matches a row
by prefix, so use `"S1 —"` and `"S4 —"` (a bare `S1` now also matches
`S1b` and the verb refuses)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/continuous-operation.md` · Ledger: `.plans/continuous-operation.state.md`
Source brief: `docs/product/decisions/2026-10-27-continuous-operation-brief.md` (255 lines since S0 — **Source of truth + Docs vs code `:60–78`, L1 `:163`, L2 `:181`, L3 `:184`, L4 `:196`, L5 `:199–201`, L6 `:202–208`** in every session; **P0 probe record `:210–225`** (rows (a) `:219`, (b) `:220`, (c) `:221`, (d) `:222`, (e) `:223`, (f) `:224`, OB-32 `:225`); **L7 `:227–255`**).
Gate delegation: `docs/product/decisions/2026-11-12-gate-delegation.md` (93 lines — **Part 1 `:67–84`** in S4 and S4b; Part 2 `:86–93` is NOT planned and never built).
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

Branch: **`feat/continuous-op`** (renamed 2026-10-29 from
`feat/continuous-operation`; worktree `.worktrees/continuous-op`).
Eight briefs in sequence on one branch (S0 done; S1, S1b, S2, S3, S4, S4b,
S5 pending); a one-shot **Fable** checkpoint inside
each session (boundary-class: `hooks/` + `tools/` + `templates/` +
`hooks.json` + `codex.rules` are `security-boundary`,
`templates/gate-classes.md:32`); one PR to `main` after S5; the human merges.
Not parallel (each phase builds on the previous tool's `--help`).

## Large-files table

| File | Lines | Notes |
|---|---|---|
| `tools/hook-test.mjs` | 2,589 after the `main` merge (2,579 before) | read 30–70, 2246–2270, 2383–2406, 2542–2557 only; new blocks go after the child-silence block (`:2542–2556`), before `:2557` — never inside a `withDir` — with a `// ──` header |
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
| `tools/run-claude-test.mjs` | 376 | read 170–195 only (S1b — the `buildArgv` flag cases) |
| `<plugin>/README.md` | 363 | read 300–320 only (S5) |
| `<plugin>/commands/mission.md` | 350 | read 20–50, 120–130, 170–180, 296–310 |
| `<plugin>/hooks/lib/handoff-lib.sh` | 334 | read 1–50, 70–79, 100–117, 180–234 |
| `tools/ledger-test.mjs` | 335 (345 after the `main` merge) | grep `reviewer-runs` ±6 only (S1b — the counter-verb cases) |
| `<plugin>/commands/tune.md` | 289 | read 42–78 + 114–125 (S1b) |
| `tools/lint-test.mjs` | 310 | read 148–190 only (S2 — the RULE cases) |
| `tools/browse-test.mjs` | 301 | not read |
| `<plugin>/templates/codex.rules` | 294 | read 1–60, 150–245 (S4) |
| `<plugin>/tools/headless.mjs` | 290 | whole (S1) |
| `<plugin>/tools/ledger.mjs` | 277 | read 1–30 only |
| `tools/marker-test.mjs` | 274 | not read |
| `<plugin>/commands/connect.md` | 261 | read 76–123 only (S4) |
| `<plugin>/commands/operate.md` | 255 | read 1–30 only (S1 — the unit prompt) |
| `<plugin>/hooks/lib/compact-resume.sh` | 254 | read 1–70, 240–254 |
| `tools/agents-test.mjs` | 252 | read 84–104 (the zero-dep `validate`) in S1 and S4b; 1–60 + 106–130 + 225–243 in S1b |
| `<plugin>/tools/agents.mjs` | 230 | whole (S1b) |
| `<plugin>/commands/settle.md` | 242 | not read |
| `<plugin>/tools/ask.mjs` | 228 | read 1–30, 59–106, 196–228 |
| `<plugin>/commands/autopilot.md` | 224 | read 25–45, 60–75 |
| `<plugin>/commands/bootstrap.md` | 224 | read 110–125 only (S2) |
| `<plugin>/agents/reviewer.md` | 220 | not read (the checkpoint spawn reads it) |
| `<plugin>/hooks/hooks.json` | 215 | read 49–60, 83–93, 116–126 |
| `docs/product/decisions/2026-10-27-continuous-operation-journeys.md` | 212 | ranged reads only |
| `<plugin>/commands/sync.md` | 193 | read 99–115 only (S2) |
| `docs/product/decisions/2026-10-27-continuous-operation-brief.md` | 255 | whole in S0; 60–78 + 163–255 after |
| `<plugin>/commands/doctor.md` | 162 | read 1–15, 42–54, 130–142 |
| `<plugin>/templates/mission-state.md` | 148 | read 1–60 (S1b, S3) |
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
| `docs/product/decisions/2026-11-12-gate-delegation.md` | 93 | read 67–84 (S4, S4b) |
| `<plugin>/templates/agents-registry.schema.json` | 62 | whole (S1, S1b, S4b — the strict-schema precedent) |
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

## Phase P1 — the runner (branch: `feat/continuous-op`)

### S1 — `tools/runner.mjs` (incl. `begin` / `classify` / `record`), `redact.mjs`, `runner.json`, contract schema, harness

- **ACs**: AC-4, AC-5, AC-6, AC-7, AC-8, AC-9 (all but its `headless.mjs`
  clause — S1b), AC-29, AC-30, AC-31
- **Starts only when**: `ckpt-s0` is APPROVE (or waived by the owner,
  OQ-11), OQ-6, OQ-7 and OQ-12 are answered, and `main` is merged into the
  branch (until then `node tools/lint.mjs` is red on this branch: the
  hook and ledger harnesses fail on the operator's global commit signing,
  which `main` fixed in c244ec9). S1b needs OQ-10; S4 needs OQ-8 and OQ-9.
  The advisor is NOT in this brief (S1b).
- **Suits**: `backend` (one zero-dep Node CLI + a redaction module + a
  harness + one JSON schema). Runtime: `claude`.
- **Reads** (≈ 1,415 lines):
  1. Brief 60–78 (source of truth + docs vs code — goes into the round
     prompt verbatim) + 163–208 (L1–L6) + 217–225 (probe rows; (e) `:223`
     and (f) `:224` matter here) + 227–255 (L7) ≈ 105; master plan Task 2 +
     Task 7 (AC-29, AC-30, AC-31) + Value sourcing rows AC-4..AC-9 and
     AC-29..AC-31 + Locked decisions ≈ 290.
  2. Memos 82–118 (D1-A), 137–167 (unit selection, exit table, per-round
     caps, gap 10), 216–240 (locks, stops, crash loop, logs + redaction),
     433–446 (auth facts — read for the auth-expired path only; the
     account/API-key sentences are superseded by L3), 642–669 (counsel) ≈ 150.
  3. Journeys 19–40 (voice rules + the round line), 42–74 (J1 table — drop
     the systemd and API-key words), 194–196 (digest line) ≈ 60.
  4. `<plugin>/tools/headless.mjs` 1–49 (header style), 82–120
     (`claudeArgs`, `turn`, `ledgerState`), 155–182 (`run` — the loop the
     core must be able to replace in S1b; do NOT edit it here) ≈ 115;
     `tools/headless-test.mjs` whole (83) — the fake-claude harness shape.
  5. `<plugin>/tools/run-claude.mjs` 1–50 (header + `DEFAULTS`), 236–270
     (argv, `childEnv`, `FORBIDDEN`), 286–324 (`parseStream` — usage fields),
     395–440 (the not-logged-in texts `:398` + result subtypes) ≈ 145.
  6. `<plugin>/hooks/lib/mission-budget.sh` 1–50 + 70–118 (the arithmetic
     and the texts to mirror) ≈ 100; `<plugin>/hooks/lib/active-ledger.sh`
     whole (83) — port the predicate; `<plugin>/hooks/lib/handoff-lib.sh`
     100–117 (`hl_paths` state-dir idiom) + 225–234 (`hl_redact`) ≈ 30.
  7. `tools/hook-test.mjs` 30–70 (`runHook` `:67` — the parity fixture
     drives the hook through it) ≈ 40; `tools/lint.mjs` 519–536 + 1400–1405
     ≈ 25; `<plugin>/templates/agents-registry.schema.json` whole (62) +
     `tools/agents-test.mjs` 84–104 (the zero-dep `validate` to copy for
     the contract schema) ≈ 83.
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
     `--max-budget-usd <n>` when `runner.json` `budgets.round_usd` is set
     (spelling confirmed, brief `:224`; no default amount is invented — the
     key is absent from the template's defaults); never `--restricted`,
     never `--tools`;
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
  4. **The split path (AC-29).** Build `roundOnce` as the composition of
     three exported functions and expose each as a verb: `begin(cwd, cfg,
     {holder, lease})` → lock + round number + `rounds/<n>.begin.json`
     (the ledger's `Next up:` / `Sessions used:` and the open-gate count at
     start) → `{contract_version: 1, round, unit, prompt, env,
     events_path}`; `classify({round, eventsPath, exitCode})` → pure, no
     lock, no spawn: reads the LAST `result` event (`terminal_reason`, never
     `subtype`, brief `:223`), the usage sum, the begin snapshot, the docs
     mtimes, the auth texts → `{contract_version, round, code, outcome,
     reason, tokens, session_id}`; `record({round, classified})` → the
     `round:` line through `redact`, `daily.json`, `backoff.json`, unlock.
     `round` = `begin` → spawn → `classify` → `record`. A `--holder` lock
     requires `--lease <s>` and is stale when the lease has passed; a pid
     lock keeps the dead-pid rule. Write
     `<plugin>/templates/runner-contract.schema.json` (strict: every object
     `additionalProperties: false` with a full `required`, the
     `agents-registry.schema.json` idiom) covering `next --json`, `begin
     --json`, `classify --json`, `record --json`, `status --json`. The tool
     header names no wrapper ("a supervisor that runs the turn itself").
     **Auth mode (AC-30):** `cfg.auth` `login` (default) | `external`;
     `next --auth external` for one call; `external` skips only the
     login-present preflight; `round` with `external` → usage error, exit 1.
     **Credentials preflight (AC-31):** in `next`, after the lock and stop
     checks: `git config --get commit.gpgsign` = `true` and `git config
     --get user.signingkey` non-empty; `git identity token` exits 0 when
     `git-identity` is on PATH, else `GH_TOKEN` non-empty; otherwise `stop:
     75 creds-missing <what, by name>`. Never print a value; pass the line
     through `redact`. Add one sentence to `roundPrompt`: `gh` runs as
     `GH_TOKEN="$(git identity token)" gh …` when that tool exists, else
     with the `GH_TOKEN` already in the environment.
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
     and never `transcript`/`.remember`; **split path**: every `--json`
     output validates against `runner-contract.schema.json`; `round` and
     `begin` → fake turn → `classify` → `record` write the same `round:`
     line for the same fixture; `classify` takes no lock and spawns nothing
     (the fake `claude` records zero invocations); a `--holder` lock blocks
     a second `begin` until its lease passes; `round` under `auth:
     external` exits 1; `next --auth external` passes with no login;
     `classify` → `75` on a fake `invalid api key` result; **credentials**:
     no signing key → `stop: 75 creds-missing` naming `user.signingkey`; no
     token → naming `GH_TOKEN`; a fake `GH_TOKEN` value never appears in any
     output. Print `runner harness: clean — N case(s)`; exit 1 on failure.
     The harness sets `GIT_CONFIG_COUNT` / `GIT_CONFIG_KEY_n` overrides for
     its throwaway repos exactly as `tools/hook-test.mjs:20–29` does (the
     operator's global signing must not leak in), and sets its own
     per-case signing values for the AC-31 cases.
  6. **`tools/lint.mjs`**: `checkRunnerHarness` (copy of `:519–536`, runner
     `tools/runner-test.mjs`, message "runner harness") wired after
     `checkHeadlessHarness` at `:1402`.
  7. Commit `feat(runner): tools/runner.mjs next/begin/classify/record/round/wait/stop/pause/resume/status, redact.mjs, runner-config, runner contract schema (S1)`
     with the §10 Attribution line; push. Do not touch `.plans/`,
     `hooks/`, `commands/`, `templates/WORKFLOW.md` (S2 owns them) or
     `tools/headless.mjs`, `tools/run-claude.mjs`, `tools/agents.mjs` (S1b).
- **Verify**:
  - `node tools/runner-test.mjs` exits 0 — report the case count (≥ 42) and
    name the parity case, the five-canary case, the `22 no-record` case,
    the sources-rule prompt case, the round-equals-split-path case, the
    schema-validation case and the two `creds-missing` cases.
  - `node tools/headless-test.mjs` exits 0 (the file is untouched here).
  - `grep -ci "missions\|openmaus" <plugin>/tools/runner.mjs
    <plugin>/templates/runner-contract.schema.json` → 0.
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
- **Read budget**: ≈ 1,415 lines (brief/plan 395 · memos 150 · journeys 60 ·
  headless + test 198 · run-claude 145 · hooks 213 · harness + schema refs
  148 · ask/ledger/presets/operate 127) — inside the 1,500 budget, with
  little slack: read nothing that is not listed. Order if time runs short:
  `redact.mjs` + `begin`/`classify`/`record`/`round` + `next` + harness
  green → the contract schema + its validation case → credentials
  preflight → `wait`/`status`/backoff last (a corrective may carry `wait`,
  never the split path or a red harness).

**Checkpoint ckpt-s1** — one-shot `reviewer` on **Fable** inside S1 over
`main..HEAD` against AC-4..AC-9 with this red-team list: a child env carrying
`AGENTIC_WORKFLOW_CHILD`, `ANTHROPIC_API_KEY` or missing `UNATTENDED`; any
`FORBIDDEN` argv; a `round:` line, alert or `status` output that can carry
an env value (the canaries); a lock that two `round`s can both take; a daily
total that a round without a usage line can evade; a budget verdict that
disagrees with `mission-budget.sh` on any parity fixture; a `0` exit with no
ledger/handoff write; a round prompt that names a transcript, summary or
memory folder as a source; an events log read anywhere but the harness;
`--max-budget-usd` used without the probe row; `classify` taking a lock,
spawning anything or reading `subtype`; a `--holder` lock with no expiry;
`auth: external` reaching a spawn; a credential VALUE in any output; a
`--json` shape that is not in the schema; any wrapper's name in the tool.
Also re-reads the P0 probe record once if `ckpt-s0` was waived (OQ-11).
APPROVE → `[x]`, `Next up: S1b`.

## Phase P1b — the launch layer (branch: `feat/continuous-op`)

### S1b — advisor probe → launch, cap, fallback; `advisor:` tune field + registry schema; doctor row; `Correctives:`; `headless.mjs run` on the core

- **ACs**: AC-32, AC-33, AC-34, AC-35, AC-9 (its `headless.mjs` clause)
- **Suits**: `backend` (three small Node tools + their harnesses, one
  command section, four one-sentence role edits). Runtime: `claude`.
- **Reads** (≈ 1,270 lines):
  1. Master plan Task 8 (AC-32..AC-35) + Value sourcing rows AC-32..AC-35 +
     the three advisor lines in Locked decisions (one `Assumed`) + OQ-10's
     answer in the ledger ≈ 110; brief 217–225 (the probe-record table —
     copy its column shape) ≈ 10.
  2. `node <plugin>/tools/runner.mjs --help` (≈ 70) + in `runner.mjs` the
     `begin` argv/env builder and `roundLine` only (grep `function begin`,
     `function roundLine`; ≈ 90) — never the rest of the body.
  3. `<plugin>/tools/run-claude.mjs` 1–50, 160–195 (`resolveRun` — where
     `effort` is resolved; `advisor` resolves beside it), 236–270
     (`buildArgv`, `childEnv`, `FORBIDDEN`), 365–410 (launch + the
     not-logged-in branch — the fallback retry sits here) ≈ 165;
     `tools/run-claude-test.mjs` 170–195 (the flag cases) ≈ 26.
  4. `<plugin>/tools/agents.mjs` 1–30 (header + USAGE), 55–70 (`fmValue`),
     101–210 (`overrideKind`, `registry`, both `effective` sites) ≈ 155;
     `<plugin>/templates/agents-registry.schema.json` whole (62);
     `tools/agents-test.mjs` 1–60, 106–130, 225–243 ≈ 105.
  5. `<plugin>/commands/tune.md` 42–78 (how a tune writes the shadow, the
     banner) + 114–125 (the effort section — the new section follows it)
     ≈ 50.
  6. `<plugin>/tools/headless.mjs` 1–49, 82–120, 155–182 ≈ 115;
     `tools/headless-test.mjs` whole (83).
  7. `<plugin>/agents/backend.md` 46–70; `frontend.md` 89–113;
     `security.md` 40–53; `devops.md` 40–50 ≈ 75.
  8. `<plugin>/commands/doctor.md` 42–54 (Runtimes — the new bullet
     follows) ≈ 13; `<plugin>/commands/mission.md` 30–40, 168–180, 270–278
     ≈ 33; `<plugin>/tools/ledger.mjs` 1–50 + 165–185 (the `reviewer-runs`
     verb to mirror) ≈ 70; `tools/ledger-test.mjs` the `reviewer-runs`
     cases (grep; ≈ 14); `<plugin>/templates/mission-state.md` 12–30 ≈ 19;
     `tools/lint.mjs` 1145–1176 (the `RULES` name patterns — the new
     sentences must not match one) ≈ 32.
- **Prior art**: `run-claude.mjs:260–269` (`childEnv`, `FORBIDDEN`) — the
  advisor option is added to `buildArgv`, never to a wrapper script; no
  permission gate, allowlist, execpolicy rule or refusing hook is touched
  (`tools/shell-wrappers.mjs`, `templates/codex.rules`, `hooks/hooks.json`
  untouched).
- **Do**:
  1. **Probe first (AC-32) — before any code.** In a scratch repo under
     the scratchpad dir, with the real CLI: find how a `claude -p` launch
     is given an advisor model (`claude --help`, the CLI's settings
     reference; the planner found no such flag in `--help` on 2.1.322) and
     run it until ONE consult completes; then a pairing the CLI rejects;
     then, only if it can be done without changing the owner's account
     settings, a launch without the Fable consent (else `could not verify:
     <why>`); then an Agent-tool subagent asked to consult; then read the
     LAST `result` event's `usage` and `modelUsage` for advisor tokens.
     Append `## Advisor probe record (<date>)` to the brief after L7
     (`:255`): columns `probe · invocation (verbatim) · observed · decides`,
     with `claude --version`. Commit it alone:
     `docs(continuous-operation): advisor probe record`.
     **If no launch can be given an advisor under `-p`: stop the advisor
     work here** — skip steps 2–4 and the doctor bullet and the role
     sentences of step 5, say so in the hand-off with the row cited, and
     do steps 5 (`Correctives:` only) and 6.
  2. **`run-claude.mjs` (AC-33)**: `resolveRun` resolves `advisor` (CLI
     `--advisor <model>|off` > role frontmatter `advisor:` > off);
     `buildArgv` adds the launch option exactly as the probe row spells it,
     always together with an explicit `--model <main>` (owner 2026-11-12:
     the advisor pairing is checked against the main model, so the main
     model is never left to a default when `--advisor` is passed),
     only when resolved and only when NOT (`resume` AND the resumed
     thread's last reported input side > `maxAdvisorContext`); on the
     rejection text of probe row (ii) relaunch ONCE without it; the
     distillate `runtime` gains `advisor: <model>|null` and `advisor_off:
     <reason>|null`. `run-claude-test.mjs`: option present / absent /
     dropped on a big resume / one retry on the rejection text / never two.
  3. **`runner.mjs` (AC-33)**: `runner.json` `advisor: { "model": null,
     "max_context_tokens": <OQ-10 answer> }` in the template; `begin`
     includes the option in the returned launch description when set;
     `round` applies the same retry-once rule; `roundLine` gains the
     trailing `adv=<model>|off|off(<reason>)` field after `v=`;
     `runner-contract.schema.json` gains the field (still
     `contract_version: 1` — nothing is released yet). Runner harness:
     three cases.
  4. **`agents.mjs` + schema + `tune.md` (AC-34)**: `effective.advisor`
     (`fmValue(src, 'advisor')` or null; `off` → null) at both sites
     (`:140–143`, `:194–197`); `overrideKind` (`:108–118`) adds `advisor`;
     the schema's `effective` gains `advisor` (`["string","null"]`, in
     `required`) and the `kind` description names it; USAGE text `:25`
     updated. `tune.md`: new section after `:125`,
     `## /agentic-workflow:tune <agent> advisor <model>|off` — banner kind
     `advisor`; refuse when the role's runtime is codex, and for any
     pairing probe row (ii) showed the CLI rejects (quote the row; invent
     no other pairing rule); say it applies where the role runs as its
     own `claude -p`, and to subagents only if probe row (iii) said yes.
     `agents-test.mjs`: unset → null; shadow `advisor: fable` → value +
     `kind` includes `advisor`; output validates. Keep `tune.md` ≤ 24,000 B.
  5. **Consult, doctor, measure (AC-35)**: the one sentence in the four
     role files (identical wording; check it against `lint.mjs:1145–1176`
     so it is not read as a rule restatement); `doctor.md` **Advisor**
     bullet after `:54` (≤ 400 B); `mission-state.md` `Correctives: 0`
     under `Reviewer runs:` (`:18`) with one clause in the note `:28`;
     `ledger.mjs` verb `correctives +1|=N` (add to `VERBS` `:46`, mirror
     `:172`) + `ledger-test.mjs` cases mirroring `:169–176`;
     `mission.md` — where a corrective starts (`:172–176`, `:275`) add the
     bump command in a clause, never a restatement of the retry rule.
  6. **`headless.mjs run` (AC-9)** (`:155–182`): replace the loop body with
     `roundOnce` from `./runner.mjs` (keep the `answerPending` page, the
     tick count and the `ccp` messages); `turn`/`claudeArgs` stay for
     `chat`. `headless-test.mjs` must stay green unchanged. If it cannot be
     made green, leave `headless.mjs` untouched and report it.
  7. `node tools/lint.mjs`; commit `feat(advisor): advisor launch option
     with a per-launch cap and fallback, advisor tune field in the agent
     registry, Correctives counter; headless run on the runner core (S1b)`
     + Attribution; push. Never edit `.plans/`.
- **Verify**:
  - The probe record is committed BEFORE any advisor code (`git log
    --oneline` order) and every row has a verbatim invocation; the option
    spelling in `buildArgv` is character-identical to row (i).
  - `node tools/run-claude-test.mjs`, `tools/agents-test.mjs`,
    `tools/runner-test.mjs`, `tools/ledger-test.mjs`,
    `tools/headless-test.mjs` all exit 0 — report each count and name the
    retry-once case and the schema case.
  - `node <plugin>/tools/agents.mjs --json | grep -c '"advisor"'` ≥ 20 (one
    per role) and every value is `null` in this repo.
  - `node tools/lint.mjs` → `lint: clean` (no rule-dedup finding from the
    four role sentences or the `mission.md` clause).
  - Catalog: none.
- **Read budget**: ≈ 1,270 lines (plan/brief 120 · runner 160 · run-claude 191
  · agents + schema + test 322 · tune 50 · headless + test 198 · roles 75 ·
  doctor/mission/ledger/template/lint 181) — inside. Order if time runs short: probe
  record → `run-claude.mjs` + `agents.mjs` + schema + their harnesses (the
  contract) → `Correctives:` → `tune.md` + doctor + role sentences →
  `runner.mjs` field → the `headless.mjs` refactor last.

**Checkpoint ckpt-s1b** — one-shot `reviewer` on **Fable** inside S1b
(`tools/` + `templates/` are boundary-class): every advisor fact in the code
traces to a probe row, not to a guess; the fallback retries once and never
loops; a resumed launch above the cap carries no advisor; the registry
output validates and `effective.advisor` is null everywhere by default; no
preset sets it; the role sentence is one sentence; the runner still writes
nothing to a ledger but the `handoff-failed` line; `headless-test.mjs` is
byte-unchanged. If the probe struck the advisor: confirm nothing of it
shipped. APPROVE → `[x]`, `Next up: S2`.

## Phase P2 — `/run`, mode-aware handoff, effective window, settings env, HITL-ask audit (branch: `feat/continuous-op`)

### S2 — `commands/run.md`, `handoff-gate.sh` unattended, `hl_threshold` (window − reserve, effective window), bootstrap/sync env, §6.2 rule + 15 pointers

- **ACs**: AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16 (struck by
  probe (b) — the hand-off cites brief `:220`; nothing is built), AC-28
- **Settled by the probe record (do not re-decide)**: background wake
  ships (`:221`); the marker + exit 2 branch ships, never the JSON stop
  (`:223`); settings `env` reaches hooks (`:219`); no plugin-read hook
  (`:220`); the threshold is window − 33,000 (`:225`).
- **Suits**: `backend` (bash hooks + hook-test, four command files, one
  template rule; the probe record decides two texts). Runtime: `claude`.
- **Reads** (≈ 1,440 lines — recounted item by item 2026-11-12):
  1. Brief 60–78 + 163–208 + the P0 probe record 217–225 ≈ 75; master plan
     Task 3 (with the three 2026-11-12 amendments) + AC-28 in Task 7 +
     Value sourcing AC-10..AC-16, AC-28 + Locked decisions (the D3-B,
     ask-audit and probe-record lines) ≈ 260.
  2. Memos 244–292 (D3), 454–521 (D7-B incl. "Gap found" and "How it is
     set" — its band numbers are superseded by AC-28) ≈ 118.
  3. Journeys 76–95 (J2 table), 97–114 (J3 table) ≈ 40.
  4. `node <plugin>/tools/runner.mjs --help` (the header, ≈ 70 lines) — the
     exit codes `run.md` reacts to; in the body only `classify` and
     `record` (grep `function classify`, `function record`; ≈ 60) — the two
     functions step 3 edits.
  5. `<plugin>/hooks/lib/handoff-gate.sh` whole (131);
     `<plugin>/hooks/lib/handoff-lib.sh` 1–50 (contract header), 70–79,
     180–209 ≈ 90; `<plugin>/hooks/lib/compact-resume.sh` 1–30 + 240–254
     ≈ 45 (`pre-compact.sh` is not read and not edited);
     `<plugin>/hooks/lib/handoff-budget.sh` 12–18 (the comment that states
     the old rule) ≈ 7; `<plugin>/hooks/hooks.json` 40–46 (the
     handoff-budget description, "1000000 × 95%") + 116–126 (gate
     description) ≈ 18.
  6. `tools/hook-test.mjs` 30–70 (`runHook` `:67`), 2246–2270 (AC-3 block
     head — fixture shape for an urgent transcript), 2383–2406 (band cases
     — re-pinned by AC-28), 2542–2557 (the child-silence block — the new
     block goes after it, before `:2557`, never inside a `withDir`) ≈ 80;
     2095–2100 (`THR = 950_000` and the two derived constants) + 2156–2160
     (the `HL_DEFAULT_PCT` assertion) ≈ 11.
  7. `<plugin>/commands/handoff.md` whole (81); `<plugin>/commands/mission.md`
     43–49, 125–131, 175–181, 296–310 ≈ 36; `<plugin>/commands/autopilot.md`
     25–45, 60–75 ≈ 36; `plan.md` 18–24 + 55–59; `next.md` 78–84;
     `publish.md` 20–26, 54–58, 73–77; `brainstorm.md` 16–20 + 42–46;
     `groom.md` 66–70 + 103–107 ≈ 50 (the pointer sentences land here).
  8. `<plugin>/commands/bootstrap.md` 110–125; `<plugin>/commands/sync.md`
     99–115; `<plugin>/commands/doctor.md` 1–15 + 130–142 ≈ 55.
  9. `<plugin>/templates/WORKFLOW.md` 278–282 (`:280` states the old
     threshold rule), 470–487 (the last §5 rule fence, `ceremony-skip` —
     the new block sits after it), 595–612 (Loop mode), 874–882 (§6.2 —
     where the pointer lands), 1044–1054 (§10 rows Tune preset → Owner
     channel) ≈ 61;
     `tools/lint.mjs` 1049–1072 (byte budgets) + 1211–1230 (`checkRuleDedup`
     + `RULES` shape; `:1226–1228` = fence-outside-§5 failure) ≈ 45; `tools/lint-test.mjs` 148–190 (RULE cases) ≈ 43.
- **Prior art**: `hooks/hooks.json:116–126` + `handoff-gate.sh:112–131` —
  the ONE refusing hook this brief edits (extend its unattended branch; do
  not add a second gate, and no allow hook — AC-16 is struck);
  `commands/bootstrap.md:114–119` — adopt-never-overwrite
  for `.claude/settings.json`; `lint.mjs:1211` — `RULES` registry for the
  new `unattended-ask` fence. `tools/shell-wrappers.mjs` and
  `templates/codex.rules` untouched.
- **Do**:
  1. **`handoff-lib.sh`**: add `hl_unattended()` after `hl_num` (`:81`);
     constants `:70–71`: `HL_DEFAULT_PCT=95` → `HL_DEFAULT_RESERVE=33000`
     (comment cites the 2026-11-09 observation, brief `:225`);
     `hl_threshold` (`:180–186`) = effective window − reserve, where the
     window follows the AC-13 precedence (env → settings `env` key →
     `autoCompactWindow` → `HL_DEFAULT_WINDOW`; `jq -r` on
     `.claude/settings.json` relative to cwd; any non-numeric, or a value
     ≤ the reserve → next source); a valid `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`
     still gives `window × pct / 100` (`:181–183`, unchanged); the 70 / 85
     band constants and `hl_band` (`:191–209`) are untouched; header
     comment `:28–31` updated. The other places that state the old rule
     move in the same commit: `handoff-budget.sh:15–16`, `hooks.json:43`,
     `templates/WORKFLOW.md:280` (same byte count ± 10). Grep
     `HL_DEFAULT_PCT` and `× 95` across `<plugin>/` and `tools/` → 0
     afterwards.
  2. **`handoff-gate.sh:112–131`** per AC-11 (as amended): the unattended
     last line; on `BLOCKS -ge HL_FAIL_OPEN` → managed: today's `⚠️ …
     failed open` line byte-identical; unattended: the J3 5-block line to
     stderr, then `hl_mput "$HL_DIR/state/$SID.gate-stop" …` and exit 2 on
     this and every later call (the tool stays denied; the comment cites
     brief `:223` — `continue:false` neither blocked the tool nor left a
     readable subtype, so no JSON stop is written anywhere). The marker is
     NOT written (block counted, exit 2) when `TOOL` is `Agent`/`Task` or
     the input carries a subagent marker (`agent_id`; probe (e) showed a
     stop inside a subagent ends only the subagent). `hooks.json:122`
     description: the unattended sentences. `compact-resume.sh:250`:
     `hl_unattended && … "end the round; the runner records it"` else the
     existing text.
  3. **`runner.mjs`** (small edit, S1's tool): `round` polls for
     `<handoff state>/<session id>.gate-stop` while the child runs and
     ends the child when it appears; `classify` maps that marker — or a
     LAST `result` event with `terminal_reason: "hook_stopped"` — to `21`
     (never `subtype`); `record` appends the `handoff-failed:` deviation
     line to the active ledger's `## Deviations` when the code is `21` (the
     ONLY ledger write; refuse if the section is missing) and applies the
     ladder 1/2/3 → warn/`30`. So a supervisor on the split path gets the
     same `21` and the same line. Runner harness: three cases (marker via
     `round`, marker via `classify`, `hook_stopped` via `classify`).
  4. **`tools/hook-test.mjs`** — new block after the child-silence block
     (`:2532–2546`), before `:2547`,
     `// ── continuous-operation S2: unattended gate, effective window ──`:
     unattended urgent block → last stderr line is the `unattended=1 — …`
     line; unattended 6th block → the marker file exists, exit 2, stdout
     empty, and `⚠️ … failed open` appears nowhere; a 7th call → still
     exit 2; managed 6th block → byte-identical to today's line;
     unattended + `tool_name: Agent` 6th block → exit 2, no marker;
     `AGENTIC_WORKFLOW_CHILD=1` → silent; compact-resume branch 3
     unattended wording; `hl_threshold`: settings `env` 200000 and no env
     var → threshold 167,000, advisory at 116,900, urgent at 141,950; env
     var 400000 wins over the file (threshold 367,000); malformed file →
     967,000 (1,000,000 − 33,000); a window of 20000 (≤ the reserve) → next
     source; `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` at 400,000 → 200,000
     (unchanged). Re-pin in the same commit: `THR = 967_000` (`:2097`; the
     derived 85 / 70 constants follow), the constants assertion (`:2158` →
     `HL_DEFAULT_RESERVE` is `33000`), the gate band case (`:2393`:
     defaults 821,950 / 821,949; window 400k 311,950 / 311,949; pct 50
     unchanged at 170,000) and the handoff-budget token-path case
     (`:2403–2405`: 676,900 / 676,899 / 821,950 and "967000-token").
  5. **`commands/handoff.md`** `## Then` (`:62–68`) and Output (`:78–81`)
     per AC-12 — managed copy from journeys J2; keep ≤ 6,000 B.
  6. **`commands/run.md`** (new, ≤ 9,000 B; frontmatter like `handoff.md:1–5`,
     `allowed-tools: [Read, Bash, Grep, Glob]` — no Write/Edit/Task: the
     parent spawns nothing but the runner): the AC-10 loop with the J1 lines;
     the BACKGROUND variant (probe (c), brief `:221`: a new turn arrived 7 s
     and 17 s after the child exited), with ONE sentence naming the
     foreground `runner.mjs round --max <s>` / `wait --max 540` form as the
     fallback if a wake ever fails to arrive (the same row showed a 600 s
     foreground call returns cleanly); the
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
  9. **AC-16 — struck.** Probe (b) (brief `:220`) showed no refusal in
     three shapes. Build nothing; write one line in the hand-off citing the
     row. (A refusal seen in the 24 h run reopens it — OB-35.)
  10. `node tools/lint.mjs`; commit `feat(run): /agentic-workflow:run thin
      parent, unattended handoff gate, effective window, settings env,
      unattended-ask rule (S2)` + Attribution; push. Never edit `.plans/`.
- **Verify**:
  - `node tools/hook-test.mjs` green — report the new block's case names
    (≥ 11), the three re-pinned band numbers, and that `failed open` and
    `"continue"` appear in no unattended case output.
  - `node tools/runner-test.mjs` green incl. the three `21` cases.
  - `grep -rn "HL_DEFAULT_PCT\|950000\|950_000\|807500\|807,500\|665000\|× 95" plugins tools`
    → 0 lines; `ls <plugin>/hooks/lib/plugin-read.sh` → absent.
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
- **Read budget**: ≈ 1,440 lines (brief/plan 335 · memos 118 · journeys
  40 · runner 130 · hooks 271 · hook-test 91 · commands 258 · WORKFLOW 61 ·
  lint + lint-test 88 · the rest ≈ 48) — near the limit; read nothing unlisted.
  The order of work if time runs short: steps 1–4 (hooks + tests, the
  mission's core) → 6 (`run.md`) → 5, 7 → 8. If step 8's 15 pointers cannot
  land green,
  stop with the canonical paragraph + the `RULES` entry in and report the
  remaining sites for a corrective; never a red lint.

**Checkpoint ckpt-s2** — one-shot `reviewer` on **Fable** inside S2 over
`main..HEAD` against AC-10..AC-16 and AC-28: the unattended 6th block can
never reach exit 0 and never fails open; no JSON stop exists anywhere; the
managed line is byte-identical; an `Agent`-tool block never writes the
marker; `hl_threshold` cannot read a non-numeric or a negative into
arithmetic, and every band number equals (window − 33,000) × 70 / 85 %; at
a 200,000 window the urgent band (141,950) is below the observed
compaction point (166,703); `classify` and `round` agree on `21`; the
settings write never overwrites; the parent command cannot Write/Edit/Task;
`run.md` cites the probe row for the background variant; every ask site is
a pointer, not a restatement; no `plugin-read.sh` shipped; byte budgets.
APPROVE → `[x]`, `Next up: S3`.

## Phase P3 — fidelity test (branch: `feat/continuous-op`)

### S3 — `tools/fidelity.mjs`, fixtures, `fidelity-test.mjs`, naive-reader prompt + scorer, `fidelity-model.yml`

- **ACs**: AC-17, AC-18
- **Suits**: `backend` (Node harness over existing bash hooks; one GitHub
  workflow). Runtime: `claude`.
- **Reads** (≈ 1,050 lines):
  1. Brief 60–78 (the sources rule — the fixture's "docs-only" case encodes
     it) + 163–180 (L1 fidelity clause) + 225 (the OB-32 row — where real
     compaction happens) ≈ 38; master plan Task 4 + AC-28 + Value
     sourcing AC-17/18/28 + Locked decisions (D4-C line) ≈ 125.
  2. Memos 296–334 (D4), 616–628 (Comprehension Goldfish) ≈ 50; metrics
     9–22 (D2–D4, D9) + 59–80 (§4 scoring) ≈ 36.
  3. `<plugin>/templates/session-handoff.md` whole (55) — the seed headings;
     `<plugin>/templates/mission-state.md` 1–60 (ledger header fields the
     seed ledger must carry) ≈ 60.
  4. `tools/hook-test.mjs` 20–70 (the hermetic-git env block `:20–29` and
     `runHook` `:67` — copy both into `fidelity-test.mjs` with a comment; do
     not refactor hook-test) + 2542–2557 ≈ 66;
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
     transcript at **150,000** tokens: the gate must be urgent — urgent
     starts at 141,950 and real compaction is at ≈ 167,000, so 150,000 is
     a state a live session can be in; against the 1,000,000 default the
     same transcript is far below the advisory band, which is the
     mismatch the case proves), `docs-only/` (a
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
extraction; the `window-mismatch` transcript sits between the urgent band
and the real compaction point; no fixture content contains a secret shape; the model workflow
has no PR trigger and no secret echo; the naive-reader prompt names only
docs; the harness never touches this repo's own git dir. APPROVE → `[x]`,
`Next up: S4`.

## Phase P4 — `tools/gate.mjs` (branch: `feat/continuous-op`)

### S4 — `gate.mjs` open/poll/status/expire behind one channel interface, delegation fields on every row, `runner.json` approvers, gate-guard hook + codex rule, runner wiring, harness

- **ACs**: AC-19, AC-20, AC-21, AC-22, AC-36, AC-23 (the runner wiring
  and the §5 block only — its connect / §12 / §10 / gate-classes surfaces
  are S4b's)
- **Not here**: the policy file, `predict`, the `http` channel, the
  contract schema (all S4b). Part 2 of the gate-delegation record is never
  built.
- **Suits**: `security` (a decision tool whose whole point is who may answer;
  one refusing hook; an execpolicy rule). Runtime: `claude`.
- **Reads** (≈ 1,290 lines):
  1. Brief 163–183 (L1 channel-only + L2) + 202–208 (L6 — OQ-1's answer:
     `closed-expired`, a new gate) ≈ 30; gate-delegation record 67–84
     (Part 1) ≈ 18; master plan Task 5 + AC-36 in Task 9 + Value sourcing
     AC-19..AC-23, AC-36 + Locked decisions ≈ 270.
  2. Memos 338–366 (D5 core + the L2 reading), 368–372 (option A), 393–398
     (files), 642–662 (counsel 1) ≈ 70.
  3. Journeys 116–160 (J4 — drop the relay row and the local `gate answer`
     clause; 72 h not 24 h) ≈ 45.
  4. `<plugin>/commands/connect.md` 97–103 (how a Slack reaction is
     verified against the owner id — the transport fact) ≈ 7;
     `<plugin>/templates/WORKFLOW.md` 1187–1232 (§12 rules 1–4 — read
     only; S4b edits them) ≈ 46.
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
  7. `tools/hook-test.mjs` 30–70 + 2542–2557 ≈ 56; `tools/lint.mjs` 519–536
     + 1400–1405 ≈ 25; `tools/runner-test.mjs` 1–40 (harness header style)
     ≈ 40.
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
  1. **`<plugin>/tools/gate.mjs`** (~450 lines): `open`, `poll`, `status`,
     `expire` per AC-19; channels behind ONE interface `{ name, send,
     fetchReplies, verify, receipt }` (AC-36) — `verify(reply)` returns
     `{ user, proof }` or nothing, and `poll` treats a reply with no proof
     exactly like an unlisted sender; the registry is a plain object so
     S4b adds a third entry without touching `poll`. Two implementations
     here: `slack` (`chat.postMessage`, `conversations.replies`,
     `reactions.get`, `chat.update`; proof `channel-identity:<user id>`)
     and `telegram` (`sendMessage`, `getUpdates` with a per-project offset
     file, `editMessageText`; same proof form). **Delegation fields
     (AC-36)** on every `pending-gates.md` row and decision-log row from
     the first commit: `type` (`open --type`, else the class → type table
     in AC-36), `answerer` (`owner` — a constant here), `source` (`owner
     via <channel>:<message id>`), `proof`, `predicted`, `predictor` (both
     empty). Channels are configured as an ARRAY from the start —
     `runner.json` `approver.channels[]`, each `{ "kind", "token_env",
     "chat_env" }` (AC-20 as amended; never a single `transport` key) —
     and read tokens by env NAME, base URL overridable by
     `GATE_TRANSPORT_URL` for the
     harness; `pending-gates.md` row written BEFORE the send; outbox
     `<state>/outbox.jsonl` flushed in order; verification = sender id ∈
     `owner_ids` or (`client_ids` AND class ∈ `client_may`); grammar
     `yes|no <reason>|hold`; owner-only human-fired classes per AC-20
     (`open` on them posts the link notice; `poll` records a `yes` as
     `acknowledged`, never as `approved`); receipts; reminders 24/48 h;
     expiry 72 h per OQ-1's answer; decision log row via the
     `templates/decision-log.md` grammar with message id + user id + UTC;
     **no `answer`/`record` subcommand exists** — `record()` is an internal
     function `poll` alone calls, and it refuses a call without a `proof`.
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
     the transport; a clock injected): the matrix; every answered row
     carries `type`, `answerer: owner`, `source` and `proof`; the class →
     type table row by row and a `--type` override; a reply whose channel
     returns no proof is not an answer; outbox order + delayed
     prefix; row-before-send; receipts; reminders/expiry; owner copy on the
     client route; owner-only class `yes` → `acknowledged`; `SECRET` grep
     over `pending-gates.md`, outbox, decision log, stdout = 0 with
     `SLACK_BOT_TOKEN=xoxb-TEST-SECRET-0003` in env; print `gate harness:
     clean — N case(s)`. **hook-test** new block: `gate.mjs record` BLOCKED,
     `gate.mjs open` silent, `tee .plans/pending-gates.md` BLOCKED,
     `runner.mjs resume` BLOCKED, `sh -c 'node … gate.mjs record'` BLOCKED.
     `tools/lint.mjs` `checkGateHarness` after `checkFidelityHarness`.
  5. **The §5 block only** (AC-23; the other surfaces are S4b's): the
     `unattended-ask` block now names `gate.mjs open --class decision`
     (same byte count ± 50); `commands/mission.md:46` sentence mentions the
     gate tool for the overrun decision under `-p`. A verified
     `staging-merge` yes authorises the merge but the command still passes
     the merge-guard hook (`hooks.json:83–93`, §10 Merge policy cell) — the
     reply never bypasses it (a harness case, not prose).
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
    within ± 50 B of its size after S2 (report both numbers).
  - `grep -c "type\|answerer\|source\|proof\|predicted" <plugin>/tools/gate.mjs`
    ≥ 5, and a row written by the harness shows all six fields.
  - `grep -n "record\|answer" <plugin>/tools/gate.mjs | grep case` → no
    CLI `case 'answer'`/`case 'record'`.
  - `node <plugin>/tools/gate.mjs status` in this repo → `no open gates`
    (no network call without a route configured — assert it exits 0 fast).
  - Catalog: none.
- **Read budget**: ≈ 1,290 lines — inside. Order if time runs short:
  `gate.mjs` open/poll with the fields and the channel interface + harness
  (the self-approval surface) → gate-guard + codex rule + hook-test →
  runner wiring → the §5 block last (a corrective may carry the prose,
  never the guard or the fields — S4b freezes the row shape).

**Checkpoint ckpt-s4** — one-shot `reviewer` on **Fable** inside S4 (the
mission's sharpest boundary): enumerate every path by which a gate row can
move from pending to answered and show each requires a transport reply from
an allow-listed id; a `yes` on `merge`/`deploy`/`spend`/`publish`/`kill`/
`scope` must never produce an action; a secret must not reach any committed
or logged file; the guard must catch wrapper-shaped commands; `poll` must
be unreachable from a model turn; an `ask.mjs answer` or `questions.jsonl`
write must not move any gate; the codex rule must cover the same
shapes; `record()` cannot be reached without a channel proof; every row
carries the six delegation fields; no code path writes `answerer` other
than `owner`; byte budgets. APPROVE → `[x]`, `Next up: S4b`.

## Phase P4b — policy, server channel, frozen contract (branch: `feat/continuous-op`)

### S4b — `gate-policy.json` + `predict`, the generic `http` channel with signature proof, `gate-contract.schema.json`, guard shapes, `connect approver`, §12/§10 text

- **ACs**: AC-37, AC-38, AC-39, AC-23 (its connect / §12 / §10 /
  gate-classes surfaces)
- **Suits**: `security` (a second answer path and its proof; two more
  guard shapes; a frozen public shape). Runtime: `claude`.
- **Starts only when**: OQ-8 and OQ-9 are answered in the ledger. If the
  owner chose NOT to build the channel, AC-38 is struck in the hand-off
  with the answer cited and the contract (AC-39) freezes without the
  `http` shapes.
- **Reads** (≈ 1,140 lines):
  1. Gate-delegation record 67–84 (Part 1 — and nothing of Part 2) ≈ 18;
     brief 163–183 (L1, L2) ≈ 21; master plan Task 9 (AC-37..AC-39) + AC-23
     + Value sourcing AC-36..AC-39 + Locked decisions (the 2026-11-12
     lines) + the OQ-8 / OQ-9 answers in the ledger ≈ 170.
  2. `node <plugin>/tools/gate.mjs --help` (≈ 80) + in the body only the
     channel registry, `record()` and the row writer (grep `channels`,
     `function record`, `function rowLine`; ≈ 150); `tools/gate-test.mjs`
     1–80 (the fixture server + the injected clock) ≈ 80.
  3. `<plugin>/hooks/lib/gate-guard.sh` whole (≤ 50);
     `<plugin>/hooks/hooks.json` the gate-guard group (grep `gate-guard`;
     ≈ 12); `<plugin>/templates/codex.rules` 1–60 (grammar) + S4's gate
     rules (grep `gate.mjs`; ≈ 30) ≈ 90; `tools/run-codex-test.mjs` the
     `covers` cross-check block (grep; ≈ 40); `tools/hook-test.mjs` 30–70
     + S4's gate-guard block (grep `gate-guard`; ≈ 40) ≈ 80.
  4. `<plugin>/templates/agents-registry.schema.json` whole (62) +
     `tools/agents-test.mjs` 84–104 (the zero-dep `validate`) ≈ 83;
     `<plugin>/templates/runner-contract.schema.json` 1–40 (S1's idiom for
     `contract_version`) ≈ 40.
  5. `<plugin>/templates/runner-config.json` whole (≈ 40);
     `<plugin>/tools/runner.mjs` the `poll` call sites (grep `gateTool`;
     ≈ 20).
  6. `<plugin>/templates/WORKFLOW.md` 1185–1252 (§12 — rules 1–5 + multi-
     project) + 1054 (Owner channel row) ≈ 70; `<plugin>/commands/connect.md`
     76–123 (Slack path + Record + Output — the round-trip idiom) ≈ 48;
     `<plugin>/templates/gate-classes.md` 20–60 ≈ 40.
- **Prior art** (permission gate — this brief EXTENDS S4's one refusing
  hook and its execpolicy mirror; it adds no second hook body):
  `hooks/lib/gate-guard.sh` + its `hooks.json` group (S4) — add shapes to
  the same body and, for the Write/Edit tools, a second matcher group that
  runs the same body; `hooks/hooks.json:83–93` (merge-guard wrapper: only
  exit 0/2, missing script = BLOCK); `templates/codex.rules` S4's `prefix`
  rules with `# covers:` lines, cross-checked by `tools/run-codex-test.mjs`;
  `tools/shell-wrappers.mjs` (match the command TEXT so `sh -c "…"` is
  still caught).
- **Do**:
  1. **Policy (AC-37)**: `<plugin>/templates/gate-policy.schema.json`
     (strict) and, in `gate.mjs`, `readPolicy(cwd)` + `resolveAnswerer(type,
     class, policy)`: no file or no entry → `owner`; an entry `rule` or
     `agent:<name>` → still `owner`, with the row's `answerer` reading
     `owner (policy <x> not enabled in this version)`; an entry naming a
     non-owner for a gate of class `merge`, `deploy`, `spend`, `publish`,
     `kill` or `scope` → `open` exits 1 with a validation error and writes
     no row. `gate.mjs policy show [--json]` prints the resolved table.
     Nothing in this brief answers a gate from a rule or an agent.
  2. **`predict` (AC-37)**: `gate.mjs predict <id> --answer <yes|no|hold>
     --by <name>` — writes `predicted` / `predictor` on an OPEN row only
     (answered, expired or unknown id → exit 2, file byte-identical);
     never changes state; `poll` never reads the two fields; when the
     owner answers, both stay on the row and are copied to the
     decision-log row.
  3. **`http` channel (AC-38)**: a third entry in the channel registry,
     configured by `runner.json` `approver.channels[]` (`kind: "http"`,
     `url_env`, `token_env`, `owner_keys`, `client_keys`); wire shapes
     exactly as AC-38; `verify` = `crypto.verify(null, <canonical bytes>,
     <public key>, <signature>)` over `<id>\n<nonce>\n<answer>\n<reason>\n<answered_at>`
     for a `key_id` in `owner_keys`, or in `client_keys` when the class is
     in `client_may`; proof `signature:<key_id>`. A gate goes out on every
     configured channel; the first valid answer consumes the nonce; the
     other channels get the receipt. The tool, its help and its errors
     name no app.
  4. **Contract (AC-39)**: `<plugin>/templates/gate-contract.schema.json`
     (`contract_version: 1`, strict): `open --json`, `poll --json`,
     `status --json` (the read-only projection: id, class, type, question,
     choices, state, answer, by, source, proof, time, channel), `policy
     show --json`, the `http` request and answer bodies, the exit codes,
     and the two row grammars as `pattern` strings. `gate.mjs --help` ends
     with the freeze sentence (a shape change needs a `contract_version`
     bump and a CHANGELOG line).
  5. **Guard shapes (AC-39)**: `gate-guard.sh` also BLOCKS, when
     `AGENTIC_WORKFLOW_UNATTENDED=1`, a Bash write (`>`, `>>`, `tee`, `sed
     -i`, `cp`, `mv`) to `.claude/gate-policy.json` or `.claude/runner.json`
     and — through a second `Write|Edit|MultiEdit` matcher group running
     the same body on `tool_input.file_path` — a Write/Edit of those two
     files or of `.plans/pending-gates.md`; outside unattended mode those
     two config files stay writable (`/connect approver` writes them with
     the owner present). `gate.mjs predict` is allowed. `codex.rules`: the
     mirrored rules with `# covers:` lines.
  6. **Tests**: `gate-test.mjs` — a key pair generated in the test
     (`crypto.generateKeyPairSync('ed25519')`; no key is committed): a
     signed answer is accepted with `proof: signature:<id>`; unsigned,
     wrong key, altered answer, replayed nonce and a `client_keys` answer
     on an owner-only class are each ignored + logged + alerted once;
     first valid answer across two channels wins and the other gets the
     receipt; policy: default owner, `rule` entry recorded and not
     executed, L2 class lift refused with no row written; `predict` on
     open / answered / unknown; every `--json` output and one row of each
     file validate against the schema. hook-test: the five new guard
     cases (unattended Bash write to each config file BLOCKED; unattended
     Edit of `pending-gates.md` BLOCKED; attended write to `runner.json`
     silent; `gate.mjs predict` silent). `run-codex-test.mjs` green.
  7. **Surfaces (AC-23)**: `connect.md` new section after `:123`
     (`approver owner|client`: ids and public keys are not secrets;
     round-trip = one test gate answered on each configured channel; writes
     `runner.json.approver` + the §10 clause; one sentence on
     `gate-policy.json` and its default; ≤ 2,200 B); `templates/WORKFLOW.md`
     §12 rule 1 + rule 4 clauses and the Owner channel row clause (≤ 900 B
     total — the policy and the `http` channel are described in `connect.md`
     and `gate.mjs --help`, not in WORKFLOW.md); `gate-classes.md` action
     table + `staging-merge` row (≤ 200 B).
  8. `node tools/lint.mjs`; commit `feat(gate): owner-written gate policy
     and shadow predictions, generic http channel with signature proof,
     frozen gate contract, guard shapes, connect approver (S4b)` +
     Attribution; push. Never edit `.plans/`.
- **Verify**:
  - `node tools/gate-test.mjs` exits 0 — report the case count (≥ 48) and
    name the unsigned-answer case, the L2-lift case and the schema case.
  - `node tools/hook-test.mjs`, `tools/run-codex-test.mjs`,
    `tools/runner-test.mjs` green.
  - `grep -ci "missions\|openmaus" <plugin>/tools/gate.mjs
    <plugin>/templates/gate-contract.schema.json
    <plugin>/templates/gate-policy.schema.json` → 0.
  - `git grep -n "PRIVATE KEY" -- plugins tools` → 0 lines.
  - `node <plugin>/tools/gate.mjs policy show` in this repo → every type
    `owner`; `gate.mjs status --json` validates against the schema.
  - `node tools/lint.mjs` → `lint: clean`; `wc -c <plugin>/templates/WORKFLOW.md`
    ≤ 119,600 (report); `connect.md` ≤ 18,500.
  - Catalog: none.
- **Read budget**: ≈ 1,140 lines — inside. Order if time runs short: the
  `http` channel + its negative cases (the new answer path) → guard shapes
  + codex rules → policy + `predict` → the contract schema → surfaces last
  (a corrective may carry the prose, never the proof check or the guard).

**Checkpoint ckpt-s4b** — one-shot `reviewer` on **Fable** inside S4b:
re-walk ckpt-s4's enumeration with three channels — every path from
pending to answered needs a channel proof, and for `http` that proof is a
signature by a listed key over the gate's own nonce; holding the bearer
token alone answers nothing; no code path executes a `rule` or agent
answer; a policy can never lift an L2 class; `predict` cannot change or
pre-empt an answer; an unattended round cannot rewrite who may answer (the
two config files) by Bash or by Write/Edit; every `--json` shape and both
row grammars match the schema; nothing names an app; nothing of Part 2
shipped; byte budgets. APPROVE → `[x]`, `Next up: S5`.

## Phase P5 — security pass, live-run setup, release (branch: `feat/continuous-op`)

### S5 — security pass + fixes, README/runbook/doctor, CHANGELOG 1.70.0 + version, OB rows, pre-merge Closing rows

- **ACs**: AC-24, AC-25, AC-26, AC-27, AC-40, AC-41
- **Suits**: `security` for the pass (one-shot `security` agent, Opus,
  findings fixed in-session by the same builder), then `backend` prose.
  Runtime: `claude`.
- **Reads** (≈ 1,060 lines):
  1. Brief 60–78 + 163–208 + 227–255 (L7 — the Linux key and token
     handling the runbook documents) + the advisor probe record S1b
     appended (≈ 12) ≈ 105; master plan Task 6 + Task 10 (AC-40, AC-41) +
     the full Value sourcing table + Locked decisions ≈ 330; metrics 23–35
     (per-round fields) + 82–93 (OB rows) ≈ 25.
  2. `node <plugin>/tools/runner.mjs --help`, `gate.mjs --help`,
     `fidelity.mjs --help` (≈ 200) — the facts the docs state; never the
     bodies.
  3. `<plugin>/README.md` 300–320 (Loop-drivable section — the new section
     goes after `:317`) ≈ 20; `<plugin>/templates/engineering-runbook.md`
     whole (83); `<plugin>/commands/doctor.md` 130–142 + the S2 Compaction
     bullet + the S1b Advisor bullet ≈ 26.
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
  1. **Security pass (AC-24 + AC-40)**: spawn the one-shot `security` agent
     with the master plan's AC-24 threat list AND the AC-40 additions
     verbatim + the canary strings;
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
     fidelity model job in one line; one line for the advisor (off by
     default; where it is set; omitted if S1b's probe struck it); one line
     for driving rounds from your own supervisor (`next` / `begin` /
     `classify` / `record`, `auth: external`, the two contract schemas) —
     the section may grow to ≤ 2,800 B.
  3. **`templates/engineering-runbook.md`** `## Unattended run` block
     (≤ 1,200 B): the metrics §2 per-round fields as the record the 24 h run
     fills; "owner corrections about lost context — tagged by a human
     reader, must be 0"; plus (AC-40, brief `:245–249`) the Linux steps to
     create, rotate and revoke the per-project ed25519 signing key file
     and the per-project token env file, both readable only by the
     runner's user — names and paths only (the block may grow to ≤ 2,000 B).
  4. **`commands/doctor.md`** §1 **Runner** bullet after the Compaction
     window bullet (≤ 450 B): `runner.json` present + valid; a login present
     (`claude -p` dry call refused → 🔴 "not logged in"; skipped under
     `auth: external`); the project token and signing key by NAME (`git
     identity show` on macOS; the key-file and env-file paths on Linux —
     never a value); state dir mode 0700; last `round:` line; open gates
     via `gate.mjs status`; the bullet may grow to ≤ 700 B.
  5. **Release (AC-26)**: `plugin.json` + `package.json` → `1.70.0`;
     CHANGELOG `## [1.70.0] — <date>` with the Added/Changed/Deferred lists
     from the master plan AC-26 and one line per P0 probe fact (cite the
     brief's probe record); plus the AC-41 lines — `effective.advisor` in
     the agent registry (a contract change), `runner-contract.schema.json`
     and `gate-contract.schema.json` at `contract_version: 1`, the `http`
     channel, `gate-policy.json`, `auth: external`, `Correctives:`, the
     threshold change (window − 33,000, was window × 95 %), and the advisor
     probe facts. AC-16 is listed under Deferred with its probe row.
  6. `node tools/lint.mjs` clean; `wc -c` on `templates/WORKFLOW.md`
     (≤ 120,000), `commands/run.md`, `connect.md`, `doctor.md`, `handoff.md`
     (≤ 24,000 each) — report all five numbers.
  7. **Fire the pre-merge Closing rows** by evidence (the orchestrator
     ticks them): version bumped + stamped; docs/record synced; probe
     record committed first; no secret in any committed file.
  8. **AC-27 → OB rows** — report these three texts for the orchestrator
     to promote at close (the builder never edits `.plans/`):
     (2026-11-12: OB-35 also records the auto-compaction point at the
     run's window — does window − 33,000 hold? — and any plugin-file read
     refusal in a child; add those two clauses to its `do:` when reporting
     the text. A fourth row, OB-38, follows the three.)
     `- [ ] OB-35 · added <date> (promoted from `.plans/continuous-operation.state.md` `## Closing` row "24h live run", planner, 2026-10-27) — do: on one client LXC container logged in with that client's subscription, with `runner.json` configured and an approver route round-trip-verified, run `/agentic-workflow:run` for ≥ 24 h wall clock on one real mission; record per metrics §2: rounds, ≥ 2 compactions/restarts (counted from the round log), handoff writes and latency, gate events with request→answer latency, budget stops with approver notified y/n, tokens per round (`tokens=`), daily total vs the 5M cap, owner corrections about lost context tagged by a human reader (must be 0), and the fidelity `score` at each compaction/restart against the live handoff; the mission reaches its planned checkpoint or a budget stop — when: v1.70.0 is installed from `main` on a client container and a mission ledger is active there — probe: manual`
     `- [ ] OB-36 · added <date> (promoted from `.plans/continuous-operation.state.md` `## Closing` row "OB-1 fold-in", planner, 2026-10-27) — do: once the 24 h run's compaction records (≥ 2) join OB-32's (1) in the corpus, OB-1's condition (≥ 3 new true-compaction records) is met: re-measure the handoff-budget byte bands (bytes/token anchor, trigger threshold) against those records, record the numbers on OB-1 and fire it, and keep or retire the n=1 caveat in `hooks/lib/handoff-lib.sh` header accordingly — when: OB-35 is fired with ≥ 2 compaction records listed — probe: manual`
     `- [ ] OB-37 · added <date> (promoted from `.plans/continuous-operation.state.md` `## Closing` row "runner on a real client container", planner, 2026-10-27) — do: on a client container under that client's own claude.ai subscription (L3): confirm `runner.mjs next` starts with no account check, children carry no `ANTHROPIC_API_KEY`/`ANTHROPIC_AUTH_TOKEN` (`status --json` child env names), `tokens=` lines are attributable to that container, and a deliberate `claude /logout` makes the next round exit `75 auth-expired` with one approver alert and no work lost — when: v1.70.0 is installed on a client container — probe: manual`
     `- [ ] OB-38 · added <date> (promoted from `.plans/continuous-operation.state.md` `## Closing` row "wrapper contract re-pin", planner, 2026-11-12) — do: in every repo that pins this plugin and validates its JSON shapes (xyzhub/missions, xyzhub/missions-server), move the pin to 1.70.0 through that repo's own updater, refresh its copies of `agents-registry.schema.json`, `runner-contract.schema.json` and `gate-contract.schema.json`, run its contract tests, and record the command and result here — when: v1.70.0 is on `main` — probe: manual`
  9. Commit `release(continuous-operation): 1.70.0 — security pass, run
     24/7 docs, doctor runner row` + Attribution; push; the orchestrator
     spawns `ckpt-s5`, then staging verify (lint + `--plugin-dir` load) and
     the PR to `main` marked ready; the human merges (L5).
- **Verify**:
  - The security agent's return is in the hand-off with every HIGH/MEDIUM
    marked fixed (file:line) and the harness that proves it.
  - `node tools/lint.mjs` → `lint: clean`; every harness count reported
    (hook, runner, fidelity, gate, headless, run-claude, run-codex, agents,
    ledger, lint-test).
  - `git grep -ci "missions\|openmaus" -- 'plugins/*/tools/runner.mjs'
    'plugins/*/tools/gate.mjs' 'plugins/*/templates/*contract*'` → 0.
  - `grep -rn "SECRET\|xoxb-TEST\|ghp_TEST" <plugin> tools .github
    --include=* | grep -v -- "-test.mjs\|fixtures/"` → 0 hits.
  - `grep -n '"version"' <plugin>/.claude-plugin/plugin.json <plugin>/package.json`
    both `1.70.0` and matching the CHANGELOG heading.
  - `claude --plugin-dir <plugin>` loads; `/agentic-workflow:doctor` shows
    the Compaction window and Runner bullets (or report skipped, never
    green when not run).
  - Catalog: none.
- **Read budget**: ≈ 1,060 lines — inside. Order if time runs short: the
  security pass + fixes first (it gates the PR), then release files, then
  README/runbook/doctor prose.

**Checkpoint ckpt-s5** — one-shot `reviewer` on **Fable** inside S5 over
`main..HEAD` against AC-1..AC-41 (the mission's final gate; AC-16 and any
advisor AC the probe struck are checked as struck-with-evidence): re-runs
`node tools/lint.mjs`; confirms every security finding's fix with its
harness case; re-walks the ckpt-s4 / ckpt-s4b answer-path enumeration on
the final tree; confirms both contract schemas still validate the tools'
output; checks the CHANGELOG names every new file and every probe fact;
byte budgets; a plain-report read of every owner-facing string
(`run.md` lines, the gate message, the doctor bullets, the README section).
APPROVE → staging verify → PR to `main` marked ready; the human merges.

---
_Each session's outcome and any deviation lands in
`.plans/continuous-operation.state.md`, never only in chat._
