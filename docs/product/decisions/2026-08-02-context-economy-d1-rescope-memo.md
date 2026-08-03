# agentic-workflow — Decision memo: context-economy D1 re-scope

_A shape-before-build decision, digested so the human chooses between options instead of
doing the analysis. Authored by the `architect` (WORKFLOW.md §6). Mission:
`context-economy`, at the ⛔ D1 hard pause. Labels: **fact** (measured or cited) /
**inference** (my reasoning) / **assumption** (unverified). Decisions 1 and 3 are answered
here; **D7 (decision 2) is assessed, not ruled on** — it is the human's._

---

## 0. Empirical results first — they settle Decision 1

I re-ran the measurement from a **scratch copy** in my scratchpad. `tools/context-attrib.mjs`
is untouched. My probe reproduces the committed script's `TOTAL = 2,108,485`
**exactly**, so its other outputs are comparable to the ledger's.

**M1 — "20 `isCompactSummary` records" is wrong. There was exactly 1 compaction.** (fact)
`grep -c isCompactSummary` returns **20 lines**; `grep -c '"isCompactSummary":true'` returns
**1**; `":false"` returns **0**. The other 19 are the *string* appearing inside content —
this mission's own ledger and brief mention the field by name and were written through
`Write` inputs during the session. The 20 is a self-referential grep artefact. The standing
hypothesis was built on it and must be restated: the ratchet is real, but it is driven by
**five** prompt collapses, of which **one** is a compaction.

**M2 — the five collapses.** (fact)

| # | req idx | line | before | after | drop | what it is |
|---|---|---|---|---|---|---|
| 1 | 236 | 1,829 | 755,030 | 751,924 | 3,106 | noise |
| 2 | 240 | 1,873 | 778,267 | 776,489 | 1,778 | noise |
| 3 | 309 | 2,569 | **999,816** | 82,009 | **917,807** | **the one real compaction** |
| 4 | 550 | 4,222 | 667,952 | 397,241 | 270,711 | no compact summary — unexplained |
| 5 | 552 | 4,253 | 401,449 | **0** | 401,449 | **degenerate record: prompt = 0** |

**M3 — exact identity.** Σ positive deltas (2,108,485) − Σ negative deltas (1,594,851) =
**513,634** = the final prompt, to the token. (fact) So the churn/occupancy ratchet is
exactly **4.105×**.

**M4 — the structural confirmation.** The prompt series **peaks at 999,816 immediately
before collapse #3**, against the **1,000,000-token window** the brief's `/context` capture
records (`401.4k / 1M`, `2026-08-01-orchestrator-context-economy-brief.md:18`). A series
that rises to 0.02% of the window limit and then collapses is a real occupancy curve.
(fact + inference) **`promptOf` is not inflated. Only the aggregation asks a different
question.**

**M5 — the 5.59× reconciles with no residual.** (fact)

```
2,108,485 (churn TOTAL) ÷ 513,634 (final occupancy)  = 4.105×   ← the ratchet
  513,634 ÷ 401,400 (/context TOTAL)                 = 1.280×   ← session grew after the reading
                                              product = 5.253×
  513,634 ÷ 377,400 (/context *Messages* sub-total)  = 1.361×
                                4.105 × 1.361        = 5.587×   ← the ledger's 5.59×, exactly
```

**The unexplained ~1.9× is gone.** The reviewer's `2.9 × 1.9` decomposition was derived from
the chars/token story, which is a *separate* phenomenon (see M6) and was never a valid
estimator of the TOTAL gap. The correct decomposition is `4.105 × 1.361`, and it closes.
Note also that the ledger compared against `/context`'s **Messages** sub-total (377.4k) while
the prompt series includes the 26.8k of skills/agents/system/memory that `/context` breaks
out separately — a normalisation slip that inflated the reported divergence from 5.25× to
5.59×. That is Decision 3 biting the validity finding itself.

