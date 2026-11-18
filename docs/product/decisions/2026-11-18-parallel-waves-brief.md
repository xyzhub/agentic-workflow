---
status: locked-on-approval
owner-agent: orchestrator
feature: parallel-waves
date: 2026-11-18
---

# Feature brief — parallel waves

_Authored by the team from the owner's interview answers (`/agentic-workflow:plan`,
2026-11-18). The **Interview answers** section is the owner's own words and
choices; everything else is drafted. Companion files:
`2026-11-18-parallel-waves-journeys.md` (designer),
`-memos.md` (architect), `-metrics.md` (analyst)._

## Problem

The protocol already **claims** parallel brief execution and has never been able
to deliver it, because every part of the claim is unverified prose:

| Where | What it says today | What is missing |
|---|---|---|
| `agents/planner.md:70` | "mark parallel-safe phases" | nothing computes the mark; it is the planner's assertion |
| `templates/mission-sessions.md:28` | "Mark a phase **parallel-safe** if its sessions touch disjoint files" | "disjoint files" is never declared, so never checkable |
| `commands/mission.md:184` | "Parallel-safe phases may run their briefs concurrently (isolated worktrees) — only with explicit human okay" | no isolation mechanism, no cap, and consent is renegotiated every single time |

So the parallel path is never taken. A mission that could run three independent
briefs at once runs them one after another, and the one lever that would make a
24/7 runner worth having stays shut.

The gap is not ambition — it is that **nothing in the trio declares what a brief
writes.** Without a declared write set there is no way to compute which briefs
can safely run together, no way to check afterwards whether a brief kept its
promise, and therefore no safe way to grant standing consent.

## What this feature is

Seven parts, as the owner specified them:

1. **Declared write sets per brief** — every brief in `.plans/<mission>.sessions.md`
   declares the paths it may write. This is the new fact everything else reads.
2. **A tool that computes non-overlapping waves** — reads the declared sets and
   groups briefs into waves whose write sets do not intersect.
3. **One worktree per brief** — each brief in a wave builds in its own working
   copy, so concurrent briefs cannot overwrite each other.
4. **Orchestrator-only hot files** — files no brief may declare (the ledgers and
   plan trio first of all); the orchestrator alone writes them, which is what
   keeps `Next up:` and the session count coherent under concurrency.
5. **Ordered integration with a write-set drift check** — wave branches merge in
   a defined order, and each branch's actual diff is checked against what it
   declared. A branch that wrote outside its set blocks.
6. **One checkpoint review per wave** — the fresh independent reviewer runs once
   over each integrated wave. Note this is **more** review than today, not less:
   §5 and `templates/mission-sessions.md:53` put the checkpoint at the end of a
   **phase**, so a phase split into two waves gets two reviews where it used to
   get one. That cost is bought deliberately — the second wave builds on the
   first wave's integrated result, so it must be verified before it becomes a
   foundation.
7. **A profile row for standing consent and a concurrency cap** — §10 records
   that waves are allowed and how many briefs may run at once, replacing the
   per-run "explicit human okay".

## Interview answers (the owner's words and choices, 2026-11-18)

**Q — With a standing-consent profile row, what should actually fire a wave?**
→ **"Automatic, up to the cap."** The planner declares each brief's write set; at
every phase start the wave tool groups the non-overlapping briefs and the
orchestrator runs them concurrently, up to the cap. The profile row IS the
consent — no per-mission ask. This replaces the "explicit human okay" line
outright.

**Q — How strict should the first version be on concurrency and on a brief that
writes outside its declared set?**
→ **"Cap 3, drift blocks."** Up to 3 briefs at once. A branch whose actual diff
left its declared write set blocks integration and surfaces to the owner. One
checkpoint review per wave, over the integrated range.

**Q — What would you accept as the observable sign this shipped and works?**
→ **All four**: "A real mission runs a wave" · "Drift caught deliberately" ·
"Tool proven by tests" · "Measured speedup vs serial".

**Q — Should the first version include preparing each brief's working copy
(install, secrets file, throwaway database)?**
→ **"Include it."** Each project records, once, how to prepare a fresh copy: the
install command, which secrets file to copy in, how to make a throwaway
database. Free to add in this markdown repo, and it is what lets real ventures
parallelise work that touches a database or needs the app running.

