---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: adaptive-ceremony — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6)._

Status: active

Estimate: 6 sessions
Sessions used: 3
Reviewer runs: 4

_The two budget lines above are read by the mission-budget hook every turn.
`Estimate: 6` = 3 builder briefs (S1, S2, S3) + 3 one-shot reviewer
checkpoints (ckpt-p1..p3), per WORKFLOW §5 LA-1 ("briefs + checkpoints only")
and `commands/mission.md` 282–283 (a loop tick that runs a checkpoint bumps
`Sessions used:`). The owner's "3–4 sessions" (L1) meant builder sessions.
A corrective `S<n>-fix` is counted when it fires, never pre-booked; the
overrun stop fires at **k ≥ 9** (1.5 × 6). The orchestrator bumps
`Sessions used:` the moment it starts a brief OR a checkpoint tick
(`node ${CLAUDE_PLUGIN_ROOT}/tools/ledger.mjs adaptive-ceremony sessions +1`,
write-ahead) and flips `Status:` to `active` at the first one. `Reviewer
runs:` (AC-13 plumbing, shipped in S1) is bumped at every one-shot reviewer
spawn, plan-judge included — until S1 ships the verb, edit the line by hand.
`Status: planned` + `Sessions used: 0` keep this ledger invisible to the
hooks until then._

<!-- rule-copy: overrun-1.5x -->
At **k ≥ 1.5 × N** the hook prints 🛑 OVERRUN on every prompt and the
orchestrator MUST NOT start another brief: it gives the owner the scope
decision — ship a defined subset now / continue at a revised estimate / abort —
with the remaining phases and what each buys, records the answer as a dated
locked decision, and only then revises `Estimate:`.
<!-- /rule-copy -->

_Record that decision below; never edit `Estimate:` to silence the hook without
it. Subset fallbacks the owner may choose at that stop, in value order: P1 + P2
(4 sessions) ship a working profile with every safety condition (L3) but no
command reads it (AC-10 unmet); P1 alone (2 sessions) ships the taxonomy, the
data shape and the `Reviewer runs:` counter only._

Gate policy: **human-merge** — after APPROVE each phase is verified on its
branch (this repo's §10 Staging = `none`: tier-1 lint + `claude --plugin-dir`
load), then a PR to `main` opens and the human merges. Recorded at planning,
2026-10-13 (brief: "Top, standard posture").

Standing agent authorized: _(none — every review is a one-shot spawn at a
checkpoint, §12 LA-5.)_

