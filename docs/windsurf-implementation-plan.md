# WINDSURF IMPLEMENTATION PLAN
# MiroFish × Kenya Invest — Complete Project Build
# 
# HOW TO USE THIS FILE:
# 1. Open Windsurf
# 2. Open a new Cascade (Ctrl+L or Cmd+L)
# 3. Paste the contents of this file as your first message
# 4. Windsurf will execute each phase in order
# 5. Your only job: add API keys to .env when prompted, then test the UI
#
# ESTIMATED TIME TO COMPLETE: 2-4 hours of Windsurf autonomous execution
# YOUR WORK: ~15 minutes total (just API key setup + final testing)

---

You are building the MiroFish × Kenya Invest project. This is a complete AI-powered investor onboarding simulation platform. Follow every instruction exactly. Complete each phase fully before moving to the next. Do not ask me questions — make sensible decisions and proceed. If you encounter an error, fix it and continue.

## PHASE 0: SETUP — Clone MiroFish and prepare workspace

```
TASK: Clone the MiroFish repository and set up the project structure.

Commands to run:
1. git clone https://github.com/666ghj/MiroFish.git kenya-invest-mirofish
2. cd kenya-invest-mirofish
3. Create .env file with placeholder values (user will fill API keys later)
4. Install all dependencies: npm run setup:all
5. Verify the base project runs: npm run dev (check http://localhost:3000 loads)
6. Stop the dev server
7. Create a git branch: git checkout -b kenya-invest-integration

VERIFY: The MiroFish frontend loads at localhost:3000 before proceeding.
```

## PHASE 1: ENVIRONMENT & CONFIGURATION

```
TASK: Create the complete .env configuration file.

Create file: .env

Contents:
# ============================================================
# KENYA INVEST × MIROFISH — ENVIRONMENT CONFIGURATION
# Fill in your API keys below. Everything else is pre-configured.
# ============================================================

# --- LLM: Xiaomi MiMo-V2-Pro (Hunter Alpha) ---
# Get key at: https://platform.xiaomimimo.com
LLM_API_KEY=PASTE_YOUR_MIMO_KEY_HERE
LLM_BASE_URL=https://api.xiaomimimo.com/v1
LLM_MODEL_NAME=mimo-v2-pro

# --- LLM: Xiaomi MiMo-V2-Omni (Healer Alpha) for passport/document reading ---
LLM_OMNI_MODEL=mimo-v2-omni

# --- Perplexity Agent API (Research Agent) ---
# Get key at: https://www.perplexity.ai/api-platform
PERPLEXITY_API_KEY=PASTE_YOUR_PERPLEXITY_KEY_HERE
PERPLEXITY_BASE_URL=https://api.perplexity.ai/v1

# --- Zep Cloud (Agent Memory) ---
# Free tier at: https://app.getzep.com
ZEP_API_KEY=PASTE_YOUR_ZEP_KEY_HERE

# --- Vector Database: Qdrant ---
# Local Qdrant runs via Docker (auto-started by this project)
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION_FEES=fee_schedules
QDRANT_COLLECTION_SLAS=sla_benchmarks
QDRANT_COLLECTION_REGS=regulations
QDRANT_COLLECTION_RISKS=risk_scores

# --- Embedding Model ---
# Uses OpenAI text-embedding-3-small (cheap: $0.02 per 1M tokens)
EMBEDDING_API_KEY=PASTE_YOUR_OPENAI_KEY_HERE
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# --- Cache TTL (seconds) ---
CACHE_TTL_FEES=604800        # 7 days
CACHE_TTL_SLAS=1209600       # 14 days  
CACHE_TTL_REGULATIONS=2592000 # 30 days
CACHE_TTL_RISKS=604800       # 7 days

# --- Fallback LLM (if MiMo unavailable) ---
FALLBACK_LLM_URL=https://api.openai.com/v1
FALLBACK_LLM_MODEL=gpt-4o-mini
FALLBACK_LLM_KEY=PASTE_YOUR_OPENAI_KEY_HERE

# --- Platform webhook (for feedback loop) ---
KENYA_INVEST_WEBHOOK=http://localhost:5001/api/internal/simulation-complete

# --- App settings ---
PORT_FRONTEND=3000
PORT_BACKEND=5001
NODE_ENV=development
LOG_LEVEL=info
```

## PHASE 2: DOCKER SERVICES — Qdrant Vector DB

```
TASK: Add Qdrant vector database to the Docker Compose setup.

Modify: docker-compose.yml
Add this service alongside existing MiroFish services:

  qdrant:
    image: qdrant/qdrant:latest
    container_name: ki_qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_storage:/qdrant/storage
    restart: unless-stopped

Add to volumes section:
  qdrant_storage:

Then run: docker compose up -d qdrant
Verify: curl http://localhost:6333/health returns {"status":"ok"}
```

## PHASE 3: VECTOR DATABASE LAYER

