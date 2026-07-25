# MiroFish × Kenya Invest — Complete Integration Spec
### PRD · Tech Spec · Research Agent · Fork Guide · API Spec · Deployment

> **Status:** Draft v1.0 — March 2026  
> **MiroFish base:** github.com/666ghj/MiroFish (fork: MiroFish-KenyaInvest)  
> **LLM stack:** Xiaomi MiMo-V2-Pro (Hunter Alpha) + MiMo-V2-Omni (Healer Alpha) + Perplexity Agent API  

---

## Table of Contents
1. [Product Vision & PRD](#1-product-vision--prd)
2. [System Architecture](#2-system-architecture)
3. [Research Agent — Full Spec](#3-research-agent--full-spec)
4. [Seed Pack Generator — Full Schema](#4-seed-pack-generator--full-schema)
5. [MiroFish Fork — What Changes](#5-mirofish-fork--what-changes)
6. [Typed Agent Definitions](#6-typed-agent-definitions)
7. [Simulation Environments](#7-simulation-environments)
8. [All 49 Agencies + Simulation Roles](#8-all-49-agencies--simulation-roles)
9. [Custom ReportAgent](#9-custom-reportagent)
10. [Platform Feedback Loop](#10-platform-feedback-loop)
11. [API Specification](#11-api-specification)
12. [Node Roadmap — Full Hierarchy](#12-node-roadmap--full-hierarchy)
13. [Global Expansion Schema](#13-global-expansion-schema)
14. [Deployment Guide](#14-deployment-guide)
15. [Cost Model](#15-cost-model)

---

## 1. Product Vision & PRD

### 1.1 Vision
Kenya Invest is an AI-powered investor onboarding autopilot that eliminates the 90-day setup process. MiroFish is the intelligence engine underneath — continuously simulating investor journeys, detecting bottlenecks, flagging corruption risk, and feeding calibration data back into the platform.

The key innovation: **the Research Agent means zero manual seed data**. A user provides only their sector, nationality, capital, and county. Everything else — fee schedules, SLAs, regulatory maps, agency risk scores, bottleneck forecasts — is researched, synthesised, and structured automatically in under 3 minutes.

### 1.2 Problem Statement
- Kenya ranks 132/190 on World Bank Ease of Doing Business
- 90+ days to complete investor onboarding
- 49 government agencies to navigate
- 200+ forms to fill manually
- 40% of investors abandon the process
- USD 2.5B in FDI lost annually due to friction
- Zero intelligent end-to-end system exists

### 1.3 Functional Requirements

#### Research Agent
| ID | Requirement | Priority |
|----|-------------|----------|
| RA-01 | Auto-research current fees for all 49 agencies via Perplexity | P0 |
| RA-02 | Auto-research realistic (not official) processing times | P0 |
| RA-03 | Read uploaded PDFs using MiMo-V2-Omni natively | P0 |
| RA-04 | Read passport/ID image — no separate OCR service | P0 |
| RA-05 | Synthesise into structured seed JSON via MiMo-V2-Pro | P0 |
| RA-06 | Complete in under 3 minutes per sector/country combo | P1 |
| RA-07 | All sources cited + stored in audit trail | P1 |
| RA-08 | Cache results 24h per sector/county combination | P2 |

#### MiroFish Simulation
| ID | Requirement | Priority |
|----|-------------|----------|
| SIM-01 | 5 typed agent types (investor, officer, facilitator, bank, peer) | P0 |
| SIM-02 | Replace Twitter/Reddit envs with eCitizen/Immigration/County | P0 |
| SIM-03 | Seed pack fully auto-populated from Research Agent | P0 |
| SIM-04 | Custom ReportAgent: bottleneck map + abandonment curve | P0 |
| SIM-05 | Corruption risk flags per agency per run | P1 |
| SIM-06 | Multi-country profiles (Kenya, Rwanda, Tanzania, Uganda) | P1 |
| SIM-07 | Simulation results feed back to platform via webhook | P1 |
| SIM-08 | Monthly automated simulation schedule | P2 |

### 1.4 Success Metrics
| Metric | Baseline | Target |
|--------|----------|--------|
| Average investor setup time | 90+ days | 21 days |
| Seed pack generation time | manual (days) | < 3 minutes |
| Platform roadmap accuracy vs actual | ±40% | ±10% |
| Facilitator match quality (investor rating) | manual | 4.5/5 |
| Form rejection rate | 25% | < 5% |
| Corruption flag precision | 0% | 80% |

---

## 2. System Architecture

```
INPUT LAYER
  ├── User: nationality + sector + capital + county (4 fields only)
  ├── Uploaded documents: passport image, PDFs (optional)
  └── Platform historical data: anonymised processing times

RESEARCH AGENT LAYER
  ├── Perplexity sonar-deep-research
  │     queries: fees, SLAs, gazette notices, portal uptime, laws
  ├── MiMo-V2-Omni (Healer Alpha)
  │     reads: passport images, PDF documents natively
  └── MiMo-V2-Pro (Hunter Alpha)
        synthesises: raw research → structured seed JSON
        tool calls: check_ecitizen_status, fetch_kra_fee_schedule,
                    query_county_portal, check_immigration_queue

SEED PACK GENERATOR
  └── Output: investor_profile + regulatory_map + fee_schedule +
              sla_benchmarks + agency_risk_scores + bottleneck_forecast +
              simulation_config

MIROFISH FORK (KenyaInvest Edition)
  ├── GraphRAG: entities (agencies, officers, investors) + relationships
  ├── Zep Cloud: agent memories per simulation run
  ├── OASIS Engine (CAMEL-AI): 1M agent capacity, 23 social actions
  └── Simulation Environments:
        ecitizen_portal || immigration_office || county_portal || bank_env

CUSTOM REPORTAGENT
  └── Output: bottleneck_map + abandonment_curve + cost_variance +
              corruption_flags + facilitator_scores + recommendations

KENYA INVEST PLATFORM V3 (feedback targets)
  ├── Roadmap timeline recalibration
  ├── Fee estimate updates
  ├── Facilitator matching algorithm refinement
  ├── Audit engine: new corruption risk patterns
  └── Expiry tracker: new SLA data

GLOBAL EXPANSION
  └── Kenya → Rwanda → Tanzania → Uganda → +40 countries
```

---

## 3. Research Agent — Full Spec

### 3.1 Why Perplexity Agent API

The Perplexity Agent API (released March 11, 2026) is a managed runtime for agentic workflows with built-in web search, tool execution, and multi-model orchestration. The `advanced-deep-research` preset performs dozens of searches per query, reads hundreds of source documents, and iteratively refines analysis — exactly what is needed to build current, accurate seed data for investor simulations.

### 3.2 Implementation

```python
# backend/research_agent/perplexity_researcher.py

import os
import json
import requests
from openai import OpenAI

PERPLEXITY_KEY = os.getenv("PERPLEXITY_API_KEY")
MIMO_KEY = os.getenv("LLM_API_KEY")

class InvestmentResearchAgent:
    """
    Fully autonomous research agent.
    Input: sector + nationality + capital + county (4 fields)
    Output: complete structured seed pack JSON
    """
    
    def __init__(self):
        self.perplexity = OpenAI(
            base_url="https://api.perplexity.ai/v1",
            api_key=PERPLEXITY_KEY
        )
        self.mimo_pro = OpenAI(
            base_url="https://api.xiaomimimo.com/v1",
            api_key=MIMO_KEY
        )
    
    def research(self, sector: str, nationality: str, 
                 capital_usd: float, county: str) -> dict:
        """Main entry point. Returns complete seed pack."""
        
        # Phase 1: Parallel deep research queries
        research_results = self._run_research_queries(
            sector, nationality, capital_usd, county
        )
        
        # Phase 2: Synthesise into structured seed pack
        seed_pack = self._synthesise_seed_pack(
            research_results, sector, nationality, capital_usd, county
        )
        
        return seed_pack
    
    def _run_research_queries(self, sector, nationality, 
                               capital_usd, county) -> list:
        """Runs all research queries via Perplexity Deep Research."""
        
        queries = [
            f"Current official fee schedule for {sector} business setup Kenya 2026: "
            f"BRS company registration, KRA PIN/VAT, county Single Business Permit, "
            f"immigration work permit Class G. Include paybill numbers.",
            
            f"Realistic processing time (not official SLA) for investor "
            f"registrations in Kenya 2026: immigration work permit actual wait, "
            f"NEMA EIA actual timeline, KEBS Diamond Mark actual. Include known delays.",
            
            f"Kenya {sector} sector regulations 2026: required licenses, "
            f"specific agencies, sector-specific requirements. "
            f"Include recent gazette notices.",
            
            f"{county} County Kenya investor requirements 2026: Single Business "
            f"Permit fees, fire certificate, public health license, "
            f"building approvals. Current portal status.",
            
            f"Kenya immigration Class G work permit requirements 2026 "
            f"for {nationality} investor: exact documents, current queue times, "
            f"known issues, portal uptime.",
            
            f"EACC Kenya corruption reports 2025-2026 by government agency: "
            f"which agencies have highest irregular payment complaints, "
            f"fee mismatch reports, unexplained delays."
        ]
        
        results = []
        for query in queries:
            response = self.perplexity.chat.completions.create(
                model="sonar-deep-research",
                messages=[{"role": "user", "content": query}]
            )
            results.append({
                "query": query,
                "content": response.choices[0].message.content,
                "citations": getattr(response, 'citations', [])
            })
        
        return results
    
    def _synthesise_seed_pack(self, research_results, sector, 
                               nationality, capital_usd, county) -> dict:
        """Uses MiMo-V2-Pro to synthesise research into structured seed JSON."""
        
        system_prompt = """You are a Kenyan investment compliance expert and data analyst.
        Synthesise the research results into a precise, structured seed pack.
        Return ONLY valid JSON matching the schema exactly.
        Use realistic estimates where official data is unavailable.
        Flag uncertainty with confidence_score fields."""
        
        research_text = "\n\n".join([
            f"QUERY: {r['query']}\nFINDINGS: {r['content']}"
            for r in research_results
        ])
        
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "check_ecitizen_portal_status",
                    "description": "Check if eCitizen portal is currently operational",
                    "parameters": {"type": "object", "properties": {}}
                }
            },
            {
                "type": "function", 
                "function": {
                    "name": "get_official_fee_schedule",
                    "description": "Get latest official fee for a specific agency service",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "agency": {"type": "string"},
                            "service": {"type": "string"}
                        }
                    }
                }
            }
        ]
        
        response = self.mimo_pro.chat.completions.create(
            model="mimo-v2-pro",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"""
                Build a complete seed pack for:
                Sector: {sector}
                Nationality: {nationality}
                Capital: USD {capital_usd:,}
                County: {county}
                
                Research findings:
                {research_text}
                
                Return the full seed pack JSON as specified.
                """}
            ],
            tools=tools,
            tool_choice="auto",
            max_tokens=8000,
            temperature=0.2
        )
        
        content = response.choices[0].message.content
        # Strip markdown if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        
        return json.loads(content.strip())
    
    def read_passport(self, image_path: str) -> dict:
        """Uses MiMo-V2-Omni (Healer Alpha) to read passport/ID natively."""
        import base64
        
        mimo_omni = OpenAI(
            base_url="https://api.xiaomimimo.com/v1",
            api_key=MIMO_KEY
        )
        
        with open(image_path, "rb") as f:
            image_b64 = base64.b64encode(f.read()).decode()
        
        response = mimo_omni.chat.completions.create(
            model="mimo-v2-omni",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}
                    },
                    {
                        "type": "text",
                        "text": """Extract all fields from this identity document.
                        Return ONLY valid JSON:
                        {
                          "document_type": "passport|national_id|alien_card",
                          "full_name": "",
                          "nationality": "",
                          "passport_number": "",
                          "id_number": "",
                          "date_of_birth": "YYYY-MM-DD",
                          "gender": "M|F",
                          "issue_date": "YYYY-MM-DD",
                          "expiry_date": "YYYY-MM-DD",
                          "issuing_country": "",
                          "confidence_score": 0.0
                        }"""
                    }
                ]
            }],
            max_tokens=500
        )
        
        raw = response.choices[0].message.content
        return json.loads(raw.strip().strip("```json").strip("```"))
    
    def read_pdf_document(self, pdf_path: str, extract_type: str) -> dict:
        """Uses MiMo-V2-Omni to extract structured data from PDFs."""
        import base64
        
        mimo_omni = OpenAI(
            base_url="https://api.xiaomimimo.com/v1",
            api_key=MIMO_KEY
        )
        
        with open(pdf_path, "rb") as f:
            pdf_b64 = base64.b64encode(f.read()).decode()
        
        extract_prompts = {
            "fee_schedule": "Extract all fees, paybill numbers, and service names as JSON",
            "gazette": "Extract all regulatory changes, effective dates, and affected agencies as JSON",
            "policy": "Extract all processing requirements, SLAs, and document checklists as JSON"
        }
        
        response = mimo_omni.chat.completions.create(
            model="mimo-v2-omni",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": pdf_b64
                        }
                    },
                    {
                        "type": "text",
                        "text": extract_prompts.get(extract_type, "Extract all structured data as JSON")
                    }
                ]
            }],
            max_tokens=4000
        )
        
        raw = response.choices[0].message.content
        try:
            return json.loads(raw.strip().strip("```json").strip("```"))
        except:
            return {"raw_extraction": raw}
```

### 3.3 Research Scope Matrix

| Domain | Source | Agent | Output field |
|--------|--------|-------|-------------|
| Current laws + regulations | Kenya Law, Gazette | Perplexity | `regulatory_map` |
| Official fee schedules | eCitizen, agency sites | Perplexity + MiMo Pro | `fee_schedule` |
| Realistic processing times | Platform data + public complaints | MiMo Pro | `sla_benchmarks` |
| Portal uptime status | Uptime monitors | Perplexity | `system_conditions` |
| Sector-specific requirements | Agency websites | Perplexity | `sector_workflow` |
| County-specific rules | 47 county portals | Perplexity | `county_profile` |
| Corruption risk signals | EACC reports, TI index | MiMo Pro | `risk_scores` |
| Investor identity | Uploaded passport | MiMo Omni | `investor_profile` |

---

## 4. Seed Pack Generator — Full Schema

```python
# The complete schema that the Research Agent auto-populates

SEED_PACK_SCHEMA = {
    "seed_meta": {
        "generated_at": "ISO timestamp",
        "investor_nationality": "string",
        "sector": "string",
        "sub_sector": "string",
        "capital_usd": "float",
        "county": "string",
        "research_sources_count": "int",
        "confidence_score": "float 0-1",
        "research_agent_version": "string",
        "cache_key": "sector:county:nationality hash"
    },

    "investor_profile": {
        "archetype": "foreign_manufacturer|diaspora|local_sme|multinational",
        "language_barriers": ["list of languages"],
        "digital_literacy": "int 1-10",
        "patience_level": "int 1-10",
        "capital_buffer_months": "int",
        "prior_africa_experience": "bool",
        "risk_tolerance": "low|medium|high",
        "social_network_quality": "int 1-10"
    },

    "regulatory_map": {
        "required_agencies": ["list of agency codes"],
        "optional_agencies": ["list of agency codes"],
        "parallel_tracks": [["agencies that can run simultaneously"]],
        "sequential_dependencies": {
            "agency_code": ["must complete before this"]
        },
        "estimated_total_days": "int",
        "critical_path": ["ordered list of bottleneck agencies"]
    },

    "fee_schedule": {
        "agency_code": {
            "service_name": "string",
            "official_fee_kes": "float",
            "official_fee_usd": "float",
            "paybill": "string",
            "account_ref_format": "string",
            "source_url": "string",
            "last_verified": "ISO date",
            "fee_type": "one_time|annual|per_shipment"
        }
    },

    "sla_benchmarks": {
        "agency_code": {
            "official_days": "int",
            "realistic_median_days": "int",
            "realistic_p90_days": "int",
            "known_delay_causes": ["list"],
            "best_case_days": "int",
            "source": "string"
        }
    },

    "system_conditions": {
        "agency_code": {
            "portal_uptime_30d": "float 0-1",
            "last_downtime": "ISO date",
            "staff_level": "normal|reduced|backlog",
            "queue_status": "normal|elevated|critical"
        }
    },

    "agency_risk_scores": {
        "agency_code": {
            "corruption_risk": "float 0-1",
            "delay_risk": "float 0-1",
            "doc_request_risk": "float 0-1",
            "fee_mismatch_risk": "float 0-1",
            "source": "EACC|TI|platform_data"
        }
    },

    "bottleneck_forecast": {
        "primary_bottleneck": "agency_code",
        "primary_cause": "string",
        "secondary_bottleneck": "agency_code",
        "abandonment_risk_pct": "int 0-100",
        "abandonment_trigger_stage": "string",
        "abandonment_trigger_day": "int"
    },

    "sector_workflow": {
        "phases": [
            {
                "phase_name": "string",
                "agencies": ["list"],
                "duration_days": "int",
                "parallel": "bool",
                "documents_needed": ["list"]
            }
        ]
    },

    "county_profile": {
        "county_name": "string",
        "portal_digitalisation": "int 1-5",
        "known_incentives": ["list"],
        "investment_officer_contact": "string",
        "sbp_fee_kes": "float",
        "processing_notes": "string"
    },

    "simulation_config": {
        "recommended_agent_count": "int",
        "recommended_rounds": "int",
        "environments": ["list"],
        "inject_events": [
            {
                "day": "int",
                "event": "string",
                "probability": "float"
            }
        ],
        "llm_model": "string",
        "estimated_cost_usd": "float"
    }
}
```

---

## 5. MiroFish Fork — What Changes

### 5.1 File changes overview

```
MiroFish-KenyaInvest/
├── backend/
│   ├── agents/
│   │   ├── kenyan_investment_agents.py  ← NEW: 5 typed agent definitions
│   │   ├── agent_factory.py              ← MODIFIED: use typed agents
│   │   └── agent_memory.py              ← MODIFIED: Kenya-specific memory
│   ├── environments/
│   │   ├── ecitizen_env.py              ← NEW (replaces twitter_env.py)
│   │   ├── immigration_env.py           ← NEW (replaces reddit_env.py)
│   │   ├── county_env.py                ← NEW
│   │   └── bank_env.py                  ← NEW
│   ├── research_agent/
│   │   ├── perplexity_researcher.py     ← NEW
│   │   ├── seed_generator.py            ← NEW
│   │   └── cache.py                     ← NEW
│   ├── seeds/
│   │   ├── kenya/                       ← NEW
│   │   ├── rwanda/                      ← NEW
│   │   ├── tanzania/                    ← NEW
│   │   └── uganda/                      ← NEW
│   ├── reports/
│   │   ├── investor_journey_report.py   ← NEW (replaces default report)
│   │   ├── bottleneck_analysis.py       ← NEW
│   │   └── corruption_detector.py       ← NEW
│   └── app.py                           ← MODIFIED: new endpoints
├── frontend/
│   └── src/views/
│       ├── InvestorOnboarding.vue       ← NEW
│       ├── SimulationDashboard.vue      ← NEW
│       └── BottleneckMap.vue            ← NEW
└── .env
```

### 5.2 What stays exactly the same
- OASIS simulation engine (core loop, agent interaction model)
- GraphRAG knowledge graph construction pipeline
- Zep Cloud integration for agent memory
- Vue.js frontend framework
- FastAPI backend structure
- Docker Compose deployment
- AGPL-3.0 license compliance
- ReportAgent base class (we extend it, not replace it)

---

## 6. Typed Agent Definitions

```python
# backend/agents/kenyan_investment_agents.py

from dataclasses import dataclass, field
from typing import List, Optional
import random

@dataclass
class InvestorAgent:
    """Simulates a foreign or domestic investor navigating Kenya's process."""
    
    nationality: str
    sector: str
    capital_usd: float
    
    # Personality dimensions (seeded from Research Agent profile)
    patience_level: int = 7          # 1-10: decreases with each delay
    digital_literacy: int = 6        # 1-10: affects portal success rate
    capital_buffer_months: int = 8   # How long they can sustain delays
    language_proficiency: str = "english"
    prior_africa_experience: bool = False
    risk_tolerance: str = "medium"
    
    # Dynamic state (changes during simulation)
    emotional_state: str = "optimistic"
    confidence_in_process: int = 8
    days_elapsed: int = 0
    total_spent_kes: float = 0
    abandonment_risk: float = 0.05   # Increases with frustration events
    
    # Memory (via Zep Cloud)
    applications_submitted: List[str] = field(default_factory=list)
    delays_experienced: List[dict] = field(default_factory=list)
    problems_encountered: List[str] = field(default_factory=list)
    
    AVAILABLE_ACTIONS = [
        "submit_application",
        "follow_up_with_agency",
        "hire_consultant",
        "request_facilitator_help",
        "report_problem",
        "abandon_process",          # Critical outcome to track
        "escalate_to_keninvest",
        "share_experience_with_peers"
    ]
    
    def update_frustration(self, delay_days: int, cause: str):
        """Called when a delay event occurs."""
        self.delays_experienced.append({"days": delay_days, "cause": cause})
        self.confidence_in_process = max(1, self.confidence_in_process - 1)
        self.abandonment_risk = min(0.95, self.abandonment_risk + (delay_days * 0.005))
        
        if delay_days > 30:
            self.emotional_state = "frustrated"
        if self.abandonment_risk > 0.7:
            self.emotional_state = "considering_exit"


@dataclass
class GovernmentOfficerAgent:
    """Simulates a civil servant processing investor applications."""
    
    agency: str
    
    # Personality dimensions (seeded from corruption risk scores)
    workload_level: int = 6          # Cases per week — higher = slower
    process_adherence: float = 0.8   # 0-1: follows official process
    responsiveness: float = 0.7      # 0-1: how quickly they respond
    digital_capability: float = 0.6  # 0-1: can use their own systems
    
    # Corruption proxy (for audit training only — never simulates actual bribery)
    extra_doc_request_rate: float = 0.15  # From research agent risk scores
    fee_mismatch_rate: float = 0.10
    
    AVAILABLE_ACTIONS = [
        "process_application",
        "request_additional_document",
        "approve_application",
        "reject_application",
        "delay_without_explanation",   # Flagged by audit engine
        "refer_to_supervisor",
        "contact_applicant"
    ]


@dataclass
class FacilitatorAgent:
    """Human expert who expedites government applications."""
    
    level: str = "standard"  # junior | standard | senior | specialist
    
    sector_expertise: List[str] = field(default_factory=list)
    government_relationships: int = 7  # 1-10
    workload: int = 6                   # Active clients
    integrity_score: float = 0.95      # Must be near 1.0
    language_capability: List[str] = field(default_factory=lambda: ["English", "Swahili"])
    
    AVAILABLE_ACTIONS = [
        "review_documents",
        "visit_government_office",
        "follow_up_call",
        "escalate_delay",
        "update_investor",
        "coordinate_parallel_applications",
        "report_irregular_request"    # If officer requests unofficial payment
    ]
    
    SLA_OBLIGATIONS = {
        "urgent_response_hours": 2,
        "standard_response_hours": 24,
        "government_visit_within_hours": 48,
        "escalation_trigger_days": 3,
        "written_escalation_days": 7
    }


@dataclass 
class BankOfficerAgent:
    """Bank relationship manager for corporate account opening."""
    
    bank: str
    aml_threshold: float = 0.3  # Triggers AML review above this risk score
    
    AVAILABLE_ACTIONS = [
        "review_kyc",
        "request_documents",
        "approve_account",
        "refer_to_aml",
        "schedule_branch_visit"
    ]


@dataclass
class MarketPeerAgent:
    """Veteran investor who has completed the process — influences new investors."""
    
    experience: str = "positive"  # positive | negative | mixed
    sector: str = "manufacturing"
    time_to_complete_days: int = 90
    
    AVAILABLE_ACTIONS = [
        "share_positive_experience",
        "share_negative_experience",
        "recommend_facilitator",
        "warn_about_agency",
        "connect_investor_to_contacts"
    ]
    
    def influence_on_newcomer(self, investor: InvestorAgent) -> float:
        """Returns delta to investor.abandonment_risk."""
        if self.experience == "positive":
            return -0.05  # Reduces abandonment risk
        elif self.experience == "negative":
            return +0.08  # Increases abandonment risk
        return 0.0
```

---

## 7. Simulation Environments

```python
# backend/environments/ecitizen_env.py

ECITIZEN_ENVIRONMENT = {
    "name": "ecitizen_portal",
    "description": "eCitizen government services platform — Kenya's digital services hub",
    "agents_active": ["investor", "officer"],
    
    "services_available": [
        "company_registration_BRS",
        "kra_pin_registration", 
        "vat_registration",
        "county_business_permit",
        "nema_eia_application",
        "kebs_registration",
        "immigration_visa_application",
        "doshs_workplace_registration"
    ],
    
    "failure_modes": [
        {"mode": "portal_downtime", "probability": 0.08, "duration_days": 2},
        {"mode": "payment_gateway_failure", "probability": 0.12, "duration_hours": 4},
        {"mode": "session_timeout", "probability": 0.15, "impact": "form_data_lost"},
        {"mode": "document_upload_fail", "probability": 0.10, "impact": "resubmission_required"}
    ],
    
    "digital_literacy_modifier": True,  # Low literacy investors need facilitator help
    
    "agent_interactions": {
        "investor → submit_application": "officer receives in queue",
        "officer → approve": "investor notified + cert downloadable",
        "officer → request_additional_doc": "application paused, investor notified",
        "officer → delay_without_explanation": "AUDIT_FLAG raised"
    }
}

# backend/environments/immigration_env.py

IMMIGRATION_ENVIRONMENT = {
    "name": "immigration_office",
    "description": "Physical Immigration Department + FMIS portal",
    "agents_active": ["investor", "officer", "facilitator"],
    
    "permit_types": ["Class_G", "Class_D", "Dependent_Pass", "Visa", "Alien_Card"],
    
    "officer_workload_baseline": 45,  # Cases per officer per week (high)
    "appointment_lead_time_days": 14,
    
    "failure_modes": [
        {"mode": "appointment_no_show", "probability": 0.05},
        {"mode": "document_rejection", "probability": 0.25, "cause": "missing_or_wrong_format"},
        {"mode": "queue_overflow", "probability": 0.15, "delay_days": 21},
        {"mode": "fmis_portal_down", "probability": 0.06, "delay_days": 3}
    ],
    
    "extra_doc_request_rate": 0.34,  # From EACC data — flagged for audit
    
    "facilitator_impact": {
        "processing_time_reduction_pct": 40,
        "rejection_rate_reduction_pct": 60,
        "appointment_success_rate": 0.92
    }
}

# backend/environments/county_env.py

COUNTY_ENVIRONMENTS = {
    county: {
        "name": county,
        "digitalisation_score": score,
        "sbp_fee_kes": fee,
        "fire_cert_fee_kes": 5000,
        "processing_days_median": days,
        "failure_modes": [
            {"mode": "manual_process_required", "probability": 1 - score/5},
            {"mode": "inspection_backlog", "probability": 0.2, "delay_days": 14}
        ]
    }
    for county, score, fee, days in [
        ("Nairobi", 4, 50000, 14),
        ("Mombasa", 3, 40000, 21),
        ("Kisumu", 3, 30000, 21),
        ("Nakuru", 3, 25000, 21),
        ("Kiambu", 4, 35000, 14),
        ("Machakos", 2, 20000, 28),
        # ... all 47 counties
    ]
}
```

---

## 8. All 49 Agencies + Simulation Roles

### Group A: Core Investment & Registration

| # | Agency | Sim officer workload | Corruption risk | Primary bottleneck |
|---|--------|---------------------|-----------------|-------------------|
| 1 | KenInvest | Low | 0.08 | No — enables fast-track |
| 2 | BRS | Medium | 0.12 | Minor — portal issues |
| 3 | eCitizen | N/A | 0.05 | Downtime events |
| 4 | OAG | High | 0.15 | Yes — land acquisition |

### Group B: Taxation

| # | Agency | Sim officer workload | Corruption risk | Primary bottleneck |
|---|--------|---------------------|-----------------|-------------------|
| 5 | KRA | Low | 0.08 | No — high digital capability |
| 6 | CBK | High | 0.10 | Yes — fintech licensing |
| 7 | CMA | Medium | 0.10 | Moderate |
| 8 | IRA | Medium | 0.12 | Moderate |
| 9 | RBA | Low | 0.08 | No |

### Group C: Immigration & Labour

| # | Agency | Sim officer workload | Corruption risk | Primary bottleneck |
|---|--------|---------------------|-----------------|-------------------|
| 10 | Immigration | Very High (45 cases/wk) | 0.38 | **YES — #1 bottleneck** |
| 11 | Min. Labour | Low | 0.08 | No |
| 12 | NSSF | Low | 0.06 | No |
| 13 | SHIF | Low | 0.06 | No |

### Group D: Safety & Standards

| # | Agency | Sim officer workload | Corruption risk | Primary bottleneck |
|---|--------|---------------------|-----------------|-------------------|
| 14 | DOSHS | Low | 0.10 | No |
| 15 | KEBS | Medium | 0.22 | Yes — factory inspection queue |
| 16 | NEMA | High | 0.42 | **YES — #2 bottleneck** |
| 17 | WRA | Medium | 0.15 | Moderate |
| 18 | EPRA | Medium | 0.12 | Moderate |

### Group E: IP

| # | Agency | Corruption risk | Notes |
|---|--------|-----------------|-------|
| 19 | KIPI | 0.08 | 18-month trademark — background process |
| 20 | KECOBO | 0.06 | 30 days |
| 21 | ACA | 0.08 | Product notification |

### Group F: Sector Regulators (28 bodies)

*(Full table in interactive dashboard — all 49 agencies with click-through simulation roles)*

---

## 9. Custom ReportAgent

```python
# backend/reports/investor_journey_report.py

KENYA_INVEST_REPORT_PROMPT = """
You are an expert investment facilitation analyst for Kenya and East Africa.
You have access to the complete simulation environment post-run.

Analyse the simulation and produce a structured report covering:

1. JOURNEY SUMMARY
   - Total simulated days (median, p90)
   - Cost: actual vs budgeted (KES and USD)
   - Applications: submitted / approved / rejected / pending
   - Facilitator interventions: count and type

2. BOTTLENECK MAP
   - Top 3 agencies causing delays with data
   - Root cause per bottleneck (understaffing / portal issues / corruption patterns)
   - Average wait vs official SLA per agency
   - Recommendation per bottleneck

3. INVESTOR EXPERIENCE SCORE (0-100)
   - Score by phase (registration / licensing / operations)
   - Abandonment probability and at which day/stage
   - Language barrier impact (if foreign investor)
   - Digital literacy impact

4. CORRUPTION RISK INDICATORS
   - Agencies where officers requested docs beyond official requirements
   - Agencies where fee amounts differed from official schedule
   - Unexplained delay patterns by officer ID
   NOTE: These are systemic patterns for audit purposes. Not individual attributions.

5. PLATFORM CALIBRATION DATA
   - Updated SLA benchmarks (median + p90) per agency
   - Updated fee estimates (actual vs official)
   - Facilitator matching improvements
   - Form fields most often requiring correction

6. COUNTRY COMPETITIVENESS
   - How Kenya compares to Rwanda / Tanzania / Uganda for this sector
   - Top 3 regulatory changes that would most improve investor experience
   - Ease of Doing Business impact if bottlenecks are resolved

Return structured JSON with all sections.
Be specific. Use simulation data. Cite agent interaction counts.
"""
```

---

## 10. Platform Feedback Loop

```python
# backend/platform_integration/feedback_webhook.py

class KenyaInvestFeedbackEngine:
    """
    Automatically updates Kenya Invest platform from simulation results.
    Called after each ReportAgent synthesis.
    """
    
    def process_simulation_report(self, report: dict, country: str = "Kenya"):
        """Main feedback processor."""
        
        updates = {
            "roadmap_updates": self._extract_sla_updates(report),
            "fee_updates": self._extract_fee_updates(report),
            "facilitator_updates": self._extract_facilitator_insights(report),
            "audit_patterns": self._extract_corruption_patterns(report),
            "platform_improvements": report.get("platform_calibration_data", {})
        }
        
        # POST to Kenya Invest platform via webhook
        requests.post(
            os.getenv("KENYA_INVEST_WEBHOOK"),
            json=updates,
            headers={"X-Simulation-Source": "mirofish-kenya-invest"}
        )
        
        return updates
    
    def _extract_sla_updates(self, report: dict) -> dict:
        """Updates investor roadmap timeline estimates."""
        bottlenecks = report.get("bottleneck_map", [])
        return {
            b["agency"]: {
                "updated_median_days": b.get("avg_delay_days"),
                "updated_p90_days": b.get("p90_delay_days"),
                "confidence": "high" if b.get("simulation_runs", 1) > 5 else "medium"
            }
            for b in bottlenecks
        }
    
    def _extract_corruption_patterns(self, report: dict) -> dict:
        """Feeds new risk patterns into the audit engine."""
        flags = report.get("corruption_risk_indicators", [])
        return {
            "new_patterns": flags,
            "updated_agency_risk_scores": {
                f["agency"]: f["frequency"] 
                for f in flags
            }
        }
```

---

## 11. API Specification

```
POST   /api/invest/research              → trigger Research Agent
POST   /api/invest/simulate              → start MiroFish simulation
GET    /api/invest/simulation/:id/status → poll simulation progress
GET    /api/invest/simulation/:id/report → get ReportAgent output
POST   /api/invest/compare-countries     → multi-country comparison
POST   /api/invest/policy-impact         → simulate regulatory change
GET    /api/invest/country/:code/profile → get country regulatory profile
POST   /api/invest/corruption-scan       → audit risk analysis for agency
```

### Full request/response schemas: see API tab in interactive dashboard

---

## 12. Node Roadmap — Full Hierarchy

```
L0  User input (4 fields: sector · nationality · capital · county)
│
L1  Research Agent Layer
│   ├── Perplexity sonar-deep-research (6 parallel queries)
│   ├── MiMo-V2-Omni: passport image → JSON
│   └── MiMo-V2-Pro: raw research → structured synthesis
│
L2  Seed Pack Generator
│   └── Complete JSON: investor_profile + regulatory_map + fee_schedule
│       + sla_benchmarks + risk_scores + simulation_config
│
L3  GraphRAG Knowledge Graph
│   ├── Entities: 49 agencies · officers · investors · facilitators
│   ├── Relationships: dependencies · sequences · fees · SLAs
│   └── Memory injection: Zep Cloud per-agent context
│
L4  Agent Population Spawn
│   ├── Investor agents (archetype from seed profile)
│   ├── Government officer agents × 1 per major agency
│   ├── Facilitator agents (tiered: junior/standard/senior)
│   ├── Bank officer agents × 10 banks
│   └── Market peer agents (veterans with prior experience)
│
L5  OASIS Simulation (40 rounds = ~90 simulated days)
│   ├── eCitizen env  ──────────────────────────────────────── parallel
│   ├── Immigration env  ────────────────────────────────────── parallel
│   ├── County env (1 per county needed)  ──────────────────── parallel
│   ├── Bank env  ───────────────────────────────────────────── parallel
│   └── Event injections: downtime · backlogs · policy changes
│
L6  Custom ReportAgent
│   ├── Bottleneck map (agency × delay × root cause)
│   ├── Abandonment probability curve (day × probability)
│   ├── Cost variance (budgeted vs actual KES)
│   ├── Corruption risk flags (pattern × agency × frequency)
│   └── Platform improvement recommendations
│
L7  Kenya Invest Platform V3 (feedback targets)
│   ├── Roadmap timeline recalibration
│   ├── Fee estimate updates
│   ├── Facilitator matching algorithm refinement
│   ├── Audit engine: new corruption patterns
│   └── Monthly Investment Climate Report (published)
│
L8  Global Expansion
    ├── Rwanda (6-day setup, RDB one-stop)
    ├── Tanzania (BRELA + TIC)
    ├── Uganda (UIA + URSB)
    └── +40 countries (same Research Agent, new country profiles)
```

---

## 13. Global Expansion Schema

```python
# Country profile template — Research Agent auto-populates this for any country

COUNTRY_PROFILE_SCHEMA = {
    "country": "string",
    "iso_code": "string",
    "currency": "string",
    "official_languages": ["list"],
    
    "investment_authority": {
        "name": "string",
        "website": "string",
        "one_stop_shop": "bool",
        "average_setup_days": "int"
    },
    
    "company_registration": {
        "body": "string",
        "process": "online|manual|hybrid",
        "fees_usd": "float",
        "processing_days": "int"
    },
    
    "immigration": {
        "work_permit_name": "string",
        "fee_usd": "float",
        "processing_weeks": "int",
        "minimum_investment_usd": "float"
    },
    
    "special_zones": [
        {
            "name": "string",
            "type": "EPZ|SEZ|Free_Zone",
            "incentives": ["list"],
            "sectors": ["list"]
        }
    ],
    
    "key_agencies": [{"name": "string", "role": "string"}],
    
    "corruption_risk": {
        "transparency_international_rank": "int",
        "official_payment_channels": "string"
    },
    
    "simulation_notes": "string"
}

# Tier 1 launch profiles
LAUNCH_COUNTRIES = {
    "KE": {"name": "Kenya", "avg_setup_days": 90, "complexity": "high"},
    "RW": {"name": "Rwanda", "avg_setup_days": 6, "complexity": "low"},
    "TZ": {"name": "Tanzania", "avg_setup_days": 45, "complexity": "medium"},
    "UG": {"name": "Uganda", "avg_setup_days": 35, "complexity": "medium"}
}
```

---

## 14. Deployment Guide

### 14.1 Fork setup

```bash
git clone https://github.com/YOUR_USERNAME/MiroFish-KenyaInvest.git
cd MiroFish-KenyaInvest
cp .env.example .env
```

### 14.2 Environment configuration

```env
# MiMo models — get key at platform.xiaomimimo.com
LLM_API_KEY=your_mimo_key
LLM_BASE_URL=https://api.xiaomimimo.com/v1
LLM_MODEL_NAME=mimo-v2-pro
LLM_OMNI_MODEL=mimo-v2-omni

# Perplexity Research Agent — get key at perplexity.ai/api-platform
PERPLEXITY_API_KEY=your_perplexity_key
PERPLEXITY_BASE_URL=https://api.perplexity.ai/v1
PERPLEXITY_RESEARCH_PRESET=advanced-deep-research

# Zep Cloud — free tier at app.getzep.com
ZEP_API_KEY=your_zep_key

# Fallback LLM
FALLBACK_LLM_KEY=your_openai_key
FALLBACK_LLM_MODEL=gpt-4o-mini
FALLBACK_LLM_URL=https://api.openai.com/v1

# Kenya Invest platform webhook
KENYA_INVEST_WEBHOOK=https://your-platform.com/api/simulation-complete
KENYA_INVEST_API_KEY=your_platform_key
```

### 14.3 Install and run

```bash
# Install all dependencies
npm run setup:all

# Start frontend + backend
npm run dev

# Frontend: http://localhost:3000
# Backend:  http://localhost:5001
```

### 14.4 Docker (production)

```bash
docker compose up -d
# Reads .env from root, maps ports 3000 and 5001
```

### 14.5 RunPod GPU (for local LLMs)

```bash
# On RunPod: select RTX 4090 (24GB), expose ports 3000 5001 11434
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull mistral:7b  # Or qwen2.5:14b for better reasoning

# Update .env:
# LLM_BASE_URL=http://localhost:11434/v1
# LLM_MODEL_NAME=mistral:7b
```

### 14.6 Railway (cloud hosting)

```bash
npm install -g @railway/cli
railway login
railway init
railway up
# Add env vars in Railway dashboard
```

### 14.7 Monthly simulation schedule

```bash
# crontab — every Monday 02:00 EAT
0 2 * * 1 python scripts/monthly_simulation.py \
  --sectors manufacturing,fintech,agriculture,tourism \
  --countries KE,RW,TZ,UG \
  --agents 200 \
  --rounds 40 \
  --webhook $KENYA_INVEST_WEBHOOK
```

---

## 15. Cost Model

### Per simulation run

| Component | Usage | Cost |
|-----------|-------|------|
| Perplexity sonar-deep-research (6 queries) | ~20K tokens | ~$0.40 |
| MiMo-V2-Pro synthesis | ~5K tokens | ~$0.015 |
| MiMo-V2-Omni (passport/docs) | ~2K tokens | ~$0.004 |
| Zep Cloud (agent memory) | free tier | $0 |
| **Per simulation total** | | **~$0.42** |

### Monthly (50 simulations × 4 countries)

| Component | Usage | Monthly cost |
|-----------|-------|-------------|
| MiMo-V2-Pro | 200 sims × 2M tokens | ~$100 |
| MiMo-V2-Omni | Document ingestion | ~$20 |
| Perplexity Deep Research | 1200 queries | ~$40 |
| Zep Cloud | Free tier | $0 |
| Railway hosting | Pro plan | $20 |
| **Total** | | **~$180/month** |

### vs alternatives

| Stack | Monthly cost | Quality |
|-------|-------------|---------|
| MiMo + Perplexity (this) | $180 | High |
| GPT-4o + Perplexity | $800 | High |
| Claude + Perplexity | $600 | High |
| Local Ollama on RunPod | ~$50 | Medium |

---

*MiroFish × Kenya Invest — Version 1.0*  
*March 2026*  
*Powered by: Xiaomi MiMo-V2-Pro (Hunter Alpha) + MiMo-V2-Omni (Healer Alpha) + Perplexity Agent API*  
*Built on: OASIS (CAMEL-AI) · GraphRAG · Zep Cloud · Docker · Railway/RunPod*
