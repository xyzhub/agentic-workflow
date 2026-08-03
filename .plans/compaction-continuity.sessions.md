---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: compaction-continuity — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the expensive
exploration happened once, here._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/compaction-continuity.md` · Ledger:
`.plans/compaction-continuity.state.md` · Brief:
`docs/product/decisions/2026-08-03-compaction-continuity-brief.md`

**Base**: every phase branches off `mission/context-economy-integration` (OQ1) and
merges into `mission/compaction-continuity-integration` — **never** the default
branch. **Phases run sequentially; none is parallel-safe** (P1, P2 and P3 all edit
the two `WORKFLOW.md` mirrors, and P2 depends on P1 being merged — see L2).

**Two standing rules every brief inherits.** (1) **Never** `Read`/`cat`/`head`/`tail`
a `*.jsonl` — only `wc`, `grep -c`/`grep -n`, `awk … | wc -c`, or a path passed to
`tools/context-attrib.mjs` (L10). (2) Nothing here can be exercised live: the
installed plugin cache is `1.41.0`, the repo is `v1.42.0`, and a hook loads its
**installed** definition. The gate is `tools/hook-test.mjs` dispatch against the
working tree — no brief may claim live verification.

## Large-files table

_Measured with `wc -l` on 2026-08-03. Grep-first ranged reads for anything over
~400 lines._

| File | Lines |
|---|---|
| `.plans/context-economy.state.md` | 1700 |
| `tools/context-attrib.mjs` | 1446 |
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 899 |
| `docs/WORKFLOW.md` | 896 |
| `tools/lint.mjs` | 529 |
| `CHANGELOG.md` | 439 |
| `tools/hook-test.mjs` | 363 |
| `docs/product/engineering/context-economy-metrics.md` | 359 |
| `docs/product/JOURNEY.md` | 330 |
| `plugins/agentic-workflow/README.md` | 258 |
| `plugins/agentic-workflow/hooks/hooks.json` | 126 |
| `plugins/agentic-workflow/agents/chronicler.md` | 119 |
| `plugins/agentic-workflow/commands/mission.md` | 117 |
| `plugins/agentic-workflow/hooks/lib/beat-enforcer-stop.sh` | 106 |
| `plugins/agentic-workflow/agents/planner.md` | 92 |
| `README.md` | 59 |
| `plugins/agentic-workflow/commands/end.md` | 56 |
| `plugins/agentic-workflow/hooks/lib/compact-resume.sh` | 54 |
| `plugins/agentic-workflow/commands/handoff.md` | 53 |
| `plugins/agentic-workflow/templates/session-handoff.md` | 52 |
| `plugins/agentic-workflow/hooks/lib/beat-enforcer-pretooluse.sh` | 50 |
| `plugins/agentic-workflow/commands/start.md` | 42 |

**Mirror offset**: `templates/WORKFLOW.md` runs **+8 lines** against
`docs/WORKFLOW.md` (§3 at `176` / `184`, §4 at `203` / `211`, §5 at `237` / `245`,
§6.2 at `468` / `476`, §9 at `524` / `532`). Re-verify the offset with
`grep -n '^## 3\.'` at the start of any doc session — do not trust these numbers
after an earlier session in the same phase has edited a mirror.

---

## Phase 1 — the write trigger (branch: `mission/compaction-continuity-p1`)

_Ships first and alone-safe: a nudge to write a handoff is harmless whether or
not a handoff exists. **L2 forbids reordering with phase 2.**_

### S1 — harness fixtures: arbitrary files + a sized transcript

- **Reads**: `tools/hook-test.mjs` (363 lines, whole — this is the file being
  changed) · `tools/lint.mjs` anchor `checkHookBehavior` `:312-330` (19 lines) ·
  `plugins/agentic-workflow/hooks/lib/compact-resume.sh` (54 lines, whole — the
  consumer of the new `files` knob).
- **Do**: extend `runHook()` (`:37-62`) with two optional knobs, changing nothing
  about the existing `ledgers` behavior:
  - `files: { 'docs/product/session-handoff.md': { content, mtime } }` —
    `mkdirSync(..., { recursive: true })` then write, then `utimesSync` when
    `mtime` is given (mirror the deterministic-mtime trick already used for
    ledgers at `:45-50`, and say in a comment why: filesystem timestamp
    resolution).
  - `transcript: { bytes }` or `transcript: { lines }` — write a throwaway file
    of that size **inside the temp cwd** and pass its absolute path as
    `transcript_path` in the stdin JSON. It is a plain text file, never a
    `*.jsonl` fixture the hooks parse; only its size is load-bearing.
  - Clean-up stays in the existing `finally` (`:59-61`).
- **Verify**: `node tools/hook-test.mjs` — all 33 existing cases pass **byte-for-byte
  unchanged** (diff the case list, not just the exit code). Add two
  fixture-proving cases: one where a hook-visible `ls`/`test -f` observes a staged
  file, one where `wc -c "$transcript_path"` observes the staged size. Without
  them a no-op fixture would make every later case vacuously green — this is the
  anti-inert control for the harness itself. `node tools/lint.mjs` green.
- **Read budget**: ~440 lines. **Suits: `backend`.**

### S2 — derive the byte thresholds (measurement only, no source change)

- **Reads**: `docs/product/engineering/context-economy-metrics.md` anchors
  `:51-65` (the headline), `:176-198` (A5 machinery), `:277-326` (out-of-scope
  levers + caveats) — ~100 lines total · `.plans/context-economy.state.md` anchor
  `## 📊 S7b MEASUREMENT BLOCK` at `:800`, read `:800-880` · `tools/context-attrib.mjs`
  header usage block `:1-30`.
