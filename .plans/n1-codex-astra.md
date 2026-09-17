---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: n1-codex-astra — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide. Deploys to `.plans/n1-codex-astra.md`._

Goal: ship the two advisory fixes (A2, A3) from the runtime-agnostic-codex
checkpoint re-review as plugin **1.51.1** — built by the `backend` role on the
Codex runtime (GPT-6 Astra, via the `.claude/agents/backend.md` tune override,
NOT a brief `runtime:` header), verified by a fresh Claude reviewer, with both
vendors' token counts recorded. **This mission IS the n=1** the
`runtime-agnostic-codex` ledger has been waiting on since 2026-09-17.

Estimate: 1 session (the default: one brief, one one-shot review, staging →
verify → PR). No `phases`. The checkpoint reviewer is the one-shot review that
the default mode already includes; a corrective `S1-fix` is counted only if it
fires.

Source of the two findings: `.plans/runtime-agnostic-codex.state.md`
`## Handoff log`, the ckpt-p1 re-review APPROVE entry (SHA 8dd87cd, 2026-09-17):
_"A2 run-codex.mjs:453 `changed_paths` should be the delta vs a pre-spawn `git
status` snapshot; A3 checks.mjs:87 shape fallback should require `status ===
"done"`."_

## Tasks

1. **`changed_paths` is the run's delta, not the whole dirty tree** —
   `plugins/agentic-workflow/tools/run-codex.mjs` snapshots `git status
   --porcelain` in `--cwd` BEFORE spawning codex and reports only paths that
   are new in the after-snapshot or whose porcelain status changed. The
   orchestrator's own pre-spawn ledger edit (`.plans/<m>.state.md`, `Sessions
   used:` write-ahead) therefore never appears as the Codex run's change.
   Acceptance: `tools/run-codex-test.mjs` gains cases asserting (a) a file
   dirtied BEFORE the adapter runs is absent from `changed_paths` and from
   `high_impact_touched`; (b) a file the fake codex writes DURING the run is
   present in both (when it matches the §10 High-impact row); (c) the `failed`
   (non-JSON last message) distillate carries the same delta. Harness case
   count grows from 154. `node tools/lint.mjs` (which runs the harness as
   check 10.7) stays clean. The `--cwd` usage text and the schema's
   `changed_paths` description say "delta vs the pre-spawn snapshot".

2. **The eval's shape-discovery fallback requires `status === "done"`** —
   `evals/scenarios/codex-routing/checks.mjs` `hasCodexDistillate()` currently
   accepts any `*.json` with a string `status` and `runtime.name === "codex"`,
   so a `failed`/`blocked` distillate satisfies the "distillate found" check.
   Acceptance: the predicate is `status === 'done' && runtime.name === 'codex'`;
   the failure message names the tightened shape; a deterministic unit case in
   `tools/run-codex-test.mjs` drives `checks()` with synthetic `events` against
   a throwaway fixture dir and asserts a `failed` distillate → failure reported,
   a `done` distillate → no failure. (No such unit test exists today — see
   locked decision 4.)

3. **Release 1.51.1** — `CHANGELOG.md` gets a `## [1.51.1] — 2026-09-17`
   entry (Fixed) above 1.51.0; `plugins/agentic-workflow/.claude-plugin/plugin.json`
   `version` → `1.51.1` (the §10 Version pin); `docs/WORKFLOW.md` line 3
   `<!-- protocol-master: v1.51.1 -->` (conform reads it against the manifest).
   Acceptance: the three edits are in the diff; lint clean.

