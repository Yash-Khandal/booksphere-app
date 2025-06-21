import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  useTheme,
  Grid,
} from '@mui/material';
import Loader from '../layout/Loader';

// Make sure undraw_book-lover_f1dq.svg is in your /public folder!

export default function Dashboard() {
  const theme = useTheme();

  return (
    <Loader>
      <Box 
        sx={{ 
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'background.default',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 6, md: 0 },
          pb: { xs: 6, md: 0 },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={5} alignItems="center" justifyContent="center">
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  textAlign: { xs: 'center', md: 'left' },
                }}
              >
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontWeight: 800, 
                    mb: 2, 
                    color: 'text.primary',
                    fontSize: { xs: '2.2rem', md: '3.5rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Welcome to <Box component="span" sx={{ color: 'primary.main' }}>BookSphere</Box> where
                  every page opens a new world.
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 4, 
                    color: 'text.secondary',
                    fontSize: { xs: '1rem', md: '1.2rem' },
                    fontWeight: 400,
                  }}
                >
                  Explore top reads, reviews, and stories that inspire and ignite your imagination.
                </Typography>
                <Button 
                  variant="contained" 
                  size="large" 
                  href="/browse"
                  sx={{ 
                    fontWeight: 700, 
                    borderRadius: 2,
                    px: 5,
                    py: 1.5,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.15)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 24px 0 rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  Get Started
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src="/booklover.png"
                alt="Book Lover Illustration"
                sx={{
                  width: '100%',
                  maxWidth: { xs: '350px', md: '580px' },
                  height: 'auto',
                  display: 'block',
                  mx: 'auto',
                  mixBlendMode: theme.palette.mode === 'dark' ? 'screen' : 'normal',
                  opacity: theme.palette.mode === 'dark' ? 0.7 : 1,
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Loader>
  );
}