- **Do**: **no source file changes at all** — `git diff --stat` must touch only
  the ledger. Establish, from real transcripts under
  `~/.claude/projects/-Users-baker-Playground-venture-workflow-plugin/` (87 files;
  largest 11.6 MB, 8.4 MB, 3.8 MB, 3.0 MB):
  1. which transcripts contain a compaction record — `grep -c` the compact marker
     (`isCompactSummary`), never a read;
  2. for each hit, the record index (`grep -n`, take the line number only) and the
     **byte offset at that record** — `awk 'NR<=<n>' <file> | wc -c`;
  3. total bytes and total lines per transcript — `wc -c`, `wc -l`;
  4. the spread across the corpus, stated as a range with its `n`.
  Known anchors to reproduce, not re-derive: baseline `2fa752c7…` = 12,211,203 B
  / 4,612 lines, its single compaction collapsed 999,816 → 82,009 **tokens**;
  the context-economy transcript `b167727e…` = 3,283,782 B / 1,501 lines,
  `isCompactSummary` true-records = 1.
  Then recommend two bands (advisory ≈ 55%, urgent ≈ 80% of the derived byte
  point) **with the derivation written out**, and say plainly if the spread is too
  wide to justify one constant — in which case recommend the conservative floor
  of the observed range (OQ2).
- **Verify**: every figure is reproducible from a command written down in the
  ledger block; `git diff --stat` shows the ledger alone; no `*.jsonl` was read.
  Write the numbers into a `## 📊 S2 THRESHOLD BLOCK` in the ledger — that block
  is S3's only source, so S3 never re-measures.
- **Read budget**: ~600 lines. **Suits: `backend`** (`analyst` if the corpus turns
  out to need statistical framing rather than arithmetic).

### S3 — `hooks/lib/handoff-budget.sh` + registration

- **Reads**: `plugins/agentic-workflow/hooks/lib/compact-resume.sh` (54 lines,
  whole — the structural model: stdin parse, guard, `jq -n --arg`, always exit 0)
  · `plugins/agentic-workflow/hooks/lib/beat-enforcer-stop.sh` (106 lines, whole
  — the `additionalContext` emission pattern and the re-fire guard rationale) ·
  `plugins/agentic-workflow/hooks/hooks.json` `:3-34` (the three existing
  `UserPromptSubmit` hooks, incl. the thread-keeper's active-ledger predicate at
  `:25-33` — reuse it verbatim so the two can never disagree) ·
  `tools/hook-test.mjs` `:37-62` + `:261-332` (the `runHook` signature after S1
  and the `SessionStart` case block as the case-style model) · the ledger's
  `## 📊 S2 THRESHOLD BLOCK`.
