---
description: Plan and drive a mission end to end — one session and one review by default; opt into phases with an explicit session estimate and a hard overrun stop; every phase lands via staging → verify → PR to main.
argument-hint: '"<mission name or goal>" [plan | run | continue | replan] [phases] [gate: human-merge | batch]'
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, Artifact, AskUserQuestion]
---

Drive a mission (Agentic Workflow §5). `$ARGUMENTS` is the mission name/goal, an
optional mode: `plan` (author the trio and stop), `run` (plan if needed, then
execute), `continue` (resume from the ledger), or `replan` (re-evaluate an
existing trio against current reality); an optional **`phases`** flag (opt into
a multi-phase mission — without it a mission is ONE session and ONE review); and
an optional **gate policy**: `human-merge` (default) or `batch` (§5 — used by
`/agentic-workflow:autopilot` under a "only hard gates" flight plan). Record the
gate policy in the ledger at mission start.

You are the **orchestrator**. Read only the ledger, briefs, and agent reports —
never source files yourself (the 30% rule). Spawn agents to do the reading and
building.

## 0. The convergence rules (read every run — §5)

These exist because of measured incidents (orderly `docs/WORKFLOW.md §12`
LA-1, LA-5, LA-6, LA-7 — 2026-08): a mission planned at 18 sessions ran 44 over
28 hours with no scope decision offered; a standing supervisor cost ~1.08M
tokens for six beats against 70k for the one-shot review that found the real
defects; three merges and a gate went unrecorded and a compaction erased them.

1. **One session, one review, by default.** Without `phases`, the planner writes
   a single brief (`Estimate: 1 session`), one builder session runs it, one
   fresh reviewer verifies it, and it ships via staging → verify → PR. If the
   goal genuinely needs more, the planner says so and you ask the human to
   re-run with `phases` — you do not silently grow a one-session mission.
2. **Estimate + session count are ledger fields, and the budget hook reads
   them.** The ledger header carries `Estimate: N sessions` (planner) and
   `Sessions used: k` (you). **Increment `Sessions used:` the moment you start
   a brief, a corrective `S<n>-fix`, or a `continue` tick** — before spawning,
   write-ahead. The mission-budget hook (§3) prints `session k/N` every turn.
3. **The overrun STOP (LA-1).**
   <!-- rule-copy: overrun-1.5x -->
   At **k ≥ 1.5 × N** the hook prints 🛑 OVERRUN on every prompt and the
   orchestrator MUST NOT start another brief: it gives the owner the scope
   decision — ship a defined subset now / continue at a revised estimate / abort —
   with the remaining phases and what each buys, records the answer as a dated
   locked decision, and only then revises `Estimate:`.
   <!-- /rule-copy -->
   Ask via AskUserQuestion / the owner channel (§12). Continuing silently is not
   a neutral default; it spends the owner's money on a plan they approved under
   different numbers.
4. **No standing agents (LA-5).** Every review, counsel, or supervision is a
   **one-shot spawn at a decision point** — a checkpoint, a merge, a gate
   verdict, a scope change. A resident/supervisor agent that is resumed over
   its own transcript costs more on every beat for the life of the mission.
   One is allowed only when the ledger carries an explicit owner line
   authorizing it (`Standing agent authorized: <role> — <date> — "<owner's
   words>"`), it is beaten on **decisions only** (never on routine
   notifications), and its running cost is re-quoted to the owner in the ledger
   every ~3 beats and killed the moment its remit ends. The reviewer flags any
   standing agent without that line.