**Q — Where does this sit against the work already in flight?**
→ **"Planned and parked."** The plan gets written and reviewed now, then waits.
The owner picks the moment to start it; nothing is scheduled.

**Q — Three briefs are running at once and one of them fails. What should happen
to the other two, which finished cleanly?**
→ **"Keep the good ones, retry the failure."** The briefs that passed are
integrated in order. The failed one gets its single corrective retry, then either
integrates or comes to the owner. The wave's one review covers whatever actually
landed.

_One earlier scope question was withdrawn: the owner answered "I did not
understand these choices" to a jargon-written multi-select, and it was re-asked
in plain terms as the working-copy preparation question above. Three of its four
options were the orchestrator's own conclusions and are recorded as NOT-in-v1
below rather than put to the owner._

## Acceptance criteria

Grouped by journey (the planner cites these ids per brief, and the plan-judge
REVISEs any id no brief claims). The five journeys are:

| id | Journey |
|---|---|
| **J1** | The owner turns waves on — and the serial, fail-closed case when no consent row exists (AC-2) |
| **J2** | A wave runs clean |
| **J3** | Drift is caught |
| **J4** | One brief fails mid-wave |
| **J5** | The numbers are honest |

_Label reconciliation: the journeys file presents the serial case as its own
"J5 (serial)" and the measurement journey as "J5b", because the orchestrator's
brief to the designer mislabelled them. **This brief's table above is the
authority**; read that file's "J5 (serial)" as J1/AC-2 and its "J5b" as J5._

**J1 — the owner turns waves on**
- **AC-1** A §10 profile row records standing consent and the concurrency cap,
  written by `/agentic-workflow:bootstrap` and `/agentic-workflow:adopt` and
  readable by `/agentic-workflow:doctor`.
- **AC-2** With the row **absent**, every mission runs its briefs serially and
  says so — fail-closed, matching the §10 Publish-policy pattern. No wave ever
  runs on an unrecorded consent.
- **AC-3** The cap is honoured: with a cap of 3 and five eligible briefs, at most
  3 run at once.
- **AC-3a** **No automated command ever writes the consent row.** The consent is
  the owner's, so only the owner's answer creates it. Concretely: the profile
  re-derivation in `/agentic-workflow:sync` must treat the consent row as
  owner-owned and leave it absent rather than inferring it, and
  `/agentic-workflow:doctor fix` may only report it missing. (`doctor.md:113`
  already says fix mode never re-derives the profile — `sync` does, which makes
  `sync` the real risk here, not `doctor`.) A command that wrote this row would
  manufacture the very consent it then reports as given. The working-copy
  preparation recipe is a mechanical fact and may be derived; the consent may not.

**J2 — a wave runs clean**
- **AC-4** Every brief in `.plans/<mission>.sessions.md` carries a declared write
  set in a grammar the tier-1 lint validates; a brief with no declaration is
  never waved.
- **AC-5** `tools/waves.mjs` reads a sessions file and returns the computed waves,
  deterministically, with a plain reason for every brief it excludes.
- **AC-6** Each brief in a wave builds in its own working copy, prepared per the
  project's recorded recipe (install, secrets file, throwaway database).
- **AC-7** Wave branches integrate in a defined, recorded order.
- **AC-8** Exactly one fresh independent reviewer runs per wave, over the
  integrated range. The review count per phase therefore equals the number of
  waves, and the ledger records that count so the cost is visible rather than
  implied.
- **AC-9** The ledger is written by the orchestrator alone; concurrent briefs
  never write the trio, and exactly one `Next up:` survives a wave (§5 LA-7).

**J3 — drift is caught**
- **AC-10** After each brief, its actual diff is compared against its declared
  write set; a path outside the set **blocks** integration with a plain reason
  naming the brief and the offending paths. The comparison is taken against the
  **wave's base commit**, not the moving phase head — a baseline that advances as
  siblings land would false-block a brief that did exactly what it declared.
- **AC-11** A brief that writes an orchestrator-only hot file is refused, and the
  refusal names the file and who owns it.
