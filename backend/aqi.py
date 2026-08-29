"""
US EPA composite AQI calculation, mirrored from the JS implementation in
frontend/index.html (computeCompositeAQI/subAQI). Keep the two in sync -
there's no shared config file between the Python backend and the vanilla-JS
frontend in this project.
"""

# (cLow, cHigh, aLow, aHigh) breakpoints per pollutant.
AQI_BREAKPOINTS = {
    "pm2_5": [
        (0.0, 12.0, 0, 50), (12.1, 35.4, 51, 100), (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200), (150.5, 250.4, 201, 300), (250.5, 500.4, 301, 500),
    ],
    "pm10": [
        (0, 54, 0, 50), (55, 154, 51, 100), (155, 254, 101, 150),
        (255, 354, 151, 200), (355, 424, 201, 300), (425, 604, 301, 500),
    ],
    "carbon_monoxide": [  # ppm
        (0.0, 4.4, 0, 50), (4.5, 9.4, 51, 100), (9.5, 12.4, 101, 150),
        (12.5, 15.4, 151, 200), (15.5, 30.4, 201, 300), (30.5, 50.4, 301, 500),
    ],
    "nitrogen_dioxide": [  # ppb
        (0, 53, 0, 50), (54, 100, 51, 100), (101, 360, 101, 150),
        (361, 649, 151, 200), (650, 1249, 201, 300), (1250, 2049, 301, 500),
    ],
    "ozone": [  # ppm, 8-hr table
        (0.000, 0.054, 0, 50), (0.055, 0.070, 51, 100), (0.071, 0.085, 101, 150),
        (0.086, 0.105, 151, 200), (0.106, 0.200, 201, 300),
    ],
}


def _sub_aqi(conc, table):
    if conc is None:
        return None
    for c_low, c_high, a_low, a_high in table:
        if c_low <= conc <= c_high:
            return round(((a_high - a_low) / (c_high - c_low)) * (conc - c_low) + a_low)
    return 500 if conc > table[-1][1] else 0


def composite_aqi(reading: dict):
    """reading: dict with pm2_5/pm10/carbon_monoxide/nitrogen_dioxide/ozone in
    ug/m3 (matching the readings table / Open-Meteo field names). Returns the
    AQI number (int) or None if no pollutant values are present."""
    candidates = []
    if reading.get("pm2_5") is not None:
        candidates.append(_sub_aqi(reading["pm2_5"], AQI_BREAKPOINTS["pm2_5"]))
    if reading.get("pm10") is not None:
        candidates.append(_sub_aqi(reading["pm10"], AQI_BREAKPOINTS["pm10"]))
    if reading.get("carbon_monoxide") is not None:
        candidates.append(_sub_aqi(reading["carbon_monoxide"] / 1145, AQI_BREAKPOINTS["carbon_monoxide"]))
    if reading.get("nitrogen_dioxide") is not None:
        candidates.append(_sub_aqi(reading["nitrogen_dioxide"] / 1.88, AQI_BREAKPOINTS["nitrogen_dioxide"]))
    if reading.get("ozone") is not None:
        candidates.append(_sub_aqi(reading["ozone"] / 1960, AQI_BREAKPOINTS["ozone"]))
    candidates = [c for c in candidates if c is not None]
    return max(candidates) if candidates else None
