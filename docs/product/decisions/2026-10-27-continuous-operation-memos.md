---
status: frozen
owner-agent: architect
refresh-trigger: never
---

# agentic-workflow — Decision memos: continuous operation (24/7, managed or unattended)

_Seven shape decisions (D1–D7) for the mission in
`docs/product/decisions/2026-10-27-continuous-operation-brief.md`. The owner's
picks there are LOCKED and not reopened here. These memos are re-centred on the
three owner clarifications quoted below. The designer's eleven gaps
(`…-journeys.md`) are answered inline and indexed at the end, and the analyst's pass
numbers are in `…-metrics.md`. Every claim is labelled **fact** (with a repo path
or URL), **inference**, or **assumption**. Paths are relative to
`plugins/agentic-workflow/` unless they start with `docs/`, `.plans/` or `tools/`
(repo root). Plugin version at writing: 1.69.1._

## The goal these memos serve (owner, verbatim, 2026-10-27)

1. "the idea of the 24/7 run is so i can run the agentic-workflow and trigger it and
   then never have to worry about context rot or context filling up or compaction
   degrading anything"
2. "like in the salla-agent, it should be able to run ongoing without any special
   setup". salla-agent is a plain Claude Code session kept alive under Remote
   Control, with no installer and no systemd.
3. "we can also trigger the autocompaction to happen early to save on tokens"

Taken together: **one ordinary session plus one command**, and after that nothing
but approval gates. Context rot (quality loss long before the window fills) is in
scope, not only window overflow. Installers and systemd become optional hardening.

## What already exists (this changes the build size)

- **Fact** (`tools/headless.mjs` `run`, lines 155–181): an unattended loop already
  exists. It runs one fresh `claude -p "/agentic-workflow:mission <m> continue"` per
  tick and probes the ledger's `Closed:`/`Next up:` lines before and after each tick.
  It stops when a tick makes no progress. Missing: stop codes per reason, a lock,
  a kill switch, a budget stop, and unit selection beyond one named mission.
- **Fact** (`tools/run-claude.mjs` lines 23–35, 265): this is a **role** runner. It
  sets `AGENTIC_WORKFLOW_CHILD=1`, which silences every plugin hook, and it passes
  `--restricted`, which ignores project/user settings. It is right for builder
  children. It is wrong for a child that must itself orchestrate under the handoff
  gate and the budget hooks.
- **Fact** (`docs/WORKFLOW.md` §12, lines 1165–1232; `commands/connect.md`): the owner
  channel exists only as prose plus curl commands the agent runs. Today no tool
  posts a gate, polls for the answer or verifies who answered (`grep pending-gates`
  hits docs only).
- **Fact** (`hooks/lib/handoff-lib.sh` lines 28–31, 70–73, 180–197): the handoff
  bands are advisory at 70 % and urgent at 85 % of `hl_threshold`. `hl_threshold` =
  `CLAUDE_CODE_AUTO_COMPACT_WINDOW` (default 1000000) ×
  `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` (default 95) / 100. **Both bands therefore move
  automatically when either variable is lowered.**
- **Fact** (`hooks/lib/handoff-gate.sh`): the gate blocks with exit 2 at the urgent band,
  fails **open** on the 6th block, and is silent under `AGENTIC_WORKFLOW_CHILD=1`.
  `hl_redact` exists in `handoff-lib.sh`.

## What Claude Code itself allows (facts that shape every option)

| Capability | What the docs say | Source |
|---|---|---|
| Agent runs `/clear` itself | **No.** Built-in commands such as `/clear` "reach Claude as plain text instead of executing" from a scheduled fire. No tool clears the context. | https://code.claude.com/docs/en/scheduled-tasks |
| Agent schedules its own next turn | Yes. `CronCreate`/`CronList`/`CronDelete` (≤ 50 per session; recurring jobs expire after **7 days**). Self-paced `/loop` uses `ScheduleWakeup` (1 min–1 h, with a ~20 min fallback wakeup). Scheduled prompts fire "between your turns". | same |
| Scheduled work survives restart | `CronCreate` jobs are restored on `--resume`/`--continue` (not missed runs). A **self-paced `/loop` is not restored**. Jobs fire only while the session runs. | same |
| Turn after turn toward a condition | `/goal` is a prompt-based Stop hook. It is restored on resume. In an interactive session it allows at most **3 idle check-ins between prompts**. | https://code.claude.com/docs/en/goal |
| Session outlives terminal / crash | Background sessions (`claude --bg`, `/bg`) run under a supervisor that restarts unexpected exits. A **reboot stops them**; they can be restarted manually within 48 h. The docs list no tool that lets Claude start one itself. | https://code.claude.com/docs/en/agent-view |
| Phone/browser control (salla-agent) | Remote Control needs a **full claude.ai login**. API keys and `setup-token` tokens cannot use it. Server mode exits after ~10 min offline, while an interactive session reconnects by itself. | https://code.claude.com/docs/en/remote-control |
| Peer messages as approval | A cross-session message "can't approve anything" and never counts as consent. `claude -p` binds an inbox. | https://code.claude.com/docs/en/cross-session-messaging |
| Early compaction | `CLAUDE_CODE_AUTO_COMPACT_WINDOW` accepts 100000–1000000 tokens and wins over `/autocompact`, `--autocompact` and the `autoCompactWindow` setting. `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` is 1–100 and "can't raise the threshold". It "applies to both main conversations and subagents". Native-1M models compact at ~967K by default. | https://code.claude.com/docs/en/model-config, https://code.claude.com/docs/en/env-vars |
| Settings `env` block | Claude Code "reads them directly from the file, so they take effect no matter how `claude` was launched". | https://code.claude.com/docs/en/env-vars |

