---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: pr-economy — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide._

Source: owner ruling 2026-10-07 ("lets do all 3" — L1 batch, L2 pre-merge rows,
L3 bookkeeping merge delegation), the orchestrator's L3 allowlist clarification
the same day, and the owner's L4 ruling on the registry (below). Evidence:
publish-approval (v1.52.0) needed four PRs to close — #101 feature · #102
settle fire-back (branch reap + OB-17 note) · #103 live-verify + OB-22
promotion + `Closed:` stamp + status page · #105 session handoff. Root causes:
`main` only takes PRs (push guard); some `## Closing` rows can only fire
post-merge; each post-merge step (`settle`, close, `end`) opened its own PR;
and the OB-17 note was a pure text edit that could have ridden in the feature
PR.

Revision 1 (2026-10-07, plan-judge REVISE + owner L4): scope renamed
`records-only`; registry untouched; policy match anchored at the §10 cell;
numeric PR refs only; `-R`/`--repo`, compound commands, renames/copies, ≥ 100
files and `gh api …/pulls/N/merge` all BLOCK; harness stub marker fixed; the
literal merge command never appears in a Bash command the builder runs; Closing
rows re-shaped. Nothing built yet.

Goal: a mission closes in at most two PRs — the feature PR the owner merges,
plus ONE post-merge bookkeeping PR that the agent may merge itself when every
changed path is a record path and CI is green, enforced fail-closed by a hook
that reads the PR's file list.

Estimate: 1 session — ONE brief (S1) + ONE one-shot **Fable** review at the
checkpoint (L3 changes merge authority — a security boundary), lint + plugin
load → PR to `main`, human merges. No `phases`. A corrective `S1-fix` is counted
only when it fires, never pre-booked. The ledger mirrors this as
`Estimate: 1 session`. Fit note: S1 is near the upper bound of one brief (1 new
+ 15 edited files, ≈ 130 lines of hook, ≈ 160 lines of harness, ≈ 12 lines of
lint, prose edits in 9 markdown files, ≈ 700 lines of reads) — the same size
class as publish-approval's S1, which fit. It is one surface (merge/close
machinery) with one reviewer, so it is not split; the brief carries a **cut
list** and an **order rule** (code + harness green before any prose; the
chronicler sentence and the plugin-README paragraph are the first to land in an
`S1-fix` if the session runs long). The post-merge close of THIS mission is part
of the close, not a brief — `Sessions used:` stays 1.

Target version: **1.53.0** (`plugins/agentic-workflow/.claude-plugin/plugin.json`
is at 1.52.0; the §10 Version pin; `docs/WORKFLOW.md` line 3 stamp;
`CHANGELOG.md` `[1.53.0]`).

## Tasks

