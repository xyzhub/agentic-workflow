---
status: draft
owner-agent: analyst
refresh-trigger: event (re-run the §1 baseline commands once each of the three changes lands; superseded when the mission's ledger closes)
---

# Graph-engineering P1 — measurement spec

> **PARTIALLY SUPERSEDED 2026-08-17.** §1's measured baseline stands. The
> acceptance-criteria and done-number sections describe scope that was dropped
> (frozen fixtures, paired metrics) or reverted (`depends-on:`); the real end
> state is 7 open / 6 fired / 13 rows, not 5 open / 11. This memo's own
> refresh-trigger names a mission ledger that was never authored, so it cannot
> fire — see `2026-08-17-graph-engineering-p1-council.md`, "Open for the owner".

_Answers "how is this mission's success measured", per the brief
(`docs/product/decisions/2026-08-16-graph-engineering-p1-brief.md`). This is a
developer-tooling mission — lint checks, a template row, a register grammar
extension. **No product analytics events exist or are proposed here.**
`docs/product/engineering/tracking-plan.md` does not exist in this repo (the
only file under `docs/product/engineering/` is `context-economy-metrics.md`)
and this mission adds zero product-instrumented surfaces, so there is nothing
to reconcile it against. The measurement surface is `tools/lint.mjs`,
`tools/hook-test.mjs`, and `.plans/OBLIGATIONS.md` — read-only queries only, no
code touched, no repo mutation left behind._

_Every number below is labelled **MEASURED** (a command I ran, cited verbatim),
**PROPOSED** (the architect's design, not yet a human-locked decision — see
the note below), or **UNMEASURED/UNDECIDED** (named as a gap, not guessed). §1
is the baseline; §2–§4 map to the task's four deliverables; §5 is the honesty
section — what this document does not know._

**A sibling artifact exists**: `docs/product/decisions/2026-08-16-graph-engineering-p1-architecture.md`
appeared in the working tree during this session (untracked — `git status`
shows `??`), written by a parallel architect-agent run against the same
brief. It answers all three "Open shape decisions" plus nominates the
held-out set. **It is a proposal, not a decision** — the brief's own "Locked
decisions" section is still the placeholder `_(populated at the single
approval gate — dated)_` as of this baseline. I independently re-ran its
load-bearing factual claims (see §1.5) rather than relaying them uncross-checked;
they all confirmed exactly. §2 below writes observables against that proposed
shape where it is concrete enough to name files and commands, and separately
states the design-agnostic predicate so the observable survives the human
amending any of the three decisions at the approval gate.

## Baseline provenance

All MEASURED figures: branch `feat/graph-engineering-p1`, HEAD `2ed8006` (the
brief commit), working tree clean before and after this pass, 2026-08-16. Node
`v24.12.0`. Every command was run from the repo root; every table cites the
exact command.

---

## 1. The baseline (measured now)

### 1.1 The two gates

| | command | exit | stdout headline | detail |
|---|---|---|---|---|
| Structural lint | `node tools/lint.mjs` | **0** | `lint: clean` | 17 check functions run (`checkManifests` … `checkObligationsRegister`, lint.mjs:668), 0 findings |
| Hook behavior | `node tools/hook-test.mjs` | **0** | `hook-test: clean` | **73 `ok`, 0 `FAIL`** (73 = exact count of `check(` call sites in the source, confirmed 1:1 against runtime output — no loop multiplies an assertion) |

`node tools/lint.mjs` internally spawns `node tools/hook-test.mjs`,
`tools/marker-test.mjs`, and `tools/context-attrib.mjs --selftest` as
subprocesses (`checkHookBehavior`/`checkMarkerMutation`/`checkContextAttrib`,
lint.mjs:318–377) — hook-test's cost is already **inside** lint's wall time,
not additive to it. CI (`.github/workflows/lint.yml`) runs exactly one step,
`node tools/lint.mjs`, on every push/PR; there is no separate CI step for
`hook-test.mjs` alone. AC6 names both commands explicitly, so both are
gated independently below, in addition to the nested relationship.

**Timing** (`/usr/bin/time -p`, n=5 each, real/user/sys in seconds — small-n,
stated as a range, not averaged into a false-precision point value):

| | real (min–median–max) | user | sys |
|---|---|---|---|
| `node tools/lint.mjs` | 2.55 – 2.77 – 2.86 | 0.93 – 0.99 – 1.00 | 1.39 – 1.53 – 1.56 |
| `node tools/hook-test.mjs` | 2.32 – 2.41 – 2.59 | 0.80 – 0.83 – 0.83 | 1.31 – 1.38 – 1.41 |

This is the pre-change number the paired-metric "gate slower" counter-metric
(§3) measures against. `sys` dominates `user` in both — consistent with
process-spawn overhead (`git ls-files`, the three nested `node`/`bash`
subprocess spawns), not computation.

### 1.2 The register (`.plans/OBLIGATIONS.md`)

Cross-validated two independent ways — static grep of the file, and the real
production `obligations-due.sh` hook run against actual repo state (both read
the same file but via different code paths):

```
$ grep -c '^- \[ \]' .plans/OBLIGATIONS.md   → 7
$ grep -c '^- \[x\]' .plans/OBLIGATIONS.md   → 4
$ grep -c '^- \[~\]' .plans/OBLIGATIONS.md   → 0
$ grep -c '^- \[' .plans/OBLIGATIONS.md      → 11
```

```
$ echo '{"source":"startup","session_id":"<test>"}' | bash hooks/lib/obligations-due.sh
"📌 Deferred obligations may be due — 7 register row(s) in .plans/OBLIGATIONS.md
 + 0 mission-ledger `## Closing` row(s) still unticked. …"
```

Both agree: **7 open, 4 fired, 0 deferred, 11 total rows.** All six mission
ledgers' `## Closing` blocks (`.plans/*.state.md`) were also swept directly —
only `deferred-obligations.state.md` carries any rows, and all three are
`[~]` already promoted (→ OB-4/5/6, all fired) — so 0 is the correct
Closing-block contribution, not an oversight.

| id | glyph | source | one-line `do:` |
|---|---|---|---|
| OB-1 | `[ ]` | compaction-continuity | re-measure the n=1 compaction bands |
| OB-2 | `[ ]` | compaction-continuity | run the D4b cross-mission token re-measurement |
| OB-3 | `[x]` | deferred-obligations | reap 3 concluded integration branches — fired 2026-08-11 |
| OB-4 | `[x]` | deferred-obligations Closing | delete 4 phase branches + integration — fired 2026-08-11 |
| OB-5 | `[x]` | deferred-obligations Closing | live-verify obligations-due hook — fired 2026-08-16 |
| OB-6 | `[x]` | deferred-obligations Closing | confirm 5 legacy trios pass lint on release — fired 2026-08-11 |
| **OB-7** | `[ ]` | ckpt-p4 finding 1 | 4 sub-items — **this mission's target** |
| OB-8 | `[ ]` | feat/impeccable-integration | live-verify impeccable peer-plugin integration |
| **OB-9** | `[ ]` | release/v1.43.0 | version-bump trigger on the Closing template — **this mission's target** |
| OB-10 | `[ ]` | graph-engineering assessment | trial a §10 memory accelerator |
| OB-11 | `[ ]` | staging-gap assessment | stand up a pre-release staging channel |

### 1.3 File-size baseline (paired-metric growth counter-metric, §3)

| file | lines | bytes |
|---|---|---|
| `tools/lint.mjs` | 677 | 36,958 |
| `tools/hook-test.mjs` | 970 | 61,654 |
| `plugins/agentic-workflow/commands/settle.md` | 151 | — |
| `plugins/agentic-workflow/templates/mission-state.md` | 93 | — |
| `plugins/agentic-workflow/templates/obligations.md` | 30 | — |
| `.plans/OBLIGATIONS.md` | 45 | — |

### 1.4 Pre-existing gaps this mission must close (grounds AC5 / OB-7)

Each reproduced live against the actual code, not inferred from prose:

| OB-7 sub-item | current state, measured |
|---|---|
| (a) `>140-char-row` harness case | `grep -n "140" tools/hook-test.mjs` → **0 hits**. The 140-codepoint cap exists in `hooks/lib/obligations-due.sh:116–122` (`jq -Rr '.[0:140]'`) but no assertion in `hook-test.mjs` pins the boundary. The longest existing fixture OB-row string is 158 chars (`CLOSING_ONE_DUE`'s `OB-a` row) — already over 140 — but the one test that reads it (`SessionStart(resume): no register, Closing 1-due`) only regex-matches the first ~13 chars, asserting nothing about truncation correctness. Ran the real hook against the real repo's OB-1 row (271 chars): `OLDEST_SHORT` is exactly **140 codepoints**, cut cleanly before completing "≈6.73" — confirms the cap works today, live, at the boundary, including multibyte safety; it is simply untested by the harness. |
| (b) carrying-commit command in settle.md recipe #2 | `grep -n "carrying\|ancestry\|rev-list\|git log" commands/settle.md` → 3 hits, all prose ("the carrying commit (the default-branch commit whose history first contains the tip)", `settle.md:58,60,62`). **0 runnable commands** compute that SHA — the recipe names the concept, not how to find it. |
| (c) digitless `→ OB-` promotion-ref leak | Reproduced: `checkClosing`'s check is `/→ OB-/.test(b.text)` (lint.mjs:637) — no digit required. `'… probe: manual → OB-'` (no number at all) currently satisfies it, same as `'… → OB-9'`. |
| (d) clock-leak extended to `after N <units>` | Reproduced against the live `BARE_TIME_WORDS`/regex logic (lint.mjs:536–590): `after 30 days` and `after 3 sprints` pass **uncaught** through all three existing detectors, while `every 10 minutes`, `in 3 days`, and `every day` are correctly caught today. |

### 1.5 What does not exist yet, and independent verification of the architect's proposal

Zero references anywhere in the repo to: `depends-on` (grammar), `frozen`-as-eval-manifest concept, `checkFrozenFixtures`, `counter-metric`/`paired metric` (outside the brief itself). `templates/*.md` frontmatter already uses the word `frozen` for an unrelated concept (`status: frozen` ⇒ "this template doesn't change," `checkTemplateFrontmatter`, lint.mjs:238) — a naming collision worth a one-time legibility check once the new concept lands (§3, change 1).

I independently re-ran the architect memo's load-bearing factual claims rather than citing them on trust:

| claim (architecture memo) | independent re-check | result |
|---|---|---|
| newest commit touching `evals/` is `43ece76` (2026-07-23) | `git log -1 --format='%h %ad %s' --date=short -- evals/` | confirmed exactly |
| `b62e369` (2026-07-07) rebalances `adopt-existing-project/rubric.md` weights, zero `fixture/` bytes touched | `git show --stat --format="" b62e369` | confirmed: touches only `evals/run.mjs`, `.../checks.mjs`, `.../rubric.md` — 0 files under any `fixture/` dir |
| `tools/hook-test.mjs` has no case covering the push-block guardrail | `grep -n "push\|guardrail" tools/hook-test.mjs` | confirmed: 0 hits (the one `push` match is `Array.push`, unrelated) |
| held-out four cost $15, all twelve cost $51 (`budget-usd` sum) | read each `scenario.md` frontmatter, summed | confirmed exactly: 3+5+3+4=15, sum of all twelve = 51 |
| the four recommended scenarios are commit-stable | `git log --oneline -- evals/scenarios/<name>` | confirmed: guardrail-push-block 1, routing-altitude 1, business-model 1, reviewer-checkpoint 3 commits |
| a `depends-on:` placed inside `when:` defeats the clock-leak check | reproduced live: `normalize('weekly — depends-on: OB-3')` → `"weekly — depends-on: ob-3"`, not in `BARE_TIME_WORDS` → **uncaught**, vs. `normalize('weekly')` → caught | confirmed exactly — direct evidence for why `depends-on:` must not be placeable inside `when:` |
| `obBullets` silently drops an unindented continuation line | read `obBullets` (lint.mjs:544–552): a line matching neither `/^- /` nor `/^\s+\S/` is dropped | confirmed — an unindented `depends-on:` line is invisible to every existing check |

All six checked exactly. I did not re-verify every claim in the memo (e.g. the
per-scenario "why it will not need repair" judgments are the architect's
inference, not re-litigated here) — only the ones load-bearing for the
observables in §2.

---

## 2. Per-acceptance-criterion observable

### AC1 — frozen manifest exists; lint fails on an unauthorized edit

> A held-out subset of `evals/scenarios/` is declared frozen in a manifest,
> and `node tools/lint.mjs` **fails** when a frozen fixture is edited without
> a manifest bump — proven by a deliberately-bad input in the test harness.

**Design-agnostic predicate** (holds regardless of which of the three manifest
options the human locks): there exists a byte in a tracked file under a
declared-frozen `evals/scenarios/<name>/` directory such that changing it,
alone, flips `node tools/lint.mjs` from exit 0 to exit 1, and the finding
names the scenario and the remedy.

**Against the architect's PROPOSED shape** (`evals/frozen.md`, sha256 digest
over sorted `path\0<per-file-sha256>` of every tracked file in the scenario
directory — the *whole* directory, not just `fixture/`, per F2's finding that
the demonstrated tuning surface in this repo is `rubric.md`, not fixture
bytes — verified by `tools/frozen.mjs --selftest`, delegated from
`checkFrozenFixtures()` exactly as `checkContextAttrib` delegates today):

1. **Self-contained proof (the harness home the brief asks for)**:
   `tools/frozen.mjs --selftest` builds a throwaway directory tree (mirroring
   `context-attrib.mjs --selftest`'s synthetic-fixture pattern — no real repo
   file is touched) and must assert **four** independent failure modes, not
   one:
   - tampered content (one byte changed, path set unchanged) → fail
   - a file deleted from the frozen directory → fail
   - **a file added** to the frozen directory (the path-set is inside the
     digest specifically to catch this — e.g. a `setup.sh` dropped in to
     mutate the fixture before a run) → fail
   - digest bumped with an empty or template-literal `reason:` → fail (this
     one straddles AC1/AC2 — see AC2)
   Command: `node tools/frozen.mjs --selftest` → exit 1 on any of the four
   NOT firing, exit 0 when all four correctly fire on the synthetic fixture.
2. **Live integration proof, one worked illustration** (using whichever
   scenario the human ultimately locks as frozen — illustrated here with
   `evals/scenarios/routing-altitude/checks.mjs`, the architect's smallest
   recommended candidate, purely because it minimizes blast radius for a
   demo edit, not a recommendation of my own):
   - Append a trailing space to one line of `checks.mjs`. Do **not** touch
     `evals/frozen.md`.
   - Run `node tools/lint.mjs`.
   - **Required**: exit 1. The finding must name (a) the scenario's relative
     path, (b) that its computed digest no longer matches the manifest's
     last recorded entry, (c) the manifest path to bump
     (`evals/frozen.md`), and (d) that the bump must carry a dated reason —
     mirroring `checkObfuscation`'s message shape (name the problem **and**
     the remedy in one string, so nobody has to read `lint.mjs` source to
     know what to do).
   - Restore: `git checkout -- evals/scenarios/routing-altitude/checks.mjs`;
     confirm `git diff --quiet` and `node tools/lint.mjs` returns to
     `lint: clean`.
