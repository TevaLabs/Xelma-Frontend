import { io, Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export const getSocket = (url: string): Socket => {
  if (!socketInstance) {
    socketInstance = io(url, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      autoConnect: false
    });
  }
  return socketInstance;
};

export const connectSocket = (url: string): void => {
  const socket = getSocket(url);
  socket.connect();
};

export const disconnectSocket = (): void => {
  if (socketInstance) {
    socketInstance.disconnect();
  }
};