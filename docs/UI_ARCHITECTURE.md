# UI architecture

How the frontend is organised after the layout overhaul, where each investor-facing
feature actually lives, and which parts are shared (and therefore off-limits without
a heads-up).

---

## Why this exists

Before the overhaul, six views hand-rolled their own header (`navbar`, `ki-nav` ×3,
`dash-header`, `wizard-header`) and two more (`LoginView`, `ConciergeView`) hardcoded
a blue/teal palette that ignored the design tokens entirely. The result was visible
branding drift — the site looked like a different product on every page.

The root cause was structural, not cosmetic: **there was no shared layout.** Two
layout components and a nested router now fix that. Every view renders inside exactly
one of them and inherits the chrome.

---

## Layouts

Two route records both sit at path `/`. Vue Router matches the more specific child,
so which layout wraps a page is decided purely by which record its child belongs to.

### `layouts/PublicLayout.vue` — signed-out

Absolute 76px header that turns into a fixed 66px translucent bar
(`rgba(7,19,33,.96)`, `blur(18px)`) once scrolled past 40px, plus `SiteFooter`.

Pages whose route sets `meta.heroNav = true` (only the landing page) start with the
header transparent over the hero image; every other public page gets
`main.has-offset` with 66px top padding so content clears the fixed bar.

The nav is deliberately three links — **About · Pricing · Help**. Everything else is
behind login. The right-hand button toggles between "Sign in" and "Dashboard" based
on `getSession()` plus an `onAuthStateChange` subscription.

Mobile: a two-span burger animates into an X and the nav becomes a full-height sheet
at `inset: 66px 0 auto`. A `watch` on the open state toggles `body.menu-open` to lock
background scroll.

### `layouts/DashboardLayout.vue` — signed-in

Persistent left sidebar plus topbar. The sidebar collapses to an icon rail (the state
persists to `localStorage` under `meridian-sidebar`); when collapsed, the brand is
clipped to 26px so only the star mark shows.

Nav groups:

| Group | Items |
|---|---|
| Overview | Dashboard `/dashboard`, My profile `/profile` |
| Journey | Roadmap `/invest/roadmap`, Licences `/licences`, Applications `/applications`, Documents `/documents` |
| Support | Concierge `/concierge`, Local experts `/experts` |
| Insights | Market insights `/invest/graphs` |

Topbar: market picker (Kenya today, persisted to `localStorage`), notification bell,
demo chip, theme toggle, and "Back to site".

---

## Routes

```
/                    PublicLayout
  ''                 Landing            meta.heroNav
  about              AboutView
  pricing            PricingView
  help               HelpView

/login               LoginView          (no layout — own split screen)

/                    DashboardLayout    meta.requiresAuth
  dashboard          InvestorDashboard
  profile            ProfileWizard
  concierge          ConciergeView
  licences           LicenceExplorer
  applications       ApplicationsView
  experts            ExpertsView
  documents          DocumentsView
  invest             InvestorOnboarding      simulation studio
  invest/roadmap     RoadmapView             tree + step-by-step
  invest/graphs      MiroFishGraphs          market insights
  invest/dashboard   SimulationDashboard     simulation report

/:pathMatch(.*)*     → redirect /
```

The guard uses `to.matched.some(r => r.meta?.requiresAuth)` so it fires on the parent
record and covers every child. When Supabase is not configured the guard falls
through to guest mode, which keeps local development working without credentials.
`afterEach` sets `document.title` from `meta.title`.

---

## Design tokens

All of them are declared in `frontend/src/App.vue`. **Never hardcode a colour, font,
radius, or shadow.**

The reskin worked by keeping the legacy variable *names* (`--bg`, `--surface`,
`--text`, `--orange`) and retargeting their *values*. That is why roughly 17,000
lines of older view CSS picked up the new palette without a single markup edit —
`--orange` is now an alias for `var(--blue-500)`.

