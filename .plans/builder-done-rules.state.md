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
Sessions used: 5

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
- [x] S1-fix — corrective (same `devops`, branch `mission/builder-done-rules-p1`): detector name-key on raw text, one-corrective mechanics recall, canonical self-detect harness cases, two residual pointer swaps, dead export, v1.55.0 + CHANGELOG + docs/WORKFLOW.md §5 mirror
- [x] S2 — done-rules + trio templates + judge + Assumed/settle + Test policy + /fix (branch `mission/builder-done-rules-p2`, `backend`; AC-1..AC-11, AC-15b/c/d)
- [~] Checkpoint p2 — Fable reviewer: harnesses + diff `p1..p2` + per-AC verdict AC-1..AC-15 + PR-body numbers → PR to `main`
- [~] S2-fix — corrective (same `backend` on Fable, branch `mission/builder-done-rules-p2`): narrow settle 2b Assumed probe + in-place ratification semantics (F1); rename venture-facing done-rule labels AC-1..AC-4 → done-rule 1–4 (F2, owner); AC-15d method = metrics awk 6,898 (F3); drop mission.md provenance cite if headroom needed (F5)

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

- [x] version bumped + stamped · added 2026-10-11 (planner, pre-merge) — do: **P1 part fired 2026-10-11 (plugin.json 1.55.0, CHANGELOG [1.55.0], on 2d39298); P2 part fired 2026-10-11 (plugin.json 1.56.0 = 1, CHANGELOG [1.56.0] = 1, on 8664717).** **re-keyed 2026-10-11 (owner): P1 ships v1.55.0 on `mission/builder-done-rules-p1` with its own CHANGELOG entry and the docs/WORKFLOW.md §5 mirror; P2 ships v1.56.0 — the probe below applies per phase with its version.** Original: `plugins/agentic-workflow/.claude-plugin/plugin.json` `version` → `1.55.0` and the CHANGELOG entry `## [1.55.0] — <date>` names it, covering both phases — when: the S2 diff on `mission/builder-done-rules-p2` carries both edits and `node tools/lint.mjs` is green on that commit — probe: `grep -c '"version": "1.55.0"' plugins/agentic-workflow/.claude-plugin/plugin.json && grep -c '^## \[1.55.0\]' CHANGELOG.md` · fired 2026-10-11 (see do: — evidence on 8664717)
- [x] docs/record synced · added 2026-10-11 (planner, pre-merge) — do: **fired 2026-10-11: docs/WORKFLOW.md carries 5 `<!-- rule: ` hits = 4 fenced markers + 1 legitimate backticked mention in the ONE-prose-home paragraph (docs/WORKFLOW.md:443), §6 done-means and §10 Test policy = configured (docs/WORKFLOW.md:967); README names budgets + guard (on 8664717).** this repo's `docs/WORKFLOW.md` mirrors the template's §5 `<!-- rule: -->` markers, the §6 done-means line and the §10 **Test policy** row (`configured`), and `plugins/agentic-workflow/README.md` names the lint budgets + dedup guard — when: the p2 branch carries the mirrored sections and `grep -c 'rule: ' docs/WORKFLOW.md` returns 4 — probe: `grep -c '<!-- rule: ' docs/WORKFLOW.md; grep -c 'Test policy' docs/WORKFLOW.md plugins/agentic-workflow/README.md` · fired 2026-10-11 (see do: — evidence on 8664717)
- [x] before/after numbers recorded · added 2026-10-11 (planner, pre-merge) — do: **fired 2026-10-11: S2 handoff carries the four numbers.** write the four measured rows (description total chars, files > 400, `mission.md` bytes, `reviewer.md` bytes; baselines 9,687 · 16 · 21,336 · 14,308) into the S2 handoff; the Staging step copies them into the p2 PR body (AC-15d) — when: the S2 handoff entry in this ledger carries the four numbers — probe: `grep -c 'reviewer.md' .plans/builder-done-rules.state.md` · fired 2026-10-11 (see do: — evidence on 8664717)
- [ ] branch + worktree cleanup · added 2026-10-11 (planner, post-merge) — do: delete `mission/builder-done-rules-p1`, `mission/builder-done-rules-p2` and `mission/builder-done-rules` (local and remote) and prune stale worktrees — when: both phase PRs are merged AND the `lint` workflow is green on the merge commits — probe: `gh pr list --state merged --search builder-done-rules` + `gh run list --workflow lint --limit 3`
- [ ] live-verify after reinstall · added 2026-10-11 (planner, post-merge) — do: in a consumer session on v1.55.0, `/agentic-workflow:tune` renders the agents table with the trimmed one-sentence summaries, `/agentic-workflow:doctor` is clean, and a venture `/agentic-workflow:sync` carries the `rule-copy` ledger header into its `templates`-derived files — when: the release is installed (`/plugin update` + `/reload-plugins`) — probe: manual
- [ ] negative control — plan-judge REVISEs on a seeded miss · added 2026-10-11 (planner, post-merge) — do: on the first real mission planned after this one, before its S1, copy its trio to a scratch dir, delete one brief's `ACs:` citation and one `## Value sourcing` row, run a Fable plan-judge over the copy and record that it returns REVISE naming the uncovered id and the unsourced value (AC-8); a pass is n=1 evidence, record planner + judge model and date — when: a newer `.plans/<m>.md` with a `## Value sourcing` table exists and its first plan-judge verdict is on record — probe: manual

