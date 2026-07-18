// Deterministic assertions for commons-warm: the components exist, and they were
// ADAPTED from the commons exemplar rather than blind-copied.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export default function checks({ dir }) {
  const failures = [];
  const built = ['src/components/LandingHero.vue', 'src/components/SignInForm.vue'];
  const read = (f) => (existsSync(path.join(dir, f)) ? readFileSync(path.join(dir, f), 'utf8') : null);

  for (const f of built) if (!existsSync(path.join(dir, f))) failures.push(`${f} was not created`);

  // Not a verbatim copy of the exemplar.
  const pairs = [
    ['src/components/LandingHero.vue', 'commons/code/tend-landing-auth/LandingHero.vue'],
    ['src/components/SignInForm.vue', 'commons/code/tend-landing-auth/SignInForm.vue'],
  ];
  for (const [out, src] of pairs) {
    const o = read(out), s = read(src);
    if (o !== null && s !== null && o === s) failures.push(`${out} is a verbatim copy of the commons exemplar (no adaptation)`);
  }

  // No blind-copy leakage: the exemplar's product identity must not survive.
  for (const f of built) {
    const o = read(f);
    if (o && (/\bTend\b/.test(o) || /Start tending|keeping things alive|One plant at a time/i.test(o)))
      failures.push(`${f} still contains the exemplar's Tend/plant-care copy (blind copy — not adapted to Cove)`);
  }

  return failures;
}
