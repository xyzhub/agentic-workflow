---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: concurrent-missions — session briefs

_The execution view: one brief per session, pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the
exploration happened once, here (2026-11-19, tree at `main` `5ba640e`, plugin
1.69.1)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/concurrent-missions.md` · Ledger: `.plans/concurrent-missions.state.md`
Sources (all dated 2026-11-19, under `docs/product/decisions/`):
`…-concurrent-missions-brief.md` (205 lines) · `…-memos.md` (769) ·
`…-journeys.md` (217) · `…-metrics.md` (134) · `…-counsel.md` (55). Below they
are named `brief`, `memos`, `journeys`, `metrics`, `counsel`.

**Parked** (LD-7). Nothing here runs until the owner schedules it and answers
the open questions. Every line number is a hint measured at `5ba640e`; the
symbol or heading beside it is the anchor. Un-parking starts with a `replan`
that re-measures them (required if continuous-operation has landed — it moves
`tools/lint.mjs`).

**Blocked by the ledger's PRE-S1 row.** S1 is not spawned until the owner's
answers to OQ-1, 2, 3, 5, 6, 8, 9, 10 and 13 are recorded as dated locks, the
replan has re-measured every anchor and both byte headrooms (this plan spends
2,600 of the 4,134 B left in `templates/WORKFLOW.md` and 900 of the 1,193 B
left in `commands/mission.md`; a smaller headroom at un-park means the
budgets below shrink first), and probes 1–5 are in the handoff log.

**Catalog**: none — §10 **Catalog** is `none — markdown-only plugin`;
`docs/product/catalog/` does not exist. No catalog reads, no regeneration in
any Verify.

**Rules for every brief in this file**

- Anchors after S1: a lint check lives in `tools/lint.d/<nnn>-<checkName>.mjs`,
  a hook case group in `tools/hook-test.d/<nnn>-<slug>.mjs`. Briefs after S1
  name the check or group; find the file with `ls tools/lint.d | grep <name>`.
- A new check in this mission is a new file in `tools/lint.d/`. No brief after
  S1 edits `tools/lint.mjs` (PD-2).
- New protocol text goes in `plugins/agentic-workflow/templates/concurrency.md`
  (created in S2). `templates/WORKFLOW.md` and `commands/mission.md` take
  pointers only, inside the byte budget each brief states (PD-3). Check with
  `wc -c` before returning; over budget is a `deviation`, not a trim of
  unrelated text.
- No `<!-- rule: … -->` fence is added (an id not in `RULES` fails
  `checkRuleDedup`); no paragraph restates a registered rule.
- Text that names the merge or approve command is written with the file tools,
  never a shell heredoc (the guard reads command text — R-11).
- No brief names a version number, edits a version pin, or edits `CHANGELOG.md`
  after S3 retires `[Unreleased]`.
- Builders never write under `.plans/`, never commit, never push.
- **How the tools reach a venture.** Nothing new is copied into a project.
  Commands call a tool as `node ${CLAUDE_PLUGIN_ROOT}/tools/<tool>.mjs`, the
  way `commands/mission.md:68` calls `ledger.mjs`; hooks use the same variable
  from their environment. Every tool resolves the project from the git
  top-level of its working directory and reads §10 from that project's
  `docs/WORKFLOW.md` — never from its own location, never a path of this
  repo. A rule a venture must also obey (own ledger only, no version edit,
  write-set shape) lives in the plugin tool; the `tools/lint.d/` file here is
  a thin caller, because ventures never run this repo's root lint. Verify
  lines below write `node plugins/agentic-workflow/tools/…` because that is
  the path in this repo; each harness also runs its tool from a throwaway
  project directory that is not this repo.
- Every brief ends with: `node tools/lint.mjs` prints `lint: clean`;
  `node tools/lint-test.mjs` and `node tools/hook-test.mjs` clean (AC-17); and
  a self-audit line `declared N, wrote M, unused: …` comparing
  `git status --porcelain` paths with its `Writes`.

**Gates available in this repo** (§10):

| Gate | Command | When |
|---|---|---|
| Test / lint gate (CI `lint.yml`) | `node tools/lint.mjs` | end of every brief, every checkpoint |
| Harnesses | `node tools/lint-test.mjs` · `node tools/hook-test.mjs` | same |
| New harnesses | `worktree-test` · `ledger-test` · `write-sets-test` · `land-test` · `concurrent-test` (all `node tools/<name>.mjs`) | after each edit of the tool they cover |
| Staging verify (§10 Staging = none) | lint green + `claude --plugin-dir plugins/agentic-workflow` loads | at ckpt-p1 and ckpt-p2, before the PR is marked ready |

## Large-files table

| File | Lines | Notes |
|---|---|---|
| `tools/hook-test.mjs` | 2,589 | never read whole; split by script in S1 (90 top-level blocks, 276 `check(` lines) |
| `CHANGELOG.md` | 1,801 | read 1–14 and the second `[Unreleased]` at 852 ±4 only |
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 1,431 | 115,866 B of 120,000; ranged reads only |
| `docs/WORKFLOW.md` | 1,430 | this repo's copy; only §10 rows (1016–1048) are edited |
| `tools/lint.mjs` | 1,412 | contended (R-1); 35 checks in one array line at 1402 |
| `docs/product/decisions/2026-11-19-concurrent-missions-memos.md` | 769 | ranges named per brief |
| `plugins/agentic-workflow/README.md` | 363 | commands table 137–186, tool list 188–212, development 353–361 |
| `plugins/agentic-workflow/commands/mission.md` | 350 | 22,807 B of 24,000 |
| `tools/ledger-test.mjs` | 345 | read 1–40 only |
| `tools/lint-test.mjs` | 310 | split in S1 |
| `.plans/write-sets.sessions.md` | 280 | superseded; design reference for S4 only |
| `plugins/agentic-workflow/tools/ledger.mjs` | 277 | whole in S3 |
| `plugins/agentic-workflow/tools/conform.mjs` | 258 | read 20–46, 146–152, 236–258 |
| `plugins/agentic-workflow/commands/settle.md` | 242 | 12,817 B |
| `plugins/agentic-workflow/agents/reviewer.md` | 220 | read 176–215 |
| `docs/product/decisions/2026-11-19-concurrent-missions-journeys.md` | 217 | read 19–40 and 131–173 |
| `plugins/agentic-workflow/hooks/hooks.json` | 215 | line 89 alone is about 2 KB |
| `plugins/agentic-workflow/hooks/lib/merge-guard.sh` | 176 | whole in S7 |
| `tools/ceremony-test.mjs` | 175 | read 1–40 (harness exemplar) |
| `plugins/agentic-workflow/agents/planner.md` | 171 | read 55–115 |
| `plugins/agentic-workflow/commands/doctor.md` | 162 | read 62–115 |
| `plugins/agentic-workflow/agents/chronicler.md` | 154 | read 55–66 |
| `plugins/agentic-workflow/templates/mission-state.md` | 148 | read 85–130 |
| `tools/ci-wait.mjs` | 134 | read 1–40 |
| `docs/product/decisions/2026-11-19-concurrent-missions-metrics.md` | 134 | whole in S6 |
| `plugins/agentic-workflow/hooks/lib/obligations-due.sh` | 127 | read 45–127 |
| `plugins/agentic-workflow/hooks/lib/mission-budget.sh` | 118 | whole in S6 |
| `plugins/agentic-workflow/hooks/lib/active-ledger.sh` | 83 | whole in S2 |
| `README.md` (root) | 71 | command list at 33 |
| `plugins/agentic-workflow/templates/mission-sessions.md` | 59 | whole in S4 |
| `docs/product/decisions/2026-11-19-concurrent-missions-counsel.md` | 55 | whole in S5 and S7 |
| `plugins/agentic-workflow/templates/obligations.md` | 30 | whole |
| New: `worktree.mjs` · `words.mjs` · `fragments.mjs` · `write-sets.mjs` · `land.mjs` · `burn.mjs` (under `plugins/agentic-workflow/tools/`) | new | est. 150–450 lines each |
| New: `templates/concurrency.md` · `templates/clash-brief.md` · `commands/land.md` | new | est. 250 / 40 / 80 lines |

## Phase 1 — everything except agent-merge (branch: `mission/concurrent-missions-p1`)

One branch, one feature PR to `main`, the owner merges (gate policy
`human-merge`). Briefs run serially, in order — each later brief reads files
an earlier one creates, so no two could share a wave. Before each checkpoint
the orchestrator merges `main` into the branch (R-1 gives the rule for the one
line that can conflict).

**Orchestrator, after S3 (no session, PD-13 — stands in for the folded
mid-phase review):** merge `main` into the branch; run `lint`, `lint-test`,
`hook-test`, `worktree-test` and `ledger-test` itself; re-run S1's equivalence
proofs at S1's SHA (below); record each command and its output in the ledger
handoff. Any red → stop before S4.

**Orchestrator, before S1 (probes 1–5, no session — builders never push, and
probe 3 needs an isolated session):** record each command and its output in
the ledger handoff.

- Probe 1 (LD-5): push a branch `probe/cm-worktree`, add a worktree by hand at
  `.claude/worktrees/_probe-cm`, leave it clean, and read it again after the
  next session boundary (S2 starts after one). Survived or reaped decides the
  path constant.
- Probe 2: in the scratchpad, a bare repo and two clones; push a new ref with
  `--force-with-lease=<ref>:` (empty expected value) from one clone, then the
  same from the other; record whether the second is refused, and what a plain
  no-force push of an existing ref does.
- Probe 3: from a session isolated in `.claude/worktrees/_probe-cm`, create
  and write `.claude/worktrees/_probe-land`; record whether the write is
  allowed; remove it.
- Probe 4 (OQ-10): does a spawn's result show token usage and duration, and
  in what field? Read it off a spawn already made (the planner's or the
  plan-judge's return) — no extra spawn. If not, does the session transcript
  carry `usage` figures for it? S6 reads this line; "neither" means two
  missions stay off and the owner is told before S1 spends a session.
- Probe 5: run `gh auth status` on this host and record whether it lists
  every stored login, not only the active one. GATE-P2's condition (a) rests
  on it, so it is proven here, not in S7.

### S1 — central lists become folders

- **ACs**: AC-6, AC-17
- **Suits**: `backend`. One commit, nothing else in it (PD-2). The return
  names that commit's SHA — ckpt-p1 and the after-S3 check re-run S1's proofs
  there (PD-13).
- **Precondition**: the PRE-S1 row is done. Test by content, not by branch
  name: count the names on the array line of `tools/lint.mjs` (`grep 'for
  (const check of \[' tools/lint.mjs | tr ',' '\n' | wc -l`). 35 → continuous-
  operation has not landed; 36 or more → it has, and its check is converted
  with the rest. Report the count. At 35, proceed only if the owner's answer
  to OQ-1 said to go ahead, and say so in the return.
- **Reads** (≈ 520 lines):
  1. `memos` 504–601 (M4: inventory, options, recommendation, venture pattern).
  2. `tools/lint.mjs` 1–60 (imports, `ROOT`, `findings`, `fail`, `read`,
     `allMd`, `frontmatter`), 338–370 (`checkHookBehavior`, `checkClockGuard`:
     how a harness is run), 1378–1412 (`export {` at 1383, `isEntryPoint` at
     1391, the array line at 1402, the exit).
  3. `tools/lint-test.mjs` 1–30 (what it imports from `lint.mjs`) and 280–310
     (`run()`, the case groups, the total).
  4. `tools/hook-test.mjs` 1–160 (`hookCommand` 37, `runHook` 67, `runGate`
     141, `check` 154) and 2560–2589 (the tail: cleanup, summary, exit).
  5. `.plans/write-sets.sessions.md` 43–75 ("Facts already probed": the lint
     shape and the measured merge behaviour of the array line).
  6. `plugins/agentic-workflow/README.md` 353–361 (Development).
- **Writes**: `tools/lint.mjs` · `tools/lint.d/` · `tools/lint-test.mjs` · `tools/lint-test.d/` · `tools/hook-test.mjs` · `tools/hook-test.d/` · `plugins/agentic-workflow/README.md`
- **Catalog**: none.
- **Do**:
  1. **Baselines** into the scratchpad: `node tools/lint.mjs` output;
     `node tools/hook-test.mjs` `ok` lines, sorted; the `lint-test: clean (N
     cases)` line; the names on the array line, in order, and their count
     (35 at `5ba640e`; one more if continuous-operation has landed).
  2. **Split by script, not by hand.** Write a throwaway splitter in the
     scratchpad keyed on top-level boundaries (`^function check…` in
     `lint.mjs`; top-level `{ … }` blocks and the comment lines above them in
     `hook-test.mjs`). It is not committed.
  3. **`tools/lint.d/`** — `_lib.mjs` holds the shared state and helpers now at
     the head of `lint.mjs` and the non-check helpers between checks; one file
     per check, `<nnn>-<checkName>.mjs`, `nnn` = position in today's array ×
     10, zero-padded, each `export default`. `tools/lint.mjs` becomes the
     runner: list `lint.d/*.mjs` not starting with `_`, sort, import, call.
     Keep the `export {` names importable from `tools/lint.mjs` (re-export) so
     `lint-test`'s imports do not change. The array line is deleted. A finding
     names the file its check came from.
  4. **`tools/lint-test.d/`** — one file per case group, each exporting its
     cases; `tools/lint-test.mjs` becomes the runner and prints the same total.
  5. **`tools/hook-test.d/`** — `_harness.mjs` holds lines 1–160 and every
     top-level constant more than one block uses; one file per case group,
     `<nnn>-<slug>.mjs`, run in today's order. `tools/hook-test.mjs` becomes
     the runner (sequential imports, then the tail).
  6. **Self-check** — a new check file `<nnn>-checkListFolders.mjs`: fails when
     a file in any of the three folders was not run (name the file), when a
     file lacks its export, or when `tools/lint.mjs` again contains
     `for (const check of [`.
  7. One line in the README's Development section: where checks and cases live.
- **Verify**:
  - `ls tools/lint.d | grep -vc '^_'` is the baseline count + 1 (the
    self-check); the lint output equals the baseline apart from the file each finding names.
  - Sorted `ok` lines of `node tools/hook-test.mjs` are identical to the
    baseline (`diff` prints nothing); `hook-test: clean`.
  - `node tools/lint-test.mjs` prints the same case total.
  - `grep -c 'for (const check of \[' tools/lint.mjs` is 0; `grep -c '^export {'
    tools/lint.mjs` is 1.
  - Negative: add an empty `tools/lint.d/999-x.mjs` in a scratch copy of the
    repo → lint fails naming it. Same for one hook-test file renamed to start
    with `_` → the self-check fails.
  - `wc -l tools/lint.mjs tools/hook-test.mjs tools/lint-test.mjs` — each
    runner under 120 lines.
  - Catalog: not applicable.
- **Read budget**: ≈ 520 lines (≤ 30% of context, ~1,500). Suits: `backend`.

### S2 — a worktree per mission, the cap, ledger by branch

- **ACs**: AC-1, AC-3, AC-4, AC-22 (C6, C7), AC-17
- **Suits**: `devops`.
- **Reads** (≈ 900 lines):
  1. `memos` 47–177 (M1 whole: location options, 1b ledger by branch, 1c
     authority, 1d recipe, who creates and reaps, the cap, values).
  2. `journeys` 19–40 (state words) and 131–173 (states, sentences M1–M16).
  3. `plugins/agentic-workflow/hooks/lib/active-ledger.sh` whole (83):
     `ledger_closed_upstream` 47, `active_ledger` 64, the `ls -t` walk at 67,
     the status stop at 74.
  4. Its six callers, call lines only: `grep -n active_ledger
     plugins/agentic-workflow/hooks/lib/*.sh` (mission-budget 62, the two
     beat-enforcers, compact-resume, handoff-budget, handoff-lib).
  5. `tools/hook-test.d/_harness.mjs` (≈ 170, `runHook`'s `ledgers`, `git` and
     `dir` options) and the case group holding "active-ledger predicate"
     (was `tools/hook-test.mjs` 486–560).
  6. `plugins/agentic-workflow/commands/mission.md` 142–150 (§2 Run, step 1)
     and 206–218 (the `.worktrees` sentence at 215).
  7. `plugins/agentic-workflow/commands/settle.md` 116–168 (§3 the reap).
  8. `plugins/agentic-workflow/commands/doctor.md` 62–115 (§2 profile rows).
  9. `plugins/agentic-workflow/templates/WORKFLOW.md` 1028–1045 (§10 table),
     1078–1086 (`.worktrees` at 1082), and the hook-table rows "Mission-budget"
     and "Compact-resume" (274, 278 — `grep -n 'newest\|active ledger'`).
  10. `docs/WORKFLOW.md` 1016–1048 (this repo's §10).
  11. `tools/ceremony-test.mjs` 1–40 (harness shape) and
      `plugins/agentic-workflow/templates/obligations.md` whole (30 — the
      frontmatter a template carries).
- **Writes**: `plugins/agentic-workflow/tools/worktree.mjs` · `plugins/agentic-workflow/tools/words.mjs` · `tools/worktree-test.mjs` · `tools/lint.d/` · `tools/hook-test.d/` · `plugins/agentic-workflow/hooks/lib/` · `plugins/agentic-workflow/templates/concurrency.md` · `plugins/agentic-workflow/templates/WORKFLOW.md` · `plugins/agentic-workflow/commands/mission.md` · `plugins/agentic-workflow/commands/settle.md` · `plugins/agentic-workflow/commands/doctor.md` · `plugins/agentic-workflow/README.md` · `docs/WORKFLOW.md`
- **Catalog**: none.
- **Do**:
  0. Read probe 1's result from the ledger handoff. Survived → the path
     constant is `.claude/worktrees`. Reaped, or the handoff says the probe
     saw no session boundary → the constant is `.worktrees` (LD-6 fallback).
     The return says which and why. The probe worktree is the orchestrator's
     to remove.
  1. **`words.mjs`** — the seven state words and sentences M1–M16 copied
     verbatim from `journeys` 25–31 and 153–169, plus the PD-4 sentence; one
     function fills the angle-bracket names. Nothing else states them.
  2. **`worktree.mjs`** (zero dependencies, entry-point guard as in
     `tools/lint.mjs`):
     - `up <mission>` — idempotent; re-running heals a half-built worktree.
       Order: cap check → create or reuse the worktree and branch → the §10
       **Worktree recipe** (`install`, `copy`, `generate`, `db`, `port`, or
       `script:`) → print M1. A failed step prints M5 and leaves no slot held.
     - `db`: name `<repo>_<mission>`, lowercased, `[a-z0-9_]` only, cut to 63
       bytes; the admin URL is read by env NAME from the main checkout's
       untracked env file and is never printed, logged or written into §10;
       only the per-mission `DATABASE_URL` is written to the worktree's env
       file. Confirm the 63-byte limit against the PostgreSQL docs and cite
       it in a comment.
     - `down <mission>` — drop the scratch database, remove the worktree,
       delete the local branch; refuses on a dirty worktree.
     - `slots [--json]` — slots held = worktrees in `git worktree list` whose
       own-branch ledger is active by the same predicate as
       `active-ledger.sh`; cap from the §10 **Mission cap** row, default 2. A
       mission beyond the cap prints M4 naming both holders and their state.
     - Recipe `none` (this repo) → `up` only creates the worktree.
  3. **Ledger by branch** — `active_ledger` takes the directory to resolve
     from (the hook input's `cwd`, never the project-dir variable); a branch
     `mission/<name>-…` maps to `.plans/<name>.state.md` by the longest
     existing prefix; no match → today's mtime walk, unchanged. Each caller
     passes its cwd. Update the header comment (C6).
     **A blocked ledger must not silence another mission.** Today any
     `Status:` but `active` ends the mtime walk (line 74), so a mission
     waiting at a gate — written to while blocked, hence newest — would stop
     the hooks of a mission on a branch not named `mission/…`. Rule: on the
     branch path a `blocked` ledger is silent for its own mission, as today;
     on the fallback path a `Status: blocked` ledger is stepped over
     (`continue`), never a stop. `Closed:` and every other status keep
     today's stop, so a closed focus still does not fall through to an
     abandoned ledger. State the rule in the header comment and in
     `concurrency.md`.
  4. **Own-ledger check** — `worktree.mjs check-branch`: on a `mission/<x>-…`
     branch the diff against the merge-base with the default branch touches
     no `.plans/<y>.*` for another mission `y`. Silent on any other branch
     and outside a git tree. A new lint check file calls it here; S5's
     `prepare` calls it in a venture.
  5. **Harnesses** — `tools/worktree-test.mjs` (throwaway repo; stub `psql` on
     PATH; cases below) wired by a new lint check file; one new hook-test
     group for the ledger.
  6. **`templates/concurrency.md`** (new, with template frontmatter) —
     sections: Worktree per mission · The recipe · The cap · Which ledger copy
     is the true one (memos 105–115). Later briefs add their own sections.
  7. **Pointers** — `templates/WORKFLOW.md`: §10 rows **Worktree recipe** and
     **Mission cap** (one line each, pointing at `concurrency.md`); the hook
     table's "newest" wording (C6); line 1082 (C7). `commands/mission.md`:
     line 215 (C7) and one start step before §2 step 1 ("`worktree.mjs up`
     first; stop on M4 or M5"). `settle.md` §3: the reap calls `worktree.mjs
     down`. `doctor.md` §2: warn when two worktrees share a `DATABASE_URL`.
     `docs/WORKFLOW.md` §10: `Worktree recipe: none`, `Mission cap: 2`. Plugin
     README tool list: `worktree.mjs`.
  - **Byte budget**: `templates/WORKFLOW.md` net ≤ +900 B; `commands/mission.md`
    net ≤ +350 B.
- **Verify**:
  - `node tools/worktree-test.mjs` exits 0, covering: `up` twice = one
    worktree; a third mission at cap 2 prints M4 with both names and creates
    nothing; a parked ledger frees its slot; a failing `install` prints M5 and
    `slots` shows the slot free; a 70-character mission name yields a database
    name of ≤ 63 bytes matching `^[a-z0-9_]+$`; the admin URL string never
    appears in stdout, stderr or any written file but the worktree env file's
    derived URL; `down` refuses a dirty worktree.
  - Hook-test group: branch beats mtime; no branch match → mtime; two
    worktrees → two different ledgers; `mission/write-sets-p1` maps to
    `write-sets`, not to a shorter existing name; on a `feat/x` branch with
    the newest ledger `Status: blocked` (sessions used above 0) and an older
    active one, mission-budget reports the older one; the existing case
    "newest closed + older never-closed → silent" still passes unchanged.
  - Own-ledger check: a scratch branch `mission/a-p1` touching `.plans/b.state.md`
    fails lint; the same diff on `feat/x` does not.
  - `grep -rn 'newest-touched' plugins/agentic-workflow/hooks/lib` prints
    nothing; `grep -rn '\.worktrees/<mission>' plugins/agentic-workflow/commands
    plugins/agentic-workflow/templates/WORKFLOW.md` prints only the fallback
    wording, if any.
  - `wc -c` of the two budgeted files within budget and under their ceilings.
  - `node plugins/agentic-workflow/tools/worktree.mjs slots` in this repo
    prints the continuous-operation worktree's state without error.
  - Catalog: not applicable.
- **Read budget**: ≈ 900 lines. Suits: `devops`.

### S3 — bookkeeping that cannot conflict

- **ACs**: AC-5, AC-8, AC-16, AC-22 (C8, C9, C11), AC-17
- **Suits**: `backend`.
- **Reads** (≈ 950 lines):
  1. `memos` 415–503 (M3 whole: options, recommendation, how each reader
     changes, values). **Superseded by LD-4:** the row at 487 — nothing folds
     on a feature branch; the fold runs after the merge, on a follow-up branch.
  2. `plugins/agentic-workflow/tools/ledger.mjs` whole (277): `VERBS` 46,
     `nextOb` 108–112, `promote` 113–132, `close` 185–192.
  3. `tools/ledger-test.mjs` 1–40 (shape).
  4. The lint checks `checkObRow`, `checkClosing`, `checkObligationsRegister`
     and their helper `obBullets` (were `tools/lint.mjs` 877–1019, ≈ 145).
  5. `plugins/agentic-workflow/hooks/lib/obligations-due.sh` 45–127 (register
     path 50, counts 73 and 97, the message 123).
  6. `plugins/agentic-workflow/hooks/lib/active-ledger.sh` — the one line
     matching `→[[:space:]]*OB-[0-9]` (was 78).
  7. `plugins/agentic-workflow/commands/settle.md` 12–31 (§1 inventory) and
     169–242 (§4 write back, §5 the close gate, the release paragraph at 226).
  8. `plugins/agentic-workflow/agents/chronicler.md` 55–66 (Artifact 1).
  9. `plugins/agentic-workflow/templates/mission-state.md` 85–130 (the Closing
     grammar and the seeded rows; `version bumped + stamped` at 126).
  10. `plugins/agentic-workflow/templates/obligations.md` whole (30).
  11. `CHANGELOG.md` 1–14 and 848–856 (the two `[Unreleased]` headers, memo
      fact G4); `docs/WORKFLOW.md` 1040 (Version pin row); the two pin files
      (`plugin.json` 11 lines, `package.json` 12).
- **Writes**: `plugins/agentic-workflow/tools/fragments.mjs` · `plugins/agentic-workflow/tools/ledger.mjs` · `tools/ledger-test.mjs` · `tools/lint.d/` · `tools/lint-test.d/` · `tools/hook-test.d/` · `plugins/agentic-workflow/hooks/lib/` · `plugins/agentic-workflow/commands/settle.md` · `plugins/agentic-workflow/agents/chronicler.md` · `plugins/agentic-workflow/templates/mission-state.md` · `plugins/agentic-workflow/templates/obligations.md` · `plugins/agentic-workflow/templates/concurrency.md` · `plugins/agentic-workflow/templates/WORKFLOW.md` · `plugins/agentic-workflow/README.md` · `docs/WORKFLOW.md`
- **Catalog**: none.
- **Do**:
  1. **`fragments.mjs`** — pure exports plus a CLI. `check`: every
     `changelog.d/*.md` starts with `bump: patch|minor|major`. `fold
     [--dry-run]`: read the fragments in sorted order; next version = the
     current pin raised by the largest `bump:`; write one dated version
     section at the top of `CHANGELOG.md`; delete the folded fragments; set
     the version in every pin file named by the §10 **Version pin** row. Two
     fragments fold in one run without either being lost.
  2. **Retire `[Unreleased]` inside `fold`, not by hand.** `fold` carries
     whatever sits under any `[Unreleased]` header into the section it writes
     and removes the header (there are two today — memo fact G4). This brief
     does **not** edit `CHANGELOG.md`: the first real fold (this mission's own
     stamp) retires them, and a later branch that still wrote under
     `[Unreleased]` is absorbed the same way.
  3. **Obligations per mission** — `ledger.mjs promote` appends to
     `.plans/obligations/<mission>.md` with id `OB-<mission>-<k>`, `k` = next
     unused within that file (no shared counter, so no collision — memo fact
     G5). Integer ids already in `.plans/OBLIGATIONS.md` stay valid and
     fireable; nothing is renumbered or moved.
  4. **Widen the id grammar** everywhere it is matched: `ledger.mjs` (102,
     110, 115, 125, 189), the three lint checks, `active-ledger.sh`,
     `obligations-due.sh` (count both homes), `settle.md`'s greps.
  5. **Two rules, in the tool** — `fragments.mjs check` also fails when, on
     a `mission/…` branch, the diff against the merge-base changes a version
     line in a pin file or touches `CHANGELOG.md` (silent on other branches).
     Two new lint check files call it here (`checkNoVersionEdit`,
     `checkFragments`); S5's `prepare` calls it in a venture.
  6. **Templates and prose** — `mission-state.md`: the seeded row
     `version bumped + stamped` (pre-merge) becomes `landed as vX.Y.Z`
     (post-merge; when: the version on the default branch is above the one at
     branch cut and the fragment is gone) (C8). `settle.md` 226–242 to match.
     `chronicler.md` Artifact 1: write `changelog.d/<mission>.md`, never
     `CHANGELOG.md`. `obligations.md`: the id rule (C11).
     `docs/WORKFLOW.md` 1040 and the template row: both pin files (C9).
     `concurrency.md`: section "Bookkeeping". README tool list: `fragments.mjs`.
  - **Byte budget**: `templates/WORKFLOW.md` net ≤ +400 B.
- **Verify**:
  - `node tools/ledger-test.mjs` clean with new cases: two missions promoting
    in the same run get different ids; an integer row still fires; `close`
    accepts `→ OB-<mission>-<k>`.
  - Fold, in a scratch copy: two fragments (`minor`, `patch`) → one section,
    both bodies present, both fragments gone, both pin files carry the same
    new version, and it is a minor step; `--dry-run` changes nothing.
  - Merge proof (AC-8, AC-16): two scratch branches each adding its own
    fragment and its own obligations file merge with `git merge` and no
    conflict.
  - `checkNoVersionEdit`: a scratch `mission/a-p1` branch editing
    `plugin.json`'s version fails lint; the same on `chore/x` does not.
  - Fold on a scratch copy of today's `CHANGELOG.md`: both `[Unreleased]`
    headers are gone afterwards and every line that sat under them is in the
    new section. `git diff --stat -- CHANGELOG.md` on the branch is empty.
  - `grep -rn 'version bumped + stamped' plugins/agentic-workflow` prints
    nothing; `grep -rn 'next unused integer' plugins/agentic-workflow` prints
    nothing.
  - `git diff --stat` shows no change to either pin file and no `.plans/` path.
  - Catalog: not applicable.
- **Read budget**: ≈ 950 lines. Suits: `backend`.

### S4 — declared write sets, the overlap check, clash classes

- **ACs**: AC-2, AC-11, AC-12, AC-14, AC-15, AC-17
- **Suits**: `backend`.
- **Reads** (≈ 880 lines):
  1. `memos` 602–697 (M5 whole: comparison basis, the owner's sentence, clash
     classes, the builder brief template at 651–666, values).
  2. `.plans/write-sets.md` 40–100 (the field, the entry forms accepted and
     rejected, validate-when-present, the three-valued comparison) and
     170–177 (their sources). Reuse the grammar; **do not** build wave
     grouping, `--report`, `--cap` or any rate — that half is parked.
  3. `.plans/write-sets.sessions.md` 43–75 (facts: how briefs and phases are
     marked in sessions files; `### S<digit>` is a brief, other `###` are not).
  4. `plugins/agentic-workflow/templates/mission-sessions.md` whole (59).
  5. `plugins/agentic-workflow/agents/planner.md` 55–115.
  6. `plugins/agentic-workflow/agents/reviewer.md` 176–215 (plan-judge list).
  7. `plugins/agentic-workflow/commands/mission.md` 142–150 (the start step S2
     added) and 86–100 (§1 Plan).
  8. `plugins/agentic-workflow/tools/conform.mjs` 20–46, 146–152, 236–258.
  9. `plugins/agentic-workflow/templates/WORKFLOW.md` 369–409 (§5 trio table;
     the sessions-file row at 385; the fence at 404–407 is not touched).
  10. `plugins/agentic-workflow/tools/words.mjs` (M2, M3, M12–M15) and
      `worktree.mjs` — its `up` function only.
  11. `tools/ceremony-test.mjs` 1–40.
- **Writes**: `plugins/agentic-workflow/tools/write-sets.mjs` · `plugins/agentic-workflow/tools/worktree.mjs` · `plugins/agentic-workflow/tools/conform.mjs` · `tools/write-sets-test.mjs` · `tools/lint.d/` · `plugins/agentic-workflow/templates/mission-sessions.md` · `plugins/agentic-workflow/templates/clash-brief.md` · `plugins/agentic-workflow/templates/concurrency.md` · `plugins/agentic-workflow/templates/WORKFLOW.md` · `plugins/agentic-workflow/agents/planner.md` · `plugins/agentic-workflow/agents/reviewer.md` · `plugins/agentic-workflow/commands/mission.md` · `plugins/agentic-workflow/README.md`
- **Catalog**: none.
- **Do**:
  1. **`write-sets.mjs`** (zero dependencies; pure exports, entry-point guard):
     - the sessions-file parser and the shape validator; `--check <file>…`
       exits 1 with one `file:line: message` per finding; a file where no
       brief carries `Writes` passes with one note; some-but-not-all fails.
     - one comparison function, three-valued, undecidable = overlap, symmetric.
     - `--against` — the new mission's set (the union of its briefs' `Writes`)
       against each running mission's declared set, read from that mission's
       own branch with `git show`, united with its actual changes
       (`git diff --name-status --no-renames <merge-base>...<branch>`). The
       paths of PD-5 are left out. Clear → M2 per running mission. Overlap →
       M3 with the files, and a distinct exit code.
     - `classify` — given a merge in progress, each conflicted file is `tiny`
       or `real` by the memo's rule (639–649): every hunk has an empty base
       side, the union of both sides parses for its type (JSON parses; `.mjs`
       passes `node --check`; a markdown table keeps its column count), or the
       path is a record path. Anything else is `real`. No judgement, no
       line-count threshold. `--apply` writes the union for tiny files only.
  2. **Wire the pre-start check** — `worktree.mjs up` runs `--against` after
     the cap check and before creating anything; on overlap it stops with M3
     and exits; a re-run with the owner's recorded choice (`--overlap=run`)
     proceeds. The orchestrator records the choice as a dated locked decision
     in the new mission's ledger.
  3. **`templates/clash-brief.md`** — the memo's template (651–666) verbatim,
     plus: the one-corrective-retry rule does not apply to it (a pointer, not
     a restatement); the reviewer re-checks only the resolution diff, at the
     tier of the file's class; a fix that changed code the owner approved
     needs the owner's fresh approval (LD-3).
  4. **Harness** — `tools/write-sets-test.mjs`, inline fixtures; a new lint
     check file runs it and runs `--check` over every `.plans/*.sessions.md`.
  5. **`conform.mjs`** — one ladder entry `write-sets-shape`, true when no
     sessions file carries `Writes`.
  6. **Templates and prose** — `mission-sessions.md`: the `- **Writes**:`
     bullet after `Reads` (the five forms, ` · ` separator, `none`, never
     `.plans/`). `planner.md`: the duty to declare `Writes` on every brief, as
     a pointer. `reviewer.md`: one plan-judge bullet. `WORKFLOW.md` §5: add
     "declared write set" to the sessions-file row. `concurrency.md`: sections
     "Declared write sets", "The overlap check", "Clash classes". README tool
     list. Leave every "parallel-safe" sentence as it is (PD-6).
  - **Byte budget**: `templates/WORKFLOW.md` net ≤ +300 B; `commands/mission.md`
    net ≤ +150 B.
- **Verify**:
  - `node tools/write-sets-test.mjs` exits 0, covering every accepted and
    rejected entry form; all-or-none; the comparison table with a symmetry
    loop and undecidable-is-overlap; `--against` in a throwaway repo — an
    overlapping second mission prints M3 naming the file **and no worktree
    exists afterwards** (AC-14), a disjoint one prints M2 only (negative
    control), a running mission that changed a file outside its declaration
    is still caught; `classify` — two pure-addition hunks in a JSON array are
    `tiny` and the union parses, a same-line edit is `real`, a delete-vs-modify
    is `real`, a pure-addition union that fails `node --check` is `real`.
  - `node plugins/agentic-workflow/tools/write-sets.mjs --check
    .plans/concurrent-missions.sessions.md` exits 0; a scratch copy with one
    entry changed to `../x` exits 1.
  - `node plugins/agentic-workflow/tools/conform.mjs --root . --json` shows no
    `write-sets-shape` gap, and a scratch root with one bad `Writes` entry
    shows one.
  - `grep -c 'wave' plugins/agentic-workflow/tools/write-sets.mjs` is 0.
  - `wc -c` within both budgets. Catalog: not applicable.
- **Read budget**: ≈ 880 lines. Suits: `backend`.

### S5 — the queue: agent prepares, owner clicks

- **ACs**: AC-7, AC-8, AC-9, AC-11, AC-12, AC-15, AC-19, AC-20 (the lock
  half: per PR, heartbeat, re-checked), AC-22 (C14; C5 recorded as
  superseded), AC-17
- **Suits**: `devops`. No hook and no guard changes in this brief — the merge
  guard is untouched until phase 2 (OQ-2).
- **Prior art**: `plugins/agentic-workflow/hooks/lib/merge-guard.sh` (the
  records-only allowlist at 150–153 — read, not edited: it is why the
  follow-up PR is the owner's to merge in phase 1).
- **Reads** (≈ 1,050 lines):
  1. `memos` 178–262 (M2 queue mechanics, staging as the first meeting point,
     the landing step, on failure). **Superseded — do not build:** steps 4 and
     6 (247–248, 252) and any push onto a PR branch after approval (LD-4);
     the whole-queue lock and its 30-minute takeover at 197–203 (LD-5).
  2. `counsel` whole (55).
  3. `journeys` 131–173 (states and sentences, via `words.mjs`).
  4. `plugins/agentic-workflow/hooks/lib/merge-guard.sh` 1–26 and 140–156.
  5. `tools/ci-wait.mjs` 1–40 (its interface and exit codes).
  6. `plugins/agentic-workflow/tools/fragments.mjs` and `write-sets.mjs` —
     exported names and CLI sections only (≈ 120); `worktree.mjs` `up`/`down`
     (≈ 80); `words.mjs` whole (≈ 70).
  7. `plugins/agentic-workflow/commands/mission.md` 250–281 (staging, the PR,
     the gate policy text at 262–274).
  8. `plugins/agentic-workflow/templates/WORKFLOW.md` 505–540 (staging →
     verify → PR; gate policy) and 583–590 (one driver per mission).
  9. `plugins/agentic-workflow/commands/settle.md` 1–11 (a command's
     frontmatter); plugin README 137–186 (commands table); root `README.md`
     30–36 (the command list).
  10. The hook-test group for the merge guard — its `gh` stub pattern only
      (was `tools/hook-test.mjs` 1782–1820, ≈ 40; `grep -n 'gh-stub'`).
- **Writes**: `plugins/agentic-workflow/tools/land.mjs` · `tools/land-test.mjs` · `tools/lint.d/` · `plugins/agentic-workflow/commands/land.md` · `plugins/agentic-workflow/commands/mission.md` · `plugins/agentic-workflow/commands/settle.md` · `plugins/agentic-workflow/templates/concurrency.md` · `plugins/agentic-workflow/templates/WORKFLOW.md` · `plugins/agentic-workflow/README.md` · `README.md`
- **Catalog**: none.
- **Do**:
  1. **`land.mjs`** (zero dependencies; `gh` and `git` only through argument
     arrays, never a shell string):
     - `lock take|beat|release <name>` — a per-PR lock as a remote ref
       (`refs/heads/aw/land-<pr>`; `staging` for a venture's staging merges),
       taken create-only by the method probe 2 proved; the lock commit carries
       holder and a heartbeat stamp; `beat` refreshes it; a holder re-checks
       that it still holds the lock immediately before each step whose result
       leaves the machine. A lock with no heartbeat past the stale threshold
       may be taken over, logged. Pick the two numbers, state them in the
       return (OQ-6).
     - `status` — one row per mission and PR in the state words; reads the
       worktree slots and GitHub; where a ledger and GitHub disagree it prints
       both and says so. Every row says landed or not landed.
     - `prepare` — the queue is the open PRs labelled `aw:queue`, oldest
       label first (PD-4). For the head of the queue: take the lock; fetch;
       run `worktree.mjs check-branch` and `fragments.mjs check` on the PR
       head (a failure returns the PR, as a red run does);
       build the combined tree **without touching the PR branch**
       (`git merge-tree --write-tree` of the default branch and the PR head,
       committed to a local scratch ref, checked out in the landing worktree
       — `.claude/worktrees/_land`, or the main checkout if probe 3 said the
       write is blocked); run the §10 gates there. Green → label `aw:ready`
       recording the default-branch commit it was tested against, and print
       the PD-4 sentence. **At most one PR carries `aw:ready` at a time**:
       `prepare` does nothing for the next PR while one is ready and
       unmerged, so no two PRs are ever both ready without having been
       tested together — the second is tested on a default branch that
       already contains the first. A ready PR the owner leaves unmerged can
       be pulled back (`aw:ready` removed) to let the next one through. Red → remove `aw:queue`, add `aw:returned`, one PR
       comment with the plain reason, print M10, go to the next PR (AC-9). A
       `ready` mark is stale as soon as the default branch moves; `status`
       says so and `prepare` re-tests.
     - conflict while building the combined tree → `write-sets.mjs classify`.
       All tiny → apply the union, re-run the gates, and (phase 1 only —
       nothing is approved yet) hand the orchestrator the resolution to push
       to the PR branch; print M12. Any real → exit with a distinct code and
       the filled `clash-brief.md` on stdout for the orchestrator to spawn
       **one** builder with; print M13. `land.mjs` never spawns and never
       pushes to a PR branch itself. After a real-clash fix `prepare` does
       not mark the PR ready until the orchestrator has recorded the
       reviewer's verdict on that resolution commit (`land.mjs reviewed <pr>
       <sha>`); a tiny union needs none (AC-12).
     - `stamp` — after a merge is seen on the default branch: from a fresh
       branch `chore/landed-<short sha of the default branch>`, run
       `fragments.mjs fold` over every fragment present, open the follow-up
       PR, print M9 once it is merged. In phase 1 the owner merges it (OQ-2).
       **One open follow-up at a time.** If a follow-up is still open when
       another mission lands, `stamp` closes it with a comment naming its
       replacement and opens one new follow-up from the current default
       branch; that one folds both missions' fragments into one version
       section. Two follow-ups never edit the same pin lines, and nothing is
       force-pushed. `prepare` marks nothing ready while the default branch
       carries an unfolded fragment and no follow-up is open — it runs
       `stamp` first.
     - a mission's lander never writes another mission's ledger or branch.
  2. **`commands/land.md`** — `/agentic-workflow:land [status|prepare|stamp]`,
     short; the procedure lives in `concurrency.md`. Name the command in both
     READMEs and once in `templates/WORKFLOW.md` (`checkCrossRefs` requires it).
  3. **Protocol** — `concurrency.md`: sections "The landing queue (phase 1:
     agent prepares, owner clicks)", "Staging is a shared lane" (the lock on
     staging merges and the evidence rule, memos 222–238), "When a clash is
     found" (tiny / one builder once / reviewer re-check of the resolution
     diff / LD-3). `WORKFLOW.md` 505–522: one pointer sentence for C14.
     `mission.md` 262–274: after the PR opens, label it and run `prepare`;
     the human still merges. `settle.md`: `stamp` before the close gate.
     C5 needs no edit — record that in the return.
  4. **Harness** — `tools/land-test.mjs`: a throwaway repo with a bare remote
     and a `gh` stub; a new lint check file runs it.
  - **Byte budget**: `templates/WORKFLOW.md` net ≤ +700 B; `commands/mission.md`
    net ≤ +250 B.
- **Verify**:
  - `node tools/land-test.mjs` exits 0, covering: two queued PRs are prepared
    one at a time, oldest first, and **never more than one carries
    `aw:ready`** — the second is tested only after the first merged, on a
    default branch containing it (AC-7); **two merges before any stamp** →
    exactly one open follow-up, holding both fragments, one version in both
    pin files, the earlier follow-up closed, no conflict (AC-8); a PR with a
    builder fix is not marked ready until `reviewed` names its resolution
    commit (AC-12); **the PR branch's remote head is
    byte-identical before and after `prepare`** when there is no conflict
    (AC-19); a red combined run returns that PR and the second is still
    prepared (AC-9); a second `lock take` on a held lock is refused; a lock
    with a stale heartbeat is taken over and logged; a holder that lost the
    lock stops before labelling; a tiny clash is unioned and re-tested
    (AC-11); a real clash exits with the brief on stdout and nothing pushed;
    `stamp` on two folded fragments sets one version in both pin files (AC-8).
  - `grep -nE "exec(Sync)?\(|shell: *true" plugins/agentic-workflow/tools/land.mjs`
    prints nothing.
  - `git diff main...HEAD --stat -- plugins/agentic-workflow/hooks` shows no
    change made by this brief (compare with the list before it started).
  - `node tools/lint.mjs` clean — the new command is cross-referenced.
  - `wc -c` within both budgets; `commands/land.md` under 24,000 B.
  - Catalog: not applicable.
- **Read budget**: ≈ 1,050 lines. Split considered (lock + `status` apart
  from `prepare` + `stamp`) and declined: the budget does not force it, and
  the events moved to S6. If `land.mjs` passes 500 lines mid-brief, return
  `deviation` rather than cut cases. Suits: `devops`.

### S6 — burn meter, spend ceiling, the two-mission scenario

- **ACs**: AC-13, AC-14, AC-15, AC-16, AC-18, AC-22, AC-17
- **Suits**: `backend`.
- **Reads** (≈ 900 lines):
  1. `metrics` whole (134) — its checks are this brief's Verify steps.
  2. The ledger handoff line for probe 4 (what a spawn's result exposes) and
     `commands/mission.md` 142–180 (§2 Run: where a spawn returns).
  3. `plugins/agentic-workflow/tools/ledger.mjs` 40–60 and 205–260 (`VERBS`,
     dispatch, how a verb writes).
  4. `plugins/agentic-workflow/hooks/lib/mission-budget.sh` whole (118).
  5. The hook-test group holding the `mission-budget:` cases (≈ 120).
  6. `worktree.mjs`, `write-sets.mjs`, `land.mjs`, `fragments.mjs` — CLI
     sections only (≈ 220 together).
  7. `plugins/agentic-workflow/templates/concurrency.md` whole (≈ 220 by now).
  8. Plugin README 188–212 (tool list) and 244–290 (guardrails), ranged.
  9. `memos` 574–601 (the recommendation and the venture pattern paragraph at 582) and 749–769 (the
     contradiction table, for the AC-22 sweep).
- **Writes**: `plugins/agentic-workflow/tools/burn.mjs` · `plugins/agentic-workflow/tools/ledger.mjs` · `plugins/agentic-workflow/tools/worktree.mjs` · `plugins/agentic-workflow/tools/land.mjs` · `plugins/agentic-workflow/commands/mission.md` · `plugins/agentic-workflow/hooks/lib/mission-budget.sh` · `tools/concurrent-test.mjs` · `tools/ledger-test.mjs` · `tools/land-test.mjs` · `tools/lint.d/` · `tools/hook-test.d/` · `plugins/agentic-workflow/templates/concurrency.md` · `plugins/agentic-workflow/templates/WORKFLOW.md` · `plugins/agentic-workflow/README.md` · `docs/WORKFLOW.md`
- **Catalog**: none.
- **Do**:
  1. **Events** — `ledger.mjs <mission> event <name> key=value…` appends one
     JSON line to `.plans/<mission>.metrics.jsonl` (time in UTC, mission,
     worktree, and the given fields). Names: `worktree.prepare`, `burn`,
     `brief.start`, `brief.end`, `wait`, `queue.update`, `queue.test`,
     `queue.land`, `clash.spawn`, `clash.review`. `worktree.mjs up` and
     `land.mjs` emit theirs through it — edit both here (`prepare`, `stamp`
     and `reviewed` in `land.mjs`). The sidecar is a tracked record file, one
     per mission, written only by its own mission (PD-11).
  2. **`burn.mjs`** —
     - `record <mission> tokens=… model=… concurrent=…` — one `burn` event per
       spawn, from the source probe 4 found (the spawn's result, else the
       transcript's usage figures). Says "unweighted total" when in/out/cache
       are not exposed.
     - **Who calls it in a real run:** the orchestrator, as one step of
       `commands/mission.md` §2 — after every spawn returns (brief,
       corrective, reviewer, clash builder), beside the existing write of
       the ledger: `brief.end` and `burn.mjs record` with the figures probe 4
       located. Add that step as one pointer line. Backstop:
       `mission-budget.sh` prints one line when the active ledger shows
       sessions used above 0 and its sidecar holds no `burn` event — the
       meter is blind, and a blind meter counts as no token source for the
       second-mission refusal below.
     - `rate` — rolling one-hour tokens per mission and combined, reading
       every live worktree's sidecar.
     - `baseline` — the median tokens/hour of single-mission runs; with fewer
       than three it prints how many are missing; with three it prints a
       proposed ceiling for the owner. It never writes §10.
     - `gate` — combined rolling rate while two missions ran ÷ baseline, with
       `concurrent` shown: ≤ 2.2 pass · 2.2–3.0 finding · > 3.0 pause.
  3. **Ceiling** — §10 row **Spend ceiling**: `unset`, or a number with
     `confirmed YYYY-MM-DD` — only a dated owner value counts.
     `worktree.mjs up` refuses a second concurrent mission while the row is
     unset or no token source exists, and says why (LD-2, OQ-10).
     `mission-budget.sh` prints one 🛑 line when the combined rate is above
     the ceiling: new spawns pause and the owner is asked (print-only, like
     the overrun line; no new rule fence).
  4. **`tools/concurrent-test.mjs`** — the scripted scenario of `metrics`
     section 1 in a throwaway repo with a bare remote and `gh`/`psql` stubs:
     missions A and B, each with a changelog fragment and an obligations file;
     B overlapping, then a disjoint variant. A new lint check file runs it.
  5. **Record** — `concurrency.md`: sections "Burn meter and spend ceiling",
     "Events" (the one event table — PD-8), "For ventures" (the pattern
     paragraph, memos 582–590, and what a venture's recipe must supply).
     `templates/WORKFLOW.md`: the §10 **Spend ceiling** row, one line.
     `docs/WORKFLOW.md` §10: `Spend ceiling: unset`. Plugin README: tool list
     and one guardrail line.
  6. **AC-22 sweep** — for each of C6, C7, C8, C9, C11, C14 show the old text
     is gone (a `grep` that prints nothing) and name its new home; list C3,
     C4, C10, C12 as phase 2 and C5, C13 as settled by LD-4 and LD-6.
  - **Byte budget**: `templates/WORKFLOW.md` net ≤ +300 B; `commands/mission.md`
    net ≤ +150 B.
- **Verify** (each line is a `metrics` check):
  - AC-13 (fixture): after the scenario `git worktree list` shows two mission
    worktrees; both branches are merged into the throwaway default branch; no
    commit on either is authored by the stub owner identity and neither PR
    branch moved after it was marked ready; the scenario ran no interactive
    step. The real-run half is a ledger row, not this brief.
  - AC-14: the overlap sentence is printed before any `brief.start` event
    exists for B (compare the two timestamps); the disjoint variant prints
    none.
  - AC-15: the clash is resolved with no owner step; the combined gates exit
    0 before landing; `grep -c '"clash.spawn"'` in the sidecar is exactly 1
    for the real clash and 0 for the tiny one; and (check d, AC-12) the
    real-clash PR is not ready while the sidecar holds no `clash.review`
    event for its resolution commit, and is ready once it does — the tiny
    one needs none.
  - AC-16: `git log --merges` on the throwaway default branch shows no
    conflict resolution touching the pin files, `CHANGELOG.md` or the
    obligations files; neither mission branch's diff changes a version line;
    the version changed exactly once per landing, in the follow-up.
  - AC-18: with the ceiling row `unset`, `up` for a second mission exits
    non-zero naming the ceiling; with it set and confirmed, it proceeds; a
    fixture sidecar above the ceiling makes `mission-budget.sh` print the 🛑
    line; `baseline` with two runs proposes nothing.
  - Producer: `grep -n 'burn.mjs record' plugins/agentic-workflow/commands/mission.md`
    prints the §2 step; the scenario driver follows that step and each
    mission's sidecar then holds one `burn` event per simulated spawn; a
    ledger with sessions used above 0 and no `burn` event makes
    `mission-budget.sh` print the blind-meter line; `land-test` shows
    `queue.test` and `queue.land` events after a `prepare` and a `stamp`.
  - `burn.mjs gate` on a fixture pair at 2.1× prints pass, at 2.5× finding,
    at 3.1× pause.
  - `wc -c plugins/agentic-workflow/templates/WORKFLOW.md` under 120,000 and
    the mission's total growth of it reported.
  - Catalog: not applicable.
- **Read budget**: ≈ 900 lines. Suits: `backend`.

**Checkpoint ckpt-p1** ends phase 1 — a one-shot `reviewer` on **Fable**
(boundary-class: `tools/`, `hooks/` and `templates/` are `security-boundary`
discipline files at reviewer tier `top`, `templates/gate-classes.md:32`), fresh
context (PD-13: the only phase-1 review). S1 is not read line by line: the
reviewer checks out S1's SHA (named in S1's return) in a scratch worktree,
regenerates the baselines from `main`, re-runs S1's Verify there, and compares
the sorted lines of `main:tools/lint.mjs` with the concatenated `tools/lint.d/*`
at that SHA. S2–S6 are read by diff over `<S1 sha>..HEAD`; the reviewer states
`git diff --stat <S1 sha>..HEAD` totals first — if that diff outgrows one pass,
it says so and PD-13's split-review fallback applies. It also confirms legacy ledgers with no `Status:`/`Closed:`
still resolve silent once a blocked ledger is stepped over (plan-judge
advisory). It re-runs every gate and the phase's gates, per the ledger's gate
policy, re-runs `concurrent-test` itself and fires the pre-merge Closing rows before the
verdict. The chronicler then writes `changelog.d/concurrent-missions.md`; the
PR to `main` opens; the owner merges.

## Phase 2 — agent merges what the owner approves (branch: `mission/concurrent-missions-p2`)

**Blocked by the ledger's GATE-P2 row.** This phase does not start until both
conditions of LD-1 hold and the owner records a dated decision. S7 is drawn
against files phase 1 has not written yet: **replan at the gate** — re-measure
every anchor, and take the answers to OQ-2, OQ-4, OQ-7 and OQ-11 as locks.

### S7 — the approval signal, the guard, agent-merge

- **ACs**: AC-7 (its approval half: any order, landed one at a time), AC-10,
  AC-20, AC-21, AC-22 (C1, C3, C4, C10, C12), AC-17
- **Suits**: `security`.
- **Prior art**: `plugins/agentic-workflow/hooks/lib/merge-guard.sh` (the
  records-only branch at 101–175 is the shape to extend),
  `plugins/agentic-workflow/hooks/hooks.json` (the guard entry at 84–93),
  `plugins/agentic-workflow/tools/shell-wrappers.mjs` (command-text parsing).
- **Reads** (≈ 1,300 lines):
  1. `memos` 262–414 (M2 2b: threat model, option A, what the approval binds
     to, the guard change, recommendation, the brief requirement).
     **Superseded:** binding rule (ii) at 355–358 — under LD-4 the merged
     head must equal the approved commit, nothing else passes.
  2. `counsel` whole (55) — its ranked attacks are this brief's test list.
  3. `plugins/agentic-workflow/hooks/lib/merge-guard.sh` whole (176).
  4. `plugins/agentic-workflow/hooks/hooks.json` 84–93.
  5. The hook-test group for the merge guard (was `tools/hook-test.mjs`
     1782–2062, 281 lines).
  6. `plugins/agentic-workflow/tools/land.mjs` whole (≈ 400).
  7. `plugins/agentic-workflow/templates/WORKFLOW.md` 264–270 (the guard's
     hook-table row), 520–540 (who merges; gate policy), 1033 (the Merge
     policy row); `commands/mission.md` 262–274.
  8. `plugins/agentic-workflow/templates/concurrency.md` — "The landing
     queue" section.
- **Writes**: `plugins/agentic-workflow/hooks/lib/merge-guard.sh` · `plugins/agentic-workflow/hooks/hooks.json` · `plugins/agentic-workflow/tools/land.mjs` · `tools/land-test.mjs` · `tools/hook-test.d/` · `tools/lint.d/` · `tools/lint-test.d/` · `plugins/agentic-workflow/commands/land.md` · `plugins/agentic-workflow/commands/mission.md` · `plugins/agentic-workflow/templates/concurrency.md` · `plugins/agentic-workflow/templates/WORKFLOW.md` · `plugins/agentic-workflow/README.md`
- **Catalog**: none.
- **Do**:
  1. **A new §10 Merge policy value**, `agent-may-merge (owner-approved,
     delegated <date>)`, beside the existing ones, and an **Approvers** row.
     Under it the guard allows only: everything the records-only scope
     already demands, plus an approving review by a login in **Approvers**
     whose commit is the PR's current head and equals the pinned head, plus
     the acting login is not an approver, plus a listing of the host's stored
     logins (the command probe 5 proved) shows no approver login, plus the command sets no token variable
     and is not an auth command. Anything else blocks.
  2. **Under every policy**: approve-shaped commands block (the review
     command with an approve flag in any spelling, and the API route that
     posts an approving review); an unexpected 403 from `gh` and a guard that
     cannot finish in its time both block (AC-20). The threat-model sentence
     in `hooks.json` and the guard's header names the grade (C1).
  3. **`land.mjs land`** — reads approvals; order = submission time; the
     approved commit must be the PR head; combined tree on the scratch ref;
     gates; the lock re-checked; then the guarded merge pinned to that commit.
     Nothing is pushed to the PR branch. A PR with no approval prints M11 and
     is skipped. Then `stamp`.
  4. **Text**: C3 and C4 (who merges; the policy values) reworded in their
     homes; C10 and C12 per the owner's answers to OQ-7; the journey
     sentences for approval (M6, M7, M11, M14b) wired.
  - The brief writes **no** §10 value for this repo and creates no identity:
    the Merge policy row, the Approvers row and the identity are the owner's
    (PD-10).
  - **Byte budget**: `templates/WORKFLOW.md` net ≤ +500 B; `commands/mission.md`
    net ≤ 0 B.
- **Verify**:
  - Hook-test group, every case with the `gh` stub: an approved PR at its
    approved head merges; a head one commit past the approval blocks; an
    approval by a login outside **Approvers** blocks; acting login in
    **Approvers** blocks; a stored approver login on the host blocks even
    when the ambient token is the agent's (counsel's test: unset the token
    variable, approve, then the guarded merge — both steps block); each
    approve-shaped spelling blocks, including one that only mentions the
    command inside a quoted string (document the false positive rather than
    weaken the block); a stubbed 403 blocks; a stubbed hang blocks.
  - Every existing merge-guard case still passes unchanged (records-only and
    full delegation behave as before).
  - `land-test`: `land` merges exactly the approved commit; the PR branch's
    remote head never changes; an unapproved PR is skipped with M11 and the
    next one lands.
  - `grep -n 'accident, not an adversarial agent' plugins/agentic-workflow`
    prints nothing.
  - `git diff main...HEAD -- docs/WORKFLOW.md` is empty.
  - `wc -c` within budget. Catalog: not applicable.
- **Read budget**: ≈ 1,300 lines — the largest brief; if the replan finds
  `land.mjs` over 500 lines, split the guard (steps 1–2) from the lander
  (steps 3–4) and ask the owner for the extra session. Suits: `security`.

**Checkpoint ckpt-p2** ends phase 2 — a one-shot `reviewer` on **Fable**
(the merge guard is `security-boundary`, tier `top`), fresh context, over
`main..HEAD`, attacking the guard with counsel's four ranked attacks before
reading the diff. The PR to `main` is the owner's to merge — this mission's
own PRs never use the mode it builds.

---
_Size every brief to its read budget; split any that can't fit and note the
split. Each session's outcome and any deviation lands in
`.plans/concurrent-missions.state.md`, never only in chat._