5. **Write the ledger at every merge, every gate result, AND every gate
   spawn (LA-6)** — not at session end. A long review's START is a recordable
   beat: from outside, an unrecorded 13-minute Fable pass is indistinguishable
   from a stall (observed live, 2026-08-19 — a watcher read a running
   pre-promote gate as possible rot). One line at spawn — what was spawned, on
   what range, when — then the verdict when it returns. You have no session boundary to force a write-ahead; a
   compaction can erase everything since the last write. After each merge to
   staging, each verify result, each review verdict, each PR opened: write the
   handoff entry, flip the glyph, advance `Next up:`, then continue — one line
   per beat: `node ${CLAUDE_PLUGIN_ROOT}/tools/ledger.mjs <mission>
   mark|fire|promote|handoff|next-up|sessions|close … [--commit]` (#132).
6b. **Closing keywords live in the PR-to-`main` body, never in a commit message
   or a staging-PR body** — a commit's `Closes #N` fires whenever the commit
   reaches the default branch (the promote carries it), closing the issue
   done-or-not (orderly #605). Commits reference an issue with `(#N)`; the close
   is a reviewed decision at the PR to the default branch. The guardrail hook
   blocks a closing keyword in a commit message.
6. **Exactly one `Next up:` line (LA-7)** — keep one, never a second that still
   parses (§5 LA-7).
7. **Model tiering stays; the reviewer tier keys on RISK CLASS, not diff size**
   (opus builders; Fable for boundary-class reviews — §5 LA-5; the plan-judge
   runs on Fable under every preset). The saving is in *shape* (one-shot, at
   decision points), not the tier; diff size never lowers the tier
   (orderly #605→#730) — unless `.claude/agents/reviewer.md` carries
   `boundary_escalation: off` (#91): then any non-Fable reviewer tune takes
   boundary diffs and flags a miscalled tier as a process finding.

## 1. Plan (if no trio exists)

If `.plans/<mission>.{md,sessions.md,state.md}` don't exist, spawn the **planner**
agent with the goal and the mode (`phases` or not). (A feature that still needs
defining enters via `/agentic-workflow:plan`, which ends here.) It
explores once and writes the trio, including `Estimate:` and `Sessions used: 0`
in the ledger header — and `Issue: #N` when the goal names a queue item (§4);
the PR body then carries one `Closes #N` line per issue (GitHub closes only
the first number after a keyword, so never `Closes #91, #92`) so the merge closes them, and the reviewer
reads the issue as the acceptance criteria.

**Plan-judge (automatic, before any brief spends a session).** As soon as the
planner returns the trio — in `plan` mode and on every `replan` — spawn a
**fresh, read-only, one-shot `reviewer` in plan-judge mode** (§5) over the trio.
It returns **APPROVE** or
**REVISE** with per-brief findings (≤ one page). APPROVE → carry on and surface
the open questions as below. REVISE → hand the findings to the planner, which
revises **once**; a **second REVISE surfaces to the owner** (the plan is wrong
about something only they can settle).

**Converting an existing plan**: if the goal names a plan
document (a PLAN.md, a ticket export), pass it to the planner as
source material — its decisions become locked decisions, not things to
re-litigate. Then surface the master plan's **open questions** to the human and
get decisions before executing — route the technical ones through the
`architect` for an options memo first, so the human picks between digested
options; ask via AskUserQuestion where available; record answers as dated locked
decisions. In `plan` mode, stop here.

**`replan` mode** — re-evaluate an existing trio instead of executing: spawn the
planner in re-evaluation mode. It reconciles the ledger against git reality,
re-resolves only the pending briefs (completed work is history), keeps locked
decisions locked (invalidated ones come back as open questions, unlocking is the
human's call), re-estimates the remaining sessions (`Estimate:` may go up only
as a dated locked decision), and appends a dated `Replan` entry to the master
plan. Surface the resulting open questions to the human, then stop — resuming
is an explicit `continue`. Use after a long pause, after significant unplanned
changes landed, when `/agentic-workflow:check` shows ledger drift, or as the
outcome of an overrun scope decision.

## 2. Run — brief by brief

Read `.plans/<mission>.state.md` → `Next up:`. For each pending brief:

1. **Write-ahead**: increment `Sessions used:` and mark the row `[~]`.
2. **Resolve the runtime, then spawn.** Precedence (locked): the brief's
   `runtime:` header field → a `.claude/agents/<role>.md` tune override
   (`runtime: codex[:<model>]` or `claude-p`, `effort:`) → the default `claude`. Route to the
   right agent from the brief (`backend`/`frontend`/`security`/`devops`, or the
   main session for cross-cutting work) and spawn it on the resolved runtime:
   - **`claude`** (the default): the **Agent tool**, as now. When the resolved tune carries `effort:` (#94),
     pass the Agent tool's effort parameter where the harness exposes one; where
     it does not, prepend `Effort: <level>.` as the first line of the spawn
     prompt. The tune's report says which applied.
   - **`codex`** / **`claude-p`** (a preset's Haiku row): `node
     ${CLAUDE_PLUGIN_ROOT}/tools/run-codex.mjs` / `run-claude.mjs` `--role <role>
     --brief <file>#<anchor> --cwd <repo> --out <distillate.json> [--model <m>]
     [--effort <level>]` (`claude-p` adds `--preset <name>`) via the **Bash tool
     with `run_in_background: true`**; read the distillate **FILE** named by
     `--out` — **never stdout** (a raw event stream). Prompt, permissions and
     guardrail parity are the adapter's job (§9); never `--ignore-rules`.
   A brief may also carry an optional `executor: <name>` header field that pins
   its remote gates to one §10.1 executor (resolution in step 3, Remote gates).
   Either way it follows the pre-resolved reads and read budget, builds, and
   verifies gates. Design-quality tooling (impeccable, §0.2) runs **once** before
   the builder's hand-off and its findings are **reported, not looped on** — the
   reviewer decides at the checkpoint which are blocking.
3. On its return: confirm gates are green and the ledger was updated (the row
   marked `[x]` when verified — or `[~]` if it is parked/awaiting you, never left
   `[ ]` once picked up — handoff entry, `Next up:` advanced). Apply the
   **one-corrective-retry rule** (§5): on failure, retry once (that is a session —
   increment `Sessions used:`); a second failure stops and surfaces to the owner.
   A `claude-p` `blocked` whose `blocked_reason` starts `budget:` is re-spawned
   **once** on its preset row's `fallback` via the Agent tool — that IS the
   corrective retry; a second block surfaces.
   Status `deviation` (a dated locked decision blocks the brief) → the owner
   directly (AskUserQuestion / §12), no corrective retry, no `Sessions used:`
   increment; "build anyway" lands as an `Assumed` locked decision and
   the brief resumes.
4. **Merge rule**: if a brief finished well under budget and the next brief is
   in the same phase, the same agent may take it; checkpoints always end a
   session.
5. Parallel-safe phases may run their briefs concurrently (isolated worktrees) —
   only with explicit human okay.

**Foreign runtimes (`codex`, `claude-p`) — you own the ledger and git.** The
run touches **neither `.plans/` nor git history**. On return: mark the row from
the distillate's `status` (exit `0` done · `3` blocked · `1` failed) and
**commit its `changed_paths` yourself** (`type(scope): …`). The corrective
retry re-spawns the adapter with `--resume <thread_id> --note "<corrective>"`,
then stop and surface; no other vendor fallback. A `blocked_reason` starting
`deviation:` takes step 3's `deviation` route. `changed_paths` **empty on
`done` is suspicious**: mark `[~]`, get reviewer confirmation before `[x]`.

**Reviewer tier survives the runtime switch and the preset.** Any non-Fable
`reviewer` tune (a `codex` runtime, a preset's Opus gate) covers
**ROUTINE checkpoints only**; when the diff is boundary-class (§5 LA-5),
**including the rules file `.codex/rules/agentic-workflow.rules` and the
adapter's sandbox-flag derivation**, you **override the tune and spawn the
Claude `reviewer` on Fable** — unless `.claude/agents/reviewer.md` carries
`boundary_escalation: off` (#91): then the tuned reviewer takes the boundary
diff and the orchestrator's choice stands. A miscalled tier is a
reviewer process finding either way.

## 3. Checkpoint at each phase end (the only phase end, without `phases`)

**Remote gates (§10.1).** When a gate runs on a remote executor, resolve WHERE
in this order: the brief's `executor: <name>` pin → the first healthy executor
carrying the gate row's `→ executor:<label>` → the `default` executor → local.
Probe each candidate with `ssh -o BatchMode=yes <alias> true` first; on failure
fall to the next matching executor and log the switch in the ledger's
Deviations (LA-8 holds: pushed branch tip only, never a dirty tree). If no
matching executor is healthy, **block** with a plain reason — never report the
gate green. Each mission checks out its own `<path>/.worktrees/<mission>` so
concurrent missions don't share a working tree. A project with only the legacy
single **Remote executor** row needs no change — it resolves as `default`.

**Pre-merge Closing pass (first).** Probe every `## Closing` row marked
`(…, pre-merge)`; tick each that passes (`[x]` + `· fired YYYY-MM-DD
(<evidence>)`) on the phase branch and write the ledger. The reviewer
re-verifies them. A pre-merge row whose probe fails is surfaced as a REQUEST
CHANGES-class finding — never silently reclassified as post-merge.

Spawn the **reviewer** agent (fresh context, one-shot): it re-runs all gates,
diff-reviews `<base>..<head>`, performs deferred manual/live items, runs the
design detector once if the diff touches UI (§0.2) and classifies its findings
blocking/advisory, and returns APPROVE or REQUEST CHANGES plus a scorecard
(per-lens 0–3, diff-touched lenses only at routine checkpoints — see §5).
Include the scorecard in the ledger handoff entry. Only **blocking** findings
may cause REQUEST CHANGES; advisory findings ride into the ledger as a backlog
line.

Mark the checkpoint row `[~]` when you spawn the reviewer, `[x]` on APPROVE —
or leave `[~]` if APPROVE-but-merge-pending; the beat-enforcer nudges `[ ]`
rows only (and not one whose `when:` gate is unmet, #131).

**Capture standing steers here.** If the human says anything at the checkpoint
about *how* the work should be done — taste, tone, what to stop doing — append
it **verbatim** to the ledger's `## Standing steers` block, tagged with this
checkpoint's id: `- YYYY-MM-DD (ckpt <id>) — "<exact words>"`. Quote, never
paraphrase; retire a superseded steer by strikethrough, never delete it. This
happens **only at a checkpoint** — never mid-brief, and never for your own
inferences.

- **APPROVE → staging → verify → PR to main.** The venture flow (§5, §7) —
  EXCEPT a Lane-A hotfix branched from the default branch while staging has
  diverged: skip the staging landing, verify on a preview/branch deploy or a
  local real-client run against a scratch datastore, record the deviation +
  verification target, and go straight to the PR (§5 Hotfix path):
  1. Merge the phase branch into **`staging`** (create it from the default
     branch if the project has none, and record it in §10 as the staging
     branch). This merge is yours: it is not the default branch, so the push
     guardrail allows it, and it is logged in the ledger with the staging SHA.
  2. Wait for the staging deploy to conclude green (§10 **Deploy + live-verify**
     row): `node tools/ci-wait.mjs <staging-sha>` run in the **background**
     (`run_in_background` — zero tokens while waiting; exit 0 = every run for
     the diff-bearing commit concluded green, and NO-RUNS/EXPECT-MISSING are
     failures, never green — §12 LA-8; a PR-level check summary is not
     evidence), then run
     `/agentic-workflow:verify` against the **staging URL** from §10. Record the
     verify result in the ledger. A red verify is a REQUEST CHANGES: one
     corrective session, then re-review.
  3. Only then open (or update) the **PR to the default branch** from the
     staging state, and apply the gate policy: `human-merge` (default) — pause
     for the **human to merge** (never merge the default branch yourself;
     merging often deploys to production) — unless the project's §10 **Merge
     policy** is `agent-may-merge` (fully, or `records-only` — then only a PR
     whose every file is a record path, which the hook checks from the PR's
     file list), in which case you may merge the APPROVEd PR
     yourself (`gh pr merge`; the guardrail hook checks the policy) and log
     it. `batch` — the phase already sits on `staging`; the human merges
     staging → default once, at the batched end-of-mission confirmation.
- **REQUEST CHANGES** → one corrective session (`S<n>-fix`, increment
  `Sessions used:`), then re-review; if it still fails, surface to the human.
- **Surfacing** (both branches): when an owner channel is configured (§12),
  send the gate-tier notification — merge waits carry the PR link (the human
  merges where it lives); escalations and open questions carry decision
  buttons bound to the pending-gate id.

## 4. Record & resume

After each brief/checkpoint — and, per rule 5, at every merge and gate result in
between — the ledger is written first. **No between-phase record pass**: the
chronicler runs ONCE at mission close and the main session republishes the
status page then (subagents cannot publish); the ledger, PR body and owner
report carry the state in between (#133). Republish earlier only with no owner
channel (§12) AND a mission spanning more than a day. The ledger is ground truth — and the ledger **at origin** is the state when
more than one machine can drive (§5 hand-off): `continue` mode pulls first,
then re-reads
`Next up:` **and the `## Standing steers` block** (steers bind every session
that follows the checkpoint that captured them), increments `Sessions used:`,
and proceeds, losing nothing across interruptions.

**Loop mode**: long missions run well as a recurring loop —
`/loop /mission "<name>" continue`, or a scheduled agent. When invoked as a
loop tick, execute exactly ONE brief or checkpoint, update the ledger, and
end; don't try to finish the mission in a tick. Each tick is a session for the
budget (increment). A `/loop` tick does NOT reset context (ticks accrete in
one transcript); fresh context needs `/clear`, a new session, or a scripted
`claude -p`. **State lives in files**: any tick runs from fresh context and a
crashed tick loses nothing. The overrun STOP applies to loop ticks exactly as to
interactive runs; 🛑 TICK BUDGET ends the tick with no new brief (§5 Loop mode).
YOU write `Tick tokens:`/`Mission budget:` after each brief from the Agent
result's usage, or a `codex`/`claude-p` distillate's `usage` input + output.

## 5. Close the mission

The run that would report the mission done goes through the close gate — the
checklist is the authority, and "zero open PRs" is not a completeness signal.
Read the ledger's `## Closing` block and run `/agentic-workflow:settle` as the
close step: it probes each row's condition, fires the safe class, and refuses
the close while any `[ ]` row remains. Fire (`[x]` + dated evidence) or promote
(`[~] … → OB-<n>`, with the verbatim copy landed in `.plans/OBLIGATIONS.md`)
every row, then — and only then — write the `Closed: YYYY-MM-DD` stamp
(`ledger.mjs <mission> close` refuses it over an open row; the
lint backstop vetoes a stamp over an open row). Record the final
`Sessions used:` against `Estimate:` in the closing handoff entry — that ratio
is the retro's first number. Branch reaping usually outlives the mission: the
phase branches' delete condition (the human's merge concluded green) post-dates
the close, so it parks as a `## Closing` row and fires at a later
`/agentic-workflow:settle` run — never forced at close.

**One bookkeeping PR per close (L1).** After the feature PR merges, every
post-merge record edit rides ONE branch and ONE PR:

1. `git fetch origin`; if `gh pr list --head chore/<mission>-bookkeeping
   --state open --json number` returns a PR, reuse that branch; else
   `git switch -c chore/<mission>-bookkeeping origin/<default>`.
2. Commit every post-merge record edit there — the settle fire-back,
   promotions, the `Closed:` stamp, the chronicler's JOURNEY/overview update,
   the handoff. Open ONE PR, `chore(<mission>): post-merge bookkeeping`.
3. When the ledger is stamped (or the session ends): `node tools/ci-wait.mjs
   <sha>` green → merge it by its NUMBER with `--squash --delete-branch
   --match-head-commit <head sha>` (the hook re-reads the PR's file list and
   head; a BLOCK means leave it open and report it).

Never a PR per step. `Sessions used:` does not increment for the close.

## Output

_Owner-facing — write it under the `plain-report` skill (§6.0): the action or the state first, every id defined, plain words, no internal shorthand._

Between phases: the phase completed, review verdict, staging SHA + verify
result, what the human must merge, sessions used vs estimate, and the next
phase. At the end: all phases merged, or exactly where it stopped and why.
Never merge the default branch or deploy to production — those are the human's.
