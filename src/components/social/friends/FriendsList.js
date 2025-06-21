import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../config/supabase';
import {
  Tabs, Tab, Box, Avatar, List, ListItem, ListItemAvatar,
  ListItemText, Button, Typography, TextField, Alert,
  CircularProgress, Card, CardContent, Chip, Stack
} from '@mui/material';
import { PersonAdd as PersonAddIcon, Star as StarIcon } from '@mui/icons-material';

const gradientList = [
  "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
];

export default function FriendsList() {
  const { currentUser } = useAuth();
  const [tab, setTab] = useState(0);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    fetchAllData();
  }, [currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchSuggested();
    }
  }, [following, search, currentUser?.id]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      await Promise.all([
        fetchFollowers(),
        fetchFollowing()
      ]);
    } catch (err) {
      setError('Failed to load friends data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    try {
      const { data: followData } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('followed_id', currentUser.id);

      if (!followData || followData.length === 0) {
        setFollowers([]);
        return;
      }

      const followerIds = followData.map(f => f.follower_id);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, email, bio, avatar_url')
        .in('id', followerIds);

      setFollowers(profileData || []);
    } catch {}
  };

  const fetchFollowing = async () => {
    try {
      const { data: followData } = await supabase
        .from('user_follows')
        .select('followed_id')
        .eq('follower_id', currentUser.id);

      if (!followData || followData.length === 0) {
        setFollowing([]);
        return;
      }

      const followedIds = followData.map(f => f.followed_id);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, name, email, bio, avatar_url')
        .in('id', followedIds);

      setFollowing(profileData || []);
    } catch {}
  };

  const fetchSuggested = async () => {
    try {
      let { data: allUsers } = await supabase
        .from('profiles')
        .select('id, name, email, bio, avatar_url')
        .neq('id', currentUser.id)
        .limit(20);

      if (!allUsers) {
        setSuggested([]);
        return;
      }

      const followingIds = new Set(following.map(u => u.id));
      allUsers = allUsers.filter(u => !followingIds.has(u.id));

      if (search) {
        allUsers = allUsers.filter(u =>
          u.name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.bio?.toLowerCase().includes(search.toLowerCase())
        );
      }

      setSuggested(allUsers);
    } catch {}
  };

  const handleFollow = async (userId) => {
    await supabase.from('user_follows').insert({
      follower_id: currentUser.id,
      followed_id: userId,
    });
    await fetchFollowing();
  };

  const handleUnfollow = async (userId) => {
    await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', currentUser.id)
      .eq('followed_id', userId);
    await fetchFollowing();
  };

  const isFollowing = (userId) => {
    return following.some(user => user.id === userId);
  };

  if (!currentUser) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Friends</Typography>
        <Alert severity="info">Please log in to view your friends.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Friends</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  // Card style for each user
  const userCard = (user, actionBtn = null, i = 0) => (
    <Card
      key={user.id}
      sx={{
        mb: 2,
        borderRadius: 4,
        background: gradientList[i % gradientList.length],
        boxShadow: '0 4px 24px rgba(31,38,135,0.08)',
        display: 'flex',
        alignItems: 'center',
        p: 2,
        minHeight: 90,
        transition: 'transform 0.1s, box-shadow 0.1s',
        '&:hover': {
          transform: 'translateY(-2px) scale(1.01)',
          boxShadow: '0 8px 32px rgba(31,38,135,0.16)'
        }
      }}
    >
      <Avatar
        src={user.avatar_url}
        sx={{
          width: 56,
          height: 56,
          fontSize: 30,
          bgcolor: '#667eea',
          color: 'white',
          fontWeight: 700,
          mr: 2,
          boxShadow: '0 2px 8px rgba(102,126,234,0.20)'
        }}
      >
        {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
      </Avatar>
      <Box sx={{ flex: 1 }}>
        <Typography variant="h6" fontWeight={700}>
          {user.name || user.email?.split('@')[0]}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.bio || user.email}
        </Typography>
      </Box>
      {actionBtn}
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 4 } }}>
      <Typography variant="h4" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
        Friends
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`Followers (${followers.length})`} />
        <Tab label={`Following (${following.length})`} />
        <Tab label={`Discover (${suggested.length})`} />
      </Tabs>
      {tab === 0 && (
        <Box>
          {followers.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 4, background: gradientList[0] }}>
              <PersonAddIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary" fontWeight={500}>
                No followers yet. Share your profile to gain followers!
              </Typography>
            </Card>
          ) : (
            <Stack spacing={2}>
              {followers.map((user, i) => userCard(user, null, i))}
            </Stack>
          )}
        </Box>
      )}
      {tab === 1 && (
        <Box>
          {following.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 4, background: gradientList[1] }}>
              <PersonAddIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary" fontWeight={500}>
                You're not following anyone yet. Discover users to follow!
              </Typography>
            </Card>
          ) : (
            <Stack spacing={2}>
              {following.map((user, i) =>
                userCard(
                  user,
                  <Button
                    onClick={() => handleUnfollow(user.id)}
                    variant="outlined"
                    size="small"
                    color="error"
                    sx={{ fontWeight: 600, ml: 2 }}
                  >
                    Unfollow
                  </Button>,
                  i
                )
              )}
            </Stack>
          )}
        </Box>
      )}
      {tab === 2 && (
        <Card sx={{ borderRadius: 4, background: gradientList[2], mb: 2 }}>
          <CardContent>
            <TextField
              label="Search users"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ mb: 2 }}
              fullWidth
              placeholder="Search by name, email or bio..."
            />
            {suggested.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary" fontWeight={500}>
                  {search ? 'No users found matching your search.' : 'No users to discover.'}
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {suggested.map((user, i) =>
                  userCard(
                    user,
                    <Button
                      onClick={() => handleFollow(user.id)}
                      variant={isFollowing(user.id) ? "outlined" : "contained"}
                      size="small"
                      color={isFollowing(user.id) ? "error" : "primary"}
                      disabled={isFollowing(user.id)}
                      sx={{ fontWeight: 600, ml: 2 }}
                    >
                      {isFollowing(user.id) ? 'Following' : 'Follow'}
                    </Button>,
                    i
                  )
                )}
              </Stack>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
