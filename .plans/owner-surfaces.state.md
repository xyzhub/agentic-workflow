---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: owner-surfaces — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6)._

Status: planned

Estimate: 7 sessions
Sessions used: 0
Reviewer runs: 1

_The budget lines above are read by the mission-budget hook every turn.
`Estimate: 7` = 4 builder briefs (S1–S4) + 3 one-shot Fable checkpoints
(ckpt-p1..p3), per WORKFLOW §5 LA-1 ("briefs + checkpoints only"); the
justification per phase is in the master plan's Locked decisions. A corrective
`S<n>-fix` is counted when it fires, never pre-booked; the overrun stop fires
at **k ≥ 11** (1.5 × 7). The orchestrator bumps `Sessions used:` the moment it
starts a brief or a checkpoint tick (`node ${CLAUDE_PLUGIN_ROOT}/tools/ledger.mjs
owner-surfaces sessions +1`, write-ahead) and flips `Status:` to `active` at
the first one; `Reviewer runs:` is bumped at every one-shot reviewer spawn,
plan-judge included (`… reviewer-runs +1`). `Status: planned` + `Sessions
used: 0` keep this ledger invisible to the hooks until then._

<!-- rule-copy: overrun-1.5x -->
At **k ≥ 1.5 × N** the hook prints 🛑 OVERRUN on every prompt and the
orchestrator MUST NOT start another brief: it gives the owner the scope
decision — ship a defined subset now / continue at a revised estimate / abort —
with the remaining phases and what each buys, records the answer as a dated
locked decision, and only then revises `Estimate:`.
<!-- /rule-copy -->

_Record that decision below; never edit `Estimate:` to silence the hook without
it. Subset fallbacks the owner may choose at that stop, in value order: P1 + P2
(5 sessions) ship the schema, the question log, the JSON and the generated page
without the lease (L2 unmet); P1 alone (3 sessions) ships the schema, the log,
the JSON and the interview emission._

Gate policy: **human-merge** — after APPROVE each phase advances on the one
branch; after ckpt-p3 the branch is verified (this repo's §10 Staging = `none`:
tier-1 lint + `claude --plugin-dir` load), the main session publishes the
generated page once, then the PR to `main` is marked ready and the human
merges. Recorded at planning, 2026-10-16 (brief: "Next mission, careful").

Standing agent authorized: _(none — every review is a one-shot spawn at a
checkpoint, §12 LA-5.)_

Branches: **one branch, `mission/owner-surfaces`** (cut from `plan/owner-surfaces`,
which carries the decision records and this trio), carries all three phases;
ONE feature PR to `main` (draft after ckpt-p1, ready after ckpt-p3), plus ONE
`chore/owner-surfaces-bookkeeping` PR for the post-merge Closing rows (agent
may merge, §10 `records-only`). Target version **1.63.0**.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [ ] S1 — schema (`templates/owner-surfaces.schema.json`) + zero-dep validator + `plain` column in `gate-classes.md` + `readClasses` plain, `tools/state.mjs` json · ask · answer · expire · check, `.plans/questions.jsonl`, `tools/state-test.mjs` + `checkStateHarness` (branch `mission/owner-surfaces`)
- [ ] S2 — §12 rule 3 rewritten + every `pending-gates.md` repoint, `/plan` interview + approval and mission.md §1 emit structured questions beside the unchanged AskUserQuestion, `templates/owner-surfaces.md` public interface, Missions fixtures, OB-30 extended (branch `mission/owner-surfaces`)
- [ ] Checkpoint ckpt-p1 — one-shot `reviewer` on **Fable** (new tool + schema + gate-classes + §12) over AC-1..AC-13 + AC-25; APPROVE → draft feature PR, next phase on the same branch
- [ ] S3 — `state.mjs page` renderer + `--check`, `templates/overview.html` rewrite (HIG/contrast fixes, data island, ops "Not measured yet"), J4 proxy test, this repo's page migrated + regenerated, chronicler Artifact 3 rewritten (branch `mission/owner-surfaces`)
- [ ] Checkpoint ckpt-p2 — one-shot `reviewer` on **Fable** (renderer + template) incl. plain-report read + the designer's V4 heuristic pass of the rendered page; APPROVE → next phase on the same branch
- [ ] S4 — `ledger.mjs lease` take · renew · release on `lease/<mission>`, every-write brake, `--no-push` refused, owner-only logged `--force` + hook guard, two-clone race selftest, §5 hand-off + mission.md lease lines, CHANGELOG 1.63.0 + bump + `docs/WORKFLOW.md` sync (branch `mission/owner-surfaces`)
- [ ] Checkpoint ckpt-p3 — one-shot `reviewer` on **Fable** (hooks.json + the ledger write path) over the WHOLE mission diff `origin/main..HEAD`, incl. plain-report read; APPROVE → staging verify → main session publishes the generated page once → PR ready, human merges

## Open questions

_Mirrored from the master plan with their recommendations; the human answers
before execution starts._

- Assumed 2026-10-16 → master plan Locked decisions (OQ-1: lease authority on remote branch `lease/<mission>`, token kept on the machine, only `key8` in the ledger — recommendation: ratify) — ratified 2026-10-16

## Standing steers

(none)

## Closing

