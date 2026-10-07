---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: pr-economy — ledger

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
pre-booked). The orchestrator increments `Sessions used:` the moment it starts
a brief, a corrective, or a `continue`/loop tick — write-ahead, before spawning
— and flips `Status:` to `active` at the same moment. The post-merge close
(bookkeeping branch, settle, stamp, handoff) is part of the close, NOT a
session — `Sessions used:` stays at 1. When `Sessions used` reaches 1.5× the
estimate (i.e. the 2nd session) the hook prints 🛑 OVERRUN on every prompt and
the orchestrator must stop and give the owner the scope decision (subset /
revised estimate / abort) — recorded below as a dated locked decision that
revises `Estimate:`. Never edit `Estimate:` to silence the hook without that
decision._

Paired metric (house rule): **PRs per mission close** (baseline 4 —
publish-approval #101/#102/#103/#105; target 2) ⇄ **false merge refusals** —
a `merge guardrail` BLOCK on a PR whose every path IS a record path and whose
checks ARE green (baseline 0, mechanism absent; known shapes: `origin/HEAD`
unset on a non-`main` default → permanent BLOCK until `git remote set-head
origin -a`; checks not yet registered seconds after a push; a RENAMED record
file). First read: this mission's own close; second read: operate-triage's
close.

Gate policy: **human-merge** — after APPROVE the phase branch is verified (this
repo's §10 **Staging** is `none`, so verify is `node tools/lint.mjs` green on
the branch plus a `claude --plugin-dir plugins/agentic-workflow` load), and the
human merges the PR to `main`. Recorded at mission start, 2026-10-07. The
post-merge bookkeeping PR (`chore/pr-economy-bookkeeping`) is the agent's to
merge ONLY once the owner has reinstalled 1.53.0 (the new hook must be the one
checking it) and the `live-verify after reinstall` row has fired; until then it
waits. **Nobody runs a merge command before that reinstall** — the installed
1.52.0 inline hook reads the working tree and is warn-only once S1 flips §10
on the branch.

Standing agent authorized: _(none — every review/counsel is a one-shot spawn at
a decision point, §12 LA-5.)_

Branch: one phase branch, `mission/pr-economy`, cut from `main` at 49fb2e7; one
PR to `main`; then ONE bookkeeping branch `chore/pr-economy-bookkeeping` cut
from `origin/main` after the merge, one PR. Target version 1.53.0. Checkpoint
reviewer: **Fable** (owner, 2026-10-07 — merge authority is a security
boundary). Builder: `security`. Scope value this repo adopts (L4):
`agent-may-merge (records-only, delegated 2026-10-07)`; the registry is not
touched.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [~] S1 — lib hook `hooks/lib/merge-guard.sh` + hooks.json row (inline row loses its merge case), ≥ 42 harness cases (allow + every block path incl. template placeholder cell, `-R`/`--repo`, URL ref, compound commands, RENAMED/COPIED, 100 files, `gh api`; gh stubbed via a PATH-only `bin/`), lint marker rule, ledger template + planner prompt classify Closing rows, `mission`/`settle`/`end`/chronicler one-bookkeeping-PR flow, WORKFLOW §3/§4/§5/§10/§11 both copies (this repo's §10 → `records-only`; §13 untouched), record 1.53.0 (plugin.json, CHANGELOG, plugin README, stamp), pre-merge probe evidence reported; the builder runs no merge command (branch `mission/pr-economy`; builder `security`)
- [ ] Checkpoint ckpt-p1 — pre-merge Closing pass first (orchestrator ticks the two pre-merge rows from S1's evidence), then ONE fresh `reviewer` on **Fable** over `49fb2e7..mission/pr-economy` (security boundary), then lint + `claude --plugin-dir` load → one PR to `main`, human merges

## Open questions

_Mirrored from the master plan with their recommendations; the human answers
before execution starts._

(none — OQ1 (registry scope) was replaced by the owner's L4 ruling, 2026-10-07:
"the registry should be completely for the agent to merge" / "the registry
already allows agent to merge anything". The registry's row stays full
delegation; the new scope is named `records-only`.)

## Standing steers

_Captured **verbatim** at checkpoints only. Grammar:_ `- YYYY-MM-DD (ckpt <id>) — "<exact words>"`. _Retire by ~~strikethrough~~, never delete._

(none)

## Closing

_A promised action with an observable condition and no trigger yet. Rows are
never deleted: a fired row keeps its line and appends `· fired YYYY-MM-DD
(<evidence>)`. A `[~]` row defers past this mission's close and MUST carry
`→ OB-<n>`. `Closed: YYYY-MM-DD` is written only once every row is `[x]` or
`[~] … → OB-<n>`; `/agentic-workflow:settle` enforces that. **L2 applied to
this mission**: each row's source parens carry `pre-merge` (fires on
`mission/pr-economy` before the reviewer is spawned; rides the feature PR; the
reviewer re-verifies) or `post-merge` (fires from the ONE
`chore/pr-economy-bookkeeping` PR). pr-economy itself therefore closes in two
PRs — the first read of the paired metric._

- [ ] version bumped + stamped · added 2026-10-07 (planner, pre-merge) — do: `plugins/agentic-workflow/.claude-plugin/plugin.json` → 1.53.0 (the §10 Version pin), `docs/WORKFLOW.md` line 3 → `v1.53.0`, CHANGELOG entry stamped `[1.53.0]` — when: this mission's CHANGELOG entry names a version — probe: `grep -c 1.53.0 plugins/agentic-workflow/.claude-plugin/plugin.json CHANGELOG.md docs/WORKFLOW.md` (= 1 each)
- [ ] docs/record synced · added 2026-10-07 (planner, pre-merge) — do: confirm CHANGELOG 1.53.0, the plugin README Guardrails paragraph, `templates/WORKFLOW.md` §3/§4/§5/§10/§11 and the `docs/WORKFLOW.md` mirror (shared sections byte-identical; §10 row carries this repo's `records-only` value; §13 untouched), `templates/mission-state.md` and `agents/planner.md` describe the shipped behaviour — when: S1 is `[x]` and `node tools/lint.mjs` is green on `mission/pr-economy` — probe: per shared section `diff <(sed -n 'A,Bp' plugins/agentic-workflow/templates/WORKFLOW.md) <(sed -n 'C,Dp' docs/WORKFLOW.md)` empty (offsets from the headings) + `node tools/lint.mjs`
- [ ] branch + worktree cleanup · added 2026-10-07 (planner, post-merge) — do: delete `mission/pr-economy` (local and remote) and prune its stale worktrees — when: the PR to `main` is merged AND the lint run on its merge commit concluded green per §10 (rung 2 — CI, no separate deploy) — probe: `gh pr list --state merged` + `gh run list --commit <full-sha>` _(deferred until green, via `/agentic-workflow:settle`)_
- [ ] live-verify after reinstall · added 2026-10-07 (planner, post-merge) — do: in a real session with the cache at 1.53.0, in this repo, with the bookkeeping PR open and CI green: (1) dry invocation — `printf '{"tool_input":{"command":"gh pr merg%s <bookkeeping PR number> --squash"}}' e | bash "$HOME/.claude/plugins/cache/xyz/agentic-workflow/1.53.0/hooks/lib/merge-guard.sh"; echo "exit=$?"` must print the `✅ records-only scope` line and `exit=0` WITHOUT merging anything (the payload is built with `%s` so this Bash command never contains the literal merge command); (2) a real `gh pr merge 999999 --squash` in the session must be BLOCKED by the PreToolUse hook (exit 2, `could not read PR`) — when: the 1.53.0 PR to `main` is merged and the owner has run `/plugin update` + `/reload-plugins` (cache directory `1.53.0` exists) — probe: manual
- [ ] two-PR shape proven · added 2026-10-07 (planner, post-merge) — do: record in this handoff log that pr-economy needs exactly two PRs — the feature PR (owner-merged) and `chore/pr-economy-bookkeeping` (open, CI green, to be agent-merged under `records-only` right after the stamp) — and write the first paired-metric read (PRs per close = 2, false refusals = 0 or the BLOCK text) — when: `gh pr list --state all --search pr-economy --json number,title,state` lists exactly two PRs, one MERGED and one OPEN with CI green — probe: that command

## Deviations

_Any departure from a brief — logged here the moment it happens, with why.
Deviating is allowed; deviating silently is not (§4)._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs. Newest on top; crash-safe by write-ahead._

- 2026-10-07 orchestrator: plan-judge (Fable) REVISE with 7 blocking findings (unanchored policy match, cross-repo ref, compound commands, renames, harness stderr, verify blocked by installed hook, 3rd-PR Closing rows); planner revised once and added owner decision L4 (records-only name, registry untouched); re-judge APPROVE, no new blocking. Advisory for S1: (a) add `cat` to the hook externals line or check externals ⊆ BIN_LIST; (b) verify the hooks.json row by piping `sed -n 55p` into the grep; (c) CHANGELOG must name 1.53.0 exactly once. Mission started, gate policy human-merge, Sessions used 1/1, S1 spawned to `security`.
- 2026-10-07 planner (revision 1): plan-judge REVISE + owner L4 folded in. Scope renamed `agent-may-merge (records-only, delegated <date>)`; the registry's `(bookkeeping, …)` row stays full delegation, no registry edit, §13 untouched, OQ1 gone. Hook: anchored §10 cell match (template placeholder = harness BLOCK), numeric refs only, `-R`/`--repo`, compound tails, multiple merges, `--auto`, `gh api pulls/N/merge`, RENAMED/COPIED, ≥100 files all BLOCK; gh stderr not redirected (stub marker); harness `bin/` mirrors the hook's `# externals:` line. Builder never runs or types the literal merge command (`'gh pr merg[e]'` for greps). Closing: registry row removed; live-verify = dry invocation + 999999 BLOCK; two-PR row keyed on `--state all` (one MERGED, one OPEN). Target hook-test ≥ 198 ok. Nothing built.
- 2026-10-07 planner: trio authored on `mission/pr-economy` (cut from `main` 49fb2e7). Nothing built. Baseline `node tools/hook-test.mjs` = 156 ok, clean; `node tools/lint.mjs` clean. L2 marker chosen `(<source>, pre-merge|post-merge)` — grammar-valid today (this ledger lints under the current rules). L3 allowlist = owner's four exact paths; policy read from `origin/<default>`. S1 → `security` builder; ckpt-p1 on Fable.

Next up: S1 (in flight, builder `security`), then ckpt-p1
