---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: operate-triage — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6)._

Status: planned

Estimate: 1 session
Sessions used: 0

_The two budget lines above are read by the mission-budget hook every turn. The
planner writes `Estimate:` (1 = one brief S1 + one checkpoint, inside which two
one-shot Fable reviewers run — the diff review and the BUILDABLE read of the
spec; no `phases`; a corrective `S1-fix` counts only when it fires, never
pre-booked — brief L2/L3, 2026-10-06, "each one session"). The orchestrator
increments `Sessions used:` the moment it starts a brief, a corrective, or a
`continue`/loop tick — write-ahead, before spawning — and flips `Status:` to
`active` at the same moment. When `Sessions used` reaches 1.5× the estimate
(i.e. the 2nd session) the hook prints 🛑 OVERRUN on every prompt and the
orchestrator must stop and give the owner the scope decision (subset / revised
estimate / abort) — recorded below as a dated locked decision that revises
`Estimate:`. Never edit `Estimate:` to silence the hook without that decision.
**By design, a corrective brief (`S1-fix`) is an OWNER decision taken at that
overrun stop, not a planner pre-booking**: the plan-judge (2026-10-06) read
the first draft as over-full; the applied cut list in the master plan's fit
note (tool ≤ 220 lines / 11 selftest cases, shim ≤ 60 lines, no comment
scanning, verbatim tables) is what makes `Estimate: 1` honest, and the
2-session split (templates + modes / tool + eval + record) is the fallback the
owner may choose if the stop fires._

**Queue position (Replan 2026-10-13):** `publish-approval` merged (PR #101,
v1.52.0) and closed 2026-10-07, so this mission is free to start; it is the
next planned mission after tune-presets (closed 2026-10-11). `Status: planned`
+ `Sessions used: 0` keep this ledger invisible to the hooks until the
orchestrator flips both (`node ${CLAUDE_PLUGIN_ROOT}/tools/ledger.mjs
operate-triage sessions +1`, write-ahead, then `Status: active`).

Paired metric (house rule, metrics doc §3 "Diagnosis count" row): diagnoses
posted ⇄ **"could not observe" rate and owner-corrected diagnoses** — counted
from issue comments (`Result: loop/diagnosed` vs `Could not observe`) and the
owner's hand notes on diagnosis comments. Baseline 0 / 0 (the loop has never
run; metrics doc §0); first read at the month-review the promoted OB row
triggers (10 triaged reports), never from the synthetic eval.