**Context rot (evidence).** Fact: Chroma's study of 18 LLMs, Claude 4 among them,
held task difficulty constant and still found performance degrading as input length
grew, even on trivial tasks. Semantically similar distractors made it worse, and no
safe length was identified (https://research.trychroma.com/context-rot).
**Inference:** no token count is "rot-free". The defensible design is to keep the
context that does the *work* short and fresh, and let a long-lived context do only
mechanical bookkeeping.

---

## D1 — The shape of the 24/7 run

**The question.** What runs indefinitely after one trigger, and where does the
actual work execute, so that work never runs in a rotting context? This decision
constrains D2 (keep-alive), D3 (mode detection), D5 (where answers land) and D7 (thresholds).

### Option A — thin parent session + a fresh child per round (recommended)
- **How it works here:** the owner opens an ordinary Claude Code session in the
  project (optionally under Remote Control, like salla-agent) and types one command,
  **`/agentic-workflow:run`** (new). From then on the session is a **thin supervisor**:
  1. `node tools/runner.mjs next` (Node, no model) runs preflight: lock, kill switch,
     budget/overrun, pending gates. It then picks the unit deterministically and
     prints one line: the unit, or a stop reason.
  2. The parent spawns that unit as a **fresh `claude -p` child** through `node
     tools/runner.mjs round` (Bash, `run_in_background`). The child gets
     `AGENTIC_WORKFLOW_UNATTENDED=1`, its own compaction window, and **no**
     `AGENTIC_WORKFLOW_CHILD`, so the gate and budget hooks stay live inside it. The
     child is the existing mission/autopilot/operate orchestrator. It delegates
     builders exactly as today (Agent tool, or `run-claude.mjs` under the `isolated` preset).
  3. The child exits. **Fact** (https://code.claude.com/docs/en/goal, "Background work
     defers evaluation"): when background work finishes, Claude Code delivers the
     result to Claude as a new turn, so the parent wakes without a prompt. It reads
     only the exit code and the one-line round summary (≤ 1–2k tokens per round), then
     loops to step 1.
- **Why it meets the goal (inference):** every unit of real work starts at near-zero
  context and reads only the ledger, the handoff and the pointers it needs. The parent's
  context grows by about a round summary per round, and its decisions are mechanical
  (Node picks the unit), so rot in the parent has little to damage.
- **Tradeoffs:** "zero setup" really means one command, but **a reboot is not
  survived** without hardening (see D2). A child needs a credential, and it
  inherits the session's login on the same box (**assumption**: `claude -p` reuses
  `~/.claude/.credentials.json`; verify in P1). The owner's typing goes to the parent,
  not into the working child. Mid-round steering therefore lands at the next round,
  which is the J1 contract anyway.
- **Operational cost:** one command file plus `tools/runner.mjs` (about 300 lines) plus
  tests. **Cost of reversal:** low (additive; `ccp run` keeps working).

### Option B — fat session: the session does the work itself, early compaction carries it
- **How it works:** today's `/loop /agentic-workflow:mission <m> continue`, with a
  lowered compaction point (D7). Each tick works inside the same window, and the
  handoff plus compact-resume carry it across every compaction.
- **Tradeoffs:** simplest, nothing new to spawn. **But** all work runs in a context that
  carries every earlier tick's residue. That is exactly the rot the owner wants gone, and the
  compaction paraphrase becomes part of every tick's memory. **Fact:** the brief already
  names this accretion as the problem (`docs/WORKFLOW.md` §5 Loop mode).
- **Cost of reversal:** zero (it is the status quo).

### Option C — external supervisor: systemd timer + `runner.mjs round`, no parent session
- **How it works:** a oneshot service plus a timer per project runs one round per
  activation (`OnUnitInactiveSec`, `Persistent=true`).
- **Tradeoffs:** survives reboots and needs no live session. It is "special setup"
  (an installer, root, units), which the owner just ruled out as the baseline.
- **Verdict:** it uses **the same `runner.mjs round`** as A, so it is a deploy option
  rather than a different architecture. Ship it as optional hardening (D6).

### Recommendation: A, with C as optional hardening on the same round code
**Unit selection** (`runner.mjs next`, deterministic; first match wins):
1. Kill switch, budget stop, or 1.5× overrun → no spawn. Report the stop, notify the approver, and stop the keep-alive.
2. A gate answer recorded since the last round (D5) → resume the unit that owns the gate.
3. An active mission ledger (the `hooks/lib/active-ledger.sh` predicate) whose `Next up:` is not gated → `/agentic-workflow:mission <m> continue`.
4. A venture not yet at V6 → `/agentic-workflow:autopilot continue`.
5. Otherwise → one `/agentic-workflow:operate` cycle, or idle when §10 configures no operate loop.

**Gap 1 (a pending gate while other work exists):** a pending gate pauses **only the
unit that owns it**. While it waits, only step-5 maintenance rounds may run; no new
mission or brief starts. A kill/budget/overrun gate pauses everything.

**Round exit contract** (`runner.mjs round` → the parent, or systemd under C):

| Code | Meaning | Parent / supervisor action |
|---|---|---|
| 0 | progressed | next round now |
| 10 | idle | wait (keep-alive interval) |
| 20 | waiting on a gate, nothing else runnable | wait; answers are polled each keep-alive tick |
| 21 | handoff gate stopped the child without a handoff (D3) | next round resumes from ledger + snapshot; 2 in a row → stop + alert |
| 30 | budget stop / overrun | **stop**, write the stop file, notify |
| 40 | kill switch | stop |
| 75 | auth failed or expired (gap 7) | stop + alert over the channel (which needs no Claude auth) |
| 1 | crashed / no usable result | retry with backoff; **3 consecutive → stop + alert** (gap 6) |

**Per-round caps:** the `unattended` preset's `tick_budget` (750000,
`templates/tune-presets.json`) plus `claude -p --max-budget-usd`. **Fact:**
`tools/run-claude.mjs` lines 428–431 already branch on `error_max_budget_usd`. The exact flag
spelling is **unverified** (P1).
**Gap 10 (version drift):** each round row records `plugin_version` and `claude
--version`. Plugin updates run only through `runner.mjs update`, under the lock, between rounds.

