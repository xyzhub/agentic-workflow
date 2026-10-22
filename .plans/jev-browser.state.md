---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: jev-browser — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6)._

Status: planned

Estimate: 1 session
Sessions used: 0
Reviewer runs: 2

_The budget lines above are read by the mission-budget hook every turn.
`Estimate: 1` = the one brief S1 (no `phases`, owner L1; the one-shot
checkpoint review rides the same session). A corrective `S1-fix` is counted
when it fires, never pre-booked. The orchestrator bumps `Sessions used:` the
moment it starts a brief, a corrective or a loop tick
(`node ${CLAUDE_PLUGIN_ROOT}/tools/ledger.mjs jev-browser sessions +1`,
write-ahead) and flips `Status:` to `active` at the first one; `Reviewer
runs:` is bumped at every one-shot reviewer spawn, plan-judge included
(`… reviewer-runs +1`). `Status: planned` + `Sessions used: 0` keep this
ledger invisible to the hooks until then._

<!-- rule-copy: overrun-1.5x -->
At **k ≥ 1.5 × N** the hook prints 🛑 OVERRUN on every prompt and the
orchestrator MUST NOT start another brief: it gives the owner the scope
decision — ship a defined subset now / continue at a revised estimate / abort —
with the remaining phases and what each buys, records the answer as a dated
locked decision, and only then revises `Estimate:`.
<!-- /rule-copy -->

_Record that decision below; never edit `Estimate:` to silence the hook without
it. The hooks go quiet on this ledger while `Sessions used:` is 0 (planned, not
started) and for good once it carries `Closed: YYYY-MM-DD`._

