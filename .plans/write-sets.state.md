---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: write-sets — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6)._

Status: parked

Estimate: 1 session
Sessions used: 0
Reviewer runs: 2

_The budget lines above are read by the mission-budget hook every turn.
`Estimate: 1` = the one brief S1 (no `phases`; the one-shot checkpoint review
rides the same session — master plan PD-1). A corrective `S1-fix` is counted
when it fires, never pre-booked. The orchestrator bumps `Sessions used:` the
moment it starts a brief, a corrective or a loop tick
(`node ${CLAUDE_PLUGIN_ROOT}/tools/ledger.mjs write-sets sessions +1`,
write-ahead) and flips `Status:` to `active` at the first one; `Reviewer
runs:` is bumped at every one-shot reviewer spawn, plan-judge included
(`… reviewer-runs +1`). `Status: parked` + `Sessions used: 0` keep this ledger
invisible to the hooks until the owner schedules the mission._

**Planned and parked** (owner, 2026-11-18). Authored and plan-judged now, not
scheduled: `continuous-operation` keeps the queue. The pointer at the foot of
this file is this mission's own first beat for whenever it is un-parked — it
is not the repository's next mission, and no other file may say so.

<!-- rule-copy: overrun-1.5x -->
At **k ≥ 1.5 × N** the hook prints 🛑 OVERRUN on every prompt and the
orchestrator MUST NOT start another brief: it gives the owner the scope
decision — ship a defined subset now / continue at a revised estimate / abort —
with the remaining phases and what each buys, records the answer as a dated
locked decision, and only then revises `Estimate:`.
<!-- /rule-copy -->

_Record that decision below; never edit `Estimate:` to silence the hook without
it. The hooks go quiet on this ledger while `Sessions used:` is 0 (planned, not
started) and for good once it carries `Closed: YYYY-MM-DD`._

