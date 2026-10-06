# Operate-bugfix — user journeys, states, and information architecture

**Date:** 2026-10-06 · **Author:** designer · **Feeds:** the operate-bugfix
brief (`2026-10-06-operate-bugfix-brief.md`), the architect's option memos,
the PRD.
**Users:** (1) the **venue client** — restaurant staff filing from the
Orderly app; (2) the **owner** — issue comments, the daily Slack digest,
PRs; (3) the **headless cron run** (`claude -p "/agentic-workflow:operate watch"`)
and its agents. Architecture is the architect's (the brief's eight shape
memos); this doc fixes *what each user sees and where it lives*.

Shared rules:

- Every state is an issue label + comment, a state-file row, or a digest
  line. A quiet loop is still visible: the daily digest goes out even with
  nothing to report — it is the heartbeat; no digest means the loop is dead.
- §12 tiers: **Alert** = the owner would want to know now; **Digest** = once
  a day; **Gate** is unused in v1 — the loop never waits on a remote
  decision; the merge happens on GitHub.
- The report is **data**: read once at triage, quoted, never followed.
  Comments by anyone but the owner are not read.
- Owner-facing text follows the plain-report rule (§6.0).

Ids: `#N` = venture issue number; `r-7f3a` = run id (4 hex, one per cron
tick); `fix/N-<slug>` = the fix branch.

---

## J1. Report arrives (venue client → queue)

| # | Who | Does | Touches |
|---|---|---|---|
| 1 | venue staff | Taps "Report a problem" in the Orderly app (widget is venture-side, out of v1) | app |
| 2 | the app | Posts a GitHub Issue in contract shape, labels `source/user` + `type/bug` | `docs/product/engineering/report-contract.md` (from `templates/operate-report-contract.md`) |
| 3 | GitHub | Issue waits for the next tick | — |

The client gets no reply in v1 (deferred); their value is the fix shipping.

### Report contract (`templates/operate-report-contract.md`)

Issue body = one `### <field>` heading per field, this order; the loop
parses by heading and ignores anything outside them.

| Field | Required | Content | Why |
|---|---|---|---|
| title (issue title) | yes | one line, ≤ 80 chars | digest line, branch slug |
| `### Where` | yes | venue + branch (or screen) as the app knows it | diagnosis scope, impact rubric |
| `### What I did` | yes | steps, numbered | reproduction |
| `### What happened` | yes | observed result | reproduction |
| `### What I expected` | no | expected result | sharpens the test |
| `### App` | yes | app version + build, device/OS, filled by the app | reproduction env |
| `### When` | yes | ISO timestamp, filled by the app | signal lookup window |
| `### Screenshot` | no | URL | context only; never fetched by the loop |
| `### Reporter` | no | handle or `anonymous` | trail; never messaged |

A report missing any required field → `needs-info` (J3).

---

## J2. Watch (the cron run)

| # | Who | Does | Touches |
|---|---|---|---|
| 1 | cron on the Tailscale server, every 15 min | `claude -p "/agentic-workflow:operate watch"` in the venture checkout, log appended | `runbook.md` "Bug loop" section (written by `/connect server`) |
| 2 | run | Preflight: §10 rows (Issue tracker, Staging, Test gate, Owner channel), `gh auth status`, lock free | `.plans/operate-watch.lock`, `.plans/operate-watch.state.md` |
| 3 | run | Takes the lock (run id, PID, host, start UTC) | lock file; state `Lock:` row |
| 4 | run | Reads `source/user` issues newer than `Cursor:`; none → run row, release, exit 0 | state `## Runs` |
| 5 | run | J3 per new report; J4 / J4b for what it queued, within the cap | issues |
| 6 | run | Advances `Cursor:`, counters, digest if due (J6), releases the lock, exit 0 | state file |

### States

