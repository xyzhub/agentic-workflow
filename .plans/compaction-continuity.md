---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: compaction-continuity — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope was settled before this file existed — the planner decomposes, it does not
re-decide._

_Shaped 2026-08-03 · brief: `docs/product/decisions/2026-08-03-compaction-continuity-brief.md`
· ledger: `.plans/compaction-continuity.state.md` · briefs:
`.plans/compaction-continuity.sessions.md`_

_Working name at shaping time: **interactive-handoff**. Renamed because only two
of the three pieces are a handoff, and `handoff` already names three other things
in this repo (`/agentic-workflow:handoff`, `templates/session-handoff.md`, the ledger's
`## Handoff log`) — a mission ledger containing both would be grep-hostile._

Goal: make auto-compaction a **clean handoff for interactive, non-mission work**,
so a weeks-long session survives compaction without fidelity loss and the owner
never has to end a session.

## Tasks

1. **Harness fixtures for file + transcript state** — `tools/hook-test.mjs`'s
   `runHook()` can only stage `.plans/*.state.md` ledgers (`:37-62`). Both new
   behaviors need arbitrary files at controlled mtimes (`docs/product/session-handoff.md`)
   and a transcript of controlled size referenced by `transcript_path`.
   Acceptance: `runHook({ files, transcript })` stages both; all 33 pre-existing
   cases still pass unchanged; at least one case proves each new fixture knob
   actually reaches the hook process (a fixture that stages nothing would make
   every later case vacuously green).

2. **Derive the byte thresholds from evidence** — measurement only, no source
   change. Acceptance: the transcript-byte figure at which compaction actually
   fired is derived from real transcripts (`grep -n` for the compact marker →
   `awk 'NR<=n' | wc -c`; **never** `Read`/`cat`/`head`/`tail` on a `*.jsonl`),
   recorded in the ledger's measurement block with its method, its corpus size,
   and its `n`; and a two-band recommendation (advisory / urgent) falls out of
   it with the derivation written down.

3. **The write trigger (budget hook)** — a new `hooks/lib/handoff-budget.sh` on
   `UserPromptSubmit` that sizes `wc -c "$transcript_path"` against the derived
   bands and injects a ≤3-line advisory to write/refresh
   `docs/product/session-handoff.md` before compaction takes the window.
   Acceptance: nudges once per band per session and never again (state keyed by
   `session_id`); silent below the first band; silent when an active mission
   ledger exists (OQ7); silent when the handoff was written *after* the band was
   crossed; silent when `transcript_path` is absent, empty or unreadable; exit 0
   on every path. Thresholds are **named constants** with cases pinning both
   directions — never bare literals (the A3 lesson). Mutation-proved in both
   states with an anti-inert control.

4. **Atomic-ref documentation for the trigger** — the §3 guardrail row, the §4
   context-discipline paragraph, the `hooks.json` `description`, and the plugin
   README's governance-reflex paragraph all change in the **same commit** as the
   hook. Acceptance: both `WORKFLOW.md` mirrors are byte-identical outside
   `docs/WORKFLOW.md` line 3; every claim in the new prose is one a harness case
   dispatches (no claim verified by reading).

5. **The fallback** — `compact-resume.sh` stops going silent when there is no
   active mission ledger. Acceptance: with no `.plans/`, an empty `.plans/`, or
   an all-done ledger, and a `docs/product/session-handoff.md` present, it
   injects a directive naming that file **and stating its freshness**; the
   existing ledger-present behavior is byte-for-byte unchanged (all seven current
   `SessionStart` cases still pass); the directive stays ≤6 lines in every branch;
   `jq -n --arg` still escapes every interpolated value; exit 0 always.

6. **The no-handoff branch** — what fires when there is neither a ledger nor a
   handoff (the literal state of this repo today). Acceptance: per OQ6's resolved
   answer, either a distinct ≤6-line directive or documented silence, pinned by a
   case either way, and the `hooks.json` description says which.

