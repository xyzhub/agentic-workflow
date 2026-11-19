---
status: proposal
owner-agent: analyst
feature: concurrent-missions
date: 2026-11-19
reads: 2026-11-19-concurrent-missions-brief.md, 2026-11-18-parallel-waves-metrics.md (sections 2 and 4)
---

# Measurement plan — concurrent missions

Source for every claim below: the brief (AC-1..AC-17) and the parked
parallel-waves metrics doc, read 2026-11-19. **No number here was measured.**
Every baseline is **unmeasured** until the first single-mission run under the
new instrumentation. Thresholds are proposals (judgement), not noise floors.

## 1. The four done-criteria: the exact check

| AC | Observable check (pass condition) | Kind |
|---|---|---|
| AC-13 | Acceptance run: start missions A and B from two worktrees. Pass = (a) `git worktree list` shows two mission worktrees, (b) both PRs reach `merged` on main, (c) for each PR the `gh pr view --json commits` log has zero commits by the owner and none authored as "update branch by hand"; every update-from-main commit is the agent's, (d) the owner typed no git/setup command (read from the session transcript). | One-off acceptance test. Re-run after any change to queue or worktree code. |
| AC-14 | Deliberate overlap: B declares a file in A's declared write-set. Pass = the overlap message (with the wait / run choice) appears **before** B's first `brief.start` event / first builder spawn; timestamp of message < timestamp of first spawn. Negative control: a disjoint B produces no message. | One-off, plus a standing counter (section 4: overlap flags per mission) because false positives and misses need a long series. |
| AC-15 | Deliberate clash: both missions edit the same lines. Pass = (a) the clash is resolved with no owner action, (b) the combined test run (the gate commands in `docs/WORKFLOW.md` section 10) exits 0 on the merged result before landing, (c) the resolver is the orchestrator (tiny) or exactly one builder spawn that ends (count spawns tagged `clash-fix` = 1), (d) for a real-code fix, a reviewer run covers just that part (AC-12). | One-off acceptance test. Clash-fix frequency and cost are kept measuring (section 4). |
| AC-16 | Both missions change bookkeeping (a changelog fragment and an obligations fragment each). Pass = after both land, `git log` on main shows zero merge-conflict resolutions touching `plugin.json`, `CHANGELOG.md`, `.plans/OBLIGATIONS.md`; neither mission's own diff contains a `plugin.json` version change (AC-5); version was assigned exactly once, at landing (AC-8). | One-off acceptance test. A cheap standing check is worth keeping: a lint rule that fails if a mission branch diff touches the version field. |

AC-13..16 can all be satisfied by one scripted scenario with two throwaway
missions (A: touches bookkeeping + file X; B: touches bookkeeping + file X, then
a disjoint variant). That is a test fixture, not a real-mission measure; the
real-mission series in section 4 is what shows whether it holds in practice.

## 2. "No additional overhead": definition and baseline

The owner's phrase has no stated unit. **Proposed definition: overhead is
anything the owner or the token meter pays for beyond what the same mission
costs alone in a single checkout.** Three components, ranked by what the owner
said they care about (their time and their credits, not wall-clock):

| Component | Measure | How | Baseline |
|---|---|---|---|
| O1 owner minutes per mission | Owner-attended minutes: from first owner message to landing, minus `wait` events (the parallel-waves `wait` event, reused). Plus a count of owner interventions (any message that is not an approval or a new-mission request). | Session transcript timestamps; `wait` events in the sidecar. | Unmeasured. Take the median of the first 3 single-mission runs after instrumentation ships. |
| O2 setup time per worktree | `worktree.prepare` start to end (create, install, secrets file, throwaway DB), per mission, plus `ok` flag. | New event, same shape as `wave.prepare` in the parallel-waves doc. | Unmeasured. Single-mission baseline = prepare time of the first mission's worktree. Target "free" in this markdown repo (brief); ventures unmeasured. |
| O3 tokens per mission | Total tokens per mission, with model per spawn recorded; ratio `tau_m = tokens(mission run concurrently) / tokens(same mission alone)`. | `brief.end` / `wave.review` token fields (parallel-waves section 4). | Unmeasured. Needs a probe first: whether the Agent result reports usage at all is **unverified**. |

Pass proposal for "no additional overhead" (reusing the parallel-waves token
thresholds, same caveat that the 1.10 band is a judgement):

| Measure | Neutral | Finding to the owner | Fail |
|---|---|---|---|
| `tau_m` (O3) | <= 1.10 | 1.10 - 1.50 | > 1.50 |
| O1 owner minutes vs baseline median | no increase | any increase | owner-typed git/setup command (AC-1 breach) |
| O2 setup | no owner-visible wait | measurable but automatic | any manual step |

Same-mission-alone comparison is rarely available (missions are not repeated).
Fallback, stated as **estimated**: compare against the median tokens per brief
of past single-mission runs, which the ledger's `Estimate:` / `Sessions used:`
lines may give. Whether that history is usable is **unknown** until read.

