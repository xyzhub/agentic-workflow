---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: {{MISSION_NAME}} — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6). Deploys to
`.plans/{{MISSION_NAME}}.state.md`._

Estimate: 1 session
Sessions used: 0

_The two budget lines above are read by the mission-budget hook every turn. The
planner writes `Estimate:` (default `1 session`; more only with the `phases`
mode and a justification in the master plan). The orchestrator increments
`Sessions used:` the moment it starts a brief, a corrective `S<n>-fix`, or a
`continue`/loop tick — write-ahead, before spawning. When `Sessions used`
reaches 1.5× the estimate the hook prints 🛑 OVERRUN on every prompt and the
orchestrator must stop and give the owner the scope decision (subset / revised
estimate / abort) — recorded below as a dated locked decision that revises
`Estimate:`. Never edit `Estimate:` to silence the hook without that decision._

Gate policy: **_human-merge_** _(the default — after APPROVE the phase lands on
`staging`, is verified there, and the human merges the PR to the default
branch)_ **| batch** _(phases accumulate on `staging`; the human merges staging
→ default once, at the end-of-mission confirmation — never the default branch
by the agent)._ Recorded at mission start.

Standing agent authorized: _(none — every review/counsel is a one-shot spawn at
a decision point, §12 LA-5. If the owner authorizes a resident agent, record it
here verbatim with role and date, beat it on decisions only, and re-quote its
running cost every ~3 beats.)_

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

## Closing

_A promised action with an observable condition and no trigger yet — never
lost, never left to "zero open PRs" as a false completeness signal (WORKFLOW.md
§5). Grammar, one line each:_ `- [ ] OB-<n> · added YYYY-MM-DD (<source>) —
do: <action> — when: <observable condition> — probe: <command | manual>`
_where `<source>` names who added the row (an agent name or `planner`) and
`<observable condition>` is a state a probe can check — **never a clock**
("weekly" is not a condition; "the integration PR is merged and CI is green on
its merge commit" is). Rows are **never deleted**: a fired row keeps its line
and appends `· fired YYYY-MM-DD (<evidence>)`. A `[~]` row defers the
obligation past this mission's close and MUST carry `→ OB-<n>` — the verbatim
promotion ref for the copy landed in `.plans/OBLIGATIONS.md` (the repo-level
register, `templates/obligations.md`). `Closed: YYYY-MM-DD` is written only
once every row above is `[x]` or `[~] … → OB-<n>` — never while a bare `[ ]`
remains; the mission-close step (`/agentic-workflow:settle`) enforces this
before the mission may be reported done._

- [ ] branch + worktree cleanup · added YYYY-MM-DD (planner) — do: delete this
  mission's phase + integration branches (local and remote) and prune its
  now-stale worktrees — when: the phase/integration PRs are merged AND the
  deploy that carried them concluded green per §10 — probe: `gh pr list
  --state merged` + `gh run list` _(deferred until deploy-green, via
  `/agentic-workflow:settle`)_
- [ ] docs/record synced · added YYYY-MM-DD (planner) — do: _what changed_ —
  when: _observable condition_ — probe: _command | manual_
- [ ] live-verify after reinstall · added YYYY-MM-DD (planner) — do: confirm
  the shipped behavior fires in a real session — when: the release is
  installed (plugin update + reload in the CLI, post-merge) — probe: manual
- [ ] version bumped + stamped · added YYYY-MM-DD (planner) — do: bump the
  version wherever this project pins it (§10's **Version pin** row if recorded,
  else the project's own manifest) and stamp this
  mission's CHANGELOG entry with it — when: this mission's CHANGELOG entry
  names a version (fire immediately with "no version named" as the evidence
  when it does not) — probe: manual

## Deviations

_Any departure from a brief — logged here the moment it happens, with why.
Deviating is allowed; deviating silently is not (§4)._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs. Newest on top; crash-safe by write-ahead._

- _YYYY-MM-DD S1: what shipped, `<gate>` green on `<branch>`, staging SHA
  `<sha>` verified `<result>`, PR `<#>` open for the human, ready for `<next>`._

Next up: S1
