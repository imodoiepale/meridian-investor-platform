"""Tool definitions + executors for the Meridian investor agent.

Every tool reads from the active country adapter (backend/countries/<iso>.json),
so adding a country = adding an adapter file + portal automations.
"""
import json
import os
from datetime import datetime

import requests

from backend.agent.memory import memory

AUTOMATIONS_URL = os.environ.get("AUTOMATIONS_URL", "http://localhost:5000")
_COUNTRIES_DIR = os.path.join(os.path.dirname(__file__), "..", "countries")
_INVOICE_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "invoices")


def load_country(country="kenya"):
    path = os.path.join(_COUNTRIES_DIR, f"{country.lower()}.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


TOOLS = [
    {
        "name": "update_investor_profile",
        "description": "Save facts about the investor as you learn them (nationality, sector, capital, county, passport details, company name, contact). Call this whenever the investor shares new information.",
        "input_schema": {"type": "object", "properties": {
            "full_name": {"type": "string"}, "nationality": {"type": "string"},
            "passport_no": {"type": "string"}, "email": {"type": "string"},
            "phone": {"type": "string"}, "sector": {"type": "string"},
            "capital_usd": {"type": "number"}, "county": {"type": "string"},
            "company_name": {"type": "string"}, "origin_city": {"type": "string"},
            "destination_country": {"type": "string"}}, "properties_extra": {}, "required": []}
    },
    {
        "name": "search_flights",
        "description": "Search one-way or return flights into the destination country (live scrape with curated fallback).",
        "input_schema": {"type": "object", "properties": {
            "origin": {"type": "string", "description": "Origin IATA, e.g. JFK"},
            "destination": {"type": "string", "description": "Destination IATA, e.g. NBO"},
            "depart_date": {"type": "string", "description": "YYYY-MM-DD"},
            "return_date": {"type": "string", "description": "YYYY-MM-DD, omit for one-way"},
            "trip_type": {"type": "string", "enum": ["one_way", "return"]}},
            "required": ["origin", "destination", "depart_date"]}
    },
    {
        "name": "advise_immigration_class",
        "description": "Get the destination country's full immigration class catalogue (fees, validity, requirements, processing time) so you can write a tailored recommendation proposal for the investor.",
        "input_schema": {"type": "object", "properties": {
            "country": {"type": "string", "default": "kenya"}}, "required": []}
    },
    {
        "name": "apply_immigration",
        "description": "Launch the live browser automation that files an immigration application on the government eFNS portal (eTA, class-g, class-d, class-r, class-n, special-pass, dependant-pass). Opens a visible browser and fills the real form from the investor profile. Requires portal credentials in env.",
        "input_schema": {"type": "object", "properties": {
            "application_type": {"type": "string", "enum": ["eta", "class-g", "class-d", "class-r", "class-n", "special-pass", "dependant-pass"]},
            "form_overrides": {"type": "object", "description": "Extra/override form fields"}},
            "required": ["application_type"]}
    },
    {
        "name": "build_licensing_roadmap",
        "description": "Build the full business-setup roadmap for a sector + county: national registrations, sector licenses, county permits, each with fees and timelines, plus an itemized total budget.",
        "input_schema": {"type": "object", "properties": {
            "sector": {"type": "string"}, "county": {"type": "string"},
            "country": {"type": "string", "default": "kenya"}}, "required": ["sector", "county"]}
    },
    {
        "name": "market_gap_research",
        "description": "Get market-gap intelligence for a sector: underserved niches, recommended counties/locations, and location-specific licensing notes.",
        "input_schema": {"type": "object", "properties": {
            "sector": {"type": "string"}, "country": {"type": "string", "default": "kenya"}},
            "required": ["sector"]}
    },
    {
        "name": "run_registration_automation",
        "description": "Launch live browser automation for statutory registrations: 'brs' (company registration retrieval), 'nssf' (NSSF registration), 'sha' (SHA employer registration).",
        "input_schema": {"type": "object", "properties": {
            "registration": {"type": "string", "enum": ["brs", "nssf", "sha"]},
            "payload": {"type": "object", "description": "Registration-specific fields"}},
            "required": ["registration"]}
    },
    {
        "name": "get_hiring_pack",
        "description": "Get local salary bands and statutory employer obligations so you can generate market-accurate job descriptions and a hiring compliance checklist.",
        "input_schema": {"type": "object", "properties": {
            "roles": {"type": "array", "items": {"type": "string"}},
            "country": {"type": "string", "default": "kenya"}}, "required": []}
    },
    {
        "name": "list_agents",
        "description": "List vetted human professionals (immigration consultants, licensing advisors, legal, HR) the investor can hire instead of self-serving.",
        "input_schema": {"type": "object", "properties": {
            "specialty": {"type": "string", "description": "Filter, e.g. 'immigration'"},
            "country": {"type": "string", "default": "kenya"}}, "required": []}
    },
    {
        "name": "book_park",
        "description": "Book a national park visit: computes price (16% VAT), creates the invoice/ticket and emails it to the investor (or saves it locally if email is not configured). Also lists parks when called without a park name.",
        "input_schema": {"type": "object", "properties": {
            "park_name": {"type": "string"}, "visit_date": {"type": "string"},
            "adults": {"type": "integer", "default": 1}, "children": {"type": "integer", "default": 0},
            "email": {"type": "string"}}, "required": []}
    }
]


def _post_automation(path, payload, timeout=15):
    """Fire-and-report: automations run long; we confirm launch, jobs stream on :5000."""
    try:
        r = requests.post(f"{AUTOMATIONS_URL}{path}", json=payload, timeout=timeout)
        return r.json() if r.headers.get("content-type", "").startswith("application/json") else {"status": r.status_code, "body": r.text[:500]}
    except requests.exceptions.ReadTimeout:
        return {"success": True, "status": "launched", "note": "Automation launched; browser is running. Progress at " + AUTOMATIONS_URL + path}
    except requests.exceptions.ConnectionError:
        return {"success": False, "error": f"Automations service not running at {AUTOMATIONS_URL}. Start it: node automations/server.mjs"}


def execute_tool(name, args, session_id):
    country = load_country(args.get("country", "kenya") if isinstance(args, dict) else "kenya")

    if name == "update_investor_profile":
        profile = memory.update_profile(session_id, args)
        return {"saved": True, "profile": profile}

    if name == "search_flights":
        from backend.flights import search as flight_search
        result = flight_search(
            origin=args["origin"], destination=args.get("destination", "NBO"),
            depart_date=args["depart_date"], return_date=args.get("return_date"),
            trip_type=args.get("trip_type", "return" if args.get("return_date") else "one_way"))
        memory.log_journey(session_id, {"step": "flights_searched", "at": datetime.now().isoformat(), "args": args})
        return result

    if name == "advise_immigration_class":
        return {"country": country["country"], "eta": country["entry"]["eta"],
                "classes": country["immigration_classes"],
                "instruction": "Compare against the investor's profile (purpose, capital, employment status) and produce a written proposal: recommended class, why, total cost in KES and USD, timeline, document checklist, and the automation we can run for them."}

    if name == "apply_immigration":
        app_type = args["application_type"]
        endpoint = next((c.get("automation_endpoint") for c in country["immigration_classes"]
                         if c["class"].lower().replace(" ", "-") == app_type or c.get("automation_endpoint", "").endswith(app_type)),
                        f"/api/{app_type}")
        profile = memory.get_session(session_id).get("profile", {})
        payload = {
            "url": "https://fns.immigration.go.ke/account/login.html",
            "login": {"email": os.environ.get("EFNS_EMAIL", ""),
                      "idNumber": os.environ.get("EFNS_ID_NUMBER", ""),
                      "password": os.environ.get("EFNS_PASSWORD", "")},
            "formData": {**{k: v for k, v in profile.items()}, **args.get("form_overrides", {})}
        }
        if not payload["login"]["email"]:
            return {"success": False, "error": "EFNS_EMAIL / EFNS_ID_NUMBER / EFNS_PASSWORD not set in environment"}
        result = _post_automation(endpoint, payload)
        memory.log_journey(session_id, {"step": f"immigration_{app_type}", "at": datetime.now().isoformat(), "result": result.get("status", result.get("success"))})
        return result

    if name == "build_licensing_roadmap":
        sector = args["sector"].lower()
        county = args["county"]
        setup = country["business_setup"]
        licenses = country["industry_licenses"].get(sector, [])
        county_info = country["county_notes"].get(county.title(), {"permit_multiplier": 1.0, "note": "Standard county fees"})
        mult = county_info["permit_multiplier"]
        base_permit = 15000 * mult
        steps, total = [], 0
        for key, s in setup.items():
            fee = s.get("fee_kes", sum(s.get("fee_kes_range", [0, 0])) / 2 * (mult if key == "county_business_permit" else 1))
            steps.append({"phase": "national" if key != "county_business_permit" else "county",
                          "step": key, "agency": s["agency"], "fee_kes": round(fee), "days": s["days"],
                          "automated": "automation_endpoint" in s})
            total += fee
        for lic in licenses:
            fee = lic.get("fee_kes", sum(lic.get("fee_kes_range", [0, 0])) / 2)
            steps.append({"phase": "sector", "step": lic["license"], "fee_kes": fee, "days": lic["days"], "automated": False})
            total += fee
        roadmap = {"sector": sector, "county": county, "county_note": county_info["note"],
                   "steps": steps, "total_budget_kes": round(total),
                   "total_budget_usd": round(total / country["fx_usd_kes"], 2),
                   "estimated_permit_kes": round(base_permit)}
        memory.log_journey(session_id, {"step": "roadmap_built", "at": datetime.now().isoformat(), "sector": sector, "county": county})
        return roadmap

    if name == "market_gap_research":
        sector = args["sector"].lower()
        gap = country["market_gaps"].get(sector, "No curated gap analysis for this sector; recommend running deep research.")
        return {"sector": sector, "gap_analysis": gap, "county_options": country["county_notes"],
                "deep_research_available": True,
                "note": "Deep research (Claude web-search via /api/invest/research) can expand this with live sources."}

    if name == "run_registration_automation":
        reg = args["registration"]
        result = _post_automation(f"/api/{reg}", args.get("payload", {}))
        memory.log_journey(session_id, {"step": f"registration_{reg}", "at": datetime.now().isoformat()})
        return result

    if name == "get_hiring_pack":
        return {"statutory_obligations": country["hiring"]["statutory"],
                "salary_bands_kes": country["hiring"]["salary_bands_kes"],
                "instruction": "Generate complete, Kenya-ready job descriptions for the requested roles: title, responsibilities, requirements, salary range from the bands, and statutory notes."}

    if name == "list_agents":
        agents = country["agents_marketplace"]
        spec = (args.get("specialty") or "").lower()
        if spec:
            agents = [a for a in agents if spec in a["specialty"].lower()] or agents
        return {"agents": agents}

    if name == "book_park":
        parks = country["parks"]
        if not args.get("park_name"):
            return {"parks": parks}
        park = next((p for p in parks if args["park_name"].lower() in p["name"].lower()), None)
        if not park:
            return {"error": "Park not found", "parks": [p["name"] for p in parks]}
        adults, children = args.get("adults", 1), args.get("children", 0)
        subtotal = adults * park["price_adult_kes"] + children * park["price_child_kes"]
        vat = round(subtotal * 0.16)
        total = subtotal + vat
        booking_id = f"MER-{datetime.now().strftime('%y%m%d%H%M%S')}"
        profile = memory.get_session(session_id).get("profile", {})
        email = args.get("email") or profile.get("email", "")
        invoice = _make_invoice(booking_id, park, args.get("visit_date", "TBD"), adults, children, subtotal, vat, total, profile.get("full_name", "Guest"), email)
        emailed = _send_invoice_email(email, booking_id, invoice) if email else False
        memory.log_journey(session_id, {"step": "park_booked", "at": datetime.now().isoformat(), "booking_id": booking_id, "park": park["name"]})
        return {"booking_id": booking_id, "park": park["name"], "visit_date": args.get("visit_date", "TBD"),
                "adults": adults, "children": children, "subtotal_kes": subtotal, "vat_16_kes": vat,
                "total_kes": total, "invoice_emailed": emailed, "email": email,
                "invoice_path": invoice}

    return {"error": f"Unknown tool {name}"}


def _make_invoice(booking_id, park, date, adults, children, subtotal, vat, total, name, email):
    os.makedirs(_INVOICE_DIR, exist_ok=True)
    html = f"""<html><body style="font-family:Arial;max-width:640px;margin:auto">
<h1 style="color:#0d6b3f">Meridian × KWS — Booking Confirmation</h1>
<p><b>Booking:</b> {booking_id}<br><b>Guest:</b> {name} ({email})</p>
<table border=1 cellpadding=8 style="border-collapse:collapse;width:100%">
<tr><th align=left>Park</th><td>{park['name']}</td></tr>
<tr><th align=left>Visit date</th><td>{date}</td></tr>
<tr><th align=left>Adults × {adults}</th><td>KES {adults * park['price_adult_kes']:,}</td></tr>
<tr><th align=left>Children × {children}</th><td>KES {children * park['price_child_kes']:,}</td></tr>
<tr><th align=left>VAT 16%</th><td>KES {vat:,}</td></tr>
<tr><th align=left><b>Total</b></th><td><b>KES {total:,}</b></td></tr>
</table>
<p>Present this booking ID at the gate. Karibu Kenya!</p></body></html>"""
    path = os.path.join(_INVOICE_DIR, f"{booking_id}.html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    return path


def _send_invoice_email(email, booking_id, invoice_path):
    key = os.environ.get("RESEND_API_KEY")
    if not key or not email:
        return False
    try:
        with open(invoice_path, "r", encoding="utf-8") as f:
            html = f.read()
        r = requests.post("https://api.resend.com/emails",
                          headers={"Authorization": f"Bearer {key}"},
                          json={"from": "Meridian <onboarding@resend.dev>", "to": [email],
                                "subject": f"Your KWS park ticket — {booking_id}", "html": html},
                          timeout=10)
        return r.status_code in (200, 201)
    except Exception:
        return False
