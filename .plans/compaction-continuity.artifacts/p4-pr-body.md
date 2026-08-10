# Compaction continuity — the owner's own working style gets a safety net

**Base:** `main` · **Merges:** `mission/compaction-continuity-integration` → `main`
(OQ1, superseded 2026-08-04: the PR #31 dependency that once required a hold and
a retarget is gone — `compact-resume.sh` has been on `main` since PR #31 merged,
so every phase branched off `main` directly and this PR targets `main` directly).

## Why

The owner never ends sessions the way the protocol assumes — he steers
interactively for weeks in one long-running thread. Auto-compaction fires
anyway, silently, and because there is no active mission ledger in that mode,
nothing told the agent anything had been lost or what to re-read. The loss
compounded: each compaction paraphrased a paraphrase.

The machinery to prevent this already existed in this repo — `compact-resume.sh`,
`session-handoff.md`, the manual `/agentic-workflow:start`/`end`/`handoff`
commands — but it either fired only inside formal missions (which the owner
rarely runs interactively) or never fired at all (no trigger ever prompted the
manual commands). This mission closes both gaps and adds one adjacent lever,
under one rule the team held itself to throughout: **fidelity, not savings**.
Nothing here claims to make sessions cheaper; everything here is about making
sure the record survives the moment the window empties.

Full problem framing: `docs/product/decisions/2026-08-03-compaction-continuity-brief.md`.

## What ships

**Phase 1 — the write trigger** (`c2e4648`)
New `plugins/agentic-workflow/hooks/lib/handoff-budget.sh`, registered under
`UserPromptSubmit`. Watches cumulative transcript bytes (`wc -c
"$transcript_path"` — a loose, cumulative proxy for context use, **not** a
token count) against two named constants:

- `ADVISORY_BYTES = 3,700,000`
- `URGENT_BYTES = 5,380,000`

**Both bands are n=1-derived — a conservative floor, not a distribution.**
Only one true compaction event exists anywhere in this repo's own transcript
corpus (48 files, ~21.8 MB, measured 2026-08-10); the bands are cut down from
that single observed byte-point (6,727,626 B), rounded down so the nudge errs
toward firing early rather than late. The caveat ships with the code — the
constants carry the derivation and the n=1 warning in their own comments, not
just in this PR body, so a future reader hits it at the source.

Four silencers keep it deterministic and non-nagging: fires at most once per
band per session; silent while an active mission ledger exists (missions
already have the thread-keeper and a working `compact-resume.sh`); silent once
`docs/product/session-handoff.md` is already newer than the crossing; and,
like every hook in this repo, it never blocks — it emits an advisory
`UserPromptSubmit` message and always exits 0.

**Phase 2 — the fallback** (`488b87a`)
`compact-resume.sh` no longer goes silent when there is no active mission
ledger — the exact case the owner is in most of the time. It now branches
three ways:

1. **Active ledger** — byte-for-byte the same directive as before (pinned by
   an exact-string harness case; nothing here changed for mission sessions).
2. **No ledger, handoff present** — a directive naming
   `docs/product/session-handoff.md` and stating its freshness: `CURRENT` only
   if the handoff is provably newer than the transcript's last append, else
   `SUSPECT` (fail-closed on a missing/unreadable transcript too), with an
   instruction to verify against `git log`/`git status` before trusting the
   handoff's **Next**. This is stamp-first: the handoff template gained a
   one-line `_Written: <ISO-8601> · session <id> · branch <b>_` provenance
   line, preferred over file mtime when present, with mtime as the fallback.
3. **Neither ledger nor handoff** — a distinct directive naming `git log -5`,
   `git status`, and `.remember/now.md`, instructing the agent to **tell the
   human the record is missing** rather than proceed on the compaction
   summary alone, and explicitly forbidding authoring a handoff on the spot
   (immediately after losing context is the worst moment to write state).

This kills the previously-shipped, now-false CHANGELOG claim that
`compact-resume.sh` is "silent with no active ledger" — that was true before
this phase and is the bug this mission set out to fix.

**Phase 3 — the frequency lever** (`a14615f`)
`READ_ADVISORY_LINES = 800` — the whole-file-read nudge's threshold, named
instead of a bare literal, with a comment citing its evidence base. Both
`WORKFLOW.md` mirrors gained a **Delegated reads** paragraph stating the
interactive case explicitly: prefer handing a large read to a subagent that
returns a distillate over pulling the corpus into the window it's trying to
preserve.

**This lever ships with no savings claim, deliberately.** The corpus needed to
measure a before/after effect for this repo doesn't exist; the text says so
plainly rather than implying a number nobody can back up. A `grep` for
`%|sav` over every diff in this mission returns nothing that reads as a
savings claim.

## Verification

- `tools/hook-test.mjs` grew **33 → 64** cases across the mission, with the
  pre-change case list diffed byte-for-byte unchanged after every phase (no
  regression silently absorbed into a rewritten baseline).
- Every behavior change is mutation-proved **in both states**, each with an
  anti-inert control (the mutation re-run against the pre-change checker, to
  prove the new case — not a coincidence — is what catches it).
- Two `[STRICT]` checkpoints and one routine checkpoint, **all APPROVE, zero
  corrective sessions**:
  - `ckpt-p1` (Fable, STRICT) — 18-path dispatch matrix, all exit 0; 6 claimed
    + 6 adversarial mutations; n=1 bands accepted on the merits (owner owns
    the n=1; re-measure if compaction behavior changes upstream).
  - `ckpt-p2` (Fable, STRICT) — 33/33 dispatch paths; branch 1 (active ledger)
    byte-identical to the pre-phase hook; OQ6's "record is missing" directive
    verbatim; SUSPECT-wording probed clean.
  - `ckpt-p3` (Fable, routine) — all prior findings re-derived closed; both
    its adversarial mutations killed; the non-claim framing verified as
    genuinely *unmeasured*, not softened to "measured but noisy."
- **Nothing in this PR has been exercised live.** The installed plugin cache
  is `1.41.0`; this repo is `v1.42.0`; a hook loads its *installed*
  definition, not the working tree. Every verification claim above is a
  `tools/hook-test.mjs` dispatch against the working tree, not a live firing.
  The first live firing of any of this — the budget nudge, the fallback
  branches, the delegated-reads advisory — happens after this merges and the
  plugin is reinstalled.

## Tracked open items (carried forward, not closed by this PR)

- **Re-measure the n=1 bands** if upstream compaction behavior changes (model,
  context-window size, or auto-compact margin all move the byte-point this
  mission measured once).
- **Pre-existing `WORKFLOW.md` mirror wording drift** (`docs/WORKFLOW.md` vs.
  `templates/WORKFLOW.md`, unrelated to this mission's edits) — flagged at
  `ckpt-p1`, left for the portfolio-learning sweep, not fixed here.
- **CHANGELOG/status-page items S10 deferred**: `overview.html`'s
  `data:stages`/`data:pillars` blocks are stale since 2026-07-08 and were left
  untouched (their own tracked staleness item, not this mission's scope).
- **Two standing owner actions**, unrelated to this repo's code: pruning
  `~/.claude/skills` + MCP config (the largest single slice of registry
  injection in the measured corpus, and explicitly an owner-settings action
  out of scope here), and running `/connect`.

## What doesn't change

- `main` is untouched throughout — every phase branched off `main` and merged
  only into `mission/compaction-continuity-integration`; nothing landed on
  the default branch except through this PR.
- The version bump is a release session's job, not this mission's — no
  version stamp changed in any phase.
- The human merges this once, at this PR, per the mission's batch gate policy.