1. **L3 — path-enforced records-only merge scope (hook).** New lib hook
   `plugins/agentic-workflow/hooks/lib/merge-guard.sh` + its own `hooks.json`
   PreToolUse/Bash row; the inline git/gh row (hooks.json 55) loses its
   `gh pr merge` case. Acceptance: on a merge command the hook reads the §10
   **Merge policy** cell from the target repo's `docs/WORKFLOW.md` **as
   committed on `origin/<default>`** (working tree only when not in a git tree —
   the harness contract) and matches it ONLY with the anchored regex
   `^\| *\*\*Merge policy\*\* *\| *agent-may-merge \(records-only, delegated [0-9]{4}-[0-9]{2}-[0-9]{2}\) *\|`
   (the template's placeholder prose can never enable the scope); a cell
   matching `agent-may-merge` otherwise → today's reminder, exit 0 (full
   delegation, unchanged — the registry's `(bookkeeping, …)` row included);
   `human-only`/absent → BLOCK. Records-only scope allows a merge ONLY when:
   gh + jq exist; no `-R`/`--repo`; the merge segment is the last thing in the
   command (no `;` `&&` `||` `|` or newline after it, exactly one occurrence);
   the PR ref is numeric (URLs, branch names, no ref → BLOCK); no `--auto`;
   `gh pr view N --json state,files,statusCheckRollup` returns `state: OPEN`,
   1–99 files, every file `changeType` ∈ ADDED|MODIFIED|DELETED (RENAMED/COPIED
   → BLOCK), every path in the allowlist (`.plans/**` with no `..` segment ·
   `docs/product/JOURNEY.md` · `docs/product/overview.html` ·
   `docs/product/session-handoff.md` — exact paths, no `docs/product/` prefix
   match); every check `SUCCESS|SKIPPED|NEUTRAL` (empty rollup → BLOCK when
   `<top>/.github/workflows` exists, else pass with a note). `gh api …
   pulls/N/merge` BLOCKS outright. Every other case → exit 2 naming the fact.
   Harness cases in `tools/hook-test.mjs` for the allow path and EVERY block
   path (incl. `docs/product/decisions/…`, `docs/WORKFLOW.md`, the template
   placeholder cell verbatim, `-R`, `--repo`, a URL ref, compound commands,
   RENAMED, 100 files, `gh api`); the harness stubs `gh` via a PATH-only `bin/`
   (never the network). `node tools/lint.mjs` green; `hook-test` ≥ 190 ok
   (baseline 156).
2. **L2 — pre-merge / post-merge classification of `## Closing` rows.** Marker =
   the literal suffix inside the source parens: `· added YYYY-MM-DD (<source>,
   pre-merge)` or `(<source>, post-merge)`. No marker = legacy = read as
   post-merge. Acceptance: `templates/mission-state.md` prose states the rule and
   its four seeded rows (91–105) are classified (docs/record synced + version
   bumped = pre-merge; branch cleanup + live-verify = post-merge);
   `agents/planner.md` gains a "classify every Closing row" rule;
   `commands/mission.md` fires every pre-merge row on the phase branch BEFORE
   the checkpoint reviewer is spawned; `commands/settle.md` names pre-merge rows
   still `[ ]` at the close gate as a planning defect; `tools/lint.mjs`
   `checkObRow` rejects a marker-shaped source suffix that is not exactly
   `pre-merge`/`post-merge` and requires a marker on every template row —
   **every existing ledger passes byte-unchanged** (`(planner, owner-locked)` in
   `.plans/runtime-agnostic-codex.state.md` is a source, not a marker). Both
   WORKFLOW copies' §5 "Mission close & deferred obligations" paragraph
   documents the marker.
3. **L1 — one bookkeeping branch + PR per mission close.** Acceptance:
   `commands/mission.md` §5, `commands/settle.md` step 4 and `commands/end.md`
   steps 4/6 all say: post-merge record edits (settle fire-back, `Closed:` stamp,
   handoff, chronicler record) commit on `chore/<mission>-bookkeeping` cut from
   `origin/<default>`; an open PR with that head is reused (`gh pr list --head
   chore/<mission>-bookkeeping --state open --json number`); exactly one PR,
   title `chore(<mission>): post-merge bookkeeping`; merged by the agent only
   under the §10 records-only scope after `node tools/ci-wait.mjs <sha>` is
   green (a hook BLOCK → leave it open for the human, report it); no command
   opens a PR per step. Session-altitude `end` on the default branch with only
   record paths changed uses `chore/bookkeeping-<YYYY-MM-DD>`. The chronicler,
   invoked post-merge, touches JOURNEY + overview only — CHANGELOG is not a
   record path and already shipped in the feature PR. ("Bookkeeping" names the
   PR; the enforced policy is `records-only` — the word bookkeeping is never a
   path allowlist.)
4. **Protocol + profile text, both copies.** `templates/WORKFLOW.md` §3 row
   (`gh pr merge`), §4 Close, §5 Gate policy, §5 Closing grammar, §10 Merge
   policy row (third value `records-only`), §11 (add the records-only clause,
   keep "§13 registry bookkeeping"); **§13 untouched** (L4). `docs/WORKFLOW.md`
   mirrors every edit byte-identically EXCEPT §10, where this repo adopts
   `agent-may-merge (records-only, delegated 2026-10-07)`; stamp → `v1.53.0`.
   Acceptance: `diff` of each shared section between the two copies is empty
   (recompute offsets after the edit); `codex.rules` untouched (Codex roles
   never merge); no file in `xyzhub/registry` touched.
5. **Record.** `plugin.json` 1.53.0; CHANGELOG `[1.53.0] — <today>` entry
   (Changed: two-PR close, L1/L2/L3/L4, harness `156 → N ok`, the transitional
   window); plugin README Guardrails paragraph (227–229) describes the scope;
   root README unchanged (its tree has no `hooks/lib` line). Acceptance: `grep -c
   1.53.0` = 1 in each of plugin.json, CHANGELOG.md, docs/WORKFLOW.md.
6. **This mission's own two-PR close.** Acceptance: the ledger's `## Closing`
   rows are classified; the two pre-merge rows are `[x]` on `mission/pr-economy`
   before the reviewer is spawned; the post-merge rows fire from ONE
   `chore/pr-economy-bookkeeping` PR; `gh pr list --state all --search
   pr-economy` lists exactly two PRs at close.

## Locked decisions

- 2026-10-07 (owner, verbatim "lets do all 3") — L1 batch, L2 pre-merge rows,
  L3 bookkeeping merge delegation are all in scope; decomposed here, not
  re-litigated.
- 2026-10-07 (owner via orchestrator) — **The L3 allowlist is EXACTLY**
  `.plans/**`, `docs/product/JOURNEY.md`, `docs/product/overview.html`,
  `docs/product/session-handoff.md`. Nothing broader: every other
  `docs/product/**` file (decisions, briefs, memos, metrics, decision-log,
  launch queue, sales, engineering), `CHANGELOG.md`, plugin code, hooks, tools,
  templates and `docs/WORKFLOW.md` are NOT record paths. Exact paths, never a
  `docs/product/` prefix match. Harness cases prove a `docs/product/decisions/…`
  file and a `docs/WORKFLOW.md` change each BLOCK.
- 2026-10-07 (owner, **L4**, verbatim: "the registry should be completely for
  the agent to merge" and "the registry already allows agent to merge
  anything") — The registry's live row `agent-may-merge (bookkeeping, delegated
  2026-07-08)` keeps meaning FULL delegation (warn-only), unchanged. The new
  four-path scope gets its own name: **`agent-may-merge (records-only,
  delegated <date>)`**. The word "bookkeeping" is never enforced as a path
  allowlist. This repo's §10 adopts `records-only`. No edit to
  `xyzhub/registry` in this mission; §13 text untouched. (Replaces the former
  OQ1.)
- 2026-10-07 (owner) — Checkpoint reviewer MUST be **Fable** (merge authority
  is a security boundary). Builder: `security` — a fail-closed guard with an
  exact allowlist ("keep the public allowlist minimal and reviewed; default
  deny", `agents/security.md` 26–28) over untrusted command text and untrusted
  `gh` JSON. `backend` is the fallback.
- 2026-10-07 (planner, L2 marker) — Marker syntax: `· added YYYY-MM-DD
  (<source>, pre-merge)` / `(<source>, post-merge)`. Rationale: the OB grammar's
  source group is `\(([^)]+)\)`, so the suffix is grammar-valid with zero regex
  change; legacy rows (no marker, or an unrelated comma such as `(planner,
  owner-locked)`) stay byte-valid and read as post-merge — the historic
  default. Rejected: an id prefix (breaks the `[^·]+?` id group), a new em-dash
  segment (an `OB_ROW` change that also governs the register), a `when:` tag
  (the clock guard reads `when:`).
- 2026-10-07 (planner, L3 policy match) — The cell is matched ONLY by the
  anchored regex in task 1, against the `| **Merge policy** | … |` table row.
  Placeholder prose (`_(… or \`agent-may-merge (records-only, delegated <date>)\` …)_`)
  never matches: it has no 4-2-2 date, is not the whole cell, and is wrapped in
  `_(`. A harness case feeds the template row verbatim and expects BLOCK.
