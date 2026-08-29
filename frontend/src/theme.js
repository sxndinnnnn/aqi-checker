import { createTheme } from '@mui/material/styles';
import { green } from '@mui/material/colors';

export function buildTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: mode === 'dark' ? green[400] : green[700] },
      secondary: { main: '#6366f1' },
      error: { main: '#dc2626' },
      warning: { main: '#d97706' },
      success: { main: '#16a34a' },
      background:
        mode === 'dark'
          ? { default: '#0f172a', paper: '#1e293b' }
          : { default: '#f3f4f6', paper: '#ffffff' },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: [
        '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto',
        'Helvetica', 'Arial', 'sans-serif',
      ].join(','),
      h4: { fontWeight: 800 },
      h6: { fontWeight: 700 },
    },
    components: {
      MuiCard: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiPaper: { defaultProps: { elevation: 1 } },
      MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
      MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    },
  });
}
