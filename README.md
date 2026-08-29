# Sri Lanka ESG AI Monitor

A live environmental dashboard for Colombo, Sri Lanka. It pulls real-time air quality and weather data from [Open-Meteo](https://open-meteo.com/) and uses an LLM (via [OpenRouter](https://openrouter.ai/)) to generate ESG (Environmental, Social, Governance) analysis and mitigation recommendations from that data.

## What it does

- **Backend** (`backend/main.py`): a FastAPI server that exposes `GET /api/environmental-data`, which:
  1. Fetches current air quality data (PM2.5, PM10, CO, NO₂, SO₂, ozone, UV index) for Colombo.
  2. Fetches current weather data (temperature, humidity, precipitation, wind speed).
  3. Sends both to an LLM with a prompt asking for an ESG analysis, 24-48 hour predictive trends, and 3 actionable mitigation measures.
  4. Returns everything as JSON.
- **Frontend** (`frontend/index.html`): a single static HTML page (Tailwind + vanilla JS) that calls the backend endpoint and renders the air quality, weather, and AI insights as a dashboard. FastAPI serves it directly at `/` via `app.frontend()`, so the whole app runs from one server/port.

## Prerequisites

- Python 3.10+
- An [OpenRouter](https://openrouter.ai/keys) API key (optional — the app runs fine without one, it just skips the AI insights section)

## Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/sxndinnnnn/aqi-checker.git
   cd aqi-checker
   ```

2. **Create a virtual environment and install dependencies**

   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate

   pip install -r requirements.txt
   ```

3. **Configure your API key**

   Create a `.env` file in the project root:

   ```
   OPENROUTER_API_KEY=your_key_here
   ```

   Without this, `/api/environmental-data` still returns live air quality and weather data — the `insights` field just explains that generation is disabled.

4. **Run the app**

   ```bash
   python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
   ```

   Open `http://localhost:8000` in your browser — FastAPI serves both the dashboard and the `/api/environmental-data` endpoint from this one server.

## Deploying to Vercel

The repo already includes `pyproject.toml` (points Vercel at the `app` instance in `backend/main.py`) and `vercel.json` (raises the function timeout to 60s, since the AI call can take 15-20s on free-tier models). Connect the repo in the Vercel dashboard, or run:

```bash
vc deploy
```

Set `OPENROUTER_API_KEY` as an environment variable in your Vercel project settings so the deployed app can generate insights.

## Notes

- The default model is `minimax/minimax-m3:free` on OpenRouter (see `backend/main.py`). Swap the `model` field in `generate_insights()` for any other [OpenRouter model](https://openrouter.ai/models) you have access to.
- Location is hardcoded to Colombo, Sri Lanka (`LATITUDE`/`LONGITUDE` constants in `backend/main.py`) — change these to monitor a different city.
