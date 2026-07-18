# Mission: portfolio-commons — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it before
ending a session. Deploys to `.plans/portfolio-commons.state.md`._

Gate policy: **human-merge**, adjusted **2026-07-18** (human choice) to **stacked
phases, one merge at end**: phase branches stack (`p2`←`p1`←…), a reviewer checkpoint
gates each phase, but there are **no intermediate merges**. At mission end, one PR
`feat/template-ingestion → main` for the human to review + merge; `/agentic-workflow:sync`
runs **once** (master → stamped `docs/WORKFLOW.md`) after all §-master edits land
(S2/S3/S4 all touch the master). Reviewer checkpoints still run per phase.
Mission started: **2026-07-18**.

## Checklist

- [x] S1 — Commons shape memo (branch `mission/portfolio-commons-p1`)
- [x] S2 — §13 commons amendment (branch `mission/portfolio-commons-p1`)
- [~] Checkpoint — phase 1 review **APPROVED** + shape locked; **merge pending human**
- [x] S3 — Author `commands/ingest.md` (branch `mission/portfolio-commons-p2`)
- [~] Checkpoint — phase 2 review **APPROVED** (stacked; no merge until mission end)
- [x] S4 — Author `agents/curator.md` + fold in the two phase-2 acceptance items (branch `mission/portfolio-commons-p3`)
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
- **S3 refinement — `/agentic-workflow:ingest` self-contained in increment 1**
  (decoupled from the not-yet-existent curator). The brief's "may spawn the curator"
  note would forward-ref `agents/curator.md` (authored in S4); lint's cross-ref check
  fails a forward agent/spawn ref. So the command does the copy + index-write itself,
  `allowed-tools` omits `Task`, and the body contains no "spawn" and no backticked
  `curator`-agent ref — curator is named only as a plain-word read-side concept. A
  later increment can route harvest through the curator once it exists.
- **S4 acceptance items (from the phase-2 review) — RESOLVED in S4 (2026-07-18):**
  (1) **Collision/refresh guard** — DONE. `commands/ingest.md` step 2 now checks
  whether `commons/code/<slug>/` or an `index.md` entry for the slug exists before
  writing; no collision → fresh harvest; collision without `--refresh` → **stop**
  (no overwrite, no duplicate row); collision with `--refresh` → **update in
  place** (re-harvest, re-pin, rewrite the one entry, bump `last-reviewed`).
  `--refresh` added to `argument-hint`; step 5 staleness note reconciled with the
  deliberate re-date. `curator.md` records this refresh-on-source-advance as
  curator-owned de-stale semantics. (2) **Slug validation** — DONE. Step 2
  enforces `^[a-z0-9-]+$` and stops (never sanitize-and-continue) before the slug
  flows into any `mkdir`/`cp`/`git clone` path (traversal/injection guard).

## Handoff log (newest first)

- **2026-07-18 · S4 (backend)** — Authored
  `plugins/agentic-workflow/agents/curator.md`. Frontmatter: `name: curator`
  (= filename), long third-person trigger-oriented `description` with a hard
  NEVER/NOT boundary (curates + brokers ONE best match, never a top-N dump; does
  not decide product direction, ship product code, or merge), comma-separated
  `tools: Read, Write, Edit, Bash, Grep, Glob` (no `Task` — does not spawn), and
  **`model:` omitted** (locked D6 default/opus tier — the plugin convention is
  omit-to-inherit-top; only writer/analyst/chronicler pin sonnet). Body — commons
  lifecycle: **find/harvest** (owns *what* is worth keeping + how it's tagged; the
  `/agentic-workflow:ingest` write path exists), **broker k=1** (curates the index
  so it yields one best match; states the screenful-per-type / consumer-consults->1
  escalation trigger to a dedicated single-match broker), **write/upkeep** (owns
  the freshness signal — stale on `last-reviewed` age OR source-advance; surfaces,
  never auto-mutates; re-harvests + owns the `--refresh` de-stale semantics),
  **write-back** (sole writer; consumer improvements → delegable §13 bookkeeping
  PR), and a **hard boundary**. **Both phase-2 acceptance items implemented in
  `commands/ingest.md`** (see Deviations, now resolved): (1) collision/refresh
  guard + `--refresh` in `argument-hint`; (2) slug `^[a-z0-9-]+$` validation before
  any `mkdir`/`cp`/`git clone`. Doc surfaces: plugin `README.md` agents table row,
  root `README.md` agents list, WORKFLOW master §6 roles table row + §13 (the
  existing curator prose now names the real `` `curator` `` agent). `node
  tools/lint.mjs` → **clean**. Master edit (§6 + §13) — stamped `docs/WORKFLOW.md`
  still propagated once by `/agentic-workflow:sync` at mission end, not hand-edited.

