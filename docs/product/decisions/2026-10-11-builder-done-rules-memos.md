---
status: frozen
owner-agent: architect
refresh-trigger: never
---

# agentic-workflow — Decision memos: builder-done-rules D1–D4

_Four shape decisions from `2026-10-11-builder-done-rules-brief.md`, digested so the
owner picks between options. Labels: **fact** (cited path:line or measurement taken
2026-10-11 at `c12e1c1`), **inference**, **assumption**. Patterns only from
jsmastery; no text copied._

---

## D1 — How lint detects a "second prose statement" of a §5 rule

**Question.** What does `tools/lint.mjs` key on to fail a restatement of one of the
four convergence rules outside WORKFLOW §5, while allowing one-line pointers?
Constrains AC-12/13 and every future tune of those rules.

**Repo reality (facts).** Restatements today: 1.5× in `reviewer.md:92`,
`planner.md:85`, `mission.md:38`, `autopilot.md:61`, `start.md:42`,
`WORKFLOW.md:338,1033`, `mission-state.md` (template prose), plus hooks;
one-corrective-retry in `reviewer.md:76`, `mission.md:157,170,256`, `tune.md:209`,
`audit.md:37`, `autopilot.md:131`, `WORKFLOW.md:378,1049,1106`; Fable-required in
`reviewer.md:19`, `mission.md:76`, `WORKFLOW.md:418`; `Next up:` in 17 files.
Lint's existing pattern for a behaviour check is a **pure exported function +
a cases table with a provenance column** (`clockLeak` → `tools/lint-test.mjs`,
registered by `checkClockGuard`), and `checkObligationsRegister` already strips
HTML comments before scanning; `checkNextUpAgreement` already splits on backticks
so prose *about* a term is not a hit.

### Option A — Marker comments + two-key fingerprint
- **How it works here.** Each canonical block in §5 is fenced
  `<!-- rule: overrun-1.5x -->` … `<!-- /rule -->` (ids: `overrun-1.5x`,
  `one-corrective-retry`, `fable-boundary`, `one-next-up`). Lint asserts exactly one
  block per id inside §5. Outside the blocks, over `agents/ commands/ skills/
  templates/` (hooks/ excluded, HTML comments and backticked spans stripped), a
  **paragraph** fails when it matches the rule's *name* fingerprint AND its
  *mechanics* fingerprint — e.g. `1.5×|1\.5 ×|1\.5x` + `STOP|scope decision|subset`;
  `one[- ]corrective` + `re-?spawn|retr(y|ied) once|then (surface|escalat)`;
  `Fable (is )?required` + `auth|credential|tenancy|money|schema|migration`;
  `Next up:` + `head -1|FIRST line|supersed|only the first`. Name-only paragraphs
  pass (that is the pointer). The fingerprint table lives beside the ids in lint.
- **Tradeoffs.** Catches restated *mechanics* regardless of wording length; pointers
  of any shape survive; a table cell like `WORKFLOW.md:1106` passes. Misses a
  restatement that paraphrases every mechanics word (inference: unlikely — the
  mechanics terms are the rule). Fingerprints need one edit when a rule changes.
- **Operational cost.** ~80 lines in lint + ~20 cases in `lint-test.mjs`
  (seeded restatement → fail; pointer → pass; backticked → pass; hooks → skipped).
- **Cost of reversal.** Delete four comment pairs and one check. Trivial.

### Option B — Byte-identical duplicate blocks (jsmastery sync pattern)
- **How it works here.** The rule text may appear anywhere as long as it is
  byte-identical to the marked §5 block; lint diffs copies.
