---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: deferred-obligations — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the
expensive exploration happened once, here._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it
here). Master plan: `.plans/deferred-obligations.md` · Ledger:
`.plans/deferred-obligations.state.md` · Brief:
`docs/product/decisions/2026-08-11-deferred-obligations-brief.md`

**Base (OQ1)**: every phase branches off **post-PR-#32 `main`** and merges into
`mission/deferred-obligations-integration` — never the default branch (L1,
batch). If execution must start before #32 merges, base off
`mission/compaction-continuity-integration` and retarget after the merge (the
compaction OQ1 precedent). **Phases run sequentially; none is parallel-safe**
(P3 edits both `WORKFLOW.md` mirrors; P2 depends on P1's grammar; P3's hook
counts what P1 defined).

**Standing rules every brief inherits.** (1) Never `Read`/`cat`/`head`/`tail` a
`*.jsonl` (L10). (2) All new shell is GNU/BSD-portable — CI is Ubuntu, local
gates are macOS; no flag outside both coreutils (L9). (3) Hook behavior is
verified by `tools/hook-test.mjs` dispatch against the working tree — never
claimed live (installed plugin ≠ working tree). The one live-verifiable piece
is S4's reap: plain git/gh operations on this repo. (4) Deletion gates L4
verbatim: `-d` never `-D`; unmerged, open-PR-integration, §10-protected, and
default branches are untouchable.

## Large-files table

_Measured with `wc -l` on 2026-08-11 **on
`mission/compaction-continuity-integration`** — the expected post-#32 shape of
`main`. Re-verify counts marked ⚠ at session start if #32 gained commits after
this date. Grep-first ranged reads for anything over ~400 lines._

| File | Lines |
|---|---|
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 928 ⚠ |
| `docs/WORKFLOW.md` | 925 ⚠ |
| `tools/hook-test.mjs` | 798 ⚠ |
| `tools/lint.mjs` | 529 |
| `CHANGELOG.md` | 486 ⚠ |
| `docs/product/JOURNEY.md` | 394 ⚠ |
| `.plans/compaction-continuity.state.md` | 390 |
| `.plans/compaction-continuity.md` | 276 |
| `plugins/agentic-workflow/README.md` | 267 |
| `plugins/agentic-workflow/hooks/lib/compact-resume.sh` | 167 |
| `plugins/agentic-workflow/hooks/hooks.json` | 136 ⚠ |
| `plugins/agentic-workflow/commands/mission.md` | 117 |
| `plugins/agentic-workflow/hooks/lib/beat-enforcer-stop.sh` | 106 |
| `plugins/agentic-workflow/hooks/lib/handoff-budget.sh` | 103 |
| `plugins/agentic-workflow/commands/adopt.md` | 111 |
| `plugins/agentic-workflow/templates/mission-state.md` | 63 |
| `plugins/agentic-workflow/commands/end.md` | 56 |
| `plugins/agentic-workflow/hooks/lib/beat-enforcer-pretooluse.sh` | 50 |
| `plugins/agentic-workflow/commands/verify.md` | 43 |
| `plugins/agentic-workflow/commands/check.md` | 32 |

**Mirror offset**: `templates/WORKFLOW.md` runs **+8 lines** against
`docs/WORKFLOW.md` (§3 at `176`/`184`, §4 at `205`/`213`, §5 at `248`/`256`,
§9 at `553`/`561`, §10 at `611`/`619`). Re-verify with `grep -n '^## 3\.'` at
the start of any doc session — never trust these numbers after an earlier
session in the same phase edited a mirror.

