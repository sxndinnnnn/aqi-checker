import { Stack, Button } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import { exportCsv, exportPdf } from '../utils/export';
import { useI18n } from '../I18nContext';

export default function ExportButtons({ context }) {
  const t = useI18n();
  return (
    <Stack direction="row" spacing={1}>
      <Button size="small" variant="contained" color="inherit" startIcon={<PictureAsPdfIcon />} onClick={() => exportPdf({ ...context, t })}>
        {t('exportPdf')}
      </Button>
      <Button size="small" variant="outlined" color="inherit" startIcon={<TableChartIcon />} onClick={() => exportCsv({ ...context, t })}>
        {t('exportCsv')}
      </Button>
    </Stack>
  );
}
