const BASE = '/api';

async function getJson(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const fetchCities = () => getJson(`${BASE}/cities`);

export const fetchEnvironmentalData = (city) =>
  getJson(`${BASE}/environmental-data?city=${city}`);

export const fetchHistory = (city, range) =>
  getJson(`${BASE}/history?range=${range}&city=${city}`);

export const fetchMitigation = (city) =>
  getJson(`${BASE}/mitigation?city=${city}`);

export const generateMoreMitigation = (city) =>
  getJson(`${BASE}/mitigation/generate?city=${city}`, { method: 'POST' });

export const patchMitigation = (id, body) =>
  getJson(`${BASE}/mitigation/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const fetchEsgScore = (city, range) =>
  getJson(`${BASE}/esg-score?city=${city}&range=${range}`);
