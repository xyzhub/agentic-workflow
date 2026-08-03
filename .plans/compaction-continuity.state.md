---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: compaction-continuity — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
before ending a session._

**OQ1, OQ4 and OQ6 RESOLVED 2026-08-03 by the human** — all three planner
recommendations accepted verbatim. **OQ2, OQ3, OQ5 and OQ7 stand on the planner's
recommendation** absent a ruling (the human was shown them and did not override);
any reviewer may challenge them at a checkpoint. **Execution is UNBLOCKED at S1.**

**⛔ NOT STARTED — planned 2026-08-03.** Nothing here has been
executed. This ledger becomes the newest-mtime file in `.plans/`, so the
thread-keeper and compact-resume hooks will name it as the active thread — that
is bookkeeping, not a claim that work is in flight. **The live thread until the
human answers the open questions is `.plans/context-economy.state.md` (PR #31,
open, unmerged).**

Gate policy: **batch** (L1, recorded at mission start) — each phase branch
`mission/compaction-continuity-p1…p4` merges into
**`mission/compaction-continuity-integration`** by the orchestrator on reviewer
APPROVE; **never the default branch**. The human merges the integration branch
**once**, at the end-of-mission confirmation. _The human may override to
`human-merge`._

**Surfacing under batch:** the human sees no merge prompts until the end.
Therefore **both `[STRICT]` verdicts (`ckpt-p1`, `ckpt-p2`) and any REQUEST
CHANGES must be pushed to the human the moment they land** — owner channel or
direct report — not held for the final PR.

**Base branch (OQ1, updated 2026-08-04):** every phase branches off **`main`**.
PR #31 merged 2026-08-03T19:51Z (`main` = `2c8487f`), so `hooks/lib/compact-resume.sh`
— the file this mission extends — is now on the default branch. Phases merge into
`mission/compaction-continuity-integration`; the final PR targets `main` directly,
with **no hold and no retarget**. _(Superseded: the original "base off
`mission/context-economy-integration`" existed only while #31 was open.)_

**Two standing rules, inherited by every session:** never `Read`/`cat`/`head`/`tail`
a `*.jsonl` (L10); nothing in this mission can be exercised live before merge +
reinstall (installed plugin cache `1.41.0`, repo `v1.42.0`) — the gate is
`tools/hook-test.mjs` dispatch against the working tree.

Plan: `.plans/compaction-continuity.md` · Briefs:
`.plans/compaction-continuity.sessions.md` · Brief:
`docs/product/decisions/2026-08-03-compaction-continuity-brief.md`

Next up: **S1** — harness fixtures in `tools/hook-test.mjs`, on
`mission/compaction-continuity-p1`, once the human has answered OQ1–OQ7.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [ ] S1 — harness fixtures: arbitrary files + a sized transcript in `runHook()` (branch `mission/compaction-continuity-p1`) — **Suits:** `backend`
- [ ] S2 — derive the byte thresholds from real transcripts; measurement only, no source change (branch `mission/compaction-continuity-p1`) — **Suits:** `backend`
- [ ] S3 — `hooks/lib/handoff-budget.sh` + `UserPromptSubmit` registration, named constants, four silencers (branch `mission/compaction-continuity-p1`) — **Suits:** `backend`
- [ ] S4 — atomic-ref docs for the trigger: §3 row, §4 reflexes, plugin README, `hooks.json` description (branch `mission/compaction-continuity-p1`) — **Suits:** `writer`
- [ ] Checkpoint `ckpt-p1` **[STRICT]** — phase 1 review + merge per gate policy; verdict surfaced immediately
- [ ] S5 — `compact-resume.sh` fallback: three branches, freshness stated in the directive (branch `mission/compaction-continuity-p2`) — **Suits:** `backend`
- [ ] S6 — handoff provenance stamp, conditional on OQ3; collapses into S5 if OQ3 is "no format change" (branch `mission/compaction-continuity-p2`) — **Suits:** `writer`
- [ ] S7 — atomic-ref docs for the fallback, incl. the now-false `hooks.json` silence claim (branch `mission/compaction-continuity-p2`) — **Suits:** `writer`
- [ ] Checkpoint `ckpt-p2` **[STRICT]** — phase 2 review + merge per gate policy; verdict surfaced immediately
- [ ] S8 — frequency lever: named `Read` advisory threshold + the §6.2 interactive paragraph, no savings claim (branch `mission/compaction-continuity-p3`) — **Suits:** `backend`
- [ ] S9 — phase-3 docs and the honest non-claim (branch `mission/compaction-continuity-p3`) — **Suits:** `writer`
- [ ] Checkpoint `ckpt-p3` — phase 3 review + merge per gate policy (routine, single-reviewer)
- [ ] S10 — the documentation-of-record pass: CHANGELOG, JOURNEY, status-page stamp (branch `mission/compaction-continuity-p4`) — **Suits:** `chronicler`
- [ ] S11 — the integration PR body; retarget per OQ1 (branch `mission/compaction-continuity-p4`) — **Suits:** `writer`
- [ ] Checkpoint `ckpt-p4` — end-of-mission review on the integration branch; human merges

## Open questions

_Mirrored from `.plans/compaction-continuity.md` with their recommendations.
**Execution does not start until all seven are answered.** Empty this section as
each is resolved, recording the answer and its date._

- **OQ1 — RESOLVED 2026-08-03, then SUPERSEDED 2026-08-04 by reality: base off `main`.**
  The original resolution (base off `mission/context-economy-integration`, hold the PR,
  retarget later) existed **only** because PR #31 was unmerged and `compact-resume.sh`
  was not on the default branch. **PR #31 MERGED 2026-08-03T19:51Z** (`main` = `2c8487f`;
  `compact-resume.sh` verified present). The dependency is gone: **every phase now
  branches off `main`, the integration branch is `mission/compaction-continuity-integration`,
  and the final PR targets `main` directly — no hold, no retarget.** The plan branch was
  rebased onto `main` and is a clean descendant. _Nothing about the decision's substance
  changed; its premise expired._