| Token group | Values |
|---|---|
| Navy | `--navy-950 #040C17` · `--navy-900 #071321` · `--navy-800 #0B1B2D` · `--navy-700 #12273D` · `--navy-600 #1B3552` |
| Blue | `--blue-700 #0F35A6` · `--blue-600 #123FC1` · `--blue-500 #1D55F5` · `--blue-400 #2B61FF` · `--blue-300 #4D78FF` · `--blue-200 #7E9FFF` · `--blue-50 #EEF3FF` |
| Grey | `--grey-900 #10141C` → `--grey-50 #F5F7FA` |
| Semantic | `--accent` `--accent-h` `--accent-soft` `--success #20A565` `--text/2/3` `--surface/2` `--bg/2` `--border/2` |
| Type | `--font` DM Sans · `--font-display` Manrope · `--font-mono` JetBrains Mono |
| Shape | `--radius 8px` · `--radius-lg 12px` · `--max 1240px` |

Headings use `--font-display` at `letter-spacing:-0.02em`, `line-height:1.15`,
`font-weight:500`.

Global utility classes — reuse rather than restyle: `.m-container`, `.m-eyebrow`,
`.m-btn`, `.m-btn-primary`, `.m-btn-ghost`, `.m-btn-sm`, `.m-btn-onDark`, `.m-sr-only`.

Both light and dark themes must work. Toggle from the dashboard topbar.

---

## Animation

`directives/reveal.js` registers `v-reveal`, an IntersectionObserver scroll-reveal
that accepts `{ delay, y }`:

```vue
<article v-for="(c, i) in cards" v-reveal="{ delay: i * 70, y: 18 }">
```

House rules: transitions 160–220ms on `var(--ease-out)`; card hover is
`translateY(-2px)` plus `var(--shadow-md)`; skeletons rather than spinners while
loading. **Every animation must be guarded** by
`@media (prefers-reduced-motion: reduce)`.

Bespoke animated surfaces that predate the overhaul and are still live:

| Component | Where | What it does |
|---|---|---|
| `LiveRoadmapBuilder.vue` | `/invest` | Draws the roadmap node-by-node while Claude researches — agencies appear as they're discovered |
| `LoadingOverlay.vue` | `/invest/roadmap` | Stepped progress ("Loading research data → Fetching phase structure → Applying risk flags → Rendering") with a percentage |
| `ProgressPulse.vue` | `/invest` | Pulse indicator for long-running agent calls |
| `ParticleCanvas.vue` | `/invest` | Ambient canvas backdrop |
| `StageTimeline.vue` | roadmap step-by-step | Vertical stepper: pending / active / completed / overdue |

---

## Where sector and industry selection lives

Sector drives almost everything downstream — which of the 100 licences surface, which
agencies enter the roadmap, and what the researcher investigates. It is captured in
three places:

1. **`ProfileWizard.vue` step 2 — "Business intent"** (`/profile`). The canonical
   entry point. `<select v-model="form.sector">` plus county, capital, and company
   name. `@change="onSectorCountyChange"` fires **trickle-research** as soon as both
   sector and county are set: a background `POST /api/agent/trickle-research` whose
   banner ("Researching *{sector}* opportunities in *{county}*…") follows the
   investor through steps 3–4, with results surfacing in the step 5 review. The
   investor never waits on it.

2. **`InvestorOnboarding.vue`** (`/invest`). The MiroFish simulation studio — a
   heavier five-step flow (Identity → Profile → Research → Simulate → Report) that
   feeds `LiveRoadmapBuilder`'s animated construction.

3. **`LicenceExplorer.vue`** (`/licences`). The industry filter **auto-defaults to
   the investor's own sector**, read from `GET /api/agent/session/<sid>`. A `watch`
   on the sector refetches server-side; category, level, and text filter client-side.

The 14 canonical sectors are `agriculture, construction, education, energy,
financial_services, health, hospitality, ict, logistics, manufacturing, media,
mining, professional_services, retail`.

---

## Licence catalog → roadmap

