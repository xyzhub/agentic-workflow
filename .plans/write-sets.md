---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: write-sets — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5),
2026-11-18, tree at main `5ba640e`, plugin v1.69.1. Scope was settled before
this file existed — the planner decomposes, it does not re-decide._

<!-- Converted from `docs/product/decisions/2026-11-18-parallel-waves-brief.md`
(sections "Locked decisions (owner, 2026-11-18)" and "The mission to run now
(per LD-1)"), 2026-11-18. The source file is untouched. -->

Goal: make a brief's write set a declared, lint-checked fact; have the planner
examine a disjoint cut instead of assuming one brief per phase; and ship a
report-only reader that re-measures wave coverage — the front half of parallel
waves, each part useful even if the wave runner is never built.

Estimate: 1 session — one brief (S1), one one-shot checkpoint review, verify,
one PR to `main`. Justification is under Locked decisions (PD-1).

**Priority: planned and parked** (owner, 2026-11-18). This trio is authored and
plan-judged now. It is **not scheduled**: `continuous-operation` keeps the
queue, and no file outside this mission's own ledger names `write-sets` as the
repository's next mission. The ledger carries `Status: parked`.

**This mission is its own first test case.** Every brief here declares a
`Writes:` line in the LD-4 grammar although the rule that checks it does not
exist until S1 builds it. AC-4 makes the new check pass on this mission's own
sessions file, and AC-14 has the reviewer compare the branch's real diff against
S1's declared set by hand. Limit, stated plainly: a one-brief mission tests the
field's **shape** only; its own wave coverage is 0 by construction (a sole brief
in its phase). Overlap behaviour is proved by the harness fixtures (AC-6..AC-8).

## Tasks

1. **The `Writes:` brief field and its shape check** (deliverable 1)
   - AC-1 `plugins/agentic-workflow/templates/mission-sessions.md` carries a
     `- **Writes**:` bullet directly after `Reads`, stating: entries separated
     by ` · `, each optionally backticked; the five allowed forms (see Value
     sourcing); `none` for a brief that writes nothing; never a path under
     `.plans/`; and a one-line pointer to §5 for the rule. No grammar prose is
     repeated anywhere else in the plugin tree.
   - AC-2 `node plugins/agentic-workflow/tools/waves.mjs --check <sessions.md>…`
     exists (zero dependencies, Node ≥ 18), exits 0 when every declared entry is
     well-formed and 1 otherwise, printing one `file:line: message` per finding.
     It rejects: a leading `/`; a `..` segment; `?`, `[`, `]`, `{`, `}`, `!` or
     a backslash; `*` anywhere but a whole segment or inside the final segment;
     `**` anywhere but a whole segment; an empty entry; an entry whose first
     segment is `.plans`; `none` combined with other entries. It checks shape
     only — never whether a path exists or will be written.
   - AC-3 Validate-when-present: a sessions file in which **no** brief carries
     `Writes` passes with one `note:` line (exit 0), so the 22 existing
     `.plans/*.sessions.md` files do not fail; a file in which **some** briefs
     carry it and others do not fails, naming each brief that lacks it. A brief
     is a `### S…` heading; a phase is the nearest preceding `## Phase …`
     heading (no phase heading → one implicit phase).
   - AC-4 Tier 1 enforces it in this repo: `node tools/lint.mjs` fails when
     `tools/waves-test.mjs` is missing or fails, and when `waves.mjs --check`
     over `.plans/*.sessions.md` fails. `.plans/write-sets.sessions.md` passes.
     The `tools/lint.mjs` change is exactly one new function plus one standalone
     call statement after the entry-point loop: the `for (const check of [` line
     and the `export {` line are byte-identical to `main` (see R-1).
   - AC-5 Ventures get the check without this repo's root lint:
     `plugins/agentic-workflow/tools/conform.mjs` gains one ladder entry
     (`write-sets-shape`, `since` = this release) that imports the shape
     function from `waves.mjs` (no child process, no git) and reports a gap when
     a project's `.plans/*.sessions.md` fails it; silent when no file carries
     `Writes`. Conform stays advisory (exit 0 unless `--strict`) — in a venture
     the blocking check is the plan-judge's (AC-11).

