---
description: Run the project's validation gates before opening a PR, then push and create it.
allowed-tools: [Read, Bash, Grep, Glob]
---

Prepare a Pull Request. Use the gates from `docs/AGENT-SESSIONS.md` §10 (project
profile); if that file is absent, infer them from the repo's CI/package scripts.
Report ✅ PASS / ⚠️ WARNING / ❌ BLOCKER for each step.

## Gates

1. **Tests (BLOCKER)** — run the project test gate. Must be green.
2. **Typecheck / lint (BLOCKER if the project treats it as one)** — run it; if the
   project documents pre-existing known failures, only block on ones you introduced.
3. **Build (BLOCKER when release-bound)** — run the build gate.
4. **Clean tree (BLOCKER)** — `git status --short`: no stray uncommitted changes.
5. **Up to date with the default branch** — `git fetch origin -q` then rebase onto
   `origin/<default>`; resolve conflicts locally.
6. **Commit hygiene** — `git log origin/<default>..HEAD --oneline`: all conventional
   (`type(scope): description`), ending with the Co-Authored-By trailer.
7. **Docs current** — the conventions file and any architecture/data-model docs
   updated if behavior/config changed (stale-doc rule).
8. **Live verification** — if the change has a runtime surface, confirm it was
   exercised in a real client (real browser for web UI), not just a status ping.

## If all green

```bash
git push -u origin <branch>
gh pr create --fill    # or a summary + test plan
```

Report the final status and any remaining blockers. Do not merge — the human
owner (HITL) merges the default branch.
