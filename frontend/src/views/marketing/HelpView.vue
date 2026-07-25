<template>
  <div class="mk">
    <section class="mk-hero">
      <div class="m-container">
        <p class="m-eyebrow" v-reveal>Help center</p>
        <h1 v-reveal="{ delay: 80 }">How can we help?</h1>
        <div class="search" v-reveal="{ delay: 150 }">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="none" aria-hidden="true">
            <circle cx="8.8" cy="8.8" r="5.3" stroke="currentColor" stroke-width="1.6"/>
            <path d="m12.8 12.8 3.7 3.7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
          <input v-model="q" type="search" placeholder="Search articles…" aria-label="Search help articles" />
        </div>
      </div>
    </section>

    <section class="section">
      <div class="m-container">
        <div v-if="q" class="results">
          <p class="results-count">{{ matches.length }} result{{ matches.length === 1 ? '' : 's' }}</p>
          <ul class="article-list">
            <li v-for="a in matches" :key="a.title">
              <strong>{{ a.title }}</strong>
              <p>{{ a.body }}</p>
              <span class="topic">{{ a.topic }}</span>
            </li>
          </ul>
          <p v-if="!matches.length" class="no-results">
            Nothing matched that. <router-link to="/concierge">Ask the concierge</router-link> instead.
          </p>
        </div>

        <div v-else class="topic-grid">
          <article v-for="(t, i) in topics" :key="t.title" v-reveal="{ delay: i * 70, y: 18 }">
            <span class="topic-icon" v-html="t.icon" aria-hidden="true" />
            <h3>{{ t.title }}</h3>
            <p>{{ t.blurb }}</p>
            <ul>
              <li v-for="a in articlesFor(t.title)" :key="a.title">{{ a.title }}</li>
            </ul>
          </article>
        </div>
      </div>
    </section>

    <section class="section contact">
      <div class="m-container contact-inner" v-reveal>
        <div>
          <h2>Still stuck?</h2>
          <p>Your concierge has your full file — profile, roadmap, and every filing so far.</p>
        </div>
        <div class="contact-actions">
          <router-link to="/concierge" class="m-btn m-btn-primary">Message the concierge</router-link>
          <a href="mailto:hello@meridian.global" class="m-btn m-btn-ghost">Email us</a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const q = ref('')

const topics = [
  {
    title: 'Getting started',
    blurb: 'Set up your profile and generate your first roadmap.',
    icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M10 2.5 12 5l3.2.3-1.4 2.9 1.4 2.9L12 11.4 10 14l-2-2.6-3.2-.3 1.4-2.9L4.8 5.3 8 5l2-2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  },
  {
    title: 'Licences & permits',
    blurb: 'Understand which of the 100 Kenya licences apply to you.',
    icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M5 2.5h6l4 4V17a.5.5 0 0 1-.5.5h-9A.5.5 0 0 1 5 17V2.5Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M11 2.5v4h4M7.5 11h5M7.5 14h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
  },
  {
    title: 'Applications',
    blurb: 'How automated filings work and what we need from you.',
    icon: '<svg viewBox="0 0 20 20" fill="none"><path d="M3 10.5 7.5 15 17 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    title: 'Billing',
    blurb: 'Plans, government fees, invoices, and refunds.',
    icon: '<svg viewBox="0 0 20 20" fill="none"><rect x="2.5" y="5" width="15" height="10.5" rx="1.6" stroke="currentColor" stroke-width="1.5"/><path d="M2.5 8.5h15" stroke="currentColor" stroke-width="1.5"/></svg>',
  },
]

