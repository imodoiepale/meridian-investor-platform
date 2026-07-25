"""Maps stored investor profile fields → eFNS portal formData shapes.

The stored profile has: full_name, nationality, passport_no, email, phone, sector,
capital_usd, county, company_name, origin_city, destination_country,
plus Phase-2 wizard fields: dob, gender, countryOfBirth, passportIssueDate,
passportExpiryDate, placeOfIssue, postalAddress, postalCode, city, subcounty,
location, road, plotNo, nearestLandmark, immigrationStatus, employerName,
educationLevel, profession, spouseName, hasCompanyInKenya.
"""
import json
import os

# County name → eFNS countyId integer (from eFNS portal select options)
_COUNTY_IDS = {
    "nairobi": 1, "mombasa": 2, "kwale": 3, "kilifi": 4, "tana river": 5,
    "lamu": 6, "taita taveta": 7, "garissa": 8, "wajir": 9, "mandera": 10,
    "marsabit": 11, "isiolo": 12, "meru": 13, "tharaka nithi": 14, "embu": 15,
    "kitui": 16, "machakos": 17, "makueni": 18, "nyandarua": 19, "nyeri": 20,
    "kirinyaga": 21, "murang'a": 22, "kiambu": 23, "turkana": 24, "west pokot": 25,
    "samburu": 26, "trans nzoia": 27, "uasin gishu": 28, "elgeyo marakwet": 29,
    "nandi": 30, "baringo": 31, "laikipia": 32, "nakuru": 33, "narok": 34,
    "kajiado": 35, "kericho": 36, "bomet": 37, "kakamega": 38, "vihiga": 39,
    "bungoma": 40, "busia": 41, "siaya": 42, "kisumu": 43, "homa bay": 44,
    "migori": 45, "kisii": 46, "nyamira": 47,
}

_GENDER_IDS = {"m": 1, "male": 1, "f": 2, "female": 2, "other": 3}
_EDU_IDS = {
    "primary": 1, "secondary": 2, "certificate": 3, "diploma": 4,
    "degree": 5, "masters": 6, "phd": 7,
}


def profile_to_class_g(profile: dict, overrides: dict = None) -> dict:
    """Build class-G formData from investor profile. Returns {formData, missing_required}."""
    overrides = overrides or {}
    p = {**profile, **overrides}

    county_id = _COUNTY_IDS.get((p.get("county") or "").lower())
    gender_id = _GENDER_IDS.get((p.get("gender") or "").lower())
    edu_id = _EDU_IDS.get((p.get("educationLevel") or "").lower())

    # Split full_name
    name_parts = (p.get("full_name") or "").split(None, 1)
    surname = name_parts[0] if name_parts else ""
    other_names = name_parts[1] if len(name_parts) > 1 else ""

    form_data = {
        "surname": surname,
        "otherNames": other_names,
        "countryOfBirth": p.get("countryOfBirth") or p.get("nationality"),
        "dob": p.get("dob"),
        "genderId": gender_id,
        "presentNationality": p.get("nationality"),
        "passportNo": p.get("passport_no"),
        "passportIssueDate": p.get("passportIssueDate"),
        "passportExpiryDate": p.get("passportExpiryDate"),
        "placeOfIssue": p.get("placeOfIssue"),
        "emailAddress": p.get("email"),
        "phoneNumber": p.get("phone"),
        "postalAddress": p.get("postalAddress"),
        "postalCode": p.get("postalCode"),
        "city": p.get("city"),
        "countyId": county_id,
        "subcounty": p.get("subcounty"),
        "location": p.get("location"),
        "road": p.get("road"),
        "plotNo": p.get("plotNo"),
        "nearestLandmark": p.get("nearestLandmark"),
        "immigrationStatus": p.get("immigrationStatus"),
        "employerName": p.get("company_name") or p.get("employerName"),
        "educationLevel": edu_id,
        "profession": p.get("profession") or p.get("sector"),
        "spouseName": p.get("spouseName"),
        "applicationDuration": "2years",
        "preferredDuration": "2 years",
        "declinedApplication": "No",
    }

    required = ["surname", "dob", "genderId", "presentNationality",
                 "passportNo", "passportExpiryDate", "emailAddress", "countyId"]
    missing = [f for f in required if not form_data.get(f)]

    return {"formData": form_data, "missing_required": missing}


def profile_to_eta(profile: dict, overrides: dict = None) -> dict:
    overrides = overrides or {}
    p = {**profile, **overrides}
    name_parts = (p.get("full_name") or "").split(None, 1)
    return {
        "formData": {
            "surname": name_parts[0] if name_parts else "",
            "givenNames": name_parts[1] if len(name_parts) > 1 else "",
            "nationality": p.get("nationality"),
            "passportNo": p.get("passport_no"),
            "passportExpiryDate": p.get("passportExpiryDate"),
            "email": p.get("email"),
            "phone": p.get("phone"),
            "purposeOfVisit": "Business / Investment prospecting",
        },
        "missing_required": [f for f in ["nationality", "passportNo", "email"] if not p.get(f)]
    }


_MAPPERS = {
    "class-g": profile_to_class_g,
    "class-d": profile_to_class_g,
    "class-r": profile_to_class_g,
    "class-n": profile_to_class_g,
    "special-pass": profile_to_class_g,
    "dependant-pass": profile_to_class_g,
    "eta": profile_to_eta,
}


def map_profile(class_code: str, profile: dict, overrides: dict = None) -> dict:
    mapper = _MAPPERS.get(class_code, profile_to_class_g)
    return mapper(profile, overrides)
