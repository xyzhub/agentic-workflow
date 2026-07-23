# Mission: orchestrator-governance — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
before ending a session. Deploys to `.plans/orchestrator-governance.state.md`._

Gate policy: **human-merge** (the recorded default) — pause for the human to merge
each phase branch on APPROVE. Mission started: **2026-07-23**.

> **Confirm at mission start (open question a1):** the owner used the
> *stacked-phases, one-merge-at-end* variant last mission (portfolio-commons,
> 2026-07-18) and it is the likely choice here — five small phases editing shared
> files (hooks.json, WORKFLOW master) merge cleanly as one end-of-mission PR, with
> `/agentic-workflow:sync` run once. The default above stands until the human confirms.

## Checklist

_All unchecked at start. Checked only when the work is verified, not merely written._

- [x] S1 — Architect shape memo (branch `mission/orchestrator-governance-p1`)
- [ ] Checkpoint — phase 1: human locks the shape; record locked decisions in the master plan
- [x] S2 — Router + thread-keeper hooks (branch `mission/orchestrator-governance-p2`)
- [x] S3 — Beat-enforcer hook (branch `mission/orchestrator-governance-p2`)
- [ ] Checkpoint — phase 2 review (security-lens-forward) + **felt-validation gate**
- [x] S4 — `intake` agent + router→intake wiring (branch `mission/orchestrator-governance-p3`)
- [ ] Checkpoint — phase 3 review + merge per gate policy
- [x] S5 — `compass` agent + north-star template + **LIVE** gated §12 notify (branch `mission/orchestrator-governance-p4`)
- [ ] Checkpoint — phase 4 review (LIVE §12 + security lens on notify path)
- [x] S6 — Docs + version bump + governance eval (sync deferred to post-release) (branch `mission/orchestrator-governance-p5`)
- [ ] Checkpoint — phase 5 review + eval green; mission-end wrap per gate policy

## Open questions

_Mirrored from the master plan. (a) blocks execution — resolve before S1 ends /
before P2. (b) are the scope of the S1 architect memo; the human locks from the
memo's recommendations at the phase-1 checkpoint._

**(a) For the human — scope / policy:**
- a1 — Gate policy: human-merge (default) vs stacked-one-merge (last mission's
  variant). **Recommendation:** confirm stacked-one-merge.
- a2 — Governance eval scope. **Recommendation:** two scenarios —
  plain-request-routed + forgotten-chronicler-caught.
- a3 — P1 memo review depth (human alone vs `/agentic-workflow:counsel`).
  **Recommendation:** human alone (tactical shaping, not a go/no-go gate).

**(b) For the S1 architect memo — technical:** drift-signatures + router
work-request-vs-chat detection; thread-keeper active-ledger selection + next-step/
beat derivation; beat-enforcer `Stop`-vs-`PreToolUse` placement; north-star artifact
location + schema; `intake` new-agent-vs-extend; `compass` standalone-vs-extend;
compass notification gating; `intake`↔`compass` coupling.

## Deviations

_Any departure from a brief — logged here the moment it happens, with why._

(none)

## Handoff log (newest first)

