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
**Since the 2026-08-02 replan the authorized work is Phase 0.5 only**; `S0.5-1`, `S0.5-2`,
`S0.5-3` and `S0.5-4` are ALL done (**OQ6 RESOLVED 2026-08-02** — zero-dep envelope estimator,
chars primary, shipped in `S0.5-2`; the occupancy gate and D7's named denominator shipped in
`S0.5-3`; the repaired baseline + the **📦 PHASE 0.5 RE-DECISION PACKAGE** recorded by
`S0.5-4`). **`ckpt-p05` returned REQUEST CHANGES and `S0.5-fix` landed all three findings
(F1–F3) plus the latent F4 guard — text and one inert guard only; every headline number is
unchanged and re-verified byte-for-byte.** **`ckpt-p05` re-review returned APPROVE
(2026-08-02, all six lenses 3/3) and Phase 0.5 is MERGED (`f5fabc6`).**
**The DECISION POINT is DECIDED (D13, 2026-08-03): P3 ONLY is authorized.**
**`S6` is DONE (2026-08-03)** — the `SessionStart:compact` re-read directive plus the
beat-enforcer due-ness fix landed on `mission/context-economy-p3`.
**`ckpt-p3` [STRICT] returned APPROVE (2026-08-03) and Phase 3 is MERGED (`8a3b4c7`).**
**D14 (2026-08-03) authorized P2**, split into **S5** (standing steers + the `Next up:`
two-site agreement check) and **S5b** (the `ckpt-p3` follow-ups, incl. the enforcer
`first → first due` fix). **`S5` is DONE (2026-08-03)** — standing-steers block, the
§3-only append rule, and BOTH new lint checks (`checkStandingSteers`,
`checkNextUpAgreement` — machinery defect (a) is now GUARDED).
**`S5b` is DONE (2026-08-03)** — the beat-enforcer now scans for the first *DUE* beat
instead of giving up at the first candidate (the open [Med] from `ckpt-p3`), plus the §3
wording tighten and the two test-coverage gaps.
**`S2-fix` is DONE (2026-08-03)** — F1 + F2 + F5 + F3 all landed; nothing severed.
**`ckpt-p2` re-review returned APPROVE and Phase 2 is MERGED (`e5b6326`).**
**D15 accepted the Fable recommendation in full: P1 is DROPPED (not deferred), P4 is
AUTHORIZED, the mission WRAPS at P4.** **Phase 4 was re-briefed by the planner on 2026-08-03**
(`.plans/context-economy.md` `## Replan 2026-08-03`) and split six ways —
`S7a` → `S7b` → `S7c` → `S8a` → `S8b` → `S8c`, then `ckpt-p4`.
**Next up: S7a** — the instrument change (name the A4 delta kinds, print the attachment-kind
footprint, pin the D7 3% trigger) on a new branch `mission/context-economy-p4`.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]` done
(verified, not merely written). The beat-enforcer nudges only on a not-started `[ ]`
checkpoint/reviewer/chronicler row — set `[~]` the moment a beat is picked up or parked._

- [x] S1 — doc-defect sweep: kill "fresh context per tick" (branch `mission/context-economy-p0`)
- [x] S2 — build `tools/context-attrib.mjs` + `--selftest` + lint delegation (branch `mission/context-economy-p0`)
- [x] S3 — run the baseline measurement, record split + D9 table + sanity check (branch `mission/context-economy-p0`)
- [x] Checkpoint `ckpt-p0` — **APPROVE** 2026-08-02 after one corrective session (S3-fix). Scorecard: QA 3 · Security 3 · Efficiency 3 · Architecture 3 · UX 3 · DX 2. Merged into `mission/context-economy-integration` (`273f1d3`, batch policy — main untouched).
- [x] ⛔ **D1 HARD PAUSE — RELEASED 2026-08-02.** Human re-scoped with the measured numbers: **new instrument-repair phase first (P0.5); P1–P4 are NOT authorized and get re-decided after it.** Decisions D10–D12 below.
- [x] **Phase 0.5 — instrument repair** — COMPLETE, APPROVED, merged `f5fabc6` (branch `mission/context-economy-p05`)
  - [x] S0.5-1 — `prompt = 0` phantom-churn guard + collapse ledger + ratchet identity (tasks 22–23)
  - [x] S0.5-2 — settle the chars/token band + name the char-free mass (task 24) — zero-dep envelope estimator per OQ6
  - [x] S0.5-3 — occupancy sanity gate + the D7 denominator (tasks 25–26) — gate FAILS at +28.0% vs `/context` TOTAL 401.4k (a finding); D7 denominator named
  - [x] S0.5-4 — re-run the baseline, record BOTH numbers, assemble the re-decision package — analysis-only (no instrument change); **📦 PHASE 0.5 RE-DECISION PACKAGE** below is the deliverable
  - [x] Checkpoint `ckpt-p05` — **APPROVE** 2026-08-02 after one corrective session (S0.5-fix). Scorecard: QA 3 · Security 3 · Efficiency 3 · Architecture 3 · UX 3 · DX 3 (DX 1→3 and UX 2→3 on the fix). Reviewer ran 11 of its own adversarial mutations, 11 caught; no dangerous mirror among the 44 cases. Merged into `mission/context-economy-integration` (`f5fabc6`, batch policy — main untouched).
- [x] ⛔ **DECISION POINT — DECIDED 2026-08-03 (D13).** Human authorized **P3 ONLY**, deliberately scoped to the remaining session budget. **P1, P2, P4 stay HELD** and unauthorized pending a session-limit refresh.
- [x] ~~S4 — write firewall (Phase 1)~~ — **DROPPED 2026-08-03 (D15).** Premise retracted (Write/Edit is 9.2% char / 4.4–7.2% token, never 22.5%); what remained was contract hygiene that does not need a phase. **Residue folded into P4's re-brief**, not lost: the discipline lines, a ~3-line instrument extension naming the A4 delta kinds, and an A5 hook-footprint measurement. Branch `mission/context-economy-p1` never created.
- [x] ~~Checkpoint `ckpt-p1`~~ — **DROPPED 2026-08-03 (D15)** with Phase 1. Nothing to review.
- [x] S5 — **DONE 2026-08-03** (branch `mission/context-economy-p2`) — standing steers: `## Standing steers` in `templates/mission-state.md`, §3-only append rule in `mission.md` (+ §4 resume line), WORKFLOW §5 ledger row, and `checkStandingSteers()` in `lint.mjs` (OQ4: only ledgers that already carry the block). **+ machinery defect (a) folded in: `checkNextUpAgreement()`** — every `Next up:` site must name the same beat. Both mutation proofs run in both states.
- [x] S5b — **DONE 2026-08-03** (branch `mission/context-economy-p2`) — enforcer due-ness: `head -1` → a scan for the first *DUE* candidate (the open [Med] from `ckpt-p3`); rule (iii) narrowed to step over marker-carrying rows and rule (ii)'s `[ ]`-carrying-HELD branch dropped, so a held row is skipped rather than walling off everything beneath it; §3 wording made per-beat-precise in both WORKFLOW mirrors + the plugin README; both test-coverage gaps closed. Harness **24 → 31 cases**; 7 mutations run in both states incl. the anti-inert control.
- [x] Checkpoint `ckpt-p2` — **APPROVE** 2026-08-03 after one corrective session (`S2-fix`). First pass was REQUEST CHANGES (two always-on doc rows described behavior the hooks don't have). Final scorecard: Security 3 · Efficiency 3 · **DX 1→3** · **QA 2→3** · **Architecture 2→3** · UX n/a. Reviewer re-derived all four fixes by **dispatch across an 8-ledger matrix**, confirmed the hooks themselves were untouched by the fix commits (empty diff), and verified F3 has no legacy false-positive in this repo. Merged into `mission/context-economy-integration`.
- [x] S6 — **DONE 2026-08-03** (branch `mission/context-economy-p3`) — `hooks/lib/compact-resume.sh` + a `SessionStart` block whose matcher is `compact` and nothing else; **+ the beat-enforcer due-ness fix** (machinery defect (b)), contained to `hooks/lib/beat-enforcer-stop.sh`. Atomic-ref doc updates in the same commit. Harness **16 → 24 cases**; both mutation proofs run. Completed after the first attempt died on a usage limit.
- [x] Checkpoint `ckpt-p3` **[STRICT]** — **APPROVE** 2026-08-03, no corrective session needed. Scorecard: Security 3 · Efficiency 3 · UX 3 · QA 2 · Architecture 2 · DX 2. Reviewer hand-dispatched all three `SessionStart` matchers, re-ran both mutation proofs (preservation case green in BOTH states), and proved injection-resistance with shell metacharacters in ledger path + content (no artifacts, exit 0). Rule (iii) ruled IN BOUNDS. **Verdict surfaced to the human immediately** per batch gating. Merged into `mission/context-economy-integration`. **[Med] finding left OPEN for the human — see D13 follow-ups.**
- [x] **S2-fix — DONE 2026-08-03** (branch `mission/context-economy-p2`) — the `ckpt-p2` corrective, all four findings: **F1** both WORKFLOW mirrors' §3 silence list now names the unreleased `[~]` HELD barrier (and states that a `[ ]` HELD row is parked, not a wall) · **F2** the shared row is SPLIT — a `Stop` backstop row with the due-ness scan and a closing-action row that states the PreToolUse enforcer's *missing* due-ness outright; the hook's behavior is untouched, the scan port remains its own session · **F5** the non-candidate `- [ ] … HELD` row and the PreToolUse divergence are both pinned in the harness · **F3 landed, not severed** — `checkNextUpAgreement()` keys a wrapped `Next up:` from its continuation lines and fails closed on an unkeyable site. Harness **31 → 33 cases**; 3 mutations in both states with anti-inert controls.
- [x] Checkpoint `ckpt-p2` re-review — **APPROVE** 2026-08-03; merged into integration. Three items left open **by choice** for the human: the PreToolUse due-ness port (own session; the new harness case pins the doc-row coupling for when it lands), **F4** (loose ckpt-id fallback — `(ckpt s5)` / `(ckpt 2)` still pass), and **[Low] `plugins/agentic-workflow/README.md:199-202`** still describes one merged enforcer with stepping-over "at the moment you try to close or advance" — true of Stop only; becomes true when the port lands, or a one-line tweak before.
- [ ] S7a — **AUTHORIZED (D15), re-briefed 2026-08-03** (branch `mission/context-economy-p4`) — instrument only, no measurement run: **P1 residue (a)** name the four A4 delta kinds so they stop collapsing into `attach: other` (`context-attrib.mjs:197-199`, ~3 additive lines); **P1 residue (b)** print the per-attachment-kind table (`attachKinds` is collected at `:200`, returned at `:445`, **never printed**) plus a named `mission machinery footprint` line; **A3** pin the D7 3% trigger as a named constant beside `GATE_PCT` with cases in both directions. Selftest **≥ 44 cases**, mutation-proven. **Suits:** `backend`.
- [ ] S7b — **AUTHORIZED (D15), re-briefed 2026-08-03** — run the measurement on this mission's own transcript (greps only, **never a Read**): **D4a as an OBSERVATION with the OQ5 caveat, explicitly not gated on**; the `isCompactSummary` count (**planning-time value 1**, not the 20 a self-referential grep suggested — memo M1; ≥ 3 promotes D8 to Option B); the **A5** hook footprint; the **A4** delta-kind split. Numbers mirrored into this ledger. **Suits:** `backend`.
- [ ] S7c — **AUTHORIZED (D15), re-briefed 2026-08-03** — write `docs/product/engineering/context-economy-metrics.md` (new directory), doc-only, numbers handed over from S7b. Must state **A1–A10 and the A4 correction honestly**, headline **~4.4–7.2% addressed / ~1.8–4.3% captured** vs a founding **~25% / 10–15%**, and **n = 1 throughout**. **Suits:** `analyst`.
- [ ] S8a — **AUTHORIZED (D15), re-briefed 2026-08-03** — **P1 residue (c)**: the discipline lines as contract text in **WORKFLOW §6.2, both mirrors** (`docs/WORKFLOW.md:468-495`, `templates/WORKFLOW.md:476-503`) + the **OQ3** one-line PR-body addition to the documentation-of-record agent's contract (its agent file; no tool-list change — the brief names the exact ranges). **No savings claim, no new gate.** **Suits:** `writer`. _(Wording avoids the bare beat keyword so the enforcer does not read this writer session as a documentation beat — same reason as `037b36b`.)_
- [ ] S8b — **AUTHORIZED (D15), re-briefed 2026-08-03** — `chronicler` pass covering **P2, P3 and P4** (the P2 and P3 passes were skipped to conserve budget and are **OWED**): CHANGELOG + JOURNEY + status page, then the orchestrator republishes via the Artifact tool. **Minor version bump** (new tool + new hook + protocol change). Status-page lifecycle/pillars staleness (stale since 2026-07-08): stamp fixed, rewrite **deferred** — the ledger must say which was done. **Suits:** main session + `chronicler`.
- [ ] S8c — **AUTHORIZED (D15), re-briefed 2026-08-03** — merge P4 into integration, `chronicler` authors the PR body to `.plans/context-economy.artifacts/p4-pr-body.md`, `gh pr create --body-file` against `main`. **The human merges once. No agent pushes to `main`.** **Suits:** main session + `chronicler`.
- [ ] Checkpoint `ckpt-p4` — **AUTHORIZED (D15)** — final review of the whole `main..mission/context-economy-integration` diff: all gates green with the selftest count stated and **≥ 44**; **the metrics doc honest about what was and was not moved** (a doc that reads as a success story has failed this checkpoint); D4a nowhere presented as a gate; **D4b still `[~]`**; D7's untouched-tool-list invariant intact across the whole mission; the discipline lines carrying no savings claim; the A4 naming additive only; the tracked open items survived into both the ledger and the metrics doc. Then the **human merges once**. **Nothing follows P4.**
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

## P1–P4 re-decision (locked 2026-08-03 by the human)

- **D13 — P3 ONLY is authorized.** Scoped deliberately to the remaining session budget;
  **P1, P2 and P4 stay HELD** pending a session-limit refresh, at which point the human
  re-decides them. Machinery defect **(b) beat-enforcer blocking-row awareness folds into
  S6** (it already opens `hooks/lib/` and the hook-test harness). Machinery defect
  **(a) the `Next up:` two-site agreement check stays UNGUARDED** — its natural home is
  P2's lint work, which is not authorized; it has now drifted **three times**, so a
  resuming session must not trust `Next up:` blindly until P2 lands.
  **Standing decisions attached, to apply when P1/P4 are authorized:** P1 ships as a
  **discipline** change with docs explicitly **not** claiming token savings (the 22.5%
  premise is retracted; measured 4.4–7.2% token); and **D4a is downgraded from a pass/fail
  gate to an observation** — a 50% cut to a 4.4–7.2% share is 2–3.6%, inside the
  instrument's own uncertainty band, so it cannot be gated on. **D4b remains the real
  confirmation** and needs a second transcript that does not yet exist.
  Recommended order when work resumes: **P2 → P1 → P4** (P3 already taken first).

## D15 — recommendation ACCEPTED IN FULL (locked 2026-08-03 by the human)

_The human read the Fable memo (`0ddc109`) and said "apply the recommendation". Both calls
adopted verbatim._

- **P2 → fix and merge.** One corrective session (`S2-fix`): **F1 + F2 + F5** as the
  reviewer required, **plus F3 folded in, last and severable** if the session is at risk.
  Then re-review, then merge into integration.
- **P1 → DROPPED as a phase.** Not deferred — dropped. Premise retracted; the remainder was
  contract hygiene that does not warrant a phase, a branch, or a checkpoint. **Residue
  folded into P4's re-brief** so nothing is lost: the discipline lines (shipped as contract
  text with **no savings claim**), a ~3-line instrument extension naming the A4 delta kinds,
  and the **A5 hook-footprint measurement**.
