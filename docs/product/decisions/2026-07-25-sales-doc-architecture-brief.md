# Feature brief — Sales-enablement kit + living-document architecture

_Date: 2026-07-25 · Front door: `/agentic-workflow:plan` · Design input: 4-expert Fable council (2026-07-25)_

## Problem

The workflow's document set is strong on **investor/overview** (executive-summary, business model) and **engineering** (architecture, interface-contract) docs, but weak on two axes discovered while dogfooding:

1. **No client-closing sales enablement.** The owner, using the workflow on a project, could not find any document to help **close a sale with a client**. The only outward assets — `positioning.md`, `landing-page.md` — are V5-gated (generated late) and static, and nothing is *named* for sales (buried under `launch-*` prefixes). There is no sell sheet, no **"how to present the product" coaching doc**, no feature→benefit catalog, objection FAQ, or battlecard.
2. **Docs go stale as the product evolves.** Only `overview.html`/`CHANGELOG`/`JOURNEY` (chronicler) and `north-star` (compass) auto-refresh every ship. The exec-summary refreshes only at *stage transitions*; nothing keeps a sales/pitch doc current between them. The owner explicitly wants documents that **automatically reflect the latest version/features**.

## Interview — locked decisions (2026-07-25)

- **D1 — Scope = FULL architecture.** v1 delivers: the full sales kit; the `docs/` reorg into function-first, audience-named folders; `{status, owner-agent, refresh-trigger}` frontmatter on every template; the two protocol-named-but-templateless docs (`runbook.md` V4, `tracking-plan.md` V3); and the single-source-of-truth de-dup (pricing→`business/pricing.md`, problem→`idea.md`, claims→`positioning.md` — others *reference*, never restate).
- **D2 — Priority = top of backlog**, with a **strict checkpoint on the chronicler/living-doc wiring phase** (it auto-writes docs and touches a core agent — the riskiest piece).
- **D3 — Gate policy = human-merge** (default).
- **D4 — Done = BOTH:** the living mechanism works end-to-end AND the collateral is usable by a real salesperson.
- **D5 — Process adaptation:** the council already produced the design (IA, sales-enablement, coverage, living-doc mechanics), so `designer`/`analyst` are NOT re-spawned; a focused `architect` resolves the open shape decisions (below); then counsel → one approval → planner.

## The design (council synthesis — the design-of-record)