**Occupancy vs the gate:** occupancy at the planning-time file size (line 4,438) is
**469,142** = **+16.9%** vs the 401.4k `/context` total — just outside the 15% gate, and
**one order of magnitude** closer than churn's +425%. The trajectory also passes through
401.4k (nearest point 401,449, request 551) — but 106 of 596 requests sit within ±15% of
that value, so treat the near-exact hit as *consistency*, not proof. (fact + inference)

**M6 — the 1.25 chars/token anomaly is NOT the ratchet.** (fact) Within collapse-free
segments the prompt grows monotonically and no re-accumulation is possible, yet the ratio
stays low: **1.29** (seg 0, 236 reqs), **1.50** (seg 2, 69 reqs), **1.66** (seg 3, 241 reqs).
So the ratio measures something real: prompt growth that carries **no persisted characters**.
At an assumed true 3.2–4.2 chars/token for this mixed markdown/JSON corpus (**assumption**),
**56–66% of prompt growth is character-free** in the clean segments — landing on the plan's
independently-estimated 61–66% unpersisted-thinking figure (`brief.md:97`). One signal plus
one consistency check, **not two witnesses**.

**M7 — the residual is ~67–75%, not the printed 16.1%.** (inference from M6) The script
converts category chars to tokens with the *global* 1.245 ratio, which is depressed ~3× by
the char-free mass. Converting the 2,202,228 named-category chars at 3.2 / 3.75 / 4.2
instead gives attributed = 688k / 587k / 524k tokens against a 2,108,485 total →
**UNATTRIBUTED = 67.4% / 72.1% / 75.1%**. **Every named category's *token* column is ~3× too
high.** The largest consumer of this repo's context window is unpersisted model reasoning,
and no phase of this mission touches it.

**M8 — the three denominators, measured.** (fact; char shares)

| denominator | base chars | skill_listing | tool results | Write/Edit | subagent ret. | reviewer |
|---|---|---|---|---|---|---|
| ALL (9 named + residual) | 2,659,518 | 7.8% | 14.2% | 9.2% | 15.1% | **4.00%** |
| MID (9 named, residual out) | 2,202,228 | 9.5% | 17.1% | 11.1% | 18.2% | **4.83%** |
| NARROW (7 non-attach) | 1,536,639 | 13.6% | 24.6% | 15.9% | 26.1% | **6.91%** |
| planning-time estimate | — | 16.0% | 25.1% | **22.5%** | 0.4% | — |

**The ledger's "not wrong, just differently normalised" holds for the two out-of-scope terms
and fails for the in-scope one.** NARROW reproduces `tool results` (24.6 vs 25.1) and roughly
`skill_listing` (13.6 vs 16.0), but Write/Edit is **15.9% vs the claimed 22.5%** even under
the most generous denominator. The write-firewall target really did shrink, by ~30%.

**M9 — the token domain.** Share of the 2,049,094 tokens of prompt growth, at 3.2 / 3.75 /
4.2 chars/token: (inference)

| category | token-domain share of prompt growth |
|---|---|
| authored: Write/Edit inputs | **3.71% / 3.17% / 2.83%** |
| `reviewer` returns | **1.62% / 1.38% / 1.23%** |

Per collapse-free segment, Write/Edit as a share of that segment's own growth: 3.66% (seg 0),
2.61% (seg 2), 4.69% (seg 3). (fact, modulo the ratio assumption)

**M10 — churn and occupancy rank the levers differently.** (fact; final-segment sample is
44 requests, so directional only) Whole-session vs post-last-collapse char share: human
steers 2.9 → 19.7 · subagent returns 15.1 → 2.0 · tool results 14.2 → 4.4 · Write/Edit
9.2 → 8.4 · **skill_listing 7.8 → 11.3** · residual 17.2 → 33.0. **`skill_listing` is the
only category whose share rises under an occupancy view** — it is re-injected and
permanently resident, so compaction never clears it. Transient categories (subagent returns,
tool results) collapse away.

---

## 1. Decision 1 — churn or occupancy?

**The question.** Which quantity should the mission optimise, and therefore which should the
instrument headline? It constrains P4's D4a re-measurement (a before/after against the wrong
quantity is unfalsifiable), the metrics doc, and how every lever is ranked.

