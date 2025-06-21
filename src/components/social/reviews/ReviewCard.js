import React, { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  Box, Avatar, Typography, Rating, Button, 
  Card, CardContent, Collapse, TextField,
  IconButton, List, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import { 
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon,
  Send as SendIcon
} from '@mui/icons-material';

export default function ReviewCard({ review, onUpdate }) {
  const { currentUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (review?.id) {
      checkLike();
      fetchLikeCount();
      fetchComments();
    }
  }, [review?.id, currentUser]);

  const checkLike = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('review_likes')
        .select('*')
        .eq('review_id', review.id)
        .eq('user_id', currentUser.id)
        .single();
      
      setLiked(!!data);
    } catch (err) {
      // No like found
    }
  };

  const fetchLikeCount = async () => {
    try {
      const { count, error } = await supabase
        .from('review_likes')
        .select('*', { count: 'exact' })
        .eq('review_id', review.id);
      
      if (!error) setLikeCount(count || 0);
    } catch (err) {
      console.error('Error fetching like count:', err);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('review_comments')
        .select(`
          id, text, created_at,
          profiles (id, email, avatar_url)
        `)
        .eq('review_id', review.id)
        .order('created_at', { ascending: true });
      
      if (!error) setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const toggleLike = async () => {
    if (!currentUser?.id) return;
    
    try {
      if (liked) {
        await supabase
          .from('review_likes')
          .delete()
          .eq('review_id', review.id)
          .eq('user_id', currentUser.id);
        setLikeCount(prev => prev - 1);
      } else {
        await supabase
          .from('review_likes')
          .insert([{ 
            review_id: review.id, 
            user_id: currentUser.id 
          }]);
        setLikeCount(prev => prev + 1);
      }
      setLiked(!liked);
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !currentUser?.id) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('review_comments')
        .insert([{
          review_id: review.id,
          user_id: currentUser.id,
          text: newComment.trim()
        }]);
      
      if (!error) {
        setNewComment('');
        await fetchComments();
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2 }} src={review.profiles?.avatar_url}>
            {review.profiles?.email?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight={600}>
              {review.profiles?.email?.split('@')[0]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(review.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
        
        <Rating value={review.rating} readOnly sx={{ mb: 2 }} />
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          {review.review}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button 
            startIcon={<ThumbUpIcon color={liked ? 'primary' : 'inherit'} />}
            onClick={toggleLike}
            size="small"
          >
            {likeCount} {likeCount === 1 ? 'Like' : 'Likes'}
          </Button>
          <Button 
            startIcon={<CommentIcon />}
            onClick={() => setShowComments(!showComments)}
            size="small"
          >
            Comments ({comments.length})
          </Button>
        </Box>
        
        <Collapse in={showComments}>
          <Box sx={{ mt: 2 }}>
            {/* Comments List */}
            <List sx={{ mb: 2 }}>
              {comments.map(comment => (
                <ListItem key={comment.id} sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar src={comment.profiles?.avatar_url}>
                      {comment.profiles?.email?.charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={comment.profiles?.email?.split('@')[0]}
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
            
            {/* Add Comment */}
            {currentUser && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  onKeyPress={(e) => e.key === 'Enter' && addComment()}
                />
                <IconButton 
                  onClick={addComment}
                  disabled={!newComment.trim() || loading}
                  color="primary"
                >
                  <SendIcon />
                </IconButton>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
