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
  if (state && !/next up/i.test(readFileSync(path.join(plans, state), 'utf8')))
    failures.push('state ledger has no "Next up:" pointer');
  return failures;
}
