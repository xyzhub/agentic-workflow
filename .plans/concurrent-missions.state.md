---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: concurrent-missions — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
at every merge and every gate result._

Estimate: 8 sessions
Sessions used: 0
Reviewer runs: 2
Status: parked

_`Estimate:` covers phase 1 only: S1–S6 (6) + ckpt-p1a + ckpt-p1 (2). Phase 2
is planned at 2 more (S7 + ckpt-p2) and is added here only by the owner's
dated decision on the GATE-P2 row below — the same edit raises this line to 10
(master plan PD-9; confirmed by the plan-judge 2026-11-19). No corrective is pre-booked. The orchestrator
increments `Sessions used:` write-ahead and flips `Status:` to `active` at the
first brief; `Reviewer runs:` is bumped at every one-shot reviewer spawn,
plan-judge included (`tools/ledger.mjs concurrent-missions reviewer-runs +1`).
`Status: parked` with `Sessions used: 0` keeps the hooks silent on this ledger._

Gate policy: **human-merge** — each phase's PR to `main` is the owner's to
merge. §10 Staging is `none` here, so the staging verify is lint green on the
phase branch plus a `claude --plugin-dir plugins/agentic-workflow` load.
Recorded 2026-11-19.

Priority: **planned and parked** (LD-7, owner, 2026-11-19). Not scheduled
anywhere outside this ledger. Supersedes `.plans/write-sets.*`.

Standing agent authorized: (none — every review and counsel is a one-shot
spawn at a decision point, §12 LA-5.)

Branches: `mission/concurrent-missions-p1` and `mission/concurrent-missions-p2`,
each cut from `main` when its phase starts, not before. One feature PR per
phase. The version of each landing is set after its merge by a follow-up
(LD-4), one open follow-up at a time (PD-12).

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [~] PRE-S1 — **awaiting owner. S1 is not spawned until all three are done:** (1) the owner's answers to OQ-1, OQ-2, OQ-3, OQ-5, OQ-6, OQ-8, OQ-9, OQ-10 and OQ-13 are written into the master plan as dated locks; (2) a `replan` has re-measured every anchor and both byte headrooms (`templates/WORKFLOW.md`, `commands/mission.md`) against `main` at un-park; (3) probes 1–5 are in the handoff log (worktree survival, create-only push, write to `_land` from an isolated session, token usage in a spawn's result, `gh auth status` listing every stored login).
- [ ] S1 — central lists become folders (branch `mission/concurrent-missions-p1`)
- [ ] S2 — a worktree per mission, the cap, ledger by branch
- [ ] S3 — bookkeeping that cannot conflict
- [ ] Checkpoint ckpt-p1a — review of S1–S3, no merge (one-shot reviewer on Fable: `tools/`, `hooks/`, `templates/` are security-boundary, `templates/gate-classes.md:32`)
- [ ] S4 — declared write sets, the overlap check, clash classes
- [ ] S5 — the queue: agent prepares, owner clicks
- [ ] S6 — burn meter, spend ceiling, the two-mission scenario
- [ ] Checkpoint ckpt-p1 — phase 1 review (one-shot reviewer on Fable) + PR to `main` per gate
- [ ] GATE-P2 — **BLOCKED. Phase 2 does not start.** S7 may begin only when BOTH conditions hold and the owner writes a dated decision on this row: **(a)** the host that will run the agents has no owner GitHub login stored — shown by listing the stored logins (`gh auth status` output pasted here), not by probing the ambient token — and the agents act as an identity that is not the owner's account (a GitHub App or a separate machine account installed on the repos; a token issued on the owner's own account does not count); **(b)** the first real two-mission run measured combined tokens/hour ≤ 2.2 × the single-mission baseline (`burn.mjs gate` output pasted here). Either one missing → this row stays `[ ]` and S7 is not spawned, whatever else is green. On reaching this row the orchestrator sets the header to `Status: blocked` and leaves it so until the owner's dated decision is written here; the Closing rows `baseline and ceiling` and `first real pair` fire while it is blocked — they produce condition (b). A blocked ledger must not silence another mission's hooks — S2 builds that rule; until S2 has landed, do not set `Status: blocked` on a ledger that is the newest in a checkout where another mission runs on a branch not named `mission/…`. If phase 2 never opens: the owner writes "phase 2 not opened" with a date here; this row, S7 and ckpt-p2 become `[~]`; one Closing row carrying both conditions is promoted to the register; the mission closes on phase 1 with `Estimate:` unchanged. Opening it raises `Estimate:` to 10 in the same edit and triggers a `replan` of S7.
- [ ] S7 — the approval signal, the guard, agent-merge (branch `mission/concurrent-missions-p2`; replan at the gate)
- [ ] Checkpoint ckpt-p2 — phase 2 review (one-shot reviewer on Fable: the merge guard is security-boundary) + PR to `main` per gate

