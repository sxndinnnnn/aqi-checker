// Sinhala/Tamil strings are AI-generated, not reviewed by a native speaker -
// verify before official/public use. Scope: section headers, metric names,
// tab names, and the status legend. Dynamic AI insight text and per-badge
// status words (Good/Moderate/Unhealthy) stay in English.
export const TRANSLATIONS = {
  en: {
    subtitle: 'Real-time Environmental Insights',
    airQualityMetrics: 'Air Quality Metrics', climateWeather: 'Climate/Weather',
    'metric.pm25': 'PM 2.5', 'metric.pm10': 'PM 10', 'metric.no2': 'Nitrogen Dioxide (NO₂)',
    'metric.o3': 'Ozone (O₃)', 'metric.co': 'Carbon Monoxide (CO)', 'metric.temp': 'Temperature',
    'metric.humidity': 'Humidity', 'metric.wind': 'Wind Speed', 'metric.precip': 'Precipitation',
    good: 'Good', moderate: 'Moderate', poorUnhealthy: 'Poor / Unhealthy',
    statusLegend: 'Status legend:',
    tabCurrent: 'Current Situation', tabPredictive: 'Predictive Insights',
    tabMitigation: 'Mitigation Measures', tabSummary: 'Summary',
    historicalTrends: 'Historical Trends', monitoringLocations: 'Monitoring Locations',
    esgScore: 'ESG Score', exportPdf: 'Export PDF', exportCsv: 'Export CSV',
    alertThresholdSettings: 'Alert threshold settings',
  },
  si: {
    subtitle: 'තථ්‍ය කාලීන පාරිසරික තොරතුරු',
    airQualityMetrics: 'වායු තත්ත්ව මිනුම්', climateWeather: 'දේශගුණය/කාලගුණය',
    'metric.pm25': 'PM 2.5', 'metric.pm10': 'PM 10', 'metric.no2': 'නයිට්‍රජන් ඩයොක්සයිඩ් (NO₂)',
    'metric.o3': 'ඕසෝන් (O₃)', 'metric.co': 'කාබන් මොනොක්සයිඩ් (CO)', 'metric.temp': 'උෂ්ණත්වය',
    'metric.humidity': 'ආර්ද්‍රතාවය', 'metric.wind': 'සුළං වේගය', 'metric.precip': 'වර්ෂාපතනය',
    good: 'හොඳයි', moderate: 'මධ්‍යස්ථ', poorUnhealthy: 'දුර්වල / අනාරෝගී',
    statusLegend: 'තත්ත්ව ලේබලය:',
    tabCurrent: 'වත්මන් තත්ත්වය', tabPredictive: 'අනාවැකි විශ්ලේෂණය',
    tabMitigation: 'අවම කිරීමේ පියවර', tabSummary: 'සාරාංශය',
    historicalTrends: 'ඓතිහාසික ප්‍රවණතා', monitoringLocations: 'නිරීක්ෂණ ස්ථාන',
    esgScore: 'ESG ලකුණු', exportPdf: 'PDF නිර්යාත කරන්න', exportCsv: 'CSV නිර්යාත කරන්න',
    alertThresholdSettings: 'අනතුරු ඇඟවීම් සීමා සැකසුම්',
  },
  ta: {
    subtitle: 'நேரடி சுற்றுச்சூழல் நுண்ணறிவு',
    airQualityMetrics: 'காற்று தர அளவீடுகள்', climateWeather: 'காலநிலை/வானிலை',
    'metric.pm25': 'PM 2.5', 'metric.pm10': 'PM 10', 'metric.no2': 'நைட்ரஜன் டை ஆக்சைடு (NO₂)',
    'metric.o3': 'ஓசோன் (O₃)', 'metric.co': 'கார்பன் மோனாக்சைடு (CO)', 'metric.temp': 'வெப்பநிலை',
    'metric.humidity': 'ஈரப்பதம்', 'metric.wind': 'காற்றின் வேகம்', 'metric.precip': 'மழைவீழ்ச்சி',
    good: 'நல்லது', moderate: 'மிதமான', poorUnhealthy: 'மோசமான / ஆரோக்கியமற்ற',
    statusLegend: 'நிலை விளக்கம்:',
    tabCurrent: 'தற்போதைய நிலை', tabPredictive: 'முன்கணிப்பு பகுப்பாய்வு',
    tabMitigation: 'தணிப்பு நடவடிக்கைகள்', tabSummary: 'சுருக்கம்',
    historicalTrends: 'வரலாற்று போக்குகள்', monitoringLocations: 'கண்காணிப்பு இடங்கள்',
    esgScore: 'ESG மதிப்பெண்', exportPdf: 'PDF ஏற்றுமதி', exportCsv: 'CSV ஏற்றுமதி',
    alertThresholdSettings: 'எச்சரிக்கை வரம்பு அமைப்புகள்',
  },
};

export function translate(lang, key) {
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
}
