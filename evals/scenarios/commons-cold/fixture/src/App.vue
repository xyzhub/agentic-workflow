<script setup>
// The marketing landing composes the hero; the sign-in view uses the form.
// Build LandingHero.vue and SignInForm.vue under src/components/.
import LandingHero from './components/LandingHero.vue';
import SignInForm from './components/SignInForm.vue';
</script>

<template>
  <main>
    <LandingHero />
    <SignInForm />
  </main>
</template>
