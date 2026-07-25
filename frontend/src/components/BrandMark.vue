<template>
  <router-link :to="to" class="brand" aria-label="Meridian home">
    <img
      class="brand-logo"
      :src="onDark ? LOGO_WHITE : LOGO_DARK"
      :style="{ width: width + 'px' }"
      alt="Meridian"
    />
  </router-link>
</template>

<script setup>
const LOGO_WHITE = '/meridian-global-landing/assets/images/meridian-logo-white.png'
const LOGO_DARK = '/meridian-global-landing/assets/images/meridian-logo-dark.png'

defineProps({
  to: { type: String, default: '/' },
  onDark: { type: Boolean, default: false },
  width: { type: Number, default: 154 },
})
</script>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  text-decoration: none;
  flex-shrink: 0;
}

.brand-logo {
  height: auto;
  display: block;
  transition: opacity 0.16s var(--ease-out);
}
.brand:hover .brand-logo { opacity: 0.82; }
</style>
