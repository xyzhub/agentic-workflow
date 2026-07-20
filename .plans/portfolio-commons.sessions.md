# Mission: portfolio-commons — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5). Deploys to
`.plans/portfolio-commons.sessions.md`._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/portfolio-commons.md` · Ledger: `.plans/portfolio-commons.state.md`

Gate on every session: `node tools/lint.mjs` must print `lint: clean` before a
checkpoint. Sessions touching agent/consumer behavior also keep the paired eval
green: `node evals/run.mjs commons-warm commons-cold` (costs real tokens — the
reviewer runs it at the phase checkpoint, not on every edit).

## Large-files table

| File | Lines |
|---|---|
| `plugins/agentic-workflow/templates/WORKFLOW.md` (master, §13 @ 693–732, §6 @ 292, §6.1 @ 414) | 789 |
| `docs/WORKFLOW.md` (stamped copy — propagated by `/agentic-workflow:sync`, not hand-edited) | 652 |
| `tools/lint.mjs` (checkAgents @ 86, checkCommands @ 102, checkCrossRefs @ 127, checkSections @ 178) | 265 |
| `plugins/agentic-workflow/README.md` (agents table @ 78, command tables @ 102–148) | 239 |
| `README.md` (root — `What's here` command/agent lists @ 32–33) | 59 |
| `plugins/agentic-workflow/commands/adopt.md` (reference: spawning + §13 registry command) | 100 |
| `plugins/agentic-workflow/agents/architect.md` / `writer.md` (sonnet) / `frontend.md` | 74 / 60 / 59 |
| `CHANGELOG.md` (`## [Unreleased]` @ 6) | ~190 |
| `evals/README.md` · `evals/run.mjs` (auto-discovers scenarios @ 29) | 49 · ~230 |
| `evals/scenarios/commons-{warm,cold}/` (scenario.md · rubric.md · checks.mjs · fixture/) | small |

## Phase 1 — Shape & protocol (branch: `mission/portfolio-commons-p1`)

_Sequential: S2 applies what S1's memo locks. Not parallel-safe._

### S1 — Commons shape memo

- **Reads**: `docs/product/features/portfolio-commons/idea.md` (325, whole — the
  source of truth: locked decisions, evidence, validation); the `commons-warm`
  prototype — `evals/scenarios/commons-warm/fixture/commons/index.md` (21, whole),
  `.../commons/code/tend-landing-auth/README.md` (61, whole),
  `evals/scenarios/commons-warm/scenario.md` (7) + `rubric.md` (14);
  WORKFLOW master §13 (`templates/WORKFLOW.md` lines 693–732);
  `plugins/agentic-workflow/templates/decision-memo.md` (whole, the memo template);
  master plan Open Questions (b).
- **Do**: author `docs/product/decisions/2026-07-18-commons-shape.md` from the
  decision-memo template, resolving each Open-Question-(b) dimension (storage layout,
  index schema fields, freshness signal, copy-and-adapt/de-stale path, brokering
  interface, curator model tier) as 2–3 real options + a recommendation, using the
  planner's recommendations as the strawman and the `commons-warm` shape as baseline.
  No protocol or code change in this session.
- **Verify**: memo covers all six dimensions with a recommendation each; label claims
  fact/inference/assumption. `node tools/lint.mjs` clean (memo is under `docs/`, not
  linted, but run it to confirm no incidental breakage).
- **Read budget**: ~430 lines. Suits: `architect`.

### S2 — §13 commons amendment

- **Reads**: the S1 memo (locked shape); WORKFLOW master §13 (lines 693–732) + the
  §6 roles heading region (line 292) and §6.1 (line 414) to place a curator/commons
  mention consistently; `tools/lint.mjs` checkSections (178–199) + checkCrossRefs
  (127–164) to know what the § and cross-ref checks enforce.
- **Do**: amend WORKFLOW master §13 — add the writable **commons** surface
  (`commons/index.md` + `commons/code/<slug>/`, holding *copies*), state that
  `registry.md`/`precedents.md` stay pointers, fold commons writes into the
  "bookkeeping is delegable" lane, and record the index-entry schema + freshness
  signal per the locked memo. Edit only the **master**; do NOT hand-edit
  `docs/WORKFLOW.md` (note in the handoff that `/agentic-workflow:sync` propagates it).
- **Verify**: `node tools/lint.mjs` → `lint: clean` (section order intact, every `§`
  ref resolves). Flag the stamped-copy propagation as a checkpoint item.
- **Read budget**: ~180 lines. Suits: `backend` or main.

**Checkpoint** ends phase 1 — reviewer re-runs lint + diff-reviews `base..head`; the
**human locks the shape** (the memo's options → dated locked decisions in the master
plan) and merges per gate policy.

---

## Phase 2 — The `/ingest` command (branch: `mission/portfolio-commons-p2`)

### S3 — Author `commands/ingest.md`

- **Reads**: `plugins/agentic-workflow/commands/adopt.md` (100, whole — the pattern
  for a spawning command that touches the §13 registry repo, incl. `allowed-tools`
  with `Task`); `tools/lint.mjs` checkCommands (102–125) + checkCrossRefs (127–164)
  + checkFrontmatterYaml (206–230); plugin `README.md` command tables (102–148) +
  the `Machinery`/`Scale & gates` grouping; root `README.md` (32–33); the locked §13
  amendment (from S2) for the commons layout the command writes into.
- **Do**: author `plugins/agentic-workflow/commands/ingest.md` — frontmatter
  `description` + `argument-hint` + `allowed-tools` including `Task` (it may spawn the
  curator) and `Bash`/`Read`/`Write`/`Edit`; body: **code type first**, per-type
  placement, `git clone`/`cp` the artifact into `commons/code/<slug>/` via Bash, then
  `Edit` `commons/index.md` with a full schema entry; note it runs against the
  registry repo and its writes are delegable §13 bookkeeping. Add `/agentic-workflow:ingest`
  to root `README.md`, plugin `README.md` (a command table), and WORKFLOW master.
