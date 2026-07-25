# Mission: sales-doc-architecture — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes from this file alone. Write-ahead — update before ending a
session._

Gate policy: **batch** (changed by owner 2026-07-25, was human-merge/D3 — the owner
reviews and merges ONCE at the end). Each phase, on APPROVE, merges into the
long-lived integration branch **`mission/sales-doc-architecture-integration`**
(never `main`); the human merges that branch once at the end-of-mission
confirmation. Phase 3 is a **hard internal boundary with a STRICT checkpoint** (D2)
— it merges to integration only after the marker fixture is green.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written). Set `[~]` the moment a checkpoint beat is
picked up or parked to keep the beat-enforcer quiet; `[x]` only on a
verified/APPROVED result._

**Phase 0 — frontmatter + lint** (branch `mission/sales-doc-architecture-p0`)
- [x] S1 — frontmatter on all 24 templates + `checkTemplateFrontmatter`
- [x] Checkpoint — Phase 0 review **APPROVED** (DX/Arch/Sec 3·3·3; F1 idea→frozen + F2 architecture→architect fixed in S1-fix) + merged to integration

**Phase 1 — feature→benefit catalog** (branch `mission/sales-doc-architecture-p1`)
- [x] S2 — `sales-feature-benefit-catalog.md` (living substrate)
- [x] Checkpoint — Phase 1 review **APPROVED** (3·3·3; owner-agent=chronicler pattern confirmed) + merged to integration

**Phase 2 — sales kit, usable half** (branch `mission/sales-doc-architecture-p2`)
- [x] S3 — playbook + sell-sheet + sales-kit index + marketing ownership
- [x] S4 — objections-faq · battlecard · discovery-guide · demo-script · proof-points
- [x] Checkpoint — Phase 2 review **APPROVED** (Usability 3/3; F1 ownership-prose drift fixed; cadence divergence ruled S4-correct) + merged to integration — **D4 "usable" half DONE**

**Phase 3 — [STRICT] living wiring** (branch `mission/sales-doc-architecture-p3`)
- [x] S5 — chronicler + marketing living wiring
- [ ] S6 — marker-only-mutation fixture + lint gate + compass stamp
- [ ] **Checkpoint [STRICT]** — Phase 3 review + merge to integration; fresh reviewer re-runs the FULL gate incl. marker fixture; no merge until fixture green (D2, D4 "living" half)

**Phase 4 — engineering folder + /sync + de-dup** (branch `mission/sales-doc-architecture-p4`)
- [ ] S7 — `/sync` docs-layout migration + deployed engineering paths
- [ ] S8 — de-dup single-sourcing
- [ ] Checkpoint — Phase 4 review + merge to integration

**Phase 5 — runbook + tracking-plan** (branch `mission/sales-doc-architecture-p5`)
- [ ] S9 — `engineering-runbook.md` + `engineering-tracking-plan.md`
- [ ] Checkpoint — Phase 5 review + merge to integration (mission complete)

## Open questions

_Resolved 2026-07-25 — owner accepted both recommendations as locked decisions._

- **OQ1 — RESOLVED (locked).** `checkTemplateFrontmatter` applies to all
  `templates/*.md` **except** `WORKFLOW.md` (protocol-master banner) and
  `overview.html` (HTML artifact-url comment); `---` fence above the `#` heading.
- **OQ2 — RESOLVED (locked).** The marker-only-mutation fixture lives in
  `tools/marker-test.mjs`, delegated from `tools/lint.mjs` like
  `checkHookBehavior`→`hook-test.mjs`.

## Deviations

_Any departure from a brief — logged the moment it happens, with why._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs._

**S5 — Phase 3 [STRICT] chronicler + marketing living wiring** (2026-07-25, branch `mission/sales-doc-architecture-p3`, commit `ca6840c`)
- `chronicler.md`: added **Artifact 4 — sales kit's living fact regions**. Every ship it edits ONLY
  inside markers — catalog `data:capabilities` (append-only, only GAINS rows from merged PRs),
  sell-sheet `data:top-benefits`/`data:whats-new` (refresh) — PR-cited, benefit column literally
  `_unwritten_`; **NEVER authors a claim/benefit/positioning line**; mirrors overview.html marker
  discipline ("bytes outside the markers are never yours to touch"). Invocation contract now names
  the `_unwritten_` count + `marketing` hand-off in the ≤10-line return. Description updated.
