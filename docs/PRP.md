# Meridian Global Investor OS — Product Requirements Proposal

**Status**: v2.0 — Updated post-Phase-1 implementation
**Subtitle**: Country-adapter AI platform: Land → Launch → Live for foreign direct investors

---

## 1. Problem

Foreign direct investment in emerging markets is throttled by process friction, not by lack of capital.

- **20+ agencies** an investor must engage to fully land and operate in Kenya (eFNS, eCitizen, KRA, NEMA, county governments, NSSF, SHA, KWS, sector-specific regulators, banks).
- **4–8 weeks** is the typical timeline from arrival intent to operational company — driven by portal queues, document errors, and information asymmetry.
- **$19B SME credit gap** in Kenya alone: under-formalised businesses cannot access credit because they lack properly registered entities and compliance records.
- **30–40% post-harvest losses** in agritech sectors where investors are deterred by opaque licensing costs; unclear county-vs-national jurisdiction further delays entry.
- **Class misfiling** is endemic: most foreign investors apply for the wrong immigration permit class, triggering rejection fees and multi-week resubmission cycles.
- No single source of truth for fees — broker quotes range 5× for identical services; government portals show different numbers than county offices.

---

## 2. Solution

Meridian is a country-adapter AI platform that maps the full investor journey — Land, Launch, Live — onto a single Claude-powered interface backed by live browser automations.

- **Country adapter pattern**: all fees, permit classes, licensing steps, agency names, and county notes live in a single JSON file per country (`countries/KE.json`). Swap the file, get a new country.
- **Claude tool-use loop**: the agentic harness (claude-sonnet-4-6, 10 tools, prompt caching) plans the investor journey, calls the right tool at the right moment, and synthesises results into plain-language guidance.
- **Live Playwright automations**: a Node.js microservice runs headed Chromium against real government portals — eFNS, eCitizen BRS, NSSF, SHA — executing form fills, document uploads, and status polling. Demo mode stops before irreversible final submits.
- **Curated fallbacks everywhere**: flight search, fee schedules, and market data all have offline fallbacks so the golden path never fails, even without network access.
- **Apple-polished UI**: a Vue 3 Concierge chat with spring animations, translucent chrome, and full accessibility (`prefers-reduced-motion`, `prefers-contrast`, `focus-visible` rings) — investment-grade feel, not a hackathon prototype.

---

## 3. Personas

| Persona | Profile | Core need | Pain today |
|---------|---------|-----------|-----------|
| **Foreign investor** — e.g., US agritech founder "David" | Deploying $250K+ into East African agri-processing | End-to-end: eTA, correct permit class, company reg, licensing budget, first hires | No idea which of Class B/D/G applies; lawyer quotes range 5×; 6–12 weeks of portal ping-pong |
| **Active investor** — already landed, scaling ops | Running a registered entity, adding staff and assets | NSSF/SHA compliance, new county permits, ongoing hiring, park/hospitality sourcing | Each new compliance step requires re-learning a different portal |
| **VC/PE firm** — fund deploying across East Africa | Portfolio-level FDI: market mapping, entity setup across multiple countries | Fast market-gap analysis, comparable regulatory timelines per country | No cross-country tool — each country requires a separate legal team |

---

## 4. Phase 1 — Implemented Features

- ✅ **Claude agentic harness** — tool-use loop with 10 registered tools, prompt caching, streaming SSE responses; `claude-sonnet-4-6` model; per-session investor profile state.
- ✅ **Kenya country adapter** — full immigration class catalog (Class B, D, G, R, N, Special Pass, eTA) with eligibility rules, required documents, and itemized KES/USD government fees; 6 sectors × 47 counties licensing matrix; 6-park KWS pricing.
- ✅ **MiroFish-style market researcher** — Claude web-search synthesis producing gap analyses, investable opportunity summaries, and a binary go/no-go verdict with confidence score; results cached in Qdrant in-memory vector store.
- ✅ **23 automations endpoints** — Playwright scripts for eFNS permit classes (G, D, R, N, SP, eTA), BRS company registration, NSSF employer onboarding, SHA employer onboarding; async job queue with Supabase-compatible job-state schema.
- ✅ **Flight search** — curated dataset covering JFK/LHR/DXB/JNB → NBO/MBA with real carrier/stop/price data; Scrapling live fallback for real-time pricing when available; search never returns empty.
- ✅ **Apple-polished Concierge chat UI** — Vue 3 + Vite; spring-physics animations; translucent glass-morphism chrome; streaming token rendering; dark mode; `prefers-reduced-motion` + `prefers-contrast` + `focus-visible` accessibility compliance.
- ✅ **Docs suite** — PRP (this doc), SPEC, PROBLEMS, DEMO, CHANGELOG, full frontend spec, MiroFish guide; aligned to hackathon submission requirements.