- **Do**: write `plugins/agentic-workflow/hooks/lib/handoff-budget.sh` and
  register it under `UserPromptSubmit` (L5) in the **same commit**:
  - read stdin; take `transcript_path` and `session_id`; **silent and exit 0** if
    either is absent, empty, or the transcript is unreadable;
  - `BYTES=$(wc -c < "$TRANSCRIPT")`; compare against two **named constants**
    (`ADVISORY_BYTES`, `URGENT_BYTES`) carrying a one-line comment naming S2's
    derivation — never bare literals (the A3 lesson: the D7 3% trigger was a bare
    literal pinned by zero cases);
  - **silent when an active mission ledger exists** (OQ7) — use the thread-keeper's
    exact predicate;
  - **silent when already fired for this band** — state file under `$TMPDIR`
    keyed by `session_id` (no repo state, no `.gitignore` change);
  - **silent when `docs/product/session-handoff.md` has an mtime later than the
    band crossing** (OQ4c);
  - otherwise emit ≤3 lines via stdout (`UserPromptSubmit` convention, matching
    the router and thread-keeper) telling the agent to write/refresh
    `docs/product/session-handoff.md` now, before compaction takes the window;
  - **exit 0 on every path** (L3).
- **Verify**: `node tools/hook-test.mjs` with new cases covering, at minimum:
  below-advisory → silent · advisory crossed → one nudge · same band again → silent
  · urgent crossed → one nudge · active ledger present → silent · fresh handoff
  present → silent · missing `transcript_path` → silent, exit 0 · unreadable
  transcript → silent, exit 0 · both bands pinned **in both directions** (a byte
  count one under and one over each constant). Mutation-prove the band comparison
  and the one-shot state in **both** states, and run the **anti-inert control**:
  re-run each mutation against the pre-change hook set to prove the new cases are
  what fail. `node tools/lint.mjs` green (it runs the harness as a sub-gate).
- **Read budget**: ~700 lines. **Suits: `backend`.**

### S4 — atomic-ref docs for the trigger

- **Reads**: `docs/WORKFLOW.md` `:176-201` (§3 table) + `:220-236` (§4 context
  discipline + reflex backstops) · `plugins/agentic-workflow/templates/WORKFLOW.md`
  `:184-209` + `:228-244` (same, +8) · `plugins/agentic-workflow/README.md`
  `:195-210` (the governance-reflex paragraph — currently says **four** reflexes)
  · `plugins/agentic-workflow/hooks/hooks.json` `:3-34`.
- **Do**: add the §3 guardrail row for the budget hook; extend §4's *Reflex
  backstops* paragraph (four → five reflexes) in both mirrors **identically**;
  update the plugin README's count and sentence; make sure `hooks.json`'s
  `description` for the new hook states every silencer. Say in the §3 row that
  the signal is **transcript bytes, a loose proxy** — cumulative, including tool
  results the window has already evicted — so no reader mistakes it for a token
  measurement. Do **not** touch `docs/WORKFLOW.md` line 3 (L8).
- **Verify**: `diff <(sed -n '4,$p' docs/WORKFLOW.md) <(sed -n '12,$p' plugins/agentic-workflow/templates/WORKFLOW.md)`
  shows only the known pre-existing banner divergence; `node tools/lint.mjs`
  green; **every behavioral claim in the new prose maps to a named
  `hook-test.mjs` case** — list the case name beside each claim in the commit body
  (L7; `ckpt-p2` returned REQUEST CHANGES for exactly this class of defect).
- **Read budget**: ~280 lines. **Suits: `writer`.**

**Checkpoint `ckpt-p1` [STRICT]** ends phase 1 — a new always-on hook that injects
into every prompt. The independent `reviewer` (fresh context) re-runs all gates,
diff-reviews `base..head`, **hand-dispatches** the hook across the silencer matrix
(no ledger / active ledger / fresh handoff / stale handoff / missing
`transcript_path`), re-runs both mutation proofs including the anti-inert control,
and probes injection-resistance with shell metacharacters in the transcript path.
Verdict pushed to the human **the moment it lands** (batch gating, L1).

---

## Phase 2 — the fallback (branch: `mission/compaction-continuity-p2`)

_**Blocked until phase 1 is merged (L2).** Shipping the fallback first would make
a stale `session-handoff.md` authoritative — confidently wrong beats lossy._

### S5 — `compact-resume.sh` falls back to the handoff

- **Reads**: `plugins/agentic-workflow/hooks/lib/compact-resume.sh` (54 lines,
  whole) · `tools/hook-test.mjs` `:261-332` (the seven existing `SessionStart`
  cases — two of which, `:286-293`, **pin the current silence** and must be
  rewritten deliberately, not deleted) · `plugins/agentic-workflow/templates/session-handoff.md`
  (52 lines, whole) · the ledger's OQ3/OQ5/OQ6 resolutions.
