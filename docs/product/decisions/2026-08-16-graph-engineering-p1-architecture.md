---
status: frozen
owner-agent: architect
refresh-trigger: never
---

# agentic-workflow — Decision memo: graph-engineering P1 shape

_Answers the three "Open shape decisions" in
`docs/product/decisions/2026-08-16-graph-engineering-p1-brief.md`, plus the
held-out-set nomination the brief left to the architect. Every claim is labelled
**fact** (cited to a file/commit I read), **inference** (reasoning over facts),
or **assumption** (unverified). The architect consults; the **human decides** at
the single approval gate._

---

## Ground truth I had to correct before designing

Three findings changed the shape of all three answers. They belong at the top
because the brief's framing is slightly off and the design follows the framing.

**F1 — the eval set is not contaminated; it is clean, and about to stop being.**
**fact**: `git log -- evals/` shows the newest commit touching anything under
`evals/` is `43ece76` (2026-07-23, v1.39.0). The context-economy mission ran
2026-08-01 → 2026-08-03, compaction-continuity 2026-08-03 → 08-11,
deferred-obligations 2026-08-11 — **fact**: none of them touched `evals/`. What
context-economy calibrated was `tools/context-attrib.mjs`'s chars/token ratio
against its own synthetic selftest fixture (`.plans/context-economy.md:60,76`),
not the scenario set. **inference**: the brief's "the eval fixtures are the
surface that was actually calibrated" (line 101) is inaccurate. The good news is
better than the premise: freezing today pins an **uncontaminated** baseline
rather than quarantining a spoiled one. The mission's value is prospective —
it stops the *next* mission from tuning the set — which is exactly when the
guard is cheapest to install.

**F2 — the demonstrated tuning surface in this repo is the RUBRIC, not the
fixture.** **fact**: `b62e369` (2026-07-07, v1.28.2) is titled "fix: adopt eval
calibration"; its diff rebalances `adopt-existing-project/rubric.md` weights
(3/3/2/1 → 3/3/2), moves a criterion out of the rubric into `checks.mjs`,
rewords the gap-report criterion, and the commit message states *"Recalibrated
scenario re-judged on the kept transcript: 75% ≥ pass bar."* Zero fixture bytes
changed. **inference**: a freeze scoped to `fixture/` would freeze the one part
of a scenario nobody has ever tuned, and leave the rubric, the weights, and
`pass-bar` — the actual Goodhart surface — wide open. **Every option below
freezes the whole scenario directory** (`scenario.md` + `rubric.md` +
`checks.mjs` + `fixture/**` + `setup.sh`), and the brief's wording "frozen
fixture" should be read as "frozen scenario" throughout.

**F3 — there is a shared instrument outside every scenario directory.**
**fact**: `evals/judge.md` (23 lines, the judge system prompt) and
`evals/run.mjs` (`JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL || 'sonnet'`, line
25; `--model process.env.EVAL_MODEL || 'sonnet'`, line 122; the weighted-mean
scorer, lines 75–76 and 158) apply to **all twelve** scenarios including any
frozen ones. **inference**: a held-out set whose judge prompt and judge model
stay tunable is not held out — the cheapest way to move a frozen scenario's
score is to soften `judge.md` or change `EVAL_JUDGE_MODEL`, neither of which
touches a scenario directory. This is a gap in the brief's scope; see the
addendum after Decision 3.

---

## Decision 1 — how the frozen set is recorded

### The question

Where does the repo record *which* scenarios are held out and *what state they
are held at*, such that an unauthorized edit is **detectable by
`node tools/lint.mjs` alone**? This constrains: whether the check can be proven
with a deliberately-bad input (AC 1), whether it works on a shallow CI clone,
how noisy an authorized change looks in review, and whether the escape hatch of
Decision 2 has anywhere to live.

The load-bearing sub-question the brief flags: **a marker inside the guarded
file can be deleted by the same edit that changes it.** The general property is
that a guard must not be co-located with, or derivable from, the thing it
guards. There is a second, less obvious version of the same failure: a
declaration of *membership* (a marker, a glob) with no record of *content* can
detect nothing at all on its own — it needs an external reference state, and the
only two candidates are recorded content or git history.

### Option A — content digests in an append-only manifest (`evals/frozen.md`)

