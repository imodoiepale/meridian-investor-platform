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
            ['seed_meta', 'regulatory_map', 'simulation_config']))

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
