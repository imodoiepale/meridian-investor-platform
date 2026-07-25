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

DEMO_METADATA = {
    "full_name": "Demo Investor",
    "is_demo": True,
}

DEMO_PROFILE = {
    "full_name": "Demo Investor",
    "nationality": "United Kingdom",
    "email": DEMO_EMAIL,
    "sector": "ict",
    "county": "Nairobi",
    "capital_usd": 250000,
    "company_name": "Meridian Demo Technologies Ltd",
    "origin_city": "London",
    "destination_country": "kenya",
}


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
            os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def _request(method, url, token, payload=None):
    body = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("apikey", token)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
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
            "session_id": f"demo-{user_id}",
            "profile": DEMO_PROFILE,
            "journey": [],
        },
    )
    if status >= 400:
        print(f"  note: demo profile row not written ({status}): {data}")
        print("  run the migration in supabase/migrations first if the table is missing.")
    else:
        print("Demo investor profile seeded.")

    print(f"\nSign in with {DEMO_EMAIL} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    main()