- **2026-07-23 · Phase-4 checkpoint (reviewer, security lens)** — **APPROVE**
  (Security 3/3 · Architecture 2/3 · DX 2/3 · QA 3/3). LIVE §12 compass safe: token by
  env-NAME only (`curl -sS`, no value in transcript), drift text `jq --arg` data-quoted,
  owner-only, fail-safe; gating strict ("can't name the drift + cheapest fix → don't
  send"); boundary airtight. **Finding-1 FIXED in-phase**: added `Write, Edit` to compass
  (maintains its own north-star.md record, chronicler-style; never edits product code) +
  boundary clarified; lint clean. **Finding-2 → S6**: master §9 catalog omits `intake`,
  `compass`, and `north-star.md` (template currently orphaned — S6 wires + catalogs it).
  Finding-3 (stale "shadow mode" line) fixed. No merge (stacked).

- **2026-07-23 · Phase-3 checkpoint (reviewer)** — **APPROVE** (Architecture 3/3 ·
  DX 3/3 · QA 3/3). `intake` boundary airtight & structurally enforced (`tools: Read,
  Grep, Glob` → cannot run/spawn/build/merge); routing mirrors `/next`; work-vs-chat
  gate first-class; router forward-ref (P2 finding-1) resolved; lint clean. No merge (stacked).

- **2026-07-23 · Phase-2 checkpoint (reviewer, security lens)** — **APPROVE**
  (Security 3/3 · DX 2/3 · QA 3/3). Injected `; rm -rf`/backticks/`&` in prompt AND
  ledger rows → all echoed inert; every hook exits 0, silent off-workflow; lint clean;
  all 6 behaviors re-run to spec. **Tuning backlog (non-blocking):** (1) router names
  `intake` before it ships — S4 resolves; (2) beat regex bare `review` over-matches —
  tighten in P5; (3) thread-keeper every-turn banner = heed-ability risk (wallpaper) —
  if felt noisy, dedupe-when-unchanged / work-request-turns only (P5 tuning, not redesign).
  Stacked policy — no merge now.

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs. Newest on top; crash-safe by write-ahead._

- **S6 (2026-07-23, backend)** — Final docs/version/eval pass. **Master `WORKFLOW.md`:**
  §3 → three governance-hook rows (router / thread-keeper / beat-enforcer, all advisory,
  never-block); §4 → a "Reflex backstops" amendment (thread-keeper + beat-enforcer keep a
  session on-protocol, steer never block); §6 intake/compass role paragraphs confirmed
  already full from S4/S5 (left as-is); **§9 catalog (P4 finding-2 fix)** → added `intake`
  + `compass` to the agent list AND `north-star.md` to the template catalog. **North-star
  wiring (finding-2 orphan fix):** `compass.md` now seeds `docs/product/north-star.md` from
  `${CLAUDE_PLUGIN_ROOT}/templates/north-star.md` on first run (Purpose left human-owned) —
  gives compass its create path and resolves the template ref. **READMEs:** plugin header
  count **17 agents/25 commands → 20/26** (measured: 20 `agents/*.md`, 26 `commands/*.md`);
  governance-hooks note added to the plugin Guardrails section; intake/compass agent rows +
  root agent/command lists already present from S4/S5. **`plugin.json`:** 1.38.0 → **1.39.0**.
  **`CHANGELOG.md`:** `[Unreleased]` `### Added` "Orchestrator governance" entry (3 hooks +
  intake + compass + north-star template). **Governance eval (AUTHORED, NOT RUN):**
  `evals/scenarios/plain-request-routing/` (scenario.md + rubric.md + checks.mjs + fixture
  with a stub `docs/WORKFLOW.md`), registered in `evals/README.md`'s table — a plain
  un-prefixed work request must be routed via the protocol, not silently built on main; run
  deferred to pre-release (~$1–5, background-flaky). **`/agentic-workflow:sync` NOT run** —
  installed plugin is 1.38.0, so sync would pull a stale master over `docs/WORKFLOW.md` and
  drop these v1.39.0 edits; docs sync is a **post-release step** (after 1.39.0 installs),
  same as portfolio-commons. Verify: `node tools/lint.mjs` → **`lint: clean`** (cross-refs
  both ways, § integrity, obfuscation, `templates/north-star.md` resolves); `node --check
  evals/.../checks.mjs` OK; `docs/WORKFLOW.md` NOT hand-edited. Branch:
  `mission/orchestrator-governance-p5`. Next: the phase-5 checkpoint (reviewer, fresh
  context).
- **S5 (2026-07-23, backend)** — Authored `plugins/agentic-workflow/templates/north-star.md`
  + `plugins/agentic-workflow/agents/compass.md`. **North-star schema (D5):** Purpose
  (human-owned, stable end-goal) + Definition of worthy progress (advances-vs-anti-goals
  criteria `compass` judges against) + live done-vs-roadmap rollup (shipped / in flight /
  next / cut) `compass` maintains; points at `idea.md`/PRD for the "what", the ledger for
  tactical state — seeded into a project as `docs/product/north-star.md`. **Compass:**
  frontmatter `name: compass`, `tools: Read, Grep, Glob, **Bash**` (Bash required — LIVE
  mode actually sends), third-person trigger-oriented description with a hard NEVER (holds
  direction + flags + notifies; never decides/kills/builds/migrates/merges — purpose is the
  human's call). **Beats:** new `intake` request / phase-end / periodic `/operate` sweep /
  on demand (never per-step). **Judgment:** reads north-star + ledger + trajectory → does
  the work advance the Purpose by the worthy-progress definition; refreshes the rollup.
  **⚠ D7-override applied — LIVE, not shadow:** per the master-plan locked decision the
  human chose live §12 from day one over the brief's shadow wording; `compass` actually
  SENDS. **Gating (the mitigation, load-bearing):** Alert-tier only (never Gate/Digest);
  severity bar (fire only on a concrete NAMED misalignment + reason + cheapest correction —
  no vague unease); frequency limit (dedupe one alert per distinct drift per phase, ≤1–2 per
  beat) — so it doesn't cry wolf / get muted. **Secrets by NAME only:** send reuses
  `/agentic-workflow:connect`'s transport (curl Slack `chat.postMessage`, `$SLACK_BOT_TOKEN`
  → `$SLACK_OWNER_DM`, `[project]` prefix, owner-only §12 direction), token read from env,
  value NEVER echoed; best-effort side effect (failed send logged, never blocks). **Boundary
  + distinction:** distinct from `advisor` (red-teams one pending decision) and `analyst`
  (measures numbers); D8 coupling — independent of `intake`, a new request is a beat it
  reacts to in parallel, never a hard gate. **Cross-refs (minimal, lint-valid; full role
  polish is S6):** plugin `README.md` agent-table row, root `README.md` agents list, master
  `WORKFLOW.md` §6 Compass paragraph; `templates/north-star.md` resolves via
  `checkTemplateRefs`. Verify: `node tools/lint.mjs` → `lint: clean` (name=filename; tools
  valid; `compass` named in both READMEs + WORKFLOW §6; template ref resolves). Did NOT
  touch hooks.json / intake. Branch: `mission/orchestrator-governance-p4`. Next: the phase-4
  checkpoint (reviewer, security lens on the LIVE notify path) → P5/S6.
- **S4 (2026-07-23, backend)** — Authored `plugins/agentic-workflow/agents/intake.md`
  (D6: new agent, logic mirrored from `/next`; D8: `intake`↔`compass` independent — no
  compass coupling). Frontmatter: `name: intake`, `tools: Read, Grep, Glob` (no
  Task/Write/Edit — reads + recommends only), third-person trigger-oriented description
  with a hard **NEVER** boundary. **Shape:** takes an un-invoked plain-language request →
  first decides work-vs-chat (never command-ifies chat) → classifies altitude mirroring
  `/next`'s tree (raw idea → `/agentic-workflow:brainstorm`; defined feature →
  `/agentic-workflow:plan` → `/agentic-workflow:mission`; small isolated → `/agentic-workflow:fix`;
  unsure → `/agentic-workflow:next`) → shapes a crisp problem statement → **returns** the
  route (one command + one-line why + shaped request) in a bounded ≤15-line §6.2 form,
  explicitly stating the ORCHESTRATOR executes it. **Hard NEVER:** never runs slash
  commands, spawns agents, builds/edits/migrates, or merges (a subagent can't invoke
  commands — the orchestrator drives). **Cross-refs (minimal, lint-valid; full role
  polish is S6):** plugin `README.md` agents table row, root `README.md` agents list,
  master `WORKFLOW.md` §6 Intake paragraph. **Resolves P2 reviewer finding 1** — the S2
  router hook's "hand a feature request to the intake agent" now points at a real agent
  (hook wording unchanged, confirmed still matches). Verify: `node tools/lint.mjs` →
  `lint: clean` (name=filename; tools known; `intake` named in both READMEs + WORKFLOW;
  forward `/agentic-workflow:*` refs resolve). Did NOT touch hooks.json / build compass /
  north-star. Branch: `mission/orchestrator-governance-p3`. Next: phase-3 checkpoint
  (reviewer, boundary check) → P4/S5.
