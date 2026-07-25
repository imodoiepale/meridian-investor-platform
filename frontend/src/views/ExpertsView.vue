<template>
  <div class="ex">
    <header class="ex-head">
      <div>
        <h2>Trusted local experts</h2>
        <p>Vetted advisors on the ground who already know your file.</p>
      </div>
      <div class="ex-filter">
        <button
          v-for="d in disciplines"
          :key="d"
          :class="{ active: discipline === d }"
          @click="discipline = d"
        >{{ d }}</button>
      </div>
    </header>

    <ul class="ex-grid">
      <li v-for="e in filtered" :key="e.name" class="ex-card" v-reveal="{ y: 14 }">
        <span class="ex-avatar" :style="{ background: e.tint }">{{ e.initials }}</span>
        <h3>{{ e.name }}</h3>
        <p class="ex-firm">{{ e.firm }}</p>
        <p class="ex-blurb">{{ e.blurb }}</p>
        <ul class="ex-tags">
          <li v-for="t in e.tags" :key="t">{{ t }}</li>
        </ul>
        <router-link to="/concierge" class="m-btn m-btn-ghost m-btn-sm">Request an intro</router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const discipline = ref('All')
const disciplines = ['All', 'Legal', 'Tax', 'Banking', 'Immigration']

const experts = [
  {
    name: 'Grace Odhiambo', firm: 'Odhiambo & Co. Advocates', initials: 'GO',
    discipline: 'Legal', tint: 'linear-gradient(135deg,#1D55F5,#0F35A6)',
    blurb: 'Company formation, shareholder agreements, and foreign-ownership structuring.',
    tags: ['Company setup', 'Contracts'],
  },
  {
    name: 'Vincent Mwangi', firm: 'Mwangi Tax Partners', initials: 'VM',
    discipline: 'Tax', tint: 'linear-gradient(135deg,#20A565,#0E6B41)',
    blurb: 'KRA registration, VAT and PAYE obligations, and transfer-pricing reviews.',
    tags: ['KRA PIN', 'VAT', 'PAYE'],
  },
  {
    name: 'James Karuki', firm: 'Karuki Consulting', initials: 'JK',
    discipline: 'Banking', tint: 'linear-gradient(135deg,#7E9FFF,#2B61FF)',
    blurb: 'Corporate account opening and FX facilities for non-resident directors.',
    tags: ['Corporate accounts', 'FX'],
  },
  {
    name: 'Amina Hassan', firm: 'Hassan Immigration Services', initials: 'AH',
    discipline: 'Immigration', tint: 'linear-gradient(135deg,#D97706,#92400E)',
    blurb: 'Class G investor permits, dependant passes, and work-permit renewals.',
    tags: ['Class G', 'Dependants'],
  },
  {
    name: 'Peter Njoroge', firm: 'Njoroge & Associates', initials: 'PN',
    discipline: 'Legal', tint: 'linear-gradient(135deg,#0F35A6,#071321)',
    blurb: 'Commercial property leases, land due diligence, and county compliance.',
    tags: ['Property', 'County permits'],
  },
  {
    name: 'Lucy Wanjiru', firm: 'Wanjiru Advisory', initials: 'LW',
    discipline: 'Tax', tint: 'linear-gradient(135deg,#2B61FF,#123FC1)',
    blurb: 'Statutory filings, NSSF and SHA employer registration, and payroll setup.',
    tags: ['NSSF', 'SHA', 'Payroll'],
  },
]

const filtered = computed(() =>
  discipline.value === 'All' ? experts : experts.filter((e) => e.discipline === discipline.value)
)
</script>

<style scoped>
.ex { max-width: 1080px; }

.ex-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 20px; flex-wrap: wrap; margin-bottom: 22px;
}
.ex-head h2 { font-size: 24px; margin-bottom: 6px; }
.ex-head p { color: var(--text2); font-size: 13.5px; }

.ex-filter { display: flex; gap: 6px; flex-wrap: wrap; }
.ex-filter button {
  padding: 7px 14px; border-radius: 20px;
  border: 1px solid var(--border); background: var(--surface);
  color: var(--text2); font-size: 12.5px; font-weight: 500; cursor: pointer;
  transition: all .16s var(--ease-out);
}
.ex-filter button:hover { border-color: var(--accent); color: var(--accent); }
.ex-filter button.active {
  background: var(--accent); border-color: var(--accent); color: #fff;
}

.ex-grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.ex-card {
  display: grid; gap: 8px; justify-items: start;
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: box-shadow .2s var(--ease-out), transform .2s var(--ease-out);
}
.ex-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

.ex-avatar {
  width: 44px; height: 44px;
  display: grid; place-items: center;
  border-radius: 50%;
  color: #fff; font-size: 14px; font-weight: 700;
  margin-bottom: 4px;
}

.ex-card h3 { font-size: 15px; font-weight: 600; }
.ex-firm { font-size: 12px; color: var(--accent); font-weight: 500; }
.ex-blurb { font-size: 12.5px; color: var(--text2); line-height: 1.55; }

.ex-tags { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0 6px; }
.ex-tags li {
  padding: 3px 9px; border-radius: 20px;
  background: var(--surface2); color: var(--text2);
  font-size: 10.5px; font-weight: 500;
}
</style>