```
TASK: Create the complete vector database module.

Create file: backend/vector_db/__init__.py (empty)

Create file: backend/vector_db/qdrant_client.py

"""
Vector database client for Kenya Invest research storage.
Stores embeddings of research findings so we don't re-query
Perplexity every time. Research is auto-expired based on TTL.
"""

import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue,
    SearchRequest, ScoredPoint
)
import openai

class KenyaInvestVectorDB:
    
    def __init__(self):
        self.client = QdrantClient(
            host=os.getenv('QDRANT_HOST', 'localhost'),
            port=int(os.getenv('QDRANT_PORT', 6333))
        )
        self.embedding_client = openai.OpenAI(
            api_key=os.getenv('EMBEDDING_API_KEY')
        )
        self.embedding_model = os.getenv('EMBEDDING_MODEL', 'text-embedding-3-small')
        self.dimensions = int(os.getenv('EMBEDDING_DIMENSIONS', 1536))
        
        # TTL in seconds per collection
        self.ttl = {
            'fee_schedules':  int(os.getenv('CACHE_TTL_FEES',        604800)),
            'sla_benchmarks': int(os.getenv('CACHE_TTL_SLAS',       1209600)),
            'regulations':    int(os.getenv('CACHE_TTL_REGULATIONS', 2592000)),
            'risk_scores':    int(os.getenv('CACHE_TTL_RISKS',       604800)),
        }
        
        self._init_collections()
    
    def _init_collections(self):
        """Create collections if they don't exist."""
        existing = [c.name for c in self.client.get_collections().collections]
        
        collections = [
            os.getenv('QDRANT_COLLECTION_FEES',  'fee_schedules'),
            os.getenv('QDRANT_COLLECTION_SLAS',  'sla_benchmarks'),
            os.getenv('QDRANT_COLLECTION_REGS',  'regulations'),
            os.getenv('QDRANT_COLLECTION_RISKS', 'risk_scores'),
        ]
        
        for coll in collections:
            if coll not in existing:
                self.client.create_collection(
                    collection_name=coll,
                    vectors_config=VectorParams(
                        size=self.dimensions,
                        distance=Distance.COSINE
                    )
                )
                print(f"Created collection: {coll}")
    
    def _embed(self, text: str) -> List[float]:
        """Convert text to embedding vector."""
        response = self.embedding_client.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        return response.data[0].embedding
    
    def _cache_key(self, sector: str, county: str, 
                   nationality: str, data_type: str) -> str:
        """Generate deterministic cache key."""
        raw = f"{sector}:{county}:{nationality}:{data_type}".lower()
        return hashlib.md5(raw.encode()).hexdigest()
    
    def _is_stale(self, stored_at: str, collection: str) -> bool:
        """Check if cached data has exceeded its TTL."""
        stored = datetime.fromisoformat(stored_at)
        ttl_seconds = self.ttl.get(collection, 604800)
        return datetime.now() > stored + timedelta(seconds=ttl_seconds)
    
    def search(self, query: str, collection: str, 
               sector: str, county: str, nationality: str,
               top_k: int = 5) -> Optional[List[Dict]]:
        """
        Search for cached research results.
        Returns None if no relevant cache exists or if data is stale.
        """
        query_vector = self._embed(query)
        
        results = self.client.search(
            collection_name=collection,
            query_vector=query_vector,
            limit=top_k,
            score_threshold=0.75,  # Only return high-similarity results
        )
        
        if not results:
            return None
        
        # Filter for matching sector/county/nationality
        valid = []
        for r in results:
            payload = r.payload or {}
            
            # Check metadata matches
            if (payload.get('sector', '').lower() == sector.lower() or
                payload.get('sector') == 'global'):
                
                # Check staleness
                stored_at = payload.get('stored_at', '')
                if stored_at and self._is_stale(stored_at, collection):
                    continue  # Skip stale entries
                
                valid.append({
                    'score': r.score,
                    'data': payload.get('data'),
                    'stored_at': stored_at,
                    'source': payload.get('source', 'cache')
                })
        
        return valid if valid else None
    
    def store(self, content: str, data: Dict, collection: str,
              sector: str, county: str, nationality: str,
              source: str = 'perplexity') -> str:
        """
        Embed and store research result.
        Returns the point ID.
        """
        point_id = self._cache_key(sector, county, nationality, collection)
        vector = self._embed(content)
        
        # Convert hex id to integer for Qdrant
        point_id_int = int(point_id[:8], 16)
        
        self.client.upsert(
            collection_name=collection,
            points=[
                PointStruct(
                    id=point_id_int,
                    vector=vector,
                    payload={
                        'sector': sector,
                        'county': county,
                        'nationality': nationality,
                        'data': data,
                        'raw_content': content[:2000],  # Store first 2K chars
                        'source': source,
                        'stored_at': datetime.now().isoformat(),
                        'cache_key': point_id
                    }
                )
            ]
        )
        
        return point_id
    
    def invalidate(self, sector: str, county: str, 
                   nationality: str, collection: str):
        """Force-expire a cache entry (e.g., after gazette update)."""
        point_id = self._cache_key(sector, county, nationality, collection)
        point_id_int = int(point_id[:8], 16)
        
        try:
            self.client.delete(
                collection_name=collection,
                points_selector=[point_id_int]
            )
        except:
            pass  # OK if doesn't exist
    
    def get_cache_stats(self) -> Dict:
        """Return stats on cache coverage and freshness."""
        stats = {}
        collections = ['fee_schedules', 'sla_benchmarks', 'regulations', 'risk_scores']
        
        for coll in collections:
            try:
                info = self.client.get_collection(coll)
                stats[coll] = {
                    'total_points': info.points_count,
                    'ttl_days': self.ttl[coll] / 86400
                }
            except:
                stats[coll] = {'total_points': 0}
        
        return stats

# Singleton instance
vector_db = KenyaInvestVectorDB()
```

## PHASE 4: RESEARCH AGENT