Gate policy: **human-merge** — after APPROVE (both reviewers) the phase branch
is verified (this repo's §10 **Staging** is `none`, so verify is `node
tools/lint.mjs` green on the branch plus a `claude --plugin-dir
plugins/agentic-workflow` load), and the human merges the PR to `main`.
Recorded at planning, 2026-10-06.

Standing agent authorized: _(none — every review/counsel is a one-shot spawn at
a decision point, §12 LA-5. The checkpoint's two reviewers are two spawns, not
a resident.)_

Branch: one phase branch, `mission/operate-triage`, cut from `main` (the
decision docs and this trio are on `main`). Two PRs close the mission: the
feature PR to `main` (human merges) and ONE `chore/operate-triage-bookkeeping`
PR for the post-merge Closing rows (agent may merge, §10 `records-only`).
Target version **1.60.0** (Replan 2026-10-13; 1.53.0 was taken by pr-economy).

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [ ] S1 — `templates/support-channel-spec.md`, `templates/operate-triage.md`, `tools/operate-triage.mjs` + selftest + lint row 10.11, `/operate triage #N | diagnose #N | digest` modes with Boundaries, eval scenario `operate-triage` (fake-`gh` shim, `run.mjs` PATH rule), `ops.md` diagnose contract, WORKFLOW §4/§6/§9/§12 both copies, record (1.60.0, CHANGELOG, READMEs, evals/README) (branch `mission/operate-triage`; builder `backend`)
- [ ] Checkpoint ckpt-p1 — TWO one-shot `reviewer` spawns on **Fable**: (a) six-lens diff review of `<base>..mission/operate-triage` incl. a re-run of `node evals/run.mjs operate-triage`; (b) the BUILDABLE read of the spec (brief text in the sessions file) → then lint + `claude --plugin-dir` load → one PR to `main`, human merges

## Open questions

_Mirrored from the master plan with their recommendations; the human answers
before execution starts._

- ~~OQ-1 (Replan 2026-10-13)~~ **answered 2026-10-13 by the owner: `unset` (locked decision in the master plan).** — `triage+diagnose runs/day` default on the triage template's `Ceilings:` line: the draft's `20` has no source. **Recommendation:** `unset`, like the spend slots (mission 2's watcher enforces; the digest shows `unset`). Detail: master plan `## Open questions`.

(The four 2026-10-06 candidates — eval `gh` transport, where the digest's
last-sent lives, one or two reviewers at the gate, builder routing — were
settled by the planner as locked decisions in the master plan.)

## Standing steers

_Captured **verbatim** at checkpoints only. Grammar:_ `- YYYY-MM-DD (ckpt <id>) — "<exact words>"`. _Retire by ~~strikethrough~~, never delete._

(none)

## Closing

_A promised action with an observable condition and no trigger yet. Rows are
never deleted: a fired row keeps its line and appends `· fired YYYY-MM-DD
(<evidence>)`. A `[~]` row defers past this mission's close and MUST carry
`→ OB-<n>`. `Closed: YYYY-MM-DD` is written only once every row is `[x]` or
`[~] … → OB-<n>`; `/agentic-workflow:settle` enforces that._

- [ ] branch + worktree cleanup · added 2026-10-06 (planner, post-merge) — do: delete `mission/operate-triage` (local and remote) and prune its stale worktrees — when: the PR to `main` is merged AND the lint run on its merge commit concluded green per §10 — probe: `gh pr list --state merged` + `gh run list` _(deferred until green, via `/agentic-workflow:settle`)_
- [ ] docs/record synced · added 2026-10-06 (planner, pre-merge) — do: confirm CHANGELOG 1.60.0, both READMEs, `evals/README.md`, `templates/WORKFLOW.md` §4/§6/§9/§12 and the `docs/WORKFLOW.md` mirror (stamp v1.60.0) describe the shipped modes; every label/status/field name is spelled identically in `templates/support-channel-spec.md`, `templates/operate-triage.md` and `commands/operate.md` — when: S1's commits are on `mission/operate-triage` and the brief's Verify passed on that branch — probe: the cross-check grep in the brief's Verify + `git diff main...mission/operate-triage --stat`
- [ ] live-verify after reinstall · added 2026-10-06 (planner, post-merge) — do: in a real session after `/plugin update` + `/reload-plugins`, in a GitHub-backed checkout file ONE hand-written issue in contract shape with `source/user` and run `/agentic-workflow:operate triage #N` then `/agentic-workflow:operate digest`: the triage comment and label land, the digest is sent on the Slack owner channel (this repo's §10 row) or reported `kept locally` with the reason — when: the 1.60.0 PR to `main` is merged and the plugin is reinstalled — probe: manual
- [ ] version bumped + stamped · added 2026-10-06 (planner, pre-merge) — do: `plugins/agentic-workflow/.claude-plugin/plugin.json` → 1.60.0 (the §10 Version pin), `docs/WORKFLOW.md` line 3 → `v1.60.0`, CHANGELOG entry stamped `[1.60.0]` — when: this mission's CHANGELOG entry names a version — probe: `grep -c 1.60.0 plugins/agentic-workflow/.claude-plugin/plugin.json CHANGELOG.md docs/WORKFLOW.md`
- [ ] venture n=1 through the in-app channel (brief L3) · added 2026-10-06 (planner, post-merge) — do: one real venue report filed through a venture's shipped support channel is triaged and diagnosed by the modes, the draft reply is relayed by the human, the issue shows the trail — when: a venture has built `docs/product/engineering/support-channel-spec.md` section (i) items 1–8 (labels, endpoint, widget, sync, thread, copy-kit pattern, triage file, one hand-filed ticket) — probe: manual _(expected to defer past close → promote to OB-<n>, orchestrator edits the register)_
- [ ] month-review trigger (metrics doc §5) · added 2026-10-06 (planner, post-merge) — do: run the first month-review of the bug loop (metrics §2 table with denominators printed, the paired metric above read first) — when: at least 10 `source/user` reports carry a `loop/*` or `needs-info` label in a venture checkout — probe: `gh issue list --label source/user --state all --json labels --jq '[.[]|select(any(.labels[].name; startswith("loop/") or .=="needs-info"))]|length'` (≥ 10) _(expected to defer past close → promote to OB-<n>)_
- [ ] mission 2 hand-over note · added 2026-10-06 (planner, pre-merge) — do: post ONE comment on #90 headed `operate-triage hand-over` listing the hooks mission 1 left (tool verbs incl. `--channel` and the alive clock, the `Ceilings:` line with its `unset` slots, the `loop/paused` label switch, the state-dir path, the fences file name, the reserved Merge-policy grammar, the mechanical `--allowedTools` residual with its in-repo prior art `tools/run-claude.mjs --restricted` + `tools/shell-wrappers.mjs`) AND the three L4 mitigations the lock carries (CLI version pinned on the server with auto-update off; a per-tick preflight proving plugin + hooks loaded via a dry `git push` probe expecting `BLOCKED:`, fail closed; the subscription-usage question re-checked and recorded BEFORE the cron line is written) — when: S1's commits are on `mission/operate-triage` with spec section (h) written — probe: `gh issue view 90 --comments | grep -c 'operate-triage hand-over'` (≥ 1) _(Replan 2026-10-13: was "when `operate-fix` planning starts"; firing it on #90 before the merge keeps it out of the register and needs no third PR)_

## Deviations

_Any departure from a brief — logged here the moment it happens, with why.
Deviating is allowed; deviating silently is not (§4)._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs. Newest on top; crash-safe by write-ahead._

- 2026-10-13 replan closed: owner answered OQ-1 = unset (locked 2026-10-13). Trio APPROVEd; no open questions. Resume with /agentic-workflow:mission operate-triage continue.

- 2026-10-13 replan plan-judge re-check (Fable): APPROVE — all 6 fixes verified, lint clean, one Next up. Open: OQ-1 (runs/day default) to owner.

- 2026-10-13 replan revision pass applied (all 6 fixes; lint clean). Narrow plan-judge re-check (Fable, same reviewer resumed) spawned on the 6 fixes only.

- 2026-10-13 replan plan-judge (Fable): REVISE — 6 named fixes (2 unsourced values: digest --limit 200, <slug>; eval writes real $HOME state dir; 3 stale anchors/ranges). Gates green (lint, lint-test 95, hook-test). Planner resumed for its one revision pass.

- 2026-10-13 replan: planner re-evaluation done (Estimate 1 session unchanged; OQ-1 open). Plan-judge (Fable, one-shot, read-only) spawned on the replanned trio.

- 2026-10-13 planner (replan): re-resolved on `plan/operate-triage-replan` from `main` c0049d1 (v1.59.0). Ledger matched git (no branch, no S1 commit, Sessions used 0) — no correction. No S1 scope shipped in 1.53–1.59. Target 1.53.0 → 1.60.0; lint row 10.9 → 10.11; anchors + large-files table re-measured; AC-1…AC-18 + Value sourcing added; Closing rows classified pre/post-merge, hand-over row now fires on #90 pre-merge. Estimate unchanged: 1 session. Open: OQ-1 (runs/day default, recommend `unset`). Baseline `node tools/lint.mjs` clean, `hook-test: clean`.
- 2026-10-06 planner: trio authored on `feat/launch-media-plan` (converted from the operate-bugfix brief's lock table L0–L5 + Mission 1 scope). Nothing built. Baseline `node tools/hook-test.mjs` = 123 ok, `node tools/lint.mjs` clean. Queued BEHIND `publish-approval`; `Status: planned` + `Sessions used: 0` keep this ledger invisible to the hooks. Awaiting the plan-judge; no owner question blocks S1.

Next up: S1
