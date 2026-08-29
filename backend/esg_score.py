"""
ESG score: a transparent, from-scratch composite built only from data
already in this app (no external framework) - per explicit user direction
not to invent a methodology silently. The exact formula is returned in
every response as `methodology` so it's never hidden from the UI.
"""
from backend import db
from backend.aqi import composite_aqi

ENV_WEIGHT = 70
GOV_WEIGHT = 30

METHODOLOGY = (
    "ESG Score (0-100) = Environmental (0-70) + Governance (0-30). "
    "Environmental = 70 x (share of historical readings in the selected period "
    "with a composite AQI of 50 or below, i.e. EPA 'Good'). "
    "Governance = 30 x (implemented mitigation measures / total tracked measures), "
    "using current measure statuses. The trend line recomputes the Environmental "
    "share per period, but applies today's Governance share to every point, since "
    "mitigation tracking doesn't yet have deep enough history to reconstruct past "
    "completion rates."
)

RANGE_BUCKET_DAYS = {"24h": 0.25, "7d": 1, "30d": 3, "90d": 7}


def _environmental_score(readings):
    scored = [a for a in (composite_aqi(r) for r in readings) if a is not None]
    if not scored:
        return None, None
    good_pct = sum(1 for a in scored if a <= 50) / len(scored)
    return round(ENV_WEIGHT * good_pct, 1), good_pct


def _governance_score(measures):
    if not measures:
        return 0.0, 0, 0
    implemented = sum(1 for m in measures if m["status"] == "implemented")
    pct = implemented / len(measures)
    return round(GOV_WEIGHT * pct, 1), implemented, len(measures)


def _bucket_readings(readings, bucket_days):
    """Group readings (oldest first) into consecutive bucket_days-wide windows."""
    if not readings:
        return []
    buckets = []
    bucket_start = readings[0]["recorded_at"]
    current = []
    for r in readings:
        if (r["recorded_at"] - bucket_start).total_seconds() >= bucket_days * 86400:
            if current:
                buckets.append((bucket_start, current))
            bucket_start = r["recorded_at"]
            current = []
        current.append(r)
    if current:
        buckets.append((bucket_start, current))
    return buckets


def compute_esg_score(city_name: str, range_key: str) -> dict:
    readings = db.get_history(city_name, range_key)
    measures = db.get_mitigation_measures(city_name)

    env_score, good_pct = _environmental_score(readings)
    gov_score, implemented, total_measures = _governance_score(measures)

    result = {
        "environmental_component": env_score,
        "governance_component": gov_score,
        "good_reading_pct": round(good_pct, 3) if good_pct is not None else None,
        "measures_total": total_measures,
        "measures_implemented": implemented,
        "trend": [],
        "methodology": METHODOLOGY,
    }

    if env_score is None:
        result["score"] = None
        return result

    result["score"] = round(env_score + gov_score, 1)

    bucket_days = RANGE_BUCKET_DAYS.get(range_key, 1)
    for bucket_start, bucket_readings in _bucket_readings(readings, bucket_days):
        b_env, _ = _environmental_score(bucket_readings)
        if b_env is None:
            continue
        result["trend"].append({
            "period_start": bucket_start.isoformat(),
            "score": round(b_env + gov_score, 1),
        })

    return result
