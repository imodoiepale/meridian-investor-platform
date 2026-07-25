"""Supabase service-role client for backend use.

Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from env.
Returns None if either is missing — callers check before use.
"""
import os

_client = None


def get_client():
    global _client
    if _client is not None:
        return _client
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        return None
    try:
        from supabase import create_client
        _client = create_client(url, key)
    except Exception:
        return None
    return _client