- **Tradeoffs.** Guarantees agreement, not deduplication — every copy still loads
  into context (the brief's problem 4), and it contradicts the owner's locked
  "pointers + lint guard" choice. Any one-line pointer is by definition not
  identical, so pointers need a second allowance anyway.
- **Operational cost.** Small check; large ongoing token cost.
- **Cost of reversal.** Trivial, but the copies stay until someone trims them.

### Option C — Pure per-phrase file allowlist
- **How it works here.** A map phrase → files permitted to contain it.
- **Tradeoffs.** Permits restatement inside allowed files (the actual drift
  vector, #91) and forbids pointers in files not listed — 17 files for `Next up:`
  alone. Fails on shape: it checks *where*, not *what*.
- **Cost of reversal.** Trivial.

**Recommendation: A.** It fails on the thing that drifts (mechanics prose) and
leaves the thing we want (pointers) unrepresentable as a violation. Strongest
case against: two regexes per rule is a maintenance surface that itself drifts —
mitigated by the markers (lint fails if a block id vanishes) and the cases table
(a tune that breaks detection fails the harness, not the owner).
Note for the planner (fact): `templates/mission-state.md` restates the 1.5× rule
in prose and ships into every venture's ledger; it must become a pointer or the
check will fail the current tree.

**What would change the answer.** If, after two tunes, a restatement slips past
because the author paraphrased every mechanics term, add a third key (a `§5`
citation required on any name hit) — not B or C.

---

## D2 — Where the value-sourcing table lives, and its minimum columns

**Question.** Which artifact owns the table mapping every produced/displayed value
to its source, so the plan-judge can REVISE on an unsourced value? Constrains the
plan trio templates, `planner.md`, and the plan-judge checklist in `reviewer.md`.

**Repo reality (facts).** `templates/mission-plan.md` has `## Tasks` with inline
"Acceptance:" prose and no ids, `## Locked decisions` (dated), `## Open questions`.
`templates/mission-sessions.md` briefs have Reads/Catalog/Do/Verify/Read budget.
`templates/decision-memo.md` exists (architect-owned, frozen). The plan-judge
(`reviewer.md:191–224`) runs a per-brief checklist and returns one APPROVE/REVISE.
Memos are written *before* the plan; briefs are written *from* the plan.

### Option A — Master plan only
- **How it works here.** `mission-plan.md` gains `## Value sourcing` directly under
  `## Tasks` (whose criteria become `AC-N`). Columns: **AC** · **Value** ·
  **Source kind** (`input` · `column` · `derivation` · `locked decision`) ·
  **Where** (field/form, `table.column`, formula with operands, or
  `YYYY-MM-DD` decision + memo path). Briefs cite AC ids only (AC-6); the table is
  reachable through the id. Plan-judge: REVISE on an empty `Where`, a kind outside
  the four, an AC no brief cites, or a value a brief's Do produces that no row names.
- **Tradeoffs.** One home, no sync problem; the judge reads one file. Costs: the
  planner must transcribe sourcing the architect may already have decided.
- **Operational cost.** One template section, one planner.md paragraph, two judge
  checklist items.
- **Cost of reversal.** Low — a section can move; past trios keep theirs.

### Option B — Master plan + a table in the architect memo
- **How it works here.** Same table also in `decision-memo.md`; planner copies.
- **Tradeoffs.** Two tables for the same values = exactly the drift D1 polices;
  memos precede ACs so the memo copy can never carry AC ids.
- **Cost of reversal.** Low, but leaves stale copies behind.

### Option C — Per-brief in sessions.md
- **How it works here.** Each brief lists the values it produces with sources.
- **Tradeoffs.** Puts the table where the builder reads, but a value shared by two
  briefs is stated twice, and the judge's "specced but never built" check needs a
  whole-feature view that no single brief has (Fable council gap #1).
- **Cost of reversal.** Low.

**Recommendation: A, with the memo template gaining a one-line *input* field, not
a table** — `Values this decision settles:` as a bullet list the planner lifts
into the master plan with `Source kind = locked decision · Where = <date> + memo
path`. Satisfies AC-7's "architect memo template, if one exists" without a second
table. Strongest case against: the master plan is the planner's file, and value
derivations are often an architect's call — mitigated by the memo bullets being
the feed, and the memo path landing in `Where` so provenance is one hop.

**What would change the answer.** If missions routinely produce >20 values and
the single table becomes a wall the judge skims, split by task (`### AC-1..3`
sub-tables) — still one file.

---

## D3 — Byte budgets: starting ceilings per class; WORKFLOW.md whole-file or none

**Question.** What numbers go in lint's budget table, and does the 106 KB protocol
get a ceiling? Constrains every future prompt edit (fail over 100 %, warn at 90 %).

**Measured 2026-10-11 at `c12e1c1` (facts, bytes).** Agents: `reviewer` 14,308,
`chronicler` 9,280, `marketing` 8,977, `planner` 8,797 (total 111,513). Commands:
`mission` 21,336, `connect` 16,179, `autopilot` 13,106, `tune` 12,339 (total
185,135). Skills: `plain-report` 4,821, `protocol` 2,874. `templates/WORKFLOW.md`
105,878; largest sections §6 18,654, §5 15,181, §0 12,042, §3 11,557, §10 7,537.
Descriptions total 9,707; max `curator` 673, `compass` 641 (6 agents >540).
Assumption: planned trims land `reviewer` ≈13.3 KB and `mission` ≈20 KB (AC-15
says only "smaller").

| Class | Largest now | Ceiling (fail) | Warn (90 %) | Headroom vs largest-after-trim |
|---|---|---|---|---|
| `agents/*.md` | 14,308 | **16,000** | 14,400 | ~20 % |
| `commands/*.md` | 21,336 | **24,000** | 21,600 | ~20 % |
| `skills/*/SKILL.md` | 4,821 | **6,000** | 5,400 | ~24 % (small class; round number) |
| agent `description:` | 673 | **400** (owner-set) | 360 | requires the trims |
| `templates/WORKFLOW.md` | 105,878 | see options | | |

Inference: with warn at 90 %, today's `reviewer` (14,308 < 14,400) and `mission`
(21,336 < 21,600) sit just under warn, so the current tree is green *and* the two
files the brief wants smaller are the first to warn if they regrow.

### Option A — No budget on WORKFLOW.md
- **How it works here.** Protocol exempt; only agents/commands/skills budgeted.
- **Tradeoffs.** The 106 KB file is the one the §8 loop amends every retro; it is
  the most likely to grow unbounded. §10 is placeholder prose in the plugin copy
  (the per-project fill happens in the venture, which plugin lint never sees), so
  "§10 grows per project" is not a reason to exempt the template.
- **Cost of reversal.** Trivial.

### Option B — Whole-file ceiling
- **How it works here.** One row: `templates/WORKFLOW.md` **120,000** (≈13 %
  headroom), warn 108,000. On warn, lint prints the per-§ byte table (reuses
  `checkSections`' heading parse) so the author sees which section to trim.
- **Tradeoffs.** Bounds growth without dictating shape; a §-level view is
  informational, so a necessary §5 growth is not blocked by a §-level number.
- **Operational cost.** One table row + ~15 lines for the §-size printout.
- **Cost of reversal.** Trivial (delete the row).

### Option C — Per-section ceilings
- **How it works here.** A ceiling per top-level `##`.
- **Tradeoffs.** Sixteen numbers to maintain; sections legitimately differ by 30×
  (§7 595 B vs §6 18,654 B); a rule moving from §11 to §5 trips two ceilings.
  Fights the §8 loop's "amend THIS document" more than it protects.
- **Cost of reversal.** Low, but noisy while it lives.

**Recommendation: B**, with the table in one `BUDGETS` object carrying the
comment "ceilings only ratchet down; raising one is a dated locked decision
in the PR body". Strongest case against: 13 % headroom on WORKFLOW.md is tighter
than the 20 % given to prompts — deliberate, because the protocol is copied into
every venture and loaded by the `protocol` skill; if the first warn arrives
within two missions, that is the signal to trim, not to raise.

**What would change the answer.** A measured need to add a §15 (new lifecycle
surface) that cannot fit under 120 KB after a trim pass → raise once, dated. If
two files in one class sit at warn for three releases, the class ceiling is
wrong-sized: lower it after the trims rather than live at the edge.

---

## D4 — `Assumed` status: decision-log only, also a ledger glyph, also an owner notice

**Question.** Where does an owner's "build anyway" over a locked decision live so
settle can nag until ratified, without blocking a merge (AC-9)? Constrains
`decision-log.md`, `mission-state.md`, `settle.md`, and possibly hooks.

**Repo reality (facts).** `templates/decision-log.md` has columns Date · Decision ·
Options considered · Why · How to reverse — no status. It is created **only by
autopilot** (`commands/autopilot.md:186`; no bootstrap/adopt/mission path writes
it). In a human-driven mission, dated decisions live in the master plan's
`## Locked decisions`. Ledger glyphs are `[ ]` `[~]` `[x]` and the hooks key on the
glyph, never prose (`hooks/lib/beat-enforcer-*.sh:7`); the status line is composed
by `hooks/lib/mission-budget.sh:66–83` from `Estimate:`, `Sessions used:`,
`Next up:`, `Status:` lines. `settle.md` §2 probes register rows and ends with a
surface list for `probe: manual` and failed probes.

### Option A — Status on the dated decision entry + settle probe
- **How it works here.** `decision-log.md` gains a **Status** column:
  `decided` (default) · `Assumed — owes <decision>; built on <assumption>;
  authorized by <who> <date>` · `ratified <date>`. The identical entry shape is
  allowed as a bullet in the master plan's `## Locked decisions` (prefix
  `Assumed <date> —`) because that is where non-autopilot missions keep decisions.
  `settle.md` gains step 2b: grep both homes for `Assumed` without a later
  `ratified`; every hit goes on the surface list; none is a blocker. The ledger's
  existing `## Open questions` carries a one-line pointer (`Assumed <date> → see
  <home>`) so a cold session sees it — prose, no glyph, so no hook change.
- **Tradeoffs.** Nothing new for hooks to parse; visible to settle and to any
  fresh agent reading the ledger. Nagging cadence = settle's cadence (mission
  close) — slow if an assumption spans missions.
- **Operational cost.** Template column, two paragraphs (settle, builders' AC-4
  text), zero shell.
- **Cost of reversal.** Trivial.

### Option B — A + a new ledger glyph (`[?]`) the status line shows
- **How it works here.** Checklist rows for Assumed items use `[?]`; the
  mission-budget hook counts them into the status line.
- **Tradeoffs.** Every-turn visibility. But the glyph set is parsed by two
  enforcer scripts plus `hook-test.mjs`; a fourth glyph widens blast radius into
  bash and its harness for a state the enforcer must *ignore* (never-blocking).
  A due-ness regression in the enforcer is the classic failure here
  (`beat-enforcer-stop.sh:15`).
- **Cost of reversal.** Moderate — glyph removal touches hooks + tests + ledgers.

### Option C — A + owner-channel notice (§12) at creation
- **How it works here.** Posting an Assumed entry triggers a notification.
- **Tradeoffs.** The owner *is* the author of "build anyway"; notifying them of
  their own decision at creation is noise. The useful nag is the later one, which
  settle already provides.
- **Cost of reversal.** Trivial.

**Recommendation: A.** The state is a record, so it lives with the records, and
"never blocks a merge" is cheapest when no hook can see it. Strongest case
against: if a venture rarely runs `/settle`, an Assumed entry can age unseen —
the ledger pointer mitigates for agents, not for the owner.

**What would change the answer.** One Assumed entry older than one full mission at
a settle → add an `Assumed: N` *line* (not glyph) the mission-budget hook echoes
in the status line — one grep in `mission-budget.sh`, still no enforcer change.
Only if that proves insufficient does B earn its blast radius.

---
_The architect consults; the **human decides**. Each pick lands as a dated locked
decision in the mission master plan pointing at this file. The `advisor` may argue
against any of them at its gate._
