import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, annotationPlugin);

export function setChartJsTheme(mode) {
  ChartJS.defaults.color = mode === 'dark' ? '#cbd5e1' : '#6b7280';
  ChartJS.defaults.borderColor = mode === 'dark' ? '#334155' : '#e5e7eb';
}

export { ChartJS };