Branches: **one branch, `mission/adaptive-ceremony`, carries all three phases, and ONE PR to `main` ships the whole mission** (owner, 2026-10-15: "give me one PR to merge for the whole mission"). Each phase still ends in its own one-shot Fable checkpoint on that branch; an APPROVE advances to the next phase, it does not open a PR. The single PR opens as a draft now and is marked ready after ckpt-p3 APPROVEs; the human merges it once. Plan PR #144 is folded in (its commits are on this branch) and closed as superseded. Plus ONE `chore/adaptive-ceremony-bookkeeping` PR for the post-merge Closing rows (agent may merge, §10 `records-only`). Target version **1.61.0**.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [x] S1 — preconditions (Missions-contract grep incl. `connections.test.ts:28`, WORKFLOW bytes), `templates/gate-classes.md` (L6: 8 change + 9 action classes, grammar defined once), three consumers point at it, `fable-boundary` rule + detector retuned, `checkClassListDedup`, §0 `stage-table` fence + columns, §5 `checkpoint-gates` fence + `ceremony-skip` rule, §10 `Ceremony profile` row + `### 10.2 Ceremony` placeholder, three relation lines, `Reviewer runs:` line + `ledger.mjs reviewer-runs` + ledger-test cases, sync preserve change in its own tested commit (branch `mission/adaptive-ceremony`)
- [~] Checkpoint ckpt-p1 — one-shot `reviewer` on **Fable** (§5 rule + detector rewrite); APPROVE → next phase on the same branch
- [ ] S2 — `tools/ceremony.mjs` (derive · effective --log --mission · check incl. the L6 action-firer and malformed-`+` rules) + `tools/ceremony-test.mjs` + `checkCeremonyHarness`, conform `ceremony-profile-row`, merge-guard §10.2 backstop with all 16 irreversible ids + hook-test cases (incl. an action id and `supply-chain`), derive dogfood read-only (branch `mission/adaptive-ceremony`)
- [ ] Checkpoint ckpt-p2 — one-shot `reviewer` on **Fable** (merge-guard + fail-closed resolver; includes the counsel's "stopped before the gate passes" probe); APPROVE → next phase on the same branch
- [ ] S3 — rule-copies + resolver calls at every gate site, `checkCeremonyCopies`, `/next` + intake read points, bootstrap/adopt/sync/doctor prose (ask once, propose, drift warning, corrected J2 copy), inventories, `/sync` dogfood on this repo (`proposed` profile, stamp v1.61.0), CHANGELOG 1.61.0 + bump, pre-merge Closing rows fired (branch `mission/adaptive-ceremony`)
- [ ] Checkpoint ckpt-p3 — one-shot `reviewer` on **Fable** (resolver-call prose at every gate site) incl. plain-report read of every owner-facing string, over the WHOLE mission diff `main..HEAD`; APPROVE → mark the one mission PR ready, human merges

## Open questions

_Mirrored from the master plan with their recommendations; the human answers
before execution starts._

- ~~OQ-1~~ **answered 2026-10-15 by the owner ("Run the full check")** — conform ladder: run `ceremony.mjs check` (recommended: yes, fs-only, first finding as the gap detail) or row-presence only?
- ~~OQ-2~~ **answered 2026-10-13 by the owner (L5, "Yes, allow the tag")**: the `· class:<id>[+<id>]*` token rendered into the `signal` cell by the tool (joined at read time; `check` fails a mismatch); the guard's one regex spells **all 16 irreversible ids** (L6 2026-10-14: 7 change classes + 9 action classes; `third-party` alone passes). The guard regex is never dropped; if the list cannot be extended in S2, stop and surface.
- Locked 2026-10-14 (owner, L6 — brief lines 267–311): taxonomy = **8 change classes + 9 action classes**; gate-cell grammar `<id> · human|reviewer|record · <class>[+<class>]*` defined once in `gate-classes.md`; action-class gates are `human` and never `optional`/`skipped`; triage `n/a` for actions; `v5-launch` = `production-deploy+publish-outward+release-cut`; `mission-close` carries `release-cut`; V0/V1 `none` stays fail-closed. Mirrored in the master plan's Locked decisions; S1/S2/S3 briefs patched 2026-10-14.
- ~~OQ-3~~ **answered 2026-10-15 by the owner ("Yes, write proposed")** — S3 writes the `proposed` profile into this repo's `docs/WORKFLOW.md` (recommended: yes; AC-11 live, no behaviour change).
- ~~OQ-4~~ **answered 2026-10-15 by the owner ("Count every review")** — `Reviewer runs:` bumped for the plan-judge too (recommended: yes — every one-shot reviewer spawn).

## Standing steers

_Captured **verbatim** at checkpoints only. Grammar:_ `- YYYY-MM-DD (ckpt <id>) — "<exact words>"`. _Retire by ~~strikethrough~~, never delete._

(none)

## Closing

_A promised action with an observable condition and no trigger yet. Rows are
never deleted: a fired row keeps its line and appends `· fired YYYY-MM-DD
(<evidence>)`. A `[~]` row defers past this mission's close and MUST carry
`→ OB-<n>`. `Closed: YYYY-MM-DD` is written only once every row is `[x]` or
`[~] … → OB-<n>`; `/agentic-workflow:settle` enforces that. Pre-merge rows
fire on `mission/adaptive-ceremony` before ckpt-p3 and ride that PR; post-merge rows fire at
a later `/agentic-workflow:settle` from `chore/adaptive-ceremony-bookkeeping`._

- [ ] branch + worktree cleanup · added 2026-10-13 (planner, post-merge) — do: delete `mission/adaptive-ceremony` and `plan/adaptive-ceremony` (local and remote) and prune stale worktrees — when: the one mission PR to `main` is merged AND the `lint.yml` run on the last merge commit concluded green — probe: `gh pr list --state merged --search adaptive-ceremony` + `gh run list --branch main --limit 3`
- [ ] docs/record synced · added 2026-10-13 (planner, pre-merge) — do: confirm CHANGELOG `[1.61.0]`, both READMEs, `templates/WORKFLOW.md` §3/§5/§9/§10 and this repo's `docs/WORKFLOW.md` mirror (stamp + `proposed` profile) agree with what shipped; rewrite any line that drifted — when: S3's record step is committed on `mission/adaptive-ceremony` — probe: `grep -n "1.61.0" CHANGELOG.md docs/WORKFLOW.md plugins/agentic-workflow/.claude-plugin/plugin.json`
- [ ] version bumped + stamped · added 2026-10-13 (planner, pre-merge) — do: `plugins/agentic-workflow/.claude-plugin/plugin.json` → 1.61.0 (the §10 Version pin), `docs/WORKFLOW.md` line 3 → `v1.61.0`, CHANGELOG entry stamped — when: this mission's CHANGELOG entry names a version — probe: `node -e "console.log(require('./plugins/agentic-workflow/.claude-plugin/plugin.json').version)"`
- [ ] live-verify after reinstall · added 2026-10-13 (planner, post-merge) — do: in a real session after `/plugin update` + `/reload-plugins`, in an adopted repo other than this one (Orderly or Missions), run `/agentic-workflow:sync` and confirm: ONE batched ask (or none), a `proposed` row + 10.2 table with plain cells, `/agentic-workflow:doctor` reporting "full ceremony still applies", and `node $CLAUDE_PLUGIN_ROOT/tools/ceremony.mjs effective plan-judge` = `required (profile proposed)` — when: v1.61.0 is installed from `main` — probe: manual
- [ ] Missions pin bump + contract tests · added 2026-10-13 (planner, post-merge) — do: in `xyzhub/missions`, bump `vendor/VERSION` and `vendor/agentic-workflow` to ≥ 1.61.0 (its own updater/verify-vendor flow), run `pnpm test` (contract-tests + recorded-session replays) and `scripts/verify-vendor.mjs`; record the command + exit code here — when: v1.61.0 is on `main` and a Missions session is open — probe: `grep version= /Users/baker/Playground/missions-app/vendor/VERSION`
- [ ] AC-13 measurement (L4) · added 2026-10-13 (planner, post-merge) — do: promote at close as the obligation row, verbatim: "on 3 real changes across Orderly and Missions, each with a confirmed ceremony profile, record per change in a `## Ceremony cost` block of its ledger: `Sessions used:`, `Reviewer runs:`, correctives (`S<n>-fix` count), `Gates skipped:` (each with its deviation line). **Cost sub-metrics are scored on the low-ceremony changes (Missions) only**: baseline = the last 3 comparable (same size class, same gate-class set) shipped Missions changes, pulled read-only with commit/PR cited; pass = sessions and reviewer runs below the baseline median on ≥ 2 of 3 and none above max, correctives not higher on any. **Orderly is scored on safety only** (metrics §4): its irreversible-class gates all still `required` with the same reviewer tier — diff of the before/after lists cited; one deviation line per skipped cell; `node tools/lint.mjs`, `lint-test`, `hook-test`, `agents-test` case counts ≥ pre-change counts recorded at mission start; zero regressions. Missions contract tests green on every change touching Missions; owner prompts and token spend reported as 'unmeasured, no claim'; n=3 is a go/no-go for continued dogfooding, not proof (metrics §5)" — when: three such changes have shipped with a `## Ceremony cost` block — probe: `grep -l "## Ceremony cost" /Users/baker/Playground/*/.plans/*.state.md`
- [x] harness baseline counts recorded · added 2026-10-13 (planner, pre-merge) — do: before S1's first edit, run `node tools/lint-test.mjs`, `node tools/hook-test.mjs`, `node tools/ledger-test.mjs`, `node tools/agents-test.mjs` and write their pass counts into this ledger's first handoff entry (metrics §4 check 2 and §6 — the AC-13 row needs them) — when: S1 starts — probe: `grep -n "baseline counts" .plans/adaptive-ceremony.state.md` · fired 2026-10-15 (baseline counts in the 2026-10-15 S1 handoff: lint-test 95, hook-test 286 ok, ledger-test 38, agents-test 30)

## Deviations

_Any departure from a brief — logged here the moment it happens, with why.
Deviating is allowed; deviating silently is not (§4)._

- 2026-10-15 — LOCKED (owner): one PR for the whole mission — "give me one PR to merge for the whole mission". Branch renamed `mission/adaptive-ceremony-p1` → `mission/adaptive-ceremony`; per-phase PRs dropped; checkpoints unchanged; PR #144 closed as superseded.
- 2026-10-15 — the mission branch was cut from `plan/adaptive-ceremony` (3ee40ea), not `main`: the plan PR #144 was still open when the owner started the mission, so the p1 PR carries the plan commits too (merging either first is safe).
- 2026-10-15 — `Reviewer runs: 3` set by hand (OQ-4): plan-judge REVISE, APPROVE, and the L6 re-check, all 2026-10-13/14.

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs. Newest on top; crash-safe by write-ahead._

- 2026-10-15 2026-10-15 ckpt-p1 (Fable) REQUEST CHANGES — 1 blocking: lint.mjs stripInline backtick regex swallows fenced code, so checkClassListDedup (and pre-existing checkRuleDedup) miss lists inside ``` fences; live miss commands/operate.md:155 (old class labels). Scorecard: Security 2, DX 2, QA 2, Architecture 3. AC-8 fail; AC-9/3/10/13 pass (17/17 gate cells parse). Missions profileRows verified. Advisory: grammar ' — ' tail rule stated outside gate-classes.md; mission-state.md:21 run-on; ceremony-skip la label form; reviewer.md description narrowed (intended); docs/WORKFLOW.md mirror stale until /sync (S3). Reviewer's CI NO-RUNS note was stale: PR #146 lint checks pass. Next: S1-fix (blocking + advisories 2–4), then narrow re-review.

- 2026-10-15 2026-10-15 ckpt-p1 spawned: one-shot reviewer on Fable over 730ee3a..90e2223 (S1's three commits).

- 2026-10-15 2026-10-15 S1 (builder, opus): done on mission/adaptive-ceremony, commits 2935827 (taxonomy + fences + §10 row + lint), 1f80377 (Reviewer runs counter), 90e2223 (sync preserve, last). Harness baseline counts BEFORE: lint-test 95, hook-test 286 ok, ledger-test 38, agents-test 30; AFTER: 103 / clean / 41 / 30; lint clean (warns: WORKFLOW 112,123/120,000; mission.md 21,703/24,000). Missions precondition: contract-test + plugin-contract.ts grep no hit; connections.ts profileRows slices ## 10. to next ##, keys bold cells; connections.test.ts:28 needs Owner channel/Remote executor/Runtimes/Publish policy, all present + Ceremony profile, no §10.2 rows leak. WORKFLOW bytes total 108,821→112,123; §0 12,042→13,134; §5 16,241→17,306; §10 8,202→9,058; §11 5,708→5,905. Builder deviations: detector keeps old class words too; security-pillar + mission.md rule-7 lines repointed at gate-classes.md (lint hits); delegable: never for commercial-commitment/outbound-contact/destructive-data/release-cut; multi-gate cells joined by '; '. For S3: commands/operate.md:155 still prints old class labels. Next: ckpt-p1 (Fable).

- 2026-10-13 planner: trio authored on `plan/adaptive-ceremony` from the four
  locked decision docs; exploration done once (tree dc9bf34, v1.60.0; Missions
  9aa612c). Four open questions for the owner (OQ-2 blocks S2's rendering).
  Next: plan-judge, then owner answers, then S1.

Next up: S1-fix
