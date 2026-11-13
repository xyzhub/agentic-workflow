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

**Proposed 2026-11-12 (replan, not locked): 8 sessions** — the six briefs
plus `S1b` and `S4b` (same briefs-only counting). `Estimate: 6` stands in the
ledger until the owner locks the raise (OQ-6); see `## Replan 2026-11-12`.
Run order: `ckpt-s0` → S1 → S1b → S2 → S3 → S4 → S4b → S5.

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
     consecutive `22` → `30 no-progress` + alert. Daily-cap and
     ledger-budget stops re-check on every `next` (the UTC rollover clears
     the cap) instead of writing `STOP`; every other stop, including
     classify's `budget-stop`, writes `STOP` (reason + UTC) and nothing runs
     until `resume` (ckpt-s1 S1-fix, 2026-11-13).
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
     rules `round` passes via `--append-system-prompt` (the prompt itself is
     the unit slash command alone) tell the child to rebuild context ONLY from
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
     **Amended 2026-11-13 (goldfish G5):** the round prompt shape (the slash
     command alone; the rules as `--append-system-prompt`) is proven by ONE
     live `runner.mjs round` on a scratch mission (≤ $1) at the start of S1b:
     the command body expanded, the sources rule was obeyed, and a `round:`
     line and the counters were written — recorded as a row of the brief's P0
     probe record. A failed observation stops S1b.
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
     **Amended 2026-11-13 (G6):** `ccp run` keeps its CLI, tick count, ask
     page, messages, exit codes and its ask.mjs note (`roundNote`'s `ask:
     'page'`); from `roundOnce` it takes the lock, the docs-only note, the
     counters and the `round:` line; it no longer renders a tick live
     (Assumed 2026-11-13). `headless-test.mjs` had no `run` case, so "stays
     green" proved nothing: the existing checks stay byte-identical and two
     `run` cases are added.
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
     **Amended 2026-11-12 (probe (e), brief `:223`):** the JSON stop is
     struck — `continue:false` did not block the tool and left no readable
     subtype. The gate ships the **marker + exit 2** branch only;
     `runner.mjs round` watches for `<state>/<sid>.gate-stop` while the
     child runs, ends the child, and maps it to `21`; `classify` (AC-29)
     maps the same marker, or a LAST `result` event with
     `terminal_reason: "hook_stopped"`, to `21` — never `subtype`.
     **Amended 2026-11-13 (G3):** `hl_unattended()` is true when the variable
     is `1` OR a live round lock exists for the cwd (`<git common
     dir>/agentic-workflow/runner/lock`; the bash port of `lockStale`), and
     it is tested BEFORE the `AGENTIC_WORKFLOW_CHILD` exit in
     `handoff-gate.sh` and `compact-resume.sh` — unattended wins;
     `AGENTIC_WORKFLOW_CHILD=1` alone stays silent. Exit `21` is decided only
     after `record`'s re-hash (a planted marker plus a protected-file edit is
     `30 state-tampered`) and a `21` round is still charged. hook-test: CHILD
     + UNATTENDED → not silent; a live lock with no variable → unattended; a
     dead-pid lock → managed. runner-test: marker + a `daily.json` edit →
     `30`. `run.md` tells a supervisor on the split path to pass
     `--append-system-prompt` from `begin` (G4).
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
     (jq, cwd-relative, missing file → default). Hook-test: a
     settings file with `env` 200000 and no env var → urgent at **141,950**
     tokens; env var wins over the file; a malformed file → default. The
     fidelity test (S3) carries the mismatch case too.
     **Amended 2026-11-12:** "pct unchanged" and "161,500" were computed on
     window × 95 %, which OB-32 disproved; the threshold arithmetic is now
     AC-28's (window − reserve) and every number here follows it.
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
     **Struck 2026-11-12:** probe (b) (brief `:220`) showed no refusal in
     three shapes on 2.1.311 — no `plugin-read.sh`, no hook group. A refusal
     seen in the 24 h run reopens it (OB-35 records it).
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
     **Amended 2026-11-13 (G4, advisory):** path (b) asserts on `roundNote`
     and on `begin`'s JSON (`append_system_prompt` equals the note and names
     the handoff path, `.plans/` and `docs/product/`; `prompt` is the slash
     command alone) — not on `roundPrompt`. The docs-only check reads:
     outside its one "never" clause the note names no transcript and no
     memory folder, and `.remember` appears nowhere. AC-18's
     `fidelity-model.yml` installs an exactly pinned CLI version.
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
     **Amended 2026-11-13 (G1, G6):** (1) *One word:* a gate past its TTL has
     row state `closed-expired` (L6); "`expired`" and "OQ-1 decides" above
     are closed by it. (2) *Binding (G1):* the sent message ends with a
     machine line carrying the gate id, class, nonce and a question hash; on
     first sight of a row `poll` writes an `opened` snapshot to the protected
     answer store and afterwards reads class, nonce, question hash and
     message ids ONLY from it; those values enter the snapshot from the
     bot-authored channel message, never from the row; a reply counts only on
     the snapshot's bot-authored message carrying its gate id + nonce; a
     message id is single-use across gates; a row that disagrees with its own
     message is `void` (one alert, never answerable); the snapshot keeps
     the full 64-hex question hash and its own first-sight time (the TTL
     clock); an `http` gate is posted only by `poll`, so its snapshot is
     what was posted. (3) *Defined in S4,
     documented by S4b:* the `pending-gates.md` row, `answers.jsonl` event
     and `outbox.jsonl` event grammars; exit codes `0 / 1 / 2 / 40`; `hold`
     (blocks, stops reminders and the clock, keeps the nonce; a later yes /
     no answers); `expire` (the TTL pass) and `expire --force <id>` (owner
     shell: close an open gate `closed-expired`); `open` with no channel (row
     + outbox, exit 0, the gate waits); Slack reactions `white_check_mark` /
     `x` / `raised_hand` and Telegram buttons → `yes` / `no` / `hold`; the
     Telegram offset in `<state>/telegram.offset` (protected); `poll`
     delivers `alerts.log` lines to the owner route. Brief § S4 Do 1 holds
     the exact shapes.
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
     **Amended 2026-11-12:** the single `"transport"` key is written from
     the start as `"channels": [{ "kind": "slack" | "telegram",
     "token_env": "<NAME>", "chat_env": "<NAME>" }, …]` (S4), so S4b adds
     the `http` entry of AC-38 without changing the reader; `owner_ids`,
     `client_ids` and `client_may` are unchanged.
     **Amended 2026-11-13 (G6):** each `channels[]` entry also carries
     `"route": "owner" | "client"`; a gate goes to the channels of
     `approver.route`, the owner copy to every `route: "owner"` channel
     (`open` exits 1 on the client route when there is none).
   - AC-21 **No self-approval by shape.** `hooks/hooks.json` PreToolUse Bash
     group (body `hooks/lib/gate-guard.sh`, ≤ 50 lines; placed after the
     merge-guard group `:83–93`): BLOCKS (exit 2) any Bash command whose
     text contains `gate.mjs` followed by `record`, `answer`, `approve`,
     `expire --force` or a write to `pending-gates.md`/`decision-log.md` via
     `>`/`sed -i`/`tee` naming those files; a `gate.mjs open|status` is
     silent. **Amended 2026-11-12 (plan-judge):** `gate.mjs poll` and every
     `runner.mjs` verb except `status` are BLOCKED from Bash when
     `AGENTIC_WORKFLOW_UNATTENDED=1` — `poll` is run only by the runner
     process, never by a round (a round that could run it could feed it a
     fake transport). `templates/codex.rules` gains the matching `prefix` rule with a
     `# covers:` line; `tools/run-codex-test.mjs` cross-check stays green.
     **Prior art:** `hooks/hooks.json:83–93` (merge-guard wrapper, fail
     closed), `hooks/lib/publish-guard.sh`, `templates/codex.rules:150–245`.
     **Amended 2026-11-13 (G3, G6):** the body is ONE file of ≤ 90 lines (the
     50-line cap could not hold the shapes; no second lib file). "Unattended"
     is `hl_unattended` (the variable OR a live round lock), tested before
     any `AGENTIC_WORKFLOW_CHILD` exit. Under it `runner.mjs status`, `stop`
     and `pause` stay open (the `/run` parent needs them while a round is
     live; a round that stops the runner only stops itself) and `gate.mjs
     expire` is blocked; `gate.mjs reconcile` is blocked from model Bash
     always.
   - AC-22 **Tests.** `tools/gate-test.mjs` (new, ~300 lines; a FAKE
     transport on a local `http.createServer` fixture — no network.
     **Amended 2026-11-12:** there is NO `GATE_TRANSPORT_URL` and no flag:
     the transport base URL is a parameter of the exported `poll(deps)` /
     `open(deps)` functions that only the harness passes by importing the
     module; the CLI always uses the real hosts): the matrix route × class ×
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
     **Amended 2026-11-13 (G1, G2):** adds the re-pointed-row case, the
     re-classed-row case (after first sight → the snapshot's class; before →
     `void`), the same-id-different-question case, and: a forged
     `answers.jsonl` line → `30` → `resume` refuses → reconcile → the gate is
     still open. The gate-guard block has thirteen cases (brief § S4 Do 4).
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
     **Amended 2026-11-13 (G4, advisory):** the gate note lands in
     `roundNote` (`ask: 'gate'`, the runner's default; `'page'` keeps the
     ask.mjs note for `ccp run`) — never in `roundPrompt`, which is the slash
     command alone. From an unattended session `/connect approver` writes
     nothing: it prints an owner-run shell line (`gate.mjs approver --set
     …`), the `resume` pattern.
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

7. **Replan 2026-11-12 — additions to P1 and P2 (S1, S2).**
   - AC-28 **`hl_threshold` = window − reserve (S2; the OB-32 finding).**
     `handoff-lib.sh:70–71`: `HL_DEFAULT_PCT=95` is replaced by
     `HL_DEFAULT_RESERVE=33000`; `hl_threshold` (`:180–186`) returns
     `window − reserve` (a window ≤ the reserve is invalid → the next source
     in AC-13's precedence); an explicit, valid
     `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` keeps today's `window × pct / 100`
     (`:181–183`, unchanged). The 70 / 85 band constants are untouched and
     apply to the new threshold. At 200,000: threshold 167,000, advisory
     116,900, urgent 141,950. At 400,000: 367,000 / 256,900 / 311,950. At
     the 1,000,000 default: 967,000 / 676,900 / 821,950. Every place that
     states the old rule moves with it (planner grep, 2026-11-12):
     `handoff-lib.sh:28–31` and `:71`; `handoff-budget.sh:15–16` (comment);
     `hooks/hooks.json:43` (description "1000000 × 95%");
     `templates/WORKFLOW.md:280` ("assumed 1,000,000 × 95% when unset" —
     replaced at the same byte count ± 10); `tools/hook-test.mjs:2097–2099`
     (`THR = 950_000`), `:2158` (the constants assertion), `:2387–2388`
     (the band fixtures: the 400k literals 323,000 / 322,999) with their
     check text at `:2393`, and `:2403–2405` (665,000 / 807,500 /
     "950000-token") — measured after the `main` merge (bf90c06). This is the
     constants fix AC-1 owed; it lands in S2 beside AC-13 (one function, one
     test block) — no round runs before S2, so nothing depends on it sooner.
   - AC-29 **Round logic without a spawn (S1).** `runner.mjs` exposes the
     round as four steps a wrapper can drive itself, and `round` is nothing
     but their composition: `next --json` (unchanged preflight, never starts
     a model); `begin --json [--holder <id> --lease <s>]` (takes the lock,
     allots the round number, snapshots the ledger's `Next up:` /
     `Sessions used:` and the open-gate count into `rounds/<n>.begin.json`,
     prints `{contract_version, round, unit, prompt, append_system_prompt,
     env, events_path, state_digest}` — `prompt` is the unit slash command
     alone, `append_system_prompt` the round rules, `env` the exact child
     environment additions the caller must apply);
     `classify --round <n> --events <file> [--exit <code>] --json` (pure, no
     lock, no spawn: maps a finished turn to the exit contract of AC-4 —
     `{contract_version, round, code, outcome, reason, tokens, session_id}`
     — using the usage sum of AC-5, the docs check of AC-6, the auth texts
     of AC-8, the handoff marker of AC-11 and the begin snapshot);
     `record --round <n> --from <classify.json>` (the one update under the
     lock: `round:` line, `daily.json`, `backoff.json`, the AC-11
     `handoff-failed` line when the code is `21`, then releases the lock).
     A lock taken with `--holder` is stale when its lease has passed (no pid
     to probe); a pid lock keeps AC-4's dead-pid rule. The shapes are frozen
     in `<plugin>/templates/runner-contract.schema.json` (`contract_version:
     1`, strict, the `agents-registry.schema.json` precedent) and
     `runner-test.mjs` validates every `--json` output against it and proves
     `round` and `begin` → fake turn → `classify` → `record` write the SAME
     `round:` line for the same fixture. No name of any wrapper appears in
     the tool.
     **Amended 2026-11-13 (owner; ckpt-s1 finding S3):** there is no retry
     mark and no quiet retry — `recordMac`, `rounds/<n>.recorded` and the
     "already recorded" answer are deleted in S1b's carry-in step; a repeated
     `record` ends `30 state-tampered` with the day forfeited, and a planted
     mark changes nothing (one runner-test case). `classify`'s output gains
     `advisor_off` (AC-33).
   - AC-30 **Login check is skippable when the caller supplies the account
     (S1).** `runner.json` gains `"auth": "login" | "external"` (default
     `login`; `next --auth external` overrides for one call). `external`
     skips only the "login present" preflight and is accepted only on the
     split path (`next` / `begin` / `classify` / `record`); `round` under
     `external` refuses with a usage error, so the runner's own child is
     still launched from the container's login with the two key variables
     deleted — AC-8 and L3 are unchanged. `classify` maps an
     authentication failure of ANY account kind to `75` only when BOTH
     hold, as `run-claude.mjs:398` does: the turn did not succeed (no
     `result` event, or its `subtype` is not `success`) AND stderr or the
     result text matches the auth pattern (AC-8's plus `invalid api key`).
     A successful turn that merely mentions "authentication" or "401" is
     never `75`.
   - AC-31 **Per-project credentials preflight (S1; brief L7 `:250–255`).**
     `next` refuses to start a round when the project has no GitHub token
     or no working signing configuration, with ONE plain line naming what is
     missing (names only, never a value): signing = `git config
     commit.gpgsign` is `true` and `user.signingkey` is set; token =
     `git identity token` succeeds when that tool is on PATH, else `GH_TOKEN`
     is non-empty. Exit `75`, outcome `creds-missing` (added to AC-6's
     closed set). The child's `gh` calls take the token the same way
     (`git identity token`, else `GH_TOKEN`) — stated in the round prompt.
8. **P1b — the launch layer: advisor, tune contract, `headless.mjs` (S1b).**
   - AC-32 **Advisor probe first — only what is still unobserved.**
     Already known (see the `Assumed` line in Locked decisions): the
     option is `--advisor <model>`; it is deliberately not in `claude
     --help`; `-p` needs Claude Code ≥ 2.1.260; `claude -p --model sonnet
     --advisor fable …` launched and exited 0 on 2.1.322. S1b opens by
     appending `## Advisor probe record (2026-…)` to the brief (after L7)
     with verbatim invocations and observed output for the five things no
     one has seen: (i) ONE completed consult under `-p` on a real task,
     and what in the stream-json shows the advisor was attached and
     called; (ii) the exit code and stderr of each launch-time rejection
     the documentation lists that can be produced without changing the
     owner's account (an advisor model that cannot advise; a main model
     that does not support one) — the Fable-consent case is `could not
     verify` unless the account is already in that state; (iii) whether an
     Agent-tool subagent inside that child consults (the documentation
     says subagents inherit); (iv) whether advisor tokens appear in the
     LAST `result` event's `usage` / `modelUsage`; (v) whether a launch
     with NO `--advisor` still gets an advisor from the user's
     `advisorModel` setting, and that `CLAUDE_CODE_DISABLE_ADVISOR_TOOL=1`
     in the child env stops it. Plus `claude --version`. **If (i) cannot
     be made to succeed under `-p`, AC-33, AC-34 and AC-35's doctor and
     consult parts are struck in the hand-off with the row cited** — the
     corrective-retry measure and the `headless.mjs` step still ship.
   - AC-33 **Launch, cap and fallback.** Two launch sites, Claude engines
     only: the round child (`runner.mjs begin`/`round`, from `runner.json`
     `"advisor": { "model": null, "max_context_tokens": <n> }`, default
     off) and a role launched as its own `claude -p` (`run-claude.mjs`
     `buildArgv` `:236–257`, from the role's effective `advisor`, AC-34).
     `--advisor <model>` is always passed together with an explicit
     `--model <main>` (owner 2026-11-12: the pairing is checked against
     the main model, so it is never left to a default). **Off means
     off:** a launch without an advisor sets
     `CLAUDE_CODE_DISABLE_ADVISOR_TOOL=1` in the child env, so a user-level
     `advisorModel` cannot attach one behind the runner's back. Claude Code
     has no per-call cap, so the cap is **per launch**: a launch that
     resumes a thread (`--resume`) whose last reported input side is above
     `max_context_tokens` goes WITHOUT an advisor (each consult re-reads
     the whole transcript uncached). A launch that exits with one of the
     documented launch errors (probe row (ii)) is retried ONCE without the
     advisor and the round line carries a trailing `adv=off(<reason>)`; a
     normal round carries `adv=<model>` (requested and launched) or
     `adv=off`. A pairing the API refuses produces no error — Claude Code
     silently continues without the advisor — so `adv=<model>` means
     "requested", and `/doctor` reports "attached" only from the signal
     probe row (i) found. If probe row (iv) shows advisor tokens in the
     reported usage they count toward AC-5's daily cap with no change; if
     not, `status` and the README say the cap excludes them.
     **Amended 2026-11-13 (G6, advisory):** `maxAdvisorContext` =
     `--advisor-max-context` > `runner.json` `advisor.max_context_tokens` >
     100,000 (OQ-10); the resumed thread's input side is passed as
     `--resume-input <n>` (the prior distillate's `usage.input_tokens`), and
     a resume without it launches with no advisor. `adv=` is the round line's
     LAST field, after `v=`. `classify` reports a launch rejection as
     `advisor_off: <reason>`. `tokens` = the larger of the `usage` sum and
     the `modelUsage` sum, so advisor tokens count into `tokens=` and the
     daily cap wherever probe row (iv) found them; the "cap excludes them"
     sentence above applies only if the row shows them in neither.
   - AC-34 **`advisor:` tune field — a wrapper contract.**
     `commands/tune.md` gains `/agentic-workflow:tune <agent> advisor
     <model>|off` (after the effort section `:114–125`; banner kind
     `advisor`; refused for a codex runtime, and for a pairing the
     documentation or probe row (ii) says is rejected at launch — the
     refusal quotes its source; no other pairing rule is invented). `tools/agents.mjs` reports
     `effective.advisor` (string or null) and lists `advisor` in an
     override's `kind`; `templates/agents-registry.schema.json` gains the
     property in `effective` (`:27–41`, added to `required`) and in the
     `kind` description (`:49`); `tools/agents-test.mjs` covers unset →
     null, a shadow value, and schema validation. No preset row sets it
     (`tune-presets.json` unchanged). The registry JSON is a public
     interface a wrapper validates strictly, so this is the minor bump
     1.70.0 already carries plus its own CHANGELOG line (AC-41).
   - AC-35 **Consult before done, doctor row, corrective-retry measure.**
     The four builder roles (`agents/backend.md` `## Done means` `:46`,
     `frontend.md` `:89`, `security.md` and `devops.md` `## Verify, then
     hand off` `:40`) gain ONE sentence: when an advisor tool is available,
     consult it once before reporting done. `commands/doctor.md` §1 gains
     an **Advisor** bullet after Runtimes (`:42–54`): off / on with the
     model per site / 🟡 when the last launch fell back, with the reason.
     Measure: a ledger header line `Correctives: <int>` under `Reviewer
     runs:` (`templates/mission-state.md:18`), bumped by the orchestrator
     with a new `ledger.mjs <mission> correctives +1|=N` verb
     (`reviewer-runs` shape, `ledger.mjs:46`, `:172`) where
     `commands/mission.md` starts a corrective (`:172–176`, `:275`); the
     verb refuses when the line is absent, as `reviewer-runs` does. The
     rate is `Correctives ÷ Sessions used`, compared between missions run
     with the advisor on and off. The runner never writes it (the
     "only ledger write" lock stands).
     **Amended 2026-11-13 (G6):** `/doctor` reads "the last launch fell back"
     only from `adv=off(<reason>)` on the last `round:` line; roles are
     reported as configured. An existing ledger gets `Correctives: 0` the way
     it got `Reviewer runs:` — the verb refuses and names the line to add; no
     migration.
   - AC-9's last clause (`headless.mjs run` on `roundOnce()`) is built here,
     not in S1.
9. **Replan 2026-11-12 — gate additions: delegation part 1, a generic server channel, a frozen contract (S4, S4b).**
   - AC-36 **Every gate record is born with the delegation fields (S4).**
     `gate.mjs` rows in `.plans/pending-gates.md` and the decision-log row
     carry: `type` (`direction | money | publish | release | fact | other`;
     `open --type <t>`, else derived from the class — `merge`,
     `staging-merge`, `deploy` → `release`; `spend` → `money`; `publish` →
     `publish`; `scope`, `kill` → `direction`; `decision` → `other`);
     `answerer` (always `owner` in S4 — whose authority the gate is
     under); `source` — WHO actually answered: `owner via <channel>:<message
     id>` when the verified sender is in `owner_ids`, `client via
     <channel>:<message id>` when the sender is in `client_ids` and the
     class is in `client_may` (AC-20) — a client's answer is never recorded
     as the owner's; `rule:<id>` and `agent:<name>` are reserved; `proof`
     (`channel-identity:<transport user id>` for Slack and Telegram);
     `predicted` and `predictor` (empty); and `nonce` — 16 random bytes,
     hex, made by `open` (`crypto.randomBytes(16)`), stored on the row and
     sent with the gate; it is the single-use token AC-19 "consumes": the
     first valid answer marks it used in the answer store, and any later
     answer for the same nonce gets the "already answered" receipt.
     The transports sit behind ONE channel interface `{ name, send,
     fetchReplies, verify, receipt }`; `verify` returns `{ user, proof }` or
     nothing, and a reply without a proof is never an answer. Slack and
     Telegram are two implementations of it.
   - AC-37 **Owner-written policy and shadow predictions (S4b).**
     `.claude/gate-policy.json` (optional, committed, owner-written; schema
     `<plugin>/templates/gate-policy.schema.json`): per type `{ "answerer":
     "owner" | "rule" | "agent:<name>", "limits": <object>, "rules":
     <array> }` — `limits` and `rules` are **reserved and opaque in v1**:
     the schema accepts any object / any array, `gate.mjs` stores and
     shows them but never reads inside, and their inner shape is NOT part
     of contract version 1 (Part 2 defines it with a version bump). No
     file, or no entry for a type → `owner`. `gate.mjs policy show` prints
     the resolved table. **v1 never auto-answers:** an entry other than
     `owner` is validated and shown, the row records `answerer: owner
     (policy <x> not enabled in this version)`, and the gate goes to the
     owner (OQ-9). A policy entry can never name a non-owner answerer for a
     gate whose class is `merge`, `deploy`, `spend`, `publish`, `kill` or
     `scope` — that is a validation error (L2). `gate.mjs predict <id>
     --answer <yes|no|hold> --by <name>` writes `predicted` / `predictor`
     on an OPEN gate only, never changes its state and is never read by
     `poll`; when the owner answers, the row keeps both, so agreement per
     type is countable from the first gate. No predictor ships.
   - AC-38 **A generic server channel with owner-answer proof (S4b).** A
     third channel implementation, `http`, configured in `runner.json`
     `approver.channels[]` as `{ "kind": "http", "url_env": "<NAME>",
     "token_env": "<NAME>", "owner_keys": [{ "id": "…", "ed25519":
     "<public key>" }], "client_keys": […] }`. `send` = `POST
     <url>/gates` with the gate record (including its `nonce`);
     `fetchReplies` = `GET <url>/gates/<id>/answers` → `[{ answer, reason,
     answered_at, key_id, signature }]`; `verify` accepts an answer only
     when `signature` is a valid ed25519 signature (`node:crypto`, zero
     deps) by a listed key over the UTF-8 bytes of
     `JSON.stringify([id, nonce, class, q, answer, reason, answered_at])`
     (the seven-element form — amended 2026-11-13, see below) — a JSON
     array, so a newline or any other character in `reason` cannot make
     two different answers sign the same bytes (`reason` is `""` when
     absent; `answered_at` is the ISO-8601 UTC string as sent).
     Encodings: a public key is the raw 32-byte Ed25519 key in base64url
     without padding (the JWK `x` value; loaded with
     `crypto.createPublicKey({ key: { kty: "OKP", crv: "Ed25519", x },
     format: "jwk" })`); a signature is the raw 64 bytes in base64url
     without padding. `proof` =
     `signature:<key_id>`; `receipt` = `POST <url>/gates/<id>/receipt`. An
     unsigned answer, an unknown key or a bad signature is ignored, logged
     and alerted once — exactly the unlisted-sender path of AC-19. A gate
     is sent on every configured channel; the first valid answer consumes
     the nonce and the others get the receipt. The server is trusted to
     carry bytes, never to say who answered: a process that holds the
     bearer token still cannot answer. Nothing here names an app.
     **Amended 2026-11-13 (G1 — before AC-39 freezes the form):** `class` and
     `q` (the 64-hex sha256 of the question as sent in `POST /gates`) are in
     the signed array and are taken from the `opened` snapshot, never from
     the answer body or the row. A gate re-posted with another text or class
     cannot be answered (a gate-test case).
   - AC-39 **Frozen `gate.mjs` contract (S4b, after AC-36..AC-38 exist).**
     `<plugin>/templates/gate-contract.schema.json` (`contract_version: 1`,
     strict): the `open --json`, `poll --json`, `status --json` shapes
     (`status --json` is the read-only projection a wrapper lists: id,
     class, type, question, choices, state, answer, by, source, proof,
     time, channel), the `pending-gates.md` row grammar and the decision-log
     row grammar as documented patterns, the exit codes, and the `http`
     channel wire shapes of AC-38. `gate-test.mjs` validates every `--json`
     output and one row of each file against it; `gate.mjs --help` states
     that a shape change needs a `contract_version` bump and a CHANGELOG
     line. The gate-guard hook and its `codex.rules` mirror (AC-21) are
     extended, not duplicated: under `AGENTIC_WORKFLOW_UNATTENDED=1` they
     also BLOCK a write to `.claude/gate-policy.json` or
     `.claude/runner.json` (who may answer) by Bash or by the Write/Edit
     tools, and a Write/Edit of `.plans/pending-gates.md`; in an attended
     session the two config files stay writable, because `/connect
     approver` writes them with the owner present — and refuses while
     `roundHeld(cwd)` is true (AC-42). `gate.mjs predict` is
     allowed (it cannot change an answer).
     **Amended 2026-11-13 (G6):** the schema documents the three grammars and
     the four exit codes S4 defined; it designs none. `gate.mjs approver`
     joins the shapes blocked when unattended, and "under
     `AGENTIC_WORKFLOW_UNATTENDED=1`" above reads `hl_unattended`.
10. **Replan 2026-11-12 — release additions (S5).**
   - AC-40 **L7 surfaces and the wider threat list.** `commands/doctor.md`
     Runner bullet also reports the project token and signing key by NAME
     (`git identity show` on macOS; on Linux the value of `git config
     user.signingkey` — a key-file path, not a secret — and whether
     `GH_TOKEN` is set; never a value); `templates/engineering-runbook.md`
     `## Unattended run` gains the Linux create / rotate / revoke steps for
     the per-project ed25519 key file and the per-project token env file
     (brief L7 `:245–249`). The brief names NO path for either file: the
     runbook writes them as `<key file>` and `<env file>`, chosen by the
     operator, and the plugin never reads the env file's location. The
     AC-24 security pass also covers: every item of AC-42 (a write that is
     on no list — `node -e`, `python`, `git checkout -- <file>`, `git
     apply` — to who-may-answer or to a counter; `runner.mjs begin|record
     --from <forged file>` run from inside a round; a round that feeds
     `poll` a transport of its own; a process that outlives its round); a
     client answer recorded as the owner's; an `http`
     answer accepted without a valid signature; a policy entry that lifts
     an L2 class; a prediction that changes an answer or is read by `poll`;
     `auth: external` reaching `round`; a `begin` lock that never expires;
     an advisor fallback that loops or hides the reason; a contract shape
     that differs from its schema; Write/Edit-tool (not only Bash) writes
     to `pending-gates.md`, `gate-policy.json` or `runner.json`.
   - AC-41 **Release notes and the wrapper obligation.** CHANGELOG
     `[1.70.0]` additionally names: `effective.advisor` in the agent
     registry (contract change), `runner-contract.schema.json` and
     `gate-contract.schema.json` at `contract_version: 1`, the `http`
     channel, `gate-policy.json`, `auth: external`, `Correctives:`, the
     OB-32 threshold change (window − 33,000), and the advisor probe facts.
     README `## Run 24/7` gains one line each for the advisor and for
     "driving rounds from your own supervisor". A fourth post-merge Closing
     row promotes as **OB-38**: every wrapper that pins this plugin
     re-pins to 1.70.0 and runs its contract tests (the OB-30 precedent).

11. **Revision 2026-11-12 (plan-judge) — what an unattended round can never do (S1, S4, S4b).**
   - AC-42 **An unattended round cannot change who may answer, an answer,
     or the runner's counters — by any write.** This is a property, not a
     list of command shapes; the gate-guard's shapes (AC-21, AC-39) are
     defence in depth only. Mechanism (recommended; OQ-8 picks):
     (a) **A digest the round cannot reach.** `begin` hashes (sha256) the
     protected set — `.claude/runner.json`; in the state dir `daily.json`,
     `backoff.json`, `rounds.log` (not `STOP`: the owner may pause during a round, and a round that writes it only stops itself); from S4 the answer store
     `answers.jsonl`; from S4b `.claude/gate-policy.json` — keeps the
     file contents and the digest in the memory of the process that
     started the round (`round` itself; on the split path it returns
     `state_digest` to the supervisor, which holds it) and never writes
     the digest to disk. `record` requires `--digest`, recomputes before
     writing anything, and on a mismatch records no progress, restores
     the pre-round contents (`round`) or names the changed file
     (split path), writes `STOP`, alerts once and exits `30
     state-tampered` (a new word in AC-6's outcome set). `round` ends the
     child's whole process group before it recomputes.
     Owner-side writes to the protected set (`gate.mjs poll`, `/connect
     approver`, `runner.mjs resume`) refuse while a round holds the lock —
     they call `runner.mjs`'s exported `roundHeld(cwd)` (the lock's own
     staleness rules) — so a real owner answer never reads as `30
     state-tampered` (plan-judge amendment 1, 2026-11-12).
     (b) **Answers live where a row edit cannot reach.** The answer store
     `<state>/answers.jsonl` is written only by `poll`; the
     `pending-gates.md` row and the decision-log row are projections
     `poll` rewrites from it; unit pick and `20` read only the store. An
     edited row answers nothing.
     (c) **A round cannot run the runner.** Under
     `AGENTIC_WORKFLOW_UNATTENDED=1` the guard blocks `gate.mjs poll` and
     every `runner.mjs` verb except `status` from Bash, and `begin` /
     `record` refuse when that variable is set in their own environment —
     so `record --from <forged file>` from inside a round fails even if
     the guard is bypassed.
     Tests (a write on NO shape list): in `runner-test.mjs` a fake child
     that calls `fs.writeFileSync` on `daily.json`, and one on
     `runner.json` → `30 state-tampered`, contents restored, no `round:`
     line counted as progress; `record` with a wrong or missing digest →
     refused; `begin` / `record` with `UNATTENDED=1` in env → refused. In
     `gate-test.mjs` a pending row hand-edited to "answered yes" → the
     gate is still open and nothing proceeds; a fake child that rewrites
     `answers.jsonl` → `30 state-tampered`. **Stated limit:** a process
     with the round's OS user that survives the process-group kill is
     outside this check, and a same-user round can also rewrite
     `runner.mjs`, `gate.mjs`, `gate-guard.sh`, `hooks.json`, or schedule
     cron/launchd; running rounds under a separate OS user closes
     it and is deferred by L1 (container provisioning) — OB-37 notes it.
     **Amended 2026-11-13 (G2, G3):** (d) **A tampered stop is not cleared
     blind.** After EVERY `30 state-tampered` stop — whatever file it
     names (on the split path the names come from size / mtime hints a
     round can fake) — `runner.mjs resume` re-verifies from the channel every open snapshot and
     every unacted answer (unverifiable → `void`), prints who may answer
     (ids, routes, `client_may`, keys, the policy table) and exits 1 with
     `STOP` kept unless `--confirm-approvers` is passed; gate-test: forged
     line → `30` → `resume` → the gate is still open. In (c) the guard reads
     `hl_unattended` — the variable OR a live round lock; `begin` /
     `record`'s own refusal stays on the variable alone (`record` runs under
     the lock). The protected set gains `<state>/telegram.offset` (S4).

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
| AC-14 | `CLAUDE_CODE_AUTO_COMPACT_WINDOW=200000` in project settings `env` | locked decision | brief L1 ("compaction at 200k … via project settings `env`"); memos D7-B's bands (≈ 133k / 161.5k / 190k at PCT 95) are superseded by AC-28: 116,900 / 141,950 / 167,000 |
| AC-14 | adopt-never-overwrite | derivation | `<plugin>/commands/bootstrap.md:114–119` (attribution key precedent) |
| AC-15 | the 15 ask sites | derivation | `grep -n AskUserQuestion <plugin>/commands/*.md` (2026-10-27): mission 46/128/178, plan 21/57, next 81, autopilot 42/73, publish 23/56/75, brainstorm 18/44, groom 68/105; setup commands excluded by purpose |
| AC-16 | plugin-root read approval (conditional) | locked decision | memos "Borrowed concepts — EGM" (narrowly-scoped, deny/ask rules still win) |
| AC-17 | seed shape and exact/semantic field classes | locked decision | metrics §4 table; memos D4-A |
| AC-17 | red fixtures (4 + the window mismatch) | locked decision | memos D4-A "Red fixtures" + D7 "The fidelity test needs a case for this" |
| AC-18 | model job `workflow_dispatch` only; `haiku`; skip without secret | locked decision | brief L1 ("model job on `workflow_dispatch` only"); memos D4-B (Haiku = the owner's floor); OQ-4 names the secret |
| AC-19 | gate id `G-<project>-<4 hex>`; row before send; outbox; receipt | locked decision | `docs/WORKFLOW.md:1197–1232` §12 rules 3 + multi-project; memos D5 core |
| AC-19 | TTL 72 h, reminders 24 h / 48 h | locked decision | brief L1 ("72h expiry"); memos D5 "Timeouts (gap 2)" |
| AC-19 | expiry: row state `closed-expired`, then a new gate — never a yes or a no | locked decision | brief L6 `:203–205` (owner 2026-10-27, OQ-1 "Accept all") |
| AC-19 | machine line `Gate <id> · <class> · <nonce> · q=<16 hex of sha256(question)>`; the `opened` snapshot; single-use message ids | derivation | goldfish G1 (ledger Handoff log 2026-11-13) — the row is child-writable (AC-42), the bot-authored message is what the owner saw; the line's shape is the planner's, frozen by AC-39 |
| AC-19 | the three grammars (`pending-gates.md` row, `answers.jsonl` event, `outbox.jsonl` event) | assumption | planner's 2026-11-13 (brief § S4 Do 1); S4 defines them, AC-39 freezes them |
| AC-19 | `gate.mjs` exit codes `0 / 1 / 2 / 40` | derivation | `40` = the runner's busy code (`runner.mjs` `pickUnit`, AC-4); `2` = AC-37's `predict` refusal; `1` usage, as `runner.mjs` |
| AC-19 | Slack reactions `white_check_mark` / `x` / `raised_hand`; Telegram `callback_data` `yes:` / `no:` / `hold:<id>` | assumption | `commands/connect.md:97–103` verifies a ✅ reaction and names "Telegram's buttons"; the ❌ / ✋ names and the callback form are the planner's |
| AC-19 | `hold`: blocks, stops reminders and the clock, keeps the nonce, a later yes / no answers | derivation | journeys J4 "Answered hold" row, minus its `resume <id>` word (outside the locked grammar `yes \| no <reason> \| hold`) |
| AC-19 | `expire --force <id>`; `open` with no channel → row + outbox, exit 0; `<state>/telegram.offset`; `<state>/alerts.sent` | assumption | planner's 2026-11-13 (goldfish G6 asked for each to be named) |
| AC-20 | per-channel `route: owner \| client` | derivation | `approver.route` (`templates/runner-config.json:6`) + journeys J4 (the owner copy on the client route) |
| AC-21 | `gate-guard.sh` ≤ 90 lines, one file | assumption | planner's 2026-11-13 (was ≤ 50; `publish-guard.sh` is 109 lines, `merge-guard.sh` 176) |
| AC-11, AC-21 | unattended = the variable OR a live round lock for the cwd; wins over `AGENTIC_WORKFLOW_CHILD` | derivation | goldfish G3; the lock line and its staleness rule, `runner.mjs:288–297` |
| AC-42 | `resume --confirm-approvers`; `gate.mjs reconcile` | assumption | planner's names 2026-11-13 (goldfish G2) |
| AC-23 | `gate.mjs approver --set '<json>'` (owner shell line) | assumption | planner's 2026-11-13; the `resume` pattern of AC-10 |
| AC-6 | one live round on a scratch mission, ≤ $1 (`budgets.round_usd: 1`) | locked decision | owner 2026-11-13 "Fix all" (goldfish G5, ledger Handoff log) |
| AC-33 | `--advisor-max-context`, `--resume-input`, `advisor_off`, `adv=` as the last field; `tokens` = max(`usage` sum, `modelUsage` sum) | assumption | planner's names 2026-11-13; which usage block holds advisor tokens is AC-32 row (iv) |
| AC-19 | reply grammar `yes \| no <reason> \| hold`; junk hint; duplicate receipt | locked decision | journeys J4 |
| AC-19 | Slack read = `conversations.replies` + `reactions.get`; Telegram = `getUpdates` | derivation | `docs/WORKFLOW.md:1187–1196` §12 rule 1 + `commands/connect.md:97–103` (reactions verified against `SLACK_OWNER_ID`) |
| AC-20 | owner-only classes `merge`(prod) `deploy` `spend` `publish` `kill` `scope`; client may get `decision`, `staging-merge` | locked decision | brief L2; memos D5 "Who may answer (gap 4)" (spend/kill/scope owner-only always) |
| AC-20 | approver ids live in `runner.json`, tokens by env NAME | locked decision | journeys voice rules ("Messages name the env var, never its value"); §12 rule 2 |
| AC-21 | the blocked command shapes | derivation | `hooks/hooks.json:83–93` merge-guard (fail-closed wrapper shape); memos D5 ("A PreToolUse rule denies `gate.mjs answer\|record` from model Bash") |
| AC-25 | README / runbook / doctor text | derivation | journeys J1/J4 lines (install-free subset); metrics §2 per-round fields |
| AC-26 | version 1.70.0 | derivation | `<plugin>/.claude-plugin/plugin.json` `1.69.1` + L5 (this mission runs before the 2.0.0 rebrand) |
| AC-27 | OB-35, OB-36, OB-37 | derivation | `.plans/OBLIGATIONS.md:74` ends at OB-34; `ledger.mjs promote` assigns the next free id at close |
| AC-28 | reserve 33,000 tokens; threshold = window − reserve | derivation | brief P0 probe record OB-32 row (`:225`): `pre_tokens` 166,703 at a 200,000 window (≈ window − 33k), Claude Code 2.1.319 |
| AC-28 | the same 33,000 at a 1,000,000 window | assumption | not measured (OB-32 ran at 200k); OB-35 re-measures at the run's window |
| AC-28 | bands 116,900 / 141,950 / 167,000 (200k) and 676,900 / 821,950 / 967,000 (1M) | derivation | (window − 33,000) × the unchanged 70 / 85 constants, `<plugin>/hooks/lib/handoff-lib.sh:70–79` |
| AC-29 | verbs `next` / `begin` / `classify` / `record`; "an update under the lock" | derivation | the wrapper ask recorded 2026-11-12 (ledger Deviations; xyzhub/missions-server `.plans/missions-engine.md:297–303` AC-21 and `:602–604`): next unit without a model call, classify the finished turn, record under the plugin's lock |
| AC-29 | `contract_version: 1`; strict schema file | derivation | `<plugin>/templates/agents-registry.schema.json` + `tools/agents-test.mjs:84–104` (the house precedent for a public JSON shape) |
| AC-29 | lease length for a `--holder` lock | input | the caller's `--lease <s>` argument; no default is invented |
| AC-30 | `auth: login \| external`; `round` refuses `external` | open question | OQ-7 (the ask says "accepts API-key and GLM accounts, **or is skippable** when the server supplies the account", missions-engine `:87` PC-5 (d)); L3 unchanged under the recommendation |
| AC-31 | the runner refuses a round without a per-project token and signing key; the token comes from `git identity token` when that tool is present, else `GH_TOKEN` | locked decision | 2026-10-29 brief L7 (`:250–255`) |
| AC-31 | "working signing config" = `commit.gpgsign` true and `user.signingkey` set | derivation | brief L7 `:236–238` (the key is "written inline into the repo's `.git/config`"); the two-key test is the planner's reading of "working" |
| AC-31 | exit `75`, outcome `creds-missing` | derivation | AC-4's `75` = "auth failed, expired or absent"; the outcome word is new in AC-6's closed set |
| AC-32, AC-33 | a completed consult, the launch-rejection texts, subagent reach, usage accounting, the attached-signal | assumption | unobserved; AC-32's probe decides before any code |
| AC-33 | `max_context_tokens` default 100,000 | locked decision | OQ-10, owner 2026-11-12 "Accept all" (ledger Open questions) |
| AC-33 | per-launch cap (not per-call); fall back to no advisor on a rejected launch; Claude engines only | locked decision | owner 2026-11-12 "fold it in" (ledger Deviations; commits 09a4179, c085895) |
| AC-34 | field name `advisor:`; values a model id or `off`; default off | open question | OQ-10 (collides with the existing `advisor` role, `tools/agents.mjs:35`) |
| AC-34 | minor bump + CHANGELOG line for the registry field | locked decision | owner 2026-11-12 ("an `advisor:` tune field is a contract with the Missions app"); `tools/agents.mjs:9–11` ("The JSON shape is a public interface") |
| AC-35 | `Correctives:` counter and the rate `Correctives ÷ Sessions used` | derivation | `commands/mission.md:172–176`, `:275` (a corrective is one counted session); `tools/ledger.mjs:46`, `:172` (`reviewer-runs` shape) |
| AC-36 | gate types `direction, money, publish, release, fact, other` | locked decision | `docs/product/decisions/2026-11-12-gate-delegation.md:71–72` (owner "go") |
| AC-36 | class → type table | assumption | the record names types, not the mapping; planner's table, confirmed in OQ-9 |
| AC-36, AC-37 | default answerer `owner`; nothing auto-answers unless the owner wrote it; `source`; `predicted` / `predictor` logged from day one; owner-answer proof | locked decision | gate-delegation record `:73–84` |
| AC-37 | a non-`owner` entry is recorded but not executed in v1 | open question | OQ-9 (L1 "answered ONLY through a channel"; record `:69` "designed so delegation can be added later") |
| AC-37 | policy can never lift `merge deploy spend publish kill scope` | locked decision | brief L2; AC-20 |
| AC-38 | channel interface, not an app-specific one | locked decision | owner 2026-11-12 (the plugin stays app-agnostic); ledger Deviations |
| AC-38 | proof = ed25519 signature by a key listed in `runner.json` | open question | OQ-8 (gate-delegation record `:82–84`: "the channel's own identity, or a one-time confirmation") |
| AC-38 | wire shapes `POST /gates`, `GET /gates/<id>/answers`, `POST /gates/<id>/receipt` | assumption | planner's; frozen by AC-39, confirmed with OQ-8 |
| AC-39 | projection fields (id, class, type, question, choices, state, answer, by, source, proof, time, channel) | derivation | AC-19 + AC-36 fields; the wrapper's gate projection (missions-engine `:304–306`) |
| AC-41 | OB-38 | derivation | `.plans/OBLIGATIONS.md` ends at OB-34; OB-35..37 are AC-27's; OB-30 is the precedent row |
| AC-36 | `source: client via <channel>:<message id>` for a client's answer | derivation | AC-20 (`client_ids`, `client_may`) + gate-delegation record `:77–78` ("every answer records its source") |
| AC-36 | `nonce` = 16 random bytes, hex, on the row and in the sent gate | derivation | AC-19 ("consumes the nonce on the first valid answer") left it undefined; `crypto.randomBytes(16)` is the planner's size, frozen by AC-39 |
| AC-37 | `limits`, `rules` inner shape | open question | reserved and opaque in contract version 1; Part 2 (not planned here) defines them — gate-delegation record `:73–76`, `:88–90` |
| AC-38 | signed bytes = UTF-8 of `JSON.stringify([id, nonce, class, q, answer, reason, answered_at])`; `q` = 64-hex sha256 of the question as sent | derivation | planner's canonical form (a JSON array is unambiguous for any `reason`); `class` + `q` added 2026-11-13 (goldfish G1) so a re-posted gate cannot be answered; frozen by AC-39; confirmed with OQ-8 |
| AC-38 | public key = raw 32-byte Ed25519 in base64url (JWK `x`); signature = raw 64 bytes in base64url | derivation | RFC 8037 (OKP / Ed25519 JWK) as implemented by `node:crypto` `createPublicKey({format:"jwk"})` and `crypto.verify(null, …)`; frozen by AC-39 |
| AC-40 | Linux key-file and env-file locations | input | the operator's choice — brief L7 `:245–249` names none; the runbook uses `<key file>` / `<env file>`; doctor shows `git config user.signingkey` and whether `GH_TOKEN` is set |
| AC-40 | the threat-list additions | derivation | AC-36..AC-39, AC-42 and the 2026-11-12 plan-judge findings (ledger handoff log) |
| AC-42 | protected set; `30 state-tampered` | derivation | AC-5 (the counters behind L4's cap), AC-20 (who may answer), AC-19 (answers); the digest-in-memory mechanism is the planner's — OQ-8 |
| AC-42 | sha256 | derivation | `node:crypto` `createHash("sha256")`, zero deps |
| AC-32, AC-33 | `--advisor <model>`; hidden from `--help`; `-p` ≥ 2.1.260; the four launch errors; `advisorModel`; `CLAUDE_CODE_DISABLE_ADVISOR_TOOL=1` | assumption | https://code.claude.com/docs/en/advisor.md (read 2026-11-12) + the pre-probe line in the ledger Deviations; a consult is still unobserved |

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
- 2026-10-27 (owner, brief L6 `:202–208`) — **OQ-1..OQ-5 "Accept all".**
  OQ-1 an expired gate closes `closed-expired` and a new gate opens — never
  a yes or a no; OQ-2 `.claude/runner.json` plus one §10 Runner row; OQ-3
  state under the git common dir; OQ-4 the model job on `workflow_dispatch`
  only with a `CLAUDE_CODE_OAUTH_TOKEN` CI secret; OQ-5 the build branch
  from `plan/continuous-operation`.
- 2026-10-29 (owner, brief L7 `:227–255`) — **Per-project credentials**: a
  GitHub token and a signing key per project; the runner refuses a round
  without them (AC-31); doctor and the runbook name them (AC-40).
- 2026-10-29 (orchestrator, ledger Deviations) — the build branch is
  **`feat/continuous-op`** (re-signed; the ruleset rejects unsigned commits
  and force-pushes). `main` is merged INTO it, never rebased.
- 2026-10-27 / 2026-11-09 (P0 probe record, brief `:217–225` — observed
  facts, each with its verbatim invocation there) — (a) a project settings
  `env` value reaches hook subprocesses (`:219`); (b) no plugin-file read
  refusal (`:220`) → AC-16 struck; (c) a background child's exit wakes the
  parent with a new turn, 7 s and 17 s after exit (`:221`) → `run.md` ships
  the background variant; the foreground `--max` text is kept as one
  fallback sentence only; (e) `continue:false` under `-p` does not block
  the tool and ends with `terminal_reason: "hook_stopped"` (`:223`) → the
  marker + exit 2 branch ships (AC-11 as amended); (f) the flag is
  `--max-budget-usd <amount>` (`:224`); OB-32: auto-compaction at ≈ window −
  33k, `pre_tokens` 166,703 at 200k (`:225`) → AC-28. These replace the
  three `Assumed 2026-10-27` lines above.
- 2026-11-12 (owner, ledger Deviations) — probe (d) is skipped; the design
  does not rest on it (L1 takes answers only from a channel).
- 2026-11-12 (owner "fold it in") — the Claude Code advisor joins the
  mission: per-launch cap, fall back to no advisor, doctor row,
  consult-before-done, the corrective-retry measure, an `advisor:` tune
  field as a wrapper contract (AC-32..AC-35).
- 2026-11-12 (owner, ledger Deviations) — the runner offers its round logic
  without starting `claude -p`, freezes the `gate.mjs` contract, lets a
  caller-supplied account pass the login check, and gets a server channel
  for parked gates — all generic; the plugin names no app (AC-29, AC-30,
  AC-38, AC-39).
- 2026-11-12 (owner "go", `docs/product/decisions/2026-11-12-gate-delegation.md`
  Part 1) — gate type, owner-written per-type policy defaulting to `owner`,
  answer source, owner-answer proof, shadow-prediction logging from day one
  (AC-36, AC-37). **Part 2 is not planned here.**
- 2026-11-12 (planner) — session ids are stable: S1..S5 keep their meaning;
  the two new briefs are `S1b` (after S1) and `S4b` (after S4). AC ids
  AC-1..AC-27 are never renumbered (another repo's plan cites AC-4, AC-8,
  AC-11, AC-15, AC-19); new ones start at AC-28.
- 2026-11-12 (planner) — `gate-guard.sh` is still the only new refusing
  hook body (the 2026-10-27 lock stands); S4b adds shapes to it and one
  more matcher group (`Write|Edit|MultiEdit`) that runs the same body.
- 2026-11-12 (planner, after the plan-judge's REVISE) — `gate.mjs` has no
  transport-URL override reachable from a command line or the
  environment; `poll` is never run by a round; the answer store, not the
  markdown row, is what the runner trusts (AC-21, AC-22 as amended; AC-42).
- 2026-11-12 (planner) — the gate contract is frozen LAST (AC-39 in S4b),
  after the delegation fields and the `http` channel exist, so the frozen
  shape never needs a second version inside this mission.
- Assumed 2026-11-12 (planner; sources: https://code.claude.com/docs/en/advisor.md
  read 2026-11-12, and the orchestrator's pre-probe in the ledger
  Deviations) — the launch option is `--advisor <model>` (`fable`, `opus`,
  `sonnet` or a full id), hidden from `claude --help` by design; `-p`
  support needs Claude Code ≥ 2.1.260; the launch exits with an error when
  the main model does not support an advisor, the requested model cannot
  advise, an `availableModels` allowlist excludes it, or Fable still needs
  the usage-credits consent; a pairing the API refuses is NOT an error
  (the request is resent without the advisor); subagents inherit the
  advisor; `advisorModel` in user settings applies when no flag is given;
  `CLAUDE_CODE_DISABLE_ADVISOR_TOOL=1` turns it off; a session with
  feature-flag fetching off (e.g. `DISABLE_TELEMETRY`) has no advisor.
  **Observed so far (ledger Deviations, 2026-11-12, 2.1.322):** `claude -p
  --model sonnet --advisor fable --max-turns 1 --output-format stream-json
  --verbose "Reply with the single word ok."` → exit 0, result success,
  **no consult happened**. So the spelling and the launch are seen; a
  completed consult, the rejection texts, subagent reach and usage
  accounting are not — AC-32 owes exactly those. Not a lock until then.
- Assumed 2026-11-12 (planner) — the reserve is 33,000 tokens at every
  window, including 1,000,000 (measured only at 200k). OB-35 re-measures.
- Assumed 2026-11-12 (planner) — a wrapper can hold an ed25519 private key
  on the owner's device and sign an answer with it (AC-38). OQ-8.
- 2026-11-13 (owner, AskUserQuestion; ledger Handoff log) — **"Keep S4b,
  hold 8".** S4b is not deferred and `Estimate: 8` does not change; the
  overrun stop at 12 forces the scope decision if it is reached.
- 2026-11-13 (owner, AskUserQuestion; ledger Handoff log) — **"Fix all,
  narrow judge".** Every goldfish must-fix (G1–G6) and advisory is applied
  to the pending briefs in one pass (`## Revision 2026-11-13 (goldfish)`);
  the plan-judge re-checks only that diff.
- 2026-11-13 (owner, via the orchestrator; ckpt-s1 finding S3) — the
  runner keeps **no retry mark**: a repeated `record` is `30
  state-tampered`. Built as S1b's carry-in step (AC-29 amendment).
- Assumed 2026-11-13 (planner) — every new name in the goldfish revision
  is a planner's choice no run has exercised: `resume
  --confirm-approvers`, `gate.mjs reconcile`, `gate.mjs approver --set`,
  `gate.mjs expire --force <id>`, `--advisor-max-context`,
  `--resume-input`, the machine line's shape, the three grammars, the
  reaction and button names, `<state>/telegram.offset`,
  `<state>/alerts.sent`. The builder may rename one with a line in its
  hand-off; S4b freezes what S4 shipped.
- Assumed 2026-11-13 (planner) — the Telegram Bot API cannot fetch a
  message by id, so the gate message is verified from the
  `reply_to_message` / `callback_query.message` object of an update; S4
  confirms it in the API reference before relying on it.
- Assumed 2026-11-13 (planner) — `ccp run` on `roundOnce` loses its live
  tool-by-tool rendering (the round stream goes to a file). If the owner
  wants it kept, S1b step 6 leaves `headless.mjs` untouched instead.
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
- **The advisor may not exist as a launch option.** → AC-32 is S1b's
  first step and the advisor ACs are struck, with the row cited, if it
  fails; nothing else in S1b depends on it.
- **A server channel is a self-approval path if the server's word is
  trusted.** → AC-38 trusts a signature by a key the container never
  holds, not the server; an unsigned answer is the unlisted-sender path;
  the security pass and `ckpt-s4b` enumerate it (OQ-8).
- **A frozen contract that is wrong is expensive.** → frozen last (S4b),
  schema-validated in the harness, versioned; the wrapper pins after the
  release (OB-38).
- **`main` moved under the branch** (two merges; `tools/hook-test.mjs`
  gains 10 lines at `:20–29`). → the orchestrator merges `main` into the
  branch before S1; every hook-test anchor in the briefs is given as a
  grep string with the post-merge line number.
- **Eight briefs against an estimate of 6.** → OQ-6; the overrun stop at
  1.5 × 6 = 9 is not reached by 8, but the estimate is still wrong until
  the owner locks the raise.

## Open questions

_OQ-1..OQ-5 below were **answered 2026-10-27 — "Accept all"** (brief L6;
see Locked decisions); they stay for the record. OQ-6..OQ-12 are open:
OQ-6, OQ-7, OQ-11, OQ-12 and OQ-8's enforcement part before S1; OQ-10
before S1b; the rest of OQ-8 and OQ-9 before S4._

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
- **OQ-6 — raise the estimate from 6 to 8 (briefs only).** The four
  additions do not fit the five pending briefs: S1, S2 and S4 were already
  at 1,420 / 1,480 / 1,400 of 1,500 read lines. `S1b` carries the advisor,
  the tune contract and the `headless.mjs` step; `S4b` carries the policy
  file, the `http` channel and the contract freeze. Alternatives: keep 6
  and ship the advisor and the server channel as later releases (the
  wrapper's plan then cannot pass its last phase until that release).
  **Recommendation:** lock 8 — one mission, no return trip.
- **OQ-7 — login check for API-key and GLM accounts (AC-30) versus L3.**
  The ask allows either "accepts those accounts" or "is skippable when the
  caller supplies the account". **Recommendation:** skippable
  (`auth: external`, split path only). L3 stays whole: the runner's own
  child still runs only from the container's login. Letting `round` itself
  carry an API key or a GLM endpoint would unlock L3 — not recommended.
- **OQ-8 — the server channel (AC-38) versus L1 and versus "Part 2".**
  L1 allows only answers verified at the source and defers any local
  answer surface; the gate-delegation record lists "the Missions app as one
  more channel" and an MCP channel under Part 2. **Recommendation:** build
  the GENERIC `http` channel now with a signature by an owner-held key as
  the proof — L1 then still holds, because the container cannot produce an
  answer; the app-specific adapter and the MCP channel stay in Part 2.
  The weaker choice (trust the server's statement of who answered, behind
  a bearer token) would make L1 false and is not recommended. Deferring
  the channel blocks the wrapper's acceptance runs.
  **Also decide how AC-42 is enforced** ("an unattended round cannot
  change who may answer or the runner's counters by any write"):
  (1) the in-memory digest + answer store + runner refusal of AC-42 —
  **recommended for v1**, with its stated limit; (2) additionally read
  `runner.json` `approver` and `gate-policy.json` only as committed on the
  default branch at origin (the merge-guard precedent), so who-may-answer
  changes only through a PR the owner merges — stronger, slower to set
  up; (3) run rounds under a separate OS user — complete, but L1 deferred
  container provisioning. This part must be answered before **S1**
  (the digest is built there).
- **OQ-9 — how much of the policy runs in v1 (AC-36, AC-37).**
  **Recommendation:** the file is parsed, validated, shown and recorded on
  every gate, and every gate still goes to the owner; `rule` and agent
  answerers are accepted by the schema and switched on by Part 2. Also
  confirm the class → type table in AC-36 and that a policy can never
  hand an L2 class to anyone but the owner.
- **OQ-10 — advisor details (AC-33, AC-34).** (a) Field name: the tune
  key `advisor:` collides with the role named `advisor`.
  **Recommendation:** keep `advisor:` (it mirrors the launch option; the
  tune grammar stays unambiguous because the role is the first word). (b)
  `max_context_tokens` default: no source gives a number.
  **Recommendation:** 100,000, to be replaced by the first measured
  consult cost. (c) Sites: the round child via `runner.json` and
  own-process roles via the tune; subagents only if the probe shows they
  can consult. **Recommendation:** yes.
- **OQ-11 — `ckpt-s0` never ran.** L5 asks for a Fable checkpoint per
  phase; the ledger shows one reviewer run (the plan-judge). **Recommendation:**
  run it now as a one-shot over the probe record (no session), before S1;
  the alternative is a dated owner waiver.
- **OQ-12 — where the threshold fix lands and how far it reaches (AC-28).**
  The probe record says "S1 fixes `hl_threshold`"; S1 touches no hook and
  S2 already rewrites that function. **Recommendation:** S2, one edit, with
  the flat 33,000 reserve applied at every window until OB-35 measures 1M.

## Replan 2026-11-12

_Re-evaluation at `feat/continuous-op` 1a6bafb (12 commits ahead of the
merge-base 6de5cd8; `main` at 5ba640e; plugin 1.69.1; Claude Code 2.1.322).
Completed work and logged deviations are untouched._

**Ledger against git.** S0's work is on the branch (probe record + OB-32
evidence in the brief, `:210–225`; OB-32 `[x]` in the register). Not done
from S0: probe (d) (owner skipped it), the constants fix (now AC-28, S2),
and `ckpt-s0` (OQ-11). The branch name in the ledger header and the cleanup
row was stale (`feat/continuous-operation` → `feat/continuous-op`). No
plugin file has changed on the branch; every plugin anchor measured on
1949231 still holds. `main` gained 10 lines in `tools/hook-test.mjs`
(`:20–29`) and a `docs/WORKFLOW.md` sync; neither is merged into the branch
yet. OQ-1..OQ-5 were answered by brief L6 but still listed open.

**What changed, per pending brief.**

| Brief | Change |
|---|---|
| S1 | + AC-29 (`begin` / `classify` / `record`, contract schema), AC-30 (`auth: external`), AC-31 (L7 preflight); `--max-budget-usd` confirmed; the `headless.mjs` step and the advisor paragraph move out to S1b |
| S1b (new) | AC-32..AC-35: advisor probe → launch, cap, fallback → `advisor:` tune field and registry schema → consult-before-done, doctor row, `Correctives:`; plus AC-9's `headless.mjs run` on `roundOnce()` |
| S2 | + AC-28 (window − 33,000) with every band number recomputed; AC-11 resolved to the marker branch; AC-10 resolved to the background variant; AC-16 struck |
| S3 | `window-mismatch` fixture moved from 170k (past the real compaction point) to 150,000; brief cites refreshed |
| S4 | + AC-36 (delegation fields on every row, one channel interface); the connect / §12 / gate-classes surfaces (AC-23) move to S4b |
| S4b (new) | AC-37 (policy file, `predict`), AC-38 (`http` channel, signature proof), AC-39 (frozen contract, read-only projection, guard shapes), AC-23 surfaces |
| S5 | + AC-40 (L7 doctor + runbook, wider threat list), AC-41 (release notes, OB-38); the final checkpoint covers AC-1..AC-41 |

**Locks.** L1–L7 and every planner lock stand. None is invalidated under
the recommended answers. Two are touched and come back as questions: L3 by
the login-check ask (OQ-7) and L1 by the server channel (OQ-8). The
estimate lock (6) is the one the replan asks the owner to change (OQ-6).
The three `Assumed 2026-10-27` lines are settled by the probe record.

**Estimate.** Proposed 8 = S0 (used) + S1, S1b, S2, S3, S4, S4b, S5;
checkpoints `ckpt-s1 … ckpt-s5` plus `ckpt-s1b`, `ckpt-s4b` and the
security pass stay one-shot spawns inside their sessions. `Estimate: 6`
is unchanged in the ledger until the owner's dated lock.

**Revision after the plan-judge (same day, reviewed at da4febe).** REVISE
with seven fixes, applied once: `poll` unreachable from a round and no
transport-URL override (AC-21, AC-22); a stated integrity property with a
non-listed-write test (new AC-42; OQ-8 picks the mechanism); a client's
answer recorded as the client's (AC-36); reserved `limits` / `rules`, the
nonce, key and signature encodings and an unambiguous signed form (AC-36..
AC-38), AC-40 sourced; `75` only on a failed turn (AC-30); the advisor
facts pre-resolved from the documentation and the pre-probe, AC-32
narrowed; stale anchors and wording in the briefs. `main` is merged
(bf90c06) and lint is green. The estimate proposal is unchanged at 8.

**Version.** Still 1.70.0 — a minor bump already; the registry field and
the two contract schemas each get a CHANGELOG line.

## Revision 2026-11-13 (goldfish)

_Owner locks 2026-11-13: "Keep S4b, hold 8" and "Fix all, narrow judge".
One pass over the PENDING briefs (S1b, S2, S3, S4, S4b, S5) and their ACs
at `feat/continuous-op` db3153d. S0 / S1 history is untouched. No AC was
added or renumbered — every change is a dated `Amended 2026-11-13` clause
on an existing AC. `Estimate:` is unchanged. Line numbers are the
sessions file's after this revision._

| Item | What changed | Master plan | Sessions file |
|---|---|---|---|
| G1 — a yes bound to the gate the owner saw | machine line on the message; `opened` snapshot in the protected store on first sight; class / nonce / message id only from it; bot authorship + gate id + nonce; single-use message ids; `http` signed bytes gain `class` + `q`; three harness cases | AC-19 (2), AC-22, AC-38 + its Value sourcing row | S4 Do 1 `:1305`, Do 4 `:1435`; S4b Do 3 `:1620`, Do 6 `:1665`; ckpt-s4, ckpt-s4b |
| G2 — a tampered stop is not cleared blind | after every `state-tampered` stop `resume` reconciles answers from the channel and needs `--confirm-approvers`; forged line → `30` → `resume` → gate still open | AC-42 (d), AC-22 | S4 Do 2 `:1401`, Do 4 `:1445`; S4b Do 1 `:1603`; S2 Do 6 + S5 Do 2 (the printed line) |
| G3 — unattended does not hang on one variable | `hl_unattended` = variable OR live round lock; wins over `AGENTIC_WORKFLOW_CHILD`; `21` only after the re-hash, still charged; marker + `daily.json` edit → `30` | AC-11, AC-21, AC-42 (c) | S2 Do 1 `:874`, Do 2 `:899`, Do 3 `:924`, Do 4 `:942`; S4 Do 3 `:1416` |
| G4 — the rules live in `roundNote` | S3 asserts on `roundNote` + `begin`'s `append_system_prompt`; S4 puts the gate note in `roundNote`; `run.md` tells a supervisor to pass `--append-system-prompt`; `begin` in S2 Reads | AC-17, AC-23, AC-11 | S3 Reads 5 `:1082`, Do 3 `:1125`; S4 Do 2 `:1393`; S2 Reads 4, Do 6 `:982` |
| G5 — the prompt shape runs live once | S1b step 0: one `runner.mjs round` on a scratch mission (≤ $1), three observations in the probe table | AC-6 | S1b `:584` |
| G6 — clarity | `ccp run` prompt + headless-test (`:737`, AC-9); the three grammars move into S4 (`:1287`), S4b documents (`:1645`); one word `closed-expired`; channel `route` (`:1279`); reactions / buttons / offset file (`:1339`); `hold`, `expire --force` (`:1345`); `open` with no channel; alert delivery (`:1354`); exit codes (`:1363`); AC-42 in S4 Reads (`:1213`); gate-guard ≤ 90 lines, one file (`:1416`); advisor data path (`:664`, `:721`); existing ledgers and `Correctives:` (`:731`); S4 verify counts fields (`:1498`); thirteen gate-guard cases | AC-9, AC-19 (1)(3), AC-20, AC-21, AC-33, AC-35, AC-39 | as cited |
| Advisories | OB-35 text gains wake latency + the settings-only compaction point and may run from the staging install (`:1864`); runbook says what keeps `/run` alive (`:1819`); advisor tokens into `tokens=` and the daily cap (`:693`); exact CLI pin (`:1152`); approver writes as an owner shell line (`:1693`) | AC-33, AC-17, AC-23 | as cited |
| Carry-in (owner, ckpt-s1 S3) | the retry mark is deleted first thing in S1b; a repeated `record` is `30 state-tampered`; one runner-test case; ckpt-s1b confirms | AC-29 | S1b `:570` |

**Read budgets after the revision.** S1b ≈ 1,430 · S2 ≈ 1,465 · S3 ≈ 1,065
· S4 ≈ 1,440 · S4b ≈ 1,180 · S5 ≈ 1,060 — all inside ≈ 1,500, three of
them near the edge; each of those three briefs tells its builder to skip
the 2026-11-13 AC amendments in this file (they summarise the brief),
which is what keeps the count honest.

**Checked by running it (2026-11-13, $0).** In a scratch repo with the
ledger shape S1b step 0 names, `runner.mjs next` picked
`/agentic-workflow:mission scratch continue`; `begin --json` with a stub
`CLAUDE_BIN`, `commit.gpgsign`, a `user.signingkey` and `GH_TOKEN`
returned `append_system_prompt` (exit 0) and stopped `75 creds-missing`
without them — both briefs carry those requirements.

**Session pressure (not acted on — the estimate is the owner's).** The
fixes fit the six pending briefs, but they make two of them heavier:
S4 grew from ≈ 450 to ≈ 600 lines of `gate.mjs` plus `reconcile` and the
`resume` check, and S1b now opens with a runner fix and a live round
before its own five jobs. Each is the likeliest to need a corrective,
and a corrective counts as a session. The ledger already stands at 4
used + 6 pending = 10 against `Estimate: 8` (stop at 12), so at most two
correctives fit before the overrun stop asks the owner for the scope
decision. S4's order-if-short line names what a corrective may carry.

**Not changed here.** The ledger's `## Closing` row "24h live run" still
describes OB-35 by its two 2026-11-12 clauses; the full text is S5 Do 8
and the row says "verbatim", so nothing breaks — the orchestrator may
reword the row.

---
_The `.plans/continuous-operation.sessions.md` briefs execute these tasks;
`.plans/continuous-operation.state.md` tracks progress. Resolve every open
question before execution starts._
