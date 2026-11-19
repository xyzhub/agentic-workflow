---
status: proposed
owner-agent: analyst
feature: parallel-waves
date: 2026-11-18
---

# Parallel waves — measurement plan (AC-14, AC-15, AC-16)

_Analyst view. Sources read 2026-11-18: the feature brief; `templates/WORKFLOW.md`
§5 (lines 369-622); `templates/mission-state.md`; the interface header of
`tools/ledger.mjs`; `.plans/continuous-operation.state.md` lines 1-50. Nothing
here is measured yet — the feature does not exist. Every figure below is
labeled **measured / estimated / unknown**; thresholds are **proposals** for the
owner to ratify, not findings._

## 0. What exists today (measured, from the files above)

- The ledger records **counts and dates, no times and no tokens**: `Estimate:`,
  `Sessions used:`, `Reviewer runs:`, and handoff entries stamped `YYYY-MM-DD`.
  The only token figures in the protocol are the loop-mode lines `Tick budget:`,
  `Tick tokens:`, `Mission budget:` (§5 Loop mode), and they appear only in
  Unattended-preset missions. The real ledger sampled
  (`continuous-operation`, `Status: planned`) carries none of them.
- `tools/ledger.mjs` verbs today: `mark fire promote handoff next-up sessions
  reviewer-runs close`; `sessions` accepts `+1 | =N`. It writes no timestamps.
- Consequence: **no past mission can supply a serial baseline for time or
  tokens** (see section 3). Anything claimed about historical speed would be
  invention.

## 1. The definition of done as a number

**Primary metric — phase cycle-time speedup, S.**

    S = T_serial / T_wave

- `T` = agent-active elapsed time of one phase, from the first brief's
  `brief.start` to the phase's review verdict (`wave.review` end, or the last
  checkpoint in the serial arm). Unit: minutes, to the second.
- Same phase, same base commit, same briefs, same models, same profile except
  the cap (serial arm = cap 1 / consent row absent, AC-2).
- **Human wait time is excluded**, not averaged in: any interval where the
  orchestrator is parked on an owner decision is logged as `wait` and
  subtracted. A run that needs a human decision mid-phase is reported as such
  and its S is flagged, not silently adjusted.

**Why wall-clock alone is not enough (confounders, all real):**

| Confounder | Effect on S | How it is controlled |
|---|---|---|
| Agent/provider speed varies by hour and load | Either arm can be slow by luck | **Unknown magnitude** with n=1; reported as a point, never a confidence interval |
| A wave of 3 is not 3x the work | Phases with one long brief cap S at `sum(b)/max(b)` | Report `S_ideal` (below) beside S |
| Unequal brief sizes | Wave time = longest brief | Per-brief durations recorded; `S_ideal` computed from them |
| Fixed overhead per wave (worktree prep, integration, drift check, one larger review) | Eats the gain, dominates small briefs | Decompose `T_wave` into stages (below) |
| One wave review replaces N reviews | Changes review time *and* tokens | `Reviewer runs:` per phase in both arms; review stage timed separately |
| Package-manager and file caches warm after the first arm | Favours whichever arm runs second | **Run the wave arm first**, so any warm-cache bias works against the feature (conservative) |
| Failures, retries, drift blocks | A wave with a retry is a different experiment | Reported, never dropped; S shown with and without the retry interval |
| Rate limiting / 429 back-off while 3 builders run | Slows the wave invisibly | **Cannot be observed from inside the orchestrator** (section 4); detectable only as achieved parallelism below ideal |

**Secondary metrics that make S interpretable** (all derived from the events in
section 4):

1. `S_ideal = (sum of b_i) / (max b_i)` per wave, from measured per-brief
   durations — the structural ceiling for that phase.
2. Stage decomposition of `T_wave`: `prepare + max(b_i) + integrate + drift +
   review`. Overhead `o = prepare + integrate + drift` (review reported apart).
3. Achieved parallelism `P = sum(b_i) / wave_span` — if P is near 1 while the
   wave size was 3, the briefs did not actually overlap (rate limits, a
   serialised spawn) and S is not a measurement of waves at all.
4. Efficiency `E = S / S_ideal`.
5. Reviewer runs per phase, correctives per brief, drift blocks, REQUEST CHANGES
   count — rework is the hidden cost of speed.
6. **Wave coverage** = briefs run in a wave of size >= 2 / total briefs in the
   mission. A good S on one phase says nothing about a mission whose other
   phases are all serial; mission-level gain is bounded by coverage.

**Threshold (proposal for the owner).** Success is **S >= 1.3 on a wave of
size >= 2, AND the token ratio (section 2) not in "fail"**, with P >= 1.5
confirming the briefs really overlapped.

