// Deterministic assertions for commons-cold: the two components must exist.
import { existsSync } from 'node:fs';
import path from 'node:path';

export default function checks({ dir }) {
  const required = [
    'src/components/LandingHero.vue',
    'src/components/SignInForm.vue',
  ];
  return required.filter((f) => !existsSync(path.join(dir, f))).map((f) => `${f} was not created`);
}
