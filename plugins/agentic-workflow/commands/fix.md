---
description: Task-altitude fast path for a small, isolated fix.
argument-hint: [issue-or-description]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task]
---

Streamlined flow for a small, isolated fix (Task altitude, §1). If the change
turns out to touch multiple areas or needs its own tests-plus-design, stop and
escalate to a full session.

1. **Branch** — `git checkout -b fix/<short-description>` off an up-to-date
   default branch (never commit on the default branch). If the argument is an
   issue number (`#N`) or the fix maps to a queue item, read the issue first —
   it is the acceptance criteria — and reference it in the branch/PR
   (`fix/N-<desc>`, `Closes #N` in the PR body so the merge closes it).
2. **Fix — the root-cause loop**, one beat at a time:
   - reproduce deterministically first (a failing command, test, or request —
     no reproduction, no fix);
   - one falsifiable hypothesis at a time; a change that doesn't move the
     reproduction is refuted — discard it, don't stack it;
   - fix the cause, not the symptom (a guard around the crash site is not a fix);
   - regression test: red against the old code, green against the fix;
   - sibling hunt — grep for the same bad assumption elsewhere and fix or file
     each sibling;
   - if the cause is a bad decision rather than a bug, say so and route it to
     the `architect` (an options memo), not a patch.
3. **Verify** — the regression test went red then green; run the project test
   gate (and typecheck if the fix could affect types); for a runtime-surface
   fix, confirm it in a real client.
4. **Commit + PR** — `type(scope): description` with the Co-Authored-By trailer;
   push; `gh pr create --fill`.
5. **Record** — a Task-altitude change updates `CHANGELOG.md` only (spawn the
   chronicler or add the line directly); JOURNEY and the status page move on
   sessions/checkpoints, not quick fixes.

Do not merge — the human owner merges the default branch.
