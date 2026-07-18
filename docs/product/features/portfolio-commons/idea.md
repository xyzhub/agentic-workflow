# Portfolio Commons — Idea & Validation (V0, feature-scoped)

> **Feature of the `agentic-workflow` plugin**, not a standalone venture. This
> shapes a capability the plugin would gain; the plugin's own product-of-record
> stays `docs/product/idea.md`. Forward-looking (pre-build), authored 2026-07-18
> via `/agentic-workflow:brainstorm`.

## The problem

Every venture the workflow drives starts cold. Curated taste isn't captured, so
quality resets each time; agents rebuild the same auth/landing/table/scaffold on
every project; and output drifts toward the AI-generic mean because the agents
generate with nothing of the owner's world to imitate. The portfolio has no
shared memory — nothing accrues across ventures. Today the registry repo
(`github.com/xyzhub/registry`) is bookkeeping only ("pointers to ventures, never
copies of their state"); there is no shared *content* the agents can reuse.

## Who it's for / who "pays"

Internal tooling — the buyer and user are the same person (the repo owner). The
"payment" is venture velocity and quality: a compounding library means venture
N+1 starts warmer than venture N. The direct consumers are the **agents**
(designer, frontend, architect, backend, business), served automatically via a
dedicated **curator** agent rather than by teaching each one the storage layout.

## Why now

The workflow already runs a **portfolio** of ventures (§13) with a separate
registry repo, an append-only write-back discipline (`/adopt`, `/operate`,
chronicler), and a hook-enforced "bookkeeping is delegable" merge lane. The
machinery for a read/write shared record exists — it has only ever stored
*pointers*. Extending it to store reusable *material* is now a small conceptual
step on top of infrastructure that's already there.

## The riskiest assumption

That an agent reaching into a shared commons **measurably changes its output** —
copy-and-adapt genuinely beats regenerate-from-scratch, reference material
actually re-calibrates generation away from generic, AND the curation/upkeep
stays cheap enough not to become a second job. If any of these is false, the
commons is an inert library that sits unused (or a maintenance liability of stale
copies). This is a behavioral/technical bet, not a market bet.

## Cheapest test of that assumption

A before/after in-repo experiment, not market research: seed a tiny commons with
one reusable artifact, run one consumer agent (e.g. frontend or architect) twice
— with the commons available vs. not — and judge whether the commons run is
visibly less generic / faster / higher-quality. This is exactly a tier-2 eval
scenario (`evals/scenarios/`), so the test doubles as the feature's regression
guard. Corroborate with prior art on example-grounding of LLM output and on
cross-project code-reuse economics.

## Kill criteria

- The commons run is not measurably better than the cold run (behavior doesn't
  change) → the whole premise fails; stop.
- Copy-and-adapt cost meets or exceeds regenerate-from-scratch for the parts we
  actually rebuild → no reuse will happen no matter how good the index.
- Upkeep (curation, de-staling copies) costs more attention than it saves across
  a few ventures → the flywheel spins without transferring torque.

## Rough shape (one paragraph, no detail)

A new `/agentic-workflow:ingest` command copies reusable material into the
registry repo's new **commons** area (codebases, and later brand assets + shared
knowledge; actual doc templates still go under `/templates`), where a dedicated
**curator** agent classifies, tags, and indexes it. When a consumer agent is
about to generate or build, it asks the curator for relevant prior art; the
curator surfaces the best match, the consumer **copies and adapts** it to the
current project (never blind-copies), and when it improves that material the
curator **writes the improvement back** to the commons (a delegable §13
bookkeeping PR). Every venture contributes, so the library of verified,
battle-tested material compounds — making each new project faster and cheaper.

## Locked decisions (dated)

- **2026-07-18** — Amend §13 with a new writable **commons** surface holding
  *copies* (adapted + written back), keeping `registry.md`/`precedents.md` as
  pointers; fold commons writes into the existing "bookkeeping is delegable" lane.
