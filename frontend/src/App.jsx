import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  ThemeProvider, CssBaseline, Container, Box, Stack, Typography, Alert as MuiAlert,
  CircularProgress, Backdrop,
} from '@mui/material';
import { buildTheme } from './theme';
import { I18nProvider, useI18n } from './I18nContext';
import { setChartJsTheme } from './chartSetup';
import * as api from './api';
import {
  ALL_METRICS, AIR_METRICS, WEATHER_METRICS, THRESHOLD_METRIC_LABELS,
} from './metrics';
import { computeCompositeAQI, classifyLadder, classifyTemp, classifyHumidity, POLLUTANT_LADDERS } from './utils/aqi';
import { splitInsights } from './utils/insights';

import Navbar from './components/Navbar';
import CitySelect from './components/CitySelect';
import AqiGauge from './components/AqiGauge';
import AlertBanner from './components/AlertBanner';
import ThresholdSettings from './components/ThresholdSettings';
import MetricGrid from './components/MetricGrid';
import InsightsPanel from './components/InsightsPanel';
import MonitoringMap from './components/MonitoringMap';
import HistoricalTrends from './components/HistoricalTrends';
import EsgScorePanel from './components/EsgScorePanel';
import ExportButtons from './components/ExportButtons';

const KEY_RISK_REGEX = /key risk window[:\s]*([^\n]*)/i;

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function computeTrends(airQuality, weather, reference) {
  if (!reference) return {};
  const trends = {};
  const apply = (metric, currentValue) => {
    const previous = reference[metric.key];
    if (previous == null || currentValue == null || Number.isNaN(currentValue)) return;
    const delta = currentValue - previous;
    const noiseFloor = Math.max(Math.abs(previous) * 0.02, 0.05);
    let arrow = 'flat', color = 'text.disabled';
    if (delta > noiseFloor) { arrow = 'up'; color = metric.isPollutant ? '#ef4444' : 'text.secondary'; }
    else if (delta < -noiseFloor) { arrow = 'down'; color = metric.isPollutant ? '#16a34a' : 'text.secondary'; }
    trends[metric.id] = { arrow, color, title: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} vs ~24h ago (was ${previous})` };
  };
  AIR_METRICS.forEach((m) => apply(m, airQuality[m.key]));
  WEATHER_METRICS.forEach((m) => apply(m, weather[m.key]));
  return trends;
}

function computeStatuses(airQuality, weather) {
  const statuses = {};
  AIR_METRICS.forEach((m) => { statuses[m.id] = classifyLadder(airQuality[m.key], POLLUTANT_LADDERS[m.id]); });
  statuses.temp = classifyTemp(weather.temperature_2m);
  statuses.humidity = classifyHumidity(weather.relative_humidity_2m);
  return statuses;
}

function Dashboard({ mode }) {
  const t = useI18n();

  const [cities, setCities] = useState([]);
  const [cityId, setCityId] = useState(() => localStorage.getItem('selectedCity') || 'colombo');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [range, setRange] = useState('7d');
  const [historyReadings, setHistoryReadings] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [trendReference, setTrendReference] = useState(null);

  const [thresholdOverrides, setThresholdOverrides] = useState(() => loadJson('thresholdOverrides', {}));

  const [mitigation, setMitigation] = useState([]);
  const [mitigationStorageConfigured, setMitigationStorageConfigured] = useState(false);

  const [esgResult, setEsgResult] = useState(null);
  const [esgLoading, setEsgLoading] = useState(false);

  useEffect(() => { setChartJsTheme(mode); }, [mode, data]);
  useEffect(() => { localStorage.setItem('selectedCity', cityId); }, [cityId]);

  useEffect(() => {
    api.fetchCities().then((res) => {
      setCities(res.cities);
      if (!res.cities.some((c) => c.id === cityId)) setCityId(res.default);
    }).catch((e) => console.error('Failed to load city list:', e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMitigation = useCallback(async (city) => {
    try {
      const res = await api.fetchMitigation(city);
      setMitigation(res.measures || []);
      setMitigationStorageConfigured(res.storage_configured);
    } catch (e) { console.error('Failed to load mitigation measures:', e); }
  }, []);

  const loadEsgScore = useCallback(async (city, r) => {
    setEsgLoading(true);
    try {
      setEsgResult(await api.fetchEsgScore(city, r));
    } catch (e) { console.error('Failed to load ESG score:', e); }
    finally { setEsgLoading(false); }
  }, []);

  const loadHistory = useCallback(async (city, r) => {
    setHistoryLoading(true);
    try {
      const res = await api.fetchHistory(city, r);
      setHistoryReadings(res.readings || []);
    } catch (e) { console.error('Failed to load historical trends:', e); }
    finally { setHistoryLoading(false); }
    loadEsgScore(city, r);
  }, [loadEsgScore]);

  const loadTrendReference = useCallback(async (city) => {
    try {
      const res = await api.fetchHistory(city, '24h');
      setTrendReference(res.readings?.[0] || null);
    } catch (e) { console.error('Failed to load trend reference:', e); }
  }, []);

  const fetchDashboard = useCallback(async (city, isRefresh) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.fetchEnvironmentalData(city);
      setData(res);
      setError(null);
      setLoading(false);
      loadHistory(city, range);
      loadTrendReference(city);
      loadMitigation(city);
    } catch (e) {
      console.error('Failed to fetch data:', e);
      setError('Failed to load data from the backend. Make sure the FastAPI server is running.');
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadHistory, loadTrendReference, loadMitigation]);

  useEffect(() => {
    fetchDashboard(cityId, !loading);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  useEffect(() => {
    if (!data) return;
    loadHistory(cityId, range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const activeThresholds = useMemo(
    () => ({ ...(data?.alert_thresholds || {}), ...thresholdOverrides }),
    [data, thresholdOverrides],
  );

  const alertItems = useMemo(() => {
    if (!data) return [];
    const items = [];
    Object.entries(activeThresholds).forEach(([metric, limit]) => {
      const value = data.air_quality[metric];
      if (value != null && value > limit) {
        items.push(`${THRESHOLD_METRIC_LABELS[metric] || metric} is ${value} µg/m³, above your threshold of ${limit} µg/m³`);
      }
    });
    const riskMatch = data.insights && data.insights.match(KEY_RISK_REGEX);
    if (riskMatch && riskMatch[1]?.trim()) items.push(`Key Risk Window: ${riskMatch[1].trim()}`);
    return items;
  }, [data, activeThresholds]);

  const handleThresholdChange = (metric, rawValue) => {
    const value = parseFloat(rawValue);
    setThresholdOverrides((prev) => {
      const next = { ...prev };
      if (Number.isNaN(value)) delete next[metric];
      else next[metric] = value;
      localStorage.setItem('thresholdOverrides', JSON.stringify(next));
      return next;
    });
  };

  const handleThresholdReset = () => {
    setThresholdOverrides({});
    localStorage.setItem('thresholdOverrides', '{}');
  };

  const handleMitigationPatch = async (id, body) => {
    try {
      await api.patchMitigation(id, body);
      loadMitigation(cityId);
    } catch (e) { console.error('Failed to update mitigation measure:', e); }
  };

  const handleMitigationGenerateMore = async () => {
    try {
      await api.generateMoreMitigation(cityId);
      await loadMitigation(cityId);
    } catch (e) { console.error('Failed to generate more measures:', e); }
  };

  const trends = useMemo(() => (data ? computeTrends(data.air_quality, data.weather, trendReference) : {}), [data, trendReference]);
  const statuses = useMemo(() => (data ? computeStatuses(data.air_quality, data.weather) : {}), [data]);
  const aqiResult = useMemo(() => (data ? computeCompositeAQI(data.air_quality) : null), [data]);
  const parsedForExport = useMemo(() => (data ? splitInsights(data.insights) : null), [data]);

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2}>
        <CircularProgress color="success" />
        <Typography color="text.secondary">Fetching Live Data and Generating AI Insights...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <MuiAlert severity="error">{error}</MuiAlert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Backdrop open={refreshing} sx={{ position: 'absolute', zIndex: 1, bgcolor: 'rgba(255,255,255,0.4)' }} />

      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'flex-end' }} spacing={2} mb={3} pb={2} borderBottom="1px solid" borderColor="divider">
        <Box>
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
            <Typography variant="h4">{data.location}</Typography>
            <CitySelect cities={cities} value={cityId} onChange={setCityId} />
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" color="text.secondary">
              Last Updated: {new Date(data.air_quality.time).toLocaleString()}
            </Typography>
            {refreshing && <CircularProgress size={12} />}
          </Stack>
        </Box>
        <Stack direction="row" alignItems="center" spacing={3}>
          <ExportButtons
            context={{
              cityName: data.location, cityId, airQuality: data.air_quality, weather: data.weather,
              esgResult, mitigation, currentHtml: parsedForExport?.currentHtml || '',
            }}
          />
          <AqiGauge result={aqiResult} />
        </Stack>
      </Stack>

      <AlertBanner items={alertItems} />

      <ThresholdSettings
        defaults={data.alert_thresholds}
        activeThresholds={activeThresholds}
        onChange={handleThresholdChange}
        onReset={handleThresholdReset}
      />

      <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" mb={0.5}>
        <Typography variant="body2" fontWeight={600}>{t('statusLegend')}</Typography>
        <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'success.main' }} /><Typography variant="body2">{t('good')}</Typography></Stack>
        <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'warning.main' }} /><Typography variant="body2">{t('moderate')}</Typography></Stack>
        <Stack direction="row" spacing={0.5} alignItems="center"><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'error.main' }} /><Typography variant="body2">{t('poorUnhealthy')}</Typography></Stack>
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" mb={2}>
        Badges approximate WHO/EPA guidance using instantaneous readings (official AQI categories use 24-hour or 8-hour averages).
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
        <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper', borderTop: 4, borderColor: 'info.main', boxShadow: 1 }}>
          <Typography variant="h6" color="info.main" mb={2}>☁️ {t('airQualityMetrics')}</Typography>
          <MetricGrid metrics={AIR_METRICS} data={data.air_quality} statuses={statuses} trends={trends} columns={3} />
        </Box>
        <Box sx={{ p: 3, borderRadius: 2, bgcolor: 'background.paper', borderTop: 4, borderColor: 'warning.main', boxShadow: 1 }}>
          <Typography variant="h6" color="warning.main" mb={2}>☀️ {t('climateWeather')}</Typography>
          <MetricGrid metrics={WEATHER_METRICS} data={data.weather} statuses={statuses} trends={trends} columns={2} />
        </Box>
      </Box>

      <InsightsPanel
        insightsText={data.insights}
        mitigation={mitigation}
        mitigationStorageConfigured={mitigationStorageConfigured}
        onMitigationPatch={handleMitigationPatch}
        onMitigationGenerateMore={handleMitigationGenerateMore}
        historyReadings={historyReadings}
        range={range}
      />

      <MonitoringMap cityId={cityId} insightsText={data.insights} airQuality={data.air_quality} weather={data.weather} />

      <HistoricalTrends range={range} onRangeChange={setRange} readings={historyReadings} loading={historyLoading} />

      <EsgScorePanel result={esgResult} loading={esgLoading} range={range} />
    </Container>
  );
}

export default function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');
  const theme = useMemo(() => buildTheme(mode), [mode]);

  useEffect(() => { localStorage.setItem('theme', mode); }, [mode]);
  useEffect(() => { localStorage.setItem('lang', lang); }, [lang]);

  return (
    <I18nProvider lang={lang}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Navbar
          mode={mode}
          onToggleMode={() => setMode((m) => (m === 'dark' ? 'light' : 'dark'))}
          lang={lang}
          onLangChange={setLang}
        />
        <Dashboard mode={mode} />
      </ThemeProvider>
    </I18nProvider>
  );
}
