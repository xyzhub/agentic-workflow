---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: continuous-operation — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6). The docs are the source of truth
(brief, owner 2026-10-27): this ledger, `.plans/OBLIGATIONS.md`, the four
decision docs and the handoff are the only memory a round or a resumed
session rebuilds from._

Status: active

Estimate: 6 sessions
Sessions used: 1
Reviewer runs: 1

_The budget lines above are read by the mission-budget hook every turn.
`Estimate: 6` = the six briefs S0–S5 (mode `phases`, owner-locked in brief
L1 "Safe v1, 6 sessions"); the six one-shot Fable checkpoints `ckpt-s0..s5`
and the S5 security pass ride INSIDE their sessions, as provider-adaptive's
`ckpt-s2` did. A corrective `S<n>-fix` is counted when it fires, never
pre-booked. The orchestrator bumps `Sessions used:` the moment it starts a
brief, a corrective or a loop tick
(`node ${CLAUDE_PLUGIN_ROOT}/tools/ledger.mjs continuous-operation sessions +1`,
write-ahead) and flips `Status:` to `active` at the first one; `Reviewer
runs:` is bumped at every one-shot reviewer spawn, plan-judge, security pass
and checkpoint included (`… reviewer-runs +1`). `Status: planned` +
`Sessions used: 0` keep this ledger invisible to the hooks until then._

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