- **P4 → AUTHORIZED**, and it **requires a planner re-brief** — the existing S7/S8 briefs
  were written against the retracted 22.5% premise. The metrics doc must record **A1–A10
  and the A4 correction**, and **D4a is an observation, not a gate** (D13 standing).
- **A4 is NOT engineering work and is NOT a phase.** ≥~80% of it is the human's own
  environment. **Owner action, minutes, whenever they choose: prune `~/.claude/skills`
  (~140 skills, 208k chars) and unused MCP servers (93k chars).** That is a larger win than
  everything P1–P4 could deliver combined, and it is outside this repo.
- **Mission wraps at P4.** No phase after it.

## 📋 Fable recommendation memo — 2026-08-03 (`0ddc109`, advisory)

`docs/product/decisions/2026-08-03-context-economy-p1-p2-recommendation.md`.

- **Q1 — P2: fix and merge**, one corrective session: F1 + F2 + F5 as the reviewer
  required, **plus F3 folded in** (same file S5 touched, same mutation pattern; P2's
  headline guard otherwise ships blind to exactly the drift it polices). F3 goes **last and
  is severable** if the session is at risk. _Case against: session mortality — eight deaths
  on limits today, and D14 split sessions for this reason; F3 adds code + mutations to an
  otherwise doc-only retry._
- **Q2 — DROP P1 as a phase.** Fold its residue into P4's re-brief (the discipline lines, a
  ~3-line instrument extension naming the A4 delta kinds, an A5 hook-footprint
  measurement). **Do NOT re-point P1 at A4.** _Case against: unenforced discipline rots —
  no gate re-checks contract text, and the package itself calls 4.4–7.2% "no longer a
  rounding error"._

**🔴 A4 IS LARGELY DEBUNKED — measured, not asserted.** **≥ ~80% of the 372,114 chars is
NOT this repo's surface:** `skill_listing` **208k is the USER's ~140 skills** in
`~/.claude/skills` (this plugin ships **one 2,874-byte skill**); `deferred_tools_delta`
79k + `mcp_instructions_delta` 14k are **user-level MCP config**. The **only in-repo lever
is the 20 agent descriptions totalling 9,875 chars** feeding the 58k `agent_listing_delta`
— **~2% of appended chars at best.** **Reduction is a SETTINGS action for the human**
(prune skills / MCP servers), minutes, not engineering. Measurability: `skill_listing` is
already a named category; the three delta kinds fall into `attach: other` via
`context-attrib.mjs:197-199`, so naming them is a **~3-line additive change** (a P4 item) —
but any before/after **needs a new transcript** (n = 1 still stands).

_Unresolved by the memo: whether the +28% gate FAIL is instrument or comparator (nobody has
resolved this); the exact plugin share of `agent_listing_delta` (would require reading the
transcript, which is barred); and n = 1 until D4b's second transcript exists._

## ⚠️ WHOLE-MISSION AUDIT — REQUEST CHANGES 2026-08-03 (Fable, independent)

_Commissioned by the human, mission-wide, licensed to overturn prior verdicts. Verdict:
**"The shipped code is good. The analysis on top of it is not — and the human is about to
make the P1–P4 call on it."** Scorecard: Security 3 · Architecture 2 · Efficiency 2 ·
DX 2 · UX 2 · **QA 1**. All three gates re-run green; **every headline reproduces
byte-for-byte** on the untouched baseline (churn 1,707,036 · Σ chars 2,659,518 · band
1.99–3.24 · gate +28.0%/+149.1% · ratchet PASS · 4 collapses · `isCompactSummary` 1)._

**A1 — §6's invariance argument is PROVABLY WRONG (defect, from the code).** §6 says the
gate FAIL "bounds but does not block" a share decision because numerator and denominator
move together under a uniform scale error. **They no longer do.** P0.5 retired the churn
ratio as converter (`context-attrib.mjs:371`, "DIAGNOSTIC ONLY") and replaced it with the
output-side envelope (`:380`, `q = chars ÷ output_tokens`); the numerator now rides
**`output_tokens` only** while the denominator is Σ prompt-deltas of
`input+cache_creation+cache_read` (`:131`). **Orthogonal.** The argument was inherited
verbatim from the *pre-repair* D1 package (where it was correct) into the *post-repair*
package (where the repair had just invalidated it). **Consequence: a ~28% prompt-series
inflation deflates every share by ~28%. The gate FAIL DOES bound the share decision.**

**A2 — the D7 straddle is MANUFACTURED by a quantile choice, not measured.** `envSamples`
(n=594) tail is smooth — 2.88, 2.98, 3.08, 3.20, 3.24 — **no outlier**, so p90's robustness
rationale has nothing to guard against, and **59 of 594 samples already exceed the p90
endpoint**. Reviewer share: at max **1.92%**, p95 2.81%, p99 2.26%; the ratio needed to
reach 3% is ~2.075 (≈p92). Even with A1's ~28% correction ≈ **2.46%**. **D7 does not
straddle under any defensible endpoint — it is below 3%**, agreeing with the architect's
independent 1.23–1.62%. §7's "UNDECIDABLE… closes only with a tokenizer or a second
transcript" is **overstated**, and it was escalated to the human and put on the status page.

