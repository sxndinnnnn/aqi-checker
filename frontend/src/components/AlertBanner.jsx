import { Alert, AlertTitle, List, ListItem } from '@mui/material';

export default function AlertBanner({ items }) {
  if (!items || !items.length) return null;
  return (
    <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
      <AlertTitle>{items.length === 1 ? 'Alert' : `${items.length} alerts`}</AlertTitle>
      <List dense disablePadding sx={{ listStyleType: 'disc', pl: 2 }}>
        {items.map((text) => (
          <ListItem key={text} disablePadding sx={{ display: 'list-item', fontSize: '0.875rem' }}>
            {text}
          </ListItem>
        ))}
      </List>
    </Alert>
  );
}
