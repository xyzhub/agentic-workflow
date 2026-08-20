---
description: Run the project's validation gates before opening a PR, then push and create it.
allowed-tools: [Read, Bash, Grep, Glob]
---

Prepare a Pull Request. Use the gates from `docs/WORKFLOW.md` §10 (project
profile); if that file is absent, infer them from the repo's CI/package scripts.
Report ✅ PASS / ⚠️ WARNING / ❌ BLOCKER for each step.

## Gates

1. **Tests (BLOCKER)** — run the project test gate. Must be green.
2. **Typecheck / lint (BLOCKER if the project treats it as one)** — run it; if the
   project documents pre-existing known failures, only block on ones you introduced.
3. **Build (BLOCKER when release-bound)** — run the build gate.
4. **Clean tree (BLOCKER)** — `git status --short`: no stray uncommitted changes.
5. **Up to date with the default branch** — if a remote exists
   (`git remote get-url origin`): `git fetch origin -q` then rebase onto
   `origin/<default>`; resolve conflicts locally. No remote → skip (nothing to
   be behind), and note the PR steps below don't apply yet either.
6. **Commit hygiene** — `git log <default>..HEAD --oneline` (against
   `origin/<default>` when a remote exists): all conventional
   (`type(scope): description`), ending with the Co-Authored-By trailer.
7. **Docs current** — the conventions file and any architecture/data-model docs
   updated if behavior/config changed (stale-doc rule); the catalog regenerated
   + feature rows rewritten if the diff touched a route, the schema, or a
   catalogued anchor (§6.1).
7.5 **Queue item named (§4)** — when the project records a §10 **Issue
   tracker**, every PR names its queue item in the DESCRIPTION (that is what
   GitHub's auto-close reads — a bare `#N` mention only links):
   - the work finishes the item → `Closes #N` in the PR body ONLY (never in a
     commit message — a commit's closing keyword fires when it reaches the
     default branch, e.g. at the promote, closing the issue done-or-not; the
     guardrail hook blocks it, orderly #605);
   - it ships part of the item → `Part of #N`, plus a comment on the issue
     saying what remains (never `Closes` — a half-done issue that auto-closes
     is a silent drop);
   - no issue exists for this work → create one first (`gh issue create`) or
     state in the PR body why this PR is queue-exempt (pure bookkeeping,
     release commit). ⚠️ WARNING when none of these hold.
8. **Live verification** — if the change has a runtime surface, confirm it was
   exercised in a real client (real browser for web UI), not just a status ping.

## If all green

```bash
git push -u origin <branch>
gh pr create --fill    # or a summary + test plan; body carries Closes #N / Part of #N (step 7.5)
```

Report the final status and any remaining blockers. Do not merge — the human
owner (HITL) merges the default branch.
