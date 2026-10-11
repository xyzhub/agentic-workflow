---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: builder-done-rules — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the expensive
exploration happens once, here. Deploys to `.plans/builder-done-rules.sessions.md`._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/builder-done-rules.md` · Ledger: `.plans/builder-done-rules.state.md`
Source docs: `docs/product/decisions/2026-10-11-builder-done-rules-{brief,memos,metrics,counsel}.md`.
Catalog: none (§10 — markdown plugin, no routes/schema; nothing to regenerate).
`P` = `plugins/agentic-workflow`. Line numbers measured 2026-10-11 at `c12e1c1`.

## Large-files table

| File | Lines |
|---|---|
| `P/templates/WORKFLOW.md` | 1337 |
| `tools/lint.mjs` | 925 |
| `P/commands/mission.md` | 325 |
| `docs/product/decisions/2026-10-11-builder-done-rules-memos.md` | 267 |
| `P/agents/reviewer.md` | 220 |
| `P/commands/tune.md` | 219 |
| `P/commands/settle.md` | 212 |
| `P/commands/autopilot.md` | 203 |
| `P/commands/bootstrap.md` | 169 |
| `P/commands/sync.md` | 165 |
| `P/agents/planner.md` | 154 |
| `P/agents/chronicler.md` | 154 |
| `tools/lint-test.mjs` | 154 |
| `P/agents/designer.md` | 138 |
| `P/templates/mission-state.md` | 131 |
| `P/commands/adopt.md` | 129 |
| `P/commands/doctor.md` | 117 |
| `P/agents/compass.md` | 116 |
| `P/agents/frontend.md` | 110 |
| `P/commands/end.md` | 104 |
| `P/commands/plan.md` | 93 |
| `docs/product/decisions/2026-10-11-builder-done-rules-metrics.md` | 86 |
| `P/commands/next.md` | 78 |
| `P/commands/operate.md` | 77 |
| `docs/product/decisions/2026-10-11-builder-done-rules-brief.md` | 77 |
| `P/agents/backend.md` | 65 |
| `P/templates/mission-plan.md` | 61 |
| `P/templates/decision-memo.md` | 57 |
| `P/templates/mission-sessions.md` | 53 |
| `P/templates/flight-plan.md` | 62 |
| `P/commands/start.md` | 50 |
| `P/commands/audit.md` | 49 |
| `P/commands/check.md` | 41 |
| `P/commands/fix.md` | 26 |
| `docs/product/decisions/2026-10-11-builder-done-rules-counsel.md` | 22 |
| `P/templates/decision-log.md` | 15 |

## Phase 1 — lint budgets, dedup guard, trims, pointer swaps (branch: `mission/builder-done-rules-p1`)

_Not parallel-safe (one brief). Lands first so P2 is budget-linted._

### S1 — budgets + dedup detector + description trims + pointer swaps

- **ACs**: AC-12, AC-13, AC-14, AC-15a (P1 share of AC-15b/c: `mission.md` and `reviewer.md` must not grow).
- **Reads** (≈1,230 lines):
  - `docs/product/decisions/2026-10-11-builder-done-rules-metrics.md` 1-86 whole (baselines, fixtures F0–F5, awk/grep commands).
  - `…-memos.md` §D1 (lines 16-83, detector mechanics + fingerprints) and §D3 (lines 140-201, BUDGETS table).
  - `tools/lint.mjs` 1-58 (header, `fail`, `allMd`, `frontmatter`), 198-224 (`checkSections` — reuse its heading parse for the per-§ table), 358-376 (`checkClockGuard` — how the harness is wired), 601-673 (`checkNextUpAgreement` — backtick-split model), 874-925 (`checkObligationsRegister` comment-strip model, `export { clockLeak }`, entry-point guard + the check list to extend).
  - `tools/lint-test.mjs` 1-154 whole (CASES shape + provenance column + runner).
  - `P/templates/WORKFLOW.md` 260-270 (§3 hooks-table row at 268: overrun mechanics → pointer), 330-345 (§4 at 338), 357-460 (§5 head through the convergence rules: LA-1 at 399-411, LA-5/Fable at 412-434 incl. `boundary_escalation` 426, LA-7 at 438-440 — fence the mechanics core of each with `<!-- rule: <id> -->`; the one-corrective-retry sentence is at 378-380), 1028-1052 (§11 at 1033-1036 and 1049 → pointers), 1104-1108 (§12 table at 1106 — name-only, verify it passes).
  - `P/commands/mission.md` 30-85 (rules 2-7: 38-45 → `rule-copy: overrun-1.5x`; 71-74 → pointer; 76-84 Fable → pointer), 150-185 (157-159, 170-173 → pointers; 176-185 codex Fable paragraph = seeded paraphrase site → pointer), 250-262 (256-257 → pointer).
  - `P/agents/reviewer.md` 1-40 (frontmatter + 19-35 Fable block → pointer `§5 LA-5` keeping `boundary_escalation` one-liner), 70-100 (76-77 → `rule-copy: one-corrective-retry`; 92-94 → pointer), 205-215 (210-212 seeded paraphrase site → pointer).
  - `P/templates/mission-state.md` 1-35 (header prose 15-28 → `rule-copy: overrun-1.5x` + the remaining hook notes).
  - `P/agents/planner.md` 55-58, 83-86, 136-142 (1.5× and `Next up:` mentions — pointer form; keep).
  - `P/commands/autopilot.md` 58-66 (→ pointer), 128-133 (→ pointer); `P/commands/start.md` 36-46; `P/commands/tune.md` 206-212; `P/commands/audit.md` 34-40; `P/templates/flight-plan.md` 20-26 (line 23 "stops at 1.5× for a scope decision — §5 LA-1" matches the fingerprint → pointer).
  - `Next up:` sites (name-only, should pass; confirm): `compass.md:34-38`, `chronicler.md:20-24`, `doctor.md:78-82`, `next.md:15-19`, `operate.md:12-16`, `check.md:17-21`, `end.md:28-32`, `sync.md:15-19, 108-112`, `plan.md:81-85`.
  - All 20 `P/agents/*.md` lines 1-6 (frontmatter; the `description:` line of each). Current chars: curator 673, compass 641, designer 600, advisor 563, chronicler 546, analyst 541, writer 527, intake 525, business 479, planner 465, brainstormer 456, marketing 455, architect 447, security 442, devops 433, researcher 405, reviewer 397, ops 371, backend 362, frontend 359.
  - `P/tools/agents.mjs` 85-95 (`summaryOf` cuts the description at the first `. ` / ` — `; keep the first sentence as the what/when clause).
- **Catalog**: none.
- **Do**:
  1. `tools/lint.mjs`: add `BUDGETS` (D3 numbers, ratchet-down comment) + `checkBudgets()` — byte size per class over `P/agents/*.md`, `P/commands/*.md`, `P/skills/*/SKILL.md`, `P/templates/WORKFLOW.md`; `description:` char length per agent (frontmatter value, trimmed); `warn:` on stderr at ≥90 %, `fail` over 100 % with file/size/ceiling; WORKFLOW warn prints the per-`##` byte table. Export `budgetVerdict(size, ceiling) → 'ok'|'warn'|'fail'` and `descriptionOver(text, cap)`.
  2. `tools/lint.mjs`: add `RULES` (ids + name key + mechanics keys per D1 Option A) and `checkRuleDedup()`: parse the four marked blocks inside §5 (exactly one per id, else fail); scan the four dirs minus hooks/, strip HTML comments + backticked spans, split paragraphs on blank lines and list/table-row starts, fail a paragraph outside the blocks that matches name AND a mechanics key; verify each `<!-- rule-copy: <id> -->…<!-- /rule-copy -->` block equals the §5 block after per-line leading-whitespace strip. Export `ruleRestatement(paragraph, rule) → boolean` and `splitParagraphs(text)`.
  3. `tools/lint-test.mjs`: add `BUDGET_CASES` (F1 401 → fail, F1b 400 → pass, F3 ceiling+1 → fail, F4 91 % → warn, F5 100 % → pass) and `RULE_CASES` (F2 the §5 LA-1 mechanics as prose → fail; F2b `"the overrun STOP applies (§5 LA-1)"` → pass; the pre-swap text of `reviewer.md:210-212` and `mission.md:176-179` → fail; a backticked mention → pass; a hooks/-style message → skipped by scope, not by detector). Rename the summary line to `lint-test: clean (N cases)`. F0 = `node tools/lint.mjs` on the tree exit 0 with zero `warn:` lines (asserted by the Verify step, not the harness).
  4. `P/templates/WORKFLOW.md`: fence the four §5 blocks; pointer-swap 268, 338, 1033-1036, 1049; add the AC-13 sentence ("guard covers the plugin tree only, not venture `docs/WORKFLOW.md` copies") beside the LA-7 bullet or in §9.
  5. Pointer swaps + the three `rule-copy` blocks per the Reads list (mission.md, reviewer.md, mission-state.md, planner.md, autopilot.md, start.md, tune.md, audit.md, flight-plan.md:23). A pointer is one line: name + `(§5 LA-n)`.
  6. Trim all 20 `description:` fields to ≤400 chars: keep sentence 1 (what + when to use), move boundary/negative text into a `## Scope` or existing body section. Target total < 8,000.
  7. Register `checkBudgets` and `checkRuleDedup` in the entry-point check list.
