<template>
  <div class="mk">
    <section class="mk-hero">
      <div class="m-container">
        <p class="m-eyebrow" v-reveal>About Meridian</p>
        <h1 v-reveal="{ delay: 80 }">Expansion should not<br />depend on who you know.</h1>
        <p class="lede" v-reveal="{ delay: 160 }">
          Entering a new market is mostly an information problem. Which permits apply to you,
          in what order, from which agency, at what cost. Meridian turns that into one
          coordinated roadmap — and then does the filing for you.
        </p>
      </div>
    </section>

    <section class="section">
      <div class="m-container split">
        <div v-reveal>
          <h2>Built in Nairobi, for anyone landing here.</h2>
          <p>
            Meridian started with a simple observation: the rules for setting up a business
            in Kenya are all public, and almost nobody can follow them. They live across
            dozens of agency portals, in PDFs, in tacit knowledge held by consultants.
          </p>
          <p>
            We encoded that knowledge — 100 licences, their issuing agencies, who they apply
            to, and how they sequence — and put an agent in front of it that can actually
            complete the applications.
          </p>
        </div>
        <dl class="facts" v-reveal="{ delay: 120 }">
          <div v-for="f in facts" :key="f.label">
            <dt>{{ f.value }}</dt>
            <dd>{{ f.label }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <section class="section values">
      <div class="m-container">
        <p class="m-eyebrow" v-reveal>What we optimise for</p>
        <h2 v-reveal="{ delay: 60 }">Three principles.</h2>
        <div class="value-grid">
          <article v-for="(v, i) in values" :key="v.title" v-reveal="{ delay: 80 + i * 70, y: 18 }">
            <span class="value-num">{{ String(i + 1).padStart(2, '0') }}</span>
            <h3>{{ v.title }}</h3>
            <p>{{ v.copy }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section team">
      <div class="m-container">
        <p class="m-eyebrow" v-reveal>The team</p>
        <h2 v-reveal="{ delay: 60 }">Who is building this.</h2>
        <ul class="team-grid">
          <li v-for="(m, i) in team" :key="m.name" v-reveal="{ delay: 80 + i * 60, y: 16 }">
            <span class="team-avatar">{{ m.initials }}</span>
            <strong>{{ m.name }}</strong>
            <small>{{ m.role }}</small>
          </li>
        </ul>
        <p class="team-note">
          Built for the Claude Hackathon by <strong>Claude Community Kenya</strong>.
        </p>
      </div>
    </section>

    <section class="section cta">
      <div class="m-container" v-reveal>
        <h2>Ready to see your roadmap?</h2>
        <router-link to="/profile" class="m-btn m-btn-primary">Build my roadmap</router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
const facts = [
  { value: '100', label: 'Kenya licences mapped' },
  { value: '30+', label: 'Issuing agencies' },
  { value: '23', label: 'Automated filings' },
  { value: '1', label: 'Coordinated roadmap' },
]

const values = [
  {
    title: 'Accuracy over volume',
    copy: 'We would rather show you eight licences that genuinely apply than eighty that might. Every entry is tagged to the industries that actually need it.',
  },
  {
    title: 'Do the work, not the advice',
    copy: 'A checklist is not a service. Meridian fills the forms, uploads the documents, and tracks the reference numbers on the real government portals.',
  },
  {
    title: 'Local expertise stays in the loop',
    copy: 'Automation handles the mechanical filings. Vetted advocates, tax advisors, and bankers handle the judgement calls.',
  },
]

const team = [
  { name: 'James Epale', role: 'Platform & architecture', initials: 'JE' },
  { name: 'Timothy Kipkoech', role: 'Licence intelligence', initials: 'TK' },
  { name: 'Joseph Kerandi', role: 'Investor dashboard', initials: 'JK' },
  { name: 'Millicent Morara', role: 'Product & marketing', initials: 'MM' },
]
</script>

<style scoped>
.mk-hero {
  padding: 132px 0 72px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
}
.mk-hero h1 {
  font-size: 54px;
  font-weight: 500;
  margin: 18px 0 22px;
}
.lede {
  max-width: 640px;
  font-size: 17px;
  line-height: 1.7;
  color: var(--text2);
}

.section { padding: 88px 0; }

h2 { font-size: 36px; margin-bottom: 22px; }

.split {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 72px;
  align-items: start;
}
.split p {
  color: var(--text2);
  font-size: 15px;
  line-height: 1.75;
  margin-bottom: 16px;
}

.facts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 28px 20px;
  padding-top: 8px;
}
.facts dt {
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 600;
  color: var(--accent);
}
.facts dd { margin-top: 4px; font-size: 12.5px; color: var(--text2); }

.values { background: var(--bg2); border-block: 1px solid var(--border); }

.value-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 28px;
  margin-top: 12px;
}
.value-num {
  display: block;
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--accent);
  margin-bottom: 14px;
}
.value-grid h3 { font-size: 19px; font-weight: 600; margin-bottom: 10px; }
.value-grid p { color: var(--text2); font-size: 14px; line-height: 1.7; }

.team-grid {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 20px;
  margin-top: 12px;
}
.team-grid li {
  display: grid;
  justify-items: start;
  gap: 4px;
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: box-shadow .2s var(--ease-out), transform .2s var(--ease-out);
}
.team-grid li:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

.team-avatar {
  width: 42px; height: 42px;
  display: grid; place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--blue-500), var(--blue-700));
  color: #fff; font-size: 13px; font-weight: 700;
  margin-bottom: 8px;
}
.team-grid strong { font-size: 14.5px; font-weight: 600; }
.team-grid small { font-size: 12px; color: var(--text2); }

.team-note { margin-top: 26px; font-size: 13px; color: var(--text3); }
.team-note strong { color: var(--text2); }

.cta { text-align: center; background: var(--bg2); border-top: 1px solid var(--border); }
.cta h2 { margin-bottom: 26px; }

@media (max-width: 900px) {
  .mk-hero { padding: 112px 0 60px; }
  .mk-hero h1 { font-size: 40px; }
  .split { grid-template-columns: 1fr; gap: 44px; }
  h2 { font-size: 30px; }
}
</style>
