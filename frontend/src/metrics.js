export const AIR_METRICS = [
  { key: 'pm2_5', id: 'pm25', color: '#3b82f6', isPollutant: true, i18n: 'metric.pm25', unit: 'µg/m³' },
  { key: 'pm10', id: 'pm10', color: '#6366f1', isPollutant: true, i18n: 'metric.pm10', unit: 'µg/m³' },
  { key: 'nitrogen_dioxide', id: 'no2', color: '#8b5cf6', isPollutant: true, i18n: 'metric.no2', unit: 'µg/m³' },
  { key: 'ozone', id: 'o3', color: '#0ea5e9', isPollutant: true, i18n: 'metric.o3', unit: 'µg/m³' },
  { key: 'carbon_monoxide', id: 'co', color: '#14b8a6', isPollutant: true, i18n: 'metric.co', unit: 'µg/m³' },
];

export const WEATHER_METRICS = [
  { key: 'temperature_2m', id: 'temp', color: '#f59e0b', isPollutant: false, i18n: 'metric.temp', unit: '°C', hasBadge: true },
  { key: 'relative_humidity_2m', id: 'humidity', color: '#0891b2', isPollutant: false, i18n: 'metric.humidity', unit: '%', hasBadge: true },
  { key: 'wind_speed_10m', id: 'wind', color: '#84cc16', isPollutant: false, i18n: 'metric.wind', unit: 'km/h', hasBadge: false },
  { key: 'precipitation', id: 'precip', color: '#2563eb', isPollutant: false, i18n: 'metric.precip', unit: 'mm', hasBadge: false },
];

export const ALL_METRICS = [...AIR_METRICS, ...WEATHER_METRICS];

export const THRESHOLD_METRIC_LABELS = {
  pm2_5: 'PM2.5', pm10: 'PM10', nitrogen_dioxide: 'NO₂', ozone: 'O₃', carbon_monoxide: 'CO',
};

export const KNOWN_LOCATIONS = {
  colombo: {
    'galle road': [6.8905, 79.8565], 'baseline road': [6.9147, 79.8774],
    kolonnawa: [6.9319, 79.8817], sapugaskanda: [6.9944, 79.9142],
    fort: [6.9344, 79.8428], pettah: [6.9385, 79.85],
    borella: [6.9147, 79.8774], kollupitiya: [6.9147, 79.85],
    colombo: [6.9271, 79.8612],
  },
  kandy: {
    'kandy lake': [7.2925, 80.6414], peradeniya: [7.2599, 80.5977],
    katugastota: [7.3312, 80.6193], kandy: [7.2906, 80.6337],
  },
  galle: {
    'galle fort': [6.0261, 80.2168], karapitiya: [6.0745, 80.235],
    habaraduwa: [5.995, 80.301], galle: [6.0535, 80.221],
  },
  jaffna: {
    'jaffna fort': [9.665, 80.0092], nallur: [9.6747, 80.0257],
    chunnakam: [9.7451, 80.0217], jaffna: [9.6615, 80.0255],
  },
};

export const STATUS_LABELS = { proposed: 'Proposed', in_progress: 'In Progress', implemented: 'Implemented' };
export const STATUS_ORDER = ['proposed', 'in_progress', 'implemented'];