- **Verify**: `node tools/lint.mjs` exit 0, output `lint: clean`, zero `warn:` lines (F0) · `node tools/lint-test.mjs` exit 0 and the case count rose from 69 · `node tools/agents-test.mjs` exit 0 · metrics awk: description total < 8,000 and 0 files > 400 · `wc -c P/commands/mission.md P/agents/reviewer.md` both below 21,336 / 14,308 · the four restatement greps from the metrics plan re-run and the counts recorded in the handoff (before: 6/5/3/13) · record before/after numbers in the ledger handoff (AC-15d feed). Catalog: none to regenerate.
- **Read budget**: ≈1,230 lines (≤ ~1,500). Suits: `devops`.

**Checkpoint p1** (Fable, owner-decided) ends phase 1 — the independent `reviewer` re-runs `node tools/lint.mjs` + `node tools/lint-test.mjs` + `node tools/agents-test.mjs`, diff-reviews `main..mission/builder-done-rules-p1`, and verifies per AC: AC-12 (every file in the metrics greps is a pointer or a `rule-copy`), AC-13 (markers present; F2 fails, F2b passes; the two seeded sites are cases), AC-14 (BUDGETS table + comment; F1/F3/F4/F5), AC-15a (awk < 8,000). It also samples three trimmed descriptions for routing intent. Then per §10 Staging (lint on branch + `claude --plugin-dir` load) → PR to `main`.

