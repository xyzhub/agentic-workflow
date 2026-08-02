---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: context-economy — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Scope is settled before this file exists — the
planner decomposes, it does not re-decide._

Converted from `docs/product/decisions/2026-08-01-orchestrator-context-economy-brief.md`, 2026-08-01.
That brief is the source of truth for problem, evidence, and decisions D1–D9; this
file decomposes it. Do not re-open scope here.
**Replanned 2026-08-02** (D1 pause released; D10–D12 locked) — see `## Replan 2026-08-02`.
Phase 0.5 is the only authorized phase; **Phases 1–4 are HELD** pending the human's
re-decision after `ckpt-p05`.

Goal: cut the orchestrator's dominant token term (the transcript) by measuring where
it actually goes, then shipping a write firewall, a standing-steers convention, and a
post-compaction re-read hook — with a hard human re-scope pause after the measurement.

## Tasks

### Phase 0a — doc-defect fix (D6, before the pause)

1. **Kill the "fresh context per tick" falsehood** — every shipped claim that a
   `/loop` tick or turn-end yields a fresh context is replaced with the real
   mechanism: `/loop` is session-scoped, ticks accrete in the SAME transcript;
   genuine fresh context requires `/clear`, a new session, or a scripted
   `claude -p`; what makes loop mode safe is that state lives in files, so any tick
   *can* be run fresh without loss.
   Acceptance: the six shipped sites are corrected —
   `plugins/agentic-workflow/templates/WORKFLOW.md` (quick-ref ~L27-29, §5 Loop mode
   ~L283-289, §11 ~L657-660), `plugins/agentic-workflow/commands/mission.md:93-97`,
   `plugins/agentic-workflow/commands/autopilot.md:29-33`,
   `plugins/agentic-workflow/README.md:218-224`; no surviving line asserts that a tick
   or turn-end *produces* fresh context; `node tools/lint.mjs` green. Mentions of the
   `reviewer`'s fresh context and of `/agentic-workflow:handoff`'s fresh SESSION are
   correct and stay. (Mirror sites in `docs/WORKFLOW.md` and the launch copy: OQ1/OQ2.)

### Phase 0b — attribution script (D9 required output) → HARD PAUSE (D1)

2. **`tools/context-attrib.mjs`** — zero-dep Node (≥18), sibling in shape to
   `tools/hook-test.mjs` / `tools/marker-test.mjs`. Reads a transcript JSONL by path,
   **streamed line-by-line via `node:readline`** — the file must never be slurped into
   memory or printed. Emits a per-category token split over the taxonomy:
   `human steers · orchestrator prose · authored: Write/Edit inputs · authored: Bash
   commands · tool results · subagent returns (Agent result blocks) · attach:
   skill_listing · attach: hook_success · attach: other · UNATTRIBUTED`.
   Acceptance: `node tools/context-attrib.mjs <path>` prints the table (tokens + share)
   and the calibration + totals footer; exits 0; never echoes transcript content beyond
   category labels and numbers.
3. **The four measured landmines, implemented** —
   (a) dedup `usage` by `requestId` (repeated verbatim on every JSONL line of a
   response; naive summing over-counts ~2.5×);
   (b) print an **UNATTRIBUTED residual** line (thinking text is not persisted;
   ~61–66% of output tokens have no attributable text) — **never redistribute it**;
   (c) **self-calibrate per transcript**: prompt-delta ÷ chars-appended ≈ 2.0
   chars/token for this workload (the `/4` rule is ~2× wrong) — print the derived
   ratio; (d) size `attachment` records on the **injected field**
   (`stdout`/`content`), not the whole record.
   Acceptance: each landmine is asserted by a `--selftest` case (below); the printed
   footer states the derived chars/token ratio and the UNATTRIBUTED share.
4. **D9 — per-`subagent_type` attribution** (required output, not a flag to skip):
   `Agent` tool-use blocks (the spawn tool is `Agent`, not `Task`) are attributed by
   `subagent_type`, and their **result** blocks summed per agent.
   Acceptance: the run prints a per-agent table (e.g. `reviewer`, `chronicler`,
   `architect`, `analyst` …) with tokens + share of total; the `reviewer` row is called
   out explicitly, since >3% reopens D7.