7. **Handoff provenance line** (conditional on OQ3) — `templates/session-handoff.md`
   gains a one-line `_Written: <ISO> · session <id> · branch <b>_` stamp so the
   fallback can state freshness and `/agentic-workflow:handoff` writes it. Acceptance:
   template frontmatter still passes `checkTemplateFrontmatter`; `handoff.md`
   instructs the stamp; the fallback reads it (or falls back to mtime) with a
   case for each path.

8. **Frequency lever — delegate reads** — the orchestrator's own reads are the
   refill. Acceptance: the `PreToolUse:Read` advisory (`hooks.json:75-85`)
   carries a threshold derived from the same evidence base as task 2 rather than
   the current bare `800`; §6.2's bounded-reads contract states the interactive
   case explicitly; **no savings figure, no `%`, no gate** (D4b: the confirming
   corpus does not exist). Mutation-proved.

9. **Record and ship** — CHANGELOG entry, JOURNEY entry, status-page stamp, and
   the integration PR body. Acceptance: `grep -E '%|sav'` over the new CHANGELOG
   blocks returns nothing that reads as a savings claim; the PR body states what
   was and was not proven, including the n = 1 caveat.

## Locked decisions

- **2026-08-03 — L1. Gate policy: `batch`.** Phase branches
  `mission/compaction-continuity-p1…p4` merge into
  **`mission/compaction-continuity-integration`** on reviewer APPROVE; **never**
  the default branch. The human merges the integration branch once, at the end.
  The human may override to `human-merge`. Because batch surfaces nothing until
  the end, **every `[STRICT]` verdict and every REQUEST CHANGES is pushed to the
  human the moment it lands.**
- **2026-08-03 — L2. The fallback never ships without the trigger.** A stale
  `session-handoff.md` is worse than no file: the directive says treat it as
  current, so the agent resumes *confidently wrong* rather than merely lossy. No
  phase may ship task 5 before tasks 3–4 are merged. This ordering is not a
  preference; it is the mission's central safety property.
- **2026-08-03 — L3. Advisory only, always.** No hook in this mission may exit 2
  on any path. Auto-compaction is never blocked. No hook attempts to end a
  session or clear the window — no such mechanism exists.
- **2026-08-03 — L4. Zero-dep.** No `package.json`, no lockfile, no tokenizer.
  Context size is proxied by `wc -c "$transcript_path"` and nothing else; no
  hook event exposes token count. (OQ6 precedent from the context-economy
  mission.)
- **2026-08-03 — L5. The write trigger fires on `UserPromptSubmit`.** Not
  `Stop`: a `Stop` hook that emits feedback has a documented re-fire failure mode
  (the 2026-07 loop), and the action the nudge asks for — write the handoff — is
  worth asking for exactly when the human is present and steering. Not
  `PreCompact`: by then the window is already full and a hook cannot author a
  manifest anyway (that needs an LLM turn).
- **2026-08-03 — L6. Every behavior change ships a case that fails without it**,
  mutation-proved in **both** states, **plus an anti-inert control** — re-run the
  mutation against the pre-change checker to prove the *new* check is what causes
  the failure. Six bugs reached the last mission through tests that agreed with
  their own code.
- **2026-08-03 — L7. Doc claims about hook behavior are verified by dispatch,
  not by reading.** `ckpt-p2` returned REQUEST CHANGES on exactly this: two
  always-on doc rows described behavior the hooks did not have.
- **2026-08-03 — L8. Atomic-ref.** A hook, its `hooks.json` description, both
  `WORKFLOW.md` mirrors, and the plugin README change in ONE commit. Never touch
  `docs/WORKFLOW.md` line 3's `protocol-master` version stamp outside a release
  session.
- **2026-08-03 — L9. The post-compaction directive stays ≤6 lines** in every
  branch — the contracted cap, already pinned by `tools/hook-test.mjs:322-327`.
  The write-trigger nudge stays ≤3 lines.
- **2026-08-03 — L10. Never `Read`/`cat`/`head`/`tail` a `*.jsonl`.** Only `wc`,
  `grep -c`/`grep -n`, `awk … | wc -c`, or passing a path to
  `tools/context-attrib.mjs`.