2. **The overlap matcher** (the one function deliverables 1 and 3 share)
   - AC-6 `waves.mjs` exports one pure function comparing two entries that
     returns `disjoint`, `overlap` or `undecidable`. `tools/waves-test.mjs`
     proves: it is symmetric for every ordered pair in its case table; a `dir/`
     entry overlaps every path under it; a whole-segment `*` never crosses `/`;
     `**` matches any depth; a final-segment `*` matches within that segment
     only; and every pair the matcher cannot decide is grouped as an overlap
     (never waved together). The table includes the memo's own examples
     (`docs/product/catalog/`, `plugins/agentic-workflow/tools/waves*.mjs`).

3. **The coverage reader, report-only** (deliverable 3)
   - AC-7 `node plugins/agentic-workflow/tools/waves.mjs --report
     <sessions.md>… [--cap N] [--json]` prints, per phase, the computed waves
     and, for every brief not in a wave of two or more, one plain reason: sole
     brief in its phase · overlaps `S<k>` (naming both entries) · undeclared ·
     undecidable against `S<k>` · over the cap. Same input gives byte-identical
     output (harness asserts two runs match). It writes nothing and runs
     nothing.
   - AC-8 The totals reproduce the hand measurement's definition
     (`docs/product/decisions/2026-11-18-parallel-waves-coverage.md`): a wave
     is two or more briefs of one phase (LD-3); default cap 3; any `.plans/`
     path is orchestrator-owned and ignored; an undeclared brief or an
     undecidable comparison counts as colliding. Two rates are printed: briefs
     in waves ÷ all briefs, and briefs in waves ÷ (all briefs − undecidable
     briefs), where an undecidable brief is one that is undeclared or that an
     undecidable comparison kept out of a wave — so a file with every brief
     undeclared has a zero denominator. A zero denominator prints `n/a`, never
     `0%` or `100%`.
   - AC-9 Per OQ-2's recommendation, the report adds a third rate under the
     LD-2(b) rule: a brief whose `Reads` names a path that a phase sibling's
     `Writes` matches is an overlap. Read paths are the backticked path-shaped
     tokens of the `Reads` field; a `Reads` field yielding none makes the brief
     undecidable for this rate only. The first two rates are unaffected.
   - AC-10 Regression against the hand count, run once by the builder and
     re-run by the reviewer (not a permanent test — one of the files is a live
     mission): `--report` over the five files the coverage note measured, **read
     at commit `5ba640e`** (`git show 5ba640e:<path>`), because the live
     continuous-operation copy on `feat/continuous-op` has since grown to 8
     single-brief phases and will change these counts when it merges
     (continuous-operation, provider-adaptive, jev-browser, xyz-rebrand,
     precompact-handoff) reports 13 briefs, 12 phases, 2 briefs in a
     multi-brief phase, 0 briefs in waves, 13 undeclared, second rate `n/a`.
     The output is pasted into the handoff.

4. **The planner examines a disjoint cut** (deliverable 2)
   - AC-11 `agents/planner.md` instructs the planner to: declare `Writes` on
     every brief; run `waves.mjs --check` on its sessions file before returning;
     when a mission runs in `phases` mode, cut a phase's briefs along disjoint
     write sets where the work genuinely allows; write one `Cut examined:` line
     per phase that opens with exactly one of two values — `no disjoint cut
     exists` (naming the shared file or data dependency — a cut whose halves
     overlap under the LD-2(b) reads rule counts here) or `cut exists,
     declined for cost` (naming the cut) — or, when the cut was taken, names
     the briefs it produced; and include the `--report` totals line in its
     return. The two declined values are kept apart because "nothing can run
     briefs concurrently yet" is true of every mission until the runner
     exists: only the second kind is evidence the runner would have had work. The one-session default and the
     LA-1 estimate rule are untouched (OQ-1). `agents/reviewer.md` plan-judge
     checklist gains one bullet: `Writes` declared on every brief, `--check`
     clean, a `Cut examined:` line per phase — missing → named fix.