5. **`--selftest` + lint delegation** — `node tools/context-attrib.mjs --selftest`
   runs fixture assertions over a **synthetic ~20-line JSONL built in a throwaway dir**
   (the `marker-test.mjs` pattern), asserting: requestId dedup (duplicate usage lines
   counted once), UNATTRIBUTED printed and not redistributed (category sum + residual
   = total), calibration ratio derived from the fixture rather than hardcoded `/4`,
   attachment sized on the injected field, `Agent` result blocks landing under their
   `subagent_type`. `tools/lint.mjs` gains a `checkContextAttrib()` that spawns
   **`--selftest`** — never a real transcript (CI has none; a real-transcript gate
   would fail on every clean checkout) — and **fail-closed on a missing script**,
   matching `checkHookBehavior` / `checkMarkerMutation` (lint.mjs:318-352). Silent-skip
   is forbidden.
   Acceptance: `node tools/context-attrib.mjs --selftest` exits 0 with per-case `ok`
   lines; `node tools/lint.mjs` runs it and stays green; deleting the script makes lint
   FAIL (verified by a temporary rename, then restored).
6. **Run it on the real baseline transcript and record the finding** — target:
   `~/.claude/projects/-Users-baker-Playground-venture-workflow-plugin/2fa752c7-9b89-4313-8729-ec63daee6496.jsonl`
   (the `sales-doc-architecture` mission session — 11.2 MB / 4,438 lines at
   2026-08-01 18:46; **append-only and still growing**, so record bytes + line count at
   run time).
   Acceptance: the ledger records — the full category split, the per-`subagent_type`
   table (D9), the derived chars/token ratio, the UNATTRIBUTED share, the
   **377.4k `/context` sanity check** (script total vs. the recorded Messages figure),
   and, if divergence exceeds **15%**, an explicit **script-validity finding** stating
   the measurement is not trustworthy for the re-scope decision.
7. **HARD PAUSE (D1)** — the mission stops. The human re-scopes P1–P4 against the real
   numbers before any later phase is spawned. The pause package carries, at minimum:
   the split, the D9 table, the sanity check, and the **two re-scope inputs** below.
   **Status: pause RELEASED 2026-08-02** with D10/D11/D12 (ledger `## D1 re-scope
   decisions`). The release authorizes **Phase 0.5 only**.

### Phase 0.5 — instrument repair (D10) → DECISION POINT

_Added at the 2026-08-02 replan. Tasks are numbered **22–26** so the held phases below keep
their existing numbers. Evidence base:
`docs/product/decisions/2026-08-02-context-economy-d1-rescope-memo.md` (the architect's
options memo, `549241f`) — cited by its **M-numbers**, not re-derived._

22. **Guard the `prompt = 0` degenerate record** — one usage record with `promptOf(u) === 0`
    is currently read as "the context is empty", so the following request re-bills the whole
    resident context: **513,634 tok = 24.4% of TOTAL** of phantom churn (memo M2 row 5).
    Fail-closed by shape: a request with no usable usage data is not a prompt observation —
    skip it as an observation, do not overwrite `prevPrompt`, count it in a printed
    `degenerateUsage` counter.
    Acceptance: a `--selftest` case **fails without the guard** (proved by mutation, with the
    output recorded in the handoff); TOTAL on the fixture is unchanged by the degenerate
    record's presence; the baseline re-run records TOTAL before and after.
23. **Emit a collapse ledger + the ratchet identity** — every request where the prompt drops
    (index, line, before, after, drop), the collapse count, Σ collapse mass, and the printed
    identity `Σ positive deltas − Σ collapse mass = final prompt` (memo M3) with a PASS/FAIL.
    **Collapse #4 (line 4,222, −270,711, no compact-summary record) is explicitly DEFERRED,
    not in scope** — it is *reported* as unexplained and tracked non-blocking in the shape of
    D4b. Root-causing it needs single-record schema inspection (the `attach: other` class of
    work), which is not measurement.
    Acceptance: the collapse table reproduces memo M2 from the shipped instrument; the
    identity line prints and passes; collapse #4 carries an "unexplained" note and a tracked
    ledger row.