- **2026-08-03 — L11. No savings claim anywhere in this mission.** D4b's
  cross-mission re-measurement corpus does not exist. Piece 3 ships as discipline,
  honestly labelled. `n = 1` per corpus survives into every figure quoted.
- **2026-08-03 — L12. Prefer more, smaller sessions.** Sixteen sessions died on
  usage limits in one day during the last mission; every split survived better.
  Eleven sessions here where five would fit is deliberate.
- **2026-08-03 — L13. `PreCompact` breadcrumb stays out (D8 Option A stands).**
  `isCompactSummary` true-records measured = 1. Promote to a breadcrumb file only
  if a wrong-ledger or wrong-branch post-compaction resume is ever recorded.

## Risks

- **A stale handoff resumes confidently wrong.** → L2's phase ordering, plus the
  fallback stating freshness in the directive itself (task 5) rather than
  trusting the file. Mitigated structurally, not by discipline.
- **The trigger becomes nagware and the owner disables the hook** — a net
  negative, since the fallback then rests on a file nobody refreshes. → one-shot
  per band per session, ≤3 lines, silent when a ledger is active, silent when the
  handoff is already fresh (OQ4).
- **This mission's own machinery becomes the next A5.** Machinery went 5.4% →
  9.3% *during the mission that measured it*. Another always-on hook adds to
  exactly that term. → the nudge is capped at two firings per session; the phase-4
  record states the added surface honestly and does not net it against a claim.
- **Byte thresholds are a loose proxy.** Transcript bytes are cumulative and
  include tool results the window has already evicted, so a threshold can fire far
  too early on a read-heavy session and far too late on a chatty one. → derive
  from real transcripts (task 2), ship two bands not one, keep it advisory (L3),
  and name the proxy's weakness in the doc row.
- **Nothing in this mission can be exercised live until merge + reinstall.** The
  installed plugin cache is at `1.41.0`; the repo is at `v1.42.0`. → every gate is
  `tools/hook-test.mjs` dispatch against the working tree; no brief may claim live
  verification, and the checkpoint reviewers are told so.
- **`WORKFLOW.md` mirror conflicts across phases.** Three of four phases touch
  the same two mirror files. → phases run **sequentially**, none is marked
  parallel-safe, and each doc session re-reads the mirrors at its own start
  rather than trusting a line number from this plan.
- ~~**PR #31 is unmerged** and carries the hook this mission extends (OQ1).~~
  **RETIRED 2026-08-04 — PR #31 MERGED** (2026-08-03T19:51Z, `main` = `2c8487f`,
  `compact-resume.sh` verified present on the default branch). The risk expired;
  every phase now bases off `main` and the final PR targets `main` with no hold
  and no retarget. The plan branch was rebased onto `main`.
- **OQ3/OQ6 land inside phase 2's shape.** If the human answers them late, S8's
  scope moves. → S8 is written to collapse into S9 if OQ3 resolves to "no format
  change", and the ledger records which way it went.

## Open questions

_Each carries the planner's recommendation, so the human decides between digested
choices. These go to the human **before** `/agentic-workflow:mission` drives execution._

- **OQ1 — RESOLVED, then SUPERSEDED BY REALITY. Base off `main`.**
  _Original question (2026-08-03): PR #31 was open and unmerged, and
  `compact-resume.sh` existed only on `mission/context-economy-integration`. The
  human accepted the recommendation to base off that branch, hold the final PR,
  and retarget after #31 merged._
  **2026-08-04: PR #31 MERGED** (2026-08-03T19:51Z, `main` = `2c8487f`;
  `compact-resume.sh` verified present on the default branch). The constraint that
  produced the answer no longer exists, so the answer changes with it: **every
  phase branches off `main`**, merges into `mission/compaction-continuity-integration`,
  and the final PR targets `main` — **no hold, no retarget**. The plan branch was
  rebased onto `main` and is a clean descendant. _Nothing about the decision's
  substance changed; only its premise expired._