Gate policy: **human-merge** — after APPROVE at `ckpt-s5` the branch is
verified (this repo's §10 Staging = `none`: tier-1 lint + `claude
--plugin-dir` load), then the PR to `main` is marked ready and the human
merges. Recorded at planning, 2026-10-27 (brief L5: strict posture — a Fable
checkpoint per phase + a security pass; the owner merges).

Standing agent authorized: _(none — every review, the security pass and
every checkpoint is a one-shot spawn, §12 LA-5.)_

Branches: **one branch, `feat/continuous-operation`** — from
`plan/continuous-operation` (OQ-5) so the four decision docs and the P0
probe record ride the build branch. Six phases in sequence on it; ONE feature
PR to `main`, plus ONE `chore/continuous-operation-bookkeeping` PR for the
post-merge Closing rows (agent may merge, §10 `records-only`). Target
version: **1.70.0** (this mission runs before the xyz-rebrand's 2.0.0 — L5).

Secrets rule (brief, every session): tokens, keys and credentials live only
in the container's environment — never in this ledger, a handoff, a `round:`
line, an alert, `pending-gates.md`, the decision log, a harness log or a
committed file; variable NAMES only. A hand-off entry that quotes an env
value is a deviation. No API key reaches a child in v1 (L3).

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [~] S0 — OB-32 fired on orderly-agents (four observations + `· fired` line; `HL_DEFAULT_PCT` corrected if the observed point disagrees); probes (a) settings env → hooks, (b) plugin-file reads in `-p` children and background subagents, (c) child-exit wake path + foreground `--max` fallback, (d) cron fire vs typed prompt, (e) `continue:false` under `-p` incl. the subagent case, (f) `--max-budget-usd` spelling — recorded as a `## P0 probe record` table in the brief with verbatim invocations; ckpt-s0 (Fable) APPROVE (branch `feat/continuous-operation`)
- [ ] S1 — `tools/runner.mjs` next/round/wait/stop/pause/resume/status with the exit contract (0/10/20/21/22/30/40/75/1), lock + stale reclaim, STOP file, daily 5M cap from reported usage, tick/mission/overrun parity with `mission-budget.sh` (shared fixture), idle backoff 5→15→60 + ≤4 operate/day, crash-loop stop on the 3rd, no-progress stop on the 2nd, `22 no-record` docs check, docs-only round prompt with the Docs-vs-code rule, `round:` line + `rounds/<n>.events.jsonl` 0600 under the git common dir; `tools/redact.mjs` (hl_redact parity + exact-value scrub + five-canary negative test); `templates/runner-config.json`; child env `UNATTENDED=1`, no `CHILD`, no `ANTHROPIC_API_KEY`; `headless.mjs run` on `roundOnce()`; `tools/runner-test.mjs` + lint `checkRunnerHarness`; ckpt-s1 APPROVE
- [ ] S2 — `commands/run.md` thin parent (background wake or foreground `--max` per probe (c)); `hl_unattended`; unattended handoff gate fails CLOSED (JSON stop or marker per probe (e); never for an `Agent` block; managed byte-identical); `runner.mjs` → `21` + the one `handoff-failed` deviation write + the 1/2/3 ladder; compact-resume branch 3 unattended wording; `hl_threshold` effective window (env → settings env → autoCompactWindow → default); `handoff.md` managed copy; bootstrap/sync write settings `env` 200000 adopt-never-overwrite + §10 **Compaction window** row + doctor bullet; §6.2 `unattended-ask` fenced rule + 15 pointer sentences + `RULES` entry + lint-test cases; `plugin-read.sh` allow hook iff probe (b) showed refusals; hook-test block; ckpt-s2 APPROVE
- [ ] S3 — `tools/fidelity.mjs` extract/compare/restate-prompt/score; fixtures (seed, handoff, ledger, rubric, six red cases incl. `window-mismatch` and `docs-only`); `tools/fidelity-test.mjs` paths (a) compaction via pre-compact + compact-resume and (b) restart via `roundPrompt`; all red cases red in one run; lint `checkFidelityHarness`; `.github/workflows/fidelity-model.yml` `workflow_dispatch` only, haiku, skip-green without the secret; ckpt-s3 APPROVE
- [ ] S4 — `tools/gate.mjs` open/poll/status/expire (row before send, outbox, slack + telegram transports by env NAME, allow-listed ids, `yes|no <reason>|hold`, receipts, reminders 24/48 h, 72 h expiry per OQ-1, decision-log row with message id; NO answer/record CLI); owner-only human-fired classes (prod merge/deploy/spend/publish/kill/scope → `acknowledged`, never an action — L2); client route `decision` + `staging-merge` only when granted; `runner.mjs` polls + `20`; `hooks/lib/gate-guard.sh` + hooks.json group + `codex.rules` mirror (BLOCK `gate.mjs record|answer`, `runner.mjs resume`, writes to pending-gates/decision-log, wrapper shapes); `tools/gate-test.mjs` matrix + `SECRET` grep + lint `checkGateHarness`; hook-test cases; `connect approver owner|client`; §12 rules 1/4 + Owner channel row clause + gate-classes `staging-merge` + §6.2 retargeted at `gate.mjs`; ckpt-s4 APPROVE
- [ ] S5 — one-shot `security` pass over `main..HEAD` (AC-24 threat list) with HIGH/MEDIUM fixed in-session; README `## Run 24/7`; runbook `## Unattended run`; doctor **Runner** bullet; `plugin.json` + `package.json` → 1.70.0; CHANGELOG `[1.70.0]` incl. one line per probe fact; OB-35/36/37 row texts reported; pre-merge Closing rows fired; ckpt-s5 (Fable, AC-1..AC-27) APPROVE → staging verify → PR to `main` ready; human merges

## Open questions

_Mirrored from the master plan with their recommendations; the human answers
before execution starts._

- **OQ-1 — gate expiry semantics (AC-19)**: memos say expiry = reject; journeys say never auto-reject-and-proceed. **Recommendation:** at 72 h the row closes `expired` with no decision recorded and nothing proceeds; the next round that needs it opens a NEW gate (new id) saying "re-asking: gate <old> expired on <date>"; only a human's word is ever a `no`.
- **OQ-2 — project config location (AC-8, AC-20)**: `.claude/runner.json` (committed, non-secret, schema `templates/runner-config.json`) vs new §10 rows. **Recommendation:** the JSON file, plus ONE §10 **Runner** row so `/doctor` can see it.
- **OQ-3 — runner state dir (AC-6)**: git common dir `agentic-workflow/runner/` vs XDG vs `/var/lib`. **Recommendation:** the git common dir with the `hl_paths` XDG fallback — never tracked, shared by worktrees, beside the handoff state.
- **OQ-4 — model job credential (AC-18)**: a repository secret `CLAUDE_CODE_OAUTH_TOKEN` on this plugin repo's CI, `workflow_dispatch` only, skip-green when absent. **Recommendation:** yes — it is CI, not a client container, so L3's no-API-key rule is not crossed.
- **OQ-5 — build branch base**: `feat/continuous-operation` from `plan/continuous-operation`. **Recommendation:** yes.

## Standing steers

(none)

## Closing

- [ ] version bumped + stamped · added 2026-10-27 (planner, pre-merge) — do: bump `plugins/agentic-workflow/.claude-plugin/plugin.json` and `plugins/agentic-workflow/package.json` `version` to `1.70.0` (§10 Version pin) and stamp this mission's CHANGELOG entry with it — when: this mission's CHANGELOG entry names a version — probe: `grep '"version"' plugins/*/.claude-plugin/plugin.json plugins/*/package.json`
- [ ] docs/record synced · added 2026-10-27 (planner, pre-merge) — do: CHANGELOG entry; `commands/run.md`; `commands/handoff.md`, `bootstrap.md`, `sync.md`, `doctor.md`, `connect.md`, `mission.md`, `autopilot.md` + the 15 ask-site pointer sentences; `templates/WORKFLOW.md` §5/§6.2/§10/§12 edits; `templates/gate-classes.md`; `templates/runner-config.json`; `templates/engineering-runbook.md`; README `## Run 24/7` — when: those are on the branch and `node tools/lint.mjs` is clean — probe: `grep -c "unattended-ask" plugins/*/templates/WORKFLOW.md` ≥ 1 and `grep -c "Run 24/7" plugins/*/README.md` ≥ 1
- [ ] probe record committed first · added 2026-10-27 (planner, pre-merge) — do: the brief's `## P0 probe record` section (S0) is added in a commit that is an ancestor of the first commit touching `plugins/*/tools/runner.mjs` on the branch, so every `Assumed` lock was decided by an observed fact before the code that depends on it — when: S1 is committed — probe: `git log --format=%h main..HEAD -- docs/product/decisions/2026-10-27-continuous-operation-brief.md | tail -1` precedes `git log --format=%h main..HEAD -- 'plugins/*/tools/runner.mjs' | tail -1` in `git log --oneline main..HEAD`
- [ ] no secret in any committed file · added 2026-10-27 (planner, pre-merge) — do: the five harness canaries and every env NAME's value appear in no committed file outside `*-test.mjs` and `tools/fixtures/` — when: S5 is committed — probe: `git grep -n "SECRET\|xoxb-TEST\|ghp_TEST\|sk-TEST" -- ':!*-test.mjs' ':!*/fixtures/*'` → 0 lines
- [ ] 24h live run · added 2026-10-27 (planner, post-merge) — do: promote to `.plans/OBLIGATIONS.md` as **OB-35** verbatim (text in `.plans/continuous-operation.sessions.md` S5 Do 8): ≥ 24 h of `/agentic-workflow:run` on one client container under that client's subscription, ≥ 2 compactions/restarts counted from the round log, 0 owner corrections about lost context, metrics §2 fields recorded, fidelity `score` at each compaction/restart — when: v1.70.0 is installed from `main` on a client container with an active mission ledger — probe: manual
- [ ] OB-1 fold-in · added 2026-10-27 (planner, post-merge) — do: promote to `.plans/OBLIGATIONS.md` as **OB-36** verbatim (text in the sessions file S5 Do 8): re-measure the compaction byte bands once OB-32's record + the 24 h run's ≥ 2 records meet OB-1's ≥ 3 condition; record on OB-1 and fire it — when: OB-35 is fired with ≥ 2 compaction records listed — probe: manual
- [ ] runner on a real client container · added 2026-10-27 (planner, post-merge) — do: promote to `.plans/OBLIGATIONS.md` as **OB-37** verbatim (text in the sessions file S5 Do 8): no account check, no `ANTHROPIC_API_KEY` in any child env, `tokens=` attributable per container, a deliberate logout → `75 auth-expired` + one alert, no work lost — when: v1.70.0 is installed on a client container — probe: manual
- [ ] branch + worktree cleanup · added 2026-10-27 (planner, post-merge) — do: delete `feat/continuous-operation` and `plan/continuous-operation` (local and remote) and prune any stale worktree — when: the feature PR is merged into `main` — probe: `gh pr list --state merged --head feat/continuous-operation`
- [ ] live-verify after reinstall · added 2026-10-27 (planner, post-merge) — do: in a real session on this repo after `/plugin update` + `/reload-plugins`: `/agentic-workflow:doctor` shows the Compaction window and Runner bullets; `/agentic-workflow:run status` prints the runner status line; an urgent-band handoff gate in a managed session shows the managed copy (no "start a fresh session" ask); `node tools/lint.mjs` on a fresh clone of `main` runs the three new harnesses — when: v1.70.0 is installed from `main` — probe: manual
- [ ] repo WORKFLOW sync · added 2026-10-27 (planner, post-merge) — do: run `/agentic-workflow:sync` on this repo so `docs/WORKFLOW.md` carries the §6.2 `unattended-ask` rule, the §10 Compaction window / Runner rows and the §12 clauses at stamp v1.70.0 (folds into OB-33's sync if that is still open) — when: v1.70.0 is installed and the feature PR is merged — probe: `grep -c "unattended-ask" docs/WORKFLOW.md` ≥ 1

## Deviations

- 2026-10-29 build branch renamed `feat/continuous-operation` → `feat/continuous-op`: the "Lock branches" ruleset (all branches: verified signatures required, no force-push) rejected the branch's four unsigned commits; they were re-signed with the agent key (`git identity`, key `agent-xyzhub-agentic-workflow`) onto origin/main and pushed under the new name. Deleting the old remote branch needs the owner (blocked for the agent); it holds no unique work — reap it with the mission's branch cleanup.

(none)

## Handoff log (newest first)

- 2026-10-29 signing required on every branch: PR #172 replaced by signed #173; mission branch re-signed as feat/continuous-op (old feat/continuous-operation left for the owner to delete); L7 rewritten for git identity (Secretive agent key + Keychain token)

- 2026-10-27 S0 probes recorded in the brief (P0 probe record): (a) settings env reaches hooks; (b) no plugin-read refusal; (c) child exit wakes parent (7 s / 17 s); (d) not run (needs session settings edit; design unaffected); (e) continue:false does not block the tool, ends run with success + terminal_reason hook_stopped → marker + deny; (f) --max-budget-usd. OB-32 pending owner.

- 2026-10-27 S0 started: feat/continuous-operation from plan/continuous-operation (OQ-5); probes (c)(d)(e-subagent) run by the orchestrator (they need an interactive session), (a)(b)(e -p)(f) by a devops agent in a scratch repo; OB-32 needs the owner on orderly-agents

- 2026-10-27 plan-judge REVISE (5 fixes: §5 fence, resume never executed by parent, no account check, hook-test anchor, brief anchors) → planner revised once → narrow re-judge APPROVE (Fable)

- 2026-10-27 planned: trio authored from `docs/product/decisions/2026-10-27-continuous-operation-brief.md` (L1–L5 + the Source-of-truth and Docs-vs-code principles; L3 as refined: per-client subscription, NO account check, no API key) + memos D1-A/D2/D3-B/D4-C/D5-A/D6-A/D7-B as far as L1 allows + the EGM borrows + counsel; mode `phases`, Estimate 6 (owner lock; checkpoints inside sessions), build branch `feat/continuous-operation`, version 1.70.0; OQ-1..5 to the owner before S0; S1 gated on OB-32 fired (S0).

Next up: S0 — the owner answers OQ-1..OQ-5, `feat/continuous-operation` is branched from `plan/continuous-operation` (OQ-5), then S0 runs OB-32 on orderly-agents (the owner's machine) and probes (a)–(f); S1 does NOT start until the OB-32 `· fired` line is on `.plans/OBLIGATIONS.md:72` and the `## P0 probe record` is committed in the brief.
