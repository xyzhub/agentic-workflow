# Counsel brief — owner-surfaces / E2 (2026-10-16)

Advisors: technical/security (Fable), financial (Fable). Inputs: brief,
platform facts, memos D1–D7, journeys, metrics, goal statement, past ledgers.

## Verdicts

| Lens | Verdict |
|---|---|
| Technical | **Proceed with changes** — the irreversible-action boundary is sound "by shape"; no path from a page answer to an irreversible act without a human typing a command |
| Financial | **Proceed with changes** — split: E2a now (3 sessions), E2b (on-page decisions + lease enforcement + ops notice) deferred to a trigger |

## Where they agree

- **5 sessions is low; honest is ~7.** The memo's gatehouse-asks anchor is
  wrong (it took 4 sessions, not 2); missions that added a new tool plus a
  live owner test overran 1.2–1.33×.
- **The lease, as specified, does not prevent two drivers.** `ledger.mjs`
  commits before it pushes and has `--no-push`; branches never collide; an
  agent can type `--force`. Technical: re-specify it (loser auto-resets,
  `--no-push` refused for lease verbs, same-branch rule) or relabel it
  "advisory". Financial: no double-drive incident has ever been observed —
  defer enforcement.

## Technical conditions (if on-page decisions are in scope)

1. Fixed write order for an accepted answer (append `consumed` → write the
   decision → delete the answer → republish) with a recovery rule per crash
   point.
2. `note` capped (≤ 280), never echoed on a refusal card; untrusted page data
   never read as instructions.
3. `fireCommand` rendered only from the committed page data and covered by
   its hash — never from the live, editable doc.
4. A live probe before the on-page phase: republish twice and read the owner
   id each time (stable?), and a second account with Editor access cannot
   write the owner pin.
5. Compute the WORKFLOW.md / mission.md byte delta in the plan (6.6 KB and
   1.3 KB headroom left).

## Financial points

- Pays back now: the generated page (all 8 recent page updates were hand
  edits) and JSON for Missions. Pays back only with a client: on-page
  decisions, client-ready copy, ops rows.
- Opportunity cost: the Missions server build is unblocked and competes for
  the same sessions; E7 and E3 are the lead source.
- Owner's standing rule "what a mission leaves out is never revisited" argues
  against a split; if one mission: estimate 7, stop 10, drop lease
  enforcement.

## What would change their minds

- A named prospect or demo date within ~60 days → full scope now.
- One observed double-drive incident → the lease is a bug fix.
- A two-clone race selftest where exactly one side keeps the lease.
