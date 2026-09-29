import { useState, useEffect } from 'react';
import { useWebSocket } from '../services/websocketService';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

interface UseConnectionStatusResult {
  status: ConnectionStatus;
  reconnect: () => Promise<void>;
}

export const useConnectionStatus = (): UseConnectionStatusResult => {
  const { connect, disconnect, isConnected, reconnect: wsReconnect } = useWebSocket();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    if (isConnected) {
      setStatus('connected');
    } else {
      setStatus('disconnected');
    }
  }, [isConnected]);

  const reconnect = async () => {
    setStatus('reconnecting');
    try {
      await wsReconnect();
      setStatus('connected');
    } catch (error) {
      console.error('Reconnect attempt failed:', error);
      setStatus('disconnected');
    }
  };

  return { status, reconnect };
};