---
status: static
owner-agent: analyst
refresh-trigger: never (mission closed; superseded only by D4b, a future mission)
---

# Context-economy metrics — the record

_This is an **engineering-economics record**: how much of one orchestrator transcript's
context growth is attributable to what, and what the `context-economy` mission actually
moved. It is explicitly **NOT** the product tracking plan — `templates/engineering-tracking-plan.md`
serves a different consumer (product instrumentation: funnels, unit economics, ops trends).
This doc has one consumer: engineers deciding whether to spend more effort on orchestrator
context cost, and what to spend it on._

_All figures below trace to `.plans/context-economy.state.md` → `## 📊 S7b MEASUREMENT
BLOCK` (2026-08-03), or to the `## ⚠️ WHOLE-MISSION AUDIT` (Fable, independent,
2026-08-03) and `## 📋 Fable recommendation memo` blocks in the same file. Every number
carries a status tag: **MEASURED** (counted from a transcript), **EST/BAND** (derived via
the estimator, never a point value), or **stated as an inference** where it is reasoning
rather than a citation. This session ran no instrument and read no transcript — see the
transcript rule below._

## Method

- **Instrument:** `tools/context-attrib.mjs` (as of `04df14a`, session `S7a`), a zero-dep,
  `readline`-streamed script with a 54-case `--selftest` (mutation-proven; see the ledger's
  handoff log for the individual proofs).
- **Accounting model:** TOTAL is **churn** — Σ positive prompt-deltas over unique
  `requestId`s — which is the mission's optimisation target, distinct from **occupancy**
  (the max or final resident prompt size, which is what `/context` reports at a single
  moment). The two diverge because compaction collapses the prompt and re-accumulation is
  counted again in churn but not in occupancy.
- **Chars are primary (counted, model-free); every token figure is a BAND, never a point
  value.** Tokens are derived via a **zero-dep output-side envelope estimator** (OQ6):
  per unique request, `q = persisted assistant chars ÷ output_tokens`, records with
  `output_tokens < 20` or `chars = 0` dropped, type-7 quantiles taken over the qualifying
  sample, band = `[p90 … max]`. Each `q` is a **floor** — unpersisted thinking spends output
  tokens without leaving chars — so the band is an upper region that never closes without a
  real tokenizer or a second transcript.
- **Transcript rule:** no `*.jsonl` is ever `Read`/`cat`/`head`/`tail`-ed by any session in
  this mission, including this one. Only `wc`, `grep -c`/`grep -l`, and the streaming
  instrument touch transcript files.
- **Corpora:** **B** = baseline, `2fa752c7-…-ec63daee6496.jsonl`, 4,612 lines / 12,211,203
  bytes (the S0.5-4 / whole-mission-audit corpus, unchanged throughout). **M** = this
  mission's own transcript, `b167727e-…-ec63daee6496.jsonl`, 1,501 lines / 3,283,782 bytes
  at measurement time (2026-08-03T15:59:53Z) — it was **live** when measured (the P4
  orchestrator session), so it has grown since and a re-run will not reproduce these exact
  M figures.

## The headline

