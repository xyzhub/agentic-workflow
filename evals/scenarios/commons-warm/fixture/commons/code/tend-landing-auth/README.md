# Tend — Landing & Sign-in exemplar

A curated, copy-and-adapt reference pair: `LandingHero.vue` and `SignInForm.vue`.
Both are Vue 3 `<script setup>`, `<style scoped>`, and consume the design tokens
in `assets/tokens.css` — they hardcode nothing a token already covers.

## Why this is a good exemplar

- **A type hierarchy with intent, not decoration.** The display serif
  (`--font-display`) is reserved for the hero headline and the form title; body
  and UI copy stay in the system sans (`--font-body`). The serif italic carries
  the accent colour so emphasis and voice do one job together, not three.
- **A layout with a point of view.** The hero is an asymmetric grid — a wide
  content column offset against a hairline "running head" and a quiet marginal
  note — borrowed from the anatomy of a printed page. Nothing is centred; rhythm
  comes from the baseline and uneven whitespace, not symmetry.
- **Honest, accessible states over happy-path polish.** Real `<label>`s wired by
  `for`/`id` (never placeholder-as-label); email validation is *non-blocking* and
  announced through a persistent polite live region; the form owns no auth truth
  — it emits `submit` and reflects parent-controlled `pending`/`error`, so the
  button can never falsely claim success.
- **Restraint in the flourishes.** One caret nudge, one left-drawn underline, one
  soft accent focus halo — each purposeful, each disabled under
  `prefers-reduced-motion`. Focus is always visible and on-brand; it is never
  removed.

## Adaptation notes — what a consumer MUST change

**Product identity & copy**
- `eyebrow` defaults to `"Tend"`; the CTA reads "Start tending"; every string
  (headline, lede, marginal note) is Tend's calm plant-care voice. Rewrite copy
  to your product's glossary — do **not** ship "The quiet art of keeping things
  alive", "Start tending", or "One plant at a time." under another brand.
- Route props (`ctaHref`, `secondaryHref`, `forgotHref`) are placeholder paths.
  Point them at your real routes before shipping.

**Tokens — remap, don't fork**
- These consume the Cove token names. If your system uses different names, remap
  at the `:root`/theme layer rather than editing each component.
- **Known token gaps to flag, not to normalise:** the accent *hover* shade
  (`#285e5a`) is hardcoded in two places because the kit has no darker-accent or
  `darken()` token. If you reuse this widely, add a `--color-accent-strong` token
  and swap the literals — don't propagate the hardcode.

**Behaviour & wiring**
- `SignInForm` is presentational: it does not call an API, hash a password, or
  store a session. Wire the `@submit` handler to your auth layer and drive
  `pending`/`error` from that call's real state.
- Email validation is deliberately forgiving (obvious-typo catcher, not
  RFC-5322). Keep it non-blocking; if your product needs stricter rules, add
  server-side truth rather than making this affordance block submit.

**What NOT to blindly keep**
- The serif display face. It is load-bearing for Tend's calm, unhurried tone; a
  generic SaaS should not inherit it by default — choose a face that fits *your*
  voice.
- The marginal aside (`hero__aside`) is `aria-hidden` ornament for wide screens.
  If your content needs to be read there, it must not live in a hidden aside.
- `color-mix(in srgb, …)` is used for the error tint and hover borders. It needs
  a reasonably modern browser (2023+). If you must support older targets,
  precompute those values into tokens.
