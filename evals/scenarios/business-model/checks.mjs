// Deterministic assertions for business-model.
import { existsSync } from 'node:fs';
import path from 'node:path';

export default function checks({ dir }) {
  const required = [
    'docs/product/business/business-model.md',
    'docs/product/business/pricing.md',
    'docs/product/business/executive-summary.md',
  ];
  return required.filter((f) => !existsSync(path.join(dir, f))).map((f) => `${f} was not created`);
}
