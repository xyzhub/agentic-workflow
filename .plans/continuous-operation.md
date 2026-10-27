---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: continuous-operation — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide. Planned 2026-10-27 on `plan/continuous-operation` (main at 1949231,
plugin v1.69.1, node v24.12.0). Converted from
`docs/product/decisions/2026-10-27-continuous-operation-brief.md` (2026-10-27) —
its locked decisions **L1–L5** are settled ground and **L1 supersedes anything
bigger in the memos**; the memos
`docs/product/decisions/2026-10-27-continuous-operation-memos.md` are the specs
only as far as L1 allows (D1-A without the CronCreate watchdog; D2 locks/stops/
crash-loop/redaction without systemd; D3-B; D4-C; D5 core + option A channel-only
— no in-session surface, no local answer file, no relay; D6-A only — no
install script; D7-B), the 11 designer-gap answers stand, "Borrowed concepts —
EGM" adds the naive-reader check and the plugin-file-read probe, and § Counsel's
changes are adopted by L1 (runner `wait` instead of a cron pump; channel-only
verified replies; daily cap + idle backoff + no-progress stop; every inline
HITL ask becomes a gate under `-p`; the gate never kills a round because a
builder subagent hit the band). The journeys file supplies the copy, adjusted
to L1 (no systemd lines, no relay rows, no local `gate answer`, channel-only
replies, 72 h expiry). The AC-N ids below are this plan's; the brief's J1–J5
and done criteria D1–D9 map onto them in the Tasks._

**Path convention.** `<plugin>/` = `plugins/agentic-workflow/`. This mission
runs NEXT (L5), before the xyz-rebrand, so the prefix stays
`/agentic-workflow:` and the version is **1.70.0** (next free minor after
1.69.1). Every line number here was measured on 1949231.

Goal: an owner opens an ordinary Claude Code session in a project (Remote
Control optional), types `/agentic-workflow:run` once, and the workflow keeps
going — every unit of work runs in a fresh `claude -p` child that rebuilds its
context from the ledger + handoff, the agent writes its own handoff before any
compaction, nothing fills a window, budgets and a daily cap stop it loudly,
every human decision travels through a verified channel reply, and a CI test
proves a resumed agent is pointed at exactly what it knew.

