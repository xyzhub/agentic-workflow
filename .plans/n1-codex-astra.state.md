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

Estimate: 2 sessions
Sessions used: 2

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

- [~] S1 — changed_paths delta + strict distillate discovery, shipped as 1.51.1 (branch `mission/n1-codex-astra`, runtime codex:gpt-6-astra via tune)
- [ ] Checkpoint — ONE fresh one-shot Claude `reviewer` (Fable) over `587aee6..HEAD`; then lint-on-branch + plugin-dir load, PR to `main`, owner merges

## Open questions

_Mirrored from the master plan with their recommendations. Empty once the
human has answered them all._

(none — the `.plans/runs/` question was ruled 2026-09-17: commit the
distillate JSON, ignore `*.events.jsonl` / `*.raw.txt`; landed in 17d1560
`.gitignore`)

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
- [ ] live-verify after reinstall · added 2026-09-17 (planner) — do: confirm in a real session that a codex run's distillate `changed_paths` omits the orchestrator's pre-spawn ledger edit — when: the 1.51.1 release is installed (`/plugin update` + `/reload-plugins`, post-merge) and the next codex-routed brief returns — probe: manual _(cannot fire before the next codex brief after merge; expect `/agentic-workflow:settle` to park it `[~] … → OB-<n>`)_
- [ ] version bumped + stamped · added 2026-09-17 (planner) — do: bump `plugins/agentic-workflow/.claude-plugin/plugin.json` to 1.51.1 (the §10 Version pin), stamp `docs/WORKFLOW.md` line 3 `protocol-master: v1.51.1`, and stamp this mission's CHANGELOG entry with 1.51.1 (all three are in the S1 brief's Do list; verify them in the diff) — when: this mission's CHANGELOG entry names a version — probe: manual
- [ ] n=1 tokens recorded · added 2026-09-17 (planner) — do: copy the adapter distillate's `usage` (Astra `input_tokens`/`output_tokens` from `.plans/runs/n1-codex-astra-S1.json`) and the Claude reviewer's usage into the `n=1 real Astra run` row of `.plans/runtime-agnostic-codex.state.md` as its `· fired 2026-09-17 (…)` evidence, and note the outcome (APPROVE/REVISE, corrective count) beside it — when: the checkpoint reviewer returns — probe: manual

## Deviations

_Any departure from a brief — logged the moment it happens, with why._

(none)

## Handoff log- 2026-09-17 orchestrator (write-ahead + gate spawn): plan-judge (Fable) REVISE →
  planner revised once (B1 harness-count criterion; A1–A3, A5) — no second
  judge pass (protocol). **S1 started on codex:gpt-6-astra** via the backend
  tune: `run-codex.mjs --role backend --brief .plans/n1-codex-astra.sessions.md#S1
  --model gpt-6-astra --effort medium`, background, stdin closed, distillate →
  `.plans/runs/n1-codex-astra-S1.json`. Sessions used 0 → 1. **S1 BLOCKED** (adapter
  exit 0 — adapter bug: blocked must exit 3): Astra read the brief + pre-resolved
  files (3 read commands completed), then its single edit-and-test command
  (`python3 - <<PY … PY; node tools/run-codex-test.mjs`) was REJECTED by OUR OWN
  rule `["zsh",["-c","-lc","-ic"]]` — Codex wraps every command as
  `/bin/zsh -lc` and normalises `/bin/zsh` → `zsh` for matching; read-only
  commands passed via Codex's safe-command path, the write path hit the policy.
  No file changed. Astra usage: 156,072 in / 3,193 out (thread
  01a0b0ce-ffc6-7220-97c0-30d7c59de1c3). Gates skipped by the run; orchestrator
  re-ran: harness 154 clean, lint clean (tree unchanged). Owner scope decision
  2026-09-17: "Continue at revised Estimate 2" — Estimate 1 → 2 (locked in the
  master plan). Rules fix committed 5e5138d (zsh wrapper rule dropped; live probe
  on Sol proved the runtime unwraps `-lc`, wrapped `git commit` still rejected;
  harness 147 clean, lint clean).
- 2026-09-17 orchestrator (write-ahead + gate spawn): **S1-fix** started —
  `run-codex.mjs --resume 01a0b0ce-ffc6-7220-97c0-30d7c59de1c3 --note "<rule fixed,
  proceed>"` on codex:gpt-6-astra, background, distillate →
  `.plans/runs/n1-codex-astra-S1-fix.json`. Sessions used 1 → 2. Result pending.

 (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs._

- 2026-09-17 planner: trio written. One brief (S1, `backend` → codex:gpt-6-astra
  via the tune override), one Claude checkpoint. Baseline harness 154 cases;
  lint clean on `mission/n1-codex-astra` @ 8ddf1d5. `.plans/runs/` artefact
  question ruled the same day (17d1560). Plan-judge REVISE (B1 harness skip
  criterion, A1 line drift, A2 codex-rule wording, A3/A5 ledger) applied.

Next up: S1-fix — corrective on codex:gpt-6-astra (resume thread) after the zsh rule fix; then the checkpoint
