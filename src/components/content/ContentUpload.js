import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import {
  Box, Button, TextField, Typography, LinearProgress, Card, CardContent,
  Select, MenuItem, FormControl, InputLabel, Chip, Paper, IconButton, useTheme,
  Switch, FormControlLabel
} from '@mui/material';
import { CloudUpload as UploadIcon, Add as AddIcon } from '@mui/icons-material';
import Loader from '../layout/Loader';

export default function ContentUpload() {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('ebook');
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [visibility, setVisibility] = useState('public'); // New state for visibility

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');

      // Generate unique filename using Supabase user ID
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: storageData, error: storageError } = await supabase.storage
        .from('pdf')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (storageError) throw storageError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('pdf')
        .getPublicUrl(fileName);

      // Insert metadata into Supabase table
      const { error: dbError } = await supabase
        .from('books')
        .insert({
          title,
          author,
          description,
          type,
          tags,
          cover_image: coverImage || null,
          file_url: urlData.publicUrl,
          file_path: storageData.path,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          user_id: currentUser.id,
          visibility, // Add visibility field
          order: 0 // Default order for bookshelf
        });

      if (dbError) throw dbError;

      // Reset form
      setFile(null);
      setTitle('');
      setAuthor('');
      setDescription('');
      setTags([]);
      setProgress(0);
      setCoverImage('');
      setVisibility('public');
      alert(`Upload successful! Book is ${visibility === 'private' ? 'private (only in your bookshelf)' : 'public (visible to everyone)'}.`);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Loader>
      {/* Animated background blobs */}
      <div className="animated-blob blob1" />
      <div className="animated-blob blob2" />

      {/* Upload Card */}
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card
          sx={{
            maxWidth: 500,
            width: '100%',
            mx: 'auto',
            my: 6,
            borderRadius: 6,
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
            background: theme.palette.mode === 'dark'
              ? 'rgba(30,30,40,0.92)'
              : 'rgba(255,255,255,0.85)',
            color: 'text.primary',
            backdropFilter: 'blur(8px)',
            p: 2,
            zIndex: 1,
          }}
        >
          <CardContent>
            <Typography variant="h4" fontWeight={700} gutterBottom align="center" sx={{
              background: 'linear-gradient(90deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Upload Content
            </Typography>

            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <Box sx={{ mb: 3 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  fontWeight: 600,
                  letterSpacing: 1,
                  py: 1.2,
                  mb: 1,
                  boxShadow: '0 2px 8px rgba(102,126,234,0.10)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8, #6a4190)',
                  }
                }}
              >
                Select File
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.epub,.mp3,.mp4"
                />
              </Button>
              {file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <b>Selected:</b> {file.name}
                </Typography>
              )}
            </Box>

            {/* Visibility Toggle - NEW FEATURE */}
            <Card sx={{ mb: 3, p: 2, background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={visibility === 'private'}
                    onChange={(e) => setVisibility(e.target.checked ? 'private' : 'public')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {visibility === 'private' ? '🔒 Private' : '🌐 Public'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {visibility === 'private' 
                        ? 'Only visible in your bookshelf'
                        : 'Visible to everyone in browse section'
                      }
                    </Typography>
                  </Box>
                }
              />
            </Card>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Content Type</InputLabel>
              <Select
                value={type}
                label="Content Type"
                onChange={(e) => setType(e.target.value)}
              >
                <MenuItem value="ebook">eBook</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="summary">Summary</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'inherit' } }}
              InputProps={{ style: { color: 'inherit' } }}
            />

            <TextField
              fullWidth
              label="Author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'inherit' } }}
              InputProps={{ style: { color: 'inherit' } }}
            />

            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'inherit' } }}
              InputProps={{ style: { color: 'inherit' } }}
            />

            <TextField
              fullWidth
              label="Cover Image URL (Optional)"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="https://example.com/book-cover.jpg"
              InputLabelProps={{ style: { color: 'inherit' } }}
              InputProps={{ style: { color: 'inherit' } }}
            />

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  label="Add Tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  sx={{ flex: 1 }}
                  InputLabelProps={{ style: { color: 'inherit' } }}
                  InputProps={{ style: { color: 'inherit' } }}
                />
                <IconButton onClick={handleAddTag} color="primary" sx={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  '&:hover': { background: 'linear-gradient(135deg, #5a6fd8, #6a4190)' }
                }}>
                  <AddIcon />
                </IconButton>
              </Box>
              <Paper sx={{ p: 1, display: 'flex', flexWrap: 'wrap', gap: 1, background: 'rgba(102,126,234,0.04)' }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    sx={{
                      background: 'linear-gradient(135deg, #a8edea, #fed6e3)',
                      fontWeight: 600
                    }}
                  />
                ))}
              </Paper>
            </Box>

            {uploading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="indeterminate" />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Uploading...
                </Typography>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={handleUpload}
              disabled={uploading}
              sx={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                fontWeight: 600,
                letterSpacing: 1,
                py: 1.2,
                mt: 2,
                boxShadow: '0 2px 8px rgba(102,126,234,0.10)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a6fd8, #6a4190)',
                }
              }}
            >
              Upload
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Loader>
  );
}
