# Mission: sales-doc-architecture — master plan

_Authored by the `planner` (WORKFLOW.md §5). Scope is settled before this file
exists — the planner decomposes, it does not re-decide._

<!-- Converted from the settled design-of-record:
`docs/product/decisions/2026-07-25-sales-doc-architecture-brief.md`, 2026-07-25.
Original left untouched. -->

Goal: ship the full client-closing sales kit plus the living-document
architecture (frontmatter tiers + marker-driven auto-refresh) so a real
salesperson can present the product AND shipping a feature keeps the collateral
current — both without any auto-authored claim.

## Tasks

Each task mirrors an acceptance criterion from the brief (§Acceptance criteria).
Every phase must end `node tools/lint.mjs` green (it now includes hook behavior;
Phase 3 adds the marker fixture to that same gate).

1. **Frontmatter convention + lint** (Phase 0) — add `{status, owner-agent,
   refresh-trigger}` frontmatter to every existing `templates/*.md`, and add
   `checkTemplateFrontmatter()` to `tools/lint.mjs` **in the same commit** (SD4
   atomic-ref invariant).
   Acceptance: `node tools/lint.mjs` clean; every non-exempt `templates/*.md`
   carries the three keys; `status ∈ {living, semi-static, frozen}` and
   `refresh-trigger ∈ {every-ship, stage-transition, release, event, never}` are
   value-validated; `owner-agent` ∈ the agents set lint already builds; the
   fail-closed rule `frozen ⇒ refresh-trigger: never` is enforced; a deliberately
   broken pair (e.g. `frozen` + `release`) makes the check fail.

2. **Feature→benefit catalog** (Phase 1) — new
   `templates/sales-feature-benefit-catalog.md`: the living substrate, a
   `<!-- data:capabilities -->` … `<!-- /data:capabilities -->` append-only
   region with columns capability │ shipped-ref │ client outcome ("so you can…")
   │ proof │ demo-moment │ since-version, the `_unwritten_` benefit sentinel,
   static seed content, frontmatter `status: living / owner-agent: chronicler /
   refresh-trigger: every-ship`.
   Acceptance: lint clean; marker pairs balanced; template present.

3. **Sales kit — usable half** (Phase 2, satisfies D4 "usable") — new templates
   `sales-playbook.md` (the 9-section coaching doc), `sales-sell-sheet.md`
   (`data:top-benefits` + `data:whats-new` regions, price line references
   pricing), `sales-objections-faq.md`, `sales-battlecard.md`,
   `sales-discovery-guide.md`, `sales-demo-script.md`, `sales-proof-points.md`
   (numbers only from analyst; unmeasured stays unmeasured), `sales-kit.md`
   (index); extend `marketing` to own `docs/product/sales/`.
   Acceptance: lint clean; every `templates/sales-*.md` reference in `marketing`
   resolves (`checkTemplateRefs`); the playbook coaches a rep to present the
   product; the sell-sheet is a real leave-behind; claims derive from
   `positioning.md`, facts from the catalog.

4. **[STRICT] Living wiring** (Phase 3, satisfies D4 "living") — extend
   `chronicler` to rewrite ONLY inside the catalog `data:capabilities` and
   sell-sheet `data:top-benefits`/`data:whats-new` regions from CHANGELOG/ledger
   (PR-cited), appending any new capability with its benefit left `_unwritten_`,
   emitting the marketing hand-off and naming the `_unwritten_` count in its
   ≤10-line return; `marketing` fills benefit language at its beat,
   evidence-gated; add the **marker-only-mutation fixture** and wire it into the
   `tools/lint.mjs` gate; add the compass-pattern `Last refreshed` + trigger
   stamp for semi-static docs.
   Acceptance: the fixture is green in `node tools/lint.mjs` and asserts bytes
   OUTSIDE the markers are byte-identical before/after a chronicler update and
   that `data:capabilities` can only GAIN rows; no positioning claim is ever
   auto-written.

