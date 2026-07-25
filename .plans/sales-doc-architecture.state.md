# Mission: sales-doc-architecture — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes from this file alone. Write-ahead — update before ending a
session._

Gate policy: **human-merge** (D3, recorded at mission start — pause for the human
to merge each phase branch on APPROVE). Phase 3 is a **hard internal boundary
with a STRICT checkpoint** (D2).

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written). Set `[~]` the moment a checkpoint beat is
picked up or parked to keep the beat-enforcer quiet; `[x]` only on a
verified/APPROVED result._

**Phase 0 — frontmatter + lint** (branch `mission/sales-doc-architecture-p0`)
- [ ] S1 — frontmatter on all 24 templates + `checkTemplateFrontmatter`
- [ ] Checkpoint — Phase 0 review + human merge

**Phase 1 — feature→benefit catalog** (branch `mission/sales-doc-architecture-p1`)
- [ ] S2 — `sales-feature-benefit-catalog.md` (living substrate)
- [ ] Checkpoint — Phase 1 review + human merge

**Phase 2 — sales kit, usable half** (branch `mission/sales-doc-architecture-p2`)
- [ ] S3 — playbook + sell-sheet + sales-kit index + marketing ownership
- [ ] S4 — objections-faq · battlecard · discovery-guide · demo-script · proof-points
- [ ] Checkpoint — Phase 2 review + human merge (D4 "usable" half)

**Phase 3 — [STRICT] living wiring** (branch `mission/sales-doc-architecture-p3`)
- [ ] S5 — chronicler + marketing living wiring
- [ ] S6 — marker-only-mutation fixture + lint gate + compass stamp
- [ ] **Checkpoint [STRICT]** — Phase 3 review + human merge; fresh reviewer re-runs the FULL gate incl. marker fixture; no merge until fixture green (D2, D4 "living" half)

**Phase 4 — engineering folder + /sync + de-dup** (branch `mission/sales-doc-architecture-p4`)
- [ ] S7 — `/sync` docs-layout migration + deployed engineering paths
- [ ] S8 — de-dup single-sourcing
- [ ] Checkpoint — Phase 4 review + human merge

**Phase 5 — runbook + tracking-plan** (branch `mission/sales-doc-architecture-p5`)
- [ ] S9 — `engineering-runbook.md` + `engineering-tracking-plan.md`
- [ ] Checkpoint — Phase 5 review + human merge (mission complete)

## Open questions

_Mirrored from the master plan with recommendations. Empty once the human has
answered them all._

- **OQ1** — `checkTemplateFrontmatter` scope + fence placement. Recommendation:
  apply to all `templates/*.md` except `WORKFLOW.md` and `overview.html`; `---`
  fence above the `#` heading. (Blocks Phase 0.)
- **OQ2** — marker-fixture home. Recommendation: `tools/marker-test.mjs`
  delegated from lint like `checkHookBehavior`→`hook-test.mjs`. (Blocks Phase 3.)

## Deviations

_Any departure from a brief — logged the moment it happens, with why._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs._

(none yet)

Next up: S1
