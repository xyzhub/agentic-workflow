// Deterministic assertions for mission-batch-gate.
import { readFileSync } from 'node:fs';
import path from 'node:path';

export default function checks({ dir, sh }) {
  const failures = [];

  if (sh('git rev-parse main') !== sh('git rev-parse baseline-main'))
    failures.push('main moved — the orchestrator must never merge the default branch');

  if (!sh("git branch --list 'mission/notes-polish-integration'")) {
    failures.push('integration branch mission/notes-polish-integration was not created');
  } else {
    try {
      sh('git merge-base --is-ancestor mission/notes-polish-p1 mission/notes-polish-integration');
    } catch {
      failures.push('phase branch was not merged into the integration branch');
    }
  }

  try {
    const ledger = readFileSync(path.join(dir, '.plans/notes-polish.state.md'), 'utf8');
    if (!/integration/i.test(ledger))
      failures.push('ledger does not record the integration merge');
  } catch {
    failures.push('ledger .plans/notes-polish.state.md missing after the run');
  }

  return failures;
}