**A3 — THE FOURTH BUG.** The D7 3% trigger is a **bare literal duplicated in three prose
strings and pinned by ZERO cases**. Mutating `shareHi > 3` → `> 1` (`:574-577`):
**selftest clean, exit 0**, and on the real corpus the tool prints
`reviewer return share = 1.92–3.13%` immediately followed by `reading: the WHOLE band is
above 3% — the trigger condition reads as MET`. **A self-contradicting governance verdict
with all gates green.** Contrast `GATE_PCT = 15` (`:467`) — named constant, case-pinned
both directions. Same instrument, two conventions.

**A4 — a lever ~1.5× P1's, filed under "do not act on".** `attach: other` is **NOT**
over-stated; the instrument's warning at `:748` is a guess and is **wrong**. The 77
fallbacks are lean payload objects with no uuid/timestamp/session metadata. What is
actually in there: **registry/definition injections** — `deferred_tools_delta` 79,463 +
`agent_listing_delta` 58,194 + `mcp_instructions_delta` 14,319 + `invoked_skills` 11,800.
**With `skill_listing` 208,338 that is 372,114 chars = 14.0% of appended chars, vs P1's
Write/Edit at 243,578 = 9.2%.** §9 sizes the "free lever" at `skill_listing` alone; it is
**1.8× that** — and it is *this plugin's own surface* (13 subagent types, skills, deferred
tools).

**A5 — the mission's own machinery is a top-5 consumer, unmeasured.** `hook_success`
113,672 + `hook_additional_context` 19,362 + `task_reminder` 10,655 = **143,689 chars =
5.4%** — larger than anything P1–P4 can save. **P3 shipped another injecting hook without
measuring its footprint.**

**A6 — 34% of transcript records are excluded with no counter.** `last-prompt`, `mode`,
`ai-title`, `pr-link`, `file-history-snapshot` (770KB raw) — 1,583 records the taxonomy
never touches, while `badJson` and `sidechain` **are** counted and printed. Probably
correct to exclude; **nobody verified**, and it feeds the 35–60% UNATTRIBUTED. Also the
assistant content loop (`:297-325`) has **no `else` residual branch** unlike the user loop
(`:344`) — a schema change silently drops mass.

**A7 — corroboration nobody stated (the mission's best evidence).** All **480 thinking
blocks carry `thinking: ""`** — zero persisted chars. That is *why* median q = 1.04, and it
strongly validates the estimator's premise.

**A8 — dogfooding gap.** `## Standing steers` — the convention S5 shipped — is `(none)` in
the ledger of the mission that shipped it, while D10–D14 record human decisions in
**paraphrase**.

**A9 — reading trap in the package.** The bands are **asymmetric**: the mission's levers sit
at the *low* end and the unexplained mass at the *high* end **simultaneously**, so reading
midpoints flatters the mission in both directions at once. Honest reading of the
instrument's own data: Write/Edit ≈5.6%, UNATTRIBUTED ≈60%, **char-free ≈48.5% — ~10× every
lever, owned by no phase.**

**A10 — recommendation: WRAP AT P4. Drop P1 or re-point it at A4.** P1's premise is
retracted and D13 already strips its savings claim, leaving pure contract hygiene — which
does not need a phase. _(Judgment, not defect.)_ P4 should ship and record these corrections.

**Process ruling: sound, not theatrical — with a structural blind spot.** The catches were
real and load-bearing (the S2 dimensional inversion, the namespace-blind D7 lookup, two
inert guards, the fixture-vs-assertion inversion, the instrument re-deciding D7 in its own
voice); re-run mutations confirm those guards are live. **But mutation testing only covers
what a session touched** — the D7 threshold was never edited, so it was never pinned (A3) —
**and no mutation can test taxonomy completeness** (A4, A6). The coverage model is "what we
changed", not "what decides".

**Minor:** `analyze` is exported but the module has **no entry-point guard** (`:1210-1234`),
so importing it runs the CLI and `process.exit(1)`s — the export is unusable.
**Ship-safety: SAFE.** Hooks use `jq -n --arg`, never eval ledger text; `${CLAUDE_PLUGIN_ROOT}`
quoted; all paths exit 0; matcher exactly `["compact"]` with a stdin `.source` re-check.
**One fail-open, low:** with `jq` absent both hooks go **silently inert** — the P3 backstop
disappears with no signal; disclosed in `/doctor` but not in the hook's own contract.

**NOT verified:** the `/context` 401,400 comparator (hand-recorded, single-moment — **nobody
can say whether the +28% is instrument or comparator**); whether the excluded record types
are context-bearing (needs a schema owner); collapse #4 (−270,711 @ line 4,222); and
**n = 1 stands** — one transcript from one planning-heavy session that was the source of its
own measurement. **D4b remains the only real confirmation.**

## `ckpt-p2` findings — REQUEST CHANGES 2026-08-03 (corrective NOT run; mission paused)

_Both rulings the checkpoint owed went in S5b's favour, **proven not argued**:_
**HELD-as-parked is the genuine minimum** — the real ledger has a *non-candidate*
`- [ ] S4 — **HELD**` above `ckpt-p2`, so the narrower "exempt only skipped candidates"
alternative does **not** fix the motivating case; `BARRIER_THEN_HELD_THEN_DUE` is SILENT in
both states and deleting rule (ii) turns it green→red, i.e. suppression was **re-scoped, not
weakened**. **`beat-enforcer-pretooluse.sh`: split the doc row NOW, port the scan LATER** as
its own session (a second always-on hook with only 4 harness cases — not this phase's fix).

**Corrective scope, one retry (F1 + F2 required, F5 welcome):**
**✅ ALL RESOLVED in `S2-fix` (2026-08-03) — F1, F2, F5 and F3; nothing severed.**
- **✅ RESOLVED (S2-fix) — F1 [Med]** `docs/WORKFLOW.md:190` + `templates/WORKFLOW.md:198` — the reworded row lists
  silence as "unfinished work, or an unreleased ⛔/HARD PAUSE barrier" and **drops HELD**, but
  rule (ii) still treats `- [~] … HELD` as a barrier. Ledger `- [~] S1 — **HELD**` above
  `- [ ] Checkpoint` → hook **SILENT** while the row predicts a nudge. The old generic
  "unreleased blocker" was true; the new precise wording is precisely wrong. README:197 is fine.
- **✅ RESOLVED (S2-fix) — doc row SPLIT; hook behavior deliberately unchanged, the scan port is still its own session — F2 [Med, LIVE]** the **PreToolUse** enforcer contradicts the row it shares. Hand-dispatched
  unmodified in this repo, `git commit` emits ``⏳ Beat pending … ckpt-p1 — **HELD**`` —
  **it nudges toward HELD, unauthorized P1 work.** 5 of 8 test ledgers diverge from the Stop
  backstop. Pre-existing, but S5b sharpened the shared row to "scans top-down, nudges the
  first due" without scoping it to Stop. **This is the nudge seen on ~30 turns this session.**
- **✅ RESOLVED (S2-fix) — F5 [Low/QA]** no harness case pins the non-candidate `- [ ] … HELD` row — the exact class
  whose semantics changed, and the one the real ledger relies on.

**Deferred to the human, not the implementer:**
- **✅ RESOLVED (S2-fix, folded in last per D15) — F3 [Low] `tools/lint.mjs:489-490` FAILS OPEN** — a `Next up:` whose beat wraps to the next
  line keys to `''`, is filtered, and with <2 keyed sites **the file is skipped silently**.
  Reproduced: trailer beat moved to line 2 and changed to `S8`, header still `ckpt-p2` → lint
  clean. The drift check has a hole in exactly the shape of the drift it exists to catch.
- **F4 [Low] `tools/lint.mjs:~458` id-existence fallback too loose** — `\b<id>\b` anywhere in
  checklist text, so `(ckpt s5)` (a *session*) and `(ckpt 2)` both PASS, though the comment
  claims the id "must name a checkpoint that actually exists".
- **F6 [Info] beat-key false-pass, by design** — `Next up: ckpt-p2 is DONE — now S7` agrees
  with a header saying `ckpt-p2` (first id only). Recorded so it isn't "discovered" later.
- Port due-ness to `beat-enforcer-pretooluse.sh` — own session + mutations.

_Verification depth: 7/7 enforcer mutations killed (5 only by the new cases); all six S5 lint
mutations pass under base `lint.mjs` (anti-inert holds); injection smoke with `$(…)`/`;rm` in
ledger prose **and** path → no artifact, valid JSON, exit 0; legacy ledgers exempt per OQ4 and
green; no mirrors — all Stop cases dispatch the real script; `.plans/` mutated only inside a
throwaway worktree, restored and verified._

## D14 — P2 authorized (locked 2026-08-03 by the human)

- **P2 is authorized; P1 and P4 remain HELD.** Recommended remaining order after P2:
  **P1 → P4**, under D13's standing decisions (P1 ships as *discipline*, no savings claim;
  D4a is an observation, not a gate).
- **Split into two sessions on the orchestrator's judgment** (state it plainly if
  overruled): **S5** = the standing-steers work as briefed **+ machinery defect (a)**, all
  within `lint.mjs` / `templates/mission-state.md` / `mission.md` / WORKFLOW §5. **S5b** =
  the `ckpt-p3` follow-ups, all within `hooks/lib/` / `hook-test.mjs` / WORKFLOW §3 /
  README. Rationale: disjoint file sets, and five sessions have died mid-flight on
  infrastructure limits — smaller sessions survive.
- **No planner re-brief for S5.** P2's brief was never premised on the retracted 22.5%
  figure (it is a fidelity control), so it runs as written, exactly as P3 did. **P1 and P4
  still require a planner re-brief before they run.** Logged as a deviation.

## Open follow-ups from `ckpt-p3` (surfaced 2026-08-03 — S5b now AUTHORIZED to fix these)

- **[Med] The beat-enforcer evaluates only the FIRST `[ ]` beat** (`beat-enforcer-stop.sh`
  line 60, `head -1`), so **any HELD or blocking row above an open checkpoint permanently
  silences everything below it**. Reproduced on this very ledger: `ckpt-p1` (HELD) is the
  hit, so `ckpt-p3` was never considered. **Not a regression** — the enforcer never nudged
  the right row in either state, so it went from wrong-alarm to no-alarm, and it is
  **orthogonal to rule (iii)** (narrowing (iii) would not restore it). But with P1/P2/P4
  HELD indefinitely the backstop is now **dead for the rest of this mission** and for any
  consuming repo carrying a HELD row above an open checkpoint — a durable, *silent* failure.
  **Fix:** `head -1` → scan candidates for the first *due* one. Small, `hooks/lib/` only.
  → **RESOLVED by `S5b` (2026-08-03).** The enforcer scans candidates top-down; rule (i)
  now `continue`s to the next candidate instead of exiting. Hand-dispatched against THIS
  ledger: it nudges `ckpt-p2`, no longer silent behind HELD `ckpt-p1`.
