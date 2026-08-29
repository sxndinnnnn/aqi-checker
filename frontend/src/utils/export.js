import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ALL_METRICS, STATUS_LABELS } from '../metrics';
import { classifyLadder, classifyTemp, classifyHumidity, POLLUTANT_LADDERS } from './aqi';

function metricRow(m, airQuality, weather, t) {
  const isWeather = ['temp', 'humidity', 'wind', 'precip'].includes(m.id);
  const value = isWeather ? weather[m.key] : airQuality[m.key];
  let status = null;
  if (m.id === 'temp') status = classifyTemp(weather.temperature_2m);
  else if (m.id === 'humidity') status = classifyHumidity(weather.relative_humidity_2m);
  else if (POLLUTANT_LADDERS[m.id]) status = classifyLadder(value, POLLUTANT_LADDERS[m.id]);
  return { label: t(m.i18n), value, unit: m.unit, statusLabel: status ? status.label : '' };
}

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCsv({ cityName, cityId, airQuality, weather, esgResult, mitigation, t }) {
  const rows = [];
  rows.push(['City', cityName]);
  rows.push(['Exported At', new Date().toISOString()]);
  if (esgResult?.score != null) rows.push(['ESG Score', esgResult.score]);
  rows.push([]);
  rows.push(['Metric', 'Value', 'Unit', 'Status']);
  ALL_METRICS.forEach((m) => {
    const row = metricRow(m, airQuality, weather, t);
    rows.push([row.label, row.value, row.unit, row.statusLabel]);
  });
  rows.push([]);
  rows.push(['Mitigation Measure', 'Status', 'Status Date', 'Note']);
  mitigation.forEach((m) => {
    rows.push([m.title, STATUS_LABELS[m.status] || m.status, new Date(m.status_date).toLocaleDateString(), m.note || '']);
  });
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  downloadBlob(csv, `esg-report-${cityId}-${Date.now()}.csv`, 'text/csv');
}

function htmlToText(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || '').replace(/\n{3,}/g, '\n\n');
}

export function exportPdf({ cityName, cityId, airQuality, weather, esgResult, mitigation, currentHtml, t }) {
  const doc = new jsPDF();
  let y = 15;
  doc.setFontSize(16);
  doc.text('ESG Environmental Monitoring Report', 14, y); y += 8;
  doc.setFontSize(10);
  doc.text(`${cityName} - ${new Date().toLocaleString()}`, 14, y); y += 6;
  if (esgResult?.score != null) {
    doc.text(`ESG Score: ${esgResult.score} / 100`, 14, y); y += 4;
  }
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [['Metric', 'Value', 'Status']],
    body: ALL_METRICS.map((m) => {
      const row = metricRow(m, airQuality, weather, t);
      return [row.label, `${row.value ?? ''} ${row.unit}`, row.statusLabel];
    }),
    styles: { fontSize: 9 },
  });
  y = doc.lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.text('AI Environmental Analysis (summary)', 14, y); y += 6;
  doc.setFontSize(9);
  const currentText = htmlToText(currentHtml).slice(0, 1200);
  const lines = doc.splitTextToSize(currentText, 180);
  doc.text(lines, 14, y);
  y += lines.length * 4 + 10;

  if (mitigation.length) {
    if (y > 240) { doc.addPage(); y = 15; }
    doc.setFontSize(12);
    doc.text('Mitigation Measures', 14, y); y += 6;
    autoTable(doc, {
      startY: y,
      head: [['Title', 'Status', 'Since', 'Note']],
      body: mitigation.map((m) => [m.title, STATUS_LABELS[m.status] || m.status, new Date(m.status_date).toLocaleDateString(), m.note || '']),
      styles: { fontSize: 8 },
    });
  }

  doc.save(`esg-report-${cityId}-${Date.now()}.pdf`);
}