## Open questions

_Mirrored from the master plan with their recommendations. OQ-1, 2, 3, 5, 6,
8, 9, 10 and 13 go to the owner before S1 starts (the PRE-S1 row); OQ-4, 7
and 11 before the gate opens. OQ-12 is closed._

- OQ-1 — un-park before or after continuous-operation lands? Recommendation: after.
- OQ-2 — who merges the version follow-up? Recommendation: the owner in phase 1; a narrow guard shape in phase 2.
- OQ-3 — how do this mission's own phases get their version? Recommendation: by the path it builds (fragment, then `land.mjs stamp`).
- OQ-4 — a tiny clash after approval in phase 2: fresh approval or not? Recommendation: decide at the gate; strict reading (fresh approval).
- OQ-5 — phase 1 has no approval step and tests each PR beside its branch instead of pushing an update onto it, where LD-1 says "updates and re-tests" (PD-4). Recommendation: accept both.
- OQ-6 — memo M2's values are under no lock (labels, `_land`, drain order, lock numbers). Recommendation: accept as recommended.
- OQ-7 — C10 (batch) and C12 (bookkeeping PRs under a server review rule). Recommendation: batch stays human-merged; the memo's pick for C12.
- OQ-8 — what counts as the acceptance run? Recommendation: fixture before the merge; the first real pair after it, as the rows below.
- OQ-9 — is "no additional overhead" owner minutes + setup time + tokens per mission? Recommendation: confirm.
- OQ-10 — if token usage cannot be read at all? Recommendation: two missions stay off.
- OQ-11 — GitHub App or machine account? Recommendation: either.
- OQ-12 — closed 2026-11-19: `Estimate:` 8 now, +2 at the gate (plan-judge confirmed).
- OQ-13 — an approved PR can be pulled from the queue; a finished mission holds its slot until it lands. Recommendation: yes to both.

Probe results owed, all by the orchestrator before S1, written into the
handoff log: probe 1 worktree survival (read again before S2) · probe 2
create-only push · probe 3 write to `_land` from an isolated session · probe 4
does a spawn's result expose token usage · probe 5 does `gh auth status` list
every stored login.

## Standing steers

(none)

## Closing

- [ ] no version edit on the branch · added 2026-11-19 (planner, pre-merge) — do: confirm
  the phase branch changes no version pin and carries this mission's changelog
  fragment instead — when: `changelog.d/concurrent-missions.md` exists on the
  phase branch and starts with a `bump:` line — probe: `head -1
  changelog.d/concurrent-missions.md` and `git diff main...HEAD --
  plugins/agentic-workflow/.claude-plugin/plugin.json
  plugins/agentic-workflow/package.json` (prints nothing)
- [ ] docs/record synced · added 2026-11-19 (planner, pre-merge) — do: plugin README, root
  README and `templates/concurrency.md` describe every new tool and the new
  command — when: `node tools/lint.mjs` prints `lint: clean` on the phase
  branch and each new tool name appears in the plugin README — probe: `node
  tools/lint.mjs` and `grep -c 'worktree.mjs\|fragments.mjs\|write-sets.mjs\|land.mjs\|burn.mjs'
  plugins/agentic-workflow/README.md`
- [ ] contradictions reworded · added 2026-11-19 (planner, pre-merge) — do: confirm the
  AC-22 sweep in S6's return covers C6, C7, C8, C9, C11 and C14 — when: each
  old sentence is absent from the plugin tree on the phase branch — probe:
  `grep -rn 'newest-touched\|version bumped + stamped\|next unused integer'
  plugins/agentic-workflow` (prints nothing)
