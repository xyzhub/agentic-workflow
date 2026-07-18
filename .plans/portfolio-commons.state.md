# Mission: portfolio-commons — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it before
ending a session. Deploys to `.plans/portfolio-commons.state.md`._

Gate policy: **human-merge (default)** — pause for the human to merge each phase
branch on APPROVE. Recorded at mission start.
Mission started: **2026-07-18**.

## Checklist

- [x] S1 — Commons shape memo (branch `mission/portfolio-commons-p1`)
- [x] S2 — §13 commons amendment (branch `mission/portfolio-commons-p1`)
- [~] Checkpoint — phase 1 review **APPROVED** + shape locked; **merge pending human**
- [ ] S3 — Author `commands/ingest.md` (branch `mission/portfolio-commons-p2`)
- [ ] Checkpoint — phase 2 review + merge
- [ ] S4 — Author `agents/curator.md` (branch `mission/portfolio-commons-p3`)
- [ ] Checkpoint — phase 3 review + merge
- [ ] S5 — Frontend consults the commons; write-back path (branch `mission/portfolio-commons-p4`)
- [ ] Checkpoint — phase 4 review + paired eval + merge
- [ ] S6 — Guard + docs + version bump (branch `mission/portfolio-commons-p5`)
- [ ] Checkpoint — phase 5 review + evals + merge

## Open questions

_Mirrored from the master plan — resolve before execution. (b) items are the scope of
the S1 architect memo; the human can answer from the recommendations or confirm at
the phase-1 checkpoint._

**(a) Human scope / policy**
- Licensing/attribution policy for ingested third-party code — **Rec:** first-party
  (own-venture) harvests only in the first increment; carry `licence` + `provenance`
  fields now, defer third-party ingest.
- First-increment artifact class within high-taste/low-adaptation — **Rec:** front-end
  taste-anchoring components (landing/auth shells, token-driven SFCs).

**(b) Technical → architect memo (S1)**
- Commons storage layout + index schema fields — **Rec:** adopt `commons-warm` shape;
  fields slug/path/stack/tags/provenance/licence/why-good/reuse-match/last-reviewed.
- Freshness/staleness signal — **Rec:** `last-reviewed` date + pinned source-commit;
  stale when aged past threshold or source advanced past pin.
- Copy-and-adapt + de-stale path — **Rec:** provenance backpointer; curator re-harvests
  on source advance; write-back as delegable §13 PR.
- Brokering interface — **Rec:** read-protocol against the curated index (k=1); reserve
  curator-spawn for large/ambiguous commons.
- Curator model tier — **Rec:** default (opus) for brokering precision; `/tune` can
  drop to sonnet.

## Deviations

- **Phase-1 review nits (non-blocking, deferred)** — reviewer flagged two, neither
  requiring a corrective retry: (1) **DX** — the S1 memo cites §13 by hard line
  numbers that already rot after the S2 edit; prefer citing by subsection heading
  (cosmetic, internal to the memo). (2) **Security** — the delegable lane now covers
  `code/` copied into `commons/` merged without independent review; the framing holds
  (registry has no runtime; a commons exemplar only reaches production when a consumer
  copy-adapts it through that venture's own gates), but that downstream gate is
  implicit at the §13 delegation — add one explicit sentence in a later increment so
  "no runtime" doesn't read as "agent-merged code is safe."

## Handoff log (newest first)

- **2026-07-18 · Phase-1 checkpoint (reviewer)** — **APPROVE**. Re-ran
  `node tools/lint.mjs` → clean; confirmed the `docs/WORKFLOW.md` stamped copy is
  untouched; verified §13 implements all six locked dimensions (D1–D5 in §13, D6
  correctly deferred to `agents/curator.md` frontmatter); forward-cross-ref deferral
  confirmed deliberate (lint scans `templates/`, not `docs/`). Scorecard
  (diff-touched lenses): Architecture 3/3 · DX/protocol-clarity 2/3 · Security 2/3 ·
  QA/gates 3/3. Two minor non-blocking findings → Deviations. **Gate: human-merge**
  — awaiting the human to merge `mission/portfolio-commons-p1`.

- **2026-07-18 · S2 (backend)** — Amended WORKFLOW **master** §13
  (`plugins/agentic-workflow/templates/WORKFLOW.md`) to the locked shape: added the
  writable **`commons/`** copy-holding surface (`commons/index.md` + per-type
  `commons/<type>/<slug>/`, `code/` only in increment 1), contrasted with
  `registry.md`/`precedents.md` staying pointers-never-copies; folded commons writes
  into the "bookkeeping is delegable" scope; recorded the index-entry schema (slug ·
  path · type · stack · tags · provenance[venture·repo·commit] · licence ·
  why-it's-good · reuse-match · `last-reviewed`) and the freshness signal
  (age-threshold OR source-advance, surfaced never auto-mutated); described the
  curator lifecycle, the k=1 read-protocol brokering, and the escalation trigger.
  Curator/ingest phrased as **descriptive concepts** (no backticked `` `curator` ``
  agent / `/…:ingest` command refs) because those files don't exist until S3/S4 and
  lint's cross-ref check would fail a forward ref — S3/S4 add the concrete names.
  `node tools/lint.mjs` → **clean**. **Checkpoint item:** master edit only; the
  stamped copy `docs/WORKFLOW.md` is propagated by `/agentic-workflow:sync`, not
  hand-edited.

- **2026-07-18 · S1 (architect)** — Authored shape memo
  `docs/product/decisions/2026-07-18-commons-shape.md`: six dimensions, each 2–3
  real options + recommendation + reversal cost. Recs: (1) storage = per-type dirs
  `commons/{type}/<slug>/` (the fixture shape); (2) index schema = fixture fields +
  `licence` + `provenance`(repo·commit) + `last-reviewed`; (3) freshness = age-threshold
  OR source-advance flag (both signals); (4) refresh = provenance backpointer + curator
  re-harvest + delegable §13 write-back PR; (5) brokering = read-protocol against the
  index by default (k=1, keeps eval valid), curator-spawn reserved for large/ambiguous
  commons; (6) curator model = default/opus tier, `/tune` to sonnet if brokering proves
  mechanical. All reversal costs LOW. `node tools/lint.mjs` → clean (memo under `docs/`,
  no incidental breakage). No protocol/code touched (that is S2).

Next up: **Human merges `mission/portfolio-commons-p1`** (phase-1 APPROVED by the
reviewer, shape locked). On merge, run `/agentic-workflow:sync` to propagate the §13
master edit into the stamped `docs/WORKFLOW.md` (do NOT hand-edit it). Then
**Phase 2 / S3** — author `plugins/agentic-workflow/commands/ingest.md`.