**Repo rot inventory (S4's target, measured 2026-08-11)**: 17 merged remote
branches (`git branch -r --merged origin/main`, minus HEAD/main), 37 merged
local branches, 3 registered worktrees, 0 `worktree-agent-*` here (that
instance lives in the venture repo — S4 proves the mechanism on what this repo
has). Re-run the inventory at S4 start; these counts WILL drift as PRs merge.

---

## Phase 1 — the parking place (branch: `mission/deferred-obligations-p1`)

_Grammar and enforcement first: everything later writes rows this phase makes
checkable._

### S1 — `## Closing` block + obligations register templates

- **Reads**: `plugins/agentic-workflow/templates/mission-state.md` (63, whole —
  the file being changed; the glyph legend at `:22-25` and `## Standing steers`
  grammar note at `:38-47` are the in-template documentation style to match) ·
  `tools/lint.mjs` `:401-451` (check 11, the grammar-precedent, ~50) ·
  `tools/lint.mjs` `:237-256` (`checkTemplateFrontmatter`, ~20) ·
  `.plans/compaction-continuity.state.md` `:56-80` (a real deployed checklist,
  the prose register the block must sit beside, ~25).
- **Do**: (1) In `templates/mission-state.md`, add a `## Closing` section
  between `## Standing steers` and `## Deviations`: an italic grammar note
  (mirror the steers note's shape) + seeded standard rows —
  branch reap (`when:` phase/integration PRs merged AND deploy concluded green
  per §10 · `probe:` `gh pr list --state merged` + `gh run list`), docs/record
  synced, live-verify after reinstall — each in the OB grammar from task 1 of
  the master plan, plus the promotion rule (`[~] … → OB-<n>` after a verbatim
  copy lands in `.plans/OBLIGATIONS.md`) and the `Closed: YYYY-MM-DD` stamp
  convention (written ONLY when no `[ ]` rows remain). (2) Create
  `templates/obligations.md` (deploys to `.plans/OBLIGATIONS.md`): frontmatter
  (`status: living`, `owner-agent: planner`, `refresh-trigger: event`), the
  grammar, one commented example row, `(none)`. Rows are never deleted — fired
  rows append `· fired YYYY-MM-DD (<evidence>)`.
  **Prose caution**: nowhere in either template may a `- [ ]` row contain the
  words checkpoint/chronicler/reviewer/review — the beat-enforcer greps
  deployed ledgers for exactly those (`beat-enforcer-stop.sh:76`).
- **Verify**: `node tools/lint.mjs` green (frontmatter + cross-ref checks pass;
  no new checks exist yet — S2 adds them and must not have to touch these
  files again).
- **Read budget**: ~200 lines. **Suits: `writer`.**

### S2 — lint checks 13 + 14, mutation-proved

- **Reads**: `tools/lint.mjs` `:1-60` (harness, `fail()`, the FILES list, ~60)
  · `:379-518` (the ledger-check block: `sectionLines` at `:389`, check 11 at
  `:411`, check 12 at `:463`, the run-list at `:520` — the structural model,
  ~140) · both S1 templates (whole, ~90 post-S1).
- **Do**: (1) **Check 13 `checkClosing`** — for every `.plans/*.state.md`
  **that has** a `## Closing` section: each `- ` row matches the OB grammar
  (structural: glyph, `do:`, `when:`, `probe:` segments present); a
  `Closed:` stamp anywhere in the file + any `[ ]` Closing row → fail; stamp +
  `[~]` row without `→ OB-` → fail. Ledger without the block → skipped
  (legacy-tolerant: the five existing trios must pass byte-unchanged). The
  TEMPLATE must carry the block (fail the template if missing — the check-11
  HEADING precedent at `:418`). (2) **Check 14 `checkObligationsRegister`** —
  `.plans/OBLIGATIONS.md` when present: rows match the grammar; absence
  passes. (3) Register both in the run-list at `:520`. (4) Mutation-proof:
  temp-fixture a violating ledger/register (stamp+unticked; malformed row),
  prove each fails; remove, prove green; **anti-inert**: run each mutation
  against pre-change lint (`git stash` the lint edit) and prove it passes
  there — the new check is what kills it.
- **Verify**: `node tools/lint.mjs` green on the real tree; the mutation
  matrix (≥4 cases: 2 per check, both directions) recorded in the ledger
  handoff; existing checks 1–12 byte-unchanged.
- **Read budget**: ~350 lines. **Suits: `backend`.**

### Checkpoint `ckpt-p1` — diff-review `main..mission/deferred-obligations-p1`;
re-run all gates; confirm legacy tolerance by running the new lint against the
five pre-existing trios unmodified. Merge to integration per L1.

## Phase 2 — the reaper (branch: `mission/deferred-obligations-p2`)

_The command is authored, then exercised live on this repo's own rot.
**`ckpt-p2` is `[STRICT]`** — deletion machinery._

### S3 — author `commands/settle.md`

- **Reads**: `plugins/agentic-workflow/commands/end.md` (56, whole — the
  close-shape `/settle` must complement, not duplicate) · `commands/check.md`
  (32, whole) · `commands/verify.md` (43, whole — the deploy-verification
  precedent and §7 language) · `commands/mission.md` `:41-76` + `:94-117`
  (~60 — run/record shape, worktree authorization at `:54-56`) ·
  `docs/WORKFLOW.md` `:611-631` (§10 profile rows the probes key on, ~20) ·
  both S1 templates (~90).
- **Do**: new `plugins/agentic-workflow/commands/settle.md` (frontmatter:
  description + allowed-tools `[Read, Edit, Bash, Grep, Glob]`), four
  numbered steps: (1) **Inventory** — `.plans/OBLIGATIONS.md` rows + every
  `.plans/*.state.md` `## Closing` block's unticked rows. (2) **Probe** —
  run each row's `probe:`; `manual` rows and failed probes → the surface
  list; the §10 degradation ladder from OQ4 spelled out (deploy+CI → checks
  green on merge commit; CI-only → CI green; neither → merged suffices; no
  `gh` → surface, never delete). (3) **Fire the safe class** — the reap
  algorithm verbatim: `git fetch --prune` → `git worktree prune` → local
  `worktree-agent-*` then merged locals via `git branch -d` (a `-d` refusal
  = unmerged commits = surface, never `-D`) → remote deletes
  (`git push origin --delete <b>`) only for branches merged into the default
  AND condition-green, minus the L4 protected set — **dry-run listing printed
  and confirmed before any deletion**. (4) **Write back** — tick fired rows
  with `· fired <date> (<evidence>)`, append the surface list to the output,
  never delete a row. Every shell line BSD+GNU-safe (L9).
- **Verify**: `node tools/lint.mjs` green (`checkCommands` frontmatter +
  cross-refs — if a cross-ref check demands the command be listed in §9 of
  the mirrors, add the minimal list entry here and leave the prose
  integration to S7, noting it in the ledger).
- **Read budget**: ~350 lines. **Suits: `backend`.**

### S4 — dogfood reap on this repo + seed the register

- **Reads**: `commands/settle.md` (from S3, whole, ~90) ·
  `.plans/compaction-continuity.state.md` `:70-80` + `:170-180` (the n=1
  re-measure wording the seed row must cite, ~20) ·
  `.plans/compaction-continuity.md` `:139-147` (D4b, ~10). Everything else is
  command output, not file reads.
- **Do**: (1) Re-run the rot inventory (counts drift — table above is
  2026-08-11: 17 remote / 37 local / 3 worktrees). (2) Execute `/settle`'s
  steps by hand exactly as S3 wrote them: dry-run listing FIRST, paste it
  into the ledger, then delete. Probe rule for this repo per §10: merge to
  `main` IS the release; CI = lint on push → gate is CI green on each
  branch's merge commit. Expected protected survivors: `main`, any branch
  with an open PR, anything `git branch -d` refuses. (3) Create
  `.plans/OBLIGATIONS.md` from the template and seed: **OB-1** n=1
  handoff-budget band re-measure — `when:` upstream compaction behavior
  changes OR the local transcript corpus gains ≥3 new compaction records ·
  `probe: manual` · source `.plans/compaction-continuity.state.md:75` —
  and **OB-2** D4b cross-mission corpus — `when:` ≥2 further missions'
  transcripts exist post-v1.43 · `probe: manual` · source
  `.plans/compaction-continuity.md:142`. (4) Anything the reap could NOT
  fire (condition not yet green) becomes **OB-3+** rows with real probes —
  do not force it. (5) Evidence table in the ledger: branch → merge proof →
  condition proof → action taken.
- **Verify**: `git branch -r --merged origin/main` residue = protections
  only, each named with its reason; `git worktree list` = active worktrees
  only; `node tools/lint.mjs` green (check 14 now has real rows to parse —
  this is its first non-fixture exercise).
- **Read budget**: ~150 lines. **Suits: `devops`.**

### Checkpoint `ckpt-p2` **[STRICT]** — audit every deletion against
`git reflog`, `gh api` (the deleted remote refs), and the dry-run listing:
nothing unmerged, protected, or open-PR was touched; the evidence table is
reproducible. Surface the verdict to the human immediately (batch policy).

## Phase 3 — the beats (branch: `mission/deferred-obligations-p3`)

### S5 — `hooks/lib/obligations-due.sh` + registration + harness

- **Reads**: `plugins/agentic-workflow/hooks/lib/handoff-budget.sh` (103,
  whole — the four-silencer + `$TMPDIR` marker model this hook copies) ·
  `hooks/lib/compact-resume.sh` `:1-60` (stdin parse / guard / exit-0 shape,
  ~60) · `hooks/hooks.json` (136 ⚠, whole — registration + description
  style) · `tools/hook-test.mjs` `:41-90` (`runHook` and its `files` knob —
  staging `.plans/OBLIGATIONS.md` fixtures needs it, ~50) + grep
  `SessionStart` for the case block and **the pinned matcher case**
  (`"matcher is exactly [\"compact\"]"`, ~`:294` pre-#32-drift) — read ±40.
- **Do**: (1) `hooks/lib/obligations-due.sh` on **SessionStart, matcher
  `startup|resume`** (never `compact` — compact-resume owns that beat and
  its directive must not compete): read stdin for `session_id`; grep-count
  unticked `- [ ] OB-` rows in `.plans/OBLIGATIONS.md` + unticked rows in
  any `.plans/*.state.md` `## Closing` section; emit ≤3 lines via
  `hookSpecificOutput.additionalContext` (jq-built, values escaped) naming
  the counts and `/agentic-workflow:settle`. Four silencers exactly (L13):
  no register AND no Closing block → silent; zero unticked → silent; once
  per session (`$TMPDIR` marker keyed by `session_id`); always exit 0. No
  network, no `gh`, no probes (L5). (2) Register in `hooks.json` with a
  description that claims ONLY dispatched behavior, same commit. (3)
  Harness: cases for firing (register rows), firing (Closing rows),
  each silencer, marker re-fire suppression, malformed stdin → exit 0
  silent; **update the pinned SessionStart matcher-shape case deliberately**
  (it asserts the matcher list — extend the assertion, never delete it);
  mutation-proof both states + anti-inert (pre-change harness passes the
  mutation).
- **Verify**: `node tools/lint.mjs` green (dispatches the full harness);
  all pre-existing SessionStart cases pass; the case-count delta and
  mutation matrix in the ledger handoff.
- **Read budget**: ~450 lines. **Suits: `backend`.**

### S6 — protocol integration, atomic-ref

- **Reads**: `commands/end.md` (56, whole) · `commands/mission.md` `:94-117`
  (~25) · `commands/check.md` (32, whole) · `docs/WORKFLOW.md` `:176-204`
  (§3), `:205-247` (§4), `:248-314` (§5) (~140) · `templates/WORKFLOW.md`
  same sections at +8 (verify offset first) · `plugins/agentic-workflow/README.md`
  `:190-230` (the reflexes paragraph at `:198`, ~40) · `commands/settle.md`
  (~90).
- **Do**: in atomic-ref commits (L8): (1) `end.md` — new step between §2 and
  §3: *if this session finishes a mission* (last checklist row ticking), read
  the ledger's `## Closing`; any `[ ]` row → the mission may NOT be reported
  closed — run `/agentic-workflow:settle`, tick or promote (L2), only then
  write the `Closed:` stamp. (2) `mission.md` — "Close the mission"
  subsection after §4: the same gate stated from the orchestrator's side
  (the checklist is the authority; "zero open PRs" is not a completeness
  signal), promotion semantics, and the reap pointer. (3) `check.md` — item
  8: due-obligation count (grep-only, same predicate as the hook). (4) Both
  `WORKFLOW.md` mirrors: §3 gains the obligations-due guardrail row
  (advisory, described exactly as dispatched); §4 gains the close
  fall-through sentence; §5 gains the `## Closing` block + register + close
  gate paragraph. (5) README: reflexes count + one paragraph. Never touch
  `docs/WORKFLOW.md:3`.
- **Verify**: `node tools/lint.mjs` green; mirrors byte-identical outside
  `docs/WORKFLOW.md:3` (`diff <(tail -n +4 docs/WORKFLOW.md) <(tail -n +4
  plugins/agentic-workflow/templates/WORKFLOW.md)` modulo the known
  §10/local-amendments divergence — record the exact diff scope in the
  ledger); every hook claim added to prose has a named harness case.
- **Read budget**: ~600 lines. **Suits: `writer`.**

### Checkpoint `ckpt-p3` — diff-review; re-run gates; verify the mirror
discipline and that no prose claim outruns a dispatched case. Merge per L1.

## Phase 4 — record & ship (branch: `mission/deferred-obligations-p4`)

### S7 — update the record

- **Reads**: `CHANGELOG.md` `:1-60` (entry style) · `docs/product/JOURNEY.md`
  `:1-40` + last entry (grep the final `## ` heading, ±20) ·
  `docs/product/overview.html` stamp block (grep `artifact-url`, ±10) · the
  mission ledger (whole, for the evidence).
- **Do**: CHANGELOG entry (next minor: templates + 2 lint checks + `/settle`
  + 1 hook + protocol text; the dogfood reap results as the proof line);
  JOURNEY entry; status-page stamp + republish via the Artifact tool (main
  session does the publish — subagents cannot).
- **Verify**: `node tools/lint.mjs` green; no unsupported claim (the reap is
  proven live; the hook is proven by dispatch; the refusal by lint fixture —
  use those words).
- **Read budget**: ~250 lines. **Suits: `chronicler`.**

### S8 — integration PR body + close through the gate

- **Reads**: `.plans/compaction-continuity.artifacts/p4-pr-body.md` (146,
  whole — the house PR-body model) · the mission ledger (whole).
- **Do**: author `.plans/deferred-obligations.artifacts/p4-pr-body.md`:
  proven-live vs proven-by-dispatch vs proven-by-fixture, the deletion
  evidence table, the L4 gates, what was NOT done (no time triggers, no
  auto-merge changes, human-merge untouched). Then **close this mission's own
  ledger through its own `## Closing` gate**: run `/agentic-workflow:settle`,
  tick or promote every row (branch reap for this mission's own phase
  branches becomes an OB row — its deploy condition is the human merging the
  integration PR, which post-dates this session), then and only then the
  `Closed:` stamp… which check 13 will veto if anything is still `[ ]`. That
  veto working is part of the acceptance.
- **Verify**: `node tools/lint.mjs` green with the stamp present; PR body
  committed to the artifacts dir, not pasted into chat (§6.2).
- **Read budget**: ~350 lines. **Suits: `writer`.**

### Checkpoint `ckpt-p4` — final review of `main..integration`; then the human
merges PR `mission/deferred-obligations-integration → main` once. The
mission's last obligation row (reap its own branches) fires at the NEXT
`/settle` after that merge deploys green — by design, not by omission.
