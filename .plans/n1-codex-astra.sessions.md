---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: n1-codex-astra — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the expensive
exploration happened once, here. Deploys to `.plans/n1-codex-astra.sessions.md`._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/n1-codex-astra.md` · Ledger: `.plans/n1-codex-astra.state.md`

**Runtime note (for the orchestrator, not the builder):** S1 suits `backend`,
and `.claude/agents/backend.md` is tuned to `runtime: codex:gpt-6-astra`,
`effort: medium`. The brief deliberately carries NO `runtime:` header — the
tune-override precedence is what this n=1 proves. Spawn per the ledger's locked
decision (background `node <plugin>/tools/run-codex.mjs --role backend --brief
.plans/n1-codex-astra.sessions.md#S1 --cwd <repo> --out
.plans/runs/n1-codex-astra-S1.json`, stdin closed), read the distillate file,
commit `changed_paths` yourself.

**Catalog**: none — this repo's §10 **Catalog** row is `none — markdown-only
plugin` (decided 2026-08-19). No catalog reads, no catalog regeneration.

## Large-files table

| File | Lines |
|---|---|
| `plugins/agentic-workflow/tools/run-codex.mjs` | 475 |
| `tools/run-codex-test.mjs` | 529 |
| `tools/lint.mjs` | 874 |
| `evals/scenarios/codex-routing/checks.mjs` | 106 |
| `evals/run.mjs` | ~180 (read one range only) |
| `plugins/agentic-workflow/templates/distillate.schema.json` | 109 |
| `CHANGELOG.md` | 1028 |
| `docs/WORKFLOW.md` | 1255 |
| `plugins/agentic-workflow/.claude-plugin/plugin.json` | 11 |

## Phase 1 — A2 + A3 fixes, release 1.51.1 (branch: `mission/n1-codex-astra`)

One phase, one brief, one checkpoint. Branch already exists, cut from `main`
@ 587aee6 and carrying the backend tune commit 8ddf1d5.

### S1 — changed_paths delta + strict distillate discovery, shipped as 1.51.1

You are the `backend` implementer. Everything below is pre-resolved; follow it
without exploring. Work only in the repository you were given as the working
directory (`--cwd`). All paths are repository-relative.

**Hard rules for this run (read first):**
- NEVER run a real `codex exec` / `codex` command of any kind. The only way you
  exercise the adapter is `node tools/run-codex-test.mjs`, which points
  `CODEX_BIN` at a fake shim it builds itself.
- NEVER `git commit`, `git push`, `git stash`, create branches, or open PRs.
  The runtime forbids it and the orchestrator commits your `changed_paths`.
  Leave your edits in the working tree.
- NEVER create, edit or delete anything under `.plans/`.
- Do not touch `plugins/agentic-workflow/templates/codex.rules`, `hooks/`,
  `agents/`, or `commands/` — out of scope.
- Return, as your final message, ONLY the JSON distillate matching
  `plugins/agentic-workflow/templates/distillate.schema.json` (every field
  present; `null` for absent nullable fields; `changed_paths` may be `[]` —
  the adapter overwrites it from the tree). No prose before or after the JSON.

- **Reads** (≈ 800 lines total; ranged reads only — never a whole >400-line file):
  1. `plugins/agentic-workflow/tools/run-codex.mjs` lines **1–77** (header
     comment + `USAGE` text; the `--cwd` bullet at 61–62 says "the tree
     `changed_paths` is read from") and lines **320–475** (`changedPaths()`
     at 323–336, `highImpactPatterns()`/`highImpactTouched()` 340–353,
     `EMPTY`/`writeOut` 356–376, `main()` 378–463 — the spawn is
     `spawnSync(bin, args, …)` at 410–412; `changedPaths(o.cwd)` is called at
     434 and assigned at 442 (failed branch) and 453 (`// the tree wins`)).
  2. `tools/run-codex-test.mjs` lines **1–175** (imports 29–35; `ok`/`group`
     helpers 42–50; the fake codex `SHIM_SRC` 58–75 — driven by a JSON spec
     file `SHIM_SPEC`: `record`, `lastMessage`, `events`, `stderr`, `exit`;
     `EVENTS`/`DONE_MSG`/`withStatus` 89–109; `git()` helper 111;
     `makeRepo()` 114–137 — a throwaway git repo with `tools/lint.mjs`
     (high-impact) and `notes.txt` committed; `runAdapter()` 141–173 — spawns
     the adapter with `--out`/`--cwd` and returns `{status, out, record,
     outPath}`), lines **371–400** (e2e group: the tree is pre-dirtied at
     375–376 BEFORE `runAdapter`, then 381–386 assert `changed_paths ===
     ['notes.txt','tools/lint.mjs']` and `high_impact_touched ===
     ['tools/lint.mjs']`), lines **480–529** (`failed` case at 480–491 asserts
     the failed distillate carries the same two paths; `invalid`/`noBin`
     cases; the guardrail group 508–515; the runner tail 518–529 prints
     `run-codex harness: clean — N case(s)`). Baseline today: **154 cases**.
  3. `evals/scenarios/codex-routing/checks.mjs` **whole (106 lines)** —
     `hasCodexDistillate(root)` 17–37 (the fallback predicate is line 31);
     `checks({ dir, events })` 39–106 (the `--out` resolution 81–91 calls the
     fallback at 89; the ledger check 94–103 needs
     `.plans/widget-tags.state.md` with `Sessions used: ≥1` and an `[x] … S1`
     row). The `events` shape it flattens (42–46): an array of
     `{ message: { content: [{ type: 'tool_use', name, input }] } }`.
  4. `evals/run.mjs` lines **138–147** only — how `checks()` is imported and
     called (`await checks({ dir, events, resultText, sh })`), so your unit
     case calls it the same way.
  5. `tools/lint.mjs` lines **455–478** — check 10.7 runs
     `node tools/run-codex-test.mjs` and fails on a non-zero exit; nothing to
     change here, read it so you know the gate.
  6. `plugins/agentic-workflow/templates/distillate.schema.json` lines
     **28–32** — the `changed_paths` description you will reword. (You already
     hold the full schema via `--output-schema`.)
  7. `CHANGELOG.md` lines **1–14** (the `## [Unreleased]` stub at 7–9 stays
     `_(empty)_`; the 1.51.0 entry starts at 11) and lines **48–62** (the
     1.50.1 entry — the patch-entry shape to copy).
  8. `plugins/agentic-workflow/.claude-plugin/plugin.json` whole (11 lines,
     `"version": "1.51.0"` on line 4) and `docs/WORKFLOW.md` lines **1–4**
     (line 3 is `<!-- protocol-master: v1.51.0 -->`).