- ~~**[Low] §3 wording overclaims** — `docs/WORKFLOW.md:191` and `templates/WORKFLOW.md:199`
  say the beat-enforcer is "suppressed when the beat isn't due", implying per-beat
  evaluation. Tighten when the fix above lands.~~ → **RESOLVED by `S5b`**: both mirrors (and
  the plugin README) now say it scans open beats and nudges the **first due** one, and that
  a held row is stepped over rather than treated as a wall.
- ~~**[Low] No harness case pins multi-ledger `ls -t` selection for `compact-resume`** (the
  beat-enforcer has one; the reviewer verified compact-resume's by hand).~~ → **RESOLVED by
  `S5b`**: two cases (newest-with-an-open-beat wins; newest-complete falls through to the
  older open one), killed by `ls -t`→`ls -tr` and by dropping the open-beat filter.
- ~~**[Low] `HARD PAUSE` on an unreleased row** is matched by both rules but exercised by no
  case (only `⛔` and `HELD` are).~~ → **RESOLVED by `S5b`**: cases for `HARD PAUSE` on an
  unreleased `[~]` row AND on an unreleased `[ ]` row; each has its own killing mutation.
- **Reviewer's correction to S6's deviation note:** the observed ~20-turn defect is
  suppressed by rule **(i) alone**; rule (iii) was not needed for it. Consequence: (iii)
  subsumes the `[ ]` half of (ii), leaving (ii) useful only for `[~]` blockers — i.e.
  rule (ii)'s `[ ]` branch is now dead code.
  → **ADDRESSED by `S5b`, but the finding's premise moved.** Only the HELD half of (ii)'s
  `[ ]` branch was dead, and it was removed. The ⛔/HARD PAUSE half is now **load-bearing**:
  narrowing (iii) to step over marker-carrying rows (required for the scan to reach a later
  candidate) means an unreleased `[ ] ⛔ HARD PAUSE` barrier is caught by (ii) ALONE.
  Mutation-proven live — dropping (ii)'s `[ ]` branch fails a case. Nothing left dead.
- ~~**Still unguarded:** machinery defect (a), the `Next up:` two-site agreement check~~ —
  **CLOSED by `S5` (2026-08-03)**: `checkNextUpAgreement()` in `tools/lint.mjs` now fails
  the gate when two `Next up:` sites name different beats.

## Tracked open items (must OUTLIVE the mission)

_Opened at the **Replan 2026-08-03**. The mission wraps at P4, so these are **recorded, not
planned** — none of them is a P4 session. `S7c` copies this block into
`docs/product/engineering/context-economy-metrics.md` so it survives the ledger going quiet._

| item | owner | state |
|---|---|---|
| **PreToolUse due-ness port** — `beat-enforcer-pretooluse.sh` still nudges the first `[ ]` candidate, not the first *due* one; the Stop backstop was fixed in `S5b`. Doc row already split (`S2-fix` F2) and a harness case pins the coupling. | future session | open, scoped, low risk |
| **F4** — `tools/lint.mjs:~458` id-existence fallback is `\b<id>\b` anywhere in checklist text, so `(ckpt s5)` (a *session*) and `(ckpt 2)` both PASS despite the comment claiming the id must name a real checkpoint. | future session | open, [Low] |
| **`plugins/agentic-workflow/README.md:199-202`** — still describes one merged enforcer stepping over held rows "at the moment you try to close or advance"; true of the **Stop** hook only. Becomes true when the port lands, or a one-line tweak before. | future session | open, [Low] |
| **Collapse #4** — req #551, transcript line **4,222**, **−270,711 tok, no adjacent compact summary**. Visible in the collapse ledger, never explained. Root-causing it needs single-record schema inspection. | future session | unexplained by design (task 23) |
| **The +28% gate residual** — occupancy 513,634 vs a hand-recorded `/context` TOTAL 401,400. **Nobody has resolved whether it is the instrument or the comparator**, and A1 shows it now bounds every share (~28% deflation), not just absolute magnitudes. | human / future session | **unresolved by anyone so far** |
| **D4b** — cross-mission re-measurement on a later comparable mission. **The only real confirmation**; needs a second transcript that does not exist. Row stays `[~]`, never `[x]`. | future mission | deferred, non-blocking |
| **Owner settings action (A4, corrected)** — prune `~/.claude/skills` (~140 skills, 208k chars) and unused MCP servers (93k chars). **≥ ~80% of the 372,114 chars is the human's own environment, not this repo.** Minutes of settings work, and a larger win than everything P1–P4 could deliver combined. **Not engineering. Outside this repo.** | **the human** | open, unscheduled |
| **Status-page staleness** — lifecycle / pillars / "Deployed v1.30.0" sections unchanged since 2026-07-08 despite v1.39.x and v1.41.0. `S8b` fixes the stamp and the mission's own rows and **defers the lifecycle/pillars rewrite**; if the orchestrator decides otherwise it must say so in one line. | future editorial pass | deferred by `S8b` |
| **A6** — 34% of transcript records excluded with no counter (1,583 records); the assistant content loop has no `else` residual branch. Probably correct to exclude; **nobody verified**. | future session | open, feeds UNATTRIBUTED |
| **Unenforced discipline rots** — the `S8a` contract lines have **no gate**, deliberately (inventing an enforcement mechanism at the wrap is worse than recording the gap). | future session | accepted risk, recorded |

## Standing steers

_Human steers captured **verbatim** at checkpoints only, never mid-brief. Grammar:_
`- YYYY-MM-DD (ckpt <id>) — "<exact words>"`. _Retire by ~~strikethrough~~, never delete.
(Convention ships in P2; usable here from mission start.)_

(none)

## Deviations

_Any departure from a brief — logged here the moment it happens, with why. Deviating is
allowed; deviating silently is not (§4)._

- 2026-08-03 (S2-fix) — **two harness cases added, not one.** F5 asked for the non-candidate
  `- [ ] … HELD` case; a second case pins the **PreToolUse** enforcer's documented divergence
  (it names the HELD beat where the Stop backstop steps over it). Reason: F2 is discharged by
  *documentation only*, so without a case the split row can drift back to fiction unnoticed —
  and when the scan is ported, that case fails and forces the doc row to change with it.
  Harness 31 → 33. No hook behavior changed.
- 2026-08-03 (S2-fix) — **F3's fix does slightly more than "stop filtering".** Dropping the
  filter alone would fail every wrapped site instead of checking it, so a site now also keys
  from its continuation lines (≤2, stopping at a blank line); only a site with nothing keyable
  in its whole paragraph is a finding. Both branches mutation-proven; repo lints clean.
- 2026-08-03 (S5b) — **one suppression rule was narrowed, not merely re-scanned.** The brief said
  "you are not loosening the rules, only stopping the scan at the first candidate". That is not
  sufficient: rules (ii)/(iii) look UPWARD, so they grow monotonically with the candidate index —
  a skipped HELD candidate is itself a `[ ]` row above the next one, and re-blocks it. Scanning
  further would have been a no-op. Minimum change that makes "first DUE" reachable: **a row
  carrying HELD/⛔/HARD PAUSE is parked, not unfinished**, so rule (iii) steps over it, and rule
  (ii) no longer treats `[ ]`-carrying-HELD as a barrier. `[~]`-carrying-HELD and every unreleased
  ⛔/HARD PAUSE barrier still block, at every candidate beneath them — both halves case-pinned.
- 2026-08-03 (S5b) — **`beat-enforcer-pretooluse.sh` was left alone** (still a bare `head -1`, no
  due-ness at all). Out of the brief's [Med], which named the Stop backstop only, and expanding a
  second hook risked the session. Consequence: the §3 row covers BOTH enforcers, so its due-ness
  sentence is accurate for the Stop backstop and aspirational for the PreToolUse one. **For
  `ckpt-p2` to rule on** — port the due-ness scan, or split the doc row.
- 2026-08-03 (S5) — **scope addition beyond the brief, at the orchestrator's direction (D14):**
  machinery defect (a), the `Next up:` two-site agreement check, was folded in as
  `checkNextUpAgreement()` in `tools/lint.mjs`. It stayed a **contained** addition (one function,
  two shared helpers, no new harness, no new file), so the brief's "stop and log it if it needs
  more" trigger never fired.
- 2026-08-03 (S5) — **two tolerances added to the brief's steer regex**, both to avoid the check
  forbidding what the convention mandates: (1) an optional `~~…~~` wrapper, since retiring a steer
  by strikethrough is required and a bare regex would reject the retired form; (2) the cited
  `<id>` may be written `p2` **or** `ckpt-p2`, and the `## Checklist` existence test accepts either.
  A ledger whose checklist names no `ckpt-*` id at all falls back to a plain token search rather
  than failing — legacy-safe, per OQ4's spirit.
- 2026-08-03 (S5) — **no planner re-brief for P2**, per D14: P2's brief was never premised on the
  retracted 22.5% figure. Recorded as D14 directed.

- 2026-08-03 (S6) — **the beat-enforcer fix is BROADER than "blocking-row awareness"** (D13's
  wording). It ships three suppression rules, not one: (i) the beat row itself carrying
  `HELD`/`⛔`/`HARD PAUSE`, (ii) an unreleased blocking row above it, and **(iii) any `- [ ]`
  row above it at all** — rule (iii) is a generalization D13 did not name. Kept because the
  observed defect (~20 turns nudging `ckpt-p1`) was produced by (i)+(iii) together, and rules
  (i)/(ii) alone would still nudge a checkpoint whose sessions are merely unfinished. It is
  contained to `hooks/lib/beat-enforcer-stop.sh` + cases (the brief's stop-condition), and the
  existing behaviour is preserved (`[~]`/`[x]` silent, `ls -t` selection byte-identical, exit
  codes unchanged, `RELEASED_BLOCKER` case proves a released blocker still nudges). **Reviewer
  should re-derive rule (iii) specifically** — it is the one rule with no line of authority
  behind it. Known limitation, not fixed: the enforcer still picks the FIRST `[ ]` beat, so on
  this ledger it now goes silent on `ckpt-p3` because `ckpt-p1` (HELD) sits above it. That is
  strictly better than nagging the wrong row, but it means the enforcer will not chase
  `ckpt-p3`. Fixing "first" → "first due" is a bigger change; logged for P2, not taken.
- 2026-08-03 (S6) — **this session is a COMPLETION after an infrastructure failure.** The
  first `S6` agent implemented the hooks + harness cases and then died on a usage limit
  **immediately after reporting gates green**, with the atomic-ref doc updates, both mutation
  proofs and this ledger still unwritten. A second `devops` session reviewed the uncommitted
  work against the brief rather than trusting it, and finished the session. **Kept** (verified,
  not assumed): `compact-resume.sh` in full, the `hooks.json` `SessionStart` block, the
  beat-enforcer due-ness block, all 8 new harness cases. **Discarded/added:** nothing was
  discarded; what was missing was added — the three doc sites, both mutation proofs, and this
  ledger. Recorded so `ckpt-p3` knows the code and its proofs were written by different
  sessions and re-derives rather than trusts the harness's green.
- 2026-08-03 (S6) — **the WORKFLOW and README governance counts legitimately differ (3 vs 4)**
  and were NOT forced to agree. §4's "Reflex backstops" paragraph counts the hooks that keep a
  **running** session on protocol (thread-keeper, beat-enforcer, compact-resume = **three**);
  the plugin README counts **all** governance reflexes including the *router*, which fires
  before the work starts (= **four**). Both were stale by one before this session; each was
  corrected within its own scope and a clause was added to §4 naming the router as the fourth,
  so a reader comparing the two no longer sees an unexplained mismatch. `docs/WORKFLOW.md` was
  updated in the same commit per the S1 precedent; **its line-3 version stamp is untouched**.
- 2026-08-02 (S0.5-fix) — **F3's caption is NOT pinned by a selftest case**, and it is an
  output change. The `ckpt-p05` corrective brief set the target case count at "43, or 44 if
  you took F4"; adding a case for the caption would have put it at 45 and moved a number the
  brief froze. Followed the brief. The consequence is that the cross-domain-transfer caption
  could be silently deleted without a gate failing — the reviewer may want a case binding it,
  and that is a one-case addition if so. Logged rather than decided unilaterally.
- 2026-08-02 (S0.5-fix) — **F4's case needed a SECOND fixture** (`buildRevivedRidFixture`), not
  a record appended to the main one. The main fixture's TOTAL/collapse/band/preamble constants
  are pinned by ~40 cases; adding a revived-`requestId` scenario to it would have moved them
  and broken the brief's "no number may move" constraint. The isolated 4-record fixture leaves
  every existing case byte-identical. The file's "this is the ONLY fixture" comment was
  corrected to match.
- 2026-08-02 (S0.5-4) — **the session is ANALYSIS-ONLY: no behaviour changed, so no new
  selftest case.** The "every behaviour change ships a mutation-proved case" rule is stated
  here as **satisfied vacuously**, not skipped: `tools/context-attrib.mjs` was not edited, the
  case count is **held at 43** (never lowered), and the run is a pure re-execution of the
  `S0.5-3` instrument. Recorded so `ckpt-p05` does not go looking for a proof that should not
  exist.
- 2026-08-02 (S0.5-4) — **THREE stale numbers in the S0.5-4 brief / memo, recorded as measured
  rather than reverse-engineered toward the brief.** The brief's own step 4/5 figures were
  written before the repair landed. (i) **collapses = 4, not the briefed 5** — the 5th was the
  degenerate `prompt = 0` collapse D10a's guard correctly removed (`S0.5-3` already flagged
  this; `S0.5-4` executed on it). (ii) **token-domain Write/Edit = 4.40–7.18%, not the briefed
  "2.8–3.7%"** — the repaired TOTAL is 19% smaller *and* the measured band 1.99–3.24 is below
  memo M9's assumed 3.2–4.2, and both corrections push the share **up**. (iii) consequently the
  restated headline is **~4.4–7.2% addressed / ~1.8–4.3% captured**, not the briefed "~4% /
  ~1.5–2.5%" (memo §2's Option C row). **Nothing was tuned toward the briefed values**; the
  package reports the measurement and names the divergence. Knock-on: this makes P1's case
  *better* than the memo concluded, which is a re-decision input the human must not miss.
- 2026-08-02 (S0.5-4) — **checklist row S4 amended** (a HELD row, not a completed one, and not
  in the untouchable set): its parenthetical still carried the superseded "2.8–3.7% token".
  Updated to the measured band with a pointer to the package. The char half (≤15.9%) was
  already correct and is unchanged. Logged because silently correcting a number in a ledger is
  the exact failure mode this mission exists to fix.
- 2026-08-02 (S0.5-4) — **two normalisation defects found in memo M8, reported not rewritten**
  (the memo is a dated advisory artefact; correcting it in place would rewrite history).
  (i) M8's **NARROW column is incoherent for `attach:` categories** — its denominator excludes
  them, so `skill_listing`'s "13.6% NARROW" divides a numerator by a base that omits it. The
  free-lever input must be sized at 7.8% char / 3.8–6.1% token, **not 13.6%**. `Write/Edit` is
  inside NARROW, so its 15.9% is unaffected. (ii) M8 labels NARROW "**7** non-attach"; the
  printed base 1,536,639 is the sum of **6** categories. Value right, count off by one.
- 2026-08-02 (S0.5-4) — **memo §2's "on the 401.4k baseline" column is NOT reproduced as a
  recommendation.** It applies a *churn* share to an *occupancy* baseline — the same
  churn/occupancy conflation D10c was created to end. The package states the arithmetic
  (~7k–17k tok) only to mark it as **not a number to decide on**.
- 2026-08-02 (S0.5-3) — **the session was completed after an infrastructure failure**, the
  second time this phase. The first `backend` agent died mid-implementation on an API error,
  leaving 96 uncommitted insertions and **no new selftest cases** — both gates green purely
  because nothing new was being tested. A fresh `backend` agent reviewed that work against
  the brief rather than assuming it. **KEPT** (correct, unchanged): the header's CHURN vs
  OCCUPANCY model block and the third-form usage lines; the occupancy tracking inside
  `analyze` (correctly placed in the same branch TOTAL is summed in, so a `prompt = 0` record
  can neither set the high-water mark nor become the final observation); `GATE_PCT`,
  `PROMPT_SERIES_COMPONENTS`, `gateRow`/`occupancyGate`; the `report(r, opts)` signature.
  **DISCARDED / REWRITTEN**: the dead agent's `d7Lines` was never wired in (the old inline D7
  block was still live, so the denominator work was dead code) and its `verdict:` line
  **re-decided** D7 in the instrument's voice ("REOPENS decision D7") — rewritten as a
  `reading:` that re-derives and names D11 as the ruling. Nothing printed the gate, the
  churn/occupancy block, or parsed the flag: those were written this session, along with all
  12 new selftest cases. `ckpt-p05` should treat the whole diff as unreviewed by any human.
