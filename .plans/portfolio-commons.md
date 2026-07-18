# Mission: portfolio-commons — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5).
Deploys to `.plans/portfolio-commons.md`._

<!-- Feature validated 2026-07-18 (paired eval PASSED: consume→adapt→improve→
write-back loop works, no correctness regression; genericness lift unproven at
opus tier only). Source of truth: docs/product/features/portfolio-commons/idea.md -->

Goal: give the workflow a **Portfolio Commons** — a read/write shared-memory area
in the registry repo, a `/agentic-workflow:ingest` command, and a dedicated
**curator** agent — so ventures copy-and-adapt reusable material and feed
improvements back, compounding a library across ventures.

## Framing

Every venture starts cold: taste isn't captured, agents rebuild the same
auth/landing/scaffold each time, and output drifts to the AI-generic mean because
nothing of the owner's world is available to imitate. The registry repo (§13) is
bookkeeping-only today — pointers, never content. This mission extends it to store
reusable *material* the agents copy-and-adapt, with a curator that finds, brokers
(single-best-match), writes, and keeps it fresh. The bet was validated end-to-end
on 2026-07-18 (see `docs/product/features/portfolio-commons/idea.md` §Validation):
the loop works and is safe; demonstrated value at top tier is reuse fidelity + the
flywheel, not de-slopping (the de-slop claim is a cheap sonnet follow-up, not a
blocker). This mission is entirely **markdown prose + JSON manifests** in *this*
plugin repo — the `/ingest` command and curator *operate on* the separate registry
repo (`github.com/xyzhub/registry`) at runtime; authoring them ships no runtime code.

## Tasks

1. **Commons shape memo** — the `architect` digests the technical open questions
   (storage layout, index schema, freshness signal, copy-and-adapt/de-stale path,
   brokering interface, curator model tier) into a decision-ready memo, grounded in
   the `commons-warm` fixture prototype. Acceptance:
   `docs/product/decisions/2026-07-18-commons-shape.md` exists with 2–3 real options
   + a recommendation per open dimension; the human **locks** the shape at the
   phase-1 checkpoint (dated locked decisions added below).
2. **§13 protocol amendment** — amend the WORKFLOW **master**
   (`plugins/agentic-workflow/templates/WORKFLOW.md`, §13 ~lines 693–732) to add a
   writable **commons** surface holding *copies* (adapted + written back), keeping
   `registry.md`/`precedents.md` as pointers, folding commons writes into the
   existing "bookkeeping is delegable" lane. Acceptance: §13 describes the commons
   surface + index shape (per the locked memo); `node tools/lint.mjs` prints
   `lint: clean` (§ order intact, all `§` refs resolve).
3. **`/agentic-workflow:ingest` command** — author
   `plugins/agentic-workflow/commands/ingest.md`: **code type first**, per-type
   placement (not everything under `/templates`), body instructs `git clone`/`cp`
   via Bash + `Edit` of the commons index, `Task` in `allowed-tools` (it may spawn
   the curator). Acceptance: file exists; mentioned in root `README.md`, plugin
   `README.md`, and WORKFLOW master; all command refs namespaced
   `/agentic-workflow:ingest`; lint clean.
4. **`curator` agent** — author `plugins/agentic-workflow/agents/curator.md` owning
   the commons lifecycle (find, harvest, broker **single-best-match / k=1**, write,
   upkeep) with an explicit **freshness/staleness signal**. Acceptance: frontmatter
   `name: curator` (= filename) + `description` + comma-separated `tools`
   (+ chosen `model:`); brokering is single-best-match, NOT top-N; mentioned in both
   READMEs + WORKFLOW (§6 roles table + §13); lint clean.
5. **Wire one consumer (frontend) + the write-back path** — add to
   `plugins/agentic-workflow/agents/frontend.md` a "consult the commons / ask the
   curator for prior art before building, copy-and-adapt (never blind-copy)" beat,
   **conditioned on a commons existing**, plus the write-back path (curator writes
   improvements back as a delegable §13 bookkeeping PR). Acceptance: `commons-warm`
   eval stays green AND `commons-cold` stays green (no hallucinated commons);
   lint clean.
6. **Regression guard + docs + version bump** — confirm the `commons-warm` /
   `commons-cold` pair is wired as the feature's permanent guard (they auto-discover
   in `evals/run.mjs`); optionally add a curator-brokering eval (asserts k=1) and/or
   a graded/sonnet re-run for leg-(a); complete all three doc surfaces; bump
   `plugins/agentic-workflow/.claude-plugin/plugin.json` version and add a
   `CHANGELOG.md` `## [Unreleased]` entry. Acceptance: `node evals/run.mjs
   commons-warm commons-cold` green; lint clean; version + changelog updated.

## Locked decisions

