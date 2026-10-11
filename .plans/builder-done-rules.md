---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: builder-done-rules — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide. Deploys to `.plans/builder-done-rules.md`._

Converted from `docs/product/decisions/2026-10-11-builder-done-rules-brief.md`
(+ `-memos.md`, `-metrics.md`, `-counsel.md`), 2026-10-11. Every decision in the
brief's **Locked decisions** block arrives locked; this plan adds only tactical
refinements (marked `planner`) and one open question found during exploration.

Goal: builders stop calling half-landed work "done", plans carry stable `AC-N`
ids and a value-sourcing table the plan-judge enforces, the four §5
convergence rules have one prose home guarded by lint, and prompt size is
budgeted — all in the plugin tree, shipped as v1.55.0.

Estimate: 4 sessions — `phases` mode, owner-decided 2026-10-11: 2 briefs + 2
Fable checkpoints. Per phase: P1 = 1 brief (lint budgets + dedup guard +
description trims + pointer swaps) + 1 checkpoint; P2 = 1 brief (done-rules,
AC/value-sourcing templates + plan-judge, Assumed + settle, Test policy, `/fix`
loop) + 1 checkpoint. No corrective is pre-booked.

## Tasks

_Acceptance criteria reuse the brief's stable ids `AC-1..AC-15` (AC-6: this
trio dogfoods them). Full wording: the brief, §"Acceptance criteria" and
§"Locked decisions"; the condensed form here is what the reviewer checks._
`P` = `plugins/agentic-workflow`.

**Phase 1 — lint budgets, dedup guard, trims, pointer swaps (branch `mission/builder-done-rules-p1`)**

1. **Byte + description budgets in `tools/lint.mjs`** — AC-14: one `BUDGETS`
   object (agents 16,000 B · commands 24,000 B · `skills/*/SKILL.md` 6,000 B ·
   agent `description:` 400 chars · `templates/WORKFLOW.md` 120,000 B
   whole-file) with the comment "ceilings only ratchet down; raising one is a
   dated locked decision in the PR body"; warn at 90 % (stderr `warn:` line,
   exit unchanged; WORKFLOW warn also prints the per-`##` byte table), fail over
   100 % naming file, size, ceiling. Acceptance: `node tools/lint.mjs` exit 0 on
   the tree after the trims; fixtures F1/F1b/F3/F4/F5 (metrics plan, test (a))
   pass in `tools/lint-test.mjs`.
2. **Rule markers + dedup detector** — AC-12/AC-13: `templates/WORKFLOW.md` §5
   fences four canonical blocks `<!-- rule: overrun-1.5x -->`,
   `<!-- rule: one-corrective-retry -->`, `<!-- rule: fable-boundary -->` (incl.
   `boundary_escalation`), `<!-- rule: one-next-up -->` … `<!-- /rule -->`; lint
   asserts exactly one block per id inside §5; outside the blocks, over
   `agents/ commands/ skills/ templates/` (hooks/ excluded, HTML comments and
   backticked spans stripped, paragraphs split on blank lines AND list/table-row
   starts), a paragraph matching a rule's name key AND one of its mechanics keys
   is a finding; three `<!-- rule-copy: <id> -->` blocks (`commands/mission.md`
   overrun-1.5x · `templates/mission-state.md` overrun-1.5x header ·
   `agents/reviewer.md` one-corrective-retry) are diffed against the §5 block
   text (leading whitespace per line normalized, otherwise exact) and pass; the
   detector is an exported pure function; the harness proves F2 (seeded prose →
   fail), F2b (pointer → pass), and the two live paraphrase sites
   (`reviewer.md:210-212`, `mission.md:176-179`, pre-swap text) as fail cases.
   AC-13 text states the guard covers the plugin tree only, never venture
   `docs/WORKFLOW.md` copies. Acceptance: every other restating file in the
   metrics plan's four greps holds a one-line pointer (`§5 LA-1` etc.) and the
   tree is green.
3. **Description trims (20 agents)** — AC-14/AC-15a: every `P/agents/*.md`
   `description:` ≤ 400 chars, first sentence kept as the "what/when" clause
   (`tools/agents.mjs summaryOf` cuts at the first `. `/` — ` for the `/tune`
   table), boundary text moved into the body; total < 8,000 chars (from 9,687).
   Acceptance: the awk in the metrics plan prints < 8,000 and 0 files > 400;
   `node tools/agents-test.mjs` stays green.
4. **Measured shrink** — AC-15b/c (P1 share): `P/commands/mission.md` < 21,336 B
   and `P/agents/reviewer.md` < 14,308 B after the pointer swaps; both numbers
   recorded in the ledger handoff. (P2 must keep them under; see task 8.)

**Phase 2 — done-rules, AC/value-sourcing, Assumed, Test policy, /fix loop (branch `mission/builder-done-rules-p2`)**