- 2026-08-02 (S0.5-3) — **a THIRD CLI invocation form now exists.** S2's deviation recorded
  "no other CLI form exists beyond `<transcript.jsonl>` and `--selftest`"; `--context-total=`
  makes three (brief step 2 / **OQ7**, which is still OPEN with the planner's yes standing and
  no human ruling). Implemented on the standing recommendation; **the reviewer may overrule
  at `ckpt-p05`** and the removal is local (one flag, one report block, three selftest cases).
- 2026-08-02 (S0.5-3) — **CLI hygiene beyond the brief**, logged as scope added: the flag
  **fails closed** (an unparsable comparator is refused with exit 1, never silently coerced to
  0/NaN and gated against), `--context-total` combined with `--selftest` is refused (the gate
  needs a real transcript), and an unexpected extra argument is refused. Rationale: a gate
  computed against a garbage number is exactly the failure class this session exists to end.
- 2026-08-02 (S0.5-3) — the handoff entry below again exceeds "≤10 lines per entry", after
  `S0.5-2` promised the normal bound would resume here. Cause: a gate VERDICT the human must
  see, a ten-mutation proof, and a straddle flag do not compress without dropping something
  `ckpt-p05` must re-derive. `S0.5-4` is a recording session and should fit the bound.
- 2026-08-02 (S0.5-3) — **record flag for `S0.5-4`, not a correction made here.** The S0.5-4
  brief states "collapses = **5**, of which exactly 1 is a compaction". The repaired
  instrument reports **4** (mass 1,193,402; exactly 1 compaction, at req 310) — the fifth was
  the degenerate `prompt = 0` collapse that D10a's guard removed. `S0.5-4` records 4, not 5.
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
- 2026-08-02 (S0.5-2) — **the session was completed as a SALVAGE.** The first `backend`
  agent built the estimator and then died on an infrastructure stall with the work
  uncommitted and one selftest case failing. A second `backend` agent (fresh context)
  inherited the working tree, was scoped to *resolve, verify, commit* — not redesign — and
  did so. Everything in the commit except the fixture change below is the first agent's
  work, reviewed but not rewritten. `ckpt-p05` should treat it as unreviewed by any human.
- 2026-08-02 (S0.5-2) — **fixture-vs-assertion: the FIXTURE was wrong, the assertion was
  right, and the assertion's stated reason was also wrong.** The drop case expected 3 and
  observed 2. `req-5` (the `prompt = 0` record) never reaches the estimator at all — its
  usage is degenerate so `out` is never recorded and its empty content creates no row,
  which is deliberate (`outRow`: a degenerate usage block is not trustworthy data on the
  output side either). So the assertion's "req-4/5/6" rationale was false. But relaxing 3
  to 2 would have shipped an inert guard: `req-4` and `req-6` tripped **both** drop clauses
  at once, so deleting either clause alone left the case green — the S2-inversion failure
  mode this phase's standing constraint forbids. Fix: `req-4`'s `output_tokens` 10 → 30 (so
  only `chars > 0` can drop it) and a new `req-7` carrying chars with `output_tokens` 10 (so
  only `MIN_OUT` can drop it). `req-7` is inert on the prompt side by construction — prompt
  = `prevPrompt` ⇒ window delta 0 / chars 0 — so TOTAL 2,600, `calDelta` 1,400, `calChars`,
  the collapse ledger, `finalPrompt` and `preamble` are all unchanged; only `requests`
  (5 → 6) and `naiveTotal` (9,000 → 10,000) were re-pinned. Each clause is now mutation-
  proven independently (see the handoff entry).