## Phase 2 — done-rules, AC/value-sourcing, Assumed, Test policy, /fix loop (branch: `mission/builder-done-rules-p2`, cut from the P1 head)

_Not parallel-safe (one brief). P1's budgets bind on every edit here._

### S2 — builder done-rules + trio templates + judge + Assumed/settle + Test policy + /fix

- **ACs**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-15b, AC-15c, AC-15d.
- **Reads** (≈1,400 lines; P1 will have shifted line numbers slightly — anchors are the stable form):
  - `docs/product/decisions/2026-10-11-builder-done-rules-brief.md` 1-77 whole (AC wording + Locked decisions). `…-counsel.md` 1-22 whole. `…-memos.md` §D2 (lines 86-137) and §D4 (lines 204-263).
  - `.plans/builder-done-rules.md` §"Value sourcing" and the OQ-1 locked decision (codex `deviation:` prefix).
  - `P/agents/backend.md` 1-65 whole (anchors: "Migrations: additive-only" ~33; "## Verify, then hand off" ~47; "log any deviation" ~50). `P/agents/frontend.md` 1-20 and 90-110 (anchor "log any deviation" ~105).
  - `P/commands/mission.md` 20-50 (rules; after P1 the `rule-copy` sits ~38), 125-185 (§2 run loop: step 3 one-corrective pointer ~157; "Codex runs" paragraph ~166-174 with `0 done · 3 blocked · 1 failed`), 240-275 (checkpoint verdict routing).
  - `P/agents/reviewer.md` whole after P1 (~205 lines): anchors "## Model tier" (P1 pointer), "## Lenses" UX paragraph with the impeccable text (pre-P1 108-129 → trim to one `§0.2` pointer), "**QA**" (~153), "## Output" (~162), "## Plan-judge mode" (~191-end).
  - `P/agents/planner.md` 1-154 whole (anchors: "## Write the trio" ~22; master-plan paragraph ~33-36; "Classify every Closing row" ~60).
  - `P/templates/mission-plan.md` 1-61 whole; `P/templates/mission-sessions.md` 1-53 whole; `P/templates/mission-state.md` 1-50 (header + `## Open questions`); `P/templates/decision-memo.md` 1-57 whole; `P/templates/decision-log.md` 1-15 whole.
  - `P/templates/WORKFLOW.md` 568-600 (§6 Roles table + "Specialist implementers" paragraph ~578-585 — the AC-5 "done means" line goes right after it), 847-856 (§7 DONE line — add a cross-ref to the §6 line, do not restate), 949-980 (§10 table — insert the **Test policy** row after **Typecheck/lint gate**).
  - `P/commands/settle.md` 1-45 (§1-2 probe loop) and 157-195 (§4 write-back, §5 close gate — step 2b "Assumed probe" goes after §2's bullets; its hits join the surface list in §4).
  - `P/commands/fix.md` 1-26 whole.
  - `P/commands/adopt.md` 10-35 (§10 fill, "Merge policy row stays" ~22); `P/commands/bootstrap.md` 20-70 (the §10 row-discovery bullets — add **Test policy** after **Typecheck/lint gate**/`Test gate`: `configured` when a test command exists, `none-yet` when none, `none-by-design` only from an explicit human answer).
  - `docs/WORKFLOW.md` 932-958 (this repo's §10 — add `| **Test policy** | configured — tools/lint.mjs + tools/lint-test.mjs (added 2026-10-11) |`; feeds the pre-merge "docs/record synced" row).
- **Catalog**: none.
- **Do**:
  1. AC-1..AC-4 — in `backend.md` and `frontend.md`, replace the "log any deviation from the brief in the ledger" bullet with a `## Done means` block (frontend: the same four rules, UI-phrased for AC-2/AC-3: old component removed and unreferenced; rollout shared primitive → screen by screen). AC-4 text: "a needed deviation from a dated locked decision → stop before coding and return hand-off status `deviation` naming the decision, the conflict, and the smallest alternative; never build then log; under the codex adapter, report `blocked` with `blocked_reason: deviation: …` (the distillate enum has no `deviation` value)". Keep the bounded hand-off bullet.
  2. `mission.md` §2 step 3: add the `deviation` route — "status `deviation` → surface to the owner directly (AskUserQuestion / §12), no corrective retry, no `Sessions used:` increment; the owner's 'build anyway' lands as an `Assumed` locked decision (AC-9) and the brief resumes". Codex paragraph (~166-174): one sentence — a `blocked` whose `blocked_reason` starts `deviation:` takes the same route (owner directly, no retry), per the 2026-10-11 locked decision.
  3. AC-5 — `templates/WORKFLOW.md` §6: one line after the specialist-implementers paragraph: "**Done means** (AC-1..AC-4, `agents/backend.md` / `agents/frontend.md`): migration applied + schema confirmed live by query · superseded code removed and unreferenced · rollout sequenced primitive → sites → gate once · a deviation from a dated decision stops before coding." §7 DONE line gets `(§6 done-means)` appended, no restatement.
  4. AC-6 — `mission-plan.md`: Tasks template numbers criteria `AC-N` with a one-line rule ("ids are stable for the mission's life; briefs and verdicts cite them"); `mission-sessions.md` brief template gains `- **ACs**: AC-n, AC-m` as the first field; `reviewer.md` Output gains "**Per-AC verdict**: one line per AC id the briefs cite, `AC-n: pass|fail — evidence`, plus `uncovered: none | AC-k …`".
  5. AC-7 — `mission-plan.md` gains `## Value sourcing` (D2 columns, the five source kinds, the derivation rule, the literal `none — no values produced` row) directly under `## Tasks`; `decision-memo.md` gains `**Values this decision settles:**` bullet under `## Recommendation`; `planner.md` "Write the trio" paragraph requires AC ids, the table, and per-brief `ACs:` lines (one paragraph, pointer to the template for columns).
  6. AC-8 — `reviewer.md` plan-judge checklist: two items — "every AC id is cited by ≥1 brief (uncovered → REVISE)" and "every value a brief's Do produces has a `## Value sourcing` row (missing → REVISE); an empty cell / wrong kind / `derivation` without file:line is a named fix inside the one REVISE, never a second REVISE; `open question` rows are routed, not REVISEd".
  7. AC-9 — `decision-log.md`: add `Status` column (`decided` · `Assumed — owes <decision>; built on <assumption>; authorized by <who> <date>` · `ratified <date>`); `mission-plan.md` Locked decisions prose allows `Assumed <date> — …` bullets in the same shape; `mission-state.md` `## Open questions` prose: "an `Assumed` decision is mirrored here as one line `Assumed <date> → <home>`"; `settle.md` step 2b: grep `.plans/*.md` Locked decisions + `docs/product/decision-log.md` for `Assumed` lacking a later `ratified` → surface list, never a blocker, never fired by the agent.
  8. AC-10 — `templates/WORKFLOW.md` §10 **Test policy** row (`configured` · `none-by-design` · `none-yet`, with the one-line meaning of each); `reviewer.md` QA lens: read the row first — `none-by-design` → no missing-test findings; `none-yet` → exactly one note; `configured`/absent → coverage findings as today; `adopt.md` + `bootstrap.md` seed the row (bootstrap bullet per Reads; adopt: "add if absent, default `none-yet` unless a test gate exists → `configured`"); `docs/WORKFLOW.md` §10 row for this repo = `configured`.
  9. AC-11 — `fix.md` step 2 becomes the root-cause loop (six beats, one line each) and step 3 adds "regression test first red, then green".
  10. AC-15c — `reviewer.md` UX lens: replace the impeccable paragraph (pre-P1 108-129) with "When impeccable is present (§0.2 probe + stage map), apply its rules under this lens, run its detector once here, classify blocking/advisory; fail-open." (≤ 3 lines).
  11. Bump `P/.claude-plugin/plugin.json` → `1.55.0`; CHANGELOG `## [1.55.0] — <date>` entry (both phases); mirror the §5 markers / §6 line / §10 row into `docs/WORKFLOW.md` (pre-merge Closing rows).
- **Verify**: `node tools/lint.mjs` exit 0 with zero `warn:` lines (P1 budgets binding) · `node tools/lint-test.mjs` exit 0 · `wc -c P/agents/reviewer.md` < 14,308 and `P/commands/mission.md` < 21,336 · grep proofs: `grep -n 'confirmed live by query' P/agents/backend.md P/agents/frontend.md` (AC-1) · `grep -n 'unreferenced' …` (AC-2) · `grep -n 'migrated vs pending' …` (AC-3) · `grep -n '`deviation`' P/agents/backend.md P/agents/frontend.md P/commands/mission.md` (AC-4, ≥3 hits) · `grep -n 'Done means' P/templates/WORKFLOW.md` (AC-5) · `grep -n 'AC-N\|ACs' P/templates/mission-plan.md P/templates/mission-sessions.md` + `grep -n 'Per-AC verdict' P/agents/reviewer.md` (AC-6) · `grep -n 'Value sourcing' P/templates/mission-plan.md P/agents/planner.md` + `grep -n 'Values this decision settles' P/templates/decision-memo.md` (AC-7) · `grep -n 'REVISE' P/agents/reviewer.md` shows the two new items (AC-8) · `grep -n 'Assumed' P/templates/decision-log.md P/templates/mission-plan.md P/templates/mission-state.md P/commands/settle.md` (AC-9, 4 files) · `grep -n 'Test policy' P/templates/WORKFLOW.md P/agents/reviewer.md P/commands/adopt.md P/commands/bootstrap.md docs/WORKFLOW.md` (AC-10, 5 files) · `grep -n 'hypothesis\|sibling' P/commands/fix.md` (AC-11) · the four before/after numbers (description total, files > 400, mission.md B, reviewer.md B) written to the ledger handoff and the PR body (AC-15d). Catalog: none to regenerate.
- **Read budget**: ≈1,400 lines (≤ ~1,500). Suits: `backend`. **Split point if S2 overruns**: AC-9/AC-10/AC-11 (settle, Test policy, /fix) are separable from AC-1..AC-8 and move to an `S2b` under a §5 LA-1 scope decision.

**Checkpoint p2** (Fable, owner-decided) ends phase 2 — the independent `reviewer` re-runs the three harnesses, diff-reviews `mission/builder-done-rules-p1..mission/builder-done-rules-p2`, and returns the **per-AC verdict** for AC-1..AC-15 (this trio dogfoods AC-6), confirms `wc -c` on `reviewer.md`/`mission.md`, checks the PR body carries the four numbers (AC-15d), and confirms every pre-merge Closing row in the ledger is fired. Then per §10 Staging → PR to `main`; the human merges.

---
_Size every brief to its read budget; split any that can't fit and note the
split. Each session's outcome and any deviation lands in
`.plans/builder-done-rules.state.md`, never only in chat._