Justification, with arithmetic (estimated, not measured): for a wave of two
equal briefs of length b and overhead o, `S = 2b / (b + o)`. `S >= 1.3` holds
iff `o <= 0.54 b` — the machinery must cost less than about half a brief. For
three equal briefs, `S = 3b / (b + o) >= 1.3` iff `o <= 1.31 b`. 1.3 means the
phase finishes in 77% of its serial time (removes 23%). It is chosen because it
is the point where the feature's own per-wave overhead has to be small
relative to the work, not because it is round; below it the added machinery
(worktrees, drift check, integration order, retry logic) buys too little to
justify its surface. **I have no empirical basis for the noise floor** — until
a serial run is repeated, run-to-run variation is unknown, so a result near 1.3
should be read as inconclusive, not as pass.

## 2. Token cost, honestly

**Direction — an inference, to be tested, not a finding.** For the same work I
expect tokens to be **roughly neutral, with a risk skewed upward**, not a
saving:

| Driver | Direction | Reasoning (inference) |
|---|---|---|
| Builders | Neutral | Each serial brief is already a fresh builder session (§5), so "three builders hold context at once" does not triple tokens — tokens are billed per use, not per concurrency. Concurrency changes **burn rate per hour**, not total. |
| Review | **Unknown, possibly worse** | The brief says one wave review replaces one-per-brief. But §5 already runs **one checkpoint review per phase**, not per brief. If a phase is one wave, the wave review replaces nothing; if cap 3 splits five briefs into two waves, there are **two** reviews where serial had one. The saving the brief assumes may not exist. Measure `Reviewer runs:` per phase in both arms. |
| Review tier | Upward risk | The reviewer tier keys on the change's risk class (§5 LA-5 `fable-boundary`). One top-tier brief in a wave escalates the review of all its neighbours to Fable. |
| Drift block / mid-wave failure | Upward | Each costs a corrective (counted when it fires) plus a re-integration. |
| Duplicated exploration | Upward | Parallel builders cannot learn from each other's reads; serial builders sometimes can. |
| Orchestrator context | Unknown | More concurrent results in one transcript, fewer turns overall; net direction unknown. |

**Which direction matters.** Up. The owner disabled this plugin over missions
that burned credits, and holds a standing instruction to conserve tokens. Wall-
clock is not what the owner pays for; tokens are. A speedup bought with a large
token multiplier is a finding, not a win. A second, separate risk is **burn
rate**: three concurrent builders spend the same tokens in a third of the time,
which matters for rate limits and any per-window spend cap even at ratio 1.0.

**Metric.** `tau = tokens_wave / tokens_serial` for the same phase, summed over
builders, correctives and reviewers (orchestrator reported separately — see the
capture caveat in section 4). Also tokens per brief landed, and tokens/hour.

**Threshold (proposal).**

| tau | Reading |
|---|---|
| <= 1.10 | Counts as neutral; S can pass on its own |
| 1.10 - 1.50 | A **finding surfaced to the owner** with the S it bought; the owner decides |
| > 1.50 | **Fails regardless of S.** 1.5 mirrors the existing LA-1 line where the protocol already says "stop and ask the owner" |

The 1.10 band is a judgement for unavoidable extras (a larger union review,
worktree-prep output), not a measured noise floor — **unknown**.

**Tokens are not cost.** Record model per spawn: a Fable review token and a
builder token do not weigh the same. If cache-read / cache-write / input /
output are separable, record them separately; if only a total is available,
say "unweighted total" in every report.

## 3. The baseline problem

Options, with what each costs:

| Option | Can serve? | Cost | Honesty |
|---|---|---|---|
| **A. An already-recorded mission's ledger** | **No for time and tokens today.** It would need per-brief `start`/`end` timestamps to the second, per-brief tokens, and reviewer runs per phase — the ledger has dates and counts only. Git commit times on the phase branch give a rough first-to-last-commit span, but it includes human waits and idle time; usable only as an **estimated** sanity range, never as the baseline. | Free | Weak |
| **B. Run the same real phase twice** (once serial, once waved, from the same base commit, discarding one output) | Yes, most realistic | One full extra phase of builder + review tokens, on real work the owner wanted done once; real briefs also overlap rarely | Strong but expensive |
| **C. A synthetic fixture mission, run as a pair** (serial arm then wave arm, same base commit) | Yes, controlled | Two small runs of a throwaway mission in a scratch repo; roughly 2 x (3 briefs + the reviews) — **token total unknown until the first run**, which is itself a measurement | Controls the confounders; measures the **machinery**, not real-work speedup |