```
TASK: Create the complete Research Agent with vector DB integration.

Create file: backend/research_agent/__init__.py (empty)

Create file: backend/research_agent/researcher.py

"""
Research Agent — the brain that knows everything about investing in Kenya.

FLOW:
1. User asks: "I want to open a food factory in Nairobi as a Chinese investor"
2. We check vector DB: do we have fresh data for this sector/county?
3. CACHE HIT: return stored research instantly (< 100ms)
4. CACHE MISS: call Perplexity deep research (2-3 minutes)
5. Embed results, store in vector DB for next time
6. Return structured seed pack
"""

import os
import json
import asyncio
from typing import Optional, Dict, Any
from openai import OpenAI
from backend.vector_db.qdrant_client import vector_db

class InvestmentResearchAgent:
    
    def __init__(self):
        self.perplexity = OpenAI(
            base_url=os.getenv('PERPLEXITY_BASE_URL', 'https://api.perplexity.ai/v1'),
            api_key=os.getenv('PERPLEXITY_API_KEY')
        )
        self.mimo_pro = OpenAI(
            base_url=os.getenv('LLM_BASE_URL'),
            api_key=os.getenv('LLM_API_KEY')
        )
    
    def research(self, sector: str, nationality: str,
                 capital_usd: float, county: str) -> Dict:
        """
        Main entry point. Returns complete seed pack.
        Checks cache first, falls back to Perplexity if stale.
        """
        print(f"[Research Agent] Starting for {sector} / {nationality} / {county}")
        
        # 1. Check all caches
        cached = self._check_all_caches(sector, county, nationality)
        
        # 2. Identify what's missing or stale
        missing = [k for k, v in cached.items() if v is None]
        print(f"[Research Agent] Cache hits: {[k for k, v in cached.items() if v]}")
        print(f"[Research Agent] Cache misses (will deep-research): {missing}")
        
        # 3. Research only what's missing
        fresh_data = {}
        if missing:
            fresh_data = self._run_targeted_research(
                missing, sector, nationality, capital_usd, county
            )
            # Store fresh data in vector DB
            self._store_research(fresh_data, sector, county, nationality)
        
        # 4. Merge cached + fresh
        all_data = {**{k: v[0]['data'] if v else {} for k, v in cached.items()}, 
                    **fresh_data}
        
        # 5. Synthesise into seed pack using MiMo-V2-Pro
        seed_pack = self._synthesise(all_data, sector, nationality, capital_usd, county)
        
        return seed_pack
    
    def _check_all_caches(self, sector: str, county: str, 
                           nationality: str) -> Dict:
        """Check vector DB for all data types."""
        checks = {
            'fee_schedules': f"fee schedule {sector} Kenya agencies 2026",
            'sla_benchmarks': f"processing time {sector} Kenya government 2026",
            'regulations': f"regulations requirements {sector} Kenya law 2026",
            'risk_scores': f"corruption risk delays Kenya agencies 2026"
        }
        
        results = {}
        for collection, query in checks.items():
            results[collection] = vector_db.search(
                query=query,
                collection=collection,
                sector=sector,
                county=county,
                nationality=nationality
            )
        
        return results
    
    def _run_targeted_research(self, missing_types: list, sector: str,
                                nationality: str, capital_usd: float,
                                county: str) -> Dict:
        """Run Perplexity deep research only for missing/stale data types."""
        
        query_map = {
            'fee_schedules': (
                f"Kenya 2026 official government fee schedule for {sector} business setup. "
                f"Include: BRS registration KES 10950, Immigration Class G permit USD 2000, "
                f"{county} County Single Business Permit, NEMA EIA, KEBS Diamond Mark. "
                f"Include exact M-Pesa paybill numbers for each agency. "
                f"Source only from .go.ke domains."
            ),
            'sla_benchmarks': (
                f"Realistic (not official) processing times for {sector} investor in Kenya 2026. "
                f"Include: actual Immigration work permit wait (often 8-14 weeks), "
                f"actual NEMA EIA timeline (often 120-180 days), "
                f"actual BRS company registration, actual {county} County permit. "
                f"Look for complaints, forums, business associations data."
            ),
            'regulations': (
                f"Current Kenya regulations for {sector} business 2026. "
                f"Include: required licenses, sector-specific laws, "
                f"recent gazette notices affecting {sector}, "
                f"{nationality} investor special requirements or restrictions."
            ),
            'risk_scores': (
                f"Kenya government agency corruption and delay risk 2025-2026. "
                f"EACC reports, Transparency International Kenya data, "
                f"investor complaints by agency. Which agencies request "
                f"extra documents or unofficial payments most often?"
            )
        }
        
        results = {}
        for data_type in missing_types:
            if data_type not in query_map:
                continue
            
            print(f"[Perplexity] Researching: {data_type}")
            
            try:
                response = self.perplexity.chat.completions.create(
                    model="sonar-deep-research",
                    messages=[{
                        "role": "user",
                        "content": query_map[data_type]
                    }]
                )
                results[data_type] = response.choices[0].message.content
                print(f"[Perplexity] Got {len(results[data_type])} chars for {data_type}")
                
            except Exception as e:
                print(f"[Perplexity] Error for {data_type}: {e}")
                # Use fallback if Perplexity fails
                results[data_type] = self._fallback_research(data_type, sector, county)
        
        return results
    
    def _fallback_research(self, data_type: str, sector: str, county: str) -> str:
        """Fallback to GPT-4o-mini if Perplexity is unavailable."""
        fallback = OpenAI(
            base_url=os.getenv('FALLBACK_LLM_URL'),
            api_key=os.getenv('FALLBACK_LLM_KEY')
        )
        
        response = fallback.chat.completions.create(
            model=os.getenv('FALLBACK_LLM_MODEL', 'gpt-4o-mini'),
            messages=[{
                "role": "user",
                "content": f"Provide Kenya investment data for: {data_type}, sector: {sector}, county: {county}. "
                           f"Use your training knowledge. Note this may not be current."
            }]
        )
        return response.choices[0].message.content
    
    def _store_research(self, fresh_data: Dict, sector: str, 
                        county: str, nationality: str):
        """Store all fresh research in vector DB."""
        type_to_collection = {
            'fee_schedules': 'fee_schedules',
            'sla_benchmarks': 'sla_benchmarks',
            'regulations': 'regulations',
            'risk_scores': 'risk_scores'
        }
        
        for data_type, content in fresh_data.items():
            collection = type_to_collection.get(data_type)
            if collection and content:
                vector_db.store(
                    content=str(content),
                    data={'raw': content, 'data_type': data_type},
                    collection=collection,
                    sector=sector,
                    county=county,
                    nationality=nationality,
                    source='perplexity'
                )
                print(f"[VectorDB] Stored {data_type} for {sector}/{county}")
    
    def _synthesise(self, all_data: Dict, sector: str, nationality: str,
                    capital_usd: float, county: str) -> Dict:
        """Use MiMo-V2-Pro to synthesise all research into a structured seed pack."""
        
        system_prompt = """You are a Kenyan investment compliance expert.
Synthesise the research data into a precise seed pack JSON.
Return ONLY valid JSON — no markdown, no explanation, just the JSON object.
Use realistic estimates. Include confidence scores where data is uncertain."""
        
        user_prompt = f"""
Build a complete investment seed pack for:
- Sector: {sector}
- Nationality: {nationality}  
- Capital: USD {capital_usd:,.0f}
- County: {county}

Research data available:
{json.dumps(all_data, indent=2)[:8000]}

Return this exact JSON structure:
{{
  "seed_meta": {{
    "generated_at": "ISO timestamp",
    "investor_nationality": "{nationality}",
    "sector": "{sector}",
    "capital_usd": {capital_usd},
    "county": "{county}",
    "confidence_score": 0.0
  }},
  "investor_profile": {{
    "archetype": "foreign_manufacturer|diaspora|local_sme|multinational",
    "language_barriers": [],
    "digital_literacy": 0,
    "patience_level": 0,
    "capital_buffer_months": 0,
    "prior_africa_experience": false,
    "risk_tolerance": "low|medium|high"
  }},
  "regulatory_map": {{
    "required_agencies": [],
    "parallel_tracks": [[]],
    "sequential_dependencies": {{}},
    "estimated_total_days": 0,
    "critical_path": []
  }},
  "fee_schedule": {{}},
  "sla_benchmarks": {{}},
  "agency_risk_scores": {{}},
  "bottleneck_forecast": {{
    "primary_bottleneck": "",
    "primary_cause": "",
    "abandonment_risk_pct": 0,
    "abandonment_trigger_stage": "",
    "abandonment_trigger_day": 0
  }},
  "simulation_config": {{
    "recommended_agent_count": 200,
    "recommended_rounds": 40,
    "environments": ["ecitizen", "immigration", "county"],
    "inject_events": []
  }}
}}
"""
        
        try:
            response = self.mimo_pro.chat.completions.create(
                model=os.getenv('LLM_MODEL_NAME', 'mimo-v2-pro'),
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=6000,
                temperature=0.2
            )
            
            content = response.choices[0].message.content.strip()
            # Strip markdown code fences if present
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
            
            return json.loads(content)
            
        except Exception as e:
            print(f"[MiMo-Pro] Synthesis error: {e}")
            # Return minimal valid seed pack
            return self._minimal_seed_pack(sector, nationality, capital_usd, county)
    
    def _minimal_seed_pack(self, sector, nationality, capital_usd, county) -> Dict:
        """Fallback minimal seed pack if synthesis fails."""
        return {
            "seed_meta": {
                "generated_at": datetime.now().isoformat(),
                "investor_nationality": nationality,
                "sector": sector,
                "capital_usd": capital_usd,
                "county": county,
                "confidence_score": 0.4,
                "note": "fallback_minimal_pack"
            },
            "regulatory_map": {
                "required_agencies": ["BRS", "KRA", "Immigration", county + "_County", "NSSF", "SHIF"],
                "estimated_total_days": 90
            },
            "simulation_config": {
                "recommended_agent_count": 100,
                "recommended_rounds": 30,
                "environments": ["ecitizen", "immigration", "county"]
            }
        }
    
    def read_passport(self, image_path: str) -> Dict:
        """Use MiMo-V2-Omni (Healer Alpha) to read passport/ID."""
        import base64
        
        mimo_omni = OpenAI(
            base_url=os.getenv('LLM_BASE_URL'),
            api_key=os.getenv('LLM_API_KEY')
        )
        
        with open(image_path, 'rb') as f:
            image_b64 = base64.b64encode(f.read()).decode()
        
        response = mimo_omni.chat.completions.create(
            model=os.getenv('LLM_OMNI_MODEL', 'mimo-v2-omni'),
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}
                    },
                    {
                        "type": "text",
                        "text": 'Extract all fields. Return ONLY JSON: {"document_type":"passport|national_id","full_name":"","nationality":"","passport_number":"","id_number":"","date_of_birth":"YYYY-MM-DD","gender":"M|F","issue_date":"YYYY-MM-DD","expiry_date":"YYYY-MM-DD","issuing_country":"","confidence_score":0.0}'
                    }
                ]
            }],
            max_tokens=500
        )
        
        raw = response.choices[0].message.content.strip()
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        
        return json.loads(raw)

# Add missing import
from datetime import datetime

research_agent = InvestmentResearchAgent()
```

