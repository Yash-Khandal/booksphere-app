import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import {
  Box, Avatar, Typography, Button, TextField, Stack, Card, CardContent,
  Divider, CircularProgress, Alert, IconButton, Fade
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import ThemePicker from '../layout/ThemePicker';

export default function Profile({ onThemeChange }) {
  const { currentUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [bioEdit, setBioEdit] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [name, setName] = useState('');
  const [nameEdit, setNameEdit] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [stats, setStats] = useState({ booksRead: 0, hours: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser?.id) fetchProfile();
    // eslint-disable-next-line
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      if (!currentUser?.id) throw new Error('No user ID found');
      let { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: currentUser.id,
            email: currentUser.email || '',
            bio: '',
            avatar_url: '',
            books_read: 0,
            hours: 0,
            full_name: currentUser.email?.split('@')[0] || ''
          }])
          .select()
          .single();
        if (createError) throw createError;
        profile = newProfile;
      }
      setAvatarUrl(profile.avatar_url || '');
      setName(profile.full_name || currentUser.email?.split('@')[0] || '');
      setNameEdit(profile.full_name || currentUser.email?.split('@')[0] || '');
      setBio(profile.bio || '');
      setBioEdit(profile.bio || '');
      setStats({ booksRead: profile.books_read || 0, hours: profile.hours || 0 });
    } catch (err) {
      setError(`Failed to load profile: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      if (!currentUser?.id) throw new Error('No user ID found');
      const fileExt = file.name.split('.').pop();
      const timestamp = new Date().getTime();
      const fileName = `${currentUser.id}/avatar_${timestamp}.${fileExt}`;
      if (avatarUrl && avatarUrl.includes('supabase')) {
        try {
          const urlParts = avatarUrl.split('/');
          const oldFileName = urlParts[urlParts.length - 1].split('?')[0];
          const oldPath = `${currentUser.id}/${oldFileName}`;
          await supabase.storage.from('avatars').remove([oldPath]);
        } catch {}
      }
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { cacheControl: '1', upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const newAvatarUrl = `${urlData.publicUrl}?t=${timestamp}`;
      await supabase.from('profiles').update({ avatar_url: newAvatarUrl }).eq('id', currentUser.id);
      setAvatarUrl(newAvatarUrl);
      window.dispatchEvent(new CustomEvent('avatarUpdated', { detail: { avatarUrl: newAvatarUrl } }));
    } catch (err) {
      setError(`Failed to upload avatar: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleBioSave = async () => {
    try {
      setError('');
      await supabase.from('profiles').update({ bio: bioEdit }).eq('id', currentUser.id);
      setBio(bioEdit);
      setEditingBio(false);
    } catch (err) {
      setError('Failed to save bio');
    }
  };

  const handleNameSave = async () => {
    try {
      setError('');
      await supabase.from('profiles').update({ full_name: nameEdit }).eq('id', currentUser.id);
      setName(nameEdit);
      setEditingName(false);
    } catch (err) {
      setError('Failed to save name');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* Animated blobs */}
      <div className="animated-blob blob1"></div>
      <div className="animated-blob blob2"></div>
      <Box sx={{
        maxWidth: 480,
        mx: 'auto',
        pt: 9,
        pb: 6,
        px: 2,
        position: 'relative',
        zIndex: 2,
      }}>
       <Card sx={{
  borderRadius: 6,
  background: 'rgba(30,32,40,0.95)',
  color: '#f3f3f3',
  boxShadow: '0 8px 32px 0 rgba(64,156,255,0.13), 0 2px 8px 0 rgba(76,175,80,0.07)',
  border: '1.5px solid rgba(255,255,255,0.04)',
  backdropFilter: 'blur(24px)',
  p: 3,
  position: 'relative'
}}>


          <CardContent>
            <Stack spacing={3} alignItems="center">
              {error && (
                <Alert severity="error" sx={{ width: '100%' }}>
                  {error}
                </Alert>
              )}

              {/* Avatar with overlay */}
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={avatarUrl}
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    border: '5px solid #a1c4fd',
                    boxShadow: '0 4px 24px rgba(64,156,255,0.18)'
                  }}
                >
                  {!avatarUrl && name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: '#fff',
                    borderRadius: '50%',
                    p: 1,
                    boxShadow: 2,
                    border: '2px solid #a1c4fd',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s',
                    '&:hover': { bgcolor: '#e0e7ff' }
                  }}
                >
                  {uploading ? (
                    <CircularProgress size={24} />
                  ) : (
                    <CloudUploadIcon sx={{ color: '#409CFF', fontSize: 24 }} />
                  )}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                    disabled={uploading}
                  />
                </Box>
              </Box>

              {/* Editable Name */}
              <Box sx={{ width: '100%', textAlign: 'center' }}>
                {editingName ? (
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <TextField
                      value={nameEdit}
                      onChange={e => setNameEdit(e.target.value)}
                      size="small"
                      sx={{ maxWidth: 180 }}
                      variant="outlined"
                    />
                    <IconButton onClick={handleNameSave} color="primary">
                      <CheckIcon />
                    </IconButton>
                    <IconButton onClick={() => { setEditingName(false); setNameEdit(name); }}>
                      <Fade in={true}><EditIcon color="action" /></Fade>
                    </IconButton>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <Typography variant="h5" fontWeight={700}>
                      {name}
                    </Typography>
                    <IconButton onClick={() => setEditingName(true)} size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                )}
                <Typography variant="body2" color="text.secondary">
                  {currentUser?.email || 'No email'}
                </Typography>
              </Box>

              <ThemePicker onThemeChange={onThemeChange} />

              <Divider sx={{ width: '100%' }} />

              {/* Bio Section */}
              <Box sx={{ width: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Bio
                </Typography>
                {editingBio ? (
                  <Stack spacing={2}>
                    <TextField
                      value={bioEdit}
                      onChange={e => setBioEdit(e.target.value)}
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Tell us about yourself..."
                      variant="outlined"
                    />
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        onClick={() => { setEditingBio(false); setBioEdit(bio); }}
                        variant="outlined"
                        size="small"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleBioSave}
                        variant="contained"
                        size="small"
                      >
                        Save
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <Box>
                    <Typography variant="body1" sx={{ mb: 2, minHeight: 40 }}>
                      {bio || 'No bio set. Click edit to add something about yourself.'}
                    </Typography>
                    <Button
                      onClick={() => setEditingBio(true)}
                      variant="outlined"
                      size="small"
                    >
                      Edit Bio
                    </Button>
                  </Box>
                )}
              </Box>

              <Divider sx={{ width: '100%' }} />

              {/* Reading Stats Section */}
              <Box sx={{ width: '100%' }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Reading Stats
                </Typography>
                <Stack direction="row" spacing={4} justifyContent="center">
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary" fontWeight={700}>
                      {stats.booksRead}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Books Read
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary" fontWeight={700}>
                      {stats.hours}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Hours Reading
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
      {/* Blob animation CSS */}
      <style>
        {`
        .animated-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.5;
          z-index: 0;
          pointer-events: none;
        }
        .blob1 {
          width: 420px;
          height: 420px;
          top: -120px;
          left: -120px;
          background: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%);
          animation: blob1 12s infinite alternate ease-in-out;
        }
        .blob2 {
          width: 320px;
          height: 320px;
          bottom: -80px;
          right: -80px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          animation: blob2 10s infinite alternate-reverse ease-in-out;
        }
        @keyframes blob1 {
          0% { transform: scale(1) translate(0,0); }
          50% { transform: scale(1.15) translate(60px, 40px); }
          100% { transform: scale(1) translate(0,0); }
        }
        @keyframes blob2 {
          0% { transform: scale(1) translate(0,0); }
          50% { transform: scale(1.1) translate(-40px, -30px); }
          100% { transform: scale(1) translate(0,0); }
        }
        `}
      </style>
    </Box>
  );
}
