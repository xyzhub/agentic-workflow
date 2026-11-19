---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: write-sets — session briefs

_The execution view: one brief per session, pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the
exploration happened once, here (2026-11-18, tree at main `5ba640e`, plugin
v1.69.1)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/write-sets.md` · Ledger: `.plans/write-sets.state.md`
Source: `docs/product/decisions/2026-11-18-parallel-waves-brief.md` (333 lines;
only 205–218 and 259–327 are in scope) and
`docs/product/decisions/2026-11-18-parallel-waves-memos.md` (1,116 lines; only
the D1 ranges named in S1's reads).

**Parked.** This mission is planned and parked (owner, 2026-11-18). Nothing
here runs until the owner schedules it and answers OQ-1..OQ-5. Every line
number below was measured on `5ba640e`; when the mission is un-parked, re-check
the anchors first (a `replan` if `continuous-operation` has landed in between —
it moves `tools/lint.mjs` by about +20 lines and takes version 1.70.0).

**Catalog**: none — §10 **Catalog** is `none — markdown-only plugin`;
`docs/product/catalog/` does not exist. No catalog reads, no regeneration in
Verify.

**Gates available in this repo** (§10):

| Gate | Command | When |
|---|---|---|
| Test / lint gate (CI `lint.yml`) | `node tools/lint.mjs` | end of S1 and at the checkpoint |
| Lint behaviour harness | `node tools/lint-test.mjs` | once, to prove S1 left it green (S1 does not edit it) |
| New harness | `node tools/waves-test.mjs` | after every `waves.mjs` edit |
| Staging verify (§10 Staging = none) | lint green + `claude --plugin-dir plugins/agentic-workflow` loads | at the checkpoint, before the PR is marked ready |

**Facts already probed (do not re-probe):**

- `tools/lint.mjs` on this branch equals `main`. Checks are plain functions
  listed in one single-line array at line 1402 inside `if (isEntryPoint())`;
  a harness check is the 14-line shape at 576–589 (`checkCeremonyHarness`).
- Merge containment, measured 2026-11-18 with `git merge-file` against
  `feat/continuous-op` `8ba8bf6`: a new function placed directly above the
  `export {` line (1383) plus a standalone call after the loop's closing brace
  (after 1404) merges clean; appending the name to the array line conflicts.
- `checkRuleDedup` (1211–1272) fails a `<!-- rule: <id> -->` block whose id is
  not in `RULES` (1146–1177), and fails a paragraph in `agents/`, `commands/`,
  `skills/`, `templates/` that restates a registered rule. An unfenced new
  paragraph in §5 with pointers elsewhere trips neither.
- The phrase "parallel-safe" occurs in exactly three places in the plugin
  tree: `agents/planner.md:70`, `templates/mission-sessions.md:28`,
  `commands/mission.md:184`.
- Sessions files mark phases with `## Phase <id> — …` and briefs with
  `### S<n> — …`. Other `###` headings exist and are NOT briefs
  (`deferred-obligations.sessions.md` has four `### Checkpoint …`,
  `sales-doc-architecture.sessions.md:36` is `### Template inventory`), so the
  parser keys on `### S` followed by a digit, never on any `###`. None of the
  22 existing files carries a `Writes` field.
- Byte headroom: `templates/WORKFLOW.md` 115,866 of 120,000; `commands/mission.md`
  22,807 of 24,000; `agents/planner.md` 9,993 and `agents/reviewer.md` under
  the 16,000 agent ceiling (`tools/lint.mjs:1010–1014`).
- `conform.mjs` runs inside a hook: fs only, no git, no child process; its
  ladder entries are `{ id, since, check: () => true | string, fix }`.
- Version pins: `plugins/agentic-workflow/.claude-plugin/plugin.json:4` and
  `plugins/agentic-workflow/package.json:3`, both `1.69.1` today — the only
  two version sites S1 edits. `docs/WORKFLOW.md:3` (the protocol stamp) is
  moved by the post-merge sync, not by S1.
- A plugin tool needs no registration beyond the files that call it; the root
  `README.md` is deliberately not edited (it is outside S1's `Writes`).

Branch: `feat/write-sets`, cut from `main` when the mission is scheduled (not
before). One brief, one checkpoint, one feature PR to `main`; the owner merges.

## Large-files table

| File | Lines | Notes |
|---|---|---|
| `CHANGELOG.md` | 1,801 | read 1–14 only |
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 1,431 | 115,866 B; read 369–409 only |
| `tools/lint.mjs` | 1,412 | contended (R-1); ranged reads only |
| `docs/product/decisions/2026-11-18-parallel-waves-memos.md` | 1,116 | three ranges only |
| `plugins/agentic-workflow/commands/mission.md` | 350 | 22,807 B; read 180–188 only |
| `plugins/agentic-workflow/README.md` | 337 | read 188–212 only |
| `docs/product/decisions/2026-11-18-parallel-waves-brief.md` | 333 | read 205–218 + 259–327 |
| `tools/lint-test.mjs` | 310 | not edited; run only |
| `plugins/agentic-workflow/tools/conform.mjs` | 258 | read 20–46 + 146–152 + 236–258 |
| `plugins/agentic-workflow/agents/reviewer.md` | 220 | read 176–215 only |
| `tools/ceremony-test.mjs` | 175 | read 1–40 only (harness exemplar) |
| `plugins/agentic-workflow/agents/planner.md` | 171 | read 55–115 only |
| `docs/product/decisions/2026-11-18-parallel-waves-coverage.md` | 103 | whole |
| `plugins/agentic-workflow/templates/mission-sessions.md` | 59 | whole |
| `plugins/agentic-workflow/tools/waves.mjs` | new | est. 250–350 lines |
| `tools/waves-test.mjs` | new | est. 150–250 lines |

## Phase 1 — write sets, declared and measured (branch: `feat/write-sets`)

Cut examined: no disjoint cut exists — under the LD-2(b) reads rule the halves overlap (the tool brief reads the template the prose brief writes). Write-only split considered: tool side (`waves.mjs`, `waves-test.mjs`, `lint.mjs`,
`conform.mjs`) against prose side (template, agents, `mission.md`,
`WORKFLOW.md`, release files) — disjoint write sets, declined. Nothing can run
two briefs at once yet, so the split costs 3 sessions for 1; and the tool brief
reads the template the prose brief writes, an overlap under LD-2(b). One brief
(master plan PD-1).

### S1 — `Writes` field, shape check, matcher, coverage reader, planner cut, soft-rule retirement, release

- **ACs**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11,
  AC-12, AC-13, AC-14, AC-15, AC-16
- **Suits**: `backend` (a zero-dependency Node tool plus its harness; the prose
  edits are small). Runtime: `claude` (default; §10 Tune preset `balanced`, no
  role on codex).
- **Reads** (in this order; ≈ 900 lines):
  1. `.plans/write-sets.md` — Tasks, Value sourcing, Locked decisions, Risks
     (≈ 250). It is the spec.
  2. `docs/product/decisions/2026-11-18-parallel-waves-brief.md` 259–327 (LD-1
     to LD-4, the four deliverables, what is out) and 205–218 (already in the
     tree).
  3. `docs/product/decisions/2026-11-18-parallel-waves-memos.md` 139–163
     (Option B: the grammar and its one example), 182–212 (recommendation,
     the required tests, creates/generated output), 300–326 (static validation
     and "Values this decision settles"). **Skip 213–299** — drift measurement
     and staging belong to the parked half.
  4. `docs/product/decisions/2026-11-18-parallel-waves-coverage.md` whole (103)
     — the definition the reader reproduces; the table at 21–28 is AC-10's
     expected output.
  5. `plugins/agentic-workflow/templates/mission-sessions.md` whole (59): the
     soft rule at 27–29, the field list at 33–51 (`Writes` goes after `Reads`,
     35–36).
  6. `plugins/agentic-workflow/agents/planner.md` 55–115: "mark parallel-safe
     phases" at 70, the `runtime:` field precedent at 57–61, "Estimate
     honestly" at 99–115.
  7. `plugins/agentic-workflow/agents/reviewer.md` 176–215 (plan-judge
     checklist; add the bullet after "Size within budget", 203–204).
  8. `plugins/agentic-workflow/commands/mission.md` 180–188 (item 5 at
     184–185).
  9. `plugins/agentic-workflow/templates/WORKFLOW.md` 369–409 (§5 opening, the
     trio table at 382–386 with the sessions-file row at 385, "Rules: briefs
     pre-resolve…" at 401–403, the `one-corrective-retry` fence at 404–407 —
     the new paragraph goes after the closing `<!-- /rule -->` at 407 and
     before "**Plan-judge**" at 409, never inside the fence).
  10. `tools/lint.mjs` 576–589 (`checkCeremonyHarness`, the shape to copy),
      1378–1412 (export line, entry-point guard, the loop, the exit), 1010–1014
      (byte ceilings).
  11. `tools/ceremony-test.mjs` 1–40 (harness shape: `ok()`, throwaway dir,
      real CLI via `spawnSync`).
  12. `plugins/agentic-workflow/tools/conform.mjs` 20–46 (helpers, `--root`,
      `at()`), 146–152 (ladder entry shape), 236–258 (run and exit codes).
  13. `CHANGELOG.md` 1–14; `plugins/agentic-workflow/README.md` 188–212 (the
      "shipped by the plugin" tool lines; `ceremony.mjs (not copied in)` at
      193 is the wording to mirror).
- **Writes**: `plugins/agentic-workflow/tools/waves.mjs` · `tools/waves-test.mjs` · `tools/lint.mjs` · `plugins/agentic-workflow/tools/conform.mjs` · `plugins/agentic-workflow/templates/mission-sessions.md` · `plugins/agentic-workflow/templates/WORKFLOW.md` · `plugins/agentic-workflow/agents/planner.md` · `plugins/agentic-workflow/agents/reviewer.md` · `plugins/agentic-workflow/commands/mission.md` · `plugins/agentic-workflow/README.md` · `CHANGELOG.md` · `plugins/agentic-workflow/.claude-plugin/plugin.json` · `plugins/agentic-workflow/package.json`
- **Catalog**: none.
- **Do** (in this order; stop and return `deviation` if a locked decision
  blocks a step — never widen scope into the parked half):
  1. **`plugins/agentic-workflow/tools/waves.mjs`** (new, zero deps). Pure
     exports: a sessions-file parser (phases, briefs, each brief's `Writes`
     entries and `Reads` path tokens, with line numbers; continuation lines of
     a bullet belong to it); the shape validator (AC-2, AC-3); the three-valued
     entry comparison (AC-6); the grouping (greedy first-fit in file order
     within a phase, default cap 3, PD-5). CLI: `--check <file>…` and
     `--report <file>… [--cap N] [--json]`. Entry-point guard as in
     `tools/lint.mjs:1385–1398` so importing it runs nothing. The report ends
     with the three rates (AC-8, AC-9) and one fixed line saying file sets
     cannot see data dependencies between briefs, so the figure is an upper
     bound. No git call, no spawn, no write.
  2. **`tools/waves-test.mjs`** (new). Inline fixtures, no fixture directory.
     Cases: every accepted and rejected entry form of AC-2; the all-or-none
     rule of AC-3; the matcher table with the symmetry loop and the
     undecidable-is-overlap assertion (AC-6); a two-phase fixture with a real
     wave, a collision, an undeclared brief, a fourth brief over the cap, and a
     reads-on-sibling-write pair (AC-7..AC-9); byte-identical double run;
     `n/a` on a zero denominator; `--cap 2` on a three-brief disjoint phase
     gives a wave of two plus one brief "over the cap"; `--json` output parses
     and carries the same totals as the text report. Print `ok`/`FAIL` lines; exit 1 on any fail.
  3. **`tools/lint.mjs`** — the contended file, touched as little as possible.
     Add ONE function, `checkWriteSets`, directly above the `export {` line:
     fail-closed if `tools/waves-test.mjs` is missing, run it (copy
     `checkCeremonyHarness`), then run `waves.mjs --check` over every
     `.plans/*.sessions.md` and `fail()` per finding. Register it with ONE
     standalone statement `checkWriteSets();` on its own line after the loop's
     closing brace. **Do not add it to the array line and do not touch the
     `export {` line** — the continuous-operation branch edits the array line,
     and a second edit there is a guaranteed merge conflict (measured, R-1).
     Leave a two-line comment saying exactly that, so nobody folds the call
     back into the array. Do not edit `tools/lint-test.mjs`.
  4. **`plugins/agentic-workflow/tools/conform.mjs`** — one ladder entry
     `write-sets-shape` (AC-5), importing the validator; `true` when no
     sessions file carries `Writes`.
  5. **`templates/mission-sessions.md`** — replace the sentence at 28–29
     ("Mark a phase **parallel-safe** …") with a one-line pointer to §5 Write
     sets and a `Cut examined:` placeholder line under the phase heading; add
     the `- **Writes**:` bullet after `Reads` (AC-1).
  6. **`templates/WORKFLOW.md` §5** — add the one `**Write sets.**` paragraph
     after line 407, outside the fence (≤ 900 B): every brief declares the paths it may write;
     the grammar lives in `templates/mission-sessions.md`; `tools/waves.mjs
     --check` validates the shape and `--report` measures which briefs could
     share a wave; briefs run serially — nothing executes a wave. Add
     "declared write set" to the sessions-file row of the trio table (385).
     No `<!-- rule: -->` fence (PD-3).
  7. **`agents/planner.md`** — at 70 replace "mark parallel-safe phases" with
     the `Writes` duty and a `(§5 Write sets)` pointer; add the cut rule and
     the `Cut examined:` line (AC-11) beside "Prefer fewer, larger … briefs"
     (114–115) without weakening the one-session default; add the `--check`
     run and the `--report` totals line to the return. Pointers, not a second
     statement of the grammar.
  8. **`agents/reviewer.md`** — one plan-judge bullet (AC-11).
  9. **`commands/mission.md`** — replace item 5 (184–185) with a pointer no
     longer than the two lines it replaces: briefs run serially; declared
     write sets are measured, not executed (§5 Write sets).
  10. **Release** — read the version on `main`, take the next minor; set it in
      `plugin.json` and `package.json`; add the CHANGELOG entry under that
      version (Added: the field, `waves.mjs`, the conform entry, the planner
      and plan-judge duties; Removed: the three "parallel-safe" statements);
      add the `tools/waves.mjs` line to the plugin README (AC-16). Use that
      same version as the conform entry's `since`.
  11. **AC-10 run** — `node plugins/agentic-workflow/tools/waves.mjs --report`
      over the five files named in AC-10; paste the totals into the return.
  12. **AC-14 self-audit** — list `git diff --name-status --no-renames
      main...HEAD` plus untracked files and confirm each path is in the
      `Writes` line above; report `declared 13, wrote M, unused: …`.
- **Verify**:
  - `node tools/waves-test.mjs` exits 0 (AC-2, AC-3, AC-6..AC-9).
  - `node tools/lint.mjs` prints `lint: clean`; `node tools/lint-test.mjs`
    still clean (AC-4, AC-12, AC-13).
  - `node plugins/agentic-workflow/tools/waves.mjs --check
    .plans/write-sets.sessions.md` exits 0; the same file with one entry
    changed to `../x` (in a scratch copy, never in `.plans/`) exits 1 (AC-4).
  - `node plugins/agentic-workflow/tools/waves.mjs --report
    .plans/write-sets.sessions.md` reports 1 brief, 0 in waves, reason "sole
    brief in its phase" (AC-7).
  - `grep -rni 'parallel-safe' plugins/agentic-workflow` and `grep -rniE
    'briefs (concurrently|at once|in parallel)' plugins/agentic-workflow`
    both print nothing (AC-12); `wc -c plugins/agentic-workflow/templates/WORKFLOW.md
    plugins/agentic-workflow/commands/mission.md` within 120,000 / 24,000
    (AC-13).
  - `git diff main...HEAD -- tools/lint.mjs | grep -c '^[-+].*for (const check
    of \['` is 0 and the same for `export {` (AC-4).
  - `node plugins/agentic-workflow/tools/conform.mjs --root . --json` shows no
    `write-sets-shape` gap, AND the positive case: a scratch root (outside the
    repo) holding a minimal `docs/WORKFLOW.md` and one `.plans/x.sessions.md`
    whose brief declares `Writes: ../x` makes the same command list a
    `write-sets-shape` gap (AC-5). The first half alone proves nothing — it
    already returns `gaps: []` today.
  - `grep -n '\*\*Writes\*\*' plugins/agentic-workflow/templates/mission-sessions.md`
    prints the bullet, on the line after the `Reads` bullet's last line (AC-1).
  - `grep -c 'Cut examined' plugins/agentic-workflow/agents/planner.md
    plugins/agentic-workflow/agents/reviewer.md
    plugins/agentic-workflow/templates/mission-sessions.md` is ≥ 1 for each,
    and `planner.md` carries both `no disjoint cut exists` and `cut exists,
    declined for cost` (AC-11).
  - `grep '"version"' plugins/agentic-workflow/.claude-plugin/plugin.json
    plugins/agentic-workflow/package.json` shows one identical new version,
    `grep -n` of that version finds its CHANGELOG heading, and `grep -n
    'waves.mjs' plugins/agentic-workflow/README.md` prints a line (AC-16).
  - First real run: `waves.mjs --check`, `--report`, `--cap` and `--json` are
    Assumed in the master plan — no spike ever ran them, and this Verify plus
    a Closing row depend on them. Build them under exactly those names; if a
    name or flag has to change, return `deviation` rather than renaming
    quietly.
  - `grep -n 'worktree add' plugins/agentic-workflow/tools/waves.mjs` prints
    nothing (AC-15); the AC-10 totals and the AC-14 audit line are in the
    return.
  - Catalog: not applicable (no route, schema or catalogued anchor).
- **Read budget**: ≈ 900 lines of reads (≤ 30% of context, ~1,500). Suits:
  `backend`.

**Checkpoint ckpt-s1** ends phase 1 — a one-shot `reviewer` on **Fable**
(boundary-class: `tools/` and `templates/` are `security-boundary` discipline
files at reviewer tier `top`, `templates/gate-classes.md:32`; `.claude/agents/`
is empty, so escalation is on), fresh context, re-runs the gates and
diff-reviews `main..feat/write-sets`, per the ledger's gate policy. The
reviewer re-runs AC-10 and AC-14 itself and fires
the two pre-merge Closing rows before the verdict.

---
_Size every brief to its read budget; split any that can't fit and note the
split. Each session's outcome and any deviation lands in
`.plans/write-sets.state.md`, never only in chat._
