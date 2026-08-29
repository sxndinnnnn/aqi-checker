import requests
import os
from datetime import datetime, timezone
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend import db, alerts

load_dotenv()

app = FastAPI(title="Sri Lanka ESG AI Monitor")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supported cities. Coordinates verified against Open-Meteo before adding
# (all four return real, non-null current air-quality + weather data).
CITIES = {
    "colombo": {"name": "Colombo, Sri Lanka", "lat": 6.9271, "lon": 79.8612},
    "kandy": {"name": "Kandy, Sri Lanka", "lat": 7.2906, "lon": 80.6337},
    "galle": {"name": "Galle, Sri Lanka", "lat": 6.0535, "lon": 80.2210},
    "jaffna": {"name": "Jaffna, Sri Lanka", "lat": 9.6615, "lon": 80.0255},
}
DEFAULT_CITY = "colombo"

VALID_HISTORY_RANGES = {"24h", "7d", "30d", "90d"}

# WHO 2021 Air Quality Guideline levels, used as the default alert
# thresholds (µg/m³). Users can override these client-side; this set is
# what the server checks on every write for the email-alert hook.
WHO_DEFAULT_THRESHOLDS = {
    "pm2_5": 15,               # 24-hour mean
    "pm10": 45,                # 24-hour mean
    "nitrogen_dioxide": 25,    # 24-hour mean
    "ozone": 100,              # 8-hour mean
    "carbon_monoxide": 4000,   # 24-hour mean (4 mg/m3)
}

try:
    db.init_db()
except Exception as e:
    print(f"Historical storage unavailable, continuing without it: {e}")

# Configure OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Vercel sets this automatically when a cron job is configured with a
# CRON_SECRET env var; used to keep /api/cron/collect from being spammed
# by anyone who finds the URL. Optional - the endpoint still works
# without it, just without that protection.
CRON_SECRET = os.getenv("CRON_SECRET")

def generate_insights(city_name, air_quality, weather):
    if not OPENROUTER_API_KEY:
        return "Insight generation disabled: OPENROUTER_API_KEY environment variable is not set."

    try:
        prompt = f"""
        You are an expert Environmental, Social, and Governance (ESG) consultant.
        I am going to provide you with the real-time environmental and weather data for {city_name}.

        Air Quality Data: {air_quality}
        Weather Data: {weather}

        Based strictly on this data, please provide:
        1. An analysis of the current environmental situation.
        2. Predictive insights on how these metrics might trend in the next 24-48 hours.
        3. 3 actionable ESG mitigation measures for local businesses or government to improve public health and the environment.

        Keep the response concise, factual, and formatted in Markdown. DO NOT use LaTeX or mathematical formatting tags (like $). Use plain text.
        """
        response = requests.post(
            OPENROUTER_URL,
            headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
            json={
                "model": "minimax/minimax-m3:free",
                "messages": [{"role": "user", "content": prompt}]
            }
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"Error generating insights: {e}")
        return "Insight generation failed due to an error with the AI provider."

def fetch_current_readings(lat, lon):
    """Fetch the current air quality + weather snapshot from Open-Meteo for one location."""
    aqi_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,uv_index"
    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"

    aqi_response = requests.get(aqi_url)
    weather_response = requests.get(weather_url)

    aqi_response.raise_for_status()
    weather_response.raise_for_status()

    current_aqi = aqi_response.json().get("current", {})
    current_weather = weather_response.json().get("current", {})
    return current_aqi, current_weather

def check_thresholds_and_alert(city_name, current_aqi, previous_reading):
    """Edge-triggered: only alerts the first time a metric crosses its WHO
    threshold, not on every subsequent read while it stays breached."""
    breaches = []
    for metric, limit in WHO_DEFAULT_THRESHOLDS.items():
        value = current_aqi.get(metric)
        if value is None or value <= limit:
            continue
        previously_breaching = bool(
            previous_reading and previous_reading.get(metric) is not None
            and previous_reading[metric] > limit
        )
        if not previously_breaching:
            breaches.append({"metric": metric, "value": value, "threshold": limit, "unit": "µg/m³"})
    if breaches:
        alerts.send_threshold_alert(city_name, breaches)

def store_reading(city_name, current_aqi, current_weather):
    """Best-effort write to historical storage plus threshold alerting -
    never breaks the caller on failure."""
    previous_reading = None
    try:
        previous_reading = db.get_latest_reading(city_name)
    except Exception as e:
        print(f"Could not fetch previous reading for alerting: {e}")

    try:
        db.insert_reading(city_name, datetime.now(timezone.utc), current_aqi, current_weather)
    except Exception as e:
        print(f"Failed to store historical reading: {e}")
        return

    try:
        check_thresholds_and_alert(city_name, current_aqi, previous_reading)
    except Exception as e:
        print(f"Threshold check failed: {e}")

@app.get("/api/cities")
def get_cities():
    return {"cities": [{"id": cid, "name": c["name"]} for cid, c in CITIES.items()], "default": DEFAULT_CITY}

@app.get("/api/environmental-data")
def get_environmental_data(city: str = DEFAULT_CITY):
    if city not in CITIES:
        raise HTTPException(status_code=400, detail=f"city must be one of {sorted(CITIES)}")
    city_info = CITIES[city]
    try:
        current_aqi, current_weather = fetch_current_readings(city_info["lat"], city_info["lon"])
        insights = generate_insights(city_info["name"], current_aqi, current_weather)

        store_reading(city_info["name"], current_aqi, current_weather)

        return {
            "location": city_info["name"],
            "air_quality": current_aqi,
            "weather": current_weather,
            "insights": insights,
            "alert_thresholds": WHO_DEFAULT_THRESHOLDS,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_history(range: str = "7d", city: str = DEFAULT_CITY):
    if city not in CITIES:
        raise HTTPException(status_code=400, detail=f"city must be one of {sorted(CITIES)}")
    if range not in VALID_HISTORY_RANGES:
        raise HTTPException(status_code=400, detail=f"range must be one of {sorted(VALID_HISTORY_RANGES)}")
    city_name = CITIES[city]["name"]
    try:
        readings = db.get_history(city_name, range)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {
        "location": city_name,
        "range": range,
        "storage_configured": db.is_configured(),
        "readings": readings,
    }

@app.get("/api/cron/collect")
def cron_collect(authorization: str | None = Header(default=None)):
    """Hit by Vercel Cron (see vercel.json) once daily to guarantee at least one
    historical data point per city even on days nobody loads the dashboard.
    When CRON_SECRET is set, Vercel automatically sends it back as this
    Authorization header."""
    if CRON_SECRET and authorization != f"Bearer {CRON_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    results = {}
    for city_info in CITIES.values():
        try:
            current_aqi, current_weather = fetch_current_readings(city_info["lat"], city_info["lon"])
            store_reading(city_info["name"], current_aqi, current_weather)
            results[city_info["name"]] = "ok"
        except Exception as e:
            results[city_info["name"]] = f"error: {e}"
    return {"status": "ok", "cities": results}

app.frontend("/", directory="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