- **AC-12** A deliberate drift test proves AC-10 and AC-11 — the guard is
  exercised, not just asserted.

**J4 — one brief fails mid-wave**
- **AC-13** The passing briefs integrate in order; the failed brief takes its one
  corrective retry (§5 one-corrective-retry), then integrates or surfaces to the
  owner. The wave's review covers what actually landed, and the ledger says which
  briefs are in and which are not.

**J5 — the numbers are honest**
- **AC-14** `Estimate:`/`Sessions used:` stay truthful under concurrency: the
  arithmetic is defined and written down for parallel briefs, so the §5 overrun
  stop (LA-1) still measures something real.
- **AC-15** A measured serial baseline and a measured wave run are recorded, with
  wall-clock and tokens for both, and the speedup stated as a number.
- **AC-16** One real mission phase runs 2+ briefs concurrently end to end —
  computed, isolated, integrated in order, drift green, one wave review passed.

**Cross-cutting**
- **AC-17** `node tools/lint.mjs` green; the new rules covered by
  `tools/lint-test.mjs`.
- **AC-18** Protocol text has one home: §5 gains the wave machinery, and
  `commands/mission.md:184`, `agents/planner.md:70` and
  `templates/mission-sessions.md:28` become pointers to it — no second prose
  statement (`checkRuleDedup`).

## NOT in v1

Recorded as the orchestrator's conclusions, not the owner's deferrals. **In this
repo what a mission leaves out is not revisited**, so each line says what is lost.

| Left out | Why | What is lost |
|---|---|---|
| Two whole missions running at once | That is issue 44's own remit (one working copy per mission); this feature stays inside one mission's briefs | Nothing — issue 44 remains the place for it |
| Spreading a wave's briefs across SSH executors | Issue 53's remit; the cap would have to become per-host and the remote rows must exist first | Waves stay single-machine; a server fleet gains nothing until issue 53 |
| Automatic conflict resolution at integration | The owner chose "drift blocks"; auto-resolution is the opposite posture | A genuine conflict always stops and asks — accepted deliberately |
| Codex-runtime parity for wave spawning | The Codex runtime is unavailable on this account (issue 122, ChatGPT plan lapsed) so it cannot be verified | Waves are Claude-only until Codex is re-subscribed and issue 81/122 land |

## Already in the tree (verified 2026-11-18 — do not rebuild)

Checked against the source, so the planner scopes against facts rather than
assumptions:

| Fact | Where | Consequence for this feature |
|---|---|---|
| `Sessions used:` can be bumped by more than one in a single call — the verb accepts `+N` for any N | `tools/ledger.mjs:159-169` | The orchestrator can write the counter once per wave (`sessions +3`) before any brief spawns. No tool change needed for the accounting fix. |
| A `Reviewer runs:` ledger line already exists and is "bumped at every one-shot reviewer spawn, plan-judge included" | `tools/ledger.mjs:172-183`, `templates/mission-state.md` | The extra review cost that waves introduce is **already instrumented**. AC-8's "the ledger records that count" needs no new field. |
| Per-mission worktrees are already in the protocol text and in practice (`.worktrees/<mission>`), for remote-executor isolation | `templates/WORKFLOW.md:1082`, `commands/mission.md:215`, and the live `.worktrees/continuous-op` | The *path convention* exists; what is missing is creation, preparation and reaping as an automated step — which is issue 44's remit, hence the absorption-boundary memo. |
| Every runtime adapter already takes a required `--cwd`, and derives `changed_paths` from the git tree at that directory | `tools/run-claude.mjs:68,111`, `tools/run-codex.mjs:62,92` | Per-brief isolation needs **no new mechanism per runtime**: the orchestrator creates a worktree and passes it as `--cwd`. A Claude-Agent-tool-only isolation feature would not work for a brief carrying `runtime: codex`, so the uniform path is the orchestrator-run worktree. |
| `tools/run-claude.mjs --restricted` already **confines file tools to `--cwd` and denies writes outside it**, with a witnessed test ("a Write outside `--cwd` was denied") | `tools/run-claude.mjs:29-31,276-278` | The plugin already has a proven write-confinement gate at directory granularity. The write-set drift check extends this rather than inventing it — and per `agents/planner.md`'s **Prior art** rule (#129), every brief touching write enforcement must cite this file so the builder extends it. |
| `changed_paths` is already returned per foreign-runtime run | `tools/run-claude.mjs`, `tools/run-codex.mjs`; `commands/mission.md` ("commit its `changed_paths` yourself") | The "actual diff" side of the drift check already exists for those runtimes; the check compares `changed_paths` against the declared set. Note `mission.md` also makes the **orchestrator** the committer for those runs, which settles who commits in a brief's worktree. |
| The checkpoint review is per **phase**, not per brief | `templates/mission-sessions.md:53`, §5 "Checkpoints end every phase" | "One review per wave" raises review count; see part 6 above. |