Estimate: **6 sessions** (mode `phases`, owner-locked in L1 — "Safe v1, 6
sessions"): one brief per phase, S0–S5, in sequence on one branch. The **Fable
checkpoint for each phase rides inside its own session** (a one-shot `reviewer`
spawn at the end of the brief, as provider-adaptive's `ckpt-s2` and
jev-browser's did), and the **security pass rides inside S5** before its
checkpoint — so the count is briefs only: 6. Under the planner's own rule
(briefs + checkpoints) this would read 12; the owner's lock says 6 and every
checkpoint is a one-shot spawn inside its session, so 6 stands (see Locked
decisions). A corrective `S<n>-fix` is counted when it fires, never
pre-booked. The 24 h live run and the owner's OB-32 wall-clock are outside the
session count (they are obligations).

Per-phase count (L1 phase list → one session each): P0 spike + probes (S0,
needs the owner's orderly-agents machine for OB-32) · P1 runner (S1) · P2
`/run` + mode-aware hooks + compaction settings + HITL-ask audit (S2) · P3
fidelity test (S3) · P4 `gate.mjs` (S4) · P5 security pass + live-run setup +
release (S5).

## Tasks

1. **P0 — close OB-32, run the probes, fix constants if they lie (S0).**
   - AC-1 **OB-32 fired first.** On orderly-agents with ≥ 1.69.1 installed, one
     real session with `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000` runs until it
     auto-compacts; the four OB-32 observations (snapshot under the git dir;
     compact-resume names it; doctor row green; observed auto-compact point vs
     `HL_DEFAULT_WINDOW=1000000` / `HL_DEFAULT_PCT=95`,
     `<plugin>/hooks/lib/handoff-lib.sh:70–71`) are recorded on the OB-32 row
     in `.plans/OBLIGATIONS.md:72` as `· fired 2026-…` (the orchestrator
     appends; the builder reports the text) **before S1 starts**. A mismatch
     between the observed trigger percentage and `HL_DEFAULT_PCT` → the
     constants are corrected in the same session (`handoff-lib.sh:70–71` +
     the `tools/hook-test.mjs:2373–2396` band cases) — the brief's "/fix
     first" clause, folded into S0.
   - AC-2 **Probe record.** A new section `## P0 probe record (2026-…)` is
     appended to the brief
     (`docs/product/decisions/2026-10-27-continuous-operation-brief.md`, after
     L5 at `:201`) with one row per probe — **fact with the exact invocation
     and observed output**, or `could not verify: <why>` — never a guess:
     (a) a settings-file `env` value (`.claude/settings.json` →
     `{"env":{"CLAUDE_CODE_AUTO_COMPACT_WINDOW":"400000"}}`) reaches hook
     subprocesses (`hl_threshold` prints 380000) — and whether it applies
     only from the next session start;
     (b) `claude -p` children (no `--restricted`, no
     `AGENTIC_WORKFLOW_CHILD`) and background subagents can `Read` files
     under `${CLAUDE_PLUGIN_ROOT}` without a permission refusal (the EGM
     finding); if refused → the exact refusal text, so S2 ships the
     narrow read-approval hook;
     (c) the **child-exit wake path**: a Bash call with `run_in_background`
     that exits after N minutes delivers its result to the parent as a new
     turn with no prompt (the `/goal` doc claim) — measured once at 2 min
     and once at 20 min; and whether a foreground `node runner.mjs wait`
     blocked ≥ 10 min survives the Bash tool timeout (the fallback the
     parent uses when background wake does not fire);
     (d) a scheduled-task fire (`CronCreate` one-shot) and an owner-typed
     prompt are indistinguishable in the `UserPromptSubmit` input JSON (dump
     the keys) — the fact L1's channel-only rule rests on;
     (e) `{"continue": false, "stopReason": "…"}` from a PreToolUse hook under
     `claude -p --output-format stream-json`: the child's exit code, the
     `result` event's `subtype`, and whether the stop lands when the blocked
     tool call is inside an Agent-tool subagent (does it end the subagent or
     the whole session?);
     (f) one-line re-check: `claude --help | grep -i budget` confirms the
     `--max-budget-usd` spelling (`run-claude.mjs:428` already handles the
     `error_max_budget_usd` subtype).
     Every probe names the Claude Code version (`claude --version`).
   - AC-3 Nothing else changes in S0: no runner code, no hook edits beyond
     the AC-1 constant fix. `node tools/lint.mjs` clean.
2. **P1 — `tools/runner.mjs`: next / round / wait / stop / pause / resume / status (S1).**
   - AC-4 **Subcommands and exit contract.** `<plugin>/tools/runner.mjs` (new,
     ~450 lines, zero deps, Node ≥ 18, `headless.mjs` header style, pure
     functions exported): `next [--json]` (preflight, no model: lock → stop
     file → login present (AC-8) → daily cap (AC-5) → overrun/tick/mission
     budget parity (AC-5) → `gate.mjs poll` when present (S4; absent → skip)
     → unit pick; prints ONE line `unit: <prompt>` or `stop: <code> <reason>`),
     `round [--unit "<prompt>"]` (takes the lock, spawns ONE fresh
     `claude -p` child with the unit prompt, streams events to the round log,
     writes the `round:` line on exit, releases the lock, exits with the
     contract code), `wait [--max <s>]` (blocks with zero model turns until
     the next round is due: the idle-backoff timer, a stop file, or a gate
     answer — polled every 60 s via `gate.mjs poll` when present; exits 0
     "due" / 40 "stopped"), `stop [--reason <r>]` (writes `STOP`), `pause`
     (writes `STOP` with reason `human`), `resume` (removes `STOP` — a human
     act at the shell), `status [--json]` (lock holder, last 5 `round:` lines,
     today's tokens vs cap, pending gates, stop state). Unit pick, first match
     wins (memos D1): kill/budget/overrun → no spawn; a recorded gate answer →
     the unit that owns it; the active mission ledger (`hooks/lib/active-ledger.sh`
     predicate, ported) with an ungated `Next up:` →
     `/agentic-workflow:mission <m> continue`; a venture below V6 →
     `/agentic-workflow:autopilot continue`; else one `/agentic-workflow:operate`
     cycle under the idle rules, or idle. A pending blocking gate pauses
     every work unit (journeys missed-state 1 — v1 pauses all).
     Exit codes (the parent and `wait` read them): `0` progressed · `10` idle ·
     `20` waiting on a gate · `21` handoff gate ended the child without a
     handoff · `22` no progress (ledger `Next up:` and `Sessions used:`
     unchanged and no gate opened; 2 in a row → `30`) · `30` budget/daily-cap/
     overrun stop · `40` kill switch / paused · `75` auth failed, expired or
     absent · `1` crashed. A round never runs when the lock is held
     (`busy`, exit 40 with reason); a stale lock (dead pid) is reclaimed and
     the lost round logged `crashed`.
   - AC-5 **Budgets.** (i) **Daily cap 5,000,000 tokens/day per project**
     (L4), summed from each round's *reported* usage (the child's `result`
     event `usage` input + output + cache_creation + cache_read — counting cache_read is a
     conservative choice; OB-35's first real `tokens=` numbers decide whether
     to keep it; a round with
     no usage line counts the preset `tick_budget` 750,000 as a conservative
     charge); `next` refuses with `30 daily-cap` once the UTC-day sum ≥ cap
     and the approver is alerted once per day (journeys J1 budget-stop
     wording, cap-flavoured). (ii) **Tick / mission / overrun parity**: `next`
     reads `Estimate:`, `Sessions used:`, `Tick budget:`, `Tick tokens:`,
     `Mission budget:` from the active ledger with the same regexes as
     `hooks/lib/mission-budget.sh:73–83` and stops (`30`) on the same
     conditions (2k ≥ 3N; TT ≥ TB; MB ≥ TB × ceil(N/2)); a shared fixture in
     `tools/runner-test.mjs` runs the SAME ledger through the hook (via
     `hook-test.mjs`'s `runHook` idiom) and the runner and asserts both
     stop/not-stop verdicts agree. (iii) **Idle backoff**: after `10`/`22`,
     the next round is due in 5 → 15 → 60 min (reset on `0`); at most 4
     `operate` cycles per UTC day and none after an empty one. (iv)
     **Crash loop**: consecutive `1` exits back off 30 s → 2 → 8 → 15 min;
     the 3rd consecutive → `30 crash-loop` + alert. (v) **No progress**: two
     consecutive `22` → `30 no-progress` + alert. Every stop writes `STOP`
     (reason + UTC) and nothing runs until `resume`.
   - AC-6 **Round log and secrets.** State lives in
     `$(git rev-parse --git-common-dir)/agentic-workflow/runner/` (0700;
     `lock`, `STOP`, `rounds.log`, `rounds/<n>.events.jsonl` 0600, `daily.json`,
     `backoff.json`), the `handoff-lib.sh:100–117` idiom — never in the work
     tree, never tracked. One `round:` line per round, exact shape
     `round: <project> #<n> <UTC start> <outcome> unit=<what> tokens=<n>/<tick budget> next="<exact next step>" ledger=<path>`
     with the closed outcome set `done budget-stop overrun-stop gate-pending
     handoff-failed auth-expired repo-conflict channel-down crashed killed idle
     no-progress daily-cap` (journeys + two new codes); `tokens=` is the
     reported usage (L3: logged from round 1); `plugin_version` and
     `claude --version` are appended as a trailing `v=<plugin>/<cli>` field
     (gap 10). The stream-json event log goes ONLY to `rounds/<n>.events.jsonl`
     — never into the parent's context, stdout or the channel.
     **Docs are the source of truth (brief, owner 2026-10-27):** the round
     prompt `round` builds tells the child to rebuild context ONLY from
     `docs/product/`, the `.plans/` ledgers + `.plans/OBLIGATIONS.md` and
     the handoff — never a transcript, a compaction summary, `.remember/` or
     any memory folder — and to write whatever the next round needs into
     those files before ending; the **round exit contract** adds a docs
     check: after the child exits, `round` compares the mtimes of the
     active ledger and the local handoff against the round start — a `0`
     (progressed) round that touched neither is downgraded to `22` with
     reason `no-record` (progress that is not in the docs does not exist
     for the next round); the prompt also carries the brief's **Docs vs code** rule: a mismatch is
     NEVER resolved silently — it is reported as a `## Deviations` line;
     when the doc records **intent** (a locked decision, an acceptance
     criterion, a rule) the doc wins and the code is the bug — fix the
     code, or open a `decision` gate before the decision changes (locked
     decisions change only with the owner's approval); when the doc
     **describes current behaviour** (a path, a threshold, how a hook or
     tool works) the code wins and the doc is stale — update the doc.
   - AC-7 **Redaction.** `<plugin>/tools/redact.mjs` (new, ≤ 80 lines) ports
     `hl_redact` (`handoff-lib.sh:225–234`, seven shapes) and adds an
     **exact-value scrub** of every env var whose NAME matches
     `/(TOKEN|SECRET|KEY|PASSWORD|CREDENTIAL)/i` in the runner's env
     (values ≥ 8 chars); every runner stdout line, every `round:` line, every
     alert body and every crash tail (≤ 5 lines) passes through it. A
     **parity test** feeds the same corpus to `hl_redact` (bash) and
     `redact.mjs` and asserts identical output; a **negative test** seeds
     `sk-TESTSECRET0001`, `ghp_TESTSECRET0002`, `xoxb-TEST-SECRET-0003`,
     `Bearer TESTSECRET0004` and the fake env value `FAKE_SLACK_BOT_TOKEN=xoxb-…`
     into a fake child's stderr/events and asserts none survives in the
     parent summary line, `rounds.log`, the alert body or `status` output
     (the events.jsonl keeps raw bytes but is 0600 and never surfaced).
   - AC-8 **Auth (L3) and the project config.** The project config
     `<project>/.claude/runner.json` (new, committed, non-secret; schema in
     `<plugin>/templates/runner-config.json`): `{ "schema_version": 1,
     "project": "<slug>", "approver": { "route": "owner|client", … (S4) },
     "budgets": { "daily_tokens": 5000000, "tick_tokens": 750000 },
     "compact_window": 200000, "idle": { "backoff_min": [5,15,60],
     "operate_per_day": 4 } }`. **No account check** (L3, owner verbatim
     "no need to check which account the client runs on"): the runner uses
     whatever login the container has; children inherit it (non-bare
     `claude -p`, `FORBIDDEN` list from `run-claude.mjs:269` re-used);
     **no API-key path**: `runner.mjs` deletes `ANTHROPIC_API_KEY` and
     `ANTHROPIC_AUTH_TOKEN` from the child env. No login, a `401`, or a
     `Login expired` child result → `75 auth-expired` + approver alert
     (journeys J1 auth row with the API-key clause removed: "On the
     container run `claude /login`. No work is lost. Runner retries every
     15 min and starts by itself once it works."); `tokens=` per round is
     logged from round 1 so per-container cost is visible.
   - AC-9 **Tests and reuse.** `tools/runner-test.mjs` (new, ~300 lines,
     `headless-test.mjs` style: a FAKE `claude` on `CLAUDE_BIN` printing
     canned stream-json; no API call): exit codes for every row of the AC-4
     table; lock busy / stale reclaim; daily cap crossing (fixture usage
     lines; UTC-day rollover); backoff ladder; crash-loop stop on the 3rd;
     no-progress stop on the 2nd; parity fixture (AC-5 ii); redaction
     negative test (AC-7); `75` on a fake `Login expired` result and the
     no-API-key child env (AC-8); the docs-only round prompt and the
     round-end docs check (AC-6); child env carries `AGENTIC_WORKFLOW_UNATTENDED=1` and
     `CLAUDE_CODE_AUTO_COMPACT_WINDOW=<config>` and NOT
     `AGENTIC_WORKFLOW_CHILD`; argv never carries `--bare`/
     `bypassPermissions`. `tools/lint.mjs` gains `checkRunnerHarness`
     (copy of `:519–536`) wired after `checkHeadlessHarness` at `:1402`.
     `<plugin>/tools/headless.mjs run` (`:155–182`) delegates its loop body
     to `runner.mjs`'s exported `roundOnce()` so the two unattended loops
     cannot drift (`ccp run` keeps its CLI and the ask.mjs page);
     `headless-test.mjs` stays green.
3. **P2 — `/agentic-workflow:run`, mode-aware handoff, effective window, settings env, HITL-ask audit (S2).**
   - AC-10 **`<plugin>/commands/run.md` (new, ≤ 9,000 B).** The thin parent:
     `run` (start), `run status`, `run stop|pause` (never `resume` — a human
     shell act, AC-24). Loop: (1) Bash
     `node ${CLAUDE_PLUGIN_ROOT}/tools/runner.mjs next` → one line; (2) on
     `unit:` → Bash `runner.mjs round` with `run_in_background: true`; (3)
     on the wake (the background result) read ONLY the exit code and the
     last `round:` line (≤ 2 lines into context), write the parent's own
     write-ahead handoff (unit, last exit, round n, pending gates, stop state
     — ≤ 12 lines into the local handoff via the handoff skill's path), then
     back to (1); (4) on `10`/`20`/`22` → Bash `runner.mjs wait`
     `run_in_background: true` and stop talking (zero turns while idle; the
     wake re-enters (1)); (5) on `30`/`40`/`75` → one plain-report line to the
     owner and END (`STOP` is on disk; the parent prints the shell line
     `node ${CLAUDE_PLUGIN_ROOT}/tools/runner.mjs resume` for the HUMAN to run —
     `run` never executes `resume`: that would be a STOP-file self-resume
     path; S4's gate-guard blocks it from model Bash). Rules
     in the file: the parent never reads a file > 60 lines, never spawns a
     builder, never opens a gate itself; the parent itself, after any
     compaction, resumes from the docs (ledger + its own handoff) only —
     never from the compaction summary (compact-resume already says so); the owner's typed steer lands at the
     next round via the ledger's `## Standing steers`; if AC-2(c) showed
     background wake does not fire, (2) and (4) run foreground with
     `runner.mjs round --max <s>` / `wait --max 540` under the Bash timeout
     and the loop re-enters on return (the probe decides which text ships —
     both are written, one is struck). First-run line and per-round lines
     from journeys J1 (`🧵 Round 1 — …`, `🧵 Round 14 — …`), budget/overrun/
     kill lines verbatim minus systemd words. `commands/autopilot.md:30–37`
     and `commands/mission.md:298–308` Loop-mode paragraphs gain one sentence
     each: "for fresh context per tick use `/agentic-workflow:run`".
   - AC-11 **Mode-aware handoff gate (D3-B).** `hooks/lib/handoff-lib.sh`
     gains `hl_unattended()` (`[ "${AGENTIC_WORKFLOW_UNATTENDED:-0}" = 1 ]`).
     `hooks/lib/handoff-gate.sh:112–131`: unattended → the block text's last
     line is `unattended=1 — no human will do this for you; run
     /agentic-workflow:handoff with these values, update the ledger, then END
     this round; a fresh process continues.`; **no fail-open**: on the
     `HL_FAIL_OPEN`th block the gate emits the J3 line `🛑 Handoff gate — 5
     blocks, no handoff written. Ending this round cleanly: the mechanical
     snapshot is saved at <snapshot>.` and, when AC-2(e) proved
     `continue:false` ends the session with a readable result subtype,
     returns `{"continue": false, "stopReason": "handoff-gate: no handoff
     after 5 blocks"}` on stdout (exit 0); otherwise it writes the marker
     `<state>/<sid>.gate-stop` and keeps exiting 2 (the child is bounded by
     `--max-turns`/`--max-budget-usd`). **Builder-subagent case:** blocks are
     counted per `session_id` as today; the stop is only ever issued when
     the blocked call's `tool_name` is not `Agent`/`Task` AND the input JSON
     carries no subagent marker (per AC-2(e): if the stop inside a subagent
     ends only the subagent, the subagent's exhaustion returns control to
     the orchestrator, which still sees urgent and must write the handoff —
     the round is never killed by a subagent's band). `runner.mjs round`
     maps the stop (result subtype or marker) to exit `21`, appends
     `handoff-failed: agent did not write handoff at <n> tokens; snapshot
     <path>` to the ledger's `## Deviations` (the only ledger write the runner
     makes) and the J3 notify ladder (2 in a row → warn; 3 → `30`). Managed
     (variable unset) keeps today's 6th-block fail-open byte-identical.
     `compact-resume.sh:250` branch 3 unattended wording: "end the round; the
     runner records it" replaces "Tell the human…". `pre-compact.sh`
     unchanged. `hooks.json:122` description updated. `tools/hook-test.mjs`
     AC-3 block (`:2236–2372`) gains: unattended block text last line; 6th
     block → the JSON stop (or marker) and NEVER the `⚠️ … failed open` line;
     managed 6th block byte-identical to today; `AGENTIC_WORKFLOW_CHILD=1`
     still silent; unattended + compact-resume branch 3 wording.
   - AC-12 **Managed handoff copy.** `commands/handoff.md:62–68` `## Then`:
     "handoff written; keep working — compaction will carry it (the
     pre-compact snapshot + compact-resume re-read it verbatim); `/clear` is
     an option you may choose, not a request" (journeys J2 rows: the agent
     acts on the advisory band itself: `📝 Writing my handoff now (context at
     612k); keep going, I'll pick the work back up.`); Output section `:78–81`
     drops "the one-line instruction to start fresh". `handoff-budget.sh`
     texts unchanged (OQ4 of precompact-handoff is human-locked).
   - AC-13 **`hl_threshold` honours the effective window.**
     `handoff-lib.sh:180–186`: window = `CLAUDE_CODE_AUTO_COMPACT_WINDOW` env
     if valid, else `.claude/settings.json` `.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW`,
     else `.claude/settings.json` `.autoCompactWindow`, else `HL_DEFAULT_WINDOW`
     (jq, cwd-relative, missing file → default; pct unchanged). Hook-test: a
     settings file with `env` 200000 and no env var → urgent at 161,500
     tokens; env var wins over the file; a malformed file → default. The
     fidelity test (S3) carries the mismatch case too.
   - AC-14 **Compaction window via project settings, adopt-never-overwrite.**
     `commands/bootstrap.md` (after the Attribution paragraph `:114–119`) and
     `commands/sync.md` §3.7 (after the attribution bullet `:104–112`): write
     `.claude/settings.json` → `"env": {"CLAUDE_CODE_AUTO_COMPACT_WINDOW": "200000"}`
     ONLY when the key is absent (an existing value, any value, is kept and
     reported); record the §10 **Compaction window** row
     (`templates/WORKFLOW.md` §10 table, new row after **Tune preset** `:1044`:
     `200000 (project settings env, set YYYY-MM-DD)` · `none` → defaults; the
     row states that project `env` also reaches the owner's interactive
     sessions in this repo). `commands/doctor.md` §1 gains a **Compaction
     window** bullet after Handoff `:134–141` (settings value vs
     `hl_threshold`'s view; mismatch 🟡 with the one-time remedy "restart the
     session, or type `/autocompact 200000`"). `tools/conform.mjs` is NOT
     extended (planner lock — no new rung this mission).
   - AC-15 **HITL-ask audit → one canonical rule.** `templates/WORKFLOW.md`
     §5 gains the canonical fenced block `<!-- rule: unattended-ask -->`
     beside the existing fences (`:404–487`; `checkRuleDedup`
     `tools/lint.mjs:1226–1228` fails any fence outside §5) and §6.2
     (`:858`) gets a one-line pointer:
     "Under `AGENTIC_WORKFLOW_UNATTENDED=1` no command may wait on a human
     in-session: `AskUserQuestion` is unavailable; a decision is opened with
     `node ${CLAUDE_PLUGIN_ROOT}/tools/ask.mjs ask …` (S4 upgrades this to
     `gate.mjs open --class decision`), recorded in the ledger, and the round
     ENDS; the next round reads the answer. Commands whose purpose is an
     interactive setup (`adopt`, `bootstrap`, `connect`, `sync`, `tune`,
     `welcome`, `doctor fix`) never run unattended — `runner.mjs next` never
     picks them." Each ask site gains ONE sentence pointing at the rule:
     `mission.md:46`, `:128`, `:178`; `plan.md:21`, `:57`; `next.md:81`;
     `autopilot.md:42`, `:73`; `publish.md:23`, `:56`, `:75`; `brainstorm.md:18`,
     `:44`; `groom.md:68`, `:105`. `tools/lint.mjs` `checkRuleDedup` (`:1211`)
     registers `unattended-ask` so a restatement elsewhere is a finding.
     `templates/WORKFLOW.md` net growth ≤ 2,500 B here (115,866 of 120,000;
     S4/S5 need the rest).
   - AC-16 **Plugin-file read approval (conditional on AC-2(b)).** If the
     probe showed refusals, `hooks/hooks.json` gains a PreToolUse
     `Read|Grep|Glob` group whose body (`hooks/lib/plugin-read.sh`, ≤ 40
     lines) returns `permissionDecision: allow` ONLY for a canonical path
     under `${CLAUDE_PLUGIN_ROOT}` (`pwd -P`-resolved, symlinks refused) and
     is silent otherwise; hook-test covers allow / outside-root silent /
     symlink refused. If the probe showed no refusal, this AC is struck in
     the S2 hand-off with the probe row cited (not silently dropped).
4. **P3 — fidelity test: structural in CI, naive-reader check, model job on dispatch (S3).**
   - AC-17 **Structural fidelity (always on).** `<plugin>/tools/fidelity.mjs`
     (new, ~250 lines) + `tools/fidelity-test.mjs` (new) +
     `<plugin>/tools/fixtures/fidelity/` (seed per metrics §4: goal, 3 locked
     decisions with ids + distinctive reasons, done / in-flight / exact
     **Next** with a target id, pointers (branch, 2 file paths, PR number,
     gate command, ledger path), 2 open questions, last gate result, and 2
     decoys — a retired decision and a closed question — in the
     `templates/session-handoff.md` headings; one ledger). Path (a)
     compaction: in a temp git repo drive `pre-compact.sh` then
     `compact-resume.sh` (`source: compact`) through `hook-test.mjs`'s
     `runHook` (`:57`) and assert: the snapshot exists, the directive names
     the handoff and the ledger, freshness CURRENT; path (b) restart: the
     prompt `runner.mjs round` builds for a unit names the ledger and the
     handoff path. `fidelity.mjs extract <handoff> <ledger>` returns every
     seeded field; `fidelity.mjs compare <seed.json> <extracted.json>` is
     exact on ids, paths, PR number, gate command, ledger path, next-step
     target, gate enum; decoys absent from live lists; any id not in the
     seed = fail. Red fixtures (each must FAIL in the same CI run — metrics
     D4): one decision dropped; a decoy resurrected; a stale `_Written:`
     stamp; the handoff not named by the directive; the AC-13 mismatch
     (settings window 200000 while the gate computes against 1,000,000 —
     the band must follow the settings); and a **docs-only** fixture: a
     transcript and a `.remember/now.md` that carry a NEWER, contradicting
     next step — the extracted fields must still equal the docs (the
     directive and the round prompt name only `docs/product/`, `.plans/`
     and the handoff; the transcript and memory folder are never named as
     a source). `tools/lint.mjs` gains `checkFidelityHarness` wired after `checkRunnerHarness`. $0, no secret,
     runs in `lint.yml` unchanged.
   - AC-18 **Naive-reader check (EGM Comprehension Goldfish).** `fidelity.mjs
     restate-prompt <handoff> <ledger>` prints the prompt a fresh, read-only
     agent gets (ONLY the handoff, the ledger, `.plans/OBLIGATIONS.md` and
     the `docs/product/` files the handoff points at — no transcript, no
     compaction summary, no memory folder: the docs ARE the source of
     truth) asking for a JSON
     restatement in the handoff headings; `fidelity.mjs score <seed.json>
     <restatement.json>` applies metrics §4: exact fields exact, decoys
     absent, invented ids fail, semantic claims per the rubric file
     `fixtures/fidelity/rubric.json` (required claims per decision/question;
     scored by a pinned judge only in the model job — the structural scorer
     marks them `unscored`). `.github/workflows/fidelity-model.yml` (new):
     `workflow_dispatch` ONLY (no PR trigger — L1), runs the restatement via
     `claude -p` on `haiku` with `CLAUDE_CODE_OAUTH_TOKEN` from a repository
     secret when present and exits 0 with `skipped: no secret` otherwise;
     path (a) forces compaction with `CLAUDE_CODE_AUTO_COMPACT_WINDOW=100000`
     + filler reads, path (b) a fresh `-p`; artifacts carry the restatement
     and the score; one rerun on a semantic flake, two disagreeing runs =
     fail. The job is never required by branch protection.
5. **P4 — `tools/gate.mjs`: channel-only, transport-verified replies (S4).**
   - AC-19 **Open / poll / status.** `<plugin>/tools/gate.mjs` (new, ~400
     lines): `open --class <decision|staging-merge|merge|deploy|spend|publish|kill|scope> --what "<one line>" --does "<what it does>" --yes "<if yes>" --no "<if no>" [--link <url>] [--option …]` writes the gate to `.plans/pending-gates.md`
     (id `G-<project>-<4 hex>`, class, UTC asked, TTL, route) BEFORE sending
     (§12 rule 3), appends the message to `<state>/outbox.jsonl`, attempts the
     send, prints the id, exits 0 — the caller (a command under
     `AGENTIC_WORKFLOW_UNATTENDED=1`) then ENDS its round (exit 20 via the
     runner's ledger probe: a new pending gate = `gate-pending`). `poll`
     (Node, called by `runner.mjs next`/`wait`, never by a model turn):
     flushes the outbox in order (retry each tick; prefix `(delayed 2h10m)`
     on recovery), fetches replies from the **transport API** — Slack:
     `conversations.replies` on the gate message `ts` + `reactions.get`;
     Telegram: `getUpdates` callback/replies — verifies the sender id against
     the allow-list, parses the fixed grammar `yes | no <reason> | hold`
     (anything else → one hint reply; an unlisted sender → nothing back,
     logged `ignored reply from unlisted user <id>` + one alert), consumes
     the nonce on the first valid answer (later replies get `Gate <id> is
     already answered (<answer> at <T>). Nothing to do.`), records the
     decision in `docs/product/decision-log.md` (the message id + user id +
     UTC, reason as content) and marks the row in `pending-gates.md`; edits
     the gate message into a receipt where the transport allows. `status`
     lists open gates with age. **There is no `answer`, `record` or any local
     write path**: the only way a gate is answered is a verified transport
     reply (L1, counsel 1). `expire`: TTL 72 h with reminders at 24 h and
     48 h (`⏰ <project> is still waiting on you: …`); at 72 h the row is
     closed `expired`, nothing proceeds, and the next round that needs the
     decision opens a NEW gate with a new id (OQ-1 decides the exact
     semantics).
   - AC-20 **Who may answer; owner-only classes (L2).** `.claude/runner.json`
     `approver`: `{ "route": "owner|client", "transport": "slack|telegram",
     "owner_ids": ["U…"], "client_ids": ["U…"], "client_may": ["decision",
     "staging-merge"] }` (ids are not secrets; tokens stay env names
     `SLACK_BOT_TOKEN` / `TELEGRAM_BOT_TOKEN` + the chat id names from the
     §10 Owner channel row). Classes `decision` and `staging-merge` accept the
     owner, or a client id when `client_may` lists the class. Classes
     `merge` (prod), `deploy`, `spend`, `publish`, `kill`, `scope` are
     **owner-only and human-fired**: `open` posts the notice with the link
     and `If you say yes:` reads "I will wait for you to fire it where it
     lives"; a `yes` on them is recorded as acknowledgement only and the
     agent never executes the action (L2 + §12 rule 4). On the client route
     the owner gets a one-line copy of every gate and every client answer
     (`🧵 <project>: client answered yes to <what> (<id>).`) and the client
     message drops internal ids. Message shape = journeys J4 block (one
     structure on every route; "expires in 72h" instead of 24h; "I never
     merge on silence").
   - AC-21 **No self-approval by shape.** `hooks/hooks.json` PreToolUse Bash
     group (body `hooks/lib/gate-guard.sh`, ≤ 50 lines; placed after the
     merge-guard group `:83–93`): BLOCKS (exit 2) any Bash command whose
     text contains `gate.mjs` followed by `record`, `answer`, `approve`,
     `expire --force` or a write to `pending-gates.md`/`decision-log.md` via
     `>`/`sed -i`/`tee` naming those files; a `gate.mjs open|status|poll` is
     silent. `templates/codex.rules` gains the matching `prefix` rule with a
     `# covers:` line; `tools/run-codex-test.mjs` cross-check stays green.
     **Prior art:** `hooks/hooks.json:83–93` (merge-guard wrapper, fail
     closed), `hooks/lib/publish-guard.sh`, `templates/codex.rules:150–245`.
   - AC-22 **Tests.** `tools/gate-test.mjs` (new, ~300 lines; a FAKE
     transport via `GATE_TRANSPORT_URL` pointing at a local
     `http.createServer` fixture — no network): the matrix route × class ×
     sender (owner / client-allowed / client-not-allowed / unlisted) ×
     answer (yes / no reason / hold / junk / duplicate / late-after-expiry);
     outbox flush order and the `(delayed …)` prefix; row written before the
     send (a send that throws leaves the row); receipt text; reminders at
     24/48 h and expiry at 72 h with a clock injected; owner copy on the
     client route; **secrets**: the fixture env carries
     `SLACK_BOT_TOKEN=xoxb-TEST-SECRET-0003` and the test greps
     `pending-gates.md`, the outbox, the decision log and stdout for `SECRET`
     → 0; gate-guard hook-test cases: `gate.mjs record` BLOCKED, `gate.mjs
     open` silent, `tee .plans/pending-gates.md` BLOCKED. `tools/lint.mjs`
     gains `checkGateHarness`.
   - AC-23 **Surfaces.** `runner.mjs next`/`wait` call `gate.mjs poll`
     (AC-4's hook point); a recorded answer makes the owning unit the next
     pick; `20` while a blocking gate is open. `commands/connect.md` gains
     `## Approver route — /agentic-workflow:connect approver owner|client`
     (after `:115`): round-trip = one `gate.mjs open --class decision` test
     gate answered by the configured id, then write `runner.json` `approver`
     and the §10 row clause. `templates/WORKFLOW.md` §12 (`:1208–1240`): rule
     1 gains "the runner's `gate.mjs poll` is the reader"; rule 4 gains the
     L2 sentence (a verified channel `yes` may authorise decisions and
     merges to staging; production merge, deploy, spend and publish stay
     human-fired); the **Owner channel** §10 row (`:1054`) gains "approver
     route (`runner.json`)". `templates/gate-classes.md` action-classes table
     gains `staging-merge` (delegable to a verified channel reply). AC-15's
     canonical §5 block is edited to name `gate.mjs open --class decision`
     (ask.mjs stays the `ccp run` surface). `docs/WORKFLOW.md` is NOT
     re-synced in this mission (post-merge row).
6. **P5 — security pass, 24 h live-run setup, release (S5).**
   - AC-24 **Security pass.** A one-shot `security` agent (Opus) over
     `main..HEAD` with this threat list, findings fixed in S5 before the
     checkpoint: secret in any `round:` line / alert / `pending-gates.md` /
     outbox / decision log / committed file (grep the canaries); an answer
     path that is not a transport-verified reply; a gate class executed on
     a channel `yes` that L2 reserves to the owner's hand; the runner
     starting with an absent or expired login (never an account check —
     L3); an `ask.mjs answer` (`ask.mjs:85`) or `questions.jsonl` write that
     the runner could read as a gate answer; a lock race (two `round`s, one lock); a child env carrying
     `AGENTIC_WORKFLOW_CHILD`; `--bare` or `bypassPermissions` anywhere;
     the parent reading an events log; `ANTHROPIC_API_KEY` reaching a child; a round prompt or directive that names a transcript, summary or memory folder as a source; a docs-vs-code mismatch resolved silently (no Deviations line); a stop file that a model turn can
     remove (`resume` must be a human shell act — the gate-guard blocks
     `runner.mjs resume` from model Bash too); the 6th-block fail-open
     surviving under `AGENTIC_WORKFLOW_UNATTENDED=1`; the `plugin-read.sh`
     allow (if shipped) matching a path outside the plugin root; the model
     job running on a PR trigger. Then the S5 Fable checkpoint.
   - AC-25 **24 h live-run setup (the run itself is OB-35).** `<plugin>/README.md`
     gains `## Run 24/7` after `## Loop-drivable by design` (`:306–317`):
     the three-step start (login with the client's subscription →
     `/agentic-workflow:connect approver …` → `/agentic-workflow:run`), what
     stops it and how to resume, where the round log is, what is deferred
     (systemd, relay, API keys). `templates/engineering-runbook.md` gains a
     `## Unattended run` block (the per-round fields of metrics §2 as the
     record the 24 h run fills, incl. "owner corrections about lost context
     — tagged by a human reader"). `commands/doctor.md` §1 gains a **Runner**
     bullet (`runner.json` present and valid; a login present; state dir mode; last `round:` line; open gates) after the
     Compaction window bullet.
   - AC-26 **Release.** `<plugin>/.claude-plugin/plugin.json` +
     `<plugin>/package.json` `version` → `1.70.0`; CHANGELOG
     `## [1.70.0] — <date>` under `[Unreleased]` (`CHANGELOG.md:7–9`): Added
     (`commands/run.md`, `tools/runner.mjs`, `tools/redact.mjs`,
     `tools/gate.mjs`, `tools/fidelity.mjs`, `hooks/lib/gate-guard.sh`,
     `hooks/lib/plugin-read.sh` if shipped, `templates/runner-config.json`,
     the three harnesses, `fidelity-model.yml`); Changed (mode-aware handoff
     gate, `hl_threshold` effective window, managed handoff copy, settings
     env via bootstrap/sync, §5 unattended-ask rule + §6.2 pointer + 15 sites, §12 + §10
     rows, doctor bullets, `headless.mjs run` on the runner core); Deferred
     per L1 in one line; the P0 probe facts in one line each. `node
     tools/lint.mjs` clean; `templates/WORKFLOW.md` ≤ 120,000 B.
   - AC-27 **Obligations.** Three post-merge Closing rows promote at close
     (register highest today OB-34, `.plans/OBLIGATIONS.md:74`; this mission
     runs before provider-adaptive, so it takes the next ids and
     provider-adaptive's plan renumbers at its own close): **OB-35** the 24 h
     live run on one client container (metrics D5–D8 fields); **OB-36** the
     OB-1 fold-in — re-measure the compaction bands once the 24 h run's
     compaction records join the corpus (OB-1's ≥ 3 condition is then met:
     OB-32 + ≥ 2 from the run); **OB-37** runner on a real client container
     under that client's own subscription (L3): `75 auth-expired` + alert
     on expiry (log out on purpose once), `tokens=` per round attributable
     to that container, no `ANTHROPIC_API_KEY` in any child env. Row texts in S5 Do 8; the orchestrator
     appends them.

## Value sourcing

| AC | Value | Source kind | Where |
|---|---|---|---|
| AC-1 | `HL_DEFAULT_WINDOW=1000000`, `HL_DEFAULT_PCT=95` are assumptions until OB-32 | derivation | `<plugin>/hooks/lib/handoff-lib.sh:70–71` (comments "OB-32 confirms"); `.plans/OBLIGATIONS.md:72` |
| AC-2 | the six probe questions | locked decision | brief L1 ("P0 probes: OB-32 first, plugin-file reads in headless children, child-exit wake path, cron/prompt indistinguishability, `continue:false` under `-p`"), memos "Unverified" list (settings env, `--max-budget-usd`) |
| AC-4 | exit codes 0/10/20/21/30/40/75/1 | locked decision | memos D1 round exit contract table (adopted by L1); `22` no-progress and `30 daily-cap` added per counsel 3 |
| AC-4 | unit pick order (stop → gate answer → mission → autopilot → operate/idle) | locked decision | memos D1 "Unit selection" + gap 1 (pause all on a blocking gate; journeys missed-state 1 specced pause) |
| AC-4 | runner idle via a background `wait` process, no `*/5` CronCreate | locked decision | brief L1 ("idle waiting by a background `runner.mjs wait` process — zero model turns while idle, no `*/5` CronCreate watchdog"); counsel 2 |
| AC-5 | daily cap 5,000,000 tokens/day/project | locked decision | brief L4 |
| AC-5 | per-round tick budget 750,000 | derivation | `<plugin>/templates/tune-presets.json:89` `unattended.tick_budget` (journeys J1: "from the existing unattended preset, not a new number") |
| AC-5 | overrun 2k ≥ 3N; TT ≥ TB; MB ≥ TB × ceil(N/2) | derivation | `<plugin>/hooks/lib/mission-budget.sh:38–46, 73–83, 107–112` (the hook's own arithmetic; parity fixture pins it) |
| AC-5 | idle backoff 5 → 15 → 60 min; ≤ 4 operate cycles/day; none after an empty one | locked decision | memos § Counsel (financial) — adopted by L1 ("daily cap + idle backoff + no-progress stop") |
| AC-5 | crash backoff 30 s → 2 → 8 → 15 min; stop on the 3rd consecutive crash | locked decision | memos D2 "Crash loop (gap 6)" |
| AC-5 | no-progress stop after 2 consecutive | locked decision | memos § Counsel (technical) 3 ("a no-progress exit with a 2-in-a-row stop") |
| AC-5 | usage = input + output + cache_creation + cache_read from the `result` event | derivation | `<plugin>/tools/run-claude.mjs:286–324` `parseStream` (the stream-json fields it already mines); `commands/mission.md:306–308` ("from the Agent result's usage, or a distillate's usage input + output") |
| AC-6 | state dir `$(git rev-parse --git-common-dir)/agentic-workflow/runner/`, 0700, files 0600 | derivation | `<plugin>/hooks/lib/handoff-lib.sh:100–117` (private state under the git dir; `--git-common-dir` so worktrees share — the provider-adaptive precedent); OQ-3 |
| AC-6 | `round:` line shape and the closed outcome set | locked decision | journeys "The round summary line" (+ `no-progress`, `daily-cap` added for the two new exit codes; `compacted` for managed sessions, journeys J2) |
| AC-6 | `v=<plugin>/<cli>` per round | locked decision | memos D1 gap 10 ("each round row records `plugin_version` and `claude --version`") |
| AC-7 | the seven redaction shapes | derivation | `<plugin>/hooks/lib/handoff-lib.sh:225–234` `hl_redact` |
| AC-7 | exact-value scrub keyed on env NAMES matching `/(TOKEN\|SECRET\|KEY\|PASSWORD\|CREDENTIAL)/i`, values ≥ 8 chars | assumption | memos D2 "exact-value scrub of every secret in the project env" names no selector; the name pattern is the planner's — the security pass (AC-24) may widen it |
| AC-7 | negative-test canaries `sk-…`, `ghp_…`, `xoxb-…`, `Bearer …` | locked decision | memos D2 "Negative test"; journeys missed-state 11 |
| AC-8 | per-client subscription; no account check; `75 auth-expired` + alert; no API-key path | locked decision | brief L3 (2026-10-27, owner verbatim "I will provide a dedicated subscription per client" and "no need to check which account the client runs on") |
| AC-4, AC-6, AC-10, AC-17, AC-18 | context rebuilt ONLY from `docs/product/` + `.plans/` ledgers + register + handoff; a progressed round that wrote none of them → `22 no-record`; mismatch always reported: intent → doc wins (fix code or gate), behaviour description → code wins (update doc) | locked decision | brief "Source of truth" + "Docs vs code" (owner 2026-10-27, verbatim "the source of truth is the docs"); `hooks/lib/compact-resume.sh:250` already forbids proceeding on the summary alone |
| AC-8 | `runner.json` location `<project>/.claude/runner.json` (committed, non-secret) | assumption | memos D6 names `templates/runner-config.json` + "files the workflow already owns: `.claude/settings.json` and §10 rows"; OQ-2 |
| AC-8 | child env strips `ANTHROPIC_API_KEY`/`ANTHROPIC_AUTH_TOKEN`; `FORBIDDEN` argv | derivation | `<plugin>/tools/run-claude.mjs:260–269` (`childEnv`, `FORBIDDEN`); this repo's §10 Background-commit-review row (login must not be shadowed by a key) |
| AC-9 | child env `AGENTIC_WORKFLOW_UNATTENDED=1`, no `AGENTIC_WORKFLOW_CHILD` | locked decision | memos D3 "Mode signal" + D1-A step 2 |
| AC-10 | parent never reads > 60 lines; ≤ 2 lines per wake | derivation | memos D7-B "Rule for `commands/run.md`: the parent never reads large files" + D1-A step 3 (≤ 1–2k tokens per round); 60 lines is the planner's bound |
| AC-10 | per-round terminal lines | locked decision | journeys J1 table (systemd/API-key words removed per L1/L3) |
| AC-11 | unattended fails closed, never open; `continue:false` JSON or marker fallback | locked decision | memos D3-B (incl. "the fallback is for the gate to drop a marker file and the runner to kill the child"); AC-2(e) picks |
| AC-11 | J3 texts (block line, 5-block line, ledger reason, notify ladder 1/2/3) | locked decision | journeys J3 table |
| AC-11 | `HL_FAIL_OPEN=6` (5 blocks) | derivation | `<plugin>/hooks/lib/handoff-lib.sh:79` |
| AC-12 | managed J2 copy | locked decision | journeys J2 table; memos D3-B "Managed" |
| AC-13 | window precedence env → settings `env` → `autoCompactWindow` → default | derivation | memos D7 "Gap found" + the Claude Code precedence it cites (env var wins over `/autocompact`, `--autocompact`, `autoCompactWindow`) |
| AC-14 | `CLAUDE_CODE_AUTO_COMPACT_WINDOW=200000` in project settings `env` | locked decision | brief L1 ("compaction at 200k … via project settings `env`"); memos D7-B (bands ≈ 133k / 161.5k / 190k at PCT 95 — AC-1 confirms PCT) |
| AC-14 | adopt-never-overwrite | derivation | `<plugin>/commands/bootstrap.md:114–119` (attribution key precedent) |
| AC-15 | the 15 ask sites | derivation | `grep -n AskUserQuestion <plugin>/commands/*.md` (2026-10-27): mission 46/128/178, plan 21/57, next 81, autopilot 42/73, publish 23/56/75, brainstorm 18/44, groom 68/105; setup commands excluded by purpose |
| AC-16 | plugin-root read approval (conditional) | locked decision | memos "Borrowed concepts — EGM" (narrowly-scoped, deny/ask rules still win) |
| AC-17 | seed shape and exact/semantic field classes | locked decision | metrics §4 table; memos D4-A |
| AC-17 | red fixtures (4 + the window mismatch) | locked decision | memos D4-A "Red fixtures" + D7 "The fidelity test needs a case for this" |
| AC-18 | model job `workflow_dispatch` only; `haiku`; skip without secret | locked decision | brief L1 ("model job on `workflow_dispatch` only"); memos D4-B (Haiku = the owner's floor); OQ-4 names the secret |
| AC-19 | gate id `G-<project>-<4 hex>`; row before send; outbox; receipt | locked decision | `docs/WORKFLOW.md:1197–1232` §12 rules 3 + multi-project; memos D5 core |
| AC-19 | TTL 72 h, reminders 24 h / 48 h | locked decision | brief L1 ("72h expiry"); memos D5 "Timeouts (gap 2)" |
| AC-19 | expiry semantics (reject vs closed-expired + new gate) | open question | memos ("Expiry counts as reject") vs journeys J4 ("Never auto-approve, never auto-reject-and-proceed"); OQ-1 |
| AC-19 | reply grammar `yes \| no <reason> \| hold`; junk hint; duplicate receipt | locked decision | journeys J4 |
| AC-19 | Slack read = `conversations.replies` + `reactions.get`; Telegram = `getUpdates` | derivation | `docs/WORKFLOW.md:1187–1196` §12 rule 1 + `commands/connect.md:97–103` (reactions verified against `SLACK_OWNER_ID`) |
| AC-20 | owner-only classes `merge`(prod) `deploy` `spend` `publish` `kill` `scope`; client may get `decision`, `staging-merge` | locked decision | brief L2; memos D5 "Who may answer (gap 4)" (spend/kill/scope owner-only always) |
| AC-20 | approver ids live in `runner.json`, tokens by env NAME | locked decision | journeys voice rules ("Messages name the env var, never its value"); §12 rule 2 |
| AC-21 | the blocked command shapes | derivation | `hooks/hooks.json:83–93` merge-guard (fail-closed wrapper shape); memos D5 ("A PreToolUse rule denies `gate.mjs answer\|record` from model Bash") |
| AC-25 | README / runbook / doctor text | derivation | journeys J1/J4 lines (install-free subset); metrics §2 per-round fields |
| AC-26 | version 1.70.0 | derivation | `<plugin>/.claude-plugin/plugin.json` `1.69.1` + L5 (this mission runs before the 2.0.0 rebrand) |
| AC-27 | OB-35, OB-36, OB-37 | derivation | `.plans/OBLIGATIONS.md:74` ends at OB-34; `ledger.mjs promote` assigns the next free id at close |

## Locked decisions

- 2026-10-27 (owner, brief L1–L5) — **L1** "Safe v1, 6 sessions": one
  command `/agentic-workflow:run`; thin parent + fresh `claude -p` child per
  unit; idle by a background `runner.mjs wait` (no CronCreate watchdog); the
  agent writes its own handoff (mode-aware gate; unattended ends the round
  cleanly, never killed by a builder subagent's band); compaction at 200k via
  project settings `env` with `hl_threshold` honouring the effective window;
  daily cap + idle backoff + no-progress stop; every inline HITL ask in
  `commands/` becomes a gate under `-p`; fidelity test (structural in CI +
  naive-reader; model job on dispatch only); gates answered ONLY through a
  channel and verified at the source; owner or client channel per project;
  a 1-hour spike + P0 probes (OB-32 first); the 24 h run. **Deferred, never
  revisited in this mission:** systemd/LXC install script, the relay Claude
  session, any in-session or local-file answer surface, container
  provisioning, fleet dashboard, cross-client sharing, per-client billing.
  **L2** a verified channel "yes" may approve decisions and merges to
  staging; production merge, deploy, spend, publish stay owner-fired. **L3**
  a dedicated claude.ai subscription per client; children reuse whatever
  login the container has; NO account check; expiry → `75 auth-expired` +
  alert; no API-key path in v1. **Source of truth is the docs** (owner,
  verbatim): every round and resumed session rebuilds context only from
  `docs/product/`, the `.plans/` ledgers + register and the handoff — never
  a transcript, compaction summary or memory folder; a round writes what the
  next round needs into those files before it ends. **Docs vs code** (owner-approved): a mismatch is always reported, never silently resolved — intent (locked decision, AC, rule) → the doc wins, the code is the bug (fix it, or open a gate before a decision changes); a description of current behaviour (path, threshold, how a hook/tool works) → the code wins, the doc is stale (update it). **L4** 5M tokens/day/project. **L5** next mission;
  Fable checkpoint per phase + a security pass; the owner merges.
- 2026-10-27 (architect memos, as far as L1 allows) — D1-A (thin parent,
  unit selection, exit contract; C's systemd deploy NOT built); D2 locks,
  stop file, crash-loop ladder, log redaction + negative test (the cron
  watchdog struck by counsel/L1); D3-B (mode-aware gate, unattended fails
  closed); D4-C (structural always-on + dispatch-only model job); D5 core +
  option A channel-only (B relay and C's in-session surface struck by L1 and
  counsel 1; `gate.mjs answer` local fallback struck — gap 5's outage answer
  is the outbox alone); D6-A zero-install (B's installer deferred); D7-B
  (200k parent window, bands move with it, parent write-ahead handoff).
- 2026-10-27 (owner, L1) — **Estimate: 6 sessions**, S0–S5, one per phase;
  the six Fable checkpoints and the security pass are one-shot spawns INSIDE
  their sessions (not counted); a corrective `S<n>-fix` is counted when it
  fires.
- 2026-10-27 (planner, decomposition of L1) — **one branch**
  `feat/continuous-operation`, phases in sequence, ONE feature PR to `main`
  after S5's checkpoint; the ledger's `Next up:` line (not a glyph) gates S1
  on OB-32 being fired — AC-1 is the mission's first beat.
- 2026-10-27 (planner, decomposition of L1 + counsel 4) — the HITL-ask
  audit lands in S2 against the EXISTING `tools/ask.mjs` verb (so no command
  waits on a human under `-p` from S2 on) and S4 edits only the one
  canonical paragraph to name `gate.mjs open --class decision`; the 15 ask
  sites carry a pointer sentence, never a restatement (`checkRuleDedup`).
- 2026-10-27 (planner, decomposition of D3-B + counsel 4) — the unattended
  gate NEVER fails open; the exact stop mechanism (`continue:false` JSON vs
  the marker file) is chosen by AC-2(e)'s observed fact and recorded in the
  brief's probe record before S2; both texts are drafted in S2's brief, one
  is struck.
- 2026-10-27 (planner) — the runner's ONLY ledger write is the
  `handoff-failed` deviation line (AC-11); every other ledger beat stays with
  the orchestrator child via `tools/ledger.mjs`. The runner never edits
  `.plans/*.md` otherwise, never commits, never pushes.
- 2026-10-27 (planner) — `tools/conform.mjs` gains no rung and the
  SessionStart hooks gain no group for the runner this mission (the
  compaction-window row is written by bootstrap/sync and checked by
  `/doctor`; a conform rung is a later `/fix` if drift shows).
- 2026-10-27 (planner) — the **only new refusing hook** is `gate-guard.sh`
  (AC-21) plus, conditionally, the allow-only `plugin-read.sh` (AC-16); no
  other `Bash(...)` rule, execpolicy line or refusing hook is added. The
  `codex.rules` prefix rule mirrors gate-guard so a codex-routed role cannot
  answer a gate either.
- 2026-10-27 (planner) — `tools/headless.mjs run` is refactored onto the
  runner core (`roundOnce()`), not duplicated; its CLI, `.claude/headless.json`
  and the ask.mjs answer page are unchanged (`ccp run` remains the
  owner-at-keyboard headless loop; `/run` is the unattended one).
- Assumed 2026-10-27 (planner) — a background Bash tool result wakes the
  parent as a new turn with no prompt (memos D1-A step 3 cites the `/goal`
  doc). **AC-2(c) decides**; `commands/run.md` carries the foreground
  `--max` fallback text and the probe strikes one. Never cite as proven
  before the probe row exists.
- Assumed 2026-10-27 (planner) — `claude -p --max-budget-usd <n>` is the
  flag spelling and `error_max_budget_usd` the result subtype
  (`run-claude.mjs:428` expects it). AC-2(f) confirms before S1 uses it as
  the per-round USD backstop; until then the backstop is `--max-turns` only.
- Assumed 2026-10-27 (planner) — `.claude/settings.json` `env` reaches hook
  subprocesses (memos D7 "Assumption, verify in P0"). AC-2(a) decides; if it
  does NOT, AC-13's settings-file read is what makes the bands honest and
  the §10 row says the env var must also be exported for the hooks.
- Ceremony: this repo's profile is `proposed` → every gate `required`:
  plan-judge, phase-reviewer (Fable, `security-boundary`: `hooks/`, `tools/`,
  `templates/`, `hooks.json`, `codex.rules` — `templates/gate-classes.md:32`),
  staging-verify (lint + `claude --plugin-dir` load), chronicler,
  mission-close.

## Risks

- **P0 depends on the owner's machine and wall-clock** (OB-32 needs
  orderly-agents and a session run to compaction). → S0 is the first beat
  and its `Next up:` line gates S1 on the OB-32 `· fired` evidence; the probes (a)–(f) run on any machine with
  the plugin installed and are recorded even if OB-32 slips a day. Nothing
  in S1 compiles against OB-32's result except the two constants.
- **Two load-bearing facts are unverified until S0** (background wake,
  `continue:false` under `-p`). → each has a drafted fallback in the plan
  (foreground `--max` loop; marker file + `--max-turns`) so S1/S2 never
  block on a probe result; the probe only chooses which text ships.
- **"Docs are the truth" can be stated but not forced on a model.** → the
  round prompt names the only sources, the exit contract downgrades a round
  that recorded nothing (`22 no-record`), and the fidelity test's docs-only
  fixture makes a transcript- or memory-sourced next step fail; the 24 h run
  counts owner corrections about lost context (metrics D5).
- **`templates/WORKFLOW.md` is 4,134 B under its 120,000 B budget**
  (`tools/lint.mjs:1049–1072`). S2 (§5 rule + §6.2 pointer + §10 row) and S4 (§12 + §10
  clause + gate-classes) must fit ≤ 2,500 B and ≤ 1,400 B respectively. →
  the briefs carry byte ceilings; if a phase cannot fit, trim the §12
  multi-project paragraph's Telegram prose first (≥ 600 B available), never
  a rule body; S5 Verify prints `wc -c`.
- **Self-approval by shape** (counsel 1) — a UserPromptSubmit cannot tell a
  typed prompt from a scheduled fire; a local file is writable by the same OS
  user. → there is no local or in-session answer path at all (AC-19), the
  gate-guard hook blocks the write shapes (AC-21), the security pass
  red-teams it (AC-24), and `gate-test.mjs` has no case that answers a gate
  without a transport reply.
- **Idle burn** (counsel, financial). → daily cap, idle backoff, ≤ 4 operate
  cycles/day, no-progress stop, `wait` with zero model turns (AC-5); the 24 h
  run's `tokens=` lines are the first real number (OB-35).
- **The gate kills a round because a builder subagent hit the band** (counsel
  4). → AC-11's subagent rule + AC-2(e)'s observed behaviour; hook-test
  covers an `Agent` tool call at urgent not producing the stop.
- **Two unattended loops drift** (`headless.mjs run` vs `/run`). → one core
  (`roundOnce()`), `headless-test.mjs` stays in lint.
- **Parity between the hook's and the runner's budget arithmetic**. → the
  shared-fixture test (AC-5 ii) runs the same ledger through both.
- **Secret leak via crash tails or alerts.** → `redact.mjs` on every
  surfaced byte + the negative test with five canaries + `gate-test.mjs`'s
  `SECRET` grep + the security pass; the events log is 0600 and never read
  by the parent.
- **`hook-test.mjs` is 2,579 lines and grows by ~150.** → ranged reads only
  (`:57` runHook, `:2236–2372` AC-3 block, `:2373–2396` bands); new cases
  go in a NEW block after the child-silence block (`:2532–2546`), before
  `:2547` (never inside a `withDir`), with its own `// ──` header so the file
  stays greppable.
- **No review between phases except the in-session checkpoints.** → each
  session ends only on `node tools/lint.mjs` clean (which runs every
  harness), and each next session starts from the previous tool's `--help`
  header, never by exploring.

## Open questions

- **OQ-1 — gate expiry semantics (AC-19).** Memos: expiry counts as
  reject. Journeys: expired = nothing happened, ask again, never
  auto-reject-and-proceed. **Recommendation:** at 72 h the row closes
  `expired` (no decision recorded, nothing proceeds); the next round that
  needs the decision opens a NEW gate with a new id and a line "re-asking:
  gate <old> expired on <date>"; a `no` is only ever a human's word. This
  keeps "never self-approve" and "never idle for days on one nonce".
- **OQ-2 — where the project config lives (AC-8, AC-20).** `.claude/runner.json`
  (committed, one JSON, schema in `templates/runner-config.json`) vs new §10
  rows for approver ids, budgets. **Recommendation:** the JSON file
  — it is machine-read by `runner.mjs`/`gate.mjs` on every tick and a
  markdown table cell is the wrong shape for an id list; §10 gets ONE row
  (**Runner**: `configured (.claude/runner.json, route
  <owner|client>)`) so `/doctor` and `conform` can see it.
- **OQ-3 — runner state dir (AC-6).** Under the git common dir
  (`agentic-workflow/runner/`, beside the handoff state) vs
  `${XDG_STATE_HOME}` vs `/var/lib`. **Recommendation:** the git common dir
  (one project = one checkout on a client container; worktrees share it;
  never tracked; the handoff machinery already lives there), XDG fallback
  outside a work tree exactly as `hl_paths` does.
- **OQ-4 — the model job's credential (AC-18).** A repository secret
  `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`, 1-year, model
  requests only) on this plugin repo's CI — not a client container, so L3's
  "no API-key path" is not crossed. **Recommendation:** yes, `workflow_dispatch`
  only, skip-green when absent; the owner creates the secret when they want
  the job to run; never on a PR trigger.
- **OQ-5 — build branch base.** `feat/continuous-operation` from
  `plan/continuous-operation` (so the four decision docs + the P0 probe
  record ride the build branch), as provider-adaptive's OQ-3 did.
  **Recommendation:** yes.

---
_The `.plans/continuous-operation.sessions.md` briefs execute these tasks;
`.plans/continuous-operation.state.md` tracks progress. Resolve every open
question before execution starts._
