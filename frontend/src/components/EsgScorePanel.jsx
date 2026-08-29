import { useMemo } from 'react';
import {
  Card, CardHeader, CardContent, Box, Stack, Typography, Alert, CircularProgress,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import { Line } from 'react-chartjs-2';
import { formatLabel } from '../utils/format';
import '../chartSetup';

function scoreColor(score) {
  if (score >= 70) return '#16a34a';
  if (score >= 40) return '#d97706';
  return '#dc2626';
}

export default function EsgScorePanel({ result, loading, range }) {
  const chartData = useMemo(() => {
    if (!result || !result.trend?.length) return null;
    return {
      labels: result.trend.map((pt) => formatLabel(new Date(pt.period_start), range)),
      datasets: [{ data: result.trend.map((pt) => pt.score), borderColor: '#10b981', backgroundColor: '#10b98133', fill: true, pointRadius: 2, tension: 0.3 }],
    };
  }, [result, range]);

  return (
    <Card sx={{ mt: 3, borderTop: 4, borderColor: '#10b981' }}>
      <CardHeader
        avatar={<VerifiedIcon sx={{ color: '#10b981' }} />}
        title={<Box display="flex" alignItems="center" gap={1}>ESG Score {loading && <CircularProgress size={14} />}</Box>}
        subheader={result?.methodology}
      />
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={3} mb={2}>
          <Box textAlign="center">
            <Typography variant="h3" fontWeight={800} sx={{ color: result?.score != null ? scoreColor(result.score) : 'text.secondary' }}>
              {result?.score ?? '--'}
            </Typography>
            <Typography variant="caption" color="text.secondary">out of 100</Typography>
          </Box>
          <Box>
            <Typography variant="body2">Environmental: <strong>{result?.environmental_component ?? '--'}</strong> / 70</Typography>
            <Typography variant="body2">
              Governance: <strong>{result?.governance_component ?? '--'}</strong> / 30
              {result && ` (${result.measures_implemented}/${result.measures_total} measures implemented)`}
            </Typography>
          </Box>
        </Stack>
        {result?.score == null ? (
          <Alert severity="info">Not enough historical data yet to compute an ESG score.</Alert>
        ) : (
          <Box sx={{ height: 180, p: 1.5, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>ESG Score Trend</Typography>
            <Box sx={{ height: 'calc(100% - 20px)' }}>
              {chartData && (
                <Line
                  role="img" aria-label="ESG score trend chart"
                  data={chartData}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }}
                />
              )}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
