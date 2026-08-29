import { Select, MenuItem } from '@mui/material';

export default function CitySelect({ cities, value, onChange }) {
  if (!cities.length) return null;
  return (
    <Select size="small" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Select city" sx={{ fontWeight: 700 }}>
      {cities.map((c) => (
        <MenuItem key={c.id} value={c.id}>{c.name.split(',')[0]}</MenuItem>
      ))}
    </Select>
  );
}