## Open shape decisions (architect memos, decided at the one approval moment)

1. **Write-set grammar and drift measurement** — path/glob/directory granularity;
   generated and new files; how the actual diff is derived.
2. **Isolation mechanism** — the Agent tool's own worktree isolation vs a
   tool-run `git worktree add`, and which is available under every runtime.
3. **Issue-44 absorption boundary** — how much of "one working copy per mission,
   ledger picked by branch, session count derived from rows" this feature must
   carry. **This brief originally asserted that a hand-incremented
   `Sessions used:` cannot survive parallel briefs and that the hooks' newest-mtime
   ledger picker would misfire across worktrees. Both were wrong, and the memo
   disproves them** — verified at `tools/run-claude.mjs:26-31`: the adapter sets
   `AGENTIC_WORKFLOW_CHILD=1` and passes `--restricted`. Under AC-9 the
   orchestrator is the sole ledger writer, and the mtime ledger-picker is never
   consulted in a brief worktree because it lives in `active-ledger.sh`, read
   only by hooks that ARE child-gated (`mission-budget.sh`,
   `beat-enforcer-*.sh`, `compact-resume.sh`, `handoff-*.sh`,
   `pre-compact.sh`). **This removes the feature's only apparent hard dependency
   on issue 44.**

   **Precision note (counsel, technical lens — the first telling of this was too
   broad).** The child flag silences *prompt hooks and beat-enforcers only*, not
   every plugin hook. Verified in `hooks/hooks.json`: the flag gates just two
   `UserPromptSubmit` entries, while **all seven `PreToolUse` groups and the
   `PostToolUse` group are ungated** — the git/gh guardrails, the close-keyword
   guard, the publishing and merge guardrails, the context-discipline backstop
   and the docs reminder all still fire inside a brief worktree. Two consequences:
   a `PreToolUse/Bash` guard protecting the hot files from inside a worktree **is
   viable, not dead code**; and those guardrails firing in a worktree is itself
   an unexamined surface, given issues 113, 145 and 151 are open false-positive
   bugs in exactly those guards.
4. **Accounting under concurrency** — what `Estimate:` counts when briefs run at
   once, and what a loop-mode tick becomes when a tick is no longer one brief.
   Includes the review-count question above: `Estimate:` counts briefs +
   checkpoints, so splitting a phase into waves changes the estimate itself.
5. **Profile surface** — the shape of the consent/cap row, the hot-file list, and
   the per-project working-copy recipe; and who commits in a brief's working copy
   given that spawned agents never commit (`AGENTS.md`).

## Locked decisions (owner, 2026-11-18)

Taken at the single approval moment, after the counsel brief and the measured
coverage. Each is dated and locked; the planner receives them resolved and does
not re-litigate them.

**LD-1 — Re-scope: build the front half first.** 2026-11-18. The seven-part wave
runner is **not** built now. Measured wave coverage on the five most recent
missions is **0 of 13 briefs**, because 11 of 13 were the only brief in their
phase — the protocol instructs the planner toward one brief per mission
(`templates/WORKFLOW.md:371`, `agents/planner.md:99`, `commands/plan.md:15`), so
a wave scheduler would have nothing to schedule. Both counsel lenses named a
threshold before seeing that number and 0% fell below both. Instead, one smaller
mission attacks the actual blocker: **declare write sets, teach the planner to
cut disjoint briefs where the work genuinely allows, and re-measure coverage.**
The wave runner is built only if the new number justifies it. _Owner's words:
"Re-scope: front half first."_

