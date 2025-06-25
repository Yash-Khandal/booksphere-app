import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../config/supabase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Menu,
  MenuItem,
  Button,
  Avatar,
  Tooltip,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Brightness4 as Brightness4Icon,
  Brightness7 as Brightness7Icon,
  CloudUpload as CloudUploadIcon,
  Groups as GroupsIcon,
  People as PeopleIcon,
  AccountCircle,
  Book,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import NotificationDropdown from './NotificationDropdown';

// Animated Hamburger Component
const AnimatedHamburger = ({ isOpen, onClick, size = 24, color = 'currentColor' }) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: size,
        height: size,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
        position: 'relative',
        padding: '8px',
        '&:hover': {
          opacity: 0.8,
        },
      }}
    >
      {/* Top Bar */}
      <Box
        sx={{
          width: '20px',
          height: '2px',
          backgroundColor: color,
          borderRadius: '1px',
          transition: 'all 0.3s ease',
          transformOrigin: 'center',
          position: 'absolute',
          top: isOpen ? '50%' : '30%',
          transform: isOpen 
            ? 'translateY(-50%) rotate(45deg)' 
            : 'translateY(-50%) rotate(0deg)',
        }}
      />
      
      {/* Middle Bar */}
      <Box
        sx={{
          width: '20px',
          height: '2px',
          backgroundColor: color,
          borderRadius: '1px',
          transition: 'all 0.3s ease',
          opacity: isOpen ? 0 : 1,
          transform: isOpen ? 'scale(0)' : 'scale(1)',
        }}
      />
      
      {/* Bottom Bar */}
      <Box
        sx={{
          width: '20px',
          height: '2px',
          backgroundColor: color,
          borderRadius: '1px',
          transition: 'all 0.3s ease',
          transformOrigin: 'center',
          position: 'absolute',
          bottom: isOpen ? '50%' : '30%',
          transform: isOpen 
            ? 'translateY(50%) rotate(-45deg)' 
            : 'translateY(50%) rotate(0deg)',
        }}
      />
    </Box>
  );
};

