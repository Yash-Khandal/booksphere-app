import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { pdfjs } from 'react-pdf';
import {
  Box, Container, Grid, Card, CardContent, CardMedia, Typography,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip,
  InputAdornment, Stack, Pagination, Dialog, DialogContent, DialogTitle, DialogActions,
  IconButton, Tooltip, Alert, LinearProgress, Slider, Button, Rating, CircularProgress,
  ToggleButton, ToggleButtonGroup, Divider, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import {
  Search as SearchIcon, 
  MenuBook as MenuBookIcon,
  Download as DownloadIcon, 
  PlayArrow as PlayIcon, 
  Pause as PauseIcon,
  Stop as StopIcon, 
  Visibility as ViewIcon, 
  Close as CloseIcon,
  NavigateNext, 
  NavigateBefore,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  VolumeUp as VolumeUpIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  Delete as DeleteIcon,
  Favorite,
  FavoriteBorder,
  Highlight as HighlightIcon,
  FormatPaint as FormatPaintIcon,
  ColorLens as ColorLensIcon,
  Note as NoteIcon,
  BookmarkBorder as BookmarkIcon
} from '@mui/icons-material';
import Loader from '../layout/Loader';

const Document = React.lazy(() => 
  import('react-pdf').then(module => ({ default: module.Document }))
);

const Page = React.lazy(() => 
  import('react-pdf').then(module => ({ default: module.Page }))
);

export default function Browse() {
  const { currentUser } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBook, setSelectedBook] = useState(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isReading, setIsReading] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [pdfScale, setPdfScale] = useState(1);
  const [extractingText, setExtractingText] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);
  const [speechVolume, setSpeechVolume] = useState(1);
  const [readingMode, setReadingMode] = useState('currentPage');
  const [currentUtterance, setCurrentUtterance] = useState(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [bookToRate, setBookToRate] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Like system states
  const [likedBooks, setLikedBooks] = useState(new Set());

  // Highlighting system states
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const [highlights, setHighlights] = useState([]);
  const [selectedHighlight, setSelectedHighlight] = useState(null);
  const [highlightNote, setHighlightNote] = useState('');
  const [showHighlightDialog, setShowHighlightDialog] = useState(false);
  const [showHighlightsList, setShowHighlightsList] = useState(false);
  const [highlightColors] = useState([
    { name: 'Yellow', value: '#ffff00' },
    { name: 'Green', value: '#90EE90' },
    { name: 'Blue', value: '#87CEEB' },
    { name: 'Pink', value: '#FFB6C1' },
    { name: 'Orange', value: '#FFA500' },
    { name: 'Purple', value: '#DDA0DD' }
  ]);

  // Use refs to prevent multiple subscriptions
  const subscriptionRef = useRef(null);
  const isSubscribedRef = useRef(false);
  const textLayerRef = useRef(null);
  const selectionRef = useRef(null);

  const itemsPerPage = 12;

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
  }, []);

  useEffect(() => {
    fetchBooks();
  }, [page, selectedType, searchTerm]);

  // Fetch user's liked books with proper cleanup
  useEffect(() => {
    if (!currentUser?.id) {
      cleanup();
      return;
    }

    fetchLikedBooks();
    
    // Setup subscription only if not already subscribed
    if (!isSubscribedRef.current) {
      setupRealtimeSubscription();
    }

    // Cleanup on unmount or user change
    return cleanup;
  }, [currentUser?.id]); // Only depend on currentUser.id

  // Load highlights when book is selected
  useEffect(() => {
    if (selectedBook && currentUser) {
      loadHighlights();
    }
  }, [selectedBook, currentUser]);

  const fetchLikedBooks = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data } = await supabase
        .from('book_likes')
        .select('book_id')
        .eq('user_id', currentUser.id);
      
      setLikedBooks(new Set(data?.map(like => like.book_id) || []));
    } catch (error) {
      console.error('Error fetching liked books:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (isSubscribedRef.current || !currentUser?.id) {
      return;
    }

    try {
      // Create a unique channel name to avoid conflicts
      const channelName = `book-likes-${currentUser.id}-${Date.now()}`;
      
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'book_likes',
            filter: `user_id=eq.${currentUser.id}` 
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setLikedBooks(prev => new Set([...prev, payload.new.book_id]));
            } else if (payload.eventType === 'DELETE') {
              setLikedBooks(prev => {
                const newSet = new Set(prev);
                newSet.delete(payload.old.book_id);
                return newSet;
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to book likes');
            isSubscribedRef.current = true;
          }
        });

      subscriptionRef.current = channel;
    } catch (error) {
      console.error('Error setting up realtime subscription:', error);
    }
  };

  const cleanup = () => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    isSubscribedRef.current = false;
  };

  // Highlighting functions
  const loadHighlights = async () => {
    if (!currentUser || !selectedBook) return;
    
    try {
      const { data, error } = await supabase
        .from('book_highlights')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('book_id', selectedBook.id)
        .eq('page_number', pageNumber);
      
      if (error) throw error;
      setHighlights(data || []);
    } catch (error) {
      console.error('Error loading highlights:', error);
    }
  };

  const saveHighlight = async (highlightData) => {
    if (!currentUser || !selectedBook) return;
    
    try {
      const { data, error } = await supabase
        .from('book_highlights')
        .insert({
          user_id: currentUser.id,
          book_id: selectedBook.id,
          page_number: pageNumber,
          text: highlightData.text,
          color: highlightData.color,
          note: highlightData.note || null,
          position: highlightData.position
        })
        .select();
      
      if (error) throw error;
      setHighlights(prev => [...prev, data[0]]);
      return data[0];
    } catch (error) {
      console.error('Error saving highlight:', error);
      setError('Failed to save highlight');
    }
  };

  const deleteHighlight = async (highlightId) => {
    try {
      const { error } = await supabase
        .from('book_highlights')
        .delete()
        .eq('id', highlightId)
        .eq('user_id', currentUser.id);
      
      if (error) throw error;
      setHighlights(prev => prev.filter(h => h.id !== highlightId));
    } catch (error) {
      console.error('Error deleting highlight:', error);
      setError('Failed to delete highlight');
    }
  };

  const handleTextSelection = () => {
    if (!highlightMode) return;
    
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();
      
      // Get position relative to page
      const rect = range.getBoundingClientRect();
      const pageElement = document.querySelector('.react-pdf__Page');
      const pageRect = pageElement ? pageElement.getBoundingClientRect() : { top: 0, left: 0 };
      
      const position = {
        top: rect.top - pageRect.top,
        left: rect.left - pageRect.left,
        width: rect.width,
        height: rect.height
      };
      
      // Create highlight
      const highlightData = {
        text: selectedText,
        color: highlightColor,
        position: position
      };
      
      setSelectedHighlight(highlightData);
      setShowHighlightDialog(true);
      
      // Clear selection
      selection.removeAllRanges();
    }
  };

  const confirmHighlight = async () => {
    if (selectedHighlight) {
      const highlightWithNote = {
        ...selectedHighlight,
        note: highlightNote
      };
      
      await saveHighlight(highlightWithNote);
      setShowHighlightDialog(false);
      setSelectedHighlight(null);
      setHighlightNote('');
    }
  };

  const toggleLike = async (book) => {
    if (!currentUser) return;
    
    const isLiked = likedBooks.has(book.id);
    
    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('book_likes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('book_id', book.id);
        
        if (error) throw error;
        
        // Update state immediately
        setLikedBooks(prev => {
          const newSet = new Set(prev);
          newSet.delete(book.id);
          return newSet;
        });
      } else {
        // Like
        const { error } = await supabase
          .from('book_likes')
          .insert({
            user_id: currentUser.id,
            book_id: book.id
          });
        
        if (error) throw error;
        
        // Update state immediately
        setLikedBooks(prev => new Set([...prev, book.id]));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      setError('Failed to update like status');
    }
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('books')
        .select('*', { count: 'exact' })
        .eq('visibility', 'public'); // Only show public books

      if (selectedType !== 'all') {
        query = query.eq('type', selectedType);
      }
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`);
      }

      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;
      query = query.range(start, end);

      const { data, count, error } = await query;

      if (error) throw error;

      setBooks(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching books:', error);
      setError('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const extractPdfText = async (pdfUrl, specificPage = null) => {
    try {
      setExtractingText(true);
      setError('');
      const response = await fetch(pdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      const typedArray = new Uint8Array(arrayBuffer);
      const pdf = await pdfjs.getDocument(typedArray).promise;
      let extractedText = '';
      
      if (specificPage) {
        const page = await pdf.getPage(specificPage);
        const textContent = await page.getTextContent();
        extractedText = textContent.items.map(item => item.str).join(' ');
      } else {
        const maxPages = Math.min(pdf.numPages, 10);
        for (let i = 1; i <= maxPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          extractedText += `Page ${i}: ${pageText}\n\n`;
        }
      }
      return extractedText;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      setError('Failed to extract text from PDF: ' + error.message);
      return null;
    } finally {
      setExtractingText(false);
    }
  };

  const recordReadingSession = async (bookId, isLastPage = false) => {
    if (!currentUser || !bookId) return;
    try {
      await supabase.from('reading_sessions').insert({
        user_id: currentUser.id,
        book_id: bookId,
        duration: 1,
        pages_read: 1,
        session_date: new Date().toISOString().split('T')[0]
      });

      if (isLastPage && numPages) {
        await supabase.from('user_books').upsert({
          user_id: currentUser.id,
          book_id: bookId,
          status: 'finished',
          pages_read: numPages,
          total_pages: numPages,
          finished_at: new Date()
        });
        setBookToRate(selectedBook);
        setShowRatingDialog(true);
      }
    } catch (error) {
      console.error('Error recording reading session:', error);
    }
  };

  const submitRating = async () => {
    if (!userRating || !bookToRate) return;
    try {
      setSubmittingRating(true);
      const { error } = await supabase.from('book_reviews').insert({
        user_id: currentUser.id,
        book_id: bookToRate.id,
        rating: userRating,
        review_text: reviewText.trim() || null
      });
      if (error) throw error;
      setShowRatingDialog(false);
      setBookToRate(null);
      setUserRating(0);
      setReviewText('');
      alert('Thank you for your rating!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleDeleteBook = async (book) => {
    if (!window.confirm(`Are you sure you want to delete "${book.title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeleting(book.id);
      setError('');
      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', book.id)
        .eq('user_id', currentUser.id);
      if (error) throw error;
      setBooks(prevBooks => prevBooks.filter(b => b.id !== book.id));
      alert('Book deleted successfully!');
    } catch (error) {
      console.error('Error deleting book:', error);
      setError('Failed to delete book: ' + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const startReadingPdfContent = async () => {
    if (!selectedBook?.file_url) {
      setError('No PDF file selected');
      return;
    }

    if ('speechSynthesis' in window) {
      stopReading();

      const textToRead = await extractPdfText(
        selectedBook.file_url,
        readingMode === 'currentPage' ? pageNumber : null
      );

      if (!textToRead) {
        setError('Failed to extract text from PDF');
        return;
      }

      const cleanText = textToRead
        .replace(/\s+/g, ' ')
        .replace(/([.!?])\s*([A-Z])/g, '$1 $2')
        .replace(/\n+/g, '. ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = speechRate;
      utterance.pitch = 1;
      utterance.volume = speechVolume;

      const words = cleanText.split(' ');
      let currentWordIndex = 0;

      utterance.onstart = () => {
        setIsReading(true);
        setReadingProgress(0);
        setCurrentUtterance(utterance);
      };

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          currentWordIndex++;
          const progress = (currentWordIndex / words.length) * 100;
          setReadingProgress(progress);
        }
      };

      utterance.onend = async () => {
        setIsReading(false);
        setCurrentUtterance(null);
        setReadingProgress(100);
        setTimeout(() => setReadingProgress(0), 2000);
        await recordReadingSession(selectedBook.id, pageNumber === numPages);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsReading(false);
        setCurrentUtterance(null);
        setError('Speech synthesis error occurred');
      };

      speechSynthesis.speak(utterance);

    } else {
      setError('Text-to-speech not supported in your browser');
    }
  };

  const goToPage = async (newPage) => {
    setPageNumber(newPage);
    await recordReadingSession(selectedBook?.id, newPage === numPages);
  };
  
  const openPdfViewer = (book) => {
    setSelectedBook(book);
    setPdfViewerOpen(true);
    setPageNumber(1);
    setPdfScale(1);
    setError('');
    setHighlightMode(false);
    setHighlights([]);
  };

  const closePdfViewer = () => {
    setPdfViewerOpen(false);
    setSelectedBook(null);
    setNumPages(null);
    setPageNumber(1);
    setPdfScale(1);
    setHighlightMode(false);
    setHighlights([]);
    setShowHighlightsList(false);
    stopReading();
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setError('');
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF. Please check the file.');
  };

  const downloadBook = async (book) => {
    try {
      setDownloading(book.id);
      setError('');

      const response = await fetch(book.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Error downloading book:', error);
      setError('Failed to download book');
    } finally {
      setDownloading(null);
    }
  };

  const stopReading = () => {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    setIsReading(false);
    setCurrentUtterance(null);
    setReadingProgress(0);
  };

  const pauseReading = () => {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause();
      setIsReading(false);
    } else if (speechSynthesis.paused) {
      speechSynthesis.resume();
      setIsReading(true);
    }
  };

  const zoomIn = () => {
    setPdfScale(prev => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setPdfScale(prev => Math.max(prev - 0.2, 0.5));
  };
  
  const getBookCover = (book) => {
    if (book.cover_image) return book.cover_image;
    const colors = ['409CFF', 'dc004e', '43a047', 'ff9800', '9c27b0'];
    const colorIndex = book.title.charCodeAt(0) % colors.length;
    return `https://via.placeholder.com/300x400/${colors[colorIndex]}/white?text=${book.title.charAt(0)}`;
  };
  
  const getPdfWidth = () => {
    const viewportWidth = window.innerWidth;
    const dialogPadding = 100;
    const baseWidth = viewportWidth - dialogPadding;
    return Math.min(baseWidth * pdfScale, baseWidth * 2);
  };

  return (
    <Loader>
      {/* Animated Gradient Waves Background */}
      <div className="wave-bg">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>
      
      <Container maxWidth="lg" sx={{ py: 4, position: 'relative', zIndex: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Search and Filter Section */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by title or author..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Filter by Type</InputLabel>
                <Select
                  value={selectedType}
                  label="Filter by Type"
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="ebook">eBooks</MenuItem>
                  <MenuItem value="video">Videos</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                  <MenuItem value="summary">Summaries</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        {/* Books Grid */}
        <Grid container spacing={3}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 4 }}>
              <Typography>Loading...</Typography>
            </Box>
          ) : books.length === 0 ? (
            <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
              <MenuBookIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No books found
              </Typography>
            </Box>
          ) : (
            books.map((book) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={book.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 5,
                    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                    background: 'rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'scale(1.045)',
                      boxShadow: '0 16px 40px 0 rgba(31, 38, 135, 0.37)',
                      background: 'rgba(255,255,255,0.28)',
                    }
                  }}
                >
                  <CardMedia
                    component="img"
                    height="250"
                    image={getBookCover(book)}
                    alt={book.title}
                    sx={{ 
                      objectFit: 'cover', // FIXED: Remove gaps and fill container
                      background: '#fff',
                      borderTopLeftRadius: 20, 
                      borderTopRightRadius: 20 
                    }}
                  />
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography gutterBottom variant="h6" component="h2" noWrap title={book.title} sx={{ fontWeight: 700 }}>
                      {book.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                      by {book.author}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
                      {book.description}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                      <Chip label={book.type} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600, fontSize: 13 }} />
                      {book.tags?.slice(0, 1).map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: 13 }} />
                      ))}
                    </Stack>

                    {/* Enhanced Action Buttons with Like Feature */}
                    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                      <Tooltip title="Read PDF">
                        <Button 
                          variant="outlined"
                          size="small"
                          color="primary" 
                          onClick={() => openPdfViewer(book)}
                          disabled={book.type !== 'ebook'}
                          sx={{ borderRadius: 5, textTransform: 'none' }}
                          startIcon={<ViewIcon />}
                        >
                          Read
                        </Button>
                      </Tooltip>
                      
                      {/* Like Button */}
                      <Tooltip title={likedBooks.has(book.id) ? "Unlike" : "Like"}>
                        <Button
                          variant={likedBooks.has(book.id) ? 'contained' : 'outlined'}
                          size="small"
                          color="error"
                          onClick={() => toggleLike(book)}
                          disabled={!currentUser}
                          sx={{ borderRadius: 5, minWidth: 'auto', px: 1.5 }}
                          startIcon={likedBooks.has(book.id) ? <Favorite /> : <FavoriteBorder />}
                        >
                          {likedBooks.has(book.id) ? 'Liked' : 'Like'}
                        </Button>
                      </Tooltip>
                      
                      {/* Delete button (only for uploader) */}
                      {currentUser?.id === book.user_id && (
                        <Tooltip title="Delete Book">
                           <IconButton 
                             color="warning"
                             onClick={() => handleDeleteBook(book)}
                             disabled={deleting === book.id}
                             size="small"
                           >
                             {deleting === book.id ? <CircularProgress size={20} /> : <DeleteIcon />}
                           </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}

        {/* PDF Viewer Dialog with Enhanced Highlighting Tools */}
        <Dialog 
          open={pdfViewerOpen} 
          onClose={closePdfViewer}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { height: '90vh' } }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            bgcolor: 'primary.main',
            color: 'white'
          }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              {selectedBook?.title}
            </Typography>
            
            {/* Enhanced Toolbar with Highlighting Tools */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Highlighting Tools */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, p: 0.5 }}>
                <Tooltip title={highlightMode ? "Exit Highlight Mode" : "Enter Highlight Mode"}>
                  <ToggleButton
                    value="highlight"
                    selected={highlightMode}
                    onChange={() => setHighlightMode(!highlightMode)}
                    size="small"
                    sx={{ color: 'white', border: '1px solid white' }}
                  >
                    <HighlightIcon />
                  </ToggleButton>
                </Tooltip>
                
                {highlightMode && (
                  <>
                    <Tooltip title="Choose Highlight Color">
                      <IconButton
                        size="small"
                        sx={{ color: 'white' }}
                      >
                        <ColorLensIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Select
                      size="small"
                      value={highlightColor}
                      onChange={(e) => setHighlightColor(e.target.value)}
                      sx={{ 
                        color: 'white',
                        minWidth: 100,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                        '.MuiSvgIcon-root': { color: 'white' }
                      }}
                    >
                      {highlightColors.map((color) => (
                        <MenuItem key={color.value} value={color.value}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 16, height: 16, bgcolor: color.value, borderRadius: 1 }} />
                            {color.name}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </>
                )}
                
                <Tooltip title="Show Highlights">
                  <IconButton
                    onClick={() => setShowHighlightsList(!showHighlightsList)}
                    size="small"
                    sx={{ color: 'white' }}
                  >
                    <BookmarkIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Divider orientation="vertical" flexItem sx={{ bgcolor: 'white' }} />
              
              {/* Reading Mode Selection */}
              <Select
                size="small"
                value={readingMode}
                onChange={(e) => setReadingMode(e.target.value)}
                sx={{ 
                  color: 'white',
                  minWidth: 120,
                  '.MuiOutlinedInput-notchedOutline': { borderColor: 'white' },
                  '.MuiSvgIcon-root': { color: 'white' }
                }}
              >
                <MenuItem value="currentPage">Current Page</MenuItem>
                <MenuItem value="fullDocument">Full Document</MenuItem>
              </Select>
              
              {/* Speech Controls */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon fontSize="small" />
                <Slider
                  size="small"
                  value={speechRate}
                  onChange={(e, value) => setSpeechRate(value)}
                  min={0.5}
                  max={2}
                  step={0.1}
                  sx={{ width: 60, color: 'white' }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VolumeUpIcon fontSize="small" />
                <Slider
                  size="small"
                  value={speechVolume}
                  onChange={(e, value) => setSpeechVolume(value)}
                  min={0}
                  max={1}
                  step={0.1}
                  sx={{ width: 60, color: 'white' }}
                />
              </Box>
              
              {/* Zoom Controls */}
              <Tooltip title="Zoom Out">
                <IconButton onClick={zoomOut} sx={{ color: 'white' }}>
                  <ZoomOutIcon />
                </IconButton>
              </Tooltip>
              <Typography sx={{ minWidth: 60, textAlign: 'center' }}>
                {Math.round(pdfScale * 100)}%
              </Typography>
              <Tooltip title="Zoom In">
                <IconButton onClick={zoomIn} sx={{ color: 'white' }}>
                  <ZoomInIcon />
                </IconButton>
              </Tooltip>
              
              {/* Page Navigation */}
              {numPages && (
                <>
                  <IconButton 
                    onClick={() => goToPage(Math.max(pageNumber - 1, 1))}
                    disabled={pageNumber <= 1}
                    sx={{ color: 'white' }}
                  >
                    <NavigateBefore />
                  </IconButton>
                  <Typography sx={{ minWidth: 80, textAlign: 'center' }}>
                    {pageNumber} / {numPages}
                  </Typography>
                  <IconButton 
                    onClick={() => goToPage(Math.min(pageNumber + 1, numPages))}
                    disabled={pageNumber >= numPages}
                    sx={{ color: 'white' }}
                  >
                    <NavigateNext />
                  </IconButton>
                </>
              )}
              
              {/* Reading Controls */}
              <Tooltip title={extractingText ? "Extracting text..." : "Read PDF Content"}>
                <IconButton 
                  onClick={startReadingPdfContent}
                  disabled={extractingText || isReading}
                  sx={{ color: 'white' }}
                >
                  {extractingText ? (
                    <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="caption">...</Typography>
                    </Box>
                  ) : (
                    <PlayIcon />
                  )}
                </IconButton>
              </Tooltip>
              {isReading && (
                <Tooltip title="Pause/Resume Reading">
                  <IconButton onClick={pauseReading} sx={{ color: 'white' }}>
                    <PauseIcon />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Stop Reading">
                <IconButton onClick={stopReading} sx={{ color: 'white' }}>
                  <StopIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={closePdfViewer} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
            {/* Highlights Sidebar */}
            {showHighlightsList && (
              <Box sx={{ 
                width: 300, 
                bgcolor: '#f5f5f5', 
                borderRight: '1px solid #ddd',
                overflowY: 'auto',
                p: 2
              }}>
                <Typography variant="h6" gutterBottom>
                  Highlights
                </Typography>
                <List dense>
                  {highlights.map((highlight) => (
                    <ListItem key={highlight.id} sx={{ bgcolor: 'white', mb: 1, borderRadius: 1 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                bgcolor: highlight.color, 
                                borderRadius: 1 
                              }} 
                            />
                            <Typography variant="body2" noWrap>
                              {highlight.text.substring(0, 50)}...
                            </Typography>
                          </Box>
                        }
                        secondary={highlight.note}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          size="small" 
                          onClick={() => deleteHighlight(highlight.id)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {highlights.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No highlights on this page
                    </Typography>
                  )}
                </List>
              </Box>
            )}

            {/* PDF Content */}
            <DialogContent sx={{ 
              p: 0, 
              overflow: 'auto', 
              textAlign: 'center',
              bgcolor: '#f5f5f5',
              flex: 1,
              position: 'relative'
            }}>
              {selectedBook?.file_url && (
                <Box 
                  onMouseUp={handleTextSelection}
                  sx={{ 
                    cursor: highlightMode ? 'crosshair' : 'default',
                    position: 'relative'
                  }}
                >
                  <React.Suspense fallback={
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography>Loading PDF...</Typography>
                    </Box>
                  }>
                    <Document
                      file={selectedBook.file_url}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <Typography>Loading PDF...</Typography>
                        </Box>
                      }
                      error={
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                          <Typography color="error">Failed to load PDF</Typography>
                        </Box>
                      }
                    >
                      <Page 
                        pageNumber={pageNumber} 
                        width={getPdfWidth()}
                        renderTextLayer={true}
                        renderAnnotationLayer={false}
                        className="pdf-page"
                      />
                    </Document>
                  </React.Suspense>
                  
                  {/* Render highlights overlay */}
                  {highlights.map((highlight) => (
                    <Box
                      key={highlight.id}
                      sx={{
                        position: 'absolute',
                        top: highlight.position.top,
                        left: highlight.position.left,
                        width: highlight.position.width,
                        height: highlight.position.height,
                        backgroundColor: highlight.color,
                        opacity: 0.3,
                        pointerEvents: 'none',
                        zIndex: 1
                      }}
                    />
                  ))}
                </Box>
              )}
            </DialogContent>
          </Box>
        </Dialog>

        {/* Highlight Confirmation Dialog */}
        <Dialog 
          open={showHighlightDialog} 
          onClose={() => setShowHighlightDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HighlightIcon color="primary" />
              <Typography variant="h6">Add Highlight</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Text:
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: selectedHighlight?.color || highlightColor, 
                borderRadius: 1,
                opacity: 0.7
              }}>
                <Typography variant="body2">
                  {selectedHighlight?.text}
                </Typography>
              </Box>
            </Box>
            <TextField
              fullWidth
              label="Add a note (Optional)"
              multiline
              rows={3}
              value={highlightNote}
              onChange={(e) => setHighlightNote(e.target.value)}
              placeholder="Add your thoughts about this highlight..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowHighlightDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="contained"
              onClick={confirmHighlight}
              startIcon={<HighlightIcon />}
            >
              Add Highlight
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Rating Dialog */}
        <Dialog 
          open={showRatingDialog} 
          onClose={() => setShowRatingDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StarIcon color="primary" />
              <Typography variant="h6">Rate this Book</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {bookToRate?.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                by {bookToRate?.author}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="body1" gutterBottom>
                How would you rate this book?
              </Typography>
              <Rating
                value={userRating}
                onChange={(event, newValue) => setUserRating(newValue)}
                size="large"
                sx={{ fontSize: '2.5rem' }}
              />
            </Box>
            <TextField
              fullWidth
              label="Write a review (Optional)"
              multiline
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your thoughts about this book..."
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setShowRatingDialog(false)}
              disabled={submittingRating}
            >
              Skip
            </Button>
            <Button 
              variant="contained"
              onClick={submitRating}
              disabled={!userRating || submittingRating}
              startIcon={submittingRating ? <CircularProgress size={20} /> : <StarIcon />}
            >
              {submittingRating ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Enhanced Reading Progress Card */}
        {isReading && (
          <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1300 }}>
            <Card sx={{ p: 2, minWidth: 320, maxWidth: 400 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <VolumeUpIcon color="secondary" />
                <Typography variant="body2" sx={{ flexGrow: 1 }}>
                  Reading PDF {readingMode === 'currentPage' ? `Page ${pageNumber}` : 'Content'}...
                </Typography>
                <IconButton onClick={pauseReading} size="small">
                  <PauseIcon />
                </IconButton>
                <IconButton onClick={stopReading} size="small">
                  <StopIcon />
                </IconButton>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={readingProgress} 
                sx={{ mb: 1, height: 6, borderRadius: 3 }} 
              />
              <Typography variant="caption" color="text.secondary">
                {Math.round(readingProgress)}% complete • Speed: {speechRate}x • Volume: {Math.round(speechVolume * 100)}%
              </Typography>
            </Card>
          </Box>
        )}
      </Container>
    </Loader>
  );
}