Gate policy: **human-merge** — after APPROVE the branch is verified (this
repo's §10 Staging = `none`: tier-1 lint + `claude --plugin-dir` load), then
the PR to `main` is marked ready and the human merges. Recorded at planning,
2026-10-23 (brief L1 gate: one session, one Fable checkpoint before the PR).

Standing agent authorized: _(none — every review is a one-shot spawn at a
checkpoint, §12 LA-5.)_

Branches: **one branch, `feat/jev-browser`** — locked 2026-10-23 (orchestrator,
resolves OQ-2): branched from `plan/jev-browser` (itself on main 495bcc2) so
the brief and memos are on the build branch. ONE feature PR to `main`, plus
ONE `chore/jev-browser-bookkeeping` PR
for the post-merge Closing rows (agent may merge, §10 `records-only`). Target
version **1.69.0**.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [ ] S1 — `tools/browse.mjs` (run/step/snapshot/doctor; CDP attach + launch with a plugin-owned profile; one Jev request per step, D3 gates, secrets by reference with redact-before-send, D5 exit codes, private JSONL trace), `skills/browse/SKILL.md`, prompt lines in frontend/reviewer/researcher (+ routing line in marketing/business), WORKFLOW §10 row + §3 clause + verify.md/README clauses, six fixture pages + recorded answers + `tools/browse-test.mjs` wired into `tools/lint.mjs`, CHANGELOG 1.69.0 + both manifests, OB-34 row text reported, pre-merge Closing rows fired (branch `feat/jev-browser`)
- [ ] Checkpoint ckpt-s1 — one-shot `reviewer` on **Fable** (boundary-class: `tools/` + `templates/`) over `main..HEAD`, red-team list from the sessions file (secret paths, off-head reads, gates, DONE check, default profile, trace location, no new Bash rule, keyless no-op), plain-report read of the skill/doctor/exit strings; APPROVE → staging verify → PR ready, human merges

## Open questions

_Mirrored from the master plan with their recommendations; the human answers
before execution starts._

- **OQ-1 — may the builder launch the installed Google Chrome headless** (plugin-owned profile under XDG data, a free debug port, nothing downloaded or installed) to capture the fixture element tables and run the live CDP smoke? **Recommendation:** yes. If no: tables are hand-derived (labelled), the smoke prints `skip`, the CDP backend is first exercised live at OB-34. — **LOCKED 2026-10-23 (owner): "Yes, temp profile"** — launch with a `mkdtempSync` profile (`BROWSE_PROFILE_DIR`), removed afterwards; mock keychain, basic password store, no extensions.
- OQ-2 (decision docs on the build branch) — **resolved 2026-10-23 at plan-judge**: `feat/jev-browser` branches from `plan/jev-browser`; see the Branches line.

## Standing steers

(none)

## Closing

- [ ] version bumped + stamped · added 2026-10-23 (planner, pre-merge) — do: bump `plugins/agentic-workflow/.claude-plugin/plugin.json` and `plugins/agentic-workflow/package.json` `version` to 1.69.0 (§10 Version pin) and stamp this mission's CHANGELOG entry with it — when: this mission's CHANGELOG entry names a version — probe: `grep '"version"' plugins/agentic-workflow/.claude-plugin/plugin.json plugins/agentic-workflow/package.json`
- [ ] docs/record synced · added 2026-10-23 (planner, pre-merge) — do: CHANGELOG `[1.69.0]` entry, `skills/browse/SKILL.md`, the frontend/reviewer/researcher/marketing/business prompt lines, `templates/WORKFLOW.md` §10 Browser verification row + §3 clause, `commands/verify.md` clause, README row — when: those are on the branch and `node tools/lint.mjs` is clean — probe: `grep -n "1.69.0" CHANGELOG.md` + `grep -c "Browser verification" plugins/agentic-workflow/templates/WORKFLOW.md` + `test -f plugins/agentic-workflow/skills/browse/SKILL.md`
- [ ] live-verify browse · added 2026-10-23 (planner, post-merge) — do: promote to `.plans/OBLIGATIONS.md` as OB-34 verbatim (text in `.plans/jev-browser.sessions.md` S1 Do 9): `browse.mjs doctor` against BrowserOS neo (paste its `tools/list`, note whether its debug port answers) and one live `run` with the key against a real login flow; record per-step Jev ms, hand-off rate, exit-2 rate, zero resolved secrets in the trace — when: v1.69.0 is installed from `main` (plugin update + reload, after the merge) — probe: manual → OB-34
- [ ] branch + worktree cleanup · added 2026-10-23 (planner, post-merge) — do: delete `feat/jev-browser` and `plan/jev-browser` (local and remote) and prune any stale worktree — when: the feature PR is merged into `main` — probe: `gh pr list --state merged --head feat/jev-browser`
- [ ] repo WORKFLOW sync · added 2026-10-23 (planner, post-merge) — do: run `/agentic-workflow:sync` on this repo so `docs/WORKFLOW.md` carries the §10 Browser verification row at stamp v1.69.0 (folds into OB-33's sync if that is still open) — when: v1.69.0 is installed and the feature PR is merged — probe: `grep -c "protocol-master: v1.69.0" docs/WORKFLOW.md`

## Deviations

(none)

## Handoff log (newest first)

- 2026-10-23 plan-judge REVISE folded: `step` never resolves secrets (exit 3 `needs_secret`); secrets resolved once into a vault closure that builds `redact()` (raw/URL/HTML forms); two-sided secret test via the driver's act log; live smoke on `BROWSE_PROFILE_DIR` tmp dir + mock-keychain/basic-store/no-extensions flags; `--trace` in the worktree refused; `BROWSE_FAKE_NODE` loopback-gated; OQ-2 locked (feat from plan branch); OQ-1 still with the owner.

- 2026-10-23 planned: trio authored from `docs/product/decisions/2026-10-23-jev-browser-brief.md` + memos D1/D2-CDP/D3/D4/D5/D7 + counsel #3/#4/#5/#6/#8; build branch `feat/jev-browser` from main 495bcc2; OQ-1..2 to the owner before S1.

Next up: S1
