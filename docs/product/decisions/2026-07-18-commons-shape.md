# agentic-workflow — Decision memo: commons-shape

_A shape-before-build decision, digested so the human chooses between options
instead of doing the analysis. Authored by the `architect` (WORKFLOW.md §6).
Mission: `portfolio-commons`, session S1. Labels: **fact** (cited) / **inference**
(my reasoning) / **assumption** (unverified). This memo is the input the human
locks at the phase-1 checkpoint; S2 amends §13 to whatever is locked here._

## The question

**What concrete shape does the Portfolio Commons take** — its storage layout,
index schema, freshness signal, copy-and-adapt/refresh path, brokering interface,
and curator model tier — such that the validated consume→adapt→improve→write-back
loop hardens into durable protocol without reopening the six locked decisions?

**What it constrains downstream.** These six choices are what S2 writes into §13,
what S3's `/agentic-workflow:ingest` writes *into*, what S4's `curator` agent
operates *on*, and what S5's `frontend` beat reads *from*. The storage layout and
index schema in particular are the expensive-to-change surface: every future
`/ingest` run and every consumer read binds to them, and the `commons-warm` /
`commons-cold` eval pair is already coupled to the current shape. Getting these
right now is cheap; retrofitting after the registry holds real entries and the
protocol has shipped is the 10× case.

**What is NOT open here** (locked, do not reopen — master plan §Locked decisions):
commons holds *copies* folded into the delegable §13 bookkeeping lane; a dedicated
`curator` owns the lifecycle; `/ingest` is per-type placement, code type first;
brokering is **k=1 single-best-match, never top-N**; an automated freshness signal
is a **build prerequisite**; first increment is **first-party, high-taste /
low-adaptation** artifacts. Each dimension below is scoped *within* those locks.

**Baseline.** The `commons-warm` fixture is a working prototype of this shape and
the validation (2026-07-18, idea.md §Validation) exercised the full loop against
it with no product machinery. **[Fact]** The fixture is `commons/index.md` +
`commons/code/tend-landing-auth/{LandingHero.vue,SignInForm.vue,README.md}`, and
`commons-cold` has no `commons/` directory at all. **[Inference]** The strong
default for every dimension is therefore "harden what the eval already proved,"
because deviating from it risks invalidating the one regression guard the feature
has. Each recommendation states its reversal cost so the human can weigh premium
against risk.

---

## Dimension 1 — Storage layout

_How the commons is organized in the registry repo._

### Option A — Per-type dirs: `commons/{code,brand,knowledge}/<slug>/` (the fixture shape)
- **How it works here** — `commons/index.md` at the root; each artifact lives in
  `commons/<type>/<slug>/` with its own `README.md` (adaptation notes) beside the
  files. Exactly the `commons-warm` fixture, generalized to more types later.
  `/ingest` `cp`s into the type dir and `Edit`s the index; the consumer reads the
  index and follows the path. **[Fact]** This is the shape the validation ran on.
- **Tradeoffs** — Good: type is legible from the path; per-type placement is
  already a locked decision, so this *is* the lock made concrete; grouping keeps
  brand assets and code from colliding as the commons grows. Bad: a slug that
  spans types (a component + its brand tokens) has to pick one home or duplicate.
- **Operational cost** — Near-zero: it is files in git, swept by the existing
  registry bookkeeping lane. No new infra.
- **Cost of reversal** — **Low.** Moving to flat or tag-based later is a `git mv`
  + an index-path rewrite; provenance lives in the index/README, not the path.

### Option B — Flat: `commons/<slug>/` + `type:` field in the index
- **How it works here** — All artifacts at one level; the index entry's `type`
  field is the only type signal. `/ingest` never has to choose a dir.
- **Tradeoffs** — Good: simplest possible; no cross-type placement question. Bad:
  loses at-a-glance browsability; as code + brand + knowledge accumulate, one flat
  dir becomes a junk drawer; **[Inference]** it also quietly fights the locked
  "per-type placement" decision, so it is arguably out of scope to even offer.
- **Operational cost** — Zero, same as A.
- **Cost of reversal** — **Low**, but reversing *into* per-type later is the exact
  retrofit the lock exists to avoid.

### Recommendation — **Option A (per-type dirs, the fixture shape).**
Adopt `commons/index.md` + `commons/<type>/<slug>/README.md` verbatim from the
prototype, with `code/` as the only populated type in the first increment.
Rationale: it is the shape the validation proved, it makes the locked per-type
decision concrete, and reversal is cheap because the path carries no meaning the
index doesn't also hold. **[Assumption]** Types beyond `code` (brand, knowledge)
land in later increments; reserving the dir level now costs nothing and avoids a
migration when they arrive.
**Strongest case against:** flat is marginally simpler for a commons that never
grows past a handful of code entries — if the portfolio stays code-only forever,
the type level is unused ceremony. The lock already answered this; A wins.
**Reversal cost: LOW.**

