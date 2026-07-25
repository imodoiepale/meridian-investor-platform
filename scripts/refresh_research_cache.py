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
