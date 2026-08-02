---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: context-economy — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a fresh
agent resumes the mission from this file alone. Write-ahead — update it before ending a
session._

Gate policy: **batch** (D3, recorded at mission start) — each phase branch
`mission/context-economy-p0…p4` merges into **`mission/context-economy-integration`**
by the orchestrator on reviewer APPROVE; **never the default branch**. The human merges
the integration branch **once**, at the end-of-mission confirmation.

**Surfacing under batch:** the human sees no merge prompts until the end. Therefore the
**`ckpt-p3` [STRICT] verdict must be pushed to the human the moment it lands** (owner
channel / direct report), not held for the final PR. Same for any REQUEST CHANGES and
for the D1 pause package.

**UNBLOCKED — OQ1–OQ5 all RESOLVED 2026-08-01** (human accepted every planner
recommendation; details in `## Open questions`). Phase 0 is done and merged.
**Since the 2026-08-02 replan the authorized work is Phase 0.5 only**; `S0.5-1` is done.
**OQ6 was RESOLVED 2026-08-02 — `S0.5-2` is UNBLOCKED** and is next; the phase is
sequential (S0.5-2 → S0.5-3 → S0.5-4 → `ckpt-p05`).

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]` done
(verified, not merely written). The beat-enforcer nudges only on a not-started `[ ]`
checkpoint/reviewer/chronicler row — set `[~]` the moment a beat is picked up or parked._

- [x] S1 — doc-defect sweep: kill "fresh context per tick" (branch `mission/context-economy-p0`)
- [x] S2 — build `tools/context-attrib.mjs` + `--selftest` + lint delegation (branch `mission/context-economy-p0`)
- [x] S3 — run the baseline measurement, record split + D9 table + sanity check (branch `mission/context-economy-p0`)
- [x] Checkpoint `ckpt-p0` — **APPROVE** 2026-08-02 after one corrective session (S3-fix). Scorecard: QA 3 · Security 3 · Efficiency 3 · Architecture 3 · UX 3 · DX 2. Merged into `mission/context-economy-integration` (`273f1d3`, batch policy — main untouched).
- [x] ⛔ **D1 HARD PAUSE — RELEASED 2026-08-02.** Human re-scoped with the measured numbers: **new instrument-repair phase first (P0.5); P1–P4 are NOT authorized and get re-decided after it.** Decisions D10–D12 below.
- [ ] **Phase 0.5 — instrument repair** (briefs authored by the planner 2026-08-02; supersedes direct entry to P1) — branch `mission/context-economy-p05`
  - [x] S0.5-1 — `prompt = 0` phantom-churn guard + collapse ledger + ratchet identity (tasks 22–23)
  - [ ] S0.5-2 — settle the chars/token band + name the char-free mass (task 24) — OQ6 RESOLVED, unblocked
  - [ ] S0.5-3 — occupancy sanity gate + the D7 denominator (tasks 25–26)
  - [ ] S0.5-4 — re-run the baseline, record BOTH numbers, assemble the re-decision package
  - [ ] Checkpoint `ckpt-p05` — phase 0.5 review + merge into integration
- [ ] ⛔ **DECISION POINT — the human re-decides P1–P4** with repaired numbers. Everything below is **HELD and NOT authorized** until this lands as new dated locked decisions.
- [ ] S4 — **HELD** — write firewall: extend the 30% rule to writes; no tool-list change anywhere, per D7 (branch `mission/context-economy-p1`). Premise retracted: Write/Edit is ≤15.9% char / 2.8–3.7% token, never 22.5%.
- [ ] Checkpoint `ckpt-p1` — **HELD** — phase 1 review + merge into integration
- [ ] S5 — **HELD** — standing steers: ledger block + §3-only append + lint grammar check (branch `mission/context-economy-p2`). Fidelity control; case unchanged by the new evidence.
- [ ] Checkpoint `ckpt-p2` — **HELD** — phase 2 review + merge into integration
- [ ] S6 — **HELD** — `SessionStart:compact` re-read directive + hook-test cases (branch `mission/context-economy-p3`). Correctness control; case unchanged (exactly 1 compaction confirmed).
- [ ] Checkpoint `ckpt-p3` **[STRICT]** — **HELD** — phase 3 review; **surface the verdict to the human immediately** (batch gating shows no merge prompt); merge into integration
- [ ] S7 — **HELD** — re-measure (D4a), `isCompactSummary` count, `docs/product/engineering/context-economy-metrics.md` (branch `mission/context-economy-p4`). D4a's design and the doc's headline are both downstream of P0.5.
- [ ] S8 — **HELD** — chronicler + CHANGELOG + version bump + integration PR (branch `mission/context-economy-p4`)
- [ ] Checkpoint `ckpt-p4` — **HELD** — final review of `main..mission/context-economy-integration`; **human merges once**
- [~] D4b — cross-mission re-measurement on a later comparable mission (deferred, non-blocking, tracked)

## Open questions

_OQ1–OQ5 RESOLVED 2026-08-01 — the human accepted every recommendation. Locked below.
**OQ6 and OQ7 opened at the 2026-08-02 replan** and live in full in
`.plans/context-economy.md` `## Open questions`:_

