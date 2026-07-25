from flask import Blueprint, request, jsonify
from backend.flights.curated_data import search_curated, KENYA_AIRPORTS
from backend.flights import scrapling_provider

flights_bp = Blueprint('flights', __name__, url_prefix='/api/flights')

VALID_TRIP_TYPES = {'one_way', 'return'}


def _extract_params():
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
    else:
        data = request.args
    return {
        'origin': (data.get('origin') or '').strip().upper(),
        'destination': (data.get('destination') or '').strip().upper(),
        'depart_date': data.get('depart_date') or data.get('date'),
        'return_date': data.get('return_date'),
        'trip_type': (data.get('trip_type') or 'one_way').strip().lower(),
    }


@flights_bp.route('/search', methods=['GET', 'POST'])
def search_flights():
    p = _extract_params()

    if not p['origin'] or not p['destination']:
        return jsonify({"error": "origin and destination (IATA codes) are required"}), 400
    if len(p['origin']) != 3 or len(p['destination']) != 3:
        return jsonify({"error": "origin and destination must be 3-letter IATA codes"}), 400
    if p['trip_type'] not in VALID_TRIP_TYPES:
        return jsonify({"error": f"trip_type must be one of {sorted(VALID_TRIP_TYPES)}"}), 400
    if p['trip_type'] == 'return' and not p['return_date']:
        return jsonify({"error": "return_date is required for trip_type=return"}), 400

    live = scrapling_provider.search_live(
        p['origin'], p['destination'], p['depart_date'], p['return_date']
    )
    if live and live.get('offers'):
        return jsonify({
            "source": "live",
            "query": p,
            "offers": live['offers'],
            "return_offers": live.get('return_offers', []),
        })

    curated = search_curated(
        origin=p['origin'],
        destination=p['destination'],
        date=p['depart_date'],
        return_date=p['return_date'],
        trip_type=p['trip_type'],
    )
    return jsonify({
        "source": "curated",
        "query": p,
        "offers": curated['offers'],
        "return_offers": curated['return_offers'],
    })


@flights_bp.route('/destinations', methods=['GET'])
def list_destinations():
    return jsonify({"destinations": list(KENYA_AIRPORTS.values())})