- **Verify**: `node tools/lint.mjs` → `lint: clean` (command mentioned in all three
  docs; all refs namespaced `/agentic-workflow:ingest`; `Task` present since the body
  says "spawn").
- **Read budget**: ~450 lines. Suits: `backend` or main.

**Checkpoint** ends phase 2 — reviewer re-runs lint + diff-reviews; human merges.

---

## Phase 3 — The `curator` agent (branch: `mission/portfolio-commons-p3`)

### S4 — Author `agents/curator.md`

- **Reads**: `plugins/agentic-workflow/agents/architect.md` (74, whole — authoring
  shape + boundary discipline) and `writer.md` (60, whole — the `model: sonnet`
  frontmatter example); `tools/lint.mjs` checkAgents (86–100) + checkFrontmatterYaml
  (206–230); plugin `README.md` agents table (78–100); the locked shape memo (S1) +
  §13 amendment (S2).
- **Do**: author `plugins/agentic-workflow/agents/curator.md` — frontmatter
  `name: curator` (must equal filename) + `description` + comma-separated `tools`
  (Read, Write, Edit, Bash, Grep, Glob) + `model:` per the locked tier decision. Body:
  the commons lifecycle (find, harvest, **broker single-best-match / k=1 — never a
  top-N dump**, write, upkeep) and the **freshness/staleness signal** mechanic from the
  memo; a hard boundary (curates + brokers; does not decide, does not ship product
  code, does not merge). Add a `curator` row to the plugin `README.md` agents table,
  a mention in root `README.md`, and to WORKFLOW master (§6 roles + §13).
- **Verify**: `node tools/lint.mjs` → `lint: clean` (name = filename; mentioned in
  both READMEs + WORKFLOW; tools comma-separated, all known).
- **Read budget**: ~350 lines. Suits: `backend` or main.

**Checkpoint** ends phase 3 — reviewer re-runs lint + diff-reviews; human merges.

---

## Phase 4 — Wire the consumer + write-back (branch: `mission/portfolio-commons-p4`)

### S5 — Frontend consults the commons; write-back path

- **Reads**: `plugins/agentic-workflow/agents/frontend.md` (59, whole — the "Orient
  first (honor the existing design system)" beat @ ~lines 9–22 is where the commons
  beat slots in); `agents/curator.md` (from S4); the eval contracts —
  `evals/scenarios/commons-warm/{scenario.md,rubric.md,checks.mjs}` and
  `evals/scenarios/commons-cold/{scenario.md,rubric.md}`; §13 amendment (S2).
- **Do**: edit `frontend.md` to add — inside the orient beat — "where a commons /
  curator exists, consult it for prior art before building, pick the single best
  match, copy-and-adapt (never blind-copy), and flag improvements to write back."
  **Condition it on a commons existing** so `commons-cold` (no commons) is unaffected.
  Add the write-back path: improvements flow back via the curator as a delegable §13
  bookkeeping PR. Keep the beat consistent with the read-protocol brokering decision.
- **Verify**: `node tools/lint.mjs` clean; reviewer runs `node evals/run.mjs
  commons-warm commons-cold` — **both must stay green** (warm still consults+adapts;
  cold does not hallucinate a commons).
- **Read budget**: ~250 lines. Suits: `frontend`.

**Checkpoint** ends phase 4 — reviewer re-runs lint + the paired eval + diff-reviews;
human merges.

---

## Phase 5 — Regression guard, docs, version bump (branch: `mission/portfolio-commons-p5`)

### S6 — Guard + docs + release prep

- **Reads**: `evals/README.md` (49, whole) + `evals/run.mjs` scenario-discovery region
  (lines 29–36); `evals/scenarios/commons-warm/{rubric.md,checks.mjs}` +
  `commons-cold/{rubric.md,checks.mjs}`; `plugins/agentic-workflow/.claude-plugin/plugin.json`
  (11, whole); `CHANGELOG.md` `## [Unreleased]` region (lines 1–30); root + plugin
  READMEs and WORKFLOW master to confirm ingest/curator mentions are complete.
- **Do**: confirm the `commons-warm`/`commons-cold` pair is the feature's permanent
  guard (auto-discovered by `run.mjs` — no registration needed). Optionally add a
  curator-brokering eval asserting **single-best-match (k=1)** and/or a graded/sonnet
  re-run of `commons-warm` for leg-(a) genericness (a follow-up per the validation,
  not a blocker — scope it if the human wants leg-(a) measured). Verify all three doc
  surfaces mention `ingest` + `curator`. Bump `plugin.json` `version` (1.36.0 →
  next minor) and add a `CHANGELOG.md` `## [Unreleased]` entry describing the commons,
  `/ingest`, and the curator.
- **Verify**: `node tools/lint.mjs` → `lint: clean`; `node evals/run.mjs commons-warm
  commons-cold` green; version + changelog updated. (Cutting the actual release is a
  human gate via `/agentic-workflow:release`, not this session.)
- **Read budget**: ~500 lines. Suits: `backend` or main; reviewer at the checkpoint.

**Checkpoint** ends phase 5 — reviewer re-runs lint + evals + diff-reviews; human
merges. Note for the human: `/agentic-workflow:sync` propagates the §13 master edit
into `docs/WORKFLOW.md`; seeding a *real* first commons in the registry repo (running
`/agentic-workflow:ingest` once) is a runtime follow-up, out of mission scope.

---
_Size every brief to its read budget; each session's outcome and any deviation lands
in `.plans/portfolio-commons.state.md`, never only in chat._
