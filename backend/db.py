"""
Historical readings storage (Postgres/Neon, provisioned via the Vercel
Marketplace). All functions degrade gracefully to a no-op / empty result
when no database is configured, matching the pattern already used for
OPENROUTER_API_KEY in main.py - history is an optional add-on, not a
hard dependency of the live snapshot view.
"""
import os
from contextlib import contextmanager
from datetime import datetime

import psycopg

# Vercel's Postgres/Neon marketplace integration injects one of these
# depending on how it was provisioned.
CONNECTION_ENV_VARS = ["DATABASE_URL", "POSTGRES_URL"]

RANGE_TO_INTERVAL = {
    "24h": "24 hours",
    "7d": "7 days",
    "30d": "30 days",
    "90d": "90 days",
}

READING_COLUMNS = [
    "pm2_5", "pm10", "nitrogen_dioxide", "sulphur_dioxide",
    "carbon_monoxide", "ozone", "uv_index",
    "temperature_2m", "relative_humidity_2m", "precipitation", "wind_speed_10m",
]


def _connection_string():
    for var in CONNECTION_ENV_VARS:
        value = os.getenv(var)
        if value:
            return value
    return None


def is_configured():
    return _connection_string() is not None


@contextmanager
def _get_conn():
    conn = psycopg.connect(_connection_string())
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """Create the readings table if it doesn't exist yet. No-op if no DB is configured."""
    if not is_configured():
        return
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS readings (
                    id BIGSERIAL PRIMARY KEY,
                    city TEXT NOT NULL,
                    recorded_at TIMESTAMPTZ NOT NULL,
                    pm2_5 DOUBLE PRECISION,
                    pm10 DOUBLE PRECISION,
                    nitrogen_dioxide DOUBLE PRECISION,
                    sulphur_dioxide DOUBLE PRECISION,
                    carbon_monoxide DOUBLE PRECISION,
                    ozone DOUBLE PRECISION,
                    uv_index DOUBLE PRECISION,
                    temperature_2m DOUBLE PRECISION,
                    relative_humidity_2m DOUBLE PRECISION,
                    precipitation DOUBLE PRECISION,
                    wind_speed_10m DOUBLE PRECISION
                )
            """)
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_readings_city_time
                ON readings (city, recorded_at DESC)
            """)
        conn.commit()


def insert_reading(city: str, recorded_at: datetime, air_quality: dict, weather: dict):
    """Best-effort insert of one snapshot. Callers should catch exceptions themselves
    if a DB outage must not affect the main response."""
    if not is_configured():
        return
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO readings (
                    city, recorded_at, pm2_5, pm10, nitrogen_dioxide,
                    sulphur_dioxide, carbon_monoxide, ozone, uv_index,
                    temperature_2m, relative_humidity_2m, precipitation, wind_speed_10m
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                city, recorded_at,
                air_quality.get("pm2_5"), air_quality.get("pm10"),
                air_quality.get("nitrogen_dioxide"), air_quality.get("sulphur_dioxide"),
                air_quality.get("carbon_monoxide"), air_quality.get("ozone"),
                air_quality.get("uv_index"),
                weather.get("temperature_2m"), weather.get("relative_humidity_2m"),
                weather.get("precipitation"), weather.get("wind_speed_10m"),
            ))
        conn.commit()


def get_history(city: str, range_key: str) -> list[dict]:
    """Readings for `city` within the given range ("24h"/"7d"/"30d"/"90d"), oldest first."""
    if not is_configured():
        return []
    interval = RANGE_TO_INTERVAL.get(range_key, RANGE_TO_INTERVAL["7d"])
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(f"""
                SELECT recorded_at, {", ".join(READING_COLUMNS)}
                FROM readings
                WHERE city = %s AND recorded_at >= now() - interval '{interval}'
                ORDER BY recorded_at ASC
            """, (city,))
            cols = [d.name for d in cur.description]
            rows = cur.fetchall()
    return [dict(zip(cols, row)) for row in rows]


def get_latest_reading(city: str) -> dict | None:
    """Most recent reading for `city` before any new insert - used to detect
    whether a threshold breach is new (edge-triggered alerting) or ongoing."""
    if not is_configured():
        return None
    with _get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(f"""
                SELECT recorded_at, {", ".join(READING_COLUMNS)}
                FROM readings
                WHERE city = %s
                ORDER BY recorded_at DESC
                LIMIT 1
            """, (city,))
            row = cur.fetchone()
            if not row:
                return None
            cols = [d.name for d in cur.description]
            return dict(zip(cols, row))
