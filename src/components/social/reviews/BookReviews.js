import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../contexts/AuthContext';

import { 
  Box, Typography, TextField, Button, Card, CardContent, 
  Rating, CircularProgress, Alert 
} from '@mui/material';
import ReviewCard from './ReviewCard';

export default function BookReviews() {
  const { bookId } = useParams();
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [bookId]);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id, 
        rating, 
        review, 
        created_at,
        user_id,
        profiles (email)
      `)
      .eq('book_id', bookId)
      .order('created_at', { ascending: false });
    
    if (data) setReviews(data);
    setLoading(false);
  };

  const submitReview = async () => {
    if (!rating) return;
    
    await supabase
      .from('reviews')
      .insert([{
        book_id: bookId,
        user_id: currentUser.id,
        rating,
        review: reviewText
      }]);
    
    setRating(0);
    setReviewText('');
    fetchReviews();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Reviews</Typography>
      
      {currentUser && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Add Your Review</Typography>
            <Box sx={{ mb: 2 }}>
              <Typography component="legend">Rating</Typography>
              <Rating
                value={rating}
                onChange={(e, newValue) => setRating(newValue)}
                size="large"
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Write your review..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button 
              variant="contained" 
              onClick={submitReview}
              disabled={!rating}
            >
              Submit Review
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <CircularProgress />
      ) : reviews.length === 0 ? (
        <Alert severity="info">No reviews yet. Be the first to review!</Alert>
      ) : (
        <Box>
          {reviews.map(review => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </Box>
      )}
    </Box>
  );
}