## Deviations
- 2026-10-11 S1 (builder design calls, recorded at checkpoint p1): detector requires the rule NAME key AND ≥2 word-bounded mechanics keys (lock said "two mechanics tokens"; ≥1 would flag the ledger template's own pointer) · §5 LA-5 incident wording "Fable spend" → "top-tier review spend" so the unfenced LA-5 tail is not itself a restatement · dropped boundary sentences from descriptions were NOT moved to bodies because each already exists there (chronicler:103/127, designer:131-132, advisor:35, curator:68, brainstormer:60, analyst:27-28).
- 2026-10-11 S2 runtime: the `backend` tune (codex:gpt-6-astra) failed before its first turn — codex-cli 0.160.1 returned 400 "The 'gpt-6-astra' model is not supported when using Codex with a ChatGPT account" (thread 01a129f2…, distillate `.plans/builder-done-rules.artifacts/s2-distillate.json`, zero changed paths). Owner decision (verbatim): "run Claude Fable 5.1". S2 re-spawned on the Claude `backend` role, model Fable, counted as session 3 (owner: "Re-spawn IS session 3"). Follow-up: re-verify the codex model via `/agentic-workflow:connect codex` (issue to file at close).

_Any departure from a brief — logged the moment it happens, with why (§4)._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what shipped, the verify signal, the branch, what the next
session needs._

- 2026-10-11 Checkpoint p2 verdict: REQUEST CHANGES (Fable). Scorecard DX 2 · QA 2 · Architecture 2 · Efficiency 3 · UX 2. Per-AC: AC-1..AC-8, AC-10..AC-14, AC-15a/b/c PASS · AC-9 FAIL (settle 2b probe over-matches: 15 prose hits, 0 real entries) · AC-15d partial (PR body not yet). F2 label collision surfaced; owner: rename to done-rule 1–4. F4 (orchestrator): docs rule-marker count is 5 (legitimate backticked mention at docs/WORKFLOW.md:443) — Closing row evidence corrected. S2-fix spawned: session 5/4 (1.25×, under the 1.5× stop; recorded, no scope decision required).
- 2026-10-11 S2 done (backend on Fable, 6 commits 9e47df4..8664717 on `mission/builder-done-rules-p2`): done-rules + `deviation` route (backend/frontend/mission.md), §6 done-means + §7 DONE + §10 Test policy row, AC-N + `## Value sourcing` + Assumed in templates, reviewer per-AC verdict + two REVISE items + test-policy reading + impeccable → §0.2 pointer, settle 2b Assumed probe, fix.md root-cause loop, adopt/bootstrap seed Test policy, docs/WORKFLOW.md mirror, v1.56.0 + CHANGELOG. Grep proofs AC-1..AC-11 all pass. Gates: lint exit 0 zero warn, lint-test 86. **Four numbers (AC-15d)**: description total 9,687 → 6,841 chars · files > 400: 16 → 0 · mission.md 21,336 → 21,307 B (29 B headroom) · reviewer.md 14,308 → 13,034 B · WORKFLOW.md 89.1 % of ceiling. Builder flags for review: mission.md headroom, settle 2b grep breadth, frontend AC-1 phrasing. Pre-merge Closing rows all fired. Checkpoint p2 reviewer (Fable) spawned on `mission/builder-done-rules-p1..p2`. Sessions used 4/4.
- 2026-10-11 S2 re-spawned on Claude (Fable) after the codex adapter failed with zero work — see Deviations. Sessions used stays 3/4.
- 2026-10-11 S2 spawned: `backend` on `mission/builder-done-rules-p2` (cut from P1 head e47fc98 + ledger commit), S2 brief `#s2`; Sessions used 3/4. Release lock: P2 = v1.56.0.
- 2026-10-11 Phase 1 landed: pushed e47fc98, CI green (ci-wait exit 0), staging step passed (lint clean on branch, `claude --plugin-dir` consumer load OK), PR #120 to `main` opened (v1.55.0) — awaiting Baker's merge (human-merge gate). Checkpoint p1 row stays [~] until merged. Sessions used 2/4. S2 cuts `mission/builder-done-rules-p2` from e47fc98.
- 2026-10-11 Checkpoint p1 re-review: APPROVE (Fable, narrow, on 6bff754+2d39298). Scorecard QA 3 · DX 2 · Efficiency 3 · Architecture 3. AC-12/13/14/15a all PASS. One orchestrator hygiene finding (ledger row grammar, this commit fixes it). Minor for P2 docs row: mirror the template's "ONE prose home" paragraph. Proceeding: push → CI → staging step → PR to main (v1.55.0).
- 2026-10-11 S1-fix done (devops, 6bff754 + 2d39298): name key on raw text, one-corrective recall, 6 harness cases (80→86), three residue pointer swaps (mission.md rule 6 + step 3, planner.md), dead export dropped, v1.55.0 + CHANGELOG + docs/WORKFLOW.md §5 mirror (4 markers) + README line. Gates: lint exit 0 zero warn, lint-test 86, agents-test ok. Numbers unchanged. Pre-merge Closing probed: version P1 part fired; docs P1 part done. Checkpoint p1 re-review (Fable, narrow, resumed reviewer) spawned on 839582d..HEAD.
- 2026-10-11 Checkpoint p1 verdict: REQUEST CHANGES (Fable). Scorecard QA 1 · DX 2 · Efficiency 3 · Architecture 2. Per-AC: AC-12 PASS (residue mission.md:74-75, planner.md:99-101 once AC-13 fixed) · AC-13 FAIL (`one-next-up` undetectable: name key tested after backtick strip; `one-corrective-retry` weak recall) · AC-14 PASS · AC-15a PASS (numbers reproduced exactly). Release policy surfaced; owner decided P1 = v1.55.0, P2 = v1.56.0. S1-fix spawned (session 2/4).
- 2026-10-11 S1 done (devops, 4 commits 3c8dcdf..a7e36b6 on `mission/builder-done-rules-p1`): BUDGETS + checkBudgets, RULES + checkRuleDedup (pure exports, lint-test 69→80 cases), four §5 rule fences + AC-13 scope note, three rule-copy blocks, pointer swaps (incl. flight-plan, tune.md ~102 found by the detector), 20 description trims. Numbers: descriptions 9,687→6,898 chars, files>400 17→0, mission.md 21,336→20,969 B, reviewer.md 14,308→13,438 B. Gates: lint exit 0 zero warn, lint-test 80 ok, agents-test 26 ok. Builder flags for review: detector = name key AND ≥2 mechanics keys; §5 LA-5 wording "Fable spend"→"top-tier review spend". Pre-merge Closing rows all keyed to S2 (version 1.55.0, docs mirror, numbers) — none fire at p1. Checkpoint p1 reviewer (Fable) spawned on `main..mission/builder-done-rules-p1`.
- 2026-10-11 S1 spawned: `devops` on branch `mission/builder-done-rules-p1` (cut from `mission/builder-done-rules` at f29a722), S1 brief in `.plans/builder-done-rules.sessions.md#s1`; Sessions used 1/4.
- 2026-10-11 plan: trio authored by the planner from the four decision docs; Estimate 4 (2 briefs + 2 Fable checkpoints, owner-decided); plan-judge APPROVED with six named fixes (applied same day); OQ-1 answered by the owner (codex `deviation:` prefix, enum unchanged). Ready for S1.

SUPERSEDED next-up (historical, do NOT read as state): S1
SUPERSEDED next-up (historical, do NOT read as state): Checkpoint p1
SUPERSEDED next-up (historical, do NOT read as state): S2
Next up: Checkpoint p2