---

## Dimension 2 — Index schema fields

_What one index entry records._

### Option A — Fixture field set + `licence` + `provenance` + `last-reviewed` (the strawman)
- **How it works here** — Each index entry (a Markdown sub-section under
  `## <type>`, as in the fixture) carries: **slug**, **path**, **stack**, **tags**,
  **provenance** (venture · repo · pinned commit), **licence**, **why-it's-good**,
  **reuse-match**, **last-reviewed** date. **[Fact]** The fixture entry already
  carries slug/path/stack/tags/provenance/why-it's-good/reuse — this adds
  `licence`, a machine-parseable `provenance` commit pin, and `last-reviewed`.
- **Tradeoffs** — Good: `provenance` (repo+commit) + `last-reviewed` are exactly
  the two fields the freshness signal (Dim 3) and refresh path (Dim 4) consume, so
  they are load-bearing, not decorative; `licence` opens the door to third-party
  ingest later (master plan §a) at zero cost now. Bad: nine fields is more than a
  code-only first increment strictly needs; risk of ceremony if under-used.
- **Operational cost** — Curator maintains the fields on harvest/refresh; human
  cost near-zero if automated (Dim 6).
- **Cost of reversal** — **Low.** Markdown fields are additive; adding/removing a
  field later is an index rewrite, no consumer breaks if the field is optional.

### Option B — Minimal set (slug, path, stack, tags, why-it's-good, reuse) — defer licence/provenance/freshness
- **How it works here** — Ship only what a k=1 read needs to *pick* an entry;
  add provenance/freshness when the refresh path is actually built.
- **Tradeoffs** — Good: least to author now. Bad: **[Inference]** directly
  violates the locked "freshness signal is a build prerequisite, not a follow-up"
  — without `last-reviewed`/commit-pin *in the schema*, there is no staleness
  mechanic, which is the best-evidenced failure mode (idea.md leg c). Dropping
  `licence` also forces a schema migration the day third-party ingest is wanted.
- **Operational cost** — Lower now, higher later (retrofit).
- **Cost of reversal** — **Medium** — adding the freshness fields later means
  back-filling every existing entry, and back-fill of a pinned *source commit* may
  be unrecoverable if the source has since advanced.

### Recommendation — **Option A (full field set).**
The three "extra" fields are the ones the locked prerequisites depend on:
`provenance` (repo+commit) and `last-reviewed` *are* the freshness mechanic;
`licence` is the cheap option-value that keeps third-party ingest reachable. Carry
them from entry one so the door is open and no back-fill is ever needed —
fail-closed by shape: an entry that cannot record its provenance is one the schema
won't accept. **[Fact]** This matches the planner strawman and the master plan's
§a licensing recommendation (carry `licence`+`provenance` now, defer third-party
ingest).
**Strongest case against:** for a first increment that is code-only and
first-party, `licence` is always "first-party / owner" and adds no discriminating
information yet — it is pure forward-option cost. Accepted: the field is one line
and prevents a migration; cheap insurance.
**Reversal cost: LOW** (additive fields; but *omitting* provenance/freshness now
is the medium-cost mistake — hence carry them).

---

## Dimension 3 — Freshness / staleness signal

_How staleness is detected and surfaced (locked: this is a build prerequisite)._

### Option A — `last-reviewed` date + pinned source-commit; curator flags stale on age-threshold OR source-advance (the strawman)
- **How it works here** — Each entry pins the source repo + commit it was
  harvested at and a `last-reviewed` date. The curator (command-time, daemon-free,
  like all §13 awareness — **[Fact]** WORKFLOW §13 lines 725–726) flags an entry
  **stale** when either: it ages past a threshold, OR `git ls-remote`/log shows the
  source repo has advanced past the pinned commit. Staleness surfaces as a note in
  the index and/or a curator-proposed refresh, not an auto-mutation.
- **Tradeoffs** — Good: two orthogonal signals catch the two decay modes (time
  drift AND source drift); both are computable from git + a date, no infra;
  fail-*visible* — a stale entry is marked, not silently trusted. Bad: threshold is
  a tuning knob with no principled default; source-advance detection needs the
  source repo reachable (`gh` for remote-only, per §13 line 732).
- **Operational cost** — One `git`/`gh` check per entry at curator-run time;
  cheap and bounded by entry count.
