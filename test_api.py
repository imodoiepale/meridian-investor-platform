"""Quick test of the Kenya Invest API"""
import requests
import json

BASE_URL = "http://localhost:5001"

print("\n" + "="*60)
print("Testing Kenya Invest API")
print("="*60 + "\n")

# Test 1: Health check
print("1. Health check...")
try:
    response = requests.get(f"{BASE_URL}/health")
    print(f"   ✅ Status: {response.status_code}")
    print(f"   Response: {response.json()}\n")
except Exception as e:
    print(f"   ❌ Error: {e}\n")

# Test 2: Research endpoint
print("2. Research endpoint (this will take 2-3 minutes if cache miss)...")
try:
    payload = {
        "sector": "fintech",
        "nationality": "Kenyan",
        "capital_usd": 500000,
        "county": "Nairobi"
    }
    
    print(f"   Request: {json.dumps(payload, indent=2)}")
    response = requests.post(
        f"{BASE_URL}/api/invest/research",
        json=payload,
        timeout=180  # 3 minute timeout for Perplexity deep research
    )
    
    print(f"   ✅ Status: {response.status_code}")
    result = response.json()
    
    if 'seed' in result:
        print(f"   ✅ Seed pack generated!")
        print(f"   Seed meta: {json.dumps(result['seed'].get('seed_meta', {}), indent=2)}")
        print(f"   Regulatory map agencies: {result['seed'].get('regulatory_map', {}).get('required_agencies', [])}")
    else:
        print(f"   Response: {json.dumps(result, indent=2)}")
        
except Exception as e:
    print(f"   ❌ Error: {e}\n")

# Test 3: Cache stats
print("\n3. Cache stats...")
try:
    response = requests.get(f"{BASE_URL}/api/invest/cache/stats")
    print(f"   ✅ Status: {response.status_code}")
    print(f"   Cache stats: {json.dumps(response.json(), indent=2)}\n")
except Exception as e:
    print(f"   ❌ Error: {e}\n")

print("="*60)
print("Testing complete!")
print("="*60 + "\n")
