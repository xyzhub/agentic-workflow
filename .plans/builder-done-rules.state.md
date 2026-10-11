---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: builder-done-rules — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session
(§12 LA-6). Deploys to `.plans/builder-done-rules.state.md`._

Estimate: 4 sessions
Sessions used: 1

_Budget lines read by the mission-budget hook every turn; the overrun STOP and
its scope decision are §5 LA-1. `Estimate:` rises only as a dated locked
decision in the master plan._

Gate policy: **human-merge** — after APPROVE the phase passes the §10 Staging
step (tier-1 lint on the phase branch + `claude --plugin-dir` load) and opens
its PR to `main` for Baker to merge. Recorded at mission start 2026-10-11.
Checkpoints: both **Fable** (owner, 2026-10-11).

Standing agent authorized: (none — every review is a one-shot spawn at a
decision point, §12 LA-5.)

## Checklist

- [x] S1 — budgets + dedup detector + description trims + pointer swaps (branch `mission/builder-done-rules-p1`, `devops`; AC-12, AC-13, AC-14, AC-15a)
- [~] Checkpoint p1 — Fable reviewer: harnesses + diff `main..p1` + per-AC verdict AC-12..AC-15a → PR to `main`
- [ ] S2 — done-rules + trio templates + judge + Assumed/settle + Test policy + /fix (branch `mission/builder-done-rules-p2`, `backend`; AC-1..AC-11, AC-15b/c/d)
- [ ] Checkpoint p2 — Fable reviewer: harnesses + diff `p1..p2` + per-AC verdict AC-1..AC-15 + PR-body numbers → PR to `main`

## Open questions

_Mirrored from the master plan with recommendations. Must be empty before S1._

(none — OQ-1 answered by the owner 2026-10-11: keep the distillate enum; codex `blocked` + `blocked_reason: deviation: …` routes like a Claude `deviation`. Recorded in the master plan's Locked decisions.)

## Standing steers

_Verbatim human steers captured at checkpoints only (`- YYYY-MM-DD (ckpt <id>) — "<exact words>"`); retire by ~~strikethrough~~, never delete._

(none)

## Closing

_OB grammar per WORKFLOW.md §5; every row classified pre-merge (fires on the
phase branch before its checkpoint, rides the feature PR) or post-merge (fires
at a later `/agentic-workflow:settle` from `chore/builder-done-rules-bookkeeping`,
the mission's ONE bookkeeping PR). Rows are never deleted._

- [ ] version bumped + stamped · added 2026-10-11 (planner, pre-merge) — do: `plugins/agentic-workflow/.claude-plugin/plugin.json` `version` → `1.55.0` and the CHANGELOG entry `## [1.55.0] — <date>` names it, covering both phases — when: the S2 diff on `mission/builder-done-rules-p2` carries both edits and `node tools/lint.mjs` is green on that commit — probe: `grep -c '"version": "1.55.0"' plugins/agentic-workflow/.claude-plugin/plugin.json && grep -c '^## \[1.55.0\]' CHANGELOG.md`
- [ ] docs/record synced · added 2026-10-11 (planner, pre-merge) — do: this repo's `docs/WORKFLOW.md` mirrors the template's §5 `<!-- rule: -->` markers, the §6 done-means line and the §10 **Test policy** row (`configured`), and `plugins/agentic-workflow/README.md` names the lint budgets + dedup guard — when: the p2 branch carries the mirrored sections and `grep -c 'rule: ' docs/WORKFLOW.md` returns 4 — probe: `grep -c '<!-- rule: ' docs/WORKFLOW.md; grep -c 'Test policy' docs/WORKFLOW.md plugins/agentic-workflow/README.md`
- [ ] before/after numbers recorded · added 2026-10-11 (planner, pre-merge) — do: write the four measured rows (description total chars, files > 400, `mission.md` bytes, `reviewer.md` bytes; baselines 9,687 · 16 · 21,336 · 14,308) into the S2 handoff; the Staging step copies them into the p2 PR body (AC-15d) — when: the S2 handoff entry in this ledger carries the four numbers — probe: `grep -c 'reviewer.md' .plans/builder-done-rules.state.md`
- [ ] branch + worktree cleanup · added 2026-10-11 (planner, post-merge) — do: delete `mission/builder-done-rules-p1`, `mission/builder-done-rules-p2` and `mission/builder-done-rules` (local and remote) and prune stale worktrees — when: both phase PRs are merged AND the `lint` workflow is green on the merge commits — probe: `gh pr list --state merged --search builder-done-rules` + `gh run list --workflow lint --limit 3`
- [ ] live-verify after reinstall · added 2026-10-11 (planner, post-merge) — do: in a consumer session on v1.55.0, `/agentic-workflow:tune` renders the agents table with the trimmed one-sentence summaries, `/agentic-workflow:doctor` is clean, and a venture `/agentic-workflow:sync` carries the `rule-copy` ledger header into its `templates`-derived files — when: the release is installed (`/plugin update` + `/reload-plugins`) — probe: manual
- [ ] negative control — plan-judge REVISEs on a seeded miss · added 2026-10-11 (planner, post-merge) — do: on the first real mission planned after this one, before its S1, copy its trio to a scratch dir, delete one brief's `ACs:` citation and one `## Value sourcing` row, run a Fable plan-judge over the copy and record that it returns REVISE naming the uncovered id and the unsourced value (AC-8); a pass is n=1 evidence, record planner + judge model and date — when: a newer `.plans/<m>.md` with a `## Value sourcing` table exists and its first plan-judge verdict is on record — probe: manual

## Deviations

_Any departure from a brief — logged the moment it happens, with why (§4)._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what shipped, the verify signal, the branch, what the next
session needs._

- 2026-10-11 S1 done (devops, 4 commits 3c8dcdf..a7e36b6 on `mission/builder-done-rules-p1`): BUDGETS + checkBudgets, RULES + checkRuleDedup (pure exports, lint-test 69→80 cases), four §5 rule fences + AC-13 scope note, three rule-copy blocks, pointer swaps (incl. flight-plan, tune.md ~102 found by the detector), 20 description trims. Numbers: descriptions 9,687→6,898 chars, files>400 17→0, mission.md 21,336→20,969 B, reviewer.md 14,308→13,438 B. Gates: lint exit 0 zero warn, lint-test 80 ok, agents-test 26 ok. Builder flags for review: detector = name key AND ≥2 mechanics keys; §5 LA-5 wording "Fable spend"→"top-tier review spend". Pre-merge Closing rows all keyed to S2 (version 1.55.0, docs mirror, numbers) — none fire at p1. Checkpoint p1 reviewer (Fable) spawned on `main..mission/builder-done-rules-p1`.
- 2026-10-11 S1 spawned: `devops` on branch `mission/builder-done-rules-p1` (cut from `mission/builder-done-rules` at f29a722), S1 brief in `.plans/builder-done-rules.sessions.md#s1`; Sessions used 1/4.
- 2026-10-11 plan: trio authored by the planner from the four decision docs; Estimate 4 (2 briefs + 2 Fable checkpoints, owner-decided); plan-judge APPROVED with six named fixes (applied same day); OQ-1 answered by the owner (codex `deviation:` prefix, enum unchanged). Ready for S1.

SUPERSEDED next-up (historical, do NOT read as state): S1
Next up: Checkpoint p1