- [ ] version bumped + stamped · added 2026-10-16 (planner, pre-merge) — do: bump `plugins/agentic-workflow/.claude-plugin/plugin.json` `version` to 1.63.0 (§10 Version pin) and stamp this mission's CHANGELOG entry with it — when: this mission's CHANGELOG entry names a version — probe: `grep '"version"' plugins/agentic-workflow/.claude-plugin/plugin.json` + `grep -n "## \[1.63.0\]" CHANGELOG.md`
- [ ] docs/record synced · added 2026-10-16 (planner, pre-merge) — do: CHANGELOG `[1.63.0]` entry, README tools list (`tools/state.mjs`) + `.plans/` tree line (`questions.jsonl`), `templates/owner-surfaces.md` complete (regions + lease sections filled), `docs/WORKFLOW.md` synced to the template at stamp v1.63.0, `docs/product/overview.html` regenerated by the renderer — when: those are on the branch and `node tools/lint.mjs` is clean — probe: `grep -n "1.63.0" CHANGELOG.md docs/WORKFLOW.md` + `node plugins/agentic-workflow/tools/state.mjs page --check` + `grep -rn pending-gates plugins/` (empty)
- [ ] Missions adopts the fixtures (OB-30 extended) · added 2026-10-16 (planner, pre-merge) — do: extend OB-30's `do:` in `.plans/OBLIGATIONS.md` in place — after the pin bump, Missions adds a contract test validating `tools/fixtures/owner-surfaces/*` against `templates/owner-surfaces.schema.json` and reads `state.mjs json` instead of scraping the ledger; estimate ≈ 1 Missions session — when: the fixtures and `templates/owner-surfaces.md` are on the branch — probe: `grep -n "owner-surfaces" .plans/OBLIGATIONS.md`
- [ ] branch + worktree cleanup · added 2026-10-16 (planner, post-merge) — do: delete `mission/owner-surfaces` and `plan/owner-surfaces` (local and remote), confirm no `lease/owner-surfaces` (or any `lease/*` this mission took) remains on origin, and prune stale worktrees — when: the feature PR is merged into `main` and CI lint is green on the merge commit — probe: `gh pr list --state merged --head mission/owner-surfaces` + `gh run list --branch main --limit 1` + `git ls-remote origin 'refs/heads/lease/*'` (empty)
- [ ] live-verify after reinstall · added 2026-10-16 (planner, post-merge) — do: in a fresh session on this repo after `/plugin update` + reload: `node $CLAUDE_PLUGIN_ROOT/tools/state.mjs json` prints JSON that parses and validates; the main session runs `state.mjs page` and publishes `docs/product/overview.html` to its `artifact-url` (Artifact version rises, the header reads "Updated <time> from state.mjs page"); `node tools/ledger-test.mjs` passes its lease race section — when: v1.63.0 is installed from `main` — probe: `node $CLAUDE_PLUGIN_ROOT/tools/state.mjs json | node -e 'JSON.parse(require("fs").readFileSync(0,"utf8"))'` + `node tools/ledger-test.mjs` + manual (published Artifact version)
- [ ] three generated chronicler passes · added 2026-10-16 (planner, post-merge) — do: confirm the first three chronicler passes after the merge leave zero hand edits in the generated regions of `docs/product/overview.html` (metrics J2 check; promote to the register at close) — when: three chronicler commits touching `docs/product/overview.html` exist on `main` after the feature PR's merge commit — probe: `git log -3 -p -- docs/product/overview.html` + `node plugins/agentic-workflow/tools/state.mjs page --check`
- [ ] chat-vs-structured ratio re-measure · added 2026-10-16 (planner, post-merge) — do: count questions answered via `state.mjs answer --via chat` vs asked-but-answered-only-in-prose across the missions run after this one (metrics suggested row 5; N set by the owner, default 3); promote to the register at close — when: three missions planned after v1.63.0 have closed — probe: `node plugins/agentic-workflow/tools/state.mjs json | grep -c answered-in-chat` + manual
- [ ] E2b — decide on the page · added 2026-10-16 (planner, post-merge) — do: build E2b per brief L1b — deciding on the page (memo D4: owner pin, nonce, 10-minute settle window, live round trip, with every counsel technical condition 1–4), the `/operate` structured ops notice (D6-B), and client-ready polish incl. one outsider reading the page and answering the brief's three questions verbatim (J4); promote to the register at close — when: a client demo or engagement is booked (the owner says so, or a dated booking lands in `docs/product/`) — probe: manual

## Deviations

(none)

## Handoff log (newest first)

- 2026-10-16 owner 2026-10-16: Estimate 7 accepted (L5); OQ-1 lease shape ratified (L6); start later — plan PR to main for owner merge

- 2026-10-16 plan-judge REVISE (Fable): 6 text fixes (lease commit-tree -p + plain push; race rounds cleared; 3 value-sourcing rows; +290 B; metrics row 5 as Closing row) — planner applied all in one pass; judge ruled 7 honest, owner ack needed before S1; OQ-1 lease shape recommended for ratify

- 2026-10-16 plan-judge spawned (Fable, one-shot) over the trio — 2026-10-16 04:59

- 2026-10-16 planned: trio authored by the planner on `plan/owner-surfaces` (base 66dc6af, plugin v1.62.0); E2a only per L1; 4 briefs + 3 Fable checkpoints; OQ-1 (lease shape) Assumed, non-blocking. Plan-judge (Fable) next.

Next up: S1 — schema + validator + `tools/state.mjs` on `mission/owner-surfaces` (cut it from `plan/owner-surfaces` after plan-judge APPROVE)
