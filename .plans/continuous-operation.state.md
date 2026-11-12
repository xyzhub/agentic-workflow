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

_**Replan 2026-11-12 — proposed, NOT locked: `Estimate: 8`** (S0 used +
S1, S1b, S2, S3, S4, S4b, S5; same briefs-only counting; checkpoints
`ckpt-s1b` and `ckpt-s4b` ride inside their sessions). The line above
stays 6 until the owner answers OQ-6 with a dated lock; the orchestrator
then edits `Estimate:` and records the decision under `## Deviations`. At
6 the overrun stop is 9 sessions used; the plan needs 8._

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

Branches: **one branch, `feat/continuous-op`** (worktree
`.worktrees/continuous-op`; renamed 2026-10-29 from
`feat/continuous-operation`, see Deviations) — from
`plan/continuous-operation` (OQ-5) so the decision docs and the P0
probe record ride the build branch. `main` is merged INTO it (signed
branch: never rebased, never force-pushed). Eight briefs in sequence on it
(run order: `ckpt-s0` → S1 → S1b → S2 → S3 → S4 → S4b → S5); ONE feature
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

- [~] S0 — OB-32 fired on orderly-agents (four observations + `· fired` line; `HL_DEFAULT_PCT` corrected if the observed point disagrees); probes (a) settings env → hooks, (b) plugin-file reads in `-p` children and background subagents, (c) child-exit wake path + foreground `--max` fallback, (d) cron fire vs typed prompt, (e) `continue:false` under `-p` incl. the subagent case, (f) `--max-budget-usd` spelling — recorded as a `## P0 probe record` table in the brief with verbatim invocations; ckpt-s0 (Fable) APPROVE (branch `feat/continuous-operation`) — _2026-11-12 replan: the work is on `feat/continuous-op` (OB-32 fired 2026-11-09; probes (a)(b)(c)(e)(f) recorded in the brief `:217–225`); probe (d) skipped by the owner; the constants fix moved to S2 as AC-28; **`ckpt-s0` has not run** — this row flips to `[x]` on its APPROVE or the owner's dated waiver (OQ-11)_
- [ ] S1 — `tools/runner.mjs` next/begin/classify/record/round/wait/stop/pause/resume/status with the exit contract (0/10/20/21/22/30/40/75/1): `round` = begin → spawn → classify → record, the same four steps a supervisor can drive without the runner starting `claude -p` (AC-29); lock (pid, or `--holder` + lease) + stale reclaim, STOP file, daily 5M cap from reported usage, tick/mission/overrun parity with `mission-budget.sh` (shared fixture), idle backoff 5→15→60 + ≤4 operate/day, crash-loop stop on the 3rd, no-progress stop on the 2nd, `22 no-record` docs check, docs-only round prompt with the Docs-vs-code rule, `round:` line + `rounds/<n>.events.jsonl` 0600 under the git common dir; `auth: login|external` — the login check skippable on the split path only (AC-30); per-project token + signing-key preflight → `75 creds-missing` (AC-31, L7); `tools/redact.mjs` (hl_redact parity + exact-value scrub + five-canary negative test); `templates/runner-config.json`; `templates/runner-contract.schema.json` (`contract_version: 1`); child env `UNATTENDED=1`, no `CHILD`, no `ANTHROPIC_API_KEY`; `tools/runner-test.mjs` + lint `checkRunnerHarness`; ckpt-s1 APPROVE
- [ ] S1b — advisor probe record appended to the brief BEFORE any advisor code (AC-32; the advisor ACs are struck with the row cited if no `claude -p` launch can be given one); advisor launch option in `run-claude.mjs` and `runner.mjs` with the per-launch cap, retry-once fallback and `adv=` round-line field (AC-33); `advisor:` tune field → `agents.mjs` `effective.advisor` + `agents-registry.schema.json` + `commands/tune.md` (AC-34); consult-before-done sentence in the four builder roles, doctor **Advisor** bullet, `Correctives:` ledger line + `ledger.mjs correctives` verb + `mission.md` bump (AC-35); `headless.mjs run` on `roundOnce()` (AC-9); ckpt-s1b APPROVE
- [ ] S2 — `commands/run.md` thin parent on the background wake (probe (c)); `hl_unattended`; unattended handoff gate fails CLOSED by marker + exit 2 (probe (e): never the JSON stop; never for an `Agent` block; managed byte-identical); `runner.mjs` `round`/`classify` → `21` + the one `handoff-failed` deviation write in `record` + the 1/2/3 ladder; compact-resume branch 3 unattended wording; `hl_threshold` = effective window − 33,000 (AC-28; env → settings env → autoCompactWindow → default; band cases re-pinned); `handoff.md` managed copy; bootstrap/sync write settings `env` 200000 adopt-never-overwrite + §10 **Compaction window** row + doctor bullet; §5 `unattended-ask` fenced rule + §6.2 pointer + 15 pointer sentences + `RULES` entry + lint-test cases; AC-16 struck (probe (b): no refusal); hook-test block; ckpt-s2 APPROVE
- [ ] S3 — `tools/fidelity.mjs` extract/compare/restate-prompt/score; fixtures (seed, handoff, ledger, rubric, six red cases incl. `window-mismatch` at 150,000 tokens and `docs-only`); `tools/fidelity-test.mjs` paths (a) compaction via pre-compact + compact-resume and (b) restart via `roundPrompt`; all red cases red in one run; lint `checkFidelityHarness`; `.github/workflows/fidelity-model.yml` `workflow_dispatch` only, haiku, skip-green without the secret; ckpt-s3 APPROVE
- [ ] S4 — `tools/gate.mjs` open/poll/status/expire behind ONE channel interface `{name, send, fetchReplies, verify, receipt}` (slack + telegram by env NAME, allow-listed ids, proof `channel-identity:<id>`); every row born with `type`, `answerer: owner`, `source`, `proof`, `predicted`, `predictor` (AC-36, gate delegation part 1); row before send, outbox, `yes|no <reason>|hold`, receipts, reminders 24/48 h, 72 h → `closed-expired` + a new gate (L6), decision-log row with message id; NO answer/record CLI; owner-only human-fired classes (prod merge/deploy/spend/publish/kill/scope → `acknowledged`, never an action — L2); client route `decision` + `staging-merge` only when granted; `runner.mjs` polls + `20`; `hooks/lib/gate-guard.sh` + hooks.json group + `codex.rules` mirror (BLOCK `gate.mjs record|answer`, `runner.mjs resume`, writes to pending-gates/decision-log, wrapper shapes); `tools/gate-test.mjs` matrix + `SECRET` grep + lint `checkGateHarness`; hook-test cases; §5 `unattended-ask` block retargeted at `gate.mjs`; ckpt-s4 APPROVE
- [ ] S4b — owner-written `.claude/gate-policy.json` (default `owner`; `rule`/agent entries recorded, never executed in v1; can never lift an L2 class) + `gate.mjs policy show` + `gate.mjs predict` (shadow predictions, log only) (AC-37); generic `http` channel — an answer counts only with an ed25519 signature by a key listed in `runner.json` (AC-38); `templates/gate-contract.schema.json` `contract_version: 1` incl. the read-only `status --json` projection (AC-39); gate-guard + `codex.rules` shapes: an unattended round cannot rewrite `gate-policy.json` / `runner.json` or Write/Edit `pending-gates.md`; `connect approver owner|client`; §12 rules 1/4 + Owner channel row clause + gate-classes `staging-merge` (AC-23); ckpt-s4b APPROVE
- [ ] S5 — one-shot `security` pass over `main..HEAD` (AC-24 + AC-40 threat list) with HIGH/MEDIUM fixed in-session; README `## Run 24/7`; runbook `## Unattended run` incl. the Linux per-project key + token steps (L7); doctor **Runner** bullet incl. credentials by name; `plugin.json` + `package.json` → 1.70.0; CHANGELOG `[1.70.0]` incl. one line per probe fact and the AC-41 contract lines; OB-35/36/37/38 row texts reported; pre-merge Closing rows fired; ckpt-s5 (Fable, AC-1..AC-41) APPROVE → staging verify → PR to `main` ready; human merges

