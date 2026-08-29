import { marked } from 'marked';

// Skip short "Label: value" metadata lines (timestamps, report headers) so
// the summary surfaces actual analysis instead of a date stamp.
const METADATA_LINE = /^(timestamp|reporting time|report time|date|location)\s*:/i;

function firstSnippet(nodes) {
  for (const n of nodes) {
    if (n.nodeType === 1 && n.tagName === 'P' && n.textContent.trim()) {
      const text = n.textContent.trim();
      if (METADATA_LINE.test(text) || text.length < 25) continue;
      return text.split(/(?<=[.!?])\s/)[0];
    }
    if (n.nodeType === 1 && (n.tagName === 'UL' || n.tagName === 'OL')) {
      const li = n.querySelector('li');
      if (li) return li.textContent.trim();
    }
  }
  return null;
}

function nodesToHtml(nodes) {
  return nodes.map((n) => (n.nodeType === 1 ? n.outerHTML : n.textContent)).join('');
}

// Splits the AI's markdown into Current / Predictive / Summary HTML blocks.
// Mitigation measures are no longer parsed here (Phase 4 replaced that with
// a stable, tracked set from /api/mitigation) - only the narrative sections
// are derived from this text.
export function splitInsights(markdownText) {
  const html = marked.parse(markdownText || '');
  const temp = document.createElement('div');
  temp.innerHTML = html;
  const nodes = Array.from(temp.childNodes);
  const hasHeading = nodes.some((n) => n.nodeType === 1 && /^H[1-6]$/.test(n.tagName));

  if (!hasHeading) {
    return { hasHeading: false, currentHtml: html, predictiveHtml: '', summaryHtml: '' };
  }

  const sections = { intro: [], current: [], predictive: [], mitigation: [] };
  let bucket = 'intro';
  nodes.forEach((node) => {
    if (node.nodeType === 1 && /^H[1-6]$/.test(node.tagName)) {
      const text = node.textContent.toLowerCase();
      if (/current|situation/.test(text)) bucket = 'current';
      else if (/predict|trend|forecast/.test(text)) bucket = 'predictive';
      else if (/mitigat|action/.test(text)) bucket = 'mitigation';
    }
    sections[bucket].push(node);
  });

  const currentHtml = nodesToHtml(sections.intro.concat(sections.current));
  const predictiveHtml = nodesToHtml(sections.predictive);

  const summaryItems = [
    { key: 'current', label: 'Current Situation' },
    { key: 'predictive', label: 'Predictive Insights' },
  ]
    .map(({ key, label }) => {
      const snippet = firstSnippet(sections[key]);
      return snippet ? `<li style="margin-bottom:8px"><strong>${label}:</strong> ${snippet}</li>` : '';
    })
    .join('');

  const summaryHtml = summaryItems
    ? `<ul style="list-style:disc;margin-left:20px">${summaryItems}</ul><p style="font-size:0.75rem;color:#9ca3af;font-style:italic;margin-top:12px">Auto-generated summary — see the other tabs for full detail.</p>`
    : '<p style="color:#6b7280;font-size:0.875rem">No summary available.</p>';

  return { hasHeading: true, currentHtml, predictiveHtml, summaryHtml };
}
