import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  auth: (cb) => {
    const { jwt } = useAuthStore.getState();
    cb({ token: jwt });
  },
});

export const socketService = {
  connect() {
    if (!socket.connected) {
      socket.connect();
    }
  },
  disconnect() {
    socket.disconnect();
  },

  // Handlers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPriceUpdate(callback: (data: any) => void) {
    socket.on('price:update', callback);
    return () => socket.off('price:update', callback);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChatMessage(callback: (data: any) => void) {
    socket.on('chat:message', callback);
    return () => socket.off('chat:message', callback);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRoundStarted(callback: (data: any) => void) {
    socket.on('round:started', callback);
    return () => socket.off('round:started', callback);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRoundResolved(callback: (data: any) => void) {
    socket.on('round:resolved', callback);
    return () => socket.off('round:resolved', callback);
  },

  // Emits
  joinRound(roundId: string) {
    socket.emit('join:round', roundId);
  },
  joinChat(channelId: string) {
    socket.emit('join:chat', channelId);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendChat(payload: any) {
    socket.emit('chat:send', payload);
  },
  joinNotifications(userId: string) {
    socket.emit('join:notifications', userId);
  },
};

type SocketEventCallback = (payload: unknown) => void;

// Backward-compatible API used by NotificationsBell/tests.
export const appSocket = {
  joinChannel(channel: string, payload?: unknown) {
    socketService.connect();
    socket.emit(channel, payload);
  },
  leaveChannel(channel: string, payload?: unknown) {
    const leaveEvent = channel.startsWith('join:')
      ? channel.replace('join:', 'leave:')
      : `leave:${channel}`;
    socket.emit(leaveEvent, payload);
  },
  on(_channel: string, event: string, callback: SocketEventCallback) {
    socket.on(event, callback);
    return () => socket.off(event, callback);
  },
};
