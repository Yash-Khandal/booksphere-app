import React, { StrictMode, useMemo, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import Dashboard from './components/dashboard/Dashboard';
import Navigation from './components/layout/Navigation';
import ContentUpload from './components/content/ContentUpload';
import Footer from './components/layout/Footer';
import Browse from './components/content/Browse';
import Progress from './components/dashboard/Progress';
import Profile from './components/profile/Profile';
import Bookshelf from './components/shelf/Bookshelf';
import { Box, CssBaseline, createTheme, ThemeProvider } from '@mui/material';

// Social/Community Components
import ClubList from './components/social/clubs/ClubList';
import ClubPage from './components/social/clubs/ClubPage';
import FriendsList from './components/social/friends/FriendsList';
import BookReviews from './components/social/reviews/BookReviews';

function AppContent({ mode, toggleMode, theme, handleThemeChange }) {
  return (
    <>
      <Navigation mode={mode} toggleMode={toggleMode} />
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Routes>
          {/* Core App Routes */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><ContentUpload /></PrivateRoute>} />
          <Route path="/browse" element={<PrivateRoute><Browse /></PrivateRoute>} />
          <Route path="/progress" element={<PrivateRoute><Progress /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile onThemeChange={handleThemeChange} /></PrivateRoute>} />
          <Route path="/shelf" element={<PrivateRoute><Bookshelf /></PrivateRoute>} />
          
          {/* Social/Community Routes */}
          <Route path="/clubs" element={<PrivateRoute><ClubList /></PrivateRoute>} />
          <Route path="/clubs/:id" element={<PrivateRoute><ClubPage /></PrivateRoute>} />
          <Route path="/friends" element={<PrivateRoute><FriendsList /></PrivateRoute>} />
          <Route path="/books/:bookId/reviews" element={<PrivateRoute><BookReviews /></PrivateRoute>} />
          
          {/* Auth Routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
      </Box>
      <Footer />
    </>
  );
}

// ... rest of your App component stays the same


function App() {
  const [mode, setMode] = useState('light');

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('bookSphereTheme') || 'light';
    setMode(savedTheme);
  }, []);

  const theme = useMemo(() => {
    const getThemeConfig = (themeName) => {
      switch (themeName) {
        case 'dark':
          return {
            palette: {
              mode: 'dark',
              primary: { main: '#409CFF' },
              secondary: { main: '#dc004e' },
              background: { default: '#121212', paper: '#1e1e1e' },
              text: { primary: '#ffffff', secondary: 'rgba(255, 255, 255, 0.7)' }
            }
          };
        case 'blue':
          return {
            palette: {
              mode: 'light',
              primary: { main: '#409CFF' },
              secondary: { main: '#1976d2' },
              background: { default: '#f0f8ff', paper: '#ffffff' },
              text: { primary: '#0d47a1', secondary: '#1565c0' }
            }
          };
        case 'green':
          return {
            palette: {
              mode: 'light',
              primary: { main: '#43a047' },
              secondary: { main: '#2e7d32' },
              background: { default: '#f1f8e9', paper: '#ffffff' },
              text: { primary: '#1b5e20', secondary: '#2e7d32' }
            }
          };
        default: // light
          return {
            palette: {
              mode: 'light',
              primary: { main: '#409CFF' },
              secondary: { main: '#dc004e' },
              background: { default: '#ffffff', paper: '#ffffff' },
              text: { primary: '#222222', secondary: '#555555' }
            }
          };
      }
    };

    return createTheme({
      ...getThemeConfig(mode),
      components: {
        MuiCard: {
          styleOverrides: {
            root: {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }
          }
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            }
          }
        }
      }
    });
  }, [mode]);

  const toggleMode = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setMode(newMode);
    localStorage.setItem('bookSphereTheme', newMode);
  };

  const handleThemeChange = (newTheme) => {
    setMode(newTheme);
    localStorage.setItem('bookSphereTheme', newTheme);
  };

  return (
    <StrictMode>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AuthProvider>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              minHeight: '100vh',
              bgcolor: 'background.default'
            }}>
              <AppContent 
                mode={mode} 
                toggleMode={toggleMode} 
                theme={theme} 
                handleThemeChange={handleThemeChange} 
              />
            </Box>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </StrictMode>
  );
}

export default App;
