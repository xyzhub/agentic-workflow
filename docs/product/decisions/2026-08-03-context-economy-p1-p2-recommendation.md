---
status: frozen
owner-agent: architect
refresh-trigger: never
---

# venture-workflow — Decision memo: context-economy P1/P2 after the whole-mission audit

_Advisory only — the human decides. Inputs: `.plans/context-economy.state.md`
(the ⚠️ WHOLE-MISSION AUDIT A1–A10, the `ckpt-p2` findings F1–F6, D10–D14, and
the 📦 Phase 0.5 re-decision package), plus this memo's own repo measurements,
each labeled. Every number is either **[ledger]** (cited from the state file)
or **[measured here]** (this memo, 2026-08-03, command stated). Nothing is
re-derived from the transcript; it was never read._

## The questions

1. **P2** — built, reviewed REQUEST CHANGES (F1/F2 doc rows contradict hook
   behavior), unmerged. Fix and merge, merge as-is, or drop? Does F3 (the
   fail-open `Next up:` lint hole) ride in the same corrective session?
2. **P1** — savings claim already stripped by D13; the audit (A10) says drop it
   or re-point it at A4 (registry/definition injection, 14.0% of appended
   chars). Drop, ship as discipline, or re-point?

Downstream constraint: this choice fixes the shape of the remaining mission
(what P4 wraps and records) and whether a new engineering phase is opened on
the audit's say-so.

---

## Question 1 — P2

### Option 1A — Fix and merge, F3 folded in (one corrective session)

- **How it works here** — F1: reword the §3 row in both WORKFLOW mirrors so the
  silence list matches rule (ii)'s actual behavior (HELD included). F2: split
  the doc row shared with `beat-enforcer-pretooluse.sh` (still a bare
  `head -1` — **[ledger F2]** it live-nudged toward HELD P1 work this session).
  F5: one harness case pinning the non-candidate `- [ ] … HELD` row. Plus F3:
  `tools/lint.mjs:489-490` — **[measured here, code read]** a `Next up:` site
  whose beat wraps to the next line keys to `''`, is filtered, and
  `if (keyed.length < 2) continue;` silently skips the file. Fix = fail closed
  (an unkeyable site is a finding) or key across the wrap. ~20 lines in a file
  S5 just touched, existing mutation-proof pattern.
- **Tradeoffs** — one session closes the phase and the known hole in its own
  headline guard. F1/F2/F5 are doc + one case; F3 is the only code change.
- **Operational cost** — one session + `ckpt-p2` re-review.
- **Cost of reversal** — low. Doc rows and lint checks are severable; the
  enforcer change is contained to `hooks/lib/` with 31 harness cases. F3 itself
  is severable mid-session: drop and log if the session is at risk.

### Option 1B — Minimal corrective (F1+F2+F5), F3 deferred to P4

- **How it works here** — exactly the reviewer's required scope, one retry.
  F3 lands later (P4 or its own micro-session).
- **Tradeoffs** — smallest possible corrective, best survival odds (eight
  sessions have died on limits — **[ledger]**). But P2 merges with its
  `checkNextUpAgreement` guard carrying a hole shaped exactly like the drift it
  exists to catch, in a mission whose `Next up:` drifted three times
  (**[ledger D13]**), and F3 then needs its own review round.
- **Operational cost** — one session now + a later slot.
- **Cost of reversal** — same as 1A.

### Option 1C — Drop P2 (leave the branch unmerged)

- **How it works here** — abandon `mission/context-economy-p2`; F2's live
  defect (PreToolUse nudging toward unauthorized HELD work) persists, and the
  Stop backstop reverts to dead-behind-HELD (**[ledger ckpt-p3 [Med]]**).
- **Tradeoffs** — saves one session; forfeits reviewed, engineering-sound work
  (**[ledger ckpt-p2]**: "Engineering sound") that fixes live governance
  defects unrelated to the retracted 22.5% premise.
- **Cost of reversal** — reviving later means re-review from scratch.

### Recommendation — **1A: fix and merge, F3 in the same session, severable.**