- **2026-07-18 · Phase-2 checkpoint (reviewer)** — **APPROVE**. Re-ran
  `node tools/lint.mjs` → clean; `/agentic-workflow:ingest` present + namespaced in all
  three docs; confirmed the index-write matches the §13 schema field-for-field; verified
  the fail-closed guardrails (registry path from §10 or stop; first-party-only; PR'd
  bookkeeping, never pushes the registry default branch; nothing committed here);
  confirmed no forward cross-ref (no Task/spawn, curator only a plain-word concept);
  stamped copy untouched. Scorecard: Architecture 3/3 · DX 3/3 · Security 2/3 · QA 2/3.
  Two minor findings → **S4 acceptance items** (collision/refresh guard; slug
  validation), no corrective retry required before this stacked phase. Stacked policy —
  no merge now.

- **2026-07-18 · S3 (backend)** — Authored
  `plugins/agentic-workflow/commands/ingest.md`. Frontmatter: one-line
  `description`, `argument-hint: [git-url-or-path] [--type code]`, bracketed
  `allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]` (no `Task`). Body (adopt.md
  idiom, numbered steps): type-first / per-type `commons/code/<slug>/` placement,
  first-party-only scope; (1) resolve the §10 Portfolio registry-repo path, stop if
  unset; (2) `git clone`/`cp` the source in via Bash; (3) pin provenance (source repo
  + commit) and derive stack/tags; (4) write the per-entry README with adaptation
  notes; (5) `Edit` `commons/index.md` with the full §13 schema entry
  (slug·path·type·stack·tags·provenance·licence·why-good·reuse-match·`last-reviewed`=today);
  (6) hand off as a delegable §13 bookkeeping PR in the registry repo (merge only under
  a recorded delegation, never push its default branch; nothing committed in THIS repo).
  **Curator hazard handled** — command is self-contained (no `Task`, no "spawn", no
  backticked `curator`-agent ref); see Deviations. Doc mentions added: root
  `README.md` command list, plugin `README.md` **Machinery** group, WORKFLOW master §13
  (named `/agentic-workflow:ingest` in the existing "ingest capability" sentence).
  `node tools/lint.mjs` → **clean**.

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

Next up: **Phase-3 checkpoint** — the fresh-context `reviewer` re-runs `node
tools/lint.mjs` (must be clean) and diff-reviews `base..head` for the `curator`
agent (k=1 brokering + freshness + hard boundary unambiguous; `model:` correctly
omitted for the opus tier) and the two `ingest.md` guards (collision/refresh +
slug validation). Then **Phase 4 / S5** — the `frontend` agent consults the
commons (conditioned on a commons existing, so `commons-cold` stays green) and the
write-back path lands, on `mission/portfolio-commons-p4` (stacked off p3). A later
increment can route `/agentic-workflow:ingest` harvest through the `curator`.
(Stacked-phases policy: no intermediate merge; one `/agentic-workflow:sync` after
all §-master edits land — S2/S3/S4 all touched the master; the human merges at
mission end.)