---

## 5. Phase 2 — In Progress

- 🔄 **ProfileWizard** — multi-step onboarding form that populates the investor profile before the first chat message; profile fields feed all downstream tools.
- 🔄 **InvestorDashboard** — split-view: left panel = conversational concierge; right panel = live roadmap + job tracker + document vault.
- 🔄 **Dual roadmap views** — card view (phase-by-phase) and Gantt-style timeline view, both driven by the licensing roadmap tool output.
- 🔄 **Supabase persistence** — replace in-memory session store with Supabase rows for profiles, tool call history, automation job states, and document references; enables cross-device session resumption.
- 🔄 **Railway one-click deploy** — `scripts/deploy_railway.sh` + Railway template manifest; three services (backend / automations / frontend) provisioned from a single command with shared env injection.

---

## 6. Roadmap

- 🔜 **Rwanda country adapter** — `countries/RW.json` using the same adapter contract; Rwanda Development Board licensing paths, RIB company registration, East African Tourist Visa classes.
- 🔜 **Ghana country adapter** — `countries/GH.json`; Ghana Investment Promotion Centre pathways, Registrar General company types, GRA tax registration.
- 🔜 **Realtime voice concierge — Kesi / VAPI** — Swahili + English voice interface over VAPI; same tool-use loop, audio-streamed responses; persona name "Kesi" (Swahili: "case / matter").
- 🔜 **Graphiti memory graph** — long-term cross-session investor memory using Graphiti; entity nodes for investor, companies, permits, counties; relationship edges encode journey history.
- 🔜 **AI form-fill review before submit** — before any Playwright script fires an irreversible submit, Claude reviews the filled form fields against the investor profile and flags discrepancies; human-in-the-loop gate with one-click approval.

---

## 7. Harness Tool Table

| Tool name | Description | Output | Used by |
|-----------|-------------|--------|---------|
| `update_investor_profile` | Persists investor fields (nationality, capital, sector, county, duration) to session state | Merged profile object | ProfileWizard, Concierge |
| `search_flights` | Curated + Scrapling live flight search into NBO / MBA | Ranked offers list (carrier, stops, price, duration) | Concierge |
| `advise_immigration_class` | Returns full class catalog from country adapter with eligibility check and fee breakdown | Class recommendation + formal proposal | Concierge |
| `apply_immigration` | Fires Playwright automation against eFNS portal for the recommended class | `job_id`, initial status | Concierge |
| `build_licensing_roadmap` | Steps + responsible agencies + fees + timeline for a given sector × county combination | Roadmap JSON with total fee budget | Concierge, Roadmap view |
| `market_gap_research` | Claude web_search synthesis producing investable gap analysis + go/no-go verdict | Gap report with confidence score | Research view |
| `run_registration_automation` | Dispatches BRS, NSSF, or SHA automations based on registration type | `job_id`, portal status | Concierge |
| `get_hiring_pack` | Generates Kenya-compliant JDs + salary bands + statutory deduction notes for requested roles | Hiring document (markdown + JSON) | Concierge |
| `list_agents` | Returns curated marketplace of vetted lawyers, immigration agents, accountants, and fixers | Agents list with specialties + ratings | Concierge |
| `book_park` | Confirms KWS park booking, generates HTML invoice, dispatches via Resend (or saves locally) | Booking confirmation + invoice URL | Concierge |

