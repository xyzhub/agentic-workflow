<script setup>
/**
 * SignInForm — email + password sign-in for Tend.
 *
 * Accessibility and honesty are the point here:
 *  - Every field has a real, visible <label> wired via for/id (never a
 *    placeholder standing in for a label).
 *  - Email validation is *non-blocking*: it only speaks up after you've left
 *    the field, is announced politely to assistive tech, and never claims the
 *    address is wrong while you're mid-type.
 *  - The component owns no auth truth. It emits `submit` with the credentials
 *    and reflects a `pending` / `error` prop the parent controls — the button
 *    can't say "signed in" on its own.
 */
import { ref, computed } from 'vue'

const props = defineProps({
  /** Parent-controlled: request in flight. Disables submit, relabels button. */
  pending: { type: Boolean, default: false },
  /** Parent-controlled: a real error from the auth call (e.g. bad password). */
  error: { type: String, default: '' },
  /** Target for the forgot-password affordance. */
  forgotHref: { type: String, default: '/reset' },
})

const emit = defineEmits(['submit'])

const email = ref('')
const password = ref('')
const emailTouched = ref(false)

// Intentionally forgiving: catch obvious typos, not RFC-5322 edge cases.
const emailLooksValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()),
)

// Non-blocking: only surfaces once the field has content AND has been left.
const showEmailHint = computed(
  () => emailTouched.value && email.value.length > 0 && !emailLooksValid.value,
)

function onSubmit() {
  emailTouched.value = true
  if (props.pending) return
  emit('submit', { email: email.value.trim(), password: password.value })
}
</script>

<template>
  <form class="signin" novalidate aria-labelledby="signin-title" @submit.prevent="onSubmit">
    <div class="signin__head">
      <h2 id="signin-title" class="signin__title">Welcome back</h2>
      <p class="signin__sub">Pick up where you left off.</p>
    </div>

    <!-- Auth-level error from the parent. Assertive: it blocks the user. -->
    <p v-if="error" class="signin__error" role="alert">
      {{ error }}
    </p>

    <div class="signin__field">
      <label class="signin__label" for="signin-email">Email</label>
      <input
        id="signin-email"
        v-model="email"
        class="signin__input"
        type="email"
        name="email"
        autocomplete="email"
        inputmode="email"
        spellcheck="false"
        :aria-invalid="showEmailHint ? 'true' : 'false'"
        aria-describedby="signin-email-hint"
        @blur="emailTouched = true"
      />
      <!-- Polite live region: always present so SR announces on change, not on
           DOM insertion; empty until there's something worth saying. -->
      <p id="signin-email-hint" class="signin__hint" role="status" aria-live="polite">
        <span v-if="showEmailHint" class="signin__hint-text">
          That doesn&rsquo;t look like an email address yet.
        </span>
      </p>
    </div>

    <div class="signin__field">
      <div class="signin__label-row">
        <label class="signin__label" for="signin-password">Password</label>
        <a class="signin__forgot" :href="forgotHref">Forgot?</a>
      </div>
      <input
        id="signin-password"
        v-model="password"
        class="signin__input"
        type="password"
        name="password"
        autocomplete="current-password"
      />
    </div>

    <button class="signin__submit" type="submit" :disabled="pending">
      <span>{{ pending ? 'Signing in…' : 'Sign in' }}</span>
    </button>
  </form>
</template>

<style scoped>
.signin {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  width: 100%;
  max-width: 24rem;
  padding: var(--space-8);
  background-color: var(--color-surface);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-body);
  color: var(--color-ink);
}

.signin__head {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.signin__title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: var(--text-xl);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.signin__sub {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-ink-soft);
}

.signin__error {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border-left: 2px solid var(--color-danger);
  border-radius: var(--radius-sm);
  background-color: color-mix(in srgb, var(--color-danger) 7%, var(--color-surface));
  color: var(--color-danger);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
}

/* --- Fields ------------------------------------------------------------ */
.signin__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.signin__label-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-4);
}

.signin__label {
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.01em;
}

.signin__input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-family: inherit;
  font-size: var(--text-base);
  color: var(--color-ink);
  background-color: var(--color-bg);
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  transition: border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
}

.signin__input::placeholder {
  color: var(--color-ink-soft);
}

.signin__input:hover {
  border-color: color-mix(in srgb, var(--color-accent) 30%, var(--color-line));
}

.signin__input:focus {
  outline: none;
  background-color: var(--color-surface);
  border-color: var(--color-accent);
  /* Soft focus halo in the accent family — visible without shouting. */
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}

.signin__input[aria-invalid='true'] {
  border-color: var(--color-danger);
}

.signin__input[aria-invalid='true']:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-danger) 18%, transparent);
}

/* Reserve a line so the layout doesn't jump when the hint appears/clears. */
.signin__hint {
  margin: 0;
  min-height: 1.1em;
  font-size: var(--text-xs);
  line-height: 1.1;
  color: var(--color-danger);
}

.signin__forgot {
  color: var(--color-accent);
  font-size: var(--text-xs);
  font-weight: 500;
  text-decoration: none;
}

.signin__forgot:hover {
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* --- Submit ------------------------------------------------------------ */
.signin__submit {
  margin-top: var(--space-1);
  padding: var(--space-3) var(--space-4);
  font-family: inherit;
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--color-accent-ink);
  background-color: var(--color-accent);
  border: none;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: background-color 160ms ease, box-shadow 160ms ease, transform 120ms ease;
}

.signin__submit:hover:not(:disabled) {
  background-color: #285e5a; /* one step below --color-accent; no darken() token */
  box-shadow: var(--shadow-md);
}

.signin__submit:active:not(:disabled) {
  transform: translateY(1px);
}

.signin__submit:disabled {
  opacity: 0.6;
  cursor: progress;
}

/* --- Focus: shared, visible, keyboard-first ---------------------------- */
.signin__forgot:focus-visible,
.signin__submit:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

@media (prefers-reduced-motion: reduce) {
  .signin__input,
  .signin__submit {
    transition-duration: 1ms;
  }
  .signin__submit:active:not(:disabled) {
    transform: none;
  }
}
</style>
