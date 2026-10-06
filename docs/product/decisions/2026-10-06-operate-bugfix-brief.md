# Feature brief — operate-bugfix (unattended V6 loop: watch, triage, fix, verify on staging, open the PR)

**Date:** 2026-10-06
**Branch:** `feat/launch-media-plan` (plan artifacts; the mission cuts its own branch)
**Class:** two plugin missions, each one session (locked 2026-10-06, see below)
**Status:** APPROVED 2026-10-06 — decisions locked; split into two plugin missions; mission 1 (`operate-triage`) planned first; counsel brief in `docs/product/decision-log.md`
**Depends on:** nothing in code; queued after mission `publish-approval` (owner's
priority answer). The operate loop itself has never run on any venture.

## Problem

Once a venture is live, bugs reported by its users reach nobody. The V6 loop
`/agentic-workflow:operate` is specified (analyst numbers → ops/marketing/
business reviews → one ranked report → record) but has never run: the registry
reads `never` for four of five ventures, the one dated row (AI-Receptionist,
2026-07-08) left no report on disk, Orderly (the only venture with real users)
is not registered, and no scheduler, runbook, or eval scenario exists. Today a
user-filed bug waits until the owner opens a terminal.

The owner's end result, in their words: "when i finish a project, i can run the
operate loop on an always on machine, and the operate loop will watch a bug
report channel, where bugs are filed directly from the built app by its users
and the operate loop will see them and prioritize them and fix them and update
the app autonomously." Amended mid-interview: "its fine if it just open the PR
for the fix" … "after its verified on staging or whwever". And: "a fix
sometimes doesn't require code changes, it could be debugging or
troubleshooting, like when a client in Orderly reports that a branch printer is
offline."

So v1 is an **unattended watch-and-fix loop** that ends at a verified PR:

1. **Watch** — a cron-driven headless run on the owner's Tailscale work server
   polls the venture's GitHub Issues for new `source/user` reports.
2. **Triage** — classify each report: a code bug that is reproducible and
   small (auto-fix); an **operational issue** with no code change (diagnose:
   read production signals, name the cause, recommend the action, draft the
   reply); or escalate to the owner with a written diagnosis and next step.
   Rank by user impact.
3. **Fix** — on a branch, the task-altitude path (`/agentic-workflow:fix` shape:
   reproduce with a test, smallest change, project test gate), bounded to one
   session by the mission-budget hook.
4. **Review** — a fresh independent reviewer; REQUEST CHANGES twice → escalate.
5. **Verify on staging** — deploy the branch to the venture's staging tier and
   run `/agentic-workflow:verify` there.
6. **Open the PR** — `Closes #N`, the trail (report, triage, test, review,
   staging verify) in the body. **The owner merges.** Production deploy follows
   the venture's own flow after merge. The loop never merges, never deploys to
   production.
7. **Digest** — one Slack message a day via the §12 owner channel: fixed
   (PRs awaiting merge), escalated, skipped, spend.

## Interview answers (the owner's words, verbatim)

| Question | Answer |
|---|---|
| How do bug reports reach the loop? | **One queue: GitHub Issues.** The app's in-app 'report a bug' form posts to the venture's GitHub Issues with a `source/user` label. Error-monitor events (Sentry) and the owner-channel Slack can also feed the same queue. The loop watches one place. |
| How far may the loop go on its own? | Round one: "Auto to staging, one-tap production." **Superseded mid-turn by the owner:** "its fine if it just open the PR for the fix" / "after its verified on staging or whwever". Locked reading: fix → review → staging deploy + verify → open PR; the owner merges. |
| What stays OUT of v1? | **The in-app bug-report widget itself; duplicate detection and merging of reports; telling the reporter their bug is fixed; portfolio mode (one loop across all ventures).** |
| What observable result means done? | **n=1 on Orderly, one real user bug end to end.** Orderly registered in the registry; the loop runs unattended on the always-on machine; one bug filed from the app by a real user is triaged, fixed on a branch, reviewed, verified on staging, and lands as a PR the owner merges. Issue shows the whole trail. Plus lint, hook tests and one eval scenario green here. |
| Where does the loop run? | **Your Tailscale work server, cron-driven headless runs.** A cron or launchd job every N minutes runs headless `claude -p "/agentic-workflow:operate watch"` in the venture checkout; each run self-contained; a lock file stops overlapping runs. |
| Which bugs may it fix alone? | **Small and isolated only.** Auto-fix: size XS/S, confined to app code, with a reproducing test. Escalate with a written diagnosis, never attempt: schema/migrations, auth, payments, CI/deploy config, secrets, third-party contracts; anything the reviewer marks REQUEST CHANGES twice; anything not reproducible. |
| Cadence and spend ceiling? | **Poll every 15 min, max 3 fixes a day, 1 session per fix.** Per-fix bound by the mission-budget hook (hard stop at 1.5×). After three attempts the loop only triages and files. Daily digest to Slack. |
| Priority and gate posture? | **After publish-approval, standard gates.** Reviewer on Fable at the checkpoint; human merge. |
| (Pointed out mid-turn) | "a fix sometimes doesn't require code changes, it could be debugging or troubleshooting, like when a client in Orderly reports that a branch printer is offline." |