5. **Engineering folder + /sync migration + de-dup** (Phase 4) — fold an
   idempotent docs-layout reconciliation into `/agentic-workflow:sync` (detect flat
   `architecture.md`/`interface-contract.md`, `git mv` into
   `docs/product/engineering/`, fix intra-doc links, report + stage for HITL,
   skip silently when already foldered); point writing agents at the deployed
   `engineering/` paths; single-source pricing → `business/pricing.md`, problem →
   `idea.md`, claims → `positioning.md`, replacing "must agree with X" prose with
   references.
   Acceptance: lint clean; `/sync` migration is idempotent (no-op when foldered);
   filenames unchanged; no duplicated source-of-truth prose remains.

6. **Runbook + tracking-plan templates** (Phase 5) — new
   `templates/engineering-runbook.md` (V4) and
   `templates/engineering-tracking-plan.md` (V3), each carrying frontmatter and
   wired to their protocol references.
   Acceptance: lint clean; both templates exist; each is referenced from its
   protocol home so `checkTemplateRefs` resolves.

## Locked decisions

_From the brief (2026-07-25). Never re-litigated mid-flight; a decision new
evidence invalidates becomes an open question below — unlocking is the human's
call._

- **2026-07-25 — D1** Scope = FULL architecture: full sales kit, docs reorg into
  function-first audience-named folders, `{status, owner-agent, refresh-trigger}`
  frontmatter on every template, the two templateless docs (runbook V4,
  tracking-plan V3), single-source-of-truth de-dup.
- **2026-07-25 — D2** Priority top-of-backlog, with a **strict checkpoint on the
  chronicler/living-doc wiring phase** (auto-writes docs + touches a core agent —
  the riskiest piece). → Phase 3.
- **2026-07-25 — D3 / gate policy** = **human-merge** (default). Recorded at
  mission start.
- **2026-07-25 — D4** Done = BOTH: the living mechanism works end-to-end AND the
  collateral is usable by a real salesperson. → Phase 2 = usable, Phase 3 =
  living.
- **2026-07-25 — D5** Process: the council already produced the design;
  `designer`/`analyst` NOT re-spawned; `architect` resolved the shape decisions
  (below), human-approved.
- **2026-07-25 — SD1** Migration = `/sync` (Option A). Deployed venture docs are
  ALREADY foldered; only `architecture.md` + `interface-contract.md` sit flat and
  move to `docs/product/engineering/`. Idempotent reconciliation in `/agentic-workflow:sync`;
  filenames do NOT change; surface ≈ 2 files/repo.
- **2026-07-25 — SD2** Frontmatter schema (enforcement B + one C-rule): three
  colon-free single-token keys — `status: living|semi-static|frozen` ·
  `owner-agent: <real agent stem>` · `refresh-trigger:
  every-ship|stage-transition|release|event|never`. `checkTemplateFrontmatter()`
  validates presence + enum (`status`/`refresh-trigger`) + `owner-agent` ∈ the
  agents set + the fail-closed `frozen ⇒ refresh-trigger: never`. Lock the 3 key
  NAMES; value vocab is extensible. Respect lint's flat `key: value` parser (no
  colon-space, no nested maps). **owner-agent need only be a real agent stem —
  remit cross-check is explicitly NOT in scope.**
- **2026-07-25 — SD3** Markers reuse the `overview.html` idiom:
  `<!-- data:X -->` … `<!-- /data:X -->` paired HTML comments. Regions: catalog
  `data:capabilities` (append-only), sell-sheet `data:top-benefits` +
  `data:whats-new`. The `_unwritten_` sentinel IS the marketing queue (no
  separate state file; grepped by `/agentic-workflow:next`/digest; chronicler names the count
  in its ≤10-line return). Tier-1 lint asserts marker balance; the
  strict-checkpoint fixture asserts bytes OUTSIDE markers byte-identical
  before/after a chronicler update. Start strict; loosen to "no non-whitespace
  change" only on evidence.
