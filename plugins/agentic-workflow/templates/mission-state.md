---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: {{MISSION_NAME}} — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
before ending a session. Deploys to `.plans/{{MISSION_NAME}}.state.md`._

Gate policy: **_human-merge_** _(the default — pause for the human to merge each
phase branch on APPROVE)_ **| batch** _(phases merge into
`mission/{{MISSION_NAME}}-integration`; the human merges that once, at the
end-of-mission confirmation — never the default branch)._ Recorded at mission
start.

## Checklist

_Every session and checkpoint from the sessions file, all `[ ]` at start.
Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written). The beat-enforcer nudges only on a
not-started `[ ]` checkpoint/reviewer/chronicler row — set `[~]` the moment a beat
is picked up or parked to keep it quiet; `[x]` only on a verified/APPROVED result._

- [ ] S1 — _session name_ (branch `mission/{{MISSION_NAME}}-p1`)
- [ ] Checkpoint — phase 1 review + merge per gate policy

## Open questions

_Unresolved items blocking execution, mirrored from the master plan with their
recommendations. Empty once the human has answered them all._

(none)

## Standing steers

_File state preserves **decisions** but loses **taste** — how the human wants the
work done. Captured **verbatim** at checkpoints only, never mid-brief, never from
an agent's own inference. Quote exactly; a paraphrase is not a steer. Grammar, one
line each:_ `- YYYY-MM-DD (ckpt <id>) — "<exact words>"` _where `<id>` is the
checkpoint id from the `## Checklist` (e.g. `p2`, or `ckpt-p2` — either form).
Retire by ~~strikethrough~~, **never delete**: a retired steer is the evidence for
why the work changed. Every session re-reads this block before it starts._

(none)

## Deviations

_Any departure from a brief — logged here the moment it happens, with why.
Deviating is allowed; deviating silently is not (§4)._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs. Newest on top; crash-safe by write-ahead._

- _YYYY-MM-DD S1: what shipped, `<gate>` green on `<branch>`, ready for `<next>`._

Next up: S1