## 3. Token burn per hour with two missions

Context: the plugin was disabled 2026-08-19 over runaway missions (brief,
Risk 3). Concurrency changes **rate per hour**, not total per mission
(parallel-waves section 2, an inference). Two missions at once "roughly
doubles" spend per hour (brief; inference, not measured).

**Record** (append-only sidecar `.plans/<mission>.metrics.jsonl`, reuse the
parallel-waves verbs; add `burn` as an event):

| Field | Why |
|---|---|
| `t` (UTC), `mission`, `worktree`, `model` per spawn | Attribution per mission and per model tier |
| `tokens` {total; in/out/cache if exposed} per spawn | Weighted burn; otherwise state "unweighted total" in every report |
| `concurrent` (count of missions in flight at the time of the spawn) | Lets a report split hours by 1 vs 2 running |
| `rolling_1h` tokens, per mission and combined | The alert quantity |

**Alert quantities and thresholds (proposal).**

1. **Doubling alert (relative).** Combined rolling-1h tokens while 2 missions
   run > **2.2x** the single-mission baseline rate (2.0x expected + the 1.10
   neutral band, reusing the parallel-waves band). A reading at 2.2x to 3.0x
   is a surfaced finding; **> 3.0x** (1.5 x the expected 2.0x, mirroring the
   LA-1 "stop and ask the owner" 1.5 line) pauses new spawns and asks the owner.
2. **Per-mission overrun** stays the existing budget/overrun hook, keyed by
   branch's own ledger (AC-4). A mission over its own `Estimate:` x 1.5 stops
   regardless of the other.
3. **Absolute ceiling (owner-set).** Because the baseline is unmeasured, the
   relative alert cannot fire on day one. Until 3 single-mission runs give a
   median tokens/hour, the only honest alert is an owner-chosen absolute
   tokens/hour (or cost/hour) value. Its number is **unknown**: ask the owner.

Report each ratio with `concurrent` shown, so a 2x that is just two missions
is not mistaken for a runaway; a runaway is one mission's own rate above its
single-mission median while the other is quiet.

## 4. Queue health

All from new queue events written by the orchestrator via `ledger.mjs`
(`queue.approved`, `queue.update`, `queue.test`, `queue.land`, `clash.spawn`).

| Metric | Definition | Reading |
|---|---|---|
| Approval-to-landing latency | `queue.land.t - queue.approved.t` per PR, split into queued-behind-another, update, test, merge. Report median and max. | Unmeasured; no threshold proposed until 5 landings exist. The owner's concern is whether the owner waits on it (O1). |
| Combined-test failure rate | `queue.test` fail / total, per landing attempt. Count AC-9 returns separately from clashes. | Unmeasured. With n < ~10 landings, report counts (k of n), never a percent. |
| Clash-needs-builder rate | `clash.spawn` / (overlap flags + clashes that actually occurred). Split tiny-orchestrator-fixed vs builder-fixed. Tokens and minutes per builder fix. | Unmeasured. Also record: AC-12 reviewer run after a code-changing fix, yes/no. |
| Overlap flags vs real clashes | Flags raised before start vs clashes that later occurred anyway (detector misses) vs flags where no clash occurred (false alarms). | Tests the write-set declaration quality. |
| Approval integrity | Any merge where no owner-only approval signal precedes it (should be 0; AC-10). | Any non-zero is an incident, not a metric. |

## 5. What we will not know

- Any baseline: no single-mission token, owner-minute or setup-time history is
  captured today (**unknown**). The first 3 runs after instrumentation ship it.
- Whether the Agent tool reports usage/duration to the orchestrator
  (**unverified**); otherwise transcript parsing, with orchestrator tokens
  possibly missing.
- Rate-limit back-off and provider queueing: invisible; they look like low
  throughput.
- Counterfactual: the same mission run alone is rarely rerun, so `tau_m` is
  mostly an estimate against past medians.
- Owner minutes are read from transcript timestamps; attention that is not
  typing (reading, thinking) is **not observable**.
- n = 1 per venture; with two live missions the sample for queue health will
  be a handful of landings. Rates will be counts, not statistics.
- Venture setup (install, secrets, database) per worktree: this repo is
  markdown, so the dominant real-world overhead (issue 44) cannot be measured
  here. It is unmeasured until a venture runs it.
- Whether 2.2x / 3.0x are the right lines: judgement only until real runs exist.
- Whether the owner's "no additional overhead" means these three components:
  they are my definition; the owner should confirm or correct it.

## Tracking-plan gap

`docs/product/engineering/tracking-plan.md` has no rows for `worktree.prepare`,
`burn`, `queue.*`, `clash.spawn` (checked against the parallel-waves doc's own
note that none existed). Each needs a row (question answered, emitter =
orchestrator via `ledger.mjs`); specified here, wired by the normal build
machinery, not by me.
