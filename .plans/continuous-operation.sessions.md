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
**`tools/hook-test.mjs` anchors**: `main` is merged into the branch
(bf90c06, a merge commit — the branch is signed and never rebased) and
`node tools/lint.mjs` is green; the file is 2,589 lines and the anchors,
measured after the merge, are: `function runHook` `:67` · `// ── AC-3 handoff gate ──`
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
| Test / lint gate (CI `lint.yml`, 18 lines) | `node tools/lint.mjs` | end of every session and at every checkpoint — clean on the branch after the `main` merge (bf90c06) apart from the standing `warn:` on WORKFLOW bytes; runs every `tools/*-test.mjs` harness in its array (`tools/lint.mjs:1402`) |
| Hook harness | `node tools/hook-test.mjs` | after any `hooks/` edit (S0 constants, S2, S4) |
| Runner / fidelity / gate harnesses (new) | `node tools/runner-test.mjs` · `node tools/fidelity-test.mjs` · `node tools/gate-test.mjs` | after every edit to the matching tool |
| headless / run-claude / agents / ledger / run-codex / lint-test harnesses | `node tools/headless-test.mjs` · `node tools/run-claude-test.mjs` · `node tools/agents-test.mjs` · `node tools/ledger-test.mjs` · `node tools/run-codex-test.mjs` · `node tools/lint-test.mjs` | S1b (headless refactor, advisor option, registry field, `correctives` verb), S4 + S4b (codex.rules), S2 (rule-dedup) |
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
| `tools/hook-test.mjs` | 2,589 | read 30–70, 2246–2270, 2383–2406, 2542–2557 only; new blocks go after the child-silence block (`:2542–2556`), before `:2557` — never inside a `withDir` — with a `// ──` header |
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
| `tools/ledger-test.mjs` | 345 | read 176–188 only (S1b — the `reviewer-runs` cases `:179–186`) |
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
  clause — S1b), AC-29, AC-30, AC-31, AC-42 (the digest, the counters and
  the runner's own refusal; S4 and S4b extend the protected set)
- **Starts only when**: `ckpt-s0` is APPROVE (or waived by the owner,
  OQ-11) and OQ-6, OQ-7, OQ-12 and the enforcement part of OQ-8 are
  answered. S1b needs OQ-10; S4 needs the rest of OQ-8 and OQ-9.
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
     `AGENTIC_WORKFLOW_CHILD` absent. Auth → `75` only when BOTH hold
     (the `run-claude.mjs:398` condition): the turn did not succeed (no
     `result` event, or `subtype !== 'success'`) AND stderr or the result
     text matches `/401|Login expired|not logged in|please run \/login|invalid api key|authentication/i`;
     a successful turn whose text merely contains one of those words is
     NOT `75` (this is the one place `classify` reads `subtype`; the
     handoff stop still keys on `terminal_reason`). Lock:
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
     **Integrity (AC-42):** `begin` reads `.claude/runner.json` and the
     state-dir files `daily.json`, `backoff.json`, `rounds.log` — not
     `STOP`, which the owner may write during a round (export the list as `PROTECTED` so S4 / S4b append to it), computes
     one sha256 over them and returns `state_digest`; `round` keeps the
     contents and the digest in memory only; `record` requires `--digest`,
     recomputes BEFORE any write, and on a mismatch writes no progress,
     restores the held contents (`round`) or names the changed file
     (split path), writes `STOP`, exits `30 state-tampered`. `round` ends
     the child's process group (spawn `detached`, kill `-pid`) before the
     recompute. `begin` and `record` exit 1 when
     `AGENTIC_WORKFLOW_UNATTENDED=1` is in their OWN environment (a round
     can never run them). Add `state_digest` to the contract schema.
     Export `roundHeld(cwd)` (the lock check with the lock's staleness
     rules): every owner-side write to the protected set — `resume` here,
     `gate.mjs poll` (S4), `/connect approver` (S4b) — refuses while it is
     true, so a real owner answer never reads as `30 state-tampered`
     (plan-judge amendment 1); harness case: an owner-side write during a
     held lock is refused and the round's `record` still passes.
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
     output; **auth negative**: a `subtype: success` result whose text
     says "fixed the 401 authentication bug" → code `0`, not `75`;
     **integrity (a write on no shape list)**: a fake child that calls
     `fs.writeFileSync` on `daily.json` → `30 state-tampered`, contents
     restored, the day's total unchanged; the same on `.claude/runner.json`;
     `record` with a wrong and with a missing `--digest` → refused, nothing
     written; `begin` and `record` with `AGENTIC_WORKFLOW_UNATTENDED=1` in
     env → exit 1. Print `runner harness: clean — N case(s)`; exit 1 on failure.
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
  - `node tools/runner-test.mjs` exits 0 — report the case count (≥ 48) and
    name the parity case, the five-canary case, the `22 no-record` case,
    the sources-rule prompt case, the round-equals-split-path case, the
    schema-validation case, the two `creds-missing` cases, the auth
    negative case and the two `state-tampered` cases.
  - `node tools/headless-test.mjs` exits 0 (the file is untouched here).
  - `grep -n "Missions app\|missions-server\|missions-engine\|xyzhub/missions\|OpenMausBot" <plugin>/tools/runner.mjs
    <plugin>/templates/runner-contract.schema.json` → 0 lines.
  - `node <plugin>/tools/runner.mjs next --json` in THIS repo (run from
    the worktree; do NOT run `round` here) prints a preflight that names
    `.plans/continuous-operation.state.md` as the ACTIVE ledger
    (`Sessions used` ≥ 1, no `Closed:`). Report the line verbatim; it is
    one of two, and which one depends on the machine, not on the code:
    `unit: /agentic-workflow:mission continuous-operation continue` when
    the checkout has a signing key and a token (this repo on the owner's
    Mac: `git identity`, key `agent-xyzhub-agentic-workflow`), or `stop:
    75 creds-missing <name>` when it does not — say which was expected
    from `git config user.signingkey` and `git identity show`. `status`
    prints `no rounds yet`; the state dir exists under
    `$(git rev-parse --git-common-dir)/agentic-workflow/runner/` with mode
    0700 and `git status --porcelain | grep -c runner` → 0.
  - `node tools/lint.mjs` → `lint: clean`.
  - `grep -c "ANTHROPIC_API_KEY" <plugin>/tools/runner.mjs` ≥ 1 and the
    only use is the `delete`.
  - Catalog: none.
- **Read budget**: ≈ 1,470 lines — the master-plan read is ≈ 346 lines,
  not 290 (plan-judge recount; AC-42 added ≈ 40 of them), so the brief/plan
  share is ≈ 450 and the total is at the limit: read NOTHING unlisted, and
  read Task 2 + Task 7 + AC-42 by grep anchor, not by scrolling. Breakdown
  as first counted: (brief/plan 395 · memos 150 · journeys 60 ·
  headless + test 198 · run-claude 145 · hooks 213 · harness + schema refs
  148 · ask/ledger/presets/operate 127). Order if time runs short:
  `redact.mjs` + `begin`/`classify`/`record`/`round` + `next` + the digest
  check + harness green → the contract schema + its validation case →
  credentials preflight → `wait`/`status`/backoff last (a corrective may carry `wait`,
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
`--max-budget-usd` used without the probe row; `classify` taking a lock
or spawning anything; a `75` on a turn that succeeded; a handoff stop read
from `subtype`; any write to the protected set during a round that does
not end in `30 state-tampered` (try one the guard has no shape for);
`begin` or `record` runnable from inside a round; the digest written to
disk; a `--holder` lock with no expiry;
`auth: external` reaching a spawn; a credential VALUE in any output; a
`--json` shape that is not in the schema; any wrapper's name in the tool.
Also re-reads the P0 probe record once if `ckpt-s0` was waived (OQ-11).
APPROVE → `[x]`, `Next up: S1b`.

## Phase P1b — the launch layer (branch: `feat/continuous-op`)

### S1b — advisor probe → launch, cap, fallback; `advisor:` tune field + registry schema; doctor row; `Correctives:`; `headless.mjs run` on the core

- **ACs**: AC-32, AC-33, AC-34, AC-35, AC-9 (its `headless.mjs` clause),
  AC-29 + AC-42 (the carry-in: the retry mark goes), AC-6 (step 0: the
  round prompt shape seen live)
- **Suits**: `backend` (three small Node tools + their harnesses, one
  command section, four one-sentence role edits). Runtime: `claude`.
- **Reads** (≈ 1,435 lines — near the limit; read nothing unlisted. The
  2026-11-13 amendments on AC-6, AC-9, AC-29, AC-33 and AC-35 only
  summarise this brief — skip them in the master plan):
  1. Master plan Task 8 (AC-32..AC-35) + Value sourcing rows AC-32..AC-35 +
     the three advisor lines in Locked decisions (one `Assumed`) + OQ-10's
     answer in the ledger ≈ 110; brief 217–225 (the probe-record table —
     copy its column shape) ≈ 10.
  2. `node <plugin>/tools/runner.mjs --help` (≈ 70) + in `runner.mjs` the
     `begin` argv/env builder and `roundLine` only (grep `function begin`,
     `function roundLine`; ≈ 90); for the carry-in and steps 0 / 3 also
     `classify` 591–606 (where `tokens` is summed, `usageSum` `:589`) ≈ 18,
     the retry-mark comment 653–667 + `record` 669–690 and 740–746 (the
     shortcut and the mark write — the lines the carry-in names) ≈ 45,
     the lock check 715–720 ≈ 6, `roundOnce` 749–781 ≈ 33, the `record` case in `main` 871–877 ≈ 7;
     `<plugin>/templates/runner-config.json` whole (10);
     `tools/runner-test.mjs` 530–540 + 584–597 (the two cases that name
     "already recorded") ≈ 25 — never the rest of the body.
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
     verb to mirror) ≈ 70; `tools/ledger-test.mjs` 176–188 (the
     `reviewer-runs` cases) ≈ 13; `<plugin>/templates/mission-state.md` 12–30 ≈ 19;
     `tools/lint.mjs` 1145–1176 (the `RULES` name patterns — the new
     sentences must not match one) ≈ 32.
- **Prior art**: `run-claude.mjs:260–269` (`childEnv`, `FORBIDDEN`) — the
  advisor option is added to `buildArgv`, never to a wrapper script; no
  permission gate, allowlist, execpolicy rule or refusing hook is touched
  (`tools/shell-wrappers.mjs`, `templates/codex.rules`, `hooks/hooks.json`
  untouched).
- **Do**:
  - **Carry-in — first, before step 0 (owner 2026-11-13; ckpt-s1 finding
    S3, ledger Handoff log).** Delete the N3 retry mark in
    `<plugin>/tools/runner.mjs`: `recordMac`, `canon` (`:666–667`), the
    "already recorded" shortcut (`:684–688`), the mark write (`:744`), the
    `markP` uses, the comment that promises a quiet retry (`:656–661`),
    the `--help` sentence (`:39–40`) and the exit-code special case in
    `main` (`:876` → `return r.code`). A repeated `record` then finds the
    lock gone and the protected set changed, and ends `30 state-tampered`
    with the UTC day forfeited — there is no quiet answer.
    `runner-test.mjs`: the "retried record" case (`:584–597`) becomes
    "a retried record → 30 + STOP"; add ONE case: tamper + a planted
    `rounds/<n>.recorded` mark → `30` + `STOP` (the mark is ignored).
    **Same step (plan-judge PJ-B3):** at `record` a lock that is missing
    or is not this round's is `30 state-tampered` — STOP, the day
    forfeited on the split path — even when the digest matches; today
    that case throws a usage error (`:719`). One more case: digest
    intact + the lock removed → `30` + `STOP`. S2's lock leg of
    `hl_unattended` relies on this: a round that deletes the lock to look
    attended is caught here.
    Harness green, then commit alone: `fix(runner): no retry mark — a
    repeated record is state-tampered (ckpt-s1 S3)`.
  0. **One live round (G5; ≤ $1) — before the advisor probe.** The
     `-p` prompt shape S1-fix chose (slash command alone + the rules as
     `--append-system-prompt`) has never run live. In a scratch git repo
     under the scratchpad dir: a one-brief mission trio
     (`.plans/scratch.md`, `.sessions.md`, and a `.state.md` carrying
     exactly what the runner's ledger pick needs — `Status: active`,
     `Estimate: 2 sessions`, `Sessions used: 1` (a `0` is skipped),
     one open `- [ ] S1 — …` row, a `## Deviations` section, `Next up:
     S1`; S1 = "append one line to NOTES.md, tick S1, set `Next up:
     done`"), `.claude/runner.json` `{ "budgets": { "round_usd": 1 } }`,
     one commit. **First, at $0:** `node …/runner.mjs next` there must
     print `unit: /agentic-workflow:mission scratch continue` (planner's
     dry run 2026-11-13 with this ledger shape: it does). A `stop: 75
     creds-missing <names>` names what the scratch repo lacks —
     `user.signingkey` (copy this repo's `git config` value) and a
     working `git identity token` there (or `GH_TOKEN` where the tool is
     not installed); that first `75` also sets a 15-minute backoff, so
     delete `<state>/backoff.json` after fixing. If the credentials
     cannot be made to pass without the owner, hand back. Then run the
     BRANCH's runner there: `node <this worktree>/plugins/agentic-workflow/tools/runner.mjs
     round` (the unit `/agentic-workflow:mission scratch continue` expands
     from the plugin the machine has installed — the command exists in
     1.69.1; if no plugin is installed, stop and report). Pass = three
     observations, not exit 0 — a `budget-stop` round still passes if all
     three hold: (1) **the command body expanded** — the events file shows
     no `Skill` tool call for the command and the first assistant turn acts
     on the mission protocol; (2) **the sources rule was obeyed** — reads
     of `.plans/` and the handoff, no Read of a `*.jsonl` transcript or a
     `.remember/` file; (3) **a `round:` line and the record were written**
     — one new line in `<state>/rounds.log` and today's total in
     `daily.json` raised. Add ONE row to the brief's P0 probe record,
     after its last row (`:225`), same columns, with the verbatim
     invocation, `claude --version` and the three observations; commit it
     alone: `docs(continuous-operation): live round probe`. **If ANY of the three fails — (2) the sources rule included — stop
     here and hand back with the row** — nothing else in
     this brief is built on an unproven round.
  1. **Probe first (AC-32) — before any code.** Already known — do not
     re-derive: the option is `--advisor <model>` (`fable` | `opus` |
     `sonnet` | a full id), hidden from `claude --help` by design, `-p`
     needs Claude Code ≥ 2.1.260 (https://code.claude.com/docs/en/advisor.md);
     and `claude -p --model sonnet --advisor fable --max-turns 1
     --output-format stream-json --verbose "Reply with the single word
     ok."` exited 0 on 2.1.322 with NO consult (ledger Deviations,
     2026-11-12). In a scratch repo under the scratchpad dir, with the
     real CLI, record only what is unobserved:
     (i) ONE completed consult: `claude -p --model sonnet --advisor fable
     --output-format stream-json --verbose --max-budget-usd 1.00 "<a
     multi-step task: read two files, propose a change, and consult your
     advisor before you report done>"` — and the stream-json event(s)
     that show the advisor attached and called (this becomes the
     "attached" signal);
     (ii) the exit code and stderr of a launch the CLI rejects: an advisor
     that cannot advise (`--advisor claude-haiku-4-5`) and, if a main
     model without advisor support is available, that one; the
     Fable-consent case only if the account is already in that state,
     else `could not verify: <why>` — never change the owner's account;
     (iii) the same task with "have a subagent do it and have the
     subagent consult its advisor" — did the subagent consult?
     (iv) the LAST `result` event's `usage` and `modelUsage`: are the
     advisor's tokens there, under which model key?
     (v) a launch with NO `--advisor`: does it still get an advisor from
     the user's `advisorModel` setting (read the setting's presence, never
     edit it), and does `CLAUDE_CODE_DISABLE_ADVISOR_TOOL=1` in the env
     stop it?
     Append `## Advisor probe record (<date>)` to the brief after L7
     (`:255`): columns `probe · invocation (verbatim) · observed · decides`,
     with `claude --version`. Commit it alone:
     `docs(continuous-operation): advisor probe record`.
     **If row (i) cannot be made to succeed under `-p`: stop the advisor
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
     thread's last reported input side > `maxAdvisorContext`).
     `maxAdvisorContext` = CLI `--advisor-max-context <n>` >
     `.claude/runner.json` `advisor.max_context_tokens` (read with
     `runner.mjs`'s exported `readConfig`) > 100,000 (OQ-10, owner
     2026-11-12). The resumed thread's input side = CLI `--resume-input
     <n>`, which the caller copies from the prior distillate's
     `usage.input_tokens` (`:331` already sums input + cache read + cache
     creation); `--resume` without it → treated as ABOVE the cap (no
     advisor, `advisor_off: "resume-input-unknown"`). Every
     launch WITHOUT the option sets `CLAUDE_CODE_DISABLE_ADVISOR_TOOL=1`
     in `childEnv`, so "off" cannot be overridden by a user-level
     `advisorModel`; on the launch-error text of probe row (ii) relaunch
     ONCE without it (an API-side refusal is silent and is not an error —
     report "attached" only from row (i)'s signal); the
     distillate `runtime` gains `advisor: <model>|null` and `advisor_off:
     <reason>|null`. `run-claude-test.mjs`: option present / absent /
     dropped on a big resume / one retry on the rejection text / never two
     / `--model` always present beside `--advisor` / the disable variable
     set whenever the option is absent.
  3. **`runner.mjs` (AC-33)**: `runner.json` `advisor: { "model": null,
     "max_context_tokens": 100000 }` in the template (OQ-10); `begin`
     includes the option in the returned launch description when set and
     stores `advisor: <model>|null` in `rounds/<n>.begin.json`;
     `round` applies the same retry-once rule; **`classify` output gains
     `advisor_off: <reason>|null`** (the run-claude distillate's name; set
     when the events / stderr carry probe row (ii)'s rejection text, so a
     split-path supervisor sees it and relaunches once itself); `record`
     builds the field from the two. `roundLine` gains
     `adv=<model>|off|off(<reason>)` as its LAST field — after `v=`, which
     stays where it is (the harness regex at `runner-test.mjs:428` is
     extended, not reordered). **Advisor tokens count (advisory):**
     `classify` `tokens` = the larger of `usageSum(result.usage)` and the
     sum over every `result.modelUsage` entry of the token fields probe
     row (iv) shows there (record their names in the row — they are not
     assumed to match `usage`'s), so
     the advisor's tokens reach `tokens=` and the 5M daily cap wherever
     probe row (iv) found them; only if the row shows them in neither do
     `status` and the README say the cap excludes them.
     `runner-contract.schema.json` gains both fields (still
     `contract_version: 1` — nothing is released yet). Runner harness:
     four cases (adv on / off / off(reason) via classify; `modelUsage`
     larger than `usage` → the larger is charged).
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
     bullet after `:54` (≤ 400 B) — it reads "the last launch fell back"
     from ONE place: the `adv=off(<reason>)` field of the last `round:`
     line (`runner.mjs status --json` `rounds`); a role launch keeps no
     record, so roles are reported as configured (`agents.mjs --json`
     `effective.advisor`) and never 🟡; `mission-state.md` `Correctives: 0`
     under `Reviewer runs:` (`:18`) with one clause in the note `:28`;
     `ledger.mjs` verb `correctives +1|=N` (add to `VERBS` `:46`, mirror
     `:172`) + `ledger-test.mjs` cases mirroring `:179–186`;
     `mission.md` — where a corrective starts (`:172–176`, `:275`) add the
     bump command in a clause, never a restatement of the retry rule.
     **Existing ledgers** get the line the way they got `Reviewer runs:`
     (`ledger.mjs:176`): no migration — the verb refuses with "add
     `Correctives: 0` under `Reviewer runs:`", and the `mission.md` clause
     says the orchestrator adds that line once, then re-runs the verb.
  6. **`headless.mjs run` (AC-9)** (`:155–182`): replace the loop body with
     `roundOnce` from `./runner.mjs`; `turn`/`claudeArgs` stay for `chat`.
     **What `ccp run` keeps** (G6): its CLI, the tick count, the
     `answerPending` page, its messages and exit codes (`22` → its own
     "no progress … Stopping." + exit 3; `20` → `answerPending` then the
     next tick; `0` → next tick; any other code → stop with that code),
     **its own unit** (`unit: '/agentic-workflow:mission <mission>
     continue'` — never the runner's pick) and **its own ask note**:
     `roundOnce(cwd, cfg, { unit, ask: 'page' })` →
     `begin` → `roundNote(cfg, { handoff, ask })`, where `'page'` appends
     `HEADLESS_ASK_NOTE` (today's text — and the only value until S4 adds
     `'gate'` and makes it the runner's default). **What it takes from the
     runner**: the lock, the docs-only note, the counters and the `round:`
     line, printed per tick. **What it loses** (Assumed 2026-11-13 —
     report it): the live tool-by-tool rendering of a tick (`roundOnce`
     writes the stream to a file). `headless-test.mjs` has no `run` case
     today (its 13 checks cover `chat` and the UI), so "green unchanged"
     proved nothing: the existing checks stay byte-identical and TWO `run`
     cases are added (a fake `claude`: one tick writes one `round:` line;
     the child argv carries `--append-system-prompt` with the ask.mjs
     note). If `run` cannot be made green, leave `headless.mjs` untouched
     and report it.
  7. `node tools/lint.mjs`; commit `feat(advisor): advisor launch option
     with a per-launch cap and fallback, advisor tune field in the agent
     registry, Correctives counter; headless run on the runner core (S1b)`
     + Attribution; push. Never edit `.plans/`.
- **Verify**:
  - `git log --oneline` order: the carry-in fix, the live-round row, the
    advisor probe record, then code. `grep -n "already recorded\|recordMac"
    <plugin>/tools/runner.mjs tools/runner-test.mjs
    <plugin>/templates/runner-contract.schema.json` → only the test's
    "not already recorded" wording, no code. The live-round row states the
    three observations.
  - The probe record is committed BEFORE any advisor code and every row
    has a verbatim invocation; the option spelling in `buildArgv` is
    character-identical to row (i).
  - `node tools/run-claude-test.mjs`, `tools/agents-test.mjs`,
    `tools/runner-test.mjs`, `tools/ledger-test.mjs`,
    `tools/headless-test.mjs` all exit 0 — report each count and name the
    retry-once case and the schema case.
  - `node <plugin>/tools/agents.mjs --json | grep -c '"advisor"'` ≥ 20 (one
    per role) and every value is `null` in this repo.
  - `node tools/lint.mjs` → `lint: clean` (no rule-dedup finding from the
    four role sentences or the `mission.md` clause).
  - `grep -n "Missions app\|missions-server\|missions-engine\|xyzhub/missions\|OpenMausBot" <plugin>/commands/tune.md
    <plugin>/tools/run-claude.mjs <plugin>/templates/agents-registry.schema.json`
    → 0 lines (`tools/agents.mjs:9` already says "the Missions app" — S5
    rewords it; do not count it here).
  - Catalog: none.
- **Read budget**: ≈ 1,435 lines (plan/brief 120 · runner + config + its
  test 304 · run-claude 191 · agents + schema + test 322 · tune 50 ·
  headless + test 198 · roles 75 · doctor/mission/ledger/template/lint
  181) — near the limit. Order if time runs short: carry-in → live round →
  probe record → `run-claude.mjs` + `agents.mjs` + schema + their
  harnesses (the contract) → `Correctives:` → `tune.md` + doctor + role
  sentences → `runner.mjs` fields → the `headless.mjs` refactor last (this
  brief, not S1, owns it; it is the first thing a corrective may carry).

**Checkpoint ckpt-s1b** — one-shot `reviewer` on **Fable** inside S1b
(`tools/` + `templates/` are boundary-class): every advisor fact in the code
traces to a probe row or the cited documentation, not to a guess; a launch
without the option carries `CLAUDE_CODE_DISABLE_ADVISOR_TOOL=1`; `--advisor`
never appears without `--model`; the fallback retries once and never
loops; a resumed launch above the cap carries no advisor; the registry
output validates and `effective.advisor` is null everywhere by default; no
preset sets it; the role sentence is one sentence; the runner still writes
nothing to a ledger but the `handoff-failed` line; the existing
`headless-test.mjs` checks are byte-identical and the two `run` cases
exist; **ckpt-s1 finding S3 is closed** — no retry mark, no "already
recorded" path, a repeated `record` and a planted `.recorded` file both
end `30` + `STOP`, and so does a `record` whose lock is gone; the live-round row shows the three observations (not
only an exit code); advisor tokens are charged where the probe found
them. If the probe struck the advisor: confirm nothing of it
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
- **Reads** (≈ 1,465 lines — recounted 2026-11-13; AC-11's 2026-11-13
  amendment only summarises Do 1–4 and 6 — skip it in the master plan):
  1. Brief 60–78 + 163–208 + the P0 probe record 217–225 ≈ 75; master plan
     Task 3 (with the three 2026-11-12 amendments) + AC-28 in Task 7 +
     Value sourcing AC-10..AC-16, AC-28 + Locked decisions (the D3-B,
     ask-audit and probe-record lines) ≈ 260.
  2. Memos 244–292 (D3), 454–521 (D7-B incl. "Gap found" and "How it is
     set" — its band numbers are superseded by AC-28) ≈ 118.
  3. Journeys 76–95 (J2 table), 97–114 (J3 table) ≈ 40.
  4. `node <plugin>/tools/runner.mjs --help` (the header, ≈ 70 lines) — the
     exit codes `run.md` reacts to, and the `begin` entry (its JSON:
     `prompt`, `append_system_prompt`, `env`); in the body only `classify`
     and `record` (grep `function classify`, `function record`; ≈ 60) —
     the two functions step 3 edits — plus the lock helpers 288–303
     (`readLock`, `lockStale`, `roundHeld` — the rule `hl_unattended`
     ports to bash) ≈ 16 and the `begin` return 580–584 ≈ 5.
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
     2095–2100 (`THR = 950_000` `:2097` and the two derived constants) +
     2156–2160 (the `HL_DEFAULT_PCT` assertion `:2158`) ≈ 11.
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
  1. **`handoff-lib.sh`**: add `hl_unattended()` after `hl_num` (`:81`) —
     **true when `AGENTIC_WORKFLOW_UNATTENDED=1` OR a live round lock
     exists for the cwd** (G3: the variable is something a supervisor
     must remember to set). The lock is
     `$(git rev-parse --git-common-dir)/agentic-workflow/runner/lock`, one
     line `<pid> <start UTC> <round> <holder|-> <lease_until_ms|->`; live
     = holder `-` → `kill -0 <pid>` succeeds, else `lease_until_ms` > now
     in ms (the bash port of `lockStale`, `runner.mjs:297`; no lock, no
     git dir or an unreadable line → not live). The runner's own
     `refuseUnattended` (`runner.mjs:522`) stays env-only — `record` runs
     while the lock is held. **Two limits, stated (plan-judge):** (a) a
     round can delete the lock and turn this leg off for itself — the
     variable is still set in every child the runner spawns, and S1b's
     carry-in makes a missing lock at `record` a `30 state-tampered`, so
     it is caught, not prevented; (b) the lock leg is NOT scoped to the
     round's process tree: while a round is live EVERY session of the
     repo (all worktrees share the git common dir) is unattended.
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
  2. **Unattended wins over the child silencer (G3).** In
     `handoff-gate.sh` the early exit `:36` and in `compact-resume.sh`
     `:69` become "`AGENTIC_WORKFLOW_CHILD=1` AND NOT `hl_unattended` →
     exit 0" (source the lib before the test); the other hooks' child
     exits are untouched. **`handoff-gate.sh:112–131`** per AC-11 (as
     amended): the unattended last line; on `BLOCKS -ge HL_FAIL_OPEN` → managed: today's `⚠️ …
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
     same `21` and the same line. **`21` is decided only after the re-hash
     and is still charged (G3):** the marker lives in a child-writable
     dir, so `record` re-hashes the protected set FIRST (as today) and
     only then writes the Deviations line, the ladder and the counters —
     a round that plants the marker and edits `daily.json` ends `30
     state-tampered`, never `21`; a `21` round is charged its reported
     tokens, or the whole tick budget when no `result` event exists
     (`classify`'s default). Runner harness: four cases (marker via
     `round`, marker via `classify`, `hook_stopped` via `classify`, marker
     + a `daily.json` edit → `30` not `21`).
  4. **`tools/hook-test.mjs`** — new block after the child-silence block
     (`:2542–2556`), before `:2557`,
     `// ── continuous-operation S2: unattended gate, effective window ──`:
     unattended urgent block → last stderr line is the `unattended=1 — …`
     line; unattended 6th block → the marker file exists, exit 2, stdout
     empty, and `⚠️ … failed open` appears nowhere; a 7th call → still
     exit 2; managed 6th block → byte-identical to today's line;
     unattended + `tool_name: Agent` 6th block → exit 2, no marker;
     `AGENTIC_WORKFLOW_CHILD=1` alone → silent (the existing case
     `:2549` stays as it is); `AGENTIC_WORKFLOW_CHILD=1` +
     `AGENTIC_WORKFLOW_UNATTENDED=1` → the unattended block, NOT silent;
     no variable + a live lock file (the test's own pid) in the fixture
     repo → the unattended line; a lock whose pid is dead → managed;
     compact-resume branch 3
     unattended wording; `hl_threshold`: settings `env` 200000 and no env
     var → threshold 167,000, advisory at 116,900, urgent at 141,950; env
     var 400000 wins over the file (threshold 367,000); malformed file →
     967,000 (1,000,000 − 33,000); a window of 20000 (≤ the reserve) → next
     source; `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50` at 400,000 → 200,000
     (unchanged). Re-pin in the same commit: `THR = 967_000` (`:2097`; the
     derived 85 / 70 constants follow), the constants assertion (`:2158` →
     `HL_DEFAULT_RESERVE` is `33000`), the gate band case (fixtures
     `:2387–2388` — the 400k literals `323_000` / `322_999` become
     `311_950` / `311_949`; the default pair uses the derived constant —
     and the check text at `:2393`: defaults 821,950 / 821,949; window
     400k 311,950 / 311,949; pct 50 unchanged at 170,000) and the handoff-budget token-path case
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
     path is exactly what S4's gate-guard blocks; S4 adds what `resume`
     asks for after a `state-tampered` stop — `run.md` prints the runner's
     own stop line, which names it). **While a round holds the lock the
     parent's own session is unattended too — and so is every other
     session in the repo; `run.md` says it in one sentence ("pause the
     runner before you work in this repo yourself")** (`hl_unattended`,
     step 1):
     it needs only `status`, `stop` and `pause` then (S4's guard leaves
     those three open), and if the handoff gate blocks the parent it
     writes the handoff and ends — the owner starts `/run` again (S5's
     runbook says how). **One sentence for a supervisor that drives
     `begin` / `classify` / `record` itself (G4):** the turn is `claude -p
     --append-system-prompt "<append_system_prompt>" "<prompt>"` with
     `env` added — all three from `begin`'s JSON; the prompt alone carries
     no rules; the stop lines (`🛑 …`) verbatim from J1 minus systemd
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
    (≥ 14), the three re-pinned band numbers, and that `failed open` and
    `"continue"` appear in no unattended case output; name the
    CHILD + UNATTENDED case and the live-lock case.
  - `node tools/runner-test.mjs` green incl. the four `21` cases.
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
- **Read budget**: ≈ 1,465 lines (brief/plan 335 · memos 118 · journeys
  40 · runner 151 · hooks 271 · hook-test 91 · commands 258 · WORKFLOW 61 ·
  lint + lint-test 88 · the rest ≈ 48) — near the limit; read nothing unlisted.
  The order of work if time runs short: steps 1–4 (hooks + tests, the
  mission's core) → 6 (`run.md`) → 5, 7 → 8. If step 8's 15 pointers cannot
  land green,
  stop with the canonical paragraph + the `RULES` entry in and report the
  remaining sites for a corrective; never a red lint.

**Checkpoint ckpt-s2** — one-shot `reviewer` on **Fable** inside S2 over
`main..HEAD` against AC-10..AC-16 and AC-28: the unattended 6th block can
never reach exit 0 and never fails open; a round child is unattended
with the variable unset (live lock) and with `AGENTIC_WORKFLOW_CHILD=1`
set; a planted marker cannot turn a tampered round into a `21`, and a
`21` round is charged; no JSON stop exists anywhere; the
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
- **Reads** (≈ 1,065 lines):
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
     `SOURCES_RULE` … `roundPrompt` 411–421 (≈ 11) and `begin` 550–585
     (≈ 36) — path (b) asserts on `roundNote` and on `begin`'s JSON.
     **The rules are NOT in `roundPrompt`** (since S1-fix it returns the
     slash command alone); they are in `roundNote`, which `begin` returns
     as `append_system_prompt`.
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
     next step — extracted fields must still equal the docs, and neither
     the directive nor the round note may offer them as a source: the
     note's only mention of a transcript or a memory folder is inside its
     "never" clause, and `.remember` appears in neither).
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
     `extract` + `compare` → green; path (b) — `roundNote(cfg, { handoff })` contains the handoff
     path, `.plans/` and `docs/product/` (the sources rule), and in a temp
     repo `runner.mjs begin --json` returns `append_system_prompt` equal
     to it and a `prompt` that is the slash command alone (starts with
     `/agentic-workflow:`, names the mission whose ledger is active); the
     lock it took is released by removing the temp repo. `begin` runs
     the preflight, so the case needs (planner's dry run 2026-11-13 —
     with these it exits 0, without them `75`): a stub on `CLAUDE_BIN`
     that exits 0 for `auth status` and prints a version for `--version`
     (CI has no `claude`); in the temp repo `git config commit.gpgsign
     true` + any `user.signingkey`; `GH_TOKEN=x` with a `PATH` that has
     no `git-identity`; and a fixture ledger with `Status: active`,
     `Sessions used: 1`, one open `- [ ]` row and a `Next up:` line. Every `red/` case →
     `compare` exits 1 naming the field (`window-mismatch` asserts the gate
     band via `hl_band`; `docs-only` asserts that the note with its one
     "never a transcript, a compaction summary or a memory folder" clause
     removed contains no `transcript` / `memory` / `.remember` token, that
     the `prompt` contains none, that path (a)'s directive — the
     handoff-present branch — contains no `.remember` (branch 3,
     `compact-resume.sh:249`, names `.remember/now.md` by design: that is
     the `handoff-unnamed` case, not this one), and that `extract`
     ignores both files);
     `score` on a hand-written good restatement → pass, on one with an
     invented id → fail. Print `fidelity harness: clean — N case(s)`.
  4. **`tools/lint.mjs`**: `checkFidelityHarness` after `checkRunnerHarness`.
  5. **`.github/workflows/fidelity-model.yml`**: `on: workflow_dispatch`
     only; same checkout/setup-node pins as `lint.yml`; installs the Claude
     CLI **pinned to an exact version** (`npm i -g
     @anthropic-ai/claude-code@<the version `claude --version` prints in
     this session>`, with a comment naming the date — a floating install
     would let a CLI change read as a fidelity regression; record the
     exact package name if different); `if: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN != '' }}`
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
    `workflow_dispatch` and nothing else; `grep -c pull_request` → 0;
    `grep -n "claude-code@" …` shows an exact version, no range.
  - `node <plugin>/tools/fidelity.mjs restate-prompt <fixture handoff>
    <fixture ledger>` prints a prompt that contains `docs/product/` and
    `.plans/`, never contains `.remember`, and contains `transcript` /
    `summary` only inside its one "do not use" sentence.
  - Catalog: none.
- **Read budget**: ≈ 1,065 lines — inside. Order if time runs short:
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

- **ACs**: AC-19, AC-20, AC-21, AC-22, AC-36, AC-23 (the runner wiring only — the §5 block and the connect / §12 /
  §10 / gate-classes surfaces are S4b's), AC-42 (the answer store, `poll` unreachable from a round,
  the protected set extended)
- **Starts only when**: OQ-8 and OQ-9 are answered in the ledger (the
  channel array, the row fields and the answer store are shaped by them).
- **Not here**: the policy file, `predict`, the `http` channel, the
  contract schema, `connect approver`, and — moved 2026-11-13 so this
  brief holds its size — alert delivery, the `expire --force` verb and
  the §5 `unattended-ask` block (all S4b). Part 2 of the
  gate-delegation record is never built.
- **Suits**: `security` (a decision tool whose whole point is who may answer;
  one refusing hook; an execpolicy rule). Runtime: `claude`.
- **Reads** (≈ 1,305 lines — recounted by range 2026-11-13; read nothing
  unlisted):
  1. Brief 163–183 (L1 channel-only + L2) + 202–208 (L6 — OQ-1's answer:
     `closed-expired`, a new gate) ≈ 30; gate-delegation record 67–84
     (Part 1) ≈ 18; master plan, by line (the `Amended 2026-11-13`
     paragraphs between these ranges are NOT read — this brief is their
     full text): Task 5 464–491, 516–537, 542–555, 564–580, 586–601
     (AC-19..AC-23) ≈ 97; AC-36 839–860 ≈ 22; **AC-42 970–1015** ≈ 46;
     Value sourcing rows 1089–1107, 1110–1114, 1134–1136, 1144–1145,
     1151–1152 ≈ 31; Locked decisions 1216–1220 (the one refusing hook),
     1273–1290 (gate delegation, no local answer path, contract frozen
     last), 1323–1344 (the assumed names, the Telegram facts, the lock
     scope) ≈ 45 — ≈ 241.
  2. Memos 338–366 (D5 core + the L2 reading), 368–372 (option A), 393–398
     (files), 642–662 (counsel 1) ≈ 70.
  3. Journeys 116–160 (J4 — drop the relay row and the local `gate answer`
     clause; 72 h not 24 h) ≈ 45.
  4. `<plugin>/commands/connect.md` 97–103 (how a Slack reaction is
     verified against the owner id — the transport fact) ≈ 7;
     `<plugin>/templates/WORKFLOW.md` 1187–1232 (§12 rules 1–4 — read
     only; S4b edits them) ≈ 46.
  5. `node <plugin>/tools/runner.mjs --help` (≈ 50) + in `runner.mjs`
     `PROTECTED` 91–97, `roundHeld` / `ownerWrite` 299–309, `alert` 348,
     `roundNote` 411–418, `pollGates` 464–468 (the `poll` hook point —
     there is no `gateTool` symbol), the tamper branch of `record` (grep
     `state-tampered`; ≈ 35) and the `resume` case (grep `case 'resume'`;
     ≈ 8) ≈ 85; `<plugin>/hooks/lib/handoff-lib.sh` `hl_unattended` (grep;
     ≈ 15); `<plugin>/tools/ask.mjs`
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
    8. `<plugin>/templates/decision-log.md` whole (15) — the row the
     recorded decision appends.
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
  1. **`<plugin>/tools/gate.mjs`** (~600 lines): `open`, `poll`, `status`,
     `expire` per AC-19 (as amended 2026-11-13 — the grammars, the gate
     binding and the semantics below are DEFINED here; S4b only writes
     them into the contract schema); channels behind ONE interface `{ name, send,
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
     via <channel>:<message id>` for a sender in `owner_ids`; **`client via
     <channel>:<message id>`** for a sender in `client_ids` answering a
     class in `client_may` — never the owner's name on a client's answer),
     `proof`, `nonce` (`crypto.randomBytes(16)` hex, made by `open`, sent
     with the gate; the first valid answer marks it used), `predicted`,
     `predictor` (both empty). Channels are configured as an ARRAY from
     the start — `runner.json` `approver.channels[]`, each `{ "kind",
     "token_env", "chat_env", "route": "owner" | "client" }` (AC-20 as
     amended; never a single `transport` key) — and read tokens by env
     NAME. **Routes (G6):** a gate goes to every channel whose `route`
     equals `approver.route`; on the client route the one-line owner copy
     (of the gate and of every client answer) goes to every `route:
     "owner"` channel, and `open` exits 1 when there is none. **`open`
     with no channel at all:** the row and the outbox line are still
     written, `open` exits 0 and prints `no channel configured — this
     gate waits; run /agentic-workflow:connect approver`; the gate blocks
     (`20`) until a channel exists and the outbox flushes.
     **Three grammars (G6 — defined here, one writer each):**
     (i) `.plans/pending-gates.md` row, one line per gate, fields joined
     by ` · `: `- <id> · <class> · type=<t> · state=<open|hold|answered|closed-expired>
     · asked=<UTC> · ttl=72h · route=<owner|client> · answer=<yes|no|acknowledged|->
     · answerer=owner · source=<…|-> · proof=<…|-> · nonce=<32 hex> ·
     msg=<channel>:<message id>[,…]|- · predicted=<…|-> · predictor=<…|->
     · unit="<slash command>" · what="<one line>"`;
     (ii) `<state>/answers.jsonl`, one JSON object per line, `event` ∈
     `opened` (`id, at, class, type, nonce, q, msgs, unit` — the
     snapshot), `held`, `answered` (`id, at, answer, reason, user, source,
     proof, channel, reply_id`), `acted` (`id, at, round` — written when
     the runner picks the owning unit), `expired`, `void` (`id, at, why`);
     (iii) `<state>/outbox.jsonl`, `{ seq, at, id, channel, kind: "gate" |
     "reminder" | "receipt" | "owner-copy" | "alert", text, question,
     sent_at, message_id }` (`question` on `kind: "gate"` only;
     `sent_at` / `message_id` null until sent).
     **One word for expiry: `closed-expired`** (L6) — the row state; the
     store event is `expired`; nowhere a bare state `expired`.
     **A yes is bound to the gate the owner saw (G1):** the sent message
     ends with one machine line `Gate <id> · <class> · <nonce> · q=<first
     16 hex of sha256(question)>` (`question` = the what / does / yes / no
     lines joined by `\n`, UTF-8). The row is child-writable, so `poll`
     trusts it only as a pointer: on FIRST sight of a row it appends the
     `opened` snapshot and from then on reads class, nonce, `q` and the
     message ids ONLY from the snapshot — a later row edit changes
     nothing. Class, nonce and `q` enter the snapshot from the
     bot-authored message itself, never from the row: Slack — the parent
     message returned by `conversations.replies` (its `bot_id` / `user` =
     this token's `auth.test` identity); Telegram — the
     `reply_to_message` / `callback_query.message` object of the first
     update that references it (`from.id` = `getMe`; the Bot API has no fetch-by-id method, keeps an update at most 24 h
     and drops it once `getUpdates` is called with a higher `offset` —
     https://core.telegram.org/bots/api, read 2026-11-13 — so `poll`
     advances the offset only AFTER the answer is in the store); when `poll` itself sent the message (outbox flush) it
     snapshots what it sent. **What the snapshot holds:** `q` is always
     the FULL 64-hex hash — recomputed from the outbox line's `question`
     and accepted only when its first 16 hex equal the bot message's
     machine line (the line shows 16 for the owner's eyes; the store
     keeps 64); `at` is first sight, and the 72 h clock and reminders
     count from it, never from the row's `asked=`. For Telegram the
     `opened` event is written at first sight with `msgs` pinned and
     `class`, `nonce`, `q` null, and no answer is accepted while they are
     null — the update that carries the first reply fills them, then is
     judged. A channel with no bot-authored message to read back (S4b's
     `http`) is sent ONLY by `poll`, never by `open`, so its snapshot is
     always "what `poll` sent". A reply counts only when the message it
     hangs on is bot-authored, carries the snapshot's gate id + nonce in
     its machine line, and has the snapshot's message id; a row whose
     message lacks the line, or whose line disagrees with the row on
     class or `q` at first sight, gets a `void` event + one alert and is
     never answerable (the round opens a new gate). **Message ids are
     single-use:** a message id already in the store under another gate
     is refused.
     **Answers (G6):** a typed reply in the thread / a reply-to follows
     the grammar; Slack reactions on the gate message map
     `white_check_mark` → `yes`, `x` → `no` (no reason), `raised_hand` →
     `hold`; Telegram inline buttons carry `callback_data`
     `yes:<id>` / `no:<id>` / `hold:<id>`; anything else is not an answer.
     The Telegram update offset lives in `<state>/telegram.offset` (one
     integer, 0600), in the protected set. **`hold`** (journeys J4,
     minus its `resume <id>` word, which is outside the fixed grammar):
     the row goes `state=hold`, the gate still blocks (`20`), reminders
     and the 72 h clock stop, the nonce is NOT consumed, and a later
     `yes` / `no <reason>` from an allowed sender on the same message
     answers it. **`expire`** = the TTL pass `poll` runs each tick
     (reminders, then `closed-expired` at 72 h), runnable alone;
     the `expire --force <id>` verb is S4b's (the guard here already
     blocks its text). **Alerts:** in this brief `gate.mjs` only appends
     to `<state>/alerts.log` (`runner.mjs:348`), as the runner does;
     delivering them to the owner is S4b's. **Exit codes:** `0` done
     (`open`: row written; `poll`, `status`, `expire`: ran) · `1` usage
     or validation error, nothing written · `2` refused — unknown id or
     a gate not in the needed state · `40` busy — a round holds the lock
     (`poll`, `expire`, `reconcile`). **There is no
     `GATE_TRANSPORT_URL`, no flag and no config key for the transport
     host**: `open(deps)` / `poll(deps)` take `deps.baseUrl` as a function
     argument that only the harness passes by importing the module; the
     CLI always talks to the real hosts. **Answer store (AC-42):** `poll`
     appends every accepted answer to `<state>/answers.jsonl` and then
     rewrites the `pending-gates.md` row and the decision-log row FROM it;
     nothing else writes the store; `poll` writes nothing and exits
     busy while `runner.mjs`'s `roundHeld(cwd)` is true (AC-42,
     amendment 1; a `gate-test.mjs` case); unit pick and `20` read only the
     store; add `answers.jsonl`, `telegram.offset` and `TAMPERED` (Do 2) to the
     runner's `PROTECTED` list.
     `pending-gates.md` row written BEFORE the send; outbox
     `<state>/outbox.jsonl` flushed in order; verification = sender id ∈
     `owner_ids` or (`client_ids` AND class ∈ `client_may`); grammar
     `yes|no <reason>|hold`; owner-only human-fired classes per AC-20
     (`open` on them posts the link notice; `poll` records a `yes` as
     `acknowledged`, never as `approved`); receipts; reminders 24/48 h;
     `closed-expired` at 72 h (L6); decision log row via the
     `templates/decision-log.md` grammar with message id + user id + UTC;
     **no `answer`/`record` subcommand exists** — `record()` is an internal
     function `poll` alone calls, and it refuses a call without a `proof`.
  2. **`runner.mjs`**: `next`/`wait` call `poll()` (`pollGates`
     `:464`); a recorded answer → the owning unit first (and an `acted`
     event); an open blocking gate → `20`; the `round`
     ledger probe treats a new `pending-gates.md` row as `gate-pending`.
     **`roundNote`** (`:416` — NOT `roundPrompt`, which is the slash
     command alone) takes `ask: 'gate' | 'page'`: `'gate'` appends the gate
     note ("to ask the owner a decision: `node ${CLAUDE_PLUGIN_ROOT}/tools/gate.mjs
     open --class decision …`, record the id in the ledger, END the
     round") and becomes the default for `begin` / `round`; `'page'` keeps
     `HEADLESS_ASK_NOTE` and is what `headless.mjs run` passes (S1b step
     6; AC-23 "ask.mjs stays the `ccp run` surface"). The runner never
     reads `questions.jsonl` or an `ask.mjs answer` as a gate answer.
     **`resume` after tampering (G2):** on the split path nothing is
     restored, so a forged `answers.jsonl` line or an approver id written
     into `runner.json` would survive `30` + `resume`. Four rules (plan-judge PJ-B1, PJ-B2):
     (a) **Sticky.** On ANY `state-tampered` outcome — whatever file it
     names: on the split path the names come from size / mtime hints a
     round can fake — `record` also writes `<state>/TAMPERED` (`round`,
     UTC, the names, the baseline of (b)); it is in the protected set.
     While it exists `next` / `begin` stop `30 state-tampered`, plain
     `resume` exits 1, and `stop` / `pause` never overwrite a `STOP`
     that reads `state-tampered` (they print that the runner is already
     stopped). The tampered state no longer lives in `STOP`'s text alone.
     (b) **The scope does not come from the forged file.** `begin`
     appends the byte length and sha256 of `answers.jsonl` to the
     `state_digest` string it returns (`<sha256>.<length>.<sha256>` —
     still ONE opaque string to the caller and to the contract schema;
     the full-set hash is compared as today). On a mismatch `record`
     copies that baseline from the digest the caller passed into
     `TAMPERED`. `gate.mjs`'s exported `reconcile({ cwd, baseline })`
     then re-verifies from the channel EVERY line after the baseline —
     `opened`, `answered`, `acted`, `held`, whatever status it claims,
     exactly as `poll` would — and the WHOLE store when the baseline is
     absent or the first `<length>` bytes no longer hash to it. A line
     it cannot verify gets a `void` event (listed on stdout, one alert).
     A Telegram answer can never be re-verified (its update is consumed):
     after the baseline it always goes `void` and the gate is asked
     again — say so in the printed list.
     (c) **`resume` without the flag is a dry run:** it prints
     `approver.route`, every channel's kind and route, `owner_ids`,
     `client_ids`, `client_may`, and the lines the reconcile WOULD void;
     it writes nothing and exits 1. (d) **`resume --confirm-approvers`**
     runs the reconcile for real (the `void` events), removes `TAMPERED`
     and `STOP`, resets the backoff, exits 0. `gate.mjs reconcile` is
     also a dry-run CLI verb for the owner's shell; the guard blocks it
     from model Bash.
  3. **`hooks/lib/gate-guard.sh`** + the hooks.json group after `:93`
     (AC-21 as amended; **one file, ≤ 90 lines** — the 50-line cap could not
     hold these shapes, and a second lib file would split one rule):
     BLOCK on `gate.mjs` + (`record`|`answer`|`approve`|`reconcile`|`expire
     --force`), on `runner.mjs resume` from model Bash; when unattended —
     **`hl_unattended` from `handoff-lib.sh` (the variable OR a live round
     lock), tested before any `AGENTIC_WORKFLOW_CHILD` exit (G3)** — also
     on `gate.mjs poll` and `gate.mjs expire` and on every `runner.mjs`
     verb except `status`, `stop` and `pause` (a round that stops the
     runner only stops itself; the `/run` parent needs the three while a
     round is live) (matched in the command TEXT, so
     `sh -c`, `env X=… node …` and `node -e "…gate.mjs…"` forms are
     caught); and on
     `>`/`>>`/`tee`/`sed -i` targeting `pending-gates.md` or
     `decision-log.md`; silent otherwise; fail-closed wrapper. **`templates/codex.rules`**:
     the mirrored `prefix` rules with `# covers:` lines; `run-codex-test.mjs`
     cross-check green.
  4. **`tools/gate-test.mjs`** (AC-22; local `http.createServer` fixture as
     the transport, passed as `deps.baseUrl`; a clock injected): the
     matrix; every answered row carries `type`, `answerer: owner`,
     `source`, `proof` and `nonce`; **G1, three cases:** (a) *re-pointed
     row* — after the snapshot the row's `msg=` is edited to another
     bot-authored message the owner said yes on → this gate is still
     open; and a second gate whose row points at an already-used message
     id is refused; (b) *re-classed row* — a `merge` row edited to
     `staging-merge` after the send → the owner's yes is recorded
     `acknowledged` (the snapshot's class), never `approved`; edited
     BEFORE first sight → `void` + one alert; (c) *http re-post* is S4b's
     (its channel) — here the Slack twin: a second bot message with the
     same gate id and a different question → `q` differs from the
     snapshot → a yes on it answers nothing. **G2:** a forged
     `answered` line appended to `answers.jsonl` → `30 state-tampered` →
     `runner.mjs resume` (no flag) exits 1, writes nothing, `STOP` and
     `TAMPERED` stay → `resume --confirm-approvers` reconciles: the
     forged line is `void`, the gate is still open, and a genuine Slack
     answer written after the baseline survives. **PJ-B2:** a forged
     `answered` + `acted` PAIR → both `void`, the gate still open; a
     forged `rounds/<n>.begin.json` cannot move the baseline (it is read
     from `TAMPERED`, which `record` filled from the caller's digest); a
     Telegram answer after the baseline → `void`, re-asked. `hold` then
     `yes` on the same message → answered, one nonce use; `open` with no
     channel → row + outbox, exit 0, `20`; each exit code once; **a client's `yes` on `decision` is
     recorded `source: client via …` and the owner copy says the client
     answered**; **a `pending-gates.md` row hand-edited to "answered yes"
     answers nothing — the gate is still open in `status` and unit pick**;
     **the CLI ignores a `GATE_TRANSPORT_URL` set in the environment**
     (the fixture server receives no request); the class →
     type table row by row and a `--type` override; a reply whose channel
     returns no proof is not an answer; outbox order + delayed
     prefix; row-before-send; receipts; reminders/expiry; owner copy on the
     client route; owner-only class `yes` → `acknowledged`; `SECRET` grep
     over `pending-gates.md`, outbox, decision log, stdout = 0 with
     `SLACK_BOT_TOKEN=xoxb-TEST-SECRET-0003` in env; print `gate harness:
     clean — N case(s)`. **hook-test** new block: `gate.mjs record` BLOCKED,
     `gate.mjs open` silent, `tee .plans/pending-gates.md` BLOCKED,
     `runner.mjs resume` BLOCKED, `sh -c 'node … gate.mjs record'` BLOCKED;
     with `AGENTIC_WORKFLOW_UNATTENDED=1`: `node … gate.mjs poll` BLOCKED,
     `X=1 node … runner.mjs record --from f.json` BLOCKED, `runner.mjs
     status` silent; without the variable `gate.mjs poll` is silent (the
     owner's `/connect approver` round-trip uses it); no variable + a
     live lock file → `gate.mjs poll` BLOCKED; `AGENTIC_WORKFLOW_CHILD=1`
     + a live lock → still BLOCKED; unattended `runner.mjs stop` silent;
     `gate.mjs reconcile` BLOCKED (thirteen cases). `runner-test.mjs`:
     a fake child that rewrites `answers.jsonl` → `30 state-tampered`;
     `resume` after that stop without the flag → exit 1, `STOP` kept;
     **PJ-B1:** `30` → `runner.mjs stop` → `resume` (no flag) still exits
     1 and `next` still stops `30` (`TAMPERED` survives the `stop`);
     `resume --confirm-approvers` → `TAMPERED` and `STOP` gone.
     `tools/lint.mjs` `checkGateHarness` after `checkFidelityHarness`.
    5. **The merge-guard case** (the §5 `unattended-ask` block and the
     `mission.md:46` sentence moved to S4b Do 7). A verified
     `staging-merge` yes authorises the merge but the command still passes
     the merge-guard hook (`hooks.json:83–93`, §10 Merge policy cell) — the
     reply never bypasses it (a harness case, not prose).
  6. Commit `feat(gate): tools/gate.mjs channel-only verified replies
     with delegation fields and an answer store, gate-guard hook + codex
     rule (S4)` + Attribution;
     push.
- **Verify**:
  - `node tools/gate-test.mjs` exits 0 — report the case count (≥ 38), the
    `SECRET` grep case, the "unlisted sender gets nothing" case, the three
    G1 cases and the G2 forged-line case by name.
  - `node tools/hook-test.mjs` green incl. the thirteen gate-guard cases;
    `wc -l <plugin>/hooks/lib/gate-guard.sh` ≤ 90;
    `node tools/run-codex-test.mjs` green (the `covers` cross-check names
    the new rules); `node tools/runner-test.mjs` green.
  - `node tools/lint.mjs` → `lint: clean`; `templates/WORKFLOW.md` is
    untouched by this brief (`git diff --stat` shows no line for it).
  - `for f in type= answerer= source= proof= nonce= predicted= predictor=;
    do grep -q -- "$f" <plugin>/tools/gate.mjs || echo "MISSING $f"; done`
    prints nothing (seven fields, each checked — a line count proves
    nothing), and a row written by the harness shows all seven.
  - `grep -n "record\|answer" <plugin>/tools/gate.mjs | grep case` → no
    CLI `case 'answer'`/`case 'record'`.
  - `node <plugin>/tools/gate.mjs status` in this repo → `no open gates`
    (no network call without a route configured — assert it exits 0 fast).
  - Catalog: none.
- **Read budget**: ≈ 1,305 lines (plan/brief/record 289 · memos 70 ·
  journeys 45 · connect + WORKFLOW §12 53 · runner + ask + publish-gate +
  handoff-lib 240 · hooks + codex + wrappers + run-codex-test 290 ·
  harness heads 121 · the rest ≈ 197) — inside. Order of work:
  `gate.mjs` open/poll with the fields, the snapshot binding and the
  channel interface + harness (the self-approval surface) → gate-guard +
  codex rule + hook-test → `TAMPERED` / `resume` / `reconcile` → runner
  wiring. Nothing here is optional: S4b freezes the row shape.

**Checkpoint ckpt-s4** — one-shot `reviewer` on **Fable** inside S4 (the
mission's sharpest boundary): enumerate every path by which a gate row can
move from pending to answered and show each requires a transport reply from
an allow-listed id; a `yes` on `merge`/`deploy`/`spend`/`publish`/`kill`/
`scope` must never produce an action; a secret must not reach any committed
or logged file; the guard must catch wrapper-shaped commands; `poll` must
be unreachable from a model turn; an `ask.mjs answer` or `questions.jsonl`
write must not move any gate; the codex rule must cover the same
shapes; `record()` cannot be reached without a channel proof; every row
carries the delegation fields and the nonce; **G1** — class, nonce and
message id are never read from a row after first sight, and never from
a row alone at first sight (Telegram: the row supplies only the pinned
message id, class / nonce / `q` stay null and no answer is accepted
until the first update fills them); a yes on any message other than the
snapshot's bot-authored one answers nothing; **G2** — after a
`state-tampered` stop no forged answer or approver survives a `resume`
without the owner's flag — the state is sticky across `stop` / `pause`,
and a forged `answered` + `acted` pair is voided because the scope comes
from the begin-time baseline, not from the store; **G3** — the guard is on with the variable
unset (live lock) and with `AGENTIC_WORKFLOW_CHILD=1`; no code path writes
`answerer` other than `owner`; a client's answer is never recorded as the
owner's; **AC-42**: `poll` is unreachable from a round by any command form
the reviewer can construct, the transport host cannot be changed from a
command line, the environment or a config file, an edited row answers
nothing, and a write on no shape list (`node -e`, `python`, `git checkout
-- <file>`, `git apply`) to `runner.json`, `answers.jsonl`, `daily.json`
or `backoff.json` during a round ends in `30 state-tampered`; byte
budgets. APPROVE → `[x]`, `Next up: S4b`.

## Phase P4b — policy, server channel, frozen contract (branch: `feat/continuous-op`)

### S4b — `gate-policy.json` + `predict`, the generic `http` channel with signature proof, `gate-contract.schema.json`, guard shapes, `connect approver`, §12/§10 text

- **ACs**: AC-37, AC-38, AC-39, AC-23 (the §5 block and its connect /
  §12 / §10 / gate-classes surfaces), AC-19 (alert delivery and `expire
  --force` — moved from S4, 2026-11-13), AC-42 (`gate-policy.json` joins
  the protected set)
- **Suits**: `security` (a second answer path and its proof; two more
  guard shapes; a frozen public shape). Runtime: `claude`.
- **Starts only when**: OQ-8 and OQ-9 are answered in the ledger. If the
  owner chose NOT to build the channel, AC-38 is struck in the hand-off
  with the answer cited and the contract (AC-39) freezes without the
  `http` shapes.
- **Reads** (≈ 1,225 lines):
  1. Gate-delegation record 67–84 (Part 1 — and nothing of Part 2) ≈ 18;
     brief 163–183 (L1, L2) ≈ 21; master plan Task 9 (AC-37..AC-39) + AC-23
     + Value sourcing AC-36..AC-39 + Locked decisions (the 2026-11-12
     lines) + the OQ-8 / OQ-9 answers in the ledger ≈ 170.
  2. `node <plugin>/tools/gate.mjs --help` (≈ 80) + in the body only the
     channel registry, `record()` and the row writer (grep `channels`,
     `function record`, `function rowLine`; ≈ 150); `tools/gate-test.mjs`
     1–80 (the fixture server + the injected clock) ≈ 80.
  3. `<plugin>/hooks/lib/gate-guard.sh` whole (≤ 90);
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
     `<plugin>/tools/runner.mjs` the `poll` call sites (grep `pollGates`;
     ≈ 20).
  6. `<plugin>/templates/WORKFLOW.md` 1185–1252 (§12 — rules 1–5 + multi-
     project) + 1054 (Owner channel row) ≈ 70; `<plugin>/commands/connect.md`
     76–123 (Slack path + Record + Output — the round-trip idiom) ≈ 48;
     `<plugin>/templates/gate-classes.md` 20–60 ≈ 40; for the three
     items moved from S4: `<plugin>/templates/WORKFLOW.md` the §5
     `unattended-ask` block (grep the fence; ≈ 12) + 858–880 (§6.2
     pointer) ≈ 34; `<plugin>/commands/mission.md` 43–49 ≈ 7;
     `runner.mjs` `alert` / `alertedToday` 348–351 ≈ 4.
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
     no row. `limits` and `rules` are **reserved and opaque**: the schema
     types them `object` / `array` with no inner constraint, the tool
     stores and prints them and never reads inside; the schema's
     description says their shape is not part of contract version 1. Add
     `.claude/gate-policy.json` to the runner's `PROTECTED` list (AC-42)
     and to S4's tampered-`resume` print-out — after any `state-tampered`
     stop `resume` also prints the resolved policy table before it asks
     for `--confirm-approvers`, and for an `http` channel the key ids and
     public keys (G2). `gate.mjs policy show [--json]` prints the resolved table.
     Nothing in this brief answers a gate from a rule or an agent.
  2. **`predict` (AC-37)**: `gate.mjs predict <id> --answer <yes|no|hold>
     --by <name>` — writes `predicted` / `predictor` on an OPEN row only
     (answered, `closed-expired` or unknown id → exit 2, file byte-identical);
     never changes state; `poll` never reads the two fields; when the
     owner answers, both stay on the row and are copied to the
     decision-log row.
  3. **`http` channel (AC-38)**: a third entry in the channel registry,
     configured by `runner.json` `approver.channels[]` (`kind: "http"`,
     `url_env`, `token_env`, `owner_keys`, `client_keys`); wire shapes
     exactly as AC-38; `verify` = `crypto.verify(null, <signed bytes>,
     <public key>, <signature>)` where the signed bytes are the UTF-8 of
     `JSON.stringify([id, nonce, class, q, answer, reason, answered_at])`
     (**G1, before AC-39 freezes the form:** `class` and `q` — the full
     64-hex sha256 of the question as sent in `POST /gates` — are taken
     from S4's `opened` snapshot (an `http` gate is posted only by `poll`,
     so the snapshot is what was posted), never from the answer body or
     the row,
     so a signature made over a re-posted gate with another class or
     another text does not verify; `reason`
     `""` when absent — a JSON array, so no character in `reason` can
     collide two answers), the public key is the raw 32-byte Ed25519 key
     in base64url without padding (JWK `x`; `createPublicKey({ key: {
     kty: "OKP", crv: "Ed25519", x }, format: "jwk" })`) and the signature
     is the raw 64 bytes in base64url without padding; `nonce` is the
     row's (S4) and travels in the `POST /gates` body;
     for a `key_id` in `owner_keys`, or in `client_keys` when the class is
     in `client_may`; proof `signature:<key_id>`. A gate goes out on every
     configured channel; the first valid answer consumes the nonce; the
     other channels get the receipt. The tool, its help and its errors
     name no app.
  4. **Contract (AC-39)**: `<plugin>/templates/gate-contract.schema.json`
     (`contract_version: 1`, strict): `open --json`, `poll --json`,
     `status --json` (the read-only projection: id, class, type, question,
     choices, state, answer, by, source, proof, time, channel), `policy
     show --json`, the `http` request and answer bodies, S4's four exit
     codes, and S4's three grammars — the `pending-gates.md` row and the
     decision-log row as `pattern` strings, the `answers.jsonl` and
     `outbox.jsonl` events as object shapes. **This brief documents what
     S4 wrote; it designs no grammar** — where the schema and S4's writer
     disagree, the schema is wrong. `gate.mjs --help` ends
     with the freeze sentence (a shape change needs a `contract_version`
     bump and a CHANGELOG line).
    5. **Guard shapes (AC-39)**: `gate-guard.sh` (still one file, ≤ 90
     lines — if the shapes do not fit, report the line count; never drop
     a shape to fit the cap) also BLOCKS, when unattended (`hl_unattended` — the variable
     OR a live round lock, S2 / S4), `gate.mjs approver` and a Bash write (`>`, `>>`, `tee`, `sed
     -i`, `cp`, `mv`) to `.claude/gate-policy.json` or `.claude/runner.json`
     and — through a second `Write|Edit|MultiEdit` matcher group running
     the same body on `tool_input.file_path` — a Write/Edit of those two
     files or of `.plans/pending-gates.md`. These shapes are defence in
     depth: the PROPERTY is AC-42's digest, which catches a write no shape
     names; outside unattended mode those
     two config files stay writable (`/connect approver` writes them with
     the owner present, and refuses while `roundHeld(cwd)` is true — AC-42). `gate.mjs predict` is allowed. `codex.rules`: the
     mirrored rules with `# covers:` lines.
  6. **Tests**: `gate-test.mjs` — a key pair generated in the test
     (`crypto.generateKeyPairSync('ed25519')`; no key is committed): a
     signed answer is accepted with `proof: signature:<id>`; unsigned,
     wrong key, altered answer, replayed nonce, **an http re-post with different text (G1)** — the
     server re-posts the gate with the same id and nonce and another
     question, the owner key signs THAT text → not an answer (the `q` in
     the signed bytes is the snapshot's); a signature over another
     `class` → not an answer; a `reason` containing
     newlines (signs and verifies; moving a line between `answer` and
     `reason` does not verify) and a `client_keys` answer on an
     owner-only class are each ignored + logged + alerted once; a
     `client_keys` answer on `decision` is recorded `source: client via
     http:<key id>`; a policy with arbitrary `limits` / `rules` content
     validates and is shown unchanged; **a write on no shape list**: a
     fake child that runs `git checkout -- .claude/gate-policy.json` after
     the test changed it, and one that `python`-writes `runner.json` →
     `30 state-tampered` (in `runner-test.mjs`);
     first valid answer across two channels wins and the other gets the
     receipt; policy: default owner, `rule` entry recorded and not
     executed, L2 class lift refused with no row written; `predict` on
     open / answered / unknown; every `--json` output and one row of each
     file validate against the schema. hook-test: the six new guard
     cases (unattended Bash write to each config file BLOCKED; unattended
     Edit of `pending-gates.md` BLOCKED; attended write to `runner.json`
     silent; `gate.mjs predict` silent; unattended `gate.mjs approver`
     BLOCKED). `run-codex-test.mjs` green.
    7. **Moved from S4 (2026-11-13).** (a) **Alert delivery (AC-19):**
     the runner and `gate.mjs` only append to `<state>/alerts.log`
     (`runner.mjs:348`); `poll` DELIVERS them — every line past the
     offset in `<state>/alerts.sent` goes through the outbox (`kind:
     "alert"`) to every `route: "owner"` channel, so the runner's stop /
     auth alerts reach the owner. `alerts.log` stays OUTSIDE the
     protected set (the runner appends to it mid-round): a round can add
     a line, which gives it nothing it lacks — it already holds the bot
     token, the stated same-user limit — so `poll` delivers only lines
     that start `alert: `, redacted, cut to 500 characters. gate-test:
     one line delivered once; a line without the prefix never. (b)
     **`expire --force <id>` (AC-19):** an owner shell line that closes
     an OPEN gate `closed-expired` now (withdraw a question — never a yes
     or a no); exit 2 on any other state; S4's guard already blocks it
     from model Bash. gate-test: one case each. (c) **The §5 block
     (AC-23):** the `unattended-ask` block now names `gate.mjs open
     --class decision` (same byte count ± 50); the `commands/mission.md:46`
     sentence mentions the gate tool for the overrun decision under `-p`.
     **Surfaces (AC-23)**: `connect.md` new section after `:123`
     (`approver owner|client`: ids and public keys are not secrets; each
     channel entry's `route`; the reaction / button → answer table and
     what `hold` does, in one line each;
     round-trip = one test gate answered on each configured channel; writes
     `runner.json.approver` + the §10 clause — **attended only; from an
     unattended session (`/run`'s parent while a round is live, or any
     round) it follows the `resume` pattern (advisory):** the command
     prints one shell line for the owner, `node ${CLAUDE_PLUGIN_ROOT}/tools/gate.mjs
     approver --set '<the approver JSON>'` (a thin verb over `ownerWrite`,
     `runner.mjs:304`; it refuses while a round holds the lock), and
     writes nothing itself; one sentence on
     `gate-policy.json` and its default; ≤ 2,800 B); `templates/WORKFLOW.md`
     §12 rule 1 + rule 4 clauses and the Owner channel row clause (≤ 900 B
     total — the policy and the `http` channel are described in `connect.md`
     and `gate.mjs --help`, not in WORKFLOW.md); `gate-classes.md` action
     table + `staging-merge` row (≤ 200 B).
  8. `node tools/lint.mjs`; commit `feat(gate): owner-written gate policy
     and shadow predictions, generic http channel with signature proof,
     frozen gate contract, guard shapes, connect approver (S4b)` +
     Attribution; push. Never edit `.plans/`.
- **Verify**:
  - `node tools/gate-test.mjs` exits 0 — report the case count (≥ 62) and
    name the unsigned-answer case, the re-post case, the L2-lift case and
    the schema case.
  - `node tools/hook-test.mjs`, `tools/run-codex-test.mjs`,
    `tools/runner-test.mjs` green.
  - `grep -n "Missions app\|missions-server\|missions-engine\|xyzhub/missions\|OpenMausBot" <plugin>/tools/gate.mjs
    <plugin>/templates/gate-contract.schema.json
    <plugin>/templates/gate-policy.schema.json <plugin>/commands/connect.md`
    → 0 lines.
  - `git grep -n "PRIVATE KEY" -- plugins tools` → 0 lines.
  - `node <plugin>/tools/gate.mjs policy show` in this repo → every type
    `owner`; `gate.mjs status --json` validates against the schema.
  - `node tools/lint.mjs` → `lint: clean`; `wc -c <plugin>/templates/WORKFLOW.md`
    ≤ 119,600 (report); `connect.md` ≤ 19,100.
  - Catalog: none.
- **Read budget**: ≈ 1,225 lines — inside. Order if time runs short: the
  `http` channel + its negative cases (the new answer path) → guard shapes
  + codex rules → policy + `predict` → the contract schema → surfaces last
  (a corrective may carry the prose, never the proof check or the guard).

**Checkpoint ckpt-s4b** — one-shot `reviewer` on **Fable** inside S4b:
re-walk ckpt-s4's enumeration with three channels — every path from
pending to answered needs a channel proof, and for `http` that proof is a
signature by a listed key over the gate's own nonce, class and question
hash (all three from the snapshot) in the JSON-array form; a gate
re-posted with another text or class cannot be answered; holding the
bearer token alone answers nothing; from an unattended session the
approver is never written by the model (a printed shell line); a `reason` with
newlines cannot forge a different answer; `limits` / `rules` are never
read; **AC-42 with the full protected set**: try at least one write the
guard has no shape for against `gate-policy.json`, `runner.json` and
`answers.jsonl` (e.g. `node -e`, `python`, `git checkout -- <file>`, `git
apply`) and one `runner.mjs begin|record --from <forged file>` from inside
a round — each must end in `30 state-tampered` or a refusal; no code path executes a `rule` or agent
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
  1. **Security pass (AC-24 + AC-40, incl. every item of AC-42)**: spawn
     the one-shot `security` agent with the master plan's AC-24 threat
     list AND the AC-40 additions verbatim + the canary strings — it must
     attempt, not only read for: a write on no guard shape to who-may-answer
     and to the counters, `runner.mjs begin|record --from <forged file>`
     from a round, a round feeding `poll` its own transport, a process
     that outlives its round (the stated limit — confirm it is documented
     in the README and on OB-37);
     it returns findings by severity with file:line. Fix every HIGH/MEDIUM
     in-session (re-run the touched harness); a LOW may be recorded as a
     `## Deviations` line with why. Bump `Reviewer runs:` is the
     orchestrator's job.
  2. **README `## Run 24/7`** after `:317` (≤ 2,200 B): three steps (log
     in with the client's subscription on the container; `/agentic-workflow:connect
     approver owner|client`; `/agentic-workflow:run`), what stops it (daily
     cap, overrun, crash loop, no-progress, kill) and the human-run shell line
     `node …/runner.mjs resume` (the session never runs it; after a
     `state-tampered` stop it re-checks the answers and wants
     `--confirm-approvers`), where
     the round log lives (`git rev-parse --git-common-dir` +
     `/agentic-workflow/runner/rounds.log`), the docs-are-the-truth sentence,
     deferred items (systemd, relay, API keys) in one line, the dispatch-only
     fidelity model job in one line; one line for the advisor (off by
     default; where it is set; omitted if S1b's probe struck it); one line
     for driving rounds from your own supervisor (`next` / `begin` /
     `classify` / `record`, `auth: external`, the two contract schemas) —
     the section may grow to ≤ 3,000 B.
  3. **`templates/engineering-runbook.md`** `## Unattended run` block
     (≤ 1,200 B): the metrics §2 per-round fields as the record the 24 h run
     fills; "owner corrections about lost context — tagged by a human
     reader, must be 0"; plus (AC-40, brief `:245–249`) the Linux steps to
     create, rotate and revoke the per-project ed25519 signing key file
     and the per-project token env file, both readable only by the
     runner's user. The brief names no location for either: write them as
     `<key file>` and `<env file>` (the operator's choice), show the
     `git config user.signingkey <key file>` line, and never a value.
     **What keeps `/run` alive (advisory):** v1 has no supervisor (brief
     `:25–26`; systemd is deferred), so the block says it plainly — `/run`
     lives in an interactive `claude` session inside `tmux` (or any
     multiplexer) on the container; nothing restarts it; after a reboot, a
     crash or a parent that ended on its handoff gate, the owner
     re-attaches and types `/agentic-workflow:run` again (state is in the
     runner state dir and the ledgers; a stale lock is reclaimed); the
     sign that it is down is `runner.mjs status` showing no round since
     the last due time; and one line on the lock's reach — while a round
     is live every session in the repo is treated as unattended, so pause
     the runner before working there by hand (the block may grow to ≤ 2,600 B).
  4. **`commands/doctor.md`** §1 **Runner** bullet after the Compaction
     window bullet (≤ 450 B): `runner.json` present + valid; a login present
     (`claude -p` dry call refused → 🔴 "not logged in"; skipped under
     `auth: external`); the project token and signing key by NAME (`git
     identity show` on macOS; on Linux the value of `git config
     user.signingkey` — a key-file path — and whether `GH_TOKEN` is set;
     never a value, and never the env file's location, which the plugin
     does not know); state dir mode 0700; last `round:` line; open gates
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
     **App-agnostic wording (pre-existing, found by the plan-judge):**
     reword `<plugin>/tools/agents.mjs:9` ("e.g. the Missions app" → "a
     wrapper") and `<plugin>/templates/WORKFLOW.md:1090` ("the Missions
     app's profile parser" → "a wrapper's profile parser"; bytes go down).
  6. `node tools/lint.mjs` clean; `wc -c` on `templates/WORKFLOW.md`
     (≤ 120,000), `commands/run.md`, `connect.md`, `doctor.md`, `handoff.md`
     (≤ 24,000 each) — report all five numbers.
  7. **Fire the pre-merge Closing rows** by evidence (the orchestrator
     ticks them): version bumped + stamped; docs/record synced; probe
     record committed first; no secret in any committed file.
  8. **AC-27 → OB rows** — report these three texts for the orchestrator
     to promote at close (the builder never edits `.plans/`):
     (2026-11-13: the two 2026-11-12 clauses, ckpt-s0 A1 and the wake
     latency are now INSIDE the OB-35 text below — report it as written,
     add nothing. A2 (fixed reserve vs percentage) stays a stated
     assumption at 200k. Owner 2026-11-13: OB-35 may run from the staging
     install before the PR to `main`. A fourth row, OB-38, follows the
     three.)
     `- [ ] OB-35 · added <date> (promoted from `.plans/continuous-operation.state.md` `## Closing` row "24h live run", planner, 2026-10-27) — do: on one client LXC container logged in with that client's subscription, with `runner.json` configured and an approver route round-trip-verified, run `/agentic-workflow:run` for ≥ 24 h wall clock on one real mission; record per metrics §2: rounds, ≥ 2 compactions/restarts (counted from the round log), handoff writes and latency, gate events with request→answer latency, budget stops with approver notified y/n, tokens per round (`tokens=`), daily total vs the 5M cap, the wake latency of every round (seconds from the round's exit to the parent's next turn; a wake that never arrives is a finding), the auto-compaction point observed with `CLAUDE_CODE_AUTO_COMPACT_WINDOW` set ONLY in `.claude/settings.json` `env` (does window − 33,000 hold, and did the settings-only value move it?), any plugin-file read refusal in a child, owner corrections about lost context tagged by a human reader (must be 0), and the fidelity `score` at each compaction/restart against the live handoff; the mission reaches its planned checkpoint or a budget stop — when: v1.70.0 is installed on a client container — from `main`, or from the staging install before the PR to `main` — and a mission ledger is active there — probe: manual`
     `- [ ] OB-36 · added <date> (promoted from `.plans/continuous-operation.state.md` `## Closing` row "OB-1 fold-in", planner, 2026-10-27) — do: once the 24 h run's compaction records (≥ 2) join OB-32's (1) in the corpus, OB-1's condition (≥ 3 new true-compaction records) is met: re-measure the handoff-budget byte bands (bytes/token anchor, trigger threshold) against those records, record the numbers on OB-1 and fire it, and keep or retire the n=1 caveat in `hooks/lib/handoff-lib.sh` header accordingly — when: OB-35 is fired with ≥ 2 compaction records listed — probe: manual`
     `- [ ] OB-37 · added <date> (promoted from `.plans/continuous-operation.state.md` `## Closing` row "runner on a real client container", planner, 2026-10-27) — do: on a client container under that client's own claude.ai subscription (L3): confirm `runner.mjs next` starts with no account check, children carry no `ANTHROPIC_API_KEY`/`ANTHROPIC_AUTH_TOKEN` (`status --json` child env names), `tokens=` lines are attributable to that container, and a deliberate `claude /logout` makes the next round exit `75 auth-expired` with one approver alert and no work lost; record the AC-42 stated limit: a process with the round's OS user that outlives the process-group kill is outside the digest check, and a same-user round can also rewrite `runner.mjs`, `gate.mjs`, `gate-guard.sh`, `hooks.json`, or schedule cron/launchd (a separate OS user per round closes it; deferred by L1) — when: v1.70.0 is installed on a client container — probe: manual`
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
  - `grep -n "Missions app\|missions-server\|missions-engine\|xyzhub/missions\|OpenMausBot" <plugin>/tools/*.mjs
    <plugin>/templates/*.schema.json <plugin>/templates/WORKFLOW.md
    <plugin>/commands/connect.md <plugin>/commands/tune.md
    <plugin>/commands/run.md <plugin>/README.md` → 0 lines; and the same
    pattern over the new CHANGELOG entry only (`awk '/^## \[1\.70\.0\]/{f=1;next} /^## \[/{f=0} f' CHANGELOG.md`)
    → 0 lines (older entries are history and are not touched).
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
`main..HEAD` against AC-1..AC-42 (the mission's final gate; AC-16 and any
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
