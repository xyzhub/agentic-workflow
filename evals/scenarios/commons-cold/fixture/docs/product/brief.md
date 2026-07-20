# Cove — build brief

**Product.** Cove is a private journaling app for reflective writing. The tone is
calm, considered, and personal — a quiet place to think, not a productivity
dashboard. It is decidedly *not* another SaaS with a gradient hero.

**Audience.** People who want to build a daily writing habit for reflection —
not power users, not teams.

**What to build (this task).** Two production components for the marketing site:

1. `src/components/LandingHero.vue` — the above-the-fold hero for the marketing
   landing page: a headline, a short supporting line, and a primary call to
   action ("Start writing"). It should feel like Cove, not like a generic
   template.
2. `src/components/SignInForm.vue` — a sign-in form: email + password fields with
   proper labels, a submit button, a "forgot password" affordance, and a visible
   (non-blocking) validation affordance for the email field. Accessible and
   keyboard-usable.

**Design system.** Honor `src/assets/tokens.css` — use the color, type, and
spacing tokens; do not introduce a parallel palette or hardcode values the tokens
cover. Beyond the tokens, the composition, rhythm, and typographic craft are
yours to get right.