const articles = [
  { topic: 'Getting started', title: 'What Meridian needs to build your roadmap', body: 'Your nationality, sector, target county, and passport details are enough to generate a first roadmap. Everything else can be filled in later.' },
  { topic: 'Getting started', title: 'Choosing the right market', body: 'Compare markets on setup cost, time to operational, and licence burden before you commit.' },
  { topic: 'Licences & permits', title: 'Why some licences apply to every business', body: 'Registration, tax, and county permits are universal. Everything else is tagged to the industries that genuinely need it.' },
  { topic: 'Licences & permits', title: 'National vs county licences', body: 'National licences are issued once. County licences — like the Single Business Permit — depend on where you physically operate.' },
  { topic: 'Applications', title: 'How automated filing works', body: 'Meridian drives the real agency portal in a browser, fills the form from your profile, and returns the reference number.' },
  { topic: 'Applications', title: 'What happens if a filing is rejected', body: 'We diagnose the reason, correct the submission, and refile. You are notified at every state change.' },
  { topic: 'Applications', title: 'Supplying missing form fields', body: 'Some agency forms need more than your core profile. The concierge asks for only the missing fields before it submits.' },
  { topic: 'Billing', title: 'Are government fees included?', body: 'No — statutory fees are passed through at cost and always shown before submission.' },
  { topic: 'Billing', title: 'Changing or cancelling your plan', body: 'Plans are month-to-month. Anything already filed stays filed, and documents remain exportable.' },
]

const articlesFor = (topic) => articles.filter((a) => a.topic === topic)

const matches = computed(() => {
  const needle = q.value.trim().toLowerCase()
  if (!needle) return []
  return articles.filter(
    (a) => `${a.title} ${a.body} ${a.topic}`.toLowerCase().includes(needle)
  )
})
</script>

<style scoped>
.mk-hero {
  padding: 132px 0 66px;
  background: var(--bg2);
  border-bottom: 1px solid var(--border);
}
.mk-hero h1 { font-size: 48px; font-weight: 500; margin: 18px 0 26px; }

.search {
  display: flex; align-items: center; gap: 10px;
  max-width: 520px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text3);
  transition: border-color .16s var(--ease-out);
}
.search:focus-within { border-color: var(--accent); }
.search input {
  flex: 1;
  min-height: 50px;
  border: 0; background: transparent; outline: none;
  color: var(--text); font-size: 14.5px;
}

.section { padding: 78px 0; }

.topic-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 20px;
}
.topic-grid article {
  padding: 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  transition: box-shadow .22s var(--ease-out), transform .22s var(--ease-out);
}
.topic-grid article:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

.topic-icon {
  display: grid; place-items: center;
  width: 38px; height: 38px;
  border-radius: 9px;
  background: var(--accent-soft); color: var(--accent);
  margin-bottom: 14px;
}
.topic-icon :deep(svg) { width: 19px; height: 19px; }

.topic-grid h3 { font-size: 16px; font-weight: 600; margin-bottom: 7px; }
.topic-grid > article > p { font-size: 13px; color: var(--text2); line-height: 1.6; margin-bottom: 14px; }

.topic-grid ul { list-style: none; display: grid; gap: 9px; }
.topic-grid ul li {
  font-size: 12.5px; color: var(--text2);
  padding-left: 14px; position: relative;
  cursor: pointer;
  transition: color .16s var(--ease-out);
}
.topic-grid ul li::before {
  content: '→';
  position: absolute; left: 0;
  color: var(--accent);
}
.topic-grid ul li:hover { color: var(--accent); }

.results-count { font-size: 12.5px; color: var(--text3); margin-bottom: 16px; }
.article-list { list-style: none; display: grid; gap: 14px; max-width: 720px; }
.article-list li {
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.article-list strong { display: block; font-size: 14.5px; margin-bottom: 6px; }
.article-list p { font-size: 13px; color: var(--text2); line-height: 1.65; margin-bottom: 10px; }

.topic {
  display: inline-block;
  padding: 3px 9px; border-radius: 20px;
  background: var(--accent-soft); color: var(--accent);
  font-size: 10.5px; font-weight: 600;
}

.no-results { font-size: 14px; color: var(--text2); }
.no-results a { color: var(--accent); font-weight: 600; text-decoration: none; }

.contact { background: var(--bg2); border-top: 1px solid var(--border); }
.contact-inner {
  display: flex; align-items: center; justify-content: space-between;
  gap: 28px; flex-wrap: wrap;
}
.contact h2 { font-size: 30px; margin-bottom: 8px; }
.contact p { font-size: 14.5px; color: var(--text2); }
.contact-actions { display: flex; gap: 12px; flex-wrap: wrap; }

@media (max-width: 900px) {
  .mk-hero { padding: 112px 0 56px; }
  .mk-hero h1 { font-size: 38px; }
}
</style>