- **2026-07-18** — A dedicated **curator** agent owns the commons lifecycle
  (find, harvest, share with other agents, write, upkeep) rather than wiring
  registry-reads into each consumer agent. (Name provisional.)
- **2026-07-18** — `/ingest` is generalized in intent (code, brand assets,
  shared knowledge), but placement is per-type — not everything lands under
  `/templates`.

## Open questions (for planning / architect, after validation)

- First-increment scope: codebases-only proof vs. generalized ingest vs.
  ingest+index-only. (Deferred pending the validation result.)
- Commons storage layout + index schema (tags, provenance, licence, stack).
- Copy-and-adapt mechanics and the staleness/update path for copied code.
- Which consumer agent to wire first behind the curator.
- Licensing/attribution policy for ingested third-party code.

## Evidence (researcher, 2026-07-18)

Sources cited inline. Labels: **[Fact]** = cited/dated/sourced, **[Inference]** =
my reasoning from the facts, **[Speculation]** = unknown, flagged as such. The
riskiest assumption has three legs — (a) grounding re-calibrates output, (b)
copy-and-adapt beats regenerate, (c) curation stays cheap. Each is treated
separately because they can fail independently.

### Leg (a) — does reference/example grounding measurably improve agent output?

**For.**
- **[Fact]** Retrieval *can* materially improve code generation when the
  retrieved context is relevant. CodeRAG-Bench (10 retrievers × 10 models across
  basic/open-domain/repo-level tasks) finds "high-quality retrieved contexts can
  significantly improve code generation," with GPT-4 gaining on DS-1000 and
  repository-level tasks. ([CodeRAG-Bench, NAACL Findings 2025](https://aclanthology.org/2025.findings-naacl.176/) · [arXiv 2406.14497](https://arxiv.org/html/2406.14497v2))
- **[Fact]** Few-shot/in-context examples beat zero-shot for output quality, and
  the biggest jump is at **k=1** — a single good exemplar already re-shapes
  output. ([Shelf.io: zero- vs few-shot](https://shelf.io/blog/zero-shot-and-few-shot-prompting/) · [Prompt Engineering Report, arXiv 2509.11295](https://arxiv.org/pdf/2509.11295))
- **[Inference]** The commons' "one relevant, battle-tested exemplar per task" is
  closer to the k=1 few-shot regime (large effect, low token cost) than to
  many-document RAG (where noise dominates, see below). This is the strongest
  argument the design will work *if* the curator surfaces exactly one good match.

**Against.**
- **[Fact]** Retrieval helps *most* on weaker/untuned models; strong frontier
  models show "compounded returns" but also that retrievers "struggle to fetch
  useful contexts" and generators "face limitations in using those contexts."
  The lift is not guaranteed and depends on retrieval precision. ([CodeRAG-Bench](https://aclanthology.org/2025.findings-naacl.176/) · [What to Retrieve for RAG code, arXiv 2503.20589](https://arxiv.org/abs/2503.20589))
- **[Fact]** Irrelevant or merely-similar retrieved context *degrades* output,
  sometimes below no-retrieval-at-all: "RAG accuracy consistently falls below
  retrieval recall … the detrimental impact of irrelevant passages." ([RAG
  precision problem](https://arxiv.org/pdf/2502.11400) survey findings; [ParetoRAG, arXiv 2502.08178](https://arxiv.org/pdf/2502.08178))
- **[Fact]** Even *perfectly retrieved* context degrades performance purely by
  volume: 13.9–85% drop as input length grows, even when irrelevant tokens are
  whitespace or masked. Context length alone hurts. ([Context Length Alone Hurts
  LLM Performance, EMNLP Findings 2025 / arXiv 2510.05381](https://arxiv.org/html/2510.05381v1))
- **[Fact]** Lost-in-the-middle: a relevant document moved from position 1 to
  position 10 in a 20-doc context costs 30%+ accuracy. Placement matters as much
  as presence. ([Liu et al. 2023, Stanford](https://cs.stanford.edu/~nfliu/papers/lost-in-the-middle.arxiv2023.pdf))

**Net on (a):** **[Inference]** The mechanism is real but *conditional on
precision*. Grounding helps when the curator returns one tight, relevant artifact
and hurts when it dumps several loosely-related ones. The design's success hinges
on the curator behaving like a k=1 few-shot selector, not a RAG firehose. This is
a design constraint, not a kill — but it means "index everything, retrieve top-N"
is the failure mode to avoid.

### Leg (b) — does copy-and-adapt beat regenerate-from-scratch?

**For.**
- **[Fact]** Sandi Metz's widely-cited thesis — "duplication is far cheaper than
  the wrong abstraction" — argues *against* prematurely DRYing shared code and
  *for* tolerating duplication until the problem is understood. The commons'
  "copy-and-adapt, never blind-import-a-shared-lib" stance is aligned with this:
  it avoids the wrong-abstraction trap by design. ([Sandi Metz, The Wrong
  Abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction))
- **[Inference]** For cold-start scaffolding (auth, landing, table, config) the
  marginal value is a *known-good starting point*, not a maintained dependency —
  exactly what copy-and-adapt provides. Regeneration re-rolls the dice on
  genericness each time; a seed anchors it.

**Against.**
- **[Fact]** Clone-and-own is "readily available and initially cheap but does not
  scale with reuse frequency, imposing high maintenance costs"; cloned code is
  "more change-prone than non-clone code" and forces bug-fix/update propagation
  across every copy. ([Comparative Stability of Cloned Code, arXiv 1504.07713](https://arxiv.org/pdf/1504.07713) · [Empirical analysis of clone- vs platform-oriented reuse](https://www.researchgate.net/publication/347588321))
- **[Inference]** Copy-and-adapt across *heterogeneous* projects is where reuse
  economics turn negative: if adaptation cost approaches regeneration cost, the
  commons adds a step without saving one. The kill-criterion "adaptation ≥
  regeneration" is directly supported by the clone-cost literature.
- **[Speculation]** With a capable agent, regeneration is cheap and fast, which
  *raises* the bar the commons must clear — the reuse win may be quality/taste
  (less generic), not speed. Unmeasured; the test below must measure both.

**Net on (b):** **[Inference]** The write-back-improvements design partially
answers the staleness objection (copies aren't abandoned; they get re-harvested),
but the clone literature is a genuine warning: value is highest for *taste/quality
anchoring* and lowest for *code you'd have to heavily rewrite anyway*. Scope the
first increment to high-taste, low-adaptation artifacts.

### Leg (c) — does curation stay cheap, or become a second job?

**Against (this is the best-evidenced risk).**
- **[Fact]** Internal knowledge bases and design systems decay predictably from
  the same root cause: **no owner + no review date**. "Assigning clear ownership …
  is critical — without individual accountability, knowledge bases decay within
  months." Wikis "rot" as reality drifts from docs. ([Supered: why KBs go unused](https://www.supered.io/blog/internal-knowledge-base/) · [Pravodha: your wiki is a graveyard](https://pravodha.com/blogs/your-wiki-isnt-a-knowledge-base-its-a-graveyard))
- **[Fact]** Design systems fail from "project not product" mentality, big-bang
  launches, and drift when teams "route around the system because it stopped
  keeping up." Adoption happens only when the system "makes their work easier,"
  not because it exists. ([Why most design systems fail](https://medium.com/@codefarmer/why-most-design-systems-fail-03cf8c93a2d6) · [Design system maintenance / drift](https://www.magicpatterns.com/blog/design-system-maintenance))

**For (design mitigations exist).**
- **[Fact]** The decay literature's own fix — *an owner with a review cadence,
  plus delivery in the flow of work* — maps onto the design: a dedicated
  **curator agent** is the owner, and brokering-on-demand is "delivery in the
  flow." Automation of the upkeep is the lever that keeps KBs alive. ([Supered
  four-pillar fix](https://www.supered.io/blog/internal-knowledge-base/))
- **[Inference]** Because the "owner" is an agent and write-back rides the
  existing delegable §13 bookkeeping lane, the human-attention cost of curation
  could stay near zero — *if* the curator's harvest/de-stale steps are genuinely
  automated and not a queue of PRs the human must review.

**Net on (c):** **[Inference]** This is the leg most likely to fail silently. The
commons won't announce that it's stale; it will just quietly stop being worth
consulting. The single most important design decision is making curation an
automated agent responsibility with a freshness signal, not a human chore.

### Prior art (leg-agnostic)

- **[Fact]** The closest existing pattern is Superpowers' **instinct-import
  agent**, which grades sessions and "extracts the patterns that worked to promote
  them into reusable skills" — i.e. a harvester that promotes battle-tested
  material into a shared store. This is near-direct prior art that the curator
  concept is viable. ([obra/superpowers](https://github.com/obra/superpowers) · [Agentic skills frameworks compared](https://rywalker.com/research/agentic-skills-frameworks))
- **[Fact]** `SKILL.md` is now an open standard (agentskills.io) adopted by ~40
  clients; Cursor "Memories" persists conventions across sessions. Shared
  reusable-asset stores for agents are an established, converging pattern — the
  commons is not exotic. ([Claude Code methodologies ecosystem](https://claude-codex.fr/en/advanced/methodologies-ecosystem/))
- **[Fact]** The documented *gap* in these tools is exactly the commons' thesis:
  "subagents are session-scoped … skills define what to do but can't learn from
  doing it," and project knowledge "resets every session." A write-back commons
  targets a real, named gap. ([MemU: Cursor knowledge resets each session](https://memu.pro/blog/cursor-2-4-subagents-skills-memory))

### Riskiest-assumption verdict — for / against

- **FOR:** Example-grounding at k=1 has a large, well-replicated positive effect;
  copy-and-adapt (not shared-lib DRY) sidesteps the wrong-abstraction trap; a
  curator-as-owner maps onto the exact fix the KB-decay literature prescribes; and
  a harvest-and-promote agent already exists in the wild (Superpowers). The bet is
  credible.
- **AGAINST:** The lift is *conditional on retrieval precision* — irrelevant or
  bulky context degrades output, sometimes below no-context (context-rot,
  lost-in-the-middle). Clone economics warn that cross-project adaptation cost can
  meet regeneration cost. And curation decay is the best-evidenced failure mode of
  every comparable internal library. None of these kills the idea, but all three
  are real and the design must actively defend against each.

**Overall:** The premise is supported *in principle* but every supporting result
is conditional. The unknown is not "does grounding ever help" (it does) but
"does *this repo's* curator, on *this repo's* artifacts, clear the regeneration
bar without a precision or staleness tax." That is an empirical question only an
in-repo before/after can answer — which is why the cheap test below is the actual
decision input, not the literature.

### Recommended cheapest in-repo test (doubles as the regression guard)

A **paired tier-2 eval** in `evals/scenarios/`, mirroring the existing
`business-model` scenario shape (`scenario.md` frontmatter + `rubric.md` weighted
criteria + `checks.mjs` + `fixture/`). Design:

- **Two scenarios, one agent, same task.** Pick the **frontend** agent (highest
  genericness risk, most visible taste signal) and one concrete task: "scaffold
  the landing/auth shell for venture X."
  - `commons-cold/` — fixture has **no** commons; agent regenerates from scratch.
  - `commons-warm/` — fixture seeds a `commons/` area with **exactly one**
    battle-tested artifact (a prior venture's landing/auth component + its index
    entry) and the curator brokers it.
- **Judge measures the delta, not absolute quality.** Rubric criteria:
  - `[w=3] less-generic` — warm output reuses the seeded artifact's structure /
    tokens / conventions (name-, spacing-, pattern-level match to the seed) rather
    than the AI-generic default. This is the leg-(a) signal.
  - `[w=3] adapted-not-blind-copied` — warm output is *modified* to venture X
    (not a verbatim paste), evidencing copy-and-adapt, not clone. Leg (b).
  - `[w=2] precision-not-dilution` — warm run does **not** regress vs cold on
    correctness/coherence (guards against context-rot / lost-in-the-middle: proves
    the commons didn't *hurt*). This is the disconfirming check.
  - `[w=2] write-back-proposed` — the curator emits a delegable write-back PR when
    it improves the seed. Leg (c) upkeep signal.
  - `[w=1] cost-noted` — token/step count for warm vs cold is reported so the
    adaptation-vs-regeneration economics are visible.
- **Pass/kill wiring** (hand to the human as kill criteria, not a verdict):
  - **Pass** = warm beats cold on `less-generic` AND does *not* regress on
    `precision-not-dilution`, at the scenario `pass-bar` (suggest 0.75).
  - **Kill/hold** = warm is statistically indistinguishable from cold on
    genericness (leg a fails), OR warm regresses on precision (context tax
    dominates), OR warm output is a blind copy (leg b fails). Any one → do not
    build past the proof.
- **Why this is the cheapest honest test:** it is one agent, one task, two
  fixtures, ~$4 budget like the sibling scenarios; it needs no product code (only
  a seeded fixture and a rubric); and it becomes the feature's permanent
  regression guard the moment the feature ships — the same artifact validates and
  protects.

### Recommendation to the human (input to your go/no-go, not the decision)

**Proceed-with-changes — but gate the build on running the paired eval first.**
The three drivers: (1) the grounding lift is real but *precision-conditional*, so
the design must commit to k=1-style single-best-match brokering, not top-N RAG;
(2) copy-and-adapt is economically defensible for *high-taste, low-adaptation*
artifacts and dubious for anything you'd heavily rewrite — scope the first
increment accordingly; (3) curation decay is the best-evidenced risk, so
automated curator-ownership + a freshness signal is a build prerequisite, not a
follow-up. Run the `commons-cold` vs `commons-warm` eval before committing to the
`/ingest`+curator build; let its pass/kill result be your actual go/no-go.

## Validation result (paired eval, 2026-07-18)

Ran `commons-cold` vs `commons-warm` with the **opus** agent (sonnet judge),
`$2.35` total. Both passed at **100%** on the 0/1 rubric. Read honestly:

- **Mechanism — validated end-to-end.** Warm's frontend agent read
  `commons/index.md` + the exemplar before writing (`consulted-commons`), adapted
  it (`adapted-not-copied`: deterministic grep found **zero** Tend/plant leaks;
  CTA became "Start writing", headline rewritten, routes changed), and — unprompted
  — **improved** the exemplar by adding a `--color-accent-strong` token that closes
  the exact hardcoded-`#285e5a` gap the exemplar's own README flagged, then
  **proposed writing that fix back** (`write-back-noted`). The full consume →
  adapt → improve → write-back loop ran in one eval, with no product machinery.
- **No correctness regression** — `task-correct` = 1 in both; grounding did not
  dilute output (the disconfirming precision check held).
- **Genericness lift (leg a) — NOT demonstrated at this tier.** Opus *cold* already
  scored 100% on `not-ai-slop`, so both runs sat at the ceiling → zero measurable
  quality delta. This is the expected consequence of testing on the strongest
  model; it neither proves nor disproves that the commons de-slops a *weaker*
  agent's output. To measure leg (a), re-run on `sonnet` (more headroom) and/or a
  graded rubric.

**Read:** GO on the mechanism. The riskiest thing to build machinery for — that an
agent will actually consult, adapt-not-copy, and feed improvements back — works
and is safe. The commons' demonstrated value at top tier is **reuse fidelity + the
flywheel**, not de-slopping; the de-slopping claim is a cheap sonnet follow-up, not
a blocker.

---
_Exit V0 → V1 when the human gives an explicit go, informed by the validation._
_(2026-07-18: validation ran; mechanism GO, genericness lift unproven at opus tier.)_
