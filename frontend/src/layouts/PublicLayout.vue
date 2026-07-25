<template>
  <div class="public-shell">
    <header
      class="site-header"
      :class="{ 'is-fixed': isFixed, 'is-solid': !overHero }"
      data-header
    >
      <BrandMark on-dark />

      <button
        class="menu-toggle"
        type="button"
        :aria-expanded="menuOpen"
        aria-label="Open navigation"
        @click="menuOpen = !menuOpen"
      >
        <span :class="{ x1: menuOpen }"></span>
        <span :class="{ x2: menuOpen }"></span>
      </button>

      <nav class="main-nav" :class="{ 'is-open': menuOpen }" aria-label="Primary navigation">
        <router-link v-for="l in links" :key="l.to" :to="l.to" @click="menuOpen = false">
          {{ l.label }}
        </router-link>
        <div class="nav-actions-mobile">
          <router-link :to="signedIn ? '/dashboard' : '/login'" @click="menuOpen = false">
            {{ signedIn ? 'Dashboard' : 'Sign in' }}
          </router-link>
          <router-link to="/profile" class="m-btn m-btn-primary m-btn-sm" @click="menuOpen = false">
            Build my roadmap
          </router-link>
        </div>
      </nav>

      <div class="header-actions">
        <router-link :to="signedIn ? '/dashboard' : '/login'" class="sign-in">
          {{ signedIn ? 'Dashboard' : 'Sign in' }}
        </router-link>
        <router-link to="/profile" class="m-btn m-btn-primary m-btn-sm">Build my roadmap</router-link>
      </div>
    </header>

    <main :class="{ 'has-offset': !overHero }">
      <router-view />
    </main>

    <SiteFooter />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import BrandMark from '../components/BrandMark.vue'
import SiteFooter from '../components/SiteFooter.vue'
import { getSession, supabase } from '../lib/supabase'

const route = useRoute()
const scrolled = ref(false)
const menuOpen = ref(false)
const signedIn = ref(false)

// Only pages with a dark full-bleed hero let the header sit transparently on top.
const overHero = computed(() => route.meta?.heroNav === true)
const isFixed = computed(() => scrolled.value || !overHero.value)

const links = [
  { label: 'About', to: '/about' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Help', to: '/help' },
]

function onScroll() {
  scrolled.value = window.scrollY > 40
}

watch(menuOpen, (open) => {
  document.body.classList.toggle('menu-open', open)
})
watch(() => route.fullPath, () => { menuOpen.value = false })

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
  signedIn.value = Boolean(await getSession())
  supabase?.auth.onAuthStateChange((_e, session) => { signedIn.value = Boolean(session) })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  document.body.classList.remove('menu-open')
})
</script>

<style scoped>
.public-shell { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg); }
main { flex: 1; }
main.has-offset { padding-top: 66px; }

.site-header {
  position: absolute;
  z-index: 40;
  top: 0;
  left: 0;
  width: 100%;
  height: 76px;
  padding: 0 4.5vw;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 44px;
  color: #fff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  transition: background 180ms ease, box-shadow 180ms ease, height 180ms ease;
}

.site-header.is-fixed {
  position: fixed;
  height: 66px;
  background: rgba(7, 19, 33, 0.96);
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.14);
  backdrop-filter: blur(18px);
}

.main-nav {
  justify-self: center;
  display: flex;
  align-items: center;
  gap: 29px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
}

.main-nav a, .sign-in {
  color: inherit;
  text-decoration: none;
  transition: color 160ms ease;
}
.main-nav a:hover, .sign-in:hover { color: #fff; }
.main-nav a.router-link-active { color: #fff; }

.header-actions {
  display: flex;
  align-items: center;
  gap: 22px;
  font-size: 13px;
}
.sign-in { color: rgba(255, 255, 255, 0.82); }

.nav-actions-mobile { display: none; }

.menu-toggle {
  display: none;
  width: 40px;
  height: 40px;
  padding: 11px 8px;
  border: 0;
  background: transparent;
  color: #fff;
  cursor: pointer;
}
.menu-toggle span {
  display: block;
  height: 1px;
  margin: 5px 0;
  background: currentColor;
  transition: transform 220ms var(--ease-out), opacity 160ms ease;
}
.menu-toggle span.x1 { transform: translateY(3px) rotate(45deg); }
.menu-toggle span.x2 { transform: translateY(-3px) rotate(-45deg); }

@media (max-width: 1100px) {
  .main-nav { gap: 18px; }
}

@media (max-width: 900px) {
  .site-header {
    grid-template-columns: auto auto;
    justify-content: space-between;
    padding: 0 24px;
  }
  .menu-toggle { display: block; }
  .main-nav {
    position: fixed;
    inset: 66px 0 auto;
    padding: 24px;
    display: none;
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
    background: rgba(7, 19, 33, 0.98);
    backdrop-filter: blur(18px);
  }
  .main-nav.is-open { display: flex; }
  .header-actions { display: none; }
  .nav-actions-mobile {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    width: 100%;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
}
</style>
