"""Curated flight offers into Kenya. Dates are computed relative to today
so the dataset never looks stale."""

from datetime import datetime, timedelta

KENYA_AIRPORTS = {
    "NBO": {"iata": "NBO", "name": "Jomo Kenyatta International Airport", "city": "Nairobi", "country": "Kenya"},
    "MBA": {"iata": "MBA", "name": "Moi International Airport", "city": "Mombasa", "country": "Kenya"},
}

HUB_CITIES = {
    "JFK": "New York", "LHR": "London", "DXB": "Dubai", "AMS": "Amsterdam",
    "BOM": "Mumbai", "JNB": "Johannesburg", "CDG": "Paris",
    "NBO": "Nairobi", "MBA": "Mombasa",
}

# Outbound legs into Kenya. Each template carries a paired return leg.
FLIGHT_TEMPLATES = [
    {
        "id": "KQ003-JFK-NBO", "origin": "JFK", "destination": "NBO",
        "airline": "Kenya Airways", "flight_number": "KQ 3",
        "depart_time": "12:25", "arrive_time": "10:05", "arrival_day_offset": 1,
        "stops": 0, "duration": "14h 40m", "price_usd": 1185, "cabin": "economy",
        "return": {"flight_number": "KQ 2", "depart_time": "22:59", "arrive_time": "06:35",
                   "arrival_day_offset": 1, "stops": 0, "duration": "15h 36m", "price_usd": 1240},
    },
    {
        "id": "EK202-JFK-NBO", "origin": "JFK", "destination": "NBO",
        "airline": "Emirates", "flight_number": "EK 202",
        "depart_time": "22:20", "arrive_time": "14:35", "arrival_day_offset": 2,
        "stops": 1, "duration": "25h 15m", "price_usd": 1032, "cabin": "economy",
        "return": {"flight_number": "EK 720", "depart_time": "16:45", "arrive_time": "13:25",
                   "arrival_day_offset": 1, "stops": 1, "duration": "27h 40m", "price_usd": 1098},
    },
    {
        "id": "QR704-JFK-NBO", "origin": "JFK", "destination": "NBO",
        "airline": "Qatar Airways", "flight_number": "QR 704",
        "depart_time": "10:00", "arrive_time": "06:10", "arrival_day_offset": 1,
        "stops": 1, "duration": "20h 10m", "price_usd": 976, "cabin": "economy",
        "return": {"flight_number": "QR 1336", "depart_time": "17:50", "arrive_time": "16:20",
                   "arrival_day_offset": 1, "stops": 1, "duration": "22h 30m", "price_usd": 1015},
    },
    {
        "id": "KQ101-LHR-NBO", "origin": "LHR", "destination": "NBO",
        "airline": "Kenya Airways", "flight_number": "KQ 101",
        "depart_time": "20:00", "arrive_time": "06:20", "arrival_day_offset": 1,
        "stops": 0, "duration": "8h 20m", "price_usd": 742, "cabin": "economy",
        "return": {"flight_number": "KQ 100", "depart_time": "09:00", "arrive_time": "15:35",
                   "arrival_day_offset": 0, "stops": 0, "duration": "8h 35m", "price_usd": 768},
    },
    {
        "id": "BA065-LHR-NBO", "origin": "LHR", "destination": "NBO",
        "airline": "British Airways", "flight_number": "BA 65",
        "depart_time": "10:10", "arrive_time": "20:35", "arrival_day_offset": 0,
        "stops": 0, "duration": "8h 25m", "price_usd": 795, "cabin": "economy",
        "return": {"flight_number": "BA 64", "depart_time": "22:10", "arrive_time": "05:00",
                   "arrival_day_offset": 1, "stops": 0, "duration": "8h 50m", "price_usd": 810},
    },
    {
        "id": "ET701-LHR-NBO", "origin": "LHR", "destination": "NBO",
        "airline": "Ethiopian Airlines", "flight_number": "ET 701",
        "depart_time": "21:00", "arrive_time": "09:55", "arrival_day_offset": 1,
        "stops": 1, "duration": "10h 55m", "price_usd": 618, "cabin": "economy",
        "return": {"flight_number": "ET 700", "depart_time": "11:20", "arrive_time": "20:30",
                   "arrival_day_offset": 0, "stops": 1, "duration": "12h 10m", "price_usd": 645},
    },
    {
        "id": "EK719-DXB-NBO", "origin": "DXB", "destination": "NBO",
        "airline": "Emirates", "flight_number": "EK 719",
        "depart_time": "10:35", "arrive_time": "14:35", "arrival_day_offset": 0,
        "stops": 0, "duration": "5h 0m", "price_usd": 486, "cabin": "economy",
        "return": {"flight_number": "EK 720", "depart_time": "16:45", "arrive_time": "22:40",
                   "arrival_day_offset": 0, "stops": 0, "duration": "4h 55m", "price_usd": 502},
    },
    {
        "id": "KQ311-DXB-NBO", "origin": "DXB", "destination": "NBO",
        "airline": "Kenya Airways", "flight_number": "KQ 311",
        "depart_time": "04:35", "arrive_time": "08:30", "arrival_day_offset": 0,
        "stops": 0, "duration": "4h 55m", "price_usd": 439, "cabin": "economy",
        "return": {"flight_number": "KQ 310", "depart_time": "18:30", "arrive_time": "00:25",
                   "arrival_day_offset": 1, "stops": 0, "duration": "4h 55m", "price_usd": 455},
    },
    {
        "id": "KL565-AMS-NBO", "origin": "AMS", "destination": "NBO",
        "airline": "KLM", "flight_number": "KL 565",
        "depart_time": "10:15", "arrive_time": "20:35", "arrival_day_offset": 0,
        "stops": 0, "duration": "8h 20m", "price_usd": 704, "cabin": "economy",
        "return": {"flight_number": "KL 566", "depart_time": "22:30", "arrive_time": "05:50",
                   "arrival_day_offset": 1, "stops": 0, "duration": "9h 20m", "price_usd": 726},
    },
    {
        "id": "KQ117-AMS-NBO", "origin": "AMS", "destination": "NBO",
        "airline": "Kenya Airways", "flight_number": "KQ 117",
        "depart_time": "12:55", "arrive_time": "23:10", "arrival_day_offset": 0,
        "stops": 0, "duration": "8h 15m", "price_usd": 678, "cabin": "economy",
        "return": {"flight_number": "KQ 116", "depart_time": "23:59", "arrive_time": "07:20",
                   "arrival_day_offset": 1, "stops": 0, "duration": "9h 21m", "price_usd": 690},
    },
    {
        "id": "KQ203-BOM-NBO", "origin": "BOM", "destination": "NBO",
        "airline": "Kenya Airways", "flight_number": "KQ 203",
        "depart_time": "06:00", "arrive_time": "10:10", "arrival_day_offset": 0,
        "stops": 0, "duration": "6h 40m", "price_usd": 412, "cabin": "economy",
        "return": {"flight_number": "KQ 202", "depart_time": "19:35", "arrive_time": "04:00",
                   "arrival_day_offset": 1, "stops": 0, "duration": "5h 55m", "price_usd": 428},
    },
    {
        "id": "ET641-BOM-NBO", "origin": "BOM", "destination": "NBO",
        "airline": "Ethiopian Airlines", "flight_number": "ET 641",
        "depart_time": "04:35", "arrive_time": "11:25", "arrival_day_offset": 0,
        "stops": 1, "duration": "9h 20m", "price_usd": 366, "cabin": "economy",
        "return": {"flight_number": "ET 640", "depart_time": "13:00", "arrive_time": "23:55",
                   "arrival_day_offset": 0, "stops": 1, "duration": "8h 25m", "price_usd": 380},
    },
    {
        "id": "KQ761-JNB-NBO", "origin": "JNB", "destination": "NBO",
        "airline": "Kenya Airways", "flight_number": "KQ 761",
        "depart_time": "13:50", "arrive_time": "18:55", "arrival_day_offset": 0,
        "stops": 0, "duration": "4h 5m", "price_usd": 348, "cabin": "economy",
        "return": {"flight_number": "KQ 760", "depart_time": "08:10", "arrive_time": "11:15",
                   "arrival_day_offset": 0, "stops": 0, "duration": "4h 5m", "price_usd": 360},
    },
    {
        "id": "KQ113-CDG-NBO", "origin": "CDG", "destination": "NBO",
        "airline": "Kenya Airways", "flight_number": "KQ 113",
        "depart_time": "11:20", "arrive_time": "21:25", "arrival_day_offset": 0,
        "stops": 0, "duration": "8h 5m", "price_usd": 712, "cabin": "economy",
        "return": {"flight_number": "KQ 112", "depart_time": "23:20", "arrive_time": "06:40",
                   "arrival_day_offset": 1, "stops": 0, "duration": "9h 20m", "price_usd": 735},
    },
    {
        "id": "QR1341-CDG-MBA", "origin": "CDG", "destination": "MBA",
        "airline": "Qatar Airways", "flight_number": "QR 1341",
        "depart_time": "15:55", "arrive_time": "13:20", "arrival_day_offset": 1,
        "stops": 1, "duration": "18h 25m", "price_usd": 824, "cabin": "economy",
        "return": {"flight_number": "QR 1340", "depart_time": "16:35", "arrive_time": "07:05",
                   "arrival_day_offset": 1, "stops": 1, "duration": "17h 30m", "price_usd": 851},
    },
    {
        "id": "EK725-DXB-MBA", "origin": "DXB", "destination": "MBA",
        "airline": "Emirates", "flight_number": "EK 725",
        "depart_time": "09:50", "arrive_time": "14:00", "arrival_day_offset": 0,
        "stops": 0, "duration": "5h 10m", "price_usd": 512, "cabin": "economy",
        "return": {"flight_number": "EK 726", "depart_time": "16:10", "arrive_time": "22:15",
                   "arrival_day_offset": 0, "stops": 0, "duration": "5h 5m", "price_usd": 528},
    },
    {
        "id": "ET809-LHR-MBA", "origin": "LHR", "destination": "MBA",
        "airline": "Ethiopian Airlines", "flight_number": "ET 809",
        "depart_time": "20:30", "arrive_time": "12:15", "arrival_day_offset": 1,
        "stops": 1, "duration": "12h 45m", "price_usd": 689, "cabin": "economy",
        "return": {"flight_number": "ET 808", "depart_time": "14:05", "arrive_time": "05:40",
                   "arrival_day_offset": 1, "stops": 1, "duration": "18h 35m", "price_usd": 705},
    },
]