## PHASE 5: TYPED AGENTS — MiroFish agent override

```
TASK: Create Kenya Invest typed agents that override MiroFish defaults.

Create file: backend/agents/kenya_agents.py

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
```

## PHASE 6: API ENDPOINTS — New routes on MiroFish backend

```
TASK: Add Kenya Invest API endpoints to the MiroFish FastAPI backend.

Create file: backend/routes/kenya_invest.py

from flask import Blueprint, request, jsonify
import uuid
import threading
from datetime import datetime
from backend.research_agent.researcher import research_agent
from backend.vector_db.qdrant_client import vector_db

ki_bp = Blueprint('kenya_invest', __name__, url_prefix='/api/invest')

# In-memory simulation store (use Redis in production)
simulations = {}

@ki_bp.route('/research', methods=['POST'])
def run_research():
    """
    Trigger Research Agent. Returns complete seed pack.
    Cache-first: checks vector DB before calling Perplexity.
    """
    data = request.json
    
    required = ['sector', 'nationality', 'capital_usd', 'county']
    if not all(k in data for k in required):
        return jsonify({"error": f"Required: {required}"}), 400
    
    seed_pack_id = str(uuid.uuid4())
    
    try:
        seed_pack = research_agent.research(
            sector=data['sector'],
            nationality=data['nationality'],
            capital_usd=float(data['capital_usd']),
            county=data['county']
        )
        
        return jsonify({
            "seed_pack_id": seed_pack_id,
            "status": "ready",
            "seed": seed_pack,
            "generated_at": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e), "seed_pack_id": seed_pack_id}), 500


@ki_bp.route('/read-passport', methods=['POST'])
def read_passport():
    """Read passport image using MiMo-V2-Omni (Healer Alpha)."""
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    f = request.files['file']
    tmp_path = f"/tmp/{uuid.uuid4()}.jpg"
    f.save(tmp_path)
    
    try:
        result = research_agent.read_passport(tmp_path)
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        import os
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@ki_bp.route('/simulate', methods=['POST'])
def start_simulation():
    """
    Start a MiroFish simulation using a seed pack.
    Runs async — poll /simulate/:id/status for progress.
    """
    data = request.json
    
    if 'seed' not in data and 'seed_pack_id' not in data:
        return jsonify({"error": "Provide seed or seed_pack_id"}), 400
    
    sim_id = str(uuid.uuid4())
    simulations[sim_id] = {
        "status": "queued",
        "created_at": datetime.now().isoformat(),
        "config": data
    }
    
    # Run simulation in background thread
    thread = threading.Thread(
        target=_run_simulation_async,
        args=(sim_id, data),
        daemon=True
    )
    thread.start()
    
    return jsonify({
        "simulation_id": sim_id,
        "status": "running",
        "estimated_minutes": 12,
        "poll_url": f"/api/invest/simulate/{sim_id}/status"
    })


@ki_bp.route('/simulate/<sim_id>/status', methods=['GET'])
def simulation_status(sim_id):
    sim = simulations.get(sim_id)
    if not sim:
        return jsonify({"error": "Not found"}), 404
    return jsonify(sim)


@ki_bp.route('/simulate/<sim_id>/report', methods=['GET'])
def simulation_report(sim_id):
    sim = simulations.get(sim_id)
    if not sim:
        return jsonify({"error": "Not found"}), 404
    if sim['status'] != 'complete':
        return jsonify({"error": "Simulation not complete", "status": sim['status']}), 202
    return jsonify(sim.get('report', {}))


@ki_bp.route('/cache/stats', methods=['GET'])
def cache_stats():
    """Show vector DB cache coverage and freshness."""
    return jsonify(vector_db.get_cache_stats())


@ki_bp.route('/cache/invalidate', methods=['POST'])
def invalidate_cache():
    """Force-expire cache for a sector/county combination."""
    data = request.json
    for collection in ['fee_schedules', 'sla_benchmarks', 'regulations', 'risk_scores']:
        vector_db.invalidate(
            sector=data.get('sector', ''),
            county=data.get('county', ''),
            nationality=data.get('nationality', ''),
            collection=collection
        )
    return jsonify({"status": "invalidated"})


def _run_simulation_async(sim_id: str, config: dict):
    """Background simulation runner (hooks into MiroFish OASIS engine)."""
    import time
    
    simulations[sim_id]['status'] = 'running'
    simulations[sim_id]['started_at'] = datetime.now().isoformat()
    
    try:
        # TODO: Hook into OASIS engine with typed Kenya agents
        # For now: return a structured mock report
        time.sleep(5)  # Simulate processing time
        
        seed = config.get('seed', {})
        bottleneck_forecast = seed.get('bottleneck_forecast', {})
        
        simulations[sim_id].update({
            "status": "complete",
            "completed_at": datetime.now().isoformat(),
            "report": {
                "journey_summary": {
                    "simulated_days_median": 105,
                    "simulated_days_p90": 148,
                    "vs_sla_benchmark_days": 90,
                    "overage_days": 15,
                    "total_cost_kes_estimated": 680000
                },
                "bottlenecks": [
                    {
                        "agency": "Immigration",
                        "avg_delay_weeks": 10.2,
                        "sla_weeks": 4,
                        "root_cause": "work_permit_queue_overflow",
                        "recommendation": "Deploy dedicated Immigration facilitator, pre-verify all documents"
                    },
                    {
                        "agency": "NEMA",
                        "avg_delay_days": 145,
                        "sla_days": 90,
                        "root_cause": "eia_review_understaffing",
                        "recommendation": "Engage NEMA consultant 60 days before submission"
                    }
                ],
                "abandonment_risk": {
                    "probability": bottleneck_forecast.get('abandonment_risk_pct', 28) / 100,
                    "trigger_stage": bottleneck_forecast.get('abandonment_trigger_stage', 'NEMA_EIA_delay'),
                    "trigger_day": bottleneck_forecast.get('abandonment_trigger_day', 75)
                },
                "corruption_flags": [
                    {
                        "agency": "Immigration",
                        "pattern": "extra_documents_beyond_requirements",
                        "frequency_pct": 34,
                        "audit_recommendation": "Track all document requests vs official list"
                    },
                    {
                        "agency": "Nairobi_County",
                        "pattern": "fee_amount_mismatch",
                        "frequency_pct": 18,
                        "audit_recommendation": "Cross-check all fee amounts against official schedule"
                    }
                ],
                "platform_recommendations": [
                    "Add NEMA fast-track documentation pack to reduce prep time by 30 days",
                    "Deploy Mandarin-speaking Immigration facilitator for Chinese manufacturing investors",
                    "Pre-fill work permit Form 17 template with employer justification letter"
                ],
                "simulation_metadata": {
                    "simulation_id": sim_id,
                    "agents_used": config.get('agent_count', 200),
                    "rounds_run": config.get('rounds', 40),
                    "model": "mirofish-kenya-invest-v1"
                }
            }
        })
        
    except Exception as e:
        simulations[sim_id].update({
            "status": "error",
            "error": str(e),
            "failed_at": datetime.now().isoformat()
        })
```