| | claimed at mission launch | repaired measurement |
|---|---|---|
| "addresses" | **~25%** | **~4.4 – 7.2%** of churn [EST/BAND] |
| "realistic capture" (the plan's own 40–60% of "addresses") | **10–15%** | **~1.8 – 4.3%** of churn = 30k–74k tok [EST/BAND] |

The founding premise — **orchestrator `Write/Edit` = 22.5% of context** — is **retracted**.
Measured: **9.16% of appended chars** on baseline B (243,578 / 2,659,518 chars) [MEASURED],
band **4.40–7.18% of churn tokens** [EST/BAND]. Even the most generous char denominator
(NARROW — non-`attach:` categories only) puts it at ≤15.9%, still ~30% below the claim.
**n = 1 throughout this entire document** — one transcript per corpus, one session, one
operator, no variance estimate.

## What was measured, category by category (baseline B)

The category split (chars primary, char share preferred over token share) [MEASURED, chars;
tokens EST]:

| category | chars | char share |
|---|---|---|
| human steers | 76,007 | 2.9% |
| orchestrator prose | 273,235 | 10.3% |
| authored: Write/Edit inputs | 243,578 | 9.16% |
| authored: Bash commands | 165,629 | 6.2% |
| tool results | 377,452 | 14.2% |
| subagent returns | 400,738 | 15.1% |
| attach: skill_listing | 208,338 | 7.8% |
| attach: hook_success (part of A5, see below) | 113,672 | 4.3% |
| attach: other (pre-S7a naming) | 343,579 | 12.9% |
| UNATTRIBUTED (residual) | — | 16.1–17.2% [pre-repair point value; post-repair band 35.1–60.2%, see A6/A9] |
| **TOTAL** | **2,659,518** | 100% |

Per-`subagent_type` return share of TOTAL (D9 table) [MEASURED]:

| subagent_type | spawns | return chars | share |
|---|---|---|---|
| `agentic-workflow:reviewer` | 19 | 106,258 | 4.0% (char) |
| `agentic-workflow:brainstormer` | 9→10 | 76,862 | 2.9% |
| `Explore` | 3→5 | 68,520 | 2.6% |
| `general-purpose` | 12 | 35,243 | 1.3% |
| `agentic-workflow:advisor` | 8→12 | 30,970 | 1.2% |
| `agentic-workflow:backend` | 10 | 27,819 | 1.1% |
| `agentic-workflow:architect` | 4 | 26,063 | 1.0% |
| (remainder: planner, frontend, researcher, claude-code-guide, security, analyst) | — | — | ≤0.5% each |

D9 fed D7 (the reviewer-return trigger) — see A2 below for its resolution.

## A1 — the invariance argument is provably wrong post-repair [defect, from the code]

The pre-repair D1 package argued that category **shares** (not absolute magnitudes) are
robust to the occupancy-gate FAIL, because a uniform scale error moves numerator and
denominator together. **That argument was inherited verbatim into the post-repair
package, where the repair had already invalidated it.** After P0.5, the token-share
numerator rides `output_tokens` only (the envelope estimator), while the denominator is
Σ prompt-deltas of `input + cache_creation + cache_read` — **orthogonal, not the same
series.** Consequence, stated plainly: **a ~28% prompt-series inflation deflates every
token share above by ~28%. The occupancy gate FAIL does bound the share decision**, not
merely the absolute-magnitude claims. The char column (primary, counted) is untouched by
A1 — but it answers a different denominator (appended chars, not churn tokens) and must
never be mixed with the token column as if they measured the same thing.

## A2 — the D7 "straddle" was manufactured by the p90 choice, not measured

The prior report read the reviewer-return token share as **1.92–3.13%, straddling the 3%
trigger, UNDECIDABLE**. The `envSamples` tail (n = 594) is smooth — 2.88, 2.98, 3.08, 3.20,
3.24, no outlier — so p90's robustness rationale (guarding against an outlier) has nothing
to guard against here, and **59 of 594 samples already exceed the p90 endpoint**. At the
band's own **max**, the reviewer sits at **1.92%** — below 3% under any defensible endpoint
choice, agreeing with the architect's independent estimate of 1.23–1.62%. The "straddle" was
escalated to the human and published on the status page as a live thread; on this evidence
it should not have been. **This does not re-decide D7 — D11 stands** ("D7 stays LOCKED; the
`reviewer` keeps its no-Write structural guarantee"), and this doc does not re-decide it
either. It records that the escalation's own premise (a genuine straddle) does not survive
scrutiny of the quantile choice that produced it.

## A3 — the 3% trigger was a bare literal pinned by zero cases (the fourth bug)

The D7 3% trigger was duplicated across three prose strings with no case testing it.
Mutating `shareHi > 3` → `> 1` produced a **self-contradicting governance verdict with all
gates green**: the tool printed "reviewer return share = 1.92–3.13%" immediately followed by
"the WHOLE band is above 3% — the trigger condition reads as MET." Session **S7a fixed
this**: the trigger is now a named constant beside `GATE_PCT`, with selftest cases pinning
it in both directions, and **S7a reproduced the failure verbatim before fixing it**.

## A4 — as corrected: `attach: other` was not over-stated, and the lever is mostly outside this repo

The instrument's own warning ("`attach: other` is likely OVER-stated") was a **wrong
guess**. The 77 fallback records are lean payload objects with no uuid/timestamp/session
metadata — the fallback branch is registry/definition injection, not padded metadata. What
is actually inside it, split by delta kind [MEASURED, chars; B and M have independent
denominators]:

| attachment kind | B chars | B % of 2,659,518 | M chars | M % of 941,193 |
|---|---|---|---|---|
| `skill_listing` | 208,338 | 7.8% | 30,000 | 3.2% |
| `deferred_tools_delta` | 79,463 | 3.0% | 17,105 | 1.8% |
| `agent_listing_delta` | 58,194 | 2.2% | 28,891 | 3.1% |
| `mcp_instructions_delta` | 14,319 | 0.5% | 4,664 | 0.5% |
| `invoked_skills` | 11,800 | 0.4% | 0 | 0.0% |
| **A4 total** | **372,114** | **14.0%** | **80,660** | **8.6%** |

**≥ ~80% of that 372,114 chars is not this repo's surface:** `skill_listing` (208,338) is
the **owner's ~140 personal skills** in `~/.claude/skills` — this plugin ships **one**
skill, 2,874 bytes. `deferred_tools_delta` (79,463) and `mcp_instructions_delta` (14,319)
are **user-level MCP configuration**. The only in-repo lever is the **~9,875 chars of agent
descriptions (20 agents)** feeding `agent_listing_delta` (58,194 chars, ~2% of appended
chars at best). **Reduction is an owner SETTINGS ACTION — prune `~/.claude/skills` and
unused MCP servers — minutes, not engineering, and outside this repo.**

**The re-bucketing proof** [MEASURED, arithmetic]: `attach: other` on the pre-S7a
instrument (`git show 04df14a~1:tools/context-attrib.mjs`, run on corpus B) reports
**343,579** chars; the post-S7a instrument reports **179,803**. Shrink = **163,776 =
79,463 + 58,194 + 14,319 + 11,800, exactly.** No mass created, none lost — pure
re-bucketing. Σ chars, TOTAL, D7 and ratchet lines are identical between the two runs; the
only movement is ±1 token at band endpoints, a previously-logged rounding artefact
confirmed on real data.

**New nuance from M:** `skill_listing` fell **208,338 → 30,000** on the *same machine*
between the baseline and mission sessions, so **the 14.0% A4 total is episodic, not a
per-session constant** — a real before/after on skill pruning would need matched sessions,
which is D4b's problem again. Inside `attach: other`, the largest single kind is actually
`edited_text_file` (B 136,143 = 5.1%; M 41,941 = 4.5%) — tool-result echo of edits, not
registry injection.

## A5 — the mission's own machinery is a top-5 consumer, and it got worse during the mission

`hook_success` + `hook_additional_context` + `task_reminder` [MEASURED, both corpora —
all three are attachment kinds in both; the `EXCLUDED` provenance branch never fired]:

| component | B chars | B % | M chars | M % |
|---|---|---|---|---|
| `hook_success` | 113,672 | 4.3% | 65,737 | 7.0% |
| `hook_additional_context` | 19,362 | 0.7% | 21,333 | 2.3% |
| `task_reminder` | 10,655 | 0.4% | 0 | 0.0% |
| **footprint** | **143,689** | **5.4%** | **87,070** | **9.3%** |

**The mission's own machinery is a larger consumer of context than anything P0–P4 could
save, and its share nearly doubled while the mission ran: 5.4% → 9.3% of appended chars.**
P3 shipped another injecting hook (`hooks/lib/compact-resume.sh`) without measuring its
footprint. **That hook's footprint is not separable** — the table's granularity is
`attachment.type`, and every hook lands under `hook_success`/`hook_additional_context`
regardless of which hook fired it; per-hook attribution needs a new instrument field, not a
new reading of this one. With M's corpus 2.8× smaller than B's, `hook_additional_context`
still *grew in absolute chars* (19,362 → 21,333) and tripled in share; `hook_success` went
4.3% → 7.0%.

## A6 — 34% of transcript records are excluded with no counter

`last-prompt`, `mode`, `ai-title`, `pr-link`, `file-history-snapshot` (770KB raw) — 1,583
records the taxonomy never touches, while `badJson` and `sidechain` **are** counted and
printed. Probably correct to exclude; **nobody has verified it**, and it feeds the
35–60% (B) / 39–50% (M) UNATTRIBUTED residual. The assistant content loop
(`context-attrib.mjs:297-325`) also has no `else` residual branch, unlike the user loop
(`:344`) — a schema change could silently drop mass with no signal.

## A7 — the mission's best corroboration, stated nowhere until now

All **480 thinking blocks** in the sampled transcripts carry `thinking: ""` — zero
persisted chars. That is **why median q = 1.04** in the envelope estimator (many requests
spend output tokens on thinking that leaves no persisted characters), and it independently
validates the estimator's core premise: that `q = chars ÷ output_tokens` is a floor, not a
measurement.

## A9 — the reading trap: asymmetric bands flatter the mission in both directions

Bands throughout this document are **asymmetric**: the mission's levers (Write/Edit,
skill_listing, agent_listing_delta) sit at the **low** end of their bands, and the
unexplained mass (UNATTRIBUTED, char-free growth) sits at the **high** end — simultaneously.
Reading midpoints therefore flatters the mission twice over, once in each direction. Honest
reading of the instrument's own data on baseline B: Write/Edit ≈5.6% (token), UNATTRIBUTED
≈60%, **char-free growth ≈48.5% — roughly 10× every lever the mission owns, owned by no
phase.**

## A8/A10 as recorded

**A8 — dogfooding gap.** `## Standing steers` — the convention session S5 shipped — is
`(none)` in the ledger of the mission that shipped it, while decisions D10–D14 record human
decisions in paraphrase rather than the verbatim form the convention itself requires.

**A10 — the wrap-at-P4 judgment.** The whole-mission audit recommended: **WRAP AT P4, drop
P1 or re-point it at A4.** The human accepted this in full (D15): P1's premise is retracted
and D13 already strips its savings claim, leaving pure contract hygiene that does not need
its own phase; P1's residue folds into P4/S8a as discipline text with no savings claim.
This is recorded as a **judgment**, not a defect — the audit itself is explicit on this
distinction.

## D4a: an observation, never a gate

| `authored: Write/Edit inputs` | chars | % of appended chars | % of churn (token band) |
|---|---|---|---|
| **B** (baseline) | 243,578 | **9.16%** [MEASURED] | **4.4–7.2%** [EST/BAND] |
| **M** (this mission) | 81,004 | **8.61%** [MEASURED] | **5.6–6.8%** [EST/BAND] |
| delta | — | **−0.55 pp (−6.0% relative)** | **bands OVERLAP — no signal** |

- **The char share is the only column comparable across the two corpora.** The token bands
  are **not comparable**: the estimator's own band differs between transcripts (B
  1.99–3.24 vs M 2.68–3.26 chars/tok), so any apparent token-share "movement" is an artefact
  of the estimator's inputs, not of behaviour.