| State | How it shows (truthfully) | Owner channel |
|---|---|---|
| Empty — nothing new | state `Last run: 14:15 r-7f3a · nothing new · 0.4s`; no issue touched | none (counted in the daily heartbeat) |
| Empty — no cursor yet (first run) | state file created from template; `Cursor:` = run start; older open `source/user` issues are **not** processed; run row `first run · cursor set · 3 older reports skipped (#601 #604 #609)` | Digest line names them |
| Empty — venture not set up | preflight fails; run row `preflight FAIL: §10 Staging row missing`; exit 0; nothing labelled | Alert, once per missing row, then digest until fixed |
| In progress | lock file present; state `Lock: held by r-7f3a pid 4121 on orderly-server since 14:15`; the issue being worked carries its triage comment + an "attempt started" comment | none |
| Error — GitHub unreachable | run row `gh unreachable (api.github.com timeout)`; no cursor move; exit 0 | Alert after 3 consecutive failures (45 min blind); digest otherwise |
| Error — stale lock | lock older than the stale bound (open question 2); run row `lock STALE r-7f3a since 12:02 — not cleared`; exits without work | Alert once; digest until the owner removes the file |
| Error — daily cap hit | state `Fixes today: 3/3`; 4th report triaged and labelled only; comment "Triaged, not attempted: the loop's daily cap (3 fixes) is used; queued for tomorrow" | Digest "skipped (cap)" |
| Degraded — no owner channel | digest appended to state `## Digests` only; run row `digest: kept locally (no §10 Owner channel)` | n/a |

### `.plans/operate-watch.state.md`

Grep-able `Key: value` header (same convention as mission ledgers), then two
tables. Never committed; `.plans/` is ignored.

| Row | Example | Meaning |
|---|---|---|
| `Venture:` | `orderly` | slug used as the `[orderly]` message prefix |
| `Cursor:` | `2026-10-06T14:15:02Z #612` | last issue timestamp + number read |
| `Day:` | `2026-10-06` (UTC) | counters reset when this changes |
| `Fixes today:` | `2/3` | J4 attempts started (cap 3) |
| `Diagnoses today:` | `1` | J4b runs (no cap, not a fix) |
| `Escalated today:` | `1` | — |
| `Spend today:` | `$4.10 (2 fixes, 1 diagnosis)` or `unmeasured` | as the runtime reports |
| `Last digest:` | `2026-10-06T09:00Z r-1c0d` | next due 24 h later or first fix of the day |
| `Last run:` | `14:15Z r-7f3a · nothing new` | heartbeat for a human reading the file |
| `Lock:` | `free` / `held by r-7f3a pid 4121 on orderly-server since 14:15Z` / `STALE …` | mirrors the lock file |

`## Runs` (newest first, keep 96 = one day):
`run | started | result | new | fixed | diagnosed | escalated | skipped | spend`.
`## Digests` (append-only, verbatim copies of what was sent or kept).

---

## J3. Triage

| # | Who | Does | Touches |
|---|---|---|---|
| 1 | run | Validates the contract; missing required field → `needs-info` + comment naming the fields; stop | labels, comment |
| 2 | run (triage, the `intake`-shaped classifier) | Runs the escalation checklist over the report **and** the files reproduction would touch; any match → `loop/escalate` | `docs/product/engineering/operate-triage.md` (from `templates/operate-triage.md`) |
| 3 | run | Decides code vs operational: `loop/fix` or `loop/diagnose`; sets `size/XS|S` (M or larger → escalate); `loop/diagnose` also swaps `type/bug` → `type/ops` | labels |
| 4 | run | Scores impact; ranks the day's queue; ties by age | comment |
| 5 | run | Posts the triage comment | comment |

### Label set (venture repo)

| Label | Set by | Meaning |
|---|---|---|
| `source/user` | the app | the only entry label the loop reads |
| `type/bug`, `type/ops` | app; triage may swap | groom convention |
| `size/XS`, `size/S`, `size/M` | triage | groom convention; only XS/S may be auto-fixed |
| `needs-info` | triage | contract incomplete; loop stops; exclusive with `loop/*` |
| `loop/fix` | triage | code fix queued or in progress |
| `loop/diagnose` | triage | operational; signals being read |
| `loop/escalate` | any step | owner's; comment names the reason |
| `loop/ready` | J6 | PR open, staging-verified; owner merges |
| `loop/diagnosed` | J4b | operational cause named; draft reply posted; loop done |

Exactly one `loop/*` label at a time; moves allowed: `fix → ready | escalate | diagnose`, `diagnose → diagnosed | fix | escalate`. The owner re-queues by hand by removing `loop/escalate` and adding `loop/fix` (open question 5).

