# Meridian Global Investor OS — Product Requirements Proposal (PRP)

## 1. Vision

**One platform that takes an investor from "I want to invest in Kenya" to "I landed, my company is registered, my permits are filed, my team is hiring, and my weekend safari is booked."**

Today, landing capital in a new country means stitching together a dozen government portals, opaque fee schedules, immigration lawyers, and WhatsApp middlemen. Meridian collapses the entire journey — **Land → Launch → Live** — into a single AI-orchestrated experience. A Claude-powered agent plans the journey, and a Playwright automation layer *actually executes* it against the real government portals (eFNS immigration, eCitizen BRS, NSSF, SHA), live, on screen.

Kenya is the flagship. The architecture is country-agnostic by design: every country is a data adapter, so the same OS scales to the world.

## 2. Personas

| Persona | Profile | Core need | Pain today |
|---|---|---|---|
| **The Foreign Investor** — "David", US agritech founder | Deploying $250K+ into East African agri-processing | End-to-end: eTA, correct work-permit class, company registration, licensing budget, first hires | No idea which of Class B/D/G applies; quotes from lawyers range 5x; 6–12 weeks of portal ping-pong |
| **The Diaspora Returnee** — "Wanjiru", Kenyan-born UK nurse-entrepreneur | Returning to open a private clinic chain | Re-entry status, business registration, county + health licensing roadmap, NSSF/SHA employer setup | Knows the country, not the bureaucracy; fee schedules scattered across county PDFs |
| **The Local SME Founder** — "Brian", Nairobi logistics startup | Formalizing and hiring the first 10 staff | BRS registration, NSSF/SHA employer accounts, compliant JDs, vetted service agents | Each registration is a separate portal with its own captcha, queue, and broker tax |

## 3. The Land → Launch → Live Journey Map

```
LAND ──────────────────► LAUNCH ─────────────────► LIVE
Flights (JFK→NBO)        Business registration     Park & safari concierge
eTA application          Licensing roadmap + fees  Booking + emailed invoice
Immigration-class        Market-gap proposals      Ongoing agent chat +
advisor + proposal       NSSF / SHA employer reg   investor memory
Automated eFNS filing    JD & hiring generator
                         Human agent marketplace
```

Every step is available two ways: **guided UI** (dedicated views per phase) and **conversational agent** (one chat, twelve tools, full journey).

## 4. Functional Requirements

### Phase 1 — LAND

| ID | Requirement |
|---|---|
| L1 | **Flight search**: one-way/return offers into NBO/MBA; live Scrapling scrape of Google Flights with automatic fallback to a curated dataset (search never fails) |
| L2 | **eTA application**: automated Playwright filing on the Kenya eTA portal, with async job-progress streaming to the UI |
| L3 | **Immigration-class advisor**: given investor profile (nationality, capital, activity, duration), Claude recommends the correct class — **Class B** (agriculture/animal husbandry), **Class D** (employment), **Class G** (investor/trade), **Class R** (religious/charitable), **Class N**, or **Special Pass** — and generates a formal proposal with eligibility, required documents, and itemized government fees from the country adapter |
| L4 | **Automated eFNS applications**: one-click Playwright filing of the recommended class on the real eFNS portal (headed browser for demo; stops before final submit), incl. document uploads and permit download on approval |

### Phase 2 — LAUNCH

| ID | Requirement |
|---|---|
| U1 | **Business registration (BRS)**: automated eCitizen BRS company registration — name search, entity type, directors, shareholding — from the investor profile |
| U2 | **Licensing roadmap**: industry + county → ordered steps, responsible agencies (KRA, county, NEMA, sector regulators), timelines, and an **itemized fee budget with total** |
| U3 | **Market-gap proposals**: Claude web-search research producing investable gap analyses for the chosen sector/county, cached in Qdrant |
| U4 | **NSSF employer registration**: automated portal registration including Tesseract captcha solving |
| U5 | **SHA employer registration**: automated Social Health Authority employer onboarding |
| U6 | **JD / hiring generator**: role-appropriate, Kenya-compliant job descriptions (statutory deductions, local salary bands) for the first hires |
| U7 | **Human agent marketplace**: curated directory of vetted lawyers, immigration agents, accountants, and fixers with specialties and ratings — the human fallback for every automated step |

### Phase 3 — LIVE

| ID | Requirement |
|---|---|
| V1 | **KWS park concierge**: conversational booking across 6 Kenyan parks (Amboseli, Maasai Mara, Tsavo, Nakuru, Nairobi NP, Mt. Kenya) with real KES package pricing |
| V2 | **Booking + invoice**: confirmed booking generates an HTML invoice, emailed via Resend (or saved locally and displayed if no key) |
| V3 | **Investor memory**: profile and journey state persisted (MemoryStore), so the agent remembers context across every phase |

### Cross-cutting

- Claude agentic harness (claude-sonnet-4-6) orchestrates all 12 tools with streaming responses.
- Country-adapter model: all fees, classes, agencies, and licenses read from `countries/<iso>.json` — no Kenya logic hardcoded in the core.
- All automations run against **real portals** with credentials from `.env`; demo mode is headed and stops before irreversible submits.

## 5. Success Metrics

| Metric | Baseline (status quo) | Meridian target |
|---|---|---|
| Time from intent → all applications filed | 6–12 weeks | **< 1 day** (demo: < 3 minutes) |
| Portals an investor must learn | 6+ (eTA, eFNS, eCitizen, NSSF, SHA, KWS) | **1** |
| Fee transparency | Opaque, broker-quoted | **100% itemized before spending a shilling** |
| Immigration-class misfiling rate | High (wrong class = rejection + resubmission fees) | **~0** (advisor validates against adapter rules) |
| Countries supported | — | Kenya live; **any country = one JSON adapter + portal scripts** |
| Demo reliability | — | Golden path succeeds even with zero network (curated fallbacks everywhere) |
