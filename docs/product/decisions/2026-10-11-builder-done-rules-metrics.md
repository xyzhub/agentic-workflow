# Metrics plan — builder-done-rules (2026-10-11)

Baseline pulled 2026-10-11 at commit `c12e1c1`, repo root. Markdown plugin: no runtime events, so the "events" are file measurements. Classification: **measured** unless stated. P=`plugins/agentic-workflow`.

## Baselines (measured now)

| Metric | Command | Baseline |
|---|---|---|
| Agent description chars, total (20 files) | `awk '/^description:/{sub(/^description: */,"");n+=length($0)} END{print n}' P/agents/*.md` | **9,687** |
| Per file, descending | same awk per file, `exit` after first match | curator 673, compass 641, designer 600, advisor 563, chronicler 546, analyst 541, writer 527, intake 525, business 479, planner 465, brainstormer 456, marketing 455, architect 447, security 442, devops 433, researcher 405, reviewer 397, ops 371, backend 362, frontend 359 |
| Files over the 400 cap | count of per-file values > 400 | **17 of 20** (only reviewer, ops, backend, frontend fit; researcher 405 is over) |
| Bytes | `wc -c P/commands/mission.md P/agents/reviewer.md P/agents/planner.md P/templates/WORKFLOW.md` | mission 21,336 · reviewer 14,308 · planner 8,797 · WORKFLOW 105,878 |
| Lint exit | `node tools/lint.mjs; echo $?` | **0** ("lint: clean") |
| Lint size | `grep -c 'fail(' tools/lint.mjs` / `grep -cE '^function check' tools/lint.mjs` | 73 `fail(` sites; 25 `check*` functions (29 functions total) |
| Lint self-test | `node tools/lint-test.mjs; echo $?` | 0 (no budget or dedup fixtures exist yet) |

### Rule-restatement counts

Scope per owner ask: `grep -rlE '<pat>' P/agents P/commands P/templates/WORKFLOW.md`.

| Rule / pattern | Files | Count |
|---|---|---|
| `1.5×` | agents/reviewer, agents/planner, commands/mission, commands/autopilot, commands/start, templates/WORKFLOW | 6 |
| `one-corrective-retry\|one corrective` | commands/tune, commands/mission, commands/audit, commands/autopilot, templates/WORKFLOW | 5 |
| `Fable.*required\|Fable is required` | agents/reviewer, commands/mission, templates/WORKFLOW | 3 |
| `Next up:` | agents/compass, agents/chronicler, agents/planner, commands/operate, mission, doctor, next, check, sync, plan, start, end, templates/WORKFLOW | 13 |

Discrepancy with the brief (reported, not averaged): the brief says 8 files for 1.5× and 17 for `Next up:`. Whole-plugin scope (`grep -rlE ... P`) gives 11 and 20 (includes skills, hooks, other templates). The brief's numbers match neither scope. Use the scoped counts above as the AC-12 baseline; a whole-plugin recount is the cheap second reading. The brief's 5 and 3 for the other two rules match.

## Done thresholds

| Success definition | Measurement | Baseline | Done = |
|---|---|---|---|
| AC-15a description total | awk above | 9,687 | **< 8,000** (cut >= 1,688) |
| AC-14 per-description cap | per-file awk | 17 files > 400 | **0 files > 400**; lint enforces it |
| AC-15b mission.md smaller | `wc -c P/commands/mission.md` | 21,336 | **< 21,336** (strictly smaller) |
| AC-15c reviewer.md smaller | `wc -c P/agents/reviewer.md` | 14,308 | **< 14,308**, despite AC-6/8/10 additions (net of pointer swaps) |
| AC-15d numbers in PR | PR body | n/a | PR body lists before/after for the four rows above; missing = not done |
| AC-12 dedup, scoped | the four greps above | 6 / 5 / 3 / 13 | each rule: prose in WORKFLOW §5 only; other files hold a one-line pointer. Target file counts are **unmeasured until D1 picks the detector**; the lint guard (AC-13) is the pass signal, not a raw grep count (pointers may still contain the token) |
| Success 1: lint green on current tree | `node tools/lint.mjs; echo $?` | 0 | **0** after the change |
| Success 1: lint red on seeded violations | fixture test (a) | no fixtures | each seeded fixture exits **1** |
| Success 2: fresh trio | test (b) | n/a | all (b) greps pass |
| AC-14 budget ceilings | read the ceilings table in lint.mjs | none (no byte budget exists) | one table, "only ratchet down" comment; ceilings for WORKFLOW/mission/reviewer set at or below current size (D3 sets numbers; unmeasured) |

## Acceptance test (a): lint fixtures

Home: `tools/lint-test.mjs` (existing harness, currently 0 exit). Each case builds a temp plugin tree from the real one plus one seeded violation, runs `node tools/lint.mjs` against it, and asserts.

| # | Seeded violation | Expected exit | Expected output |
|---|---|---|---|
| F0 | none (current tree) | 0 | "lint: clean", no warnings |
| F1 | agent `description:` of 401 chars | 1 | names the file and 401 vs 400 |
| F1b | description of exactly 400 chars | 0 | control: boundary passes |
| F2 | a canonical §5 paragraph (e.g. the 1.5x overrun stop) pasted as prose into `commands/mission.md` | 1 | names rule and the offending file |
| F2b | same rule as a one-line pointer to §5 | 0 | control: pointer passes |
| F3 | any budgeted file 1 byte over its ceiling | 1 | names file, size, ceiling |
| F4 | budgeted file at 91 % of ceiling | 0 | warning line printed (90 % warn) |
| F5 | budgeted file at exactly 100 % | 0 | control: fail only over 100 % |

Pass = all 8 cases behave as listed and `node tools/lint-test.mjs` exits 0.

## Acceptance test (b): fresh planner trio

Run a new planner on any small feature (not a closed trio), then judge with the Fable plan-judge. `TRIO` = the new `.plans/<slug>/` directory files plus the judge output saved to `JUDGE`.

```
grep -cE '\bAC-[0-9]+\b' TRIO/*plan*.md                       # >= 2 distinct ids
grep -hoE '\bAC-[0-9]+\b' TRIO/*sessions*.md | sort -u        # every session brief cites >= 1 id
grep -ciE 'value[- ]sourcing' TRIO/*plan*.md                  # >= 1 heading
grep -E '^\|.*\|.*(input|column|derivation|decision)' TRIO/*plan*.md   # >= 1 table row
grep -hoE '\bAC-[0-9]+\b' JUDGE | sort -u                     # verdict cites ids
```

Pass conditions:
1. Distinct AC ids in the plan >= 2; every id appears in at least one session brief (diff of the two sorted sets is empty).
2. A value-sourcing table with >= 1 row, each row's source column non-empty.
3. The judge verdict cites >= 1 AC id per criterion, as pass/fail, and states "no uncovered ids" or lists them.
4. Negative control: delete one session's AC citation and one table row, re-run the judge; it must return REVISE (AC-8). Without this, a green run only proves presence, not enforcement.

Caveat: this is n=1 on LLM output; a pass is evidence, not proof. Record planner and judge model and date with the result.

## Unmeasured

- Budget ceilings per class (D3): unmeasured until the architect memo; do not pre-fill.
- Post-change numbers: all "done" columns are targets, none are results.
- Whole-plugin vs scoped restatement counts: both given; brief's 8 and 17 unreproduced.