---

## 8. Design System

The UI follows Emil Kowalski's Apple-design principles — not a style guide, a philosophy.

- **Spring physics over duration curves** — all transitions use spring animations (`tension: 280, friction: 60`) for the organic feel of native macOS/iOS apps; no linear or ease-in-out CSS transitions on interactive elements.
- **Translucent chrome** — sidebar and modal backgrounds use `backdrop-filter: blur(24px)` with `background: rgba(255,255,255,0.06)` in dark mode; glass layering creates depth without hard borders.
- **`prefers-reduced-motion`** — all spring animations fall back to `opacity` crossfades (≤150 ms) when the OS-level motion reduction preference is set; no positional transforms.
- **`prefers-contrast`** — high-contrast mode replaces translucent surfaces with solid fills and increases border opacity to `1`; color tokens remapped to pass WCAG AAA.
- **`focus-visible` rings** — keyboard-navigable elements show a 2px offset ring in the brand emerald (`#34d399`); mouse-driven interactions suppress the ring via `:focus:not(:focus-visible)`.
- **`scale(0.97)` press feedback** — all buttons and tappable cards animate to 97% scale on `mousedown` / `touchstart`, releasing on `mouseup`; gives tactile click feel without jarring motion.

---

## 9. Deployment

Meridian runs as three independently deployable Railway services sharing a single environment.

- **Backend service** (`railway.json: backend`) — Flask + Gunicorn on Python 3.11; exposes `/api/**` routes; connects to Supabase and Qdrant in-memory; calls Claude API.
- **Automations service** (`railway.json: automations`) — Node.js 20 + Playwright Chromium; exposes `/automate/**` routes; sandboxed from the backend; stateless job dispatch.
- **Frontend service** (`railway.json: frontend`) — Vite build, served via `vite preview` or a static adapter; communicates only with the backend service.
- **Supabase** — external managed Postgres; stores investor profiles, automation job states (`pending / running / done / failed`), and document references; also usable with a local `.env` pointing to a free-tier Supabase project.
- **One-click deploy**: `bash scripts/deploy_railway.sh` — provisions all three services, links environment variables, and outputs the live URL.

---

## 10. Team

| Name | Email | Role |
|------|-------|------|
| **James Epale** | ijepale@gmail.com | Lead developer / platform architect |
| **Timothy Kipkoech** | mutaitimo07@gmail.com | Automations engineer |
| **Joseph Kerandi** | Kerandijoseph5@gmail.com | Backend / agent harness |
| **Millicent Morara** | millicentmorara7@gmail.com | Frontend / UX |

---

## 11. Global Scalability

The country-adapter contract is Meridian's moat. Any JSON file with the standard shape unlocks the full platform for that country — no code changes required.

- **Adapter contract** (`countries/<ISO>.json`): `immigration_classes[]`, `licensing_sectors{}`, `county_notes{}`, `automation_portals{}`, `fee_schedule{}`, `parks[]` (optional), `currency`, `language_primary`.
- **Kenya = flagship** — the `KE.json` adapter is the reference implementation; all 10 tools are validated against it; 23 Playwright scripts are portal-specific but follow a standard interface contract.
- **Rwanda / Ghana = next** — both countries have publicly documented investment promotion agency APIs and structured fee schedules; adapters are estimated at 2–3 days of research + JSON authoring.
- **South Africa / Nigeria** — larger regulatory surface; adapters require province-level licensing nodes; architecture supports nested county/province structures already.
- **EU / ASEAN** — longer-term; immigration classes map cleanly to visa/permit taxonomies; the harness tool signatures are country-agnostic by design.
- **One-line add**: `COUNTRY_ADAPTER=RW` in `.env` + `countries/RW.json` present → the entire platform switches context; the Claude system prompt, tool schemas, and UI labels all derive from the adapter at runtime.

---

> Built for the **Claude Hackathon** · Powered by [Anthropic Claude](https://www.anthropic.com) · A [Claude Community Kenya](https://twitter.com/ClaudeKenyaCom) project