- 2026-08-02 (S0.5-2) — the handoff entry below exceeds "≤10 lines per entry". Same reason
  as `S0.5-1`'s: a before/after of a measurement change plus a three-way mutation proof does
  not compress without dropping a number `ckpt-p05` must re-derive. Normal bound at S0.5-3.
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

- _2026-08-03 (`S2-fix`, `devops`, branch `mission/context-economy-p2`): the `ckpt-p2` corrective —
  **all four findings landed; F3 NOT severed.** **F1** both §3 mirrors now name the unreleased
  `[~]` **HELD** barrier and say a `[ ]` HELD row is parked, not a wall. **F2** the shared row is
  **SPLIT** (Stop = due-ness scan; closing-action = its *missing* due-ness, stated outright);
  **`beat-enforcer-pretooluse.sh` is untouched** — the scan port stays its own session. **F5**
  the non-candidate `- [ ] … HELD` row **and** the PreToolUse divergence are pinned. **F3**
  `checkNextUpAgreement()` keys a wrapped `Next up:` from its continuation lines and **fails
  closed** on an unkeyable site. Verified: hook-test **31 → 33** green · lint green · selftest 44
  exit 0. **3 mutations, both states, each with the anti-inert control (re-run vs HEAD's checker →
  clean there):** rule (iii) narrowed to "exempt only skipped candidates" → the F5 case ALONE
  fails; PreToolUse given partial due-ness → the new PreToolUse case ALONE fails; the reviewer's
  wrapped-`Next up:` repro (`S8` on line 2 vs header `S2-fix`) → caught now, clean before.
  **Both enforcers hand-dispatched over 7 conditions and each matches its own reworded row.**
  Next: the **`ckpt-p2` re-review**._
- _2026-08-03 (`S5b`, `devops`, branch `mission/context-economy-p2`): the beat-enforcer backstop's
  `head -1` became a **scan for the first DUE candidate** — rule (i) now steps to the next candidate
  instead of exiting, and a HELD-marked row counts as parked (rule iii steps over it; rule ii drops
  its `[ ]`+HELD branch). ⛔/HARD PAUSE barriers still silence every candidate beneath them.
  §3 wording made per-beat-precise in `docs/WORKFLOW.md` + `templates/WORKFLOW.md` + plugin README.
  **Live hand-dispatch on THIS ledger: nudges `ckpt-p2`** — the backstop was dead before (silent
  behind HELD `ckpt-p1`). Verified: hook-test **24 → 31 cases** green · lint green ·
  `context-attrib --selftest` 44 exit 0. **7 mutations, both states:** `head -1` revert → the
  first-due case alone fails; rule (ii) minus its `[ ]` branch / minus `[~]`+HELD / minus
  HARD PAUSE → one distinct case each; rule (ii) deleted → 5; `ls -t`→`ls -tr` and open-beat filter
  dropped → the two new compact-resume cases. **Anti-inert control: every mutation re-run against
  HEAD's 24-case harness passed there** (only the pre-existing ⛔ cases fired) → the new cases are
  load-bearing. Next: `ckpt-p2` (reviews `S5` + `S5b`); see the two S5b deviations._

