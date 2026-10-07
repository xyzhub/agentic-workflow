---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: publish-approval — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6)._

Status: active

Estimate: 1 session
Sessions used: 1

_The two budget lines above are read by the mission-budget hook every turn. The
planner writes `Estimate:` (1 = one brief S1 + one one-shot Fable review at the
checkpoint; no `phases`; a corrective `S1-fix` counts only when it fires, never
pre-booked — brief L1, 2026-10-06, locks "each one session"). The orchestrator
increments `Sessions used:` the moment it starts a brief, a corrective, or a
`continue`/loop tick — write-ahead, before spawning — and flips `Status:` to
`active` at the same moment. When `Sessions used` reaches 1.5× the estimate
(i.e. the 2nd session) the hook prints 🛑 OVERRUN on every prompt and the
orchestrator must stop and give the owner the scope decision (subset / revised
estimate / abort) — recorded below as a dated locked decision that revises
`Estimate:`. Never edit `Estimate:` to silence the hook without that decision._

Paired metric (house rule): hash-gate strictness ⇄ **false refusals** — `reset`
events in `docs/product/launch/publish-claims.jsonl` where the owner changed
nothing material. Baseline 0 (mechanism absent, metrics doc §0); first read at
the first `/agentic-workflow:operate` after merge.

Gate policy: **human-merge** — after APPROVE the phase branch is verified (this
repo's §10 **Staging** is `none`, so verify is `node tools/lint.mjs` green on
the branch plus a `claude --plugin-dir plugins/agentic-workflow` load), and the
human merges the PR to `main`. Recorded at mission start, 2026-10-06.

Standing agent authorized: _(none — every review/counsel is a one-shot spawn at
a decision point, §12 LA-5.)_

Branch: one phase branch, `mission/publish-approval`, cut from
`feat/launch-media-plan` (which carries the decision docs and this trio); one
PR to `main`. Target version 1.52.0.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [x] S1 — gate tool `tools/publish-gate.mjs`, lib hook `hooks/lib/publish-guard.sh` + hooks.json row, 7 named harness cases + siblings, lint row 10.8, queue/log templates, `/publish approve|reconcile`, WORKFLOW §3/§14 both copies, record (1.52.0, CHANGELOG, READMEs), n=1 tamper refusal in this repo (branch `mission/publish-approval`; builder `security`)
- [~] Checkpoint ckpt-p1 (APPROVE 2026-10-07, merge pending — PR to main awaits owner) — ONE fresh `reviewer` on **Fable** over `9b8c241..mission/publish-approval` (security boundary), then lint + `claude --plugin-dir` load → one PR to `main`, human merges

## Open questions

_Mirrored from the master plan with their recommendations; the human answers
before execution starts._

(none — the four candidate questions (X in the paid guard, commit the n=1
artifacts, `--cancel` target state, gate-tool residency) were settled by the
planner as locked decisions in the master plan, 2026-10-06.)

## Standing steers

_Captured **verbatim** at checkpoints only. Grammar:_ `- YYYY-MM-DD (ckpt <id>) — "<exact words>"`. _Retire by ~~strikethrough~~, never delete._

(none)

## Closing

_A promised action with an observable condition and no trigger yet. Rows are
never deleted: a fired row keeps its line and appends `· fired YYYY-MM-DD
(<evidence>)`. A `[~]` row defers past this mission's close and MUST carry
`→ OB-<n>`. `Closed: YYYY-MM-DD` is written only once every row is `[x]` or
`[~] … → OB-<n>`; `/agentic-workflow:settle` enforces that._

- [ ] branch + worktree cleanup · added 2026-10-06 (planner) — do: delete `mission/publish-approval` (local and remote) and prune its stale worktrees — when: the PR to `main` is merged AND the lint run on its merge commit concluded green per §10 — probe: `gh pr list --state merged` + `gh run list` _(deferred until green, via `/agentic-workflow:settle`)_
- [x] docs/record synced · added 2026-10-06 (planner) — do: confirm CHANGELOG 1.52.0, both READMEs, `templates/WORKFLOW.md` §3/§14 and the `docs/WORKFLOW.md` mirror (stamp v1.52.0) describe the shipped behaviour; `templates/publish-queue.md` / `publish-log.md` match what `publish-gate.mjs` writes — when: S1 is `[x]` and ckpt-p1 returned APPROVE — probe: manual · fired 2026-10-07 (ckpt-p1 Fable reviewer: plugin.json/CHANGELOG/stamp 1.52.0, §3/§14 byte-identical in both copies, READMEs name the tool)
- [ ] live-verify after reinstall · added 2026-10-06 (planner) — do: in a real session after `/plugin update` + `/reload-plugins`, run `/agentic-workflow:publish status` on this repo's queue and a tokenless `curl https://api.linkedin.com/v2/me` in Bash: the hook must BLOCK (exit 2) with the claim-token text; then `PUBLISH_CONNECT=1 curl …` must pass with the connect reminder — when: the 1.52.0 PR to `main` is merged and the plugin is reinstalled — probe: manual
- [x] version bumped + stamped · added 2026-10-06 (planner) — do: `plugins/agentic-workflow/.claude-plugin/plugin.json` → 1.52.0 (the §10 Version pin), `docs/WORKFLOW.md` line 3 → `v1.52.0`, CHANGELOG entry stamped `[1.52.0]` — when: this mission's CHANGELOG entry names a version — probe: `grep -c 1.52.0 plugins/agentic-workflow/.claude-plugin/plugin.json CHANGELOG.md docs/WORKFLOW.md` · fired 2026-10-07 (grep -c 1.52.0 = 1 in each of plugin.json, CHANGELOG.md, docs/WORKFLOW.md)
- [ ] Codex publish parity gap re-bounded · added 2026-10-06 (planner) — do: append to OB-17 in `.plans/OBLIGATIONS.md` (orchestrator edits, not the builder) that since 1.52.0 the gate tool's refusal is the only mechanical publish check inside a Codex run and the hook-side rules (tokenless block, outreach block, email hosts) are the parity target for #81 — when: the 1.52.0 PR to `main` is merged — probe: `grep -n 'OB-17' .plans/OBLIGATIONS.md` shows the 1.52.0 note
- [ ] n=1 on Orderly queue (mission 2 precondition) · added 2026-10-06 (planner) — do: run `publish-gate.mjs stamp` on Orderly's `docs/product/launch/publish-queue.md` after the plugin reinstall (old 7-column rows migrate: `kind: post`, `epoch: 1`, state unchanged) and tamper one approved draft on purpose: `/publish run` must refuse it with the REFUSED line — when: 1.52.0 is installed in the Orderly session — probe: manual (owner or verifier), result recorded here