- **How it works here.** One markdown file next to `evals/README.md`, with a
  grammar preamble and one row per frozen scenario, in exactly the shape
  `.plans/OBLIGATIONS.md` already uses (**fact**: that file is a markdown
  register with a prose grammar preamble at lines 18–26 and a lint-enforced row
  grammar, `checkObligationsRegister`, lint.mjs:649). Each row carries a
  `sha256:` digest computed over the scenario directory's tracked files —
  digested as sorted `path\0<per-file-sha256>` pairs, so the digest covers the
  **path set** as well as the contents. `checkFrozenFixtures()` enumerates via
  `git ls-files -z` (**fact**: the exact precedent `checkObfuscation` uses,
  lint.mjs:299) and hashes working-tree bytes with `node:crypto` (stdlib —
  honours the "zero dependencies" contract in the lint.mjs header). Mismatch →
  `fail()`. Manifest missing while `evals/scenarios/` exists → `fail()`,
  fail-closed, in the exact register of `checkMarkerMutation`'s "do not silently
  drop the check" (lint.mjs:343).
- **Tradeoffs.** Detects every class of edit without git history: content change,
  file deletion, and — because the path set is inside the digest — the
  **add-a-file** attack (dropping a `setup.sh` that mutates a frozen fixture
  before the run, which a per-file hash list would miss entirely). One digest per
  scenario means 4 manifest lines, not ~28, so an authorized change is a
  one-line diff. The cost: the digest says *that* the scenario moved, not *which
  file* — the lint message must point at `git diff -- evals/scenarios/<name>`.
  Deleting a whole row still removes the guard, but that is a `-` line in a file
  whose only purpose is the freeze — the maximally legible place for it to show
  up.
- **Operational cost.** ~30 small file reads plus a sha256 each: microseconds
  next to the three `spawnSync` delegations lint already performs
  (`hook-test`, `marker-test`, `context-attrib` — lint.mjs:318–377). One
  manifest line to bump per authorized change. **assumption**: byte-identical
  content on macOS and ubuntu CI — **fact**: there is no `.gitattributes` in the
  repo and both platforms default to LF, so this holds today; a one-line
  `.gitattributes` (`* text=auto eol=lf`) pins it permanently if it ever bites.
- **Cost of reversal.** Lowest of the three. Unfreeze one scenario = one line.
  Abandon the mechanism = delete `evals/frozen.md`, one function, one entry in
  the check array at lint.mjs:668. No CI change, no change to any scenario file,
  no change to `run.mjs`. Nothing else in the repo takes a dependency on it.

### Option B — `frozen: true` in each scenario's own frontmatter

- **How it works here.** `scenario.md` already carries flat `key: value`
  frontmatter parsed by `parseScenario` (**fact**: run.mjs:37–46; unknown keys
  are ignored, so a `frozen:` key is runtime-inert). Lint collects the marked
  set, then must compare each marked scenario against a previous state — which
  it does not have — so this option only becomes a *check* when paired with git
  history: `git diff <merge-base>..HEAD -- evals/scenarios/<name>` must be empty.
- **Tradeoffs.** The fatal one is the brief's own observation, and it is worse
  than it first looks: the marker is not merely deletable, it is deletable **by
  the same commit that makes the edit**, and after that commit there is no
  artifact anywhere in the tree that says the scenario was ever frozen. Lint's
  view of a tampered repo is indistinguishable from its view of a repo where the
  scenario was never held out. Every other option fails *loudly* under tampering;
  this one fails *silently*, which is the one property a measurement guard cannot
  have. Secondly, history-diffing makes lint stateful across commits for the
  first time (**fact**: all seventeen current checks read only the working tree).
  Thirdly, **fact**: `.github/workflows/lint.yml` pins
  `actions/checkout@fbc6f39 # v5.1.0` with no `fetch-depth`, and actions/checkout
  documents *"Number of commits to fetch. 0 indicates all history for all
  branches and tags. Default: 1"* — so CI has a single commit and no merge-base;
  this option requires editing the workflow to `fetch-depth: 0`.
- **Operational cost.** Zero churn on the happy path (no hash to bump) — its one
  genuine advantage. Against that: a CI config change, a slower checkout on every
  push, and a check that behaves differently in a shallow local clone than in CI.
- **Cost of reversal.** Moderate. Removing the markers means editing every frozen
  `scenario.md` (touching the very files the mechanism claimed were immutable —
  an unpleasant final act). The CI `fetch-depth` change is a shared-surface
  revert that outlives the feature if forgotten.

### Option C — path globs in a config, enforced by review (CODEOWNERS) or history

