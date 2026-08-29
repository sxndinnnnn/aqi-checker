import requests
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

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

# Configure OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

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

@app.get("/api/environmental-data")
def get_environmental_data():
    try:
        # Fetching Air Quality Data
        aqi_url = f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={LATITUDE}&longitude={LONGITUDE}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,uv_index"
        
        # Fetching Weather/Climate Data
        weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={LATITUDE}&longitude={LONGITUDE}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m"
        
        aqi_response = requests.get(aqi_url)
        weather_response = requests.get(weather_url)
        
        aqi_response.raise_for_status()
        weather_response.raise_for_status()
        
        aqi_data = aqi_response.json()
        weather_data = weather_response.json()
        
        current_aqi = aqi_data.get("current", {})
        current_weather = weather_data.get("current", {})

        insights = generate_insights(current_aqi, current_weather)

        return {
            "location": "Colombo, Sri Lanka",
            "air_quality": current_aqi,
            "weather": current_weather,
            "insights": insights
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.frontend("/", directory="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
