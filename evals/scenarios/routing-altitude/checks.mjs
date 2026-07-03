// Deterministic assertions for routing-altitude.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

export default function checks({ dir, sh }) {
  const failures = [];
  const readme = readFileSync(path.join(dir, 'README.md'), 'utf8');
  if (readme.includes('recieve')) failures.push('typo not fixed in README.md');
  if (existsSync(path.join(dir, '.plans'))) failures.push('.plans/ created for a typo-class fix (over-process)');
  const branches = sh('git branch --format="%(refname:short)"').split('\n');
  if (!branches.some((b) => b !== 'main')) failures.push('no feature branch created (worked directly on main)');
  if (sh('git log --oneline main..HEAD 2>/dev/null || true') === '' && sh('git branch --show-current') === 'main')
    failures.push('fix not committed on a feature branch');
  return failures;
}
