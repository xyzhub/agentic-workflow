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
- [ ] S4 — `intake` agent + router→intake wiring (branch `mission/orchestrator-governance-p3`)
- [ ] Checkpoint — phase 3 review + merge per gate policy
- [ ] S5 — `compass` agent + north-star template + shadow-mode §12 notify (branch `mission/orchestrator-governance-p4`)
- [ ] Checkpoint — phase 4 review (shadow mode + security lens on notify path)
- [ ] S6 — Docs + version bump + governance eval + sync (branch `mission/orchestrator-governance-p5`)
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

Next up: **the phase-2 checkpoint** — the independent `reviewer` (fresh context,
**security lens forward**) re-runs `node tools/lint.mjs` and diff-reviews `base..head`
of the three P2 hooks (router, thread-keeper, beat-enforcer): confirm inputs are
quoted, commands fail closed / never `exit 2` where soft-nudge is locked, and ledger/
prompt text is never executed. This is the **felt-validation gate** — if the nudges
are demonstrably ignored under context pressure, escalate to the human before P3.
On APPROVE → P3/S4 (`intake` agent + router→intake wiring).