## Open questions

_OQ-1..OQ-5 were answered 2026-10-27 — "Accept all" (brief L6 `:202–208`;
master plan Locked decisions). The seven below come from the 2026-11-12
replan: OQ-6, OQ-7, OQ-11, OQ-12 before S1; OQ-10 before S1b; OQ-8 and
OQ-9 before S4._

- **OQ-6 — estimate 6 → 8.** Two new briefs (S1b advisor + tune contract; S4b policy + server channel + frozen contract); the existing ones were already at 1,400–1,480 of 1,500 read lines. **Recommendation:** lock 8. Alternative: keep 6 and ship the advisor and the server channel in later releases.
- **OQ-7 — login check vs L3 (AC-30).** **Recommendation:** make the check skippable (`auth: external`) only when a supervisor runs the turn itself; the runner's own child still uses only the container's login — L3 unchanged. Not recommended: letting `round` carry an API key or a GLM endpoint (unlocks L3).
- **OQ-8 — server channel vs L1 and vs "Part 2" (AC-38).** **Recommendation:** build the generic `http` channel now; an answer counts only when signed by a key the owner holds and the container does not — L1 still holds; the app-specific adapter and the MCP channel stay in Part 2. Not recommended: trusting the server's word about who answered.
- **OQ-9 — how much of the gate policy runs in v1 (AC-36, AC-37).** **Recommendation:** parsed, validated, shown and recorded on every gate; every gate still goes to the owner; confirm the class → type table and that no policy can hand an L2 class to anyone else.
- **OQ-10 — advisor details (AC-33, AC-34).** **Recommendation:** keep the tune key `advisor:` despite the role of the same name; `max_context_tokens` default 100,000 until a consult cost is measured; sites = the round child and own-process roles, subagents only if the probe shows they can consult.
- **OQ-11 — `ckpt-s0` never ran (L5 asks for one per phase).** **Recommendation:** run it now as a one-shot Fable review of the probe record, before S1. Alternative: a dated waiver.
- **OQ-12 — the threshold fix (AC-28).** **Recommendation:** it lands in S2 (not S1 as the probe record says), as window − 33,000 at every window until the 24 h run measures the 1M case.

