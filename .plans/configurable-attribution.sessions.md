---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: configurable-attribution — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the
expensive exploration happened once, here (2026-10-15, tree at f2f2edb, plugin
v1.61.0)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/configurable-attribution.md` · Ledger: `.plans/configurable-attribution.state.md`

**Catalog**: none — this repo's §10 **Catalog** row is `none — markdown-only
plugin` (`docs/product/catalog/` does not exist). No catalog reads, no catalog
regeneration in Verify.

**Gates available in this repo** (§10):

| Gate | Command | When |
|---|---|---|
| Test / lint gate (CI `lint.yml` runs it) | `node tools/lint.mjs` | end of S1 and at the checkpoint — clean on f2f2edb apart from the standing `warn:` on WORKFLOW bytes |
| Hook harness | `node tools/hook-test.mjs` | after the hooks.json + conform edits; lint also runs it |
| Ledger harness | `node tools/ledger-test.mjs` | after ledger.mjs / attribution.mjs edits; lint also runs it |
| Codex adapter harness | `node tools/run-codex-test.mjs` | must stay green (no adapter change); lint also runs it |
| Staging verify (§10 Staging = none) | lint green on the branch + `claude --plugin-dir plugins/agentic-workflow` loads | at the checkpoint, before the PR is marked ready |

**Facts already probed (do not re-probe):** `node` v24, `jq` present; harnesses
live in the repo-root `tools/`, plugin tools in `plugins/agentic-workflow/tools/`.
`templates/WORKFLOW.md` = 112,701 B (lint ceiling 120,000, `tools/lint.mjs:978`);
`commands/mission.md` = 22,681 B (ceiling 24,000). Lint fails any tracked
`.mjs` line > 1,000 chars (`checkObfuscation`, `tools/lint.mjs:315`). The
`git/gh guardrails` hook has **no** hook-test coverage today (no case matches
"never push"/"refspec"). This repo has `.claude/settings.local.json` only; no
`.claude/settings.json`, and `.claude/` is not gitignored. Claude Code 2.1.301
`attribution` schema: `commit`/`pr` strings (`""` hides), `sessionUrl`
boolean — see the master plan's Verified line. `grep -rn Co-Authored plugins/`
hits exactly the 5 sites below.

Branch: `mission/configurable-attribution` (already checked out from
origin/main f2f2edb). One brief, one checkpoint, one PR to `main`; the human
merges. Not parallel (single session).

## Large-files table

| File | Lines | Notes |
|---|---|---|
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 1,420 | 112,701 B; grep-first, ranged reads only |
| `docs/WORKFLOW.md` | 1,419 | this repo's copy, stamp v1.61.0; §10 at 1007–1037, §10.2 at 1038, Local amendments at 1405 |
| `tools/hook-test.mjs` | 1,930 | ranged reads only |
| `tools/lint.mjs` | 1,371 | read nothing unless a check fails |
| `tools/run-codex-test.mjs` | 748 | run only, no read |
| `plugins/agentic-workflow/tools/run-codex.mjs` | 577 | read 238–245 only |
| `plugins/agentic-workflow/tools/ceremony.mjs` | 306 | no read (pattern for guarded import is in conform.mjs) |
| `plugins/agentic-workflow/tools/ledger.mjs` | 272 | |
| `plugins/agentic-workflow/tools/conform.mjs` | 245 | |
| `tools/ledger-test.mjs` | 242 | |
| `plugins/agentic-workflow/commands/bootstrap.md` | 210 | |
| `plugins/agentic-workflow/hooks/hooks.json` | 192 | the target command is ONE line (55), 1,695 chars |
| `plugins/agentic-workflow/commands/sync.md` | 188 | |
| `plugins/agentic-workflow/commands/adopt.md` | 152 | |
| `plugins/agentic-workflow/commands/end.md` | 104 | |
| `plugins/agentic-workflow/commands/release.md` | 70 | |
| `plugins/agentic-workflow/commands/pr.md` | 55 | |
| `plugins/agentic-workflow/commands/fix.md` | 36 | |
| `plugins/agentic-workflow/README.md` | 337 | read 186–210 only |
| `CHANGELOG.md` | 1,511 | read 1–12 only |

## Phase 1 — configurable attribution (branch: `mission/configurable-attribution`)

### S1 — the §10 Attribution row, its resolver, every writer, dogfood, release

- **ACs**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11
- **Suits**: `devops` (hooks, tools, harnesses; prose edits are small).
- **Reads** (in this order):
  1. `.plans/configurable-attribution.md` Tasks + Value sourcing + Locked
     decisions (≈150 lines) — the ACs are the spec; the cell grammar is in AC-1.
  2. `plugins/agentic-workflow/templates/WORKFLOW.md` 1015–1047 (§10 table;
     **Version pin** row at 1042 — insert the new row after it) and 278 (the
     Conform-check row in the §2 governance table, one line).
  3. `plugins/agentic-workflow/tools/conform.mjs` 26–82 (imports, `section10()`
     — reuse its regex in attribution.mjs —, `has10`, the guarded
     `ceremony` import pattern) and 143–175 (LADDER head incl.
     `ceremony-profile-row`; add the new entry after it).
  4. `plugins/agentic-workflow/tools/ledger.mjs` 1–35 (header usage block,
     imports) and 245–272 (`commit()`, `main`).
  5. `plugins/agentic-workflow/hooks/hooks.json` line 55 only — print it with
     `node -e 'console.log(require("./plugins/agentic-workflow/hooks/hooks.json").hooks.PreToolUse[0].hooks[0].command)'`
     (confirm `description` starts `git/gh guardrails`). Edit only the
     `case "$CMD" in *'git commit'*) echo …;; esac` segment; `$D` is the
     target repo already resolved earlier in the same command.
  6. `tools/hook-test.mjs` 20–135 (`hookCommand`, `runHook` with `files` and
     `bin: { jq: false }`, `check`), 1295–1330 (conform-check fixture:
     `FULL10`, `conformant`, the ceremony render — add the Attribution row to
     the fixture's §10 and a matching `.claude/settings.json` file), and
     1579–1593 (the close-keyword guard block — copy its shape for the new
     `git/gh guardrails` block; `hookCommand('PreToolUse', 'git/gh guardrails')`).
  7. `tools/ledger-test.mjs` 1–30 (harness, `ok`, `mod`) and 207–218 (the
     `--commit` case — extend it; add an `attribution` section after it).
  8. Commands, ranged: `commands/end.md` 18–30 · `fix.md` 26–32 · `pr.md`
     15–25 and 48–53 · `release.md` 30–40 · `mission.md` 186–194 (the
     "Foreign runtimes … commit its `changed_paths` yourself" paragraph) ·
     `bootstrap.md` 74–112 (step 2, incl. the Ceremony profile sub-step — add
     the Attribution sub-step after it) and 188–210 (report) · `adopt.md`
     14–32 · `sync.md` 28–58 (preserve + reconcile; no edit expected — the
     awk keeps the row) and 99–112 (step 3.7 **§10 rows** bullet).
  9. `plugins/agentic-workflow/tools/run-codex.mjs` 238–245 (RETURN_CONTRACT —
     confirm only, no edit).
  10. `docs/WORKFLOW.md` 1–5 (stamp) and 1007–1037 (§10 rows) — for the
      dogfood sync; `README.md` 186–210; `CHANGELOG.md` 1–12;
      `plugins/agentic-workflow/.claude-plugin/plugin.json` (11).
- **Prior art**: `plugins/agentic-workflow/hooks/hooks.json` — the
  `git/gh guardrails` command is a refusing hook (push on/into the default
  branch → exit 2). Extend its existing commit echo in place; do not move,
  reorder or re-derive the push/refspec/tag/dirty-tree logic. It already
  tolerates missing jq (`jq … 2>/dev/null || printf …`); the attribution
  lookup must use only `grep`/`sed`/`head` (all in hook-test's `BIN_LIST`).
- **Do**:
  1. **Template row (AC-1)** — add `| **Attribution** | _(…)_ |` after
     **Version pin**, ≤ 900 B, carrying everything AC-1 lists. Update the
     Conform-check row (278) to name "the §10 **Attribution** row and its
     `.claude/settings.json` mirror".
  2. **`tools/attribution.mjs` (AC-2)** — ~150 lines, header comment in the
     ledger.mjs style (usage, exit codes 0/1/2). `apply` writes 2-space JSON
     + trailing newline; `none` → `""` for that side; it never writes
     `sessionUrl`. Guard the CLI with the same `isEntry()` idiom as
     `ledger.mjs:271` so importing has no side effects.
  3. **Harness (AC-3)** — `attribution` section in `tools/ledger-test.mjs`
     (import the module directly; temp dirs for `apply`/`import`).
  4. **Commands (AC-4, AC-7)** — replace the 4 trailer phrases (end.md:25,
     fix.md:30, pr.md:23, release.md:35) with the §10 Attribution wording; add
     the PR-text clause where a PR is created (end, fix, pr, release); one
     ≤ 80 B clause on the mission.md foreign-runtime commit line.
  5. **Hook (AC-5)** — inline, POSIX: read
     `grep -m1 '^| \*\*Attribution\*\*' "$D/docs/WORKFLOW.md"`, take the
     `commit:` value (or bare `default`/`none`), map to the hint. Then add
     the `git/gh guardrails` hook-test block: absent → default text; `none`;
     custom; `cd sub && git commit` reads `sub/docs/WORKFLOW.md`; jq missing;
     plus two regression pins for the untested guard (`git push origin
     HEAD:main` → exit 2 "refspec targets main"; `git status` → exit 0).
  6. **Ledger (AC-6)** — `commit()` resolves from `cwd`, second `-m` unless
     `none`; extend the `--commit` case to assert `%b` for default / none /
     custom (three fixtures, or one fixture re-written between runs).
  7. **Adoption (AC-8)** — bootstrap step 2 sub-step "Attribution (§10 row +
     `.claude/settings.json`)": `import` → write the row → `apply` → the
     one-line report text from AC-8 (add it to step 5's report). adopt step 1:
     "The **Attribution** row is added if absent the same way." sync 3.7 §10
     rows bullet: Attribution via `import`, then `apply` on every sync.
  8. **Ladder (AC-9)** — `attribution-settings` entry + the hook-test
     conformant-fixture update + one gap case each for "row absent" and
     "settings drift".
  9. **Dogfood (AC-10)** — sync this repo by hand the `/sync` way: copy
     `templates/WORKFLOW.md` over `docs/WORKFLOW.md`, set the stamp to
     `<!-- protocol-master: v1.62.0 -->`, restore the preserved §10–§10.2
     block (awk in sync.md step 2) and Local amendments, append the
     Attribution row `commit: default · pr: default`, then run `node
     plugins/agentic-workflow/tools/attribution.mjs apply` (creates
     `.claude/settings.json`). Diff `docs/WORKFLOW.md` against the template
     outside §10/Local amendments — it must be empty.
  10. **Release (AC-11)** — plugin.json `1.62.0`; CHANGELOG `## [1.62.0] —
      2026-10-15` under `[Unreleased]`; README tree line
      `.claude/settings.json  # attribution key, mirrored from §10 Attribution by bootstrap/adopt/sync`.
  Commit with the attribution the row now resolves to (dogfood). Do not touch
  `.plans/` (the orchestrator owns the ledger).
