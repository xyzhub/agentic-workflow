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
- [x] S6 — marker-only-mutation fixture + lint gate + compass stamp
- [x] **Checkpoint [STRICT]** — Phase 3 review **APPROVED** (6/6 lenses 3·3·3; reviewer's own rogue probes each FAIL on the right invariant; NUL byte + half-covered fixture + contract contradiction all fixed across 2 correctives) + merged to integration — **D4 "living" half DONE**

**Phase 4 — engineering folder + /sync + de-dup** (branch `mission/sales-doc-architecture-p4`)
- [x] S7 — `/sync` docs-layout migration + deployed engineering paths
- [x] S8 — de-dup single-sourcing
- [x] Checkpoint — Phase 4 review **APPROVED** (Arch/DX 3·3; idempotent /sync migration verified, single-sourcing clean, ref miscount 8→10 fixed) + merged to integration

**Phase 5 — runbook + tracking-plan** (branch `mission/sales-doc-architecture-p5`)
- [x] S9 — `engineering-runbook.md` + `engineering-tracking-plan.md`
- [x] Checkpoint — Phase 5 review **APPROVED** (3/3; mission-complete sanity passed) + merged to integration — **MISSION COMPLETE**

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

**S9 — Phase 5 runbook + tracking-plan templates** (2026-07-25, branch `mission/sales-doc-architecture-p5`)
- Created two flat V-gap templates: `templates/engineering-runbook.md` (`semi-static / ops / event`; V4
  exit-gate deliverable — services/deps, health+readiness checks, alerts→response, restart/rollback, on-call
  escalation, **frozen per-incident postmortem** appends) and `templates/engineering-tracking-plan.md`
  (`semi-static / analyst / event`; V3 — success definitions w/ baseline + "done" number, event rows
  w/ properties + question-answered + instrumentation status, honesty rule "unmeasured stays unmeasured").
- Wired (SD4 atomic — template + `templates/…` ref in one commit): `ops.md` Runbook-truthfulness bullet →
  `docs/product/engineering/runbook.md` (from `…/templates/engineering-runbook.md`); `analyst.md` Own-the-
  tracking-plan body + description → `docs/product/engineering/tracking-plan.md` (from `…/engineering-
  tracking-plan.md`) — moved off the old flat `docs/product/tracking-plan.md` to the engineering/ folder.
- Verify: `node tools/lint.mjs` clean (exit 0) — both templates pass `checkTemplateFrontmatter`,
  both `templates/engineering-*.md` refs resolve via `checkTemplateRefs`; no stray flat tracking-plan path.
- Next: Phase 5 checkpoint — fresh reviewer + merge to integration = **mission complete** (D4 both halves hold).

**S8 — Phase 4 de-dup single-sourcing** (2026-07-25, branch `mission/sales-doc-architecture-p4`, commit `0d6c3a7`)
- **Claims → `launch/positioning.md`:** business-model.md §Value proposition — replaced the "Must agree
  with launch/positioning.md" agreement-by-convention obligation with a reference naming positioning as the
  single claims source (restatement → pointer; constraint kept, not deleted).
- **Problem → `idea.md`:** business-executive-summary.md §The problem + prd.md §Problem recap both now
  CITE `docs/product/idea.md` (the single source) instead of re-paraphrasing it; PRD keeps only "what V1
  commits to" and adds the `→ docs/product/idea.md` link idiom.
- **Pricing → `business/pricing.md`:** landing-page.md now points any price shown at `business/pricing.md`
  (never restate tiers). exec-summary §Pricing already referenced pricing.md — verified, left as-is. Sales
  kit already single-sources (untouched per brief).
- Verify: `node tools/lint.mjs` clean (exit 0); `grep "must agree with"` → none; refs use deployed/plain
  doc names (not `templates/…`), so `checkTemplateRefs` unaffected. Next: Phase 4 checkpoint review + merge.


_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs._

**S7 — Phase 4 engineering/ folder + idempotent /sync migration** (2026-07-25, branch `mission/sales-doc-architecture-p4`, commit `28ea2e9`)
- `commands/sync.md`: new **§3.5** — idempotent, HITL-staged docs-layout reconciliation. Detects flat
  `docs/product/architecture.md` + `interface-contract.md`; already-foldered/absent → **skip silently
  (no-op)**; flat found → `git mv` into `docs/product/engineering/` (filenames unchanged), fix intra-doc
  links, **report each move + link rewrite and leave staged/uncommitted for HITL — never move silently**.
  Re-run after move = no-op (idempotent). ≤2 files/repo.
- `commands/bootstrap.md`: new/adopted projects now deploy architecture.md + interface-contract.md into
  `docs/product/engineering/`. `adopt.md` untouched (it deploys via bootstrap's procedure).
- Repointed **10 references** to `docs/product/engineering/…`: architect.md (2), backend.md (2),
  frontend.md (1), bootstrap.md (2 deploy paths), templates/architecture.md intra-doc link (1),
  WORKFLOW.md §5 architect role (2). Template SOURCES stay FLAT (SD4) — no file renamed; no sales kit touched.
- Verify: `node tools/lint.mjs` clean (path edits don't touch `checkTemplateRefs`, which only polices
  `templates/…`). Next: S8 — de-dup single-sourcing (depends on the engineering paths S7 landed).

**S6-fix — Phase 3 [STRICT] corrective pass (reviewer REQUEST CHANGES, 5 findings)** (2026-07-25, branch `mission/sales-doc-architecture-p3`)
- **F2 (contract, LOCKED split):** chronicler.md Artifact 4 now writes ONLY catalog `data:capabilities`
  (append-only, outcome `_unwritten_`) + sell-sheet `data:whats-new` (facts) — never `data:top-benefits`.
  marketing.md now OWNS `data:top-benefits` (curates top-3 from FILLED catalog rows, never `_unwritten_`).
  sales-sell-sheet.md states the per-region split; the `_unwritten_`-never-shown wording is now consistent.
- **F1/F5 (blocking, `tools/marker-test.mjs`):** simulated update now ALSO refreshes `data:whats-new`;
  added invariants (d) capabilities appended lines ALL rows [F5], (e) whats-new facts-only, (f) top-benefits
  untouched — +3 negatives. 13 checks (kept 3 invariants + 4 negatives). Fail-closed re-proven on all 3 new
  invariants (exit 1 each). No raw NUL.
- **F3:** added an Inspect step to commands/next.md grepping `_unwritten_` across `docs/product/sales/` —
  the "grepped by `/agentic-workflow:next`" claim in chronicler/marketing/catalog now holds.
- **F4:** un-staled the Phase-3-wiring notes in sales-sell-sheet.md + sales-feature-benefit-catalog.md
  (now describe live behavior); sales-playbook.md left static (correct — Artifact 4 excludes it).
- Verify: `node tools/marker-test.mjs` green (13); `node tools/lint.mjs` clean. Next: STRICT re-review + merge.

**S6 — Phase 3 [STRICT] marker fixture + lint gate + staleness stamp** (2026-07-25, branch `mission/sales-doc-architecture-p3`, commit `62217ff`)
- `tools/marker-test.mjs` (clones hook-test.mjs shape): builds a catalog fixture (`data:capabilities`
  + `data:top-benefits` regions, prose OUTSIDE both) on a throwaway dir, applies a deterministic
  simulated chronicler update (appends CHANGELOG rows INSIDE `data:capabilities`, outcome `_unwritten_`),
  asserts (a) outside-marker bytes byte-identical, (b) `data:capabilities` append-only (old interior is
  exact prefix), (c) appended outcome column is literal `_unwritten_`, never prose. 4 self-contained
  negative checks prove each guard fires (outside edit / row rewrite / row removal / rogue claim).
- `tools/lint.mjs`: added `checkMarkerMutation()` delegating to the harness like `checkHookBehavior`;
  registered in the checks array. Missing harness FAILS the gate (fail-closed, no silent skip).
- Staleness stamp (`Last refreshed` + refresh-trigger, existing exec-summary idiom) added to the 7
  SEMI-STATIC sales docs: battlecard, demo-script, discovery-guide, kit, objections-faq, playbook,
  proof-points. Living docs (catalog, sell-sheet) intentionally NOT stamped.
- Verify: `node tools/marker-test.mjs` exit 0; `node tools/lint.mjs` clean incl. new gate. Fail-closed
  proven twice: (1) harness removed → lint FAILS with clear message → restored → clean; (2) patched copy
  tampering an outside-marker byte → assertion (a) FAILS exit 1 → unmodified fixture clean.
- Next: Phase 3 STRICT checkpoint — fresh reviewer re-runs FULL gate incl. marker fixture, extra scrutiny
  on the chronicler auto-write path (no auto-authored claim), then merge to integration (D2).

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

Next up: **MISSION COMPLETE** — all 6 phases merged to integration; mission-end wrap = version bump 1.40.0→1.41.0 + CHANGELOG, then the single `mission/sales-doc-architecture-integration → main` PR for the human to review + merge (batch gate).
