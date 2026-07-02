---
description: Task-altitude fast path for a small, isolated fix.
argument-hint: [issue-or-description]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

Streamlined flow for a small, isolated fix (Task altitude, §1). If the change
turns out to touch multiple areas or needs its own tests-plus-design, stop and
escalate to a full session.

1. **Branch** — `git checkout -b fix/<short-description>` off an up-to-date
   default branch (never commit on the default branch).
2. **Fix** — the smallest change that resolves it; add or adjust a test if the
   behavior is testable.
3. **Verify** — run the project test gate (and typecheck if the fix could affect
   types); for a runtime-surface fix, confirm it in a real client.
4. **Commit + PR** — `type(scope): description` with the Co-Authored-By trailer;
   push; `gh pr create --fill`.
5. **Record** — a Task-altitude change updates `CHANGELOG.md` only (spawn the
   chronicler or add the line directly); JOURNEY and the status page move on
   sessions/checkpoints, not quick fixes.

Do not merge — the human owner merges the default branch.
