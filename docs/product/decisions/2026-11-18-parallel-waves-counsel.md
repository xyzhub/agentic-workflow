---
status: counsel
owner-agent: orchestrator
feature: parallel-waves
date: 2026-11-18
---

# Counsel brief — parallel waves

_The §5 advisor red-team convened before the single owner approval. Two lenses,
each spawned fresh on Fable and each asked for the **strongest case against**,
not a balanced view. Counsel advises; the owner decides._

## Financial lens — verdict: **do not fund the run now**

Recommends keeping the plan **whole and parked** (which is what the owner already
chose) but adding a **named un-park trigger** instead of leaving it open-ended,
because "parked with no trigger is a drop".

**Strongest argument against.** The plan's own best case carries no financial
upside. The measurement plan itself states that wall-clock is not what the owner
pays for — tokens are — and the token direction is expected to point up, neutral
at best. Three supporting points:

- The primary metric deliberately **excludes human wait time**, so it measures
  agent-active time that an owner running unattended is not waiting on.
- **Review count never falls.** It equals serial when a phase is one wave, and
  rises when a phase splits — five briefs at cap 3 means two reviews where there
  was one. Reviews are the expensive beat, and one boundary-class brief
  escalates its whole wave to the top tier.
- The speedup that does exist arrives as a **higher burn rate per hour**, which
  is precisely the failure that caused the plugin to be disabled on 2026-08-19.

**Cost, bounded honestly.** Every figure is marked:

| Cost | Figure | Basis |
|---|---|---|
| One-off build | **unknown** | Seven parts, AC-1..AC-18, ~a dozen protocol rewordings. Nearest comparator: one earlier planning phase at ~333k subagent tokens (measured, different mission). The planned mission's `Estimate:` is the figure to demand before approval. |
| One-off measurement | **unknown until the first arm runs** | Two fixture arms of three briefs plus reviews, an optional third arm for the noise floor, plus the real end-to-end phase |
| Permanent, per mission | **unknown** | Zero extra reviews when a phase is one wave; one extra per additional wave. Only review prices on record: 70k tokens for a one-shot review, 1.08M for six supervisor beats (both measured, one incident) |
| Planning spend | **sunk** | And it decays — the "verified 2026-11-18" line references go stale once another mission rewords §5 |

**The threshold trap.** The proposed fixture nearly passes by construction:
three equal briefs give a speedup of roughly 2.4 before review time is counted,
so it can only fail on achieved parallelism or on the token ratio. A pass would
measure the machinery, not real work — and the real-work figure is compared
against a *modelled* serial time, so after all the spend that number is still an
estimate.

**The cheapest experiment that would settle it — no build required.**
Hand-declare write sets on three to five existing `.plans/*.sessions.md` files
and count how many briefs land in waves of two or more. That yields **wave
coverage**, which bounds the whole feature's mission-level gain and is listed as
unknown in the measurement plan. Cost: one small read-only session. _(The
orchestrator ran this; see `2026-11-18-parallel-waves-coverage.md`.)_

A second free check: compare hours the queue sat idle waiting on owner merge
gates against hours spent executing briefs. **If gates dominate, waves buy
nothing.**

**Opportunity cost.** The same spend funds the verification epic, which a Fable
council previously ranked the number-one gap. Issue 44 owns worktree creation,
preparation and reaping, so building it first makes this cheaper; issue 53 is
what would let a fleet use waves at all.

**The case FOR, steelmanned then broken.** The honest case for is the 24/7
runner: a serial unattended runner leaves most of the day idle. But total work is
identical, so finishing sooner pays only if the **brief queue** is the
bottleneck rather than the owner's gates. And a runner that burns up to three
times faster unattended, with fewer review eyes per brief, compounds unverified
work faster.

**On a thinner v1.** Explicitly **not** recommended — in this repo a cut is
permanent, so a thinner v1 is permanently less feature.

**The number that would change its mind:** wave coverage on real past missions at
or above roughly **50%** of briefs in waves of two or more (its proposed line,
not a measured one), with the queue rather than owner gates as the bottleneck. At
that point it would move to "fund as scoped".