- [ ] landed as vX.Y.Z · added 2026-11-19 (planner, post-merge) — do: run `land.mjs stamp`
  for each merged phase; the follow-up folds the fragment and sets the version
  in both pin files — when: the phase PR is merged — probe: `git show
  origin/main:plugins/agentic-workflow/.claude-plugin/plugin.json | grep
  version` and `ls changelog.d`
- [ ] branch + worktree cleanup · added 2026-11-19 (planner, post-merge) — do: delete this
  mission's phase branches (local and remote), the probe branch
  `probe/cm-worktree`, and prune stale worktrees — when: the phase PRs are
  merged and CI is green on their merge commits — probe: `gh pr list --state
  merged` + `gh run list`
- [ ] register header matches the new id rule · added 2026-11-19 (planner, post-merge) — do:
  bring `.plans/OBLIGATIONS.md`'s grammar text in line with
  `templates/obligations.md` — when: the phase 1 PR is merged — probe: `grep
  -c 'next unused integer' .plans/OBLIGATIONS.md` (prints 0)
- [ ] live-verify after reinstall · added 2026-11-19 (planner, post-merge) — do: confirm in
  a real session that a mission started on a `mission/…` branch in its own
  worktree reports its own ledger — when: the release is installed (plugin
  update + reload in the CLI, post-merge) — probe: manual
- [ ] protocol copy synced · added 2026-11-19 (planner, post-merge) — do: run
  `/agentic-workflow:sync` so `docs/WORKFLOW.md` carries the landed protocol —
  when: the release is installed and `docs/WORKFLOW.md:3` names an older
  version than the plugin manifest — probe: `sed -n 3p docs/WORKFLOW.md`
- [ ] baseline and ceiling · added 2026-11-19 (planner, post-merge) — do: run `burn.mjs
  baseline`, give the owner its proposed ceiling, and record the owner's
  confirmed value in the §10 **Spend ceiling** row (LD-2; the owner's
  decision, never the agent's) — when: three single-mission metrics sidecars
  exist under `.plans/` — probe: `ls .plans/*.metrics.jsonl` and `node
  plugins/agentic-workflow/tools/burn.mjs baseline`
- [ ] first real pair · added 2026-11-19 (planner, post-merge) — do: run the four
  `metrics` checks on the first two real missions that ran at once (AC-13
  worktrees, merged PRs, no hand update, no owner-typed command; AC-14 an
  overlap flag preceded any start; AC-15 clash-fix spawn count; AC-16 no
  bookkeeping conflict), run `burn.mjs gate`, and paste both results on the
  GATE-P2 row — when: a confirmed ceiling is in §10 and two missions' PRs that
  were open together are both merged — probe: `git worktree list`, `gh pr view
  <n> --json commits`, `node plugins/agentic-workflow/tools/burn.mjs gate`
- [ ] first venture run · added 2026-11-19 (planner, post-merge) — do: bring one worktree to
  life in a venture with a real recipe (install, secrets file, scratch
  database) and record setup time and any manual step — when: a venture's
  §10 carries a **Worktree recipe** other than `none` and a mission has
  started there — probe: manual

_Every row here closes inside the feature PRs or the one bookkeeping PR.
`baseline and ceiling` and `first real pair` fire while the mission sits
blocked at GATE-P2. `protocol copy synced` and `first venture run` are
expected to be promoted to the register at close. LD-4 adds one version follow-up per
landing on top of the two-PR close; in phase 1 the owner merges it (OQ-2)._

## Deviations

(none)

## Handoff log (newest first)

- 2026-11-18 2026-11-19 · plan-judge: REVISE (8 fixes: burn producer, S6 events, follow-up conflict, two ready PRs untested together, value sourcing, no PRE-S1 stop, probe timing, blocked ledger silencing other missions' hooks). Planner revised once; narrow re-judge: APPROVE. Estimate 8 (phase 1). Advisory for the un-park replan: S5 must name where 'land.mjs reviewed' stores its verdict. Advisory for ckpt-p1a: confirm legacy ledgers with no Status/Closed still resolve silent once a blocked ledger is stepped over. Parked; supersedes write-sets.

- 2026-11-19 plan: trio authored from the 2026-11-19 brief, memos, journeys,
  metrics and counsel; parked (LD-7); nothing built, no branch cut. Thirteen
  open questions go to the owner; the plan-judge has not run yet.

Next up: PRE-S1 — owner answers, replan, probes 1–5; then S1
