# Mission: portfolio-commons — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it before
ending a session. Deploys to `.plans/portfolio-commons.state.md`._

Gate policy: **human-merge (default)** — pause for the human to merge each phase
branch on APPROVE. Recorded at mission start.
Mission started: **2026-07-18**.

## Checklist

- [ ] S1 — Commons shape memo (branch `mission/portfolio-commons-p1`)
- [ ] S2 — §13 commons amendment (branch `mission/portfolio-commons-p1`)
- [ ] Checkpoint — phase 1 review + human locks shape + merge
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

(none)

## Handoff log (newest first)

(none yet)

Next up: S1