- **Verify**:
  - `node tools/ledger-test.mjs`, `node tools/hook-test.mjs`, `node
    tools/run-codex-test.mjs` each exit 0 (name the new case counts).
  - `node tools/lint.mjs` → `lint: clean` (WORKFLOW `warn:` allowed; report
    the new byte size of `templates/WORKFLOW.md` and `commands/mission.md`).
  - `grep -rn "Co-Authored-By" plugins/` → no output.
  - `node plugins/agentic-workflow/tools/attribution.mjs check` → exit 0;
    `node plugins/agentic-workflow/tools/conform.mjs` → no
    `attribution-settings` gap; `cat .claude/settings.json` = the AC-10 JSON.
  - `claude --plugin-dir plugins/agentic-workflow` loads (or report it as
    skipped with the reason — never green when not run).
  - Catalog: none (row `none`), nothing to regenerate.
- **Read budget**: ~950 lines (plan 150 · template 35 · conform 90 · ledger 65
  · hooks.json 1 long line · hook-test 165 · ledger-test 45 · commands ≈ 175
  · run-codex 8 · docs/WORKFLOW 35 · README/CHANGELOG/plugin.json 50) — well
  inside the 1,500-line budget. Runtime: `claude` (default; no tune puts
  `devops` on codex).

**Checkpoint ckpt-s1** — one-shot `reviewer` on **Fable** (boundary-class:
`hooks/hooks.json` + `tools/` are `security-boundary`, `templates/gate-classes.md:32`),
fresh context, re-runs the gates and diff-reviews `main..HEAD` against AC-1..AC-11,
with a plain-report read of the owner-facing strings (the bootstrap report
line, the hook hint). APPROVE → staging verify (lint + `--plugin-dir` load) →
PR to `main` marked ready; the human merges.

---
_Each session's outcome and any deviation lands in
`.plans/configurable-attribution.state.md`, never only in chat._