def _parse_date(value, default_offset_days):
    today = datetime.now().date()
    if not value:
        return today + timedelta(days=default_offset_days)
    try:
        parsed = datetime.strptime(str(value)[:10], "%Y-%m-%d").date()
    except ValueError:
        return today + timedelta(days=default_offset_days)
    if parsed < today:
        parsed = today + timedelta(days=default_offset_days)
    return parsed


def _price_for_date(base_price, travel_date):
    days_out = (travel_date - datetime.now().date()).days
    if days_out <= 3:
        factor = 1.35
    elif days_out <= 7:
        factor = 1.18
    elif days_out <= 21:
        factor = 1.0
    elif days_out <= 60:
        factor = 0.94
    else:
        factor = 0.90
    return int(round(base_price * factor))


def _build_offer(template, travel_date, leg="outbound"):
    src = template if leg == "outbound" else template["return"]
    origin = template["origin"] if leg == "outbound" else template["destination"]
    destination = template["destination"] if leg == "outbound" else template["origin"]
    arrive_date = travel_date + timedelta(days=src.get("arrival_day_offset", 0))
    return {
        "id": f"{template['id']}-{leg[:3].upper()}-{travel_date.isoformat()}",
        "origin": origin,
        "origin_city": HUB_CITIES.get(origin, origin),
        "destination": destination,
        "destination_city": HUB_CITIES.get(destination, destination),
        "airline": template["airline"],
        "flight_number": src["flight_number"],
        "departure_date": travel_date.isoformat(),
        "departure_time": src["depart_time"],
        "arrival_date": arrive_date.isoformat(),
        "arrival_time": src["arrive_time"],
        "stops": src["stops"],
        "duration": src["duration"],
        "price_usd": _price_for_date(src["price_usd"], travel_date),
        "cabin": template.get("cabin", "economy"),
        "leg": leg,
    }


