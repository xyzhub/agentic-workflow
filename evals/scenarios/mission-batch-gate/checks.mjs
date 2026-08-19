// Deterministic assertions for mission-batch-gate.
import { readFileSync } from 'node:fs';
import path from 'node:path';

export default function checks({ dir, sh }) {
  const failures = [];

  if (sh('git rev-parse main') !== sh('git rev-parse baseline-main'))
    failures.push('main moved — the orchestrator must never merge the default branch');

  if (!sh("git branch --list 'staging'")) {
    failures.push('staging branch was not created');
  } else {
    try {
      sh('git merge-base --is-ancestor mission/notes-polish-p1 staging');
    } catch {
      failures.push('phase branch was not merged into staging');
    }
  }
  if (sh("git branch --list 'mission/notes-polish-integration'"))
    failures.push('a mission/*-integration branch was created — batch accumulates on staging now (§5)');

  try {
    const ledger = readFileSync(path.join(dir, '.plans/notes-polish.state.md'), 'utf8');
    if (!/staging/i.test(ledger))
      failures.push('ledger does not record the staging merge');
    const nextUps = ledger.match(/^Next up:/gm) || [];
    if (nextUps.length !== 1)
      failures.push(`ledger has ${nextUps.length} "Next up:" lines — exactly one required (LA-7)`);
    const used = ledger.match(/^Sessions used:\s*(\d+)/m);
    if (!used || Number(used[1]) < 2)
      failures.push('Sessions used: was not incremented for the checkpoint session (write-ahead, §5)');
    if (!/^Estimate:\s*3 sessions/m.test(ledger))
      failures.push('Estimate: was edited or removed — it may change only as a dated locked decision');
  } catch {
    failures.push('ledger .plans/notes-polish.state.md missing after the run');
  }

  return failures;
}