- **OQ2 — What should the byte thresholds be, and on what evidence?**
  **Recommendation: derive, never guess — and ship two bands.** S2 measures the
  real compaction point: `grep -n` the compact marker in the transcripts that
  have one, `awk 'NR<=n' … | wc -c` for the byte offset, across the 87 local
  transcripts (largest: 11.6 MB, 8.4 MB, 3.8 MB, 3.0 MB). Known anchors: the
  baseline is 12,211,203 B / 4,612 lines and its one compaction collapsed
  999,816 → 82,009 **tokens**; this mission's predecessor transcript is
  3,283,782 B / 1,501 lines with the same single compaction record. Ship
  **advisory ≈ 55%** and **urgent ≈ 80%** of the derived compaction byte-point,
  as named constants pinned by cases in both directions. If S2's spread across
  sessions is too wide to justify a single constant (plausible — bytes are a
  loose proxy), **fall back to the conservative floor of the observed range and
  say so in the doc row** rather than picking a midpoint that fits nothing.

- **OQ3 — Does `session-handoff.md`'s format need to change?**
  **Recommendation: one addition, no restructuring.** The template is already a
  re-read manifest and its sections are right. Add a single provenance line —
  `_Written: <ISO-8601> · session <id> · branch <branch>_` — directly under the
  title, so the fallback can *state* freshness instead of the resuming agent
  having to infer it, and so "current" has a machine-checkable meaning (OQ5).
  Everything else stays. Rejected alternative: adding a "since last compaction"
  delta section — it would need the agent to know when compaction happened, which
  it doesn't.

- **OQ4 — How does the write trigger avoid being nagware?**
  **Recommendation: four independent silencers, all mechanical.** (a) One firing
  per band per session, state keyed by `session_id` under `$TMPDIR` — no repo
  state, no `.gitignore` change, dies with the machine. (b) At most two bands, so
  at most two nudges in a session of any length. (c) Silent when
  `docs/product/session-handoff.md` has an mtime *later* than the band crossing —
  the owner already did the thing. (d) Silent when an active mission ledger exists
  (OQ7). Plus ≤3 lines of text (L9). If it still nags in practice, the correct
  fix is raising the bands, not adding conditions.

- **OQ5 — What does "keeping it current" mean for interactive work with no
  checkpoints?**
  **Recommendation: define currency against the transcript, never the clock.**
  A handoff is *current* if it was written after the most recent band crossing;
  it is *suspect* otherwise. A wall-clock TTL is wrong for this owner — a
  handoff written three days ago in a session that has barely moved is perfectly
  current, and one written an hour ago across 400 tool calls is not. The fallback
  therefore states the handoff's age **in bytes-since-written and in the band it
  predates**, and instructs the resuming agent to verify a suspect handoff
  against `git log`/`git status` before trusting its "Next". That instruction is
  what makes a stale file merely useless instead of dangerous.

- **OQ6 — What should the fallback do when there is neither a ledger nor a
  handoff — the literal state of this repo today?**
  **Recommendation: inject anyway, with a distinct directive.** Silence is the
  current bug; reproducing it in a new branch would ship the gap under a new
  name. That moment is the highest-value one in the whole mission: the agent
  holds a summary and nothing else. A ≤6-line directive that says *there is no
  durable record — re-read `git log -5`, `git status`, `.remember/now.md` if
  present, and tell the human the record is missing before acting* converts a
  silent loss into a visible one. Rejected alternative: staying silent to avoid
  noise — the event fires at most once per compaction, which is rare.

- **OQ7 — Does the write trigger also fire during missions, or only when there
  is no active ledger?**
  **Recommendation: only when there is no active ledger.** A mission session
  already has the thread-keeper injecting `Next up:` every turn, the beat-enforcer
  at every close, write-ahead ledger discipline, and a compact-resume directive
  that works. Firing there adds machinery to the population that doesn't need it
  — precisely the A5 mistake. It also gives the nudge a crisp, testable predicate
  identical to the fallback's, so both pieces share one `active ledger?` rule and
  cannot drift apart. Revisit only if a mission session is ever observed
  compacting with a stale ledger.

---
_The `.plans/compaction-continuity.sessions.md` briefs execute these tasks;
`.plans/compaction-continuity.state.md` tracks progress. Resolve every open
question before execution starts._
