# Sri Lanka ESG AI Monitor

A live environmental dashboard for four Sri Lankan cities (Colombo, Kandy, Galle, Jaffna). It pulls real-time air quality and weather data from [Open-Meteo](https://open-meteo.com/) and uses an LLM (via [OpenRouter](https://openrouter.ai/)) to generate ESG (Environmental, Social, Governance) analysis and mitigation recommendations from that data.

## What it does

- **Backend** (`backend/main.py`): a FastAPI server that exposes `GET /api/environmental-data?city=<id>`, which:
  1. Fetches current air quality data (PM2.5, PM10, CO, NO₂, SO₂, ozone, UV index) for the requested city (`colombo`, `kandy`, `galle`, or `jaffna` — see `GET /api/cities`).
  2. Fetches current weather data (temperature, humidity, precipitation, wind speed).
  3. Sends both to an LLM with a prompt asking for an ESG analysis, 24-48 hour predictive trends, and 3 actionable mitigation measures.
  4. Returns everything as JSON, along with the active alert thresholds.
- **Frontend** (`frontend/index.html`): a single static HTML page (Tailwind + vanilla JS + Chart.js + Leaflet) that calls the backend endpoints and renders the air quality, weather, AI insights, historical trends, a monitoring-location map, and alert banner as a dashboard, with a city switcher. FastAPI serves it directly at `/` via `app.frontend()`, so the whole app runs from one server/port.
- **Historical trends** (`backend/db.py`): every call to `/api/environmental-data` also writes a row to a Postgres `readings` table (per city), and a daily Vercel Cron job (`GET /api/cron/collect`) loops over all four cities to guarantee at least one row per city per day even with no traffic. `GET /api/history?range=24h|7d|30d|90d&city=<id>` serves that data to the frontend's trend charts, a composite-AQI forecast chart (linear regression + confidence band), and the day-over-day trend arrows on each metric. All of this is optional — with no database configured, the app runs exactly as it did without it, just showing a "no historical data yet" state instead of charts.
- **Monitoring-location map** (`frontend/index.html`): a Leaflet + OpenStreetMap view that scans the AI's mitigation text for known place names (e.g. Galle Road, Kolonnawa) and drops a pin for each match found, falling back to a single city-center pin when none are mentioned. Each pin's popup shows the current city-wide reading — this isn't hyperlocal sensor data, just the same single reading the rest of the dashboard uses.
- **Threshold alerts** (`backend/alerts.py`): every write to historical storage checks the new reading against WHO Air Quality Guideline levels. The in-app banner also checks against those thresholds (or your own overrides, stored in this browser only) and flags any "Key Risk Window" mentioned in the AI's predictive text. On the backend, a *new* threshold breach (edge-triggered — it won't re-alert every day a value stays elevated) sends an email via [Resend](https://resend.com/).

## Prerequisites

- Python 3.10+
- An [OpenRouter](https://openrouter.ai/keys) API key (optional — the app runs fine without one, it just skips the AI insights section)
- A Postgres database (optional — needed only for historical trends/charts; see [Historical trends setup](#historical-trends-setup) below)

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

## Historical trends setup

Trend charts, the AQI forecast, and the trend arrows all need somewhere to store readings over time. Without this, the app works exactly as before — those sections just show an empty state.

1. In the Vercel dashboard, go to your project → **Storage** → **Create Database** → pick a Postgres provider (Neon is the default Marketplace option) and connect it to this project. This automatically injects a `DATABASE_URL` (or `POSTGRES_URL`) environment variable — `backend/db.py` picks up whichever one is present.
2. No manual migration needed — the app creates the `readings` table itself on first startup (`db.init_db()`).
3. Redeploy so the new env var takes effect.
4. (Optional) Set a `CRON_SECRET` environment variable (any random 16+ character string) to protect `/api/cron/collect` from being hit by anyone who finds the URL. Vercel automatically sends it back as the `Authorization: Bearer <CRON_SECRET>` header when the cron job fires, and the endpoint checks for that.

**A note on data density**: `vercel.json` schedules the collector once a day (`0 3 * * *`), because Vercel's Hobby plan caps cron jobs at once per day — upgrade to Pro if you want it to run more often. In practice this doesn't leave you with only one point a day, since `/api/environmental-data` also writes a row on every real page load; the cron job is just a floor that guarantees at least one reading even on days nobody visits. The 24h chart/trend-arrow view will look sparse until a few days of combined cron + traffic data accumulate.

For local development, set `DATABASE_URL` in your `.env` file pointing at any Postgres instance (e.g. a local one, or the same Neon database) to test these features outside of Vercel.

## Email alerts setup

`backend/alerts.py` sends an email via [Resend](https://resend.com/) whenever a new WHO threshold breach is detected during data collection (both on live page loads and the daily cron). Without this configured, breaches are just logged to the server console (`[alert stub] ...`) — nothing else changes.

1. Create a [Resend](https://resend.com/) account and API key.
2. Set these environment variables (in `.env` locally, and in Vercel project settings for production):
   ```
   RESEND_API_KEY=your_key_here
   ALERT_EMAIL_TO=you@example.com
   ```
3. (Optional) `ALERT_EMAIL_FROM` defaults to `onboarding@resend.dev`, Resend's shared sandbox sender that works without verifying a domain. Set it to an address on your own verified domain once you have one.

The default thresholds are the WHO Air Quality Guideline levels (`WHO_DEFAULT_THRESHOLDS` in `backend/main.py`). The in-app "Alert threshold settings" panel lets a visitor override these for their own browser (stored in `localStorage`), but that's independent of the server-side email thresholds — there's no user account system, so email alerts always use the WHO defaults for now.

## Notes

- The default model is `minimax/minimax-m3:free` on OpenRouter (see `backend/main.py`). Swap the `model` field in `generate_insights()` for any other [OpenRouter model](https://openrouter.ai/models) you have access to.
- Supported cities live in the `CITIES` dict in `backend/main.py` (id → display name + coordinates) — add an entry there to monitor another city. Verify Open-Meteo actually returns data for its coordinates first.
- The map's known place names (`KNOWN_LOCATIONS` in `frontend/index.html`) are approximate, illustrative coordinates for well-known landmarks per city, not real sensor hardware locations.
