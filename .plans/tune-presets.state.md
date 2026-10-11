---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: tune-presets — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session
(§12 LA-6). Deploys to `.plans/tune-presets.state.md`._

Estimate: 4 sessions
Sessions used: 0

_Budget lines read by the mission-budget hook every turn; the overrun STOP and
its scope decision are §5 LA-1. `Estimate:` rises only as a dated locked
decision in the master plan. Shape amended by the owner 2026-10-11 from 6 to 4
(2 briefs + 2 checkpoints) — see the master plan's Locked decisions._

Gate policy: **human-merge** — after APPROVE the phase passes the §10 Staging
step (tier-1 lint on the phase branch + `claude --plugin-dir` load) and opens
its PR to `main` for Baker to merge. Recorded at mission start 2026-10-11.
Checkpoints: **p1 on Opus 5.5** (planner recommendation — configuration-only
diff: markdown + JSON + lint code, no auth / money / schema / boundary; §5 rule
7 does not require Fable; the owner may raise it to Fable at hand-off);
**p2 on Fable** (hook stack + a child process's permission flags — boundary
class). Plan-judge: Fable, one pass; named cell fixes applied by the planner
without a re-judge.

Token economies (owner, 2026-10-11): one builder per phase — a corrective
**resumes** that builder with a narrow note; reviewers re-run gates + per-AC
verdict + diff-touched lenses only, ≤ one page, and a post-corrective pass
reviews the corrective diff only; no counsel at checkpoints; the chronicler runs
ONCE at mission close (the orchestrator updates the status page in between);
AC-9's Haiku runs stay (≈$0.004 each — they are the evidence).

Standing agent authorized: (none — every review is a one-shot spawn at a
decision point, §12 LA-5.)

## Checklist

- [ ] S1 — presets JSON + lint/fixtures + registry bump + `tune preset` verbs + bootstrap/adopt question + `/doctor` checks + docs, v1.57.0 (branch `mission/tune-presets-p1`, `devops`; AC-1, AC-2, AC-3, AC-4, AC-5, AC-11, AC-12)
- [ ] Checkpoint p1 — Opus 5.5 reviewer: lint (zero `warn:`) + lint-test + agents-test + diff `main..p1` + per-AC verdict AC-1, 2, 3, 4, 5, 11, 12 → PR to `main` (v1.57.0)
- [ ] S2 — `run-claude.mjs` + harness + hook silencer + Haiku shadows/re-route + `claude-p` in mission.md + AC-9 runs + tick/mission budgets, v1.58.0 (branch `mission/tune-presets-p2`, cut from the P1 head, `backend`; AC-6, AC-7, AC-8, AC-9, AC-10)
- [ ] Checkpoint p2 — Fable reviewer: all harnesses + diff `p1..p2` + per-AC verdict AC-6..AC-10 with the AC-9 artifacts read + Security lens on the child flags and on P1's boundary-class content (Haiku `allowed_tools` rows, lint bare-`Bash` rule, mission.md rule-7 text) → PR to `main` (v1.58.0); then the mission close (chronicler once)

## Open questions

_Mirrored from the master plan with recommendations. Must be empty before S1._

(none — every value is settled by the owner's locked decisions and the
2026-10-11 shape amendment; planner refinements are marked in the master plan.)

## Standing steers

_Verbatim human steers captured at checkpoints only (`- YYYY-MM-DD (ckpt <id>) — "<exact words>"`); retire by ~~strikethrough~~, never delete._

(none — the owner's 2026-10-11 shape steer predates the first checkpoint and is quoted verbatim in the master plan's "Shape amended" locked decision.)

## Closing

_OB grammar: `- [ ] OB-<n> · added YYYY-MM-DD (<source>, pre-merge|post-merge) — do: … — when: <observable condition> — probe: <command | manual>`. Rows are never deleted; a fired row appends `· fired YYYY-MM-DD (<evidence>)`; a `[~]` row deferred past close carries `→ OB-<n>`. `Closed:` is written only once every row is `[x]` or `[~] … → OB-<n>`. Two PRs per phase pair: the feature PRs the human merges, and ONE `chore/tune-presets-bookkeeping` PR for the post-merge rows. The negative-control plan-judge row is already OB-24 in `.plans/OBLIGATIONS.md` — not duplicated here._

