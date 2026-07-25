---
status: semi-static
owner-agent: ops
refresh-trigger: event
---

# {{PROJECT_NAME}} — Engineering Runbook

_The operational truth for a live system: what runs, how to tell it's healthy,
and the exact steps to take when it isn't. Deployed to
`docs/product/engineering/runbook.md`. Owned by the `ops` agent, who at V6 keeps
it TRUTHFUL — the stale-doc rule (§8) applies with force here: a runbook whose
commands or contacts have rotted is worse than none. It is **semi-static**
(refreshed on the event that changes the system: a new service, a changed
dependency, a new alert), NOT auto-written. Every procedure below is a
recommendation the human fires — `ops` prepares, the human executes anything
that mutates production (§11)._

## Services & dependencies
_Each running service and what it needs to function — a short map, not an
inventory. For "where does X live?", query the code index; this holds only what
operations can't recover from code: which knobs are load-bearing and what breaks
what._

- **_service_** — _its responsibility; the datastores/queues/external APIs it
  depends on; what goes dark if it stops._

## Health & readiness checks
_How to know, in seconds, whether the system is up. The health endpoint(s), the
liveness vs. readiness distinction, and the one query/dashboard that answers "is
it serving?" — with the command to run it._

- **Liveness** — _the check that says the process is alive; where to run it._
- **Readiness** — _the check that says it can serve traffic (deps reachable,
  migrations applied); where to run it._

## Common alerts → response
_The alerts that actually fire, each paired with the first diagnostic step and
the response. Rank by user impact, not event count (the `ops` triage rule). An
alert with no response step here is a gap to fill._

| Alert / symptom | What users experience | First diagnostic step | Response |
|---|---|---|---|
| _(e.g. error-rate spike)_ | _(e.g. 5xx on checkout)_ | _(the command/dashboard to look at first)_ | _(the prepared action — link the procedure below)_ |

## Restart / rollback procedures
_The exact, copy-pasteable steps — because they're run under pressure. Each names
its precondition and its blast radius. **These mutate production: `ops` prepares
and recommends; the human fires them (§11).**_

- **Restart _service_** — _preconditions · the command(s) · how to confirm
  recovery · what NOT to do._
- **Rollback a deploy** — _how to identify the last-good release · the command ·
  how to verify · data/migration caveats (a rollback that crosses a
  non-additive migration is not a rollback — flag it)._

## On-call & escalation
_Who to reach, in what order, and when to escalate. Keep it current — a wrong
contact here is the failure the stale-doc rule exists to catch. Names/handles/
rotation, the escalation threshold, and the owner-notification path (§12) for an
outward-facing incident._

## Postmortems
_After an incident, `ops` drafts the technical analysis here (the `chronicler`
keeps the narrative record). **Each entry is FROZEN once written — a per-incident
append, never edited after the fact** (the integrity check flags it if
modified). Newest first; the prevention rule from each becomes a runbook change
above (that's the semi-static edit an incident triggers)._

### _YYYY-MM-DD — <incident title>_ · frozen
- **Timeline** — _detection → mitigation → resolution, with timestamps._
- **Root cause** — _the engineering truth, not the symptom._
- **Blast radius** — _who/what was affected, for how long._
- **What detection missed** — _why the alert was late or absent._
- **Prevention rule** — _the concrete change (→ the runbook/alert edit it drove)._

---
_The `ops` agent authors and verifies this at V6 and after every incident;
implementers land any code change it implies through the normal machinery with
review. It records operational intent and procedures — never a re-narration of
the deploy config (that rots; §8 polices it). Related shape lives in
`docs/product/engineering/architecture.md`; measurement in
`docs/product/engineering/tracking-plan.md`._
