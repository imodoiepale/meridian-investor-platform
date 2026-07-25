<template>
  <footer class="site-footer">
    <div class="m-container footer-grid">
      <div class="footer-brand">
        <BrandMark on-dark :width="165" />
        <p>Global expansion, coordinated.</p>
      </div>

      <div v-for="col in columns" :key="col.title">
        <h3>{{ col.title }}</h3>
        <router-link v-for="link in col.links" :key="link.label" :to="link.to">
          {{ link.label }}
        </router-link>
      </div>

      <form class="newsletter" @submit.prevent="subscribe">
        <h3>Stay up to date</h3>
        <p>Subscribe to our newsletter.</p>
        <div>
          <label class="m-sr-only" for="footer-email">Email address</label>
          <input
            id="footer-email"
            v-model="email"
            type="email"
            placeholder="Enter your email"
            required
          />
          <button type="submit" :aria-label="subscribed ? 'Subscribed' : 'Subscribe'">
            {{ subscribed ? '✓' : '→' }}
          </button>
        </div>
        <p v-if="subscribed" class="news-ok">Thanks — we'll be in touch.</p>
      </form>
    </div>

    <div class="m-container footer-bottom">
      <span>© {{ year }} Meridian. All rights reserved.</span>
      <div>
        <router-link to="/help">Privacy policy</router-link>
        <router-link to="/help">Terms of service</router-link>
        <router-link to="/help">Cookies</router-link>
      </div>
      <span>English</span>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed } from 'vue'
import BrandMark from './BrandMark.vue'

const year = computed(() => new Date().getFullYear())
const email = ref('')
const subscribed = ref(false)

function subscribe() {
  if (!email.value.trim()) return
  subscribed.value = true
  email.value = ''
}

const columns = [
  {
    title: 'Platform',
    links: [
      { label: 'Overview', to: '/' },
      { label: 'How it works', to: '/about' },
      { label: 'Concierge', to: '/concierge' },
    ],
  },
  {
    title: 'Markets',
    links: [
      { label: 'All markets', to: '/' },
      { label: 'Licence explorer', to: '/licences' },
      { label: 'Market insights', to: '/invest/graphs' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'Company setup', to: '/dashboard' },
      { label: 'Tax & compliance', to: '/dashboard' },
      { label: 'Operate & scale', to: '/dashboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Contact us', to: '/help' },
    ],
  },
]
</script>

<style scoped>
.site-footer {
  padding: 70px 0 22px;
  background: var(--navy-900);
  color: #fff;
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.45fr repeat(4, 0.75fr) 1.35fr;
  gap: 38px;
}

.footer-brand p,
.newsletter p {
  margin-top: 14px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.footer-grid h3 {
  margin: 0 0 16px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.footer-grid > div:not(.footer-brand) {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.footer-grid > div:not(.footer-brand) a {
  color: rgba(255, 255, 255, 0.58);
  font-size: 12px;
  text-decoration: none;
  width: fit-content;
  transition: color 160ms ease;
}
.footer-grid > div:not(.footer-brand) a:hover { color: #fff; }

.newsletter p { margin: 0 0 12px; }

.newsletter > div {
  display: flex;
}

.newsletter input {
  min-width: 0;
  width: 100%;
  height: 42px;
  padding: 0 13px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-right: 0;
  border-radius: 4px 0 0 4px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: border-color 160ms ease;
}
.newsletter input::placeholder { color: rgba(255, 255, 255, 0.38); }
.newsletter > div:focus-within input { border-color: var(--blue-400); }

.newsletter button {
  width: 42px;
  flex-shrink: 0;
  border: 0;
  border-radius: 0 4px 4px 0;
  background: var(--blue-500);
  color: #fff;
  font-size: 15px;
  cursor: pointer;
  transition: background 160ms ease;
}
.newsletter button:hover { background: var(--blue-600); }

.news-ok { margin-top: 8px; color: #4FE092; font-size: 12px; }

.footer-bottom {
  margin-top: 58px;
  padding-top: 20px;
  display: flex;
  justify-content: space-between;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.42);
  font-size: 10px;
}

.footer-bottom div { display: flex; gap: 24px; }
.footer-bottom a { color: inherit; text-decoration: none; transition: color 160ms ease; }
.footer-bottom a:hover { color: rgba(255, 255, 255, 0.85); }

@media (max-width: 1100px) {
  .footer-grid { grid-template-columns: 1.3fr repeat(3, 0.8fr); }
  .footer-grid > :nth-child(5),
  .newsletter { margin-top: 20px; }
}

@media (max-width: 680px) {
  .footer-grid { grid-template-columns: repeat(2, 1fr); }
  .footer-brand, .newsletter { grid-column: 1 / -1; }
  .footer-bottom { gap: 18px; flex-direction: column; }
}
</style>