- `marketing.md`: extended the benefit-fill beat to consume the chronicler's every-ship queue across
  BOTH catalog outcome column and sell-sheet benefit/whats-new `_unwritten_` slots; fills only the
  `_unwritten_` slots, never the fact columns/rows/marker structure the chronicler owns; claims from
  `positioning.md`, evidence-gated. Prose-only, no code/fixture (that's S6).
- Verify: `node tools/lint.mjs` clean (exit 0). Both `templates/sales-*.md` deployed refs resolve.
- Next: S6 — `tools/marker-test.mjs` fixture + `checkMarkerMutation` lint gate + compass staleness stamp.

**S4 — Phase 2 objections-faq · battlecard · discovery-guide · demo-script · proof-points** (2026-07-25, branch `mission/sales-doc-architecture-p2`, commit `871ae6a`)
- Created 5 flat `sales-*.md` templates completing the usable-half kit (D4): objections-faq
  (concede→evidence→pivot), battlecard (status-quo/DIY/named cards from `idea.md`), discovery-guide
  (ICP fit · BANT · 10 pillar-mapped questions · disqualify-fast), demo-script (PRD-journey golden
  path, re-validated-each-release note), proof-points (analyst-owned; `_unmeasured_` discipline; case
  studies claim-gated + deferred). Added all five to `sales-kit.md` index + `marketing.md` sales block.
- Tiers: objections-faq/demo-script `semi-static/marketing/release`; battlecard/discovery-guide
  `semi-static/marketing/event`; proof-points `semi-static/analyst/release`. **Flagged**: these follow
  the orchestrator brief's per-doc list, which DIVERGES from sessions-brief L176 (battlecard/discovery
  `release`, proof-points `event`) — reviewer to confirm the refresh cadences.
- Verify: `node tools/lint.mjs` clean (all 5 pass `checkTemplateFrontmatter`; `data:metrics` pair
  balanced; sibling refs use deployed names, SD4). Claims→`positioning.md`, prices→`business/pricing.md`.
- Next: Phase 2 checkpoint — fresh reviewer + merge to integration (D4 "usable" half complete).

**S3 — Phase 2 playbook + sell-sheet + kit index + marketing ownership** (2026-07-25, branch `mission/sales-doc-architecture-p2`)
- Created 3 templates: `sales-playbook.md` (`semi-static / marketing / release`, full §1–§9 incl.
  §4 `data:top-capabilities` + §9 `data:whats-new` STATIC regions; §8 extends writer's §0.2
  anti-manipulation rule to the spoken pitch), `sales-sell-sheet.md` (`living / chronicler /
  every-ship`, `data:top-benefits` + `data:whats-new` regions), `sales-kit.md`
  (`semi-static / marketing / release`, index by DEPLOYED doc names — no `templates/` paths, lists S4 docs too).
- Extended `agents/marketing.md`: new "The sales kit (docs/product/sales/)" block — owns `sales/`,
  references the 4 `templates/sales-*.md` sources (atomic-commit invariant), fills `_unwritten_` catalog outcomes at its beat.
- Tiers per Phase-1 CADENCE-owner pattern & sessions brief — no owner-agent judgment deviations.
- Verify: `node tools/lint.mjs` clean; all `data:*` marker pairs balanced; kit uses deployed names (0 template refs).
- Next: S4 — objections-faq · battlecard · discovery-guide · demo-script · proof-points (extends this marketing block + kit index; run sequentially after S3).

**S2 — Phase 1 feature→benefit catalog** (2026-07-25, branch `mission/sales-doc-architecture-p1`, commit `bddd8e7`)
- Created `templates/sales-feature-benefit-catalog.md` (static living substrate): frontmatter
  `living / chronicler / every-ship`; append-only `data:capabilities` region with the 6-column
  table (capability│shipped-ref│outcome│proof│demo-moment│since-version); 2 illustrative seed
  rows, one showing the `_unwritten_` sentinel; substrate-contract prose (chronicler appends
  facts PR-cited/outcome `_unwritten_`, marketing fills claims, append-only, never a claim).
- owner-agent = **chronicler** (sessions-brief value; every-ship refresh owner) — co-ownership
  tension with marketing noted in-doc; single-valued field, chronicler chosen per spec.
- Verify: `node tools/lint.mjs` clean; marker pair balanced; NO Phase-3 wiring (static only).
- Next: Phase 1 checkpoint (fresh reviewer + merge to integration).

**Phase 0 checkpoint — APPROVED + merged** (2026-07-25, `8453564` → integration)
- Reviewer APPROVE (DX/Arch/Sec 3·3·3). Caught 2 real tier bugs (F1 idea→frozen/never,
  F2 architecture owner→architect); fixed in S1-fix, re-verified, lint green.
- p0 merged into `mission/sales-doc-architecture-integration` (batch — not main).
- Next: Phase 1 / S2 — the living substrate catalog.

**S1 — Phase 0 frontmatter + lint** (2026-07-25, branch `mission/sales-doc-architecture-p0`, commit `ab99cfc`)
- Added `{status, owner-agent, refresh-trigger}` frontmatter (fence above `#`) to all 24
  non-excluded `templates/*.md`; `WORKFLOW.md` + `overview.html` exempt per OQ1. Values from
  the sessions-file mapping table verbatim — no tier deviations.
- Added `checkTemplateFrontmatter()` to `tools/lint.mjs` (presence + enum + owner-agent ∈
  agents set + fail-closed `frozen ⇒ never`); wired into the checks array.
- Verify: `node tools/lint.mjs` green; negative case (frozen+release) fails with the
  frozen-rule message, reverted → green.
- Next: Phase 0 checkpoint (fresh reviewer re-runs the gate + diff-reviews `base..head`).

Next up: S6 — marker-only-mutation fixture (`tools/marker-test.mjs`) + `checkMarkerMutation` lint gate + compass staleness stamp (Phase 3 [STRICT])
