---
status: frozen
owner-agent: architect
refresh-trigger: never
---

# agentic-workflow — Decision memos: operate-bugfix shape

_Companion to `2026-10-06-operate-bugfix-brief.md`. Eight memos for the brief's
shape decisions plus five it missed (9–13). Each claim is **fact** (cited),
**inference**, or **assumption**. The architect consults; the human locks._

## Facts every memo leans on

**Plugin / Claude Code** (code.claude.com `headless` + `cli-reference`, fetched 2026-10-06)
- **F1** A non-`--bare` `claude -p` run loads plugins and runs hooks; `--bare` skips
  hooks, plugins, commands, CLAUDE.md. This repo relies on it: `evals/run.mjs:124`
  runs `-p --plugin-dir`, and `guardrail-push-block/checks.mjs` asserts the
  push-block hook text headless.
- **F2** Flags: `--permission-mode dontAsk` denies anything no allow rule covers;
  `--permission-prompts none` (≥ v2.1.259) removes `AskUserQuestion` and denies
  instead of waiting; `--allowedTools "Bash(gh issue *)"` prefix rules;
  `--max-turns`; `--max-budget-usd` (client-side estimate); `--output-format json`
  returns `total_cost_usd`, `session_id`, `permission_denials`; SIGTERM → exit 143,
  only `SessionEnd` hooks run; `claude setup-token` mints a long-lived OAuth token
  for scripts, "requires a Claude subscription".
- **F3** `hooks/lib/active-ledger.sh` globs `.plans/*.state.md`, newest mtime first;
  a file with no `Status:`, `Sessions used ≥ 1` and a `- [ ]` row is the active
  ledger — a `.plans/operate-watch.state.md` would hijack every hook in every
  Orderly session.
- **F4** `mission-budget.sh` counts **sessions** (`2k ≥ 3N`; N=1 fires at k=2). One
  `claude -p` run is one session; the hook cannot bound turns inside a run.
- **F5** `tools/hook-test.mjs` cases = `{event, desc, input, ledgers, files}` →
  exit + nudge; `tools/lint.mjs` runs it and the `--selftest` runners, failing
  closed when a runner is missing. Eval scenario = `scenario.md` + `rubric.md` +
  `checks.mjs` + `fixture/` + `setup.sh`.
- **F6** Slack send precedent: inline `curl chat.postMessage` (`agents/compass.md:74`);
  no shared sender. `/connect server` = SSH + docker context for remote execution
  from a local session; records §10 **Remote executor** (`connect.md:122-165`).
- **F7** `flock(1)` is util-linux, absent from the macOS base; the brief allows
  launchd, so the server OS is unresolved (**assumption**: Linux).

**Orderly** (`xyzhub/orderly`, PRIVATE, default `main`; its `docs/WORKFLOW.md` §10 via `gh api`, 2026-10-06)
- **F8** Staging = integration branch `v5` → `orderly-staging.fly.dev`;
  `deploy-staging.yml` ships every `v5` push (`paths-ignore: **.md`). **All work
  branches from `v5`, every PR targets `v5`**; `v5→main` promote is owner-only.
  Merge policy **agent-may-merge into `v5`** under the slot protocol
  (`tools/v5-slot.mjs claim|stage|release`, atomic ref `refs/locks/v5-slot`, 45-min
  heartbeat; `.claude/hooks/v5-merge-guard.mjs` blocks `gh pr merge` into v5
  without a fresh slot, **fails open on gh errors**). No per-PR preview workflow.
- **F9** Owner channel `none`; Remote executor `none`; Portfolio `none` — "Orderly
  is deliberately NOT registered" (owner, 2026-08-19). Test gate: vitest +
  `test:integration` against a scratch Postgres over Tailscale, single-flight via
  `test:integration:guarded`, never wrapped in `timeout` (LA-3).
- **F10** Labels present: `type/*`, `size/*`, `v5-slot`, `needs-owner`, `stale`.
  Absent: `source/user`, `loop/*`, `needs-info`.
- **F11** Printer signals: `PrintDevice.lastSeenAt` (server clock, 10 s throttle,
  `POST /api/agent/v1/heartbeat`), `PrintDevice.status`, `PrintJob.status
  queued|claimed|printed|failed|expired|voided`, `PrintJob.lastError` + coarse
  token (`offline|timeout|no_printer…`). Live-verify = `/api/health` + "Sentry
  clean". Prod DB is managed `orderly-prod-db` (Fly-level auth); only the scratch
  DB is on Tailscale. No `docs/product/engineering/runbook.md`.
