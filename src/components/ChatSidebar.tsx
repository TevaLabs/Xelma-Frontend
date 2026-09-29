import React, { useState, useEffect } from 'react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { reconnect } from '../services/connectionService';
import { Button, Typography, Box, Divider } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

const ChatSidebar = () => {
  const { status, reconnect: triggerReconnect } = useConnectionStatus();
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    if (status !== 'connected') {
      return;
    }
    setIsSending(true);
    // Simulate send action
    setTimeout(() => setIsSending(false), 1000);
  };

  const handleReconnect = async () => {
    try {
      await triggerReconnect();
    } catch (error) {
      console.error('Reconnect failed:', error);
    }
  };

  return (
    <Box sx={{ width: 300, height: '100vh', borderRight: '1px solid #e0e0e0', p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Chat
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color={status === 'connected' ? 'success.main' : 'error.main'}>
          {status === 'connected' ? (
            'Connected'
          ) : status === 'disconnected' ? (
            'Disconnected - cannot send messages'
          ) : (
            'Reconnecting...'
          )}
        </Typography>

        {status !== 'connected' && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleReconnect}
            sx={{ mt: 1 }}
            disabled={status === 'reconnecting'}
          >
            {status === 'reconnecting' ? 'Reconnecting...' : 'Reconnect'}
          </Button>
        )}
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ position: 'relative', height: 'calc(100% - 150px)', overflow: 'hidden' }}>
        {/* Chat messages would go here */}
      </Box>

      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 1, display: 'flex' }}>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleSend}
          disabled={status !== 'connected' || isSending}
          sx={{ ml: 'auto' }}
        >
          Send
        </Button>
      </Box>

      {/* Accessible live region for status updates */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0
        }}
      >
        {status === 'connected' ? 'Connected' :
         status === 'disconnected' ? 'Disconnected - cannot send messages' :
         'Reconnecting...'}
      </div>
    </Box>
  );
};

export default ChatSidebar;