5. **Builder done-rules** — AC-1..AC-4 in `P/agents/backend.md` and
   `P/agents/frontend.md`, REPLACING the "log any deviation from the brief in
   the ledger" bullet (`backend.md:50`, `frontend.md:105`): AC-1 data-layer done
   = migration applied in the §10-named datastore for the slice and the schema
   confirmed live by query (staging-coordinated projects: the staging apply is a
   pre-merge Closing row); AC-2 superseded CODE removed in the same change and
   proven unreferenced (schema stays additive-only); AC-3 rollout sequence
   (shared primitive → site by site → gate once → old code removed only when
   every site landed; a mid-rollout stop reports migrated vs pending paths and
   is resumable — the legitimate exception to AC-2); AC-4 a needed deviation
   from a dated locked decision is stop-and-surface BEFORE coding, returned as
   the `deviation` hand-off status; `P/commands/mission.md` routes `deviation`
   to the owner directly, no corrective retry; the owner's "build anyway" lands
   as an `Assumed` entry (AC-9). AC-5: `templates/WORKFLOW.md` §6 gains one
   "done means" line citing AC-1..AC-4 (the reviewer's protocol anchor).
   Acceptance: `grep -n` proofs per AC listed in the S2 brief.
6. **AC ids + value sourcing in the trio** — AC-6: `templates/mission-plan.md`
   numbers criteria `AC-N`; `templates/mission-sessions.md` briefs carry an
   `ACs:` line; `P/agents/reviewer.md` verdict format lists pass/fail per cited
   id and flags any id no brief covers. AC-7: `mission-plan.md` gains
   `## Value sourcing` (AC · Value · Source kind {input, column, derivation,
   locked decision, open question} · Where; a `derivation` cites file:line or an
   issue comment, else `open question`; literal `none — no values produced` row
   valid); `templates/decision-memo.md` gains "Values this decision settles:"
   bullet; `P/agents/planner.md` requires both. AC-8: plan-judge mode REVISEs
   only on a substantive miss (a brief's Do produces a value no row names; an AC
   no brief cites); cell defects are named fixes inside the one REVISE.
7. **Assumed status + settle probe · Test policy row · /fix loop** — AC-9:
   `templates/decision-log.md` gains a Status column (`decided` · `Assumed —
   owes <decision>; built on <assumption>; authorized by <who> <date>` ·
   `ratified <date>`); the same shape is allowed as a `## Locked decisions`

- 2026-10-11 — **Done-rule labels (owner, at checkpoint p2)**: venture-facing labels are `done-rule 1–4`, not `AC-1..AC-4`; the AC cross-reference lives only in this mission's brief and CHANGELOG. Reason: a venture's own AC-1 would collide in reviewer verdicts and its docs/WORKFLOW.md would cite undefined ids.
- 2026-10-11 — **Release per phase (owner, at checkpoint p1)**: Phase 1 ships as v1.55.0 (own CHANGELOG entry, docs/WORKFLOW.md §5 mirror in the same diff, PR mergeable alone); Phase 2 ships as v1.56.0. Supersedes the planner refinement "1.55.0 covering both phases". Reason: merging to `main` IS the release (§10); a P1 merge at 1.54.0 would be an unversioned release.
   bullet (`Assumed <date> —`); `P/commands/settle.md` step 2b greps both homes
   for `Assumed` without a later `ratified` → surface list, never a blocker;
   the ledger `## Open questions` carries a one-line pointer. AC-10: §10 gains
   **Test policy** (`configured` · `none-by-design` · `none-yet`);
   `reviewer.md` reads it (`none-by-design` → no missing-test findings;
   `none-yet` → one note; `configured` → coverage findings); `adopt.md` and
   `bootstrap.md` seed the row. AC-11: `P/commands/fix.md` carries the
   root-cause loop (deterministic repro → one falsifiable hypothesis at a time,
   discard refuted changes → fix cause not symptom → regression test → sibling
   hunt → "bad decision → say so, route to the architect").
8. **Budgets bind + numbers in the PR** — AC-15c: `reviewer.md` ends < 14,308 B
   via the named trim (`reviewer.md:108-129` impeccable paragraph → one pointer
   to §0.2); AC-15b: `mission.md` ends < 21,336 B; AC-15d: the PR body lists
   before/after for description total, files > 400, `mission.md` bytes,
   `reviewer.md` bytes. Acceptance: `wc -c` on the branch; lint green with P1's
   budgets binding; PR body carries the four rows.

## Value sourcing

_Markdown mission: no runtime value is produced or displayed. The only
"values" are lint constants and measured targets; each is sourced below (the
literal `none — no values produced` row is valid only when a table is otherwise
empty — not here)._

| AC | Value | Source kind | Where |
|---|---|---|---|
| AC-14 | ceilings: agents 16,000 B · commands 24,000 B · skills 6,000 B · description 400 chars · WORKFLOW 120,000 B · warn 90 % | locked decision | 2026-10-11 D3 → `docs/product/decisions/2026-10-11-builder-done-rules-memos.md` §D3 |
| AC-13 | rule ids `overrun-1.5x` · `one-corrective-retry` · `fable-boundary` · `one-next-up` | locked decision | 2026-10-11 D1 → memos.md §D1 Option A |
| AC-12 | the three `rule-copy` sites (`mission.md`, `mission-state.md`, `reviewer.md`) | locked decision | 2026-10-11 brief "D1 dedup" |
| AC-15 | targets: description total < 8,000 chars; `mission.md` < 21,336 B; `reviewer.md` < 14,308 B; 0 files > 400 | derivation | `docs/product/decisions/2026-10-11-builder-done-rules-metrics.md:30-37` ("Done thresholds"; baselines measured at `c12e1c1`) |
| AC-10 | Test policy enum `configured` · `none-by-design` · `none-yet` | locked decision | 2026-10-11 brief AC-10 |
| AC-9 | Assumed entry fields (owes · built on · authorized by · date) | locked decision | 2026-10-11 D4 → memos.md §D4 Option A |

## Locked decisions

_Owner, 2026-10-11, after counsel — copied from the brief; never re-litigated.
Entries marked `planner` are tactical refinements inside those decisions._

- 2026-10-11 — **Shape**: `phases`, 2 phases, `Estimate: 4` (2 briefs + 2 Fable checkpoints). P1 = lint budgets (AC-14/15) + dedup guard (AC-12/13) + description trims + pointer swaps; lands first so P2 is budget-linted. P2 = AC-1..AC-11. Gate policy: human-merge.
- 2026-10-11 — **D1 dedup**: pointers everywhere EXCEPT three byte-identical `<!-- rule-copy: <id> -->` blocks at actor sites (`commands/mission.md` 1.5× stop · `templates/mission-state.md` ledger header · `agents/reviewer.md` one-corrective-retry), diffed against §5 by lint. Detector keys on two mechanics tokens (word-bounded), splits on blank lines AND list/table-row starts, strips HTML comments + backticks, excludes `hooks/`. Seeded fixtures include `reviewer.md:210-212` and `mission.md:176-179`. AC-13 states the guard covers the plugin tree only.
- 2026-10-11 — **Deviation status**: a builder that must deviate from a dated locked decision returns a distinct `deviation` hand-off status (not `blocked`); `commands/mission.md` routes it to the owner directly, no corrective retry. REPLACES "log any deviation in the ledger" at `backend.md:50` / `frontend.md:105`.
- 2026-10-11 — **AC-1 wording**: "applied in the datastore the §10 profile names for the slice and the schema confirmed live by query; where the project coordinates staging migrations (no local DB), the staging apply is a pre-merge Closing row". **AC-2** scoped to code (schema additive-only per `reviewer.md:159`, `backend.md:33`) and reconciled with AC-3's legitimate mid-rollout stop.
- 2026-10-11 — **D2 value sourcing**: table in the master plan only (`## Value sourcing`: AC · Value · Source kind {input, column, derivation, locked decision, open question} · Where); decision-memo gains "Values this decision settles:". A `derivation` row cites file:line or an issue comment, else `open question` (routed, never a REVISE). Literal `none — no values produced` row valid. Plan-judge REVISEs only on a substantive miss; cell defects are named fixes inside the one REVISE.
- 2026-10-11 — **D3 budgets**: agents 16,000 B · commands 24,000 B · `skills/*/SKILL.md` 6,000 B · `description:` 400 chars · `templates/WORKFLOW.md` 120,000 B whole-file (per-§ table printed on warn) · warn 90 % · one BUDGETS object, ratchet-down comment.
- 2026-10-11 — **D4 Assumed**: a Status value on the dated decision entry wherever the mission's locked decisions live (master plan; `decision-log.md` under autopilot); `/settle` probes and surfaces, never blocks; no new ledger glyph, no owner-channel notice.
- 2026-10-11 — **Acceptance test (b)**: no synthetic planner run. This trio is the fresh trio (AC ids + sourcing table; its plan-judge verdict cites ids). Negative control → a post-merge Closing row (promotes to the register at settle). **AC-15c** holds (< 14,308 B) via the named trim `reviewer.md:108-129` → pointer to §0.2.
- 2026-10-11 — **Priority**: top of backlog — this IS the next mission.
- 2026-10-11 (owner, answering OQ-1) — **Codex `deviation` route**: the distillate enum stays `done|blocked|failed`; a codex builder reports `blocked` with `blocked_reason` prefixed `deviation: …`, and `commands/mission.md` routes that prefix exactly like a Claude `deviation` return (owner directly, no corrective retry). No change to `distillate.schema.json`, `run-codex.mjs` or its harness; `backend.md`/`frontend.md` done-rules state the codex form in one sentence (the adapter loads them as the codex role prompt, `run-codex.mjs:112-116,254`).
- 2026-10-11 (planner) — **Fixture mechanics**: `tools/lint.mjs` resolves `ROOT` from `import.meta.url` and spawns five sub-harnesses, so "a temp plugin tree" per case would mean copying the whole repo. Instead, in the house pattern (`clockLeak` → `CASES`), the detector and the budget verdict are exported pure functions (`ruleRestatement(text, rules)`, `budgetVerdict(size, ceiling)` / `descriptionOver(text)`) and F1–F5 drive them directly with provenance-labelled cases; F0 is the real `node tools/lint.mjs` run. Same semantics as metrics test (a), no tree copies.
- 2026-10-11 (planner) — **rule-copy comparison**: the marked §5 region is the mechanics core of each rule (not the whole LA bullet with its incident); the copy is compared after stripping leading whitespace per line (list indentation differs by host file), otherwise exact.
- 2026-10-11 (planner) — **WORKFLOW's own out-of-§5 restatements** (`templates/WORKFLOW.md:268` hooks-table row, `:338` §4, `:1033-1036` §11, `:1049` §11; `:1106` is name-only and should pass) are pointer-swapped in P1 — the detector scans `templates/` outside the marked blocks, so leaving them would fail the tree.
- 2026-10-11 (planner) — **Warnings** print on stderr as `warn: <file> — <size>/<ceiling> B (<pct>%)` and never change the exit code; `lint: clean` stays the stdout success line (F0 asserts zero `warn:` lines). `lint-test.mjs`'s summary line becomes `lint-test: clean (N cases)`.
- 2026-10-11 (planner) — **Version** 1.54.0 → **1.55.0** (new lint checks + routing behaviour); CHANGELOG `## [1.55.0]` under the mission's two phases.
- 2026-10-11 (planner) — **Routing**: S1 → `devops` (lint tooling + harness); S2 → `backend` (prose-only brief; chosen because AC-1..AC-3 are its own domain's done-rules and it owns the migrations bias the text encodes). Both checkpoints **Fable** (owner: Fable plan-judge + Fable checkpoint reviewer).
- 2026-10-11 (planner) — **Branching**: `mission/builder-done-rules-p2` cuts from the P1 head (P1's PR may still be open); under human-merge each phase opens its own PR to `main` after its checkpoint, so P2's PR shows only P2's diff once P1 merges.

## Risks

- **S2 overrun split point** (plan-judge advisory): if S2 cannot land in one session, AC-9/AC-10/AC-11 are separable from AC-1..AC-8 and move to an `S2b`; that is a scope decision recorded per §5 LA-1, never a silent second brief.
- **Fixture depth** (plan-judge advisory): the pure-function cases prove verdicts, not printed messages — F2's "names rule + file" and F4's "warning line printed" are covered only by F0's zero-`warn:` assertion on the real run plus the checkpoint reviewer reading one seeded run's output.
- **Detector false positives on the current tree** (pointers that still carry a mechanics word, e.g. `start.md:38-42` "stops the mission at 1.5× the estimate (§5)"). Bounded: the P1 brief lists every known site; the builder tunes the mechanics keys so pointers pass and the two seeded paraphrases fail; F2b is the control.
- **`reviewer.md` byte math** (counsel): 14,308 − P1 swaps (~1,100 B: Fable block → pointer, 1.5× → pointer) + P2 additions (~1,150 B) − impeccable trim (~1,900 B) ≈ 12,450 B. Bounded by measuring `wc -c` at each checkpoint; if P2 lands over 14,308 B, trim the "Close the threat" prose to its §5 pointer before widening anything.
- **Description trims change routing** — the Agent tool picks subagents by `description:`. Bounded: keep the first sentence (what/when) verbatim-ish, cut boundaries ("never …", lists of outputs) into the body; `agents-test.mjs` stays green; the live-verify Closing row checks `/tune`'s summary column.
- **`templates/mission-state.md` rule-copy ships into every venture ledger** — the copy must stay in sync with §5 or lint fails the plugin tree (that is the point); `/sync` carries it to ventures.
- **Codex adapter and the `deviation` status** — resolved 2026-10-11 (locked decision above): the enum is untouched; the risk left is a codex builder omitting the `deviation:` prefix, bounded by the one-sentence rule in its role prompt.

## Open questions

(none — OQ-1 answered 2026-10-11; see Locked decisions.)

---
_The `.plans/builder-done-rules.sessions.md` briefs execute these tasks;
`.plans/builder-done-rules.state.md` tracks progress. Resolve every open question
before execution starts._