5. **Retire the three unverifiable statements** (deliverable 4)
   - AC-12 `grep -rni 'parallel-safe' plugins/agentic-workflow` and `grep -rniE
     'briefs (concurrently|at once|in parallel)' plugins/agentic-workflow` both
     return nothing (three hits and one hit today, all at the three sites). The rule
     has ONE prose home: a short unfenced `**Write sets.**` paragraph in
     `templates/WORKFLOW.md` §5 (what the field is, that briefs run serially,
     that the reader measures and nothing executes waves). `agents/planner.md`
     (was line 70), `templates/mission-sessions.md` (was 27–29) and
     `commands/mission.md` (was item 5, line 184) carry one-line pointers, not
     restatements. No new `<!-- rule: -->` id is minted. `checkRuleDedup` stays
     clean.
   - AC-13 Byte ceilings hold: `templates/WORKFLOW.md` ≤ 120,000 B (115,866
     today) and `commands/mission.md` ≤ 24,000 B (22,807 today); `node
     tools/lint.mjs` prints `lint: clean`.

6. **Scope fence and release**
   - AC-14 Own-cooking audit: every path in `git diff --name-status
     --no-renames main...HEAD` matches an entry of S1's declared `Writes`
     (`.plans/` excluded — the orchestrator's). The reviewer records `declared
     N, wrote M, unused: …`. A path outside the set is a finding.
   - AC-15 Nothing from the parked half ships: the diff adds no worktree
     creation, no ordered integration, no drift check, no §10 profile row, no
     hook, and no code path that spawns a brief. `grep -rn 'worktree add'
     plugins/agentic-workflow/tools/waves.mjs` returns nothing.
   - AC-16 Release: `CHANGELOG.md` gains the entry under a new version heading;
     `plugins/agentic-workflow/.claude-plugin/plugin.json` and
     `plugins/agentic-workflow/package.json` carry the same new version;
     `plugins/agentic-workflow/README.md` names `tools/waves.mjs` (`--check` ·
     `--report`) beside the other plugin-held tools.

## Value sourcing

| AC | Value | Source kind | Where |
|---|---|---|---|
| AC-1 | Field name and separator: `- **Writes**: <entry> · <entry>` beside `Reads`/`Catalog` | locked decision | 2026-11-18 (LD-4) — `docs/product/decisions/2026-11-18-parallel-waves-memos.md:316–317` |
| AC-2 | Allowed entry forms: exact path · `dir/` · whole-segment `*` · `**` · final-segment `*`; everything else a lint failure; no `?`, classes, braces, absolute paths, `..` | locked decision | 2026-11-18 (LD-4) — memos `:139–145`, `:318–319` |
| AC-6 | Overlap rule: conservative — undecidable ⇒ overlap | locked decision | 2026-11-18 (LD-4) — memos `:146–148`, `:320` |
| AC-6 | One matcher only: the same function serves the shape check and the reader | locked decision | 2026-11-18 (LD-4) — memos `:324–325` |
| AC-2 | The shape check ships inside the plugin, not only in root lint | locked decision | 2026-11-18 (LD-4) — memos `:302–311` (ventures never run root lint, fact R13) |
| AC-8 | A wave = two or more briefs running together | locked decision | 2026-11-18 (LD-3) — brief `:286–291` |
| AC-8 | Default cap 3 | locked decision | 2026-11-18 — brief `:74` (owner: "Cap 3, drift blocks"); a `--cap` flag default only, no profile row (PD-3) |
| AC-8 | Trio ignored · undeclared/undecidable = colliding · both rates reported | derivation | `docs/product/decisions/2026-11-18-parallel-waves-coverage.md:5–6, 10–11, 91–92`; "a brief with no declaration is never waved" — brief `:144–146` |
| AC-9 | Reads ∩ sibling writes = overlap | locked decision | 2026-11-18 (LD-2b) — brief `:278–282`; whether the reader applies it now is OQ-2 |
| AC-10 | 13 briefs · 12 phases · 2 in a multi-brief phase · 0 waved | derivation | coverage note `:21–28` (table totals) |
| AC-7 | Wave grouping order: greedy first-fit in file order within a phase | open question | OQ-5 (not in the source; built on PD-5 until answered) |
| AC-2 | `none` literal for a brief that writes nothing | open question | OQ-3 (not in the source; built on PD-6 until answered) |
| AC-13 | Ceilings 120,000 B / 24,000 B | derivation | `tools/lint.mjs:1012, 1014` |
| AC-16 | Version number | derivation | next minor above `plugin.json` on `main` at branch cut (`plugins/agentic-workflow/.claude-plugin/plugin.json:4`; 1.69.1 today, and `continuous-operation` S5 claims 1.70.0 — `.plans/continuous-operation.sessions.md:769`) |

## Locked decisions

Owner locks, carried from the source with their date. Not re-litigated.

- 2026-11-18 — **LD-1 — Re-scope: build the front half first.** The seven-part
  wave runner is not built now. Measured wave coverage on the five most recent
  missions is 0 of 13 briefs, because 11 of 13 were the only brief in their
  phase — the protocol steers the planner to one brief per mission
  (`templates/WORKFLOW.md:371`, `agents/planner.md:99`, `commands/plan.md:15`).
  One smaller mission attacks the blocker: declare write sets, teach the
  planner to cut disjoint briefs where the work genuinely allows, and
  re-measure coverage. The runner is built only if the new number justifies
  it. Owner: "Re-scope: front half first."
- 2026-11-18 — **LD-2 — Both safety fixes are locked into the wave design.**
  When the runner is built it must (a) re-run the §10 test gate on the
  integrated result after each merge and block on failure, and (b) treat a
  brief whose `Reads:` intersects a sibling's declared writes as an overlap,
  never a warning. Accepted consequence: fewer waves. Owner: "Both fixes."
  (a) is out of this mission entirely; (b) touches only the reader's third
  rate — see OQ-2.
- 2026-11-18 — **LD-3 — A wave means two or more briefs running together.** A
  brief that ends up alone keeps the ordinary phase checkpoint. Owner: "Two or
  more, together."
- 2026-11-18 — **LD-4 — The architect's remaining four picks stand.** The
  write-set grammar (exact paths plus a decidable glob subset, undecidable
  counting as overlap); isolation by orchestrator-run worktree plus `--cwd`;
  absorb nothing from issue 44; the profile-surface shapes. Only the grammar
  is in this mission; the other three belong to the parked plan.
- 2026-11-18 — **Out of `write-sets`** (source, "The mission to run now"):
  worktree creation, preparation or reaping; ordered integration; the drift
  check; the consent and cap profile rows; any concurrent execution.
- 2026-11-18 — **Priority: planned and parked.** Authored and plan-judged now,
  not scheduled; `continuous-operation` keeps the queue.
- 2026-11-18 — **Un-park condition for `parallel-waves`**: coverage re-measured
  on missions planned after deliverable 2 lands. The two lens opinions (about
  50% of briefs in waves; at least one phase in three forming a full wave) are
  on record and ratified by nobody.

Planner decisions for this trio (mine, 2026-11-18 — the plan-judge may REVISE
them):

- 2026-11-18 — **PD-1 — Estimate 1 session, one brief.** Per-phase count: phase
  1 = S1 (the checkpoint review rides the same session, as in
  `precompact-handoff`). Measured reads ≈ 900 lines against the ~1,500 budget.
  A two-brief disjoint cut exists and was examined — tool side (`waves.mjs`,
  `waves-test.mjs`, `lint.mjs`, `conform.mjs`) against prose side (template,
  `planner.md`, `reviewer.md`, `mission.md`, `WORKFLOW.md`, release files) —
  and declined: nothing can run the two concurrently yet, so the split buys no
  time and costs a second context plus a checkpoint (3 sessions for 1); and
  under LD-2(b) the tool brief reads the template the prose brief writes, so
  the pair would not share a wave anyway.
- 2026-11-18 — **PD-2 — Gate policy human-merge.** §10 Merge policy
  `agent-may-merge (records-only, delegated 2026-10-07)` covers only a PR whose
  every path is a record path. This mission changes plugin code and protocol
  text, so the feature PR is the owner's to merge; the later bookkeeping PR is
  records-only and agent-mergeable.
- 2026-11-18 — **PD-3 — No new rule id, no profile row.** The §5 paragraph is
  unfenced prose with pointers elsewhere, which is what the dedup guard asks
  of any rule. Minting `<!-- rule: … -->` would also need a `RULES` entry in
  `tools/lint.mjs` and cases in `tools/lint-test.mjs` — a larger diff in the
  contended file for a rule nothing executes yet. The cap is a CLI default,
  because the cap profile row is in the parked half.
- 2026-11-18 — **PD-4 — Tests live in a new root harness `tools/waves-test.mjs`**
  (the `ceremony-test.mjs` shape), not in `tools/lint-test.mjs` as the memo's
  AC-17 sketched — it keeps the `export {` line of `tools/lint.mjs` and all of
  `lint-test.mjs` untouched.
- Assumed 2026-11-18 — owes a first real run; built on the memo's naming
  (`plugins/agentic-workflow/tools/waves.mjs --check`, memos `:308–309`) plus a
  `--report` verb, `--cap` and `--json` the planner added. No spike ran any of
  these invocations, so none is a lock (#130); authorized by the planner
  pending plan-judge.
- Assumed 2026-11-18 — **PD-5** — owes the answer to OQ-5; built on greedy first-fit grouping in file order within
  a phase (the source fixes "deterministically", brief `:147–148`, not the
  order); authorized by the planner pending plan-judge. File sets cannot see a
  data dependency between briefs, so the reader's number is an upper bound and
  its output says so.
- Assumed 2026-11-18 — **PD-6** — owes the answer to OQ-3; built on `Writes: none` for a brief that writes nothing and on
  validate-when-present (the memo wanted the field required on every brief,
  memos `:303`, which would fail all 22 existing sessions files); authorized
  by the planner pending plan-judge.

- Assumed 2026-11-18 — **PD-7** — owes the answer to OQ-1; built on the
  one-session default staying untouched, with the disjoint cut applying only
  inside `phases` (AC-11 and S1's `planner.md` edit are written to that);
  authorized by the planner pending the owner's answer. Any other answer
  forces a replan: `commands/plan.md:15`, one of LD-1's three steer sites, is
  not in S1's `Writes`.

## Risks

- **R-1 — `tools/lint.mjs` is contended.** `feat/continuous-op` (`8ba8bf6`)
  has +20 lines there: a `checkRunnerHarness` function after
  `checkHeadlessHarness` (~line 533) and one name inserted into the single-line
  `for (const check of [` array (line 1402). **S1 is the only brief that
  touches the file.** Containment: the new function goes immediately above the
  `export {` line (~1383) and is called by its own statement after the loop's
  closing brace, never by editing the array line. Measured 2026-11-18 with
  `git merge-file` (base `main` `5ba640e`, theirs `8ba8bf6`): that placement
  merges clean and the result passes `node --check`; adding the name to the
  array instead conflicts. It is a measurement against a moving branch, not a
  guarantee — whichever of the two lands second re-runs lint after the merge.
- **R-2 — a false "disjoint" in the matcher.** The harm today is a wrong
  coverage number, not a collision (nothing executes waves). Bounded by AC-6:
  the symmetry property test and the undecidable-is-overlap test the memo
  required.
- **R-3 — prose headroom.** `WORKFLOW.md` has 4,134 B and `mission.md` 1,193 B
  left. The §5 paragraph is budgeted at ≤ 900 B; the `mission.md` edit replaces
  two lines with a pointer no longer than they were (AC-13).
- **R-4 — the re-measure comes out 0 again, or empty.** LD-1 asked to attack
  the blocker, so a repeat 0 is a result to explain, not a success. Two
  bounds. Reach: under PD-7 the cut applies inside `phases`, which is where 11
  of the 13 measured briefs sat (continuous-operation 6, xyz-rebrand 3,
  provider-adaptive 2); only single-session missions stay at 0 by
  construction, and the report separates "sole brief in its phase" from file
  collisions. Emptiness: a planner can always decline a cut because nothing
  runs concurrently yet, so AC-11 makes `Cut examined:` say which kind of
  decline it was, and the re-measure counts `cut exists, declined for cost`
  lines beside the three rates.
- **R-5 — version collision.** `continuous-operation` S5 claims 1.70.0. The
  version is read from `main` at branch cut, never fixed here.

## Open questions

Put to the owner before `/agentic-workflow:mission "write-sets"` runs. The
briefs are written to the recommendations.

- **OQ-1 — Does deliverable 2 change the one-session default?** The source says
  the one-brief steer is the measured blocker (LD-1), yet §5, `planner.md` and
  `plan.md:15` make one brief the default and LA-1 stops a mission at 1.5× its
  estimate. Cutting a default mission in two means three sessions instead of
  one. **Recommendation:** keep the default; the disjoint cut applies only once
  `phases` is already justified, and every phase records a `Cut examined:`
  line (built as Assumed PD-7). Reach: 11 of the 13 measured briefs sit in
  multi-phase missions (continuous-operation 6, xyz-rebrand 3,
  provider-adaptive 2), so a phases-only cut reaches most of the measured
  blocker; the 2 single-session missions stay at 0 by construction, and the
  reader says so. Any other answer forces a replan, because
  `commands/plan.md:15` — one of LD-1's three steer sites — is not in S1's
  `Writes`.
- **OQ-2 — Does the reader apply LD-2(b) now?** The hand measurement ignored
  `Reads:`; LD-2(b) makes a read of a sibling's write an overlap in the real
  runner. **Recommendation:** report both — the two rates of the hand
  definition unchanged, plus a third under the reads rule (AC-9) — and judge
  the un-park on the third, since it predicts what the runner would do.
- **OQ-3 — Is "validate when present" acceptable?** A new trio that omits the
  field entirely passes tier-1 lint; only the plan-judge catches it (AC-11).
  The same answer covers `Writes: none` for a brief that writes nothing (PD-6;
  the source defines neither). **Recommendation:** yes to both — requiring the
  field would fail every existing sessions file, and a grandfather list is
  more machinery than the gap is worth.
- **OQ-4 — When is coverage re-measured?** The source gives the condition
  ("missions planned after deliverable 2 lands") but no count.
  **Recommendation:** when three sessions files other than this mission's
  carry `Writes`; the Closing row is written to that.
- **OQ-5 — In what order does the reader group briefs into waves?** The source
  says "deterministically" and no more. **Recommendation:** greedy first-fit in
  file order within a phase (PD-5) — the simplest rule a reader can check by
  hand; revisit when the runner is designed.

---
_The `.plans/write-sets.sessions.md` brief executes these tasks;
`.plans/write-sets.state.md` tracks progress. Resolve every open question
before execution starts._