## Orchestrator's measured check on the financial lens

The financial lens named a second free check: *"compare hours the queue sat idle
waiting on owner merge gates against hours spent executing briefs. If gates
dominate, waves buy nothing."* The orchestrator ran the measurable half.

**Measured, 2026-11-18** — the last 30 merged pull requests in this repository,
time from opened to merged:

| | Hours |
|---|---|
| Median | **0.35** (about 21 minutes) |
| Mean | 8.62 |
| Range | 0.01 – 52.53 |
| Under 1 hour | 20 of 30 |
| Over 12 hours | 6 of 30 |

All 30 were merged by the owner's own account, so there is **no agent-merge
confound** deflating the figure — these are genuine owner gate waits.

**This cuts against the financial lens' argument.** The owner clears the merge
gate in about 21 minutes in the typical case, so owner gates are **not** the
dominant wall-clock cost; a long tail exists (6 of 30 over half a day, one at
52 hours) but it is the minority. If gates are usually cheap, then brief
execution time plausibly *is* the bottleneck, which is the condition under which
waves pay.

**What this does not establish.** Only one side of the ratio was measured. Brief
execution time is **not recorded anywhere** — the ledgers hold counts and dates,
no durations, which is exactly the instrumentation gap the measurement plan
identifies. So this shows gate wait is small in absolute terms; it does **not**
show the ratio of gate wait to execution time. Pull-request latency is also a
proxy for the final gate only, not for every mid-mission pause.

## Measured wave coverage — the decisive finding

The financial lens said the number that would most change its mind was wave
coverage on real past missions, at or above roughly **50%**. The orchestrator
measured it (full working: `2026-11-18-parallel-waves-coverage.md`).

**Measured: 0 of 13 briefs — 0%.** Across the five most recent missions
(continuous-operation, provider-adaptive, jev-browser, xyz-rebrand,
precompact-handoff). No brief was undecidable, so the conservative
overlap rule changes nothing and the range is 0–0%. All five missions scored 0%
individually. No hand-marked "parallel-safe" flag exists anywhere — every file
says "Not parallel" — so the computed result agrees with the planner's own
judgement.

**Why it is zero matters more than the number.** 11 of the 13 briefs were the
**only brief in their phase**, so no wave was possible *by construction*. The one
multi-brief phase (xyz-rebrand P1) collides on `lint.mjs` and `hook-test.mjs`,
and its second brief runs the tool the first one builds — a dependency, not a
collision.

**The structural cause, verified in the protocol itself:**

| Source | Text |
|---|---|
| `templates/WORKFLOW.md:371-372` | "**A mission is one session and one review by default.** The planner writes one brief and `Estimate: 1 session`" |
| `agents/planner.md:99,105` | "Estimate honestly, default to one session" … "Write `Estimate: 1 session`" |
| `commands/plan.md:15` | "`Estimate: 1 session` unless the decomposition honestly needs `phases`" |

**So the feature builds the back half of a pipeline whose front half does not
exist.** A wave scheduler needs two or more independent briefs in one phase; the
protocol's default is one brief per *mission*, and the planner is explicitly
instructed toward that default. The prerequisite is not issue 44 — it is a
planner that cuts disjoint briefs within a phase, which no past mission did.

**Honest caveat, stated by the measurement itself:** 0% means "past plans were
not wave-shaped", **not** "this work cannot be split". The planner cut for
sequential execution because that is what it was told to do. Coverage could rise
if the planner changed. Also: n=5, all plugin-internal missions, write sets
inferred from `Do:` prose rather than declared, and the top collider
(`tools/lint.mjs`, 11 of 13) is inflated because it counts briefs that merely
*run* the lint as a verify step rather than write it. `features.md`, which the
grammar memo predicted would be a blocker, appears in **no** brief at all.

**Making shared files orchestrator-owned would not rescue coverage** — the
remaining collisions are genuine dependency chains. That is the measurement's
inference, not a proven claim; it did not check all 15 continuous-operation
pairs.

## Technical lens — verdict: **proceed with named changes**

