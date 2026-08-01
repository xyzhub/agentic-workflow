# Feature brief — Orchestrator context economy

_Date: 2026-08-01 · Front door: `/agentic-workflow:plan` · Red-team: Opus 5 context-architecture expert (counsel served — see "Case against")_

## Problem

The main orchestrator over-consumes tokens and **auto-compacts on long sessions**, losing fidelity. The owner wants the orchestrator to work from a **fresh context with everything written to files**.

**Measured baseline** (`/context`, during the 9-session `sales-doc-architecture` mission run in ONE continuous context):

| Category | Tokens | Share |
|---|---|---|
| **Messages (the transcript)** | **377.4k** | **94% of consumption** |
| Skills | 9.9k | 2.5% |
| Custom agents | 8.1k | 2.0% |
| System prompt + tools | 7.0k | 1.7% |
| Memory files | 1.8k | 0.4% |
| _Total_ | _401.4k / 1M (40%)_ | |

The overhead categories are noise. **The transcript is the entire problem.**

## What the expert falsified (do not rebuild these)

1. **"One unit per context" as a mission default — the mechanism does not exist.** Ending a turn does NOT reset the window; the next message continues the same transcript. `/loop` is **session-scoped** ("runs while the session stays open"; ticks land "between your turns"), so loop ticks accrete exactly like normal turns. Fresh context requires `/clear`, a new session, or scripted `claude -p`. **→ dropped from scope.**
2. **Tightening the orchestrator's read budget** — duplicates the existing §6.2 30% rule and misses writes entirely. **→ dropped from scope.**
3. **The diagnosis was half-wrong.** ~20 subagent distillates × ≤15 lines ≈ **8k ≈ 2% of 377k** — the §6.2 bounded-return firewall is working; distillates are NOT the leak. The unexamined term is **orchestrator-authored writes** (a `Write` of a 300-line template costs the same as reading it; this mission authored templates, ledger edits, PR bodies, changelog entries). **Suspicion, not measurement** — hence D1.

## Verified platform constraints (checked against official docs, not memory)

- **`PreCompact` exists**, matchers `auto` | `manual`; payload is common-only (`session_id`, `prompt_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`); it **can block** (exit 2).
- **Hooks are shell commands — they cannot author a handoff manifest** (that needs an LLM turn). They can only write deterministic breadcrumbs.
- **No hook event or field exposes context size / token usage.** The only proxy is `wc -c "$transcript_path"`.
- **`PostCompact` is side-effect only — it cannot inject `additionalContext`.** The post-compaction injection point is **`SessionStart` matcher `compact`**.
- **Never block `auto` compaction** (the window is already full — blocking wedges the session). Block only `manual`, if ever.

## Interview — locked decisions (2026-08-01)

