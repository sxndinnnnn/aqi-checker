import { computeCompositeAQI } from './aqi';
import { formatForecastLabel } from './format';

function linearRegression(points) {
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denom;
  return { slope, intercept: (sumY - slope * sumX) / n };
}

// The forecast is a short-term (24-48h) projection, so it's fit against
// recent dynamics, not a multi-week average - context is capped regardless
// of the selected chart range.
const FORECAST_CONTEXT_HOURS = 72;
const FORECAST_HOURS = [6, 12, 18, 24, 30, 36, 42, 48];

export function buildForecast(readings) {
  const cutoff = readings.length
    ? new Date(readings[readings.length - 1].recorded_at).getTime() - FORECAST_CONTEXT_HOURS * 3600000
    : 0;
  const series = readings
    .filter((r) => new Date(r.recorded_at).getTime() >= cutoff)
    .map((r) => ({ t: new Date(r.recorded_at), aqi: computeCompositeAQI(r) }))
    .filter((p) => p.aqi != null)
    .map((p) => ({ t: p.t, aqi: p.aqi.aqi }));

  if (series.length < 3) return null;

  const startMs = series[0].t.getTime();
  const points = series.map((p) => ({ x: (p.t.getTime() - startMs) / 3600000, y: p.aqi }));
  const { slope, intercept } = linearRegression(points);

  const residuals = points.map((p) => p.y - (slope * p.x + intercept));
  const meanResidual = residuals.reduce((a, b) => a + b, 0) / residuals.length;
  const variance = residuals.reduce((s, r) => s + (r - meanResidual) ** 2, 0) / Math.max(1, residuals.length - 1);
  const stdDev = Math.sqrt(variance);

  const lastX = points[points.length - 1].x;
  const forecastPoints = FORECAST_HOURS.map((h) => {
    const x = lastX + h;
    const y = Math.max(0, slope * x + intercept);
    const spread = stdDev * (1 + h / 48);
    return { t: new Date(startMs + x * 3600000), y, upper: y + spread, lower: Math.max(0, y - spread) };
  });

  const labels = series.map((p) => formatForecastLabel(p.t)).concat(forecastPoints.map((p) => formatForecastLabel(p.t)));
  const historyCount = series.length;
  const pad = (arr) => arr.concat(new Array(forecastPoints.length).fill(null));

  const historyLine = pad(series.map((p) => p.aqi));
  const forecastLine = new Array(historyCount + forecastPoints.length).fill(null);
  const upperBand = new Array(historyCount + forecastPoints.length).fill(null);
  const lowerBand = new Array(historyCount + forecastPoints.length).fill(null);
  forecastLine[historyCount - 1] = series[historyCount - 1].aqi;
  upperBand[historyCount - 1] = series[historyCount - 1].aqi;
  lowerBand[historyCount - 1] = series[historyCount - 1].aqi;
  forecastPoints.forEach((fp, i) => {
    forecastLine[historyCount + i] = fp.y;
    upperBand[historyCount + i] = fp.upper;
    lowerBand[historyCount + i] = fp.lower;
  });

  return { labels, historyLine, forecastLine, upperBand, lowerBand };
}
