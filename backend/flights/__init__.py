from backend.flights import scrapling_provider
from backend.flights.curated_data import search_curated, KENYA_AIRPORTS


def search(origin, destination, depart_date, return_date=None, trip_type="one_way"):
    live = None
    try:
        live = scrapling_provider.search_live(origin, destination, depart_date, return_date)
    except Exception:
        live = None
    if live:
        return {"source": "live", **live}
    curated = search_curated(origin, destination, depart_date, return_date, trip_type)
    return {"source": "curated", **curated}