3. **The sharpest single acceptance check for this design** (from F2): repeat
   step 2 editing a line of `rubric.md` instead of `checks.mjs` inside the
   same frozen scenario. This must **also** fail — a freeze that only
   protects `fixture/**` bytes would pass every test above while leaving the
   repo's one demonstrated tuning surface (`b62e369`) wide open. This is not
   optional; it is the check that determines whether the mechanism defends
   against the failure mode the brief cites, or a different one.
4. **Day-one correctness**: once the frozen set is declared (whatever it
   turns out to be) on an otherwise-untouched tree, `node tools/lint.mjs`
   must be `lint: clean` immediately — i.e. the manifest's initial digests
   must match reality at declaration time, or the mechanism false-positives
   before anyone has tampered with anything.

### AC2 — the escape hatch works and is legible

> Bumping the manifest with a dated reason makes lint pass again, and the
> reason is recorded in-repo.

**Design-agnostic predicate**: after AC1's failing edit, some in-repo,
reviewable diff exists such that (a) `node tools/lint.mjs` returns to exit 0,
and (b) `git diff`/`git log -p` on that diff shows a human-readable date and
a non-templated reason string, without requiring the reviewer to look
anywhere else.

**Against the architect's PROPOSED shape** (the manifest row's authoritative
digest is its *last dated entry*; no separate hash field to fall out of sync):