### Option A — Occupancy primary
- **How it works here** — the per-request prompt is already computed at
  `tools/context-attrib.mjs:150`; report `max prompt` / `final prompt` instead of the sum at
  `:213`. The `/context` sanity check then passes to within ~17%.
- **Tradeoffs** — matches `/context` and matches the brief's stated pain (auto-compaction).
  But the **category split cannot be made occupancy-native**: compaction discards content
  the JSONL still contains, and the resident set is not reconstructible from the transcript.
  You would headline an occupancy number over a churn-domain split — the mismatch that
  produced this pause. And with **n=1 compaction in 596 requests** (M1), occupancy pressure
  is not yet a *measured* problem in this repo.
- **Operational cost** — cheap to compute, expensive to interpret: every share needs a caveat.
- **Cost of reversal** — cheap; both quantities come from one pass.

### Option B — Churn primary; occupancy reported alongside as the `/context` comparator ✅
- **How it works here** — keep `TOTAL = Σ max(0, δ)`, and from the same pass also emit
  `final prompt`, `max prompt`, `Σ collapse mass`, and the M2 collapse table. **Point the
  15%-divergence sanity check at max/final prompt vs `/context`, not at TOTAL.** That single
  re-targeting converts today's failing validity gate into a passing one without changing the
  number the mission optimises.
- **Tradeoffs** — churn is the stable session aggregate; it is what the token bill and rate
  limits reflect; and it is what the mission's levers actually move (content kept out of the
  orchestrator is absent from *every* subsequent request until the next collapse). Against:
  churn over-weights whatever sits longest, and it is currently contaminated by collapse #5.
- **Operational cost** — ~a dozen lines; no new model, no new dependency.
- **Cost of reversal** — the cheapest of the three: everything Option A needs is already
  emitted, so switching later is a labelling change.

### Option C — Both, co-equal, no primary
- Honest and undecidable. D4a's before/after needs **one** number to move. This is what
  happens by default if nobody chooses, and it is why the pause exists.

### Recommendation — **Option B**, with three conditions

1. **Guard the zero-prompt record before any re-measurement.** Collapse #5 treats a
   `prompt == 0` usage record as a collapse to empty and then re-accumulates **513,634
   tokens = 24.4% of TOTAL** of phantom churn. Fail-closed by shape: *a request with no usage
   data is not a request with an empty context* — skip it, do not delta against it.
2. **Retire the global chars/token ratio as a token converter.** It is measuring the
   char-free mass (M6), not a property of text. Either report the split in **chars only**
   (model-free, which is already what the ledger tells readers to prefer) or convert per
   category at a literature ratio and print the char-free residual as its own explicit line
   (M7). Keeping the current conversion means shipping token columns that are ~3× too high.
3. **Record both numbers in the baseline artifact now.** The transcript is append-only and
   already grew once mid-mission (4,438 → 4,612 lines); a later re-normalisation cannot
   re-run against the same corpus. Writing both is the additive, non-lossy move.

**The strongest case against B.** The brief's problem statement is *"auto-compacts on long
sessions, losing fidelity"* — that is an occupancy complaint, and optimising churn does not
directly reduce compaction frequency. My answer: it does, monotonically — tokens removed from
a window are absent from that window until the next collapse; churn and occupancy differ only
in how they treat the collapses themselves. And the fidelity half of that complaint has a
control that was never a cost control: P3's `SessionStart:compact` re-read directive. Still,
if the human's felt pain is *"it compacted again"* rather than *"this is expensive"*, Option A
is the honest choice and I would not argue hard against it.

---

## 2. Decision 3 — which denominator, and does the value proposition survive?

**The question.** The headline "**~25% addressed, 10–15% realistic capture**"
(`.plans/context-economy.md:252-256`) rests on a denominator that was never stated. Which one,
and what does the claim become?

### Option A — NARROW (7 non-attach, non-residual categories)
- **How it works here** — base 1,536,639 chars. Write/Edit 15.9%, skill_listing 13.6%,
  tool results 24.6%. Best reconciliation with planning-time.
