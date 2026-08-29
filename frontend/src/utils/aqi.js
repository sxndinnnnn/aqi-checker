// US EPA composite AQI. Mirrors backend/aqi.py - keep the two in sync.
export const AQI_BREAKPOINTS = {
  pm25: [[0.0, 12.0, 0, 50], [12.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 150.4, 151, 200], [150.5, 250.4, 201, 300], [250.5, 500.4, 301, 500]],
  pm10: [[0, 54, 0, 50], [55, 154, 51, 100], [155, 254, 101, 150], [255, 354, 151, 200], [355, 424, 201, 300], [425, 604, 301, 500]],
  co: [[0.0, 4.4, 0, 50], [4.5, 9.4, 51, 100], [9.5, 12.4, 101, 150], [12.5, 15.4, 151, 200], [15.5, 30.4, 201, 300], [30.5, 50.4, 301, 500]], // ppm
  no2: [[0, 53, 0, 50], [54, 100, 51, 100], [101, 360, 101, 150], [361, 649, 151, 200], [650, 1249, 201, 300], [1250, 2049, 301, 500]], // ppb
  o3: [[0.0, 0.054, 0, 50], [0.055, 0.07, 51, 100], [0.071, 0.085, 101, 150], [0.086, 0.105, 151, 200], [0.106, 0.2, 201, 300]], // ppm, 8-hr table
};

function subAqi(conc, table) {
  if (conc == null || Number.isNaN(conc)) return null;
  for (const [cLow, cHigh, aLow, aHigh] of table) {
    if (conc >= cLow && conc <= cHigh) {
      return Math.round(((aHigh - aLow) / (cHigh - cLow)) * (conc - cLow) + aLow);
    }
  }
  const last = table[table.length - 1];
  return conc > last[1] ? 500 : 0;
}

export function computeCompositeAQI(aq) {
  const candidates = [
    { name: 'PM2.5', aqi: subAqi(aq.pm2_5, AQI_BREAKPOINTS.pm25) },
    { name: 'PM10', aqi: subAqi(aq.pm10, AQI_BREAKPOINTS.pm10) },
    { name: 'CO', aqi: subAqi(aq.carbon_monoxide / 1145, AQI_BREAKPOINTS.co) },
    { name: 'NO₂', aqi: subAqi(aq.nitrogen_dioxide / 1.88, AQI_BREAKPOINTS.no2) },
    { name: 'O₃', aqi: subAqi(aq.ozone / 1960, AQI_BREAKPOINTS.o3) },
  ].filter((c) => c.aqi != null);
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.aqi - a.aqi);
  return { aqi: candidates[0].aqi, dominant: candidates[0].name };
}

export function aqiCategory(aqi) {
  if (aqi <= 50) return { label: 'Good', color: '#22c55e' };
  if (aqi <= 100) return { label: 'Moderate', color: '#eab308' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive Groups', color: '#f97316' };
  if (aqi <= 200) return { label: 'Unhealthy', color: '#ef4444' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: '#a855f7' };
  return { label: 'Hazardous', color: '#7f1d1d' };
}

export function classifyLadder(value, ladder) {
  for (const step of ladder) {
    if (value <= step.max) return step;
  }
  return ladder[ladder.length - 1];
}

export const POLLUTANT_LADDERS = {
  pm25: [{ max: 12.0, cls: 'success', label: 'Good' }, { max: 35.4, cls: 'warning', label: 'Moderate' }, { max: Infinity, cls: 'error', label: 'Unhealthy' }],
  pm10: [{ max: 54, cls: 'success', label: 'Good' }, { max: 154, cls: 'warning', label: 'Moderate' }, { max: Infinity, cls: 'error', label: 'Unhealthy' }],
  no2: [{ max: 100, cls: 'success', label: 'Good' }, { max: 188, cls: 'warning', label: 'Moderate' }, { max: Infinity, cls: 'error', label: 'Unhealthy' }],
  o3: [{ max: 108, cls: 'success', label: 'Good' }, { max: 137, cls: 'warning', label: 'Moderate' }, { max: Infinity, cls: 'error', label: 'Unhealthy' }],
  co: [{ max: 5038, cls: 'success', label: 'Good' }, { max: 10763, cls: 'warning', label: 'Moderate' }, { max: Infinity, cls: 'error', label: 'Unhealthy' }],
};

export function classifyTemp(temp) {
  if (temp >= 18 && temp <= 30) return { cls: 'success', label: 'Comfortable' };
  if ((temp >= 10 && temp < 18) || (temp > 30 && temp <= 35)) return { cls: 'warning', label: 'Caution' };
  return { cls: 'error', label: 'Extreme' };
}

export function classifyHumidity(h) {
  if (h >= 30 && h <= 60) return { cls: 'success', label: 'Comfortable' };
  if ((h >= 20 && h < 30) || (h > 60 && h <= 75)) return { cls: 'warning', label: 'Humid' };
  return { cls: 'error', label: 'Extreme' };
}