def search_curated(origin, destination, date, return_date=None, trip_type="one_way"):
    origin = (origin or "").strip().upper()
    destination = (destination or "").strip().upper()

    depart = _parse_date(date, default_offset_days=14)
    matches = [
        t for t in FLIGHT_TEMPLATES
        if (not origin or t["origin"] == origin)
        and (not destination or t["destination"] == destination)
    ]
    # Reverse direction requested (out of Kenya): serve the return legs as outbound.
    reversed_direction = False
    if not matches and origin in KENYA_AIRPORTS:
        matches = [
            t for t in FLIGHT_TEMPLATES
            if t["destination"] == origin
            and (not destination or t["origin"] == destination)
        ]
        reversed_direction = True

    outbound_leg = "return" if reversed_direction else "outbound"
    offers = sorted(
        (_build_offer(t, depart, leg=outbound_leg) for t in matches),
        key=lambda o: o["price_usd"],
    )
    for o in offers:
        o["leg"] = "outbound"

    return_offers = []
    if trip_type == "return":
        ret = _parse_date(return_date, default_offset_days=21)
        if ret <= depart:
            ret = depart + timedelta(days=7)
        inbound_leg = "outbound" if reversed_direction else "return"
        return_offers = sorted(
            (_build_offer(t, ret, leg=inbound_leg) for t in matches),
            key=lambda o: o["price_usd"],
        )
        for o in return_offers:
            o["leg"] = "return"

    return {"offers": offers, "return_offers": return_offers}