24. **Settle the chars/token band and name the char-free mass** — the **3.2–4.2** band is
    load-bearing for the memo's M7/M9 and for both of its recommendations, and is
    **unverified**; per-segment measurements are 1.29 / 1.50 / 1.66 (memo M6). Method is a
    **dependency decision** (**OQ6** — this repo has no `package.json`, no lockfile, and CI
    runs `node tools/lint.mjs` on a bare checkout). Report the split with **chars primary**
    and tokens as a banded secondary; print a **char-free mass** line (prompt growth carrying
    no persisted characters) with its share.
    Acceptance: the settled ratio or band is printed **with its method named**; every printed
    number is classifiable as measured vs. assumption-riding; the books close in integers
    (attributed + char-free + preamble + residual = TOTAL). **P0.5 quantifies the 56–66%
    char-free finding; it does NOT explain it** — the explanation is logged as a tracked open
    item for the re-decision, and the printed caption says so.
25. **Re-point the sanity check at occupancy; churn stays the target (D10c)** — report churn
    (Σ positive deltas, **the optimisation target**) and occupancy (max/final prompt, **what
    `/context` reports**) side by side, each labelled with the question it answers. The 15%
    validity gate compares **occupancy** against the `/context` figure, supplied via
    `--context-total=<tokens>` (**OQ7**; a third invocation form — log the deviation). Fix the
    normalisation slip: the comparator is `/context`'s **TOTAL** (401.4k), not the *Messages*
    sub-total (377.4k), because the prompt series also carries system/tool-def/memory/skills
    (memo M5).
    Acceptance: both quantities printed and unambiguously labelled; the gate prints PASS/FAIL
    against occupancy; absent the flag, behaviour and exit code are unchanged; the usage
    string and header comment name the third form.
26. **D11 follow-up — the 3% D7 trigger must name its denominator** — the verdict line prints
    `reviewer return share = X% of <denominator>`, with the denominator's definition and
    value, and states that the trigger is a **token-domain share of total prompt growth**
    (a char-domain share is not the trigger). A dated clarification line is **appended** under
    D7 in this file. **D7's locked text is not rewritten and the D11 ruling is not re-run.**
    Acceptance: a `--selftest` case asserts the verdict line names a denominator; the D7
    entry below carries a `2026-08-02 (D11 follow-up)` line; no agent's `tools:` line changes.

**Then `ckpt-p05`, then a DECISION POINT.** The S0.5-4 re-decision package goes to the human,
who re-decides P1–P4 with repaired numbers. **P1–P4 are NOT authorized until then.**

### Phase 1 — write firewall (D7 shape) — **HELD pending the post-P0.5 re-decision**

8. **Extend the orchestrator's 30% rule to writes** — `commands/mission.md:14-16`
   currently bounds only reads. Add: "Write only the ledger, and edits under ~15 lines.
   Any document longer than that is authored by a subagent and returned as a path."
   Establish `.plans/<mission>.artifacts/<phase>-<kind>.md` as the artifact home. Route:
   templates → the phase's implementing agent (already has Write); CHANGELOG + PR
   bodies → `chronicler` (enforcement, not invention — but see OQ3); PR bodies are
   passed as `gh pr create --body-file <path>`, so the body never transits an
   orchestrator-authored Bash command either.
   Acceptance: the clause exists in `mission.md`; the artifacts path convention appears
   in `mission.md` and WORKFLOW §6.2; `node tools/lint.mjs` green.
9. **≤15-line write-return format in WORKFLOW §6.2** (template L466-493) — the
   bounded-return rule gains its write half: an agent that authors a document returns
   status · the **path** · a one-line description · verify signal · what the caller must
   do with it — never the document body.
   Acceptance: §6.2 states the write half explicitly and names
   `.plans/<mission>.artifacts/`; §-integrity lint green.
