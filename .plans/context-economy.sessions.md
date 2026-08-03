---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: context-economy — session briefs

_The execution view: one brief per session, each pre-resolved so an execution session
never explores. The expensive exploration happened once, here (2026-08-01); **re-resolved
for Phase 0.5 on 2026-08-02** (replan — see `.plans/context-economy.md` `## Replan
2026-08-02`)._

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
| `.plans/context-economy.state.md` (**was 418** — measured 2026-08-03) | 1,334 |
| `tools/context-attrib.mjs` (**was 510** — measured 2026-08-03) | 1,234 |
| `plugins/agentic-workflow/templates/WORKFLOW.md` (**was 877** — measured 2026-08-03) | 890 |
| `docs/WORKFLOW.md` (this repo's synced copy — **was 874**, measured 2026-08-03) | 887 |
| `tools/lint.mjs` (**was 388** — measured 2026-08-03) | 529 |
| `.plans/context-economy.md` (**was 316** — measured 2026-08-03) | 476 |
| `CHANGELOG.md` (**was 325** — measured 2026-08-03) | 373 |
| `docs/product/decisions/2026-08-02-…-d1-rescope-memo.md` (measured 2026-08-02) | 325 |
| `tools/marker-test.mjs` | 274 |
| `plugins/agentic-workflow/README.md` (**was 250** — measured 2026-08-03) | 258 |
| `docs/product/decisions/2026-08-03-…-p1-p2-recommendation.md` (measured 2026-08-03) | 210 |
| `plugins/agentic-workflow/commands/autopilot.md` | 169 |
| `tools/hook-test.mjs` | 165 |
| `plugins/agentic-workflow/hooks/hooks.json` (**was 114** — measured 2026-08-03) | 126 |
| `plugins/agentic-workflow/commands/mission.md` (**was 103** — measured 2026-08-03) | 117 |
| `plugins/agentic-workflow/agents/chronicler.md` | 114 |
| `docs/product/decisions/2026-08-01-…-brief.md` | 111 |
| `plugins/agentic-workflow/agents/reviewer.md` | 97 |
| `plugins/agentic-workflow/README.md` (root `README.md`) | 59 |
| `plugins/agentic-workflow/agents/writer.md` | 59 |
| `plugins/agentic-workflow/commands/end.md` | 56 |
| `plugins/agentic-workflow/commands/handoff.md` | 53 |
| `plugins/agentic-workflow/hooks/lib/beat-enforcer-stop.sh` | 52 |
| `plugins/agentic-workflow/templates/mission-state.md` (**was 51** — measured 2026-08-03) | 63 |
| `plugins/agentic-workflow/hooks/lib/beat-enforcer-pretooluse.sh` | 50 |
| `plugins/agentic-workflow/commands/pr.md` | 37 |
| `plugins/agentic-workflow/.claude-plugin/plugin.json` | 11 |

**Line counts were re-measured 2026-08-03 for the Phase 4 re-brief** (files grow: the ledger
went 418 → 1,334 and the instrument 510 → 1,234). Rows still carrying a 2026-08-01/02 stamp
belong to phases that are complete; do not re-verify them. **S4 is dropped (D15)** and its
row is struck in the ledger — there is nothing left to re-measure for it.

**Baseline transcript** (P0b/P0.5/P4 only, never Read):
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

> ### ⛔ D1 HARD PAUSE — RELEASED 2026-08-02
> The human re-scoped with the measured numbers (D10/D11/D12 in the ledger). The release
> does **not** authorize S4. It authorizes **Phase 0.5 only**; P1–P4 are re-decided after
> `ckpt-p05`.

---

## Phase 0.5 — instrument repair (branch: `mission/context-economy-p05`)

_Authored at the 2026-08-02 replan. **The only authorized phase.** Sequential — S0.5-1 →
S0.5-2 → S0.5-3 all edit `tools/context-attrib.mjs` and its selftest, and S0.5-4 measures
with all three landed. Not parallel-safe. Ends with `ckpt-p05`, then a **decision point**._

**Why this phase exists (D10).** The instrument that produced the D1 pause package has three
defects that make its headline numbers unusable for a re-scope: one degenerate record
manufactures 24.4% of TOTAL in phantom churn; the token columns ride an unverified
3.2–4.2 chars/token band; and the 15% validity gate compares a churn aggregate against an
occupancy reading, so it fails by construction. Evidence base:
`docs/product/decisions/2026-08-02-context-economy-d1-rescope-memo.md` (325 lines) —
**cite it by its M-numbers, do not re-derive it**.

**Standing constraints for every Phase 0.5 session**
- **Churn stays the optimisation target** (D10c). Only the *sanity check* re-points at
  occupancy. Do not silently promote occupancy to the headline.
- **Restraint over improvement.** These sessions repair a measuring instrument. Every number
  that moves must move for a stated, mechanical reason. If a change alters TOTAL, say by how
  much and why, in the handoff — the S3-fix disclosure precedent.
- **No number may be tuned to hit a target.** If the repaired gate still fails, that is the
  finding.
- **Prove new guards by mutation.** A guard that cannot be shown to fail when broken did not
  ship (the S2 inversion bug shipped past an inert case; see `## Deviations`).
- **Transcript rule applies unchanged** — `wc`, `grep -c`, or the script. Never `Read`.

### S0.5-1 — the `prompt = 0` phantom-churn guard + a collapse ledger (D10a)

- **Reads** (~380 lines):
  - `docs/product/decisions/2026-08-02-…-d1-rescope-memo.md` (325) — ranged **L11-70**
    (M1 the `isCompactSummary` grep artefact · **M2 the five-collapse table** ·
    M3 the exact identity · M4 the occupancy curve · M5 the 5.59× reconciliation).
    This is the spec for what to emit; do not re-measure it.
  - `tools/context-attrib.mjs` (510) — four ranged reads: **L11-40** (the accounting-model
    header comment — it must end this session still true), **L140-165** (the
    `rec.type === 'assistant'` usage branch; **L161 is the defect site** — the window push
    with `Math.max(0, p - prevPrompt)` and **L162 `prevPrompt = p`**, which a `p === 0`
    record poisons), **L212-240** (the derive block + the returned result object),
    **L248-270** (the report header lines the new output sits beside).
  - `tools/context-attrib.mjs` — **L341-404** (fixture builder + the payload-sizing
    constraints comment) and **L406-450** (the selftest cases that pin `r.total === 2600`,
    which your new fixture record must not break silently).
  - `.plans/context-economy.state.md` — **L70-92** (`## D1 re-scope decisions`, D10–D12).
- **Do**:
  1. **Guard the degenerate record, fail-closed by shape.** A usage record whose
     `promptOf(u)` is `0` is *not* an observation that the context is empty — it is a
     request with no usable usage data. Skip it as a **prompt observation**: do not push a
     window, do not overwrite `prevPrompt`, and leave the open window's accumulated chars
     accumulating into the next real request. Count it in a new `degenerateUsage` counter
     and print that counter in the report (a silent skip is the same failure class as the
     suppressed D7 verdict). State the reasoning in a code comment: zeroing `prevPrompt`
     re-bills the entire resident context as fresh churn — **513,634 tok = 24.4% of TOTAL**
     on the baseline (memo M2 row 5).
  2. **Emit a collapse ledger.** For every request where `p < prevPrompt`: request index,
     transcript line number, before, after, drop. Plus the collapse **count** and
     **Σ collapse mass**. This makes memo M2 reproducible from the shipped instrument
     instead of from a scratch probe.
  3. **Print the ratchet identity** (memo M3): `Σ positive deltas − Σ collapse mass =
     final prompt`, with the three numbers and a PASS/FAIL on the equality. It is exact by
     construction, so a FAIL means the model drifted — a self-check worth one line.
  4. **Collapse #4 is DEFERRED, not in scope — but it is reported.** The memo's row 4
     (line 4,222, −270,711, no compact summary) has no explanation. The collapse ledger
     makes it visible; add a printed note that a collapse with no adjacent compact-summary
     record is **unexplained**, and log it in the ledger as a tracked non-blocking item in
     the shape of D4b. **Do not** inspect the record and **do not** model it: root-causing
     it needs single-record schema inspection (the same class of work as the unvalidated
     `attach: other`), which is not measurement and not in this phase. If the human wants
     it explained, it becomes its own session.
  5. **Selftest — the guard must fail without the fix.** Add a `prompt = 0` usage record to
     the fixture, plus cases asserting: (a) TOTAL is **unchanged** by its presence
     (still `2600`), (b) `degenerateUsage === 1`, (c) the collapse ledger lists the genuine
     collapse and **not** the degenerate record, (d) the ratchet identity holds on the
     fixture. Then **prove by mutation**: remove the guard ⇒ name which cases fail, restore
     ⇒ green. Record the mutation output in the handoff.
- **Verify**: `node tools/context-attrib.mjs --selftest` green (new case count stated
  explicitly — S3 mis-stated it once); `node tools/lint.mjs` green; then re-run the
  baseline transcript and record **TOTAL before and after** the guard. Prediction to check,
  not a target to hit: `2,108,485 − 513,634 = 1,594,851`. If it lands elsewhere, that
  discrepancy is the finding — report it, do not chase it.
- **Read budget**: ~380 lines. **Suits:** `backend`.

### S0.5-2 — settle the chars/token band + name the char-free mass (D10b; **OQ6 blocks this session**)

- **⚠️ Blocked on OQ6** (`.plans/context-economy.md` `## Open questions`): whether a real
  tokenizer dependency is added. **Do not start until the human has answered.** S0.5-1 is
  not blocked by it.
- **Reads** (~340 lines):
  - `docs/product/decisions/2026-08-02-…-d1-rescope-memo.md` — ranged **L70-119**
    (**M6** the per-segment ratios 1.29 / 1.50 / 1.66 and the char-free claim · **M7** the
    residual is 67–75%, not 16.1% · **M8** the three denominators · M9 the token domain ·
    M10 churn vs occupancy ranking) and **L287-316** (§4 "what would change the answer" —
    the falsification test — and §5's open items 1 and 2).
  - `tools/context-attrib.mjs` — **L11-40** (the ratio contract in the header),
    **L212-232** (`calDelta` / `calChars` / `ratio` and the per-category conversion),
    **L254-295** (the printed calibration line, the residual-composition block, and the
    output-side FLOOR block — **L286 is the "~28%" nit**), **L428-450** (the three
    calibration selftest cases and the fixture-ratio guard, which any new estimator must
    not weaken).
  - `.plans/context-economy.md` — **L52-62** (task 3, landmine (c): the acceptance wording
    this session changes) and **L250-262** (the measurement-validity risk).
- **Do** (the OQ6 answer selects 1a or 1b; everything else is common):
  1a. **If OQ6 = tokenizer (Option A):** add the dependency with its full cost paid — this
     repo has **no `package.json` and no lockfile**, and `.github/workflows/lint.yml` runs
     `node tools/lint.mjs` on a bare checkout with **no install step**. So Option A means:
     a manifest, a lockfile, a pinned version, a CI install step, and a decision about
     whether `checkContextAttrib` may now fail on a fresh clone. Land those in the same
     commit or the lint gate becomes conditionally green, which is the failure mode the
     fail-closed pattern exists to prevent.
  1b. **If OQ6 = zero-dep (Option B, recommended):** implement the **output-side envelope
     estimator**. For each unique request, compute `persisted assistant chars ÷
     output_tokens`. Unpersisted thinking can only *depress* that quotient (tokens without
     chars); it can never inflate it. So the per-request **upper envelope** (report median,
     p90, and max over requests, with n) is a defensible lower bound on the corpus's true
     chars/token, and it is derived from data the script already parses. Report the
     estimate **as a band with its method named**, not as a point. Say in the output that
     serialized `tool_use` JSON is counted as assistant text and tokenizes differently from
     prose — it is the estimator's known bias.
  2. **Retire the global ratio as a headline token converter** (memo M7 / the architect's
     condition 2). Report the category split with **chars as the primary column**
     (model-free, which is already what the ledger tells readers to prefer) and tokens as a
     **secondary, banded** column whose band is printed next to it.
  3. **Name the char-free mass as its own line**: prompt growth carrying no persisted
     characters = TOTAL − (attributed chars ÷ settled ratio) − preamble, with its share.
     **This phase QUANTIFIES the 56–66% char-free finding; it does not EXPLAIN it.** The
     explanation (unpersisted thinking vs. cached system/tool-def re-injection vs. something
     else) is logged as a tracked open item feeding the post-P0.5 re-decision — say so in
     the printed caption so no reader mistakes the line for a diagnosis.
  4. **Nit (from `ckpt-p0`):** the output-side line at **L286** prints `~28%` while the
     ledger states `≥28%`. It is a floor (the caption at L292 already says so) — make the
     number itself read as a floor, so the two surfaces agree.
  5. Every printed number must be classifiable as **measured** or **riding an assumption**.
     Make that distinction visible in the output, not only in this brief.
- **Verify**: new selftest cases — the estimator computes the documented formula on the
  fixture (whose chars and `output_tokens` are both known constants), and the books still
  close: attributed + char-free + preamble + residual = TOTAL, in integers. `--selftest`
  green, `node tools/lint.mjs` green. Re-run the baseline: record the settled ratio (or
  band), the char-free share, and **how much the category token columns moved** vs. the
  pause package.
- **Read budget**: ~340 lines. **Suits:** `backend`. (If OQ6 = Option A, the manifest + CI
  half suits `devops`; split it into a second session rather than stretching this one.)

### S0.5-3 — occupancy sanity gate + the D7 denominator (D10c + the D11 follow-up)

- **Reads** (~300 lines):
  - `docs/product/decisions/2026-08-02-…-d1-rescope-memo.md` — ranged **L46-68** (M5's
    reconciliation and, critically, the **normalisation slip**: the ledger compared against
    `/context`'s *Messages* sub-total 377.4k while the prompt series also carries the 26.8k
    of skills/agents/system/memory that `/context` breaks out separately) and **L253-283**
    (§3 — the reviewer's share by view, and why the unit, not the aggregation, decides it).
  - `tools/context-attrib.mjs` — **L248-270** (report header, where churn TOTAL is printed
    today), **L296-330** (the D9 table, the namespaced reviewer lookup, and **L317-319 the
    D7 verdict line** that must name its denominator), **L500-511** (the CLI block and the
    usage string).
  - `tools/lint.mjs` (388) — ranged **L355-380** (`checkContextAttrib`) to confirm the gate
    needs **no** change and stays `--selftest`-only. Do not add a real-transcript gate.
  - `.plans/context-economy.md` — **L218-225** (the locked D7 text you append a
    clarification to — **append, never rewrite**).
- **Do**:
  1. **Report both quantities, labelled so they cannot be confused.**
     `churn (Σ positive prompt-deltas) — THE OPTIMISATION TARGET` and
     `occupancy (max prompt / final prompt) — WHAT /context REPORTS`, each with the request
     index and transcript line where the max/final occurs. Add one printed sentence stating
     which question each answers. Churn stays the headline (D10c).
  2. **Re-point the 15% validity gate at occupancy.** Compare **final prompt** and **max
     prompt** against the recorded `/context` figure and print PASS/FAIL at 15%. The
     comparator arrives via a **third CLI form, `--context-total=<tokens>`** (see OQ7): a
     gate computed by hand is exactly what produced the slip in step 3. Absent the flag,
     behaviour is unchanged and exit stays 0. Update the usage string at L506 and the
     header block at L5-6. **Log the third invocation form as a deviation** — the S2 entry
     recorded that only two forms exist.
  3. **Fix the normalisation slip.** The comparator is `/context`'s **TOTAL** (401.4k), not
     the **Messages** sub-total (377.4k). Print which components the prompt series includes
     (system prompt, tool defs, memory, skills) so the next reader cannot repeat the slip,
     and note that the pause package's 5.59× was 5.25× under the correct normalisation.
  4. **D11 follow-up — the 3% trigger must name its denominator.** The D7 verdict line must
     print `reviewer return share = X% of <denominator>`, with the denominator's definition
     **and its value**, and must state that the 3% trigger is a **token-domain share of
     total prompt growth** statement — a char-domain share is not the trigger. Then mirror
     one dated clarification line into the master plan under D7 (append below the locked
     text, marked `2026-08-02 (D11 follow-up)`). **Do not alter D7's locked wording**, and
     do not re-run the D7 verdict as a decision — D11 already ruled: D7 stands.
  5. Nothing else changes: no tool-list edits anywhere, no lint gate change.
- **Verify**: selftest cases — the D7 verdict line names a denominator; `--context-total`
  produces a PASS/FAIL and the flag's absence leaves output otherwise identical;
  `-h`/no-arg usage matches the new form. `--selftest` green, `node tools/lint.mjs` green,
  `git diff` shows no `^[+-]tools:` line in any agent file.
- **Read budget**: ~300 lines. **Suits:** `backend`.

### S0.5-4 — re-run the baseline, record BOTH numbers, assemble the re-decision package

- **Reads** (~260 lines): `.plans/context-economy.md` — the `## Replan 2026-08-02` entry
  and the Phase 0.5 task list; `.plans/context-economy.state.md` — **L70-92** (D10–D12) and
  the three S0.5 handoff entries; `docs/product/decisions/2026-08-02-…-d1-rescope-memo.md`
  — **L87-119** (M8's denominator table, M9, M10) and **L221-249** (§2's recommendation
  table and "what survives"); `tools/context-attrib.mjs` — **L1-45 header only**, for the
  invocation forms. **Nothing else, and never the transcript.**
- **Do**:
  1. Record the target's size **first**: `wc -l` and `wc -c`. It is append-only and already
     grew once (4,438 → 4,612 lines); if it grew again, say so and state plainly that the
     before/after is then across two corpora.
  2. Run the repaired instrument once. Record, in the ledger: churn TOTAL · occupancy
     (max/final) · the collapse ledger + Σ collapse mass · the settled chars/token (with its
     method and band) · the char-free mass share · the category split (**chars primary**,
     tokens secondary + band) · the D9 table · the D7 verdict **with its named denominator**.
     **Record both quantities now** — the corpus cannot be re-run later (architect
     condition 3).
  3. **The sanity gate**: occupancy vs `/context` TOTAL 401.4k at 15%. Report PASS or FAIL.
     A FAIL is a finding to report, never a thing to tune.
  4. **Correct the record without rewriting history**: `isCompactSummary` = **1**, not the
     20 the pause package states (memo M1 — a self-referential grep artefact); collapses =
     **5**, of which exactly **1** is a compaction. Note the supersession in the new entry;
     **do not edit the historical pause-package block**.
  5. **Assemble the P0.5 re-decision package** — one ledger block, for the human at the
     decision point: the repaired numbers · what moved vs. the pause package and why ·
     the three denominators (memo M8) re-derived on the repaired TOTAL · the **retracted
     22.5%** (measured ceiling ≤15.9% char-domain / 2.8–3.7% token-domain) · the restated
     mission headline **~4% addressed / ~1.5–2.5% captured** · one line per held phase
     (P1–P4) on what it is worth under the repaired numbers · the free lever
     (`skill_listing` — the only category whose share *rises* under an occupancy view, memo
     M10) as a re-decision **input**, not as planned work · and the still-open items:
     collapse #4, `attach: other`, the char-free explanation, and n=1 / D4b.
  6. Set `Next up:` to `ckpt-p05`.
- **Verify**: `node tools/lint.mjs` green; the ledger block contains every item in step 5;
  both churn and occupancy recorded; no transcript was Read (state this explicitly).
- **Read budget**: ~260 lines. **Suits:** `backend` (measurement). `analyst` is acceptable
  for step 5 alone, with the numbers handed over — it needs no transcript.

**Checkpoint `ckpt-p05`** ends Phase 0.5 — an independent `reviewer` (fresh context) re-runs
`node tools/lint.mjs` and `--selftest`, **independently re-derives the mutation proof** for
the `prompt = 0` guard (S0.5-1 step 5) rather than trusting the handoff, and verifies:
churn and occupancy are labelled unambiguously and churn is still the headline; the D7
verdict names its denominator and D7 still stands (D11); every deferral (collapse #4,
`attach: other`, the char-free explanation) is **logged**, not silently dropped; and no
number was tuned toward a target. On APPROVE the orchestrator merges
`mission/context-economy-p05` into `mission/context-economy-integration` (batch policy —
**never** the default branch).

> ### ⛔ DECISION POINT — the human re-decides P1–P4
> **P1–P4 are NOT authorized.** After `ckpt-p05`, the S0.5-4 re-decision package goes to the
> human, who re-decides the fate of Phase 1, 2, 3 and 4 with repaired numbers in hand —
> including whether the free `skill_listing` lever is pulled in. Do not spawn S4 or any
> later session on agent judgment. Resuming is a human act, and the outcome lands as new
> dated locked decisions in `.plans/context-economy.md`.

---

## Phase 1 — write firewall (branch: `mission/context-economy-p1`) — **HELD**

> **HELD pending the post-P0.5 re-decision (2026-08-02 replan).** **The premise is
> retracted**: the write firewall was sized on orchestrator Write/Edit at **22.5%**; the
> measured ceiling is **≤15.9%** even under the most generous (NARROW) denominator, and
> **2.8–3.7%** in the token domain (memo M8/M9). Under the architect's recommended
> normalisation the phase buys **~1.5–2.5%** — the cost case for a phase of contract
> engineering is dead. What may survive is *contract hygiene worth doing because it is
> nearly free* (OQ3's one-line `chronicler` addition, the `--body-file` routing). **That is
> a scope call and it is the human's.** Do not run S4. Re-verify every read below before
> un-holding — these line counts are from 2026-08-01.

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

## Phase 2 — standing steers (branch: `mission/context-economy-p2`) — **HELD**

> **HELD pending the post-P0.5 re-decision (2026-08-02 replan).** **Least affected by the
> new evidence**: standing steers are a *fidelity* control (file state preserves decisions
> but loses taste), and their justification never rested on token math — the memo says so
> explicitly (§2, "what survives"). Held only because it is sequenced after P1 and shares
> `mission.md` with it, not because the case weakened. Re-verify the reads before
> un-holding — these line counts are from 2026-08-01.

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

## Phase 3 — post-compaction hook (branch: `mission/context-economy-p3`) — **[STRICT] · HELD**

> **HELD pending the post-P0.5 re-decision (2026-08-02 replan).** **The case is unchanged
> and arguably strengthened as a correctness control.** M1/M2 confirm exactly **one** real
> compaction in a 596-request session — so the hook is not a cost lever (it never was), and
> its value is that *that one* compaction does not lose the ledger. The D8 promote-to-Option-B
> trigger (`isCompactSummary` ≥ 3) is **further** from firing than the ledger's "20" implied:
> the true project count is **1**. Re-verify the reads before un-holding — these line counts
> are from 2026-08-01.

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

## Phase 4 — measure, record, ship (branch: `mission/context-economy-p4`) — **AUTHORIZED (D15)**

> **Re-briefed 2026-08-03.** See `.plans/context-economy.md` `## Replan 2026-08-03`. The
> 2026-08-01 S7/S8 briefs were written against the **retracted 22.5% premise** and are
> replaced wholesale. **The mission WRAPS at P4** — no phase follows it; P1 is **DROPPED**
> (not deferred) and its residue rides here: **(a)** the ~3-line instrument extension naming
> the A4 delta kinds, **(b)** the A5 hook-footprint measurement, **(c)** the discipline lines
> as contract text with **no savings claim**.
>
> **Six small sessions, deliberately.** Ten sessions died on usage limits on 2026-08-03;
> every split so far has survived better than its unsplit alternative. Sequential within the
> phase (S7a → S7b → S7c → S8a → S8b → S8c); **not parallel-safe** — S7b consumes S7a's
> instrument, S7c consumes S7b's numbers, S8c consumes S8b's version bump.

**Standing constraints for every Phase 4 session**

- **Transcript rule applies unchanged** — `wc`, `grep -c`, or pass the path to
  `tools/context-attrib.mjs`. **Never `Read`/`cat`/`head`/`tail` a `*.jsonl`.**
- **D4a is an OBSERVATION, not a pass/fail gate (D13/D15).** A 50% cut to a 4.4–7.2% share
  is 2–3.6% — inside the instrument's own uncertainty band. Nothing in this phase may gate
  on it, and no session may report it as met/not-met. Report the delta and the caveat.
- **D7 and D11 stay LOCKED.** Nothing here re-decides the reviewer's tool list. The
  instrument may pin its trigger; it may not move its verdict.
- **No savings claim on the discipline lines** (D13/D15). They ship as contract text.
- **n = 1 throughout.** Every share is one transcript, one session, one operator, and that
  session was itself a planning mission. Say so wherever a number is stated.
- **Prove new guards by mutation.** A guard that cannot be shown to fail when broken did not
  ship. **Selftest case count must not fall below 44** (measured 2026-08-03).
- **Batch policy (D3):** every session commits to `mission/context-economy-p4`; the phase
  merges into `mission/context-economy-integration` on APPROVE. **Never the default branch.**

### S7a — instrument: name the A4 delta kinds, print the attachment-kind footprint, pin the 3% trigger

_One file: `tools/context-attrib.mjs` (1,234 lines, measured 2026-08-03) plus its selftest.
No measurement run here — S7b does that against the instrument this session ships._

- **Reads** (~250 lines):
  - `tools/context-attrib.mjs` — **L102-116** (the `CATS` taxonomy array — the three
    `attach:` rows live at L110-112), **L184-201** (the attachment sizing block; **L197-199
    is the A4 site** where every unknown kind collapses into `attach: other`, and **L200**
    already accumulates the per-kind map), **L438-446** (the returned result object —
    `attachKinds` is **collected and returned but never printed**; that is the A5 reporting
    gap), **L462-482** (the `GATE_PCT = 15` named-constant pattern — **copy this convention**),
    **L560-585** (`d7Lines`: `shareHi`/`shareLo` and the bare literal `> 3` at **L574-577**),
    **L738-752** (the attach-fallback warn block — the new kind breakdown prints beside it),
    **L1040-1050** (the `attach: hook_success` selftest case — the pattern for a new
    per-kind case), **L1143-1165** (the D7 selftest cases, which any trigger change must
    not weaken).
  - `.plans/context-economy.state.md` — **L240-262** (audit findings **A3**, **A4**, **A5**
    — the spec for this session; do not re-derive them).
- **Do**:
  1. **P1 residue (a) — name the four A4 delta kinds.** Add `deferred_tools_delta`,
     `agent_listing_delta`, `mcp_instructions_delta` and `invoked_skills` as their own
     categories, so they stop collapsing into `attach: other` at L197-199. Keep it
     **additive and mechanical** (~3 lines at the dispatch + the matching `CATS` rows).
     Change no sizing logic: `attach: other` must simply get smaller by exactly the mass
     the four named rows now carry.
  2. **P1 residue (b) — make the A5 hook footprint printable.** `attachKinds` is already
     built (L200) and returned (L445) and **never shown**. Print it as a per-kind chars
     table in the report, **and** print a single named line —
     **`mission machinery footprint`** = `hook_success` + `hook_additional_context` +
     `task_reminder` — with its share of appended chars. The audit's hand figures to
     reproduce (not to hard-code): 113,672 + 19,362 + 10,655 = **143,689 chars = 5.4%**.
     **If a component is not an attachment kind** (`task_reminder` may arrive on another
     record shape), say so in the output and attribute the audit's figure with its
     provenance rather than silently omitting it — an unexplained omission is the same
     failure class as the suppressed D7 verdict.
  3. **A3 — pin the 3% trigger** (planner recommends fixing it here; see the note below).
     Replace the bare literal `> 3` with a named constant beside `GATE_PCT`
     (`D7_TRIGGER_PCT = 3`), state the denominator in its comment, and de-duplicate the
     three prose strings so the threshold appears once. **This does not re-decide D7** —
     D11 is locked and the printed verdict logic is unchanged in behaviour.
  4. **Selftest — every change fails without it.** Add cases: (a) each of the four named
     delta kinds lands in its own category and **not** in `attach: other`, with
     `attach: other` reduced by exactly their sum; (b) the per-kind table prints and the
     machinery-footprint line sums the three hook kinds; (c) the D7 trigger is pinned in
     **both directions** — a fixture share below the trigger reads NOT met, one above reads
     MET — so that mutating the constant `3 → 1` **fails a case** instead of printing the
     self-contradicting verdict the audit reproduced.
     Then **prove by mutation**, both states, with an anti-inert control; record the output
     in the handoff.
- **Verify**: `node tools/context-attrib.mjs --selftest` green with the **new case count
  stated explicitly and ≥ 44** (44 at brief time — S3 mis-stated a count once); mutation
  `D7_TRIGGER_PCT 3 → 1` names at least one failing case, restore ⇒ green; `node
  tools/lint.mjs` green. **Do not run a real transcript in this session.**
- **Read budget**: ~250 lines. **Suits:** `backend`.

### S7b — run the measurement and record the numbers (no code change)

- **Reads** (~200 lines):
  - `.plans/context-economy.state.md` — **L940-1010** (📦 re-decision package §1-§5: the
    repaired numbers, what moved and why, the three denominators, the retracted premise,
    the headline scope claim). **Cite these; do not re-derive them.**
  - `.plans/context-economy.state.md` — **L211-262** (the whole-mission audit A1–A5) and
    **L158-179** (D15).
  - `tools/context-attrib.mjs` — **L1-40** (the CLI header: the three invocation forms and
    the accounting model).
- **Do**:
  1. **Identify this mission's own transcript.** `ls -t
     ~/.claude/projects/-Users-baker-Playground-venture-workflow-plugin/*.jsonl`, then
     `grep -c "context-economy" <file>` on the candidates. **Greps only.** Record the path,
     `wc -l`, byte size and the timestamp of the run — the baseline transcript is
     append-only and this one will be too, so a figure without a size stamp is unreproducible.
  2. **Run `node tools/context-attrib.mjs <path> --context-total=<tokens>`** if a fresh
     `/context` TOTAL is available; otherwise run without it and **say the gate was not
     evaluated** rather than reusing 401,400 from a different session.
  3. **D4a as an OBSERVATION.** Record the authored-Write **share (%)** on this transcript
     beside the baseline's **4.40–7.18% of churn / 9.16% of appended chars**, with the delta
     and **the comparability caveat stated in full** (OQ5: ~8 sessions of contract text vs.
     a 9-session baseline of template authoring; different missions, different shapes).
     **State explicitly that this is not a gate and was not treated as one**, and that a
     50% cut to this share is 2–3.6% — inside the band. **D4b remains the only real
     confirmation and needs a second transcript that does not exist.**
  4. **`isCompactSummary` count.** `grep -l isCompactSummary
     ~/.claude/projects/-Users-baker-Playground-venture-workflow-plugin/*.jsonl | wc -l`.
     **The planning-time value was 1, not the 20 a self-referential grep once suggested**
     (memo M1 — the 19 others were the literal string in this mission's own docs). Record
     the exact command with the number. **≥ 3 promotes D8 to Option B** — if it has reached
     3, that is a finding for the human, not a change to make here.
  5. **A5 — report the hook footprint** from S7a's new output: the per-kind table, the
     machinery-footprint line and its share, against the baseline's 143,689 chars = 5.4%.
     State plainly that **P3 shipped another injecting hook without measuring it**, and give
     that hook's own footprint if it is separable in the kind table.
  6. **A4 — report the delta-kind split** from S7a's new categories, and state the
     correction: **≥ ~80% of the 372,114 chars is the human's own `~/.claude/skills` and MCP
     config, not this repo's surface**; the only in-repo lever is ~9,875 chars of agent
     descriptions. **This is an owner settings action, not engineering.**
  7. **Mirror the headline numbers into the ledger** (a compact block; S7c writes the prose).
- **Verify**: `node tools/lint.mjs` green; every number recorded carries its **status tag**
  (MEASURED / EST-BAND) and its denominator; the ledger's `D4b` row is still `[~]`, never
  `[x]`; **no `*.jsonl` was Read** (state it in the handoff).
- **Read budget**: ~200 lines. **Suits:** `backend`.

### S7c — the record: `docs/product/engineering/context-economy-metrics.md`

_Doc-only. The numbers arrive from S7b; this session does **not** run the instrument and does
**not** touch a transcript. New directory: `docs/product/engineering/`._

- **Reads** (~430 lines):
  - `.plans/context-economy.state.md` — **L211-307** (the whole-mission audit **A1–A10**,
    the process ruling, and the NOT-verified list) and **L940-1105** (the 📦 re-decision
    package in full, §1-§12).
  - `.plans/context-economy.md` — **L235-260** (Phase-4 tasks 17–21 and their acceptance).
  - S7b's ledger block (the fresh numbers).
- **Do** — write the doc. Opening note: this is an **engineering-economics record**, not the
  product tracking plan (`templates/engineering-tracking-plan.md` serves product
  instrumentation, a different consumer). It must contain, honestly and without softening:
  1. **Method** — the instrument, the accounting model, chars primary / tokens banded, the
     zero-dep output-side envelope estimator (OQ6), and the transcript rule.
  2. **The headline, stated as the correction it is:** **~4.4–7.2% addressed / ~1.8–4.3%
     captured**, against a founding claim of **~25% / 10–15%**. Name the denominator every
     time. **n = 1 throughout.**
  3. **A1 — the invariance argument is provably wrong post-repair.** §6's "shares are robust
     to the gate FAIL" held before P0.5 and does not hold after it: the numerator now rides
     `output_tokens` only while the denominator is Σ prompt-deltas of
     `input+cache_creation+cache_read` — **orthogonal**. Consequence, stated plainly: a ~28%
     prompt-series inflation **deflates every share by ~28%**, so the gate FAIL **does**
     bound the share decision.
  4. **A2 — the D7 "straddle" was manufactured by the p90 choice**, not measured: the
     `envSamples` tail (n=594) is smooth with no outlier, 59 of 594 samples already exceed
     the p90 endpoint, and at max the reviewer is **1.92%** — below 3% under any defensible
     endpoint, agreeing with the architect's independent 1.23–1.62%. **Record that D11 stands
     and that this doc does not re-decide D7.**
  5. **A3 — the 3% trigger was a bare literal pinned by zero cases**, and mutating it
     produced a self-contradicting verdict with all gates green. State what S7a did about it
     (fixed, or logged) and which case now pins it.
  6. **A4 — AS CORRECTED.** ≥ ~80% of the 372,114 chars is the human's own
     `~/.claude/skills` (~140 skills, 208k) and MCP config (93k) — **not this repo's
     surface**. The only in-repo lever is **~9,875 chars of agent descriptions**.
     **Reduction is an owner settings action, minutes, not engineering** — and it is a
     larger win than everything P1–P4 could deliver combined.
  7. **A5 — the mission's own machinery is a top-5 consumer**: 143,689 chars = **5.4%**,
     larger than anything P1–P4 could save, never measured until now, and **P3 shipped
     another injecting hook without measuring it**. Give S7b's fresh figure.
  8. **A6 — 34% of transcript records are excluded with no counter** (`last-prompt`, `mode`,
     `ai-title`, `pr-link`, `file-history-snapshot` — 1,583 records), while `badJson` and
     `sidechain` **are** counted and printed. Probably correct; **nobody verified**. Note the
     assistant content loop's missing `else` residual branch.
  9. **A7 — the mission's best corroboration, which nobody stated:** all **480 thinking
     blocks carry `thinking: ""`** — zero persisted chars. That is *why* median q = 1.04, and
     it independently validates the estimator's premise.
  10. **A9 — the reading trap.** The bands are **asymmetric**: the levers sit at the low end
      and the unexplained mass at the high end **simultaneously**, so reading midpoints
      flatters the mission in both directions at once. Honest reading: Write/Edit ≈5.6%,
      UNATTRIBUTED ≈60%, **char-free ≈48.5% — ~10× every lever, owned by no phase.**
  11. **A8/A10 as recorded** — the dogfooding gap, and the wrap-at-P4 judgment.
  12. **What was and was not moved.** Shipped: P0 (instrument), P0.5 (repair), P2 (standing
      steers + `Next up:` agreement + enforcer due-ness), P3 (`SessionStart:compact`
      directive). **Dropped: P1.** Measured-but-unaddressed: the char-free mass, the
      machinery footprint, the owner's settings surface.
  13. **The tracked open items** (copy the ledger's `## Tracked open items` block verbatim so
      they survive the mission ending), and **D4b logged as deferred, non-blocking**.
- **Verify**: `node tools/lint.mjs` green; the doc contains every numbered item above; every
  figure carries a status tag and a denominator; **no claim of savings** appears for the
  discipline lines; the `D4b` ledger row is `[~]`.
- **Read budget**: ~430 lines. **Suits:** `analyst` (doc-only; the numbers are handed over —
  the analyst never needs the transcript).

### S8a — P1 residue (c): the discipline lines, as contract text with no savings claim

_Doc/protocol only, no tool changes. **Atomic-ref invariant:** both WORKFLOW mirrors change
in ONE commit._

- **Reads** (~180 lines):
  - `docs/WORKFLOW.md` — **L468-495** (§6.2 the context firewall: bounded returns +
    fresh-self handoff — the discipline lines land **here**, as a third paragraph).
  - `plugins/agentic-workflow/templates/WORKFLOW.md` — **L476-503** (the same section,
    +8 offset; must end identical in substance).
  - `plugins/agentic-workflow/agents/chronicler.md` — **L1-20** (frontmatter + the
    three-artifact contract) and **L60-70** (the publish/Artifact note) — **OQ3**: PR bodies
    are **not** currently in the contract; add them as a **one-line contract addition**,
    **no tool-list change**.
- **Do**:
  1. Add to §6.2, in both mirrors, as contract text: **the orchestrator authors only the
     ledger and edits under ~15 lines; any longer document goes to a subagent and comes back
     as a path, not as content.** State the reason as **fidelity and division of labour** —
     the heavy reading belongs in the subagent's own window.
  2. **State NO savings figure and make no savings claim** (D13/D15 — the 22.5% premise is
     retracted; the measured share is 4.4–7.2% of churn, and A1 deflates even that by ~28%).
     If a reviewer can read a number out of this text, it is wrong.
  3. **OQ3** — add PR bodies to the `chronicler` contract as one line, and name
     `gh pr create --body-file` as the mechanism.
  4. Do **not** add a hook, a gate or a lint check for these lines. They are discipline, and
     the mission's own audit already says unenforced discipline rots — record that as a
     tracked open item rather than inventing an enforcement mechanism at the wrap.
- **Verify**: `node tools/lint.mjs` green (it cross-checks the WORKFLOW mirrors); `diff` the
  two §6.2 blocks and state they agree; `grep` the new text for `%` and for "save/savings"
  and show zero hits.
- **Read budget**: ~180 lines. **Suits:** `writer` (or `backend` — it is contract prose in
  two mirrored files).

### S8b — chronicler pass (incl. the OWED P2 + P3 passes) + version bump

_The P2 and P3 chronicler passes were **skipped to conserve budget and are OWED** — this
session folds them in, so the CHANGELOG/JOURNEY cover P2, P3 and P4 together._

- **Reads** (~150 lines): `CHANGELOG.md` — **`## [Unreleased]` head only, L1-45** (373 lines
  total, measured 2026-08-03 — **do not read it whole**);
  `plugins/agentic-workflow/.claude-plugin/plugin.json` (11); `.claude-plugin/marketplace.json`
  (17); `.plans/context-economy.state.md` — the checklist **L51-82** and the newest handoff
  entries only.
- **Do**:
  1. Spawn **`chronicler`** for CHANGELOG + `docs/product/JOURNEY.md` + the status page
     `docs/product/overview.html`, covering **P2, P3 and P4** (the two owed passes plus this
     one). Hand it the S7c metrics doc path — it cites, it does not re-derive.
  2. **Then the orchestrator republishes the status page via the Artifact tool** — subagents
     cannot publish. This step is the orchestrator's, always.
  3. **Status-page staleness — DECIDE AND SAY.** The lifecycle / pillars / "Deployed v1.30.0"
     sections have been stale since 2026-07-08 despite v1.39.x and v1.41.0 shipping.
     **Planner's call: fix only the version/deployed stamp and the mission's own rows in this
     session; explicitly DEFER the lifecycle and pillars rewrite** as a tracked open item —
     it is a separate editorial job and this is a wrap session. Whichever way the orchestrator
     goes, **the ledger must say which**, in one line.
  4. **Version bump** in `plugins/agentic-workflow/.claude-plugin/plugin.json` — **minor**
     (new tool `context-attrib.mjs`, new `SessionStart:compact` hook, protocol change in
     WORKFLOW §3/§5/§6.2). Mirror it wherever the marketplace manifest carries a version.
- **Verify**: `node tools/lint.mjs` green (it checks manifests and version stamps);
  `git status --short` clean; the status page's published URL matches its `artifact-url`
  comment; the CHANGELOG entry names P2, P3 **and** P4 and claims **no savings figure**.
- **Read budget**: ~150 lines. **Suits:** the main session (orchestration) + `chronicler`.

### S8c — the integration PR (the human merges)

- **Reads** (~60 lines): the ledger's `Next up:` trailer and the newest handoff entry;
  `git log --oneline main..mission/context-economy-integration` (a command, not a read).
- **Do**:
  1. Merge `mission/context-economy-p4` into `mission/context-economy-integration` on
     `ckpt-p4` APPROVE (batch policy, D3) — **never into the default branch**.
  2. Have the **`chronicler`** author the PR body to
     `.plans/context-economy.artifacts/p4-pr-body.md` — honest headline (**~4.4–7.2%
     addressed / ~1.8–4.3% captured** vs a founding **~25% / 10–15%**), what shipped, what
     was dropped (P1), what stays open, and **n = 1**.
  3. `gh pr create --base main --head mission/context-economy-integration --body-file
     .plans/context-economy.artifacts/p4-pr-body.md`. **Do not push to `main`. Do not merge.
     The human merges once.**
  4. Close the ledger: final handoff entry, the `## Tracked open items` block confirmed
     intact, `D4b` still `[~]`, and **both `Next up:` sites** set to the same terminal
     wording (`checkNextUpAgreement()` fails the gate if they disagree).
- **Verify**: `node tools/lint.mjs` green; `git status --short` clean; the PR exists against
  `main` from `mission/context-economy-integration`; **the orchestrator authored no document
  over ~15 lines this session** (state it explicitly — it is S8a's contract, live).
- **Read budget**: ~60 lines. **Suits:** the main session (orchestration) + `chronicler`.

**Checkpoint `ckpt-p4`** — final reviewer pass over the **whole** integration diff
(`main..mission/context-economy-integration`). It must verify:

- **All gates green** from a clean checkout: `node tools/lint.mjs` (which spawns
  `hook-test.mjs`, `marker-test.mjs` and `context-attrib.mjs --selftest`), with the
  **selftest case count ≥ 44** and stated.
- **The metrics doc is honest about what was and was not moved** — it states A1 (the
  invariance argument is wrong post-repair; every share deflates ~28%), A2, A3, **A4 as
  corrected** (an owner settings action, not engineering), A5, A6, A7, A9, the
  **~4.4–7.2% / ~1.8–4.3%** headline against the founding **~25% / 10–15%**, and **n = 1**.
  A doc that reads as a success story has failed this checkpoint.
- **D4a is presented as an observation, nowhere as a gate**; **D4b is `[~]`, never `[x]`**.
- **D7's untouched-tool-list invariant holds across the whole mission** — `reviewer.md` has
  no Write tool, and nothing in P4 re-decided D7 (D11 locked). The A3 fix, if it landed,
  pinned the trigger without moving the verdict.
- **The discipline lines carry no savings claim** and no enforcement mechanism was invented
  at the wrap.
- **The A4 delta-kind naming is additive only** — `attach: other` shrank by exactly the mass
  the four named rows carry, and no sizing logic changed.
- **The tracked open items survived** into both the ledger and the metrics doc.
- **Batch policy respected**: `main` untouched, one PR, the human merges.

Then the **human merges the integration branch once** and the mission is closed. **Nothing
follows P4.**

---
_Size every brief to its read budget; split any that can't fit and note the split. Each
session's outcome and any deviation lands in `.plans/context-economy.state.md`, never
only in chat._
