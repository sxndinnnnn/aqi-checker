import { useMemo, useRef, useEffect } from 'react';
import { Box, Alert, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Line } from 'react-chartjs-2';
import { buildForecast } from '../utils/forecast';
import { makeTablesResponsive } from '../utils/responsiveTables';
import '../chartSetup';

export default function ForecastChart({ readings, rationaleHtml }) {
  const forecast = useMemo(() => buildForecast(readings), [readings]);
  const rationaleRef = useRef(null);

  useEffect(() => {
    makeTablesResponsive(rationaleRef.current);
  }, [rationaleHtml]);

  const data = forecast && {
    labels: forecast.labels,
    datasets: [
      { label: 'Confidence band', data: forecast.upperBand, borderColor: 'transparent', backgroundColor: 'rgba(99,102,241,0.15)', pointRadius: 0, fill: '+1', spanGaps: true },
      { label: 'Lower bound', data: forecast.lowerBand, borderColor: 'transparent', backgroundColor: 'rgba(99,102,241,0.15)', pointRadius: 0, fill: false, spanGaps: true },
      { label: 'Forecast', data: forecast.forecastLine, borderColor: '#6366f1', borderDash: [6, 4], pointRadius: 0, fill: false, spanGaps: true },
      { label: 'Historical', data: forecast.historyLine, borderColor: '#111827', backgroundColor: 'transparent', pointRadius: 0, fill: false, spanGaps: true },
    ],
  };

  return (
    <Box>
      <Box sx={{ height: 220, p: 1.5, mb: 2, borderRadius: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>Composite AQI Forecast (next 48h)</Typography>
        {forecast ? (
          <Box sx={{ height: 'calc(100% - 20px)' }}>
            <Line
              role="img"
              aria-label="Composite AQI forecast chart, historical and next 48 hours"
              data={data}
              options={{
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { labels: { filter: (item) => ['Historical', 'Forecast', 'Confidence band'].includes(item.text) } } },
                scales: {
                  x: { ticks: { maxTicksLimit: 8, font: { size: 9 } } },
                  y: { title: { display: true, text: 'Composite AQI' }, beginAtZero: true },
                },
              }}
            />
          </Box>
        ) : (
          <Alert severity="info" sx={{ mt: 1 }}>
            Not enough historical data yet to forecast a trend - check back after a few days of data collection.
          </Alert>
        )}
      </Box>
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight={600} variant="body2">AI rationale for this forecast</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box ref={rationaleRef} className="markdown-body" dangerouslySetInnerHTML={{ __html: rationaleHtml }} />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
