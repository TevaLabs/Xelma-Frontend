import { useEffect, useState } from 'react';
import { socketService, type ConnectionState } from '../lib/socket';

/**
 * Hook to monitor real-time connection status
 * Returns current connection state and provides manual reconnect function
 */
export function useConnectionStatus() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    socketService.getConnectionState()
  );

  useEffect(() => {
    const unsubscribe = socketService.onConnectionChange(setConnectionState);
    return unsubscribe;
  }, []);

  const reconnect = () => {
    socketService.forceReconnect();
  };

  const statusMessage = (() => {
    switch (connectionState.status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting…';
      case 'reconnecting':
        return 'Reconnecting…';
      case 'disconnected':
        return 'Disconnected. Messages cannot be sent until the connection is restored.';
      default:
        return 'Connection status unknown.';
    }
  })();

  return {
    ...connectionState,
    reconnect,
    isConnected: connectionState.status === 'connected',
    isConnecting: connectionState.status === 'connecting',
    isReconnecting: connectionState.status === 'reconnecting',
    isDisconnected: connectionState.status === 'disconnected',
    statusMessage,
    canSend: connectionState.status === 'connected',
  };
}