- **OQ6 — RESOLVED 2026-08-02 (human): zero-dep estimator, chars primary.** No tokenizer,
  no `package.json`, no lockfile, no CI install step. `S0.5-2` implements a **zero-dep
  output-side envelope estimator**; **character counts are the primary reported figure**
  (model-free and exact) and tokens are a derived estimate that must always carry its
  stated band. **This amends D10(b)**, which said "with a real tokenizer" — the human
  unlocked that clause specifically, on the grounds that a bare-checkout CI has no
  dependency-resolution surface to attack (cf. the 2026-07 supply-chain incident) and the
  band narrows but never fully closes either way. **`S0.5-2` is UNBLOCKED.**
- **OQ7 — OPEN (low stakes) — add `--context-total=<tokens>` as a third CLI form?**
  Planner recommends yes; the hand comparison is what produced the 377.4k/401.4k slip.
  Absent a ruling the recommendation stands, and the reviewer may overrule at `ckpt-p05`.

- **OQ1 — RESOLVED (yes).** Fix this repo's own `docs/WORKFLOW.md` mirror sites
  (L19-21, L275-281, L645-648) in the same P0a commit; **do not touch the version stamp**.
- **OQ2 — RESOLVED (yes, in-repo only).** Correct the launch copy (`hacker-news.md:48`,
  `dev-to.md:72`, `positioning.md:70`). **No erratum and no re-publication** — verified
  2026-08-01 that `publish-log.md` is empty: this copy was never fired outward, so it is
  unpublished draft material and a plain correction is sufficient.
- **OQ3 — RESOLVED (add the contract).** PR bodies are NOT currently in `chronicler.md`'s
  contract — it names exactly three artifacts (D7's brief wording "already its contract"
  was factually wrong for PR bodies). P1 adds them as a **one-line contract addition**;
  **no tool-list change**. Use `gh pr create --body-file`.
- **OQ4 — RESOLVED.** The P2 lint grammar check validates **only ledgers that already
  carry a `## Standing steers` block** (three legacy ledgers have none and must not fail),
  and separately **requires the block in `templates/mission-state.md`**.
- **OQ5 — RESOLVED.** D4a reports the authored-Write **share (%)** delta with the
  comparability caveat stated explicitly (this mission is ~8 sessions of contract text vs.
  the 9-session baseline of template authoring); **D4b remains the real confirmation**.

## D1 re-scope decisions (locked 2026-08-02 by the human)

_Taken at the D1 pause with the architect's options memo (`549241f`) in hand. Locked —
not re-litigated by any later session._