**Organizing axis:** function-first folders, audience-*named* (function matches which agent may write each doc — the drift guard; names are searchable). Proposed venture tree:
```
docs/product/  idea · prd · ux-brief · north-star · roadmap · overview.html · JOURNEY
  business/    model · pricing · executive-summary            (investor/owner)
  sales/       sell-sheet · playbook · feature-benefit-catalog · objections-faq
               battlecard · discovery-guide · demo-script · proof-points · sales-kit(index)  (CLIENT-closing)
  launch/      positioning · landing-page · announcement · content-plan     (V5 campaign)
  engineering/ architecture · interface-contract · tracking-plan · runbook
  decisions/   decision-log · memos/*
.plans/        mission-* · flight-plan · session-handoff       (machine/ephemeral)
```
(The plugin's own `docs/product/` already uses `business/` + `launch/` folders — the reorg aligns templates to that.)

**Three tiers** (every template gets frontmatter `{status, owner-agent, refresh-trigger}`):
- **LIVING** (chronicler, every ship): overview.html, CHANGELOG, JOURNEY(append), north-star rollup, **sales capabilities/feature→benefit**.
- **SEMI-STATIC** (event): exec-summary, pricing, positioning, PRD, runbook.
- **FROZEN** (records — never auto-touch): idea.md's original bet, decision-log, JOURNEY entries, counsel briefs, postmortems.

**Living mechanism** (facts auto-flow, claims stay gated): living docs carry `<!-- data:* -->` marker regions (the existing `overview.html` idiom). The **chronicler rewrites only inside the markers** from CHANGELOG/ledger (PR-cited), adding any new capability with its benefit left `_unwritten_` — it **never authors a claim**. **Marketing** fills benefit language + revises positioning at its own beat, evidence-gated (every claim traces to shipped behavior or research). Staleness for semi-static docs uses the **compass pattern** — a `Last refreshed`+trigger stamp, watched and *flagged* (digest, or §12 alert if outward-facing), never auto-rewritten. FROZEN docs get an integrity check (flag if *modified*, never if old).

**Sales kit** — claims derive from `positioning.md` (single source), living facts from the feature→benefit catalog (the substrate):
- `feature-benefit-catalog.md` (living substrate): capability │ shipped-ref │ client outcome ("so you can…") │ proof │ demo-moment │ since-version.
- `playbook.md` (the coaching doc): §1 product-in-one-breath (30s/2min/10min) · §2 who-buys/why-now · §3 talk track (problem→cost-of-inaction→solution→proof) · §4 framing capabilities as outcomes ("name the client's Tuesday it fixes"; **live top-5 from catalog**) · §5 discovery questions · §6 demo choreography (live) · §7 objections & the pricing conversation · §8 tone & anti-patterns (extends the writer's anti-manipulation rule to the spoken pitch) · §9 what's-new-this-release (auto-appended).
- `sell-sheet.md`: value prop → top-3 benefits → proof → price line (ref pricing.md) → CTA.
- `objections-faq.md` · `battlecard.md` (vs alternatives incl. status-quo) · `discovery-guide.md` · `demo-script.md` (re-validated each release) · `proof-points.md` (numbers only from analyst; unmeasured stays unmeasured) · `sales-kit.md` (index).

**Build order:** ① feature→benefit catalog (substrate) → ② playbook (the ask) → ③ sell-sheet → then the chronicler/marketing wiring + frontmatter convention → the reorg + de-dup → runbook/tracking-plan. Respect "minimal-complete, resist surface growth".

## Acceptance criteria (per D4 — both)

- **Living:** shipping a feature causes the sell-sheet/catalog `data:*` region to reflect it within one ship (chronicler, from CHANGELOG/ledger); the new benefit is left `_unwritten_` and flagged to marketing; **no positioning claim is ever auto-written**; capabilities region can only *gain* rows from merged PRs.
- **Usable:** the `playbook` coaches a rep to present the product; the `sell-sheet` is a real leave-behind; both derive claims from `positioning.md` and facts from the catalog.
- **Structure:** templates organized into `business/ sales/ launch/ engineering/ decisions/`; all agent cross-references + `tools/lint.mjs` cross-ref checks updated; a migration path exists for already-adopted projects.
- **Frontmatter:** every template carries `{status, owner-agent, refresh-trigger}`; lint validates presence + allowed values.
- **Gaps filled:** `runbook.md` + `tracking-plan.md` templates exist and are wired to their protocol references.
- **De-dup:** pricing/problem/positioning single-sourced; "must agree with X" prose contracts replaced by references.

## NOT in v1 (deferred ≠ denied)

- Real customer **case studies** in proof-points (need real clients; ship the template + "unmeasured" discipline only).
- Ops docs beyond `runbook.md` (incident tooling, on-call).
- Any content requiring live product analytics (the analyst wires events elsewhere).

## Open shape decisions → `architect` option memos

- **SD1 — Migration/backward-compat:** how do already-adopted projects (deployed *flat* `docs/`) move to the folder layout — a `/agentic-workflow:sync` migration step, a one-time migrator, or new-projects-only with old left in place? (Reversal cost; the plugin has adopters.)
- **SD2 — Frontmatter schema:** exact keys + allowed values for `{status, owner-agent, refresh-trigger}`; lint enforcement level (presence only vs. value validation vs. cross-check against the owning agent's remit).
- **SD3 — `data:*` marker mechanism:** reuse the `overview.html` idiom; exact marker syntax; how the chronicler is scoped to write ONLY inside markers and to emit `_unwritten_` + a marketing hand-off flag.
- **SD4 — Reorg blast radius:** the flat→folder rename touches agent cross-references + lint's cross-ref/`reverse-mention` checks; sequence it so lint stays green (and align to the plugin's own `business/`+`launch/` convention).
- **SD5 — Phasing:** recommended phase decomposition for the full scope, honoring the ①catalog→②playbook→③sell-sheet build order and isolating the risky chronicler-wiring phase for its strict checkpoint.

## Locked shape decisions (2026-07-25 — architect memos, human-approved)

- **SD1 → `/sync` migration (Option A).** Deployed venture docs are ALREADY foldered (`adopt.md` writes `business/`, `launch/`, `decisions/`); only `architecture.md` + `interface-contract.md` sit flat and move to `docs/product/engineering/`. Fold an **idempotent docs-layout reconciliation into `/agentic-workflow:sync`** — detect flat, `git mv` into `engineering/`, fix intra-doc links, report + stage for HITL; skip silently when already foldered. Filenames do NOT change. Migration surface ≈ 2 files/repo.
- **SD2 → frontmatter schema (enforcement B + one C-rule).** Three colon-free single-token keys: `status: living|semi-static|frozen` · `owner-agent: <real agent stem>` · `refresh-trigger: every-ship|stage-transition|release|event|never`. New `checkTemplateFrontmatter()` in `tools/lint.mjs`: presence + value-validation (`status`/`refresh-trigger` in enum; `owner-agent` ∈ the agents set lint already builds) + the fail-closed rule **`frozen ⇒ refresh-trigger: never`**. Lock the 3 key NAMES now; treat the value vocab as extensible. (Respect lint's flat `key: value` parser — no colon-space, no nested maps.)
- **SD3 → markers reuse the `overview.html` idiom.** `<!-- data:X -->` … `<!-- /data:X -->` paired HTML comments (valid in Markdown; chronicler already writes marker-interiors-only). Regions: catalog `data:capabilities` (append-only), sell-sheet `data:top-benefits` + `data:whats-new`. The **`_unwritten_` sentinel IS the marketing queue** — no separate state file (grepped by `/next`/digest; chronicler names the count in its ≤10-line return). Verify: tier-1 lint asserts marker balance; the **strict-checkpoint eval fixture asserts bytes OUTSIDE the markers are byte-identical** before/after a chronicler update (fail-closed heart of Phase 3). Start strict, loosen to "no non-whitespace change" only on evidence.
- **SD4 → template SOURCES stay flat-prefixed.** New templates are flat: `sales-*.md`, `engineering-runbook.md`, `engineering-tracking-plan.md`. The deployed FOLDER tree comes from the writing agents' paths, NOT the template dir (nesting would break `checkTemplateRefs`' regex + force ~15 ref rewrites — pure downside). Reverse-mention lint covers agents+commands only (no agent/command added → not at risk). **Invariant: a template and every `templates/…` reference to it change in ONE atomic commit.** Safe order: (1) add new flat templates carrying frontmatter; (2) enable `checkTemplateFrontmatter` in the SAME commit all existing templates get frontmatter; (3) point agents/commands at new templates + deployed folder paths; (4) never split a rename from its refs.
- **SD5 + packaging → ONE mission (packaging A), Phase 3 a hard internal boundary.** Phases: **0** frontmatter convention + `checkTemplateFrontmatter` (all templates) → **1** `sales-feature-benefit-catalog.md` (living substrate, `data:capabilities` + `_unwritten_`, static content) → **2** `sales-playbook.md` + `sales-sell-sheet.md` + rest of kit (objections-faq, battlecard, discovery-guide, demo-script, proof-points, sales-kit index); extend `marketing` to own `docs/product/sales/` — **satisfies D4's "usable" half** → **3 `[STRICT CHECKPOINT]`** living wiring: extend `chronicler` to write catalog/sell-sheet `data:*` from CHANGELOG/ledger + emit `_unwritten_`/hand-off; `marketing` fills benefits at its beat; the marker-only-mutation eval fixture; the compass-pattern `Last refreshed`+trigger stamp for semi-static docs — **satisfies D4's "living" half** → **4** deployed `engineering/` folder + `/sync` migration (SD1) + de-dup single-sourcing (replace "must agree with X" prose with references) → **5** `runbook.md` (V4) + `tracking-plan.md` (V3), wired to protocol refs. Each phase is a mergeable, lint-green slice; Phase 3 gets its own strict checkpoint per D2.
