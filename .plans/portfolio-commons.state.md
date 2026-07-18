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
- [~] Checkpoint — phase 3 review **APPROVED** (3·3·3·3; stacked, no merge)
- [x] S5 — Frontend consults the commons; write-back path (branch `mission/portfolio-commons-p4`)
- [~] Checkpoint — phase 4 review **APPROVED** (3·3·3; both evals green; stacked, no merge)
- [x] S6 — Guard + docs + version bump (branch `mission/portfolio-commons-p5`)
- [ ] Checkpoint — phase 5 review + evals + merge (mission-end wrap)

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
- **S6 fold-in items (deferred nits to close before release):** (1) **Phase-1 Security
  nit** — **RESOLVED in S6 (2026-07-18).** Added one explicit sentence to WORKFLOW
  **master** §13 "Registry bookkeeping is delegable" lane: merging a commons exemplar
  ships nothing to production — copied `code/` under `commons/` runs nowhere in the
  registry and reaches a live product only when a consuming venture copy-adapts it
  **through that venture's own review gates**, so "no runtime" means the commons is a
  staging library, never a deploy path or a way for agent-merged code to skip a
  product's own review. Master only; `/agentic-workflow:sync` propagates to the stamped
  `docs/WORKFLOW.md` at mission end. (2) **Phase-4 nit — DEFERRED (post-mission
  follow-up), NOT implemented in S6.** Reason: adding a
  "did-not-hallucinate-a-commons" negative criterion changes `commons-cold/rubric.md`
  and would force re-certifying the cold eval; the phase-4 checkpoint transcript already
  confirmed the no-hallucinate behavior (single bounded `find` probe → empty → built
  from scratch), so this is hardening, best done as its own small post-mission change,
  not bundled into a release-prep session. Left `commons-cold/rubric.md` unchanged.

## Handoff log (newest first)

- **2026-07-18 · S6 (backend)** — Release prep, docs/JSON/§-master prose only (no
  code, no eval fixtures/rubrics). (1) **Version bump** —
  `plugins/agentic-workflow/.claude-plugin/plugin.json` `1.36.0 → 1.37.0` (minor;
  backward-compatible feature). (2) **CHANGELOG** — added a `## [Unreleased]`
  `### Added` **Portfolio Commons** entry (Keep-a-Changelog): the §13 writable
  commons surface, `/agentic-workflow:ingest` (code type, provenance + index entry,
  slug + collision/refresh guard, first-party-only), the `curator` agent (k=1
  brokering, freshness signal, sole-writer write-back), the frontend
  consult-and-write-back beat, and the `commons-warm`/`commons-cold` regression evals.
  (3) **Guard confirmed** — `commons-warm` + `commons-cold` both present under
  `evals/scenarios/` (each has `scenario.md`) and **auto-discovered** by
  `evals/run.mjs` (`readdirSync(SCENARIOS_DIR)` filtered on presence of `scenario.md`,
  line 29–30) — no registration needed; both already in the `evals/README.md`
  scenarios table (confirmed). (4) **Doc completeness** — verified `ingest` +
  `curator` each appear in all three surfaces: root `README.md` (agents+commands
  lists, ll. 32–33), plugin `README.md` (curator agents-table row @ 97,
  `/agentic-workflow:ingest` command-table row @ 149), WORKFLOW master (Curator §6
  role @ 299, §13 curator prose @ 734, ingest @ 739). No additions needed. (5)
  **Nit 1 RESOLVED** — one explicit sentence added to WORKFLOW **master** §13
  delegable lane (see Deviations). (6) **Nit 2 DEFERRED** — `commons-cold/rubric.md`
  left unchanged (post-mission follow-up; reason in Deviations). **Gate:**
  `node tools/lint.mjs` → **clean** (cross-refs resolve, §-integrity intact after the
  §13 sentence, namespaced command refs). **Did NOT re-run the paired eval** — phase-5
  changes are non-behavioral (docs/version/§13 prose); the phase-4 green artifacts
  remain representative. Stamped `docs/WORKFLOW.md` untouched — `/agentic-workflow:sync`
  propagates the §13 sentence at mission end. Stacked policy — no merge now.