- **Strongest case against A:** it is two levels of Claude where one could do (a session
  that only shells out). Counter: the parent is what makes it "one ordinary session"
  (Remote Control, answer surface, no install), and its cost per round is tiny.
- **What would change it:** if Claude Code gains a documented tool for an agent to start a
  fresh session or clear its own context, the parent could rotate itself and spawn nothing.
- **Files touched:** `commands/run.md` (new), `tools/runner.mjs` (new: `next`, `round`,
  `stop`, `resume`, `pause`, `status`, `update`), `tools/round-lib.mjs` (new, moved
  out of `headless.mjs`), `tools/headless.mjs`, `tools/runner-test.mjs` (new),
  `tools/lint.mjs`, `docs/WORKFLOW.md` §5 Loop mode, `commands/autopilot.md`.

---

## D2 — Keep-alive, restart, locks, stop conditions, logs

**The question.** Without a human prompt, what wakes the parent? What happens when a
child, the session or the machine dies? How are concurrent runners and secret leaks prevented?

### Keep-alive inside the session (no install)
| Mechanism | Strength | Weakness (fact, scheduled-tasks / goal docs) |
|---|---|---|
| Child-exit notification (D1-A step 3) | wakes the parent exactly when a round ends | nothing wakes it while it is idle (exit 10/20) |
| `CronCreate` recurring `*/5 * * * *` → `/agentic-workflow:run tick` | **restored on `--resume`**; no jitter at `*/5` | recurring jobs expire after 7 days |
| self-paced `/loop` (`ScheduleWakeup`) | adapts its interval | **not restored on resume**; ends if an iteration neither reschedules nor stops |
| `/goal` | restored on resume | at most 3 idle check-ins between prompts → unfit for idle days |

**Recommendation:** child-exit notification as the primary wake, plus **one recurring
`CronCreate` watchdog** (`*/5`) whose tick is a no-op while a round is in flight (the lock
is held) and otherwise runs `runner.mjs next`. Each tick re-creates the cron when it is
more than 6 days old (`CronList` shows creation; **assumption**: the age is readable, else
the tick records the creation date in `$STATE`). Idle ticks cost one short parent turn
(**inference**: about 2–5k tokens cached). Scheduled fires are prompts, so
UserPromptSubmit hooks (mission budget, handoff budget) fire on the parent every tick.

### Restart behaviour (honest)
- **Child crash:** the round is lost beyond its commits, and the next round resumes from the ledger (J1).
- **Parent crash (process):** a background session (`/bg`) is restarted by the Claude
  Code supervisor (fact, agent-view doc), and its `CronCreate` watchdog is restored on
  resume (fact). A Remote Control interactive session reconnects after network loss (fact).