10. **The `reviewer` is NOT touched (D7)** — no tool-list change anywhere in this
    mission. `reviewer.md:4` (`tools: Read, Bash, Grep, Glob`) is the fleet's only
    structural guarantee and stays exactly as-is.
    Acceptance: `git diff` for the phase shows zero changes to any agent's `tools:`
    frontmatter line; the reviewer's verdicts still transit the orchestrator (accepted
    cost, recorded).

### Phase 2 — standing steers (D2/SD4) — **HELD pending the post-P0.5 re-decision**

11. **`## Standing steers` block in `templates/mission-state.md`** — placed **after
    `## Open questions`** (template L30-35), before `## Deviations`. Verbatim quotes
    only; mandatory grammar `- YYYY-MM-DD (ckpt <id>) — "<exact words>"`; retire by
    **strikethrough, never delete**.
    Acceptance: the block ships in the template with the grammar stated and the
    retire-by-strikethrough rule; the template's own placeholder line does not violate
    the lint grammar.
12. **Append step lives ONLY in `mission.md` §3 (checkpoint)** — never §2 (the
    per-brief run loop). Mid-brief capture is prevented structurally by the instruction
    existing at exactly one place in the command.
    Acceptance: `grep -n "Standing steers" commands/mission.md` returns hits only inside
    §3; WORKFLOW §5's ledger row mentions the block; resume/`continue` re-reads it.
13. **`lint.mjs` line-grammar check** (pure text, no new harness) — for every
    `.plans/*.state.md` that HAS a `## Standing steers` block, each non-placeholder
    bullet must match `^- \d{4}-\d{2}-\d{2} \(ckpt [a-z0-9-]+\) — ".+"$`, and the
    `<id>` must appear in that file's `## Checklist`. Ledgers without the block pass
    (legacy).
    Acceptance: the check is registered in lint's check array (lint.mjs:354); a
    deliberately malformed steer line makes lint fail; the repo's real ledgers stay
    green.

### Phase 3 — hook (D8) — STRICT checkpoint — **HELD pending the post-P0.5 re-decision**

14. **One `SessionStart` matcher `compact` hook** — body in
    `plugins/agentic-workflow/hooks/lib/*.sh` per the established pattern, invoked from
    `hooks.json` via `bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/<name>.sh"`. It injects a
    **≤6-line** directive naming the active ledger, reusing the `ls -t` active-ledger
    selection from `hooks/lib/beat-enforcer-stop.sh:39-44`: "you were just compacted —
    re-read `<ledger>` + `docs/product/session-handoff.md` verbatim before continuing;
    honor `## Standing steers`."
    Acceptance: matcher is `compact` **alone**; the hook always exits 0; silent with no
    `.plans/`; `bash -n` clean (lint checkHooks covers `hooks/lib/*.sh`).
15. **Explicitly NOT built (D8)** — no `PreCompact` hook, no breadcrumb file, no
    `.gitignore` change, no harness extension.
    Acceptance: the phase diff touches only `hooks/hooks.json`, one new
    `hooks/lib/*.sh`, `tools/hook-test.mjs`, and the two doc sites in task 16.
16. **`hook-test.mjs` cases** — the runner is already event-agnostic
    (`hookCommand(event, desc)` reads `spec.hooks[event]` generically, hook-test.mjs:25-33),
    so no harness change is needed. Add: fires on `compact` (names the active ledger);
    silent/not-matched on `startup`; silent/not-matched on `resume`; never exits 2;
    sane with no `.plans/`. Atomic-ref: the new guardrail row lands in WORKFLOW §3's
    table (template L186-202) and the plugin README's guardrails section (L187-200) in
    the **same commit** as the hook.
    Acceptance: `node tools/hook-test.mjs` green with the new cases; `node tools/lint.mjs`
    green; the §3 table and README name the hook.

### Phase 4 — wrap (D4a) and record — **HELD pending the post-P0.5 re-decision**

