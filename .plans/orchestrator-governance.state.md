# Mission: orchestrator-governance — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
before ending a session. Deploys to `.plans/orchestrator-governance.state.md`._

Gate policy: **human-merge** (the recorded default) — pause for the human to merge
each phase branch on APPROVE. Mission started: **2026-07-23**.

> **Confirm at mission start (open question a1):** the owner used the
> *stacked-phases, one-merge-at-end* variant last mission (portfolio-commons,
> 2026-07-18) and it is the likely choice here — five small phases editing shared
> files (hooks.json, WORKFLOW master) merge cleanly as one end-of-mission PR, with
> `/agentic-workflow:sync` run once. The default above stands until the human confirms.

## Checklist

_All unchecked at start. Checked only when the work is verified, not merely written._

- [ ] S1 — Architect shape memo (branch `mission/orchestrator-governance-p1`)
- [ ] Checkpoint — phase 1: human locks the shape; record locked decisions in the master plan
- [ ] S2 — Router + thread-keeper hooks (branch `mission/orchestrator-governance-p2`)
- [ ] S3 — Beat-enforcer hook (branch `mission/orchestrator-governance-p2`)
- [ ] Checkpoint — phase 2 review (security-lens-forward) + **felt-validation gate**
- [ ] S4 — `intake` agent + router→intake wiring (branch `mission/orchestrator-governance-p3`)
- [ ] Checkpoint — phase 3 review + merge per gate policy
- [ ] S5 — `compass` agent + north-star template + shadow-mode §12 notify (branch `mission/orchestrator-governance-p4`)
- [ ] Checkpoint — phase 4 review (shadow mode + security lens on notify path)
- [ ] S6 — Docs + version bump + governance eval + sync (branch `mission/orchestrator-governance-p5`)
- [ ] Checkpoint — phase 5 review + eval green; mission-end wrap per gate policy

## Open questions

_Mirrored from the master plan. (a) blocks execution — resolve before S1 ends /
before P2. (b) are the scope of the S1 architect memo; the human locks from the
memo's recommendations at the phase-1 checkpoint._

**(a) For the human — scope / policy:**
- a1 — Gate policy: human-merge (default) vs stacked-one-merge (last mission's
  variant). **Recommendation:** confirm stacked-one-merge.
- a2 — Governance eval scope. **Recommendation:** two scenarios —
  plain-request-routed + forgotten-chronicler-caught.
- a3 — P1 memo review depth (human alone vs `/agentic-workflow:counsel`).
  **Recommendation:** human alone (tactical shaping, not a go/no-go gate).

**(b) For the S1 architect memo — technical:** drift-signatures + router
work-request-vs-chat detection; thread-keeper active-ledger selection + next-step/
beat derivation; beat-enforcer `Stop`-vs-`PreToolUse` placement; north-star artifact
location + schema; `intake` new-agent-vs-extend; `compass` standalone-vs-extend;
compass notification gating; `intake`↔`compass` coupling.

## Deviations

_Any departure from a brief — logged here the moment it happens, with why._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs. Newest on top; crash-safe by write-ahead._

(none yet)

Next up: S1