export default function Navigation({ mode, toggleMode }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const subscriptionRef = useRef(null);
  const isSubscribedRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [currentUser?.id]);

  const setupNotificationSubscription = useCallback(() => {
    if (isSubscribedRef.current || !currentUser?.id) {
      return;
    }

    try {
      const channelName = `notifications-${currentUser.id}-${Date.now()}`;
      
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications', 
            filter: `user_id=eq.${currentUser.id}` 
          },
          (payload) => {
            console.log('New notification received:', payload);
            setNotifications(prev => [payload.new, ...prev.slice(0, 9)]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to notifications');
            isSubscribedRef.current = true;
          }
        });

      subscriptionRef.current = channel;
    } catch (error) {
      console.error('Error setting up notification subscription:', error);
    }
  }, [currentUser?.id]);

  const cleanup = () => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }
    isSubscribedRef.current = false;
  };

  const username = useMemo(() => {
    if (!currentUser?.email) return '';
    return currentUser.email.split('@')[0];
  }, [currentUser]);

  const avatarInitial = useMemo(() => {
    return username.charAt(0).toUpperCase();
  }, [username]);

  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!currentUser?.id) {
        setAvatarUrl('');
        return;
      }
      try {
        const { data } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', currentUser.id)
          .single();
        if (data?.avatar_url) {
          setAvatarUrl(data.avatar_url);
        } else {
          setAvatarUrl('');
        }
      } catch {
        setAvatarUrl('');
      }
    };
    fetchUserAvatar();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser?.id) {
      cleanup();
      return;
    }

    fetchNotifications();
    
    if (!isSubscribedRef.current) {
      setupNotificationSubscription();
    }

    return cleanup;
  }, [currentUser?.id, fetchNotifications, setupNotificationSubscription]);

  const markAsRead = async (notificationId) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    const handleAvatarUpdate = (event) => {
      if (event.detail?.avatarUrl) {
        setAvatarUrl(event.detail.avatarUrl);
      }
    };
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, []);

  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    try {
      cleanup();
      await logout();
      setAvatarUrl('');
      setNotifications([]);
      setUnreadCount(0);
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const handleUploadClose = () => {
    setUploadDialogOpen(false);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // FIXED: Auto-close drawer when navigation item is clicked
  const handleDrawerItemClick = () => {
    setMobileOpen(false);
  };

  const navLinks = [
    { label: 'Home', path: '/', icon: <DashboardIcon /> },
    { label: 'Upload', path: '/upload', icon: <CloudUploadIcon /> },
    { label: 'Browse', path: '/browse', icon: <Book /> },
    { label: 'Progress', path: '/progress', icon: <GroupsIcon /> },
    { label: 'Clubs', path: '/clubs', icon: <GroupsIcon /> },
    { label: 'Friends', path: '/friends', icon: <PeopleIcon /> },
  ];

  const drawer = (
    <Box
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, #ff6f61 0%, #a100ff 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)' }}>
          BookSphere
        </Typography>
      </Box>
      <List sx={{ flexGrow: 1, color: '#fff' }}>
        {navLinks.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              onClick={handleDrawerItemClick} // FIXED: Auto-close on click
              sx={{
                py: 1.5,
                px: 3,
                color: '#fff',
                bgcolor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                },
                '& .MuiListItemIcon-root': {
                  color: location.pathname === item.path ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? '#fff' : 'rgba(255, 255, 255, 0.7)' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: location.pathname === item.path ? 600 : 400,
                  color: '#fff',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {currentUser && (
        <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton 
                component={Link} 
                to="/profile" 
                onClick={() => {
                  handleClose();
                  handleDrawerItemClick(); // FIXED: Auto-close on click
                }}
              >
                <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }}><AccountCircle /></ListItemIcon>
                <ListItemText primary="Profile" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}>
                <ListItemIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }}><LogoutIcon /></ListItemIcon>
                <ListItemText primary="Logout" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            backgroundColor: theme.palette.mode === 'dark' ? '#181818' : '#fff',
            color: theme.palette.mode === 'dark' ? '#fff' : '#181818',
            borderBottom: theme.palette.mode === 'dark' ? '1px solid #222' : '1px solid #eee',
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)',
            zIndex: 1201,
          }}
        >
          <Toolbar>
            {/* FIXED: Replaced MenuIcon with AnimatedHamburger */}
            <Box sx={{ mr: 2, display: { md: 'none' } }}>
              <AnimatedHamburger
                isOpen={mobileOpen}
                onClick={handleDrawerToggle}
                size={24}
                color={theme.palette.mode === 'dark' ? '#fff' : '#181818'}
              />
            </Box>

            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{
                fontWeight: 'bold',
                letterSpacing: '1px',
                color: 'inherit',
                textDecoration: 'none',
                mr: 3,
                display: { xs: 'none', md: 'block' },
              }}
            >
              BookSphere
            </Typography>

            {/* Desktop Navigation Links */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, flexGrow: 1 }}>
              {navLinks.map((link) => (
                <Button
                  key={link.label}
                  component={Link}
                  to={link.path}
                  variant={location.pathname === link.path ? 'contained' : 'text'}
                  color="inherit"
                  startIcon={link.icon}
                  sx={{
                    color: location.pathname === link.path ? (theme.palette.mode === 'dark' ? '#fff' : '#000') : (theme.palette.mode === 'dark' ? '#aaa' : '#555'),
                    bgcolor: location.pathname === link.path ? (theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light') : 'transparent',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      color: theme.palette.mode === 'dark' ? '#fff' : '#000',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Toggle Theme">
                <IconButton onClick={toggleMode} color="inherit">
                  {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
              </Tooltip>

              {currentUser && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationDropdown 
                    notifications={notifications}
                    unreadCount={unreadCount}
                    onMarkAsRead={markAsRead}
                  />

                  <Tooltip title="Account settings">
                    <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                      <Avatar
                        src={avatarUrl}
                        sx={{
                          bgcolor: '#1565C0',
                          width: 40,
                          height: 40,
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          border: '2px solid rgba(255,255,255,0.2)',
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      >
                        {!avatarUrl && avatarInitial}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                </Box>
              )}

              {!currentUser && (
                <Box>
                  <Button 
                    color="inherit" 
                    onClick={() => navigate('/login')} 
                    sx={{ 
                      mr: 1,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Login
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    onClick={() => navigate('/signup')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Sign Up
                  </Button>
                </Box>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <nav>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: 240,
                background: 'linear-gradient(135deg, #ff6f61 0%, #a100ff 100%)',
                color: '#fff',
              },
            }}
          >
            {drawer}
          </Drawer>
        </nav>

        <Box sx={{ height: '64px' }} />
      </Box>

      <Dialog
        open={uploadDialogOpen}
        onClose={handleUploadClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Book</DialogTitle>
        <DialogContent>
          <Typography>Your upload form will go here</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadClose}>Cancel</Button>
          <Button variant="contained" onClick={handleUploadClose}>Upload</Button>
        </DialogActions>
      </Dialog>

      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        sx={{ '& .MuiPaper-root': { width: 220, borderRadius: 2, mt: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{username}</Typography>
          <Typography variant="body2" color="text.secondary">{currentUser?.email}</Typography>
        </Box>
        
        <MenuItem component={Link} to="/profile" onClick={handleClose}>
          <AccountCircle sx={{ mr: 1.5, color: 'text.secondary' }} /> Profile
        </MenuItem>
        <MenuItem component={Link} to="/shelf" onClick={handleClose}>
          <Book sx={{ mr: 1.5, color: 'text.secondary' }} /> My Shelf
        </MenuItem>
        <MenuItem component={Link} to="/" onClick={handleClose}>
          <DashboardIcon sx={{ mr: 1.5, color: 'text.secondary' }} /> Dashboard
        </MenuItem>
        
        <Box sx={{ my: 1 }} />
        
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <LogoutIcon sx={{ mr: 1.5 }} /> Logout
        </MenuItem>
      </Menu>
    </>
  );
}