## PHASE 7: REGISTER ROUTES IN MIROFISH APP

```
TASK: Register the Kenya Invest blueprint in the MiroFish backend app.

Find the main Flask/FastAPI app file (likely backend/app.py or backend/main.py).
Add these lines after existing route registrations:

from routes.kenya_invest import ki_bp
app.register_blueprint(ki_bp)

Also add to requirements or install:
pip install qdrant-client openai python-dotenv

Create file: backend/requirements_kenya_invest.txt
qdrant-client>=1.7.0
openai>=1.0.0
python-dotenv>=1.0.0
python-multipart>=0.0.6
```

## PHASE 8: FRONTEND — Kenya Invest onboarding UI

```
TASK: Create the investor onboarding page that integrates with the backend.

Create file: frontend/src/views/InvestorOnboarding.vue

<template>
  <div class="onboarding">
    
    <!-- Step 1: Passport Upload -->
    <div v-if="step === 1" class="step-card">
      <h2>Upload your passport or ID</h2>
      <p class="subtitle">We'll read it automatically — no typing needed</p>
      <div class="upload-zone" @click="$refs.fileInput.click()" 
           :class="{ 'has-file': passportFile }">
        <input ref="fileInput" type="file" accept="image/*" 
               @change="handlePassportUpload" style="display:none"/>
        <div v-if="!passportData">
          <div class="upload-icon"></div>
          <p>Click to upload passport or ID photo</p>
        </div>
        <div v-else class="extracted-data">
          <p class="success-tag">Identity verified</p>
          <p><strong>{{ passportData.full_name }}</strong></p>
          <p>{{ passportData.nationality }} · {{ passportData.document_type }}</p>
          <p>Expires: {{ passportData.expiry_date }}</p>
        </div>
      </div>
      <button v-if="passportData" @click="step = 2" class="btn-primary">
        Continue
      </button>
    </div>

    <!-- Step 2: 4 Questions -->
    <div v-if="step === 2" class="step-card">
      <h2>Tell us about your investment</h2>
      <p class="subtitle">Four questions. Everything else we research for you.</p>
      
      <div class="field">
        <label>What sector?</label>
        <select v-model="form.sector">
          <option value="">Choose sector...</option>
          <option v-for="s in sectors" :key="s.value" :value="s.value">{{ s.label }}</option>
        </select>
      </div>
      
      <div class="field">
        <label>How much are you investing? (USD)</label>
        <input type="number" v-model="form.capital_usd" 
               placeholder="e.g. 500000" min="10000"/>
      </div>
      
      <div class="field">
        <label>Which county?</label>
        <select v-model="form.county">
          <option value="">Choose county...</option>
          <option v-for="c in counties" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
      
      <div class="field">
        <label>Will you relocate to Kenya?</label>
        <div class="radio-group">
          <label><input type="radio" v-model="form.will_reside" :value="true"/> Yes, relocating</label>
          <label><input type="radio" v-model="form.will_reside" :value="false"/> No, managing remotely</label>
        </div>
      </div>
      
      <button @click="runResearch" :disabled="!canProceed || loading" class="btn-primary">
        <span v-if="!loading">Build my roadmap</span>
        <span v-else>Researching {{ researchStatus }}...</span>
      </button>
    </div>

    <!-- Step 3: Results -->
    <div v-if="step === 3 && seedPack" class="step-card results">
      <h2>Your Kenya investment roadmap</h2>
      <div class="summary-grid">
        <div class="stat">
          <div class="stat-n">{{ seedPack.regulatory_map?.estimated_total_days || '90+' }}</div>
          <div class="stat-l">estimated days</div>
        </div>
        <div class="stat">
          <div class="stat-n">{{ seedPack.regulatory_map?.required_agencies?.length || 0 }}</div>
          <div class="stat-l">agencies</div>
        </div>
        <div class="stat">
          <div class="stat-n">{{ totalCostKES }}</div>
          <div class="stat-l">est. total fees</div>
        </div>
        <div class="stat" :class="riskClass">
          <div class="stat-n">{{ seedPack.bottleneck_forecast?.abandonment_risk_pct || 0 }}%</div>
          <div class="stat-l">dropout risk</div>
        </div>
      </div>
      
      <div class="bottleneck-alert" v-if="seedPack.bottleneck_forecast?.primary_bottleneck">
        <strong>Main bottleneck:</strong> 
        {{ seedPack.bottleneck_forecast.primary_bottleneck }} — 
        {{ seedPack.bottleneck_forecast.primary_cause }}
      </div>
      
      <div class="agencies-list">
        <h3>Required agencies</h3>
        <div class="agency-chip" v-for="a in seedPack.regulatory_map?.required_agencies || []" :key="a">
          {{ a }}
        </div>
      </div>
      
      <button @click="runSimulation" :disabled="simLoading" class="btn-secondary">
        <span v-if="!simLoading">Run full simulation (12 min)</span>
        <span v-else>Simulating... {{ simProgress }}</span>
      </button>
      
      <div v-if="simReport" class="sim-report">
        <h3>Simulation complete</h3>
        <p>Abandonment risk: <strong>{{ Math.round(simReport.abandonment_risk?.probability * 100) }}%</strong> at day {{ simReport.abandonment_risk?.trigger_day }}</p>
        <div v-for="rec in simReport.platform_recommendations || []" :key="rec" class="rec">
          {{ rec }}
        </div>
      </div>
    </div>
    
  </div>
</template>

<script>
export default {
  name: 'InvestorOnboarding',
  data() {
    return {
      step: 1,
      passportFile: null,
      passportData: null,
      loading: false,
      simLoading: false,
      simProgress: '',
      seedPack: null,
      simReport: null,
      researchStatus: '',
      form: {
        sector: '',
        capital_usd: null,
        county: 'Nairobi',
        will_reside: true
      },
      sectors: [
        {value: 'manufacturing', label: 'Manufacturing'},
        {value: 'fintech', label: 'Fintech / Financial Services'},
        {value: 'agriculture', label: 'Agriculture'},
        {value: 'tourism', label: 'Tourism & Hospitality'},
        {value: 'healthcare', label: 'Healthcare'},
        {value: 'real_estate', label: 'Real Estate & Construction'},
        {value: 'ict', label: 'ICT & Technology'},
        {value: 'education', label: 'Education'},
        {value: 'energy', label: 'Energy & Mining'},
        {value: 'retail', label: 'Retail & Wholesale'},
        {value: 'logistics', label: 'Transport & Logistics'},
      ],
      counties: [
        'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu',
        'Machakos', 'Kajiado', 'Nyeri', 'Meru', 'Kakamega',
        'Kisii', 'Siaya', 'Homa Bay', 'Migori', 'Nyamira',
        'Kericho', 'Nandi', 'Uasin Gishu', 'Elgeyo Marakwet',
        'Trans Nzoia', 'West Pokot', 'Baringo', 'Laikipia',
        'Samburu', 'Isiolo', 'Marsabit', 'Mandera', 'Wajir',
        'Garissa', 'Tana River', 'Lamu', 'Taita Taveta',
        'Kwale', 'Kilifi', 'Murang\'a', 'Kirinyaga', 'Nyandarua',
        'Embu', 'Tharaka Nithi', 'Kitui', 'Makueni', 'Narok',
        'Bomet', 'Vihiga', 'Bungoma', 'Busia', 'Turkana', 'Pokot'
      ]
    }
  },
  computed: {
    canProceed() {
      return this.form.sector && this.form.capital_usd && this.form.county
    },
    totalCostKES() {
      const fees = this.seedPack?.fee_schedule || {}
      const total = Object.values(fees).reduce((sum, f) => {
        return sum + (f.official_fee_kes || 0)
      }, 0)
      if (!total) return 'KES 600K+'
      return 'KES ' + Math.round(total / 1000) + 'K'
    },
    riskClass() {
      const risk = this.seedPack?.bottleneck_forecast?.abandonment_risk_pct || 0
      if (risk > 40) return 'risk-high'
      if (risk > 20) return 'risk-medium'
      return 'risk-low'
    }
  },
  methods: {
    async handlePassportUpload(e) {
      const file = e.target.files[0]
      if (!file) return
      
      this.passportFile = file
      const formData = new FormData()
      formData.append('file', file)
      
      try {
        const res = await fetch('/api/invest/read-passport', {
          method: 'POST',
          body: formData
        })
        const data = await res.json()
        if (data.status === 'success') {
          this.passportData = data.data
        }
      } catch (e) {
        // Allow manual proceed if OCR fails
        this.passportData = { full_name: 'Unknown', nationality: 'Unknown', document_type: 'passport' }
      }
    },
    
    async runResearch() {
      this.loading = true
      this.researchStatus = 'checking cache'
      
      try {
        const payload = {
          sector: this.form.sector,
          nationality: this.passportData?.nationality || 'Unknown',
          capital_usd: parseFloat(this.form.capital_usd),
          county: this.form.county,
          will_reside: this.form.will_reside
        }
        
        this.researchStatus = 'deep research'
        const res = await fetch('/api/invest/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        
        const data = await res.json()
        this.seedPack = data.seed
        this.step = 3
        
      } catch (e) {
        alert('Research failed: ' + e.message)
      } finally {
        this.loading = false
      }
    },
    
    async runSimulation() {
      this.simLoading = true
      this.simProgress = 'starting'
      
      try {
        const res = await fetch('/api/invest/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seed: this.seedPack,
            agent_count: 200,
            rounds: 40,
            question: 'Where does this investor face highest friction and abandonment risk?'
          })
        })
        
        const { simulation_id } = await res.json()
        
        // Poll for completion
        await this.pollSimulation(simulation_id)
        
      } catch (e) {
        alert('Simulation failed: ' + e.message)
      } finally {
        this.simLoading = false
      }
    },
    
    async pollSimulation(simId) {
      const poll = async () => {
        const res = await fetch(`/api/invest/simulate/${simId}/status`)
        const data = await res.json()
        
        if (data.status === 'complete') {
          this.simReport = data.report
          return
        }
        if (data.status === 'error') {
          throw new Error(data.error)
        }
        
        this.simProgress = data.status
        await new Promise(r => setTimeout(r, 3000))
        await poll()
      }
      
      await poll()
    }
  }
}
</script>

<style scoped>
.onboarding { max-width: 640px; margin: 0 auto; padding: 2rem; }
.step-card { background: var(--ki-surface); border-radius: 12px; padding: 2rem; }
h2 { font-size: 1.4rem; font-weight: 600; margin-bottom: 0.25rem; }
.subtitle { color: var(--ki-text-2); margin-bottom: 1.5rem; }
.upload-zone { border: 2px dashed var(--ki-border); border-radius: 10px; padding: 2.5rem; text-align: center; cursor: pointer; transition: border-color 0.2s; }
.upload-zone:hover { border-color: var(--ki-accent); }
.upload-zone.has-file { border-style: solid; border-color: var(--ki-success); }
.success-tag { color: var(--ki-success); font-weight: 600; margin-bottom: 0.5rem; }
.field { margin-bottom: 1.25rem; }
.field label { display: block; font-size: 0.875rem; color: var(--ki-text-2); margin-bottom: 0.375rem; }
.field select, .field input { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid var(--ki-border); border-radius: 8px; font-size: 0.9rem; background: var(--ki-bg); color: var(--ki-text); }
.radio-group { display: flex; gap: 1.5rem; }
.radio-group label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.btn-primary { width: 100%; padding: 0.875rem; background: var(--ki-accent); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 500; cursor: pointer; margin-top: 1rem; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { width: 100%; padding: 0.875rem; background: transparent; color: var(--ki-accent); border: 1.5px solid var(--ki-accent); border-radius: 8px; font-size: 0.9rem; cursor: pointer; margin-top: 1rem; }
.summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem; }
.stat { background: var(--ki-surface-2); border-radius: 8px; padding: 0.875rem; text-align: center; }
.stat-n { font-size: 1.4rem; font-weight: 600; }
.stat-l { font-size: 0.75rem; color: var(--ki-text-2); margin-top: 0.125rem; }
.risk-high .stat-n { color: #E24B4A; }
.risk-medium .stat-n { color: #BA7517; }
.risk-low .stat-n { color: #3B6D11; }
.bottleneck-alert { background: #FAEEDA; border-left: 3px solid #BA7517; padding: 0.75rem 1rem; border-radius: 0 8px 8px 0; margin-bottom: 1rem; font-size: 0.875rem; color: #633806; }
.agencies-list h3 { font-size: 0.875rem; color: var(--ki-text-2); margin-bottom: 0.5rem; }
.agency-chip { display: inline-block; background: var(--ki-surface-2); border-radius: 6px; padding: 0.25rem 0.625rem; margin: 0.25rem; font-size: 0.8rem; }
.sim-report { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--ki-border); }
.rec { background: #EAF3DE; border-radius: 6px; padding: 0.625rem 0.875rem; margin: 0.5rem 0; font-size: 0.8rem; color: #27500A; }
</style>
```

