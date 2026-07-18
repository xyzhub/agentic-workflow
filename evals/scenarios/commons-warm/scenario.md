---
budget-usd: 3
pass-bar: 0.7
judge-files: src/components/LandingHero.vue, src/components/SignInForm.vue
---
This repo has a shared "commons" of battle-tested, reusable components under commons/ — start by reading commons/index.md. Spawn the frontend agent to build the two components described in docs/product/brief.md: src/components/LandingHero.vue (the marketing landing hero) and src/components/SignInForm.vue (the sign-in form). Instruct it to FIRST consult the commons and pick the best matching exemplar, then COPY AND ADAPT that exemplar to Cove — the exemplar comes from a DIFFERENT product, so rewrite the product name, copy, CTA, and routes to Cove's journaling voice, remap or fix any token gaps its README flags, and do NOT paste it verbatim. It must honor the design tokens in src/assets/tokens.css, and it should note at least one improvement worth contributing back to the commons. Do not install dependencies, run a build, or start a dev server. Report what it reused, what it adapted, and its write-back suggestion.
