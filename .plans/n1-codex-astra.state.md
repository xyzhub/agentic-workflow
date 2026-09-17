---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: n1-codex-astra — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6). Deploys to
`.plans/n1-codex-astra.state.md`._

Estimate: 1 session
Sessions used: 0

_The two budget lines above are read by the mission-budget hook every turn. The
planner writes `Estimate:` (default `1 session`; more only with the `phases`
mode and a justification in the master plan). The orchestrator increments
`Sessions used:` the moment it starts a brief, a corrective `S<n>-fix`, or a
`continue`/loop tick — write-ahead, before spawning. When `Sessions used`
reaches 1.5× the estimate the hook prints 🛑 OVERRUN on every prompt and the
orchestrator must stop and give the owner the scope decision (subset / revised
estimate / abort) — recorded below as a dated locked decision that revises
`Estimate:`. Never edit `Estimate:` to silence the hook without that decision._

Gate policy: **human-merge** — after APPROVE the phase lands per §10 (Staging =
none: lint green on the branch + `claude --plugin-dir` load in a consumer
session), then one PR to `main` that the owner merges. Recorded at mission
start, 2026-09-17.

Runtime of record: S1 runs on **codex:gpt-6-astra, effort medium** through the
`.claude/agents/backend.md` tune override (commit 8ddf1d5) — no `runtime:`
header on the brief. Spawn: `node <plugin>/tools/run-codex.mjs --role backend
--brief .plans/n1-codex-astra.sessions.md#S1 --cwd <repo> --out
.plans/runs/n1-codex-astra-S1.json` in the background, stdin closed; read the
distillate file; the orchestrator commits `changed_paths`. The checkpoint
reviewer runs on Claude (Fable). This mission IS the n=1 the
`runtime-agnostic-codex` ledger is awaiting.

Standing agent authorized: none — every review/counsel is a one-shot spawn at
a decision point (§12 LA-5).

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [ ] S1 — changed_paths delta + strict distillate discovery, shipped as 1.51.1 (branch `mission/n1-codex-astra`, runtime codex:gpt-6-astra via tune)
- [ ] Checkpoint — ONE fresh one-shot Claude `reviewer` (Fable) over `587aee6..HEAD`; then lint-on-branch + plugin-dir load, PR to `main`, owner merges

## Open questions

_Mirrored from the master plan with their recommendations. Empty once the
human has answered them all._

- Which `.plans/runs/` artefacts get committed? — **Recommendation:** commit
  the distillate `.plans/runs/n1-codex-astra-S1.json` (the n=1 evidence);
  sub-ignore `.plans/runs/*.events.jsonl` and `.plans/runs/*.raw.txt` in the
  orchestrator's own commit.

## Standing steers

_Captured **verbatim** at checkpoints only, never mid-brief, never from an
agent's own inference. Grammar:_ `- YYYY-MM-DD (ckpt <id>) — "<exact words>"`
_Retire by ~~strikethrough~~, never delete._

(none)

## Closing

_A promised action with an observable condition and no trigger yet. Grammar,
one line each:_ `- [ ] <name> · added YYYY-MM-DD (<source>) — do: <action> —
when: <observable condition> — probe: <command | manual>`. _Rows are never
deleted: a fired row appends `· fired YYYY-MM-DD (<evidence>)`; a `[~]` row
MUST carry `→ OB-<n>`. `Closed: YYYY-MM-DD` is written only once every row is
`[x]` or `[~] … → OB-<n>`; `/agentic-workflow:settle` enforces it._

- [ ] branch + worktree cleanup · added 2026-09-17 (planner) — do: delete `mission/n1-codex-astra` (local and remote) and prune its stale worktrees — when: the PR to `main` is merged AND the lint run on its merge commit concluded green — probe: `gh pr list --state merged` + `gh run list`
- [ ] docs/record synced · added 2026-09-17 (planner) — do: confirm the CHANGELOG 1.51.1 entry, the `run-codex.mjs` `--cwd` usage text and the distillate schema's `changed_paths` description all say "delta vs the pre-spawn snapshot" — when: S1 is `[x]` and the checkpoint reviewer returned APPROVE — probe: manual
- [ ] live-verify after reinstall · added 2026-09-17 (planner) — do: confirm in a real session that a codex run's distillate `changed_paths` omits the orchestrator's pre-spawn ledger edit — when: the 1.51.1 release is installed (`/plugin update` + `/reload-plugins`, post-merge) and the next codex-routed brief returns — probe: manual
- [ ] version bumped + stamped · added 2026-09-17 (planner) — do: bump `plugins/agentic-workflow/.claude-plugin/plugin.json` to 1.51.1 (the §10 Version pin), stamp `docs/WORKFLOW.md` line 3 `protocol-master: v1.51.1`, and stamp this mission's CHANGELOG entry with 1.51.1 (all three are in the S1 brief's Do list; verify them in the diff) — when: this mission's CHANGELOG entry names a version — probe: manual
- [ ] n=1 tokens recorded · added 2026-09-17 (planner) — do: copy the adapter distillate's `usage` (Astra `input_tokens`/`output_tokens` from `.plans/runs/n1-codex-astra-S1.json`) and the Claude reviewer's usage into the `n=1 real Astra run` row of `.plans/runtime-agnostic-codex.state.md` as its `· fired 2026-09-17 (…)` evidence, and note the outcome (APPROVE/REVISE, corrective count) beside it — when: the checkpoint reviewer returns — probe: manual

## Deviations

_Any departure from a brief — logged the moment it happens, with why._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs._

- 2026-09-17 planner: trio written. One brief (S1, `backend` → codex:gpt-6-astra
  via the tune override), one Claude checkpoint. Baseline harness 154 cases;
  lint clean on `mission/n1-codex-astra` @ 8ddf1d5. Open question 1 (which
  `.plans/runs/` artefacts to commit) goes to the owner before S1 spawns.

Next up: S1