- **F12** `fly tokens create readonly -o <org> -x <ttl>` cannot deploy, restart or
  scale (fly.io/docs/security/tokens). Sentry org tokens are CI-scoped; reads need
  a **user** token with `event:read, project:read, org:read` (docs.sentry.io API
  pages via secondary summary — verify on creation).

---

## Memo 1 — Where `watch` lives

**Question.** Which command owns the loop's entry points? Constrains the cron
line, §9, and the prompt each headless run loads.

| Option | How it works here | Tradeoffs | Reversal |
|---|---|---|---|
| **A. `$ARGUMENTS` modes of `/operate`**: `watch`, `triage #N`, `fix #N`, `diagnose #N`, `digest` | Same pattern as `connect.md` (`server`, `codex`); bare `/operate` stays the weekly cycle | One file, two jobs; weekly text loaded on every run (~4 KB — inference: negligible) | Cheap: split later |
| **B. New `/agentic-workflow:watch`** | Own file, own §9 row | A second V6 command; the brief and §0 name V6 as `/operate` | Cheap |
| **C. `/fix --loop` mode** | Fix shape exists | Watch/triage/diagnose are not fixes; `/fix` would grow a reviewer spawn, labels, a cap | Medium |

**Recommendation: A**, deterministic parts outside the prompt (memo 3). **Case
against:** `operate.md` grows 77 → ~200 lines. **Changes the answer:** mode text
outgrowing the weekly text → B.
**Files:** `commands/operate.md`, `templates/WORKFLOW.md` §9, `README.md`.

## Memo 2 — State and cursor storage

**Question.** Where do cursor, daily counters and last-digest live? Constrains
crash recovery and the hooks (F3).

| Option | How it works here | Tradeoffs | Reversal |
|---|---|---|---|
| **A. `.plans/operate-watch.state.md`** (brief) | Markdown in tracked `.plans/` | The loop's checkout sits on `v5`/`main`, so the push guard means it can **never commit** this file: machine-local in a tracked dir (sub-ignore), and as `*.state.md` it becomes the active ledger (F3) | Cheap |
| **B. GitHub only**: "new" = `source/user` AND no `loop/*`; counters from label timestamps | Nothing on disk; restartable from any machine | Cap and digest timing on eventually-consistent search (inference: minutes); extra API calls per tick | Cheap |
| **C. Both**: labels are the truth; machine-local cache `~/.local/state/agentic-workflow/<repo>/watch.json` (cursor, per-day counters, last digest, last tick result), rebuilt from labels when absent | Exact counters, cheap ticks, never a `.state.md`, never in the repo | Two places, one derivation rule (cache ⊂ labels) | Cheap |

**Recommendation: C.** **Case against:** state outside the repo is invisible to a
reviewer — mitigated by `operate watch status` and the digest. **Changes the
answer:** none at this scale.
**Files:** `tools/operate-watch.mjs`, `templates/WORKFLOW.md` §4 (label set),
`commands/operate.md`.

## Memo 3 — Headless invocation shape

**Question.** One `claude -p` per tick, or a watcher spawning one `claude -p` per
step? Constrains idle cost, context freshness, and what is testable without tokens.

| Option | How it works here | Tradeoffs | Reversal |
|---|---|---|---|
| **A. One `claude -p "/operate watch"` per tick** | The prompt polls, triages, fixes, digests | 96 model calls/day even when nothing is new; lock/cursor/cap in prose → untestable; fix shares context with the poll | Medium |
| **B. Zero-dep watcher `tools/operate-watch.mjs` (cron target) spawning `claude -p` per step** | Node does lock, cursor, cap, labels, digest; spawns `claude -p "/agentic-workflow:operate triage #N"` (read-only tools), then `fix #N` or `diagnose #N` as separate processes, each with `--max-turns`, `--max-budget-usd`, a wall-clock kill | Idle tick = $0; fresh context per step by construction; `--selftest` covers lock/cursor/cap (F5); per-step `total_cost_usd` feeds the digest | Cheap: prompts unchanged |
| **C. Watcher + one `claude -p` per issue** | Fewer processes | Triage (reads untrusted text) shares a context and tool grant with the fix (writes code) — memo 12 | Cheap |