- [ ] version bumped + stamped (P1) · added 2026-10-11 (planner, pre-merge) — do: `plugins/agentic-workflow/.claude-plugin/plugin.json` → `1.57.0` and the CHANGELOG `## [1.57.0]` entry stamped — when: the S1 diff on `mission/tune-presets-p1` carries both and lint is green — probe: `grep -c '"version": "1.57.0"' plugins/agentic-workflow/.claude-plugin/plugin.json` + `grep -c '^## \[1.57.0\]' CHANGELOG.md` (both 1)
- [ ] version bumped + stamped (P2) · added 2026-10-11 (planner, pre-merge) — do: `plugin.json` → `1.58.0` and the CHANGELOG `## [1.58.0]` entry stamped with the AC-9 numbers — when: the S2 diff on `mission/tune-presets-p2` carries both and every harness is green — probe: `grep -c '"version": "1.58.0"' plugins/agentic-workflow/.claude-plugin/plugin.json` + `grep -c '^## \[1.58.0\]' CHANGELOG.md`
- [ ] metrics baselines recorded · added 2026-10-11 (planner, pre-merge) — do: `docs/product/decisions/2026-10-11-tune-presets-metrics.md` §1 gains the `wc -c` baseline row (tune.md 12,213 · mission.md 21,384 · doctor.md 7,699 · bootstrap.md 10,718 · adopt.md 8,025 · templates/WORKFLOW.md 106,973) and §6 drops the AC-7/AC-10 "open" line (locked 2026-10-11) — when: the row is in the S1 diff — probe: `grep -c 'wc -c' docs/product/decisions/2026-10-11-tune-presets-metrics.md` ≥ 1
- [ ] AC-9 evidence filed · added 2026-10-11 (planner, pre-merge) — do: `.plans/tune-presets.artifacts/ac9-{chronicler,intake,overflow}.json` + `.events.jsonl` committed on `mission/tune-presets-p2`, numbers quoted in the S2 handoff and the P2 PR body — when: the three runs completed (any of done / blocked-budget with a schema-valid distillate) — probe: `ls .plans/tune-presets.artifacts/ac9-*.json | wc -l` = 3
- [ ] docs/record synced · added 2026-10-11 (planner, pre-merge) — do: chronicler runs ONCE at mission close on `mission/tune-presets-p2`: JOURNEY entry for both releases, overview/status page, CHANGELOG cross-check; `docs/WORKFLOW.md` §10 carries `**Tune preset** | balanced (default, 2026-10-11)` and the Runtimes row names `claude-p` — when: checkpoint p2 APPROVED — probe: `grep -c 'Tune preset' docs/WORKFLOW.md` ≥ 1 + `grep -c 'tune-presets' docs/product/JOURNEY.md` ≥ 1
- [ ] branch + worktree cleanup · added 2026-10-11 (planner, post-merge) — do: delete `mission/tune-presets-p1`, `mission/tune-presets-p2` (local + remote) and prune the AC-9 scratch worktree `/tmp/tp-ac9` and any `/tmp/tp-scratch` — when: both phase PRs are merged to `main` and CI is green on the merge commits (§10: merge IS the release) — probe: `gh pr list --state merged --search "tune-presets"` + `git worktree list`
- [ ] live-verify after reinstall · added 2026-10-11 (planner, post-merge) — do: in a consumer session on v1.58.0: `/agentic-workflow:tune preset show` renders the Balanced matrix with no `*`; `/agentic-workflow:doctor` is clean on this repo (§10 row `balanced`, no preset shadows); `/agentic-workflow:tune preset lean` on a scratch adopted project writes the differing shadows and `preset reset` removes exactly them; one `claude-p` chronicler run through `mission.md` step 2 returns a distillate and the orchestrator commits its `changed_paths`; the mission-budget hook prints `· tick k/N tokens` on a ledger seeded with `Tick budget:` — when: v1.58.0 is installed (`/plugin update` + `/reload-plugins`) — probe: manual

## Deviations

_Any departure from a brief — logged here the moment it happens, with why.
Deviating is allowed; deviating silently is not (§4)._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs. Newest on top; crash-safe by write-ahead._

- 2026-10-11 planner: trio authored at `11e04fb` on `mission/tune-presets`; shape amended by the owner to 2 phases / Estimate 4 before any brief ran; no open questions; S1 is ready for `devops` on `mission/tune-presets-p1`.

Next up: S1