## Standing steers

(none)

## Closing

- [ ] version bumped + stamped · added 2026-10-27 (planner, pre-merge) — do: bump `plugins/agentic-workflow/.claude-plugin/plugin.json` and `plugins/agentic-workflow/package.json` `version` to `1.70.0` (§10 Version pin) and stamp this mission's CHANGELOG entry with it — when: this mission's CHANGELOG entry names a version — probe: `grep '"version"' plugins/*/.claude-plugin/plugin.json plugins/*/package.json`
- [ ] docs/record synced · added 2026-10-27 (planner, pre-merge) — do: CHANGELOG entry; `commands/run.md`; `commands/handoff.md`, `bootstrap.md`, `sync.md`, `doctor.md`, `connect.md`, `mission.md`, `autopilot.md`, `tune.md` + the 15 ask-site pointer sentences; `templates/agents-registry.schema.json`, `runner-contract.schema.json`, `gate-contract.schema.json`, `gate-policy.schema.json`, `mission-state.md`; `templates/WORKFLOW.md` §5/§6.2/§10/§12 edits; `templates/gate-classes.md`; `templates/runner-config.json`; `templates/engineering-runbook.md`; README `## Run 24/7` — when: those are on the branch and `node tools/lint.mjs` is clean — probe: `grep -c "unattended-ask" plugins/*/templates/WORKFLOW.md` ≥ 1 and `grep -c "Run 24/7" plugins/*/README.md` ≥ 1
- [ ] probe record committed first · added 2026-10-27 (planner, pre-merge) — do: the brief's `## P0 probe record` section (S0) is added in a commit that is an ancestor of the first commit touching `plugins/*/tools/runner.mjs` on the branch, so every `Assumed` lock was decided by an observed fact before the code that depends on it — when: S1 is committed — probe: `git log --format=%h main..HEAD -- docs/product/decisions/2026-10-27-continuous-operation-brief.md | tail -1` precedes `git log --format=%h main..HEAD -- 'plugins/*/tools/runner.mjs' | tail -1` in `git log --oneline main..HEAD`
- [ ] no secret in any committed file · added 2026-10-27 (planner, pre-merge) — do: the five harness canaries and every env NAME's value appear in no committed file outside `*-test.mjs` and `tools/fixtures/` — when: S5 is committed — probe: `git grep -n "SECRET\|xoxb-TEST\|ghp_TEST\|sk-TEST" -- ':!*-test.mjs' ':!*/fixtures/*'` → 0 lines
- [ ] 24h live run · added 2026-10-27 (planner, post-merge) — do: promote to `.plans/OBLIGATIONS.md` as **OB-35** verbatim (text in `.plans/continuous-operation.sessions.md` S5 Do 8, with the two 2026-11-12 clauses: the auto-compaction point at the run's window, and any plugin-file read refusal): ≥ 24 h of `/agentic-workflow:run` on one client container under that client's subscription, ≥ 2 compactions/restarts counted from the round log, 0 owner corrections about lost context, metrics §2 fields recorded, fidelity `score` at each compaction/restart — when: v1.70.0 is installed from `main` on a client container with an active mission ledger — probe: manual
- [ ] OB-1 fold-in · added 2026-10-27 (planner, post-merge) — do: promote to `.plans/OBLIGATIONS.md` as **OB-36** verbatim (text in the sessions file S5 Do 8): re-measure the compaction byte bands once OB-32's record + the 24 h run's ≥ 2 records meet OB-1's ≥ 3 condition; record on OB-1 and fire it — when: OB-35 is fired with ≥ 2 compaction records listed — probe: manual
- [ ] runner on a real client container · added 2026-10-27 (planner, post-merge) — do: promote to `.plans/OBLIGATIONS.md` as **OB-37** verbatim (text in the sessions file S5 Do 8): no account check, no `ANTHROPIC_API_KEY` in any child env, `tokens=` attributable per container, a deliberate logout → `75 auth-expired` + one alert, no work lost — when: v1.70.0 is installed on a client container — probe: manual
- [ ] wrapper contract re-pin · added 2026-11-12 (planner, post-merge) — do: promote to `.plans/OBLIGATIONS.md` as **OB-38** verbatim (text in the sessions file S5 Do 8): every repo that pins this plugin and validates its JSON shapes moves its pin to 1.70.0, refreshes its copies of the three schemas and runs its contract tests — when: v1.70.0 is on `main` — probe: manual
- [ ] branch + worktree cleanup · added 2026-10-27 (planner, post-merge) — do: delete `feat/continuous-op` and `plan/continuous-operation` (local and remote), remove the worktree `.worktrees/continuous-op`, and delete the stale remote `feat/continuous-operation` (needs the owner — the agent is blocked from deleting it; it holds no unique work) — when: the feature PR is merged into `main` — probe: `gh pr list --state merged --head feat/continuous-op`
- [ ] live-verify after reinstall · added 2026-10-27 (planner, post-merge) — do: in a real session on this repo after `/plugin update` + `/reload-plugins`: `/agentic-workflow:doctor` shows the Compaction window and Runner bullets; `/agentic-workflow:run status` prints the runner status line; an urgent-band handoff gate in a managed session shows the managed copy (no "start a fresh session" ask); `node tools/lint.mjs` on a fresh clone of `main` runs the three new harnesses — when: v1.70.0 is installed from `main` — probe: manual
- [ ] repo WORKFLOW sync · added 2026-10-27 (planner, post-merge) — do: run `/agentic-workflow:sync` on this repo so `docs/WORKFLOW.md` carries the §6.2 `unattended-ask` rule, the §10 Compaction window / Runner rows and the §12 clauses at stamp v1.70.0 (folds into OB-33's sync if that is still open) — when: v1.70.0 is installed and the feature PR is merged — probe: `grep -c "unattended-ask" docs/WORKFLOW.md` ≥ 1

## Deviations

- 2026-11-12 orchestrator advisor pre-probe (Claude Code 2.1.322 on the Mac): `claude -p --model sonnet --advisor fable --max-turns 1 --output-format stream-json --verbose "Reply with the single word ok."` → exit 0, result success, no launch error; the advisor was not consulted on that trivial prompt, so attachment is not yet observed — S1b's probe still owes a consult on a real task. Also: after merging main (bf90c06) `node tools/lint.mjs` is green.
- 2026-11-12 replan (planner; master plan `## Replan 2026-11-12`): ledger reconciled against git at `feat/continuous-op` 1a6bafb — (1) the stale `Next up:` named S0, whose work is on the branch; (2) `ckpt-s0` was never spawned (`Reviewer runs: 1` is the plan-judge) → it is the next beat (OQ-11); (3) the header and the cleanup row still named `feat/continuous-operation`; (4) OQ-1..OQ-5 were listed open although brief L6 answered them on 2026-10-27; (5) brief L7's build impact (credentials preflight, doctor, runbook) was in no AC → AC-31, AC-40; (6) AC-1's constants fix did not happen in S0 → AC-28 in S2, with every ×95 % number recomputed; (7) AC-16 struck and AC-10 / AC-11 resolved by the probe record; (8) two briefs added (S1b, S4b), 14 ACs added (AC-28..AC-41), none renumbered; (9) `main` is two merges ahead of the branch (10 more lines in `tools/hook-test.mjs`) — merge it in before S1. `Estimate:` is unchanged at 6; 8 is proposed (OQ-6).
- 2026-11-12 owner "go": gate delegation part 1 joins the replan — `gate.mjs` carries a gate type, an owner-written per-type policy (default `owner`), an answer-source field, owner-answer proof, and shadow-prediction logging from day one (`docs/product/decisions/2026-11-12-gate-delegation.md`); part 2 (answering agents, owner's twin, MCP channel) is a later plan.
- 2026-11-12 more from missions (now `missions-engine`, L6 route B — no OpenMausBot): the start-up login check must accept API-key and GLM (z.ai) accounts; `gate.mjs` parked questions need a server channel so the Missions app can answer them — fold into the pending replan.
- 2026-11-12 dependency raised by missions-on-openmausbot (owner locked L5 in xyzhub/missions-server): the runner must offer its round logic without starting `claude -p` itself (a spawn-free `next` / `classify`) and freeze the `gate.mjs` contract before that mission's P3 — fold into the pending replan.
- 2026-11-12 probe (d) skipped by the owner ("skip d for now"); design unaffected — L1 accepts answers only from the channel transport.
- 2026-11-12 owner "fold it in": Claude Code advisor tool (`--advisor`) added to S1's scope (launch flag from the tune, doctor row, consult-before-done, corrective-retry measure, context cap).
- 2026-11-09 OB-32 ran on the owner's Mac in this repo, not orderly-agents (owner: "can we run the autocompact test on this project?"), as a headless `claude -p` with a 200k window (the L1 operating window) instead of 400k; finding: compaction at ≈ window − 33k → S1 corrects `hl_threshold` (was window × 95 %).
- 2026-10-29 build branch renamed `feat/continuous-operation` → `feat/continuous-op`: the "Lock branches" ruleset (all branches: verified signatures required, no force-push) rejected the branch's four unsigned commits; they were re-signed with the agent key (`git identity`, key `agent-xyzhub-agentic-workflow`) onto origin/main and pushed under the new name. Deleting the old remote branch needs the owner (blocked for the agent); it holds no unique work — reap it with the mission's branch cleanup.


## Handoff log (newest first)

- 2026-11-12 replan: trio re-evaluated at 1a6bafb. Pending briefs re-resolved (S1, S2, S3, S4, S5) and two added (S1b launch layer: advisor + tune contract; S4b: gate policy + generic `http` channel + frozen contract). New ACs AC-28..AC-41. L1–L7 stand; L3 and L1 come back as OQ-7 and OQ-8; the estimate raise 6 → 8 is OQ-6. Nothing was built.

- 2026-10-29 signing required on every branch: PR #172 replaced by signed #173; mission branch re-signed as feat/continuous-op (old feat/continuous-operation left for the owner to delete); L7 rewritten for git identity (Secretive agent key + Keychain token)

- 2026-10-27 S0 probes recorded in the brief (P0 probe record): (a) settings env reaches hooks; (b) no plugin-read refusal; (c) child exit wakes parent (7 s / 17 s); (d) not run (needs session settings edit; design unaffected); (e) continue:false does not block the tool, ends run with success + terminal_reason hook_stopped → marker + deny; (f) --max-budget-usd. OB-32 pending owner.

- 2026-10-27 S0 started: feat/continuous-operation from plan/continuous-operation (OQ-5); probes (c)(d)(e-subagent) run by the orchestrator (they need an interactive session), (a)(b)(e -p)(f) by a devops agent in a scratch repo; OB-32 needs the owner on orderly-agents

- 2026-10-27 plan-judge REVISE (5 fixes: §5 fence, resume never executed by parent, no account check, hook-test anchor, brief anchors) → planner revised once → narrow re-judge APPROVE (Fable)

- 2026-10-27 planned: trio authored from `docs/product/decisions/2026-10-27-continuous-operation-brief.md` (L1–L5 + the Source-of-truth and Docs-vs-code principles; L3 as refined: per-client subscription, NO account check, no API key) + memos D1-A/D2/D3-B/D4-C/D5-A/D6-A/D7-B as far as L1 allows + the EGM borrows + counsel; mode `phases`, Estimate 6 (owner lock; checkpoints inside sessions), build branch `feat/continuous-operation`, version 1.70.0; OQ-1..5 to the owner before S0; S1 gated on OB-32 fired (S0).

Next up: ckpt-s0 — a one-shot Fable review of the P0 probe record in the brief (`:210–225`), or the owner's dated waiver (OQ-11); the owner answers OQ-6 (the estimate lock), OQ-7 and OQ-12 (OQ-10 before S1b; OQ-8 and OQ-9 before S4); the orchestrator merges `main` into `feat/continuous-op` (lint is red on the branch until then); only then S1 starts. Order after that: S1 → S1b → S2 → S3 → S4 → S4b → S5.