- **S3 (2026-07-23, backend)** — Added the beat-enforcer (D4, both, soft-first) to
  `plugins/agentic-workflow/hooks/hooks.json`: a new `PreToolUse`/`Bash` block +
  a new top-level `Stop` event block (alongside `SessionEnd`). **Trigger:** the
  active ledger = newest-mtime `.plans/*.state.md` with an open `[ ]`/`[~]` row
  (thread-keeper idiom); a *required-but-unchecked beat* = a `[ ]`/`[~]` row whose
  text matches `checkpoint|chronicler|reviewer|review`. **PreToolUse:** fires only on
  a closing/advancing command (`git commit` / `gh pr create` / `gh pr merge`, via
  `.tool_input.command` `case`) → echoes `⏳ Beat pending — <ledger> … spawn it before
  you close/advance:` + the offending row. **Stop:** on turn-end, injects the same
  reminder non-blocking via `hookSpecificOutput.additionalContext` (jq-built, so
  ledger text is JSON-escaped, never executed). **Both `exit 0` — NEVER `exit 2`**
  (locked D4 soft-first). Silent when no `.plans/` or no active ledger; ledger text
  is only grepped/echoed/`jq`-escaped, never executed; all expansions quoted; regex
  brackets JSON-escaped (`\\[`). Verify: `node tools/lint.mjs` → `lint: clean` (both
  new commands pass `bash -n`; JSON valid). Hand-run (exact deployed strings via
  `jq`): PreToolUse — fixture with unchecked `[ ] Checkpoint`/`[~] chronicler` +
  `{"tool_input":{"command":"git commit -m x"}}` → NUDGES (prints the Checkpoint row);
  fully-`[x]` fixture → silent; non-closing cmd (`ls`) → silent. Stop — unchecked
  fixture → emits the `additionalContext` JSON; fully-`[x]` fixture → silent. S2
  router + thread-keeper re-run against this repo → still fire unchanged (no regression).
  Branch: `mission/orchestrator-governance-p2`. Next: the phase-2 reviewer checkpoint
  (security lens) — the felt-validation gate.
