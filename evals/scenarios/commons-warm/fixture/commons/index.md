# Portfolio commons — reusable material

Battle-tested artifacts harvested from past ventures, ready to **copy-and-adapt**.
Consult this index, pick the best *single* match, then adapt it to the current
project — never paste verbatim. Each entry's README carries its adaptation notes.

## Components

### `tend-landing-auth` — marketing hero + sign-in pair
- **Path:** `commons/code/tend-landing-auth/` — `LandingHero.vue`, `SignInForm.vue`, `README.md`
- **Stack:** Vue 3 (`<script setup>`) + scoped CSS, design-token driven
- **Tags:** landing, hero, auth, sign-in, marketing, editorial, accessible-form
- **Provenance:** harvested from the **Tend** venture (a plant-care companion)
- **Why it's good:** asymmetric editorial hero (serif display + system sans);
  truth-telling accessible sign-in (real `<label>`s, non-blocking validation,
  parent-owned auth state); restrained, reduced-motion-aware micro-interactions
- **Reuse:** strong match for any product needing a calm, considered marketing
  hero + email/password sign-in. Copy the pair, then follow the README's
  **Adaptation notes**: rewrite all product name/copy/routes, remap token names,
  and address the flagged hardcoded accent-hover gap.
