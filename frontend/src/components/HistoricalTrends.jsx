import { useMemo, useState } from 'react';
import {
  Card, CardHeader, CardContent, Box, ToggleButtonGroup, ToggleButton,
  Typography, Alert, CircularProgress,
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { Line } from 'react-chartjs-2';
import { AIR_METRICS, WEATHER_METRICS } from '../metrics';
import { formatLabel } from '../utils/format';
import { useI18n } from '../I18nContext';
import '../chartSetup';

const RANGES = ['24h', '7d', '30d', '90d'];

function MiniChart({ title, labels, data, color, ariaLabel }) {
  return (
    <Box sx={{ height: 180, p: 1.5, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} mb={0.5}>{title}</Typography>
      <Box sx={{ flex: 1, position: 'relative' }}>
        <Line
          role="img"
          aria-label={ariaLabel}
          data={{
            labels,
            datasets: [{ data, borderColor: color, backgroundColor: `${color}33`, fill: true, pointRadius: 0, tension: 0.3, spanGaps: true }],
          }}
          options={{
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { maxTicksLimit: 5, font: { size: 9 } } }, y: { ticks: { font: { size: 9 } } } },
          }}
        />
      </Box>
    </Box>
  );
}

export default function HistoricalTrends({ range, onRangeChange, readings, loading }) {
  const t = useI18n();
  const labels = useMemo(() => readings.map((r) => formatLabel(new Date(r.recorded_at), range)), [readings, range]);

  return (
    <Card sx={{ mt: 3, borderTop: 4, borderColor: 'primary.main' }}>
      <CardHeader
        avatar={<ShowChartIcon color="primary" />}
        title={
          <Box display="flex" alignItems="center" gap={1}>
            Historical Trends
            {loading && <CircularProgress size={14} />}
          </Box>
        }
        action={
          <ToggleButtonGroup
            size="small"
            value={range}
            exclusive
            onChange={(e, val) => val && onRangeChange(val)}
            aria-label="Select time range"
          >
            {RANGES.map((r) => (
              <ToggleButton key={r} value={r} aria-pressed={range === r}>{r}</ToggleButton>
            ))}
          </ToggleButtonGroup>
        }
      />
      <CardContent>
        {!readings.length ? (
          <Alert severity="info">
            No historical data yet for this range. Readings are collected automatically once a day, plus every time this dashboard is loaded - check back after a few days.
          </Alert>
        ) : (
          <>
            <Typography variant="overline" color="text.secondary">Air Quality</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2, mb: 3, mt: 1 }}>
              {AIR_METRICS.map((m) => (
                <MiniChart
                  key={m.id}
                  title={`${t(m.i18n)} (${m.unit})`}
                  ariaLabel={`${m.id} historical trend chart`}
                  labels={labels}
                  data={readings.map((r) => r[m.key])}
                  color={m.color}
                />
              ))}
            </Box>
            <Typography variant="overline" color="text.secondary">Weather</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mt: 1 }}>
              {WEATHER_METRICS.map((m) => (
                <MiniChart
                  key={m.id}
                  title={`${t(m.i18n)} (${m.unit})`}
                  ariaLabel={`${m.id} historical trend chart`}
                  labels={labels}
                  data={readings.map((r) => r[m.key])}
                  color={m.color}
                />
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
