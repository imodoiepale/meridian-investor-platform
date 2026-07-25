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
from datetime import datetime
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
                    model=os.getenv('PERPLEXITY_MODEL', 'perplexity/sonar-deep-research'),
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

research_agent = InvestmentResearchAgent()