- **D1 — Measure, then RE-SCOPE.** Phase 0 builds the attribution script and reports the real split; the mission then **PAUSES** for the human to confirm or adjust the remaining phases against actual numbers. ("Shaping past the measurement is guessing.")
- **D2 — Standing steers: IN, checkpoints only.** The orchestrator appends human steers **verbatim** to a `## Standing steers` ledger block **at checkpoints only, never mid-brief**; the resume path re-reads it. Rationale: file-state already preserves *decisions*, but loses *taste* — the small corrections that never earn a ledger line.
- **D3 — Priority: top of backlog. Gate policy: batch** (phases merge into `mission/<name>-integration`; human merges once at the end). Independent reviewer per phase; **strict checkpoint on the hook phase**.
- **D4 — Done = MEASURED REDUCTION.** Not "mechanisms in place" — re-running the attribution script on a comparable later mission must show the dominant term materially reduced against the 377.4k baseline.
- **D5 — Process adaptation.** The Opus 5 expert served as counsel/red-team (it falsified two proposed items); advisors are NOT re-spawned. `designer` is skipped (no user-facing surface — the "journey" is the orchestrator's own operating loop). `architect` + `analyst` draft in parallel.

## Scope

**In v1 (order matters — Phase 0 gates the rest):**
0. **Attribution script** — from `transcript_path` JSONL, attribute tokens across `{human steers, orchestrator-authored prose, Write/Edit tool inputs, tool results, subagent returns}`. Report the split. **→ PAUSE for re-scope.**
1. **Write firewall** — generalize bounded returns to *writes*: every subagent (reviewer first) **writes its artifact to a file** (e.g. `.plans/<mission>.reviews/<phase>.md`) and returns ≤15 lines **including the path**; the orchestrator **never authors long documents itself** — a writer subagent does. Contract change, no code.
2. **Hook pair** — `PreCompact` matcher `auto` writes a deterministic breadcrumb (ledger path, branch, transcript path, timestamp); `SessionStart` matcher `compact` injects "re-read the ledger + `session-handoff.md` before continuing." Never blocks. Covered by `tools/hook-test.mjs`.
3. **Standing-steers block** (D2) — ledger convention + the orchestrator/mission contract for appending at checkpoints and re-reading on resume.
4. **Doc-defect fix** — the claim **"fresh context per tick" is FALSE as written** in `commands/mission.md:96-97`, `commands/autopilot.md:31-33`, `README.md:220-224`, `templates/WORKFLOW.md:28-29`. Correct them to state the real mechanism (`/clear`, a new session, or scripted `claude -p`).

**NOT in v1 (deferred ≠ denied):** "one unit per context" as a default (no mechanism); read-budget tightening (duplicates the 30% rule); any attempt to read context size from a hook (not exposed); blocking auto-compaction (harmful).

## Acceptance criteria

- **Measurement**: the script runs on a real transcript and produces a defensible per-category token split; the 377.4k baseline is recorded; **the mission pauses for re-scope with that number in hand** (D1).
- **Write firewall**: the `reviewer` (and other artifact-producing agents) write to a path and return ≤15 lines incl. the path; the orchestrator contract forbids authoring long documents; verified on a real phase.
- **Hooks**: `PreCompact:auto` writes the breadcrumb; `SessionStart:compact` injects the re-read directive; neither blocks; both covered by `tools/hook-test.mjs` cases; `node tools/lint.mjs` green.
- **Standing steers**: appended verbatim at checkpoints only (never mid-brief); re-read on resume.
- **Docs**: no surviving claim that a loop tick or turn-end yields fresh context; the true mechanism stated.
- **D4**: a re-measurement on a later comparable mission shows the dominant term materially reduced vs. 377.4k.

## Case against (Opus 5 expert — the strongest objection, recorded)

> File-backed statelessness re-pays the ledger+brief read every tick and loses the cross-phase judgment that made the last session coherent — and if the 377k turns out to be dominated by **human steering and orchestrator-authored prose**, all items address well under a third of the consumption while adding ceremony to every checkpoint. You'd have made the tool slower and no cheaper.

**Mitigation:** D1 (measure-then-re-scope) exists precisely to falsify this before the expensive phases run. Verdict: **proceed-with-changes**.

## Open shape decisions → `architect` option memos

- **SD1 — Attribution script**: language/home (`tools/*.mjs` zero-dep, matching `hook-test.mjs`/`marker-test.mjs`?), how to attribute tokens per JSONL message (usage fields vs. estimation), and the category taxonomy. Is it a one-shot analysis tool or a repeatable gate?
- **SD2 — Write-firewall contract shape**: where artifacts live (`.plans/<mission>.reviews/` vs. a general `.plans/<mission>.artifacts/`), the ≤15-line return format incl. path, and how "the orchestrator never authors long documents" is stated so it's enforceable (which agent writes CHANGELOG/PR bodies/templates instead — `writer`? `chronicler`?).
- **SD3 — Hook breadcrumb format + resume contract**: what the `PreCompact:auto` breadcrumb file contains and where it lives; exactly what `SessionStart:compact` injects; how `tools/hook-test.mjs` dispatch-tests a `SessionStart` hook (new event for the harness).
- **SD4 — Standing-steers mechanics**: ledger block format, what qualifies as a "steer" worth appending (verbatim vs. paraphrase), who appends (orchestrator vs. chronicler), and how mid-brief capture is structurally prevented.
- **SD5 — Phasing** honoring the D1 pause gate and isolating the hook phase for its strict checkpoint.

## Measured evidence (architect prototype against real transcripts — 2026-08-01)

Indicative occupancy split, one 8.4 MB session (**not** the official baseline — Phase 0 produces that):

| Category | Share |
|---|---|
| tool results | 25.1% |
| **authored: Write/Edit inputs (orchestrator)** | **22.5%** ← the firewall's target |
| attach: skill_listing | 16.0% ← free lever, no engineering |
| orchestrator prose | 12.6% |
| authored: Bash commands | 10.7% |
| attach: hook_success (stdout) | 4.3% |
| **human steers** | **1.7%** |
| **subagent returns** | **0.4%** |

**Implications:** confirms the write-firewall hypothesis; **falsifies the expert's main objection** (human steering is ~2%, not "a third"); the four in-scope items address ~**25%** of consumption.

**Four measured landmines the Phase-0 script MUST handle** (each produces fake numbers otherwise):
1. `usage` is per API call and repeated verbatim on every JSONL line of that response — **dedup by `requestId`** or over-count ~2.5×.
2. **Thinking text is not persisted** — ~61–66% of output tokens have no attributable text. Print an **UNATTRIBUTED residual**; never redistribute it across categories.
3. No per-message input attribution — input-side categories are estimated.
4. The transcript **self-calibrates**: prompt-delta ÷ chars-appended ≈ **2.0 chars/token** (the `/4` rule is ~2× wrong for this workload). Calibrate per transcript.
Taxonomy facts: the spawn tool is **`Agent`**, not `Task`; `isSidechain` is 0 (subagent internals cost the orchestrator nothing); **`attachment` records are a large missing category** and must be sized on the *injected* field (`stdout`/`content`), not the record.

## Locked shape decisions (2026-08-01 — architect + Opus 5 recommendations, human-approved)

- **D6 — Doc-defect fix moves BEFORE the measurement pause.** It is a truth correction with settled content and zero risk; holding a known falsehood behind an unrelated gate buys nothing.
- **D7 — Reviewer untouched in v1 (SD2 Option C).** The reviewer **cannot** contribute to the 22.5% — it has no Write tool; that 22.5% is the orchestrator's own writes. Granting Write would buy a slice of the 0.4% subagent-return line while spending the fleet's only structural guarantee (`reviewer.md:4` is what makes `:96` fail-closed *by shape*; no hook can restore it — `PreToolUse` carries no agent identity). Option B is **strictly worse**: routing the report through `chronicler` makes it transit the orchestrator inbound AND outbound as the invocation prompt, doubling the cost it claims to cut, and contradicts `chronicler.md:26-27`. **v1 firewall therefore targets only what needs no permission change:** templates → the phase's implementing agent (already has Write); CHANGELOG + PR bodies → `chronicler` (already its contract per `chronicler.md:29` — enforcement, not invention). *Accepted cost:* verdicts keep transiting the orchestrator; the firewall ships without touching its named first target. **Reopen if** per-agent attribution shows `reviewer` returns >3%.
- **D8 — Hook pair = stateless directive (SD3 Option A).** `SessionStart` matcher `compact` injects a fixed ≤6-line directive naming the active ledger (via the beat-enforcer's existing `ls -t` selection): "you were just compacted — re-read `<ledger>` + `session-handoff.md` verbatim; honor `## Standing steers`." **No breadcrumb file**, no freshness guard, no gitignore entry, no `hook-test.mjs` extension. Rationale: all 7 breadcrumb fields are derivable by the resuming agent in one command, so Option B's unique payload is *forensic*, not resume-critical — not worth state + a staleness failure mode for an event with n=1. Matcher must be `compact` alone (never `startup`/`resume`). **Promote to Option B if** a wrong-ledger/wrong-branch post-compact resume is ever recorded, or `isCompactSummary` transcripts reach ≥3.
- **D9 — Phase 0 MUST emit per-`subagent_type` attribution of `Agent` result blocks.** An unresolved contradiction: 8 reviews × 60–100 lines ≈ 10k ≈ **2.7%** cannot coexist with "all subagent returns = 0.4%". One number is wrong, and if it is the 0.4% then the "§6.2 firewall is already working" premise under D1 is unsound. One flag on the script; no permission change. This is a **required Phase-0 output**, and its result feeds the D7 reopen test.

**Value restated honestly (Opus 5):** 22.5% is a **ceiling, not a win** — routing a 300-line template to an implementing agent moves the *content* out but the *spec* still transits. Realistic capture ≈ **10–15% (~40–55k tokens on the 377.4k baseline — roughly one phase of headroom)**, from a contract change with no code. The doc-defect fix earns its place on **truthfulness alone**, independent of the token math.

**Free lever, out of mission scope (surface at the D1 pause):** `skill_listing` injections are **16.0%** — the installed skills catalog re-injected ~8× per session. Trimming installed skills reduces it with **zero engineering**. Likewise `tool results` (25.1%) is untouched by any phase — it belongs to read/delegation discipline (WORKFLOW §2/§6.2), not this mission. Both go in front of the human at the pause so the mission is not judged for failing to move terms it never aimed at.
