<template>
  <div class="landing">
    <!-- ══ Hero ══ -->
    <section class="hero" aria-labelledby="hero-title">
      <img
        class="hero-image"
        :src="img('hero-global-investors.png')"
        alt="International investors walking through Nairobi with global routes connected above the city"
      />
      <div class="hero-shade"></div>

      <div class="hero-content">
        <p class="eyebrow" v-reveal>Global Investor OS</p>
        <h1 id="hero-title" v-reveal="{ delay: 90 }">
          Go global.<br /><span>Land ready.</span>
        </h1>
        <p class="hero-copy" v-reveal="{ delay: 180 }">
          One intelligent roadmap for entering a new market, setting up your company,
          and operating with confidence.
        </p>
        <div class="button-row" v-reveal="{ delay: 260 }">
          <router-link to="/profile" class="m-btn m-btn-primary">Build my roadmap</router-link>
          <a href="#markets" class="m-btn m-btn-onDark">Explore markets</a>
        </div>
      </div>

      <aside class="hero-roadmap" aria-label="Current market entry progress" v-reveal="{ delay: 340, y: 30 }">
        <div class="roadmap-head">
          <span>Your global entry command center</span>
          <span class="live-dot" aria-label="Live"></span>
        </div>
        <ol>
          <li v-for="s in heroSteps" :key="s.index" :class="s.state">
            <span class="step-index">{{ s.index }}</span>
            <span><strong>{{ s.title }}</strong><small>{{ s.meta }}</small></span>
            <em>{{ s.status }}</em>
          </li>
        </ol>
        <router-link to="/dashboard">View full roadmap →</router-link>
      </aside>
    </section>

    <!-- ══ Intro ══ -->
    <section class="intro section" id="about">
      <div class="m-container intro-grid">
        <div v-reveal>
          <p class="eyebrow eyebrow-blue">Built for global ambition</p>
          <h2>Your ambition crosses borders.<br />Your operations should too.</h2>
          <p class="section-copy">
            Meridian brings clarity to global expansion. We combine local expertise,
            real-time requirements, and intelligent coordination so you can move faster,
            reduce risk, and build with confidence.
          </p>
        </div>

        <div class="proof-block" v-reveal="{ delay: 120 }">
          <div class="city-line" aria-label="Supported global business hubs">
            <span v-for="city in cities" :key="city">{{ city }}</span>
          </div>
          <dl class="metrics">
            <div v-for="m in metrics" :key="m.label">
              <dt>{{ m.value }}</dt>
              <dd>{{ m.label }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <!-- ══ Journey ══ -->
    <section class="journey section" id="journey" aria-label="How Meridian works">
      <div class="m-container journey-list">
        <article
          v-for="(row, i) in journey"
          :key="row.number"
          class="journey-row"
          :class="i % 2 === 1 ? 'journey-copy-right' : 'journey-copy-left'"
          v-reveal="{ y: 26 }"
        >
          <template v-if="i % 2 === 1">
            <img :src="img(row.image)" :alt="row.alt" />
            <div class="journey-copy">
              <span class="journey-number">{{ row.number }}</span>
              <h3>{{ row.title }}</h3>
              <p>{{ row.copy }}</p>
              <router-link :to="row.to">{{ row.cta }} →</router-link>
            </div>
          </template>
          <template v-else>
            <div class="journey-copy">
              <span class="journey-number">{{ row.number }}</span>
              <h3>{{ row.title }}</h3>
              <p>{{ row.copy }}</p>
              <router-link :to="row.to">{{ row.cta }} →</router-link>
            </div>
            <img :src="img(row.image)" :alt="row.alt" />
          </template>
        </article>
      </div>
    </section>

    <!-- ══ Product / command center ══ -->
    <section class="product section" id="command-center">
      <div class="m-container product-grid">
        <div class="product-copy" v-reveal>
          <p class="eyebrow eyebrow-blue">One coordinated workspace</p>
          <h2>One command center.<br />Every moving part.</h2>
          <p>
            Track progress, manage documents, connect with experts, and stay ahead
            of every requirement.
          </p>
          <router-link to="/profile" class="m-btn m-btn-primary">Build my roadmap</router-link>
        </div>
        <div class="product-image-wrap" v-reveal="{ delay: 130, y: 30 }">
          <img
            :src="img('meridian-dashboard-command-center.png')"
            alt="Meridian market entry command center showing journey progress, documents, and trusted experts"
          />
        </div>
      </div>
    </section>

    <!-- ══ Network ══ -->
    <section class="network" id="markets">
      <img
        class="network-image"
        :src="img('global-network-earth.png')"
        alt="Global routes extending from Nairobi across Africa and major international markets"
      />
      <div class="network-overlay"></div>
      <div class="m-container network-content">
        <div class="network-copy" v-reveal>
          <p class="eyebrow">A global network you can trust</p>
          <h2>Local expertise.<br />Global coverage.</h2>
          <p>
            Our partners on the ground help you navigate complexity and unlock
            opportunity wherever you go.
          </p>
          <router-link to="/licences">View all markets →</router-link>
        </div>
        <dl class="network-metrics" v-reveal="{ delay: 140 }">
          <div v-for="m in metrics" :key="m.label">
            <dt>{{ m.value }}</dt>
            <dd>{{ m.label === 'Coordinated platform' ? 'Platform' : m.label }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- ══ Final CTA ══ -->
    <section class="final-cta section" id="start">
      <div class="m-container" v-reveal>
        <p class="eyebrow eyebrow-blue">Ready to expand?</p>
        <h2>Where will you build next?</h2>
        <p>
          Join forward-thinking companies using Meridian to enter new markets,
          stay compliant, and build with confidence.
        </p>
        <form class="market-form" @submit.prevent="startRoadmap">
          <label class="m-sr-only" for="market">Choose a market</label>
          <select id="market" v-model="market" required>
            <option value="">Choose a market</option>
            <option v-for="m in markets" :key="m" :value="m">{{ m }}</option>
          </select>
          <button class="m-btn m-btn-primary" type="submit">Build my roadmap</button>
        </form>
        <p class="form-message" role="status">{{ formMessage }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const img = (file) => `/meridian-global-landing/assets/images/${file}`

const market = ref('')
const formMessage = ref('')

const markets = [
  'Kenya', 'Nigeria', 'United Arab Emirates',
  'Singapore', 'United Kingdom', 'United States',
]

function startRoadmap() {
  if (!market.value) return
  formMessage.value = `Building your ${market.value} roadmap…`
  setTimeout(() => router.push({ path: '/profile', query: { market: market.value } }), 550)
}

const heroSteps = [
  { index: '01', title: 'Choose market', meta: 'Kenya', status: 'Complete', state: 'complete' },
  { index: '02', title: 'Company setup', meta: 'Private Limited (KE)', status: 'In progress', state: 'active' },
  { index: '03', title: 'Tax registration', meta: 'KRA PIN & VAT', status: 'Upcoming', state: '' },
  { index: '04', title: 'Local experts', meta: 'Legal, Tax, Banking', status: 'Upcoming', state: '' },
]

const cities = ['Nairobi', 'London', 'Dubai', 'Lagos', 'New York', 'Singapore']

const metrics = [
  { value: '47', label: 'Markets' },
  { value: '120+', label: 'Local partners' },
  { value: '1,000+', label: 'Companies supported' },
  { value: '1', label: 'Coordinated platform' },
]

const journey = [
  {
    number: '01',
    title: 'Choose the right market',
    copy: 'Compare markets, understand local requirements, and evaluate opportunities with confidence.',
    cta: 'Explore markets',
    to: '/licences',
    image: 'market-selection-nairobi.png',
    alt: 'Founder evaluating Nairobi as a market from a city office',
  },
  {
    number: '02',
    title: 'Coordinate every requirement',
    copy: 'Your intelligent roadmap adapts to your business and keeps every step aligned.',
    cta: 'See how it works',
    to: '/invest/roadmap',
    image: 'coordinated-requirements-roadmap.png',
    alt: 'Founder and local advisor coordinating a connected market-entry roadmap',
  },
  {
    number: '03',
    title: 'Launch with local confidence',
    copy: 'From setup to scale, access trusted experts and stay compliant from day one.',
    cta: 'Meet our partners',
    to: '/concierge',
    image: 'local-expert-handshake.png',
    alt: 'International founder shaking hands with a Kenyan market-entry specialist',
  },
]
</script>

<style scoped>
.landing img { display: block; width: 100%; }

/* ══ Hero ══ */
.hero {
  position: relative;
  min-height: 720px;
  overflow: hidden;
  color: #fff;
}

.hero-image,
.hero-shade {
  position: absolute;
  inset: 0;
  height: 100%;
}

.hero-image {
  object-fit: cover;
  object-position: center;
  animation: heroZoom 18s var(--ease-out) forwards;
}
@keyframes heroZoom {
  from { transform: scale(1.06); }
  to   { transform: scale(1); }
}

.hero-shade {
  background:
    linear-gradient(90deg, rgba(4, 12, 23, 0.98) 0%, rgba(4, 12, 23, 0.82) 29%, rgba(4, 12, 23, 0.16) 62%, rgba(4, 12, 23, 0.25) 100%),
    linear-gradient(0deg, rgba(4, 12, 23, 0.48) 0%, transparent 40%);
}

.hero-content {
  position: relative;
  z-index: 2;
  width: min(590px, 90vw);
  padding-top: 175px;
  padding-bottom: 60px;
  margin-left: max(5.2vw, calc((100vw - var(--max)) / 2));
}

.eyebrow {
  margin: 0 0 22px;
  color: var(--blue-300);
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.eyebrow-blue { color: var(--blue-500); }

.hero h1 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 76px;
  font-weight: 500;
  line-height: 1.05;
  letter-spacing: -0.02em;
}
.hero h1 span { color: var(--blue-400); }

.hero-copy {
  max-width: 565px;
  margin: 28px 0 30px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 18px;
  line-height: 1.65;
}

.button-row { display: flex; gap: 14px; flex-wrap: wrap; }

.hero-roadmap {
  position: absolute;
  z-index: 3;
  right: max(4vw, calc((100vw - var(--max)) / 2));
  bottom: 60px;
  width: 360px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  background: rgba(8, 18, 31, 0.76);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(18px);
}

.roadmap-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: rgba(255, 255, 255, 0.76);
  font-size: 12px;
}

.live-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: #4FE092;
  box-shadow: 0 0 12px #4FE092;
  animation: pulse 2.4s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 12px #4FE092; }
  50%      { opacity: 0.55; box-shadow: 0 0 4px #4FE092; }
}

.hero-roadmap ol { margin: 0 0 14px; padding: 0; list-style: none; }

.hero-roadmap li {
  min-height: 56px;
  display: grid;
  grid-template-columns: 26px 1fr auto;
  align-items: center;
  gap: 5px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.hero-roadmap strong,
.hero-roadmap small { display: block; }

.hero-roadmap strong { font-size: 12px; font-weight: 500; }

.hero-roadmap small,
.step-index,
.hero-roadmap em {
  color: rgba(255, 255, 255, 0.52);
  font-size: 10px;
  font-style: normal;
}

.hero-roadmap .complete em,
.hero-roadmap .active em { color: #4FE092; }

.hero-roadmap > a {
  color: var(--blue-200);
  font-size: 11px;
  text-decoration: none;
}
.hero-roadmap > a:hover { color: #fff; }

/* ══ Sections ══ */
.section { padding: 108px 0; }

.intro-grid {
  display: grid;
  grid-template-columns: 0.9fr 1.25fr;
  gap: 110px;
  align-items: end;
}

h2 {
  margin: 0 0 24px;
  font-family: var(--font-display);
  font-size: 44px;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.section-copy,
.product-copy > p,
.final-cta p:not(.eyebrow):not(.form-message) {
  color: var(--text2);
  font-size: 16px;
  line-height: 1.7;
}

.proof-block { border-top: 1px solid var(--border); }

.city-line {
  min-height: 78px;
  padding: 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid var(--border);
  color: var(--grey-700);
  font-size: 12px;
}

.metrics { margin: 0; display: grid; grid-template-columns: repeat(4, 1fr); }
.metrics div { padding: 28px 8px 0; }

.metrics dt,
.network-metrics dt {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
}

.metrics dd,
.network-metrics dd {
  margin: 4px 0 0;
  color: var(--text2);
  font-size: 11px;
}

/* ══ Journey ══ */
.journey {
  padding-top: 0;
  background: linear-gradient(var(--bg), var(--bg2));
}

.journey-list {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: 0 24px 70px rgba(23, 39, 70, 0.08);
}

.journey-row {
  min-height: 360px;
  display: grid;
  grid-template-columns: 0.78fr 1.42fr;
}
.journey-row + .journey-row { border-top: 1px solid var(--border); }
.journey-copy-right { grid-template-columns: 1.42fr 0.78fr; }

.journey-row img {
  height: 100%;
  min-height: 360px;
  object-fit: cover;
  transition: transform 900ms var(--ease-out);
}
.journey-row:hover img { transform: scale(1.035); }

.journey-copy { padding: 54px 44px; align-self: center; }

.journey-number {
  display: block;
  margin-bottom: 25px;
  color: var(--blue-500);
  font-family: var(--font-display);
  font-size: 24px;
}

.journey-copy h3 { margin: 0 0 15px; font-size: 29px; font-weight: 500; }
.journey-copy p { margin: 0 0 24px; color: var(--text2); line-height: 1.65; }

.journey-copy a,
.network-copy a {
  color: var(--blue-500);
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}
.journey-copy a:hover, .network-copy a:hover { text-decoration: underline; }

/* ══ Product ══ */
.product { background: var(--bg2); }

.product-grid {
  display: grid;
  grid-template-columns: 0.65fr 1.85fr;
  gap: 65px;
  align-items: center;
}

.product-copy h2 { font-size: 40px; }
.product-copy > p { margin: 0 0 30px; }

.product-image-wrap {
  overflow: hidden;
  border: 1px solid #DFE4EC;
  border-radius: 8px;
  background: var(--surface);
  box-shadow: 0 30px 80px rgba(23, 39, 70, 0.13);
}
[data-theme="dark"] .product-image-wrap { border-color: var(--border); }

/* ══ Network ══ */
.network {
  position: relative;
  min-height: 610px;
  overflow: hidden;
  color: #fff;
}

.network-image,
.network-overlay { position: absolute; inset: 0; height: 100%; }

.network-image { object-fit: cover; object-position: center; }

.network-overlay {
  background: linear-gradient(90deg, rgba(3, 12, 25, 0.98) 0%, rgba(3, 12, 25, 0.73) 38%, rgba(3, 12, 25, 0.06) 76%);
}

.network-content {
  position: relative;
  z-index: 2;
  min-height: 610px;
  padding: 105px 0 44px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.network-copy { width: 350px; }
.network-copy h2 { font-size: 44px; }
.network-copy p { color: rgba(255, 255, 255, 0.72); line-height: 1.65; margin: 0 0 18px; }

.network-metrics {
  width: min(730px, 100%);
  margin: 0 auto;
  padding: 17px 30px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 7px;
  background: rgba(4, 12, 24, 0.7);
  backdrop-filter: blur(14px);
}

.network-metrics div { text-align: center; }
.network-metrics div + div { border-left: 1px solid rgba(255, 255, 255, 0.14); }
.network-metrics dt { font-size: 20px; }
.network-metrics dd { color: rgba(255, 255, 255, 0.6); }

/* ══ Final CTA ══ */
.final-cta { text-align: center; }
.final-cta h2 { margin-bottom: 15px; font-size: 50px; }
.final-cta p:not(.eyebrow):not(.form-message) {
  width: min(630px, 100%);
  margin: 0 auto 30px;
}

.market-form { display: flex; justify-content: center; gap: 12px; }

.market-form select {
  width: 240px;
  min-height: 48px;
  padding: 0 16px;
  border: 1px solid #CFD6E1;
  border-radius: 5px;
  background: var(--surface);
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
}
[data-theme="dark"] .market-form select { border-color: var(--border); }

.form-message {
  min-height: 24px;
  margin: 15px 0 0;
  color: var(--success);
  font-size: 13px;
}

/* ══ Responsive ══ */
@media (max-width: 1100px) {
  .hero-roadmap { right: 32px; width: 330px; }
  .hero-content { margin-left: 32px; }
  .hero h1 { font-size: 64px; }
}

@media (max-width: 900px) {
  .hero { min-height: 820px; }
  .hero-content { padding-top: 145px; }
  .hero-roadmap { left: 32px; right: auto; bottom: 44px; }
  .intro-grid, .product-grid { grid-template-columns: 1fr; gap: 58px; }
  .journey-row, .journey-copy-right { grid-template-columns: 1fr; }
  .journey-copy-right img { order: 2; }
  .journey-row img { min-height: 320px; }
  .product-copy { max-width: 580px; }
}

@media (max-width: 680px) {
  .section { padding: 76px 0; }
  .hero { min-height: 790px; }
  .hero-image { object-position: 63% center; }
  .hero-shade { background: linear-gradient(90deg, rgba(4, 12, 23, 0.96), rgba(4, 12, 23, 0.58)); }
  .hero-content { width: calc(100% - 36px); margin-left: 18px; padding-top: 132px; }
  .hero h1 { font-size: 48px; }
  .hero-copy { font-size: 16px; }
  .hero-roadmap { left: 18px; bottom: 26px; width: calc(100% - 36px); }
  h2, .product-copy h2, .network-copy h2, .final-cta h2 { font-size: 35px; }
  .city-line { padding: 18px 0; flex-wrap: wrap; justify-content: flex-start; }
  .metrics { grid-template-columns: repeat(2, 1fr); }
  .journey-copy { padding: 38px 26px; }
  .journey-copy h3 { font-size: 25px; }
  .journey-row img { min-height: 250px; }
  .product-grid { gap: 40px; }
  .product-image-wrap { overflow-x: auto; }
  .product-image-wrap img { width: 820px; max-width: none; }
  .network { min-height: 650px; }
  .network-image { object-position: 64% center; }
  .network-overlay { background: linear-gradient(90deg, rgba(3, 12, 25, 0.96), rgba(3, 12, 25, 0.35)); }
  .network-content { min-height: 650px; padding-top: 72px; }
  .network-copy { width: min(340px, 100%); }
  .network-metrics { grid-template-columns: repeat(2, 1fr); gap: 22px 0; }
  .network-metrics div:nth-child(3) { border-left: 0; }
  .market-form { flex-direction: column; }
  .market-form select, .market-form .m-btn { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-image { animation: none; }
  .journey-row:hover img { transform: none; }
}
</style>