- **Machine reboot:** **nothing restarts it with zero setup** (fact: a reboot stops
  background sessions). The owner re-runs `/agentic-workflow:run` (or `claude --continue`).
  The ledger and the round log make that lossless. **This is the one place the zero-setup
  baseline falls short of "never have to worry"**, and it is why the optional hardening
  (D6) should ship in v1: a single systemd unit, no timer, that on boot runs
  `claude --continue` under Remote Control, or that runs the C timer instead.
  **Assumption:** a `claude --continue` started by systemd needs a TTY for an interactive
  session (verify in P5; otherwise C's timer is the reboot path).

### Locks, stops, crash loop, logs (apply to A and C alike)
- **Lock (gap 8):** `runner.mjs` takes `flock -n $STATE/<project>/lock` for the life of a
  round, with a pid file. A second parent, `ccp run`, a human's manual round, or the C timer
  all exit "busy". A stale lock (dead pid) is reclaimed, and the round log records the lost
  round. Humans editing the tree: `runner.mjs pause` (stop file, reason `human`) is the
  documented step. **Inference:** a lock cannot stop a human from editing files, so the pause
  verb is the honest boundary.
- **Stop conditions:** checked in `runner.mjs next` before any model call. The stop file
  `$STATE/<project>/STOP` (reason + time) clears only via `runner.mjs resume`, a human act.
  Kill-stop from the channel writes the same file. Budget and overrun parse the same ledger
  fields as `hooks/lib/mission-budget.sh` (`Tick budget:`, `Mission budget:`,
  `Estimate`/`Sessions used`), and a shared-fixture test pins parity between hook and runner.
- **Crash loop (gap 6):** the runner keeps a consecutive-failure counter. Backoff is
  30 s → 2 → 8 → 15 min, then **stop + alert on the 3rd consecutive code 1**. Under C, the
  systemd equivalents are `RestartSteps`/`RestartMaxDelaySec`/`RestartPreventExitStatus`
  (fact, https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html).
- **Logs + redaction (gap 9):** the child's stream-json event log is a full transcript
  (fact: warning at `tools/run-claude.mjs` line 72). It goes **only** to
  `$STATE/<project>/rounds/<n>.events.jsonl` (mode 0600, rotated) and never into the parent's
  context, journald or the channel. Everything the runner prints, and every crash-alert tail,
  passes through a Node port of `hl_redact` plus an **exact-value scrub** of every secret in
  the project env. **Negative test:** seed fake `sk-…`, `ghp_…`, `xoxb-…` and Bearer values
  into a fake round's stderr, and assert that none survive in the parent summary, the log or the alert body.
- **Files touched:** `tools/runner.mjs`, `tools/redact.mjs` (new; a parity test against
  `hl_redact`), `commands/run.md` (cron watchdog), `templates/systemd/*` (optional, D6).

---

## D3 — The agent writes the handoff itself (managed and unattended)

**The question.** When the budget nudge or the gate fires, how does the agent write the
handoff with no human, and what replaces "the human fires `/clear`"?

**Mode signal:** the runner sets `AGENTIC_WORKFLOW_UNATTENDED=1` on each child.
**Inference:** hooks inherit the Claude process env, which `AGENTIC_WORKFLOW_CHILD`
already relies on (`handoff-gate.sh` line 34). **Fact:** the hooks reference documents no
`-p`-mode variable (https://code.claude.com/docs/en/hooks), so an explicit variable is
required. Unset means **managed**, which is today's behaviour. A missing variable therefore
degrades to the 5-block fail-open, never a deadlock. A runner test asserts the variable is
set and `AGENTIC_WORKFLOW_CHILD` is not.

### Option A — wording only
The texts change, but the 6th-block fail-open stays. An unattended child that ignores the
gate keeps going and is compacted mid-round. This breaks J3.

### Option B — mode-aware gate; unattended fails closed with a clean stop (recommended)
- **Managed** (the parent, and any owner session): the gate text and
  `commands/handoff.md` `## Then` drop "start a fresh session". The new text is "handoff
  written; continue; compaction will carry it (pre-compact snapshot + compact-resume)".
  `/clear` remains an option the human may choose, not a request. Fail-open stays at 6.
- **Unattended** (children): the text becomes "write the handoff with these values, update
  the ledger, then END this round; a fresh process continues". The fresh child **is** the
  `/clear`. On the 6th block the gate returns
  `{"continue": false, "stopReason": "handoff-gate: no handoff after 5 blocks"}`.
  **Fact:** `continue:false` "stops processing entirely … takes precedence over any
  event-specific decision fields", and the docs apply it to PreToolUse
  (https://code.claude.com/docs/en/hooks). The runner exits `21` and appends the reason to the
  ledger itself. The block-1 mechanical snapshot is already on disk.
- `compact-resume.sh` branch 3 ("tell the human the record is missing") gets an unattended
  wording: "end the round; the runner records it". `pre-compact.sh` needs no change.
- **Parent write-ahead:** the parent rewrites its own small handoff (unit, last exit, round
  number, pending gates, stop state) **every round**. This is the same write-ahead rule the
  ledger already follows. It means the parent's handoff is never more than one round stale,
  even if a compaction slips past the urgent band (D7).
- **Cost of reversal:** low.

### Option C — runner watchdog kills the child at a threshold
It duplicates `hl_band`, kills mid-tool-call, and writes no handoff. It stays as a backstop
only through `--max-budget-usd` and the turn cap.

**Recommendation: B.** **Strongest case against:** `continue:false` from PreToolUse under
`-p` is untested in this plugin (exit code and result subtype are **unverified**). P2 observes
it live; the fallback is for the gate to drop a marker file and the runner to kill the child.
**Files touched:** `hooks/lib/handoff-gate.sh`, `hooks/lib/compact-resume.sh`,
`hooks/lib/handoff-lib.sh` (`hl_unattended`), `commands/handoff.md`, `tools/hook-test.mjs`
(unattended text, 6th-block JSON stop, managed text without the `/clear` ask, `CHILD=1`
still silent), `hooks/hooks.json` descriptions, `docs/WORKFLOW.md` §6.2.

---

## D4 — Fidelity test

**The question.** What proves in CI that seeded decisions, open questions, in-flight state
and the exact next step survive (a) a compaction and (b) a fresh-process restart? What needs
no model, and what needs one?

### Option A — structural only (no model)
- **How it works:** a temp git repo is seeded with a ledger and a local handoff: goal, 3 locked
  decisions with reasons, done/in-flight/**Next**, pointers, 2 open questions, and 2 decoys
  (a retired decision and a closed question), per `…-metrics.md` §4.
  - (a) Compaction: drive `pre-compact.sh` then `compact-resume.sh` (`source: compact`) via
    the existing `runHook` harness in `tools/hook-test.mjs`. Assert that the snapshot exists,
    that the directive names the handoff and the ledger, and that freshness is CURRENT.
  - (b) Restart: assert the child's round prompt (from `runner.mjs round`) names the ledger
    and the handoff.
  - A new `tools/fidelity.mjs` extracts every field from the records the resumed agent is
    pointed at and compares them **exactly** with the seed.
  - Red fixtures: one decision dropped, a decoy resurrected, a stale `_Written:` stamp, the
    handoff not named.
- **Proves** that every field is carried and pointed at. It does **not** prove that the
  agent restates them. **Cost:** $0, about 1 s, and it runs in `lint.yml` with no secrets
  (fact: `.github/workflows/lint.yml` runs `node tools/lint.mjs` only).

### Option B — model only
Same seed. (a) Force compaction with `CLAUDE_CODE_AUTO_COMPACT_WINDOW=100000` (the documented
minimum) plus filler reads. (b) A fresh `-p` resume. Both end with a JSON restatement. Exact
fields are scored in code, semantic fields by a pinned judge (metrics §4). **Assumption:** about
150k input tokens per compaction run and 30k per restart, a few dollars per run at Haiku 5.5
(the owner's floor). It needs a secret and is flaky by nature.

### Option C — split (recommended)
A is the always-on gate: it is red on the old tree, green on the fix, and red on a broken handoff.
B runs as a separate workflow on `workflow_dispatch` and on PRs touching
`hooks/lib/handoff*`, `compact-resume.sh`, `pre-compact.sh` or `tools/runner.mjs`, only when
the secret exists. B also runs once as close evidence. The 24h live run is the real proof.
**Strongest case against:** structural green can coexist with an agent that ignores the
directive. That is why B and the 24h run exist.
**Files touched:** `tools/fidelity.mjs`, `tools/fidelity-test.mjs`,
`tools/fixtures/fidelity/`, `tools/lint.mjs`, `.github/workflows/fidelity-model.yml`.

---

## D5 — Approver routing

**The question.** How does a gate reach the configured approver (owner channel, client
channel, relay session)? How is the answer verified and picked up, with no self-approval?

**Shared core: a deterministic `tools/gate.mjs`** (new; §12 is prose today).
- `gate.mjs open --class <merge|deploy|spend|publish|decision|kill> …` is **the only gate
  call the model may make**. It writes the gate to `.plans/pending-gates.md` (id
  `G-<project>-<hex>`, class, TTL) **before** sending (§12 rule 3), appends it to
  `$STATE/outbox.jsonl`, and the child ends its round (exit 20).
- `gate.mjs poll` runs inside `runner.mjs next`, which is Node, **outside any model turn**.
  It flushes the outbox (gap 5: retried every tick; repeated failure → a local `STATUS` line
  and an alert on the parent), reads replies, verifies them and records them in the decision
  log with the message reference.
- `gate.mjs answer <id> approve|reject|hold [--reason]` is the local fallback (gap 5), for a
  human at the shell. A PreToolUse rule **denies `gate.mjs answer|record` from model Bash**,
  so no agent can answer its own gate. That makes self-approval unrepresentable by shape.
- **Who may answer (gap 4):** the per-project config `approvers` maps roles (owner, client) to
  transport user ids. Classes `spend`, `kill` and scope/overrun are **owner-only, always**.
  `merge`/`deploy`/`publish` accept the owner, or the client when the config grants it. An
  unknown sender is ignored and raises an alert. The first valid answer consumes the nonce,
  later replies get the receipt "already decided by X at T", and junk gets one hint.
- **Timeouts (gap 2):** the TTL is 72 h by default, with reminders at 24 and 48 h. Expiry
  counts as **reject**. `hold --until <date>` mutes the reminders.
- **Gate-class conflict.** §12 rule 4 says irreversible actions are never *fired* from a chat
  tap unless §10 delegates merges, but J4 says "the next round acts on it". Recommended
  reading: a channel or relay approval authorizes decision gates and **staging/non-default
  merges**. **Prod merge, deploy, spend and publish stay human-fired** (the message carries the
  link). **The owner must rule on this before P4.** It is not a locked pick.

### Option A — channel only
§12's daemon-free inbound methods: Slack reactions (`reactions.get`) or typed `approve G-…`,
and Telegram buttons with one bot per project. The client route is a second channel and user id
in the config. It is proven, identity is pinned by the transport, and it needs a Slack token
in the project env.

### Option B — relay session only (Remote Control)
**With D1-A, the parent session is the relay.** The owner already reaches it from
claude.ai or mobile through Remote Control, salla-agent style. Answers must come from the
**owner's own typed prompt**, never from a peer message (fact: a peer message can't
approve). Capture this by shape: a UserPromptSubmit hook, active only while `/run` is active,
matches the literal `^(approve|reject|hold) G-<project>-[0-9a-f]+` in the human prompt and
calls `gate.mjs record --via session`. It skips peer messages and non-owner turns using the
router's existing rule (prompts that open with `<`, `[` or "Another Claude session sent a
message:", `hooks/hooks.json`). The parent **model** never records an answer.
Requirement: a full `claude auth login` for Remote Control (fact, remote-control doc). Its
weakness is that it is a single point of failure.

### Option C — channel always, the session as a second surface (recommended)
Every gate always goes to the channel (gap 11: the relay is never the only route). The parent
session is an additional answer surface with the same nonce and the same `gate.mjs record`.
The first valid answer wins, and the other surface's copy is edited into a receipt. If the
session is offline, nothing is lost. What the plugin ships is `gate.mjs`, the answer-capture
hook, and `/run`'s gate listing. Claude Code supplies Remote Control and its transport. Cross-
session messaging is used at most for **outbound** notices, never for answers.
**Strongest case against:** two answer paths to audit. Mitigation: one `record()` function and
one test matrix (role × class × surface × duplicate).
**Files touched:** `tools/gate.mjs`, `tools/gate-test.mjs`, `hooks/lib/gate-answer.sh` (new),
`hooks/hooks.json` (register it, plus deny rules for model-run `answer|record`),
`commands/connect.md` (`connect approver owner|client`), `docs/WORKFLOW.md` §12 + §10 row,
`templates/gate-classes.md`.

---

## D6 — Setup: zero-install baseline, optional hardening

**The question.** What does "without any special setup" mean concretely, and what is the
optional hardening for a client LXC?

### Option A — zero install (recommended baseline)
The prerequisites are the ones every user of the plugin already has: Claude Code, the
plugin, and a repo bootstrapped with `/agentic-workflow:bootstrap`. Setup is one command
(`/agentic-workflow:run`). The owner may start the session under Remote Control
(`claude --remote-control`, or `/remote-control`) to get salla-agent behaviour.
Project-level knobs (the compaction window from D7, the approver route, budgets) live in
files the workflow already owns: `.claude/settings.json` `env` and the §10 rows,
written by `/bootstrap` or `/sync` with the existing **adopt-never-overwrite** pattern
(fact: `commands/bootstrap.md` lines 114–119 write only the `attribution` key of
`.claude/settings.json`). User settings are never touched without being asked.

### Option B — optional hardening script for a dedicated client LXC (ship in v1, small)
`tools/runner-install.sh <project-config.json>`, idempotent:
- creates a user `aw`; installs Node ≥ 18, git, jq, gh, flock and the claude CLI;
  installs the plugin at a pinned version (both CLI forms **unverified**, P5);
- clones the repo with a per-project deploy key (the `/connect server` precedent,
  `commands/connect.md` step 4);
- writes `/etc/agentic-workflow/<project>.env` (mode 0600) for secrets and
  `/etc/agentic-workflow/<project>.json` for non-secrets;
- installs **one** boot unit, either the D1-C timer or a `claude --continue` session unit
  (the TTY question is in D2);
- finishes with a round-trip test before anything is recorded: a dry `runner.mjs next`, an
  auth probe, a channel test post plus an answered reaction, and `systemctl status`.

The owner's "Runner only" v1 container scope is met by A plus this optional script.

### Auth (gap 7); all facts from https://code.claude.com/docs/en/authentication
| Credential | Expiry | Remote Control | Billing |
|---|---|---|---|
| `claude auth login` (`~/.claude/.credentials.json`, 0600) | refreshes; `Login expired` if it can't | **yes** (needed for the salla-agent shape) | subscription |
| `CLAUDE_CODE_OAUTH_TOKEN` from `claude setup-token` | **1 year**; "can only make model requests" | no | subscription |
| `ANTHROPIC_API_KEY` | key lifetime; always used in `-p` when present | no | API |

**Recommendation:** the parent uses a full login (Remote Control). Children inherit it
(**assumption**, P1), or use a `setup-token`/API key set **only on the child env** by the
runner, which isolates billing. Expiry: auth failure → exit 75 → stop + channel alert. The
`/status` "Login expires in 3 days" warning only shows interactively, so `runner.mjs next`
checks `claude auth status` (**unverified** subcommand) each tick. **Never `--bare`**
(fact: it skips `CLAUDE_CODE_OAUTH_TOKEN`; already refused by `run-claude.mjs`).
Note the Haiku 5.5 price jump on prompts above 100K (fact, model-config) when picking child models.

**Files touched:** `commands/run.md`, `commands/bootstrap.md` and `commands/sync.md`
(settings `env` keys), `tools/runner-install.sh` (optional), `templates/runner-config.json`,
`templates/systemd/*`, `commands/doctor.md` (run/runner rows), README.

---

## D7 — Context rot, rotation thresholds, early compaction

**The question.** Given the goal "never worry about rot, filling up or compaction
degrading anything", is compaction alone enough for the long-lived context? Where should
rotation and compaction thresholds sit, and how are they set with no special setup?

### Option A — compaction only, at the default point (the earlier managed lock)
The window fills to about 967K on 1M models (fact, model-config). Every turn pays for a large
context, and work runs deep into rotting length (Chroma). The compaction paraphrase plus
re-read is the only memory reset. **This does not meet the clarified goal.**

### Option B — thin parent + fresh children + early compaction for the parent (recommended)
- **Children (work):** fresh per round, so they rotate by construction. A child must
  also **end its round before it rots**. Set the child window by env on spawn to
  `CLAUDE_CODE_AUTO_COMPACT_WINDOW=200000` (100000 for Haiku children, matching
  `run-claude.mjs` DEFAULTS). The D3 unattended gate then fires at 85 % × 95 % ×
  200k ≈ **161k tokens** and ends the round with a handoff. One round is one unit,
  so most rounds should end far below that (**inference**; the 24h run measures the
  peak tokens per round).
- **Parent (bookkeeping):** **`CLAUDE_CODE_AUTO_COMPACT_WINDOW=200000`** is the
  recommended early compaction point. The bands move with it automatically (fact:
  `hl_threshold`): advisory ≈ **133k**, urgent ≈ **161.5k**, compaction ≈ **190k**,
  assuming `DEFAULT_PCT=95`, which **OB-32 confirms**.
  - **Why 200k (inference):** steady-state base context (system, tools, CLAUDE.md, skills) is
    about 30–60k, and the parent adds about 1–2k per round. That gives roughly 70–140 rounds
    between compactions.
  - Per-turn input cost scales with context size (cache reads included). An average around
    100–150k instead of up to 950k is about 4–6× cheaper per parent turn. That is the owner's
    "save on tokens".
  - It keeps the parent well inside the length range where degradation is mild.
  - 100k (the minimum) would compact about every 25–50 rounds and leaves only about 15k of
    headroom between the urgent band and the trigger.
  - 300k adds rot and cost for no gain. 200k is the balance.
  - Leave `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` unset: one knob, fewer surprises. It "can't
    raise" the threshold (fact).
- **Does the agent's handoff always land before each early compaction?**
  - **Mostly, by the bands:** urgent fires at 85 % of the trigger, which is about 28k tokens
    before compaction at 200k.
  - **Not guaranteed:** a single tool result larger than that headroom jumps straight past
    it, auto-compaction fires, and the gate never saw urgent.
  - **Covered anyway by shape:** (1) the parent's write-ahead handoff every round (D3) is at
    most one round stale; (2) `pre-compact.sh` **always** writes the mechanical snapshot;
    (3) the ledger is authoritative. So compact-resume always has a fresh record.
  - **Rule for `commands/run.md`:** the parent never reads large files, and anything
    big belongs in a child. This is what makes the headroom argument hold.
- **How it is set, with no special setup:**
  - `/bootstrap` and `/sync` propose
    `.claude/settings.json` → `"env": {"CLAUDE_CODE_AUTO_COMPACT_WINDOW": "200000"}`
    (project scope, adopt-never-overwrite, behind a §10 **Compaction window** row). This is
    project settings, not user settings, consistent with the plugin's rule against editing
    user settings unasked.
  - Fact: settings `env` takes effect "no matter how `claude` was launched".
  - **Assumption** (verify in P0): it reaches hook subprocesses, so `hl_threshold` sees the
    same value. The docs do not state this.
  - **Assumption:** it applies from the **next** session start. If the window is still the
    default, `/run` says so once, with the one-time remedy (restart, or the owner types
    `/autocompact 200000`; an agent cannot run built-in commands, per fact above).
  - **Gap found:** `hl_threshold` reads only the env variable, never the `autoCompactWindow`
    settings key or a `/autocompact` value. Fix in P2 (read the effective setting) or
    `/doctor` flags the mismatch, otherwise the bands sit at 1M while compaction fires at
    200k. The fidelity test needs a case for this.
  - Side effect: project `env` also reaches the owner's own interactive sessions in that
    repo. That is desirable for the same goal, but state it in the §10 row.
- **Managed sessions the owner keeps typing in:** they **are** the parent (the same
  session), so they get the same 200k early compaction and the same delegation discipline.
  A managed session not running `/run` still gets the early window from project settings
  and the D3 managed handoff.
- **Cost of reversal:** zero (delete one settings key).

### Option C — proactive self-rotation of the managed session (a successor session)
At the advisory band the agent writes the handoff, launches a successor (`claude --bg
"/agentic-workflow:run resume"` via Bash) and stops itself.
- **Facts against it:** the docs list no Claude-callable way to start a background session.
  A CLI launch from Bash is **unverified**. `/clear` can't be self-invoked. The successor is
  a new Remote Control session, so the owner's open phone view goes stale. Two parents
  overlap unless the lock is passed precisely.
- **Inference:** B already achieves "compaction's paraphrase is never the only memory"
  (write-ahead handoff + ledger + snapshot, re-read verbatim by compact-resume), without
  these risks.

### Recommendation: B
- **Strongest case against B:** the parent still compacts, so a paraphrase still exists in
  the parent's window after each compaction, and it is never zero. The answer is that the
  parent's decisions come from Node over files, and its handoff is rewritten every round.
- **What would change it:** the 24h run or D4-B showing parent mis-steps after compaction #2
  → adopt C once Claude Code documents an agent-callable fresh-session start. Or drop the
  parent window to 100k.
- **Files touched:** `commands/run.md`, `commands/bootstrap.md`, `commands/sync.md`,
  `hooks/lib/handoff-lib.sh` (effective window), `commands/doctor.md` (window row),
  `docs/WORKFLOW.md` §10 row + §6.2.

---

## OB-32 and OB-1: how they close

- **OB-32** (`.plans/OBLIGATIONS.md` line 72) comes **strictly first (P0)**. On
  orderly-agents with ≥ 1.69.1 installed, run one real session with
  `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000` until it auto-compacts, and record the four
  observations (`…-metrics.md` D1).
  - Add two probes this mission depends on: (a) whether a settings-`env` value reaches the
    hooks' `hl_threshold`; (b) the observed trigger percentage against `DEFAULT_PCT=95`,
    because every band above assumes it.
  - On a mismatch, run `/fix` on the constants before P1. Cost: about 0.5 session plus owner
    wall-clock.
- **OB-1** (line 28) **cannot honestly close first.** Its condition is ≥ 3 new
  true-compaction records. OB-32 supplies #1, and the 24h run (≥ 2 compactions) supplies the
  rest. It is re-measured and fired in the final phase. **Inference:** since v1.68.0 the byte
  bands are only a fallback, so the likely outcome is to keep them and retire the n=1 caveat.
  The planner should word it as "OB-32 first, OB-1 last".

## Session estimate (honest)

| Phase | Content | Sessions |
|---|---|---|
| P0 | OB-32 + the two extra probes; `/fix` constants if needed | 0.5 |
| P1 | `runner.mjs` (next/round/stop/resume/pause/status/update), round lib out of `headless.mjs`, unit pick, exit contract, lock, budget parity, credential inheritance check, tests | 1.5 |
| P2 | `/agentic-workflow:run` (thin parent, background child, child-exit wake, cron watchdog with 7-day renewal, write-ahead parent handoff); D3 mode-aware hooks; `hl_threshold` effective-window fix; settings `env` via bootstrap/sync | 1.5 |
| P3 | D4 structural fidelity (CI) + secret-gated model job | 1 |
| P4 | `gate.mjs` (open/poll/answer/record, outbox, allow-list, TTL/hold, class matrix), Slack/Telegram transport, in-session answer hook | 1.5 |
| P5 | Optional LXC hardening script + one boot unit, redaction port + negative test, auth checks, doctor/§10/§12 docs | 1 |
| P6 | Security pass + 24h live run (setup + recording; 24 h wall clock) + OB-1 re-measure + close | 1 |
| **Total** | | **8** (range 7–10) |

Without P5 (hardening deferred to v1.1) the total is 7, but reboot survival then needs a
human re-run, which falls short of the stated goal. **Recommendation: keep P5.** P2 and P4
carry most of the risk. **Assumption:** the estimate is calibrated against owner-surfaces
(Estimate 7) and precompact-handoff (1 session for one hook bundle). Wall clock for the
24 h run and the owner's OB-32 time are outside the session counts.

## Designer gaps, indexed

| # | Gap | Answered in |
|---|---|---|
| 1 | gate pending while other work exists | D1 unit selection |
| 2 | gate timeout / reminders / hold | D5 core |
| 3 | gate fails open after 5 blocks | D3-B (`continue:false`, exit 21) |
| 4 | who may answer, duplicates, owner-only classes | D5 core |
| 5 | channel outage | D5 core (outbox + local `gate.mjs answer`) |
| 6 | crash-loop backoff + cap | D2 (stop on 3rd consecutive failure) |
| 7 | headless auth expiry | D6 auth table (exit 75, status check per tick) |
| 8 | concurrent writers | D2 lock + `pause` |
| 9 | redaction of crash tails + negative test | D2 logs |
| 10 | plugin version drift | D1 (version per round row; locked `update`) |
| 11 | relay offline | D5-C (channel always gets the gate) |

## Unverified (verify in the named phase)
- **P0:** settings `env` reaches hook subprocesses; `env` takes effect only at the next session start.
- **P1:** `--max-budget-usd` spelling; child `claude -p` inherits the parent's login.
- **P2:** `continue:false` from PreToolUse under `-p`; reading a cron job's age.
- **P5:** a systemd-started interactive `claude --continue` needs a TTY; the plugin-install
  and claude-installer CLI forms; `claude auth status`; the LXC distro family.

Sources: https://code.claude.com/docs/en/scheduled-tasks ·
https://code.claude.com/docs/en/goal · https://code.claude.com/docs/en/agent-view ·
https://code.claude.com/docs/en/remote-control ·
https://code.claude.com/docs/en/cross-session-messaging ·
https://code.claude.com/docs/en/authentication · https://code.claude.com/docs/en/hooks ·
https://code.claude.com/docs/en/model-config · https://code.claude.com/docs/en/env-vars ·
https://research.trychroma.com/context-rot ·
https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html ·
https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html

## Borrowed concepts — Elephant-Goldfish Model (google/elephant-goldfish-model, reviewed 2026-10-27)

Owner asked to use any EGM concept that helps. Two fold into this mission:

- **Comprehension Goldfish → handoff fidelity check (D4).** EGM's
  `agents/comprehension.md` is a zero-context "naive reader" that reads one
  document and flags undefined terms and gaps. Use the same shape for the
  model-side fidelity check: a fresh, read-only subagent gets ONLY the handoff +
  ledger (no transcript) and restates goal, locked decisions, open questions,
  in-flight state and the exact next step; the harness scores it against the
  seed (exact fields exact-match, the rest per the metrics rubric). Tests the
  real question — can a fresh agent continue from the files alone — at a
  fraction of a full-session judge's cost.
- **Plugin-file reads in headless/background runs (P0 probe).** EGM added a
  PreToolUse hook approving Read/Grep/Glob inside its own plugin folders because
  "Claude Code asks for each read in an interactive session and refuses it in a
  headless run or a background subagent" (EGM commit "approve plugin file reads
  with a PreToolUse hook", 2026-10-23). The runner's `claude -p` children and
  background subagents read `${CLAUDE_PLUGIN_ROOT}` agents/templates/tools. P0
  probes whether those reads are refused unattended; if so, ship an equivalent
  narrowly-scoped read-approval hook (plugin root only; deny/ask rules still win).

Kept out of this mission (proposed as separate issues): a multi-lens reviewer
panel with a synthesizer for large plans (incl. EGM's `omitClaudeMd` reviewer
isolation), and a docs-vs-code drift report.

## Counsel (2026-10-27) — two Fable advisors

- **Technical — proceed-with-changes, Estimate 6 (5–7).** (1) Self-approval is
  representable: UserPromptSubmit cannot tell a typed prompt from a
  scheduled-task fire, and the model authors CronCreate prompts; a local
  answer file is writable by the same OS user → v1 answers are channel-only,
  verified by `gate.mjs poll` fetching the reply from the transport API
  (message id + allow-listed user id); drop the in-session surface and local
  fallback. (2) The `*/5` CronCreate watchdog is a cost pump (a cached
  full-context turn every 5 min) and "child exit wakes the parent" is
  unverified → replace with a background `runner.mjs wait` process (zero model
  turns while idle); probe the wake path first. (3) Budget semantics undefined
  → a round is not a session; per-day token/USD ceiling summed from each
  round's reported cost; a no-progress exit with a 2-in-a-row stop. (4) Every
  HITL ask in commands/ must become `gate.mjs open` + exit under `-p`; the gate
  must not kill a round when a builder subagent hits the urgent band. (5) Auth:
  non-bare `claude -p` uses the /login credential (documented); subscription
  usage caps and login expiry break "never worry" → children default to
  `CLAUDE_CODE_OAUTH_TOKEN` or an API key in the child env. Defer P5
  (systemd/LXC, relay session). A 1-hour spike before P1 settles the three
  load-bearing facts.
- **Financial — proceed-smaller, Estimate 5 for v1a.** Idle burn has no
  ceiling (operate rounds + watchdog wakes; no mission ledger → no overrun
  stop): require a daily cap per project, idle backoff (5→15→60 min; ≤ 4
  operate cycles/day; none after an empty one), one API key per client
  container (metering from day 1, never the owner's login in children), and
  tokens/round logged from round 1. Defer gate.mjs routing and the paid
  model-judge job until cost data and a named client exist.