- **Do**: replace the two bare `exit 0` guards (`:36` `[ -d .plans ] || exit 0`
  and `:45` `[ -n "$LEDGER" ] || exit 0`) with a branch:
  - **ledger present** → today's directive, **byte-for-byte unchanged**;
  - **no ledger, handoff present** → a directive naming
    `docs/product/session-handoff.md`, **stating its freshness** per OQ5 —
    bytes-since-written and whether it predates the last band crossing — and
    instructing the agent to verify a suspect handoff against `git log`/`git status`
    before trusting its **Next**;
  - **no ledger, no handoff** → per OQ6's resolution (recommended: a distinct
    directive naming `git log -5`, `git status`, `.remember/now.md`, and an
    instruction to tell the human the record is missing).
  Every interpolated value still goes through `jq -n --arg` (never string
  concatenation into JSON); every branch still exits 0.
- **Verify**: `node tools/hook-test.mjs` — the seven existing cases' **ledger
  behavior is unchanged** (assert the emitted string, not just "a directive
  fired"); new cases for each of the three branches; the ≤6-line cap
  (`:322-327`) asserted **per branch**, not once; `source` non-`compact` still
  silent in every branch; metacharacters in the handoff path and content produce
  no shell artifacts. Mutation-prove the branch predicate in both states with the
  anti-inert control. `node tools/lint.mjs` green.
- **Read budget**: ~520 lines. **Suits: `backend`.**

### S6 — the handoff provenance stamp _(conditional on OQ3)_

- **Reads**: `plugins/agentic-workflow/templates/session-handoff.md` (52 lines,
  whole) · `plugins/agentic-workflow/commands/handoff.md` (53 lines, whole) ·
  `plugins/agentic-workflow/commands/start.md` `:28-34` · `tools/lint.mjs`
  `checkTemplateFrontmatter` `:237-254`.
- **Do**: add the one-line `_Written: <ISO-8601> · session <id> · branch <b>_`
  stamp under the template's title and instruct `/agentic-workflow:handoff` to write it;
  teach S5's freshness branch to prefer the stamp and fall back to file mtime.
  **If the human answers OQ3 "no format change", this session does not happen** —
  fold its mtime-only path into S5 and log the collapse as a deviation.
- **Verify**: `node tools/lint.mjs` green (template frontmatter + template-ref
  checks); a harness case for each freshness source (stamp present → stamp used;
  stamp absent → mtime used).
- **Read budget**: ~200 lines. **Suits: `writer`** (pair with `backend` if the
  parse lands in the hook).

### S7 — atomic-ref docs for the fallback

- **Reads**: `docs/WORKFLOW.md` `:176-201` + `:220-236` + `:495-503` (the
  fresh-self handoff paragraph) · `plugins/agentic-workflow/templates/WORKFLOW.md`
  the same +8 · `plugins/agentic-workflow/README.md` `:195-210` ·
  `plugins/agentic-workflow/hooks/hooks.json` `:101-112` (the `SessionStart`
  block's `description`, which currently claims "silent when no `.plans/` or no
  active ledger" — that claim becomes false the moment S5 lands and **must** move
  in S5's own commit or this one, not later).
- **Do**: rewrite the §3 compact-resume row and the §4 reflex sentence to describe
  all three branches; update the §6.2 fresh-self-handoff paragraph so the manual
  `/agentic-workflow:handoff` story and the automatic fallback read as one mechanism;
  fix the `hooks.json` description.
- **Verify**: mirror diff clean; `node tools/lint.mjs` green; each new claim
  named against its dispatching case (L7).
- **Read budget**: ~300 lines. **Suits: `writer`.**

**Checkpoint `ckpt-p2` [STRICT]** ends phase 2 — this is the phase that can make
an agent confidently wrong. The `reviewer` hand-dispatches the full matrix
(ledger × handoff × freshness × `source`), confirms the ledger-present output is
unchanged **byte-for-byte** against the pre-phase hook, re-runs every mutation
proof with its anti-inert control, and explicitly answers: *would a six-week-old
handoff produce a directive that a fresh agent could act on wrongly?* Verdict
pushed to the human immediately (L1).

---

## Phase 3 — frequency levers (branch: `mission/compaction-continuity-p3`)

_Independent of phases 1–2 in mechanism, sequential in practice because it edits
the same mirrors. Smallest phase; ships **no savings claim** (L11)._

### S8 — delegate reads instead of pulling files in

- **Reads**: `plugins/agentic-workflow/hooks/hooks.json` `:57-66` (the
  `PreToolUse:Read` advisory, currently a bare `800`) · `docs/WORKFLOW.md`
  `:468-503` (§6.2 bounded returns / bounded writes / fresh-self handoff) ·
  `plugins/agentic-workflow/templates/WORKFLOW.md` `:476-511` (same, +8) ·
  `docs/product/engineering/context-economy-metrics.md` `:277-289` (the
  `tool results` sizing: 377,452 chars / 14.2% of appended chars, untouched by
  P0–P4) · `plugins/agentic-workflow/agents/planner.md` (92 lines, whole — the
  contract that already says "explore once" and is the model for the wording).
- **Do**: (a) give the `Read` advisory a **named** threshold with a comment citing
  the same evidence base as S2, replacing the bare `800`; (b) add one paragraph to
  §6.2 in **both mirrors** stating the interactive case explicitly — the driving
  session delegates a large read to a subagent that returns a distillate, rather
  than pulling the corpus into the window it is trying to preserve. **No figure,
  no `%`, no gate.** Note in the commit body that a change to an *agent contract*
  cannot be exercised until merge + reinstall, which is why this lands as a hook
  threshold plus protocol text and not as an agent-behavior claim.
- **Verify**: a harness case at each side of the new threshold (advisory fires /
  silent), mutation-proved in both states with the anti-inert control; mirror diff
  clean; `node tools/lint.mjs` green;
  `grep -nE '%|saves?|savings|reduc' ` over the diff returns nothing that reads as
  a savings claim (L11).
- **Read budget**: ~420 lines. **Suits: `backend`.**

### S9 — phase-3 docs and the honest non-claim

- **Reads**: `docs/WORKFLOW.md` `:176-201` · the mirror `:184-209` ·
  `plugins/agentic-workflow/README.md` `:195-210` · the S8 diff.
- **Do**: update the §3 row for the `Read` advisory's new threshold; add one line
  to the plugin README. State once, plainly, that this lever is **unmeasured in
  this repo** and why (D4b's corpus does not exist).
- **Verify**: mirror diff clean; `node tools/lint.mjs` green.
- **Read budget**: ~180 lines. **Suits: `writer`.**

**Checkpoint `ckpt-p3`** ends phase 3 — routine, single-reviewer. Lenses that the
diff touches only.

---

## Phase 4 — record and ship (branch: `mission/compaction-continuity-p4`)

### S10 — the `chronicler` pass

- **Reads**: `CHANGELOG.md` `:1-45` (the `## [Unreleased]` block and its house
  style) · `docs/product/JOURNEY.md` last 40 lines · `plugins/agentic-workflow/agents/chronicler.md`
  (119 lines, whole) · the ledger's checklist + handoff log.
- **Do**: `### Added` / `### Changed` blocks under `## [Unreleased]` for the write
  trigger, the fallback and the read lever; one dated `JOURNEY.md` entry; the
  status-page stamp. Record the **added machinery surface** honestly (this repo's
  governance-hook count goes three → four) and the A5 context for why that is
  called out.
- **Verify**: `grep -nE '%|sav' ` over the new CHANGELOG blocks returns nothing
  that reads as a savings claim; `node tools/lint.mjs` green; version stamping is
  **not** done here (that is a release session, L8).
- **Read budget**: ~400 lines. **Suits: `chronicler`.**

### S11 — the integration PR body

- **Reads**: `.plans/compaction-continuity.state.md` (whole, at whatever length it
  has reached) · `git log --oneline mission/context-economy-integration..HEAD` ·
  `docs/product/decisions/2026-08-03-compaction-continuity-brief.md` (this
  mission's brief).
- **Do**: write the PR body to a file and open the PR from
  `mission/compaction-continuity-integration` — **retargeting per OQ1's resolution**
  (hold until PR #31 merges, then base on the default branch). State what was
  proven by dispatch, what was measured (`n` and corpus), what was **not** proven
  (no live exercise until merge + reinstall; no savings claim), and every open
  item that outlives the mission.
- **Verify**: `node tools/lint.mjs` green; the PR targets the integration branch
  or the default branch per OQ1 — **never** a direct push to the default branch;
  the human merges.
- **Read budget**: ~350 lines. **Suits: `writer`.**

**Checkpoint `ckpt-p4`** ends phase 4 and the mission — the `reviewer` re-runs all
gates on the integration branch, checks claimed deviations against the actual
diff, and confirms no savings claim survived into any shipped doc.

---
_Size every brief to its read budget; split any that can't fit and note the split.
Each session's outcome and any deviation lands in
`.plans/compaction-continuity.state.md`, never only in chat._
