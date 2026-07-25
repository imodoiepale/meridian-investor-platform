# 🇰🇪 KENYA INVEST DIGITAL AUTOPILOT — VERSION 3.0
### Complete Technical Specification: AI-Powered Investor Onboarding with Anti-Corruption Audit Engine & Xiaomi MiMo LLM Integration

---

## What's New in V3.0
- ✅ **Xiaomi MiMo-V2-Pro (Hunter Alpha) + MiMo-V2-Omni (Healer Alpha)** integration
- ✅ **Anti-Corruption Audit Engine** — track, flag, and prevent irregular payments
- ✅ **Auditor General-ready compliance reporting**
- ✅ **Process Integrity Monitoring** — every step logged and auditable
- ✅ **Bank account opening** (10 banks)
- ✅ **Facilitator allocation system** with SLA tracking
- ✅ **Document expiry tracker** with smart notifications
- ✅ **50+ industry-specific workflows** (all corrections applied)

---

## Table of Contents
1. [Xiaomi MiMo LLM Integration](#1-xiaomi-mimo-llm-integration)
2. [Anti-Corruption Audit Engine](#2-anti-corruption-audit-engine)
3. [Complete System Architecture V3](#3-complete-system-architecture-v3)
4. [All 49+ Government Parastatals](#4-all-49-government-parastatals)
5. [Industry-Specific Workflows (50+)](#5-industry-specific-workflows)
6. [Bank Account Integration](#6-bank-account-integration)
7. [Facilitator Allocation System](#7-facilitator-allocation-system)
8. [Document Expiry Tracker](#8-document-expiry-tracker)
9. [Form Auto-Fill Engine](#9-form-auto-fill-engine)
10. [Database Schema (Full)](#10-database-schema)
11. [Security & ODPC Compliance](#11-security--odpc-compliance)
12. [API Integration Specs](#12-api-integration-specs)

---

## 1. Xiaomi MiMo LLM Integration

### 1.1 What Are These Models?

On March 11, 2026, two anonymous models — **Hunter Alpha** and **Healer Alpha** — appeared on OpenRouter and topped the platform's daily API call charts for multiple consecutive days. Xiaomi later confirmed:

| Codename | Real Model | Type | Use Case |
|----------|-----------|------|----------|
| **Hunter Alpha** | MiMo-V2-Pro | 1T parameter reasoning/agent model | Complex multi-step workflows, document processing, form filling, legal generation |
| **Healer Alpha** | MiMo-V2-Omni | Multimodal omni model (text + image + video + audio) | Passport OCR, document reading, image analysis, voice intake |

**Why use these for Kenya Invest?**

- MiMo-V2-Pro ranks **8th globally** and **2nd among Chinese LLMs** on intelligence benchmarks
- Priced at **$1/$3 per million tokens** (input/output) — ~5x cheaper than equivalent Western models
- Optimised for **agent workflows** — exactly what Kenya Invest needs (multi-step, tool-calling, form-filling)
- MiMo-V2-Omni handles **passport/ID image reading** natively — no separate OCR service needed
- 1M token context window — can process entire legal/regulatory document packs in a single pass

### 1.2 API Configuration

```bash
# MiMo API keys — get at platform.xiaomimimo.com
MIMO_API_KEY=your_mimo_api_key_here
MIMO_BASE_URL=https://api.xiaomimimo.com/v1
```

**.env configuration for Kenya Invest:**
```env
# Primary AI Engine: MiMo-V2-Pro (Hunter Alpha) — for reasoning, form-fill, document generation
LLM_PRIMARY_MODEL=mimo-v2-pro
LLM_PRIMARY_URL=https://api.xiaomimimo.com/v1
LLM_PRIMARY_KEY=your_mimo_key

# Multimodal Engine: MiMo-V2-Omni (Healer Alpha) — for passport reading, image/audio intake
LLM_OMNI_MODEL=mimo-v2-omni
LLM_OMNI_URL=https://api.xiaomimimo.com/v1
LLM_OMNI_KEY=your_mimo_key

# Fallback: OpenAI-compatible (if MiMo API unavailable)
LLM_FALLBACK_MODEL=gpt-4o-mini
LLM_FALLBACK_URL=https://api.openai.com/v1
LLM_FALLBACK_KEY=your_openai_key

# Also accessible via OpenRouter
# MIMO_VIA_OPENROUTER=xiaomi/mimo-v2-pro
```

### 1.3 Model Routing Logic

```python
class ModelRouter:
    """Routes tasks to the optimal MiMo model"""

    def route(self, task_type: str, payload: dict):
        routing_map = {
            # MiMo-V2-Omni (Healer Alpha) tasks — multimodal
            "passport_ocr":         "mimo-v2-omni",
            "id_card_reading":      "mimo-v2-omni",
            "document_image_parse": "mimo-v2-omni",
            "voice_intake":         "mimo-v2-omni",
            "video_verification":   "mimo-v2-omni",

            # MiMo-V2-Pro (Hunter Alpha) tasks — agentic reasoning
            "compliance_roadmap":     "mimo-v2-pro",
            "form_autofill":          "mimo-v2-pro",
            "legal_document_gen":     "mimo-v2-pro",
            "conversational_intake":  "mimo-v2-pro",
            "risk_assessment":        "mimo-v2-pro",
            "audit_analysis":         "mimo-v2-pro",
            "facilitator_matching":   "mimo-v2-pro",
            "renewal_automation":     "mimo-v2-pro",
        }
        model = routing_map.get(task_type, "mimo-v2-pro")  # Default to Pro
        return self._call_model(model, payload)

    def _call_model(self, model: str, payload: dict):
        import requests
        response = requests.post(
            f"{os.getenv('LLM_PRIMARY_URL')}/chat/completions",
            headers={"Authorization": f"Bearer {os.getenv('LLM_PRIMARY_KEY')}"},
            json={
                "model": model,
                "messages": payload["messages"],
                "max_tokens": payload.get("max_tokens", 4096),
                "temperature": payload.get("temperature", 0.3),  # Low for accuracy
                "tools": payload.get("tools", []),  # Agent tool-calling
            }
        )
        return response.json()
```

### 1.4 Passport Reading with MiMo-V2-Omni (Healer Alpha)

```python
import base64
import requests

def read_passport_with_healer(image_path: str) -> dict:
    """
    Uses MiMo-V2-Omni (Healer Alpha) for multimodal passport extraction
    Native vision capability — no separate OCR service needed
    """
    with open(image_path, "rb") as f:
        image_b64 = base64.b64encode(f.read()).decode()

    response = requests.post(
        "https://api.xiaomimimo.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {MIMO_API_KEY}"},
        json={
            "model": "mimo-v2-omni",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}
                        },
                        {
                            "type": "text",
                            "text": """Extract all information from this identity document.
                            Return ONLY valid JSON with these exact fields:
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
                              "mrz_line1": "",
                              "mrz_line2": "",
                              "confidence_score": 0.0
                            }"""
                        }
                    ]
                }
            ],
            "max_tokens": 500
        }
    )
    
    raw = response.json()["choices"][0]["message"]["content"]
    return json.loads(raw.strip().strip("```json").strip("```"))
```

### 1.5 Agentic Form-Fill with MiMo-V2-Pro (Hunter Alpha)

```python
def autofill_cr1_with_hunter(investor_profile: dict) -> dict:
    """
    Uses MiMo-V2-Pro (Hunter Alpha) to intelligently fill CR1 company registration form.
    The model reasons about field requirements, validates data, and flags issues.
    """
    
    tools = [
        {
            "type": "function",
            "function": {
                "name": "check_company_name_availability",
                "description": "Check if a company name is available in BRS registry",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "proposed_name": {"type": "string"},
                        "company_type": {"type": "string"}
                    }
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "validate_kra_pin",
                "description": "Validate a KRA PIN number against iTax",
                "parameters": {
                    "type": "object",
                    "properties": {"pin": {"type": "string"}}
                }
            }
        }
    ]
    
    system_prompt = """You are an expert Kenyan business registration specialist.
    Fill in the CR1 company registration form accurately based on the investor profile.
    Use the tools available to validate data in real-time.
    Flag any fields that need investor input or have validation errors.
    Apply Kenyan company law requirements (Companies Act 2015) automatically."""
    
    response = requests.post(
        "https://api.xiaomimimo.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {MIMO_API_KEY}"},
        json={
            "model": "mimo-v2-pro",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Fill CR1 form for: {json.dumps(investor_profile)}"}
            ],
            "tools": tools,
            "tool_choice": "auto",
            "max_tokens": 4096
        }
    )
    return response.json()
```

### 1.6 MiMo Pricing vs Alternatives

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Context |
|-------|----------------------|------------------------|---------|
| **MiMo-V2-Pro (Hunter Alpha)** | **$1.00** | **$3.00** | 1M |
| **MiMo-V2-Omni (Healer Alpha)** | **$0.40** | **$2.00** | 262K |
| GPT-4o | $5.00 | $15.00 | 128K |
| Claude Sonnet 4.6 | $3.00 | $15.00 | 200K |
| Qwen-Plus | $0.80 | $2.40 | 128K |

**For Kenya Invest at 500 investors/month, estimated MiMo cost: ~$120/month vs ~$600 with GPT-4o**

---

## 2. Anti-Corruption Audit Engine

This is the cornerstone governance feature. Every action in the system is logged, every payment verified, every delay flagged — producing an audit trail that the **Auditor General of Kenya** or any internal compliance officer can review.

### 2.1 Why This Matters

The Kenya Invest platform touches real government processes. Without an audit engine:
- An unscrupulous facilitator could pocket money claiming it was paid to an official
- A government officer could cause artificial delays to pressure investors
- Payments could be misrouted or undocumented
- The platform itself could be used to obscure irregular activity

The audit engine **prevents, detects, and reports** all of this.

### 2.2 What Gets Audited

Every event in the system generates an immutable audit record:

```python
# Categories of audited events
AUDIT_CATEGORIES = {
    # Financial events
    "PAYMENT_INITIATED":       "Any payment started",
    "PAYMENT_COMPLETED":       "Payment confirmed (M-Pesa receipt captured)",
    "PAYMENT_FAILED":          "Failed payment attempt",
    "PAYMENT_ROUTED_EXTERNAL": "⚠️ Flag: payment directed outside official channels",
    "CASH_PAYMENT_RECORDED":   "⚠️ Flag: cash payment outside M-Pesa/bank",
    "FEE_MISMATCH":            "🚨 Alert: fee charged differs from official schedule",
    
    # Process events
    "APPLICATION_SUBMITTED":   "Form submitted to government portal",
    "APPLICATION_STATUS_CHANGE": "Status update received",
    "UNEXPLAINED_DELAY":       "⚠️ Flag: application delayed beyond SLA without reason",
    "APPLICATION_REJECTED":    "Rejection with reason code",
    "DOCUMENT_REQUESTED":      "Government officer requests additional document",
    "EXTRA_DOCUMENT_REQUESTED": "⚠️ Flag: document not in official requirements list",
    
    # Facilitator events
    "FACILITATOR_ACTION":      "Any action taken by facilitator",
    "FACILITATOR_CONTACT":     "Call/visit to government office logged",
    "FACILITATOR_CASH_CLAIM":  "🚨 Alert: facilitator claims cash payment to official",
    "FACILITATOR_CONFLICT":    "🚨 Alert: facilitator has relationship with officer",
    
    # Document events
    "DOCUMENT_UPLOADED":       "Document uploaded by investor",
    "DOCUMENT_ACCESSED":       "Document accessed by facilitator/admin",
    "DOCUMENT_SENT_EXTERNAL":  "⚠️ Flag: document sent to non-government address",
    
    # Communication events
    "UNOFFICIAL_REQUEST":      "🚨 Alert: request to communicate outside official channels",
    "VERBAL_OFFER_REPORTED":   "🚨 Alert: investor reports verbal payment request from official",
}
```

### 2.3 Audit Database Schema

```sql
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_time      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    investor_id     UUID REFERENCES investors(id),
    company_id      UUID REFERENCES companies(id),
    application_id  UUID REFERENCES applications(id),
    facilitator_id  UUID REFERENCES facilitators(id),
    
    -- Event classification
    event_category  VARCHAR(50) NOT NULL,   -- From AUDIT_CATEGORIES above
    event_type      VARCHAR(100) NOT NULL,
    severity        VARCHAR(20) DEFAULT 'INFO', -- INFO | WARNING | ALERT | CRITICAL
    
    -- Actor tracking
    actor_type      VARCHAR(50),  -- 'investor' | 'facilitator' | 'system' | 'government_officer'
    actor_id        VARCHAR(100),
    actor_ip        INET,
    actor_user_agent TEXT,
    
    -- Event details
    agency          VARCHAR(100), -- Which government body
    description     TEXT NOT NULL,
    details         JSONB,        -- Full structured details
    
    -- Financial tracking
    amount_expected DECIMAL(12,2),
    amount_paid     DECIMAL(12,2),
    payment_channel VARCHAR(50),   -- 'mpesa' | 'bank' | 'cash' | 'ecitizen'
    payment_receipt VARCHAR(100),
    official_paybill VARCHAR(20),  -- Official government paybill
    
    -- Integrity flags
    is_flagged      BOOLEAN DEFAULT FALSE,
    flag_reason     TEXT,
    reviewed_by     UUID REFERENCES users(id),
    review_time     TIMESTAMP,
    review_outcome  VARCHAR(50),  -- 'cleared' | 'escalated' | 'referred_to_eacc'
    
    -- Immutability
    hash            VARCHAR(64),  -- SHA-256 of record content (tamper detection)
    previous_hash   VARCHAR(64),  -- Blockchain-style chaining
    
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Immutable — no UPDATE or DELETE permitted on this table
-- Enforced via PostgreSQL row security policy + trigger
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        RAISE EXCEPTION 'Audit records are immutable. Contact Auditor General.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_immutability
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
```

### 2.4 Corruption Detection Rules Engine

```python
class CorruptionDetectionEngine:
    """
    Uses MiMo-V2-Pro to reason about patterns and flag suspicious activity.
    All flags go to the integrity dashboard — NOT to facilitators.
    """
    
    def __init__(self):
        self.rules = self.load_rules()
        self.mimo = ModelRouter()
    
    # Rule 1: Payment amount mismatch
    def check_payment_integrity(self, payment: dict) -> list[dict]:
        flags = []
        official_fee = OFFICIAL_FEE_SCHEDULE.get(payment['service_type'])
        
        if official_fee and abs(payment['amount'] - official_fee) > 100:  # KES 100 tolerance
            flags.append({
                "rule": "FEE_MISMATCH",
                "severity": "ALERT",
                "description": f"Payment of KES {payment['amount']} differs from official fee "
                               f"of KES {official_fee} for {payment['service_type']}",
                "action_required": "Verify with issuing authority before proceeding"
            })
        
        # Check: payment routed to non-government number
        if payment['paybill'] not in OFFICIAL_GOVERNMENT_PAYBILLS:
            flags.append({
                "rule": "UNOFFICIAL_PAYMENT_CHANNEL",
                "severity": "CRITICAL",
                "description": f"Payment directed to unrecognised paybill {payment['paybill']}. "
                               f"Official paybill for {payment['agency']} is "
                               f"{OFFICIAL_GOVERNMENT_PAYBILLS.get(payment['agency'], 'unknown')}",
                "action_required": "STOP. Do not proceed. Report to integrity team."
            })
        
        return flags
    
    # Rule 2: Application delay anomaly
    def check_processing_delay(self, application: dict) -> list[dict]:
        flags = []
        sla_days = PROCESSING_SLA[application['application_type']]
        days_elapsed = (datetime.now() - application['submitted_date']).days
        
        if days_elapsed > sla_days * 1.5:  # 50% over SLA
            flags.append({
                "rule": "UNEXPLAINED_DELAY",
                "severity": "WARNING",
                "description": f"{application['application_type']} has been pending "
                               f"{days_elapsed} days (SLA: {sla_days} days). "
                               f"No status update received.",
                "action_required": "Facilitator to escalate formally in writing to officer's supervisor"
            })
        
        return flags
    
    # Rule 3: AI pattern analysis across all cases
    def run_pattern_analysis(self, agency: str, period_days: int = 30) -> dict:
        """
        Uses MiMo-V2-Pro to reason about patterns across all cases at an agency.
        Identifies: specific officers causing delays, fee irregularities, document request patterns.
        """
        cases = db.query(f"""
            SELECT * FROM applications 
            WHERE agency = '{agency}'
            AND submitted_date > NOW() - INTERVAL '{period_days} days'
        """)
        
        prompt = f"""
        Analyse these {len(cases)} applications at {agency} over the past {period_days} days.
        
        Data: {json.dumps(cases, default=str)}
        
        Identify:
        1. Are specific officer IDs associated with disproportionate delays?
        2. Are certain application types being rejected at unusual rates?
        3. Are extra documents being requested beyond official requirements?
        4. Are there payment amount anomalies by officer or date?
        5. Is there a pattern of applications being approved faster for certain companies?
        
        Return structured JSON with findings, confidence scores, and recommended actions.
        Flag anything that warrants referral to EACC (Ethics & Anti-Corruption Commission).
        """
        
        return self.mimo.route("audit_analysis", {
            "messages": [
                {"role": "system", "content": "You are a forensic audit AI for Kenya's EACC. Be precise and evidence-based."},
                {"role": "user", "content": prompt}
            ]
        })
    
    # Rule 4: Investor corruption report intake
    def receive_corruption_report(self, investor_id: str, report: dict) -> dict:
        """
        Secure channel for investors to report solicitation or irregular requests.
        Anonymous by default. Routed to integrity officer, NOT facilitator.
        """
        report_record = {
            "report_id": str(uuid.uuid4()),
            "investor_id": investor_id if not report.get('anonymous') else None,
            "agency_involved": report['agency'],
            "officer_description": report.get('officer_description'),  # No name required
            "date_of_incident": report['date'],
            "what_was_requested": report['description'],
            "amount_mentioned": report.get('amount'),
            "evidence_files": report.get('evidence_urls', []),
            "reported_to_eacc": False,
            "reported_at": datetime.now().isoformat()
        }
        
        # Log to audit trail
        self.log_event("CORRUPTION_REPORT_RECEIVED", "CRITICAL", report_record)
        
        # Notify integrity officer (not facilitator, not investor's normal contact)
        self.notify_integrity_officer(report_record)
        
        # Optionally auto-file with EACC if investor consents
        if report.get('refer_to_eacc'):
            self.file_eacc_report(report_record)
        
        return {
            "report_reference": report_record['report_id'],
            "message": "Your report has been received confidentially and will be reviewed by our integrity team within 48 hours.",
            "eacc_hotline": "0800 720 701",
            "eacc_email": "eacc@eacc.go.ke",
            "dci_hotline": "0800 722 203"
        }
```

### 2.5 Official Government Fee Schedule (Reference Table)

This is the **canonical fee schedule** hardcoded into the system. Any payment request outside these amounts triggers an alert:

| Agency | Service | Official Fee (KES) | Official Paybill |
|--------|---------|-------------------|-----------------|
| BRS | Name reservation | 100 | 206206 (eCitizen) |
| BRS | Private limited company registration | 10,950 | 206206 |
| KRA | PIN application | Free | N/A |
| KRA | VAT registration | Free | N/A |
| Immigration | Class G work permit | 220,000/yr | 1016006 |
| Immigration | Dependent pass | 110,000/yr | 1016006 |
| NEMA | EIA license (small) | 10,000–50,000 | 206206 |
| KEBS | Diamond Mark registration | 15,000 | 222111 |
| DOSHS | Workplace registration | 2,000 | 222000 |
| NSSF | Employer registration | Free | N/A |
| SHIF | Employer registration | Free | N/A |
| Nairobi County | Business permit (SME) | 10,000–50,000 | 891300 |
| NCA | Contractor registration | 5,000–50,000 | 206206 |
| KIPI | Trademark application | 5,000 | 206206 |
| KECOBO | Copyright registration | 1,000 | 206206 |

> All fees sourced from official government websites and Finance Acts. Updated annually by system admin.

### 2.6 Auditor General Reporting Interface

```python
class AuditorGeneralReportGenerator:
    """
    Generates reports in the format required by:
    - Office of the Auditor General (OAG) Kenya
    - Ethics & Anti-Corruption Commission (EACC)
    - Kenya National Audit Office (KENAO)
    - National Assembly Public Accounts Committee (PAC)
    """
    
    def generate_quarterly_report(self, quarter: str, year: int) -> dict:
        return {
            "report_metadata": {
                "period": f"Q{quarter} {year}",
                "generated_at": datetime.now().isoformat(),
                "generated_by": "Kenya Invest Audit Engine v3.0",
                "hash": self.generate_report_hash()
            },
            "summary": {
                "total_applications": ...,
                "total_fees_collected": ...,
                "total_flagged_events": ...,
                "corruption_reports_received": ...,
                "eacc_referrals_made": ...,
                "average_processing_time_by_agency": {...}
            },
            "fee_integrity_report": {
                "mismatched_payments": [...],
                "unofficial_channel_payments": [...],
                "refunds_processed": [...]
            },
            "process_integrity_report": {
                "agencies_with_above_sla_delays": [...],
                "unexplained_rejections": [...],
                "extra_document_requests_outside_requirements": [...]
            },
            "facilitator_conduct_report": {
                "flagged_facilitator_actions": [...],
                "cash_payment_claims": [...],
                "conflict_of_interest_flags": [...]
            },
            "corruption_reports": {
                "total_received": ...,
                "by_agency": {...},
                "referred_to_eacc": [...],
                "under_investigation": [...]
            },
            "recommendations": self.generate_ai_recommendations()
        }
    
    def generate_ai_recommendations(self) -> list:
        """MiMo-V2-Pro analyses patterns and recommends systemic improvements"""
        prompt = """Based on the audit data for this period, identify:
        1. Which agencies need process reform
        2. Which fee schedules need updating
        3. Which SLAs are unrealistic and need formal review
        4. What policy changes would reduce corruption risk
        
        Format as numbered recommendations with evidence citations."""
        
        return self.mimo.route("audit_analysis", {"messages": [
            {"role": "system", "content": "You are the Auditor General of Kenya's AI analyst."},
            {"role": "user", "content": prompt}
        ]})
```

---

## 3. Complete System Architecture V3

```
┌───────────────────────────────────────────────────────────────────┐
│                    KENYA INVEST V3.0 ARCHITECTURE                 │
├───────────────────────────────────────────────────────────────────┤
│                       PRESENTATION LAYER                          │
│  Web (React) │ Mobile (Flutter) │ WhatsApp Bot │ USSD (*483#)    │
│  Telegram Bot │ Voice (Twilio+Whisper) │ API (for KenInvest)     │
└────────────────────────────┬──────────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                     AI ORCHESTRATION ENGINE                        │
├───────────────────────────────────────────────────────────────────┤
│  MiMo-V2-Omni (Healer Alpha)   │  MiMo-V2-Pro (Hunter Alpha)     │
│  ├─ Passport/ID OCR            │  ├─ Conversational intake        │
│  ├─ Document image parsing     │  ├─ Compliance roadmap gen       │
│  ├─ Voice intake (audio)       │  ├─ Form auto-fill (200+ forms)  │
│  └─ Video verification         │  ├─ Legal document generation    │
│                                │  ├─ Risk assessment              │
│                                │  ├─ Audit pattern analysis       │
│                                │  └─ Renewal automation           │
└────────────────────────────┬──────────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                     CORE SERVICES                                  │
│  ┌─────────────┐  ┌───────────────┐  ┌─────────────────────────┐ │
│  │  Compliance │  │  Anti-Corrupt │  │  Document Engine        │ │
│  │  Engine     │  │  Audit Engine │  │  (LaTeX + Docx + PDF)   │ │
│  └─────────────┘  └───────────────┘  └─────────────────────────┘ │
│  ┌─────────────┐  ┌───────────────┐  ┌─────────────────────────┐ │
│  │  Facilitator│  │  Bank Account │  │  Expiry Tracker         │ │
│  │  Allocation │  │  Integration  │  │  & Notification System  │ │
│  └─────────────┘  └───────────────┘  └─────────────────────────┘ │
└────────────────────────────┬──────────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                     INTEGRATION LAYER                              │
│  eCitizen │ iTax │ BRS │ Immigration FMIS │ 47 County Portals    │
│  NEMA │ KEBS │ NCA │ CBK │ CA │ ODPC │ KenTrade │ EPZA │ SEZA   │
│  10 Banks (Equity, KCB, Co-op, NCBA, Absa, Stanchart, etc.)     │
│  M-Pesa API │ PesaLink │ Flutterwave │ Africa's Talking          │
└────────────────────────────┬──────────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                     DATA LAYER                                     │
│  PostgreSQL (compliance, audit, users)                            │
│  MongoDB (documents, OCR results, form templates)                 │
│  Redis (sessions, caching, rate limiting)                         │
│  S3/MinIO (encrypted document vault)                              │
│  Immutable Audit Log (append-only, hash-chained)                  │
└───────────────────────────────────────────────────────────────────┘
```

---

## 4. All 49 Government Parastatals

### Group A: Core Investment & Registration
| # | Body | Mandate | AI Action |
|---|------|---------|-----------|
| 1 | KenInvest | Investment facilitation | Certificate, incentives |
| 2 | BRS | Company registration | CR1, MOA, AOA |
| 3 | eCitizen | Digital services portal | Multi-agency submissions |
| 4 | OAG | Attorney General consents | Foreign land ownership |

### Group B: Taxation & Revenue
| # | Body | Mandate | AI Action |
|---|------|---------|-----------|
| 5 | KRA | All taxes + customs | PIN, VAT, PAYE, excise, IDF |
| 6 | CBK | Banking + forex controls | Capital importation forms |
| 7 | CMA | Capital markets | Investment advisor license |
| 8 | IRA | Insurance | Insurance broker license |
| 9 | RBA | Retirement benefits | Pension scheme registration |

### Group C: Immigration & Labour
| # | Body | Mandate | AI Action |
|---|------|---------|-----------|
| 10 | Immigration | Work permits, visas | Form 17, dependent pass |
| 11 | Ministry of Labour | Labour law | Employment contracts |
| 12 | NSSF | Pension contributions | Employer + employee registration |
| 13 | SHIF (ex-NHIF) | Health insurance | Employer + employee registration |

### Group D: Safety, Environment, Standards
| # | Body | Mandate | AI Action |
|---|------|---------|-----------|
| 14 | DOSHS | Workplace safety | Premises registration, risk assessment |
| 15 | KEBS | Product standards | Diamond Mark, ISM, PVoC |
| 16 | NEMA | Environmental compliance | EIA license, audit, effluent |
| 17 | WRA | Water use | Water extraction permit |
| 18 | EPRA | Energy + petroleum | Energy license, petroleum dealer |

### Group E: Intellectual Property
| # | Body | Mandate | AI Action |
|---|------|---------|-----------|
| 19 | KIPI | Patents, trademarks | TM2, patent spec, industrial design |
| 20 | KECOBO | Copyright | Copyright registration |
| 21 | ACA | Anti-counterfeiting | Product notification |

### Group F: Sector Regulators (28 bodies)

**Construction & Real Estate (4)**
| # | Body | When Required |
|---|------|--------------|
| 22 | NCA | Construction > KES 1M |
| 23 | NLC | Land transactions |
| 24 | County Land Office | Title deeds |
| 25 | Physical Planning Dept | Building approvals |

**Tourism & Hospitality (2)**
| # | Body | When Required |
|---|------|--------------|
| 26 | TRA | Hotels, tour operators |
| 27 | KWS | Wildlife tourism |

**Agriculture (3)**
| # | Body | When Required |
|---|------|--------------|
| 28 | AFA | Coffee, tea, horticulture processing |
| 29 | KEPHIS | Plant imports/exports |
| 30 | Dept. Veterinary Services | Livestock, animal products |

**Health & Pharma (3)**
| # | Body | When Required |
|---|------|--------------|
| 31 | PPB | Pharmaceuticals, medical devices |
| 32 | KMPDC | Medical/dental practice |
| 33 | Nursing Council | Nursing |

**Education (2)**
| # | Body | When Required |
|---|------|--------------|
| 34 | TVETA | TVET institutions |
| 35 | CUE | Universities, colleges |

**Transport (2)**
| # | Body | When Required |
|---|------|--------------|
| 36 | NTSA | PSV license, vehicle inspection |
| 37 | KCAA | Aviation operations |

**ICT & Data (2)**
| # | Body | When Required |
|---|------|--------------|
| 38 | CA | Telecoms, broadcasting |
| 39 | ODPC | Personal data processing |

**Media (1)**
| # | Body | When Required |
|---|------|--------------|
| 40 | Media Council | Journalism, media |

**Mining (1)**
| # | Body | When Required |
|---|------|--------------|
| 41 | Ministry of Mining | Mining/prospecting |

**Trade & Export (4)**
| # | Body | When Required |
|---|------|--------------|
| 42 | KenTrade | Import/export single window |
| 43 | EPZA | Export-oriented manufacturing |
| 44 | SEZA | Special Economic Zone operations |
| 45 | KNCCI | Certificate of origin |

**Finance-Specific (3)**
| # | Body | When Required |
|---|------|--------------|
| 46 | SASRA | SACCO operations |
| 47 | FRC | AML/CFT compliance |
| 48 | NSE | Listed companies |

**Gaming (1)**
| # | Body | When Required |
|---|------|--------------|
| 49 | BCLB | Betting, gaming, lotteries |

**County Government (47 — all counties)**
| # | Body | When Required |
|---|------|--------------|
| 50 | All 47 County Governments | All businesses — Single Business Permit |

---

## 5. Industry-Specific Workflows

*50+ full workflows are defined in the system. Below are 6 key examples.*

### 5.1 Manufacturing — Food Processing

```
Phase 1 — Registration (Days 1-7):
  BRS → Company registration
  KRA → PIN, VAT, PAYE
  KenInvest → Investment certificate (if >USD 100k)

Phase 2 — Premises (Days 8-45):
  County Planning → Building plan approval
  County Health → Food handler certificates
  County Fire → Fire safety certificate
  NEMA → EIA (if factory >500 sqm)
  WRA → Water use permit
  DOSHS → Workplace registration

Phase 3 — Product Certification (Days 30-90):
  KEBS → Diamond Mark of Quality
  KEBS → Product testing (microbiology + chemistry)
  PPB → If supplements/fortified — product registration
  AFA → Agricultural input dealer license

Phase 4 — Operations (Days 1-14, parallel):
  NSSF → Employer registration
  SHIF → Employer registration
  KIPI → Trademark (optional but recommended)

Phase 5 — Trade (if exporting):
  KenTrade → Single window registration
  KEBS → PVoC certification
  KNCCI → Certificate of origin
  EPZA → EPZ license (if 80%+ exports)

Total Timeline: 90-120 days
Estimated Cost: KES 350,000 - 850,000
```

### 5.2 Fintech — Payment Service Provider

```
Phase 1 — Registration (Days 1-5):
  BRS → Company registration
  KRA → PIN, VAT registration

Phase 2 — Licensing (Days 6-120):
  CBK → Payment service provider license (PSP)
    Required docs: Business plan, systems architecture, 
    AML/CFT policy, KYC framework, minimum capital KES 5M
  CA → Data protection registration
  ODPC → Data Protection Officer appointment
  FRC → AML/CFT reporting institution registration

Phase 3 — Premises & Operations (Days 6-30, parallel):
  County → Single Business Permit
  County Fire → Fire certificate
  DOSHS → Workplace registration (if >5 staff)

Phase 4 — Compliance (Ongoing):
  FRC → Suspicious Transaction Reports (monthly)
  CBK → Prudential returns (quarterly)
  ODPC → Data protection audit (annual)

Total Timeline: 60-120 days (CBK license is bottleneck)
Estimated Cost: KES 200,000 - 500,000 (+ KES 5M minimum capital)
```

### 5.3 Hotel & Tourism

```
Phase 1 — Registration (Days 1-5):
  BRS → Company registration
  KRA → PIN, VAT, PAYE

Phase 2 — Premises (Days 6-60):
  County Planning → Change of use / building approval
  County Health → Food handlers, food hygiene
  County Fire → Fire safety certificate
  DOSHS → Workplace registration
  NEMA → EIA (if >50 beds or new construction)
  WRA → Water use permit

Phase 3 — Sector License (Days 30-90):
  TRA → Hotel classification license (Star rating)
  KWS → If near national park/reserve

Phase 4 — Operations:
  NSSF + SHIF → Employee registration
  KRA → PAYE for employees
  KRA → VAT on accommodation services (16%)
  TRA → Annual license renewal

Additional (if running tours):
  TRA → Tour operator license
  KWS → Permit for park entry (if applicable)

Total Timeline: 60-90 days
Estimated Cost: KES 150,000 - 400,000
```

### 5.4 Healthcare — Private Clinic

```
Phase 1 — Registration (Days 1-5):
  BRS → Company registration
  KRA → PIN, VAT (healthcare exempt but VAT on non-core services)

Phase 2 — Premises (Days 6-45):
  County Health → Health facility registration
  County Fire → Fire certificate
  DOSHS → Workplace registration
  NEMA → Environmental clearance (if handling medical waste)

Phase 3 — Professional Licensing (Days 1-60, parallel):
  KMPDC → Register doctors (each practitioner)
  PPB → Pharmacy license (if dispensing)
  Nursing Council → Register nurses
  Kenya Optometrists Board → If applicable
  Kenya Physiotherapy Council → If applicable

Phase 4 — Facility Accreditation:
  Kenya Medical Laboratory Technicians Board → If doing lab tests
  Radiation Protection Board → If using X-ray equipment

Phase 5 — Insurance:
  IRA → Professional indemnity insurance (mandatory)

Total Timeline: 45-90 days
Estimated Cost: KES 100,000 - 300,000
```

### 5.5 Construction Contractor

```
Phase 1 — Company Registration (Days 1-7):
  BRS → Company registration
  KRA → PIN, VAT

Phase 2 — NCA Registration (Days 8-45):
  NCA → Contractor registration (one of 7 categories based on financial capacity)
    Category NCA1: Unlimited value
    Category NCA8: Up to KES 1M
  Required: Audited accounts, technical staff (engineers), equipment list
  
Phase 3 — Project-Specific (per project):
  Physical Planning → Building plan approval
  County → Construction permit
  NEMA → EIA (if project >1,000 sqm or involves significant earthworks)
  WRA → If project affects water resources
  NEMA → Quarry license (if quarrying)

Phase 4 — Labour:
  DOSHS → Site safety officer appointment
  NSSF + SHIF → All workers registered
  Ministry of Labour → Construction workers must receive statutory wages

Phase 5 — Completion:
  NCA → Project completion certificate
  County → Occupation certificate
  NEMA → Environmental audit (if EIA was required)

Total Timeline: 21-60 days (before first project)
Estimated Cost: KES 50,000 - 200,000
```

### 5.6 Mining Operation

```
Phase 1 — Registration (Days 1-7):
  BRS → Company registration (must include "mining" in objects)
  KRA → PIN, VAT
  KenInvest → Investment certificate (mandatory for foreign miners)

Phase 2 — Prospecting (Before Mining):
  Ministry of Mining → Prospecting license
    Required: Technical report, financial capacity, EIA commitment
    Duration: 3 years, renewable
    Cost: KES 50,000 - 500,000

Phase 3 — Mining License:
  Ministry of Mining → Mining license (after proving viable deposit)
    Required: Feasibility study, EIA, local content plan, royalty structure
    Cost: Based on area and mineral type
    Royalty: 1-5% of gross revenue (varies by mineral)

Phase 4 — Environmental (Critical):
  NEMA → Full EIA (mandatory, no exceptions)
    Includes: Baseline study, impact assessment, closure plan
    Timeline: 90-180 days
    Cost: KES 500,000 - 5,000,000+
  NEMA → Effluent discharge license (if water involved)
  WRA → Water use permit

Phase 5 — Labour & Community:
  DOSHS → Mine safety officer (mandatory)
  Ministry of Labour → Contractor management plan
  Community Development Plan → Mandatory under Mining Act 2016

Phase 6 — Export:
  KRA → Export duty on minerals
  KenTrade → Export declaration
  Ministry of Mining → Export permit (for unprocessed minerals)

Total Timeline: 12-24 months
Estimated Cost: KES 2,000,000 - 20,000,000+
```

---

## 6. Bank Account Integration

### 6.1 Supported Banks + API Status

| Bank | Account Type | API Integration | Business Focus |
|------|-------------|----------------|----------------|
| Equity Bank | Current, USD, SME Growth | REST API (OAuth2) | SMEs, agriculture, diaspora |
| KCB | Corporate, USD, trade | REST API | Large corporates, trade finance |
| Co-operative Bank | Current, SME, SACCO-linked | REST API | Co-ops, mid-market |
| NCBA | Current, USD, corporate | REST API | Mid-to-large corporates |
| Absa Kenya | Current, USD, corporate | REST API | International investors |
| Standard Chartered | Current, USD, trade finance | REST API | Multinationals, forex |
| Stanbic | Current, USD, commodity | REST API | Resources, energy sector |
| I&M Bank | Current, USD, MSME | REST API | Mid-market |
| Diamond Trust | Current, SME | Webhook-based | SME, East African |
| Family Bank | Current, SME | REST API | SME-focused |

### 6.2 Bank Recommendation AI Logic

```python
def recommend_bank(investor_profile: dict) -> dict:
    """MiMo-V2-Pro recommends optimal bank based on investor profile"""
    
    rules = {
        "import_export":        "Standard Chartered",   # Best forex + LC
        "agriculture":          "Equity Bank",          # Rural network, agri products
        "capital_over_100m":    "KCB",                  # Corporate banking
        "diaspora":             "Equity Bank",          # Diaspora banking products
        "fintech":              "NCBA",                 # Tech-forward
        "manufacturing":        "Stanbic",              # Trade finance
        "sme_under_5m":        "Co-operative Bank",     # SME-friendly
        "multinational":        "Absa",                  # International standards
        "healthcare":           "I&M Bank",             # Professional services
    }
    
    # AI refinement: consider investor nationality, currency needs, credit requirements
    # ...
```

### 6.3 Required Documents (AI Auto-Assembles)

```
Corporate Account Opening KYC Pack:
✅ Certificate of Incorporation
✅ CR12 (Registered Office)
✅ Memorandum & Articles of Association
✅ KRA PIN Certificate (company)
✅ Valid Business Permit
✅ Board Resolution (auto-generated by system)
✅ Passport/ID copies of all directors
✅ KRA PINs of all directors
✅ Proof of physical address (lease agreement)
✅ Source of funds declaration (auto-generated)
✅ Ultimate Beneficial Owner (UBO) form (auto-filled)
✅ Anti-Money Laundering questionnaire (auto-filled)
✅ Expected transaction volumes declaration

For Foreign Directors / Investors:
✅ Work permit / Class G permit
✅ Home country bank reference letter
✅ Proof of initial deposit source
```

---

## 7. Facilitator Allocation System

### 7.1 Facilitator Tiers & Responsibilities

| Tier | Investment Size | Responsibility | Capacity |
|------|----------------|---------------|---------|
| Junior | < KES 5M | Email support, document review | 20 clients |
| Standard | KES 5-100M | Office visits, government liaison | 12 clients |
| Senior | > KES 100M | Full concierge, executive introductions, parallel processing | 6 clients |
| Specialist | Sector-specific | Mining, fintech, pharma (domain expertise) | 8 clients |

### 7.2 Facilitator SLA Obligations (Contractual)

```
Response Times:
- Urgent (document expiring, application rejected): 2 hours
- Standard query: 24 hours
- Status update to investor: Weekly minimum

Action Times:
- Government office visit: Within 48 hours of assignment
- Application follow-up calls: Weekly
- Escalation to supervisor: Day 3 of unexplained delay
- Written escalation: Day 7 of unexplained delay
- Alert to integrity officer: If payment irregularity encountered

Reporting:
- Daily log of actions taken (goes to audit trail)
- Weekly investor status report
- Immediate report of any solicitation or irregular request
```

### 7.3 Facilitator Actions That Are Prohibited

```python
PROHIBITED_FACILITATOR_ACTIONS = [
    "Accept, hold, or transmit cash on behalf of investor",
    "Pay any amount to government official outside official channels",
    "Promise expedited processing in exchange for unofficial payment",
    "Recommend investor make unofficial payment to any person",
    "Submit application using investor's credentials without consent log",
    "Access investor documents outside of assigned case scope",
    "Share investor information with third parties not in workflow",
]

# Any of these triggers immediate suspension + audit investigation
```

---

## 8. Document Expiry Tracker

### 8.1 All 50+ Tracked Document Types

| Category | Document | Renewal Lead Time | Auto-Renewable |
|----------|---------|-------------------|---------------|
| Immigration | Work permit | 90 days | No (needs medical, new passport) |
| Immigration | Dependent pass | 90 days | No |
| Immigration | Alien card | 180 days | No |
| Business | Certificate of Incorporation | No expiry | N/A |
| Business | Business name registration | No expiry | N/A |
| Tax | Tax compliance certificate | 60 days | Yes (if returns filed) |
| Tax | VAT compliance cert | 60 days | Yes |
| County | Single Business Permit | 30 days before Dec 31 | Yes |
| County | Fire certificate | 60 days | No (needs re-inspection) |
| County | Public health license | 60 days | No |
| County | Liquor license | 60 days | No |
| Environment | EIA license | 60 days | No (needs audit) |
| Environment | Effluent discharge | 60 days | No |
| Standards | KEBS Diamond Mark | 90 days | No (needs re-inspection) |
| Safety | DOSHS workplace cert | 60 days | Yes |
| Social Security | NSSF compliance | 30 days | Yes |
| Health Insurance | SHIF clearance | 30 days | Yes |
| Sector | TRA hotel license | 60 days | No |
| Sector | NCA contractor cert | 90 days | No |
| Sector | CBK PSP license | 90 days | No |
| IP | Trademark renewal | 180 days | Yes (if fees paid) |
| IP | Patent renewal | 180 days | Yes (if fees paid) |
| Personal | Director passport | 180 days | No |
| Personal | Director KRA PIN | No expiry | N/A |
| Trade | Certificate of origin | Per shipment | Per shipment |
| Energy | EPRA energy license | 60 days | No |

### 8.2 Notification Schedule

| Days to Expiry | Alert Level | Channels | Frequency |
|---------------|------------|---------|-----------|
| 90 days | 💙 Info | Email | Once |
| 60 days | 🟡 Reminder | Email, Push | Once |
| 30 days | 🟠 Warning | Email, SMS, Push | Once |
| 14 days | 🔴 Urgent | All channels | Every 3 days |
| 7 days | 🚨 Critical | All channels + WhatsApp | Daily |
| 3 days | 🚨🚨 Final | All channels + facilitator call | Twice daily |
| Expired | ☠️ Expired | All channels + legal notice | Daily until renewed |

### 8.3 Auto-Renewal Workflow

```
Document approaching expiry
  │
  ▼
Can it auto-renew? (No structural/personal changes)
  │
  ├── YES:
  │     AI generates renewal form (pre-filled from profile)
  │     AI calculates renewal fee
  │     AI assembles supporting documents from vault
  │     Payment request sent to investor
  │     On payment confirmation → submit to portal
  │     Track renewal status
  │     Certificate downloaded and stored on approval
  │
  └── NO (requires manual steps):
        Notify facilitator 90 days ahead
        Facilitator books appointments (medical, inspection, etc.)
        AI generates checklist for investor
        Investor uploads new required documents
        Facilitator submits manually with AI-prepared pack
```

---

## 9. Form Auto-Fill Engine

### 200+ Forms Library

```
/forms/
  /brs/
    cr1_company_registration.json
    cr12_registered_office.json
    brs_name_reservation.json
  /kra/
    pin_application.json
    vat_registration.json
    paye_employer.json
    wht_registration.json
    customs_registration.json
  /immigration/
    form_17_work_permit.json
    dependent_pass.json
    visa_application.json
    alien_card.json
  /county/
    single_business_permit_nairobi.json
    single_business_permit_mombasa.json
    # ... all 47 counties
    fire_safety_certificate.json
    public_health_license.json
  /nema/
    eia_project_brief.json
    eia_full_application.json
    effluent_discharge.json
  /kebs/
    diamond_mark_application.json
    ism_registration.json
    pvoc_registration.json
  /nca/
    contractor_registration.json
    project_notification.json
  /banking/
    board_resolution_account_opening.json
    ubo_declaration.json
    source_of_funds.json
    # ... per bank
  # ... and 150+ more
```

---

## 10. Database Schema (Full)

*(Key additions to V2 schema)*

```sql
-- Corruption reports
CREATE TABLE integrity_reports (
    id              UUID PRIMARY KEY,
    investor_id     UUID,  -- nullable if anonymous
    report_ref      VARCHAR(50) UNIQUE,
    agency          VARCHAR(100),
    officer_desc    TEXT,   -- Description only, no names required
    incident_date   DATE,
    description     TEXT,
    amount_mentioned DECIMAL(10,2),
    evidence_urls   TEXT[],
    status          VARCHAR(50) DEFAULT 'received',  
                    -- received | under_review | referred_to_eacc | closed_unsubstantiated
    integrity_officer_id UUID REFERENCES users(id),
    eacc_reference  VARCHAR(100),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Official fee schedule (read-only reference table)
CREATE TABLE official_fee_schedule (
    id          SERIAL PRIMARY KEY,
    agency      VARCHAR(100),
    service     VARCHAR(200),
    fee_min     DECIMAL(10,2),
    fee_max     DECIMAL(10,2),
    fee_note    TEXT,
    paybill     VARCHAR(20),
    account_ref VARCHAR(100),
    source_url  VARCHAR(500),
    effective_date DATE,
    updated_at  TIMESTAMP
);

-- MiMo API usage tracking (for cost management)
CREATE TABLE ai_usage_log (
    id          UUID PRIMARY KEY,
    request_id  VARCHAR(100),
    model       VARCHAR(50),  -- 'mimo-v2-pro' | 'mimo-v2-omni'
    task_type   VARCHAR(100),
    input_tokens INT,
    output_tokens INT,
    cost_usd    DECIMAL(8,6),
    duration_ms INT,
    investor_id UUID,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

---

## 11. Security & ODPC Compliance

### 11.1 Data Protection

- All PII (passport numbers, ID numbers, financial data) encrypted at rest (AES-256)
- All API traffic over TLS 1.3
- Document vault: client-side encrypted before upload
- Data residency: Kenya-hosted servers (ODPC requirement for personal data)
- Data retention: 7 years (Companies Act), then secure deletion
- DPIA (Data Protection Impact Assessment) required before launch

### 11.2 Access Control

```
Role hierarchy:
  Investor    → View/edit own data only
  Facilitator → View assigned clients only
  Compliance  → View applications + audit summaries
  Integrity   → View audit log + corruption reports
  Admin       → System configuration (cannot view financial data)
  Auditor     → Read-only access to full audit log
  SuperAdmin  → Emergency access (two-person rule + logged)
```

### 11.3 Audit Trail Integrity

- Every record hash-chained (blockchain-style)
- Hash verification runs nightly
- Any tampered record triggers immediate alert to Integrity Officer
- Audit log can be exported to OAG in standard format on demand

---

## 12. API Integration Specs

### 12.1 Priority Integrations (Phase 1)

```
1. eCitizen (206206) — Business permits, certificates
   Auth: OAuth 2.0 | Format: REST JSON
   
2. iTax (KRA) — PIN, VAT, PAYE, tax compliance
   Auth: API Key | Format: REST JSON
   
3. BRS e-Services — Company registration
   Auth: OAuth 2.0 | Format: REST JSON
   
4. M-Pesa (Safaricom Daraja) — Payment processing
   Auth: OAuth 2.0 | Format: REST JSON
   STK Push: /mpesa/stkpush/v1/processrequest
   
5. Africa's Talking — SMS notifications
   Auth: API Key | Format: REST JSON
```

### 12.2 Phase 2 Integrations

```
6.  Immigration FMIS — Work permit applications (SOAP/REST hybrid)
7.  NEMA Portal — EIA applications
8.  KEBS Portal — Standards certification
9.  10 Bank APIs — Account opening applications
10. NCA Portal — Contractor registration
11. 47 County Portals — Business permits (varies by county)
```

### 12.3 Where Direct API Doesn't Exist

Some agencies (especially counties) don't have public APIs. For these:
- AI generates pre-filled PDF forms for manual submission
- Facilitator physically submits
- Status tracked manually via facilitator updates
- Audit trail still maintained

---

*Kenya Invest Digital Autopilot V3.0 — March 2026*
*Powered by Xiaomi MiMo-V2-Pro (Hunter Alpha) + MiMo-V2-Omni (Healer Alpha)*
*Anti-Corruption Engine integrated | Auditor General-ready reporting*
