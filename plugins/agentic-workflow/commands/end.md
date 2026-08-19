---
description: Close a work session cleanly — verify, commit, update the record, hand off.
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, Artifact, SlashCommand]
---

Complete the current work session (Agentic Workflow §4 "Close"). Run before a
context switch or session end.

## 1. Status

```bash
git status --short
git log origin/<default>..HEAD --oneline
```

Classify: **Complete** (ready for PR) · **In progress** (safe stopping point) ·
**Blocked**.

## 2. Gates green, then commit

Run the project gates (§10). Fix or revert to green before committing. Then:

```bash
git add -A
git commit -m "type(scope): description"   # end with the Co-Authored-By trailer
```

For a mission session use `<mission>(S<n>): summary` and update the ledger
(`.plans/<mission>.state.md`): tick the checkbox, write the handoff entry (≤10
lines, newest first), set `Next up:`.

## 3. Finishing a mission? The close gate

If this session ticks the mission's **last** checklist row — the run that would
report the mission done — the close falls through to the settle close-gate
before anything is reported: read the ledger's `## Closing` block.

- Any `[ ]` obligation row → the mission may **NOT** be reported closed. Run
  `/agentic-workflow:settle` — it probes each row's condition, fires what is
  condition-met, and refuses the close otherwise. Fire (`[x]` +
  `· fired YYYY-MM-DD (<evidence>)`) or promote (`[~] … → OB-<n>`, with the
  verbatim copy landed in `.plans/OBLIGATIONS.md`) every row. The checklist is
  the authority — "zero open PRs" is not a completeness signal.
- Only when no `[ ]` row remains, write the `Closed: YYYY-MM-DD` stamp (the
  lint backstop vetoes a stamp over an open row).

Ordinary (non-finishing) sessions skip this step.

## 4. Update the record (§6.1)

Spawn the **chronicler** agent with a summary of what landed (PRs, deviations,
incidents, any stage transition). It updates CHANGELOG.md, docs/product/JOURNEY.md,
and docs/product/overview.html — then **republish the status page** via the
Artifact tool to the URL in its `artifact-url` comment.

## 5. Docs & issue

- Conventions file / architecture docs updated if behavior/config changed.
- If the work maps to a tracked issue, comment progress or link the PR
  (`Closes #N` in the PR body when it finishes the item). When §10 records an
  Issue tracker and this session's work maps to nothing in the queue, file the
  issue now (`gh issue create`) so the queue stays the one place work waits (§4)
  — hand-off notes are not a backlog.
- Scratchpad guardrails: any `*.sh`/`*.mjs`/`*.py` written this session under
  the scratchpad that guards something (a runner, a check, a probe) is committed
  now or deliberately dropped — never left to evaporate (§12 LA-4).

## 6. Push / hand off

```bash
git push -u origin <branch>
```

Run `/agentic-workflow:pr` before opening the PR (no remote yet → it says so; skip the
push). **Never merge the default branch** — that's the human owner's act.

## Output

Summarize: work status · committed? · record updated (+ status-page URL) · docs
current · action items for the human (PR needed, blockers, questions).
