---
description: Plan and drive a multi-session mission end to end — authors the .plans/ trio (via the planner agent) if needed, then runs it phase by phase with independent checkpoint reviews.
argument-hint: "<mission name or goal>" [plan | run | continue]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

Drive a mission (Venture Workflow §5). `$ARGUMENTS` is the mission name/goal and an
optional mode: `plan` (author the trio and stop), `run` (plan if needed, then
execute), or `continue` (resume from the ledger). Default: `run`.

You are the **orchestrator**. Read only the ledger, briefs, and agent reports —
never source files yourself (the 30% rule). Spawn agents to do the reading and
building.

## 1. Plan (if no trio exists)

If `.plans/<mission>.{md,sessions.md,state.md}` don't exist, spawn the **planner**
agent with the goal. It explores once and writes the trio. Then surface the
master plan's **open questions** to the human and get decisions before executing —
record them as dated locked decisions. In `plan` mode, stop here.

## 2. Run — phase by phase

Read `.plans/<mission>.state.md` → `Next up:`. For each pending brief:

1. Route it to the right agent from the brief (`backend`/`frontend`/`security`/
   `devops`, or the main session for cross-cutting work). Spawn it with the brief;
   it follows the pre-resolved reads and read budget, builds, and verifies gates.
2. On its return: confirm gates are green and the ledger was updated (checkbox,
   handoff entry, `Next up:` advanced). Apply the **one-corrective-retry rule** —
   on failure, re-spawn once with a corrective note; if it fails again, stop and
   surface to the human.
3. **Merge rule**: if a brief finished well under budget and the next brief is in
   the same phase, the same agent may take it; checkpoints always end a session.
4. Parallel-safe phases may run their briefs concurrently (isolated worktrees) —
   only with explicit human okay.

## 3. Checkpoint at each phase end

Spawn the **reviewer** agent (fresh context): it re-runs all gates, diff-reviews
`<base>..<head>`, performs deferred manual/live items, and returns APPROVE or
REQUEST CHANGES.

- **APPROVE** → pause for the **human to merge** the phase branch (never merge the
  default branch yourself; merging often deploys). Then continue to the next phase.
- **REQUEST CHANGES** → one corrective session (`S<n>-fix`), then re-review; if it
  still fails, surface to the human.

## 4. Record & resume

After each brief/checkpoint, spawn the **chronicler** to update the record and
republish the status page. The ledger is ground truth: `continue` mode simply
re-reads `Next up:` and proceeds, losing nothing across interruptions.

## Output

Between phases: the phase completed, review verdict, what the human must merge,
and the next phase. At the end: all phases merged, or exactly where it stopped and
why. Never merge the default branch or deploy — those are the human's.
