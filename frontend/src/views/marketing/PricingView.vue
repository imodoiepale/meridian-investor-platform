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

    <section class="section compare">
      <div class="m-container">
        <p class="m-eyebrow" v-reveal>Compare</p>
        <h2 v-reveal="{ delay: 60 }">What each plan includes.</h2>

        <div class="cmp-wrap" v-reveal="{ delay: 120 }">
          <table class="cmp">
            <caption class="m-sr-only">
              Feature comparison across the Explore, Land and Enterprise plans
            </caption>
            <thead>
              <tr>
                <th scope="col">Feature</th>
                <th
                  v-for="p in plans"
                  :key="p.name"
                  scope="col"
                  :class="{ featured: p.featured }"
                >{{ p.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in comparison" :key="row.feature">
                <th scope="row">{{ row.feature }}</th>
                <td
                  v-for="(cell, idx) in row.values"
                  :key="plans[idx].name"
                  :data-plan="plans[idx].name"
                  :class="{ featured: plans[idx].featured }"
                >
                  <svg
                    v-if="cell === true"
                    viewBox="0 0 16 16" width="14" height="14" fill="none"
                    class="tick" role="img" aria-label="Included"
                  >
                    <path d="m3.5 8.4 3 3 6-6.8" stroke="currentColor" stroke-width="2"
                          stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <template v-else-if="cell === false">
                    <span class="dash" aria-hidden="true">—</span>
                    <span class="m-sr-only">Not included</span>
                  </template>
                  <template v-else>{{ cell }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="section fees">
      <div class="m-container">
        <p class="m-eyebrow" v-reveal>Government fees</p>
        <h2 v-reveal="{ delay: 60 }">What you pay the Kenyan government.</h2>
        <p class="fees-lede" v-reveal="{ delay: 110 }">
          Statutory fees are set by the issuing agency and paid to that agency, not to
          Meridian. We pass them through at cost and show the exact amount before
          anything is submitted. The figures below cover a typical foreign-owned
          limited company registering in Nairobi.
        </p>

        <div class="fees-wrap" v-reveal="{ delay: 160 }">
          <table class="fees-table">
            <caption class="m-sr-only">
              Indicative statutory fees for registering a limited company in Kenya,
              by phase, with the issuing agency and working days for each step
            </caption>
            <thead>
              <tr>
                <th scope="col">Step</th>
                <th scope="col">Agency</th>
                <th scope="col" class="num">Fee</th>
                <th scope="col" class="num">Days</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="phase in feePhases" :key="phase.name">
                <tr class="phase-row">
                  <th scope="colgroup" colspan="4">{{ phase.name }}</th>
                </tr>
                <tr v-for="f in phase.items" :key="f.step">
                  <th scope="row">
                    {{ f.step }}
                    <small v-if="f.note">{{ f.note }}</small>
                  </th>
                  <td data-label="Agency">{{ f.agency }}</td>
                  <td data-label="Fee" class="num">
                    <span v-if="f.kes === 0" class="free">No fee</span>
                    <template v-else>{{ formatKes(f.kes) }}</template>
                  </td>
                  <td data-label="Days" class="num">{{ f.days }}</td>
                </tr>
              </template>
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Indicative total</th>
                <td data-label="Agency" aria-hidden="true"></td>
                <td data-label="Fee" class="num">{{ formatKes(feeTotal) }}</td>
                <td data-label="Days" class="num">—</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <ul class="fees-notes">
          <li>
            The Single Business Permit is a county fee and varies by county — roughly
            KES 5,000 to KES 50,000, with Nairobi at the top of that range. Swapping it
            out moves the total to somewhere between
            {{ formatKes(feeTotal - 15000 + 5000) }} and
            {{ formatKes(feeTotal - 15000 + 50000) }}.
          </li>
          <li>
            The company seal is bought from a private vendor rather than an agency. It
            is included above because you cannot operate without one.
          </li>
          <li>
            Working days are per step and overlap in practice, so they do not add up to
            a delivery date. Your roadmap sequences them against real agency timelines.
          </li>
          <li>
            Sector licences are not included — they depend on your industry. The
            <router-link to="/licences">licence explorer</router-link> lists all 100
            and flags which apply to you.
          </li>
        </ul>
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
import usePageMeta from './usePageMeta'

usePageMeta({
  description:
    'Meridian pricing: Explore is free, Land is $249 a month, Enterprise is custom. '
    + 'Kenyan government fees are passed through at cost and shown before you submit.',
  image: '/meridian-global-landing/assets/images/market-entry-command-center.png',
  imageAlt: 'The Meridian market entry command centre',
})

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

// Feature matrix. Every row is taken from the `plans` array above — a plan that
// says "Everything in Explore" inherits those rows, which is why Land and
// Enterprise tick the Explore features rather than claiming more than we sell.
const comparison = [
  { feature: 'Licence explorer (100 licences)', values: [true, true, true] },
  { feature: 'Personalised requirement roadmap', values: [true, true, true] },
  { feature: 'Market gap research', values: ['One sector', 'One sector', 'One sector'] },
  { feature: 'Community support', values: [true, true, true] },
  { feature: 'Government fees', values: ['At cost', 'At cost', 'At cost'] },
  { feature: 'Automated filings (BRS, KRA, NSSF, SHA)', values: [false, true, true] },
  { feature: 'Immigration permit applications', values: [false, true, true] },
  { feature: 'Document vault and status tracking', values: [false, true, true] },
  { feature: 'Concierge agent with your full context', values: [false, true, true] },
  { feature: 'Expert introductions', values: [false, 'Two / month', 'Two / month'] },
  { feature: 'Refiling after a rejection', values: [false, 'No extra charge', 'No extra charge'] },
  { feature: 'Multiple markets and entities', values: [false, false, true] },
  { feature: 'Dedicated account coordinator', values: [false, false, true] },
  { feature: 'Custom agency integrations', values: [false, false, true] },
  { feature: 'SLA and priority filing', values: [false, false, true] },
]

// Statutory fees. Every figure below is lifted from the `base_phases` roadmap in
// backend/routes/kenya_invest.py — cost_kes and timeline_days on each node.
// Do not edit these by hand; if the backend changes, change them here to match.
const feePhases = [
  {
    name: 'Pre-registration',
    items: [
      { step: 'Business name search', agency: 'Business Registration Service', kes: 150, days: 1 },
      { step: 'Name reservation', agency: 'Business Registration Service', kes: 2050, days: 2, note: 'Valid for 30 days' },
    ],
  },
  {
    name: 'Company registration',
    items: [
      { step: 'Certificate of Incorporation (CR1)', agency: 'Business Registration Service', kes: 10950, days: 3 },
      { step: 'Company seal and statutory books', agency: 'Private vendor', kes: 4000, days: 2, note: 'Not a government fee' },
    ],
  },
  {
    name: 'Tax and statutory compliance',
    items: [
      { step: 'Company KRA PIN', agency: 'Kenya Revenue Authority', kes: 0, days: 1 },
      { step: 'VAT registration', agency: 'Kenya Revenue Authority', kes: 0, days: 3, note: 'Required above KES 5M turnover' },
      { step: 'NSSF registration (employer)', agency: 'National Social Security Fund', kes: 0, days: 1 },
      { step: 'NHIF registration (employer)', agency: 'National Hospital Insurance Fund', kes: 0, days: 1 },
    ],
  },
  {
    name: 'County and operational permits',
    items: [
      { step: 'Single Business Permit', agency: 'County government', kes: 15000, days: 7, note: 'Varies by county' },
      { step: 'Fire safety certificate', agency: 'County fire department', kes: 5000, days: 7 },
    ],
  },
]

const feeTotal = feePhases.reduce(
  (sum, p) => sum + p.items.reduce((s, i) => s + i.kes, 0), 0
)

const formatKes = (n) => `KES ${n.toLocaleString('en-KE')}`

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

/* ── Comparison table ─────────────────────────────────────────────── */
.compare h2 { font-size: 32px; margin: 10px 0 26px; }

/* No overflow/clip here on purpose: an `overflow` value other than `visible`
   would make this the scroll container and the sticky header would pin to the
   table instead of the viewport. Corners are rounded on the cells instead. */
.cmp-wrap {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
}

.cmp {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
.cmp caption { text-align: left; }

.cmp thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 15px 18px;
  background: var(--surface2);
  border-bottom: 1px solid var(--border);
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}
.cmp thead th:first-child { text-align: left; border-radius: var(--radius-lg) 0 0 0; }
.cmp thead th:last-child { border-radius: 0 var(--radius-lg) 0 0; }
.cmp thead th.featured { color: var(--accent); }
.cmp tbody tr:last-child th { border-radius: 0 0 0 var(--radius-lg); }
.cmp tbody tr:last-child td:last-child { border-radius: 0 0 var(--radius-lg) 0; }

.cmp tbody th {
  padding: 13px 18px;
  color: var(--text2);
  font-size: 13px;
  font-weight: 400;
  text-align: left;
}
.cmp tbody td {
  padding: 13px 18px;
  text-align: center;
  color: var(--text2);
  font-size: 12.5px;
  vertical-align: middle;
}
.cmp tbody tr + tr th,
.cmp tbody tr + tr td { border-top: 1px solid var(--border2); }
.cmp tbody tr:hover th,
.cmp tbody tr:hover td { background: var(--bg2); }
.cmp td.featured { background: var(--accent-soft); }
.cmp tbody tr:hover td.featured { background: var(--accent-soft); }

.cmp .tick { color: var(--success); vertical-align: middle; }
.cmp .dash { color: var(--text3); }

/* ── Government fees ──────────────────────────────────────────────── */
.fees { background: var(--bg2); border-top: 1px solid var(--border); }
.fees h2 { font-size: 32px; margin: 10px 0 18px; }
.fees-lede {
  max-width: 660px;
  font-size: 14.5px;
  line-height: 1.75;
  color: var(--text2);
  margin-bottom: 28px;
}

.fees-wrap {
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  overflow: hidden;
}

.fees-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
.fees-table caption { text-align: left; }

.fees-table thead th {
  padding: 13px 18px;
  background: var(--surface2);
  border-bottom: 1px solid var(--border);
  color: var(--text2);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  text-align: left;
}

.fees-table .phase-row th {
  padding: 12px 18px;
  background: var(--bg2);
  border-top: 1px solid var(--border2);
  color: var(--text3);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .06em;
  text-transform: uppercase;
  text-align: left;
}

.fees-table tbody th[scope='row'] {
  padding: 13px 18px;
  color: var(--text);
  font-size: 13.5px;
  font-weight: 500;
  text-align: left;
}
.fees-table tbody th[scope='row'] small {
  display: block;
  margin-top: 3px;
  color: var(--text3);
  font-size: 11.5px;
  font-weight: 400;
}
.fees-table tbody td {
  padding: 13px 18px;
  color: var(--text2);
  font-size: 13px;
}
.fees-table .num { text-align: right; font-variant-numeric: tabular-nums; }
.fees-table .free { color: var(--success); }

.fees-table tfoot th,
.fees-table tfoot td {
  padding: 15px 18px;
  background: var(--surface2);
  border-top: 1px solid var(--border);
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  text-align: left;
}
.fees-table tfoot .num { text-align: right; }

.fees-notes {
  list-style: none;
  display: grid;
  gap: 10px;
  max-width: 720px;
  margin-top: 22px;
}
.fees-notes li {
  position: relative;
  padding-left: 16px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text3);
}
.fees-notes li::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--border);
}
.fees-notes a { color: var(--accent); font-weight: 600; text-decoration: none; }
.fees-notes a:hover { text-decoration: underline; }

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
  .compare h2, .fees h2 { font-size: 27px; }
}