- **OQ2 — Byte thresholds and their evidence.** **Recommendation: derive in S2
  from the local transcript corpus** (compaction byte-point via `grep -n` +
  `awk … | wc -c`), ship two named bands (advisory ≈ 55%, urgent ≈ 80% of it);
  if the spread is too wide for one constant, take the conservative floor and say
  so in the doc row.
- **OQ3 — Does `session-handoff.md`'s format change?** **Recommendation: one
  provenance line** (`_Written: <ISO> · session <id> · branch <b>_`), no
  restructuring. If "no", S6 collapses into S5 (log the collapse as a deviation).
- **OQ4 — RESOLVED 2026-08-03 (human): four mechanical silencers.** One firing per
  band per session (`$TMPDIR` state keyed by `session_id`), at most two bands, silent
  when the handoff is already fresher than the crossing, silent when an active mission
  ledger exists — plus a ≤3-line cap. **If it still nags, raise the bands; do NOT add
  conditions.** Deterministic by design: the human must be able to predict exactly when
  it fires. Planner recommendation accepted verbatim.
- **OQ5 — What does "keeping it current" mean with no checkpoints?**
  **Recommendation: currency against the transcript, never the clock.** A handoff
  is current if written after the most recent band crossing; otherwise the
  directive labels it suspect and tells the agent to verify against
  `git log`/`git status` before trusting its **Next**.
- **OQ6 — RESOLVED 2026-08-03 (human): inject a distinct ≤6-line directive.** When
  there is neither a ledger nor a handoff (this repo's literal state today), name
  `git log -5`, `git status`, `.remember/now.md`, and instruct the agent to **tell the
  human the record is missing** rather than proceed on the summary. **Silence is the
  current bug**, and this is the case the owner is in most of the time. It must **not**
  instruct the agent to author a handoff on the spot — immediately after losing context
  is the worst moment to write state. Planner recommendation accepted verbatim.
- **OQ7 — Does the trigger fire during missions too?** **Recommendation: no —
  only when there is no active ledger.** Mission sessions already have the
  thread-keeper, the beat-enforcer and a working compact-resume; firing there adds
  machinery to the population that doesn't need it (the A5 mistake) and lets the
  trigger and the fallback share one `active ledger?` predicate.

## Standing steers

_Human steers, captured **verbatim** at checkpoints only (never mid-brief), in
the grammar `- YYYY-MM-DD (ckpt <id>) — "<exact words>"`. Retire by
~~strikethrough~~, never delete._

_(none yet — no checkpoint has run.)_

## Deviations

_Any departure from a brief — logged here the moment it happens, with why.
Deviating is allowed; deviating silently is not (§4)._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs. Newest on top; crash-safe by write-ahead._

- _2026-08-03 (planning, `planner`, branch `plan/interactive-handoff`): mission
  shaped and decomposed — feature brief
  (`docs/product/decisions/2026-08-03-compaction-continuity-brief.md`) plus this
  trio. Working name `interactive-handoff` renamed to `compaction-continuity`
  (only two of three pieces are a handoff, and `handoff` already names three other
  things in this repo). Four phases, eleven sessions, two `[STRICT]` checkpoints.
  Phasing enforces L2 — the fallback never ships before the trigger. Verified
  `node tools/lint.mjs` green. **Nothing executed; blocked on OQ1–OQ7.**_

Next up: **S1** — harness fixtures in `tools/hook-test.mjs`. **Blocked**: the
human must answer OQ1–OQ7 first, and OQ1 decides the base branch every phase
forks from.