- **Do** (in this order):
  1. **A2 — delta `changed_paths`** in `plugins/agentic-workflow/tools/run-codex.mjs`:
     - Add `export function statusSnapshot(cwd)` → `Map<path, statusLine>`:
       run `git status --porcelain` in `cwd` (same `spawnSync` shape as the
       current `changedPaths`), for each non-blank line key = the path parsed
       exactly as today (slice(3), rename keeps the new path, strip quotes),
       value = the raw 2-char status (`line.slice(0, 2)`). Non-zero git exit →
       empty Map.
     - Change `changedPaths(cwd, before = new Map())` to: take
       `after = statusSnapshot(cwd)` and return, sorted, every path in `after`
       whose status is absent from `before` or differs from `before.get(path)`.
       With the default empty `before` this equals today's behaviour.
     - Add a 4–6 line comment above it stating the two accepted residues: a
       path dirty before the run that codex edits again keeps the same status
       and is not reported; a path reverted to clean is not reported.
     - In `main()`: take `const before = statusSnapshot(o.cwd);` immediately
       BEFORE `const bin = resolveBin();` / the `spawnSync(bin, …)` call (after
       the `--ignore-rules` refusal), and change the one call at line 434 to
       `changedPaths(o.cwd, before)`. Both assignment sites (442, 453) stay.
     - Reword the `--cwd` USAGE bullet (61–62) to say the tree `changed_paths`
       is the **delta vs a snapshot taken before the spawn** — the
       orchestrator's own pre-spawn edits are not the run's. Keep the line
       widths of the surrounding text.
  2. **Harness for A2** in `tools/run-codex-test.mjs`:
     - Extend `SHIM_SRC` (58–71): after writing the last message, if
       `spec.writes` is an object, for each `[rel, content]` do
       `fs.mkdirSync(path.dirname(rel), {recursive:true})` +
       `fs.writeFileSync(rel, content)` relative to `process.cwd()` (the shim
       runs with cwd = `--cwd`, which the existing `the child ran in --cwd`
       case already proves). Add `const path = require('node:path');` to the
       shim source.
     - Rework the e2e group (371–386): REMOVE the two pre-run
       `writeFileSync` calls at 375–376 and their comment. Instead:
       pre-dirty ONLY `notes.txt` (simulating the orchestrator's ledger edit)
       and pass `spec: { writes: { 'tools/lint.mjs': '// edited by the run\n',
       'made-by-run.txt': 'made by the run\n' } }` to the `done` run (a
       top-level new file — porcelain prints `?? made-by-run.txt`; never a new
       directory, which porcelain collapses to `dir/`). Replace the
       `changed_paths comes from the tree` assertion with three cases:
       `changed_paths is the delta vs the pre-spawn snapshot` (deep-equals
       `['made-by-run.txt', 'tools/lint.mjs']`), `a file dirty before the
       spawn is not reported as the run's change` (`notes.txt` absent), and
       keep `high_impact_touched is the intersection` (still
       `['tools/lint.mjs']`). Keep every other assertion in the group as is.
     - The `failed` case (480–491): it runs against the same `repo` whose
       tree is now dirty from the `done` run; give it its own
       `spec.writes` (e.g. `{ 'tools/lint.mjs': '// edited again\n' }` will
       NOT show — same status — so write a fresh path `failed-run.txt`) and
       change the assertion at 488–491 to expect exactly `['failed-run.txt']`
       (or the collapsed form if you used a directory) and still
       `thread_id === 'thr_abc123'`. Name it `the failed distillate still
       carries the tree-derived delta`.
     - Add one direct unit case in the `adapterGroup` flag section (after the
       `resolveBin` cases, ~368): import `statusSnapshot, changedPaths` from
       the adapter module; in a fresh `makeRepo('delta')`, dirty `notes.txt`,
       take `before = statusSnapshot(dir)`, then write `tools/lint.mjs`, and
       assert `changedPaths(dir, before)` deep-equals `['tools/lint.mjs']` and
       `changedPaths(dir)` (no snapshot) deep-equals `['notes.txt',
       'tools/lint.mjs']` (the backward-compatible whole-tree form).
     Net: the harness count must be > 154.
  3. **A3 — strict discovery** in `evals/scenarios/codex-routing/checks.mjs`:
     - Line 31: require `j.status === 'done'` (drop `typeof j.status ===
       'string'`) alongside `j.runtime && j.runtime.name === 'codex'`.
     - Update the comment block 11–16 and the failure string at 90 to say
       `status === "done"` + `runtime.name === "codex"`.
  4. **Harness for A3** in `tools/run-codex-test.mjs`: add a new async
     function `checksGroup()` (call it from the run block at 519–521, after
     `await adapterGroup();`), `group('codex-routing checks — distillate
     discovery')`. It:
     - `const { default: checks } = await import(`file://${path.join(ROOT,
       'evals/scenarios/codex-routing/checks.mjs')}`);`
     - Builds a throwaway dir `fx = path.join(TMP, 'checks-fx')` with
       `.plans/widget-tags.state.md` containing `Sessions used: 1` and
       `- [x] S1 — thing` lines, and `.plans/runs/`.
     - Synthetic `events`: one tool_use `{ type: 'tool_use', name: 'Bash',
       input: { command: 'node /p/tools/run-codex.mjs --role backend --brief
       .plans/x.sessions.md#S1 --cwd "$PWD" --out "$OUT"' } }` wrapped as
       `[{ message: { content: [ … ] } }]` — `--out "$OUT"` is a shell var so
       the check MUST fall back to shape discovery.
     - Case A: write `.plans/runs/r.json` = `{ status: 'failed', runtime: {
       name: 'codex' } }` → `await checks({ dir: fx, events })` returns an
       array containing a string matching `/no codex distillate found/`.
       Name: `a failed codex distillate does not satisfy shape discovery`.
     - Case B: overwrite it with `status: 'done'` → the returned array is
       empty. Name: `a done codex distillate satisfies shape discovery`.
     - Case C: `status: 'blocked'` → failure again. Name: `a blocked
       distillate does not satisfy shape discovery`.
  5. **Schema prose**: in `templates/distillate.schema.json` line 30, change
     the `changed_paths` description to say the adapter overwrites it with the
     paths whose `git status --porcelain` line is new or changed **relative to
     a snapshot taken before the spawn** in `--cwd`. JSON must stay valid.
  6. **Release 1.51.1**:
     - `CHANGELOG.md`: insert directly above `## [1.51.0] — 2026-09-17` (line
       11) a `## [1.51.1] — 2026-09-17` entry with a `### Fixed — …` heading
       and two bullets (A2: `run-codex.mjs` `changed_paths` is now the delta vs
       a pre-spawn `git status` snapshot, so the orchestrator's write-ahead
       ledger edit is never reported as the Codex run's change; harness cases
       added. A3: the `codex-routing` eval's shape-discovery fallback requires
       `status === "done"`, so a failed/blocked distillate no longer passes the
       "distillate found" check; unit cases added). One line noting both came
       from the 1.51.0 checkpoint re-review (A2/A3). Leave `## [Unreleased]`
       as `_(empty)_`.
     - `plugins/agentic-workflow/.claude-plugin/plugin.json` line 4: `1.51.1`.
     - `docs/WORKFLOW.md` line 3: `<!-- protocol-master: v1.51.1 -->`.

