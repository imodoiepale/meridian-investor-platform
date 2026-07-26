"""Seed the shared demo account used by the login page's "Enter demo workspace" button.

    python backend/scripts/seed_demo_user.py

Requires SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
Re-running is safe: an existing demo user has its password reset to the published one.
"""

import json
import os
import sys
import urllib.error
import urllib.request

DEMO_EMAIL = "demo@meridian.app"
DEMO_PASSWORD = "MeridianDemo2026!"

# Fixed so the browser can write it straight into localStorage on demo sign-in and
# the dashboard finds a populated profile on first paint.
DEMO_SESSION_ID = "demo-session"

DEMO_METADATA = {
    "full_name": "Demo Investor",
    "is_demo": True,
}

# Every field ProfileWizard renders, so the demo account opens on a fully
# populated form rather than blanks. passport_no is duplicated in snake_case
# because backend/agent/tools.py reads that spelling while the wizard binds
# passportNo.
DEMO_PROFILE = {
    # Identity
    "full_name": "Demo Investor",
    "nationality": "United Kingdom",
    "email": DEMO_EMAIL,
    "phone": "+44 20 7946 0812",
    "dob": "1985-04-17",
    "gender": "M",
    "countryOfBirth": "United Kingdom",
    "passportNo": "GBR8471263",
    "passport_no": "GBR8471263",
    "passportIssueDate": "2021-03-08",
    "passportExpiryDate": "2031-03-07",
    "placeOfIssue": "London",
    # Business intent
    "sector": "ict",
    "county": "Nairobi",
    "capital_usd": 250000,
    "company_name": "Meridian Demo Technologies Ltd",
    "timeline": "3-6 months",
    "origin_city": "London",
    "destination_country": "kenya",
    # Kenya address
    "postalAddress": "P.O. Box 46283",
    "postalCode": "00100",
    "city": "Nairobi",
    "subcounty": "Westlands",
    "location": "Parklands",
    "road": "Waiyaki Way",
    "plotNo": "LR 209/1234",
    "nearestLandmark": "ABC Place",
    # Background
    "immigrationStatus": "Class G Investor Permit (pending)",
    "employerName": "Meridian Demo Technologies Ltd",
    "educationLevel": "Masters",
    "profession": "Software Engineer",
    "spouseName": "Amelia Investor",
    "hasCompanyInKenya": True,
}


# Enough progress that the dashboard's stage rail, next-action card, and activity
# feed all have something real to render. Prefixes match STAGE_DEFS in
# InvestorDashboard.vue — identity, immigration, and company are complete, so the
# rail lands on "tax" as the active stage.
DEMO_JOURNEY = [
    {"step": "profile_saved", "at": "2026-07-02T09:14:00Z"},
    {"step": "identity_verified", "at": "2026-07-03T11:02:00Z"},
    {"step": "immigration_class_assessed", "at": "2026-07-06T15:40:00Z"},
    {"step": "immigration_permit_filed", "at": "2026-07-09T08:25:00Z"},
    {"step": "brs_name_reserved", "at": "2026-07-14T10:11:00Z"},
    {"step": "company_incorporated", "at": "2026-07-21T16:30:00Z"},
]


def _env(*names):
    for n in names:
        v = os.environ.get(n)
        if v:
            return v.strip()
    return None


def _load_dotenv():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    path = os.path.join(root, ".env")
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            v = v.strip()
            # Strip " # trailing comment" but leave a bare '#' inside a value alone,
            # since keys and passwords legitimately contain one.
            if not v.startswith(('"', "'")):
                v = v.split(" #", 1)[0].rstrip()
            os.environ.setdefault(k.strip(), v.strip('"').strip("'"))


def _request(method, url, token, payload=None, prefer=None):
    body = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("apikey", token)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    if prefer:
        req.add_header("Prefer", prefer)
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw = res.read().decode()
            return res.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            return exc.code, json.loads(raw)
        except json.JSONDecodeError:
            return exc.code, {"message": raw}


def find_user(base, token):
    status, data = _request(
        "GET", f"{base}/auth/v1/admin/users?page=1&per_page=200", token
    )
    if status >= 400:
        raise SystemExit(f"Could not list users ({status}): {data}")
    for user in data.get("users", []):
        if (user.get("email") or "").lower() == DEMO_EMAIL:
            return user
    return None


def main():
    _load_dotenv()
    base = _env("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL")
    key = _env("SUPABASE_SERVICE_ROLE_KEY")

    if not base or not key:
        sys.exit(
            "Missing credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY "
            "(the service-role key, not the anon key) in .env."
        )
    base = base.rstrip("/")

    existing = find_user(base, key)
    if existing:
        status, data = _request(
            "PUT",
            f"{base}/auth/v1/admin/users/{existing['id']}",
            key,
            {
                "password": DEMO_PASSWORD,
                "email_confirm": True,
                "user_metadata": DEMO_METADATA,
            },
        )
        action = "updated"
    else:
        status, data = _request(
            "POST",
            f"{base}/auth/v1/admin/users",
            key,
            {
                "email": DEMO_EMAIL,
                "password": DEMO_PASSWORD,
                "email_confirm": True,
                "user_metadata": DEMO_METADATA,
            },
        )
        action = "created"

    if status >= 400:
        raise SystemExit(f"Failed to seed demo user ({status}): {data}")

    user_id = data.get("id", existing and existing.get("id"))
    print(f"Demo user {action}: {DEMO_EMAIL} (id={user_id})")

    status, data = _request(
        "POST",
        f"{base}/rest/v1/investor_sessions?on_conflict=session_id",
        key,
        {
            "session_id": DEMO_SESSION_ID,
            "profile": DEMO_PROFILE,
            "journey": DEMO_JOURNEY,
        },
        prefer="resolution=merge-duplicates",
    )
    if status >= 400:
        print(f"  note: Supabase profile row not written ({status}): {data}")
        if data.get("code") == "42P01":
            print("  investor_sessions is missing — apply supabase/migrations first.")
    else:
        print("Demo profile written to Supabase investor_sessions.")

    seed_memory_store()

    print(f"\nSign in with {DEMO_EMAIL} / {DEMO_PASSWORD}")


def seed_memory_store():
    """Also write the profile to whichever store the Flask backend actually reads.

    MEMORY_BACKEND defaults to the local JSON store, which does not look at
    Supabase — without this the demo user signs in to an empty dashboard.
    """
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    try:
        from backend.agent.memory import get_store
    except ImportError as exc:
        print(f"  note: could not seed the local memory store ({exc})")
        return

    store = get_store()
    session = store.get_session(DEMO_SESSION_ID)
    session["profile"] = {**session.get("profile", {}), **DEMO_PROFILE}
    session["journey"] = DEMO_JOURNEY
    store.save_session(DEMO_SESSION_ID, session)
    print(f"Demo profile written to the {os.environ.get('MEMORY_BACKEND', 'json')} memory store.")


if __name__ == "__main__":
    main()
