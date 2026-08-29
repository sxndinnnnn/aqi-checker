import { useMemo, useRef, useEffect, useState } from 'react';
import {
  Card, CardHeader, CardContent, Tabs, Tab, Box, Chip, Typography,
} from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { splitInsights } from '../utils/insights';
import { makeTablesResponsive } from '../utils/responsiveTables';
import ForecastChart from './ForecastChart';
import MitigationPanel from './MitigationPanel';

function TabPanel({ value, index, children }) {
  return (
    <Box role="tabpanel" hidden={value !== index} id={`tab-panel-${index}`} aria-labelledby={`tab-btn-${index}`}>
      {value === index && children}
    </Box>
  );
}

export default function InsightsPanel({
  insightsText, mitigation, mitigationStorageConfigured, onMitigationPatch, onMitigationGenerateMore,
  historyReadings, range,
}) {
  const [tab, setTab] = useState(0);
  const currentRef = useRef(null);
  const summaryRef = useRef(null);

  const parsed = useMemo(() => splitInsights(insightsText), [insightsText]);

  useEffect(() => {
    makeTablesResponsive(currentRef.current);
    makeTablesResponsive(summaryRef.current);
  }, [parsed]);

  if (!parsed.hasHeading) {
    return (
      <Card sx={{ borderTop: 4, borderColor: 'success.main' }}>
        <CardHeader avatar={<LightbulbIcon color="success" />} title="AI-Generated ESG Predictive Insights & Mitigation" />
        <CardContent>
          <Box className="markdown-body" dangerouslySetInnerHTML={{ __html: parsed.currentHtml }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderTop: 4, borderColor: 'success.main' }}>
      <CardHeader
        avatar={<LightbulbIcon color="success" />}
        title="AI-Generated ESG Predictive Insights & Mitigation"
        action={
          <Chip
            size="small" sx={{ bgcolor: '#fef9c3', color: '#854d0e', mr: 2, mt: 1 }}
            label="⚠ AI-generated — verify before use in official reporting"
          />
        }
      />
      <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto" sx={{ px: 2 }}>
        <Tab label="Current Situation" id="tab-btn-0" aria-controls="tab-panel-0" />
        <Tab label="Predictive Insights" id="tab-btn-1" aria-controls="tab-panel-1" />
        <Tab label="Mitigation Measures" id="tab-btn-2" aria-controls="tab-panel-2" />
        <Tab label="Summary" id="tab-btn-3" aria-controls="tab-panel-3" />
      </Tabs>
      <CardContent>
        <TabPanel value={tab} index={0}>
          <Box ref={currentRef} className="markdown-body" dangerouslySetInnerHTML={{ __html: parsed.currentHtml }} />
        </TabPanel>
        <TabPanel value={tab} index={1}>
          <ForecastChart readings={historyReadings} rationaleHtml={parsed.predictiveHtml} />
        </TabPanel>
        <TabPanel value={tab} index={2}>
          <MitigationPanel
            measures={mitigation}
            storageConfigured={mitigationStorageConfigured}
            onPatch={onMitigationPatch}
            onGenerateMore={onMitigationGenerateMore}
            readings={historyReadings}
            range={range}
          />
        </TabPanel>
        <TabPanel value={tab} index={3}>
          {parsed.summaryHtml ? (
            <Box ref={summaryRef} className="markdown-body" dangerouslySetInnerHTML={{ __html: parsed.summaryHtml }} />
          ) : (
            <Typography color="text.secondary" variant="body2">No summary available.</Typography>
          )}
        </TabPanel>
      </CardContent>
    </Card>
  );
}