- 2026-10-07 (planner, L3 policy source) — The hook reads the §10 row from
  `git -C <top> show origin/<default>:docs/WORKFLOW.md`, the human-merged copy
  — never from the working tree when in a git repo (a branch that edits its
  own §10 cannot grant itself merge authority). Fallback to the working-tree
  file ONLY when `git rev-parse --show-toplevel` fails (the harness temp cwd —
  the same contract as `publish-guard.sh`). `<default>` = `origin/HEAD`,
  fallback `main`; an unset `origin/HEAD` on a non-`main` default is a
  permanent BLOCK — a **false refusal**, counted in the paired metric, fixed
  by `git remote set-head origin -a`.
- 2026-10-07 (planner, L3 command shape) — Numeric PR refs ONLY (`^[0-9]+$`):
  URLs, branch names and the current-branch form BLOCK (a URL could name
  another repo; validating owner/repo against `origin` needs git, which the
  harness lacks). `-R`/`--repo` anywhere → BLOCK (cross-repo). The merge
  segment must be the last thing in the command: more than one occurrence, or
  any `;` `&&` `||` `|` or newline after it → BLOCK (a leading `cd <repo> &&`
  is fine). `--auto` → BLOCK. `gh api … pulls/<n>/merge` → BLOCK outright.
- 2026-10-07 (planner, L3 file rules) — `gh pr view N --json
  state,files,statusCheckRollup`; `.files[]` carries `path` and `changeType`;
  any `changeType` other than `ADDED|MODIFIED|DELETED` (RENAMED, COPIED,
  CHANGED, UNKNOWN) → BLOCK (a rename can carry a non-record source path);
  `files | length` 0 or ≥ 100 → BLOCK (gh's page cap hides the rest).
- 2026-10-07 (planner, L3 CI rule) — Checks must ALL be
  `SUCCESS|SKIPPED|NEUTRAL`; any `PENDING|IN_PROGRESS|QUEUED|FAILURE|…` or a
  CheckRun without a conclusion → BLOCK. Empty `statusCheckRollup` → BLOCK when
  `<top>/.github/workflows/` exists (checks not registered yet — wait), else
  pass with a note. The command layer still runs `node tools/ci-wait.mjs <sha>`
  first; the hook is the fail-closed backstop.
- 2026-10-07 (planner, L1 branch) — Bookkeeping branch `chore/<mission>-bookkeeping`
  cut from `origin/<default>` after the feature PR merges; PR title
  `chore(<mission>): post-merge bookkeeping`; one per mission close, reused
  while open; merged by the agent at the END of the close/end step (never after
  each write-back), only under the records-only scope and only after
  `ci-wait.mjs` green. Session-altitude bookkeeping (no mission):
  `chore/bookkeeping-<YYYY-MM-DD>`.
- 2026-10-07 (planner, L2 for this mission) — `version bumped + stamped` and
  `docs/record synced` are **pre-merge**; `branch + worktree cleanup`,
  `live-verify after reinstall` (a dry invocation of the hook + a 999999 BLOCK)
  and `two-PR shape proven` are **post-merge**.
- 2026-10-07 (planner, builder safety) — **The builder never runs a merge
  command, and never puts the literal merge command text in a Bash command**
  (the installed 1.52.0 inline hook blocks any Bash command containing it under
  `human-only`; `grep` patterns use `'gh pr merg[e]'`). The literal inside
  `.sh`/`.mjs`/`.md` FILE CONTENTS written with the Write/Edit tools is fine.
- 2026-10-07 (planner, codex parity) — `templates/codex.rules` already denies
  `gh pr merge` in every costume for Codex roles (lines 88–184); a Codex role
  never merges. No codex.rules change. OB-17 (#81) unaffected.
- 2026-10-07 (planner, routing/branch) — One phase branch `mission/pr-economy`
  cut from `main` at 49fb2e7; one PR to `main`; gate policy human-merge;
  staging verify for this repo (§10 Staging = none) = `node tools/lint.mjs`
  green on the branch + `claude --plugin-dir plugins/agentic-workflow` load.
- 2026-10-07 (planner, cut list) — NOT in this mission: a `paths:` grammar on
  the §10 row; URL or branch-name PR refs; `--auto`; cross-repo merges; any
  codex.rules, `/agentic-workflow:pr`, `release.md`, `check.md`/`sync.md` edit
  (the conform ladder checks §10 rows exist, not their values); the eval
  fixture stamp (`evals/scenarios/mission-batch-gate/fixture/docs/WORKFLOW.md`);
  any registry-repo edit; `.gitignore`/scratch artifacts.

## Risks

| Risk | Bound / mitigation |
|---|---|
| **Transitional window — opens on the BRANCH, not at merge**: the installed 1.52.0 inline hook reads the §10 row from the WORKING TREE and matches any `agent-may-merge`; the moment S1 flips `docs/WORKFLOW.md` 927 to `records-only` on `mission/pr-economy`, that hook is warn-only for any merge command run in this checkout, and stays so until `/plugin update`. | Locked: the builder never runs a merge command; the orchestrator merges nothing before the owner reinstalls (the `live-verify after reinstall` row is the first post-merge act and the bookkeeping PR merge follows it); the NEW hook reads the policy from `origin/main`, so after reinstall no branch can widen it. Named in the CHANGELOG. |
| **False refusals** (paired metric): `origin/HEAD` unset on a non-`main` default → permanent BLOCK; checks registering a few seconds after push → BLOCK until re-run; a legitimate record PR with a RENAMED file → BLOCK. | Each BLOCK message names the fact and the fix (`git remote set-head origin -a`; wait for CI; split the rename). Counted at every close as the metric's second number. |
| **gh stub fidelity**: the harness never hits the network, so the real `gh pr view` JSON shape (`files[].changeType`; `statusCheckRollup` mixing CheckRun `conclusion` and StatusContext `state`) is mirrored by hand. | Fixture builder in the brief covers both object kinds and `changeType`; the live-verify row's dry invocation exercises the real `gh` once. |
| **Hook parses command text**: quoting, `sh -c`, flags before the ref, compound commands, `gh api` merges. | Numeric ref only; `-R`/`--repo`, compound tails, multiple occurrences, `--auto`, `pulls/N/merge` all BLOCK; anything unparseable → BLOCK (fail closed); harness cases for each. |
| **Lint marker check false positives** on legacy sources with commas. | Only a suffix ending in `merge` (case-insensitive) is marker-shaped; `(planner, owner-locked)` is untouched; `node tools/lint.mjs` on the unchanged ledgers is the proof. |
| **One-session fit** (16 files). | Order rule: hook + hooks.json + harness + lint green BEFORE prose; the chronicler sentence and plugin-README paragraph are the first into an `S1-fix`; cut list applied. Reviewer on Fable. |
| **Pre-merge rows need branch-observable `when:`**. | Planner rule (task 2): pre-merge = no dependency on the merge, a deploy or a reinstall; mission.md treats an un-fireable pre-merge row as a planning defect, surfaced, never silently reclassified. |

## Open questions

(none — OQ1 (registry scope) was replaced by the owner's L4 ruling on
2026-10-07; the planner settled everything else as locked decisions above.)

## Open questions (historical, superseded 2026-10-07)

- OQ1 asked whether the hook-enforced allowlist should narrow the registry's
  §13 delegation. The owner ruled the registry stays fully delegated and the
  new scope gets its own name (`records-only`) — locked decision L4.

---
_The `.plans/pr-economy.sessions.md` brief executes these tasks;
`.plans/pr-economy.state.md` tracks progress. No open question blocks
execution._
