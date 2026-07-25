from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime

@dataclass
class InvestorAgent:
    nationality: str
    sector: str
    capital_usd: float
    county: str = "Nairobi"
    patience_level: int = 7
    digital_literacy: int = 6
    capital_buffer_months: int = 8
    language: str = "english"
    prior_africa_experience: bool = False
    emotional_state: str = "optimistic"
    confidence: int = 8
    days_elapsed: int = 0
    total_spent_kes: float = 0.0
    abandonment_risk: float = 0.05
    applications: List[str] = field(default_factory=list)
    delays: List[dict] = field(default_factory=list)
    
    def experience_delay(self, days: int, cause: str):
        self.delays.append({"days": days, "cause": cause, "date": datetime.now().isoformat()})
        self.confidence = max(1, self.confidence - 1)
        self.abandonment_risk = min(0.95, self.abandonment_risk + days * 0.005)
        if days > 30: self.emotional_state = "frustrated"
        if self.abandonment_risk > 0.7: self.emotional_state = "considering_exit"
    
    def will_abandon(self) -> bool:
        import random
        return random.random() < self.abandonment_risk

@dataclass
class GovernmentOfficerAgent:
    agency: str
    workload: int = 40
    process_adherence: float = 0.8
    responsiveness: float = 0.7
    digital_capability: float = 0.6
    extra_doc_request_rate: float = 0.15
    fee_mismatch_rate: float = 0.10

@dataclass
class FacilitatorAgent:
    name: str = "Facilitator"
    level: str = "standard"
    expertise: List[str] = field(default_factory=list)
    relationships: int = 7
    workload: int = 6
    integrity: float = 0.95
    languages: List[str] = field(default_factory=lambda: ["English", "Swahili"])

@dataclass
class BankOfficerAgent:
    bank: str = "Equity Bank"
    aml_threshold: float = 0.3

@dataclass
class MarketPeerAgent:
    experience: str = "mixed"
    sector: str = "general"
    days_to_complete: int = 90
    
    def influence_abandonment_delta(self) -> float:
        return -0.05 if self.experience == "positive" else 0.08

# Agency risk profiles (from EACC + TI data)
AGENCY_RISK_PROFILES = {
    "BRS":          {"workload": 30, "extra_doc_rate": 0.12, "fee_mismatch": 0.05},
    "KRA":          {"workload": 25, "extra_doc_rate": 0.08, "fee_mismatch": 0.04},
    "Immigration":  {"workload": 45, "extra_doc_rate": 0.34, "fee_mismatch": 0.18},
    "NEMA":         {"workload": 40, "extra_doc_rate": 0.38, "fee_mismatch": 0.22},
    "KEBS":         {"workload": 35, "extra_doc_rate": 0.22, "fee_mismatch": 0.12},
    "DOSHS":        {"workload": 20, "extra_doc_rate": 0.10, "fee_mismatch": 0.05},
    "Nairobi_County":{"workload": 38,"extra_doc_rate": 0.28, "fee_mismatch": 0.18},
    "NCA":          {"workload": 32, "extra_doc_rate": 0.25, "fee_mismatch": 0.15},
    "PPB":          {"workload": 45, "extra_doc_rate": 0.30, "fee_mismatch": 0.12},
}

def create_officer_for_agency(agency: str) -> GovernmentOfficerAgent:
    profile = AGENCY_RISK_PROFILES.get(agency, {
        "workload": 30, "extra_doc_rate": 0.15, "fee_mismatch": 0.10
    })
    return GovernmentOfficerAgent(
        agency=agency,
        workload=profile["workload"],
        extra_doc_request_rate=profile["extra_doc_rate"],
        fee_mismatch_rate=profile["fee_mismatch"]
    )