P2 was never premised on the retracted savings number (D14: it is a fidelity
control), the defects it fixes are live today, and the corrective is small.
F3 belongs now because it is the same file, the same proof pattern, and the
same defect class the phase exists to close — deferring it ships a guard that
is known-blind to its own target. **Strongest case against:** session
mortality. D14 split S5/S5b precisely because smaller sessions survive, and
F3 adds code + mutations to an otherwise doc-only retry; F3 was also filed
"deferred to the human", so folding it in needs your explicit authorization
(this memo asks for it). Mitigation: F3 last, severable, logged if dropped.

---

## Question 2 — P1

### The A4 assessment (do this before believing any "re-point" option)

The audit sizes A4 at **372,114 chars = 14.0% of appended chars** vs P1's
Write/Edit **243,578 = 9.2%** **[ledger A4]** and calls it "this plugin's own
surface". **Measured here, that ownership claim is mostly wrong:**

| component | chars [ledger A4] | whose surface [measured here] |
|---|---|---|
| `skill_listing` | 208,338 (56%) | **User environment.** `~/.claude/skills` holds ~140 skills; this plugin ships exactly **one** (`skills/protocol/SKILL.md`, 2,874 bytes). |
| `deferred_tools_delta` | 79,463 (21%) | **User-level MCP config** (codegraph, firecrawl, context7 tool schemas). The plugin ships no MCP server. |
| `agent_listing_delta` | 58,194 (16%) | **Partly this repo.** The 20 agent `description:` lines total **9,875 chars** (`awk`/`wc` over `plugins/agentic-workflow/agents/*.md`); the rest of the 58k is harness framing, repeats, and non-plugin agents. (The audit says 13 subagent types; the repo has 20 agent files today — inference: version drift, immaterial.) |
| `mcp_instructions_delta` | 14,319 (4%) | **User-level MCP config.** |
| `invoked_skills` | 11,800 (3%) | Mixed, small. |

- **What actually reduces it:** pruning the user-level skill directory and
  disabling unused MCP servers for sessions in this repo — a **settings
  change, minutes, zero engineering, outside this repo's code**. The only
  in-repo engineering lever is trimming the 9,875 chars of agent descriptions
  — upper-bounded at well under 58k, i.e. ~2% of appended chars at best
  (inference from the table). The injection mechanism itself (whether/when
  listings are injected) is the harness's, not ours.
- **Is it measurable with the existing instrument?** Partially.
  `attach: skill_listing` is a named category (`context-attrib.mjs:110`) —
  directly measurable. The other three kinds fall through the fallback at
  `:197-199` into `attach: other` **[measured here, code read]** — visible
  only in aggregate. Naming them is a ~3-line additive change to the `add()`
  chain, which belongs in P4/S7. Any before/after also needs a **new
  transcript** — n=1 stands **[ledger, audit "NOT verified"]**, and OQ5's
  comparability caveat applies.

**Plainly: A4 is real, but ≥ ~80% of it is the user's settings surface and the
harness's injection mechanics, not this plugin's code. It cannot carry an
engineering phase in this repo.**

### Option 2A — Drop P1 as a phase; fold the residue into P4

- **How it works here** — record P1 DROPPED (dated decision pointing at this
  memo). Its residue moves into P4's re-brief as three small items:
  (i) the discipline lines (orchestrator authors only the ledger and edits
  ≲15 lines; longer documents go to subagents and return as paths) land as doc
  text in the orchestrator guidance — no phase, no gate, per audit A10
  ("pure contract hygiene — does not need a phase"); (ii) the ~3-line
  instrument extension naming the three A4 delta kinds; (iii) an A5 measurement
  of the mission's own hooks (**[ledger A5]** 143,689 chars = 5.4%, top-5,
  unmeasured — P3 shipped another injecting hook). A4's real reduction is
  handed to you as a **settings action**, outside the mission.