4. **n=1 evidence recorded** — after the reviewer returns, the orchestrator
   copies the adapter distillate's `usage` (Astra input/output tokens) and the
   Claude reviewer's usage into the `n=1 real Astra run` row of
   `.plans/runtime-agnostic-codex.state.md` and fires it. Acceptance: that row
   reads `· fired 2026-09-17 (…tokens…)`; this ledger's Closing row `n=1 tokens
   recorded` is `[x]`. (Orchestrator work, not the builder's — see the ledger.)

## Locked decisions

- 2026-09-17 — The builder runs on Codex through the **tune path**:
  `.claude/agents/backend.md` carries `runtime: codex:gpt-6-astra` /
  `effort: medium` (commit 8ddf1d5). The brief carries NO `runtime:` header.
  This is what the n=1 proves; do not add the header to "make sure".
- 2026-09-17 — Spawn shape (protocol §5/§9): the orchestrator runs
  `node <plugin>/tools/run-codex.mjs --role backend --brief
  .plans/n1-codex-astra.sessions.md#S1 --cwd <repo> --out
  .plans/runs/n1-codex-astra-S1.json` in the background with stdin closed
  (§10 Runtimes row: `</dev/null`), reads the distillate FILE, and commits
  `changed_paths` itself. Codex never commits, never pushes, never edits
  `.plans/` (the execpolicy rules and the brief both say so).
- 2026-09-17 — A2 semantics: "delta" = paths present in the after-snapshot
  whose porcelain status line differs from the before-snapshot, or that are
  absent from it. A path the orchestrator dirtied that codex ALSO edits keeps
  the same ` M` status and is NOT reported — accepted residue, documented in a
  code comment (the ledger is the only pre-dirty file in practice, and codex is
  forbidden from touching `.plans/`). Paths that vanished from status (reverted
  to clean) are not reported either — a clean file is not a change.
- 2026-09-17 — A3 unit test lives in `tools/run-codex-test.mjs` (a new group
  that imports `evals/scenarios/codex-routing/checks.mjs` default export), so
  it runs under lint check 10.7 with no new runner. The mission text's claim
  that "the S5-fix added a synthetic-events unit test" was checked: no such
  test exists (S5-fix commit 3ccb0cd changed only checks.mjs + the fixture);
  this mission ADDS the test rather than extending one.
- 2026-09-17 — Version bump + CHANGELOG + protocol stamp are in the brief's
  Do list (the builder's diff), not the checkpoint's: the reviewer verifies
  them from the diff like every other change. Patch footprint mirrors 1.50.1 /
  1.51.0: `CHANGELOG.md`, `plugin.json`, `docs/WORKFLOW.md` line 3.
  `plugins/agentic-workflow/templates/WORKFLOW.md` carries no version stamp.
- 2026-09-17 — Gate policy `human-merge`; §10 Staging = none, so "staging
  verify" is lint green on the branch + `claude --plugin-dir` load in a
  consumer session, then one PR to `main`. Merge is the owner's.
- 2026-09-17 — `.plans/runs/` artefacts: the distillate JSON is committed (it
  is the n=1 evidence); `*.events.jsonl` and `*.raw.txt` are sub-ignored
  (landed in 17d1560 `.gitignore`). Ruled the day the question was raised.
- 2026-09-17 — Harness gate inside the Codex sandbox: `tools/run-codex-test.mjs`
  SKIPs its 68 execpolicy-verdict cases when `codex` is not on PATH (86 + 1
  skipped vs 154 with it). The brief's criterion is therefore zero `FAIL` +
  the named cases `ok` + N ≥ 160 (no skip) or N ≥ 92 (`1 skipped`); the
  reviewer re-runs with `codex` on PATH. (Plan-judge B1.)
- 2026-09-17 — Estimate 1 session. A corrective (`S1-fix`, resumed via the
  distillate's `runtime.thread_id`) is counted when it fires, never pre-booked.
- 2026-09-17 — **Estimate 1 → 2** (owner, overrun scope decision after S1 was blocked by the repo's own `zsh -c|-lc|-ic` execpolicy rule; verbatim: "Continue at revised Estimate 2"). The rule was removed from `templates/codex.rules` + `.codex/rules/agentic-workflow.rules` (5e5138d) after a live probe proved Codex unwraps `/bin/zsh -lc` before matching, so a wrapped `git commit` is still rejected by the git rule. One corrective (`S1-fix`, `--resume` of thread 01a0b0ce-ffc6-7220-97c0-30d7c59de1c3), then the checkpoint.

## Risks

- **Astra breaks the existing e2e harness cases.** Lines 376–386 and 485–487
  of `tools/run-codex-test.mjs` pre-dirty `tools/lint.mjs` + `notes.txt` and
  expect both in `changed_paths`; with the delta fix they will vanish. The brief
  pre-resolves this: the fake codex shim gains a `writes` spec key so the RUN
  makes the edits. → Reviewer checks that no assertion was weakened to pass.
- **Astra runs the real codex / commits / touches `.plans/`.** The rules file
  forbids commit/push; the sandbox is workspace-write; the brief states the
  three prohibitions plainly and the reviewer diff-checks for `.plans/` edits.
  The harness uses the `CODEX_BIN` shim — `node tools/run-codex-test.mjs` is
  the only way the brief invokes the adapter.
- **Schema drift.** `changed_paths` description in
  `templates/distillate.schema.json` is prose only; the schema group asserts
  strict-mode shape, not text — editing the description cannot break it.
- **Distillate not schema-valid on the first try** (the adapter writes
  `status: failed`, exit 1, raw saved beside `--out`). → One corrective via
  `--resume <thread_id> --note "return only the JSON distillate"`, counted as
  `S1-fix`.
- **`.plans/runs/` artefacts.** The adapter writes `<out>.events.jsonl` beside
  the distillate (full JSONL, includes the prompt). Ruled: JSON committed,
  streams sub-ignored (locked decision above).

## Open questions

(none — ruled 2026-09-17: commit the distillate JSON as n=1 evidence; `*.events.jsonl` / `*.raw.txt` gitignored.)