- **S2 (2026-07-23, backend)** — Added two `UserPromptSubmit` hooks to
  `plugins/agentic-workflow/hooks/hooks.json` (D2 router + D3 thread-keeper).
  **Router:** reads the prompt via `INPUT=$(cat) | jq -r '.prompt'`; injects a SOFT
  route-via-the-workflow directive on an un-prefixed work request (leading/word-boundary
  work verb: add|build|implement|fix|refactor|…). Scoping guards — silent if the prompt
  starts with `/`, if it leads with an interrogative (what/how/why/is/do/… or a
  thanks/tell me/show me), or if the cwd is not a workflow project (no `docs/WORKFLOW.md`
  and no `.plans/`). Never `exit 2` (stdout-inject only). **Thread-keeper:** picks the
  newest-mtime `.plans/*.state.md` that still has a `[ ]`/`[~]` row and injects
  `🧵 Active thread — <file>` + the `Next up:` line + the first open beat; silent when
  no `.plans/` or no active ledger. Both treat prompt/ledger text as untrusted data —
  only ever piped through `jq`/`grep`/`case`, never executed; no `eval`; all expansions
  quoted; regex brackets JSON-double-escaped (`\\[`). Verify: `node tools/lint.mjs` →
  `lint: clean` (each command passes `bash -n`). Hand-runs (exact deployed strings via
  `jq`): router — `{"prompt":"add rate limiting to the API"}` → nudges;
  `{"prompt":"what does this file do?"}` → silent; `{"prompt":"/agentic-workflow:next"}`
  → silent; `"how do I add caching here?"` → silent (interrogative guard). Thread-keeper
  — this repo → `🧵 Active thread — .plans/orchestrator-governance.state.md` + correct
  `Next up:` + first `[ ]` beat; no `.plans/`, all-complete ledger, and non-workflow cwd
  → all silent. Branch: `mission/orchestrator-governance-p2`. Next (S3) adds the
  beat-enforcer (`PreToolUse`-on-commit echo + non-blocking `Stop`) to the same file.
- **S1 (2026-07-23, architect)** — Authored `docs/product/features/orchestrator-governance/shape-memo.md`
  answering all eight (b) questions: (1) drift-signatures — hooks catch the crisp
  ones, semantic/history drift → `intake`; (2) router — keyword prefilter gates a
  *soft* route-if-work directive, never `exit 2`; (3) thread-keeper — newest-mtime
  non-complete ledger (branch tie-break), inject `Next up:` + first `[ ]`/`[~]`
  row; (4) beat-enforcer — both, soft-first (`PreToolUse`-on-commit echo +
  non-blocking `Stop` `additionalContext`); (5) north-star — `docs/product/north-star.md`
  from a new template, Purpose/worthy-progress/done-vs-roadmap; (6) `intake` — new
  agent, logic mirrored from `/next`; (7) `compass` — standalone, `/operate` also
  calls, Alert-tier + shadow-mode-first; (8) coupling — independent now, advisory
  later, never a hard gate. Verify: memo covers all 8 w/ options + reversal cost;
  `node tools/lint.mjs` clean. Branch: `mission/orchestrator-governance-p1`. Next
  session (S2) builds the router + thread-keeper hooks from the locked choices.

Next up: **the phase-5 checkpoint** — the independent `reviewer` (fresh context)
re-runs `node tools/lint.mjs` (expect `lint: clean`) and diff-reviews
`base..head` for phase 5: the master `WORKFLOW.md` §3 governance rows + §4 reflex
amendment + §9 catalog additions (intake/compass/north-star.md), the north-star
first-run seed wiring in `compass.md`, the README count bump (20 agents/26
commands) + governance-hooks note, `plugin.json` 1.39.0, the CHANGELOG entry, and
the authored `evals/scenarios/plain-request-routing/` (confirm `node --check`
passes; the **actual eval run is deferred to pre-release**, not this checkpoint).
Confirm `docs/WORKFLOW.md` was NOT hand-edited (the **`/agentic-workflow:sync` is a
post-release step** after 1.39.0 installs — noted, deliberately deferred). On
APPROVE → **mission-end wrap**: a single PR `feat/orchestrator-governance → main`,
human merge (gate policy: human-merge / stacked-one-merge); then, post-release,
run `/agentic-workflow:sync` once and the deferred eval run.
