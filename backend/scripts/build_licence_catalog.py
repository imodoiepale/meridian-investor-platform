"""Tag the raw Kenya licence list with sectors so the roadmap builder can pull
only what a given investor actually needs.

Input : backend/data/kenya_licences_raw.json  (100 rows, as supplied)
Output: backend/data/kenya_licences.json      (same rows + slug/sectors/universal)

Re-run after editing the raw list or the mappings below:
    python backend/scripts/build_licence_catalog.py
"""

from __future__ import annotations

import json
import re
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "data"
RAW = DATA / "kenya_licences_raw.json"
OUT = DATA / "kenya_licences.json"

# Canonical sector list. Keep in sync with the sector picker in ProfileWizard.
SECTORS = [
    "agriculture",
    "construction",
    "education",
    "energy",
    "financial_services",
    "health",
    "hospitality",
    "ict",
    "logistics",
    "manufacturing",
    "media",
    "mining",
    "professional_services",
    "retail",
]

# Every business needs these regardless of what it does.
UNIVERSAL_CATEGORIES = {"Registration & Tax", "County", "Labour & Employment"}

# Category -> sectors that require it.
CATEGORY_SECTORS = {
    "Financial Services": ["financial_services"],
    "Food & Agriculture": ["agriculture", "manufacturing", "retail", "hospitality"],
    "Health & Pharma": ["health"],
    "Environment & Natural Resources": ["agriculture", "construction", "energy", "manufacturing", "mining"],
    "Transport": ["logistics"],
    "Construction & Professions": ["construction", "professional_services"],
    "Communications & ICT": ["ict", "media"],
    "Energy & Petroleum": ["energy"],
    "Tourism & Hospitality": ["hospitality"],
    "Gaming & Media": ["media"],
    "Security & Safety": ["construction", "hospitality", "logistics", "manufacturing"],
    "Intellectual Property": ["ict", "manufacturing", "media"],
    "Non-Profit": ["education"],
    "Standards & Quality": ["agriculture", "health", "manufacturing", "retail"],
    "Trade": ["logistics", "manufacturing", "retail"],
}

# Name-level overrides for rows the category alone gets wrong. Matched as a
# case-insensitive substring against the licence name.
NAME_OVERRIDES = {
    "mining": ["mining"],
    "petroleum": ["energy", "mining"],
    "geothermal": ["energy"],
    "school": ["education"],
    "university": ["education"],
    "tvet": ["education"],
    "film": ["media"],
    "broadcast": ["media"],
    "tourism": ["hospitality"],
    "hotel": ["hospitality"],
    "liquor": ["hospitality", "retail"],
    "pharmac": ["health"],
    "medical": ["health"],
    "clinic": ["health"],
    "insurance": ["financial_services"],
    "bank": ["financial_services"],
    "sacco": ["financial_services"],
    "capital markets": ["financial_services"],
    "money remittance": ["financial_services"],
    "psv": ["logistics"],
    "transport": ["logistics"],
    "freight": ["logistics"],
    "customs": ["logistics", "retail"],
    "warehouse": ["logistics", "retail"],
    "construction": ["construction"],
    "architect": ["construction", "professional_services"],
    "engineer": ["construction", "professional_services"],
    "quantity survey": ["construction", "professional_services"],
    "nca ": ["construction"],
    "seed": ["agriculture"],
    "fertiliz": ["agriculture"],
    "veterinar": ["agriculture", "health"],
    "fish": ["agriculture"],
    "dairy": ["agriculture", "manufacturing"],
    "tea ": ["agriculture"],
    "coffee": ["agriculture"],
    "horticultur": ["agriculture"],
    "food": ["agriculture", "hospitality", "manufacturing", "retail"],
}


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return re.sub(r"-{2,}", "-", s)


def build() -> list[dict]:
    rows = json.loads(RAW.read_text(encoding="utf-8"))
    out: list[dict] = []
    seen_slugs: set[str] = set()

    for row in rows:
        name = row["License/Permit/Certificate Name"]
        category = row["Category"]

        slug = slugify(name)
        while slug in seen_slugs:
            slug = f"{slug}-{row['No']}"
        seen_slugs.add(slug)

        universal = category in UNIVERSAL_CATEGORIES

        sectors: set[str] = set() if universal else set(CATEGORY_SECTORS.get(category, []))
        haystack = f"{name} {row.get('Who Needs It / Applies To', '')}".lower()
        for needle, tags in NAME_OVERRIDES.items():
            if needle in haystack:
                sectors.update(tags)

        # A non-universal licence with no sector match applies to everyone in
        # its category rather than nobody — safer to over-surface than to hide.
        if not universal and not sectors:
            sectors = set(SECTORS)

        out.append({
            "id": slug,
            "no": int(row["No"]),
            "name": name,
            "category": category,
            "agency": row["Issuing Agency"],
            "agency_abbr": row.get("Agency Abbreviation", ""),
            "level": row["Level"],
            "applies_to": row.get("Who Needs It / Applies To", ""),
            "notes": row.get("Notes", ""),
            "universal": universal,
            "sectors": sorted(sectors),
        })

    return out


def main() -> None:
    catalog = build()
    OUT.write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")

    universal = sum(1 for c in catalog if c["universal"])
    print(f"wrote {len(catalog)} licences -> {OUT}")
    print(f"  universal: {universal}")
    for sector in SECTORS:
        n = sum(1 for c in catalog if sector in c["sectors"])
        print(f"  {sector:22} {n + universal:3} ({n} sector-specific + {universal} universal)")


if __name__ == "__main__":
    main()