## Acceptance criteria per journey

### J1. Report arrives (user → queue)
1. The report contract is defined in a template the venture's widget must
   satisfy: title, what the user did, what happened, device/app version,
   optional screenshot URL, reporter handle or anonymous. Posted as a GitHub
   Issue with `source/user` (and `type/bug`); the loop never reads any other
   label as a user report.
2. A report missing the contract's required fields is labelled
   `needs-info` and skipped, not guessed at.

### J2. Watch (the cron run)
1. `/agentic-workflow:operate watch` is a new subcommand: self-contained, idempotent,
   exits 0 on "nothing new". A lock file (with PID and start time) prevents
   overlap; a stale lock older than the per-fix bound is reported, not
   silently cleared.
2. The run reads only issues newer than the last recorded cursor
   (`.plans/operate-watch.state.md`: cursor, daily counters, last digest).
3. The cron recipe (interval, env, log path, the exact `claude -p` line) is
   documented in the venture's runbook and set up by `/agentic-workflow:connect
   server` as an extension of its existing procedure; secrets follow the §12
   rule (names only in the repo).

### J3. Triage
1. Each new report gets one of: `loop/fix` (code change, auto-fix queued),
   `loop/diagnose` (operational, no code change expected), `loop/escalate`
   (owner), `needs-info`. The decision and its reason are a comment on the
   issue. A report may move from `loop/diagnose` to `loop/fix` when the
   diagnosis finds a code cause, and from `loop/fix` to `loop/diagnose` when
   reproduction finds no defect.
2. Escalation classes are a fixed list in the template (schema/migrations,
   auth, payments, CI/deploy config, secrets, third-party contracts, not
   reproducible, size above S). Matching any class escalates; the comment
   names the class.
3. Ranking is by user impact (how many users, how core the flow), with the
   rubric in the template; ties by age.

### J4. Fix (one bounded attempt)
1. Branch `fix/N-<slug>` off the default branch. First act: a failing test
   that reproduces the report. No reproduction → `loop/escalate` with the
   attempt logged.
2. The smallest change; the project test gate (§10 row) green; the
   mission-budget hook bounds the attempt to one session (hard stop at 1.5×);
   overrun → branch pushed as-is, issue comment states where it stopped,
   `loop/escalate`.
3. Daily cap: three fix attempts per venture per day (counter in the state
   file); the fourth report that day is triaged and filed only.

### J4b. Diagnose (no code change)
1. For `loop/diagnose` the loop reads production signals only — the venture's
   logs, health endpoints, device/integration status (for Orderly: the branch
   printer agent's last heartbeat, queued print jobs, the branch's network
   state as the app records it), error monitor, recent deploys — through the
   read-only access the `ops` agent already has. Nothing is mutated.
2. Output on the issue: what was observed (with timestamps), the most likely
   cause, the recommended action, who should take it (venue staff / owner /
   loop-as-code-fix), and a **draft reply to the client** in the venture's
   support voice. Remediation that mutates production (restart a service,
   re-pair a device, re-send jobs) is the human's to fire in v1; the draft
   names the exact step.
3. A diagnosis that finds a code cause re-labels to `loop/fix` and enters J4
   under the same daily cap; an operational cause closes the loop's part with
   `loop/diagnosed` and the digest lists it.
4. No signal reachable (no logs, no status endpoint) → `loop/escalate` with
   "could not observe" stated, never a guessed cause.

### J5. Review and staging verify
1. A fresh `reviewer` (six lenses) on the diff. REQUEST CHANGES → one
   corrective pass; a second REQUEST CHANGES → `loop/escalate`, branch kept.
2. Branch deployed to the venture's staging tier per its §10 Staging row;
   `/agentic-workflow:verify <staging-url>` runs; FAIL → `loop/escalate` with
   the verify report attached.

### J6. PR and digest
1. `gh pr create` with `Closes #N` and the trail: report link, triage
   comment, test name, review verdict + commit, staging verify result and
   SHA, spend. Label `loop/ready`.
