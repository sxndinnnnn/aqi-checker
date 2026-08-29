import { AppBar, Toolbar, Typography, Box, Select, MenuItem, IconButton } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useI18n } from '../I18nContext';

export default function Navbar({ mode, onToggleMode, lang, onLangChange }) {
  const t = useI18n();
  return (
    <AppBar position="static" color="success" elevation={2}>
      <Toolbar sx={{ gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1, fontWeight: 700 }}>
          🌱 Sri Lanka ESG AI Monitor
        </Typography>
        <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
          {t('subtitle')}
        </Typography>
        <Select
          size="small" value={lang} onChange={(e) => onLangChange(e.target.value)}
          aria-label="Language"
          sx={{ color: 'inherit', bgcolor: 'rgba(255,255,255,0.15)', '.MuiSvgIcon-root': { color: 'inherit' } }}
        >
          <MenuItem value="en">EN</MenuItem>
          <MenuItem value="si">සිං</MenuItem>
          <MenuItem value="ta">தமிழ்</MenuItem>
        </Select>
        <IconButton color="inherit" onClick={onToggleMode} aria-label="Toggle dark mode" title="Toggle dark mode">
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
