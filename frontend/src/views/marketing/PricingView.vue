<template>
  <div class="mk">
    <section class="mk-hero">
      <div class="m-container">
        <p class="m-eyebrow" v-reveal>Pricing</p>
        <h1 v-reveal="{ delay: 80 }">Pay for the landing,<br />not the paperwork.</h1>
        <p class="lede" v-reveal="{ delay: 160 }">
          Government fees are always passed through at cost. Meridian charges for the
          coordination — the roadmap, the filings, and the people who unblock you.
        </p>

        <div class="toggle" v-reveal="{ delay: 220 }">
          <button :class="{ active: !annual }" @click="annual = false">Monthly</button>
          <button :class="{ active: annual }" @click="annual = true">
            Annual <span>−20%</span>
          </button>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="m-container plan-grid">
        <article
          v-for="(p, i) in plans"
          :key="p.name"
          class="plan"
          :class="{ featured: p.featured }"
          v-reveal="{ delay: i * 80, y: 20 }"
        >
          <span v-if="p.featured" class="plan-flag">Most popular</span>
          <h2>{{ p.name }}</h2>
          <p class="plan-blurb">{{ p.blurb }}</p>

          <p class="plan-price">
            <template v-if="p.price === null">Custom</template>
            <template v-else>
              <span class="cur">$</span>{{ annual ? Math.round(p.price * 0.8) : p.price }}
              <small>/ month</small>
            </template>
          </p>

          <router-link
            :to="p.price === null ? '/help' : '/profile'"
            class="m-btn"
            :class="p.featured ? 'm-btn-primary' : 'm-btn-ghost'"
          >{{ p.cta }}</router-link>

          <ul class="plan-features">
            <li v-for="f in p.features" :key="f">
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
                <path d="m3.5 8.4 3 3 6-6.8" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              {{ f }}
            </li>
          </ul>
        </article>
      </div>
    </section>

    <section class="section faq">
      <div class="m-container">
        <h2 v-reveal>Common questions</h2>
        <ul class="faq-list">
          <li v-for="(f, i) in faqs" :key="f.q" v-reveal="{ delay: i * 50, y: 12 }">
            <button @click="open = open === i ? -1 : i" :aria-expanded="open === i">
              {{ f.q }}
              <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
                <path d="m3.5 6 4.5 4.5L12.5 6" stroke="currentColor" stroke-width="1.7"
                      stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <p v-if="open === i">{{ f.a }}</p>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const annual = ref(false)
const open = ref(0)

const plans = [
  {
    name: 'Explore',
    price: 0,
    blurb: 'Understand what entering the market actually requires.',
    cta: 'Start free',
    featured: false,
    features: [
      'Full licence explorer (100 licences)',
      'Personalised requirement roadmap',
      'Market gap research for one sector',
      'Community support',
    ],
  },
  {
    name: 'Land',
    price: 249,
    blurb: 'Everything you need to get registered and operating.',
    cta: 'Build my roadmap',
    featured: true,
    features: [
      'Everything in Explore',
      'Automated filings (BRS, KRA, NSSF, SHA)',
      'Immigration permit applications',
      'Document vault and status tracking',
      'Concierge agent with your full context',
      'Two expert introductions per month',
    ],
  },
  {
    name: 'Enterprise',
    price: null,
    blurb: 'Multi-market entry with dedicated coordination.',
    cta: 'Talk to us',
    featured: false,
    features: [
      'Everything in Land',
      'Multiple markets and entities',
      'Dedicated account coordinator',
      'Custom agency integrations',
      'SLA and priority filing',
    ],
  },
]

const faqs = [
  {
    q: 'Are government fees included?',
    a: 'No. Statutory fees are set by the issuing agency and are always passed through at cost — Meridian shows you the exact amount before anything is submitted.',
  },
  {
    q: 'What happens if an application is rejected?',
    a: 'We diagnose the rejection reason, correct the submission, and refile at no extra charge on the Land plan.',
  },
  {
    q: 'Do I need to be in Kenya to use this?',
    a: 'No. The whole point is that you can complete market entry before you land. Some steps — such as biometric capture — still require an in-person visit, and your roadmap flags those clearly.',
  },
  {
    q: 'Can I cancel at any time?',
    a: 'Yes. Plans are month-to-month, and anything already filed stays filed. Your documents remain exportable after cancellation.',
  },
]
</script>

<style scoped>
.mk-hero {
  padding: 132px 0 72px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
}
.mk-hero h1 { font-size: 54px; font-weight: 500; margin: 18px 0 22px; }
.lede { max-width: 620px; font-size: 17px; line-height: 1.7; color: var(--text2); }

.toggle {
  display: inline-flex; gap: 4px; margin-top: 30px;
  padding: 4px; border-radius: 8px;
  background: var(--surface); border: 1px solid var(--border);
}
.toggle button {
  padding: 8px 18px; border: 0; border-radius: 6px;
  background: transparent; color: var(--text2);
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all .16s var(--ease-out);
}
.toggle button.active { background: var(--accent); color: #fff; }
.toggle button span { font-size: 11px; opacity: .85; }

.section { padding: 78px 0; }

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 20px;
  align-items: start;
}

.plan {
  position: relative;
  display: grid;
  gap: 14px;
  justify-items: start;
  padding: 30px 26px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  transition: box-shadow .22s var(--ease-out), transform .22s var(--ease-out);
}
.plan:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); }
.plan.featured { border-color: var(--accent); box-shadow: var(--shadow-md); }

.plan-flag {
  position: absolute; top: -11px; left: 26px;
  padding: 4px 11px; border-radius: 20px;
  background: var(--accent); color: #fff;
  font-size: 10.5px; font-weight: 700;
  letter-spacing: .05em; text-transform: uppercase;
}

.plan h2 { font-size: 20px; font-weight: 600; margin: 0; }
.plan-blurb { font-size: 13px; color: var(--text2); line-height: 1.6; }

.plan-price {
  font-family: var(--font-display);
  font-size: 42px; font-weight: 600;
  line-height: 1;
}
.plan-price .cur { font-size: 22px; vertical-align: super; margin-right: 1px; }
.plan-price small { font-size: 13px; font-weight: 400; color: var(--text3); }

.plan .m-btn { width: 100%; }

.plan-features { list-style: none; display: grid; gap: 10px; width: 100%; margin-top: 4px; }
.plan-features li {
  display: flex; align-items: flex-start; gap: 9px;
  font-size: 13px; color: var(--text2); line-height: 1.5;
}
.plan-features svg { flex-shrink: 0; margin-top: 3px; color: var(--success); }

.faq { background: var(--bg2); border-top: 1px solid var(--border); }
.faq h2 { font-size: 32px; margin-bottom: 26px; }

.faq-list {
  list-style: none;
  max-width: 760px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.faq-list li + li { border-top: 1px solid var(--border2); }
.faq-list button {
  width: 100%;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 17px 20px;
  background: transparent; border: 0;
  color: var(--text); font-size: 14.5px; font-weight: 500;
  text-align: left; cursor: pointer;
  transition: background .16s var(--ease-out);
}
.faq-list button:hover { background: var(--bg2); }
.faq-list button svg { flex-shrink: 0; color: var(--text3); transition: transform .2s var(--ease-out); }
.faq-list button[aria-expanded="true"] svg { transform: rotate(180deg); }
.faq-list p {
  padding: 0 20px 18px;
  font-size: 13.5px; color: var(--text2); line-height: 1.7;
  max-width: 620px;
}

@media (max-width: 900px) {
  .mk-hero { padding: 112px 0 60px; }
  .mk-hero h1 { font-size: 40px; }
}
</style>
