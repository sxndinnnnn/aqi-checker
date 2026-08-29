import { useState } from 'react';
import {
  Box, Card, CardContent, Typography, Select, MenuItem, TextField, Alert, Button, Stack,
} from '@mui/material';
import { STATUS_LABELS, STATUS_ORDER, THRESHOLD_METRIC_LABELS } from '../metrics';
import ImpactChart from './ImpactChart';

function MitigationCard({ measure, onPatch, readings, range }) {
  const [note, setNote] = useState(measure.note || '');
  const [date, setDate] = useState(measure.implemented_start_date || '');

  return (
    <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{measure.title}</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>{measure.description}</Typography>
          </Box>
          <Select
            size="small"
            value={measure.status}
            onChange={(e) => onPatch(measure.id, { status: e.target.value })}
            aria-label={`Status for ${measure.title}`}
          >
            {STATUS_ORDER.map((s) => (
              <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>
            ))}
          </Select>
        </Stack>
        <Typography variant="caption" color="text.secondary" display="block" mt={1}>
          Status set: {new Date(measure.status_date).toLocaleDateString()} &middot; targets {THRESHOLD_METRIC_LABELS[measure.target_metric] || measure.target_metric}
        </Typography>
        <TextField
          fullWidth multiline minRows={2} size="small" placeholder="Optional note..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => { if (note !== (measure.note || '')) onPatch(measure.id, { note }); }}
          sx={{ mt: 1.5 }}
          aria-label={`Note for ${measure.title}`}
        />
        {measure.status === 'implemented' && (
          <Box mt={2} pt={2} borderTop="1px solid" borderColor="divider">
            <TextField
              type="date" size="small" label="Impact tracking start date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onBlur={() => { if (date !== (measure.implemented_start_date || '')) onPatch(measure.id, { implemented_start_date: date }); }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            {measure.implemented_start_date && (
              <ImpactChart measure={measure} readings={readings} range={range} />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default function MitigationPanel({ measures, storageConfigured, onPatch, onGenerateMore, readings, range }) {
  const [generating, setGenerating] = useState(false);

  if (!measures.length) {
    return (
      <Alert severity="info">
        No tracked mitigation measures yet{storageConfigured ? '.' : " - historical storage isn't configured, so measures can't be tracked."}
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      {measures.map((m) => (
        <MitigationCard key={m.id} measure={m} onPatch={onPatch} readings={readings} range={range} />
      ))}
      {storageConfigured && (
        <Button
          size="small" sx={{ alignSelf: 'flex-start' }} disabled={generating}
          onClick={async () => { setGenerating(true); try { await onGenerateMore(); } finally { setGenerating(false); } }}
        >
          {generating ? 'Generating...' : '+ Suggest more measures'}
        </Button>
      )}
    </Stack>
  );
}