17. **Re-measure on THIS mission's own transcript** and compare against the P0b
    baseline for **D4a** — the authored-Write share must be reduced. Report **share
    (%)**, not absolute tokens (the two missions differ in size and shape).
    Acceptance: both runs' numbers are in the ledger with the delta and an explicit
    verdict (met / not met / not comparable, with reason).
18. **Log D4b as a non-blocking tracked item** — the cross-mission confirmation on a
    later comparable mission is deferred, not dropped.
    Acceptance: a `[~]` ledger row and a line in the metrics doc naming it as deferred.
19. **Count `isCompactSummary` transcripts** (feeds the D8 promote-to-Option-B test:
    ≥3 promotes). Current project count at planning time: **1**.
    Acceptance: the count and the command used are recorded in the metrics doc.
20. **`docs/product/engineering/context-economy-metrics.md`** — new doc (new
    directory), `analyst` spec: the measurement method, the baseline split, the D9 table,
    the re-measurement, the D4a verdict, the deferred D4b, the `isCompactSummary`
    counter, and the two out-of-scope levers. It is **not** the tracking plan
    (`templates/engineering-tracking-plan.md` serves a different consumer — product
    instrumentation, not orchestrator economics); say so in the doc's opening note.
    Acceptance: the file exists with those sections; `node tools/lint.mjs` green.
21. **Ship** — `chronicler` (CHANGELOG + JOURNEY + status page), version bump in
    `plugins/agentic-workflow/.claude-plugin/plugin.json`, integration PR from
    `mission/context-economy-integration` opened for the human to merge ONCE.
    Acceptance: gates green; PR body authored per the new firewall (task 8) as a
    `--body-file`; the human merges.

## Locked decisions

_Copied from the source brief with their original dates. Not re-litigated._

- **2026-08-01 — D1 — Measure, then RE-SCOPE.** Phase 0 builds the attribution script
  and reports the real split; the mission then **PAUSES** for the human to confirm or
  adjust the remaining phases against actual numbers. Shaping past the measurement is
  guessing.
- **2026-08-01 — D2 — Standing steers: IN, checkpoints only.** The orchestrator appends
  human steers **verbatim** to a `## Standing steers` ledger block at checkpoints only,
  never mid-brief; the resume path re-reads it.
- **2026-08-01 — D3 — Priority: top of backlog. Gate policy: `batch`** (phases merge
  into `mission/context-economy-integration`; the human merges once at the end).
  Independent reviewer per phase; **strict checkpoint on the hook phase**.
- **2026-08-01 — D4 — Done = MEASURED REDUCTION**, not "mechanisms in place". D4a
  (this mission's own transcript vs. the P0b baseline) closes the mission; D4b (a later
  comparable mission) is tracked, non-blocking.
- **2026-08-01 — D5 — Process adaptation.** The Opus 5 expert served as counsel/red-team;
  advisors are NOT re-spawned. `designer` is skipped (no user-facing surface).
- **2026-08-01 — D6 — Doc-defect fix moves BEFORE the measurement pause.** A truth
  correction with settled content and zero risk; holding a known falsehood behind an
  unrelated gate buys nothing.
- **2026-08-01 — D7 — Reviewer untouched in v1.** The reviewer cannot contribute to the
  22.5% (it has no Write tool); granting Write would spend the fleet's only structural
  guarantee (`reviewer.md:4`) for a slice of the 0.4% subagent-return line, and no hook
  can restore it (`PreToolUse` carries no agent identity). Routing the report through
  `chronicler` is strictly worse (it transits the orchestrator both ways). v1 firewall
  targets only what needs no permission change: templates → the phase's implementing
  agent; CHANGELOG + PR bodies → `chronicler`. **Reopen if** per-agent attribution shows
  `reviewer` returns >3%.
- **2026-08-01 — D8 — Hook pair = stateless directive.** `SessionStart` matcher
  `compact` injects a fixed ≤6-line re-read directive naming the active ledger. **No
  breadcrumb file**, no freshness guard, no gitignore entry, no harness extension.
  Matcher must be `compact` alone (never `startup`/`resume`). **Promote to Option B if**
  a wrong-ledger/wrong-branch post-compact resume is recorded, or `isCompactSummary`
  transcripts reach ≥3.
