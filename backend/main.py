import requests
import os
from datetime import datetime, timezone
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend import db

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

# Colombo Coordinates
LATITUDE = 6.9271
LONGITUDE = 79.8612
LOCATION_NAME = "Colombo, Sri Lanka"

VALID_HISTORY_RANGES = {"24h", "7d", "30d", "90d"}

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

def generate_insights(air_quality, weather):
    if not OPENROUTER_API_KEY:
        return "Insight generation disabled: OPENROUTER_API_KEY environment variable is not set."

    try:
        prompt = f"""
        You are an expert Environmental, Social, and Governance (ESG) consultant.
        I am going to provide you with the real-time environmental and weather data for Colombo, Sri Lanka.

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

def fetch_current_readings():
    """Fetch the current air quality + weather snapshot from Open-Meteo."""
    aqi_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={LATITUDE}&longitude={LONGITUDE}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,uv_index"
    weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={LATITUDE}&longitude={LONGITUDE}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"

    aqi_response = requests.get(aqi_url)
    weather_response = requests.get(weather_url)

    aqi_response.raise_for_status()
    weather_response.raise_for_status()

    current_aqi = aqi_response.json().get("current", {})
    current_weather = weather_response.json().get("current", {})
    return current_aqi, current_weather

def store_reading(current_aqi, current_weather):
    """Best-effort write to historical storage - never breaks the caller on failure."""
    try:
        db.insert_reading(LOCATION_NAME, datetime.now(timezone.utc), current_aqi, current_weather)
    except Exception as e:
        print(f"Failed to store historical reading: {e}")

@app.get("/api/environmental-data")
def get_environmental_data():
    try:
        current_aqi, current_weather = fetch_current_readings()
        insights = generate_insights(current_aqi, current_weather)

        store_reading(current_aqi, current_weather)

        return {
            "location": LOCATION_NAME,
            "air_quality": current_aqi,
            "weather": current_weather,
            "insights": insights
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_history(range: str = "7d"):
    if range not in VALID_HISTORY_RANGES:
        raise HTTPException(status_code=400, detail=f"range must be one of {sorted(VALID_HISTORY_RANGES)}")
    try:
        readings = db.get_history(LOCATION_NAME, range)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {
        "location": LOCATION_NAME,
        "range": range,
        "storage_configured": db.is_configured(),
        "readings": readings,
    }

@app.get("/api/cron/collect")
def cron_collect(authorization: str | None = Header(default=None)):
    """Hit by Vercel Cron (see vercel.json) once daily to guarantee at least one
    historical data point even on days nobody loads the dashboard. When CRON_SECRET
    is set, Vercel automatically sends it back as this Authorization header."""
    if CRON_SECRET and authorization != f"Bearer {CRON_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        current_aqi, current_weather = fetch_current_readings()
        store_reading(current_aqi, current_weather)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"status": "ok"}

app.frontend("/", directory="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
