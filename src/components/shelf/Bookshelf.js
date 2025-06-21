import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { 
  Box, Typography, Card, CardContent, CardMedia, Chip, 
  Switch, FormControlLabel, Alert, CircularProgress
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function Bookshelf() {
  const { currentUser } = useAuth();
  const [books, setBooks] = useState([]);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchBooks();
    // eslint-disable-next-line
  }, []);

  const fetchBooks = async () => {
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('order', { ascending: true });
    setBooks(data || []);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const reordered = Array.from(books);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    setBooks(reordered);
    // Save new order to Supabase
    await Promise.all(
      reordered.map((book, idx) =>
        supabase.from('books').update({ order: idx }).eq('id', book.id)
      )
    );
  };

  const toggleVisibility = async (bookId, currentVisibility) => {
    setUpdating(bookId);
    const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
    const { error } = await supabase
      .from('books')
      .update({ visibility: newVisibility })
      .eq('id', bookId)
      .eq('user_id', currentUser.id);
    if (!error) {
      setBooks(books.map(book => 
        book.id === bookId ? { ...book, visibility: newVisibility } : book
      ));
    }
    setUpdating(null);
  };

  return (
    <Box sx={{ maxWidth: 1300, mx: 'auto', mt: 6, p: 3 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>My Bookshelf</Typography>
      <Typography variant="body1" color="text.secondary" mb={4}>
        Your personal collection • Drag to reorder • Toggle public/private visibility
      </Typography>

      {books.length === 0 ? (
        <Alert severity="info" sx={{ mb: 4 }}>
          Your bookshelf is empty. Upload some books to get started!
        </Alert>
      ) : (
        <Box
          sx={{
            overflowX: 'auto',
            width: '100%',
            pb: 3,
            scrollSnapType: 'x mandatory',
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-thumb': { background: '#409cff33', borderRadius: 4 },
            '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: 4 }
          }}
        >
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="bookshelf" direction="horizontal">
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    display: 'flex',
                    gap: 4,
                    minHeight: 350,
                  }}
                >
                  {books.map((book, idx) => (
                    <Draggable key={book.id} draggableId={book.id.toString()} index={idx}>
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            width: 180,
                            minWidth: 180,
                            minHeight: 320,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            px: 2,
                            pt: 2,
                            pb: 1,
                            borderRadius: 5,
                            background: 'linear-gradient(135deg, rgba(64,156,255,0.16), rgba(118,75,162,0.12))',
                            boxShadow: snapshot.isDragging
                              ? '0 8px 32px 0 rgba(64,156,255,0.25), 0 2px 8px 0 rgba(76,175,80,0.13)'
                              : '0 4px 16px rgba(64,156,255,0.10), 0 2px 8px rgba(76,175,80,0.07)',
                            border: '2px solid rgba(64,156,255,0.13)',
                            scrollSnapAlign: 'center',
                            transition: 'transform 0.3s, box-shadow 0.3s',
                            transform: snapshot.isDragging
                              ? 'scale(1.07) rotate(-3deg)'
                              : 'scale(1)',
                            '&:hover': {
                              transform: 'scale(1.04) translateY(-6px)',
                              boxShadow: '0 12px 32px 0 rgba(64,156,255,0.22), 0 8px 24px 0 rgba(76,175,80,0.11)',
                              background: 'linear-gradient(135deg, rgba(64,156,255,0.22), rgba(118,75,162,0.16))'
                            }
                          }}
                        >
                          {/* Book Cover */}
                          <Box
                            sx={{
                              width: 120,
                              height: 170,
                              mb: 2,
                              borderRadius: 3,
                              overflow: 'hidden',
                              boxShadow: '0 2px 12px rgba(64,156,255,0.10)',
                              background: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <CardMedia
                              component="img"
                              image={book.cover_image || `https://via.placeholder.com/120x160/${book.title.charCodeAt(0) % 2 ? '667eea' : '764ba2'}/fff?text=${book.title.charAt(0)}`}
                              alt={book.title}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                borderRadius: 2,
                              }}
                            />
                          </Box>
                          
                          {/* Book Info */}
                          <CardContent sx={{ p: 0, textAlign: 'center', width: '100%' }}>
                            <Typography
                              variant="body1"
                              fontWeight={700}
                              sx={{
                                mb: 0.5,
                                lineHeight: 1.2,
                                color: '#222',
                                textShadow: '0 1px 8px #fff8, 0 0px 1px #409cff44'
                              }}
                            >
                              {book.title.length > 20 ? `${book.title.substring(0, 20)}...` : book.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                              by {book.author}
                            </Typography>
                            
                            {/* Visibility Status */}
                            <Chip
                              label={book.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                              size="small"
                              color={book.visibility === 'public' ? 'success' : 'default'}
                              sx={{
                                mb: 1,
                                fontSize: 11,
                                px: 1.5,
                                bgcolor: book.visibility === 'public' ? 'rgba(64,156,255,0.16)' : 'rgba(120,120,120,0.13)',
                                color: book.visibility === 'public' ? '#409CFF' : '#555',
                                fontWeight: 600,
                                letterSpacing: 0.5
                              }}
                            />
                            
                            {/* Visibility Toggle */}
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={book.visibility === 'public'}
                                  onChange={() => toggleVisibility(book.id, book.visibility)}
                                  disabled={updating === book.id}
                                  size="small"
                                  color="success"
                                />
                              }
                              label={
                                <Typography variant="caption" sx={{ color: '#409CFF', fontWeight: 600 }}>
                                  {book.visibility === 'public' ? 'Public' : 'Private'}
                                </Typography>
                              }
                              sx={{ mt: 1 }}
                            />
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
      )}
    </Box>
  );
}
