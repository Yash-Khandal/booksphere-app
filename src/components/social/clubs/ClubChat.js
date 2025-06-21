import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../config/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import {
  Box, TextField, Button, List, ListItem,
  ListItemText, ListItemAvatar, Avatar, Typography,
  Card, CardContent, Alert, CircularProgress, IconButton, Popover
} from '@mui/material';
import { Send as SendIcon, EmojiEmotions as EmojiIcon } from '@mui/icons-material';
import SoundNotification from '../../layout/SoundNotification';

const EMOJI_STICKERS = [
  { emoji: '🎉', name: 'party' },
  { emoji: '🔥', name: 'fire' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '😂', name: 'laugh' },
  { emoji: '👏', name: 'clap' },
  { emoji: '🚀', name: 'rocket' },
  { emoji: '💡', name: 'idea' },
  { emoji: '⭐', name: 'star' },
  { emoji: '👍', name: 'thumbsup' },
  { emoji: '😍', name: 'hearteyes' },
  { emoji: '🎯', name: 'target' },
  { emoji: '💎', name: 'gem' }
];

export default function ClubChat({ clubId }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [flyingEmojis, setFlyingEmojis] = useState([]);
  const messagesEndRef = useRef(null);
  const channelRef = useRef(null);
  const [playSound, setPlaySound] = useState(false);

  // Check membership on mount
  useEffect(() => {
    if (clubId && currentUser?.id) {
      checkMembership();
    }
    // eslint-disable-next-line
  }, [clubId, currentUser]);

  // Fetch messages and set up real-time subscription when member
  useEffect(() => {
    if (!isMember || !clubId) return;
    fetchMessages();

    // Remove previous channel if any
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
    // Subscribe to new messages
    const channel = supabase
      .channel(`club_chat_${clubId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'book_club_chats',
        filter: `club_id=eq.${clubId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
        scrollToBottom();
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line
  }, [isMember, clubId]);

  const checkMembership = async () => {
    try {
      const { data, error } = await supabase
        .from('book_club_members')
        .select('*')
        .eq('club_id', clubId)
        .eq('user_id', currentUser.id)
        .single();
      setIsMember(!error && !!data);
    } catch (err) {
      setIsMember(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error } = await supabase
        .from('book_club_chats')
        .select(`
          id,
          message,
          created_at,
          user_id,
          profiles (id, email, name, avatar_url)
        `)
        .eq('club_id', clubId)
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) {
        setError('Failed to load chat messages');
        return;
      }
      setMessages(data || []);
      scrollToBottom();
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText = newMessage.trim()) => {
    if (!messageText || !currentUser?.id || !isMember) return;
    try {
      setSending(true);
      setError('');
      // Optimistically add message to UI
      const tempId = 'temp-' + Date.now();
      const optimisticMsg = {
        id: tempId,
        message: messageText,
        created_at: new Date().toISOString(),
        user_id: currentUser.id,
        profiles: {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.full_name || currentUser.email?.split('@')[0] || '',
          avatar_url: currentUser.avatar_url || ''
        }
      };
      setMessages(prev => [...prev, optimisticMsg]);
      scrollToBottom();
      setPlaySound(true);

      const { error } = await supabase
        .from('book_club_chats')
        .insert([{
          club_id: clubId,
          user_id: currentUser.id,
          message: messageText
        }]);
      if (error) {
        setError('Failed to send message: ' + error.message);
        // Remove optimistic message if error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        return;
      }
      if (messageText === newMessage.trim()) {
        setNewMessage('');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSending(false);
    }
  };

  // Reset playSound after playing
  useEffect(() => {
    if (playSound) {
      const timer = setTimeout(() => setPlaySound(false), 500);
      return () => clearTimeout(timer);
    }
  }, [playSound]);

  const sendEmojiSticker = (emoji) => {
    sendMessage(emoji.emoji);
    const flyingEmoji = {
      id: Date.now() + Math.random(),
      emoji: emoji.emoji,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10
    };
    setFlyingEmojis(prev => [...prev, flyingEmoji]);
    setTimeout(() => {
      setFlyingEmojis(prev => prev.filter(e => e.id !== flyingEmoji.id));
    }, 3000);
    setEmojiAnchor(null);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const getUserDisplayName = (profiles) => {
    if (!profiles) return 'Unknown User';
    return profiles.name || profiles.email?.split('@')[0] || 'Unknown User';
  };

  if (!isMember) {
    return (
      <Card sx={{
        borderRadius: 4,
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)'
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>💬 Club Chat</Typography>
          <Alert severity="info">
            You must be a member of this club to access the chat.
            Join the club to start chatting with other members!
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{
      position: 'relative',
      borderRadius: 4,
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
      overflow: 'hidden'
    }}>
      {/* Sound notification for sent messages */}
      <SoundNotification play={playSound} />
      {/* Flying Emojis */}
      {flyingEmojis.map(emoji => (
        <Box
          key={emoji.id}
          sx={{
            position: 'absolute',
            left: `${emoji.x}%`,
            top: `${emoji.y}%`,
            fontSize: '2rem',
            zIndex: 1000,
            animation: 'flyUp 3s ease-out forwards',
            '@keyframes flyUp': {
              '0%': { opacity: 1, transform: 'scale(1) translateY(0)' },
              '50%': { transform: 'scale(1.5) translateY(-30px)' },
              '100%': { opacity: 0, transform: 'scale(0.5) translateY(-60px)' }
            }
          }}
        >
          {emoji.emoji}
        </Box>
      ))}
      <CardContent>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          background: 'linear-gradient(90deg, #667eea, #764ba2)',
          borderRadius: 2,
          p: 2,
          color: 'white'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
            💬 Club Chat
          </Typography>
          <Box sx={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50px',
            px: 2,
            py: 0.5,
            fontSize: '0.8rem',
            fontWeight: 500
          }}>
            Live
          </Box>
        </Box>
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              bgcolor: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)'
            }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}
        <Box sx={{
          height: 400,
          overflowY: 'auto',
          mb: 2,
          p: 2,
          bgcolor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 2,
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)'
        }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={30} />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography sx={{ color: 'text.secondary', mb: 1, fontSize: '1.1rem' }}>
                🎉 No messages yet. Start the conversation!
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {messages.map(msg => (
                <ListItem
                  key={msg.id}
                  sx={{
                    py: 1.5,
                    alignItems: 'flex-start',
                    borderRadius: 2,
                    mb: 1,
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                    '&:hover': {
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
                      transform: 'translateY(-1px)',
                      transition: 'all 0.2s ease'
                    }
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={msg.profiles?.avatar_url}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    >
                      {getUserDisplayName(msg.profiles).charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={600} color="primary">
                          {getUserDisplayName(msg.profiles)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.4, fontSize: msg.message.length === 2 ? '1.5rem' : 'inherit' }}>
                        {msg.message}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
              <div ref={messagesEndRef} />
            </List>
          )}
        </Box>
        <Box sx={{
          display: 'flex',
          gap: 1,
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          p: 1
        }}>
          <IconButton
            onClick={(e) => setEmojiAnchor(e.currentTarget)}
            sx={{
              color: '#667eea',
              '&:hover': {
                background: 'rgba(102, 126, 234, 0.1)',
                transform: 'scale(1.1)'
              }
            }}
          >
            <EmojiIcon />
          </IconButton>
          <TextField
            fullWidth
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message... 💭"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={sending}
            multiline
            maxRows={3}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.9)'
                },
                '&.Mui-focused': {
                  background: 'white'
                }
              }
            }}
          />
          <Button
            variant="contained"
            onClick={() => sendMessage()}
            endIcon={<SendIcon />}
            disabled={!newMessage.trim() || sending}
            sx={{
              minWidth: 'auto',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: 2,
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8, #6a4190)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
              },
              '&:disabled': {
                background: 'rgba(0,0,0,0.12)'
              }
            }}
          >
            {sending ? '...' : 'Send'}
          </Button>
        </Box>
      </CardContent>
      <Popover
        open={Boolean(emojiAnchor)}
        anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
          {EMOJI_STICKERS.map((emoji) => (
            <IconButton
              key={emoji.name}
              onClick={() => sendEmojiSticker(emoji)}
              sx={{
                fontSize: '1.5rem',
                '&:hover': {
                  transform: 'scale(1.2)',
                  background: 'rgba(102, 126, 234, 0.1)'
                }
              }}
            >
              {emoji.emoji}
            </IconButton>
          ))}
        </Box>
      </Popover>
    </Card>
  );
}
