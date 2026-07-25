# MERIDIAN
## Global Investment Intelligence — From Passport to Profit in 21 Days
### Master Document v1.0 — March 2026 — Confidential

---

> Meridian is an AI-powered platform that eliminates the friction of setting up a business anywhere in the world. Upload a passport. Answer four questions. Receive a complete, personalised compliance roadmap — every agency, every form, every real cost, every honest wait time — backed by a swarm intelligence engine that simulates thousands of investor journeys before yours begins.

---

## Table of Contents

1. [What Meridian Is](#1-what-meridian-is)
2. [Executive Summary](#2-executive-summary)
3. [The Problem](#3-the-problem)
4. [The Solution](#4-the-solution)
5. [System Architecture](#5-system-architecture)
6. [The MiroFish Simulation Engine](#6-the-mirofish-simulation-engine)
7. [Research Agent + Vector Database](#7-research-agent--vector-database)
8. [All 49 Government Agencies](#8-all-49-government-agencies)
9. [Product Requirements Document (PRD)](#9-product-requirements-document-prd)
10. [UI / Frontend Design](#10-ui--frontend-design)
11. [API Specification](#11-api-specification)
12. [Project Roadmap](#12-project-roadmap)
13. [Business Model](#13-business-model)
14. [Government Partnership Proposal](#14-government-partnership-proposal)
15. [Deployment Guide](#15-deployment-guide)

---

## 1. What Meridian Is

### In one sentence per audience

| Audience | What it is |
|----------|-----------|
| Foreign investor | A GPS that guides you through every government office you need to visit, in the right order, with real costs and real wait times. |
| Kenyan entrepreneur | A compliance assistant that fills your forms, tracks your licenses, and alerts you before anything expires. |
| KenInvest / government | A digital one-stop-shop that automates investor facilitation and provides real-time investment flow data. |
| Investor / VC | A global regulatory intelligence platform with a simulation engine that continuously improves its own accuracy. |
| Developer | A MiroFish fork with typed Kenya agents, a Perplexity research layer, Qdrant vector caching, and a FastAPI backend — deployable in one Docker command. |

### Core technology stack

- **Simulation engine:** MiroFish (OASIS/CAMEL-AI) — 33K GitHub stars, peer-reviewed, 1M agent capacity
- **Primary LLM:** Xiaomi MiMo-V2-Pro (Hunter Alpha) — 1T parameters, 8th globally, agent-optimised
- **Multimodal LLM:** Xiaomi MiMo-V2-Omni (Healer Alpha) — reads passports, PDFs, audio natively
- **Research:** Perplexity Agent API (sonar-deep-research) — live web, cited sources, real-time
- **Vector DB:** Qdrant — self-hosted, TTL-based auto-expire, instant similarity search
- **Agent memory:** Zep Cloud — free tier, long-term memory across 40 simulation rounds
- **Knowledge graph:** GraphRAG — entity-relationship graph from regulatory documents
- **Payments:** M-Pesa Daraja + Flutterwave

### Headline metrics

| Metric | Without Meridian | With Meridian |
|--------|-----------------|---------------|
| Business setup time | 90+ days | 21 days target |
| Investor abandonment rate | 40% | below 10% target |
| Form rejection rate | 25% | below 5% |
| Compliance cost | USD 5,000–50,000 | USD 99–1,499 |
| Roadmap accuracy | guesswork | ±10% (simulation-calibrated) |
| Document expiry misses | frequent | zero (auto-tracked) |

---

## 2. Executive Summary

### The opportunity

The global FDI market is USD 1.3 trillion per year. Emerging markets capture less than their fair share because investors cannot navigate local regulatory systems efficiently. Kenya alone loses an estimated USD 2.5 billion in FDI annually due to process friction. No intelligent, end-to-end digital solution exists at scale.

### What Meridian does — 6 steps

1. **Reads your identity** — Upload a passport or national ID. MiMo-V2-Omni reads it natively. No separate OCR service, no manual typing.

2. **Researches your path** — Perplexity Agent API + MiMo-V2-Pro build a complete compliance profile from live government sources, gazette notices, and historical data in under 3 minutes.

3. **Simulates your journey** — MiroFish spawns 200 AI agents (investors, officers, facilitators) and runs 40 rounds of your exact scenario before you start — producing a bottleneck map and abandonment risk score.

4. **Handles everything** — Auto-fills 200+ government forms. Generates legal documents. Opens bank accounts. Books appointments. Tracks document expiry. Assigns a human facilitator.

5. **Stays current** — Research results stored in Qdrant vector DB with TTL policies. Weekly cron refresh. Every user benefits from every previous research run.

6. **Scales globally** — Same Research Agent + MiroFish engine works for any country. Add a country profile JSON, and Meridian handles that market too.

### The self-improvement loop

```
User input (4 fields)
        ↓
Research Agent (Perplexity + MiMo → Qdrant)
        ↓
MiroFish simulation (200 agents × 40 rounds)
        ↓
Compliance Autopilot (forms + docs + bank + facilitator)
        ↓ (feedback)
Platform recalibration (roadmap improves with every run)
```

---

## 3. The Problem

### The maze — Kenya as a case study

Kenya is one of Africa's most business-friendly countries, yet still has 49 mandatory government touchpoints for a typical foreign investor. Each operates independently, each has different paperwork, and none will tell you the correct order upfront.

| Problem | Reality | Impact |
|---------|---------|--------|
| 49 agencies to navigate | Each operates independently with no coordination | Investor confusion, duplicate submissions |
| Official SLAs are fictional | Immigration says 4 weeks. Actual median: 10 weeks. P90: 14 weeks. | Business plans built on wrong assumptions |
| Costs are hidden | Official fee: KES 10,950 for company registration. Total actual cost: KES 655,000+ | Investors run out of runway mid-process |
| Forms are complex | 200+ government forms, many requiring data from other forms first | 25% rejection rate from errors |
| Documents expire unnoticed | Work permits, business licenses, fire certs — all annual renewals | Businesses unknowingly operate illegally |
| No single source of truth | eCitizen, iTax, BRS, Immigration — all separate portals, separate logins | Investors lose track, miss deadlines |
| Corruption risk | Officers request extra documents or fee amounts not in official schedule | Investors pay unofficial fees or abandon |
| Language barriers | Chinese, Indian, French investors struggle with English-only portals | 40%+ higher abandonment for non-English investors |

### Global scale

- **USD 2.5B** in FDI lost by Kenya annually
- **40%** investor abandonment rate
- **132/190** Kenya ease of doing business rank (World Bank)
- **90+ days** to complete setup manually

The same problem exists — often worse — in Nigeria, Tanzania, Ethiopia, Vietnam, Bangladesh, Egypt, Colombia.

### Why existing solutions fail

| Solution | What it does | Why it fails |
|----------|-------------|-------------|
| eCitizen | Government portal for form submission | Transactional only. No guidance, no intelligence. |
| KenInvest | Government investment agency | Manual process, limited capacity, no automation. |
| Law firms | Full-service compliance | USD 5,000–50,000. Slow. Inaccessible to SMEs. |
| Accounting firms | Tax and partial compliance | Narrow scope. Not end-to-end. |
| Business consultants | General advisory | No technology integration. Manual. Expensive. |

---

## 4. The Solution

### Three interlocking systems

**System 1 — The Research Agent (knows everything)**

Perplexity Agent API continuously researches current fees, realistic processing times, sector-specific regulations, and agency risk scores. Results are embedded (text-embedding-3-small) and stored in Qdrant vector database. Cache hit = instant (under 100ms). Cache miss = deep research (under 3 minutes). Weekly cron refresh. No manual maintenance required.

**System 2 — The MiroFish Simulation Engine (tests everything)**

A fork of MiroFish (33K GitHub stars, CAMEL-AI OASIS engine) runs thousands of investor journeys before a real investor begins. 200 typed AI agents — investors, government officers, facilitators, bank officers, market peers — interact in simulated government environments over 40 rounds. Output: bottleneck map, abandonment probability curve, corruption risk score per agency, platform improvement recommendations.

**System 3 — The Compliance Autopilot (handles everything)**

Reads passport (MiMo-V2-Omni), auto-fills 200+ government forms, generates legal documents (MOA, Articles, Board Resolutions, employment contracts), opens bank accounts, books government appointments, tracks document expiry, assigns human facilitator, logs every action in immutable audit trail.

### What makes Meridian defensible

| Moat | Why it compounds |
|------|-----------------|
| Simulation data flywheel | Every run produces data that improves the next. Competitors cannot replicate 1,000 runs of accumulated calibration data. |
| Vector DB research cache | Research findings from 10,000 users benefit all future users. Platform gets smarter and faster with scale. |
| Facilitator network | Human facilitators build government officer relationships. This network cannot be copied quickly. |
| Audit trail data | Immutable corruption pattern data is uniquely valuable to governments and development banks. |
| Government API integrations | eCitizen, iTax, BRS, Immigration integrations take months to build. Early mover advantage is significant. |

---

## 5. System Architecture

```
PRESENTATION LAYER
  Web (Vue.js) · Mobile (Flutter) · WhatsApp Bot · USSD *483# · Voice (Twilio) · Telegram Bot

AI LAYER
  MiMo-V2-Omni (Healer Alpha)        MiMo-V2-Pro (Hunter Alpha)       Perplexity Agent API
  Passport OCR · PDF · Audio         Reasoning · Forms · Docs          sonar-deep-research
                                     Simulation synthesis              Live web · Citations

INTELLIGENCE LAYER
  Qdrant vector DB                   MiroFish fork (OASIS)
  fee_schedules (7d TTL)             5 typed agents
  sla_benchmarks (14d TTL)           4 environments
  regulations (30d TTL)             GraphRAG + Zep Cloud
  risk_scores (7d TTL)              1M agent capacity

INTEGRATION LAYER
  eCitizen · iTax · BRS · Immigration FMIS · 47 county portals
  10 banks · M-Pesa Daraja · Flutterwave · KenTrade · NEMA · KEBS

DATA LAYER
  PostgreSQL (users, applications, audit log)
  MongoDB (documents, OCR, form templates)
  Redis (sessions, caching)
  S3/MinIO (encrypted document vault)
```

### Technology choices

| Component | Choice | Why |
|-----------|--------|-----|
| Primary LLM | MiMo-V2-Pro (Hunter Alpha) | 1T params, 8th globally, 5× cheaper than GPT-4o, agent-optimised, 1M token context |
| Multimodal LLM | MiMo-V2-Omni (Healer Alpha) | Reads passports, PDFs, 10+ hour audio natively. No separate OCR service. |
| Research engine | Perplexity sonar-deep-research | Dozens of searches per query, hundreds of sources, cited live data |
| Vector database | Qdrant | Open source, self-hostable, TTL auto-expiry, fast similarity search |
| Simulation engine | MiroFish fork (OASIS/CAMEL-AI) | 33K stars, peer-reviewed, 1M agents, 23 social actions |
| Agent memory | Zep Cloud | Long-term memory for agents. Free tier. |
| Knowledge graph | GraphRAG | Builds entity-relationship graph from seed documents |
| Payments | M-Pesa Daraja + Flutterwave | M-Pesa dominant in Kenya. Flutterwave for pan-Africa. |

---

## 6. The MiroFish Simulation Engine

### What we keep vs what we change

**Unchanged from MiroFish:**
OASIS simulation engine, GraphRAG, Zep Cloud, Vue.js frontend, FastAPI backend, Docker deployment, 1M agent capacity, ReportAgent base class

**Added / replaced:**
- Generic agents → 5 typed agents (investor, officer, facilitator, bank, peer)
- Twitter environment → eCitizen portal environment
- Reddit environment → Immigration office environment
- News seeds → Research Agent auto-built seeds
- 2 new environments: County portal + Bank environment
- Research Agent (new)
- Qdrant vector DB (new)
- Corruption detector (new)
- Country profiles (new)
- Platform feedback webhook (new)

### 5 typed agents

| Agent | Simulates | Key personality dimensions | Critical action |
|-------|-----------|--------------------------|-----------------|
| Investor | Foreign or domestic investor navigating compliance | patience (1-10), digital literacy, capital buffer, language, prior Africa experience | `abandon_process` — primary failure mode |
| Government officer | Civil servant at one of 49 agencies | workload (cases/week), process adherence, digital capability, extra_doc_request_rate | `delay_without_explanation` — triggers audit flag |
| Facilitator | Human expert expediting applications | sector expertise, government relationships, integrity score | `report_irregular_request` — corruption reporting |
| Bank officer | Relationship manager for account opening | bank, AML threshold | `refer_to_aml` — enhanced due diligence |
| Market peer | Veteran investor who has completed the process | experience (positive/negative/mixed), days to complete | `share_negative_experience` — raises abandonment risk |

### 4 simulation environments

| Environment | Models | Key failure events |
|-------------|--------|-------------------|
| eCitizen portal | Digital government services hub | Portal downtime (8%), payment gateway fail (12%), session timeout (15%) |
| Immigration office | Physical department + FMIS portal | Document rejection (25%), queue overflow (15%), extra doc requests (34% of cases) |
| County portal | One of 47 county environments | Manual process required (varies by county), inspection backlog (20%) |
| Bank environment | Corporate account opening at 10 banks | AML review trigger, branch visit required, KYC document gap |

### Simulation outputs

1. **Bottleneck map** — Top 3 agencies with delays, root cause analysis, actual vs SLA wait times
2. **Abandonment curve** — Probability vs day, exact trigger stage identification
3. **Corruption risk flags** — Extra document requests, fee anomalies, unexplained delays by pattern
4. **Platform improvements** — Specific Meridian changes that would reduce abandonment or cost

### Agency risk scores (from EACC + TI data)

| Agency | Corruption risk score | Primary risk type |
|--------|----------------------|------------------|
| KRA | 0.08 | Low — strong digital systems |
| BRS | 0.12 | Low — mostly online |
| KenInvest | 0.08 | Low — facilitates investors |
| Immigration | **0.38** | HIGH — extra doc requests 34%, delays common |
| NEMA | **0.42** | HIGH — EIA delays, understaffing, extra requests |
| KEBS | 0.22 | Medium — factory inspection queue |
| Nairobi County | 0.31 | Medium — fee mismatches 18% |
| NCA | 0.25 | Medium |
| PPB | 0.30 | Medium — product registration 6-12 months per drug |

---

## 7. Research Agent + Vector Database

### The cache problem

Government fee schedules change with every Finance Act. Processing times fluctuate with staffing and portal uptime. A platform that hardcodes any of this is wrong within weeks. Meridian solves this with a live research layer that is cached intelligently.

### Two-path query flow

**Path A — Cache hit (instant, under 100ms, cost: $0)**
1. User asks about fintech/Nairobi/Kenyan investor
2. Query is embedded (text-embedding-3-small)
3. Qdrant similarity search finds matching vector (score ≥ 0.75)
4. TTL check: data still fresh
5. Return cached result instantly
6. This handles 80%+ of queries at scale

**Path B — Cache miss (Perplexity deep research, ~2-3 min, cost: ~$0.40)**
1. No matching vector found, or TTL expired
2. Perplexity sonar-deep-research fires 6 parallel queries
3. Results synthesised by MiMo-V2-Pro into structured seed JSON
4. Embedded and stored in Qdrant with timestamp
5. Next user with same profile gets Path A

### Vector DB collections and TTL policy

| Collection | What's stored | TTL | Why |
|-----------|--------------|-----|-----|
| fee_schedules | Official fees, paybill numbers, account refs | 7 days | Finance Acts can change fees quarterly |
| sla_benchmarks | Realistic processing times from public data | 14 days | Staffing and backlogs change monthly |
| regulations | Current laws, gazette notices, sector requirements | 30 days | Legislation changes less frequently |
| risk_scores | Corruption and delay risk from EACC + TI | 7 days | Risk signals are time-sensitive |

### Weekly cron refresh schedule

Every Monday at 02:00 EAT, a cron job:
1. Iterates through the 9 most common sector/county/nationality combinations
2. Invalidates their cache entries in Qdrant
3. Re-runs Perplexity deep research
4. Re-embeds with text-embedding-3-small
5. Stores fresh results — ready for Monday morning traffic

---

## 8. All 49 Government Agencies

### Group A — Core investment and registration (4)

| # | Agency | Mandate | Sim risk | Auto-generated docs |
|---|--------|---------|----------|-------------------|
| 1 | KenInvest | Investment facilitation, incentives, One-Stop-Shop | low 0.08 | Investment certificate application, incentive request forms |
| 2 | BRS | Company registration | low 0.12 | CR1, CR12, MOA, AOA, Board Resolution, Share Certificate |
| 3 | eCitizen | Digital services portal | low 0.05 | Multi-agency submission portal |
| 4 | OAG | Attorney General consent for foreign land | med 0.15 | Consent application, legal opinion request |

### Group B — Taxation and revenue (5)

| # | Agency | Mandate | Sim risk | Auto-generated docs |
|---|--------|---------|----------|-------------------|
| 5 | KRA | All taxes: PIN, VAT, PAYE, excise, customs | low 0.08 | PIN application, VAT form, PAYE registration, tax compliance cert |
| 6 | CBK | Banking regulation, forex controls | low 0.10 | Capital importation form, forex remittance docs |
| 7 | CMA | Capital markets regulation | low 0.10 | Investment advisor license application |
| 8 | IRA | Insurance regulation | low 0.12 | Insurance broker license application |
| 9 | RBA | Pension regulation | low 0.08 | Scheme registration |

### Group C — Immigration and labour — PRIMARY BOTTLENECK (4)

| # | Agency | Mandate | Sim risk | Auto-generated docs |
|---|--------|---------|----------|-------------------|
| 10 | **Immigration** | Work permits, visas, alien cards | **HIGH 0.38** | Form 17 (Class G), dependent pass, visa, employer justification letter |
| 11 | Min. Labour | Labour relations, employment law | low 0.08 | Employment contracts (Kenyan law compliant) |
| 12 | NSSF | Employee pension | low 0.06 | Employer + employee registration |
| 13 | SHIF | Employee health insurance | low 0.06 | Employer + employee enrollment |

### Group D — Safety, environment, standards — SECOND BOTTLENECK (5)

| # | Agency | Mandate | Sim risk | Auto-generated docs |
|---|--------|---------|----------|-------------------|
| 14 | DOSHS | Workplace safety | low 0.10 | Workplace registration, safety officer appointment, risk assessment |
| 15 | KEBS | Product standards, quality certification | med 0.22 | Diamond Mark application, ISM, PVoC, product testing booking |
| 16 | **NEMA** | Environmental compliance, EIA | **HIGH 0.42** | EIA project brief, environmental management plan, effluent discharge license |
| 17 | WRA | Water use permits | low 0.15 | Water use permit application |
| 18 | EPRA | Energy and petroleum licensing | low 0.12 | Energy license, petroleum dealer license |

### Group E — Intellectual property (3)

Agencies 19–21: KIPI (trademarks/patents), KECOBO (copyright), ACA (anti-counterfeiting)

### Group F — Sector regulators (28)

**Construction & real estate (4):** NCA (#22), NLC (#23), County Land Offices (#24), Physical Planning (#25)

**Tourism & hospitality (2):** TRA (#26), KWS (#27)

**Agriculture (3):** AFA (#28), KEPHIS (#29), Veterinary Services (#30)

**Health & pharmaceuticals (3):** PPB (#31 — longest bottleneck in pharma, 6-12 months per drug), KMPDC (#32), Nursing Council (#33)

**Education (2):** TVETA (#34), CUE (#35)

**Transport (2):** NTSA (#36), KCAA (#37)

**ICT & data (2):** CA (#38), ODPC (#39)

**Media (1):** Media Council (#40)

**Mining (1):** Ministry of Mining (#41)

**Trade & export (4):** KenTrade (#42), EPZA (#43), SEZA (#44), KNCCI (#45)

**Finance-specific (3):** SASRA (#46), FRC (#47), NSE (#48)

**Gaming (1):** BCLB (#49)

**County governments (47):** All counties — Single Business Permit, fire certificate, public health license

---

## 9. Product Requirements Document (PRD)

### User personas

| Persona | Description | Primary need | Tier |
|---------|-------------|-------------|------|
| Foreign manufacturer | Chinese/Indian investor, USD 1-5M, factory setup | Complete roadmap, Immigration facilitation, bank account | Premium |
| Diaspora returnee | Kenyan national, UK/US based, hotel or restaurant | Familiar guidance, document generation | Standard |
| Local SME | Kenyan entrepreneur, KES 500K-5M, first formal business | Cheap, simple, fast | Basic |
| Multinational subsidiary | Fortune 500 regional office, complex structure | Enterprise compliance, API access | Enterprise |
| Government / KenInvest | Investment authority wanting platform license | White-label, compliance analytics | Gov B2B |

### Functional requirements — P0 (must have at launch)

| ID | Feature | Acceptance criteria |
|----|---------|-------------------|
| F-01 | Passport/ID reading | MiMo-V2-Omni extracts all fields with confidence ≥ 0.85 |
| F-02 | 4-question intake | System builds full compliance matrix from sector, capital, county, residency |
| F-03 | Research Agent | Seed pack in under 3 minutes. Cache hit under 100ms. Sources cited. |
| F-04 | Compliance roadmap | All agencies, correct sequence, realistic timelines, real fees, total cost |
| F-05 | Form auto-fill | Pre-fills at least 80% of fields on all 200+ government forms |
| F-06 | Legal document generation | MOA, AOA, Board Resolutions, employment contracts — current Kenyan law |
| F-07 | Payment tracking | Exact M-Pesa paybill numbers. Tracks payment receipts. |
| F-08 | Document expiry tracker | 50+ document types. Alerts at 90/60/30/14/7 days via email, SMS, WhatsApp |
| F-09 | Audit trail | Every action logged, hash-chained, immutable, EACC-exportable |
| F-10 | Anti-corruption detection | Flags fee mismatches, extra document requests, unexplained delays |

### Functional requirements — P1 (within 90 days)

| ID | Feature |
|----|---------|
| F-11 | MiroFish simulation — investor journey simulation per profile |
| F-12 | Facilitator allocation — tiered human experts by complexity score |
| F-13 | Bank account integration — 10 banks, KYC doc assembly |
| F-14 | Multi-language — English, Swahili, Mandarin, French |
| F-15 | USSD interface — *483# for low-smartphone scenarios |
| F-16 | WhatsApp bot — full onboarding via WhatsApp Business API |

### Non-functional requirements

| Category | Requirement |
|----------|------------|
| Performance | Research endpoint p95 under 3 min. Cache hit under 100ms. Dashboard under 2s. |
| Availability | 99.5% uptime. Graceful fallback if government portals are down. |
| Security | AES-256 at rest. TLS 1.3 in transit. ODPC-compliant Kenya-hosted data. |
| Compliance | Kenya Data Protection Act 2019. ODPC registration. GDPR-ready. |
| Scalability | 10,000 concurrent users. Simulation queue with auto-scaling. |
| Audit | All actions logged, hash-chained, exportable to OAG/EACC format. |

---

## 10. UI / Frontend Design

### Four UI surfaces

1. **Public onboarding flow** — passport upload → 4 questions → roadmap reveal
2. **Investor dashboard** — journey tracker, documents, payments, expiry alerts
3. **Facilitator workspace** — client list, urgent actions, government visit log
4. **Admin / audit console** — simulation dashboard, corruption flags, OAG export

### Frontend stack

| Surface | Technology | Notes |
|---------|-----------|-------|
| Web app | Vue.js 3 + Vite | Existing MiroFish frontend extended |
| Mobile | Flutter (iOS + Android) | Offline document vault with local encryption |
| WhatsApp | WhatsApp Business API + FastAPI | Full onboarding flow via WhatsApp |
| USSD | Africa's Talking | *483# — roadmap view + payment instructions |
| Voice | Twilio + OpenAI Whisper | Spoken intake for phone call preferences |

### Key UI flows

**Onboarding flow:**
```
Landing page (passport upload)
    ↓
Identity confirmation (extracted fields review)
    ↓
4-question intake (sector, capital, county, residency)
    ↓
Research in progress (cache check → Perplexity if needed)
    ↓
Roadmap reveal (all agencies, timeline, cost estimate)
    ↓
Simulation option (run MiroFish for bottleneck analysis)
    ↓
Dashboard access (forms, payments, facilitator assignment)
```

**Dashboard layout:**
- Left sidebar: Overview, Applications, Documents, Payments, Facilitator, Expiry Tracker, Ask Meridian
- Main panel: Progress bar (Day X of ~90), status by agency (done/pending/action needed)
- Alert strip: Next required actions with deadlines
- Compliance health score: 0-100 with colour coding

**Document expiry tracker:**
- Critical (under 7 days): red card, RENEW NOW button
- Warning (under 30 days): amber card, START RENEWAL button
- Current: green card, no action
- No expiry: green card, informational only

**Facilitator workspace:**
- 3 counters: urgent / on track / awaiting client
- Urgent actions list: client name + agency + specific action
- Calendar: today's appointments and follow-up calls
- SLA clock: days since submission vs agency SLA

---

## 11. API Specification

### Core endpoints

| Method | Endpoint | Purpose | Auth |
|--------|---------|---------|------|
| POST | /api/invest/research | Trigger Research Agent — returns seed pack | Bearer |
| POST | /api/invest/read-passport | MiMo-V2-Omni passport/ID extraction | Bearer |
| POST | /api/invest/simulate | Start MiroFish simulation (async) | Bearer |
| GET | /api/invest/simulate/:id/status | Poll simulation progress | Bearer |
| GET | /api/invest/simulate/:id/report | Get ReportAgent output | Bearer |
| POST | /api/invest/compare-countries | Multi-country regulatory comparison | Bearer |
| POST | /api/invest/policy-impact | Simulate regulatory change impact | Bearer |
| GET | /api/invest/cache/stats | Vector DB cache coverage | Admin |
| POST | /api/invest/cache/invalidate | Force-expire cache entry | Admin |
| GET | /api/invest/country/:code/profile | Country regulatory profile | Bearer |
| POST | /api/invest/corruption-scan | Agency audit risk analysis | Admin |

### /api/invest/research — request/response

```json
POST /api/invest/research
{
  "sector": "electronics_manufacturing",
  "nationality": "Chinese",
  "capital_usd": 2000000,
  "county": "Nairobi",
  "will_reside": true,
  "employees_count": 40
}

Response:
{
  "seed_pack_id": "sp_abc123",
  "status": "ready",
  "source": "cache",
  "generated_in_ms": 87,
  "seed": {
    "regulatory_map": {
      "required_agencies": ["KenInvest","BRS","KRA","Immigration","Nairobi_County","NEMA","KEBS","DOSHS","NSSF","SHIF","NCA","KenTrade"],
      "estimated_total_days": 105,
      "critical_path": ["Immigration","NEMA"]
    },
    "bottleneck_forecast": {
      "primary_bottleneck": "Immigration",
      "abandonment_risk_pct": 28,
      "abandonment_trigger_day": 75
    }
  }
}
```

---

## 12. Project Roadmap

### Phase 1 — Kenya MVP (Months 1-3)

**Month 1 — Foundation**
- Fork MiroFish, set up Qdrant + Docker
- Research Agent with Perplexity + MiMo
- Passport reading with MiMo-V2-Omni
- Core API endpoints
- Basic Vue onboarding UI

**Month 2 — Compliance Engine**
- All 49 agency workflows coded
- 200+ form auto-fill templates
- Legal document generation (MOA, AOA, Board Resolutions)
- M-Pesa payment integration
- Document expiry tracker
- Anti-corruption audit engine

**Month 3 — Simulation + Facilitators**
- MiroFish 5 typed agents
- 4 simulation environments
- Custom ReportAgent
- Facilitator allocation system
- Bank account integration (3 banks)
- Beta launch with 50 investors

### Phase 2 — Scale Kenya (Months 4-9)

- Flutter mobile app
- WhatsApp bot
- Mandarin + French + Swahili support
- All 10 bank integrations
- Full 47-county support
- KenInvest MOU + government API integrations
- 500 active investors → break-even

### Phase 3 — EAC Expansion (Year 2)

- **Rwanda** — RDB integration, 6-day setup target
- **Tanzania** — BRELA + TIC
- **Uganda** — UIA + URSB
- **West Africa** — Ghana (GIA), Nigeria (NIPC)
- 5,000 active investors, Series A raise

### Phase 4 — Global (Year 3+)

Southeast Asia (Vietnam, Indonesia) · MENA (UAE free zones, Saudi) · Latin America (Colombia, Peru, Chile) · 40+ countries · Global compliance intelligence platform

---

## 13. Business Model

### SaaS tiers

| Tier | Price | Features | Target |
|------|-------|---------|--------|
| Basic | USD 99 one-time | Compliance roadmap, form templates, email support | Local SMEs |
| Standard | USD 499 one-time | Form auto-fill, doc generation, facilitator (email), bank intro | Foreign investors under USD 500K |
| Premium | USD 1,499 one-time | Dedicated facilitator, fast-track, concierge banking, simulation report | Foreign investors USD 500K+ |
| Enterprise | USD 5,000+/year | Multi-entity, API access, custom workflows, white-label option | Multinationals, law firms |
| Gov B2B | USD 500K+/year | License platform to KenInvest / investment authorities | Government partners |

### Secondary revenue streams

| Source | Model | Est. Year 3 |
|--------|-------|------------|
| Document renewals | USD 50–200 per document/year | USD 1M |
| Bank referral fees | USD 100–500 per account opened | USD 600K |
| Consultant marketplace | 15% commission | USD 300K |
| Simulation API | USD 50 per run (external devs) | USD 250K |
| Investment intelligence | Anonymised compliance trend data for development banks | USD 200K |

### 3-year financial projection

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Active investors | 500 | 2,000 | 5,000 |
| Countries | 1 (Kenya) | 4 (EAC) | 10+ |
| Revenue | USD 250K | USD 1.2M | USD 4.1M |
| Costs | USD 400K | USD 900K | USD 2.5M |
| Net | (USD 150K) | USD 300K | USD 1.6M |
| Monthly infra | ~USD 180 | ~USD 600 | ~USD 2,000 |

### Funding ask

**Seed round — USD 500,000**
Offer: 10% equity
Use: 40% product, 30% team, 20% marketing, 10% operations
Milestone: 500 paying users + break-even within 12 months

**Series A — USD 3M (Month 18)**
Valuation: USD 30M
Use: EAC expansion, government partnerships, enterprise sales team
Milestone: 5,000 users, 4 countries, USD 2M ARR

---

## 14. Government Partnership Proposal

To: Chief Executive Officer, Kenya Investment Authority
From: Meridian
Re: Digital Investor Onboarding Partnership

### Strategic alignment

| KenInvest priority | How Meridian delivers |
|-------------------|----------------------|
| Facilitate investment entry | AI roadmap guides investors through all 49 agencies |
| Reduce administrative burden | Auto-fills 200+ government forms |
| Improve ease of doing business | 70% faster: 90 days → 21 days |
| Enhance investor aftercare | Expiry tracker, auto-renewal, ongoing monitoring |
| Data-driven policymaking | Real-time investment flows, bottleneck agencies, abandonment data |
| Anti-corruption mandate | Immutable audit trail, corruption pattern detection, EACC-ready reporting |

### Partnership options

**Option A — Technology licensing**
KenInvest licenses Meridian. Rebrand as "KenInvest Digital." License fee: USD 500K/year. Full government control.

**Option B — Revenue sharing (recommended)**
Meridian operates commercially. KenInvest investors get 50% discount. Meridian pays 20% revenue share to KenInvest. No upfront cost to government.

**Option C — Joint venture**
"KenInvest Digital Services Ltd." 51% KenInvest, 49% Meridian. Shared ownership and incentives.

### Government revenue projection (Option B)

| Year | Investors | Revenue | Gov share (20%) |
|------|-----------|---------|----------------|
| Year 1 | 500 | USD 250K | USD 50K |
| Year 2 | 2,000 | USD 1M | USD 200K |
| Year 3 | 5,000 | USD 2.5M | USD 500K |

### Implementation roadmap

| Phase | Timeline | Deliverables | Success metric |
|-------|----------|-------------|---------------|
| Pilot | Q2 2026 (3 months) | 50 beta investors, eCitizen + iTax + BRS, 3 facilitators | 80% satisfaction, under 30-day setup |
| Scale-up | Q3-Q4 2026 (6 months) | 500 investors, all major agency integrations, 10 facilitators | 500 onboarded, break-even |
| National rollout | 2027 | 5,000+ investors, all 47 counties, EAC expansion | FDI growth, Doing Business rank improvement |

---

## 15. Deployment Guide

### Prerequisites — 4 API keys

| Key | Where to get | Cost |
|-----|-------------|------|
| LLM_API_KEY (MiMo) | platform.xiaomimimo.com | $1/$3 per 1M tokens |
| PERPLEXITY_API_KEY | perplexity.ai/api-platform | ~$0.40 per deep research |
| ZEP_API_KEY | app.getzep.com | Free tier sufficient |
| EMBEDDING_API_KEY (OpenAI) | platform.openai.com | $0.02 per 1M tokens |

### Quick start

```bash
git clone https://github.com/YOUR/meridian-mirofish
cd meridian-mirofish
cp .env.example .env
# → Paste your 4 API keys into .env

docker compose up -d qdrant
npm run setup:all
npm run dev

# Open: http://localhost:3000
# Test: python tests/test_full_system.py
```

### Monthly infrastructure cost

| Component | Usage | Monthly cost |
|-----------|-------|-------------|
| MiMo-V2-Pro (Hunter Alpha) | 200 simulations × 2M tokens | ~USD 100 |
| MiMo-V2-Omni (Healer Alpha) | Passport + document reading | ~USD 20 |
| Perplexity deep research | 1,200 research queries | ~USD 40 |
| Zep Cloud | Free tier | USD 0 |
| Qdrant (self-hosted Docker) | Existing server | USD 0 |
| Railway hosting | Pro plan | USD 20 |
| **Total** | | **~USD 180/month** |

### Scaling path

| Stage | Setup | Monthly infra |
|-------|-------|--------------|
| 0–500 users | Railway + Docker Qdrant + MiMo API | ~USD 200 |
| 500–5,000 users | AWS/GCP + managed Qdrant + Redis cluster | ~USD 800 |
| 5,000+ users | Multi-region + RunPod GPU + CDN | ~USD 3,000 |

---

*Meridian — Global Investment Intelligence*
*Version 1.0 — March 2026*
*Powered by: Xiaomi MiMo-V2-Pro (Hunter Alpha) + MiMo-V2-Omni (Healer Alpha)*
*Built on: MiroFish (OASIS/CAMEL-AI) · Perplexity Agent API · Qdrant · GraphRAG · Zep Cloud*
*Launch market: Kenya · Expansion: Rwanda · Tanzania · Uganda · West Africa · Global*