- **2026-08-02 — D10/D11/D12 — the D1 re-scope, locked by the human.** Recorded in full in
  `.plans/context-economy.state.md` `## D1 re-scope decisions` (not duplicated here):
  **D10** instrument repair comes first as Phase 0.5, P1–P4 unauthorized until it lands;
  **D11** D7 stays locked (the 4.0% reopen is a normalisation artefact — the reviewer is
  1.23–1.62% in the token domain), with the denominator follow-up owed; **D12** OQ2 stands,
  the launch copy is unpublished, no erratum. Not re-litigated by any session.
- **2026-08-01 — D9 — Phase 0 MUST emit per-`subagent_type` attribution of `Agent`
  result blocks.** 8 reviews × 60–100 lines ≈ 10k ≈ 2.7% cannot coexist with "all
  subagent returns = 0.4%"; one number is wrong, and if it is the 0.4% then the "§6.2
  firewall is already working" premise under D1 is unsound. Required Phase-0 output;
  feeds the D7 reopen test.

## Replan 2026-08-02

_Dated replan entry (WORKFLOW §5). Completed work is history and is not re-planned;
locked decisions stay locked._

**What triggered it.** The human released the D1 hard pause on 2026-08-02 with the
architect's options memo (`549241f`) in hand, and re-scoped: **instrument repair first**
(D10), **D7 stays locked** (D11), **launch copy unpublished** (D12).

**What changed in the evidence.**
- The 5.59× validity failure is **fully explained** and has no residual: ratchet 4.105× ×
  (final prompt 513,634 ÷ the *Messages* sub-total 377.4k = 1.361) = 5.587×. `promptOf` is
  sound; only the aggregation answered a different question (memo M3–M5). The reviewer's
  "unexplained ~1.9×" is retired.
- **One degenerate record (`prompt = 0`) manufactures 513,634 tok = 24.4% of TOTAL** in
  phantom churn (M2). Five prompt collapses, not twenty: `isCompactSummary` is **1**, and the
  "20" in the pause package is a self-referential grep artefact (M1).
- **Phase 1's founding number is retracted.** Orchestrator Write/Edit is **≤15.9%** under the
  most generous denominator and **2.8–3.7%** in the token domain — never the **22.5%** the
  mission was premised on (M8/M9).
- **The mission headline falls to ~4% addressed / ~1.5–2.5% captured** (memo §2). The two
  out-of-scope estimates (`skill_listing`, `tool results`) reconcile under the NARROW
  denominator; the in-scope one does not.
- The **3.2–4.2 chars/token band** that carries M7/M9 is **unverified**, and **56–66% of
  prompt growth is char-free** — a phenomenon the current model does not explain.

**What this plan now says.**
- **Added** Phase 0.5 (tasks 22–26) — the only authorized phase — ending at `ckpt-p05` and
  then a **decision point**. Four sessions: `S0.5-1` … `S0.5-4` in
  `.plans/context-economy.sessions.md`, branch `mission/context-economy-p05`, merging into
  `mission/context-economy-integration` per D3.
- **Held, not deleted**: Phases 1–4 / S4–S8, each with a one-line honest note on what the new
  evidence does to it (P1's cost case is dead; P2 and P3 are fidelity/correctness controls
  whose justification never depended on token math; P4's D4a design is downstream of P0.5 and
  its headline must be restated). **Their fate is the human's at the decision point.**
- **Explicitly deferred inside P0.5** (reported, never silently dropped): collapse #4's root
  cause; the *explanation* of the char-free mass (P0.5 quantifies it); `attach: other`'s
  schema validation; D4b's cross-mission confirmation.
- **New open questions: OQ6** (tokenizer dependency — blocks `S0.5-2` only) and **OQ7**
  (a third CLI form for the sanity gate).
- **Phase 0 is untouched.** S1/S2/S3/S3-fix and `ckpt-p0` are merged history (`273f1d3`).

