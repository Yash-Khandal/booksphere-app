import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  Card, CardContent, Typography, TextField, Button, Box,
  Alert, Divider, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Google as GoogleIcon } from '@mui/icons-material';
import ParticleBackground from '../layout/ParticleBackground';
import { supabase } from '../../config/supabase';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }
    if (!username.trim()) {
      return setError('Username is required');
    }
    try {
      setError('');
      setLoading(true);
      const { user } = await signup(email, password);
      // Save username to profiles table (if you have one)
      if (user) {
        await supabase.from('profiles').insert([
          { id: user.id, username, email }
        ]);
      }
      navigate('/');
    } catch (err) {
      setError('Failed to create an account: ' + err.message);
    }
    setLoading(false);
  }

  async function handleGoogleSignUp() {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      // Navigation will happen automatically after successful auth
    } catch (err) {
      setError('Google sign up failed: ' + err.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <ParticleBackground />
      <Box
        className="signup-card"
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
              Sign Up
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password Confirmation"
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 2, mb: 1 }}
                disabled={loading}
              >
                Sign Up
              </Button>
              <Divider sx={{ my: 2 }}>OR</Divider>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={handleGoogleSignUp}
                startIcon={<GoogleIcon />}
                disabled={loading}
              >
                Sign up with Google
              </Button>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  Already have an account? Login
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
}
