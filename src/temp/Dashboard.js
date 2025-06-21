import React from 'react';
import { Box, Typography, Button, Container, AppBar, Toolbar } from '@mui/material';

export default function Dashboard() {
  return (
    <Box sx={{ bgcolor: '#f5f4f0', minHeight: '100vh' }}>
      <AppBar elevation={0} position="static" sx={{ bgcolor: '#f5f4f0', color: '#222', boxShadow: 'none' }}>
        <Toolbar sx={{ justifyContent: 'flex-end' }}>
          <Button variant="outlined" sx={{ mr: 2 }}>Sign Up</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ pt: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: 6 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Welcome to <span style={{ color: '#222' }}>BookSphere</span> where<br />
              every page opens a new world.
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              Explore top reads, reviews, and stories that inspire and ignite your imagination.
            </Typography>
            <Button variant="contained" size="large" sx={{ bgcolor: '#222', color: '#fff' }}>
              Get Started
            </Button>
          </Box>
          <Box sx={{ flex: 1, display: { xs: 'none', md: 'block' } }}>
            {/* Replace with your SVG illustration */}
            <img src="/your-illustration.svg" alt="Books" style={{ width: '100%', maxWidth: 350 }} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}