import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Card, CardContent, Typography, TextField, Button, Box,
  Alert, Divider, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Google as GoogleIcon } from '@mui/icons-material';
import ParticleBackground from '../layout/ParticleBackground';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to sign in: ' + err.message);
    }
    setLoading(false);
  }

  async function handleGoogleSignIn() {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      // Navigation will happen automatically after successful auth
    } catch (err) {
      setError('Google sign-in failed: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <ParticleBackground />
      <Box
        className="login-card"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Card sx={{ maxWidth: 400, width: '100%', p: 2, boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h4" align="center" fontWeight={700} gutterBottom>
              BookSphere
            </Typography>
            <Typography variant="h6" align="center" gutterBottom>
              Sign In
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, mb: 1 }}
                disabled={loading}
              >
                Sign In
              </Button>
              <Divider sx={{ my: 2 }}>OR</Divider>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={handleGoogleSignIn}
                startIcon={<GoogleIcon />}
                disabled={loading}
              >
                Sign in with Google
              </Button>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                  Forgot Password?
                </Link>
              </Box>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Link to="/signup" style={{ textDecoration: 'none' }}>
                  Need an account? Sign Up
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
}