**Recommendation: B.** The only shape where the brief's lock/cap/cursor cases are
tier-1 tests and triage has no write tools. **Case against:** a second
orchestrator outside the prompt; keep it ≤ 400 lines, pure core + injectable
`gh`/`claude` runners like `v5-slot.mjs` and `ci-wait.mjs`.
**Files:** `tools/operate-watch.mjs`, `tools/operate-watch-test.mjs`,
`tools/lint.mjs` (`checkOperateWatchSelftest`, ci-wait shape), `commands/operate.md`.

## Memo 4 — Staging deploy for a fix branch on Orderly

**Question.** How is a fix verified on staging before the owner's merge, when
Orderly's staging **is** `v5` (F8) and the only way to deploy a branch there is to
merge it?

| Option | How it works here | Tradeoffs | Reversal |
|---|---|---|---|
| **A. Merge-to-staging under the venture's delegation**: PR targets `v5`; the loop runs `v5-slot.mjs claim --hold full`, rebases, `ci-wait` green, merges, `stage merged:<sha>`, waits for deploy-staging, runs `/verify https://orderly-staging.fly.dev`, `release`. The owner's merge is the `v5→main` promote | Orderly's own documented, tool-enforced flow; "verified on staging" before the human merge, **unattended**; the plugin's merge hook allows it because §10 says `agent-may-merge` | The loop performs a merge — J6.2's "never merges" vs the owner's "opens the PR" conflict only in wording here, since v5 is not production; verify FAIL → the loop opens a **revert PR** and escalates (never reverts itself); a stale human slot blocks the loop (never `--steal`) | Medium |
| **B. PR first, verify after the human merges to `v5`**: PR opened with `loop/ready`; a later tick sees the merge, waits for deploy-staging, verifies, comments | No loop merge; generic for `human-only` ventures | Two human touches on Orderly; staging verify lands after the first merge, before the promote | Cheap |
| **C. Per-PR preview app** (fly-pr-review-apps + scratch DB per PR) | True pre-merge verify | New workflow, per-PR DB seeding, Fly cost; not boring | Medium |