- **Tradeoffs** — it is **a denominator you do not pay for**. It excludes the attachments
  (real injected tokens) and the residual (the *largest* real consumer, M7). Claiming "we
  address 16% of consumption" against a base that omits 67–75% of consumption is the same
  error that produced this discrepancy. And it does not rescue the in-scope term anyway
  (15.9% vs 22.5%, M8).
- **Cost of reversal** — cheap on paper, expensive in trust: a headline restated downward
  twice is a headline nobody believes the third time.

### Option B — ALL chars (9 named + residual) — the instrument's current output
- **How it works here** — base 2,659,518 chars. Write/Edit 9.2%, skill_listing 7.8%.
- **Tradeoffs** — honest *within the char domain* and model-free. But chars are not tokens,
  and the char domain silently omits the char-free mass entirely: its "residual" line counts
  only *char-bearing* residual, so it understates the true residual by ~4×.
- **Cost of reversal** — cheap; it is what the script already prints.

### Option C — TOKEN domain, against total prompt growth ✅
- **How it works here** — base 2,049,094 tokens of prompt growth. Write/Edit **2.8–3.7%**,
  reviewer **1.2–1.6%**, char-free residual **67–75%** (M7, M9).
- **Tradeoffs** — the context window is denominated in tokens, the bill is denominated in
  tokens, and both the **15% validity gate** and the **3% D7 trigger** are implicitly token
  statements. This is the only denominator in which the mission's claims are commensurable
  with `/context`. Against: it needs an *assumed* 3.2–4.2 chars/token, so every figure carries
  a band. I regard a banded figure in the right unit as strictly better than a precise figure
  in the wrong one — and I am aware the band is the load-bearing weakness of this memo.
- **Cost of reversal** — cheap and, better, *testable*: running a real tokenizer over one
  segment's category strings would collapse the band to a point.

### Recommendation — **Option C**, and the value proposition does not survive on cost