**One flag, unresolved by design.** D10(b) names "a real tokenizer" as the method for
settling the band, while this repo is **zero-dep by house style** with no `package.json`,
no lockfile, and a CI job that runs `node tools/lint.mjs` on a bare checkout. That is a
tension between a locked decision and a standing constraint. It is surfaced as **OQ6 with a
recommendation** — the planner does not unlock it.

## Re-scope inputs to surface at the D1 pause

_These go in front of the human WITH the numbers, so the mission is not judged for
failing to move terms it never aimed at._

- **`skill_listing` ≈ 16.0% — a free lever, zero engineering.** The installed skills
  catalog is re-injected ~8× per session (17 occurrences in the baseline transcript).
  Trimming installed skills reduces it immediately. Out of mission scope; the human may
  pull it in or act on it directly.
- **`tool results` ≈ 25.1% — untouched by every phase in this mission.** It belongs to
  read/delegation discipline (WORKFLOW §2 / §6.2), not to this mission's four items.

## Risks

- **🔴 The honest ceiling — SUPERSEDED 2026-08-02 (kept for the record).** Measurement
  retracted the numbers below: Write/Edit is **≤15.9%** (char, NARROW) / **2.8–3.7%**
  (token), not 22.5%; the mission headline is **~4% addressed / ~1.5–2.5% captured**, and
  the claim must name its denominator. The risk was real and it **fired**. → The restated
  ceiling is an output of `S0.5-4`'s re-decision package, and the metrics doc (task 20)
  cannot ship the old figures. Original text:
- **The honest ceiling.** The four in-scope items address ~**25%** of consumption, and
  22.5% is a *ceiling, not a win* — routing a 300-line template to an implementing agent
  moves the content out, but the spec still transits. Realistic capture ≈ **10–15%**
  (~40–55k tokens on the 377.4k baseline — roughly one phase of headroom). → Stated in
  the metrics doc up front; the doc-defect fix earns its place on truthfulness alone.
- **Measurement validity.** If the script's total diverges >15% from the 377.4k
  `/context` figure, the re-scope decision would rest on bad numbers. → Task 6 makes the
  divergence an explicit recorded *finding*, not a footnote; the UNATTRIBUTED residual is
  always printed and never redistributed.
- **The baseline transcript is a live, append-only file** (it is the session that ran
  `sales-doc-architecture` and this planning). Bytes and line count at run time must be
  recorded, or a re-run silently measures a different corpus.
- **D9 may falsify a premise.** If subagent returns land at ~2.7% rather than 0.4%, the
  "§6.2 firewall already works" claim weakens and D7's reopen test may fire at the pause.
  → It is a pause input, not a mid-flight decision.
- **P3 matcher error is a self-inflicted wound.** A `SessionStart` hook matching
  `startup`/`resume` would inject on every session start — noise and cost, the exact
  opposite of the mission. → Explicit negative test cases; STRICT checkpoint.
- **P1/P2 are contract-only.** Prose rules drift without mechanical enforcement. → P2
  ships a lint grammar check; P1's enforcement is the reviewer's diff check plus the D4a
  re-measurement. Accepted and stated.
- **Accepted cost (D7):** reviewer verdicts keep transiting the orchestrator; the
  firewall ships without touching its originally-named first target.
- **Scope creep at the pause.** The pause invites re-shaping. → The pause package is
  bounded to: numbers, D9 table, sanity check, two re-scope inputs. New work becomes a
  new mission or a replan, not an in-flight expansion.

## Open questions

_Each carries a recommendation. Answer these BEFORE `/agentic-workflow:mission` drives
execution._

**OQ1–OQ5 are RESOLVED (2026-08-01; the human accepted every recommendation — see the ledger).
OQ6–OQ7 are OPEN and belong to Phase 0.5.**