1. After AC1's corrupting edit, append one line to the frozen scenario's row
   in `evals/frozen.md`:
   `· rehashed 2026-08-2X (<source>) — sha256:<newly computed digest> — reason: <non-empty prose>`.
2. `node tools/lint.mjs` → exit 0, `lint: clean`.
3. **"recorded in-repo"**: `git diff -- evals/frozen.md` shows the appended
   line, containing a real `YYYY-MM-DD` and non-empty `reason:` text that is
   not the literal placeholder.
4. **Required negative sub-test** (the line between "escape hatch" and
   "loophole"): repeat step 1 with a correct new digest but an **empty**
   `reason:` (or the literal template placeholder text) — lint must **still
   fail**. A bump that changes the number without a legible reason is not the
   escape hatch the human asked for ("hard fail + logged escape hatch,"
   interview answer, brief line 70); it is the frozen check with a bypass
   switch.
5. Restore: revert both the corrupting edit and the manifest append; confirm
   `git diff --quiet` and `lint: clean`.

### AC3 — the paired-metric row is real, and its absence is caught

> `templates/mission-state.md` carries the paired-metric row, and a mission
> ledger authored from the template without a counter-metric is caught.

**No architecture memo addresses this decision** — Decisions 1–3 in the
sibling memo are scoped to the brief's three numbered "Open shape decisions"
(all about frozen-nodes/`depends-on:`); the paired-metric row's exact
location, grammar, and check name are **not proposed anywhere yet**. This is
a fourth open shape decision the brief's own list omitted; flagging it here
so it doesn't get built ad hoc without the same "which option, what
trade-off" treatment the other three got.