| denominator | "addresses …" | "realistic capture" (plan's own 40–60%) | on the 401.4k baseline |
|---|---|---|---|
| as claimed | ~25% | 10–15% | 40–55k tok |
| NARROW (A) | ~16% | 6–10% | 24–40k tok |
| ALL chars (B) | ~9% | 4–6% | 16–24k tok |
| **TOKEN (C)** | **~4%** | **~1.5–2.5%** | **~6–10k tok** |

**Stated plainly: the write firewall's cost case is dead.** Under the recommended
normalisation it buys ~1.5–2.5% — a rounding error against a single compaction, for a phase
of contract engineering. Under the *most generous* denominator it is still less than half the
advertised claim.

**What survives, and it is not nothing:**
- **S1's doc-defect fix** — already shipped and merged; the brief always justified it on
  truthfulness alone (`brief.md:109`), independent of token math. Untouched.
- **P3's compact re-read directive** — a **correctness** control, not a cost control. M1/M2
  confirm exactly one compaction occurred in a 596-request session; the value is that *that
  one* does not lose the ledger. Its justification never depended on these numbers.
- **P2's standing steers** — a fidelity control, same reasoning.
- **The free lever now beats the mission's own headline.** `skill_listing` is 7.8% of appended
  chars, 13.6% under NARROW, and the **only** category whose share *rises* under an occupancy
  view (7.8 → 11.3%, M10) because it is re-injected and never compacted away. Zero
  engineering. It is currently out of scope (`.plans/context-economy.md:243`).

My honest reading is that P1 should be re-scoped from *the mission's headline* to *contract
hygiene worth doing because it is nearly free*, and that the skills trim should be pulled to
the front. **That is a scope call, and it is the human's, not mine.**

---

## 3. Decision 2 (D7) — assessed, not decided

Reviewer return share by view (fact; token rows carry M6's assumption):

| view | reviewer share | vs the 3% trigger |
|---|---|---|
| char, ALL denominator (the ledger's figure) | **4.00%** | fires |
| char, MID denominator | 4.83% | fires |
| char, NARROW denominator | 6.91% | fires |
| char, per collapse-free segment | 2.87% · 6.49% · 6.02% | fires in 2 of 3 |
| **token, share of prompt growth** | **1.23–1.62%** | **does not fire** |

**Answer to the question asked: the 4.0% is robust to Decision 1, and is *not* robust to
Decision 3.** Churn and occupancy weight categories **identically within the char domain** —
they differ in *which windows count*, not in how categories are weighted — so a session-average
share is near-invariant between them (4.00% session-wide; 2.9–6.5% per resident window,
straddling and centred near it). What defeats the trigger is the **unit**: in tokens, reviewer
returns are 1.2–1.6% of prompt growth, because the char domain omits the 67–75% char-free mass
and thereby inflates every text category ~3× (M7).

Since the 3% threshold was written about *context consumption*, and context is denominated in
tokens, **my read is that the D7 reopen is a normalisation artefact and does not survive under
my recommended Option C.** It survives under Options A and B.

This converges with the reviewer's standing read from an independent direction. The reviewer's
position is that a cost figure cannot defeat a structural safety guarantee — `reviewer.md:4`
grants no `Write`, `reviewer.md:96` is fail-closed *by shape*, and no hook can restore it
because `PreToolUse` carries no agent identity (`brief.md:105`). I add only this: **the cost
figure does not clear its own bar once stated in the unit the bar was written in.** Trading the
fleet's only fail-closed-by-shape guarantee for 1.2–1.6% is a visibly worse trade than the
4.0% framing made it look. **The ruling is the human's.**

---

## 4. What would change the answer

- **Decision 1 → Option A** if a re-measurement records **≥3 compactions in one mission
  session** (already D8's promotion trigger, `brief.md:106`), or if the human's operative pain
  is compaction *frequency* rather than spend.
- **Decision 3 → a char denominator** if the char-free fraction turns out to be small. This is
  cheaply falsifiable: run a real tokenizer over one collapse-free segment's category strings.
  If attributed tokens exceed ~50% of that segment's prompt growth, M6/M7 are wrong and the
  char-domain shares stand. **I did not run this** — it needs a tokenizer dependency that the
  zero-dep script deliberately avoids, and adding one is a decision, not a measurement.
- **D7 genuinely reopens** if a token-domain measurement puts reviewer returns above 3% of
  prompt growth.
- **All of the above rests on n = 1 transcript.** D4b's cross-mission re-measurement
  (`.plans/context-economy.state.md:46`) remains the only real confirmation.

## 5. Open, unresolved — flagged, not fixed

1. **The 3.2–4.2 chars/token band** is the load-bearing assumption behind M7, M9 and both
   recommendations. Unverified; a tokenizer settles it.
2. **Collapse #4** (line 4,222, −270,711 tokens) has no compact-summary record and no
   explanation. Possibly automatic context editing. Unexplained.
3. **Collapse #5's zero-prompt record** — I measured its arithmetic only; I did not inspect the
   record (transcript rule). Whether it is an aborted request, a resume boundary, or a client
   artefact is unknown.
4. **`attach: other` (12.9%) remains unvalidated.** The S3 attachment-schema finding stands
   untouched: 77 records / 307,136 chars = 89% of the category were sized by fallback
   (`.plans/context-economy.state.md:320-328`). Nothing I did addresses it.
5. **The ledger's "20 `isCompactSummary` records" (`state.md:214`) is a factual error** and
   should be corrected to 1 when the ledger is next written. I did not edit it.

---

_The architect consults; the **human decides**. The choice lands as a dated locked decision in
`.plans/context-economy.md` / the mission ledger, pointing at this memo. The `advisor` may
argue against it at its gate — this memo is the advisor's input, not its rival._

_Method note: every figure labelled **fact** was produced this session by a scratch probe in
the session scratchpad that reproduces `tools/context-attrib.mjs`'s `TOTAL = 2,108,485`
exactly. **`tools/context-attrib.mjs` was not modified**, and no phase plan was changed._
