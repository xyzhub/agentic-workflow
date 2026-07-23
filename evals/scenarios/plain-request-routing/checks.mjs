// Deterministic assertions for plain-request-routing.
// The router reflex should route an un-prefixed work request through the workflow
// rather than silently building on the default branch. The hard, deterministic
// guard is that nothing was committed straight onto main and the routing context
// survives; the routing judgment itself is left to the rubric.
import { existsSync } from 'node:fs';
import path from 'node:path';

export default function checks({ dir, sh }) {
  const failures = [];

  // Guardrail: no work committed directly onto the default branch (baseline = 1 commit).
  const mainCommits = Number(sh('git rev-list --count main 2>/dev/null || echo 1').trim());
  if (mainCommits > 1)
    failures.push('work committed directly onto the default branch (routing/branch discipline skipped)');

  // The routing context must survive — the session shapes/routes, it never deletes it.
  if (!existsSync(path.join(dir, 'docs', 'WORKFLOW.md')))
    failures.push('docs/WORKFLOW.md removed (the routing context was destroyed)');

  return failures;
}