- **OQ6 — [OPEN, blocks `S0.5-2`] Does settling the chars/token band buy a dependency?**
  D10(b) names "a real tokenizer". This repo has **no `package.json`, no lockfile**, and
  `.github/workflows/lint.yml` runs `node tools/lint.mjs` on a bare checkout with **no
  install step** — so Option A is not "add a package", it is a manifest + lockfile + a pinned
  version + a CI install step + a ruling on whether the fail-closed `checkContextAttrib` gate
  may now break on a fresh clone.
  Options: **(A)** add + pin a tokenizer; **(B)** zero-dep **output-side envelope estimator** —
  per request, `persisted assistant chars ÷ output_tokens`; unpersisted thinking can only
  depress that quotient, so the upper envelope over many requests is a defensible lower bound
  on the true ratio, derived from data the script already parses; **(C)** drop token columns
  entirely and report chars only, plus an explicit char-free line.
  **Recommendation: B, reported with C's honesty** — chars as the primary column, tokens as a
  banded secondary whose method is printed. It settles the band with evidence instead of an
  assumption, costs no dependency, and is falsifiable exactly as memo §4 asks. Revisit A only
  if B's envelope proves unstable across segments. *(Note the tension with D10(b)'s wording —
  flagged, not resolved: unlocking is the human's call.)*
- **OQ7 — [OPEN, `S0.5-3`] A third CLI form for the sanity gate?** The 15% gate needs the
  `/context` comparator from outside the transcript. S2's deviation recorded that only two
  invocation forms exist (`<transcript>` and `--selftest`).
  **Recommendation: add `--context-total=<tokens>`** and log the deviation. A gate a human
  computes by hand is precisely what produced the 377.4k-vs-401.4k normalisation slip; absent
  the flag, behaviour and exit code stay unchanged, so nothing regresses. *(Low stakes — if
  the human does not rule, the recommendation stands and the reviewer may overrule it at
  `ckpt-p05`.)*
- **OQ1 — RESOLVED 2026-08-01 (yes) — Fix this repo's own `docs/WORKFLOW.md` mirror sites in the same commit?**
  The dogfooded copy (874 lines, stamped `protocol-master: v1.39.0` while the plugin is
  at 1.41.0) carries the same falsehood at L19-21, L275-281, L645-648.
  **Recommendation: yes** — correct the three sites in the P0a commit (it is this repo's
  operative protocol), and do **not** touch the version stamp; a full re-sync is a
  release-time `/agentic-workflow:sync` action, not a doc fix.
- **OQ2 — Correct the launch copy too?** `docs/product/launch/announcements/hacker-news.md:48`,
  `announcements/dev-to.md:72`, and `positioning.md:70` repeat "fresh context per tick" /
  "no transcript bloat". **Recommendation: correct the in-repo copies** (they are the
  source for any republication) and log the correction in the ledger; no erratum or
  re-publication is proposed — the false half is "no transcript bloat", and the file-backed
  resumability claim survives in corrected form.
- **OQ3 — PR bodies are not actually in the `chronicler`'s contract yet.** D7 treats
  "CHANGELOG + PR bodies → chronicler" as pre-existing, but `chronicler.md` names exactly
  three artifacts and never mentions PR bodies (only `reviewer.md:9` mentions them, as
  untrusted input). **Recommendation:** treat CHANGELOG as enforcement and PR bodies as a
  one-line contract addition — add PR bodies to `chronicler.md`'s artifact list and
  frontmatter description in the P1 commit (no tool change; `chronicler` already has
  Write), with the orchestrator using `gh pr create --body-file`.
- **OQ4 — Scope of the P2 lint grammar check.** **Recommendation:** validate only
  `.plans/*.state.md` files that already HAVE a `## Standing steers` block (three legacy
  ledgers have none and must keep passing), plus assert the block exists in
  `templates/mission-state.md`. Absence in a ledger is not a finding; malformed presence is.
- **OQ5 — D4a comparability.** This mission (8 sessions of contract/doc text + one script)
  is not shape-comparable to `sales-doc-architecture` (9 sessions of template authoring).
  **Recommendation:** report the authored-Write **share (%)** delta, state the
  non-comparability caveat explicitly in the metrics doc, and let D4b (a genuinely
  comparable later mission) remain the real confirmation.

---
_The `.plans/context-economy.sessions.md` briefs execute these tasks;
`.plans/context-economy.state.md` tracks progress. Resolve every open question before
execution starts._
