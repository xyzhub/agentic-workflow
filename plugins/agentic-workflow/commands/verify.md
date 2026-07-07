---
description: Post-deploy verification on the deployed instance — drive the real user flow, confirm monitoring is receiving, record the result. The §7 finish line ("deployed and verified") as a command.
argument-hint: [deployed-url]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, Artifact]
---

Verify the deployed instance (Agentic Workflow §7: DONE ends at post-deploy
verification, not at "PR merged"). Run after the human deploys — following a
`/release`, a launch, or any user-facing merge that auto-deploys. `$ARGUMENTS`
is the deployed URL; otherwise use the §10 **Deploy + live-verify** row.

## 1. Reachability & health

Hit the health/readiness endpoints; confirm the deployed version/commit is the
one just shipped (version endpoint, header, or build stamp — whatever the
project exposes). Wrong version → stop and report; verifying the old deploy
proves nothing.

## 2. Drive the real flow

Exercise the core user journey **on the deployed instance** in a real client —
Bash-driven Playwright (the same path the `frontend` and `reviewer` agents
use): the changed flow end to end, console clean, UI truthful (no state claimed
that the backend doesn't confirm). A status-code ping is not verification. If
browser automation isn't possible against this target, list the exact manual
steps and report them as **NOT VERIFIED** — never imply a check you didn't run.

## 3. Confirm observability

Monitoring/error capture is receiving events from THIS deploy — trigger a
harmless test event if the setup provides one, or verify fresh traffic is
arriving. A launch whose monitoring is silent is unverified by definition.

## 4. Record & report

PASS: exactly what was exercised, on which URL/version, with what result —
spawn the `chronicler` (timeline entry; at V5 this is the launch-verified
milestone), then republish the status page via the Artifact tool.

FAIL: what broke, user impact, and the §10 rollback story — **the rollback
decision and trigger are the human's** (§11); prepare the exact commands,
never fire them. A FAIL is **alert-tier** on the owner channel (§12) when one
is configured.