- **Tradeoffs** — honest about every measured number: Write/Edit is 4.40–7.18%
  token **[ledger 📦 §3]**, and A1's ~28% share deflation (**[ledger A1]** —
  the numerator/denominator are orthogonal post-repair, so the gate FAIL DOES
  bound shares) pushes that toward ~3.2–5.2% (inference: uniform 28% haircut).
  A phase cannot be justified on that. Cost: the discipline is unenforced text.
- **Operational cost** — near zero; P4 grows by three small, in-scope items.
- **Cost of reversal** — trivial. If D4b's second transcript ever shows
  orchestrator authorship is material, P1 can be opened then, premise intact.

### Option 2B — Ship P1 as its own discipline phase (D13 as written)

- **How it works here** — S4 + `ckpt-p1` run as a docs/contract phase, no
  savings claim, plus OQ3's one-line chronicler contract addition.
- **Tradeoffs** — a full session + review + merge for text whose measurable
  effect (50% of 4.4–7.2% = 2–3.6%) is inside the instrument's own uncertainty
  band **[ledger D13]** — unverifiable by the mission's own math, and worse
  under A1's deflation. Buys a reviewer gate over the discipline text.
- **Cost of reversal** — the session budget is spent either way; the text
  itself is as reversible as 2A's.

### Option 2C — Re-point P1 at A4

- **How it works here** — it mostly doesn't. Per the assessment above, the
  surface is ~80% user settings + harness mechanics. An in-repo phase could
  only trim ~9.9k chars of agent descriptions and rename instrument
  categories — the latter is already 2A's item (ii).
- **Tradeoffs** — chases the audit's biggest number into someone else's yard;
  the measurable in-repo yield is bounded near ~2% of appended chars
  (inference). **Not a real option; listed because the audit proposed it.**
- **Cost of reversal** — n/a; do not enter.

### Recommendation — **2A: drop P1 as a phase; residue into P4; A4 becomes a settings action, not a mission phase.**

Every successive measurement has shrunk P1's territory (22.5% claimed → 9.2%
char → 4.4–7.2% token → ~3.2–5.2% after A1's deflation — first three
**[ledger]**, last inference), and A4 — the one bigger lever — is not this
repo's code to engineer. **Strongest case against:** discipline without
enforcement rots — 2A ships contract text no gate ever re-checks, and the 📦
package itself (§5) warned Write/Edit is "no longer a rounding error" and a
genuinely closer call; a fastidious owner could defensibly pick 2B to get one
reviewer pass over the exact contract wording. I would not: the wording can be
reviewed inside `ckpt-p4` at no extra session cost.

---

## What would change the answer

- **Q1:** a second corrective-session death on limits → fall back to 1B
  scope immediately (F1+F2+F5 only, F3 logged for P4).
- **Q2:** a D4b second transcript (comparable mission, post-settings-prune)
  showing orchestrator Write/Edit ≥ ~15% of churn tokens, or the occupancy
  gate passing so absolute claims unlock — either reopens P1 as a measured
  phase. Conversely, if the settings prune plus re-measure shows
  `skill_listing` collapsing, that confirms A4 was environment, closing 2C
  permanently.

## What I'd do next (if both accepted)

1. **P2 corrective session** (F1+F2+F5, then F3, severable) → `ckpt-p2`
   re-review → merge to integration.
2. **Record P1 DROPPED** (dated, pointing here); planner re-brief for **P4**
   folding in: the discipline lines, the 3-line attach-kind naming, the A5
   hook-footprint measurement, and the A1 ~28% deflation caveat stamped on
   every share the metrics doc publishes.
3. **Settings action (you, outside the mission):** prune `~/.claude/skills`
   and unused MCP servers for work in this repo — the largest single lever
   found anywhere in this mission, and it costs minutes.
4. **P4 (S7+S8)** → `ckpt-p4` → your single integration merge. D4b's second
   transcript comes from the next comparable mission, post-prune.

---
_The architect consults; the **human decides**. The choice lands as a dated
locked decision in `.plans/context-economy.state.md` pointing at this memo.
The `advisor` may argue against it at its gate — this memo is its input, not
its rival._
