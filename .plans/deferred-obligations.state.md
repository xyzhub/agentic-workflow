---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: deferred-obligations — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1):
a fresh agent resumes the mission from this file alone. Write-ahead — update it
before ending a session._

**⛔ NOT STARTED — planned 2026-08-11, awaiting the human's answers to OQ1–OQ7**
(mirrored below with recommendations). Execution is blocked until they are
answered; OQ1 additionally holds the start on PR #32's merge.

Gate policy: **batch** (L1, recorded at planning) — each phase branch
`mission/deferred-obligations-p1…p4` merges into
**`mission/deferred-obligations-integration`** by the orchestrator on APPROVE;
**never the default branch**. The human merges the integration branch **once**,
at the end-of-mission confirmation. `ckpt-p2` is `[STRICT]` (deletion
machinery); its verdict and any REQUEST CHANGES are pushed to the human the
moment they land. _The human may override to `human-merge`._

**Does `main` advancing on PR #32 matter?** To this plan commit: **no** — the
trio + brief are all-new files, zero overlap with #32's diff. To execution:
**yes, three ways** — S5 edits `hooks.json` and `tools/hook-test.mjs` (both
changed by #32), S4's seed rows cite `.plans/compaction-continuity.state.md`
(which reaches `main` only with #32), and S5 copies `handoff-budget.sh`'s
marker pattern (ditto). Hence OQ1's recommendation: base every phase off
post-#32 `main`; the ⚠-marked line counts in the sessions file get re-verified
at session start.

**Standing rules, inherited by every session:** never `Read`/`cat`/`head`/`tail`
a `*.jsonl` (L10); all new shell GNU/BSD-portable — CI is Ubuntu, local gates
macOS (L9); hook behavior is proven by `tools/hook-test.mjs` dispatch, never
claimed live; the S4 reap is the one live-exercised piece; deletion gates L4
verbatim, `git branch -d` never `-D`.

Plan: `.plans/deferred-obligations.md` · Briefs:
`.plans/deferred-obligations.sessions.md` · Brief:
`docs/product/decisions/2026-08-11-deferred-obligations-brief.md`

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner ·
`[x]` done (verified, not merely written)._

- [ ] S1 — `## Closing` block + obligations register templates (branch
  `mission/deferred-obligations-p1`) — **Suits:** `writer`
- [ ] S2 — lint checks 13 + 14, mutation-proved, legacy-tolerant (branch
  `mission/deferred-obligations-p1`) — **Suits:** `backend`
- [ ] Checkpoint `ckpt-p1` — phase 1 gates + diff, legacy tolerance proven
  against the five pre-existing trios; merge to integration per L1
- [ ] S3 — author `commands/settle.md` (probe ladder + reap algorithm +
  L4 gates) (branch `mission/deferred-obligations-p2`) — **Suits:** `backend`
- [ ] S4 — dogfood reap on this repo + seed OB-1/OB-2 (branch
  `mission/deferred-obligations-p2`) — **Suits:** `devops`
- [ ] Checkpoint `ckpt-p2` **[STRICT]** — audit every deletion against reflog +
  `gh` + the dry-run listing; verdict to the human immediately
- [ ] S5 — `hooks/lib/obligations-due.sh` + registration + harness cases
  (branch `mission/deferred-obligations-p3`) — **Suits:** `backend`
- [ ] S6 — protocol integration: end/mission/check + both mirrors + README,
  atomic-ref (branch `mission/deferred-obligations-p3`) — **Suits:** `writer`
- [ ] Checkpoint `ckpt-p3` — phase 3 gates + mirror discipline; no prose claim
  without a dispatched case
- [ ] S7 — update the record: CHANGELOG + JOURNEY + status page (branch
  `mission/deferred-obligations-p4`) — **Suits:** `chronicler`
- [ ] S8 — integration PR body + close this ledger through its own gate
  (branch `mission/deferred-obligations-p4`) — **Suits:** `writer`
- [ ] Checkpoint `ckpt-p4` — final pass over `main..integration`; then the
  human merges PR `mission/deferred-obligations-integration → main` once

## Open questions

_Mirrored from the master plan with recommendations; empty once the human has
answered them all. Full argument for each: `.plans/deferred-obligations.md`._

- **OQ1** — start timing vs PR #32 → **hold until #32 merges; base off `main`**
  (early start = base off `mission/compaction-continuity-integration`,
  retarget after).
- **OQ2** — register location → **`.plans/OBLIGATIONS.md`** + template
  `templates/obligations.md`.
- **OQ3** — beats + silencers → **SessionStart `startup|resume` hook (grep-only,
  four silencers, ≤3 lines) + probes only in `/settle`, `end.md`, `check.md`**.
- **OQ4** — deploy-green probe without CI/deploys → **§10-profile ladder,
  degrading fail-closed**; `gh` missing/ambiguous → surface, never delete.
- **OQ5** — close refusal: step, lint, or both → **both**: the command step
  acts, the `Closed:`-stamp lint check catches (legacy-tolerant).
- **OQ6** — queue order vs portfolio-learning → **this mission first**: the
  parking place must exist before the scholar's sweep finds more instances to
  park; the register gives the scholar a write target, not the reverse.
- **OQ7** — deploy gate for `worktree-agent-*` → **no**: they never carry
  deploys; `git worktree prune` + `git branch -d` (git's merged check) is the
  gate; a `-d` refusal is surfaced, never forced.

## Standing steers

_Captured verbatim at checkpoints only; grammar
`- YYYY-MM-DD (ckpt <id>) — "<exact words>"`; retire by ~~strikethrough~~,
never delete._

(none)

## Closing

_This mission's own deferred obligations — the block S1 templatizes and S8
closes through the gate it builds (grammar enforcement arrives with S2; this
file is its first real consumer). `Closed:` stamp only when no `[ ]` row
remains; a `[~]` row must carry its `→ OB-<n>` promotion ref._

- [ ] OB-a · added 2026-08-11 (planner) — do: delete this mission's four phase
  branches + integration branch, local and remote — when: the integration PR
  is merged by the human AND CI concluded green on the merge commit — probe:
  `gh pr view <n> --json state,mergeCommit` + `gh run list --commit <sha>`
- [ ] OB-b · added 2026-08-11 (planner) — do: live-verify the obligations-due
  hook fires in a real session — when: the shipped version is installed
  (`/plugin update` + `/reload-plugins` post-merge) — probe: manual
- [ ] OB-c · added 2026-08-11 (planner) — do: confirm the five legacy trios
  still pass lint on the installed release — when: the release lands on
  `main` — probe: `node tools/lint.mjs` on a fresh checkout of `main`

## Deviations

_Any departure from a brief — logged the moment it happens, with why.
Deviating is allowed; deviating silently is not (§4)._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what the session did, the verify signal, the branch,
what the next session needs. Newest on top; crash-safe by write-ahead._

- 2026-08-11 planning: trio + brief authored on `plan/deferred-obligations`
  (off `main` = `2c8487f`, pre-#32 deliberately — zero file overlap with #32).
  `node tools/lint.mjs` green. Mission parked pending OQ1–OQ7 + the #32 merge.

Next up: S1
