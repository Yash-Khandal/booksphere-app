import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Box, Avatar, Typography, Button, Card, CardContent, 
  CircularProgress, Alert, Grid, Tabs, Tab 
} from '@mui/material';
import Bookshelf from '../../shelf/Bookshelf';

export default function UserProfile() {
  const { userId } = useParams();
  const { currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (userId) {
      fetchUser();
      checkFollowing();
    }
  }, [userId, currentUser]);

  const fetchUser = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user:', error);
        setError('User not found');
        return;
      }
      
      setUser(data);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowing = async () => {
    if (!currentUser?.id || !userId) return;
    
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', currentUser.id)
        .eq('followed_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
      }
      
      setIsFollowing(!!data);
    } catch (err) {
      console.error('Error checking follow status:', err);
      setIsFollowing(false);
    }
  };

  const toggleFollow = async () => {
    if (!currentUser?.id) return;
    
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('followed_id', userId);
        
        if (error) {
          console.error('Error unfollowing:', error);
          return;
        }
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert([{ 
            follower_id: currentUser.id, 
            followed_id: userId 
          }]);
        
        if (error) {
          console.error('Error following:', error);
          return;
        }
      }
      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'User not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar 
                src={user.avatar_url}
                sx={{ width: 80, height: 80, fontSize: '2rem' }}
              >
                {user.email?.charAt(0).toUpperCase()}
              </Avatar>
            </Grid>
            <Grid item xs>
              {/* FIX: Use name if available, otherwise fallback to email prefix */}
              <Typography variant="h4">
                {user.name || user.email?.split('@')[0] || 'Unknown User'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {user.bio || 'No bio available'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Grid>
            {currentUser?.id !== userId && currentUser?.id && (
              <Grid item>
                <Button 
                  variant={isFollowing ? "outlined" : "contained"} 
                  color={isFollowing ? "error" : "primary"}
                  onClick={toggleFollow}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label="Bookshelf" />
        <Tab label="Reviews" />
        <Tab label="Activity" />
      </Tabs>

      {tabValue === 0 && (
        <Bookshelf userId={userId} />
      )}
      
      {tabValue === 1 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">Reviews will appear here</Typography>
        </Box>
      )}
      
      {tabValue === 2 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">Activity will appear here</Typography>
        </Box>
      )}
    </Box>
  );
}