**Design-agnostic predicate**, following the closest existing precedent in
this file (`checkClosing`/`checkStandingSteers`: validate the template,
sweep `.plans/*.state.md` via `stateLedgers()`, exempt ledgers that lack the
section — the OQ4 legacy-tolerance rule, lint.mjs:601–602):

1. Template check: the row/section is present in
   `plugins/agentic-workflow/templates/mission-state.md`.
2. Negative proof: create a throwaway, **never-committed** ledger file
   `.plans/__zz-paired-metric-negative.state.md`, copied from the template
   with the counter-metric field deliberately deleted.
3. `node tools/lint.mjs` → exit 1, finding naming that file and the missing
   counter-metric.
4. Delete the throwaway file. `node tools/lint.mjs` → back to `lint: clean`
   (0 residual findings) — proving no residue.
5. **Load-bearing counter-check, not optional**: with the throwaway file
   absent, lint must **also** stay `lint: clean` against the **six existing,
   real** ledgers (`compaction-continuity`, `context-economy`,
   `deferred-obligations`, `orchestrator-governance`, `portfolio-commons`,
   `sales-doc-architecture` — measured count, §1.3/§3), none of which will
   carry the new field. The brief is explicit that retrofitting them is out
   of scope (brief's "NOT in v1" table) — if the new check is not
   legacy-tolerant, it self-inflicts 6 false positives on the day it ships,
   which is the exact "measurement decay" failure class this mission exists
   to prevent, aimed at itself.

### AC4 — `depends-on: OB-<n>` grammar; lint fails on a dangling reference

> `.plans/OBLIGATIONS.md` grammar documents `depends-on: OB-<n>`, and lint
> **fails** on a `depends-on:` that references a non-existent row.

**Against the architect's PROPOSED shape** (Decision 3, Option A: an
**indented continuation line**, `  · depends-on: OB-<n>`, the same grammar
`· fired …` already uses — chosen specifically because every other placement
the architect tested either hard-fails today's parser, or (worse) silently
parses and defeats an existing check; see §1.5's clock-leak-bypass
verification):