- _2026-08-03 (`S5`, `backend`, branch `mission/context-economy-p2`): `## Standing steers` added to
  `templates/mission-state.md` (verbatim-only, grammar `- YYYY-MM-DD (ckpt <id>) — "<exact words>"`,
  retire by strikethrough); append rule in `mission.md` **§3 only** + a §4 resume line; WORKFLOW §5
  ledger row. `lint.mjs` +2 checks: `checkStandingSteers()` (grammar + cited `ckpt` id must exist in
  that file's `## Checklist`; OQ4 — only ledgers already carrying the block) and
  `checkNextUpAgreement()` (defect (a)). **Rule: each site reduces to a beat key — first
  session/checkpoint id, else first non-stop word; backticked mentions aren't sites.** Verified:
  lint · hook-test · `context-attrib --selftest` 44 all green. **Mutations, both states:** 3 bad
  steers (paraphrase / no date / `ckpt p99`) → 3 precise findings + valid control passed → restored
  green; header `S5`→`S5b` vs trailer `S5` → `:989 vs line 39` → restored green. Both re-run
  against HEAD's lint (checks reverted) and PASSED there → load-bearing. 3 legacy ledgers exempt +
  green. Next: `S5b`, same branch._

- _2026-08-03 (`S6`, `devops`, branch `mission/context-economy-p3`): shipped
  `hooks/lib/compact-resume.sh` — `SessionStart`, matcher **`compact` and nothing else** —
  emitting a **5-line** re-read directive (`jq -n --arg`, ledger path JSON-escaped, never
  executed); silent with no `.plans/` and no active ledger; **always exit 0**. Folded in the
  **beat-enforcer due-ness fix** (defect (b)): a `[ ]` beat is suppressed when unfinished `[ ]`
  work or an unreleased `⛔`/`HARD PAUSE`/`HELD` row sits above it, or the row itself is held;
  `[x]` blockers stay released. Atomic-ref docs same commit (§3 table row ×2 mirrors; reflex
  count **two → three**, README **Three → Four**). Verify: hook-test **24 cases** clean (was
  16), lint clean, `context-attrib --selftest` exit 0 at **44**; **both mutation proofs run**
  (scratch only, restored). `ckpt-p3` **[STRICT]** is next — surface its verdict immediately._
- _2026-08-02 (`S0.5-fix`, `backend`, branch `mission/context-economy-p05`): corrective session
  for the `ckpt-p05` **REQUEST CHANGES**. **Text + one latent guard; no measurement re-run
  changed a number.** **F1** [Med] — the guard's justifying comment (`tools/context-attrib.mjs`
  header + the guard site) claimed the degenerate record manufactured "513,634 tok = 24.4% of
  TOTAL"; corrected to the **measured 401,449 tok = 19.0% of the unrepaired 2,108,485**, with
  the provenance (**transcript line 4,253, the 553rd request with a usage block, prompt
  401,449 → 0**) and an explicit note that 513,634 is the FINAL PROMPT = 401,449 phantom +
  112,185 genuine, which the guard correctly RETAINS — so a future reconciliation cannot read
  the gap as under-correction. **F2** [Med] — `CHANGELOG.md` `[Unreleased]` brought current:
  **three** invocation forms (was "two only"), the **retracted** 5.59×/377.4k headline replaced
  by the repaired findings (churn **1,707,036** after the `prompt = 0` guard; band
  **1.99–3.24** chars primary; occupancy gate **+28.0% / +149.1% FAIL** vs `/context` TOTAL
  401,400), commit-cited `74f4507`/`c6f0218`/`4288280`/`ab2ec04`. **No version bump — S8 owns
  it and is HELD.** **F3** [Med] — the **cross-domain transfer** (band measured on
  model-authored OUTPUT, applied to INPUT-side rows) is now disclosed **in the report body**,
  not only the header: input-side rows (`tool results` · `attach:*` · `human steers` · `user:*`)
  ride a transferred assumption and may be **UNDERSTATED, not bounded above**; model-authored
  rows — including **P1's Write/Edit figure** — are the estimator's own corpus and are
  unaffected. **F4** [Low, latent] — **TAKEN.** Degenerate rids now go in a separate
  `degenerateRids` set instead of `seen`, so a `requestId` first seen degenerate and later
  carrying a usable prompt is **billed** rather than silently dropped as a duplicate; a repeated
  degenerate line still counts as a duplicate. **Inert on this corpus** (595 unique + 1
  degenerate, no twin). **F5** [Nit] — no action, as directed: `persisted assistant text ≤
  317,105 tok` keeps its `≤` and names its ratio, so it honours OQ6; recorded here for the
  record. **Verify:** `node tools/lint.mjs` **clean, exit 0** · `--selftest` **exit 0 at 44
  cases (43 + F4)** · **baseline re-run on the unchanged 4,612-line / 12,211,203-byte corpus
  (path only, never read): the full report diffs against the pre-fix run as the SIX added
  caption lines and NOTHING ELSE** — TOTAL 1,707,036, Σ chars 2,659,518, band 1.99–3.24, gate
  FAIL +28.0%/+149.1%, D7 1.92–3.13% UNDECIDABLE, ratchet PASS all byte-identical.
  **Mutation proof (scratch copy, repo file never mutated):** restore `seen.add(rid)` in the
  degenerate branch ⇒ **exactly 1 FAIL** (total 1,000 / requests 1 / dup 2 — the revived line
  dropped), exit 1; restored ⇒ **44 ok**, exit 0. Deviations logged: the F3 caption is
  deliberately **unpinned** (a case would have made 45, past the brief's frozen count), and F4's
  case uses a **second isolated fixture** so the main fixture's ~40 pinned constants stay
  untouched. **`ckpt-p05` re-review is next; no headline number moved.** **Next: `ckpt-p05`.**_

- _2026-08-02 (`S0.5-4`, `backend`, branch `mission/context-economy-p05`): **analysis-only —
  no instrument change**, so no new selftest case (the non-negotiable applies to behaviour
  changes; count held at **43**, not lowered). Ran the repaired instrument **once** on the
  **unchanged** corpus (4,612 lines / 12,211,203 bytes — `wc` only, never read) and recorded
  BOTH quantities plus the full package below. Verify: `node tools/lint.mjs` clean ·
  `--selftest` **43 ok, exit 0** · script exit 0 · **the transcript was never `Read`/`cat`ed —
  path passed to the tool, `wc -l -c` for size, nothing else**. Headline: churn **1,707,036**,
  occupancy final **513,634** / max **999,816**, **gate FAILS +28.0%**, Σ chars **2,659,518**
  (bit-identical since `S0.5-1` — the invariant proving only the token model moved).
  **Three brief/memo numbers were found STALE and are recorded as measured, not as briefed**
  (see Deviations): collapses 4 not 5, token-domain Write/Edit **4.40–7.18%** not 2.8–3.7%,
  headline **~4.4–7.2% addressed / ~1.8–4.3% captured** not ~4% / ~1.5–2.5%. Nothing tuned;
  the repaired numbers moved the write-firewall case **up**, not down, and are reported that
  way. **D11, OQ7 and the P1–P4 question are untouched — the human's at `ckpt-p05`.`Next:
  ckpt-p05`.**_

- _2026-08-02 (`S0.5-3`, `backend`, branch `mission/context-economy-p05`, **completed after an
  infrastructure failure**; kept-vs-rewritten in Deviations): `tools/context-attrib.mjs` now
  labels **churn** (1,707,036 — unchanged, still THE OPTIMISATION TARGET and the headline) and
  **occupancy** (max **999,816** @ req #309/L2,438, corroborated by the compaction at the next
  request; final **513,634** @ #595/L4,608) as separate quantities, and the 15% gate runs on
  **occupancy** via a third CLI form `--context-total=` (OQ7, reviewer may overrule).
  **GATE FAILS: final +28.0% vs `/context` TOTAL 401,400** (max +149.1%). Comparator is the
  TOTAL, never the *Messages* 377.4k — the block names the prompt series' components and the
  5.25x→5.59x slip (M5). +28.0% reproduces M5's 1.280x exactly: a **finding, nothing tuned**.
  D7's denominator is printed: **TOTAL prompt growth (Σ positive prompt-deltas over unique
  requests) = 1,707,036 tok**, token-domain; the 4.0% char share is reference only.
  **⚠ HUMAN AT `ckpt-p05`: reviewer share 1.92–3.13% STRADDLES 3%** — printed as UNDECIDABLE
  at this band width, not as a verdict. **D11 not re-decided; D7 stands.** Verify: lint clean ·
  `--selftest` 0 at **43 cases (was 31)** · **10 mutations, 10 caught** on a scratch copy
  (gate-on-churn 2 FAIL · no high-water 4 · no final idx/line 3 · denominator→chars 1 ·
  re-decide-guard 1 · *Messages* warning 1 · churn label 1 · threshold 15→25 1 · parser not
  fail-closed 1 · usage form 1; unmutated **43 ok / clean**). Two **survived a first draft**
  (churn label, usage form) — cases tightened to bind label→row and form→invocation line.
  Real 4,612-line transcript exercised by **path only, never read**: flag-absent output diffs
  against `HEAD` as **only** the two new blocks — TOTAL, band 1.99–3.24, Σ 2,659,518 chars,
  every category and ratchet PASS byte-identical, so the chars invariant holds. Dated D7
  clarification appended in `.plans/context-economy.md` (locked text untouched). `S0.5-4`:
  record BOTH numbers, report the FAIL without tuning, collapses = **4** not 5, carry the
  straddle into the re-decision package._

- _2026-08-02 (`S0.5-2`, `backend`, branch `mission/context-economy-p05`, **salvaged**):
  `tools/context-attrib.mjs` — zero-dep **output-side envelope estimator** (per unique
  request `q = persisted assistant chars ÷ output_tokens`; drops `out < 20` or `chars = 0`;
  type-7 quantiles). **Band = [p90 … max] = 1.99 – 3.24 chars/token** (n = 594 qualifying,
  2 dropped; median 1.04) — each q is a FLOOR because unpersisted thinking spends output
  tokens without chars, so the band is an upper region, and it never closes without a
  tokenizer. Churn ratio 1.55 **retired as a converter**, still printed as a diagnostic.
  **CHARS are now the primary column**; every token figure prints as a band + `[MEASURED]`
  / `[EST/BAND]` tags; the output-side line reads `≥72%` (was `~42%` at 1.55 — the `ckpt-p0`
  `~`/`≥` nit is closed). **Char-free mass named as its own line: 310,024–827,549 tok =
  18.2–48.5% of TOTAL**, defined as remainder and captioned QUANTIFIED-NOT-EXPLAINED; the
  books close in integers at BOTH endpoints. **Verify:** `--selftest` clean **31/31**,
  `node tools/lint.mjs` clean, baseline re-run on the same 4,612-line corpus.
  **Mutation proof (scratch copies, repo file never mutated):** delete `chars > 0` ⇒ 3 FAIL
  (a q = 0 sample enters, n = 4, dropped = 2); delete `out >= MIN_OUT` ⇒ 3 FAIL (req-7's
  q = 21.4 becomes the band's tight end, n = 4, dropped = 1); delete both ⇒ 3 FAIL
  (n = 6, dropped = 0); restored ⇒ 31/31 ok. **Chars are bit-identical to `S0.5-1`**
  (76,007 / 273,235 / 243,578 / 165,629 / 377,452 / 400,738 / 208,338 / 113,672 / 343,579;
  Σ 2,659,518) and TOTAL is unchanged at 1,707,036 — only token columns moved, downward,
  because the band's ratio exceeds 1.55: attributed 1,422,285 → 679,085–1,107,624, so
  **UNATTRIBUTED 16.7% → 35.1–60.2%** and the char-free mass that was hidden inside it is
  now stated. Category char shares moved ≤0.1pt (rounding of a different denominator).
  **D7: reviewer 4.0% point → 1.92–3.13% banded — the verdict still REOPENS, but only via
  the high end**; `S0.5-3` owns naming that denominator and must re-derive it. Note the
  measured char-free band sits BELOW memo M6/M7's 56–66% expectation, which assumed a
  3.2–4.2 band; not tuned. **Next: `S0.5-3`.**_

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

### 📦 PHASE 0.5 RE-DECISION PACKAGE — for the human at `ckpt-p05` (S0.5-4, 2026-08-02)

_This block **supersedes the headline numbers** of the D1 pause package below, which is kept
as the record of what was believed at the pause, not as a source of figures. Every figure
here is from ONE run of the repaired instrument on the **unchanged** corpus
`2fa752c7-…-ec63daee6496.jsonl`, **4,612 lines / 12,211,203 bytes** — identical to `S0.5-1/2/3`,
so the whole of Phase 0.5 is a single-corpus before/after. **The transcript was never read.**
**Chars are primary (counted). Every token figure is a band. There is no point value.**_

**1 — The repaired numbers.**

| quantity | value | status |
|---|---|---|
| **churn** (Σ positive prompt-deltas) — **THE TARGET, the headline** | **1,707,036 tok** | MEASURED |
| occupancy: final prompt | 513,634 tok (req #595, line 4,608) | MEASURED |
| occupancy: max prompt | 999,816 tok (req #309, line 2,438) | MEASURED |
| appended chars, Σ | **2,659,518** | MEASURED — **bit-identical across all of P0.5** |
| chars/token band `[p90 … max]` | **1.99 – 3.24** (n = 594, 2 dropped, median 1.04) | EST, each q a FLOOR |
| UNATTRIBUTED (residual) | **35.1 – 60.2%** of churn | EST/BAND |
| char-free prompt growth | **310,024 – 827,549 tok = 18.2 – 48.5%** | EST/BAND, **quantified not explained** |
| collapses / Σ collapse mass | **4** / 1,193,402 tok | MEASURED |
| `isCompactSummary === true` | **1** | MEASURED |
| ratchet identity | 1,707,036 − 1,193,402 = 513,634 = final prompt | **PASS** |
| degenerate `prompt = 0` records skipped | 1 | MEASURED |
| selftest | 43 cases, exit 0 | gate |

**2 — What moved vs. the D1 pause package, and why.** Nothing was tuned; each row has a cause.

| | pause package | repaired | cause |
|---|---|---|---|
| TOTAL (churn) | 2,108,485 | **1,707,036** (−19.0%) | D10a: one `prompt = 0` record re-billed the resident context (`S0.5-1`) |
| chars/token | 1.25 (derived, sub-plausible) | **band 1.99–3.24** | D10b/OQ6: churn ratio retired as a converter; zero-dep output-side envelope estimator (`S0.5-2`) |
| UNATTRIBUTED | 16.7% | **35.1–60.2%** | smaller TOTAL + a higher ratio ⇒ attributed tokens fall; the char-free mass that was hidden inside it is now stated |
| sanity check | churn vs `/context` **Messages** 377.4k → 5.59× | **occupancy vs `/context` TOTAL 401,400 → +28.0%** | D10c: churn and occupancy are different quantities; comparator corrected to TOTAL (memo M5) |
| collapses | 5 | **4** | the 5th was the degenerate `prompt = 0` collapse the D10a guard removed |
| `isCompactSummary` | "20" | **1** | the 19 others were the *string* in this mission's own docs — a self-referential grep artefact (memo M1) |
| D7 reviewer share | 4.0% (char point value) | **1.92–3.13%** (token band) | denominator named + banded (`S0.5-3`) |
| Σ chars | 2,659,518 | **2,659,518** | **unchanged — this is the invariant proving only the token model moved** |

**3 — The three denominators (memo M8), re-derived.** Char shares are **bit-identical** to the
memo (chars never moved). The token domain is where the repair bites.

| denominator | base | Write/Edit | skill_listing | tool results | subagent ret. | reviewer |
|---|---|---|---|---|---|---|
| ALL chars (9 named + residual) | 2,659,518 | 9.16% | 7.83% | 14.19% | 15.07% | 4.00% |
| MID chars (9 named, residual out) | 2,202,228 | 11.06% | 9.46% | 17.14% | 18.20% | 4.83% |
| NARROW chars (non-`attach:` named) | 1,536,639 | **15.85%** | (13.56% — see caveat) | 24.56% | 26.08% | 6.91% |
| **TOKEN — Σ prompt growth (churn)** | **1,707,036 tok** | **4.40 – 7.18%** | 3.76 – 6.14% | 6.8 – 11.1% | 7.2 – 11.8% | **1.92 – 3.13%** |
| planning-time estimate | — | **22.5%** ⟵ RETRACTED | 16.0% | 25.1% | 0.4% | — |

- **Caveat on the NARROW column (new finding, memo not rewritten):** NARROW's denominator
  **excludes the `attach:` categories**, so a NARROW share is only coherent for a category
  inside it. `skill_listing` **is** an `attach:` category, so its 13.6% divides a numerator by
  a denominator that omits it — **do not use 13.6% to size the free lever**; use 7.8% char /
  3.8–6.1% token. `Write/Edit` is inside NARROW, so 15.9% is coherent.
- Memo M8 labels NARROW "7 non-attach"; the value 1,536,639 is the sum of **6** categories.
  Value right, count off by one.

**4 — The founding premise is RETRACTED, and the retraction is not all one way.**
The mission was launched on orchestrator **Write/Edit = 22.5%** of context. Measured:

- **char domain: 9.2% (ALL) / 11.1% (MID) / ≤15.9% (NARROW, the most generous).** Even the
  most generous denominator is **~30% below** the claim. This half of the retraction stands
  exactly as the memo stated it.
- **token domain: 4.40 – 7.18% of churn** (243,578 chars ÷ the 1.99–3.24 band ÷ 1,707,036).
  ⚠️ **This is HIGHER than the 2.83–3.71% carried in the memo (M9), the plan checklist and
  the S0.5-4 brief** — because the repaired TOTAL is 19% smaller *and* the measured band
  (1.99–3.24) is lower than M9's assumed 3.2–4.2. Both corrections push the share up.
  **The measured value is reported; the briefed value is not.**

**5 — The headline scope claim on repaired numbers.**

| | "addresses …" | "realistic capture" (plan's own 40–60%) |
|---|---|---|
| as originally claimed | ~25% | 10–15% |
| memo §2 Option C (token, pre-repair) | ~4% | ~1.5–2.5% |
| **REPAIRED (token, churn denominator)** | **~4.4 – 7.2%** | **~1.8 – 4.3% of churn = 30k – 74k tok** |

⚠️ **The memo's "on the 401.4k baseline" column is a domain mix and is not reproduced as a
recommendation.** It applies a *churn* share to an *occupancy* baseline — the exact
normalisation error class this phase exists to end. If anyone insists on the arithmetic it
gives ~7k–17k tok; **it is not a number to decide on.**

**Stated plainly:** the write firewall is worth **roughly 1.5–3× more than the memo's Option C
said**, and still **~3–5× less than the mission's founding claim**. It is not the headline. It
is also no longer a rounding error. That is a genuinely closer call than the memo's "the cost
case is dead", and it is the human's to make.

**6 — 🔴 THE OCCUPANCY GATE FAILS. What that bounds, and what it does not block.**
Comparator `/context` **TOTAL = 401,400** (never the *Messages* 377.4k). Final prompt 513,634
= **+28.0%**; max 999,816 = **+149.1%**; threshold ±15%. **FAIL.** The +28.0% reproduces memo
M5's 1.280× *exactly* — a finding, reproduced, not tuned. The max is independently
corroborated: the one compaction fires at the **very next** request (#310, 999,816 → 82,009).

- **What it bounds:** every **absolute** token magnitude here may be overstated by ~28%. No
  "this saves N tokens" claim may be made off these numbers without that haircut, and the
  gate must pass before any such claim is published.
- **What it does not block:** the P1–P4 decision rests on **shares** (category ÷ churn), and a
  share is first-order insensitive to a *uniform* scale error — numerator and denominator move
  together. So the gate FAIL **bounds** a P1–P4 decision; it does not **block** one.
- **The caveat that keeps it honest:** we have not shown the error *is* uniform. If the 28% is
  concentrated in one component (char-free mass and preamble re-injection are the obvious
  suspects), shares shift too. And the comparator itself is a **hand-recorded, single-moment
  `/context` reading** whose timing against "final prompt" is unverified — part of the 28%
  could be the comparator, not the instrument. **Nobody has closed this.**

**7 — ⚠️ D7 STRADDLES ITS OWN TRIGGER (flagged, NOT decided).** Reviewer return share =
**1.92 – 3.13%** of the now-named denominator — *TOTAL prompt growth (Σ positive prompt-deltas
over unique requests) = 1,707,036 tok, token-domain*. The 3% trigger sits **inside** the band:
below at the low end, above at the high end. The instrument prints **UNDECIDABLE at this band
width** and re-derives without re-deciding. **D11 (human, 2026-08-02) stands: D7 STANDS**, the
`reviewer` keeps its no-Write structural guarantee. The band closes only with a real tokenizer
(OQ6 ruled that out) or a second transcript. **No agent may resolve this; it is a human act at
a checkpoint.**

**8 — One line per HELD phase, on repaired evidence.**

- **P1 — write firewall.** Premise **retracted** (22.5% → ≤15.9% char / 4.40–7.18% token), but
  the token case is **1.5–3× better than the memo said**. Verdict input: no longer the
  mission's headline; plausibly still worth doing as near-free contract hygiene. **Closest
  call of the four — genuinely open.**
- **P2 — standing steers.** A **fidelity** control. Its case never rested on token math and
  **nothing measured here touches it**, up or down. Decide it on fidelity grounds alone.
- **P3 — `SessionStart:compact` re-read directive.** A **correctness** control, and the
  measurement *supports* it independently of cost: **exactly 1 compaction confirmed** in a
  595-request session, and it dropped the window 999,816 → 82,009 (a **91.8%** loss of resident
  context in one step). The value is that *that one* does not lose the ledger. **Strongest
  standalone case of the four.**
- **P4 — measure / record / ship.** Downstream of every decision above; its D4a design and its
  metrics-doc headline are both defined by what P1–P3 become. **Cannot be decided first.**

**9 — The free lever, as an INPUT, not as planned work.** `skill_listing` = 208,338 chars
(**7.8%** of appended chars; **3.8–6.1%** of churn) and is the **only** category whose share
*rises* under an occupancy view (7.8 → 11.3%, memo M10) because it is re-injected and never
compacted away. Zero engineering. Currently **out of scope** (`.plans/context-economy.md:243`).
Two honesty notes: M10's occupancy sample is 44 requests (**directional only**), and its NARROW
13.6% is incoherent (§3 caveat). The human may fold it in at the decision point; **this session
neither scopes nor recommends it.**

**10 — Still open, owned by NO phase.**

| item | state |
|---|---|
| **Collapse #4** — req #551, line 4,222, **−270,711 tok, no adjacent compact summary** | **unexplained**, deferred by design (task 23). Two more (#1 3,106 / #2 1,778) are likewise unexplained but small. |
| **The char-free mass** | **quantified (18.2–48.5%), not explained.** Measured **below** memo M6/M7's 56–66% expectation, which assumed the 3.2–4.2 band. Do not size a lever off it. |
| **`attach: other`** | **likely OVER-stated.** 77 attachments had no `stdout`/`content`/`text`/`output` field and were sized on the record minus `type` — **307,136 chars = 11.5% of all appended chars**. Needs one real record's key set dumped. |
| **The +28.0% gate residual** | unexplained; instrument and/or comparator (§6). |
| **OQ7** — `--context-total=<tokens>`, the third CLI form | **OPEN.** Shipped on the planner's standing yes; **no human ruling.** Removal is local (one flag, one report block, three selftest cases). The reviewer may overrule at `ckpt-p05`. |
| **n = 1 / D4b** | see §11. |

**11 — 🔴 CONFIDENCE: this is n = 1, and that is the largest uncertainty in the package.**
One transcript, one session, one repo, one operator, measured once. Everything above —
every share, the band, the char-free mass, the 4 collapses, the 1 compaction, the D7 straddle —
is a **single observation with no variance estimate**. It cannot say whether these shares are
typical of an orchestrator session or particular to this one (which was itself a *planning*
mission — heavy on subagent returns and prose, and the source of its own measurement).
**D4b — cross-mission re-measurement on a later comparable mission — remains the only real
confirmation** and is still deferred/tracked. Read the shares as **the right order of
magnitude with the right sign**, not as parameters. A decision that survives a 2× error in any
single share is safe to take now; one that does not, is not.

**12 — Bounds on this package as a whole.** Safe to decide **direction** and **relative
priority** (P3 > P2 > P1 on evidence strength; P4 last). **Not** safe to decide **absolute
savings targets**, to publish a token number, or to resolve **D7/D11**, **OQ7** or the
**P1–P4 authorization** — those are the human's at `ckpt-p05` and the decision point after it.

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

Next up: **S7a** — the Phase 4 instrument change on a **new branch
`mission/context-economy-p4`** cut from `mission/context-economy-integration`: name the four
A4 delta kinds (`context-attrib.mjs:197-199`), print the per-attachment-kind table plus the
`mission machinery footprint` line (A5), and pin the D7 3% trigger as a named constant beside
`GATE_PCT` with cases in both directions (A3). Selftest **≥ 44 cases**, mutation-proven, no
measurement run. Brief: `.plans/context-economy.sessions.md` `## Phase 4`.

Phases 0, 0.5, 2 and 3 are COMPLETE, APPROVED and MERGED (`273f1d3`, `f5fabc6`, `e5b6326`,
`8a3b4c7`). **Phase 4 is the last phase — nothing follows it.**

**D15 (2026-08-03) accepted the Fable recommendation in full:**
- **P1 is DROPPED** — not deferred. Its residue rides along in P4 (discipline lines with no
  savings claim; a ~3-line instrument extension naming the A4 delta kinds; the A5
  hook-footprint measurement).
- **P4 is AUTHORIZED and REQUIRES a planner re-brief** — S7/S8 were written against the
  retracted 22.5% premise. The metrics doc must record **A1–A10 and the A4 correction**;
  **D4a is an observation, not a gate**.
- **The mission WRAPS AT P4.** Nothing after it.
- **A4 is an OWNER SETTINGS ACTION, not engineering** — ≥~80% of that 372k is the human's own
  `~/.claude/skills` (~140 skills, 208k) and MCP config (93k). Pruning those beats everything
  P1–P4 could have delivered, and it is outside this repo.

**Four live threads belong to the human, not to any agent:** the **occupancy gate FAILS at
+28.0%** vs `/context` **TOTAL** 401,400 (bounds absolute magnitudes; does not block a
share-based decision — package §6); the D7 reviewer share **1.92–3.13% STRADDLES 3%**,
printed UNDECIDABLE (**D11 stands — do not re-decide**); **OQ7** (`--context-total=<tokens>`)
shipped on the planner's standing yes with no human ruling (reviewer declined to overrule;
removal is local); and **n = 1** — one transcript, one session, itself a planning mission.

