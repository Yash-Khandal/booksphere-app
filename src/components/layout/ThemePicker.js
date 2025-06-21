import React, { useState } from 'react';
import { 
  Box, Button, Dialog, DialogTitle, DialogContent, Grid, 
  Typography, IconButton, Chip 
} from '@mui/material';
import PaletteIcon from '@mui/icons-material/Palette';

const themes = [
  { name: 'Light', value: 'light', color: '#ffffff', textColor: '#222222' },
  { name: 'Dark', value: 'dark', color: '#222222', textColor: '#ffffff' },
  { name: 'Blue', value: 'blue', color: '#409CFF', textColor: '#ffffff' },
  { name: 'Green', value: 'green', color: '#43a047', textColor: '#ffffff' },
];

export default function ThemePicker({ onThemeChange }) {
  const [open, setOpen] = useState(false);

  const handleThemeSelect = (themeValue) => {
    onThemeChange(themeValue);
    setOpen(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        <PaletteIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Theme
      </Typography>
      <Button
        variant="outlined"
        onClick={() => setOpen(true)}
        fullWidth
        startIcon={<PaletteIcon />}
      >
        Change Theme
      </Button>
      
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Choose Theme</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {themes.map(theme => (
              <Grid item xs={6} key={theme.value}>
                <Button
                  variant="outlined"
                  onClick={() => handleThemeSelect(theme.value)}
                  sx={{
                    width: '100%',
                    height: 60,
                    bgcolor: theme.color,
                    color: theme.textColor,
                    border: theme.value === 'light' ? '2px solid #eee' : '2px solid transparent',
                    '&:hover': { 
                      bgcolor: theme.color, 
                      opacity: 0.8,
                      transform: 'scale(1.02)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body1" fontWeight={600}>
                      {theme.name}
                    </Typography>
                    <Chip 
                      size="small" 
                      label="Preview" 
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.2)', 
                        color: theme.textColor,
                        mt: 0.5
                      }} 
                    />
                  </Box>
                </Button>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
