// Deterministic assertions for init-workflow-bootstrap.
import { existsSync } from 'node:fs';
import path from 'node:path';

export default function checks({ dir }) {
  const required = ['docs/WORKFLOW.md', 'CHANGELOG.md', 'docs/product/JOURNEY.md', 'docs/product/overview.html'];
  return required.filter((f) => !existsSync(path.join(dir, f))).map((f) => `${f} was not created`);
}