- **D10 — Instrument repair comes first (new Phase 0.5).** P1–P4 stay unauthorized until
  it lands and the numbers are re-decided. Scope: (a) the `prompt = 0` record that
  manufactures 513,634 tok = **24.4% of TOTAL** in phantom churn; (b) settle the
  load-bearing **3.2–4.2 chars/token** band with a real tokenizer; (c) re-point the 15%
  sanity check at **occupancy** (max/final prompt) while **churn remains the optimisation
  target** (architect's decision-1 recommendation, accepted). Rationale: the mission's
  founding premise moved (orchestrator Write/Edit ≤15.9%, never 22.5%), so building P1
  on it would be building on a retracted number.
- **D11 — D7 stays LOCKED; the reopen is recorded as a normalisation artefact.** The 4.0%
  trigger does not survive the token-domain denominator (reviewer = **1.23–1.62%**, below
  3%). The `reviewer` agent keeps its no-Write structural guarantee. The reviewer's safety
  argument and the architect's independent measurement agree. **Follow-up owed:** the 3%
  trigger must name the denominator it measures against, or the next reopen is another
  artefact.
- **D12 — OQ2 stands as originally resolved: the launch copy is UNPUBLISHED.** S1's
  in-repo correction is sufficient; **no erratum, no outward action**. The `publish-log.md`
  evidence is accepted over the reviewer's flag.

## Standing steers

_Human steers captured **verbatim** at checkpoints only, never mid-brief. Grammar:_
`- YYYY-MM-DD (ckpt <id>) — "<exact words>"`. _Retire by ~~strikethrough~~, never delete.
(Convention ships in P2; usable here from mission start.)_

(none)

## Deviations

_Any departure from a brief — logged here the moment it happens, with why. Deviating is
allowed; deviating silently is not (§4)._

- 2026-08-02 (replan, planner) — **record correction, logged not rewritten.** The D1 pause
  package states "20 `isCompactSummary` records"; the true count is **1** (memo M1 — the
  other 19 are the *string* appearing inside this mission's own docs, a self-referential
  grep artefact). The historical entry is **left as written** (completed work is history);
  `S0.5-4` records the corrected figure in the new package. Consequence for D8: the
  promote-to-Option-B trigger (≥3) is further from firing, not closer.
- 2026-08-02 (replan, planner) — **record correction (`ckpt-p0` nit 1).** The pause package
  cites `tools/context-attrib.mjs:171` for "persisted counts serialized `tool_use` JSON as
  assistant text"; the actual line at that revision is **`:173`** (`assistantChars += n`).
  Historical entry left intact; the line moves again during Phase 0.5, so future citations
  must be re-derived rather than copied. (`ckpt-p0` nit 2 — the script printing `~28%` vs
  the ledger's `≥28%` — is folded into `S0.5-2` step 4 as a code change.)
- 2026-08-02 (replan, planner) — **ledger reconciled against git; no drift found.** P0's
  four commits (`03dea55`, `8fa357d`, `51cb366`, `dca7072`), the merge `273f1d3`, and the
  `mission/context-economy-p0` branch all match the checked rows; `mission/context-economy-p05`
  does not exist yet, as expected. No checkbox was corrected. Recorded because a replan that
  finds nothing must say so.

- 2026-08-01 (S2) — D9 is emitted **unconditionally**, not behind "one flag on the script"
  (brief L107). It is a required Phase-0 output, so a flag only adds a way for S3 to forget
  it. No other CLI form exists beyond `<transcript.jsonl>` and `--selftest`.
- 2026-08-01 (S2) — three modeling choices the brief left open, all printed by the tool so
  S3/the reviewer can re-derive them: (a) TOTAL = Σ prompt-delta over unique requestIds
  (context *occupancy*), not Σ per-line usage; (b) the **first** window is excluded from the
  chars/token calibration — prompt_0 is system prompt + tool defs + CLAUDE.md, which never
  appear in the transcript; its tokens still count in TOTAL and land in UNATTRIBUTED, broken
  out as "session preamble"; (c) tool inputs that are neither Write/Edit nor Bash (Read,
  Grep, **Agent spawn prompts**) are left in UNATTRIBUTED rather than smeared into a named
  category — the residual-composition breakdown names them, and the D9 table sizes the Agent
  slice separately (so D9 spawn chars are a cross-cut, not a tenth category).

- 2026-08-01 (S3) — **three script fixes made AFTER seeing the 377.4k target** (disclosed
  per brief step 4). None was tuned to hit the target; the sanity check still fails at 5.6x
  after all three, and fix (a) leaves TOTAL bit-identical.
  (a) **Calibration unit inversion.** `ratio` was derived as `calDelta/calChars` — tokens
  per char (0.80) — while being labelled `chars/token` and applied as `chars / ratio`.
  Dimensionally wrong: it inflated every category by `1/ratio²` (×1.55) and drove
  UNATTRIBUTED to **−30%**, which is impossible under the script's own stated model. Now
  `calChars/calDelta` = **1.25 chars/token**; residual is **+16.1%**. TOTAL unchanged.
  The 15-case S2 selftest missed this because the fixture is, by its own comment,
  "sized so the true chars/token ratio is deliberately ≈1" — the single value at which an
  inversion is a no-op. Added a residual-non-negativity case. **(S3-fix: that case was
  INERT — at the fixture's ratio of 1.373 an inversion still could not drive the residual
  negative, so only the formula-mirror case caught the mutation. Fixture resized to
  ratio ≈2.8; the guard is now verified independent by mutation.)**
  (b) **D7 verdict was silently suppressed.** The reviewer lookup was `agents.get('reviewer')`
  but real transcripts emit the plugin-NAMESPACED `agentic-workflow:reviewer`, so the run
  printed "no Agent blocks — D7 reopen test not exercised" while the table showed the
  reviewer at 4.0%. Now matched on the final `:` segment. The fixture's bare `'reviewer'`
  was changed to the namespaced form (it was hiding the bug) and a case pins the resolution.
  **Consequence: D7 IS reopened — this was a false negative, not a non-result.**
  (c) **Attachment fallback mass instrumented** (brief step 5): the warning counted records
  but not chars, so its blast radius was unjudgeable. It now prints affected chars + share.
- 2026-08-02 (S3-fix) — **F5 nit 1 answered differently than the reviewer framed it.** The
  brief said to name the residual over-subscription (426.7k tok of components inside a
  339.7k residual) as "the third consistency signal". It is named — but as a **closure
  check that PASSES**, not as a third sign of inflation, because it is not independent: the
  87,026 tok of over-subscription equals the 108,350 chars that are attributed yet excluded
  from calibration ÷ 1.245 = 87,027 tok (a 1-token match), and it is computed from the same
  disputed ratio. Presenting it as corroboration would have re-committed F3 one paragraph
  after fixing it. Flagged for the reviewer/human to overrule if they disagree.
- 2026-08-02 (S0.5-1) — **the brief's predicted TOTAL was not met, and was not chased.**
  Predicted `2,108,485 − 513,634 = 1,594,851`; measured **1,707,036** (`−401,449`). The
  guard removes exactly the re-billed resident context (the degenerate collapse was
  401,449 → 0); the remaining 112,185 is real growth from 401,449 to the 513,634 final
  prompt and stays in churn. Nothing was tuned; the arithmetic is printed by the tool
  (ratchet identity PASS). The prediction conflated phantom churn with all churn billed
  after the reset.
- 2026-08-02 (S0.5-1) — **collapse #4 deferred, reported (brief step 4).** The shipped
  ledger flags it (`req idx 551`, line 4,222, −270,711, no adjacent compact summary) as
  UNEXPLAINED and prints that it is deliberately not modelled. Tracked non-blocking in the
  shape of D4b. The same flag also fires on the memo's "noise" rows #1/#2 (3,106 / 1,778):
  the adjacency test is mechanical with no size threshold — deliberately, since a
  threshold would be a modelling choice this phase is not authorized to make.
- 2026-08-02 (S0.5-1) — **`req idx` runs +1 vs. memo M2** (mine 237/241/310/551 vs. the
  memo's 236/240/309/550): the shipped ledger indexes the collapsing request itself,
  1-based over requests with usable usage. **Line numbers match the memo exactly**
  (1,829 / 1,873 / 2,569 / 4,222), so the rows are the same rows. Nothing moved.
- 2026-08-02 (S0.5-1) — the handoff entry below exceeds "≤10 lines per entry". The before/
  after of a measurement change plus the mutation proof does not compress further without
  dropping a number a reviewer must re-derive. Normal bound resumes at `S0.5-2`.
- 2026-08-02 (S3-fix) — the S3-fix handoff entry also exceeds "≤10 lines per entry":
  five findings each need their own resolution line at a hard pause. Normal bound at S4.
- 2026-08-01 (S3) — the handoff entry below exceeds the log's "≤10 lines per entry" rule.
  Deliberate: the brief requires the D1 pause package as ONE block in the handoff entry, and
  the human reads it at a hard pause with no other surface. Normal bound resumes at S4.

- 2026-08-01 (S1) — routed to `backend` rather than the brief's "main session / writer":
  the session's own verify gate needs Bash (`node tools/lint.mjs`), which the `writer`
  agent does not have. No change to the work itself.

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and what the
next session needs. Newest on top; crash-safe by write-ahead._

- _2026-08-02 (`S0.5-1`, `backend`, branch `mission/context-economy-p05`):
  `tools/context-attrib.mjs` — `prompt = 0` records are skipped as prompt observations
  (no window, no `prevPrompt` reset), counted in a printed `degenerateUsage`; new collapse
  ledger (idx · line · before · after · drop · compact-summary adjacency) with Σ collapse
  mass; printed ratchet identity with PASS/FAIL. **Verify:** `--selftest` clean at **22
  cases** (17 pre-existing + 5 new), `node tools/lint.mjs` clean. **Mutation proof (scratch
  copy):** guard deleted ⇒ **7 FAIL** (TOTAL 3,600 vs 2,600 · `degenerateUsage` 0 · 2
  collapses incl. one to 0 · 2 unexplained · plus the two legacy cases pinning `total ===
  2600`); restored ⇒ 22/22 ok. **TOTAL 2,108,485 → 1,707,036 (−401,449, −19.0%)** on the
  same 4,612-line / 12,211,203-byte corpus. The brief predicted −513,634; **it landed at
  −401,449 and that is the finding, not an error** — 513,634 is the *final prompt* (memo
  M3), i.e. all churn billed after the reset, of which only the 401,449 re-bill was
  phantom; the 112,185 of growth from 401,449 up to 513,634 is genuine and correctly
  retained. Instrument now confirms memo M1/M2 independently: **4 collapses** (was 5),
  **`isCompactSummary === true` = 1**, ratchet PASS (1,707,036 − 1,193,402 = 513,634 =
  final prompt), occupancy unchanged. Knock-on for `S0.5-2`: calibration moved **1.25 →
  1.55 chars/token** (calDelta shrank), so category token columns fell ~19% while **chars
  are bit-identical** and shares moved ≤0.1pt; the output-side line moved ~28% → ~42%.
  D7 reviewer share is **invariant at 4.0%** (numerator and denominator scale together) —
  D11 stands; `S0.5-3` owns the denominator. Deferred + now visible in the output:
  **3 collapses have no adjacent compact summary** (memo's #1/#2 "noise" 3,106/1,778 and
  the unexplained #4, 270,711 @ line 4,222) — flagged, not modelled, per brief step 4.
  **Next: `S0.5-2` (blocked on OQ6) or `S0.5-3`.**_

- _2026-08-02 replan (`planner`, branch `mission/context-economy-integration`): authored
  **Phase 0.5 — instrument repair** into the trio (plan tasks 22–26, four briefs
  `S0.5-1`…`S0.5-4` + `ckpt-p05` + a decision point), per D10. Held S4–S8 / P1–P4 with a
  one-line honest note each — **P1's premise is retracted** (Write/Edit ≤15.9% char /
  2.8–3.7% token, never 22.5%); P2/P3 are fidelity/correctness controls whose case never
  rested on token math; P4 is downstream of P0.5. Deferred-but-reported inside P0.5:
  collapse #4's root cause, the char-free *explanation*, `attach: other`, D4b. Opened
  **OQ6** (tokenizer dependency — blocks `S0.5-2` only; a flagged tension with D10(b)'s
  wording, left for the human) and **OQ7** (third CLI form). No locked decision re-opened;
  no completed row or historical entry rewritten; two record corrections logged as
  deviations. Verified: `node tools/lint.mjs` clean. **Next: `S0.5-1`** — it is not blocked
  by OQ6._

- _2026-08-02 D1 options memo (`architect`, `549241f`, advisory — decides nothing):
  `docs/product/decisions/2026-08-02-context-economy-d1-rescope-memo.md`. **The 5.59× is
  FULLY EXPLAINED**: ratchet 4.105× × (final-prompt 513,634 ÷ 377.4k = 1.361) = 5.587×, no
  residual. Occupancy hypothesis CONFIRMED; per-request prompt is sound, only the
  aggregation answered a different question. **Corrections to the ledger's own record**:
  `isCompactSummary` = **1**, not 20 (grep artefact — the mission's docs mention the
  field); one **prompt=0 record manufactures 513,634 tok = 24.4% of TOTAL** in phantom
  churn; the chars/token anomaly is **not** the ratchet (56–66% of prompt growth is
  char-free); orchestrator Write/Edit is **≤15.9%, never the 22.5%** the mission was
  premised on. **Headline scope falls to ~4% addressed / ~1.5–2.5% captured.** D7's 4.0%
  is robust to decision 1 but **not** to decision 3 — in tokens the reviewer is 1.23–1.62%,
  below the 3% trigger, i.e. the reopen looks like a normalisation artefact. Unresolved:
  the 3.2–4.2 chars/token band is load-bearing and unverified; collapse #4 unexplained;
  `attach: other` still unvalidated; n=1. Script byte-identical, lint clean.
  **Mission remains STOPPED at D1 — this memo is input, not a decision.**_

- _2026-08-02 `ckpt-p0` (reviewer, re-review after S3-fix): **APPROVE**. Scorecard QA 3 ·
  Security 3 · Efficiency 3 · Architecture 3 · UX 3 · DX 2. Re-ran every gate: lint clean;
  `--selftest` 17 ok; fail-closed negative check reproduced; **restraint confirmed — TOTAL
  bit-identical at 2,108,485**, D9 reviewer 4.0%, all category rows digit-for-digit, 5.59×
  sanity failure standing; S1 sweep re-derived. F1–F5 all verified fixed; F2 mutation
  re-run independently (residual guard fails with the mirror case forced true). **Ruled
  for S3-fix on F5-nit-1**: the over-subscription is an algebraic identity
  `(charsSeen − calChars)/r` = 87,026.5 vs observed 87,026, positive for ANY ratio →
  zero information, not a third signal. Merged P0 → integration `273f1d3`. Non-blocking
  nits for later: ledger cites `:171`, actual is `:173`; script prints "~28%" vs ledger
  "≥28%". **Mission now STOPS at the ⛔ D1 HARD PAUSE.**_

- _2026-08-02 S3-fix (`backend`, branch `mission/context-economy-p0`): corrective pass on
  the `ckpt-p0` REQUEST CHANGES — all five findings landed, **no number improved**.
  **F1** the printed calibration narrated the S2 inversion (`tokens ÷ chars` = 0.80) while
  computing the opposite; both the script line and the package line now read
  `2,551,168 chars ÷ 2,049,094 tokens` = 1.25, so a hand re-derivation lands on 1.25.
  **F2** the residual-non-negativity guard was inert — at the fixture's ratio 1.373 an
  inversion could not break the invariant, so only the formula-mirror case (a self-
  consistent pin, the same blind spot that shipped the S2 bug) fired. Resized `writeBody`
  200→2,200 chars so `calChars ≈ 2.8 × calDelta`; **proved by mutation** that the residual
  guard now fails alone (below). Replaced the sidechain case's size-proxy assertion
  (`no row ≥500 chars`, which the resize would have broken) with a named one.
  **F3** the package sold the 5.59× TOTAL gap and the 1.25 ratio as independent
  corroboration; they are one signal (`ratio = calChars÷calDelta`, `calDelta = TOTAL−preamble`)
  and they imply **different factors (~2.9× vs 5.59×)** — rewritten to say so, with the
  unexplained ~1.9× named as what churn-vs-occupancy must carry.
  **F4** the ~28% unpersisted-thinking conclusion is downgraded to a **floor** (rides the
  disputed ratio; counts `tool_use` JSON as persisted text, `:171`) — it no longer overturns
  the plan's 61–66%. **F5** residual over-subscription named + explained (it closes to 1
  token); "18 ok"→17 ok; the attachment fallback warning now names `attach: other` as the
  category it invalidates. Verified: `--selftest` 17 ok exit 0 · `node tools/lint.mjs` clean
  · negative check (script moved away ⇒ lint exit 1 "harness missing", restored ⇒ clean) ·
  baseline re-run on the unchanged 4,612-line / 12,211,203-byte transcript → **TOTAL still
  2,108,485 bit-identical**, reviewer row still **4.0%**, 5.59× sanity failure still stands.
  **Mutation proof (F2):** `ratio := calDelta/calChars` ⇒ residual case FAILS
  (`attributed=10,229 > TOTAL=2,600`, `unattributed=−7,629`) **and still fails with the
  mirror case neutered** ⇒ independent. Restored ⇒ 17 ok, exit 0. Mission still STOPS at
  the D1 hard pause; `ckpt-p0` is the reviewer's to re-verify._

- _2026-08-01 S3 (`backend`, branch `mission/context-economy-p0`): ran the baseline
  measurement and assembled the **D1 pause package** (below). Verified: `--selftest` 17 ok
  (S3 wrote "18 ok"; the actual case count was 17 — corrected at S3-fix),
  `node tools/lint.mjs` clean, script exit 0. Three script defects found and fixed mid-run
  (see `## Deviations` — disclosed as post-target fixes). **The mission now STOPS at D1.**_

### ⛔ D1 PAUSE PACKAGE — baseline measurement (read the validity finding FIRST)

**Target** `2fa752c7-…-ec63daee6496.jsonl`, measured 2026-08-01 at **4,612 lines /
12,211,203 bytes** (11.6 MiB). Append-only: it GREW from the planning-time 4,438 lines /
11.2 MB, so this is a different, larger file than the one the estimates were made against.
596 unique requests · 951 duplicate usage lines deduped · 0 unparsable · 0 sidechain.

**🔴 VALIDITY FINDING — these numbers are NOT trustworthy as absolute token counts.**
Script TOTAL = **2,108,485 tok** vs. the recorded `/context` Messages figure **377.4k** →
**5.59×, +459% divergence**, vastly beyond the 15% threshold. Per plan task 6 this is an
explicit script-validity finding: *the absolute magnitudes must not be used to size a
re-scope.*

**ONE signal seen two ways — NOT two independent confirmations** (corrected at S3-fix; the
S3 wording overstated the evidence). The derived **1.25 chars/token** is sub-plausible for
text (English ≈3.5–4; the plan expected ≈2.0), but it is not a second witness:
`ratio = calChars ÷ calDelta` and `calDelta = TOTAL − preamble`, so the ratio anomaly *is*
the TOTAL anomaly divided by a directly-measured char count. Counting both is counting one
observation twice.
**What IS informative is that the two views disagree on the size of the error.** Re-scaling
the 2,551,168 calibration chars at a plausible ~3.8 chars/token implies TOTAL ≈ 731k tok, a
**~2.9× inflation** — not the **5.59×** the `/context` comparison implies. So the
implausible ratio accounts for only about half the gap (2.9 × 1.9 ≈ 5.6); a residual
**~1.9×** is left unexplained by any chars/token story. That leftover is precisely what the
churn-vs-occupancy hypothesis below has to carry — and it is the thing to test first.

**Likely root cause (NOT fixed — it is a modeling
decision that belongs to the human):** TOTAL is `Σ max(0, prompt-delta)`, positive deltas
only. This session compacted (20 `isCompactSummary` records); every compaction collapses
the prompt and the re-accumulation is counted again. So the script measures cumulative
context **churn over the session**, while `/context` reports **point-in-time occupancy** —
arguably two different quantities, not merely a bug. **Decide which one the mission targets
before P4's re-measurement (D4a) is designed, or the before/after will be meaningless.**

**What survives the finding:** category **chars** are directly measured and model-free.
And `share = chars_i × (calDelta/calChars) ÷ total`, where `calDelta` and `total` both
scale with the inflation — so *if* inflation were uniform across windows the share column
is invariant to it. Compaction re-counting is concentrated, not uniform, so treat shares as
**approximately robust, ±a few points**; treat token columns as **unusable**.

**Category split** (token share | char share — prefer the char column):
| category | chars | tokens | tok share | char share |
|---|---|---|---|---|
| human steers | 76,007 | 61,049 | 2.9% | 2.9% |
| orchestrator prose | 273,235 | 219,462 | 10.4% | 10.3% |
| authored: Write/Edit inputs | 243,578 | 195,641 | 9.3% | 9.2% |
| authored: Bash commands | 165,629 | 133,033 | 6.3% | 6.2% |
| tool results | 377,452 | 303,169 | 14.4% | 14.2% |
| subagent returns | 400,738 | 321,872 | 15.3% | 15.1% |
| attach: skill_listing | 208,338 | 167,337 | 7.9% | 7.8% |
| attach: hook_success | 113,672 | 91,301 | 4.3% | 4.3% |
| attach: other | 343,579 | 275,962 | 13.1% | 12.9% |
| **UNATTRIBUTED** | — | 339,659 | **16.1%** | 17.2% |
| TOTAL | 2,659,518 | 2,108,485 | 100.0% | 100% |

Derived **chars/token = 1.25** — that is **2,551,168 chars ÷ 2,049,094 tokens**, first
window excluded (chars on top, tokens underneath; re-deriving it the other way round gives
0.80 and is the S2 inversion bug, now fixed and guarded).
**UNATTRIBUTED = 16.1%**, printed and never redistributed. Largest known components inside
it: Agent spawn prompts 264,434 chars, `user:meta` 80,554, `AskUserQuestion` 60,691,
session preamble ~59,391 tok.

**Third consistency check — the residual is over-subscribed by 26%, and it closes.** The
named components inside UNATTRIBUTED sum to **~426,685 tok** against an UNATTRIBUTED of
**339,659 tok** — 26% more than the bucket they sit inside, which the printed caption
discloses but does not explain. It resolves exactly: the 87,026 tok of over-subscription
equals the **108,350 chars that are attributed but excluded from calibration** (the
pre-first-request window plus 772 trailing chars) ÷ 1.245 = 87,027 tok — a **1-token
match**. Read it for what it is: a **closure check on the bookkeeping, which PASSES**, not
a third independent sign of inflation (calling it one would repeat the error corrected
above — it is computed from the same disputed ratio).

**Output-side — a FLOOR, not a measurement; it does NOT overturn the plan's 61–66%.**
Σ output 1,144,454 tok vs ~825,971 tok of persisted assistant text → **≥28% of output has
no persisted text**. Two caveats, inline, both pushing the same direction: (a) it **rides
the disputed ratio** — `persisted = assistant chars ÷ 1.25` — so a token scale this package
has just declared unusable is what sets it, and a higher true ratio shrinks `persisted` and
*raises* the unpersisted share; (b) `persisted` counts serialized `tool_use` JSON as
assistant *text* (`tools/context-attrib.mjs:171`), inflating the persisted side. Both
inflate `persisted`, so 28% is a lower bound. The plan's 61–66% estimate is **not refuted
— only unconfirmed**, and drawing a token-scale conclusion here at all is in tension with
the validity finding above.

**D9 — per-`subagent_type` (return share of TOTAL):**
| subagent_type | spawns | spawn chars | returns | return chars | return tok | share |
|---|---|---|---|---|---|---|
| **`agentic-workflow:reviewer`** | **19** | **55,511** | **19** | **106,258** | **85,346** | **4.0%** |
| `agentic-workflow:brainstormer` | 9 | 31,362 | 10 | 76,862 | 61,735 | 2.9% |
| `Explore` | 3 | 6,159 | 5 | 68,520 | 55,035 | 2.6% |
| `general-purpose` | 12 | 37,815 | 12 | 35,243 | 28,307 | 1.3% |
| `agentic-workflow:advisor` | 8 | 24,607 | 12 | 30,970 | 24,875 | 1.2% |
| `agentic-workflow:backend` | 10 | 44,915 | 10 | 27,819 | 22,344 | 1.1% |
| `agentic-workflow:architect` | 4 | 15,963 | 4 | 26,063 | 20,934 | 1.0% |
| `agentic-workflow:planner` | 5 | 28,831 | 5 | 12,331 | 9,904 | 0.5% |
| `agentic-workflow:frontend` | 2 | 7,384 | 2 | 4,607 | 3,700 | 0.2% |
| `agentic-workflow:researcher` | 1 | 3,914 | 1 | 4,103 | 3,296 | 0.2% |
| `claude-code-guide` | 1 | 1,564 | 1 | 3,670 | 2,948 | 0.1% |
| `agentic-workflow:security` | 1 | 3,363 | 1 | 3,212 | 2,580 | 0.1% |
| `agentic-workflow:analyst` | 1 | 3,046 | 1 | 1,080 | 867 | 0.0% |

**🔴 D7 VERDICT — REOPENED.** `reviewer` return share **4.0% > 3%** → per plan task 4 this
**reopens decision D7** ("the reviewer is NOT touched"). The reviewer is the single largest
subagent consumer: 19 spawns, 106k return chars, plus 55.5k of spawn-prompt chars sitting
in UNATTRIBUTED (~161k chars total, ~6.1% of all appended chars). Note this verdict was
INITIALLY REPORTED AS "not exercised" by a namespace bug (Deviations (b)) — the D7 trigger
was a false negative that only surfaced because the table row was read by hand. **The human
must decide whether D7 stands**; P1 task 10 currently mandates zero reviewer changes, and
its stated rationale (the reviewer's `tools:` line is the fleet's only structural
guarantee) is a safety argument that the 4.0% cost figure does not by itself defeat.

**Re-scope inputs — measured vs. planning-time estimate:**
| input | planning-time | measured (tok share) | verdict |
|---|---|---|---|
| `attach: skill_listing` "free lever" | ≈16.0% | **7.9%** | **~half** the estimate. Still a zero-engineering lever, but worth ~8%, not ~16%. |
| `tool results` (untouched by all 4 phases) | ≈25.1% | **14.4%** | **~half** the estimate. The out-of-scope gap is smaller than feared. |
Both estimates are ~2× the measurement in the same direction, which suggests the planning
figures used a different (smaller) denominator — probably excluding UNATTRIBUTED and/or
`attach: other`. Against a denominator of just the seven non-attach, non-residual
categories, skill_listing ≈ 13.5% and tool results ≈ 24.5%, close to the planning numbers.
**So the two estimates were probably not wrong, just differently normalised — but the
mission's "addresses ~25% of consumption / realistic capture 10–15%" risk statement was
built on the larger normalisation and should be re-derived before P1–P4 are re-scoped.**

**S2's three modeling caveats (read the split WITH these attached):**
1. TOTAL = Σ prompt-delta over unique requestIds = context *occupancy*, not Σ per-line
   usage. (This is exactly the choice the validity finding calls into question.)
2. The **first window is excluded from calibration** — prompt_0 is system prompt + tool
   defs + CLAUDE.md, none of which appear in the transcript. Its tokens still count in
   TOTAL and land in UNATTRIBUTED, broken out as "session preamble" (~59,391 tok).
3. Tool inputs that are neither Write/Edit nor Bash (Read, Grep, **Agent spawn prompts**)
   are left in UNATTRIBUTED rather than smeared into a named category. So the authored-
   content categories **understate** orchestrator-authored bytes, and D9 spawn chars are a
   cross-cut of the residual, not a tenth category.

**Attachment-schema finding (brief step 5) — the S2 field-order guess is materially wrong.**
The fallback warning **FIRED**: 77 attachments had none of `stdout`/`content`/`text`/
`output` and were sized on the whole record minus `type`, affecting **307,136 chars =
11.5% of all appended chars**. That is **89% of the entire `attach: other` category**
(343,579 chars), so `attach: other` at 13.1% is essentially an unvalidated number and is
probably **over**-stated (the whole record carries ids/metadata the model never sees).
S2 flagged this field order as a guess; the guess did not hold. **Anyone acting on
`attach: other` must first dump one real attachment record's key set** (a schema question,
not a measurement question) — that work is not in any current phase.

**Recommended decisions for the human at this pause:** (1) accept or reject the
churn-vs-occupancy model before D4a is designed; (2) rule on D7 given 4.0%; (3) confirm
which normalisation the ~25%/10–15% scope claim should use; (4) decide whether the
attachment-schema check is pulled in or deferred.

- _2026-08-01 S2 (`backend`, branch `mission/context-economy-p0`): built
  `tools/context-attrib.mjs` — zero-dep, `readline`-streamed (never loads or prints
  transcript content) — plus a 15-case `--selftest` over a synthetic fixture in a throwaway
  tmpdir, and fail-closed `checkContextAttrib()` in `tools/lint.mjs` (shape of
  `checkMarkerMutation`; `--selftest` only, never a real transcript). All four landmines
  covered (usage deduped by `requestId`; UNATTRIBUTED printed, never redistributed;
  chars/token DERIVED per transcript, no `/4`; attachments sized on the injected field) and
  the D9 per-`subagent_type` table is always emitted with a reviewer >3% → reopen-D7 callout.
  Verified: `--selftest` exit 0 (15 ok); `node tools/lint.mjs` clean; NEGATIVE CHECK — script
  moved away ⇒ lint FAILS "context-attribution harness missing", restored ⇒ clean. S3: run
  `node tools/context-attrib.mjs <transcript.jsonl>` (only two invocation forms exist, that
  and `--selftest`; D9 needs no flag) and read the printed table — never the transcript._

- _2026-08-01 S1 (`backend`, branch `mission/context-economy-p0`): corrected the false
  "fresh context per tick" claim at all 12 sites with one consistent wording — `/loop` is
  session-scoped, ticks accrete in the same transcript, genuine fresh context needs
  `/clear` / new session / scripted `claude -p`; what makes loop mode safe is that state
  lives in files. Sites: `commands/mission.md`, `commands/autopilot.md`, plugin `README.md`,
  `templates/WORKFLOW.md` ×3, `docs/WORKFLOW.md` ×3 (OQ1, version stamp untouched), launch
  copy ×3 (OQ2, plain correction). One extra site fixed beyond the brief:
  `docs/product/features/orchestrator-governance/idea.md:45` ("fresh context each turn" →
  "re-injected every turn"), covered by the brief's turn-end exit criterion. Verified:
  `node tools/lint.mjs` clean + full `fresh context` grep sweep — every surviving hit is a
  reviewer/subagent reference or the new corrective text. Next: S2 builds
  `tools/context-attrib.mjs` on the same branch._

- _2026-08-01 planning: trio authored on `plan/orchestrator-context-economy` from the
  2026-08-01 brief (D1–D9 locked, not re-opened). 8 sessions / 5 phases / 5 checkpoints.
  Baseline transcript identified and field-verified by grep (never read). Uncommitted,
  awaiting HITL review of OQ1–OQ5._

Next up: **S0.5-2 — settle the chars/token band + name the char-free mass** (Phase 0.5,
branch `mission/context-economy-p05`, already created). `S0.5-1` landed as `74f4507`.
**OQ6 is RESOLVED** (`452fb3a`): zero-dep envelope estimator, **chars primary**, tokens
always with their band, no tokenizer — this **amends D10(b)**, so ignore any "real
tokenizer" wording still in the S0.5-2 brief.
Brief: `.plans/context-economy.sessions.md` → Phase 0.5. **Suits `backend`.**

**Phase 0.5 is the ONLY authorized phase.** The D1 pause was released 2026-08-02 into a
re-scope (D10/D11/D12 above), not into P1. **S4 and everything after it stay unauthorized**
until the human re-decides at the decision point that follows `ckpt-p05`.

`S0.5-1` is **not** blocked by OQ6; `S0.5-2` is. Read order for whoever runs Phase 0.5:
the `## D1 re-scope decisions` block above, then the brief, then the memo ranges the brief
names — the memo is cited by **M-number**, never re-derived. The historical D1 pause package
below is **superseded in its headline numbers** (its TOTAL carries 24.4% phantom churn and
its 5.59× divergence is a normalisation artefact); it is kept as the record of what was
believed at the pause, not as a source of figures.

Run Phase 0.5 in a **FRESH session** (deliberate: starting a context-economy mission inside
a 400k-token session is the anti-pattern it exists to fix).
