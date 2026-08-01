---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: context-economy — session briefs

_The execution view: one brief per session, each pre-resolved so an execution session
never explores. The expensive exploration happened once, here (2026-08-01)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/context-economy.md` · Ledger: `.plans/context-economy.state.md`
Source brief (background, read only if a brief points you at it):
`docs/product/decisions/2026-08-01-orchestrator-context-economy-brief.md` (111 lines).

> **⚠️ TRANSCRIPT RULE — every session, no exceptions.** Never read a transcript
> JSONL into context. They are 3–12 MB. Stream them (`node:readline`), or inspect
> with `head -c 400 <file> | jq …`, `grep -c`, `wc -l`. A single `Read` of one of
> these files ends the session's usefulness — and would be a self-inflicted instance
> of the exact problem this mission exists to fix.

> **Gate for every session:** `node tools/lint.mjs` (it already spawns
> `tools/hook-test.mjs` and `tools/marker-test.mjs`; from Phase 0b it also spawns
> `tools/context-attrib.mjs --selftest`). Green before you close.
> **Atomic-ref invariant:** a template/tool and every reference to it change in ONE
> commit. Commit format: `context-economy(S<n>): summary` + Co-Authored-By trailer.

## Large-files table

| File | Lines |
|---|---|
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 877 |
| `docs/WORKFLOW.md` (this repo's synced copy, stamp v1.39.0) | 874 |
| `tools/lint.mjs` | 363 |
| `CHANGELOG.md` | 325 |
| `tools/marker-test.mjs` | 274 |
| `plugins/agentic-workflow/README.md` | 250 |
| `plugins/agentic-workflow/commands/autopilot.md` | 169 |
| `tools/hook-test.mjs` | 165 |
| `plugins/agentic-workflow/hooks/hooks.json` | 114 |
| `plugins/agentic-workflow/agents/chronicler.md` | 114 |
| `docs/product/decisions/2026-08-01-…-brief.md` | 111 |
| `plugins/agentic-workflow/commands/mission.md` | 103 |
| `plugins/agentic-workflow/agents/reviewer.md` | 97 |
| `plugins/agentic-workflow/README.md` (root `README.md`) | 59 |
| `plugins/agentic-workflow/agents/writer.md` | 59 |
| `plugins/agentic-workflow/commands/end.md` | 56 |
| `plugins/agentic-workflow/commands/handoff.md` | 53 |
| `plugins/agentic-workflow/hooks/lib/beat-enforcer-stop.sh` | 52 |
| `plugins/agentic-workflow/templates/mission-state.md` | 51 |
| `plugins/agentic-workflow/hooks/lib/beat-enforcer-pretooluse.sh` | 50 |
| `plugins/agentic-workflow/commands/pr.md` | 37 |
| `plugins/agentic-workflow/.claude-plugin/plugin.json` | 11 |

**Baseline transcript** (P0b/P4 only, never Read):
`~/.claude/projects/-Users-baker-Playground-venture-workflow-plugin/2fa752c7-9b89-4313-8729-ec63daee6496.jsonl`
— 11.2 MB / 4,438 lines at 2026-08-01 18:46; append-only, still growing. Verified
field facts (cheap greps, already done — don't redo them blind): 76 `"name":"Agent"`,
82 `subagent_type`, 1,506 lines carrying `requestId`, 484 `"type":"attachment"`,
17 `skill_listing`, **0** `"isSidechain":true`, and it is the **only** transcript in
this project containing `isCompactSummary` (D8 counter = 1).

---

## Phase 0 — truth + measurement (branch: `mission/context-economy-p0`)

_Not parallel-safe (S2 → S3 depend in order; S1 is independent but shares the branch).
Ends with `ckpt-p0`, then the **D1 HARD PAUSE**._

### S1 — doc-defect sweep (task 1; OQ1/OQ2 apply)

- **Reads** (~330 lines):
  - `plugins/agentic-workflow/commands/mission.md` (103, whole) — anchor **L93-97**
    ("Loop mode … Fresh context per tick means the transcript never bloats").
  - `plugins/agentic-workflow/commands/autopilot.md` (169) — ranged **L20-40**, anchor
    **L29-33** ("each tick advances one clean stage boundary in a fresh context …
    better token economics than one long transcript").
  - `plugins/agentic-workflow/README.md` (250) — ranged **L214-228**, anchor
    **L218-224** (`## Loop-drivable by design` → "recurring fresh-context ticks … no
    transcript bloat").
  - `plugins/agentic-workflow/templates/WORKFLOW.md` (877) — three ranged reads:
    **L24-32** (quick-ref "loop-friendly … each tick resumes from files with a fresh
    context"), **L280-292** (§5 `**Loop mode.**` "gives every tick a FRESH context"),
    **L652-663** (§11 "each tick a fresh context").
  - If OQ1 = yes: `docs/WORKFLOW.md` (874) — ranged **L16-24**, **L272-284**,
    **L642-650** (the same three passages, offset ~-8 lines).
  - If OQ2 = yes: `docs/product/launch/announcements/hacker-news.md` **L44-52**,
    `announcements/dev-to.md` **L68-76**, `positioning.md` **L66-74**.
- **Do**: replace each claim with the real mechanism, consistently worded — *a `/loop`
  tick does NOT reset the window (`/loop` is session-scoped; ticks accrete in the same
  transcript); genuine fresh context requires `/clear`, a new session, or a scripted
  `claude -p`. What makes loop mode safe is that state lives in files: any tick can be
  run from a fresh context without losing anything.* Keep the (true) file-backed
  resumability and crash-safety claims. **Do not touch** correct uses: the `reviewer`
  agent's fresh context (WORKFLOW L176, L267, L307; `mission.md:60`; eval rubrics) and
  `commands/handoff.md`'s fresh **session**. Do not touch the `docs/WORKFLOW.md`
  version stamp (line 3).
- **Verify**: `node tools/lint.mjs` green. Then review every hit of
  `grep -rn "fresh context\|fresh-context" --include='*.md' plugins/ docs/ README.md`
  and confirm each surviving hit is either a reviewer/subagent reference, a
  fresh-**session** reference, or the new corrective text. No line may claim a tick or
  turn-end *produces* fresh context.
- **Read budget**: ~330 lines (~450 with OQ1+OQ2). **Suits:** the main session (pure
  protocol-text edit; `writer` is an acceptable alternative).

### S2 — build `tools/context-attrib.mjs` + `--selftest` + lint delegation (tasks 2–5)

- **Reads** (~430 lines):
  - `docs/product/decisions/2026-08-01-orchestrator-context-economy-brief.md` — ranged
    **L78-111** (the evidence table, the four landmines, the taxonomy facts). This is
    the spec; follow it literally.
  - `tools/hook-test.mjs` (165, whole) — the zero-dep house style: throwaway tmpdir
    fixtures, the `check(name, cond, detail)` helper, non-zero exit on failure.
  - `tools/marker-test.mjs` (274) — ranged **L1-60** (header contract + `check` helper)
    and **L230-274** (the self-contained negative checks / exit block); this is the
    pattern for `--selftest` fixture assertions.
  - `tools/lint.mjs` (363) — ranged **L1-30** (helpers), **L312-352**
    (`checkHookBehavior` + `checkMarkerMutation` — the fail-closed delegation pattern to
    copy verbatim in shape), **L354-364** (the check array + exit block).
- **Do**:
  1. Write `tools/context-attrib.mjs` — zero deps, Node ≥18, `#!/usr/bin/env node`.
     Usage: `node tools/context-attrib.mjs <transcript.jsonl>` and
     `node tools/context-attrib.mjs --selftest`. **Stream with `node:readline` over a
     `createReadStream`** — never `readFileSync` a transcript, never print transcript
     content (labels and numbers only).
  2. Categories: `human steers · orchestrator prose · authored: Write/Edit inputs ·
     authored: Bash commands · tool results · subagent returns (Agent result blocks) ·
     attach: skill_listing · attach: hook_success · attach: other · UNATTRIBUTED`.
  3. Landmines, all four: dedup `usage` by `requestId`; print the UNATTRIBUTED residual
     and **never** redistribute it; self-calibrate chars/token per transcript
     (prompt-delta ÷ chars-appended; expect ≈2.0, not 4.0) and print the derived ratio;
     size `attachment` records on the **injected** field (`stdout`/`content`).
  4. **D9**: per-`subagent_type` table for `Agent` tool-use/result blocks (the spawn
     tool is `Agent`, not `Task`), with the `reviewer` row called out (>3% reopens D7).
  5. `--selftest`: build a synthetic ~20-line JSONL in a throwaway tmpdir and assert —
     duplicate-`requestId` usage counted once; category sum + UNATTRIBUTED = total;
     calibration derived (not hardcoded `/4`); attachment sized on the injected field;
     an `Agent` result landing under its `subagent_type`. Print `ok`/`FAIL` per case,
     exit 1 on any failure.
  6. Add `checkContextAttrib()` to `tools/lint.mjs` in the shape of
     `checkMarkerMutation` (lint.mjs:340-352): **fail-closed if the script is missing**,
     otherwise `spawnSync('node', [script, '--selftest'])` and report the failing lines.
     Register it in the check array at **lint.mjs:354**. It must NOT invoke a real
     transcript — CI has none, and silent-skip is forbidden by the established pattern.
- **Verify**: `node tools/context-attrib.mjs --selftest` exits 0 with per-case `ok`
  lines; `node tools/lint.mjs` green; temporarily `mv tools/context-attrib.mjs
  /tmp/…` → lint FAILS with the missing-harness finding → restore and re-run green
  (record this negative check in the handoff).
- **Read budget**: ~430 lines. **Suits:** `backend`.
- **⚠️** Do not test against a real transcript in this session — S3 does that.

### S3 — run the baseline measurement + record the finding (task 6)

- **Reads** (~180 lines): `.plans/context-economy.md` **Phase 0b tasks 2-7 + the
  re-scope inputs section**; the S2 handoff entry in `.plans/context-economy.state.md`;
  `tools/context-attrib.mjs` **usage/CLI header only** (first ~40 lines) if you need
  the flags. **Nothing else.**
- **Do**:
  1. Record the target's size first:
     `wc -l < <transcript>` and `wc -c < <transcript>` (append-only file — the numbers
     are part of the finding).
  2. Run `node tools/context-attrib.mjs <baseline transcript>` (path in the
     large-files table above). It streams; it will not flood context.
  3. Record in the ledger: the full category split (tokens + share), the
     per-`subagent_type` table (D9) with the `reviewer` row, the derived chars/token
     ratio, the UNATTRIBUTED share.
  4. **Sanity check** the script total against the recorded **377.4k** `/context`
     Messages figure. If divergence >15%, log an explicit **script-validity finding**:
     the measurement is not trustworthy for the re-scope decision, and say so at the
     pause rather than presenting the numbers as settled.
  5. Assemble the **pause package** (ledger, one block): split · D9 table · sanity check
     · the two re-scope inputs from the master plan (`skill_listing` ≈16% free lever;
     `tool results` ≈25.1% untouched) · whether the D7 reopen test fired.
- **Verify**: `node tools/lint.mjs` green; the ledger's Phase-0 handoff entry contains
  every item in step 5; `Next up:` set to the **D1 PAUSE** row.
- **Read budget**: ~180 lines. **Suits:** `backend` (measurement/analysis; no code
  changes expected beyond a bug fix if the run exposes one — log any fix as a deviation).

**Checkpoint `ckpt-p0`** ends Phase 0 — independent `reviewer` (fresh context) re-runs
`node tools/lint.mjs`, diff-reviews `main..mission/context-economy-p0`, and checks that
the doc sweep left no surviving false claim and that the script's landmine handling
matches the brief. On APPROVE the orchestrator merges the phase branch into
`mission/context-economy-integration` (batch policy — **never** the default branch).

> ### ⛔ D1 HARD PAUSE — the mission stops here
> Do **not** spawn S4 or any later phase. Surface the pause package to the human and
> wait for an explicit re-scope decision on P1–P4. Resuming is a human act.

---

## Phase 1 — write firewall (branch: `mission/context-economy-p1`)

_Sequential (touches `mission.md` and WORKFLOW §6.2, which Phase 2 also edits nearby).
Runs only after the D1 pause is released._

### S4 — extend the 30% rule to writes (tasks 8–10; OQ3 applies)

- **Reads** (~400 lines):
  - `plugins/agentic-workflow/commands/mission.md` (103, whole) — anchors **L14-16**
    (the 30%-rule clause to extend), **L58-85** (§3 checkpoint, where the gate/merge
    text lives), **L86-91** (§4 record & resume).
  - `plugins/agentic-workflow/templates/WORKFLOW.md` — ranged **L466-495** (§6.2 "The
    context firewall — bounded returns & the fresh-self handoff"; the bounded-return
    paragraph is L475-482).
  - `plugins/agentic-workflow/agents/chronicler.md` (114) — ranged **L1-8**
    (frontmatter/description) and **L28-40** (Artifact 1 — CHANGELOG).
  - `plugins/agentic-workflow/commands/pr.md` (37, whole) — the `gh pr create --fill`
    step that becomes `--body-file`.
  - `plugins/agentic-workflow/agents/reviewer.md` — **L1-6 only**, to confirm the
    `tools:` line is untouched at the end.
- **Do**:
  1. `mission.md:14-16` — extend the clause to writes, verbatim shape: *"Write only the
     ledger, and edits under ~15 lines. Any document longer than that is authored by a
     subagent and returned as a path."*
  2. Establish `.plans/<mission>.artifacts/<phase>-<kind>.md` as the artifact home
     (named in `mission.md` and in WORKFLOW §6.2).
  3. Routing: templates → the phase's implementing agent (already has Write);
     CHANGELOG + PR bodies → `chronicler`; PR bodies are passed as
     `gh pr create --body-file <path>` so the body never transits an
     orchestrator-authored Bash command either. Per OQ3 (if approved), add PR bodies to
     `chronicler.md`'s artifact list + frontmatter description — **no tool change**.
  4. WORKFLOW §6.2 — add the write half of the bounded return: status · **path** ·
     one-line description · verify signal · what the caller does with it. ≤15 lines,
     never the document body.
  5. **D7 hard constraint:** no `tools:` frontmatter line changes anywhere in this diff.
- **Verify**: `node tools/lint.mjs` green;
  `git diff main..HEAD -- plugins/agentic-workflow/agents/ | grep '^[+-]tools:'` returns
  **nothing**; `grep -n "artifacts/" plugins/agentic-workflow/commands/mission.md
  plugins/agentic-workflow/templates/WORKFLOW.md` shows the convention in both.
- **Read budget**: ~400 lines. **Suits:** the main session (cross-cutting contract text)
  or `backend`.

**Checkpoint `ckpt-p1`** — reviewer verifies the clause, the artifacts convention, the
§6.2 write half, and specifically that **no agent's tool list changed** (D7). Merge into
the integration branch on APPROVE.

---

## Phase 2 — standing steers (branch: `mission/context-economy-p2`)

_Sequential after P1 (both touch `mission.md`). Not parallel-safe with P3 (both touch
`templates/WORKFLOW.md`)._

### S5 — `## Standing steers` block + append rule + lint grammar check (tasks 11–13; OQ4 applies)

- **Reads** (~430 lines):
  - `plugins/agentic-workflow/templates/mission-state.md` (51, whole) — anchor
    **L30-35** (`## Open questions`); the new block goes immediately after it, before
    `## Deviations` (L37).
  - `plugins/agentic-workflow/commands/mission.md` (103, whole) — the append step goes
    in **§3 (L58-85)** and **nowhere else**; §2 (L41-56) must stay clean.
  - `plugins/agentic-workflow/templates/WORKFLOW.md` — ranged **L239-250** (§5's trio
    table, the ledger row that lists the ledger's sections).
  - `tools/lint.mjs` (363) — ranged **L1-56** (helpers: `fail`, `lineOf`, `read`,
    `mdFiles`), **L232-254** (`checkTemplateFrontmatter` — a good structural template),
    **L354-364** (check array + exit).
  - `.plans/context-economy.state.md` — its own `## Standing steers` block is the live
    fixture; the other three `.plans/*.state.md` ledgers have no block and must keep
    passing.
- **Do**:
  1. Add `## Standing steers` to `templates/mission-state.md` after `## Open questions`:
     purpose line (file-state preserves *decisions* but loses *taste*), **verbatim
     quotes only**, mandatory grammar `- YYYY-MM-DD (ckpt <id>) — "<exact words>"`,
     retire by **strikethrough, never delete**, and a `(none)` placeholder.
  2. `mission.md` §3: at a checkpoint, append any human steer verbatim to the ledger's
     `## Standing steers` with the checkpoint id. State that this happens **only** at
     checkpoints, never mid-brief. Add to §4/`continue` that the resume path re-reads
     the block.
  3. WORKFLOW §5 ledger row: name the block among the ledger's sections.
  4. `lint.mjs` — add `checkStandingSteers()`: for each `.plans/*.state.md` that HAS the
     block, every non-placeholder bullet must match
     `^- \d{4}-\d{2}-\d{2} \(ckpt [a-z0-9-]+\) — ".+"$`, and the `<id>` must appear in
     that file's `## Checklist`; also assert `templates/mission-state.md` carries the
     block. Register it in the check array. Pure text — **no new harness**.
- **Verify**: `node tools/lint.mjs` green on the repo as-is; then temporarily add a
  malformed steer line (e.g. paraphrased, no date, or an unknown `ckpt` id) to
  `.plans/context-economy.state.md` → lint FAILS with a precise `file:line` finding →
  remove it → green. Record the negative check in the handoff.
  `grep -n "Standing steers" plugins/agentic-workflow/commands/mission.md` → hits only
  within §3 (and the §4 resume line).
- **Read budget**: ~430 lines. **Suits:** `backend`.

**Checkpoint `ckpt-p2`** — reviewer verifies the grammar check actually fails on a
malformed line (re-derive it, don't trust the handoff), that legacy ledgers still pass,
and that no append instruction leaked into §2. Merge into integration on APPROVE.

---

## Phase 3 — post-compaction hook (branch: `mission/context-economy-p3`) — **[STRICT]**

_Sequential. STRICT checkpoint (D3): the reviewer re-derives every claim and dispatches
the hook itself. The verdict must be **surfaced to the human when it lands** — under the
batch gate policy there is no merge prompt to carry it._

### S6 — `SessionStart:compact` re-read directive (tasks 14–16)

- **Reads** (~420 lines):
  - `plugins/agentic-workflow/hooks/lib/beat-enforcer-stop.sh` (52, whole) — **L39-44**
    is the `ls -t` active-ledger selection to reuse verbatim; the header comment block
    (L1-26) is the house contract style for a new lib script.
  - `plugins/agentic-workflow/hooks/hooks.json` (114) — ranged **L95-114** (the `Stop`
    + `SessionEnd` blocks) for the event-block shape and the
    `bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/<name>.sh"` invocation form. Don't read the
    whole file — the guardrail commands are long single lines.
  - `tools/hook-test.mjs` (165, whole) — `hookCommand(event, desc)` at **L25-33** is
    already event-agnostic (`spec.hooks[event]`), `runHook` at **L37-62**, and the
    Stop-case block at **L97-145** is the pattern to copy.
  - `plugins/agentic-workflow/templates/WORKFLOW.md` — ranged **L183-208** (§3 guardrail
    table + the "Blockers exit 2" note) and **L230-238** ("Reflex backstops" — currently
    says *two* governance hooks).
  - `plugins/agentic-workflow/README.md` — ranged **L185-202** (`## Guardrails (hooks,
    always on)`, "Three governance reflexes").
  - `tools/lint.mjs` — ranged **L256-290** (`checkHooks`: JSON parse + `bash -n` on both
    inline commands and `hooks/lib/*.sh`).
- **Do**:
  1. New `plugins/agentic-workflow/hooks/lib/compact-resume.sh` (name it in the house
     style) — reuse the `ls -t` active-ledger selection; if no `.plans/` or no active
     ledger, **exit 0 silently**; otherwise emit a **≤6-line** directive: you were just
     compacted — re-read `<ledger>` and `docs/product/session-handoff.md` **verbatim**
     before continuing; honor the ledger's `## Standing steers`. Emit via
     `hookSpecificOutput.additionalContext` built with `jq -n --arg` (ledger text must be
     JSON-escaped, never executed — the beat-enforcer-stop precedent). **Always exit 0.**
  2. `hooks.json`: add a `SessionStart` event block with matcher **`compact`** and
     nothing else. Give it a descriptive `description` (the harness selects hooks by a
     description substring).
  3. `tools/hook-test.mjs`: add cases — fires on `compact` and names the active ledger;
     **not matched / silent on `startup`**; **not matched / silent on `resume`**; never
     exits 2; sane (exit 0, silent) with no `.plans/`.
  4. Atomic-ref, same commit: add the hook's row to WORKFLOW §3's table and update the
     "two governance hooks" phrasing (L230-238) plus the plugin README's "Three
     governance reflexes" paragraph (L185-202).
  5. **Explicitly do NOT build** (D8): a `PreCompact` hook, a breadcrumb file, a
     `.gitignore` entry, or any harness extension.
- **Verify**: `node tools/hook-test.mjs` green including the new cases;
  `node tools/lint.mjs` green; `git diff --stat` shows exactly: `hooks/hooks.json`, the
  new `hooks/lib/*.sh`, `tools/hook-test.mjs`, `templates/WORKFLOW.md`,
  `plugins/agentic-workflow/README.md`. Confirm by inspection that the matcher string
  is `compact` and no `startup`/`resume` matcher was added.
- **Read budget**: ~420 lines. **Suits:** `devops`.

**Checkpoint `ckpt-p3` [STRICT]** — reviewer re-runs both harnesses, dispatches the hook
by hand for all three `SessionStart` matchers, confirms exit 0 in every path (including
no-`.plans/`), confirms the injected directive is ≤6 lines and names the right ledger,
and confirms nothing from the D8 "not built" list appeared. **Surface the verdict to the
human the moment it lands** — batch gating produces no merge prompt to carry it. Merge
into integration on APPROVE.

---

## Phase 4 — measure, record, ship (branch: `mission/context-economy-p4`)

### S7 — re-measurement + metrics doc (tasks 17–20; OQ5 applies)

- **Reads** (~250 lines): `.plans/context-economy.md` (Phase-4 tasks + risks);
  the P0b baseline numbers from `.plans/context-economy.state.md`;
  `plugins/agentic-workflow/templates/engineering-tracking-plan.md` (59) — **skim only**,
  to state accurately in the new doc how it differs;
  `tools/context-attrib.mjs` CLI header (~40 lines).
- **Do**:
  1. Identify **this mission's own transcript** (`ls -t
     ~/.claude/projects/-Users-baker-Playground-venture-workflow-plugin/*.jsonl | head`,
     matched by `grep -c "context-economy" <file>` — greps only, **never a Read**).
  2. Run `node tools/context-attrib.mjs` on it; compare the **authored-Write share (%)**
     against the P0b baseline for **D4a**; state the non-comparability caveat (OQ5).
  3. Count `isCompactSummary` transcripts across the project
     (`grep -l isCompactSummary *.jsonl | wc -l`) — planning-time value was **1**; ≥3
     promotes D8 to Option B. Record the command with the number.
  4. Write `docs/product/engineering/context-economy-metrics.md` (new directory) —
     method, baseline split, D9 per-agent table, re-measurement, D4a verdict
     (met / not met / not comparable + reason), **D4b logged as deferred and
     non-blocking**, the `isCompactSummary` counter, the honest ceiling (targets ~25%;
     realistic capture 10–15%), and the two out-of-scope levers. Opening note must state
     it is an engineering-economics record, **not** the product tracking plan.
  5. Mirror the headline numbers + the D4a verdict into the ledger.
- **Verify**: `node tools/lint.mjs` green; the metrics doc contains every section above;
  the D4b row is `[~]` in the ledger, not `[x]`.
- **Read budget**: ~250 lines. **Suits:** `backend` (or `analyst` for the doc, with the
  numbers handed over — the analyst does not need the transcript).

### S8 — ship the mission (task 21)

- **Reads** (~200 lines): `CHANGELOG.md` — **`## [Unreleased]` head only, ~L1-40**;
  `plugins/agentic-workflow/.claude-plugin/plugin.json` (11);
  `.claude-plugin/marketplace.json` (17); the ledger's handoff log.
- **Do**: spawn `chronicler` (CHANGELOG + JOURNEY + status page, then republish the
  status page via the Artifact tool — subagents cannot publish); bump the plugin version
  (minor: new tool + new hook + protocol change); **have the `chronicler` author the PR
  body to `.plans/context-economy.artifacts/p4-pr-body.md`** and open the integration PR
  with `gh pr create --body-file …` — this session is the firewall's own first live test
  (task 8); leave the merge to the human.
- **Verify**: `node tools/lint.mjs` green; `git status --short` clean; the PR exists
  against `main` from `mission/context-economy-integration`; the orchestrator authored no
  document over ~15 lines during this session (state it explicitly in the handoff).
- **Read budget**: ~200 lines. **Suits:** the main session (orchestration + chronicler).

**Checkpoint `ckpt-p4`** — final reviewer pass over the full integration diff
(`main..mission/context-economy-integration`): all gates green, the metrics doc honest
about what was and was not moved, D7's untouched-tool-list invariant still holding across
the whole mission. Then the **human merges the integration branch once** (batch policy).

---
_Size every brief to its read budget; split any that can't fit and note the split. Each
session's outcome and any deviation lands in `.plans/context-economy.state.md`, never
only in chat._