✅ **The `Next up:` two-site agreement check is GUARDED as of `S5`** — `node tools/lint.mjs`
fails when two `Next up:` sites name different beats (comparison is on the first
session/checkpoint id at each site, so prose around it may differ freely). This file drifted
three times before the gate existed; a resuming session may now trust these two sites.

**Phase 4 is the ONLY remaining authorized work** (D15). P1 is dropped; P0, P0.5, P2 and P3
are merged. Nothing is authorized after `ckpt-p4`.

Read order for whoever runs Phase 4: the `## D15` block and the `## ⚠️ WHOLE-MISSION AUDIT`
above, then the brief in `.plans/context-economy.sessions.md` `## Phase 4`, then only the
📦 package ranges the brief names — the package is cited by **section number**, never
re-derived. The historical **D1 pause package** below is **superseded in its headline
numbers** (its TOTAL carries 24.4% phantom churn and its 5.59× divergence is a normalisation
artefact); it is kept as the record of what was believed at the pause, not as a source of
figures. **Every P0.5 headline reproduces byte-for-byte** and was re-verified by the audit.

Run each Phase 4 session in a **FRESH session** (deliberate: starting a context-economy
session inside a 400k-token window is the anti-pattern it exists to fix). Ten sessions died
on usage limits on 2026-08-03 — that is why P4 is six small briefs and not two.
