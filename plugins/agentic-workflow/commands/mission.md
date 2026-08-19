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
3. **The overrun STOP (LA-1).** When `Sessions used` reaches **1.5× the
   estimate** the hook prints 🛑 OVERRUN on every prompt. You MUST NOT start
   another brief. Give the owner the scope decision — (a) ship a defined subset
   now, (b) continue at a revised estimate, (c) abort — with the remaining
   phases and what each one buys; ask via AskUserQuestion / the owner channel
   (§12). Record the answer as a dated locked decision in the master plan and
   update `Estimate:`. Continuing silently is not a neutral default; it spends
   the owner's money on a plan they approved under different numbers.
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
5. **Write the ledger at every merge and every gate result (LA-6)** — not at
   session end. You have no session boundary to force a write-ahead; a
   compaction can erase everything since the last write. After each merge to
   staging, each verify result, each review verdict, each PR opened: write the
   handoff entry, flip the glyph, advance `Next up:`, then continue.
6. **Exactly one `Next up:` line (LA-7).** Superseding it means **renaming the
   old line** (`SUPERSEDED next-up (historical, do NOT read as state):`) —
   never leaving a second `Next up:` that still parses; the hook reads the
   first and warns on duplicates.
7. **Model tiering stays** (Fable for money/schema-critical one-shot reviews and
   audits, opus builders) — the saving is in *shape* (one-shot, at decision
   points), not in the tier.

## 1. Plan (if no trio exists)

If `.plans/<mission>.{md,sessions.md,state.md}` don't exist, spawn the **planner**
agent with the goal and the mode (`phases` or not). (For a feature that still
needs DEFINING — scope, journeys, shape decisions — `/agentic-workflow:plan` is
the interview-driven front door that ends here with everything locked.) It
explores once and writes the trio, including `Estimate:` and `Sessions used: 0`
in the ledger header — and `Issue: #N` when the goal names a queue item (§4);
the PR body then carries `Closes #N` so the merge closes it, and the reviewer
reads the issue as the acceptance criteria. **Converting an existing plan**: if the goal names a plan
document (a PLAN.md, migration doc, ticket export), pass it to the planner as
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
2. Route it to the right agent from the brief (`backend`/`frontend`/`security`/
   `devops`, or the main session for cross-cutting work). Spawn it with the
   brief; it follows the pre-resolved reads and read budget, builds, and
   verifies gates. Design-quality tooling (impeccable, §0.2) runs **once** before
   the builder's hand-off and its findings are **reported, not looped on** — the
   reviewer decides at the checkpoint which are blocking.
3. On its return: confirm gates are green and the ledger was updated (the row
   marked `[x]` when verified — or `[~]` if it is parked/awaiting you, never left
   `[ ]` once picked up — handoff entry, `Next up:` advanced). Apply the
   **one-corrective-retry rule** — on failure, re-spawn once with a corrective
   note (that is a session: increment); if it fails again, stop and surface to
   the human.
4. **Merge rule**: if a brief finished well under budget and the next brief is
   in the same phase, the same agent may take it; checkpoints always end a
   session.
5. Parallel-safe phases may run their briefs concurrently (isolated worktrees) —
   only with explicit human okay.

## 3. Checkpoint at each phase end (the only phase end, without `phases`)

Spawn the **reviewer** agent (fresh context, one-shot): it re-runs all gates,
diff-reviews `<base>..<head>`, performs deferred manual/live items, runs the
design detector once if the diff touches UI (§0.2) and classifies its findings
blocking/advisory, and returns APPROVE or REQUEST CHANGES plus a scorecard
(per-lens 0–3, diff-touched lenses only at routine checkpoints — see §5).
Include the scorecard in the ledger handoff entry. Only **blocking** findings
may cause REQUEST CHANGES; advisory findings ride into the ledger as a backlog
line.

Mark the checkpoint row `[~]` when you spawn the reviewer (in-flight), and flip
it to `[x]` on APPROVE — or leave `[~]` if it is APPROVE-but-merge-pending. The
beat-enforcer keys on the glyph (`[ ]` not started → it may nudge; `[~]`/`[x]`
→ silent), so keeping marks current stops it nudging about work already in hand.

**Capture standing steers here.** If the human says anything at the checkpoint
about *how* the work should be done — taste, tone, what to stop doing — append
it **verbatim** to the ledger's `## Standing steers` block, tagged with this
checkpoint's id: `- YYYY-MM-DD (ckpt <id>) — "<exact words>"`. Quote, never
paraphrase; retire a superseded steer by strikethrough, never delete it. This
happens **only at a checkpoint** — never mid-brief, and never for your own
inferences.

- **APPROVE → staging → verify → PR to main.** The venture flow (§5, §7):
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
     policy** is `agent-may-merge`, in which case you may merge the APPROVEd PR
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
between — the ledger is written first; then spawn the **chronicler** to update
the record and republish the status page via the Artifact tool (subagents
cannot publish). The ledger is ground truth — and the ledger **at origin** is the state when
more than one machine can drive (§5 hand-off): `continue` mode pulls first,
then re-reads
`Next up:` **and the `## Standing steers` block** (steers bind every session
that follows the checkpoint that captured them), increments `Sessions used:`,
and proceeds, losing nothing across interruptions.

**Loop mode**: long missions run well as a recurring loop —
`/loop /mission "<name>" continue`, or a scheduled agent. When invoked as a
loop tick, execute exactly ONE brief or checkpoint, update the ledger, and
end; don't try to finish the mission in a tick. Each tick is a session for the
budget (increment). A `/loop` tick does NOT reset the context window —
`/loop` is session-scoped, and ticks accrete in the same transcript; genuine
fresh context requires `/clear`, a new session, or a scripted `claude -p`.
What makes loop mode safe is that **state lives in files**: any tick can be
run from a fresh context without losing anything, and a crashed tick loses
nothing. The overrun STOP applies to loop ticks exactly as to interactive runs.

## 5. Close the mission

The run that would report the mission done goes through the close gate — the
checklist is the authority, and "zero open PRs" is not a completeness signal.
Read the ledger's `## Closing` block and run `/agentic-workflow:settle` as the
close step: it probes each row's condition, fires the safe class, and refuses
the close while any `[ ]` row remains. Fire (`[x]` + dated evidence) or promote
(`[~] … → OB-<n>`, with the verbatim copy landed in `.plans/OBLIGATIONS.md`)
every row, then — and only then — write the `Closed: YYYY-MM-DD` stamp (the
lint backstop vetoes a stamp over an open row). Record the final
`Sessions used:` against `Estimate:` in the closing handoff entry — that ratio
is the retro's first number. Branch reaping usually outlives the mission: the
phase branches' delete condition (the human's merge concluded green) post-dates
the close, so it parks as a `## Closing` row and fires at a later
`/agentic-workflow:settle` run — never forced at close.

## Output

Between phases: the phase completed, review verdict, staging SHA + verify
result, what the human must merge, sessions used vs estimate, and the next
phase. At the end: all phases merged, or exactly where it stopped and why.
Never merge the default branch or deploy to production — those are the human's.