- **How it works here.** A small config (`evals/frozen.globs`, or a constant in
  lint.mjs) lists `evals/scenarios/guardrail-push-block/**` etc. Membership is
  declared outside the guarded files — which fixes B's fatal flaw — but content
  is still unrecorded, so enforcement must come from somewhere else: either the
  same git-history diff as B (inheriting B's shallow-clone problem verbatim), or
  GitHub CODEOWNERS + "require review from Code Owners" on those paths.
- **Tradeoffs.** The CODEOWNERS variant is the only option here that needs no
  lint change at all, and it is the one that fails hardest against team reality:
  **fact**, from the repo's own history, this is a single-owner project (every
  commit is authored by Baker; `.plans/*.state.md` repeatedly records "the human"
  as the sole merger, e.g. `commands/settle.md`'s HITL merge block). A code owner
  cannot approve their own pull request, so the rule either blocks every change
  permanently or is bypassed by admin override on every change — theatre in both
  directions. The history variant is strictly Option B minus the self-deleting
  marker: better than B, worse than A, and it still cannot answer "what state was
  this held at?" for a reader of the repo at a single commit.
- **Operational cost.** Globs are the cheapest thing to author and the most
  tempting thing to widen ("just exclude that one file"), and a widened glob is
  a silent loss of coverage with no digest to contradict it.
- **Cost of reversal.** Config deletion is trivial; the CI `fetch-depth` change
  or the branch-protection rule is the sticky residue, same as B.

### Recommendation — **Option A**

Four reasons, in order of weight:

1. **It is the only option where the guard is independent of both the guarded
   files and the git history.** A tampering commit must produce a visible,
   semantically loud diff in a file whose entire content is "these are the
   things we promised not to tune" — versus B, where tampering leaves no trace,
   and C-history, where tampering leaves a trace only if the reviewer thinks to
   look at a range diff.
2. **It is the only option that can be proven with a deliberately-bad input
   cheaply**, which AC 1 requires. A digest verifier is a pure function of a
   directory tree, so a selftest builds a throwaway tree and asserts four
   failures: tampered content, deleted file, added file, and digest bumped
   without a dated reason. **inference**: B and C-history would need the harness
   to fabricate a synthetic *git history* (achievable — `evals/run.mjs:115` does
   `git init -q -b main` in a tmpdir — but a materially heavier harness for a
   weaker check).
3. **It gives Decision 2 somewhere to live.** The dated reason and the digest
   belong on the same row; B and C have no row.
4. **Reversal is a single file plus a single function.**

**Implementation consequence** (not a decision, but it follows): the verifier
should be `tools/frozen.mjs` with a `--selftest` flag, and `checkFrozenFixtures()`
should delegate to it via `spawnSync`, fail-closed if the runner is missing —
a 1:1 copy of `checkContextAttrib` (lint.mjs:363–377). **fact**: lint.mjs has no
exports and executes its checks at module top-level (lines 668–670), so a
separate harness cannot import a check out of it; a standalone runner is the
shape the repo already uses three times.

**The strongest case against Option A.** It is the only option with recurring
maintenance: every legitimate change to a frozen scenario costs a digest
recomputation, and a digest a human cannot compute in their head is a small,
permanent tax on honesty — the failure mode is not tampering but a tired session
that regenerates the digest mechanically without writing a real reason. **The
mitigation is Decision 2's binding of hash to reason, and it is the reason
Decision 2 must not be treated as cosmetic.** A second fair objection: at
n=1 developer, none of this is defending against an adversary — it is defending
against *the same person six weeks later under deadline*, which is a real threat
model but a weaker one than the security-incident precedent
(`checkObfuscation`) that the brief cites as the shape to follow.

### What would change the answer

- **A second maintainer with merge rights appears** → CODEOWNERS stops being
  theatre and Option C becomes a genuine second layer *on top of* A (not
  instead of it).
- **The manifest is observed being rewritten in place** (a `-` line in the
  append-only region) more than once → harden A with hash-chaining: each entry
  names the digest it replaces, so an in-place rewrite breaks chain continuity
  and lint catches it without needing history. Cheap; deliberately not in v1.
- **Frozen scenarios grow past ~10, or the digest churns more than ~4×/quarter**
  → per-scenario digests get noisy and the answer moves toward per-file hashes
  with a path-set digest alongside (more lines, sharper diffs).
- **A `.gitattributes` or a Windows contributor appears** → pin `eol=lf` before
  the first cross-platform CI run, or switch to digesting `git ls-files -s`
  object ids (git's own normalized blob hashes) and accept that unstaged local
  edits then read as clean.

---

## Decision 2 — how the escape hatch captures its dated reason

### The question

The human chose "hard fail + logged escape hatch": a frozen entry may change via
a manifest bump carrying a dated reason. Where does that reason live so it is
**visible in the diff of the change itself** rather than in a place a reviewer
must go looking for — and, harder, so that **bumping the digest without writing
a reason is not expressible**?

House precedent, **fact**: this repo already has exactly one grammar for
"append-only dated annotation on a row you may never delete" —
`.plans/OBLIGATIONS.md:18–26`: *"Rows are **never deleted**: a fired row keeps
its line and appends `· fired YYYY-MM-DD (<evidence>)`"*, with OB-3 carrying
three such continuation lines (`· condition MET …`, `· fired …`,
`· clause amended …`). The `## Standing steers` block uses the sibling
convention (`- YYYY-MM-DD (ckpt <id>) — "<exact words>"`, retire by
strikethrough, never delete). Whatever is chosen here should be that grammar,
not a new one.

### Option A — the digest *is* the newest dated entry (one artifact, bound)

- **How it works here.** The manifest row has **no standalone hash field**. The
  authoritative digest is the one carried by the row's **last dated entry**:

  ```
  - evals/scenarios/guardrail-push-block — held-out
    · frozen 2026-08-16 (graph-engineering P1) — sha256:4f1c9a02b7de — reason: pins the push-block invariant; no other tier tests it
    · rehashed 2026-09-02 (security purge) — sha256:9b0e77aa31c4 — reason: truncated an injected payload line in fixture/README.md; no rubric, weight, or pass-bar change
  ```

  `checkFrozenFixtures()` recomputes the directory digest and compares it to the
  **last** `sha256:` in the folded row. To change what the frozen state is, you
  must add a line that carries both the new digest **and** a dated reason —
  there is no other place to put a digest.
- **Tradeoffs.** Misuse is unrepresentable rather than discipline-guarded: a
  silent bump is not a policy violation, it is a **syntax error** the check
  rejects. The reason and the hash land in one diff hunk in one file, so a
  reviewer sees "what moved" and "why" without leaving the hunk. Cost: rows grow
  by one line per authorized change, and after several years a heavily-repaired
  scenario's row is a paragraph. **inference**: acceptable — OB-3 is already four
  lines and reads fine; and a long row is itself the honest signal that a
  scenario is being repaired too often to still count as held out.
- **Operational cost.** One line per change, hand-written, plus a digest the
  tool prints on failure (the lint message should print the computed digest so
  the author can paste it — otherwise the tax of Decision 1 becomes a
  `sha256sum` incantation nobody remembers).
- **Cost of reversal.** Identical to Decision 1's — the entries live in the file
  that would be deleted anyway.
- **Honest limit** (state it in the memo, not in a footnote): lint reads one
  commit, so it **cannot** detect an in-place rewrite of the last entry. A
  determined author can edit the date, digest, and reason of the newest line and
  lint will pass. **fact**: this is the same limit the OB register already
  accepts — nothing in `checkObRow` (lint.mjs:560–591) detects a deleted or
  rewritten row either; "never deleted" is enforced by diff review, not by code.
  The defence is that an authorized change is **pure `+` lines** in an
  append-only file, so any `-` line in that file is an unambiguous review flag.

### Option B — reason in the commit message / PR body

- **How it works here.** A `Frozen-set-change: <scenario> — <reason>` trailer,
  by convention. **fact**: the repo's PreToolUse guardrail already nudges commit
  format (`hooks/hooks.json`, the `git commit` case echoes "Commit format:
  type(scope): description").
- **Tradeoffs.** Nothing can enforce it: lint does not read commit messages, and
  the guardrail hook only *echoes* a reminder. Worse, **fact**: this repo merges
  via PRs whose per-commit messages are not guaranteed to survive (a squash merge
  keeps one message), so the reason's durability depends on the merge button
  pressed months later. And a reader of the repo at a given commit cannot see
  why a frozen scenario is at its current state without running `git log`, which
  is precisely the "buried" outcome the question rules out.
- **Cost of reversal.** Zero — but so is its value.

### Option C — a separate append-only change log (`evals/frozen-changes.md`)

- **How it works here.** The manifest holds digests only; a sibling log holds
  `YYYY-MM-DD — <scenario> — <reason>` lines. Lint can require that a log entry
  exists naming each frozen scenario, but **cannot bind** a log entry to a
  specific digest transition without a shared key — and once you add that key
  (the digest), you have re-invented Option A across two files.
- **Tradeoffs.** Keeps the manifest small and scannable, which is a real virtue
  if the frozen set ever grows to dozens. Against it: every authorized change is
  a two-file diff, review must correlate them by eye, and the failure mode of
  "bumped the digest, forgot the log entry" is back to being a discipline
  problem lint can only partially see. It also creates a second artifact whose
  own append-only-ness nothing enforces.
- **Cost of reversal.** Two files to delete instead of one. Marginal.

### Recommendation — **Option A**, with Option C's split deferred until the
### manifest is genuinely large

Rationale: Option A is the only one where the *thing being enforced* (a change
was reasoned about) and the *thing being checked* (the digest) are the same
token. That converts a rule into a shape, which is the standard this repo
already applies to `[x]` + `· fired …` travelling together (**fact**:
lint.mjs:570–573 fails a tick without evidence *and* evidence without a tick —
the exact same binding, in the exact same file, for the exact same reason).

Two grammar rules to lock at the gate, both of which follow from the OB
precedent and both of which are cheap for lint:

1. **Entry verbs are closed-set**: `frozen` (first entry), `rehashed`
   (authorized content change), `unfrozen` (leaves the held-out set — carries a
   reference to the dated locked decision that authorized it, and after which
   the row stays but stops being digest-checked). Rows are **never deleted**,
   exactly as OB rows are not.
2. **`reason:` must be non-empty and must not be the literal template text.**
   A reason field a lint can only check for emptiness will eventually contain
   `reason: updated`. **inference**: the cheapest real deterrent is that the
   author must also name *what class* of change it was — a change touching
   `rubric.md`, `scenario.md`'s `pass-bar`, or a `[w=N]` weight is a
   **measurement** change and should be spelled as such; a change touching only
   `fixture/**` is a **repair**. That distinction is what a future reader of
   OB-1/OB-2/OB-10 actually needs, and it is one word.

**The strongest case against.** A dated reason on a row is still just prose that
a lint can only shape-check, and shape-checked prose degrades — this repo has
already watched that happen (**fact**: `checkStandingSteers`, lint.mjs:411, exists
because a *grammar* for verbatim quotes was not enough on its own and needed
checkpoint-attribution enforcement bolted on). If the frozen set is repaired
more than a couple of times a year, the reasons will thin out into
`reason: fixture fix` and the escape hatch will have become a speed bump. The
counter-defence is not more lint; it is Decision 1's held-out selection — pick
scenarios that *should not need repair*, so the hatch is rarely opened. That is
why the held-out nomination below weights "unlikely to need legitimate repair"
as heavily as "at risk of being tuned to".

### What would change the answer

- **The hatch opens more than ~3×/year** → the frozen set is wrong (re-pick), or
  the reason field needs a structured `class:` enum rather than prose.
- **The manifest passes ~20 rows** → split to Option C, keyed by digest, and
  accept the two-file diff.
- **An in-place rewrite is observed** → adopt hash-chaining (see Decision 1's
  triggers); it closes this hole locally, without git history.
- **A release ever needs to reproduce a historical measurement** → the digests
  in the row's history become the reproduction key, and the format should gain
  a `run:` pointer to the results directory the digest was measured with.

---

## Decision 3 — where `depends-on: OB-<n>` sits in the row grammar

### The question

Extend the register grammar with an optional edge declaration (generalizing
OB-9's *"OB-5/6/8's install conditions silently depended on it"*) without
false-positive on any existing check — and settle whether the edge is an inline
field on the single-line row or a continuation line.

I probed the existing regexes directly rather than reasoning about them. All
results below are **fact** (executed against the live patterns copied from
`tools/lint.mjs:531–535, 544–552, 560–591`).

### What the existing grammar actually does with each placement

| Placement | Result |
|---|---|
| Before `— do:` (`(source) — depends-on: OB-3 — do: …`) | **Hard lint failure** — `OB_ROW` requires `\) — do: ` immediately; every such row fails check 14 |
| Inside the id (`OB-12 depends-on: OB-3 · added …`) | **Hard lint failure** — `strictLabel` (`/^OB-\d+$/`, lint.mjs:567) rejects the id |
| Inside `do:` | Parses; `do:` capture absorbs it. No check reads `do:` today, so no finding — but the action text stops being atomic |
| **Inside `when:`** | Parses — **and silently defeats the clock-leak check.** Verified: `when: weekly — probe: manual` → `when` normalizes to `"weekly"` → caught. `when: weekly — depends-on: OB-3 — probe: manual` → normalizes to `"weekly — depends-on: ob-3"` → **not caught**. The check is whole-string membership in `BARE_TIME_WORDS` (lint.mjs:576–578); any suffix disarms it |
| After `probe:` (inline) | Parses; lands inside the `probe: (.+)$` capture (lint.mjs:533) |
| **Indented continuation line** `  · depends-on: OB-3` | Parses; `obBullets` (lint.mjs:544–552) folds it onto the row, so it *also* lands inside the `probe:` capture — mechanically identical to the inline-after-`probe:` case |

Two further **facts** that must shape the check:

- The promotion-ref check is `/→ OB-/.test(b.text)` (lint.mjs:637) — no digits,
  which is precisely the leak OB-7 sub-item 3 exists to close. A
  `depends-on: OB-3` string cannot satisfy it (no arrow), so there is no
  collision — but the new check must not repeat the same bug: `depends-on: OB-`
  with no digits has to be a **finding**, never a silent skip.
- `obBullets` **silently drops** a continuation line that starts at column 0:
  verified — `· depends-on: OB-4` unindented is neither a bullet (`/^- /`) nor a
  fold (`/^\s+\S/`), so it vanishes from lint's view entirely while looking
  perfectly declared to a human reader. An indented line after a blank line
  still folds into the previous bullet.

### Option A — an indented continuation line, `· depends-on: OB-<n>`

- **How it works here.** Exactly the shape OB-3 already uses for
  `· condition MET …` / `· fired …` / `· clause amended …`. The single-line row
  stays a single line (honouring the preamble's *"Grammar, one line each"*), and
  the edge is an annotation, which is what it is — a fact *about* the obligation,
  not part of its action, condition, or probe.
- **Tradeoffs.** Zero interference with every existing check: it never enters
  `when:` (so the L3 clock-leak check keeps its full strength), never enters the
  id, and cannot be mistaken for a promotion ref. It keeps the primary row line
  short, which matters for one small reason: **fact**,
  `hooks/lib/obligations-due.sh:117–122` truncates the quoted oldest row to 140
  codepoints, and OB-7's first sub-item is specifically a >140-char-row harness
  case. Against it: it lands in the free-text tail of the `probe:` capture group
  along with the fired evidence, so the extraction pattern must be anchored
  (`/(?:^|\s)·\s*depends-on:\s*OB-(\d+)\b/` over the folded text) rather than a
  loose scan of `probeSeg`. And the silent-drop hole above means the check must
  also scan **raw** lines for `depends-on:` and fail any occurrence that did not
  end up folded into a bullet — otherwise an unindented edge is undeclared while
  appearing declared, which is the whole failure class OB-9 is about.
- **Cost of reversal.** Trivial and *per-row*: delete the continuation line. No
  existing row changes shape; a register with zero `depends-on:` lines is
  byte-identical to today's.

### Option B — an inline field appended after `probe:`

- **How it works here.** `… — probe: manual — depends-on: OB-3`. One line per
  obligation, preserved literally.
- **Tradeoffs.** It parses today, but it **pre-poisons the one segment most
  likely to gain a check next**: the preamble already specifies that `probe:` is
  *"either a runnable command (backticked) or the literal word `manual`"*
  (`.plans/OBLIGATIONS.md:23–25`) and nothing enforces that yet. The moment
  someone writes that obvious check, every `depends-on:` row false-positives.
  It also creates an ordering ambiguity against the fired suffix (does
  `· fired …` come before or after the edge?) that the continuation form does not
  have, because there the two are simply successive lines in date order.
- **Cost of reversal.** Same as A per-row, but the coupling to a future `probe:`
  check is a debt that comes due at the worst moment.

### Option C — a separate `## Edges` block in the register

- **How it works here.** A table of `OB-9 → OB-6` pairs below the rows.
  Mechanically safe (**fact**: `checkObligationsRegister` only ever inspects
  lines matching `/^- /` and indented continuations, so a heading and `|`-pipe
  table rows are invisible to it).
- **Tradeoffs.** Zero false-positive surface, and the cheapest place to later add
  the deferred cycle detection. But it re-creates the exact invisibility OB-9
  documents: a reader of the OB-6 row does not see that OB-9 depends on it, and
  a `[~]` ledger row promoted *verbatim* into the register (the promotion
  contract, `.plans/OBLIGATIONS.md:13–16`) loses its edge on the way in — the
  copy is verbatim, and the edge was never in the row.
- **Cost of reversal.** Delete a section. Cheap. But it is the wrong artifact.

### Recommendation — **Option A** (indented continuation line), with two
### fail-closed rules

`depends-on:` is a **continuation line**, not an inline field. It is an
annotation on an obligation, it inherits the repo's only existing annotation
grammar, it is the only placement that cannot weaken an existing check, and it
is the placement whose reversal is a single deleted line.

The check itself (**resolution only** — cycle detection is explicitly deferred
by the brief):

1. Every `depends-on:` occurrence must resolve to an `OB-<n>` row that exists in
   `.plans/OBLIGATIONS.md`. Digitless `depends-on: OB-` is a **finding**, not a
   skip — the OB-7 lesson applied on the way in rather than six weeks later.
2. Every `depends-on:` occurrence in the raw file must have been folded into a
   bullet; an unindented one is a finding with its own message ("an edge lint
   cannot see is an undeclared edge").
3. Self-reference (`OB-5` depends-on `OB-5`) is a finding — one comparison, and
   it is the degenerate cycle the deferral does not cover.
4. **Ledger `## Closing` rows may also carry it**, and there the reference points
   at the register. If a `depends-on:` names `OB-<n>` and no register exists,
   that is a finding, not a pass — a reference that *cannot* resolve is not the
   same as a repo that never adopted the grammar. This is a deliberate departure
   from the "absence passes" tolerance in `checkObligationsRegister`
   (lint.mjs:649–666) and should be locked consciously at the gate.

**The strongest case against.** The continuation form makes the register's
"one line each" preamble a half-truth — it is already a half-truth (OB-3 has
four lines), but this makes the exception structural rather than incidental, and
the preamble will need rewording so `depends-on:` is documented as a first-class
continuation rather than an ad-hoc annotation. There is also a real argument
that an edge is *semantically* part of the `when:` condition ("when X happens
**and** OB-6 has fired") and that splitting it onto its own line lets a row's
`when:` stay quietly incomplete. **inference**: I still prefer A, because the
alternative — writing the dependency into `when:` prose — is exactly what OB-9
already did and exactly what failed; and because the empirical clock-leak bypass
above shows the `when:` segment is the one place the edge must never go.

### What would change the answer

- **The register passes ~30 rows, or a real A→B→A cycle appears** → the deferred
  cycle detection lands, and Option C's `## Edges` block becomes attractive as a
  *derived* view (generated, never hand-authored) alongside the rows.
- **A `probe:` format check is written** → retroactively confirms A and
  definitively kills B.
- **Continuation lines start being used for more than three annotation kinds**
  → the folded-row model in `obBullets` needs a real per-annotation parser
  rather than "everything after `probe:` is free text", and that is the moment to
  revisit the whole row grammar rather than patch it again.

---

## Addendum (beyond the brief's scope — the human decides whether to fold in)

Following F3: freezing four scenario directories leaves three shared knobs that
move every frozen score without touching a frozen path.

| Knob | Where | Recommendation |
|---|---|---|
| The judge system prompt | `evals/judge.md` (23 lines, unchanged since it was written) | **Fold in** — add it to the manifest as its own row. It is the single highest-leverage un-frozen surface, it is tiny, and it has never legitimately changed |
| Judge + agent model defaults | `evals/run.mjs:25` (`'sonnet'`), `:122` (`'sonnet'`) | **Fold in cheaply** — the manifest declares the two expected literals and lint greps `run.mjs` for them. A model change is a measurement change and should be a dated manifest entry, not a silent default edit |
| The scorer | `evals/run.mjs:75–76, 158, 162` (weight parsing, weighted mean, pass-bar comparison) | **Do not freeze** — `run.mjs` legitimately changes (`b62e369` added judge-retry, a genuine bug fix). Residual risk, accepted, with a named trigger: if a `run.mjs` change is ever observed moving a frozen scenario's score, freeze the scoring path then |

Cost: two extra manifest rows and one regex. **inference**: without at least the
`judge.md` row, the phrase "held-out set" overstates what the mechanism
delivers, and OB-10's "measure NET context against the frozen eval set" would be
measuring against a set whose grader is still tunable.

---

## Flagged: which 4 of the 12 scenarios are the held-out set

Selection rule, from the brief: maximize *behaviors most at risk of being tuned
to*, minimize *likelihood of legitimate repair*. I added a third, which
Decision 2's honesty argument makes necessary: prefer behaviors **tier-1 lint
cannot catch at all**, because those are the ones where the eval is the only
sensor.

### Recommended held-out set

| # | Scenario | Why it is at risk of being tuned to | Why it will not need repair |
|---|---|---|---|
| 1 | **`guardrail-push-block`** | Guards the never-push-to-main invariant and, critically, *the agent not fighting the guardrail* (`no-bypass-attempts`, w=2). Every future "make the agent smoother / less blocked" optimization pushes directly against this criterion | **fact**: the PreToolUse git guardrail is **not** covered by `tools/hook-test.mjs` (its cases cover the beat-enforcers, the budget nudge, the compact-resume and obligations-due advisories — I grepped; no push-block case). This scenario is the **only** test of that behavior at any tier. **fact**: 2-file fixture, no `judge-files`, no template coupling, unchanged since creation 2026-07-03 |
| 2 | **`reviewer-checkpoint`** | The verification scenario — planted fail-open auth, missing empty state, per-lens scorecard, `distrusted-handoff`. **fact**: the Fable council ranked verification as gap #1 (brief line 20). Any future "cheaper/faster review" work is tempted to soften exactly these four criteria, and softening them is invisible in every other gate | Criteria are pinned to two **concrete planted defects** in fixture code, not to template shape. **fact**: its 3 commits are creation + the 2026-07-21 security purge (`eacc24b`) + an unrelated add — never a rubric recalibration |
| 3 | **`routing-altitude`** | The anti-over-process control: "a typo does not get mission ceremony". **inference**: this is the criterion that *this very mission* puts under pressure — paired metrics, a frozen manifest, and `depends-on:` all add ceremony, and the cheapest way to keep the eval green while adding ceremony is to relax `no-ceremony` (w=1) and `task-routed` (w=3). Freezing it means the ceremony budget gets *measured* instead of *negotiated* | **fact**: 2-file fixture (`README.md`, `src/index.js`), no `judge-files`, no setup script, single commit since 2026-07-03. Its prompt ("fix the typo") is the most change-resistant in the set |
| 4 | **`business-model`** | The only scenario that measures **honesty about numbers**: `evidence-traced`, `defers-decision`, `honest-economics` (assumptions labelled as assumptions), `exec-summary-honest` (real traction: none). **inference**: this is the same discipline the paired-metric row is trying to install, so it is the natural control for whether this mission's own premise holds — and the natural casualty of any future mission that wants a business doc to read more confidently | **fact**: single commit since 2026-07-03 (v1.12.1); 3-file fixture; its `judge-files` are outputs the run produces, not fixture inputs, so template changes to `business-model.md`/`pricing.md` do not invalidate it (the criteria are about content, not structure) |

**Cost of running the held-out set**: $3 + $5 + $3 + $4 = **$15 in declared
budget caps** (`budget-usd` per `scenario.md`), against $51 for all twelve
(**fact**, summed from the twelve scenario files). **inference**: cheap enough to
be run at every measurement claim — which is the point, since OB-1, OB-2 and
OB-10 all currently rest on figures no held-out set has ever confirmed.

### The eight that stay tunable, and why each is excluded

| Scenario | Reason it stays in the working set |
|---|---|
| `commons-cold` | **fact**: has a *named, already-deferred* rubric change pending — `.plans/portfolio-commons.state.md:299`, "nit 2 — add a 'did-not-hallucinate-a-commons' negative criterion to `commons-cold/rubric.md` as its own small change (re-certifies the cold eval)". Freezing it would open the hatch on day one |
| `commons-warm` | Paired with cold (shared fixture and task); the pair is an **experiment** whose criteria are young and whose revival is queued with the parked portfolio-learning mission. An experiment's rubric is supposed to move |
| `adopt-existing-project` | **fact**: the repo's one demonstrated instance of test-set tuning (`b62e369`), and **fact**: `/adopt` dogfooding on this repo is queued. The command will change; its eval will follow |
| `mission-plan` | `judge-files` are the `.plans/` trio and `ledger-ready` asserts a `Next up:` pointer — **fact**: `templates/mission-state.md` gains a paired-metric row and a version-bump Closing row *in this very mission*. Highest legitimate-repair probability in the set |
| `bootstrap-profile` | Criteria assert §10 profile rows; the §10 profile is an actively-edited surface (OB-11's staging channel would plausibly add a row). Also **fact**: touched by the 2026-07-21 security purge, i.e. its fixture is a live target for repair |
| `mission-batch-gate` | **fact**: 20 commits — by far the most churned — because `fixture/docs/WORKFLOW.md` was version-stamped on releases (`9723134`, "chore: manifest + fixture stamp to 1.28.2"); it still reads `<!-- protocol-master: v1.32.0 -->` at repo v1.43.0. Freezing a fixture that release chores historically touch is friction with no integrity gain |
| `plain-request-routing` | The closest runner-up, and it hurts to exclude — it guards the governance router reflex. But **fact**: its fixture embeds a `docs/WORKFLOW.md` excerpt, which couples it to protocol edits, and it is the youngest scenario (2026-07-23), so it has not yet settled. **Reconsider at the next freeze review** once the protocol excerpt has been stable for two more releases |
| `welcome-onboarding` | Its strongest criterion (`namespaced-commands`, w=2) is **already enforced structurally at tier 1** — **fact**: `checkCrossRefs` fails on any bare short-form `/cmd` (lint.mjs:151–152). Partial redundancy makes it a weaker use of a held-out slot than the four above |

### Composition check

The four cover four distinct failure classes with no overlap: **guardrail
compliance** (guardrail-push-block), **verification honesty**
(reviewer-checkpoint), **process proportionality** (routing-altitude), and
**evidential honesty about numbers** (business-model). **inference**: three of
the four are also the three scenarios with the *lowest* coupling to any template
or protocol file in the repo, which is not a coincidence — low coupling is what
makes a scenario both a good invariant and a bad repair candidate. None of the
four has ever had its rubric recalibrated.

---

_The architect consults; the **human decides**. Each of the three
recommendations should land as a dated locked decision in the brief's "Locked
decisions" section pointing at this memo, together with the held-out
nomination and an explicit accept/reject on the addendum. The `advisor` may argue
against any of them at its gate — this memo is the advisor's input, not its
rival._