The lens labelled its own claims F (read in the cited file), I (inference) or
S (speculation), and stated plainly that it reproduced no measurement.

**The failure most likely to ship: a wave goes green on a tree nobody tested.**
Every waved brief forks from the same pinned commit into its own worktree, so it
never sees a sibling's write. A brief's `Verify` and its drift check therefore
both describe a tree that never exists on the phase branch. This is guaranteed
staleness on *well-behaved* briefs, not a rare race — and the memos themselves
concede "in this repo nearly every brief reads `templates/WORKFLOW.md`".
**Nothing in the design re-runs the §10 test gate on the integrated tip before
the wave review**; the reviewer is the only check.

Its concrete test: wave a brief that rewrites a §5 heading in
`templates/WORKFLOW.md` with one that writes a pointer to that heading in
`commands/mission.md`. Expect both to pass, drift green, a clean merge — and a
broken pointer on the integrated tip. **This feature's own AC-18 has exactly that
shape.**

**Further attacks, ranked:**

1. **A second write to a file that preparation already dirtied is invisible.**
   `tools/run-codex.mjs:423-426` compares status *letters*, not content: "a path
   already dirty that Codex edits again with the same status is not reported".
2. **The only cover for Bash exempts the hot files.** The "orchestrator's
   checkout unchanged" read excludes `.plans/` by name, and the hot set is
   entirely under `.plans/` — so a waved brief's shell write to the main
   checkout's ledger passes every check, breaking AC-9. It never inspects
   sibling worktrees either. _(This one gets worse, not better, in light of the
   orchestrator's hook finding below: the guard that would catch it is viable, so
   the exemption is a live hole rather than a theoretical one.)_
3. **No run-or-resume model for three long builder processes.** No mention of
   background runs, timeouts, rate limits or compaction recovery; the adapter is
   proven for short record roles only. A compaction mid-wave leaves `+3` already
   charged, worktrees on disk, and no recorded "returned but not merged" state.
4. **The Bash allowlist cannot be both safe and useful.** Narrow, and the builder
   cannot run its own `Verify` and burns turns into a budget block. Wide
   (`node`, `npm`, `git`), and the shell is unconfined — a formatter or codegen
   run trips drift after the tokens are spent.

**Recommendations it judges wrong:**

- **Reads-gap as warn-only — wrong.** Run the §10 test gate on the integrated tip
  after each merge and before the wave review, and block on red; and treat a
  brief's `Reads:` intersecting a sibling's `Writes:` as overlap. Waves shrink;
  that is the honest price.
- **"Absorb nothing" contradicts the profile memo**, which adds a `PreToolUse/Bash`
  guard for a brief worktree while "absorb nothing" rests on children firing no
  plugin hook. _(Orchestrator settled this — see below. The guard is viable; the
  "no plugin hook" claim was too broad; the "absorb nothing" conclusion
  survives on a narrower basis.)_
- **The budget fallback is not a one-line rewording.** Every spawn site a waved
  brief can reach — corrective retry, deviation resume, fallback — needs an
  adapter-plus-`--cwd` form and a lint rule.
- **"Add later" deferrals contradict the brief**, which says omissions are never
  revisited.
- **The `--restricted` "witness" is a header comment, not a test it could find**,
  and it covers file tools only.

**Its own kill-condition:** dry-run the wave computation over the last three real
missions with reads counted as overlap — "if fewer than one phase in three forms
a full wave, do not build this shape."

## Both lenses' kill-conditions are already met

Neither lens knew the coverage number when it wrote. Both named a threshold, and
the measurement came in below both:

| Lens | Its stated kill-condition | Measured |
|---|---|---|
| Financial | wave coverage below ~50% of briefs in waves of ≥2 | **0%** (0 of 13) |
| Technical | fewer than one phase in three forming a full wave | **0 phases of 13 briefs** |

The two lenses disagreed on verdict — "do not fund the run now" versus "proceed
with named changes" — but that disagreement predates the number. On the evidence
each said would decide it, both point the same way: **do not build this shape
now.** The plan itself remains sound work; what is missing is anything for it to
schedule.
