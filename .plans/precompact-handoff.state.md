---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: precompact-handoff — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6)._

Status: active

Estimate: 1 session
Sessions used: 1
Reviewer runs: 3

_The budget lines above are read by the mission-budget hook every turn.
`Estimate: 1` = the one brief S1 (no `phases`; the one-shot checkpoint review
rides the same session). A corrective `S1-fix` is counted when it fires, never
pre-booked. The orchestrator bumps `Sessions used:` the moment it starts a
brief, a corrective or a loop tick
(`node ${CLAUDE_PLUGIN_ROOT}/tools/ledger.mjs precompact-handoff sessions +1`,
write-ahead) and flips `Status:` to `active` at the first one; `Reviewer
runs:` is bumped at every one-shot reviewer spawn, plan-judge included
(`… reviewer-runs +1`). `Status: planned` + `Sessions used: 0` keep this
ledger invisible to the hooks until then._

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
the PR to `main` is marked ready and the human merges. Recorded at planning,
2026-10-20 (brief L-gate: one session, one Fable checkpoint before the PR).

Standing agent authorized: _(none — every review is a one-shot spawn at a
checkpoint, §12 LA-5.)_

Branches: **one branch, `feat/precompact-handoff`** (from main 92c886b), ONE
feature PR to `main`, plus ONE `chore/precompact-handoff-bookkeeping` PR for
the post-merge Closing rows (agent may merge, §10 `records-only`). Target
version **1.68.0**.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [x] S1 — `hooks/lib/handoff-lib.sh` + `pre-compact.sh` + `handoff-gate.sh`, `hooks.json` PreCompact (timeout 15) + PreToolUse `.*` rows, token bands in `handoff-budget.sh` (byte fallback byte-identical), four-record `compact-resume.sh` (existing pins untouched), `commands/handoff.md` + `templates/session-handoff.md` + `templates/WORKFLOW.md` rows/prose + README + `commands/doctor.md` row, ~25 harness cases incl. counsel's two deadlock fixtures, CHANGELOG 1.68.0 + both manifests, OB-32 row text reported, pre-merge Closing rows fired (branch `feat/precompact-handoff`)
- [ ] Checkpoint ckpt-s1 — one-shot `reviewer` on **Fable** (boundary-class: `hooks/` + `tools/`) over `main..HEAD`, red-team list from the brief, plain-report read of the block/nudge/doctor strings; APPROVE → staging verify → PR ready, human merges

## Open questions

_Mirrored from the master plan with their recommendations; the human answers
before execution starts._

- OQ-1 (session id in the stamp: hook-written marker is the identity proof, `/handoff` writes `session unknown` when unknown) and OQ-3 (no `docs/WORKFLOW.md` sync in this mission) — locked 2026-10-20 at plan-judge as recommended.
- OQ-2 default auto-compact point (`DEFAULT_WINDOW=1000000`, `DEFAULT_PCT=95`, Assumed, fails toward not blocking) — **Recommendation:** ship as named constants; OB-32 confirms; `/fix` if wrong. Not blocking execution.

## Standing steers

(none)

## Closing

- [ ] version bumped + stamped · added 2026-10-20 (planner, pre-merge) — do: bump `plugins/agentic-workflow/.claude-plugin/plugin.json` and `plugins/agentic-workflow/package.json` `version` to 1.68.0 (§10 Version pin) and stamp this mission's CHANGELOG entry with it — when: this mission's CHANGELOG entry names a version — probe: `grep '"version"' plugins/agentic-workflow/.claude-plugin/plugin.json plugins/agentic-workflow/package.json`
- [ ] docs/record synced · added 2026-10-20 (planner, pre-merge) — do: CHANGELOG `[1.68.0]` entry, README sentence, `templates/WORKFLOW.md` hook rows + §3/§6.2 prose, `commands/doctor.md` row, `commands/handoff.md` + `templates/session-handoff.md` name the local canonical file — when: those are on the branch and `node tools/lint.mjs` is clean — probe: `grep -n "1.68.0" CHANGELOG.md` + `grep -c "Pre-compact snapshot\|Handoff gate" plugins/agentic-workflow/templates/WORKFLOW.md`
- [ ] live-verify at 400k · added 2026-10-20 (planner, post-merge) — do: promote to `.plans/OBLIGATIONS.md` as OB-32 verbatim (text in `.plans/precompact-handoff.sessions.md` S1 Do 10): a real session on orderly-agents with `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000` auto-compacts, the snapshot exists under the git dir, compact-resume names it, the doctor row is green, the observed auto-compact point is recorded against `DEFAULT_WINDOW`/`DEFAULT_PCT` — when: v1.68.0 is installed from `main` (plugin update + reload, after the merge) — probe: manual
- [ ] branch + worktree cleanup · added 2026-10-20 (planner, post-merge) — do: delete `feat/precompact-handoff` (local and remote) and prune any stale worktree — when: the feature PR is merged into `main` — probe: `gh pr list --state merged --head feat/precompact-handoff`
- [ ] repo WORKFLOW sync · added 2026-10-20 (planner, post-merge) — do: run `/agentic-workflow:sync` on this repo so `docs/WORKFLOW.md` carries the new hook rows at stamp v1.68.0 (OQ-3) — when: v1.68.0 is installed and the feature PR is merged — probe: `grep -c "protocol-master: v1.68.0" docs/WORKFLOW.md`

## Deviations

(none)

## Handoff log (newest first)

- 2026-10-20 planned: trio authored from `docs/product/decisions/2026-10-20-precompact-handoff-brief.md`; branch `feat/precompact-handoff` at 92c886b; OQ-1..3 to the owner before S1.

Next up: ckpt-s1 (Fable reviewer in flight on main..HEAD)
