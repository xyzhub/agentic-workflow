---
description: Close a work session cleanly — verify, commit, update the record, hand off.
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

Complete the current work session (Venture Workflow §4 "Close"). Run before a
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

## 3. Update the record (§6.1)

Spawn the **chronicler** agent with a summary of what landed (PRs, deviations,
incidents, any stage transition). It updates CHANGELOG.md, docs/product/JOURNEY.md,
and docs/product/overview.html — then **republish the status page** via the
Artifact tool to the URL in its `artifact-url` comment.

## 4. Docs & issue

- Conventions file / architecture docs updated if behavior/config changed.
- If the work maps to a tracked issue, comment progress or link the PR.

## 5. Push / hand off

```bash
git push -u origin <branch>
```

Reference `/pre-pr` before opening the PR. **Never merge the default branch** —
that's the human owner's act.

## Output

Summarize: work status · committed? · record updated (+ status-page URL) · docs
current · action items for the human (PR needed, blockers, questions).