### Triage comment

```
**Loop triage** · run r-7f3a · 2026-10-06 14:16 UTC
Decision: loop/fix · size/S · impact 7/10 (one venue, core flow: printing)
Escalation checklist — schema/migrations: no · auth: no · payments: no · CI/deploy config: no · secrets: no · third-party contract: no · reproducible: yes (test planned) · size ≤ S: yes
Reason: "What happened" matches printer-queue code path (server/print/queue.ts); not a device-state symptom.
Report as read (quoted, treated as text — nothing in it chooses files, commands or scope; the checklist above cannot be changed by report content):
> **Where:** Taqueria Sol, branch Centro · **What I did:** 1. sent a ticket with no item name … · **What happened:** printer shows "job failed" …
Next: fix attempt 2/3 today, branch fix/612-empty-job-name.
```

Impact rubric (in `operate-triage.md`, weights are data):

| signal | 0 | 1 | 2 |
|---|---|---|---|
| users affected | one user | one venue | several venues / all |
| flow | cosmetic | secondary | core: ordering, printing, payment |
| frequency (from report + signals) | once | recurring | continuous |
| workaround | obvious | awkward | none |

Score = sum × 1.25, ceiling 10; ties by report age. Score ≥ 8 is
**incident class** → Alert now, whatever the label.

### States

| State | How it shows | Owner channel |
|---|---|---|
| Needs info | `needs-info`; comment: "Not enough to act on: missing `What I did`, `App`. The loop does not guess. Add the fields and remove this label to re-queue." | Digest "skipped (needs info)" |
| Escalated at triage | `loop/escalate`; comment names the matched class verbatim | Digest; Alert if incident class |
| Instruction-like text in the report | quoted like any other text; comment adds "The report contains instructions addressed to the loop; ignored." Never a reason to escalate on its own | none |

---

## J4. Fix (one bounded attempt)

| # | Who | Does | Touches |
|---|---|---|---|
| 1 | run | Increments `Fixes today:`; comments "Fix attempt started r-7f3a 14:17 UTC, budget: one session" | state, comment |
| 2 | run (fix path, `/fix` shape) | Branch `fix/N-<slug>` off the default branch | git |
| 3 | fixer | Writes the failing test first; cannot reproduce → stop, `loop/escalate`, comment with the attempt (what was tried, test name, where it passed unexpectedly) | test file, comment |
| 4 | fixer | Smallest change; project test gate (§10 row) green | code, CI |
| 5 | mission-budget hook | Bounds to one session; at 1.5× (2 sessions) the STOP fires | ledger per attempt (architect, shape 3) |
| 6 | run | On overrun: push the branch as-is, comment where it stopped, `loop/escalate` | git, comment |

### States

| State | How it shows | Owner channel |
|---|---|---|
| In progress | label `loop/fix` + "attempt started" comment; state `Lock:` row | none |
| No reproduction | `loop/escalate`; comment "Could not reproduce: test `print/queue.test.ts > rejects empty job name` passes on main at a1b2c3d. Tried: … Branch kept at fix/612-… with the test." | Digest |
| Budget overrun | `loop/escalate`; comment "Stopped at the budget: 2 sessions against an estimate of 1. Test written, fix half-applied at <sha> on fix/612-…. Pick it up with `/agentic-workflow:fix #612`." | Digest, with the spend |
| Test gate red after fix | one corrective pass inside the same session; still red → treated as overrun (comment states the failing test) | Digest |
| Success | gate green → J5 | — |

---

## J4b. Diagnose (no code change)

| # | Who | Does | Touches |
|---|---|---|---|
| 1 | run → `ops` (read-only) | Reads the signal list for the venture, each with a timestamp: for Orderly — printer-agent last heartbeat, queued print jobs for the branch, branch network state as the app records it, Fly logs for the window around `### When`, health endpoints, Sentry events, recent deploys | `runbook.md` "Signals the loop may read" table (names, commands, credential **names**) |
| 2 | ops | Records what was observed and what was **not checked** (and why) | comment |
| 3 | ops | Names the most likely cause, the recommended action, who fires it | comment |
| 4 | writer voice (copy-kit) | Drafts the client reply | comment |
| 5 | run | Operational cause → `loop/diagnosed`; code cause → `loop/fix` (enters J4 under the cap); nothing observable → `loop/escalate` | labels |