- **Verify** (run all three, in this order, from the repository root; report
  each in the distillate's `gates` with its first failing line if red):
  1. `node tools/run-codex-test.mjs` → exit 0, last line `run-codex harness:
     clean — N case(s)` with **N > 154**; every case named in Do 2 and Do 4
     prints `ok`.
  2. `node tools/lint.mjs` → exit 0, clean (it re-runs the harness as check
     10.7 and hook-test as 8/10.6; a `.plans/` grammar failure here means you
     touched `.plans/` — you must not have).
  3. `node plugins/agentic-workflow/tools/conform.mjs` → clean (reads the
     protocol-master stamp against `plugin.json`; proves the two version edits
     agree).
  4. `git status --porcelain` — list it in `summary`; expected touched paths
     are exactly: `plugins/agentic-workflow/tools/run-codex.mjs`,
     `tools/run-codex-test.mjs`, `evals/scenarios/codex-routing/checks.mjs`,
     `plugins/agentic-workflow/templates/distillate.schema.json`,
     `CHANGELOG.md`, `plugins/agentic-workflow/.claude-plugin/plugin.json`,
     `docs/WORKFLOW.md`. Nothing under `.plans/`. Do NOT commit.
  Done criteria the reviewer checks from the diff + gate output alone: the
  snapshot is taken before the spawn; `changedPaths(cwd)` without a snapshot
  is unchanged; no existing harness assertion was deleted or loosened except
  the two named rewrites (e2e `changed_paths`, failed-case paths) whose new
  expectations are stricter; the A3 predicate is `=== 'done'`; the three
  version edits agree; harness count > 154; lint + conform clean.

- **Read budget**: ~800 lines (well under the 1,500-line cap). Suits:
  `backend` (routes to `codex:gpt-6-astra` via the tune override).

**Checkpoint** ends phase 1 — the orchestrator commits `changed_paths` on
`mission/n1-codex-astra` and spawns ONE fresh one-shot `reviewer` (Claude —
**this is the Claude half of the n=1**; run it on Fable per the owner's
evaluation-tier rule) over `587aee6..HEAD`. The reviewer re-runs the three
gates, diff-checks the done criteria above, and confirms no `.plans/` edit and
no commit came from the Codex run. Then, per gate policy `human-merge`:
§10 Staging = none → lint green on the branch + `claude --plugin-dir` load in a
consumer session → PR to `main` for the owner. After the reviewer returns, the
orchestrator records both vendors' tokens (Closing row `n=1 tokens recorded`).

---
_Size every brief to its read budget; split any that can't fit and note the
split. Each session's outcome and any deviation lands in
`.plans/n1-codex-astra.state.md`, never only in chat._
