# Session handoff — working state

_The interactive counterpart to a mission ledger: what a resuming agent needs when there is
no active `.plans/*.state.md`. Read it **verbatim** before continuing, then verify against
`git log --oneline -5` and `git status` before trusting **Next**._

_Written: 2026-08-04T00:00:00Z · session unknown · branch plan/interactive-handoff_

---

## Where things stand

- **`main` = `2c8487f`, v1.42.0 shipped.** PR #31 (`context-economy`) merged 2026-08-03T19:51Z.
  The plugin was reloaded after the merge, so **v1.42.0's hooks are now the installed ones** —
  `compact-resume.sh` and the due-ness-aware beat-enforcer are live for the first time.
- **Mission `context-economy` — CLOSED.** Full record: `docs/product/engineering/context-economy-metrics.md`.
- **Mission `compaction-continuity` — PLANNED, NOT STARTED.** Trio at
  `.plans/compaction-continuity.{md,sessions.md,state.md}`, brief under `docs/product/decisions/`.
  Branch `plan/interactive-handoff` (pushed). 4 phases, 11 sessions, 2 STRICT checkpoints,
  gate policy **batch**. **Next up: S1** — harness fixtures in `tools/hook-test.mjs`, suits `backend`.

## Next

**Start S1 of `compaction-continuity`**, or leave it parked. Nothing is mid-flight; no branch
is in a partial state; all gates green (`lint` clean · `hook-test` clean · `--selftest` 54).

## Decisions that are locked and must not be re-litigated

- **OQ1 (updated 2026-08-04): every phase bases off `main`.** The original "base off
  `mission/context-economy-integration`, hold the PR, retarget" existed only while #31 was
  open. It merged; the premise expired.
- **OQ4: four mechanical silencers** on the write trigger. **If it nags, raise the bands —
  do not add conditions.**
- **OQ6: when neither ledger nor handoff exists, inject a distinct ≤6-line directive**
  (`git log -5`, `git status`, `.remember/now.md`) and tell the human the record is missing.
  It must **not** instruct the agent to author a handoff on the spot.
- **L2: no phase ships the fallback before the trigger is merged.** A stale handoff is worse
  than none — the directive says re-read it verbatim, so the agent resumes *confidently wrong*.

## Owner action, outstanding, outside this repo

**Prune `~/.claude/skills` (~140 skills, 208k chars) and unused MCP servers (93k).** The
`context-economy` audit measured this as a larger context lever than everything Phases 0–4
delivered combined. Minutes of settings work. Not scheduled by any session, because no
session can do it.

## Standing conventions in this repo

- **Never `Read`/`cat`/`head`/`tail` a `*.jsonl` transcript** — 3–12 MB. Use `wc`, `grep -c`,
  or pass the path to `tools/context-attrib.mjs`, which streams.
- **Gates:** `node tools/lint.mjs` (spawns `hook-test`, `marker-test`, `context-attrib --selftest`).
- **Never merge or push the default branch** — the human merges.
- **Every behavior change ships with a test that fails without it**, mutation-proved in both
  states, plus an anti-inert control (re-run the mutation against the pre-change checker).
- **An agent loads its INSTALLED definition, not the working tree.** A mission that edits an
  agent's contract cannot exercise that edit until merge + reinstall.

---

_Note for `compaction-continuity` S5/OQ6: this file **now exists**, which changes a premise the
plan records ("`session-handoff.md` has never been written in this repo"). The
neither-ledger-nor-handoff branch is still required — it is the state any *other* repo starts in._