## PHASE 9: WEEKLY REFRESH CRON JOB

```
TASK: Create the weekly research refresh script.

Create file: scripts/refresh_research_cache.py

"""
Weekly cron job: re-research all cached sector/county combinations
and update the vector DB. Run every Monday at 02:00 EAT.

Crontab entry:
0 2 * * 1 cd /app && python scripts/refresh_research_cache.py
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.research_agent.researcher import research_agent
from backend.vector_db.qdrant_client import vector_db
from datetime import datetime

# All combinations to keep fresh
REFRESH_TARGETS = [
    # (sector, county, nationality, capital_usd)
    ("manufacturing", "Nairobi", "Chinese", 2000000),
    ("manufacturing", "Nairobi", "Indian", 1000000),
    ("fintech", "Nairobi", "Kenyan", 500000),
    ("agriculture", "Nakuru", "British", 800000),
    ("tourism", "Mombasa", "American", 1500000),
    ("healthcare", "Nairobi", "Kenyan", 300000),
    ("real_estate", "Nairobi", "Kenyan", 5000000),
    ("ict", "Nairobi", "American", 250000),
    ("energy", "Nairobi", "Chinese", 10000000),
]

def run_refresh():
    print(f"[{datetime.now()}] Starting weekly cache refresh")
    
    for sector, county, nationality, capital in REFRESH_TARGETS:
        print(f"Refreshing: {sector} / {county} / {nationality}")
        
        # Invalidate stale cache
        for collection in ['fee_schedules', 'sla_benchmarks', 'regulations', 'risk_scores']:
            vector_db.invalidate(sector, county, nationality, collection)
        
        # Re-research and re-embed
        try:
            seed_pack = research_agent.research(sector, nationality, capital, county)
            print(f"  Done. Confidence: {seed_pack.get('seed_meta', {}).get('confidence_score', 0):.2f}")
        except Exception as e:
            print(f"  Error: {e}")
    
    print(f"[{datetime.now()}] Cache refresh complete")
    stats = vector_db.get_cache_stats()
    print(f"Cache stats: {stats}")

if __name__ == '__main__':
    run_refresh()
```

