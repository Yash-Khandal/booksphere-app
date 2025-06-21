import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Box, Typography, Button, Card, CardContent, 
  Avatar, List, ListItem, ListItemText, ListItemAvatar,
  Grid, Alert, CircularProgress, Snackbar, Chip
} from '@mui/material';
import { Star as StarIcon, Person as PersonIcon } from '@mui/icons-material';
import ClubChat from './ClubChat';

export default function ClubPage() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (id) {
      fetchClub();
      fetchMembers();
      checkMembership();
    }
  }, [id, currentUser]);

  const fetchClub = async () => {
    try {
      const { data, error } = await supabase
        .from('book_clubs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Fetch club error:', error);
        setError('Failed to load club details');
        return;
      }
      
      setClub(data);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('book_club_members')
        .select('user_id, profiles (id, email, name, avatar_url)')
        .eq('club_id', id);
      
      if (error) {
        console.error('Fetch members error:', error);
        return;
      }
      
      const validMembers = data
        .filter(item => item.profiles)
        .map(item => item.profiles);
      
      setMembers(validMembers);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const checkMembership = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('book_club_members')
        .select('*')
        .eq('club_id', id)
        .eq('user_id', currentUser.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Check membership error:', error);
        return;
      }
      
      setIsMember(!!data);
    } catch (err) {
      console.error('Unexpected error checking membership:', err);
    }
  };

  const joinClub = async () => {
    if (!currentUser?.id) {
      setError('You must be logged in to join a club');
      return;
    }
    
    try {
      setActionLoading(true);
      setError('');
      
      const { error } = await supabase
        .from('book_club_members')
        .insert([{ club_id: id, user_id: currentUser.id }]);
      
      if (error) {
        console.error('Join error:', error);
        setError('Failed to join club: ' + error.message);
        return;
      }
      
      setIsMember(true);
      setSuccess('Successfully joined the club!');
      await fetchMembers();
      
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const leaveClub = async () => {
    if (!currentUser?.id) {
      setError('You must be logged in to leave a club');
      return;
    }
    
    try {
      setActionLoading(true);
      setError('');
      
      const { error } = await supabase
        .from('book_club_members')
        .delete()
        .eq('club_id', id)
        .eq('user_id', currentUser.id);
      
      if (error) {
        console.error('Leave error:', error);
        setError('Failed to leave club: ' + error.message);
        return;
      }
      
      setIsMember(false);
      setSuccess('Successfully left the club!');
      await fetchMembers();
      
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const isCreator = (userId) => club?.created_by === userId;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!club) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Club not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>{club.name}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {club.description || 'No description provided'}
          </Typography>
        </Box>
        {isMember ? (
          <Button 
            variant="outlined" 
            color="error" 
            onClick={leaveClub}
            disabled={actionLoading}
            sx={{ 
              fontWeight: 600,
              borderRadius: 3,
              px: 3,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 20px rgba(220, 0, 78, 0.2)'
              }
            }}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'LEAVE CLUB'}
          </Button>
        ) : (
          <Button 
            variant="contained" 
            onClick={joinClub}
            disabled={actionLoading}
            sx={{ 
              fontWeight: 600,
              borderRadius: 3,
              px: 3,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8, #6a4190)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
              }
            }}
          >
            {actionLoading ? <CircularProgress size={20} /> : 'JOIN CLUB'}
          </Button>
        )}
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Card sx={{ 
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)'
          }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Members ({members.length})
              </Typography>
              {members.length === 0 ? (
                <Typography color="text.secondary">No members yet</Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {members.map(member => (
                    <ListItem 
                      key={member.id} 
                      sx={{ 
                        borderRadius: 2,
                        mb: 1,
                        background: isCreator(member.id) 
                          ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1))'
                          : 'rgba(255, 255, 255, 0.5)',
                        border: isCreator(member.id) ? '1px solid rgba(255, 193, 7, 0.3)' : 'none'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={member.avatar_url}
                          sx={{ 
                            bgcolor: '#667eea', 
                            color: 'white',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)'
                          }}
                        >
                          {(member.name || member.email)?.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                              {member.name || member.email?.split('@')[0]}
                            </Typography>
                            {isCreator(member.id) && (
                              <Chip 
                                icon={<StarIcon sx={{ color: '#ffb300' }} />}
                                label="Creator"
                                size="small"
                                sx={{ 
                                  background: 'linear-gradient(135deg, #ffc107, #ff9800)',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={member.email}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={7}>
          {isMember ? (
            <ClubChat clubId={id} />
          ) : (
            <Card sx={{ 
              borderRadius: 4,
              background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)'
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>💬 Club Chat</Typography>
                <Alert severity="info">
                  Join the club to participate in the chat!
                </Alert>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
