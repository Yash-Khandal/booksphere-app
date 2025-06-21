import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Box, Button, Card, CardContent, Grid, Typography,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, CircularProgress, Chip, Avatar
} from '@mui/material';
import { Add as AddIcon, Chat as ChatIcon, Star as StarIcon } from '@mui/icons-material';

const gradientList = [
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
];

export default function ClubList() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [clubName, setClubName] = useState('');
  const [clubDesc, setClubDesc] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [membershipStatus, setMembershipStatus] = useState({});

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    if (clubs.length > 0 && currentUser?.id) {
      checkMembershipStatus();
    }
  }, [clubs, currentUser]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error: fetchError } = await supabase
        .from('book_clubs')
        .select('*')
        .order('created_at', { ascending: false });
      if (fetchError) {
        setError('Failed to load clubs: ' + fetchError.message);
        return;
      }
      setClubs(data || []);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const checkMembershipStatus = async () => {
    if (!currentUser?.id) return;
    try {
      const { data } = await supabase
        .from('book_club_members')
        .select('club_id')
        .eq('user_id', currentUser.id);
      const membershipMap = {};
      data?.forEach(membership => {
        membershipMap[membership.club_id] = true;
      });
      setMembershipStatus(membershipMap);
    } catch (err) {
      // ignore
    }
  };

  const createClub = async () => {
    if (!clubName.trim()) {
      setError('Club name is required');
      return;
    }
    if (!currentUser?.id) {
      setError('You must be logged in to create a club');
      return;
    }
    try {
      setCreating(true);
      setError('');
      const { error: insertError } = await supabase
        .from('book_clubs')
        .insert([{
          name: clubName.trim(),
          description: clubDesc.trim() || null,
          created_by: currentUser.id
        }]);
      if (insertError) {
        setError('Failed to create club: ' + insertError.message);
        return;
      }
      setOpen(false);
      setClubName('');
      setClubDesc('');
      setSuccess('Club created successfully!');
      await fetchClubs();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setCreating(false);
    }
  };

  const joinClub = async (clubId) => {
    if (!currentUser?.id) {
      setError('You must be logged in to join a club');
      return;
    }
    try {
      setError('');
      const { error: joinError } = await supabase
        .from('book_club_members')
        .insert([{
          club_id: clubId,
          user_id: currentUser.id
        }]);
      if (joinError) {
        setError('Failed to join club: ' + joinError.message);
        return;
      }
      setMembershipStatus(prev => ({ ...prev, [clubId]: true }));
      setSuccess('Successfully joined the club!');
    } catch (err) {
      setError('An unexpected error occurred');
    }
  };

  const isCreator = (club) => currentUser?.id === club.created_by;
  const isMember = (clubId) => membershipStatus[clubId] === true;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Book Clubs</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
          disabled={!currentUser}
          sx={{
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(102,126,234,0.15)'
          }}
        >
          CREATE CLUB
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : clubs.length === 0 ? (
        <Typography variant="h6" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No clubs found. Create one to get started!
        </Typography>
      ) : (
        <Grid container spacing={4}>
          {clubs.map((club, i) => (
            <Grid item xs={12} sm={6} md={4} key={club.id}>
              <Card
                sx={{
                  position: 'relative',
                  minHeight: 260,
                  borderRadius: 4,
                  boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)',
                  background: gradientList[i % gradientList.length],
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  '&:hover': {
                    transform: 'translateY(-4px) scale(1.03)',
                    boxShadow: '0 16px 40px 0 rgba(31, 38, 135, 0.18)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{
                      bgcolor: '#667eea',
                      color: 'white',
                      fontWeight: 700,
                      width: 48,
                      height: 48,
                      mr: 2,
                      fontSize: 28,
                      boxShadow: '0 2px 8px rgba(102,126,234,0.20)'
                    }}>
                      {club.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography variant="h5" fontWeight={700} sx={{ flex: 1 }}>
                      {club.name}
                    </Typography>
                    {isCreator(club) && (
                      <Chip
                        icon={<StarIcon sx={{ color: '#ffb300' }} />}
                        label="You created this"
                        color="warning"
                        size="small"
                        sx={{ ml: 1, fontWeight: 600 }}
                      />
                    )}
                  </Box>
                  <Typography variant="body1" color="text.primary" sx={{ mb: 2, fontWeight: 500 }}>
                    {club.description || 'No description provided'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                    Created {new Date(club.created_at).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    {isMember(club.id) ? (
                      <Button
                        variant="contained"
                        color="success"
                        fullWidth
                        disabled
                        sx={{ fontWeight: 600, letterSpacing: 1 }}
                      >
                        JOINED
                      </Button>
                    ) : (
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => joinClub(club.id)}
                        sx={{ fontWeight: 600 }}
                      >
                        Join Club
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<ChatIcon />}
                      onClick={() => navigate(`/clubs/${club.id}`)}
                      disabled={!isMember(club.id)}
                      sx={{
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        boxShadow: '0 2px 8px rgba(102,126,234,0.10)'
                      }}
                    >
                      Chat
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Club Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Book Club</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Club Name"
            fullWidth
            required
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            value={clubDesc}
            onChange={(e) => setClubDesc(e.target.value)}
            placeholder="Describe your book club..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={createClub}
            disabled={creating || !clubName.trim()}
          >
            {creating ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
