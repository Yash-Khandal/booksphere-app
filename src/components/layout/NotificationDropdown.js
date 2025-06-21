// src/components/layout/NotificationDropdown.js
import React, { useState } from 'react';
import {
  IconButton, Badge, Menu, MenuItem, Typography, Box, Avatar, Divider
} from '@mui/material';
import { Notifications, Circle } from '@mui/icons-material';

export default function NotificationDropdown({ notifications, unreadCount, onMarkAsRead }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await onMarkAsRead(notification.id);
    }
    handleClose();
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <Notifications />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{ sx: { width: 320, maxHeight: 400 } }}
      >
        <Typography variant="h6" sx={{ p: 2 }}>
          Notifications
        </Typography>
        <Divider />
        
        {notifications.length === 0 ? (
          <MenuItem>
            <Typography color="text.secondary">No notifications</Typography>
          </MenuItem>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                backgroundColor: notification.read ? 'transparent' : 'action.hover',
                flexDirection: 'column',
                alignItems: 'flex-start',
                whiteSpace: 'normal',
                py: 1.5
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Avatar sx={{ width: 32, height: 32, mr: 1.5, bgcolor: 'primary.main' }}>
                  ❤️
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {notification.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
                {!notification.read && (
                  <Circle sx={{ color: 'primary.main', fontSize: 8 }} />
                )}
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