**Recommendation: C for AC-15, and instrument AC-16's real run with the same
events.** C is the cheapest honest baseline because it holds brief size equal
and disjoint by construction, so S, `S_ideal`, and overhead `o` are cleanly
attributable. Design rules so C is not flattering:

- 3 briefs, equal and sized so a brief takes well over the expected overhead
  (target `b >= 4 x o`; `o` is unknown until a probe run — so run the wave arm
  first and size the serial arm to match, not the reverse). Briefs too small
  make `o` dominate and understate S; the report states the brief size.
- Wave arm first (cache bias works against the feature); both arms emit the
  identical event schema, the serial arm as waves of size 1.
- Sanity check: `Sessions used:` must be equal in both arms when no corrective
  fired. A difference is the retries; a difference with no retries means the
  arms did not do the same work and the pair is void.

The **real run (AC-16)** then reports its measured `T_wave` against a *modelled*
serial time `sum(b_i) + sum of review stages` — labeled **estimated**, because
it was never run serially. AC-15 as worded ("a measured serial baseline and a
measured wave run") is satisfied by C; the report must say plainly that the
speedup on real work is estimated, not measured, unless option B was chosen.

Option B is justified only if the owner wants a real-work number badly enough to
pay for one phase twice; I would not recommend it by default.

**Replication (optional, owner's call):** repeating the serial arm once gives a
first estimate of run-to-run noise at the cost of one more serial arm.
Without it, noise is **unknown** and S is a single point.

## 4. Instrumentation to add

**Where it lives.** Recommend an append-only sidecar `.plans/<mission>.metrics.jsonl`
(tracked, orchestrator-only, one JSON object per line, ISO-8601 UTC to the
second), written by **new `tools/ledger.mjs` verbs** so the existing
write-ahead discipline and refusal behaviour carry over — extend, do not
replace. Reasons for a sidecar over ledger prose: the budget hook reads the
ledger on every turn, so per-brief rows would bloat it; the file is a
hot file the orchestrator alone writes (AC-9), so there is no concurrent
writer. A short summary lands in the ledger for AC-15 (below).

Proposed verb: `node ledger.mjs <mission> event <type> key=value ...`; the tool
stamps `t`. (Whether the verb takes `+N` for `sessions` is **unverified** — I
read only the interface header, which documents `+1 | =N`; a wave write-ahead
can use `=k+w` today.)

| Event | Fields | Answers |
|---|---|---|
| `wave.plan` | `wave`, `phase`, `mode` (serial\|wave), `cap`, `size`, `composition` [brief ids], `excluded` [{id, reason}], `k_before` | What the tool computed, and why briefs were left out (so wave coverage is measurable) |
| `wave.prepare` | `wave`, `t_start`, `t_end`, `per_worktree` [{id, path, ok}] | Overhead `o`, prepare share |
| `brief.start` | `brief`, `wave`, `worktree`, `model`, `session_n` | Per-brief window |
| `brief.end` | `brief`, `outcome` (pass\|fail\|drift\|hot-file-refused), `tokens` {total, in?, out?, cache?}, `tool_uses?`, `agent_duration_ms?`, `diff_files`, `retry` (0\|1) | `b_i`, tokens, failure and retry rate |
| `wave.integrate` | `wave`, `order` [ids], `results` [{id, merged\|blocked, reason}], `drift` {ok, offending}, `t_start`, `t_end` | Integration overhead, drift outcome, order actually used |
| `wave.review` | `wave`, `verdict`, `tier/model`, `tokens`, `t_start`, `t_end`, `reviewer_run_n`, `landed` [ids], `not_landed` [ids] | Review stage, review count and cost, what the verdict covered |
| `wait` | `reason`, `t_start`, `t_end` | Human time to exclude |
| `phase.end` | `phase`, `T`, `S_inputs` | Closes the denominator |

Serial missions emit the same events with size 1, so one schema serves both
arms and the historical series starts accumulating from the first mission after
the feature ships.

**Ledger additions (summary only, for AC-15):** one `Wave runs:` line per phase
(`phase, mode, size, T minutes, tokens, S, tau`) — or a handoff entry — so the
conclusion survives without the sidecar.

**What cannot be captured from inside a subagent-spawning orchestrator
(flagged, not assumed):**

- **Per-brief tokens.** Whether the Agent tool's result reports usage and
  duration to the orchestrator is **unverified here**. If it does, record it. If
  not, the fallback is post-hoc parsing of the session transcripts (including
  subagent sidechain files). A first probe brief must confirm which, before any
  threshold in section 1-2 is trusted.
- **Orchestrator's own tokens.** The orchestrator cannot read its own cumulative
  usage precisely; only a transcript parse or the host's cost view gives it.
  Report the orchestrator as a separate, possibly-missing term.
- **True start/end times.** The orchestrator observes an end only when the
  result returns to its turn, so `brief.end` is late by up to a turn, and a
  `brief.start` is when the orchestrator recorded it, not when the agent began.
  Prefer agent-reported duration if present; otherwise state the timestamp
  error.
- **Rate-limit back-off and provider queueing** — invisible; show up only as low
  P.
- **Cache vs fresh tokens** — depends on what the usage report exposes.
- **Whether the briefs ran concurrently** is derived (overlap of windows), not
  observed.

**Instrumentation is code:** these events are specified here and wired by
`backend`/`frontend`/the plugin build through the normal machinery with review;
I do not edit product code. This repo has no `docs/product/engineering/tracking-plan.md`
row for them yet — **gap**: the plan should gain one row per event above
(question each answers, emitter = the orchestrator via `ledger.mjs`).

## 5. `Estimate:` / `Sessions used:` under concurrency (AC-14)

_Measurement view only; the architect is writing a parallel memo on the same
question._

**What the counter measures.** LA-1 counts **work units started** (briefs,
correctives, continues, ticks) against a planner's estimate of work units. It
never measured time. Concurrency does not change that: three briefs started at
once increment the counter three times, exactly as three started in a row. So
`k >= 1.5 x N` **still means the same thing — scope growth against plan** — and
this is the reason to **keep `Estimate:` wave-unaware**: its value is that serial
history, the fixture pair and a real wave run stay comparable on one scale.

What does change, and must be fixed for the figure to stay honest:

1. **Overshoot of the stop.** Serial: the stop fires between briefs, so
   `k` never exceeds `1.5N`. Wave: a wave launched at `k = 1.5N - 1` with size 3
   ends at `k = 1.5N + 2` — the hard stop overshoots by up to `cap - 1`.
   **Recommendation:** clamp wave size so `k + w <= 1.5 x N` (shrink the wave,
   never refuse the owner a decision). That preserves the invariant the incident
   behind LA-1 needed.
2. **Write-ahead must be one write per wave**, before any spawn: `k := k + w`
   in a single orchestrator-only write (AC-9 already forbids brief writes). This
   removes any race and keeps the counter equal to "briefs actually launched".
3. **Correctives** are counted when they fire (unchanged). A mid-wave failure's
   retry is `+1`, so `k` after a wave = briefs + retries, which is exactly the
   serial arithmetic.
4. **Checkpoints and `Estimate:`.** The planner counts one checkpoint per phase
   before waves are computed; a phase of five briefs under cap 3 yields two wave
   reviews. Recommend: leave `Estimate:` untouched and let `Reviewer runs:`
   carry the true review count. The sidecar records the delta so the
   estimate-vs-actual gap is visible rather than absorbed.
5. **Loop mode `Tick budget:`.** A tick is defined as one brief; a wave makes a
   tick up to w briefs and its tokens up to ~w x a single brief's, so a budget
   calibrated for one brief trips falsely — or, if raised, loses meaning. The
   measurement need: `Tick tokens:` must be the **sum over the wave**, and the
   budget's calibration basis must be restated. Flag to the architect memo.
6. **Integrity check I will run:** `k_serial == k_wave` in the fixture pair when
   no corrective fired; and `k` after any wave phase equals
   `briefs_started + retries` from the sidecar. A mismatch means the counter
   lied.

## 6. What we will not know

- **Quality cost of one wave review.** Whether a single review over three
  briefs misses what three would have caught. Findings counts are recorded;
  defects that escape are **unknown** until they surface later.
- **The noise floor of S.** With one pair, run-to-run variation is unknown; a
  near-threshold S is inconclusive.
- **Real-work speedup**, if option C is chosen: the fixture measures the
  machinery. Real missions' speedup is **estimated** from the AC-16 run against
  a modelled serial.
- **How many real missions have wave-eligible phases.** Wave coverage is only
  measurable after write sets are declared; before that, any claim about how
  often waves apply is unsupported.
- **Whether declared-disjoint means actually independent.** The tool checks
  write sets, not data or logic dependencies between briefs; a hidden
  dependency shows up only as a failure or a drift block, not as a number
  before it happens.
- **Cost at scale of burn rate**, rate limits, and provider-side queueing.
- **Orchestrator token spend and cache-weighted cost**, unless the usage probe
  in section 4 shows they are capturable.
- **Anything about a wave of 3 if only a wave of 2 was exercised**, and vice
  versa; S for one size is not S for the other.
- **Silence is not a result.** A missing event or field means "unknown", never
  "zero".
