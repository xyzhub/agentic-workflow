---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: configurable-attribution — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6)._

Status: planned

Estimate: 1 session
Sessions used: 1
Reviewer runs: 2

_The budget lines above are read by the mission-budget hook every turn.
`Estimate: 1` = the one brief S1 (no `phases`; the one-shot checkpoint review
rides the same session, per the orchestrator's run brief). A corrective
`S1-fix` is counted when it fires, never pre-booked. The orchestrator bumps
`Sessions used:` the moment it starts a brief, a corrective or a loop tick
(`node ${CLAUDE_PLUGIN_ROOT}/tools/ledger.mjs configurable-attribution sessions +1`,
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
2026-10-15.

Standing agent authorized: _(none — every review is a one-shot spawn at a
checkpoint, §12 LA-5.)_

Branches: **one branch, `mission/configurable-attribution`** (from origin/main
f2f2edb), ONE feature PR to `main`, plus ONE `chore/configurable-attribution-bookkeeping`
PR for the post-merge Closing rows (agent may merge, §10 `records-only`).
Target version **1.62.0**.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [x] S1 — §10 Attribution row + `tools/attribution.mjs` (resolve · apply · check · import) + harness cases, four commands + commit hook + `ledger.mjs --commit` + foreign-runtime commit line read the row, bootstrap/adopt/sync write it, conform ladder `attribution-settings`, dogfood sync (stamp v1.62.0, `.claude/settings.json`), CHANGELOG 1.62.0 + bump, pre-merge Closing rows fired (branch `mission/configurable-attribution`)
- [~] Checkpoint ckpt-s1 — one-shot `reviewer` on **Fable** (boundary-class: `hooks.json` + `tools/`) over `main..HEAD`, incl. plain-report read of owner-facing strings; APPROVE → staging verify → PR ready, human merges

## Open questions

_Mirrored from the master plan with their recommendations; the human answers
before execution starts._

- Assumed 2026-10-15 → master plan Locked decisions (L3: default wording `Generated with The XYZ Protocol` for commit and PR)

## Standing steers

(none)

## Closing

- [ ] branch + worktree cleanup · added 2026-10-15 (planner, post-merge) — do: delete `mission/configurable-attribution` (local and remote) and prune any stale worktree — when: the feature PR is merged into `main` — probe: `gh pr list --state merged --head mission/configurable-attribution`
- [x] docs/record synced · added 2026-10-15 (planner, pre-merge) — do: CHANGELOG `[1.62.0]` entry, README tree line, `docs/WORKFLOW.md` synced to the template at stamp v1.62.0 with the §10 Attribution row, `.claude/settings.json` written — when: those four are on the branch and `node tools/lint.mjs` is clean — probe: `grep -n "1.62.0" CHANGELOG.md docs/WORKFLOW.md` + `node plugins/agentic-workflow/tools/attribution.mjs check` · fired 2026-10-15 (CHANGELOG [1.62.0], README tree line, docs/WORKFLOW.md stamped v1.62.0 (534c8a1); lint clean)
- [ ] live-verify after reinstall · added 2026-10-15 (planner, post-merge) — do: in a fresh session on this repo, a commit made by Claude ends with `Generated with The XYZ Protocol` and carries no `Co-Authored-By` trailer, and `ledger.mjs --commit` writes the same line in its body — when: v1.62.0 is installed (plugin update + reload, after the merge) — probe: manual (`git log -1 --format=%B`)
- [x] version bumped + stamped · added 2026-10-15 (planner, pre-merge) — do: bump `plugins/agentic-workflow/.claude-plugin/plugin.json` `version` to 1.62.0 (§10 Version pin) and stamp this mission's CHANGELOG entry with it — when: this mission's CHANGELOG entry names a version — probe: `grep '"version"' plugins/agentic-workflow/.claude-plugin/plugin.json` · fired 2026-10-15 (plugin.json 1.62.0 + CHANGELOG [1.62.0] at 2cc7cef)

## Deviations

(none)

## Handoff log (newest first)


- 2026-10-15 ckpt-s1 spawned (Fable, one-shot) over origin/main..2cc7cef — 2026-10-16 00:03

- 2026-10-15 S1 done (devops, 5 commits d85c208..2cc7cef): AC-1..11 pass; lint clean, ledger-test 68, hook-test 318, run-codex-test 253, ceremony-test 43, lint-test 106; plugin validate passed; --plugin-dir load deferred to checkpoint. Live proof: the session's own attribution switched to 'Generated with The XYZ Protocol' after apply.

- 2026-10-15 plan-judge APPROVE (Fable) — 4 advisory notes for S1: printf-safe custom text + quote test; bump Sessions used to 1 only; apply permission fallback = Edit + report

- 2026-10-15 plan-judge spawned (Fable, one-shot) over the trio — 2026-10-15 23:45

Next up: ckpt-s1 — Fable review in flight; APPROVE → PR to main for owner merge
