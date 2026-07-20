<script setup>
/**
 * LandingHero — Tend's above-the-fold marketing hero.
 *
 * Layout has a point of view: an asymmetric editorial column offset from a
 * hairline "running head" (borrowed from the top of a printed page), with a
 * quiet marginal note held in a second column at wider widths. Nothing is
 * centred; the composition leans on a baseline rhythm and generous, uneven
 * whitespace rather than symmetry.
 *
 * Copy and the CTA target are props so a consumer can adapt without editing
 * markup. Defaults carry Tend's calm, unhurried voice.
 */
defineProps({
  /** Small-caps running head, top-left — the "chapter" mark. */
  eyebrow: { type: String, default: 'Tend' },
  /** Primary action target. */
  ctaHref: { type: String, default: '/start' },
  /** Secondary, lower-commitment link. */
  secondaryHref: { type: String, default: '/how-it-works' },
})
</script>

<template>
  <section class="hero" aria-labelledby="hero-title">
    <!-- Running head: a hairline and a small-caps mark, like the top of a page. -->
    <p class="hero__runninghead">
      <span class="hero__mark">{{ eyebrow }}</span>
      <span class="hero__rule" aria-hidden="true"></span>
      <span class="hero__folio">A calmer way to keep things alive</span>
    </p>

    <div class="hero__body">
      <h1 id="hero-title" class="hero__title">
        The quiet art of
        <em class="hero__title-em">keeping things alive.</em>
      </h1>

      <p class="hero__lede">
        Tend is a gentle companion for the plants in your care — watering
        reminders that learn your home, not a feed to scroll. It just quietly
        keeps track, so you don't have to.
      </p>

      <div class="hero__actions">
        <a class="hero__cta" :href="ctaHref">
          <span class="hero__cta-label">Start tending</span>
          <span class="hero__cta-caret" aria-hidden="true">&rarr;</span>
        </a>
        <a class="hero__secondary" :href="secondaryHref">
          How Tend works
        </a>
      </div>
    </div>

    <!-- Marginalia: a quiet aside that sets the tone without inventing data. -->
    <aside class="hero__aside" aria-hidden="true">
      <span class="hero__aside-line"></span>
      <p class="hero__aside-note">
        One plant at a time.
        <br />Slowly.
      </p>
    </aside>
  </section>
</template>

<style scoped>
.hero {
  /* Asymmetric grid: wide content column, a narrow margin column that only
     earns its keep at larger widths. Uneven side padding is deliberate. */
  display: grid;
  grid-template-columns: [full-start] minmax(var(--space-5), 1fr) [content-start] minmax(0, 62ch) [content-end] minmax(var(--space-5), 0.62fr) [full-end];
  align-content: center;
  gap: var(--space-8) var(--space-6);
  min-height: min(88vh, 52rem);
  padding-block: var(--space-12) var(--space-16);
  background-color: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-body);
}

/* --- Running head ------------------------------------------------------ */
.hero__runninghead {
  grid-column: content-start / content-end;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin: 0 0 var(--space-8);
  color: var(--color-ink-soft);
  font-size: var(--text-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero__mark {
  font-weight: 600;
  color: var(--color-accent);
}

.hero__rule {
  flex: 1 1 auto;
  height: 1px;
  background-color: var(--color-line);
}

.hero__folio {
  flex: 0 0 auto;
}

/* --- Body -------------------------------------------------------------- */
.hero__body {
  grid-column: content-start / content-end;
  max-width: var(--measure);
}

.hero__title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--text-2xl);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  /* Optical: pull the big serif left so its side bearing aligns to the grid. */
  text-indent: -0.03em;
  text-wrap: balance;
}

.hero__title-em {
  display: block;
  font-style: italic;
  color: var(--color-accent);
}

.hero__lede {
  margin: var(--space-5) 0 0;
  max-width: 46ch;
  font-size: var(--text-md);
  line-height: var(--leading-normal);
  color: var(--color-ink-soft);
}

/* --- Actions ----------------------------------------------------------- */
.hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3) var(--space-6);
  margin-top: var(--space-8);
}

.hero__cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  background-color: var(--color-accent);
  color: var(--color-accent-ink);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.01em;
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  transition: background-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.hero__cta:hover {
  background-color: #285e5a; /* one shade below --color-accent; no darken() token */
  box-shadow: var(--shadow-md);
}

.hero__cta:active {
  transform: translateY(1px);
}

.hero__cta-caret {
  transition: transform 200ms cubic-bezier(0.2, 0.7, 0.3, 1);
}

.hero__cta:hover .hero__cta-caret {
  transform: translateX(3px);
}

.hero__secondary {
  position: relative;
  color: var(--color-ink);
  font-size: var(--text-sm);
  font-weight: 500;
  text-decoration: none;
}

/* Animated underline drawn from the left — the one flourish, kept subtle. */
.hero__secondary::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -2px;
  height: 1px;
  background-color: var(--color-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 220ms cubic-bezier(0.2, 0.7, 0.3, 1);
}

.hero__secondary:hover::after {
  transform: scaleX(1);
}

/* --- Marginalia -------------------------------------------------------- */
.hero__aside {
  grid-column: content-end / full-end;
  align-self: end;
  display: none; /* narrow screens keep the margin quiet */
  padding-left: var(--space-5);
}

.hero__aside-line {
  display: block;
  width: 1px;
  height: var(--space-8);
  margin-bottom: var(--space-4);
  background-color: var(--color-line);
}

.hero__aside-note {
  margin: 0;
  font-family: var(--font-display);
  font-style: italic;
  font-size: var(--text-md);
  line-height: var(--leading-tight);
  color: var(--color-ink-soft);
}

/* --- Focus: visible, on-brand, never removed --------------------------- */
.hero__cta:focus-visible,
.hero__secondary:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 3px;
  border-radius: var(--radius-sm);
}

/* --- Wider viewports: the margin column pays off ----------------------- */
@media (min-width: 60rem) {
  .hero {
    padding-inline: var(--space-6);
  }
  .hero__aside {
    display: block;
  }
}

/* --- Honour reduced-motion: no travel, keep the state changes ---------- */
@media (prefers-reduced-motion: reduce) {
  .hero__cta,
  .hero__cta-caret,
  .hero__secondary::after {
    transition-duration: 1ms;
  }
  .hero__cta:hover .hero__cta-caret {
    transform: none;
  }
}
</style>