## Deviations

_Any departure from a brief — logged here the moment it happens, with why.
Deviating is allowed; deviating silently is not (§4)._

- 2026-10-07 orchestrator — phase branch `mission/publish-approval` cut from `main` (9b8c241), not `feat/launch-media-plan`: PR #97 merged that branch into main and it was deleted. Checkpoint range becomes `9b8c241..mission/publish-approval`.
- 2026-10-07 orchestrator — builder `security` has no `.claude/agents/` tune pin, so it inherits the session model (Opus 5.5, the owner's default set 2026-10-07) rather than Opus 4.8. Overrides register only at session start.
- 2026-10-07 S1 builder — size caps exceeded: publish-gate.mjs 445 lines (cap 320), publish-guard.sh 109 (cap 90); cause: full verb set + selftest + security fixes.
- 2026-10-07 S1 builder — hook rules changed by security finding 1: a `claimed` token is blocked until dispatched; new `fired` event (writer: publish-guard hook) added to the locked event list. Recorded in §3, §14, the command and CHANGELOG.
- 2026-10-07 S1 builder — unrequested fail-closed additions: queue lock; claim refuses kind≠post, paid≠no, unparseable schedule; status lists `claimed` rows; template italic rows ignored; 6-column log migration; absolute-path/indented mailer counts as bare.
- 2026-10-07 S1 builder — `claude --plugin-dir` load check not run (needs a live session); left to the checkpoint.

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs. Newest on top; crash-safe by write-ahead._

- 2026-10-07 orchestrator: ckpt-p1 Fable reviewer returned APPROVE, no blocking findings. Scorecard: Security 3, QA 3, DX 2, Architecture 3 (UX, Efficiency n/a). Gates re-run: selftest 8/8, hook-test 156 ok, lint clean. Live load PASSED (`claude --plugin-dir … -p` ok; `claude plugin validate` passed). All 3 a7cae20 findings re-verified by attack (4 parallel hooks → 1 pass). CI NO-RUNS until push. Advisory backlog: (1) pin stops at an in-body `---`, tail unhashed; (2) `channel` not pinned; (3) host allowlist misses facebook/threads/reddit hosts, `$(sendmail)`/`env sendmail` bypass; (4) `PUBLISH_CONNECT=` text match; (5) no .gitignore for lock/tmp artifacts; (6) policy-none refusal should name the §10 row; (7) hook pass spends token before a possible permission denial — doc sentence. Next: push, ci-wait, PR to main.
- 2026-10-07 orchestrator: S1 returned done, 11 commits ebc7dca..39cc88c, 4 new + 15 edited files. Gates re-run by orchestrator: publish-gate selftest clean (8 cases), hook-test 156 ok clean (baseline 123), lint clean. n=1 REFUSED line: `publish run: REFUSED P-001 approved@262e68d7/e1, current 9b735788/e2 -> reset to draft`. All 3 security findings fixed in a7cae20 (1 and 3 real, 2 partly real). Nothing deferred. ckpt-p1 Fable reviewer spawned over 9b8c241..39cc88c.
- 2026-10-07 orchestrator: automated commit security review flagged 3 unverified findings mid-S1 (claim token not single-use in publish-guard.sh; fail-open default in publish-gate.mjs; hash-pin bypass after claim). Forwarded to the running S1 builder to verify and fix in-session; ckpt-p1 Fable reviewer must re-check all three.
- 2026-10-07 orchestrator: mission started (gate policy human-merge). Branch `mission/publish-approval` cut from main 9b8c241. Sessions used 1/1. S1 spawned to `security` builder.
- 2026-10-06 planner: trio authored on `feat/launch-media-plan`, then one revision pass on the plan-judge's REVISE (anchors re-verified, the four OQs locked as planner decisions, 19-file count, cut list + order rule, tool/hook path contract aligned, `PUBLISH_CONNECT=` bypass named). Nothing built. Baseline `node tools/hook-test.mjs` = 123 ok, clean. Awaiting the plan-judge only; no owner question blocks S1.

Next up: push mission/publish-approval, ci-wait green, open PR to main (owner merges)
