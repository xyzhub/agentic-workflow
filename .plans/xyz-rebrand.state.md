---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: xyz-rebrand — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead: update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6)._

Status: planned

Queue: **behind goal-statement E2 — Interactive and structured owner surfaces**
(`docs/product/decisions/2026-10-12-goal-statement.md` §"Workstreams, in
execution order"; E0 closed 2026-10-13, E1 closed 2026-10-15). L4, owner
2026-10-16: "Queue behind current goal item". S1 starts only after E2's mission
closes (Q1–Q3 settled 2026-10-16).

Estimate: 5 sessions
Sessions used: 0
Reviewer runs: 1

_The budget lines above are read by the mission-budget hook every turn.
`Estimate: 5` = 3 builder briefs (S1, S2, S3) + 2 one-shot Fable checkpoints
(ckpt-p1, ckpt-p2), per WORKFLOW §5 LA-1 ("briefs + checkpoints only"); the
per-phase justification is in the master plan. A corrective `S<n>-fix` is
counted when it fires, never pre-booked. The overrun stop fires at **k ≥ 8**.
The orchestrator bumps `Sessions used:` the moment it starts a brief or a
checkpoint (`node ${CLAUDE_PLUGIN_ROOT}/tools/ledger.mjs xyz-rebrand sessions +1`,
write-ahead) and flips `Status:` to `active` at the first one. `Reviewer
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
it. The subset the owner may choose at that stop: P1 alone (3 sessions) ships
`xyz` 2.0.0 and the migrator, but only when it is held off `main` until a
`renames` path exists. A P1-only merge strands installed old ids (master plan
Q1)._

Gate policy: **human-merge**. After each Fable APPROVE the branch is verified
(this repo's §10 Staging = `none`: tier-1 lint + `claude --plugin-dir
./plugins/xyz` load). After ckpt-p2 the single PR to `main` is marked ready and
the human merges. Recorded at planning, 2026-10-16 (L4: "careful").

Standing agent authorized: _(none — every review is a one-shot spawn at a
checkpoint, §12 LA-5.)_

Branches: **one branch, `mission/xyz-rebrand`**, cut from `plan/xyz-rebrand`
(which carries the decision records and this trio) and rebased on
`origin/main` at start. It holds both phases and ONE feature PR to `main`
(Q1), plus ONE `chore/xyz-rebrand-bookkeeping` PR for the post-merge Closing
rows (agent may merge, §10 `records-only`). Target version **2.0.0**.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [ ] S1 — `tools/rename.mjs` + `tools/rename-test.mjs` (lint-wired), `plugin-renamed` ladder item + hook-test cases, sync step 3.7 bullet (branch `mission/xyz-rebrand`)
- [ ] S2 — dogfood rename: `git mv` to `plugins/xyz`, read-both identifiers, live-reference sweep, `checkLegacyName` lint guard, `/sync`-way resync at v2.0.0, docs/product living docs, CHANGELOG 2.0.0, Missions change list (branch `mission/xyz-rebrand`)
- [ ] Checkpoint ckpt-p1 — one-shot `reviewer` on **Fable** (boundary-class: hooks.json, tools/, codex.rules) over `main..HEAD`, AC-1..AC-17; APPROVE advances to P2 (no PR yet)
- [ ] S3 — scratch-marketplace `renames` probe → marketplace `renames` entry, J1 fresh install, J3 scratch migration (missions-app clone), README move section (branch `mission/xyz-rebrand`)
- [ ] Checkpoint ckpt-p2 — one-shot `reviewer` on **Fable** over `main..HEAD`, AC-18..AC-22; APPROVE → staging verify → PR ready, human merges

## Open questions

_Mirrored from the master plan with their recommendations; the human answers
before S1 starts._

- Q1–Q3 settled 2026-10-16 (plan-judge APPROVE, Fable; none are owner calls) → master plan "Settled":
  - Q1: one feature PR after ckpt-p2;
  - Q2: rewrite the living docs/product files per D4 row 18;
  - Q3: the orchestrator stamps `Closed: 2026-08-03` on context-economy and runs `rename.mjs apply` on `.plans/` after S2, logged as a deviation. Lint stays clean: that ledger has no `## Closing` block.
- Assumed 2026-10-16 → master plan Locked decisions (probe mechanics: `CLAUDE_CONFIG_DIR` isolation, local-directory marketplace, `validate` accepting `renames`) — ratified by S3's transcript

## Standing steers

(none)

## Closing

- [ ] version bumped + stamped · added 2026-10-16 (planner, pre-merge) — do: bump `plugins/xyz/.claude-plugin/plugin.json` `version` to 2.0.0 (§10 Version pin, re-pointed to the new path in S2) and stamp this mission's CHANGELOG entry `[2.0.0]` with it — when: the CHANGELOG `[2.0.0]` entry and plugin.json 2.0.0 are both on the branch — probe: `grep '"version"' plugins/xyz/.claude-plugin/plugin.json && grep -n '^## \[2.0.0\]' CHANGELOG.md`
- [ ] docs/record synced · added 2026-10-16 (planner, pre-merge) — do: README (H1 + move section), plugin README, `docs/WORKFLOW.md` re-synced at stamp v2.0.0 with §10 rows on `plugins/xyz`, AGENTS.md/CLAUDE.md, the docs/product living docs (Q2), and the Missions change list file all land on the branch — when: `node tools/lint.mjs` (incl. `checkLegacyName`) is clean on the branch and the change-list file exists — probe: `node tools/lint.mjs && grep -m1 protocol-master docs/WORKFLOW.md && ls docs/product/decisions/2026-10-16-xyz-rebrand-missions-change-list.md`
- [ ] branch + worktree cleanup · added 2026-10-16 (planner, post-merge) — do: delete `mission/xyz-rebrand` and `plan/xyz-rebrand` (local and remote) and prune stale worktrees, incl. any S3 scratch worktree — when: the feature PR is merged into `main` and CI lint is green on its merge commit — probe: `gh pr list --state merged --head mission/xyz-rebrand` + `gh run list --branch main -L 1` + `git worktree list`
- [ ] live-verify after reinstall on this Mac · added 2026-10-16 (planner, post-merge) — do: `/plugin marketplace update xyz` shows Claude Code's rename line; `/plugin install xyz@xyz`; in a fresh session on this repo `/help` lists 28 `/xyz:*` commands and no old-prefix row, the on-main warning and the conform-check hooks fire (conform reports this repo conformant at v2.0.0), and `~/.claude/settings.json` `enabledPlugins` holds `xyz@xyz` and not the old id — when: the feature PR is merged into `main` and the owner has the Missions change list in hand (counsel: Missions reads the old cache path) — probe: manual (`/help`) + `grep -n '"xyz@xyz"' ~/.claude/settings.json`
- [ ] Orderly migrates via /xyz:sync · added 2026-10-16 (planner, post-merge) — do: in an Orderly session run `/xyz:sync`, review `git diff`, commit through Orderly's own flow; then metrics C8–C12 hold in Orderly (live files clean, enabledPlugins `xyz@xyz`, closed history unchanged, conform no `plugin-renamed` gap, a second sync is a no-op). Estimate: 1 Orderly session (sync + review), not counted in this mission's budget — when: xyz 2.0.0 is installed on the machine that holds the Orderly checkout and an Orderly session is open — probe: in Orderly `node "$CLAUDE_PLUGIN_ROOT/tools/rename.mjs" check` exits 0
- [ ] Missions adapts per the change list (fold into OB-30) · added 2026-10-16 (planner, post-merge) — do: in `xyzhub/missions`, apply `docs/product/decisions/2026-10-16-xyz-rebrand-missions-change-list.md` together with OB-30's pin bump (vendor → xyz 2.0.0), then `pnpm test` + `scripts/verify-vendor.mjs` green. Estimate: 1–2 Missions sessions (≈30 source files + fixtures, 579 occurrences outside `vendor/`), not counted in this mission's budget; at this mission's close the row defers `[~] … → OB-30` (folded into that register row) — when: xyz 2.0.0 is on `main` and a Missions session is open — probe: `grep version= /Users/baker/Playground/missions-app/vendor/VERSION`

## Deviations

(none)

## Handoff log (newest first)

- 2026-10-16 plan-judge APPROVE (Fable) — 3 record fixes folded in; Q1-Q3 settled as recommended (judge: not owner calls); context-economy ledger stamped Closed 2026-08-03 by the orchestrator

- 2026-10-16 plan-judge spawned (Fable, one-shot) over the trio — 2026-10-16 03:32

- 2026-10-16 planned: trio authored by the planner (tree edaf73f, plugin v1.62.0). 3 briefs + 2 Fable checkpoints = Estimate 5. Queued behind goal-statement E2 (L4). Q1–Q3 settled by the plan-judge (APPROVE, Fable) and the record fixes were folded in on the same day.

Next up: queued, not runnable now. S1 waits until goal-statement E2 closes (L4); the plan-judge has already APPROVED, so S1 is next once the queue reaches this mission.
