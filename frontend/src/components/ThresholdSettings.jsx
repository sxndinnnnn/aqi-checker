import {
  Accordion, AccordionSummary, AccordionDetails, Typography, Box, TextField, Button, Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { THRESHOLD_METRIC_LABELS } from '../metrics';
import { useI18n } from '../I18nContext';

export default function ThresholdSettings({ defaults, activeThresholds, onChange, onReset }) {
  const t = useI18n();
  if (!defaults) return null;

  return (
    <Accordion sx={{ mb: 2 }} disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography fontWeight={600}>{t('alertThresholdSettings')}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
          Defaults to WHO Air Quality Guideline levels (µg/m³). Overrides are saved in this browser only.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
          {Object.keys(defaults).map((metric) => (
            <TextField
              key={metric}
              type="number"
              size="small"
              label={`${THRESHOLD_METRIC_LABELS[metric] || metric} (µg/m³)`}
              value={activeThresholds[metric] ?? ''}
              onChange={(e) => onChange(metric, e.target.value)}
              slotProps={{ htmlInput: { 'aria-label': `${THRESHOLD_METRIC_LABELS[metric] || metric} alert threshold` } }}
            />
          ))}
        </Box>
        <Stack direction="row" justifyContent="flex-end" mt={2}>
          <Button size="small" onClick={onReset}>Reset to WHO defaults</Button>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