`backend/data/kenya_licences_raw.json` (100 rows) is compiled by
`backend/scripts/build_licence_catalog.py` into `backend/data/kenya_licences.json`,
which tags each licence with either `universal: true` (every business needs it —
registration, tax, county, labour: 32 of the 100) or a `sectors[]` array.

`backend/routes/licences.py` serves it and exposes `resolve_for_sector(sector, level)`,
which returns the universal set plus anything tagged for that sector, universal-first.

`backend/routes/kenya_invest.py::build_roadmap` imports that helper and injects the
**non-universal** matches into Phase 4, deduped against nodes already present — the
universal permits are already covered by the static phases, so adding them again
would double-count both fee and time. The response summary gains `sector` and
`sector_licences_count`.

Worked example — `POST /api/invest/roadmap {"sector": "health"}` returns 9
sector-specific Phase 4 nodes: Pharmacy & Poisons Board drug import/manufacture,
KMPDC practitioner licences, MOH health facility operating licence, KMLTTB medical
laboratory, Veterinary Medicine Dealer, KEBS standardisation mark, and others.

**Known gap.** Sector licence nodes are currently emitted with `cost_kes: 0` and
`timeline_days: 21` because the catalog carries no fee or duration columns yet. Adding
`typical_fee_kes` / `typical_days` is task 2 in
[`docs/team/timothy-kipkoech.md`](team/timothy-kipkoech.md); until it lands, treat the
cost total as covering the statutory core only.

---

## Authentication and the demo account

`LoginView.vue` is a split screen: navy brand panel (hero image, `asideZoom` 24s
ken-burns, three stats) on the left, form panel on the right. It offers Google OAuth,
email + password, and magic link.

The demo credentials are **printed on the page** and filled by one button:

```
demo@meridian.app / MeridianDemo2026!
```

Seed or reset that account with:

```bash
python backend/scripts/seed_demo_user.py
```

Idempotent — an existing demo user has its password reset to the published one. It
uses the Supabase admin API via `SUPABASE_SERVICE_ROLE_KEY` and also writes a demo
investor profile row (UK national, ICT sector, Nairobi, $250k) so the dashboard has
something to render. If the button errors, the message tells you to run the script.

Below 1040px the brand panel is hidden and a mobile brand mark appears instead.

---

## Static design reference

`frontend/public/meridian-global-landing/` holds the approved static build —
`index.html`, `styles.css`, `script.js`, and 11 PNGs. It is the authoritative visual
source; `views/Landing.vue` is a Vue replica of it, section for section: hero → intro
→ journey (3 rows) → product → network → final CTA.

Images are referenced by absolute public path:

```js
const img = (file) => '/meridian-global-landing/assets/images/' + file
```

| Image | Used by |
|---|---|
| `hero-global-investors.png` | Landing hero, login brand panel |
| `global-network-earth.png` | Landing network section |
| `market-selection-nairobi.png` | Landing journey row 1 |
| `coordinated-requirements-roadmap.png` | Landing journey row 2 |
| `local-expert-handshake.png` | Landing journey row 3 |
| `market-entry-command-center.png` · `meridian-dashboard-command-center.png` | Dashboard design reference |
| `meridian-logo-{dark,white,}.png` | `BrandMark.vue` |
| `meridian-full-page-reference.png` | Full-page design reference |

The reference nav shows six links (Platform / Markets / Solutions / Partners /
Resources / About). **That is deliberately overridden** to three — everything else
belongs behind the login.

> ⚠ These PNGs total ~14MB and are served uncompressed from `public/`. WebP conversion
> is outstanding. Add `loading="lazy"` and `decoding="async"` to any new usage.

---

## Shared files — coordinate before editing

`App.vue` · `router/index.js` · `layouts/*` · `components/BrandMark.vue` ·
`components/SiteFooter.vue` · `backend/app/__init__.py`

Per-person file ownership, branch conventions, and task lists are in
[`docs/team/`](team/README.md).
