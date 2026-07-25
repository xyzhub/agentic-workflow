# Mission: sales-doc-architecture — session briefs

_One brief per session, pre-resolved so an execution session never explores.
Authored by the `planner` (WORKFLOW.md §5)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/sales-doc-architecture.md` · Ledger:
`.plans/sales-doc-architecture.state.md`

Gate every phase with `node tools/lint.mjs` (clean = ready to checkpoint). It
already runs `checkHookBehavior` → `tools/hook-test.mjs`; Phase 3 adds
`checkMarkerMutation` → `tools/marker-test.mjs` to the same gate.

## Large-files table

| File | Lines |
|---|---|
| `tools/lint.mjs` | 318 |
| `tools/hook-test.mjs` | 165 |
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 877 |
| `plugins/agentic-workflow/templates/overview.html` | 215 |
| `plugins/agentic-workflow/agents/chronicler.md` | 72 |
| `plugins/agentic-workflow/agents/marketing.md` | 78 |
| `plugins/agentic-workflow/agents/compass.md` | 116 |
| `plugins/agentic-workflow/commands/sync.md` | 51 |
| `plugins/agentic-workflow/commands/adopt.md` | 100 |
| `plugins/agentic-workflow/templates/architecture.md` | 49 |
| `plugins/agentic-workflow/templates/interface-contract.md` | 41 |
| `plugins/agentic-workflow/templates/business-pricing.md` | 28 |
| `plugins/agentic-workflow/templates/idea.md` | 34 |
| `plugins/agentic-workflow/templates/launch-positioning.md` | 17 |
| `plugins/agentic-workflow/templates/prd.md` | 62 |
| `plugins/agentic-workflow/agents/business.md` | 67 |
| `plugins/agentic-workflow/agents/ops.md` | 44 |

### Template inventory (Phase-0 frontmatter targets, measured `wc -l`)

All under `plugins/agentic-workflow/templates/`. Exempt: `WORKFLOW.md` (protocol
master), `overview.html` (HTML). The 24 `.md` files below all take frontmatter.

| Template | Lines | status | owner-agent | refresh-trigger |
|---|---|---|---|---|
| architecture.md | 49 | semi-static | architect | event |
| business-executive-summary.md | 31 | semi-static | business | stage-transition |
| business-model.md | 32 | semi-static | business | event |
| business-pricing.md | 28 | semi-static | business | event |
| decision-log.md | 9 | frozen | curator | never |
| decision-memo.md | 51 | frozen | architect | never |
| flight-plan.md | 51 | semi-static | planner | event |
| idea.md | 34 | frozen | researcher | never |
| interface-contract.md | 41 | semi-static | backend | event |
| launch-announcement.md | 16 | semi-static | marketing | event |
| launch-content-plan.md | 25 | semi-static | marketing | release |
| launch-landing-page.md | 18 | semi-static | marketing | event |
| launch-plan.md | 29 | semi-static | marketing | event |
| launch-positioning.md | 17 | semi-static | marketing | event |
| mission-plan.md | 49 | semi-static | planner | event |
| mission-sessions.md | 41 | semi-static | planner | event |
| mission-state.md | 45 | living | planner | every-ship |
| north-star.md | 42 | living | compass | every-ship |
| prd.md | 62 | semi-static | business | stage-transition |
| publish-log.md | 18 | living | marketing | every-ship |
| publish-queue.md | 42 | living | marketing | every-ship |
| registry.md | 9 | living | curator | every-ship |
| session-handoff.md | 46 | semi-static | planner | event |
| ux-brief.md | 55 | semi-static | designer | event |

_`owner-agent` need only be a real agent stem (SD2 — no remit cross-check); the
values above are all valid stems. Confirm any you prefer to reassign; the gate
accepts any of the 20 agent stems._

---

## Phase 0 — frontmatter convention + lint (branch: `mission/sales-doc-architecture-p0`)

### S1 — frontmatter on all templates + `checkTemplateFrontmatter`

- **Reads**: `tools/lint.mjs` (318 lines — focus `frontmatter()` L44–54, the
  `frontmatter` regex parser; `checkFrontmatterYaml()` L206–230 as the sibling
  pattern; the checks array L308; `mdFiles()` L30–31); the 24 template targets in
  the inventory table (all ≤62 lines — read headers only to place the fence).
- **Do** (ONE commit — SD4 invariant): (1) add a `---`-fenced frontmatter block
  ABOVE the `#` heading of each of the 24 `.md` templates with the `status /
  owner-agent / refresh-trigger` values from the inventory table; (2) add
  `checkTemplateFrontmatter()` to `tools/lint.mjs` — iterate `mdFiles(templates)`
  minus the OQ1 exemptions (`WORKFLOW.md`, and skip `.html` by extension), reuse
  the existing `frontmatter()` parser, assert presence of all three keys, enum
  membership for `status` ∈ {living, semi-static, frozen} and `refresh-trigger` ∈
  {every-ship, stage-transition, release, event, never}, `owner-agent` ∈ the
  agents set (build it like `checkCrossRefs` L129), and the fail-closed
  `frozen ⇒ refresh-trigger: never`; (3) register it in the checks array L308.
- **Verify**: `node tools/lint.mjs` → clean. Then manually flip one template to
  `frozen` + `release`, re-run, confirm it FAILS with the frozen-rule message,
  revert.
- **Read budget**: ~700 lines. Suits: `devops` (tooling/lint) — backend-capable.

**Checkpoint** ends Phase 0 — fresh `reviewer` re-runs the gate, diff-reviews
`base..head`, human merges (D3).

---

## Phase 1 — feature→benefit catalog (branch: `mission/sales-doc-architecture-p1`)

### S2 — `sales-feature-benefit-catalog.md` (living substrate)

- **Reads**: `plugins/agentic-workflow/templates/overview.html` (215 lines —
  ONLY the marker idiom, `data:` regions at L145–208, to copy the
  `<!-- data:X -->`/`<!-- /data:X -->` pairing); `templates/launch-positioning.md`
  (17 lines — the single source of claims the catalog defers to);
  `templates/business-pricing.md` (28 lines, price-line reference target for
  later sessions — skim). Brief §"Sales kit" and §"Living mechanism" for the
  column contract.
- **Do**: create `templates/sales-feature-benefit-catalog.md` with frontmatter
  `status: living / owner-agent: chronicler / refresh-trigger: every-ship`; an
  append-only `<!-- data:capabilities -->` … `<!-- /data:capabilities -->`
  region with a table capability │ shipped-ref │ client outcome ("so you can…") │
  proof │ demo-moment │ since-version; the `_unwritten_` sentinel documented as
  the benefit-queue convention; static seed content + a header note that only the
  chronicler writes inside the markers and never authors a claim.
- **Verify**: `node tools/lint.mjs` clean; grep confirms the marker pair is
  balanced; the template is a valid Markdown table.
- **Read budget**: ~300 lines. Suits: `frontend` / `writer`-style doc authoring;
  `backend`-capable.

**Checkpoint** ends Phase 1 — fresh `reviewer`, human merge (D3).

---

## Phase 2 — sales kit, usable half (branch: `mission/sales-doc-architecture-p2`)

_Satisfies D4 "usable". Two sessions; S3 and S4 touch disjoint new files but both
edit `marketing.md`, so run them **sequentially** (S3 adds the marketing sales
block, S4 extends it) — not parallel._

### S3 — playbook + sell-sheet + sales-kit index + marketing ownership

- **Reads**: `plugins/agentic-workflow/agents/marketing.md` (78 lines whole —
  anchor the "Deliverables — one file per asset" block L37–55 to add a
  `docs/product/sales/` block; the boundary section L72–78 stays intact);
  `templates/sales-feature-benefit-catalog.md` (from S2 — the facts substrate);
  `templates/launch-positioning.md` (17 lines — the claims source);
  `templates/business-pricing.md` (28 lines — sell-sheet price line references
  it). Brief §"Sales kit" for the playbook's 9-section outline + sell-sheet
  shape.
- **Do** (ONE commit — SD4 invariant, templates + their `marketing.md`
  references together): create `templates/sales-playbook.md` (9 sections §1–§9
  per brief L44; §4 live top-5 from catalog, §9 auto-appended what's-new),
  `templates/sales-sell-sheet.md` (value prop → `data:top-benefits` region →
  proof → price line referencing pricing → CTA, plus a `data:whats-new` region),
  `templates/sales-kit.md` (index listing every kit file); each carries
  frontmatter (playbook `semi-static / marketing / release`; sell-sheet `living /
  chronicler / every-ship`; sales-kit `semi-static / marketing / release`).
  Extend `marketing.md` with a `docs/product/sales/` deliverables block pointing
  at the `templates/sales-*.md` files (deployed foldered path, flat template
  source per SD4).
- **Verify**: `node tools/lint.mjs` clean (`checkTemplateRefs` resolves every new
  `templates/sales-*.md` mention in `marketing.md`); marker pairs balanced in the
  sell-sheet.
- **Read budget**: ~250 lines + authored content. Suits: `marketing`/`writer`
  authoring.

### S4 — objections-faq · battlecard · discovery-guide · demo-script · proof-points

- **Reads**: `plugins/agentic-workflow/agents/marketing.md` (the sales block from
  S3); `templates/sales-kit.md` (the index to extend);
  `templates/launch-positioning.md` (17 lines — battlecard/objections derive
  claims from it). Brief §"Sales kit" L46 for each file's remit.
- **Do** (ONE commit): create `templates/sales-objections-faq.md`,
  `templates/sales-battlecard.md` (vs alternatives incl. status-quo),
  `templates/sales-discovery-guide.md`, `templates/sales-demo-script.md`
  (re-validated each release note), `templates/sales-proof-points.md` (numbers
  only from analyst; "unmeasured stays unmeasured" discipline; NO fabricated case
  studies — deferred per brief §"NOT in v1"). Each carries frontmatter
  (`semi-static / marketing / release`, except proof-points `semi-static /
  analyst / event`). Add all five to the `sales-kit.md` index and the
  `marketing.md` sales block.
- **Verify**: `node tools/lint.mjs` clean; every new `templates/sales-*.md`
  reference resolves.
- **Read budget**: ~150 lines + authored content. Suits: `marketing`/`writer`.

**Checkpoint** ends Phase 2 — fresh `reviewer`, human merge (D3).

---

## Phase 3 — [STRICT] living wiring (branch: `mission/sales-doc-architecture-p3`)

_Satisfies D4 "living". **HARD boundary, STRICT checkpoint (D2)** — it changes the
core `chronicler` agent and auto-writes docs. Does NOT merge until the marker
fixture is green in `node tools/lint.mjs`. Two sessions, sequential._

### S5 — chronicler + marketing living wiring

- **Reads**: `plugins/agentic-workflow/agents/chronicler.md` (72 lines whole —
  anchor "Sources" L18–27 and "Artifact 3 — overview.html" L46–65 as the exact
  marker-writing pattern to mirror for the sales docs; "Invocation contract"
  L66–72 for the ≤10-line return where the `_unwritten_` count is named);
  `plugins/agentic-workflow/agents/marketing.md` (78 lines — the "evidence-backed"
  stance L29–35 and the sales block from Phase 2, to add the benefit-fill beat);
  `templates/sales-feature-benefit-catalog.md` +
  `templates/sales-sell-sheet.md` (the marker regions being written).
- **Do**: extend `chronicler.md` — a new artifact/section instructing it to
  rewrite ONLY inside the catalog `data:capabilities` (append-only) and
  sell-sheet `data:top-benefits`/`data:whats-new` regions from CHANGELOG/ledger
  (PR-cited), append each new capability with benefit `_unwritten_`, NEVER author
  a claim, and name the `_unwritten_` count + marketing hand-off in the ≤10-line
  return. Extend `marketing.md` — a beat that fills `_unwritten_` benefits with
  evidence-gated language (every claim traces to shipped behavior/research).
- **Verify**: `node tools/lint.mjs` clean; the chronicler's marker-only scope and
  "never authors a claim" rule are explicit in prose.
- **Read budget**: ~350 lines. Suits: `backend` (agent-contract precision).

### S6 — marker-only-mutation fixture + lint gate + compass stamp

- **Reads**: `tools/hook-test.mjs` (165 lines whole — the EXACT pattern to clone:
  throwaway-dir harness, fixture inputs, `check()` helper, non-zero exit on
  failure); `tools/lint.mjs` (`checkHookBehavior()` L294–306 — the delegation
  shape to copy; checks array L308); `plugins/agentic-workflow/agents/compass.md`
  (116 lines — anchor its staleness/refresh idiom for the `Last refreshed` stamp
  pattern to reuse for semi-static docs).
- **Do** (ONE commit): create `tools/marker-test.mjs` (clone hook-test structure)
  that takes a catalog/sell-sheet fixture, applies a simulated chronicler update,
  and asserts (a) bytes OUTSIDE every `data:*` marker pair are byte-identical
  before/after, (b) `data:capabilities` only GAINS rows (append-only), (c) a
  positioning claim is never introduced; add `checkMarkerMutation()` to
  `tools/lint.mjs` delegating exactly like `checkHookBehavior()` and register it
  in the checks array L308. Add a `Last refreshed` + trigger stamp (compass
  pattern) to the semi-static docs so staleness is flagged, never auto-rewritten.
- **Verify**: `node tools/lint.mjs` clean AND now runs the marker fixture; `node
  tools/marker-test.mjs` passes standalone; deliberately mutate a byte outside a
  marker in the fixture → confirm it FAILS, revert.
- **Read budget**: ~600 lines. Suits: `devops`/`security` (fail-closed test
  authoring).

**Checkpoint [STRICT]** ends Phase 3 — fresh `reviewer` re-runs the FULL gate
(including the new marker fixture), diff-reviews `base..head` with extra scrutiny
on the chronicler contract change, confirms no auto-authored claim path exists.
Human merge only after the fixture is green (D2).

---

## Phase 4 — engineering folder + /sync migration + de-dup (branch: `mission/sales-doc-architecture-p4`)

_Two sessions, sequential (S8 de-dup depends on the engineering paths S7 lands)._

### S7 — `/sync` docs-layout migration + deployed engineering paths

- **Reads**: `plugins/agentic-workflow/commands/sync.md` (51 lines whole — anchor
  the numbered steps; add the migration step alongside §2–§3);
  `plugins/agentic-workflow/commands/adopt.md` (100 lines — L60–80 show how docs
  land in `business/`/`launch/` folders, the convention to align to);
  `templates/architecture.md` (49) + `templates/interface-contract.md` (41 — the
  two flat docs that move to `engineering/`).
- **Do**: add an idempotent docs-layout reconciliation step to `sync.md` — detect
  flat `docs/product/architecture.md` + `docs/product/interface-contract.md`,
  `git mv` into `docs/product/engineering/`, fix intra-doc links, report + stage
  for HITL, skip silently when already foldered; filenames unchanged (SD1). Point
  the writing agents' references at the deployed `docs/product/engineering/`
  paths.
- **Verify**: `node tools/lint.mjs` clean; re-reading the sync step confirms the
  already-foldered case is a no-op (idempotent).
- **Read budget**: ~250 lines. Suits: `devops` (migration tooling).

### S8 — de-dup single-sourcing

- **Reads**: `templates/business-pricing.md` (28), `templates/idea.md` (34),
  `templates/launch-positioning.md` (17) — the three single sources; then grep
  the template + agent set for `must agree with` / restated pricing / problem /
  claims prose to find each duplication site.
- **Do**: single-source pricing → `business/pricing.md`, problem → `idea.md`,
  claims → `positioning.md`; replace every "must agree with X" prose contract with
  an explicit reference to the single source — **never delete the constraint,
  reference it**.
- **Verify**: `node tools/lint.mjs` clean; grep confirms no residual "must agree
  with" restatements; each reference resolves.
- **Read budget**: ~200 lines. Suits: `writer`/`backend` (careful prose edits).

**Checkpoint** ends Phase 4 — fresh `reviewer`, human merge (D3).

---

## Phase 5 — runbook + tracking-plan templates (branch: `mission/sales-doc-architecture-p5`)

### S9 — `engineering-runbook.md` (V4) + `engineering-tracking-plan.md` (V3)

- **Reads**: `plugins/agentic-workflow/templates/WORKFLOW.md` — grep-first the
  `runbook` and `tracking-plan` protocol references (find the anchor, read ±40),
  do NOT read the 877-line file whole; `templates/architecture.md` (49) +
  `templates/interface-contract.md` (41) as sibling engineering-template shape;
  `plugins/agentic-workflow/agents/ops.md` (44) for the runbook's owning remit.
- **Do** (ONE commit): create `templates/engineering-runbook.md` (V4) and
  `templates/engineering-tracking-plan.md` (V3), each with frontmatter (runbook
  `semi-static / ops / event`; tracking-plan `semi-static / analyst / event`),
  wired to their protocol references so `checkTemplateRefs` resolves; add the
  `templates/…` references from their protocol homes in the same commit.
- **Verify**: `node tools/lint.mjs` clean; both templates exist and resolve.
- **Read budget**: ~250 lines (WORKFLOW grepped, not whole). Suits: `devops`/`ops`.

**Checkpoint** ends Phase 5 — fresh `reviewer`, human merge (D3). Mission
complete when D4 both-halves hold: usable kit (Phase 2) + living mechanism
(Phase 3), with the full architecture (Phases 0,1,4,5) in place.

---
_Size every brief to its read budget; each session's outcome and any deviation
lands in `.plans/sales-doc-architecture.state.md`, never only in chat._