- **Cost of reversal** — **Low.** The signal is two fields + curator prose; a
  different mechanic later reuses the same fields.

### Option B — Time-only (`last-reviewed` + threshold), no source-commit pin
- **How it works here** — Stale purely when aged past N days.
- **Tradeoffs** — Good: simplest; no source-repo reachability needed. Bad: misses
  the *source-advanced* case entirely — a copy can be days old and already behind
  its origin; **[Inference]** this is exactly the decay the write-back/refresh loop
  exists to catch, so time-only under-detects the case that matters most.
- **Operational cost** — Lowest.
- **Cost of reversal** — **Low** (add the commit pin later — but see Dim 2, the
  pin may be un-back-fillable once the source moves).

### Option C — Content-hash drift (hash the source files, flag when the upstream hash changes)
- **How it works here** — Store a hash of the harvested files; re-hash source on
  curator run; flag on mismatch.
- **Tradeoffs** — Good: precise — flags only real content change, not cosmetic
  commits. Bad: needs the full source tree fetched to re-hash (heavier than a
  `ls-remote` commit check); more code than a code-free-authoring mission wants;
  **[Inference]** over-engineered for a commons of a handful of entries.
- **Operational cost** — Higher: fetch + hash per entry.
- **Cost of reversal** — Low.

### Recommendation — **Option A (age-threshold OR source-advance, both signals).**
It catches both decay modes with only git and a date, keeps the daemon-free
command-time discipline §13 already mandates, and surfaces staleness *visibly*
(the leg-c fix the researcher prescribes: owner + review date + delivery in-flow).
**[Assumption]** A sensible default threshold is a review horizon of a few months;
leave the exact number to the curator agent's prose so `/tune` can adjust it
without a protocol edit.
**Strongest case against:** for a first-party commons where the owner harvests
from their own active ventures, source-advance may fire constantly (every commit
to a live venture "advances" past the pin) — noisy. Mitigation: the signal *flags
for curator review*, it does not force a refresh; and the curator only re-harvests
when the advance actually touches the harvested artifact (which content-hash, Opt
C, would confirm — the upgrade path if noise proves real).
**Reversal cost: LOW.**

---

## Dimension 4 — Copy-and-adapt + de-stale / refresh path

_How a copied artifact is refreshed when its source advances._

### Option A — Provenance backpointer; curator re-harvests on source-advance; improvements flow back as a delegable §13 PR (the strawman)
- **How it works here** — Each copy carries the Dim-2 provenance (source repo +
  commit). When Dim-3 flags source-advance, the curator re-harvests the *source*
  into the commons entry, re-pins the commit, bumps `last-reviewed`. Separately,
  when a *consumer* improves an artifact while adapting it (the validation's
  `--color-accent-strong` case), the curator writes that improvement **back to the
  commons** as a delegable §13 bookkeeping PR. **[Fact]** The validation ran this
  exact write-back unprompted and proposed the PR; the loop is proven.
- **Tradeoffs** — Good: rides the existing delegable bookkeeping lane (no new
  merge policy); copies are never orphaned; two flow directions (source→commons
  refresh, consumer→commons improvement) both land as reviewable PRs preserving
  audit trail. Bad: two-directional flow needs the curator to arbitrate conflicts
  (source advanced AND a consumer improved the same spot) — a real if rare merge.
- **Operational cost** — PR-per-refresh; human cost near-zero under the delegated
  bookkeeping lane (agent-may-merge), **[Fact]** which §13 already authorizes for
  registry bookkeeping (lines 715–723).
- **Cost of reversal** — **Low.** The path is prose + PRs, no stored state beyond
  the provenance pin.

### Option B — No backpointer; copies are point-in-time snapshots, never refreshed (fork-and-forget)
- **How it works here** — Harvest once; the commons entry is a frozen exemplar;
  staleness is accepted, not fought.
- **Tradeoffs** — Good: dead simple; no conflict arbitration. Bad: **[Inference]**
  this is precisely the clone-and-own decay the researcher warns kills internal
  libraries (idea.md leg c: "no owner + no review date"); it also strands the
  write-back loop the validation proved is the feature's demonstrated top-tier
  value ("reuse fidelity + the flywheel"). Directly contradicts the locked
  freshness-prerequisite.
- **Operational cost** — Zero — but the library rots.
- **Cost of reversal** — **Medium** — retrofitting provenance onto frozen entries
  is the un-back-fillable case again.