- **2026-07-18** — Amend §13 with a writable **commons** surface holding *copies*
  (adapted + written back), keeping `registry.md`/`precedents.md` as pointers; fold
  commons writes into the existing "bookkeeping is delegable" lane.
- **2026-07-18** — A dedicated **curator** agent owns the commons lifecycle (find,
  harvest, share/broker to other agents, write, upkeep). Name "curator" provisional
  but assumed.
- **2026-07-18** — `/agentic-workflow:ingest` is generalized in intent (code, brand
  assets, shared knowledge) but placement is **per-type** — not everything under
  `/templates`. First increment ships the **code** type.
- **2026-07-18** — The curator brokers **single-best-match (k=1 style)**, NOT a
  top-N RAG firehose (researcher: grounding lift is precision-conditional;
  irrelevant/bulky context degrades output — context-rot, lost-in-the-middle).
- **2026-07-18** — Automated curator-ownership + a **freshness/staleness signal** is
  a **build prerequisite**, not a follow-up (researcher: curation decay is the
  best-evidenced failure mode).
- **2026-07-18** — First increment scopes to **high-taste / low-adaptation**
  artifacts (researcher: copy-and-adapt only pays there; clone economics turn
  negative on heavily-rewritten code).

## Risks

- **Consumer beat breaks `commons-cold`** (frontend hallucinates a commons that
  isn't there) → condition the beat on a commons existing; keep `commons-cold` green
  as the disconfirming guard.
- **Brokering drifts to top-N** → locked decision (k=1); the optional curator eval
  asserts single-best-match; the curator agent's prose forbids a top-N dump.
- **Curation decay** (the best-evidenced failure) → freshness signal is a build
  prerequisite (locked); the shape memo (S1) must specify the concrete staleness
  mechanic, not defer it.
- **§13 edit drifts the stamped copy** `docs/WORKFLOW.md` → the amendment lands in
  the **master**; `/agentic-workflow:sync` propagates. `tools/lint.mjs` §-integrity
  reads the master only, so lint passing does not certify the stamped copy — note it
  for the checkpoint.
- **Third-party licensing** of ingested code is unresolved → first increment is
  own-venture (first-party) harvests only; see open questions.

## Open questions

_Split for the human before `/agentic-workflow:mission` drives execution. The (b)
technical set is the exact scope of the S1 architect memo — the human can answer
directly from the recommendations below or confirm at the phase-1 checkpoint._

**(a) Plain scope / policy calls for the human**

- **Licensing/attribution policy for ingested third-party code.** **Recommendation:**
  scope the first increment to **own-venture (first-party) harvests only**; defer
  third-party ingest until a `licence` + `provenance` field and a policy exist. Carry
  the `licence` + `provenance` fields in the index schema now so the door is open.
- **Exact first-increment artifact class within "high-taste / low-adaptation".**
  **Recommendation:** **front-end taste-anchoring components** (landing/auth shells,
  design-token-driven SFCs) — exactly what the validation exercised: highest
  genericness-risk, lowest adaptation cost, and it keeps the existing eval as the
  guard without new fixtures.

**(b) Technical → route through the `architect` memo (mission S1)**

- **Commons storage layout + index schema fields.** **Recommendation:** adopt the
  `commons-warm` prototype shape verbatim as the baseline — `commons/index.md` +
  `commons/code/<slug>/` with a per-entry `README.md` carrying adaptation notes.
  Index-entry fields: slug, path, stack, tags, provenance (venture · repo · commit),
  licence, why-it's-good, reuse-match, and a `last-reviewed` freshness date.
- **Freshness/staleness signal mechanic.** **Recommendation:** a `last-reviewed`
  date + a pinned source-commit per entry; the curator flags an entry stale when it
  ages past a threshold OR its source repo has advanced past the pinned commit.
- **Copy-and-adapt mechanics + de-stale/refresh path.** **Recommendation:** each
  copy carries a provenance backpointer (source repo + commit); refresh = curator
  re-harvests when the source advances; improvements flow back as a delegable §13
  bookkeeping PR.
- **Curator brokering interface (how a consumer invokes it).** **Recommendation:**
  a **read-protocol against the curated index by default** — the consumer reads
  `commons/index.md` and picks the single best entry (preserves k=1 AND keeps the
  existing eval, where frontend reads the index directly, valid); reserve a
  curator-subagent spawn for an ambiguous or large commons.
- **Curator model tier.** **Recommendation:** **default (opus) tier** for the
  brokering judgment — precision is the entire value (researcher) and misfired
  brokering degrades output; `/agentic-workflow:tune` can drop it to `sonnet` if
  brokering proves mechanical in practice.

---
_The `.plans/portfolio-commons.sessions.md` briefs execute these tasks;
`.plans/portfolio-commons.state.md` tracks progress. Resolve every open question
before execution starts._
