---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: gatehouse-asks — ledger

Issue: #91, #92, #93, #94, #95, #96
Branch: `mission/gatehouse-asks` (cut from main @ eaac7fe) · Version: 1.53.2 → 1.54.0

Estimate: 3 sessions
Sessions used: 3

Gate policy: **human-merge** — after the Fable APPROVE the branch passes the §10
staging verify (tier-1 lint + plugin load) and the human merges the PR to `main`.

Standing agent authorized: (none — one-shot reviewer at the checkpoint, §12 LA-5)

## Checklist

- [x] S1 — all six Gatehouse asks + release hygiene (branch `mission/gatehouse-asks`)
- [x] S2 — owner follow-ups on PR #112: codex-edits-own-rules warning, `on-demand` phase + project-only agents in registry
- [~] Checkpoint — phase 1 **Fable** review + staging verify + PR to `main` (human merge) · Fable APPROVE 2026-10-07 06:52 · merge-pending (human)

## Open questions

(none)

## Standing steers

(none — the owner's planning-time steers "be conservative on token spending" and
"we need to be able to give each agent special skills as well" are locked
decisions in `.plans/gatehouse-asks.md`)

## Closing

- [ ] version bumped + stamped · added 2026-10-07 (planner, pre-merge) — do: `plugins/agentic-workflow/.claude-plugin/plugin.json` → `1.54.0` and the CHANGELOG entry `## [1.54.0] — 2026-10-07` names it — when: the CHANGELOG entry for this mission names a version — probe: `grep -n '"version": "1.54.0"' plugins/agentic-workflow/.claude-plugin/plugin.json && grep -n '^## \[1.54.0\]' CHANGELOG.md`
- [ ] docs/record synced · added 2026-10-07 (planner, pre-merge) — do: README.md + `plugins/agentic-workflow/README.md` `/tune` and `connect server` text name the new tune kinds (effort, tools, skills, prompt, boundary-escalation, diff, rebase), `tools/agents.mjs` and the executor fleet — when: `grep -n 'agents.mjs' plugins/agentic-workflow/README.md` returns a line on the branch — probe: `grep -n 'agents.mjs\|rebase' README.md plugins/agentic-workflow/README.md`
- [ ] registry harness wired into the gate · added 2026-10-07 (planner, pre-merge) — do: `tools/agents-test.mjs` exists and `tools/lint.mjs` registers `checkAgentsRegistryHarness` — when: `node tools/lint.mjs` is green on the branch with the check present — probe: `grep -n 'checkAgentsRegistryHarness' tools/lint.mjs && node tools/lint.mjs`
- [ ] issues closed · added 2026-10-07 (planner, post-merge) — do: confirm #91–#96 closed by the feature PR's `Closes` lines (reopen-and-comment any the PR body missed) — when: the feature PR is merged — probe: `for n in 91 92 93 94 95 96; do gh issue view $n --json state -q .state; done`
- [ ] branch + worktree cleanup · added 2026-10-07 (planner, post-merge) — do: delete `mission/gatehouse-asks` (local and remote) and prune stale worktrees — when: the feature PR is merged AND CI (`lint.yml`) is green on its merge commit — probe: `gh pr list --state merged --head mission/gatehouse-asks` + `gh run list --branch main -L 1`
- [ ] live-verify after reinstall · added 2026-10-07 (planner, post-merge) — do: in a consumer session on v1.54.0 run `/agentic-workflow:tune` (table renders from `agents.mjs`), `/agentic-workflow:tune reviewer boundary-escalation off` then `reset`, and `/agentic-workflow:doctor` in a project with a §10 Remote executor row — when: the release is installed (`/plugin update` + `/reload-plugins`) — probe: manual

## Deviations

- S1: `agents.mjs` reports `override.base_sha` by parsing the banner stamp, not hashing live (locked decision said node:crypto) — ruled correct by the Fable checkpoint 2026-10-07 (the field is the base the shadow was cut from); tune.md sentence corrected.
- S1: `assemblePrompt` has one caller in `main`, not two as the brief said.
- S1: missing-skill deviations attach to the done + failed distillate paths only, not the two blocked (binary/auth) paths.

## Handoff log (newest first)

- 2026-10-07 07:36 — S2 DONE, committed 758b01f (7 files, +123/−12). Gates: lint clean; run-codex-test 175; agents-test 24. Narrow Fable re-review spawned on d5311a2..758b01f (resumed checkpoint reviewer).

- 2026-10-07 07:30 — LOCKED (owner, 2026-10-07): "in the case of codex changing its own rules, just warn. and add the on-demand value". Estimate 2 → 3 (owner-requested follow-up = the scope decision). S2 spawned: (1) run-codex warns in distillate when a run changed `.codex/` paths, and `/tune reviewer boundary-escalation off` prints a warning when the reviewer runtime is codex — no revert/block/forced tier; (2) registry `phase` allows `on-demand` (default when absent) and lists project-only agents from `.claude/agents/` with `source`. Advisories 3–6 stay backlog. Narrow Fable re-review of the S2 delta follows. Sessions used 3/3.

- 2026-10-07 06:58 — Staging verify: lint clean, `claude plugin validate` passed, ci-wait GREEN on ca5c696. PR #112 opened to main (body carries the close keywords for #91–#96) — awaiting human merge. Sessions used 2/2 (on estimate).

- 2026-10-07 06:55 — Checkpoint **APPROVE** (Fable). Scorecard: Security 3 · QA 3 · DX 2 · Architecture 2 · UX n/a · Efficiency n/a. Blocking 1 (false node:crypto sentence, tune.md) fixed by orchestrator + 2 advisories (mission.md duplicate sentence, rebase no-stamp wording); lint clean. Blocking 2 (branch unpushed / CI not run) → push + ci-wait next. Advisory backlog (not looped): codex-runtime reviewer with boundary-escalation off should print a warning about reviewing its own rules file; registry schema `phase`/`override.kind` could be enums; agents-test lacks a `tools`-kind fixture and run-codex-test lacks a failed-path deviation case; dedupe-by-file header could say "project copy"; pre-existing duplicate **Issue tracker** row in templates/WORKFLOW.md §10.

- 2026-10-07 06:49 — S1 DONE, committed 55e4175 (16 files, +989/−90). Gates: lint clean; run-codex-test 172 cases clean; agents-test 19 cases clean; agents.mjs --json → 1.54.0, 20 agents. Builder deviations: agents.mjs parses base_sha from banner (no live hash); one assemblePrompt caller not two; skill deviations on done+failed paths only. Checkpoint: Fable reviewer spawned on 2a6581d..55e4175. Sessions used 2/2.

- 2026-10-07 06:33 — plan-judge APPROVE (Fable). Estimate corrected 1 → 2 sessions (1 brief + 1 checkpoint, per the plan's own counting; locked 2026-10-07, plan-judge finding). Advisory nits (a) mission.md:138 effort list, (c) direct resolveSkills invalid-name assertion folded into S1 Do. S1 spawned (Opus 4.8 builder), Sessions used 1/2.

- 2026-10-07 06:29 — plan-judge spawned (one-shot reviewer, Fable, read-only) over the trio; verdict pending.

(none yet)

Next up: S2 builder result → narrow Fable re-review of delta → push, CI, update PR #112
