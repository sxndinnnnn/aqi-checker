import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardHeader, CardContent, Typography } from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import { KNOWN_LOCATIONS } from '../metrics';

// react-leaflet's default marker icon URLs break under bundlers (Vite/webpack)
// since Leaflet references them as plain string paths - rebuild with the
// bundled asset URLs instead.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function FitBounds({ bounds }) {
  const map = useMap();
  if (bounds.length === 1) map.setView(bounds[0], 12);
  else if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30] });
  else map.setView([7.5, 80.5], 7);
  return null;
}

export default function MonitoringMap({ cityId, insightsText, airQuality, weather }) {
  const pins = useMemo(() => {
    const locations = KNOWN_LOCATIONS[cityId] || {};
    const landmarks = Object.entries(locations).filter(([name]) => name !== cityId);
    const lowerText = (insightsText || '').toLowerCase();
    const matched = landmarks.filter(([name]) => lowerText.includes(name));
    return matched.length ? matched : (locations[cityId] ? [[cityId, locations[cityId]]] : []);
  }, [cityId, insightsText]);

  const bounds = pins.map(([, coords]) => coords);

  return (
    <Card sx={{ mt: 3, borderTop: 4, borderColor: '#0d9488' }}>
      <CardHeader
        avatar={<PlaceIcon sx={{ color: '#0d9488' }} />}
        title="Monitoring Locations"
        subheader="Pins mark locations mentioned in the AI's mitigation section for the current city. Metrics shown are the city-wide reading, not hyperlocal sensor data."
      />
      <CardContent>
        <MapContainer
          center={[7.5, 80.5]} zoom={7} scrollWheelZoom={false}
          style={{ height: 320, borderRadius: 8 }}
          aria-label="Map of monitoring locations for the current city"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds bounds={bounds} />
          {pins.map(([name, coords]) => (
            <Marker key={name} position={coords} icon={defaultIcon}>
              <Popup>
                <Typography fontWeight={700} mb={0.5}>{titleCase(name)}</Typography>
                <Typography variant="body2">PM2.5: {airQuality.pm2_5 ?? '--'} µg/m³ &middot; PM10: {airQuality.pm10 ?? '--'} µg/m³</Typography>
                <Typography variant="body2">NO₂: {airQuality.nitrogen_dioxide ?? '--'} µg/m³ &middot; O₃: {airQuality.ozone ?? '--'} µg/m³</Typography>
                <Typography variant="body2">Temp: {weather.temperature_2m ?? '--'}°C &middot; Humidity: {weather.relative_humidity_2m ?? '--'}%</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>City-wide reading - not hyperlocal to this point.</Typography>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
