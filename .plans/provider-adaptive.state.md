---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: provider-adaptive — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6)._

Status: planned

Estimate: 2 sessions
Sessions used: 0
Reviewer runs: 0

_The budget lines above are read by the mission-budget hook every turn.
`Estimate: 2` = the two briefs S1 and S2 (mode `phases`, owner-locked in brief
L1); the one-shot Fable checkpoint `ckpt-s2` rides S2's session, as
jev-browser's did. A corrective `S<n>-fix` is counted when it fires, never
pre-booked. The orchestrator bumps `Sessions used:` the moment it starts a
brief, a corrective or a loop tick
(`node ${CLAUDE_PLUGIN_ROOT}/tools/ledger.mjs provider-adaptive sessions +1`,
write-ahead) and flips `Status:` to `active` at the first one; `Reviewer
runs:` is bumped at every one-shot reviewer spawn, plan-judge and any
same-model second pass included (`… reviewer-runs +1`). `Status: planned` +
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

Gate policy: **human-merge** — after APPROVE the branch is verified (this
repo's §10 Staging = `none`: tier-1 lint + `claude --plugin-dir` load), then
the PR to `main` is marked ready and the human merges. Recorded at planning,
2026-10-25 (brief L5: one Fable checkpoint before the PR; the owner merges).

Standing agent authorized: _(none — every review is a one-shot spawn at a
checkpoint, §12 LA-5.)_

Branches: **one branch, `feat/provider-adaptive`** — from
`plan/provider-adaptive` rebased onto post-rebrand `main` (OQ-3, pending) so
the four decision docs ride the build branch. ONE feature PR to `main`, plus
ONE `chore/provider-adaptive-bookkeeping` PR for the post-merge Closing rows
(agent may merge, §10 `records-only`). Target version: **next free minor on
the tree at S2** (`2.1.0` after the xyz-rebrand's 2.0.0 — OQ-1).

Secrets rule (brief, every session): keys are never written to the profile,
this ledger, a trace, a test log or a committed file — variable NAMES and the
provider id only. A hand-off entry that quotes an env value is a deviation.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [ ] S1 — J2 snapshot committed FIRST (`tools/fixtures/model-resolution/anthropic-v1.json`, 100 cells from the unchanged presets); `tune-presets.json` names aliases (`models` → `aliases`, `tier_aliases` removed, schema_version 1); `preset.mjs` + `run-claude.mjs` pass aliases through; `templates/models.json` (anthropic + zai: match, alias_ids, alias_remap per the L2 probe, knobs, `role_defaults` for all 20 roles; anthropic ≡ balanced, lint-guarded); `tools/models.mjs` detect/resolve/table/doctor (env-only, names not values, fingerprint, git-common-dir profile 0700/0600 tmp+rename, ≤ 3-line report, silent when unchanged or Anthropic first run); `hooks/lib/model-profile.sh` + hooks.json SessionStart group; `tools/models-test.mjs` + hook-test block + lint `checkModelsTable`/`checkModelsHarness` + lint-test/run-claude-test updates; lint clean (branch `feat/provider-adaptive`)
- [ ] S2 — same-model label (`review_mode: same-model` on the reviewer brief, handoff line, checkpoint row; reviewer first-line strings) + opt-in second pass (`/tune reviewer second-pass on|off`, default off — L3); "Fable" → "the top tier" at the 12 rule sites + `RULES['fable-boundary'].name` widened + lint-test case; `/doctor` Models block (+ `--refresh`); `/tune` profile line + `fable` accepted + refusal + preset wording; README sentence; WORKFLOW §10 Runtimes clause; CHANGELOG + version bump; OB-35/OB-36 row text reported; pre-merge Closing rows fired
- [ ] Checkpoint ckpt-s2 — one-shot `reviewer` on **Fable** (boundary-class: `hooks/` + `tools/` + `templates/`) over `main..HEAD`, red-team list from the sessions file (secret canary, profile path, atomic write, hook silence rules, no Claude ids in presets, no shadow rewritten, snapshot-first commit order, role_defaults ≡ balanced, rule-dedup still finds the canonical block, second pass gated on the switch, no new Bash rule, tune refusal writes nothing) + plain-report read of the owner-facing strings; APPROVE → staging verify → PR ready, human merges

## Open questions

_Mirrored from the master plan with their recommendations; the human answers
before execution starts._

- **OQ-1 — version**: `2.1.0` (next free minor after the rebrand's 2.0.0) or `1.70.0` if this mission somehow lands first. **Recommendation:** next free minor read from `plugin.json` at S2 start; the CHANGELOG entry is authored in S2.
- **OQ-2 — L2 probe result (gating)**: which GLM id each of `opus`/`sonnet`/`haiku`/`fable` lands on under z.ai's env. **Recommendation:** record the four results in the brief under L2; `fable` fails or falls back → keep `zai.alias_remap {fable: opus}`; `fable` maps → drop the remap. S1 reads that line.
- **OQ-3 — build branch base**: `feat/provider-adaptive` from `plan/provider-adaptive` rebased onto post-rebrand `main`. **Recommendation:** yes.
- **OQ-4 — second-pass switch location**: `same_model_second_pass: on|off` in `.claude/agents/reviewer.md` via `/tune reviewer second-pass` (mirrors `boundary_escalation`) vs a §10 row. **Recommendation:** the reviewer shadow key.

## Standing steers

(none)

## Closing

- [ ] version bumped + stamped · added 2026-10-25 (planner, pre-merge) — do: bump `<plugin>/.claude-plugin/plugin.json` and `<plugin>/package.json` `version` to the mission's version (OQ-1; §10 Version pin) and stamp this mission's CHANGELOG entry with it — when: this mission's CHANGELOG entry names a version — probe: `grep '"version"' plugins/*/.claude-plugin/plugin.json plugins/*/package.json`
- [ ] docs/record synced · added 2026-10-25 (planner, pre-merge) — do: CHANGELOG entry, `templates/models.json`, the `commands/mission.md` + `commands/tune.md` + `commands/doctor.md` + `agents/reviewer.md` + `agents/planner.md` + `templates/WORKFLOW.md` + `templates/gate-classes.md` edits, README sentence — when: those are on the branch and `node tools/lint.mjs` is clean — probe: `grep -c "models.mjs" plugins/*/commands/doctor.md` ≥ 1 and `grep -c "top tier" plugins/*/templates/WORKFLOW.md` ≥ 2
- [ ] J2 snapshot committed first · added 2026-10-25 (planner, pre-merge) — do: the fixture `tools/fixtures/model-resolution/anthropic-v1.json` is added in a commit that is an ancestor of the first commit touching `templates/tune-presets.json` on the branch — when: S1 is committed — probe: `git log --diff-filter=A --format=%h -- 'plugins/*/tools/fixtures/model-resolution/anthropic-v1.json'` precedes `git log --format=%h main..HEAD -- 'plugins/*/templates/tune-presets.json' | tail -1` in `git log --oneline main..HEAD`
- [ ] live-verify GLM-only · added 2026-10-25 (planner, post-merge) — do: promote to `.plans/OBLIGATIONS.md` as **OB-35** verbatim (text in `.plans/provider-adaptive.sessions.md` S2 Do 9): a GLM-only machine runs one 1-session mission after reinstall — zero `/tune` calls, zero Claude ids requested, ≤ 3 start lines, metrics fields recorded, key value grep = 0 hits — when: the mission's version is installed from `main` and a z.ai key exists — probe: manual
- [ ] live-verify provider switch · added 2026-10-25 (planner, post-merge) — do: promote to `.plans/OBLIGATIONS.md` as **OB-36** verbatim (text in the sessions file S2 Do 9): a real Anthropic → z.ai → Anthropic switch across three session starts; J3 line once per switch, profile rewritten with no key value, no-change restart silent, `--refresh` prints `Models unchanged.` — when: the mission's version is installed from `main` and a z.ai key exists — probe: manual
- [ ] branch + worktree cleanup · added 2026-10-25 (planner, post-merge) — do: delete `feat/provider-adaptive` and `plan/provider-adaptive` (local and remote) and prune any stale worktree — when: the feature PR is merged into `main` — probe: `gh pr list --state merged --head feat/provider-adaptive`
- [ ] repo WORKFLOW sync · added 2026-10-25 (planner, post-merge) — do: run the sync command on this repo so `docs/WORKFLOW.md` carries the §5 LA-5 "top tier" wording and the §10 Runtimes clause at the mission's stamp (folds into OB-33's sync if that is still open) — when: the mission's version is installed and the feature PR is merged — probe: `grep -c "top tier" docs/WORKFLOW.md` ≥ 2

## Deviations

(none)

## Handoff log (newest first)

- 2026-10-24 plan-judge APPROVE (Fable): ACs covered, anchors verified on 999db5f, L1 contained; advisories F1 estimate counts briefs only (owner lock), F2 J3 = 2 of 4 providers by L1, F3 AC-2 self-check substitution

- 2026-10-25 planned: trio authored from `docs/product/decisions/2026-10-25-provider-adaptive-brief.md` (L1–L5) + memos D1/D2b/D3-A/D5/D7-step-1 + the D4 orchestrator note + counsel; mode `phases`, Estimate 2 (owner lock), build branch `feat/provider-adaptive`; OQ-1..4 to the owner before S1; mission gated on the L2 probe and the xyz-rebrand close (L4).

Next up: S1 — GATED until (1) the L2 z.ai alias probe result is recorded in the brief under L2 (OQ-2), (2) the xyz-rebrand mission (plan PR #152) is closed so the "Fable" lines are edited once (L4), and (3) the orchestrator re-measures every anchor in `.plans/provider-adaptive.sessions.md` on the post-rebrand tree (`<plugin>/` = `plugins/xyz/`), logging any > 5-line drift as a deviation; then OQ-1/OQ-3/OQ-4 answered and `feat/provider-adaptive` branched.
