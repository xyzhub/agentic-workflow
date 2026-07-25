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
- [ ] Checkpoint — Phase 1 review + merge to integration

**Phase 2 — sales kit, usable half** (branch `mission/sales-doc-architecture-p2`)
- [ ] S3 — playbook + sell-sheet + sales-kit index + marketing ownership
- [ ] S4 — objections-faq · battlecard · discovery-guide · demo-script · proof-points
- [ ] Checkpoint — Phase 2 review + merge to integration (D4 "usable" half)

**Phase 3 — [STRICT] living wiring** (branch `mission/sales-doc-architecture-p3`)
- [ ] S5 — chronicler + marketing living wiring
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

Next up: Phase 1 checkpoint — fresh reviewer diff-reviews `base..head`, re-runs the gate, merge to integration
