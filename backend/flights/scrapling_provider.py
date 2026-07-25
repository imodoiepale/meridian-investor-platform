"""Best-effort live Google Flights lookup via Scrapling.
Returns None on any failure so callers can fall back to curated data."""

import re
import threading

try:
    from scrapling.fetchers import StealthyFetcher
    available = True
except ImportError:
    StealthyFetcher = None
    available = False

BUDGET_SECONDS = 8

_AIRLINES = [
    "Kenya Airways", "Emirates", "Qatar Airways", "KLM",
    "British Airways", "Ethiopian Airlines", "Air France",
    "Turkish Airlines", "Lufthansa", "EgyptAir",
]


def _build_url(origin, destination, date, return_date):
    query = f"Flights from {origin} to {destination} on {date}"
    if return_date:
        query += f" returning {return_date}"
    return "https://www.google.com/travel/flights?q=" + query.replace(" ", "%20")


def _parse_offers(text, origin, destination, date):
    offers = []
    prices = re.findall(r"\$\s?([\d,]{2,7})", text)
    seen = set()
    for i, raw in enumerate(prices[:10]):
        price = int(raw.replace(",", ""))
        if price < 100 or price > 20000 or price in seen:
            continue
        seen.add(price)
        airline = next((a for a in _AIRLINES if a in text), "Multiple airlines")
        stops_match = re.search(r"(Nonstop|\d+\s+stop)", text)
        duration_match = re.search(r"(\d{1,2})\s*hr\s*(\d{1,2})?\s*min", text)
        offers.append({
            "id": f"LIVE-{origin}-{destination}-{date}-{i}",
            "origin": origin,
            "destination": destination,
            "airline": airline,
            "flight_number": "",
            "departure_date": date,
            "departure_time": "",
            "stops": 0 if (stops_match and stops_match.group(1) == "Nonstop") else 1,
            "duration": duration_match.group(0) if duration_match else "",
            "price_usd": price,
            "cabin": "economy",
            "leg": "outbound",
        })
    return offers or None


def _fetch(url, result):
    try:
        page = StealthyFetcher.fetch(url, headless=True, network_idle=False, timeout=BUDGET_SECONDS * 1000)
        result["text"] = page.get_all_text() if hasattr(page, "get_all_text") else str(page.body)
    except Exception:
        result["text"] = None


def search_live(origin, destination, date, return_date=None):
    if not available:
        return None
    try:
        origin = (origin or "").strip().upper()
        destination = (destination or "").strip().upper()
        if not origin or not destination:
            return None

        url = _build_url(origin, destination, date, return_date)
        result = {}
        worker = threading.Thread(target=_fetch, args=(url, result), daemon=True)
        worker.start()
        worker.join(BUDGET_SECONDS)
        text = result.get("text")
        if not text:
            return None

        offers = _parse_offers(text, origin, destination, date)
        if not offers:
            return None
        return {"offers": offers, "return_offers": []}
    except Exception:
        return None