**LD-2 — Both safety fixes are locked into the wave design.** 2026-11-18. When
the runner is eventually built it must (a) re-run the §10 test gate on the
**integrated result** after each merge and **block on failure**, and (b) treat a
brief whose `Reads:` intersects a sibling's declared writes as an **overlap**, so
they never share a wave — not a warning. This closes the technical lens' "a wave
goes green on a tree nobody tested", which it called the failure most likely to
ship. Accepted consequence: **fewer waves**, which the owner took as the honest
price. _Owner's words: "Both fixes."_

**LD-3 — A wave means two or more briefs running together.** 2026-11-18. One
review per wave applies only to a genuine wave of two or more concurrent briefs;
a brief that ends up alone keeps today's ordinary phase checkpoint. This removes
the review-cost increase on phases where no parallelism actually happened —
which, on the measured evidence, is nearly all of them. AC-8 is to be read this
way. _Owner's words: "Two or more, together."_

**LD-4 — The architect's remaining four picks stand as recommended.** 2026-11-18.
Not put to the owner, because the counsel contested only the reads-gap (settled
by LD-2) and there was no basis on which to overrule the rest. Recorded as locked
so the planner treats them as resolved: the write-set **grammar** (exact paths
plus a decidable glob subset, undecidable counting as overlap); **isolation** by
orchestrator-run `git worktree add` plus `--cwd` through the existing adapters,
rejecting the Agent tool's own worktree isolation because it cannot serve a brief
carrying `runtime: codex`; **absorb nothing** from issue 44; and the **profile
surface** shapes (a fail-closed `Wave policy` row, a fixed protocol-level
hot-file set rather than one derived from §10 `High-impact files`, and a
`Working copy prep` row that reads `none` in this repository).

## The mission to run now (per LD-1)

**Mission name: `write-sets`.** Everything in it is independently useful even if
the wave runner is never built — which is the test LD-1 applies.

| # | Deliverable | Why it pays on its own |
|---|---|---|
| 1 | A **declared write set** as a brief field in `templates/mission-sessions.md`, authored by the planner in the LD-4 grammar, with a **tier-1 lint rule** validating its shape | Today `templates/mission-sessions.md:28` and `agents/planner.md:70` ask the planner to mark a phase "parallel-safe" if "its sessions touch disjoint files" — an assertion nothing can check. This makes it the first checkable fact. |
| 2 | **The planner cuts for disjointness** where the work genuinely allows, instead of defaulting to one brief per phase unexamined | This is the measured blocker. Without it coverage stays at 0% whatever else is built. |
| 3 | A **coverage reader** — the wave computation in report-only mode: read a sessions file, say which briefs could wave and which cannot, and why | Re-measures coverage honestly on newly planned missions, which is the evidence LD-1 makes the wave runner conditional on. It is the read-only half of AC-5, with no runner, no worktrees and no integration. |
| 4 | Retire the three unverifiable soft-rule statements at `agents/planner.md:70`, `templates/mission-sessions.md:28` and `commands/mission.md:184` | They currently promise concurrency the protocol cannot deliver. Either they point at real machinery or the claim goes. |

**Explicitly NOT in `write-sets`:** worktree creation, preparation or reaping;
ordered integration; the drift check; the consent and cap profile rows; any
concurrent execution at all. Those stay in the parked `parallel-waves` plan,
governed by LD-2 and LD-3.

**The un-park condition for `parallel-waves`:** coverage re-measured on missions
planned *after* deliverable 2 lands. The financial lens' line was roughly 50% of
briefs in waves of two or more; the technical lens' was at least one phase in
three forming a full wave. Neither is a measured threshold, and the owner has
ratified neither — they are recorded here as the two independent opinions on
record, to be settled when there is a real number to settle them against.

## Priority

**Planned and parked** (owner, 2026-11-18). The trio is authored and plan-judged
now; it is not scheduled and does not become `Next up:`. The
continuous-operation mission keeps the queue.