### Recommendation — **Option A (provenance backpointer + curator re-harvest + delegable write-back PR).**
It is the validated loop, it is the locked-prerequisite made concrete, and it
reuses the delegable §13 lane so human attention stays near zero — the single most
important lever against the best-evidenced failure mode. Conflict arbitration
(source-advance vs. consumer-improvement on the same artifact) is handled by making
the curator the sole writer and every change a reviewable PR, so a clash surfaces
as a diff, not a silent overwrite.
**Strongest case against:** two-directional refresh is the most machinery of any
dimension here and the first increment may never exercise the source-advance
direction (first-party sources the owner controls). Mitigation: author the
*write-back* direction fully (validation-proven, load-bearing) and specify
source-refresh as curator prose the freshness signal triggers — no extra code,
and it is ready when a second venture harvests from a shared source.
**Reversal cost: LOW.**

---

## Dimension 5 — Brokering interface

_How a consumer agent reaches the curator / commons (honor locked k=1)._

### Option A — Read-protocol against the curated index by default (the strawman)
- **How it works here** — The consumer (frontend, S5) reads `commons/index.md`
  directly, picks the **single best** entry, opens that entry's README + files, and
  copy-adapts. No subagent spawn on the hot path. **[Fact]** This is exactly what
  the `commons-warm` scenario does today (scenario.md: "start by reading
  commons/index.md") and what the validation scored 100% on — so this option keeps
  the existing eval valid unchanged.
- **Tradeoffs** — Good: preserves k=1 by construction (the consumer picks one);
  zero spawn latency/cost; keeps the regression guard green with no fixture churn;
  **[Inference]** the index is already a curated, small, single-best-match-oriented
  document, so a read *is* the brokering. Bad: for a large/ambiguous commons the
  consumer does its own matching, which could drift toward "grab several" without a
  gatekeeper — the top-N failure mode the lock forbids.
- **Operational cost** — None beyond a file read.
- **Cost of reversal** — **Low.** Adding a curator-spawn broker later is additive;
  the read-protocol remains the fallback.

### Option B — Curator subagent spawn per consult (Task → curator returns one match)
- **How it works here** — The consumer `Task`-spawns the curator, which reads the
  index, applies k=1 judgment, and returns exactly one entry + its adaptation
  brief. The consumer never sees the whole index.
- **Tradeoffs** — Good: a single enforcing gatekeeper guarantees k=1 — the
  consumer *cannot* grab top-N because it only ever receives one; strongest defense
  against the locked-forbidden failure mode; scales to a large/ambiguous commons
  where a naive read would dump too much context (the context-rot / lost-in-middle
  risk the researcher flags). Bad: spawn latency + token cost on every build;
  **[Fact]** it would break the current `commons-warm` eval, which asserts the
  consumer reads the index directly — a fixture/rubric rewrite.
- **Operational cost** — One subagent spawn per consult.
- **Cost of reversal** — **Medium** — once consumers depend on the curator being
  spawnable, removing it means re-teaching each consumer the read-protocol.

### Option C — A `/agentic-workflow:commons` (or similar) command as the broker
- **How it works here** — A slash command the human/consumer invokes to query the
  commons.
- **Tradeoffs** — Good: explicit, discoverable. Bad: **[Inference]** commands are
  human-invoked entry points; the consumer here is an *agent mid-build*, not a
  human — a command is the wrong ergonomics, and it duplicates what `/ingest`
  (write) + a read-protocol (read) already cover. Out of natural shape.
- **Operational cost** — A command to maintain for little gain.
- **Cost of reversal** — Low.

### Recommendation — **Option A (read-protocol) as the default, with Option B (curator spawn) reserved for a large or ambiguous commons.**
The read-protocol preserves k=1, costs nothing, and — decisively — keeps the one
regression guard the feature has valid with zero churn. It is the boring-first
choice. Reserve the curator-spawn as the documented escalation for when the commons
grows past what a single index read can disambiguate. **[Inference]** The measured
trigger to escalate is real, not hypothetical (below).
**Strongest case against:** a read-protocol trusts the *consumer* to hold the k=1
line, and the researcher's whole caution is that consumers drift to top-N when the
material is bulky — Option B is the only design where top-N is *unrepresentable*
rather than merely discouraged. This is the fail-closed-by-shape argument, and it
is genuinely stronger on precision. It loses today only because the commons is
tiny (one entry) and spawning to broker one-of-one is pure overhead — and because
breaking the guard to gain a defense against a scale problem we don't yet have
inverts boring-first. The curator agent (S4) still *exists* and owns lifecycle;
this dimension only decides the consult hot-path.
**Reversal cost: LOW** (read → spawn is additive).

---

## Dimension 6 — Curator model tier

_The `model:` frontmatter for `agents/curator.md`._

### Option A — Default (opus) tier (the strawman)
- **How it works here** — `curator.md` omits `model:` (inherits the default opus)
  or sets it explicitly. **[Fact]** The validation ran the loop on the opus agent
  and it brokered/adapted/wrote-back correctly.
- **Tradeoffs** — Good: brokering *precision* is the entire value of the feature
  (idea.md: the lift is "conditional on precision"; a misfired match degrades
  output below no-commons); k=1 selection is a judgment task, not a mechanical one,
  and judgment is where the top tier pays. Bad: highest per-run cost for an agent
  that may run often.
- **Operational cost** — Highest token cost per curator invocation.
- **Cost of reversal** — **Low.** `model:` is one frontmatter line; `/tune` can
  drop it to sonnet without touching logic. **[Fact]** MEMORY: opus by default,
  drop to sonnet only when a task proves mechanical.

### Option B — `sonnet` tier
- **How it works here** — `model: sonnet` in frontmatter (as `writer.md` does).
- **Tradeoffs** — Good: cheaper for high-frequency brokering. Bad: **[Inference]**
  spends the precision budget exactly where the feature is most precision-sensitive;
  the researcher's whole "grounding is precision-conditional" caution argues against
  economizing on the matching step before it is proven mechanical.
- **Operational cost** — Lower.
- **Cost of reversal** — **Low** (one line).

### Recommendation — **Option A (default/opus tier).**
Brokering precision *is* the product; the locked k=1 decision exists because
imprecise matching actively harms output, so the matching agent is the last place
to economize before evidence says it is safe. Because `model:` is a one-line
reversal, the risk is asymmetric: start precise, drop to sonnet via `/tune` the
moment brokering proves mechanical in practice.
**Strongest case against:** the validation showed brokering *this* one-entry
commons was trivial — a sonnet judge already scored the run — so opus may be
paying premium for a lookup a cheaper model handles fine. True today at n=1;
the k=1 judgment gets harder as the commons grows, which is when precision matters
most, so default-tier ages better than the n=1 snapshot suggests.
**Reversal cost: LOW.**

---

## What would change the answer

Per dimension, the evidence or scale threshold at which a different option wins —
the trigger to revisit:

- **D1 storage layout** → if the commons never grows past code-only after several
  ventures, the type level is dead ceremony and **flat (B)** becomes defensible. Trigger:
  a full portfolio cycle with zero brand/knowledge entries.
- **D2 index schema** → if third-party ingest is ruled out permanently, `licence`
  can be dropped; if a graded/machine consumer needs structured fields, the
  Markdown entry may need to become YAML/JSON front-matter. Trigger: a consumer
  that parses the index programmatically rather than reading it.
- **D3 freshness** → if source-advance flagging proves noisy on live first-party
  ventures, escalate to **content-hash drift (C)** to flag only real changes.
  Trigger: measured false-positive rate on refresh flags.
- **D4 refresh path** → if source-refresh conflicts (source-advance vs.
  consumer-improvement on the same artifact) become frequent, the two-directional
  merge needs a first-class arbitration rule, not curator prose. Trigger: a
  recurring same-artifact clash.
- **D5 brokering** → **escalate read-protocol → curator-spawn (B)** when the commons
  holds enough same-type entries that a single index read can no longer surface an
  unambiguous single best match, OR when a consumer is observed grabbing several
  entries (top-N drift). Trigger (measurable): index grows past roughly a
  screenful per type, or an eval/observation shows a consumer consulting >1 entry.
  This is the single most important measurement to watch — it is the locked-k=1
  guarantee moving from discipline to structure.
- **D6 model tier** → **drop curator to sonnet (B)** once brokering is observed to
  be mechanical (a curator-brokering eval asserting k=1 passes at sonnet). Trigger:
  the optional S6 k=1 eval green on sonnet.

**Cross-cutting caveat (all dimensions).** The validation demonstrated the loop at
**opus tier only**, where genericness lift (leg a) sat at the ceiling and was not
measured. None of these recommendations depends on leg-a being proven — they harden
the *mechanism* (reuse fidelity + flywheel), which is what validated. A sonnet /
graded re-run (S6, optional) would test leg-a and could, if it shows the commons
does de-slop weaker output, raise the value of the higher-precision options (D5-B,
D6-A). Until then, boring-first holds.

---
_The architect consults; the **human decides**. These six recommendations become
dated locked decisions in `.plans/portfolio-commons.md` at the phase-1 checkpoint,
pointing at this memo. S2 amends §13 to whatever is locked. The `advisor` may argue
against any pick at its gate — this memo is its input, not its rival._