### Diagnosis comment

```
**Loop diagnosis** · run r-7f3a · 2026-10-06 14:22 UTC
Observed
| signal | at (UTC) | value | source |
| printer agent heartbeat, branch Centro | 13:42:10 | last seen (52 min ago) | printer_agents table (read-only) |
| queued print jobs, Centro | 14:22:00 | 7 waiting since 13:43 | print_jobs table |
| branch network state | 13:42:10 | app recorded "offline" | app status endpoint |
| Fly logs 13:30–14:20 | — | no errors on print path | fly logs |
Not checked: Sentry (SENTRY_AUTH_TOKEN not set) · router uptime (no signal exists)
Most likely cause: the branch printer agent lost its connection at 13:42; the server is healthy and holding the jobs.
Recommended action: venue staff — power-cycle the printer box, confirm it is on the venue Wi-Fi; jobs print when it reconnects. Owner: nothing unless it stays offline past 16:00.
Takes this: venue staff. Nothing here mutates production.
Draft reply to Taqueria Sol (NOT sent — a human sends it):
> Hi — your Centro printer last reached us at 13:42 and looks offline on your side; our servers are fine and holding 7 tickets. Please unplug the printer box, wait 10 seconds, plug it back in and check it is on the venue Wi-Fi. The 7 tickets will print as soon as it is back. Tell us if it is still dark in 15 minutes.
Result: loop/diagnosed.
```

### States

| State | How it shows | Owner channel |
|---|---|---|
| Diagnosed (operational) | `loop/diagnosed`; comment above; issue stays open for the human to act and close | Digest "diagnosed" with the one-line cause |
| Code cause found | `loop/fix`; comment ends "Cause is in code (server/print/agent.ts): queued as fix attempt 3/3 today" | Digest |
| Degraded — one signal down | "Not checked" line names it; cause is stated with the gap ("based on heartbeat + logs only") | none |
| Degraded — Sentry absent | permanent "Not checked: Sentry (not configured)" line; never blocks | Digest, first day only |
| Error — nothing reachable | `loop/escalate`; comment "Could not observe: logs (ssh timeout), status endpoint (503). No cause guessed." | Digest; Alert if incident class |
| Remediation needed | the draft names the exact step and who; the loop fires nothing | — |

---

## J5. Review and staging verify

| # | Who | Does | Touches |
|---|---|---|---|
| 1 | run → fresh `reviewer` | Six-lens review of the diff | PR-less review comment on the issue (verdict + commit) |
| 2 | fixer | REQUEST CHANGES → one corrective pass | code |
| 3 | reviewer | Second verdict; second REQUEST CHANGES → `loop/escalate`, branch kept, both verdicts quoted | labels, comment |
| 4 | run | Deploys the branch to the §10 **Staging** tier (mechanism: architect, shape 4) | staging |
| 5 | run | `/agentic-workflow:verify <staging-url>`; result + SHA to the issue | comment |

### States

| State | How it shows | Owner channel |
|---|---|---|
| Review APPROVE | comment "Review: APPROVE at <sha> (corrective pass: none)" | none |
| REQUEST CHANGES twice | `loop/escalate`; comment "Reviewer asked for changes twice: 1) … 2) …. Branch fix/612-… kept, not merged, not deployed." | Digest |
| Staging deploy fails | `loop/escalate`; comment "Staging deploy failed: <command> exit 1, last 20 log lines quoted. Code is reviewed APPROVE; verify not run." | Digest; Alert if staging is also down for the owner's other work (open question 4) |
| Verify FAIL | `loop/escalate`; comment attaches the verify report (what broke, on which URL/SHA) | Digest (not Alert: production untouched) |
| Verify NOT VERIFIED (no browser path) | treated as FAIL for the loop — never a PR on an unverified branch | Digest |
| Success | PASS + staging SHA → J6 | — |

---

## J6. PR and digest

