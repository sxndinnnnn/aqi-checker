import { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { ALL_METRICS, AIR_METRICS } from '../metrics';
import { formatLabel } from '../utils/format';
import '../chartSetup';

export default function ImpactChart({ measure, readings, range }) {
  const metricConfig = ALL_METRICS.find((m) => m.key === measure.target_metric) || AIR_METRICS[0];

  const { summary, chartData, lineLabel } = useMemo(() => {
    if (!readings.length) return { summary: 'No historical data yet for impact comparison.', chartData: null };
    const startDate = new Date(measure.implemented_start_date);
    const before = readings.filter((r) => new Date(r.recorded_at) < startDate).map((r) => r[metricConfig.key]).filter((v) => v != null);
    const after = readings.filter((r) => new Date(r.recorded_at) >= startDate).map((r) => r[metricConfig.key]).filter((v) => v != null);
    const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
    const beforeAvg = avg(before);
    const afterAvg = avg(after);

    let summaryText = 'Not enough data before/after this date yet.';
    if (beforeAvg != null && afterAvg != null && beforeAvg !== 0) {
      const pctChange = ((afterAvg - beforeAvg) / beforeAvg) * 100;
      const dir = pctChange < 0 ? 'decreased' : 'increased';
      summaryText = `Avg ${metricConfig.i18n.replace('metric.', '')} before: ${beforeAvg.toFixed(1)}, after: ${afterAvg.toFixed(1)} (${dir} ${Math.abs(pctChange).toFixed(0)}%)`;
    }

    const labels = readings.map((r) => formatLabel(new Date(r.recorded_at), range));
    const data = readings.map((r) => r[metricConfig.key]);
    const splitIndex = readings.findIndex((r) => new Date(r.recorded_at) >= startDate);
    const label = splitIndex >= 0 ? labels[splitIndex] : labels[labels.length - 1];

    return {
      summary: summaryText,
      lineLabel: label,
      chartData: {
        labels,
        datasets: [{ data, borderColor: metricConfig.color, backgroundColor: `${metricConfig.color}33`, fill: true, pointRadius: 0, tension: 0.3, spanGaps: true }],
      },
    };
  }, [readings, measure.implemented_start_date, metricConfig, range]);

  return (
    <Box mt={1.5} pt={1.5} borderTop="1px solid" borderColor="divider">
      <Typography variant="caption" color="text.secondary">{summary}</Typography>
      {chartData && (
        <Box sx={{ height: 140, mt: 1 }}>
          <Line
            role="img"
            aria-label={`Impact chart for ${measure.title}`}
            data={chartData}
            options={{
              responsive: true, maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                annotation: {
                  annotations: {
                    implLine: {
                      type: 'line', scaleID: 'x', value: lineLabel,
                      borderColor: '#16a34a', borderWidth: 2, borderDash: [4, 4],
                      label: { display: true, content: 'Implemented', position: 'start', backgroundColor: '#16a34a', color: '#fff', font: { size: 9 } },
                    },
                  },
                },
              },
              scales: { x: { ticks: { font: { size: 8 }, maxTicksLimit: 5 } }, y: { ticks: { font: { size: 8 } } } },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
