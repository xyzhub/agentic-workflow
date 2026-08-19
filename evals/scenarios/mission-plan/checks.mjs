// Deterministic assertions for mission-plan.
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export default function checks({ dir }) {
  const failures = [];
  const plans = path.join(dir, '.plans');
  if (!existsSync(plans)) return ['.plans/ was never created'];
  const files = readdirSync(plans);
  for (const suffix of ['.sessions.md', '.state.md'])
    if (!files.some((f) => f.endsWith(suffix))) failures.push(`no *${suffix} in .plans/`);
  if (!files.some((f) => f.endsWith('.md') && !f.endsWith('.sessions.md') && !f.endsWith('.state.md')))
    failures.push('no master plan *.md in .plans/');
  const state = files.find((f) => f.endsWith('.state.md'));
  if (state) {
    const ledger = readFileSync(path.join(plans, state), 'utf8');
    const nextUps = ledger.match(/^Next up:/gm) || [];
    if (nextUps.length !== 1) failures.push(`state ledger has ${nextUps.length} "Next up:" lines — exactly one required`);
    if (!/^Estimate:\s*\d+ sessions?/m.test(ledger)) failures.push('state ledger has no "Estimate: N sessions" line');
    if (!/^Sessions used:\s*0/m.test(ledger)) failures.push('state ledger has no "Sessions used: 0" line');
  }
  return failures;
}
