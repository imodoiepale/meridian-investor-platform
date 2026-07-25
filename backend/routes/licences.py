"""Licence catalog API.

Serves the sector-tagged Kenya licence catalog produced by
backend/scripts/build_licence_catalog.py so the frontend and the roadmap
builder surface only the permits a given investor actually needs.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from flask import Blueprint, jsonify, request

licences_bp = Blueprint("licences", __name__, url_prefix="/api/licences")

CATALOG_PATH = Path(__file__).resolve().parents[1] / "data" / "kenya_licences.json"


@lru_cache(maxsize=1)
def _catalog() -> list[dict]:
    if not CATALOG_PATH.exists():
        return []
    return json.loads(CATALOG_PATH.read_text(encoding="utf-8"))


def resolve_for_sector(sector: str | None, level: str | None = None) -> list[dict]:
    """Universal licences plus anything tagged for `sector`.

    An unknown or empty sector returns the universal set only — better to show
    the investor a short accurate list than a wrong long one.
    """
    rows = _catalog()
    key = (sector or "").strip().lower().replace(" ", "_").replace("-", "_")

    matched = [r for r in rows if r["universal"] or (key and key in r["sectors"])]

    if level:
        want = level.strip().lower()
        matched = [r for r in matched if want in r["level"].lower()]

    # Universal first, then original catalog order.
    return sorted(matched, key=lambda r: (not r["universal"], r["no"]))


@licences_bp.get("")
def list_licences():
    sector = request.args.get("sector")
    level = request.args.get("level")
    category = request.args.get("category")
    q = (request.args.get("q") or "").strip().lower()

    rows = resolve_for_sector(sector, level) if sector else _catalog()

    if category:
        rows = [r for r in rows if r["category"].lower() == category.lower()]

    if q:
        rows = [
            r for r in rows
            if q in r["name"].lower()
            or q in r["agency"].lower()
            or q in r["agency_abbr"].lower()
            or q in r["applies_to"].lower()
        ]

    return jsonify({
        "count": len(rows),
        "sector": sector,
        "licences": rows,
    })


@licences_bp.get("/meta")
def meta():
    rows = _catalog()
    categories = sorted({r["category"] for r in rows})
    sectors = sorted({s for r in rows for s in r["sectors"]})
    return jsonify({
        "total": len(rows),
        "universal": sum(1 for r in rows if r["universal"]),
        "categories": categories,
        "sectors": sectors,
        "levels": sorted({r["level"] for r in rows}),
    })


@licences_bp.get("/<licence_id>")
def get_licence(licence_id: str):
    for row in _catalog():
        if row["id"] == licence_id:
            return jsonify(row)
    return jsonify({"error": "not found"}), 404