2. The loop never merges, never pushes to the default branch, never deploys
   to production, never messages the reporter. The §3 push/merge guardrails
   stay in force unchanged.
3. Once a day (or on the first fix of the day) a §12 digest: PRs awaiting
   merge, escalations, skipped, spend; an incident-class escalation sends an
   Alert immediately.

### J7. n=1 on Orderly
1. Orderly registered in the registry (its row was missing).
2. One real user report flows J1 → J6 unattended; the owner merges the PR.
3. Here: lint green, hook-harness cases for the lock/cursor/daily-cap
   behaviour, one eval scenario (`operate-watch`) with a synthetic report.

## NOT in v1 (deferred, not denied)
- The in-app bug-report widget (venture-side; v1 ships the contract only).
- Duplicate detection and merging of reports.
- Telling the reporter the bug is fixed (the loop drafts a reply in J4b; a
  human sends it).
- Remediation actions on production (restart, re-pair, re-send) by the loop.
- Portfolio mode (one loop across ventures).
- Merge delegation and any production deploy by the loop (owner's amended
  answer: the PR is the finish line).
- The full operate report (analyst + three reviews); `watch` is a narrow
  subcommand of `/operate`, not the weekly cycle.

## Constraints
- §11 unchanged: the loop opens PRs; merge and production deploy are the
  human's. §3 guardrails apply to the headless run exactly as to a session.
- Unattended means fail closed: no reproduction, no review, no staging verify
  → escalate, never guess. Silence must be visible: a run that cannot reach
  GitHub, the server, or staging reports that in the digest.
- Report text is untrusted data (prompt-injection surface): a report never
  chooses files, commands, or scope; the escalation classes are not
  overridable by report content.
- Spend: per-fix bound (mission-budget hook), daily cap, digest line; the
  August 2026 credit-burn lesson applies.
- Runtime: the headless run is `claude -p`; a codex-runtime variant is not in
  v1 (hooks do not fire there).

## Shape decisions for the architect (memos, 2–3 options each)
1. **Where `watch` lives**: a subcommand of `/operate` vs a new command
   (`/agentic-workflow:watch`) vs a mode of `/fix`.
2. **State and cursor storage**: `.plans/operate-watch.state.md` vs issue
   labels only (stateless, GitHub as the truth) vs both.
3. **Headless invocation shape**: one `claude -p` per run doing watch + fix
   inline vs watch-only run that spawns a separate `claude -p` per fix (each
   fix a fresh context, bounded separately).
