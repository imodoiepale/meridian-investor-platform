# 🐟 MiroFish × Kenya Invest — Investor Simulation Engine
### Using MiroFish Swarm Intelligence to Simulate, Test & Optimise Investor Onboarding for Kenya and Global Markets

---

## Overview

This document defines how to **fork and modify MiroFish** specifically to power the Kenya Invest platform — and extend it to any country's investment onboarding system.

Instead of using MiroFish purely for political/market *prediction*, we repurpose it as an **investor journey simulation engine**: spawning thousands of simulated investors, regulatory officers, facilitators, and market actors to:

1. **Test** the Kenya Invest platform before deploying to real investors
2. **Simulate** bottlenecks, corruption points, and failure scenarios
3. **Predict** which types of investors will struggle and why
4. **Optimise** compliance roadmaps, fee estimates, and facilitator matching
5. **Model** how regulatory changes affect investment inflows
6. **Generate** country-specific training data for the AI models

---

## Table of Contents
1. [MiroFish Modification Strategy](#1-mirofish-modification-strategy)
2. [Seed Materials: Kenya Investor Profiles](#2-seed-materials-kenya-investor-profiles)
3. [Agent Types for Investor Simulation](#3-agent-types-for-investor-simulation)
4. [Simulation Workflows](#4-simulation-workflows)
5. [Kenya-Specific Simulations](#5-kenya-specific-simulations)
6. [Global Country Expansion Roadmap](#6-global-country-expansion-roadmap)
7. [Country Profile Templates](#7-country-profile-templates)
8. [MiroFish Code Modifications](#8-mirofish-code-modifications)
9. [Integration with Kenya Invest Platform](#9-integration-with-kenya-invest-platform)
10. [Simulation Roadmap — Node Map](#10-simulation-roadmap--node-map)
11. [Portfolio & Research Use Cases](#11-portfolio--research-use-cases)

---

## 1. MiroFish Modification Strategy

### What We Keep (Core MiroFish)
- OASIS simulation engine (agent interactions, social dynamics)
- GraphRAG knowledge graph construction
- Zep Cloud agent memory
- ReportAgent synthesis
- Vue.js frontend + FastAPI backend
- Docker deployment

### What We Add / Override

```
MiroFish Stock                    →  Kenya Invest Fork
─────────────────────────────────────────────────────────
Generic social media agents       →  Typed investor/officer/facilitator agents
Twitter/Reddit environments       →  Government portal environments (eCitizen, iTax, etc.)
Opinion formation simulation      →  Compliance journey simulation
News articles as seed             →  Investor profiles + regulatory data as seed
Political prediction output       →  Onboarding success/failure prediction + bottleneck map
```

### LLM Configuration for This Fork

```env
# For Kenya Invest MiroFish fork: use Xiaomi MiMo models
LLM_API_KEY=your_mimo_key
LLM_BASE_URL=https://api.xiaomimimo.com/v1
LLM_MODEL_NAME=mimo-v2-pro        # Hunter Alpha — for agent reasoning + simulation

# Zep Cloud (agent memory)
ZEP_API_KEY=your_zep_key

# For multimodal seed ingestion (document images, maps)
LLM_OMNI_MODEL=mimo-v2-omni       # Healer Alpha — for reading uploaded documents
```

---

## 2. Seed Materials: Kenya Investor Profiles

Seed materials define the population of simulated agents. For Kenya Invest, we build seed packs by investor category:

### 2.1 Seed Pack A — Chinese Manufacturing Investor
```markdown
**Profile Summary:**
Investor from Guangzhou, China. Capital: USD 2 million. Industry: electronics 
assembly. Plans to hire 40 Kenyan workers. Wants to set up in Nairobi's 
Ruaraka Industrial Area. No Kenyan partners initially. 
Language: Mandarin primary, limited English.

**Regulatory context:**
- Needs Class G work permit (4-8 weeks)
- EIA license (NEMA, 90 days if factory >500sqm)
- KEBS Diamond Mark (60 days)
- NCA project registration
- Employment of 40 NSSF/SHIF registrations
- Customs registration (importing components from China)

**Friction points (to simulate):**
- Language barrier at Immigration
- Unfamiliarity with eCitizen portal
- Confusion between county and national licenses
- NEMA EIA timeline longer than expected
```

### 2.2 Seed Pack B — UK Diaspora Returning Investor
```markdown
**Profile Summary:**
Kenyan national, UK passport, living in London 15 years. 
Capital: GBP 150,000. Industry: boutique hotel (12 rooms) in Diani, Mombasa County.
Plans to relocate with spouse and two children. Has land title already.

**Regulatory context:**
- Kenyan citizenship → no work permit needed
- TRA hotel classification license
- Mombasa County Single Business Permit
- NEMA EIA (coastal zone — extra requirements)
- Fire certificate, public health license
- DOSHS workplace registration
- NSSF/SHIF for staff
- KWS notification (proximity to Shimba Hills)

**Friction points (to simulate):**
- Coastal NEMA requirements stricter than inland
- Mombasa County portal less digitised than Nairobi
- Land title verification time
- Tourism low season affecting cash flow during setup
```

### 2.3 Seed Pack C — Indian Pharmaceutical Investor
```markdown
**Profile Summary:**
Indian national, representing a mid-sized pharma company in Mumbai.
Capital: USD 5 million. Industry: generic drug manufacturing.
Location preference: Athi River EPZ. 8 local hires + 2 Indian chemists.

**Regulatory context:**
- PPB product registration (per drug, 6-12 months each)
- KEBS Good Manufacturing Practice (GMP) certification
- NEMA EIA (chemical manufacturing — complex)
- WRA effluent discharge
- Immigration for 2 Indian professionals (Class G)
- EPZ license (EPZA) — significant tax benefits
- AFA dealer license (if using agricultural inputs)

**Friction points (to simulate):**
- PPB product registration is longest bottleneck (6-12 months per drug)
- EPZ rules: must export 80%+ of production
- Chemical import licenses (KEBS controlled substances)
- Two-track process: company registration + EPZ license in parallel
```

### 2.4 Seed Pack D — US Agritech Startup
```markdown
**Profile Summary:**
American startup, 3 co-founders, raising Series A. 
Capital: USD 500,000 initially. Industry: precision agriculture technology 
(sensors, AI-driven irrigation). Targeting smallholder farmers in Nakuru, 
Meru, and Kisii Counties.

**Regulatory context:**
- KenInvest investment certificate
- BRS company registration
- Communications Authority license (IoT devices)
- KEBS product testing (electronic devices)
- AFA dealer license (working with farmers)
- Data protection registration (ODPC — collecting farmer data)
- County permits × 3 counties

**Friction points (to simulate):**
- IoT device import clearance (KRA + KEBS)
- Operating across 3 counties = 3 separate permits
- ODPC registration (data from 10,000+ farmers)
- No precedent for this type of business in Kenya → regulatory ambiguity
```

### 2.5 Seed Pack E — Kenyan SME (Domestic Entrepreneur)
```markdown
**Profile Summary:**
Kenyan national, Nairobi. Capital: KES 800,000.
Industry: restaurant + catering company. 
Location: Westlands, Nairobi. 6 employees.

**Regulatory context:**
- BRS business name registration (sole proprietor) or private limited
- KRA PIN, VAT (if turnover >KES 5M), PAYE
- Nairobi County Single Business Permit
- Fire certificate
- Public health license + food handlers certificates
- DOSHS workplace registration (if >5 employees)
- NSSF + SHIF

**Friction points (to simulate):**
- Limited capital → can't afford delays or rejected applications
- Limited digital literacy → struggles with eCitizen
- VAT threshold question (register now or wait?)
- Cash flow pressure during 30-day permit wait
```

---

## 3. Agent Types for Investor Simulation

Unlike standard MiroFish (which creates generic social media users), our fork defines **structured agent types**:

### 3.1 Agent Definitions

```python
# /backend/agents/kenyan_investment_agents.py

AGENT_TYPES = {

    "INVESTOR": {
        "description": "A foreign or domestic investor navigating Kenya's investment process",
        "personality_dimensions": [
            "patience_level",           # 1-10: how long they'll wait before abandoning
            "digital_literacy",         # 1-10: comfort with online portals
            "capital_buffer",           # How much cash cushion for delays
            "language_proficiency",     # English/Swahili/other
            "prior_africa_experience",  # Whether they've invested in Africa before
            "risk_tolerance",           # How they respond to ambiguity
            "social_network_quality"    # Access to helpful contacts
        ],
        "actions": [
            "submit_application",
            "follow_up_with_agency",
            "hire_consultant",
            "request_facilitator_help",
            "report_problem",
            "abandon_process",          # Key failure mode to track
            "escalate_to_keninvest",
            "share_experience_with_peers"  # Affects FDI reputation
        ]
    },

    "GOVERNMENT_OFFICER": {
        "description": "Civil servant processing investor applications at a government agency",
        "personality_dimensions": [
            "workload_level",           # How many applications they're handling
            "process_adherence",        # Follow rules vs take shortcuts
            "responsiveness",           # How quickly they respond
            "corruption_susceptibility",# Used for audit training — NOT to simulate actual bribery
            "digital_capability",       # Can they actually use their own systems?
            "agency_culture"            # Supportive vs obstructive institutional culture
        ],
        "actions": [
            "process_application",
            "request_additional_document",
            "approve_application",
            "reject_application",
            "delay_without_explanation",# Flagged in audit engine
            "refer_to_supervisor",
            "contact_applicant"
        ]
    },

    "FACILITATOR": {
        "description": "Human agent assigned to help investor navigate the process",
        "personality_dimensions": [
            "sector_expertise",         # Which industries they know well
            "government_relationships", # Quality of contacts
            "workload",                 # How many clients they have
            "integrity_score",          # Their adherence to ethical conduct
            "language_capability",      # Can they communicate with investor?
            "physical_mobility"         # Can they reach all relevant offices?
        ],
        "actions": [
            "review_documents",
            "visit_government_office",
            "follow_up_call",
            "escalate_delay",
            "update_investor",
            "coordinate_parallel_applications",
            "report_irregular_request"  # Corruption reporting
        ]
    },

    "MARKET_PEER": {
        "description": "Another investor or entrepreneur who has been through the process",
        "influence": "Shapes new investor's expectations and confidence",
        "actions": [
            "share_positive_experience",
            "share_negative_experience",
            "recommend_facilitator",
            "warn_about_agency",
            "connect_investor_to_contacts"
        ]
    },

    "COUNTY_OFFICER": {
        "description": "County government official for local permits",
        "actions": ["process_permit", "schedule_inspection", "issue_certificate", "delay"]
    },

    "BANK_OFFICER": {
        "description": "Bank relationship manager for account opening",
        "actions": ["review_kyc", "request_documents", "approve_account", "refer_to_aml"]
    }
}
```

### 3.2 Agent Memory Configuration (Zep Cloud)

Each agent carries memory across the simulation:

```python
# Investor agent memory
investor_memory = {
    "applications_submitted": [],
    "documents_uploaded": [],
    "payments_made": [],
    "delays_experienced": [],
    "problems_encountered": [],
    "help_received": [],
    "emotional_state": "optimistic",  # Changes through simulation
    "confidence_in_process": 8,       # 1-10, decreases with friction
    "days_elapsed": 0,
    "total_spent": 0,
    "abandonment_risk": 0.05          # Increases with frustration
}

# Government officer memory
officer_memory = {
    "current_caseload": 45,
    "applications_in_queue": [...],
    "last_training_date": "2024-03-01",
    "system_downtime_today": False,
    "supervisor_pressure": "low",
    "irregular_requests_made": 0      # Tracked for audit purposes
}
```

---

## 4. Simulation Workflows

### 4.1 Standard Investor Journey Simulation

```
SIMULATION FLOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SEED INPUT:
  - Investor profile (nationality, sector, capital)
  - Regulatory environment data (current laws, fees, SLAs)
  - Historical data (actual processing times at each agency)
  - Current system conditions (staff levels, portal uptime)

↓

AGENT POPULATION SPAWN:
  - 1 × Target investor (your simulation subject)
  - 50–200 × Other investors at various stages
  - 25 × Government officers (across 10+ agencies)
  - 5 × Facilitators
  - 20 × Market peers

↓

SIMULATION RUN (30–50 rounds = ~90 simulated days):
  
  Round 1-5: Company registration + KRA
    Agents interact: Investor → BRS portal → Officer
    Events: Name search, form submission, approval, PIN issuance
    
  Round 6-15: Immigration + County
    Agents interact: Investor + Facilitator → Immigration → Officer
    Events: Work permit Form 17, dependent pass, county permit
    
  Round 16-25: Sector-specific (NEMA, KEBS, etc.)
    Higher complexity — more agent interactions
    Bottlenecks emerge from officer workload, document requests
    
  Round 26-40: Bank account, operational licenses
  
  Round 41-50: Final approvals, first day of operations

↓

REPORT GENERATION:
  - Days to completion (vs SLA benchmark)
  - Bottleneck agencies + specific friction points
  - Abandonment probability (and at which stage)
  - Cost variance (actual vs estimated)
  - Facilitator effectiveness score
  - Corruption risk score (by agency)
  - Recommendations for platform improvement
```

### 4.2 Simulation Questions to Ask MiroFish

```
# Question Set 1: Journey Optimisation
"A Chinese manufacturing investor with USD 2 million capital is trying to 
set up an electronics assembly plant in Nairobi. Simulate their complete 
regulatory journey. Which agency creates the most friction? At which point 
do they have the highest probability of abandonment?"

# Question Set 2: Policy Impact
"The Kenyan government has just announced it will extend Single Business 
Permits to 2 years instead of 1 year, and allow online renewal. 
Simulate how this affects investor confidence and the facilitator's workload 
over the next 6 months."

# Question Set 3: Platform Testing
"100 new investors are using the Kenya Invest platform for the first time.
50 are foreign, 50 are domestic SMEs. Simulate their experience:
Which features do they use? Where do they drop off? What questions do they ask 
that the AI can't answer? What would improve their experience most?"

# Question Set 4: Corruption Audit
"Simulate 500 investor applications over 12 months at NEMA. 
Based on agent interactions, which patterns emerge that could indicate 
irregular processing? At what rate are extra documents being requested 
beyond official requirements?"

# Question Set 5: County Comparison
"Compare investor experience setting up a restaurant in:
A) Nairobi County B) Mombasa County C) Kisumu County
Simulate 50 investors per county. Which county has the best experience?
What are the key differences?"

# Question Set 6: Global Expansion
"A Kenyan entrepreneur wants to expand their agritech business to 
Rwanda, Tanzania, and Ethiopia simultaneously. Simulate the regulatory 
journey in each country. Where should they expand first based on ease?"
```

---

## 5. Kenya-Specific Simulations

### 5.1 Investment Environment Health Score

Run monthly. Feeds into Kenya Invest's "Investment Climate Monitor":

```
Simulation: Monthly Investment Climate
Seed: 
  - Last month's KenInvest report
  - Government portal uptime stats
  - Processing time data from our platform (anonymised)
  - Economic indicators (CBK, KNBS)
  - News articles about business environment

Question: "Based on these inputs, simulate how Kenya's investment 
environment is likely to be experienced by:
  a) A new foreign investor arriving this month
  b) An existing investor renewing licenses
  c) A diaspora investor starting remotely

Output an Investment Ease Score (0-100) per investor type, 
per agency, and identify the top 3 improvements that would 
have the highest impact."
```

### 5.2 Simulate County Investment Conferences

Kenya holds county investment conferences. Use MiroFish to simulate outcomes:

```
Simulation: Nakuru County Investment Conference 2026
Seed:
  - Nakuru County investment profile (land, resources, workforce)
  - Conference agenda and announced incentives
  - County budget for investor support
  - Historical investment data for Nakuru
  - Competitor county offerings (Kiambu, Meru, Nyandarua)

Question: "100 potential investors attend the Nakuru County Investment 
Conference. They hear about 30% discount on land lease, free utility 
connections, and a fast-tracked permit process (7 days guaranteed). 
Simulate: How many will actually invest? Who will? Who will hesitate? 
What are their main concerns? What would convert hesitant investors?"
```

### 5.3 Simulate EAC Single Investment Area

```
Simulation: EAC Mutual Recognition of Business Registrations
Seed:
  - EAC Partner States Investment Act
  - Current registration requirements: Kenya, Uganda, Tanzania, Rwanda, Burundi, DRC
  - Investment data flows within EAC

Question: "If EAC implements a single investment registration allowing 
a Kenyan-registered company to operate in all 6 partner states without 
separate registration in each, simulate: Which sectors benefit most? 
How does this affect investment flows? What does an investor journey 
look like 3 years after implementation?"
```

---

## 6. Global Country Expansion Roadmap

The same MiroFish fork + Kenya Invest platform can be deployed for any country. Here is the expansion roadmap:

### 6.1 Tier 1 Expansion — East Africa (Months 1-12)

| Country | Priority | Key Difference from Kenya | Estimated Config Time |
|---------|---------|--------------------------|----------------------|
| **Rwanda** | High | Very digitalised (Rwanda Development Board = true one-stop), fewer agencies | 4 weeks |
| **Tanzania** | High | Different company law (BRELA), TIC for investment cert, Zanzibar special rules | 6 weeks |
| **Uganda** | High | UIA (Uganda Investment Authority), URSB registration, stricter immigration | 6 weeks |
| Ethiopia | Medium | Complex forex controls, IPDC for industrial parks | 10 weeks |
| Mozambique | Medium | CPI investment agency, Portuguese language, post-conflict context | 12 weeks |

### 6.2 Tier 2 Expansion — West & Southern Africa (Year 2)

| Country | Key Bodies | Main Challenges |
|---------|-----------|----------------|
| Ghana | GIA, Registrar General, GRA | GIPC minimum capital (USD 500k for non-citizens) |
| Nigeria | NIPC, CAC, FIRS | Federal + state regulation, FX controls |
| Senegal | APIX (one-stop), OHADA law | French language, OHADA business law |
| South Africa | DTIC, CIPC | BEE requirements, complex labour law |
| Zambia | ZDI, PACRA | Favourable mining environment |

### 6.3 Tier 3 — Global Expansion (Year 3+)

| Region | Priority Countries | Platform Adaptation Needed |
|--------|------------------|---------------------------|
| Southeast Asia | Vietnam, Indonesia, Philippines | Local language support, different legal systems |
| South Asia | India (state-level), Bangladesh, Sri Lanka | State-level variation (India especially) |
| Middle East | UAE (DIFC/ADGM free zones), Saudi Arabia | Arabic, Vision 2030 alignment |
| Latin America | Colombia, Peru, Chile | Spanish, OHADA-style legal systems |
| Eastern Europe | Poland, Romania, Bulgaria | EU law compliance, multiple languages |

---

## 7. Country Profile Templates

Each country expansion requires a **Country Profile Pack** — the seed material for that country's MiroFish simulations.

### 7.1 Country Profile Schema

```json
{
  "country": "Rwanda",
  "iso_code": "RW",
  "currency": "RWF",
  "official_languages": ["Kinyarwanda", "English", "French"],
  
  "investment_authority": {
    "name": "Rwanda Development Board (RDB)",
    "website": "rdb.rw",
    "one_stop_shop": true,
    "average_setup_days": 6,
    "notes": "One of Africa's most efficient investment environments"
  },
  
  "company_registration": {
    "body": "Rwanda Development Board",
    "process": "Online via rdb.rw",
    "forms": ["Company registration form"],
    "fees_usd": 0,
    "processing_days": 1,
    "notes": "Free and takes 1 day — benchmark for the continent"
  },
  
  "tax_registration": {
    "body": "Rwanda Revenue Authority (RRA)",
    "portal": "rra.gov.rw",
    "taxes": ["Corporate income tax (30%)", "VAT (18%)", "PAYE"],
    "processing_days": 2
  },
  
  "immigration": {
    "body": "Directorate General of Immigration",
    "work_permit": {
      "name": "Class A permit (investment)",
      "fee_usd": 1000,
      "processing_weeks": 4,
      "minimum_investment": "USD 250,000"
    }
  },
  
  "special_zones": [
    {
      "name": "Kigali Special Economic Zone (KSEZ)",
      "incentives": ["0% corporate tax (first 5 years)", "0% import duty on equipment"],
      "sectors": ["manufacturing", "logistics", "tech"]
    }
  ],
  
  "key_agencies": [
    {"name": "RDB", "role": "Investment, company reg, all major licenses"},
    {"name": "RRA", "role": "All taxes"},
    {"name": "RURA", "role": "Utilities, telecoms, transport regulation"},
    {"name": "REMA", "role": "Environmental management"},
    {"name": "NBS", "role": "Standards bureau"}
  ],
  
  "mirofish_seed_documents": [
    "RDB investment guide (PDF)",
    "Rwanda Companies Act",
    "Rwanda investment climate report",
    "Recent FDI data",
    "Special Economic Zone regulations"
  ],
  
  "corruption_risk": {
    "transparency_international_rank": 49,
    "notes": "Consistently ranks among Africa's least corrupt countries",
    "official_payment_channels": "All fees paid via Irembo platform"
  },
  
  "platform_notes": "Rwanda is the simplest deployment — digitised, fast, English-friendly. Use as test bed for platform architecture before complex country deployments."
}
```

### 7.2 Tanzania Country Profile (Summary)

```json
{
  "country": "Tanzania",
  "investment_authority": "Tanzania Investment Centre (TIC)",
  "minimum_investment_foreign": "USD 500,000 (TIC certificate required)",
  "company_registration": "Business Registrations and Licensing Agency (BRELA)",
  "tax_authority": "Tanzania Revenue Authority (TRA)",
  "special_zones": ["EPZA zones", "Zanzibar Special Economic Zone"],
  "key_difference": "Zanzibar has separate legal jurisdiction — needs separate setup",
  "key_challenge": "Mining and natural resources have additional Ministry approvals",
  "timeline": "30-60 days (longer than Kenya due to TIC certificate requirement)",
  "language": "Swahili + English (same as Kenya — low adaptation cost)"
}
```

### 7.3 Rwanda vs Kenya vs Tanzania Comparison Simulation

```
MiroFish Question:
"An East African investor has USD 1 million to invest in a food processing 
facility. They are evaluating Kenya, Rwanda, and Tanzania. 

Simulate their evaluation process:
1. Which country offers the fastest regulatory path?
2. Where is the total compliance cost lowest?
3. Which country has the best investor aftercare?
4. What are the top 3 risks in each country?
5. Where should they invest first, and why?

Use the regulatory profiles of all three countries as seed material."
```

---

## 8. MiroFish Code Modifications

### 8.1 Modified File Structure

```
MiroFish-KenyaInvest/
├── backend/
│   ├── agents/
│   │   ├── kenyan_investment_agents.py  ← NEW
│   │   ├── agent_factory.py              ← MODIFIED
│   │   └── agent_memory.py              ← MODIFIED
│   ├── environments/
│   │   ├── ecitizen_env.py              ← NEW (replaces Twitter env)
│   │   ├── immigration_env.py           ← NEW
│   │   ├── county_env.py                ← NEW
│   │   └── bank_env.py                  ← NEW
│   ├── seeds/
│   │   ├── kenya/
│   │   │   ├── investor_profiles/       ← NEW
│   │   │   ├── regulatory_data/         ← NEW
│   │   │   └── fee_schedules/           ← NEW
│   │   ├── rwanda/                      ← NEW
│   │   ├── tanzania/                    ← NEW
│   │   └── uganda/                      ← NEW
│   ├── reports/
│   │   ├── investor_journey_report.py   ← NEW
│   │   ├── bottleneck_analysis.py       ← NEW
│   │   └── country_comparison_report.py ← NEW
│   └── app.py                           ← MODIFIED (new API endpoints)
├── frontend/
│   └── src/
│       ├── views/
│       │   ├── InvestorSimulation.vue   ← NEW
│       │   ├── CountryComparison.vue    ← NEW
│       │   └── BottleneckDashboard.vue  ← NEW
└── .env
```

### 8.2 New API Endpoints

```python
# backend/app.py — new endpoints added to MiroFish

from flask import Blueprint

invest_bp = Blueprint('invest', __name__)

@invest_bp.route('/api/invest/simulate-journey', methods=['POST'])
def simulate_investor_journey():
    """
    Run a full investor journey simulation for a given profile + country.
    Body: { investor_type, country, seed_documents, question, agent_count, rounds }
    """
    pass

@invest_bp.route('/api/invest/compare-countries', methods=['POST'])
def compare_countries():
    """
    Compare investment ease across multiple countries for a sector.
    Body: { sector, countries[], investment_amount, question }
    """
    pass

@invest_bp.route('/api/invest/bottleneck-scan', methods=['POST'])
def bottleneck_scan():
    """
    Identify which agencies/steps cause the most friction in a given country.
    Body: { country, historical_data, question }
    """
    pass

@invest_bp.route('/api/invest/policy-impact', methods=['POST'])
def policy_impact():
    """
    Simulate the impact of a regulatory change on investor inflows.
    Body: { country, policy_change_description, affected_sectors, question }
    """
    pass

@invest_bp.route('/api/invest/corruption-risk', methods=['POST'])
def corruption_risk_scan():
    """
    Use MiroFish to identify corruption risk patterns in a regulatory environment.
    Output feeds into Kenya Invest's audit engine.
    Body: { country, agency, period_data, question }
    """
    pass
```

### 8.3 Custom ReportAgent Prompt (Investor Focus)

```python
# Override MiroFish's default ReportAgent prompt

INVEST_REPORT_AGENT_PROMPT = """
You are an expert investment facilitation analyst specialising in 
African investment climates and regulatory environments.

Analyse the completed simulation and produce a structured report covering:

1. JOURNEY SUMMARY
   - Total simulated days to full compliance
   - Cost variance (actual vs budgeted)
   - Number of applications submitted, approved, rejected
   - Facilitator actions taken

2. BOTTLENECK ANALYSIS
   - Top 3 agencies causing delays (with data)
   - Root causes of each bottleneck
   - Average wait time per agency vs official SLA

3. INVESTOR EXPERIENCE SCORE
   - Overall score (0-100)
   - Score by phase (registration, licensing, operations)
   - Abandonment risk and at what stage

4. CORRUPTION RISK INDICATORS
   - Agencies with anomalous document requests
   - Fee irregularities detected
   - Unexplained delays pattern
   (Note: These are systemic patterns, not attributions to individuals)

5. PLATFORM IMPROVEMENT RECOMMENDATIONS
   - What the Kenya Invest platform could do better
   - Which forms/documents need better auto-fill
   - Where facilitator intervention is most valuable

6. COUNTRY COMPETITIVENESS ASSESSMENT
   - How does this country compare to regional peers?
   - What 3 regulatory changes would most improve investor experience?

Be specific. Use data from the simulation. Cite agent interactions.
Format as a professional investment climate report.
"""
```

---

## 9. Integration with Kenya Invest Platform

### 9.1 How MiroFish Powers Kenya Invest Features

```
Kenya Invest Feature              ← MiroFish Simulation Feeds
─────────────────────────────────────────────────────────────────
Compliance roadmap accuracy       ← Journey simulations calibrate 
                                    estimated timelines per agency

Fee estimates                     ← Simulations + real data validate
                                    cost estimates per investor type

Facilitator matching              ← Simulations identify which facilitator 
                                    profiles succeed with which investor types

Risk predictor                    ← Simulations identify which investors 
                                    face highest risk of delay/rejection

County recommender                ← Country/county comparison simulations

Document checklist accuracy       ← Simulations flag missing documents 
                                    that officers request most often

Platform stress testing           ← Simulate 1000 investors using platform 
                                    simultaneously — find failure points

Training data for MiMo models     ← Simulation transcripts = training data 
                                    for improving AI responses
```

### 9.2 Monthly Simulation Schedule

```
Week 1: Run 100-agent simulation for each top 5 investor types in Kenya
Week 2: Run county comparison simulation (all 47 counties, top 3 sectors)
Week 3: Run regulatory change impact simulations (based on gazette notices)
Week 4: Corruption risk scan per agency (feeds audit engine)

Output: Monthly Investment Climate Report
  → Published on Kenya Invest platform
  → Submitted to KenInvest as value-add
  → Research paper material
```

---

## 10. Simulation Roadmap — Node Map

```
INVESTMENT SIMULATION PIPELINE

┌─────────────────────────────────────────────────────────────────┐
│ NODE 1: COUNTRY DATA INGESTION                                  │
│  ├─ Regulatory framework documents (PDFs, gazettes)             │
│  ├─ Fee schedules (official government sources)                 │
│  ├─ Historical processing times (platform data)                 │
│  ├─ Corruption indices (TI, World Bank Doing Business)          │
│  └─ Economic indicators (IMF, CBK, World Bank)                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ NODE 2: KNOWLEDGE GRAPH BUILD (GraphRAG)                        │
│  ├─ Entities: Agencies, officers, investors, facilitators       │
│  ├─ Relationships: Who approves what, who depends on whom       │
│  ├─ Processes: Sequential and parallel application flows        │
│  └─ Constraints: SLAs, fees, document requirements per agency   │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ NODE 3: AGENT POPULATION SPAWN                                  │
│  ├─ Investor agents (5–10 types based on seed profiles)         │
│  ├─ Government officer agents (1 per major agency)              │
│  ├─ Facilitator agents (tiered: junior/standard/senior)         │
│  ├─ Bank officer agents                                         │
│  └─ Market peer agents (veterans who've been through process)   │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ NODE 4: SIMULATION RUN (OASIS Engine)                           │
│  ├─ Environment 1: Government portal world (eCitizen, iTax)     │
│  ├─ Environment 2: Physical office world (Immigration, Counties)│
│  ├─ Inject events: System downtime, staff transfers, policy     │
│  │  changes, election periods, budget cycles                    │
│  ├─ Track: Each application's status across all agents          │
│  └─ Monitor: Agent memory updates, frustration levels           │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ NODE 5: REPORT GENERATION (Custom ReportAgent)                  │
│  ├─ Bottleneck analysis by agency                               │
│  ├─ Investor experience score                                   │
│  ├─ Abandonment probability and trigger points                  │
│  ├─ Cost variance analysis                                      │
│  ├─ Corruption risk indicators                                  │
│  └─ Platform improvement recommendations                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ NODE 6: PLATFORM FEEDBACK LOOP                                  │
│  ├─ Update Kenya Invest roadmap timelines                       │
│  ├─ Recalibrate fee estimates                                   │
│  ├─ Adjust facilitator matching algorithm                       │
│  ├─ Feed audit engine with corruption risk patterns             │
│  └─ Generate monthly investment climate report                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ NODE 7: COUNTRY EXPANSION                                       │
│  ├─ Repeat Nodes 1-6 for Rwanda, Tanzania, Uganda               │
│  ├─ Cross-country comparison reports                            │
│  ├─ EAC investment harmonisation simulation                     │
│  └─ Global expansion country scoring                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 11. Portfolio & Research Use Cases

### 11.1 Portfolio Positioning

> *"I built a swarm intelligence simulation engine that models investor journeys across African regulatory environments — spawning thousands of AI agents (investors, civil servants, facilitators) to identify bottlenecks, flag corruption risk patterns, and optimise onboarding for a platform serving real investors in Kenya, Rwanda, Tanzania, and Uganda."*

**Tech Stack to Highlight:**
MiroFish (OASIS/CAMEL-AI) · Xiaomi MiMo-V2-Pro (Hunter Alpha) · MiMo-V2-Omni (Healer Alpha) · Python/FastAPI · Vue.js · GraphRAG · Zep Cloud · Docker · Railway/RunPod · PostgreSQL

### 11.2 Research Paper Opportunity

**Title:** *"Swarm Intelligence for Regulatory Bottleneck Detection: Simulating Investor Onboarding in East African Investment Environments"*

**Structure:**
1. Introduction: The problem of regulatory friction in African FDI
2. Methodology: MiroFish agent-based simulation of investor journeys
3. Data: Kenya/Rwanda/Tanzania regulatory profiles
4. Findings: Bottleneck agencies, abandonment patterns, corruption risk signals
5. Platform: Kenya Invest Digital Autopilot
6. Policy Recommendations

**Value:** This is publishable in development economics and AI/policy journals.

### 11.3 Key Metrics to Track and Present

```
After 6 months of running simulations:
✅ Simulations run: X (per country, per investor type)
✅ Bottlenecks identified and validated against real data: Y
✅ Platform accuracy improvement (estimated timeline vs actual): Z%
✅ Corruption risk flags generated: N
✅ Countries profiled: K/R/T/U + [expanding]
✅ Policy recommendations submitted to KenInvest: P
```

---

## Quick Start: Run Your First Kenya Invest Simulation

```bash
# 1. Clone and setup MiroFish (Kenya fork)
git clone https://github.com/YOUR_USERNAME/MiroFish-KenyaInvest.git
cd MiroFish-KenyaInvest

cp .env.example .env
# Edit .env: set mimo-v2-pro as LLM, add Zep key

npm run setup:all
npm run dev

# 2. Open http://localhost:3000
# 3. Click "New Simulation" → Select "Investor Journey"
# 4. Upload seed pack: /seeds/kenya/chinese_manufacturing_investor.md
# 5. Enter question: "Simulate this investor's full journey through Kenya's 
#    regulatory system. Where do they face the most friction?"
# 6. Set: 100 agents, 40 rounds
# 7. Start simulation → read report
```

---

*MiroFish × Kenya Invest — Investor Simulation Engine*
*Powered by: Xiaomi MiMo-V2-Pro (Hunter Alpha) + MiMo-V2-Omni (Healer Alpha)*
*Built on: OASIS (CAMEL-AI) · GraphRAG · Zep Cloud*
*March 2026*