**Recommendation: profile-driven — A where §10 Merge policy delegates the staging
branch (Orderly), B elsewhere; never C in v1 (local-only verify, option D, violates the owner's words).** The watcher reads the §10
Staging and Merge policy rows and picks. **Case against A:** an unattended write
to a shared branch, guarded by a hook that fails open (F8). **Changes the answer:**
the owner wants zero loop merges → lock B and accept the extra touch.
**Files:** `commands/operate.md` (fix mode), `tools/operate-watch.mjs` (policy
read); venture runbook recipe (`v5-slot` calls).

## Memo 5 — Lock, overlap and crash recovery

| Option | How it works here | Tradeoffs | Reversal |
|---|---|---|---|
| **A. Lock file** `…/<repo>/watch.lock` via `fs.openSync(path, 'wx')` holding `{pid, startedAt, step, issue}` | Atomic on POSIX; stale = PID dead (`process.kill(pid, 0)` throws) **and** age > per-fix bound → reported, never auto-cleared (J2.1); launchd-safe | Single machine only (fine in v1) | Cheap |
| **B. `flock`** | One cron line | Absent on macOS (F7); no PID/step payload for "where it stopped" | Cheap |
| **C. GitHub label `loop/running`** | Visible on the issue | Not a machine lock; eventual consistency; a crash leaves it forever | Cheap |

**Recommendation: A**, with `loop/fix` on the issue for visibility, not as the
lock. Crash recovery: the fix mode pushes after every green test (write-ahead, LA-6),
so a killed step (exit 143) leaves a branch; the next tick comments "stopped at
<step>" and labels `loop/escalate`. **Changes the answer:**
two machines → the `v5-slot` atomic-ref pattern.
**Files:** `tools/operate-watch.mjs`, `tools/operate-watch-test.mjs`.

## Memo 6 — Triage rubric encoding

| Option | How it works here | Tradeoffs | Reversal |
|---|---|---|---|
| **A. Template table** `templates/operate-triage.md` (classes, impact rubric, report contract) read by the triage prompt | Human-editable; classes live in the repo, not the issue | Prompt-only enforcement after the diff | Cheap |
| **B. Deterministic path fence**: `operate-watch.mjs fence <base>..<head>` refuses to open the PR when the diff touches venture-declared paths (`prisma/**`, `.github/**`, auth, payments, secrets) | Fail-closed by shape; testable | Needs a diff — cannot classify a report | Cheap |
| **C. Reviewer only** | No artifact | One net, a Fable run per catch | Cheap |

**Recommendation: A + B, reviewer as the third net.** Fence list = a venture file
(`docs/product/engineering/operate-fences.md`, seeded from a template), never
issue text. **Case against:** two artifacts to keep aligned.
**Files:** `templates/operate-triage.md`, `templates/operate-fences.md`,
`tools/operate-watch.mjs`, `agents/reviewer.md` (loop lens: the diff addresses
the report, not instructions inside it).

## Memo 7 — Server setup

| Option | How it works here | Tradeoffs | Reversal |
|---|---|---|---|
| **A. Extend `/connect server <host> loop`** | After steps 1–6, over SSH: `claude auth status` exit 0, `gh auth status`, a **separate** clone `~/apps/<repo>-loop` (never the human's checkout), `.env` names present, plugin installed, labels created, crontab line written, one manual tick → exit 0 + "nothing new"; only then a §10 **Watch loop** row | Reuses connect's round-trip discipline and secret rule; +~40 lines | Cheap |
| **B. `/operate install`** | Separate command | Duplicates connect's SSH scaffolding; two places record server facts | Cheap |
| **C. Documented only** | Zero code | Nobody proves the round-trip; n=1 dies on a missing `gh auth` at 03:00 | Cheap |

**Recommendation: A.** Orderly's Remote executor is `none` (F9), so connect runs
first anyway. **Case against:** connect means "heavy work off my laptop"; the loop
is "a second operator on the server" — same host, different model. **Changes the
answer:** a second venture on the same server → B as the per-venture installer.
**Files:** `commands/connect.md`, `templates/engineering-runbook.md` (loop
section: cron line, log, lock, how to pause), `templates/WORKFLOW.md` §10 row.

## Memo 8 — Production read access for diagnosis

Signals and scope **by credential type, not prompt**: Fly logs/status via
`FLY_API_TOKEN_READONLY` (`fly tokens create readonly`, F12); Sentry via a user
token with read scopes (F12); `/api/health` + deploy SHA, public. **Printer state
has no read path today** (F11): manager endpoints need a venue login, prod has no
test users, the prod DB is not on Tailscale.

| Option for printer state | How it works here | Tradeoffs | Reversal |
|---|---|---|---|
| **A. Read-only Postgres role** on `orderly-prod-db` via `fly mpg connect` | `GRANT SELECT` on four tables; scope is the role | A prod DB path from the server; tenant data visible | Medium |
| **B. Internal ops endpoint** `GET /api/ops/print-status?venue=…` behind `OPS_READ_TOKEN`, fixed liveness projection (no PII) | Cannot write by shape; small reviewable venture change | One more token; a token-gated public surface — rate-limit and log it | Cheap |
| **C. Logs/Sentry inference only** | No new access | Cannot answer "is the box alive"; the `agent.offline` sweep is a design row (2026-07-25), not code (inference) | Cheap |

**Recommendation: B** plus the Fly/Sentry read tokens. Deferred remediation
candidates, safest first: re-send queued jobs (idempotent via `dedupKey`), request
a sweep (#1130), restart a Fly machine — each behind a future §10 delegation row. **Changes the answer:** an Orderly device-status admin API appears → reuse.
**Files:** `agents/ops.md` (diagnose contract), `templates/operate-triage.md`
(signal table), runbook (token NAMES); venture: endpoint + tokens.

## Memo 9 — Unattended auth and permissions (missed)

Per step: `claude -p "/agentic-workflow:operate <mode> #N" --permission-mode
dontAsk --permission-prompts none --allowedTools <per-mode list> --max-turns N
--max-budget-usd X --output-format json` (F2). Triage/diagnose allowlist: Read,
Grep, Glob, `Bash(gh issue *)`, `Bash(fly logs *)`, `Bash(curl *)`; fix adds Edit,
Write, `Bash(git *)`, `Bash(pnpm *)`, `Bash(gh pr create *)`, `Bash(node
tools/v5-slot.mjs *)`. Never `--dangerously-skip-permissions`; never `--bare`
(hooks would not fire, F1). Auth: `claude setup-token` (subscription) or an API
key via `claude auth login --console`. **Assumption to confirm before n=1:** that
unattended cron use is within the subscription terms; otherwise the API-key path
and its visible `total_cost_usd` per step is the plan.

## Memo 10 — Fresh context and the per-fix bound (missed)

Fresh context per step is free under memo 3B (new process, no `--continue`). The
brief's "bounded by the mission-budget hook" is mis-shaped (F4): the real bounds
are `--max-turns`, `--max-budget-usd` and the watcher's wall-clock SIGTERM (never
`timeout(1)` around the integration suite, LA-3). The hook can still supply the
**corrective count** via a transient `.plans/loop-fix-N.state.md` (`Estimate: 1`,
`Sessions used: k`, sub-ignored, deleted on exit; k=2 → 🛑 on the first prompt) —
in the loop's own checkout it is the newest ledger, so it wins over Orderly's
human missions. **Recommendation:** the watcher's refusal of a third attempt is
the bound; the transient ledger is optional and dropped if the sub-ignore is
awkward.

## Memo 11 — Digest and Orderly's missing channel (missed)

Orderly has **no owner channel** (F9): J6.3 needs `/agentic-workflow:connect slack`
there first, reusing the machine-wide token with a **private per-project channel**
(§12). Sender: the watcher posts via Node `fetch` to `chat.postMessage` with the
venture's `$SLACK_BOT_TOKEN`/`$SLACK_OWNER_DM`, prefixed `[orderly]` — the
`compass.md:74` call, not a new library. A failed send is cached and retried next
tick; a tick that cannot reach GitHub, Fly or staging writes a "could not observe"
line the next digest carries.

## Memo 12 — Prompt-injection surface (missed)

By shape: (1) the watcher passes **only the issue number**; the body arrives as a
tool result framed as untrusted; (2) triage has no Write/Edit and a `gh issue`
allowlist; (3) classes and fences live in templates/venture files (memo 6);
(4) `dontAsk` denies anything outside the allowlist; (5) reviewer loop lens;
(6) §3 push/merge guards unchanged (F1). Residual (inference): a report steering
the fix toward a wrong file inside allowed paths — the test-first rule and the
reviewer are the nets.

## Memo 13 — Orderly prerequisites the brief did not list (missed)

- **Registry conflict:** J7.1 registers Orderly; its §10 records the owner's
  decision not to (F9). Reverse it in writing or drop J7.1.
- **Labels to create** (F10): `source/user`, `needs-info`,
  `loop/{fix,diagnose,diagnosed,escalate,ready}` — in the connect `loop` step.
- **Remote executor `none`** → `/connect server` precedes the loop step.
- **No runbook** (F11) → the loop step seeds it from the template.
- **Integration gate on the server** needs `TEST_DATABASE_URL` to the Tailscale
  scratch Postgres; the fix mode calls `test:integration:guarded`, never the raw
  suite (F9).

---

## Summary table

| # | Decision | Recommended |
|---|---|---|
| 1 | Where `watch` lives | `$ARGUMENTS` modes of `/operate` (`watch|triage|fix|diagnose|digest`) |
| 2 | State | Labels are the truth; machine-local JSON cache outside the repo; never a `.state.md` |
| 3 | Invocation | Zero-dep `tools/operate-watch.mjs` on cron; one bounded `claude -p` per step |
| 4 | Staging on Orderly | Merge to `v5` under the slot where §10 delegates it; PR-first elsewhere |
| 5 | Lock | `wx` lock file with PID/step; stale reported, never cleared |
| 6 | Triage | Template rubric + deterministic post-diff path fence + reviewer lens |
| 7 | Server | `/connect server <host> loop` step, round-trip verified |
| 8 | Prod reads | Fly read-only token, Sentry read user token, small ops read endpoint for printers |
| 9 | Auth/permissions | `dontAsk` + `--permission-prompts none` + per-mode allowlist; never `--bare` |
| 10 | Per-fix bound | Watcher turns/budget/wall-clock; the hook is not the bound |
| 11 | Digest | `/connect slack` on Orderly first; watcher posts via `fetch` |
| 12 | Injection | Issue number only; read-only triage; fences outside the issue |
| 13 | Prereqs | Registry reversal, labels, server connect, runbook seed, guarded integration |

_The human locks; choices land in the mission master plan pointing here._
