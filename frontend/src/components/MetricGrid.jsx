import { Box, Chip, Stack, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useI18n } from '../I18nContext';

function TrendIcon({ trend }) {
  if (!trend) return null;
  const Icon = trend.arrow === 'up' ? ArrowUpwardIcon : trend.arrow === 'down' ? ArrowDownwardIcon : ArrowForwardIcon;
  return (
    <Box component="span" title={trend.title} sx={{ display: 'inline-flex', color: trend.color, ml: 0.5 }}>
      <Icon fontSize="inherit" />
    </Box>
  );
}

function MetricCard({ metric, value, status, trend }) {
  const t = useI18n();
  return (
    <Box
      sx={{
        p: 1.5, borderRadius: 2, bgcolor: 'action.hover',
        border: '1px solid', borderColor: 'divider',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Typography variant="body2" color="text.secondary">{t(metric.i18n)}</Typography>
        {(metric.hasBadge ?? true) && status && (
          <Chip size="small" color={status.cls} label={status.label} />
        )}
      </Stack>
      <Stack direction="row" alignItems="baseline" spacing={0.5}>
        <Typography variant="h6" fontWeight={700}>{value ?? '--'}</Typography>
        <Typography variant="caption" color="text.secondary">{metric.unit}</Typography>
        <TrendIcon trend={trend} />
      </Stack>
    </Box>
  );
}

export default function MetricGrid({ metrics, data, statuses, trends, columns }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: `repeat(${columns ?? 2}, 1fr)` },
        gap: 2,
      }}
    >
      {metrics.map((m) => (
        <MetricCard
          key={m.id}
          metric={m}
          value={data ? data[m.key] : null}
          status={statuses ? statuses[m.id] : null}
          trend={trends ? trends[m.id] : null}
        />
      ))}
    </Box>
  );
}
