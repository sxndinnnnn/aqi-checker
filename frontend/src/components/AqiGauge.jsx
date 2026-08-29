import { useMemo } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { aqiCategory } from '../utils/aqi';

const BANDS = [
  { from: 0, to: 50, color: '#22c55e' },
  { from: 50, to: 100, color: '#eab308' },
  { from: 100, to: 150, color: '#f97316' },
  { from: 150, to: 200, color: '#ef4444' },
  { from: 200, to: 300, color: '#a855f7' },
  { from: 300, to: 500, color: '#7f1d1d' },
];

// phi 0 = left end, 90 = top, 180 = right end.
function pointOnGauge(cx, cy, r, phiDeg) {
  const alpha = ((180 - phiDeg) * Math.PI) / 180;
  return { x: cx + r * Math.cos(alpha), y: cy - r * Math.sin(alpha) };
}

function arcPath(cx, cy, r, phi1, phi2) {
  const start = pointOnGauge(cx, cy, r, phi1);
  const end = pointOnGauge(cx, cy, r, phi2);
  const largeArc = phi2 - phi1 > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export default function AqiGauge({ result }) {
  const cx = 100, cy = 105, rTrack = 80, rNeedle = 62;

  const category = result ? aqiCategory(result.aqi) : null;
  const phi = result ? Math.max(0, Math.min(180, (result.aqi / 500) * 180)) : 0;
  const needleEnd = useMemo(() => pointOnGauge(cx, cy, rNeedle, phi), [phi]);

  const label = `Composite air quality index gauge${result ? `: ${result.aqi}, ${category.label}, dominant pollutant ${result.dominant}` : ''}`;

  return (
    <Stack alignItems="center" spacing={0}>
      <Box component="svg" viewBox="0 0 200 120" role="img" aria-label={label} sx={{ width: 160, height: 96 }}>
        {BANDS.map((b) => (
          <path
            key={b.from}
            d={arcPath(cx, cy, rTrack, (b.from / 500) * 180, (b.to / 500) * 180)}
            stroke={b.color}
            strokeWidth={18}
            fill="none"
          />
        ))}
        <line
          x1={cx} y1={cy}
          x2={result ? needleEnd.x : cx - rTrack + 18}
          y2={result ? needleEnd.y : cy}
          stroke={category ? category.color : '#111827'}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={5} fill="#111827" />
        <text
          x={cx} y={cy - 22} textAnchor="middle"
          fontSize="2rem" fontWeight="800"
          fill={category ? category.color : '#6b7280'}
        >
          {result ? result.aqi : '--'}
        </text>
      </Box>
      <Typography variant="body2" fontWeight={700} sx={{ color: category ? category.color : 'text.secondary' }}>
        {category ? category.label : 'N/A'}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {result ? `Composite AQI · dominant: ${result.dominant}` : 'Composite AQI unavailable'}
      </Typography>
    </Stack>
  );
}