4. **Staging deploy mechanism** for a fix branch on Orderly: its existing
   staging flow (what is it? resolve from `xyzhub/orderly` `docs/WORKFLOW.md`
   §10) vs a per-PR preview environment vs skip staging and verify locally
   (violates the owner's "after it's verified on staging").
5. **Lock, overlap and crash recovery**: lock file vs `flock` vs GitHub label
   as the lock.
6. **Triage rubric encoding**: template table the agent reads vs a
   deterministic script over labels/paths vs reviewer-only.
7. **Server setup**: extend `/connect server` with a `cron` step vs a separate
   `/operate install` subcommand vs documented-only.
8. **Production read access for diagnosis**: which read-only signals the loop
   may query on Orderly (Fly logs, health endpoints, the printer-agent
   heartbeat table, Sentry) and how the credential is scoped read-only (a
   separate token vs the deploy token with mutation treated as forbidden by
   prompt only, which is not a scope); and whether any remediation is safe
   enough to delegate later (deferred, name the candidates).

## Locked decisions

Dated, the owner's picks at the approval moment (2026-10-06), after three
reformulations the owner asked for, with the counsel brief
(`docs/product/decision-log.md`, same date) in hand. Companion drafts:
`-journeys.md`, `-memos.md` (13 memos), `-metrics.md`. **Where a locked
decision contradicts an acceptance criterion above, the lock wins; the planner
reads the criteria through this table.**

| # | Decision | Locked (2026-10-06) |
|---|---|---|
| L0 | Repo boundary | **This work is plugin-only.** It does not touch Orderly. The owner's words: "this work is about the agentic-workflow it does not touches Orderly but it lays out the mechanics of the in-app bug reporting system so that an agent running on Orderly can understand how and what to build to make it happen." The registry question (memo 13) is moot: Orderly stays unregistered; a venture session reads the spec from the plugin. |
| L1 | Support channel shape | **Two-way support thread in-app**, the venture's official support channel (the owner: "we don't want to use whatsapp as the primary support channel, we want to give clients an official support channel in-app"). Venue staff open a ticket, see status, read replies there. Each ticket syncs to a `source/user` GitHub issue; the loop's diagnosis and the owner's reply post back into the thread. Reports today arrive on the owner's WhatsApp; that is a stopgap, not the channel. |
| L2 | Scope of mission 1 | **Spec + triage/diagnose modes + digest.** (1) A venture-facing build spec (template) for L1: data model, report contract, issue sync and labels, status/reply flow, the read-only ops-signals endpoint shape (device heartbeat, job status), written so a venture session can run `/agentic-workflow:plan` from it. (2) `/operate triage #N` and `diagnose #N` modes: rubric, escalation classes, diagnosis comment with draft client reply. (3) The digest. Fix path, watcher and server setup are **mission 2**. |
| L3 | Done for mission 1 | **Plugin proof + spec judged buildable; venture n=1 as an obligation.** Lint, hook harness and an eval scenario green with a synthetic report; a fresh reviewer reads the spec as if it were the venture's build agent and returns BUILDABLE or findings; the real end-to-end (one venue report triaged and diagnosed through the in-app channel) is a deferred obligation that fires when a venture ships the channel. |
| L4 | Runner | **Tailscale server cron on the subscription token** (the owner's original answer, kept against counsel's objection that unattended ticks are outside "ordinary individual usage" and draw the weekly allowance unseen). Recorded as the owner's decision. Mitigations locked with it: L5-G3 ceilings; the CLI version pinned on the server with auto-update off; a preflight on every tick that proves the plugin and hooks loaded (a dry push probe expecting the `BLOCKED:` text) and fails closed; the subscription-usage question re-checked before mission 2's cron line is written. |
| L5-G1 | Model never pushes or merges directly | Locked. Fix-mode allowlist drops `Bash(git *)`, `Bash(curl *)` and slot `--steal`; the deterministic, self-tested watcher performs every push, PR and staging merge with the branch pinned; an eval check asserts no push in any step transcript. |
| L5-G2 | Staging merge | **Owner's rule replaces counsel's PR-first:** "i want the agent to diagnose and fix the issue on staging when it can, I merge to production, but agent merges to staging carefully." Locked reading: the loop may merge a fix into the venture's staging branch ONLY (a) under a dated §10 Merge-policy delegation scoped to that branch and to the loop, (b) after the fresh reviewer APPROVEs and the test gate is green, (c) through the venture's own slot protocol (never `--steal`, never a force push, rebase first, CI green on the merge commit), (d) with `/verify` run on staging after the deploy; (e) a FAIL opens a revert PR and escalates, the loop never touches staging again for that issue. The PR to production (staging → main promote) is the owner's, always. J6.2 "never merges" is superseded for the staging branch only. |
| L5-G3 | Spend ceilings | Locked. A USD-or-turn ceiling summed over every model step per day and per week, a per-day cap on triage and diagnose runs (not just fixes), hard pause + Slack line when hit, a label-driven pause switch. The most important guardrail given L4. |
| L5-G4 | Single-venue device outage | Locked: **Alert tier** (immediate Slack with the draft reply). Per-venture configurable in the spec so it can be turned down later. |

### Mission 1 — `operate-triage`, planned now
Deliverables per L2: `templates/support-channel-spec.md` (the venture build spec,
with the report contract, label set, sync rules, reply flow, ops-signals
endpoint shape, per-venture alert config), `templates/operate-triage.md`
(rubric + escalation classes), `/operate triage|diagnose|digest` modes in
`commands/operate.md`, the diagnosis/triage comment formats from the journeys
doc, the §12 digest and Alert wiring (venture must have `/connect slack`),
hook-harness cases where mechanical, one eval scenario with a synthetic
report, a BUILDABLE review of the spec, WORKFLOW/README/CHANGELOG. No watcher,
no server, no fix mode, no venture code.

### Mission 2 — `operate-fix`, planned after mission 1 merges and reports flow
Fix path (J4, J5, J6 as amended by L5-G1/G2), `tools/operate-watch.mjs`
(lock, cursor, caps per L5-G3, labels, push/PR/staging-merge by the watcher),
`/connect server <host> loop` incl. CLI pin + preflight, the §10 delegation
row grammar for a staging-branch merge, the staging-merge revert path, the
`operate-watch` end-to-end eval. Precondition: 10 real reports through a
venture's channel.