/* Both tables stop being tables below 760px and become one card per row. */
@media (max-width: 760px) {
  .cmp-wrap, .fees-wrap {
    border: 0;
    border-radius: 0;
    background: transparent;
    overflow: visible;
  }

  .cmp, .cmp tbody, .cmp tr, .cmp th, .cmp td,
  .fees-table, .fees-table tbody, .fees-table tfoot,
  .fees-table tr, .fees-table th, .fees-table td { display: block; }

  .cmp thead, .fees-table thead { display: none; }

  .cmp tbody tr, .fees-table tbody tr:not(.phase-row), .fees-table tfoot tr {
    margin-bottom: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .cmp tbody tr + tr th,
  .cmp tbody tr + tr td { border-top: 0; }

  .cmp tbody th, .fees-table tbody th[scope='row'] {
    background: var(--surface2);
    border-bottom: 1px solid var(--border2);
    color: var(--text);
    font-size: 13.5px;
    font-weight: 600;
  }

  .cmp tbody td, .fees-table tbody td, .fees-table tfoot td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 44px;
    text-align: right;
  }
  .cmp tbody td + td, .fees-table tbody td + td { border-top: 1px solid var(--border2); }

  /* The column header the cell lost when the table became cards. */
  .cmp tbody td::before,
  .fees-table tbody td::before,
  .fees-table tfoot td::before {
    content: attr(data-plan) attr(data-label);
    color: var(--text3);
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: .04em;
    text-transform: uppercase;
  }

  .cmp td.featured, .cmp tbody tr:hover td.featured { background: var(--accent-soft); }
  .cmp tbody tr:hover th, .cmp tbody tr:hover td { background: inherit; }

  .fees-table .phase-row th {
    margin: 20px 0 8px;
    padding: 0;
    background: transparent;
    border-top: 0;
  }
  .fees-table tfoot th { border-bottom: 1px solid var(--border2); }
  .fees-table tfoot td[aria-hidden='true'] { display: none; }
}

/* Toggle sits above the fold on mobile — keep it thumb-sized. */
.toggle button { min-height: 44px; }

@media (prefers-reduced-motion: reduce) {
  .plan,
  .toggle button,
  .faq-list button,
  .faq-list button svg { transition: none; }
  .plan:hover { transform: none; }
}
</style>