1. Append a throwaway row to `.plans/OBLIGATIONS.md` using the next unused
   id (`OB-12`, since OB-1…11 exist today) with a continuation line
   `  · depends-on: OB-999` (999 chosen so it can never collide with a real
   future id). Never commit it.
2. `node tools/lint.mjs` → exit 1, finding naming the row and `OB-999` as
   unresolved.
3. **Required negative sub-cases** (each independently, each restored before
   the next):
   - **digitless**: `  · depends-on: OB-` (no number) → must fail, not
     silently pass — the exact OB-7(c) lesson applied on the way in.
   - **unindented** (column 0): `· depends-on: OB-4` with no leading
     whitespace → must **also** fail with a message distinct from "unresolved
     reference" (something like "an edge lint cannot see is an undeclared
     edge"). I confirmed `obBullets` drops such a line silently today — a
     check that only validates *folded* rows would let this through
     undetected, which is structurally the same failure OB-9 documents (an
     edge that looks declared to a human, invisible to the prosecutor).
   - **self-reference**: `OB-12 … depends-on: OB-12` → must fail.
4. Positive case: point the same throwaway row at a real id,
   `  · depends-on: OB-1` → `node tools/lint.mjs` → exit 0, `lint: clean`.
5. Remove the throwaway row entirely; confirm `git diff --quiet -- .plans/OBLIGATIONS.md`.