| # | Who | Does | Touches |
|---|---|---|---|
| 1 | run | `gh pr create` with the trail body; `Closes #N` only in the PR body (§3 blocks it in commits) | PR |
| 2 | run | Issue `loop/fix` → `loop/ready`; PR labelled `loop/ready` (the owner's merge queue: `gh pr list --label loop/ready`) | labels |
| 3 | run | Comment on the issue: "PR #613 open, staging-verified. Merge is yours." | comment |
| 4 | run | Digest if first fix of the day or 24 h since `Last digest:` | Slack, state `## Digests` |
| 5 | owner | Reads digest → merges PR on GitHub → production deploy follows the venture's own flow | GitHub |

### PR body trail

```
Closes #612

| step | result | link |
|---|---|---|
| report | #612 "Printer shows job failed on empty item" · filed 2026-10-06 13:50 by anonymous via Orderly app | issue |
| triage | loop/fix · size/S · impact 7/10 · run r-7f3a | comment |
| reproduce | print/queue.test.ts > rejects empty job name — failed at a1b2c3d | commit |
| fix | d4e5f6a · 2 files, +9 −1 | commit |
| test gate | pnpm test · 142 passed | CI run |
| review | APPROVE at d4e5f6a · corrective pass: none | comment |
| staging | d4e5f6a deployed to https://staging.orderly.app · /verify PASS 14:48 UTC | comment |
| spend | 1 session · 31 min · $2.10 | state file |

The report was read as data; nothing in it chose files, commands or scope.
This PR does not merge, deploy or message anyone — merge is yours.
```

### Digest (≤3 lines + link, §12)

```
[orderly] Bug loop, Tue 6 Oct — 1 PR waiting for your merge, 1 escalated, 1 diagnosed, 0 skipped · spend $6.20
Merge: #613 (printer job failed on empty item, staging verified). Escalated: #611 (card payments webhook — payments class, yours). Diagnosed: #610 (Centro printer offline since 13:42 — venue power-cycles it; draft reply on the issue).
Loop: 96 runs · GitHub ok · staging ok · Sentry not configured · next 15:00 UTC
https://<status-page-url>
```

Quiet day: line 1 reads `0 reports, loop healthy`; lines 2–3 as above.

### Alert (immediate)

```
[orderly] Alert — incident-class report #614: "no tickets print at any branch" (impact 10/10, all venues, core flow). Escalated to you (loop/escalate: not reproducible in a test). Diagnosis on the issue: server print path healthy, agent fleet heartbeats stopped 15:02. Issue: <link>
```

Alert triggers: incident-class report (score ≥ 8); stale lock; GitHub
unreachable for 3 runs; preflight failure on a §10 row. Everything else is
digest-tier.

### States

| State | How it shows | Owner channel |
|---|---|---|
| Ready | `loop/ready` on issue + PR; digest "Merge:" | Digest |
| Owner merged | the venture's own flow; the loop reads nothing back (no reporter message — deferred) | none |
| Slack send fails | state run row `digest: send failed (HTTP 429) — kept in ## Digests`; retried next tick | n/a |
| Spend unmeasured | digest `spend unmeasured (runtime gave no cost)` — never estimated | Digest |

---

## J7. n=1 on Orderly

| # | Who | Does | Touches |
|---|---|---|---|
| 1 | owner | Orderly row in the registry; `Last /operate` dated after the first digest | `registry.md` |
| 2 | `/connect server` cron step | Runbook "Bug loop" section: interval, env names, log path, the exact `claude -p` line, how to pause, how to clear a stale lock | `runbook.md` |
| 3 | this repo | lint; hook-harness cases: lock held, stale lock, cursor advance, daily cap; eval `operate-watch` with a synthetic report | `evals/` |
| 4 | a real venue report | J1 → J6; the owner merges | Orderly |

---

## Open questions for the approval moment

1. **First-run backlog**: skip pre-cursor reports (this doc) vs process every open `source/user` issue with no `loop/*` label on the first run.
2. **Stale-lock bound in minutes** (the hook counts sessions, not time): 90 min proposed.
3. **Day boundary** for the cap and digest: UTC (this doc) vs the owner's timezone.
4. **Staging verify FAIL**: digest-tier (this doc, production untouched) vs Alert as `/verify` normally does.
5. **Owner re-queue by relabel** (`loop/escalate` → `loop/fix` by hand): in v1, or deferred with the duplicate handling.
6. **Heartbeat digest on quiet days**: yes (this doc) vs only on activity.