- **This is not a gate and was not evaluated as one** (D13, standing; D15). A 50% cut to a
  4.4–7.2% share would be 2–3.6% — inside the instrument's own uncertainty band, so it
  cannot be gated on. **D4b remains the only real confirmation**, and it needs a second
  *comparable* transcript that does not exist.
- **OQ5 comparability caveat, in full — this was not the same experiment.** M is ~8 sessions
  of contract/instrument/doc text in which the orchestrator **delegated almost all authoring
  to subagents in their own sessions**; B is a 9-session baseline of template authoring done
  largely in-session. The rest of M's split says the same thing loudly: human steers
  **2.9% → 12.6%**, orchestrator prose **10.3% → 14.3%**, subagent returns **15.1% → 3.9%**,
  `authored: Bash` **6.2% → 1.7%**. The −6.0% figure above **must not be read as a treatment
  effect** of anything this mission built.

## D8: `isCompactSummary` stays Option A

- The brief's literal command — `grep -l isCompactSummary
  ~/.claude/projects/.../*.jsonl | wc -l` — returns **11**, not the planning-time value of
  **1**. **This is an artefact**, not a new finding: memo M1's self-reference has grown —
  the mission's own docs now name the field, and ten more transcripts in the project
  directory quote those docs.
- The honest command and its result: `grep -hoE '"isCompactSummary" *: *true' *.jsonl |
  wc -l` → **1 record**, across every transcript in the project directory. The instrument's
  own MEASURED line agrees: **1** on B, **0** on M.
- **Real compaction events = 1. 1 < 3 ⇒ D8 stays Option A**; no promotion to Option B.
- Flagged, not fixed here: the D8 criterion should be restated in terms of
  `"isCompactSummary": true` **records**, not a bare-string `grep -l`, which will keep
  drifting upward as the mission's own docs are quoted by future transcripts.

## Two out-of-scope levers, sized as inputs (not planned work)

Neither of these is addressed by any phase of this mission:

- **`skill_listing`** — 208,338 chars / 7.8% of appended chars (baseline), 3.8–6.1% of churn
  tokens. Zero engineering; it is the owner's `~/.claude/skills` directory. Sits inside A4
  above; see the owner settings action.
- **`tool results`** — 377,452 chars / 14.2% of appended chars (baseline), untouched by any
  of P0–P4. The planning-time estimate for this category (≈25.1%) was roughly 2× the
  measured value, in the same direction as the `skill_listing` planning estimate (≈16.0%
  planned vs 7.9% measured) — both estimates were probably not wrong so much as normalised
  against a smaller denominator (excluding UNATTRIBUTED and `attach: other`).

## What was and was not moved

| phase | status |
|---|---|
| P0 — instrument (`tools/context-attrib.mjs`) | shipped, merged |
| P0.5 — instrument repair (chars primary, envelope estimator, occupancy gate, D7 denominator) | shipped, merged |
| P1 — write firewall | **dropped as a phase** (D15) — premise retracted; residue folded into P4/S8a as discipline text, no savings claim |
| P2 — standing steers, `Next up:` two-site agreement, enforcer due-ness | shipped, merged |
| P3 — `SessionStart:compact` re-read directive | shipped, merged |
| P4 — measure, record, ship | in progress (this doc is part of it) |

**Measured but unaddressed by any phase:** the char-free prompt-growth mass (18.2–48.5% of
churn, quantified not explained), the mission's own machinery footprint (A5, 5.4% → 9.3%,
grew during the mission that measured it), and the owner's settings surface (A4, ≥80% of
the 372,114-char "free lever," minutes of settings work worth more than everything P0–P4
delivered combined).

## Caveats that attach to every figure in this document

- **n = 1 per corpus, throughout.** One transcript, one session, one operator, per corpus.
  Two n = 1 points (B and M) are not a trend.
- **The +28.0% occupancy gate FAIL stands** (final prompt 513,634 vs `/context` TOTAL
  401,400) **and was not re-evaluated in S7b** — no fresh `/context` reading existed for
  either corpus at measurement time.
- **A1 applies and is load-bearing:** a ~28% prompt-series inflation deflates every TOKEN
  share in this document by ~28%. The char columns (primary, counted) are untouched by A1
  but answer a different denominator and must never be read interchangeably with the token
  columns.
- **Input-side band transfer:** the chars/token band is measured on model-authored
  (assistant) output and applied to input-side categories (`attach:*`, tool results, human
  steers, `user:*`). Dense machine-generated content may tokenize below the band, so those
  rows may be **understated, not bounded above** — the band is a transferred assumption on
  those rows, not a direct measurement.
- **A6 stands unresolved:** ~34% of transcript records are excluded from the taxonomy with
  no counter, feeding the 35–60% (B) / 39–50% (M) UNATTRIBUTED residual.
- **A9's asymmetric-band reading trap stands:** on M, UNATTRIBUTED is 39.3–50.1% and
  char-free growth is 9.6–23.7% — both still multiples of every lever this mission owns.

## Tracked open items (must outlive the mission)

_Copied verbatim from `.plans/context-economy.state.md` → `## Tracked open items` so this
record survives the ledger going quiet. Opened at the 2026-08-03 replan; none of these is a
P4 session._

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

**In addition, and known but deliberately not fixed in S7b:** the instrument still prints
its `attach: other` over-statement warning ("likely OVER-stated") on every run — **A4
falsified this warning**; the fallback records are lean payload objects, not padded
metadata. Fixing the print statement would have put a source change inside a
no-source-change measurement session. **Flagged for `ckpt-p4`'s attention, not resolved
here.**

## D4b

`[~]` — cross-mission re-measurement on a later, comparable mission. Deferred,
non-blocking, tracked. It is **the only real confirmation** of anything this document
reports as a delta rather than a single-corpus observation; it does not exist yet and this
document does not simulate it.
