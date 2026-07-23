# Mission: orchestrator-governance — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the expensive
exploration happened once, here. Deploys to `.plans/orchestrator-governance.sessions.md`._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/orchestrator-governance.md` · Ledger: `.plans/orchestrator-governance.state.md`

Phases are **sequential** (build order is a locked decision — each layer felt +
reviewed before the next); none are parallel-safe. **P2 is the felt-validation
gate**: if injected nudges don't change behavior, escalate to the human before P3.
Every agent-creating session (S4, S5) adds the minimal doc mentions its new agent
needs to keep `checkCrossRefs` green; the full docs/version/eval pass is S6.

## Large-files table

_Measured via `wc -l`. Grep-first ranged reads for anything over ~400 lines._

| File | Lines | Note |
|---|---|---|
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 839 | master protocol — grep to the § anchor, never whole |
| `plugins/agentic-workflow/README.md` | 241 | agent table ~L78–97, hooks note ~L185 |
| `CHANGELOG.md` | 230 | edit `[Unreleased]` head only (~L7) |
| `tools/lint.mjs` | 286 | `checkHooks` L232–254, `checkAgents` L86–100, `checkCrossRefs` L127–164 |
| `.plans/portfolio-commons.state.md` | 299 | reference for live ledger schema the hooks grep |
| `plugins/agentic-workflow/hooks/hooks.json` | 73 | the whole hook surface — read whole |
| `docs/product/features/orchestrator-governance/idea.md` | 123 | source of truth |
| `plugins/agentic-workflow/commands/connect.md` | 111 | §12 send mechanism |
| `plugins/agentic-workflow/agents/*.md` | 43–73 | mirrors: advisor 43, chronicler 72, brainstormer, analyst 58 |
| `README.md` (root) | 59 | agent list L32, command list L33 |
| `plugins/agentic-workflow/.claude-plugin/plugin.json` | 11 | version bump |

## Phase 1 — Shape (branch: `mission/orchestrator-governance-p1`)

### S1 — Architect shape memo

- **Reads**: `docs/product/features/orchestrator-governance/idea.md` (123, whole —
  source of truth, esp. the open-questions list L109–121); `.plans/orchestrator-governance.md`
  (whole — the (b) open questions are this brief's agenda); `plugins/agentic-workflow/hooks/hooks.json`
  (73, whole — the current hook surface: `UserPromptSubmit` L3–14 injects via stdout,
  `PreToolUse`/Bash L15–35 reads stdin via `INPUT=$(cat)` + `jq`, `Read` L36–45,
  `PostToolUse` L47–58, `SessionEnd` L59–70; note there is **no `Stop` hook today**);
  `tools/lint.mjs` `checkHooks` (L232–254 — commands are only bash-`-n` syntax-checked,
  so any hook event name passes lint); `.plans/portfolio-commons.state.md` (offset 1
  limit 45 — the live ledger schema the thread-keeper/beat-enforcer must grep:
  `Gate policy:` line, `## Checklist` rows `[x]`/`[~]`/`[ ]`, `Next up:`);
  `plugins/agentic-workflow/agents/architect.md` (73, whole — memo format);
  `plugins/agentic-workflow/commands/connect.md` (L97–111 — the §12 send record) and
  master `WORKFLOW.md` §12 (grep `## 12`, read ~L625–673) for the compass notify path.
- **Do**: author `docs/product/features/orchestrator-governance/shape-memo.md` — an
  `architect` options memo (2–3 options each, tradeoffs, reversal cost, a
  recommendation) answering every **(b)** open question in the master plan:
  drift-signatures + router work-request-vs-chat detection; thread-keeper active-
  ledger selection + next-step/beat derivation; beat-enforcer `Stop`-vs-`PreToolUse`
  placement; north-star artifact location + schema + relation to idea.md/PRD;
  `intake` new-agent-vs-extend-`/next`|`/welcome`; `compass` standalone-vs-extend-
  `/operate`; compass notification gating; `intake`↔`compass` coupling. Do not build.
- **Verify**: memo exists and covers each (b) question with a recommendation; the
  human locks the choices, recorded as dated Locked decisions in the master plan.
- **Read budget**: ~500 lines. Suits: `architect`.

**Checkpoint** ends phase 1 — human locks the shape (a light `reviewer` pass is
optional; this phase produces a decision doc, not code). Record locked decisions in
the master plan before P2.

---

## Phase 2 — Reflexes / the hooks (branch: `mission/orchestrator-governance-p2`)

_The felt-validation gate. All three hooks live in `hooks.json`; S2 and S3 touch the
same file, so they are sequential, not parallel._

### S2 — Router + thread-keeper hooks

- **Reads**: `shape-memo.md` (the P1 locked choices — the spec for detection +
  ledger derivation); `plugins/agentic-workflow/hooks/hooks.json` (73, whole — add
  to the existing `UserPromptSubmit` array L3–14; copy the stdin-read idiom
  `INPUT=$(cat); … jq -r '.prompt // ""'` from the Bash hook L20–21 for the router,
  and the ledger-grep idiom from the branch hook L9); `tools/lint.mjs` `checkHooks`
  (L232–254 — the bash `-n` gate); `.plans/portfolio-commons.state.md` (offset 1
  limit 45 — grep targets: `Next up:`, `[ ]`/`[~]` rows) as the schema to parse.
- **Do**: add two `UserPromptSubmit` hook commands — the **router** (un-prefixed
  work-request → inject "route via the protocol / hand to `intake`"; silent on plain
  chat, per the memo's signature) and the **thread-keeper** (every turn → grep the
  active ledger, inject current phase + `Next up:` + first unchecked required beat;
  silent when no ledger). Both echo to stdout (injection), never `exit 2`.
- **Verify**: `node tools/lint.mjs` prints `lint: clean`; hand-run each command with
  a sample stdin JSON to confirm the router nudges a work-request + stays silent on a
  question, and the thread-keeper prints the correct `Next up:` line against this
  mission's own ledger. Felt trial in a real turn.
- **Read budget**: ~350 lines. Suits: `backend` (or main).

### S3 — Beat-enforcer hook

- **Reads**: `shape-memo.md` (the `Stop`-vs-`PreToolUse` placement decision);
  `plugins/agentic-workflow/hooks/hooks.json` (73, whole — the Bash `PreToolUse`
  guardrail L15–35 is the pattern for matching `git commit` / phase-advance on
  `.tool_input.command`; add a new `Stop` event block alongside `SessionEnd` L59–70);
  `tools/lint.mjs` `checkHooks` (L232–254); ledger schema (`.plans/portfolio-commons.state.md`
  offset 1 limit 45 — the `[~]`/unchecked chronicler/reviewer rows to detect).
- **Do**: add the beat-enforcer — a `PreToolUse`/Bash matcher on commit/phase-advance
  and a `Stop` hook — that greps the active ledger for a required-but-unchecked beat
  (chronicler at close, reviewer at checkpoint) and nudges at the overdue moment
  (advisory `exit 0` echo, per the "steer/correct" locked decision — not a hard block).
- **Verify**: lint clean; hand-run against a ledger with an unchecked chronicler beat
  (nudges) and a fully-checked ledger (silent). Felt trial: try to close a session
  with an unchecked beat, confirm the nudge fires.
- **Read budget**: ~350 lines. Suits: `backend` (or main).

**Checkpoint** ends phase 2 — the independent `reviewer` (fresh context) re-runs
`node tools/lint.mjs` and diff-reviews `base..head`, **leading with the security
lens** (hooks run shell on every prompt/tool call and read the ledger: confirm
inputs are quoted, commands fail closed, ledger content is never executed). This is
the felt-validation gate — if nudges are demonstrably ignored under context
pressure, escalate to the human before P3 (kill criterion in `idea.md`).

---

## Phase 3 — `intake` agent (branch: `mission/orchestrator-governance-p3`)

### S4 — Author `intake` agent + router→intake wiring

- **Reads**: `shape-memo.md` (the new-agent-vs-extend decision + `intake`↔`compass`
  coupling); `plugins/agentic-workflow/agents/advisor.md` (43, whole — gate-bound
  judgment-agent shape with a hard NEVER boundary) and `agents/brainstormer.md`
  (the shaping-not-building boundary, grep the frontmatter + boundary lines);
  `plugins/agentic-workflow/commands/next.md` (51, whole — the routing decision tree
  `intake` mirrors: idea→brainstorm, feature→plan→mission, small→fix);
  `tools/lint.mjs` `checkAgents` (L86–100) + `checkCrossRefs` (L127–164 — the reverse
  check requires every agent named in both READMEs + master WORKFLOW.md);
  `plugins/agentic-workflow/hooks/hooks.json` router command (from S2) to make the
  directive and the agent name each other.
- **Do**: author `plugins/agentic-workflow/agents/intake.md` — frontmatter
  `name: intake`, third-person `description` with a hard NEVER (routes + shapes;
  never runs/merges/builds), `tools: Read, Grep, Glob`; body classifies altitude,
  shapes the request, returns the route, and states the orchestrator drives (a
  subagent can't run slash commands). Add the **minimal** cross-ref mentions to keep
  lint green: a `## The agents` row in `plugins/agentic-workflow/README.md` (~L97),
  the agent name in root `README.md` (L32 list), and a §6 role name in master
  `WORKFLOW.md` (grep `## 6. Roles`, add to the role list ~L328). Full role paragraph
  polish is S6.
- **Verify**: `node tools/lint.mjs` prints `lint: clean` (name=filename, tools valid,
  cross-refs resolve both directions); the router directive and `intake` reference
  each other.
- **Read budget**: ~450 lines. Suits: `backend` (or main) — agent-markdown authoring.

**Checkpoint** ends phase 3 — the `reviewer` re-runs lint + diff-reviews the agent
boundary (does it truly never run/merge/build?) and the router→intake wiring.

---

## Phase 4 — `compass` agent + north-star artifact (branch: `mission/orchestrator-governance-p4`)

### S5 — Author `compass` agent + north-star template + shadow-mode §12 notify

- **Reads**: `shape-memo.md` (the north-star schema + location, compass shape,
  notification gating, coupling — the full spec for this session);
  `plugins/agentic-workflow/agents/advisor.md` (43, whole — the gate-bound,
  never-decides boundary to distinguish `compass` from) and `agents/analyst.md`
  (58, whole — the measurement agent `compass` is distinct from);
  `plugins/agentic-workflow/commands/connect.md` (L97–111 — the §12 send record) +
  master `WORKFLOW.md` §12 outbound tiers (grep `## 12`, read ~L625–645 — the Gate/
  Alert/Digest tiers + `[project]` prefix + no-secrets rule the notify path reuses);
  `plugins/agentic-workflow/commands/operate.md` (L1–25 — the strategic-beat context
  `compass` runs at, and what it must NOT duplicate); `tools/lint.mjs` `checkCrossRefs`
  (L127–164) + `checkTemplateRefs` (L167–176 — a `templates/<file>` reference must
  resolve).
- **Do**: (1) create the north-star/charter template at
  `plugins/agentic-workflow/templates/north-star.md` (schema per the memo: purpose,
  definition of "worthy progress", live done-vs-roadmap); (2) author
  `plugins/agentic-workflow/agents/compass.md` — `tools: Read, Grep, Glob` (shadow
  mode does not send, so no Bash/WebFetch yet), third-person `description` with a hard
  NEVER (holds direction + flags; never decides/kills/builds/merges), body that runs
  at strategic beats, evaluates trajectory-vs-purpose, and **FLAGS drift in its return
  in shadow mode — does not fire §12**, documenting the §12 path it will use once
  promoted (reusing connect.md's send, `[project]` prefix, no secrets). Add the
  minimal cross-ref mentions (both READMEs + master WORKFLOW §6) to keep lint green.
- **Verify**: `node tools/lint.mjs` prints `lint: clean` (agent frontmatter, cross-
  refs, the `templates/north-star.md` reference resolves); the agent body states
  shadow mode explicitly and names `advisor`/`analyst` as distinct.
- **Read budget**: ~500 lines. Suits: `backend` (or main) — agent-markdown authoring.

**Checkpoint** ends phase 4 — the `reviewer` re-runs lint, checks the boundary
(never decides/kills), confirms **shadow mode** (no live send fires), and applies a
**security lens** to the documented §12 notify path (no secrets in transcript, owner-
only direction per §12).

---

## Phase 5 — Docs + eval + version (branch: `mission/orchestrator-governance-p5`)

### S6 — WORKFLOW/README polish, version bump, governance eval, sync

- **Reads**: master `WORKFLOW.md` — grep the anchors and range-read only: `## 3.`
  guardrail table (~L183–204, add three hook rows), `## 4.` session lifecycle
  (~L205–228, any amendment), `## 6. Roles` (~L292–413, add the two full role
  paragraphs for `intake`/`compass` mirroring `advisor`/`brainstormer`);
  `plugins/agentic-workflow/README.md` (agent table L78–97, hooks note L185–191);
  root `README.md` (L32 agent list, L33 command list); `CHANGELOG.md` (L1–20 —
  `[Unreleased]` head); `plugins/agentic-workflow/.claude-plugin/plugin.json` (11,
  whole — version + count in description); an existing eval scenario as the shape:
  `evals/scenarios/routing-altitude/` (`scenario.md`, `checks.mjs`, `rubric.md`) and
  `reviewer-checkpoint/setup.sh` (the fixture-planting pattern);
  `plugins/agentic-workflow/commands/sync.md` (grep for the master→docs propagation).
- **Do**: (1) finish master `WORKFLOW.md` — §3 rows for router/thread-keeper/beat-
  enforcer, §4 amendment, the two §6 role paragraphs; (2) both READMEs — full agent
  rows + hooks note + any count (README says "17 agents"/plugin count → bump to
  reflect +2); (3) `plugin.json` 1.38.0 → 1.39.0; (4) `CHANGELOG.md` `[Unreleased]`
  entry; (5) a governance eval scenario under `evals/scenarios/` (per the (a) scope
  answer — default: plain-request-routed + forgotten-chronicler-caught), mirroring
  the existing scenario file shape; (6) run `/agentic-workflow:sync` ONCE to
  propagate master `WORKFLOW.md` → `docs/WORKFLOW.md`.
- **Verify**: `node tools/lint.mjs` prints `lint: clean` (cross-refs, § integrity,
  `checkObfuscation`); the new eval scenario runs green; `git diff` shows version +
  changelog + docs updated and `docs/WORKFLOW.md` re-synced.
- **Read budget**: ~700 lines (grep-first on the 839-line master). Suits: `backend`
  (or main); reviewer at the checkpoint.

**Checkpoint** ends phase 5 — the `reviewer` (fresh context) re-runs lint + the eval
suite, diff-reviews `base..head`, confirms the sync landed, and returns APPROVE /
REQUEST CHANGES with a scorecard. Mission-end wrap (single PR, human merge) follows
the gate policy in the ledger.

---
_Size every brief to its read budget; split any that can't fit and note the split.
Each session's outcome and any deviation lands in
`.plans/orchestrator-governance.state.md`, never only in chat._
