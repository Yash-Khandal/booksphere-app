import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';

import { 
  Box, List, ListItem, ListItemAvatar, 
  Avatar, ListItemText, Typography 
} from '@mui/material';

export default function ReviewComments({ reviewId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
    const channel = supabase
      .channel('comments_channel_' + reviewId)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'review_comments',
        filter: `review_id=eq.${reviewId}`
      }, handleNewComment)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [reviewId]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('review_comments')
      .select(`
        id, 
        text, 
        created_at,
        user_id,
        profiles (email)
      `)
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true });
    
    if (data) setComments(data);
    setLoading(false);
  };

  const handleNewComment = (payload) => {
    setComments(prev => [...prev, payload.new]);
  };

  if (loading) return <Typography>Loading comments...</Typography>;
  
  return (
    <Box sx={{ mt: 2 }}>
      {comments.length === 0 ? (
        <Typography>No comments yet</Typography>
      ) : (
        <List>
          {comments.map(comment => (
            <ListItem key={comment.id} sx={{ alignItems: 'flex-start' }}>
              <ListItemAvatar>
                <Avatar>{comment.profiles.email?.charAt(0).toUpperCase()}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={comment.profiles.email}
                secondary={
                  <>
                    <Typography variant="body2">{comment.text}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(comment.created_at).toLocaleString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