Gate policy: **human-merge** — after APPROVE the branch is verified (this
repo's §10 Staging = `none`: tier-1 lint + `claude --plugin-dir` load), then
the PR to `main` is marked ready and the owner merges. §10 Merge policy
`agent-may-merge (records-only, delegated 2026-10-07)` does not cover it: the
feature PR changes plugin code and protocol text. Recorded at planning,
2026-11-18 (master plan PD-2).

Standing agent authorized: _(none — every review is a one-shot spawn at a
checkpoint, §12 LA-5.)_

Branches: **one branch, `feat/write-sets`**, cut from `main` when the mission
is scheduled (not before), ONE feature PR to `main`, plus ONE
`chore/write-sets-bookkeeping` PR for the post-merge Closing rows (agent may
merge, §10 `records-only`). Version: the next minor above `main` at branch cut.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [ ] S1 — `Writes` field, shape check, matcher, coverage reader, planner cut, soft-rule retirement, release (branch `feat/write-sets`)
- [ ] Checkpoint ckpt-s1 — phase 1 review (one-shot reviewer on Fable: `tools/` + `templates/` are security-boundary, `templates/gate-classes.md:32`; re-runs AC-10 and AC-14) + PR to `main` per gate policy

## Open questions

_Mirrored from the master plan with their recommendations. All five go to the
owner before S1 starts._

- OQ-1 — does the disjoint cut change the one-session default? Recommendation:
  no; it applies only inside `phases`, and every phase records a `Cut
  examined:` line. Built as Assumed PD-7; any other answer forces a replan.
- OQ-2 — does the reader apply the LD-2(b) reads rule now? Recommendation:
  report both — the hand definition's two rates plus a third under the reads
  rule.
- OQ-3 — are validate-when-present and the `none` literal acceptable for the
  shape check? Recommendation: yes; the plan-judge catches a new trio with no
  field.
- OQ-4 — when is coverage re-measured? Recommendation: once three sessions
  files other than this mission's carry the field.
- OQ-5 — in what order does the reader group briefs? Recommendation: greedy
  first-fit in file order within a phase.
- Assumed 2026-11-18 → master plan Locked decisions (tool path and flags; PD-5
  grouping order, owes OQ-5; PD-6 `none` literal and validate-when-present,
  owes OQ-3; PD-7 one-session default untouched, cut only inside `phases`,
  owes OQ-1 — any other answer forces a replan).

## Standing steers

_Captured verbatim at checkpoints only. Grammar:_
`- YYYY-MM-DD (ckpt <id>) — "<exact words>"`

(none)

## Closing

- [ ] version bumped + stamped · added 2026-11-18 (planner, pre-merge) — do: bump `plugins/agentic-workflow/.claude-plugin/plugin.json` and `plugins/agentic-workflow/package.json` `version` to the next minor above `main` (§10 Version pin) and stamp this mission's CHANGELOG entry with it — when: this mission's CHANGELOG entry names a version — probe: `grep '"version"' plugins/agentic-workflow/.claude-plugin/plugin.json plugins/agentic-workflow/package.json`
- [ ] docs/record synced · added 2026-11-18 (planner, pre-merge) — do: CHANGELOG entry, the plugin README `tools/waves.mjs` line, the `templates/WORKFLOW.md` §5 Write sets paragraph and the three pointers that replace the "parallel-safe" statements — when: those are on the branch and `node tools/lint.mjs` is clean — probe: `grep -rnic 'parallel-safe' plugins/agentic-workflow/agents plugins/agentic-workflow/commands plugins/agentic-workflow/templates` + `grep -c 'Write sets' plugins/agentic-workflow/templates/WORKFLOW.md`
- [ ] branch + worktree cleanup · added 2026-11-18 (planner, post-merge) — do: delete `feat/write-sets` (local and remote) and prune any stale worktree — when: the feature PR is merged into `main` and CI is green on its merge commit — probe: `gh pr list --state merged --head feat/write-sets`
- [ ] live-verify after reinstall · added 2026-11-18 (planner, post-merge) — do: in a real session, have the planner author a trio and confirm every brief carries a `Writes` line, `waves.mjs --check` passes on it and the plan-judge names the field — when: the release is installed from `main` (plugin update + reload in the CLI) — probe: manual
- [ ] repo WORKFLOW sync · added 2026-11-18 (planner, post-merge) — do: run `/agentic-workflow:sync` on this repo so `docs/WORKFLOW.md` carries the §5 Write sets paragraph — when: the release is installed and the feature PR is merged — probe: `grep -c 'Write sets' docs/WORKFLOW.md`
- [ ] coverage re-measured · added 2026-11-18 (planner, post-merge) — do: run `node plugins/agentic-workflow/tools/waves.mjs --report` over every `.plans/*.sessions.md` that carries a `Writes` field, record the three rates and the count of `Cut examined: cut exists, declined for cost` lines beside the 0-of-13 baseline in this ledger's handoff log (a record path, so the bookkeeping PR stays records-only), and put the un-park decision for `parallel-waves` to the owner (LD-1) — when: three sessions files other than `.plans/write-sets.sessions.md` carry a `Writes` field (OQ-4) — probe: `grep -l '\*\*Writes\*\*' .plans/*.sessions.md`

## Deviations

(none)

## Handoff log (newest first)

- 2026-11-18 2026-11-18 · plan-judge: REVISE (6 findings — reviewer tier miscalled as ordinary though S1 writes tools/ and templates/ [gate-classes.md:32]; OQ-1 built unratified; AC-8/AC-10 rate mismatch; 3 ACs without Verify + vacuous AC-5; Assumed commands load-bearing; inexact heading fact). Planner revised once, all 6 resolved; narrow re-judge: APPROVE, 1 minor new defect (own Cut examined line mis-tagged) fixed by orchestrator post-approve. AC-10 baseline pinned to 5ba640e. Estimate unchanged: 1. Reviewer runs: 2. Parked — not scheduled.

- 2026-11-18 planned and parked: trio authored from `docs/product/decisions/2026-11-18-parallel-waves-brief.md` (LD-1..LD-4) on `plan/parallel-waves`, tree at main `5ba640e`; no branch cut; OQ-1..OQ-5 to the owner before S1; plan-judge pending.

Next up: S1
