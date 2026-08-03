## context-economy: measure, record, ship (v1.42.0)

**This mission did not find what it went looking for, and that is the headline
result — not the feature list below.**

### The bad news first

- The founding premise — orchestrator `Write`/`Edit` = **22.5%** of context —
  is **RETRACTED**. Measured on the baseline transcript: **9.16% of appended
  chars** (243,578 / 2,659,518 chars), banded **4.40–7.18% of churn tokens**.
- Headline result: **~4.4–7.2% of context addressed / ~1.8–4.3% captured**,
  against a founding claim of **~25% addressed / 10–15% captured**.
- **Phase 1 (the write firewall) was DROPPED, not deferred** (D15). Only its
  discipline survives — shipped as WORKFLOW §6.2 "Bounded writes" contract
  text, with **no savings claim attached**.
- The measurement instrument itself (`tools/context-attrib.mjs`) was **repaired
  twice** during this mission. Review caught what its own selftest suite could
  not: a calibration unit inversion, two inert guards, a namespace-blind
  lookup, a comment contradicting its own code, an instrument printing a
  governance decision in its own voice (A2), and a governance threshold pinned
  by zero test cases (A3, the D7 3% trigger — a single mutation, `> 3` →
  `> 1`, produced a self-contradicting verdict with every gate green before it
  was fixed).
- **The single biggest real lever this mission found is outside this repo.**
  ≥ ~80% of the 372,114-char "free lever" mass (A4) is the *owner's own*
  `~/.claude/skills` directory (~140 skills, 208,338 chars) and personal MCP
  configuration (~93k chars) — this plugin itself ships one 2,874-byte skill.
  Pruning that is a **settings action for the human, minutes, not
  engineering**, and it dwarfs everything P0–P4 delivered combined.
- **The mission's own machinery grew while it ran.** The hook-footprint
  measurement (A5: `hook_success` + `hook_additional_context` +
  `task_reminder`) went **5.4% → 9.3%** of appended chars between the baseline
  transcript and this mission's own transcript — Phase 3 shipped another
  injecting hook (`hooks/lib/compact-resume.sh`) without measuring its own
  footprint contribution.
- **n = 1 throughout the entire mission.** One transcript per corpus, one
  session, one operator, no variance estimate anywhere in this record. D4b
  (cross-mission re-measurement) is the only real confirmation of any of the
  above, and it needs a second, comparable transcript that does not exist yet
  — it stays `[~]` in the ledger, deliberately never `[x]`.

Full derivation, all ten audit findings (A1–A10), and every caveat:
`docs/product/engineering/context-economy-metrics.md`.

### What shipped and is worth having

- **`tools/context-attrib.mjs`** — a streaming, zero-dependency
  context-attribution instrument (readline-based, no transcript ever fully
  loaded) with a fail-closed CI gate, `--selftest` at **54 cases**
  (mutation-proven). Chars are the primary, counted metric; every token figure
  is derived through a zero-dep output-side envelope estimator and reported as
  a band, never a point value.
- **`hooks/lib/compact-resume.sh`** — a `SessionStart:compact`-matched
  re-read directive. This is a **correctness fix**, not a cost lever: this
  mission's own window collapsed 999,816 → 82,009 chars in one compaction step
  with nothing telling the resuming agent to re-read the ledger. Now it does.
- **Standing steers** — human decisions captured verbatim in the ledger
  template, retired by strikethrough, never deleted — plus two new ledger-
  integrity lint checks (`checkStandingSteers`, `checkNextUpAgreement`, the
  latter closing a `Next up:` two-site drift that had bitten this mission's
  own ledger three times).
- **Beat-enforcer due-ness fix** — the `Stop` backstop now scans for the
  first genuinely *due* beat instead of giving up at the first HELD/parked
  row it meets (the `PreToolUse` enforcer does not yet carry this fix — see
  tracked open items).
- **Corrected documentation** that had falsely claimed `/loop` gives each
  tick fresh context — 12 sites fixed, this mission's opening session (S1).
- **WORKFLOW §6.2 "Bounded writes"** contract text (both WORKFLOW mirrors,
  byte-identical) plus the OQ3 PR-body line in `agents/chronicler.md` — the
  origin of this very document. No savings number attached to either.

### Tracked open items (survive this PR; none is blocking)

| item | owner |
|---|---|
| `PreToolUse` due-ness port — `beat-enforcer-pretooluse.sh` still nudges the first `[ ]` candidate, not the first *due* one | future session |
| F4 — `tools/lint.mjs` id-existence fallback matches `(ckpt s5)` / `(ckpt 2)` against real checkpoint ids too loosely | future session |
| `plugins/agentic-workflow/README.md:199-202` — describes one merged enforcer; true of `Stop` only until the port lands | future session |
| Collapse #4 — req #551, transcript line 4,222, −270,711 tok with no adjacent compact summary, unexplained | future session |
| The +28% occupancy-gate residual (513,634 vs `/context` TOTAL 401,400) — unresolved whether it's the instrument or the comparator | human / future session |
| D4b — cross-mission re-measurement, the only real confirmation; needs a second transcript that doesn't exist | future mission |
| Owner settings action (A4) — prune `~/.claude/skills` (~140 skills) and unused MCP servers; minutes, outside this repo, the largest lever found | **the human** |
| Status-page lifecycle rail (`data:stages`) and pillars (`data:pillars`) — unchanged since 2026-07-08, rewrite deliberately deferred out of this mission | future editorial pass |
| The instrument's own `attach: other` "likely OVER-stated" warning — A4 falsified this; the print statement was left uncorrected deliberately, to keep this a no-source-change measurement session | future session |

### Status

Version: **v1.42.0**. This PR merges `mission/context-economy-integration`
into `main`. Batch gate policy held throughout — every phase branch merged
into the integration branch on reviewer APPROVE; **`main` has been untouched
by this mission until this PR**. The human merges once.