**Design-agnostic backstop, regardless of placement**: whatever placement is
chosen, a `depends-on:`-equivalent string embedded inside the `when:` segment
must **not** be treated as satisfying the field — §1.5 reproduces exactly why
(`weekly — depends-on: OB-3` evades the bare-time-word clock check that
`weekly` alone triggers). This is the one placement-independent requirement:
if the human locks a different option at the approval gate, re-run this
specific negative case against whatever `when:`-adjacent placement results.

### AC5 — OB-7's four sub-items land; OB-7 and OB-9 fire; register 7→5

> OB-7's four sub-items are implemented; OB-7 and OB-9 are ticked `[x]` with
> evidence lines. Register: 7 open → 5.

Four independent proofs (baselines from §1.4), plus the register delta
(full detail in §4):

| sub-item | proof command | required delta from baseline |
|---|---|---|
| (a) 140-char row case | `node tools/hook-test.mjs` | total `ok` count rises from **73** (measured) to **≥74**; the new case constructs a register/Closing row >140 chars and asserts the advisory's `Oldest:` line is ≤140 chars **and** a clean prefix of the source (no mid-multibyte-character corruption) |
| (b) carrying-commit command | `grep -n "carrying" plugins/agentic-workflow/commands/settle.md` | the term is now adjacent to a backticked, runnable command containing `git` (shape not prescribed here — implementer's call), not prose alone (baseline: 0 such commands) |
| (c) digitless `→ OB-` leak closed | reproduce §1.4(c)'s exact snippet against the landed code | `'… manual → OB-'` (no digit) now **fails** `checkClosing` where it passed at baseline |
| (d) `after N <units>` clock leak closed | reproduce §1.4(d)'s exact snippet against the landed code | `after 30 days` / `after 3 sprints` now **fail** the `when:`-clock check where they passed uncaught at baseline |

### AC6 — both gates clean, layers 1–2 only

> Gates: `node tools/lint.mjs` clean and `node tools/hook-test.mjs` clean.
> Testing is layers 1–2 only — no live install, no staging channel.

- `node tools/lint.mjs` → exit 0, stdout **exactly** `lint: clean` (0 findings
  across all check functions, including whichever new ones this mission
  adds).
- `node tools/hook-test.mjs` → exit 0, stdout ending `hook-test: clean`, 0
  `FAIL` lines, `ok` count **≥74** (see AC5a).
- **Explicit non-requirement**: `node evals/run.mjs` (tier 2 — costs real
  tokens, $1–5/scenario, $51 for all twelve or $15 for the architect's
  proposed held-out four, per §1.5) is **not** part of this gate and must not
  block the merge — consistent with the brief's "no live install, no staging
  channel" line and OB-11 (recorded separately). I did not run it during this
  baseline pass, by design (read-only, cost-avoiding, matches the Analyst's
  no-production-mutation boundary).

---

## 3. Paired-metric specification

_This mission's own deliverable #2 is a counter-metric row — so this document
practices it. No number below is a prediction; each "how observed" is a
re-runnable measurement against the §1 baseline, to be executed **after** each
change lands, not before._

| # | change | optimization target | counter-metric it could degrade | how it is observed |
|---|---|---|---|---|
| 1 | **Frozen nodes** (`checkFrozenFixtures`/`tools/frozen.mjs`) | Measurement integrity of the held-out set: 0 undetected edits to a frozen scenario's content **or path-set**, ever, without a reviewable dated reason | **(a) Gate latency.** **(b) False positives on the untouched tree.** **(c) Scope illusion** — a freeze that only covers `fixture/**` would be Goodhart-proof against the wrong surface, since F2 shows the repo's one demonstrated tuning incident (`b62e369`) touched `rubric.md`, not fixture bytes. **(d) Naming collision** with the pre-existing, unrelated `status: frozen` template-frontmatter concept (lint.mjs:238) | (a) re-run §1.1's exact `/usr/bin/time -p`, n≥5, on `node tools/lint.mjs` and `node tools/hook-test.mjs`; report the new min–median–max against 2.55–2.77–2.86s / 2.32–2.41–2.59s. (b) `node tools/lint.mjs` on the untouched tree once the set is declared must stay `lint: clean` — 0 new findings against the other 8 (or whichever count) tunable scenarios and every other tracked file. (c) AC1 step 3 (a `rubric.md`-only edit inside a frozen scenario must also fail) — binary, not a rate. (d) one-time read of the two check functions' names/messages, confirming a reader can tell "frozen template" from "frozen eval scenario" apart without reading source |
| 2 | **Paired metrics row** (`templates/mission-state.md`) | Every mission ledger from #7 onward names, in prose, what its optimization target could degrade — Goodhart resistance by convention | **(a) False positives on the 6 existing ledgers**, which the brief explicitly exempts from retrofitting. **(b) Vacuous-but-present prose** — the brief states "no tooling computes the numbers in v1," so the new check can only prove the field exists, never that it says anything real (a ledger could write "N/A" and pass). **(c) Template/ledger growth** | (a) `node tools/lint.mjs` immediately post-change, with `compaction-continuity`, `context-economy`, `deferred-obligations`, `orchestrator-governance`, `portfolio-commons`, `sales-doc-architecture` (measured: 6 ledgers, 0 with the field today) unmodified — must stay `lint: clean`. (b) **not automatable in v1 by the brief's own design** — named here as an accepted, uncovered gap, not claimed as solved; the only available mitigation is human review at checkpoints, same limit `checkStandingSteers` already accepts for verbatim-quote truthfulness. (c) line-count delta on `templates/mission-state.md` against the measured baseline of **93 lines**; per-ledger growth has no baseline yet (0 ledgers have used the field) — first real data point is the next mission ledger authored after this one ships |
| 3 | **Declared edges** (`depends-on: OB-<n>`) | Cross-loop dependencies (the OB-9 class) become declared and lint-checked — every `depends-on:` resolves, 0 unresolved references reach `main` | **(a) False positives on the current register.** **(b) The silent-drop trap** — an unindented continuation line is invisible to `obBullets` today, so an author who forgets to indent gets no error and a `false sense of declared`, exactly OB-9's failure shape reproduced one level down. **(c) Composition with OB-7(a)**'s 140-char cap | (a) baseline measured: **11 rows, 0 `depends-on:` fields today** — `node tools/lint.mjs` immediately after the grammar lands, with all 11 rows unmodified, must stay `lint: clean`. (b) AC4's unindented negative case is **mandatory**, not optional, precisely because its absence reproduces OB-9 rather than fixing its class. (c) re-run AC5(a)'s 140-char harness case against a row that also carries a `depends-on:` continuation line, confirming the "Oldest:" truncation still bounds only the primary row (continuation lines are separate source lines, not part of the folded advisory string) |

---

## 4. The number that says done

Per the human's chosen definition (brief, interview table): **"Mechanism +
both obligations fired — register goes 7 open → 5."**

| | now (MEASURED, §1.2) | done |
|---|---|---|
| open `[ ]` | **7** | **5** |
| fired `[x]` | **4** | **6** |
| deferred `[~]` | 0 | 0 (unchanged) |
| total rows | 11 | **11 (unchanged — rows are never deleted)** |

Verification commands, to be re-run at close:

```bash
grep -c '^- \[ \]' .plans/OBLIGATIONS.md   # must read 5
grep -c '^- \[x\]' .plans/OBLIGATIONS.md   # must read 6
grep -c '^- \['    .plans/OBLIGATIONS.md   # must read 11 (unchanged)
grep -E '^- \[x\] OB-(7|9) .* · fired [0-9]{4}-[0-9]{2}-[0-9]{2} \(.+\)' .plans/OBLIGATIONS.md
                                            # must return exactly 2 lines — OB-7 and OB-9,
                                            # each with a REAL date, not the YYYY-MM-DD
                                            # placeholder, and each with non-empty evidence
```

**The register delta is necessary but not sufficient by itself** — the brief's
definition is "mechanism **+** both obligations fired," and `checkObRow`
already enforces, in code, that a tick without evidence is a claim, not a fire
(lint.mjs:570–571: *"fired (`[x]`) obligation row must append `· fired
YYYY-MM-DD (<evidence>)` — a tick without evidence is a claim, not a fire"*).
So "done" requires, in this order:

1. All six ACs in §2 independently pass (the mechanism).
2. OB-7's four sub-items are each independently evidenced (AC5's table) — not
   merely asserted in the register row's own prose.
3. Only then do the `[x]` + `· fired 2026-MM-DD (<evidence>)` suffixes on
   OB-7 and OB-9 get written, and the four grep commands above return the
   numbers in the "done" column.

A register that shows 5/6/11 without 1–2 having actually happened is exactly
the "measurement decay" failure mode this mission exists to prevent, turned
on itself — which is why this document specifies proof-then-tick, not
tick-then-proof.

---

## 5. What this document does not know

Stated plainly, per the honesty rule, rather than guessed:

- **Which manifest shape, escape-hatch grammar, and `depends-on:` placement
  actually ship** is **UNDECIDED**. The architecture memo (§1.5) proposes
  Option A for all three; none is yet a dated "Locked decision" in the brief.
  §2's observables are written against that proposal with the design-agnostic
  predicate stated alongside each — if the human amends a decision at the
  approval gate, re-check the corresponding predicate, not just the worked
  illustration.
- **Which scenarios are the held-out four** is **UNDECIDED**. The memo
  nominates `guardrail-push-block`, `reviewer-checkpoint`, `routing-altitude`,
  `business-model` ($15 of $51 total eval budget, all independently
  re-verified in §1.5) — not locked. AC1's worked illustration uses
  `routing-altitude` only because it is the smallest, for demo purposes; it
  is not a recommendation from this document.
- **Where the paired-metric row lives in `templates/mission-state.md`, and
  what checks it** is **UNDECIDED and unaddressed by any proposal seen so
  far** — a fourth open shape decision the brief's own list omitted (§2, AC3).
- **Post-implementation gate-timing deltas** are **UNMEASURED** — the
  mechanism does not exist yet. Re-run §1.1's exact protocol (n≥5,
  `/usr/bin/time -p`, both commands) once, ideally **per change** rather than
  only at the end, so a slow addition is attributable to the change that
  caused it.
- **Counter-metric semantic quality** for change 2 (§3) is explicitly
  uncomputed by any tool in v1, per the brief itself — not a gap this
  document can close, only name.
- **This document is not a live-install verification.** Per AC6 and the
  brief, no `evals/run.mjs` run, no staging channel, no production mutation
  occurred while producing it (OB-11 already records the staging-channel gap
  separately).
