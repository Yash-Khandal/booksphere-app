import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton, Stack, Divider } from '@mui/material';
import { 
  GitHub, Twitter, LinkedIn, Email, Facebook, Instagram, BookOutlined
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

export default function Footer() {
  const footerSections = [
    {
      title: 'Explore',
      links: [
        { name: 'Home', path: '/' },
        { name: 'Browse Books', path: '/browse' },
        { name: 'Upload Content', path: '/upload' },
        { name: 'Your Progress', path: '/progress' },
      ]
    },
    {
      title: 'Categories',
      links: [
        { name: 'Fiction', path: '/browse?category=fiction' },
        { name: 'Non-Fiction', path: '/browse?category=non-fiction' },
        { name: 'Educational', path: '/browse?category=educational' },
        { name: 'Magazines', path: '/browse?category=magazines' },
      ]
    },
    {
      title: 'Support',
      links: [
        { name: 'Help Center', path: '/help' },
        { name: 'Contact Us', path: '/contact' },
        { name: 'Privacy Policy', path: '/privacy' },
        { name: 'Terms of Service', path: '/terms' },
      ]
    }
  ];

  const socialLinks = [
    { icon: <GitHub />, url: 'https://github.com/', label: 'GitHub' },
    { icon: <Twitter />, url: 'https://twitter.com/', label: 'Twitter' },
    { icon: <LinkedIn />, url: 'https://linkedin.com/', label: 'LinkedIn' },
    { icon: <Facebook />, url: 'https://facebook.com/', label: 'Facebook' },
    { icon: <Instagram />, url: 'https://instagram.com/', label: 'Instagram' },
    { icon: <Email />, url: 'mailto:contact@readbook.com', label: 'Email' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderTop: theme => `1px solid ${theme.palette.divider}`,
        pt: 6,
        pb: 3,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {/* Logo and Description */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BookOutlined color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h6" fontWeight="bold">
                  BookSphere
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                Explore a world of knowledge and imagination through our vast collection of digital books and resources.
              </Typography>
            </Stack>
          </Grid>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <Grid item xs={6} sm={4} md={2} key={section.title}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {section.title}
              </Typography>
              <Stack spacing={1}>
                {section.links.map((link) => (
                  <Link
                    key={link.name}
                    component={RouterLink}
                    to={link.path}
                    color="text.secondary"
                    underline="hover"
                    sx={{
                      textDecoration: 'none',
                      '&:hover': {
                        color: 'primary.main',
                        textDecoration: 'none',
                      }
                    }}
                  >
                    {link.name}
                  </Link>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Bottom Section */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} BookSphere. Made with ♥ by{' '}
            <Link href="https://yash-portfolio11.netlify.app" target="_blank" rel="noopener" color="inherit" underline="hover">
                Yash
            </Link>
          </Typography>

          <Stack direction="row" spacing={1}>
            {socialLinks.map((social) => (
              <IconButton
                key={social.label}
                component={Link}
                href={social.url}
                target="_blank"
                rel="noopener"
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    bgcolor: 'action.hover',
                  }
                }}
                aria-label={social.label}
              >
                {social.icon}
              </IconButton>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