- **2026-07-18 · Phase-4 checkpoint (reviewer)** — **APPROVE** (DX 3/3 · Architecture
  3/3 · QA 3/3). `node tools/lint.mjs` → clean. Eval verified via **result artifacts**
  (not re-run — already green twice; re-run = ~$3 for no new signal): warm
  (`…16-58-00…/commons-warm.json`) passed 100%, `consulted-commons`/`adapted-not-copied`/
  `write-back-noted` all 1, **zero Tend leakage in written content** (Tend hits are reads
  of the source exemplar) = genuine copy-and-adapt; cold (`…17-10-33…/commons-cold.json`)
  passed 100%, transcript shows a single bounded `find -iname commons` probe → empty →
  built from scratch, **no hallucinated commons**. Conditional beat consistent with
  `curator.md` (read-protocol, k=1, sole-writer, delegable write-back). Non-blocking
  observation folded into S6 (below). Stacked policy — no merge now. NOTE: the two
  background eval runs were killed by the environment mid-`commons-cold`; the cold run
  was completed in the foreground (result artifact above is authoritative).

- **2026-07-18 · S5 (frontend)** — Added a **conditional commons beat** inside the
  "Orient first" section of `plugins/agentic-workflow/agents/frontend.md` (right after
  the "find the existing design system" sentence, ~line 23). Exact wording:
  "**Consult the commons — only where one exists.** *Where a portfolio commons is
  present* (a `commons/index.md` in the §13 registry/project), read it and pick the
  **single best match (k=1, never a pile)**, then **copy-and-adapt** it to THIS project:
  rewrite the product name, copy, routes, and tokens, follow the entry's README
  adaptation notes, and close any token gap it flags — never blind-copy. *Where no
  commons exists, proceed exactly as today* — build from the existing design system /
  from scratch; introduce nothing and do not go hunting for a commons that isn't there.
  When you improve reused material (close a flagged gap, fix a bug), flag it for the
  `curator` to write back into the commons as a delegable §13 bookkeeping PR — you never
  write to the commons yourself." The where-exists / where-none conditional is
  symmetric and italic-marked so a mid-tier reader cannot read it as "always assume a
  commons" (keeps `commons-cold` green); k=1 + copy-and-adapt + write-back-via-`curator`
  keep `commons-warm` green. Consistent with `curator.md` (read-protocol against
  `commons/index.md`, curator is sole writer). `node tools/lint.mjs` → **clean**
  (`` `curator` `` ref resolves; frontmatter untouched). Eval fixtures/rubrics/other
  agents/product code untouched. **Did NOT run the cold eval myself** — deferred the
  `~$1–3` cold sanity-run to the reviewer's paired run at the checkpoint.

- **2026-07-18 · Phase-3 checkpoint (reviewer)** — **APPROVE** (Architecture 3/3 ·
  DX 3/3 · Security 3/3 · QA 3/3). Re-ran `node tools/lint.mjs` → clean. Both phase-2
  findings verified **genuinely fixed**: slug `^[a-z0-9-]+$` is anchored, stops (not
  sanitize-and-continue), and provably precedes any `mkdir`/`cp`/`git clone`; the
  collision guard is a real precondition (dir OR index-entry check → stop without
  `--refresh`, update-in-place with it, never overwrite+duplicate). Curator coherent
  with §13 (k=1 + escalation trigger, freshness age-OR-source-advance surfaced-never-
  auto-mutated, write-back as delegable bookkeeping, hard boundary); `model:` correctly
  omitted (D6 opus); §6 roles row + §13 consistent, section order intact; stamped copy
  untouched. No unclaimed changes. Stacked policy — no merge now.

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

Next up: **Phase-5 checkpoint + mission-end wrap** — all six sessions (S1–S6) are
authored; only the phase-5 checkpoint remains. The reviewer re-runs `node tools/lint.mjs`
(clean at S6), diff-reviews `base..head`, and re-runs the paired eval at their
discretion (S6 changes are non-behavioral docs/version/§13-prose — the phase-4 green
artifacts remain representative). **Mission-end wrap:** run `/agentic-workflow:sync`
**once** (master → stamped `docs/WORKFLOW.md`; propagates the S2/S3/S4 §-master edits +
the S6 §13 delegable-lane sentence — S2/S3/S4/S6 all touched the master, but sync runs
only once, at the end); then the **human reviews + merges the single PR
`feat/template-ingestion → main`** (stacked-phases policy: no intermediate merges).
**Nit 1 resolved** (§13 downstream-gate sentence, in master). **Post-mission follow-ups:**
(a) nit 2 — add a "did-not-hallucinate-a-commons" negative criterion to
`commons-cold/rubric.md` as its own small change (re-certifies the cold eval); (b) route
`/agentic-workflow:ingest` harvest through the `curator`; (c) seed a real first commons
in the registry repo (one runtime `/agentic-workflow:ingest`); (d) optional graded/sonnet
`commons-warm` re-run for leg-(a) genericness. All out of this mission's scope.
