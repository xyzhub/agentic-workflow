// Deterministic assertions for welcome-onboarding.
// /welcome on a fresh repo must scaffold the workflow AND fill idea.md from the
// stated idea (not leave it as an empty template).
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export default function checks({ dir }) {
  const failures = [];
  const at = (f) => path.join(dir, f);

  if (!existsSync(at('docs/WORKFLOW.md')))
    failures.push('docs/WORKFLOW.md was not created — /welcome did not scaffold the project');

  const ideaPath = at('docs/product/idea.md');
  if (!existsSync(ideaPath)) {
    failures.push('docs/product/idea.md was not created');
  } else {
    const idea = readFileSync(ideaPath, 'utf8');
    // Proof it was FILLED with the real idea, not left as the template.
    if (!/slide|markdown|deck/i.test(idea))
      failures.push('docs/product/idea.md does not reflect the stated idea (Markdown→slides) — likely left unfilled or generic');
  }
  return failures;
}