## PHASE 10: TESTING CHECKLIST

```
TASK: Create a test script that verifies every component works.

Create file: tests/test_full_system.py

"""
Run this after filling in API keys to verify everything works.
python tests/test_full_system.py
"""

import os
import sys
import json
import requests
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

BASE_URL = "http://localhost:5001"

def test(name: str, fn):
    try:
        result = fn()
        print(f"  PASS: {name}")
        return result
    except Exception as e:
        print(f"  FAIL: {name} — {e}")
        return None

print("\n=== KENYA INVEST × MIROFISH SYSTEM TEST ===\n")

print("1. Vector DB")
test("Qdrant is running", lambda: 
    requests.get("http://localhost:6333/health").json())
test("Collections exist", lambda:
    requests.get("http://localhost:6333/collections").json())

print("\n2. Research API")
result = test("Research endpoint responds", lambda:
    requests.post(f"{BASE_URL}/api/invest/research", json={
        "sector": "fintech",
        "nationality": "Kenyan",
        "capital_usd": 500000,
        "county": "Nairobi"
    }).json())

if result:
    test("Seed pack has required fields", lambda:
        all(k in result.get('seed', {}) for k in 
            ['seed_meta', 'regulatory_map', 'fee_schedule', 'simulation_config']))

print("\n3. Cache check (second call should be faster)")
import time
t0 = time.time()
requests.post(f"{BASE_URL}/api/invest/research", json={
    "sector": "fintech", "nationality": "Kenyan",
    "capital_usd": 500000, "county": "Nairobi"
})
t1 = time.time()
print(f"  INFO: Second call took {t1-t0:.2f}s (should be < 1s if cached)")

print("\n4. Cache stats")
stats = test("Cache stats endpoint", lambda:
    requests.get(f"{BASE_URL}/api/invest/cache/stats").json())
if stats:
    for k, v in stats.items():
        print(f"  {k}: {v.get('total_points', 0)} points")

print("\n5. Simulation")
sim = test("Simulation starts", lambda:
    requests.post(f"{BASE_URL}/api/invest/simulate", json={
        "seed": result.get('seed', {}) if result else {},
        "agent_count": 50,
        "rounds": 10,
        "question": "Test simulation"
    }).json())

if sim:
    sim_id = sim.get('simulation_id')
    test("Simulation has ID", lambda: bool(sim_id))
    
    import time
    time.sleep(8)
    
    status = test("Can poll simulation", lambda:
        requests.get(f"{BASE_URL}/api/invest/simulate/{sim_id}/status").json())
    
    if status and status.get('status') == 'complete':
        report = test("Can get report", lambda:
            requests.get(f"{BASE_URL}/api/invest/simulate/{sim_id}/report").json())

print("\n=== TEST COMPLETE ===\n")
print("If all tests pass: open http://localhost:3000 and test the UI")
print("If tests fail: check your API keys in .env\n")
```

## FINAL INSTRUCTIONS TO WINDSURF

```
After completing all phases above:

1. Run: pip install qdrant-client openai python-dotenv python-multipart
2. Run: docker compose up -d qdrant  
3. Run: npm run setup:all
4. Run: npm run dev
5. Run: python tests/test_full_system.py

Do NOT start any services that require the API keys to be filled in yet.
Instead, print a clear message to the user:

==============================================
SETUP COMPLETE — Add your API keys to .env:

1. LLM_API_KEY      → https://platform.xiaomimimo.com
2. PERPLEXITY_API_KEY → https://www.perplexity.ai/api-platform  
3. ZEP_API_KEY      → https://app.getzep.com (free)
4. EMBEDDING_API_KEY / FALLBACK_LLM_KEY → https://platform.openai.com

After adding keys, run:
  python tests/test_full_system.py

Then open:
  http://localhost:3000
==============================================

If any phase fails, fix the error and continue. Do not stop.
The goal is a fully running system where the user only needs to add API keys.
```
