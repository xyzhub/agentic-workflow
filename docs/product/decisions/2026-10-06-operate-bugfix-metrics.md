---
status: draft
owner-agent: analyst
refresh-trigger: event (the first real report is processed; then at each month-review)
---

# operate-bugfix — measurement spec

_Answers "how is success measured" for
`docs/product/decisions/2026-10-06-operate-bugfix-brief.md`. Pulled 2026-10-06,
branch `feat/launch-media-plan`. The loop has never run anywhere, so every
baseline is **unmeasured** or a true zero. Labels: **MEASURED** (command cited),
**PROPOSED** (design not locked; names and paths are the architect's to confirm),
**UNMEASURED** (named, not guessed). No number below is a prediction._

## 0. Baseline today

| Thing | State | Evidence |
|---|---|---|
| Reports processed by the loop | **0** | `.plans/operate-watch.state.md` does not exist (ls, 2026-10-06) |
| `operate watch` anywhere in plugin, docs, tools | brief only | `grep -rl "operate watch"` over plugins/ docs/ tools/ returns only the brief |
| Hook-harness cases | **123 `ok`**, `hook-test: clean` | `node tools/hook-test.mjs`, 2026-10-06. Re-run before the change; require a count above it |
| Registry rows with an operate date | 1 of 5 (AI-Receptionist, 2026-07-08, no report on disk); Orderly unregistered | the brief's Problem section (cited, not re-pulled) |
| Cost line from `claude -p` | **unknown** whether the headless run prints one | not verified; the architect must check `--output-format` on the server's installed CLI |
| Every rate in section 2 | **unmeasured** | no run has occurred |

## 1. Done signals for the n=1 (Orderly, one real user bug)

| Journey | Done when | Exact evidence | Baseline |
|---|---|---|---|
| J1 report | a real user report exists as a GitHub Issue with labels `source/user` + `type/bug`, all contract fields present | the issue itself (`gh issue view N --json labels,body`); a field-missing report instead carries `needs-info` and no `loop/*` label | 0 |
| J2 watch | a cron run exits 0 on "nothing new" and a later run picks up N once, advancing the cursor; an overlapping start is refused | state file `.plans/operate-watch.state.md` rows `cursor`, `counters`, `last digest` (PROPOSED names); harness cases `operate-watch: lock held -> second run exits 0 and logs`, `...stale lock reported not cleared`, `...cursor advances once` (PROPOSED names) | 0 runs |
| J3 triage | one comment on N states class (`loop/fix`, `loop/diagnose`, `loop/escalate`, `needs-info`), the reason, and for escalations the class named from the fixed list | label on the issue plus the triage comment; the report text never appears as the chosen command or path | 0 |
| J4 fix | branch `fix/N-<slug>` whose first commit adds a failing test, then the change, project gate green, one session | `git log fix/N-<slug>`; test name quoted in the PR body; mission-budget line `Sessions used: 1` against `Estimate: 1` (never reaches 2, the 1.5x stop) | 0 |
| J4b diagnose | an issue comment with: observations with timestamps, likely cause, recommended action, who acts, draft client reply; label `loop/diagnosed`; or `loop/escalate` with the words "could not observe" | the comment (check for the five parts); the digest lists it. n=1 needs only the fix path; diagnose is evidenced by the eval scenario unless a real operational report arrives | 0 |
| J5 review + staging | reviewer verdict recorded, and `/verify <staging-url>` PASS with SHA | PR body fields `review verdict + commit` and `staging verify result + SHA`; FAIL or second REQUEST CHANGES shows as `loop/escalate` | 0 |
| J6 PR + digest | PR open with `Closes #N`, label `loop/ready`, trail complete, loop made no merge, no default-branch push, no prod deploy; one Slack digest line | `gh pr view --json body,labels,mergedBy`; `mergedBy` is the owner; digest message ref recorded in the state file `last digest` row | 0 |
| J7 n=1 | Orderly registered; one report flows J1 to J6 unattended; owner merges; lint, hook tests and the `operate-watch` eval scenario green here | registry row for Orderly; the merged PR; `node tools/lint.mjs` clean; `node tools/hook-test.mjs` ends `hook-test: clean` with count above 123; eval scenario name `operate-watch` with a synthetic report | 0 |

"Unattended" is evidenced by the cron log showing the run start, and the
session transcript showing no human prompt between J2 and J6 (PROPOSED: the log
path in the runbook).

## 2. Recorded per run and per day

Per run, one line appended to the cron log (PROPOSED path in the runbook):
`run-id, start, end, outcome(ok/nothing-new/lock-held/unreachable:<github|server|staging>), reports seen, per-report class, spend`.
Per day, counters in the state file (the J4 daily-cap counter already exists in
the brief) rolled into the digest. The month-review reads these.

| Metric | Definition | Source | Baseline |
|---|---|---|---|
| Reports by class | count of fix / diagnose / escalate / needs-info | issue labels at triage time | 0 |
| Escalation rate and reasons | escalated / triaged, grouped by named class, plus "second REQUEST CHANGES", "verify FAIL", "overrun", "could not observe" | triage and escalation comments | unmeasured |
| Fix attempts | branches `fix/N-*` created; cap 3 per day | state file counters | 0 |
| PRs opened / merged by owner | `loop/ready` PRs; of those `mergedBy` = owner | `gh pr list --label loop/ready --state all` | 0 / 0 |
| Report-to-PR time | PR `createdAt` minus issue `createdAt`, median and max | gh JSON | unmeasured |
| Report-to-diagnosis time | diagnosis comment time minus issue `createdAt` | gh JSON | unmeasured |
| Reviewer REQUEST CHANGES rate | PRs with first-pass REQUEST CHANGES / PRs reaching review | PR body trail | unmeasured |
| Staging verify FAIL rate | verify FAIL / staging verifies run | PR body or escalation comment | unmeasured |
| Spend per fix, per day | `claude -p` cost line summed per run; if the CLI emits none, the cell reads "unmeasured", never an estimate from time | cron log | unknown (see section 0) |
| Lock / overlap incidents | runs ending `lock-held`; stale locks reported | cron log | 0 |
| Unreachable runs | runs ending `unreachable:<target>`, by target | cron log + digest | 0 |
| Backlog age | age of oldest `source/user` issue without a `loop/*` or `needs-info` label | gh JSON | 0 |

## 3. Paired counter-metrics

| Optimization | Counter-metric it could degrade | How observed |
|---|---|---|
| PRs opened | owner merge rate (merged / opened) and PRs closed unmerged | `mergedBy`, `state`; print "3 opened, 1 merged" together |
| Fix speed (report-to-PR) | REQUEST CHANGES rate and post-merge reopened issues | PR trail; reopened `Closes #N` issues |
| Diagnosis count | "could not observe" rate and owner-corrected diagnoses | escalation reasons; human notes on the diagnosis comment |
| Daily cap (3 fixes) | backlog age and `needs-info`/filed-only count after the cap | state counters vs oldest unlabelled issue |
| Lower escalation rate | fix-attempt wrongness: owner closes PR unmerged, or fix touches an escalation class | PR diff paths vs the fixed class list |
| Lower spend per fix | verify skipped or review thinned | trail fields present in 100% of PRs; a missing field counts as a defect |
| Fewer lock incidents | unreachable/silent runs | `nothing-new` runs with no heartbeat line is a gap |

## 4. Most gameable measurements

1. **Escalation rate and "needs-info" rate.** Easy to look healthy by
   classing hard reports as `needs-info` or `loop/diagnose`. Mitigation: always
   print counts by class beside the rate, and the owner samples 3 `needs-info`
   or `loop/diagnosed` issues per month for misclassification.
2. **PRs opened / fix throughput.** A fix can open a PR by writing a test that
   passes without reproducing the bug. Mitigation: the owner merge rate beside
   it, and the J4 evidence check that the test fails on the default branch
   (the trail must state the failing run); a PR without that line counts as
   not done.

## 5. Deferred review (proposed OB row)

A month proves little if few reports arrive. Proposed row for the orchestrator
to add (I do not edit ledgers); the id is the next unused integer at add time
(the register currently ends at OB-21):

```
- [ ] OB-<n> · added 2026-10-06 (analyst, operate-bugfix metrics) — do: run the first month-review of the operate-watch loop (section 2 table, with denominators printed) and hand conclusions to the owner — when: at least 10 `source/user` reports have been triaged on Orderly — probe: `gh issue list --label source/user --state all --json labels --jq '[.[]|select(any(.labels[].name; startswith("loop/") or .=="needs-info"))]|length'` run in the Orderly checkout (10 or more)
```

Reading rule: below about 5 reports in a class, report a count, not a
percentage. Under 10 total reports the verdict is "insufficient data".

## 6. Unknown, untested

- Whether `claude -p` prints a cost line (spend cells stay "unmeasured" until checked).
- Reports per week on Orderly: no history; the 10-report trigger may take longer than a month.
- Orderly's staging flow and read-only signals are architect memos 4 and 8; the staging FAIL rate and diagnosis metrics cannot be instrumented until those lock.
- All event, label and file names marked PROPOSED.