- **2026-07-25 — SD4** Template SOURCES stay flat-prefixed: `sales-*.md`,
  `engineering-runbook.md`, `engineering-tracking-plan.md`. The deployed FOLDER
  tree comes from the writing agents' paths, NOT the template dir (nesting would
  break `checkTemplateRefs`' regex + force ~15 ref rewrites). Reverse-mention
  lint covers agents+commands only. **Invariant: a template and every
  `templates/…` reference to it change in ONE atomic commit.** Safe order: (1)
  add new flat templates carrying frontmatter; (2) enable
  `checkTemplateFrontmatter` in the SAME commit all existing templates get
  frontmatter; (3) point agents/commands at new templates + deployed folder
  paths; (4) never split a rename from its refs.
- **2026-07-25 — SD5 + packaging** ONE mission, Phase 3 a hard internal boundary
  with its own strict checkpoint. Phases 0→5 as decomposed in the Tasks above;
  each phase a mergeable, lint-green slice.

## Risks

- **Chronicler is a core agent (D2).** Phase 3 changes the agent that auto-writes
  docs. Mitigation: strict checkpoint (fresh `reviewer`, re-run gates) + the
  marker-only-mutation fixture as the fail-closed heart — bytes outside markers
  must be byte-identical, capabilities append-only. Phase 3 does not merge until
  the fixture is green in the standard `node tools/lint.mjs` gate.
- **Atomic-ref invariant (SD4).** Splitting a new template from its
  `templates/…` reference, or enabling `checkTemplateFrontmatter` in a different
  commit than the frontmatter edits, red-fails `checkTemplateRefs` /
  `checkTemplateFrontmatter` mid-phase. Mitigation: each session brief keeps
  template-add + reference-add + check-enable inside one commit; noted per brief.
- **`checkTemplateFrontmatter` scope.** `WORKFLOW.md` (protocol-master banner,
  not `---` frontmatter) and `overview.html` (HTML, uses an `artifact-url`
  comment) are not `---`-frontmatter files; if the check does not exempt them it
  red-fails on day one. Mitigation: OQ1 resolves the exemption set before
  Phase 0.
- **De-dup blast radius (Phase 4).** Replacing "must agree with X" prose with
  references can silently drop a real constraint. Mitigation: replace with an
  explicit reference to the single source, never delete the constraint; reviewer
  diff-checks each replacement.

## Open questions

_Each carries the planner's recommendation. Resolve before `/agentic-workflow:mission` drives
execution._

- **OQ1 — `checkTemplateFrontmatter` scope + placement.** Which templates are
  exempt, and where does the `---` fence sit relative to the existing `#`
  heading? **Recommendation:** apply the check to ALL `templates/*.md`
  (including the machine `mission-*`, `flight-plan`, `session-handoff`,
  `registry`) with exactly two exemptions — `WORKFLOW.md` (protocol master,
  carries its own `<!-- protocol-master: -->` banner) and `overview.html` (HTML,
  keeps its `artifact-url` comment). Place the `---` frontmatter fence ABOVE the
  `#` heading (standard Markdown), leaving `{{PROJECT_NAME}}` titles untouched.
  This satisfies SD2/SD4 "all existing templates" while keeping the two
  non-`---` files as documented exceptions in the check.
- **OQ2 — marker-only-mutation fixture home.** A new `tools/marker-test.mjs`
  delegated from lint (the `checkHookBehavior` → `tools/hook-test.mjs` pattern),
  or an `evals/scenarios/` entry? **Recommendation:** `tools/marker-test.mjs`,
  wired into the `tools/lint.mjs` checks array via a `checkMarkerMutation()` that
  delegates exactly like `checkHookBehavior()` delegates to `hook-test.mjs`. It
  is a deterministic byte-identity assertion, not a judged scenario, so it
  belongs in the tier-1 gate CI already runs — and Phase 3's acceptance
  ("green in `node tools/lint.mjs`") is then met by construction.

---
_The `.plans/sales-doc-architecture.sessions.md` briefs execute these tasks;
`.plans/sales-doc-architecture.state.md` tracks progress. Resolve every open
question before execution starts._
