import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";
import { getSocketUrl } from './apiConfig';

/** Strips a trailing /api segment so Socket.IO connects to the server root, not the REST prefix. */
export function normalizeSocketUrl(url: string): string {
  return url.replace(/\/api\/?$/i, '');
}

const SOCKET_URL = getSocketUrl();

// Connection status types
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface ConnectionState {
  status: ConnectionStatus;
  error: string | null;
  lastConnected: Date | null;
  reconnectAttempts: number;
}

// Connection status store
class ConnectionStatusStore {
  private listeners = new Set<(state: ConnectionState) => void>();
  private state: ConnectionState = {
    status: 'disconnected',
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
  };

  getState(): ConnectionState {
    return { ...this.state };
  }

  setState(updates: Partial<ConnectionState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: (state: ConnectionState) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

const connectionStore = new ConnectionStatusStore();

// Enhanced socket with connection management
export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  timeout: 20000,
  auth: (cb: (data: { token: string | null }) => void) => {
    const { jwt } = useAuthStore.getState();
    cb({ token: jwt });
  },
});

// Socket event listeners for connection status
socket.on('connect', () => {
  connectionStore.setState({
    status: 'connected',
    error: null,
    lastConnected: new Date(),
    reconnectAttempts: 0,
  });
});

socket.on('disconnect', (reason) => {
  connectionStore.setState({
    status: 'disconnected',
    error: reason === 'io server disconnect' ? 'Server disconnected' : null,
  });
});

socket.on('connect_error', (error) => {
  connectionStore.setState({
    status: 'disconnected',
    error: error.message || 'Connection failed',
  });
});

socket.on('reconnect_attempt', (attemptNumber) => {
  connectionStore.setState({
    status: 'reconnecting',
    reconnectAttempts: attemptNumber,
  });
});

socket.on('reconnect', (attemptNumber) => {
  connectionStore.setState({
    status: 'connected',
    error: null,
    lastConnected: new Date(),
    reconnectAttempts: attemptNumber,
  });
});

socket.on('reconnect_failed', () => {
  connectionStore.setState({
    status: 'disconnected',
    error: 'Failed to reconnect after maximum attempts',
  });
});

// Subscription tracking to prevent duplicates
class SubscriptionManager {
  private subscriptions = new Map<string, Set<Function>>();

  addSubscription(event: string, callback: Function): () => void {
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, new Set());
    }
    
    const eventSubscriptions = this.subscriptions.get(event)!;
    
    // Prevent duplicate subscriptions
    if (eventSubscriptions.has(callback)) {
      return () => {}; // Return no-op if already subscribed
    }
    
    eventSubscriptions.add(callback);
    socket.on(event, callback as any);
    
    return () => {
      eventSubscriptions.delete(callback);
      socket.off(event, callback as any);
      
      // Clean up empty sets
      if (eventSubscriptions.size === 0) {
        this.subscriptions.delete(event);
      }
    };
  }

  hasSubscriptions(): boolean {
    return this.subscriptions.size > 0;
  }

  getSubscriptionCount(event?: string): number {
    if (event) {
      return this.subscriptions.get(event)?.size || 0;
    }
    return Array.from(this.subscriptions.values())
      .reduce((total, set) => total + set.size, 0);
  }

  clear() {
    for (const [event, callbacks] of this.subscriptions) {
      for (const callback of callbacks) {
        socket.off(event, callback as any);
      }
    }
    this.subscriptions.clear();
  }
}

const subscriptionManager = new SubscriptionManager();

export const socketService = {
  // Connection management
  connect() {
    if (socket.connected) return;
    
    connectionStore.setState({ status: 'connecting' });
    socket.connect();
  },

  disconnect() {
    subscriptionManager.clear();
    socket.disconnect();
  },

  forceReconnect() {
    socket.disconnect();
    setTimeout(() => this.connect(), 100);
  },

  // Connection status
  getConnectionState(): ConnectionState {
    return connectionStore.getState();
  },

  onConnectionChange(callback: (state: ConnectionState) => void) {
    return connectionStore.subscribe(callback);
  },

  isConnected(): boolean {
    return socket.connected;
  },

  // Enhanced event handlers with duplicate prevention
  onPriceUpdate(callback: (data: any) => void) {
    return subscriptionManager.addSubscription("price:update", callback);
  },

  onChatMessage(callback: (data: any) => void) {
    return subscriptionManager.addSubscription("chat:message", callback);
  },

  onRoundStarted(callback: (data: any) => void) {
    return subscriptionManager.addSubscription("round:started", callback);
  },

  onRoundResolved(callback: (data: any) => void) {
    return subscriptionManager.addSubscription("round:resolved", callback);
  },

  onNotification(callback: (data: any) => void) {
    return subscriptionManager.addSubscription("notification", callback);
  },

  onLiveGameStats(callback: (data: unknown) => void) {
    const unsubscribers = [
      subscriptionManager.addSubscription("game:stats", callback),
      subscriptionManager.addSubscription("game:stats:update", callback),
      subscriptionManager.addSubscription("stats:update", callback),
      subscriptionManager.addSubscription("round:stats", callback),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  },

  onPredictionCreated(callback: (data: unknown) => void) {
    const unsubscribers = [
      subscriptionManager.addSubscription("prediction:created", callback),
      subscriptionManager.addSubscription("prediction:submitted", callback),
    ];

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  },

  // Emits with connection check
  joinRound(roundId: string) {
    if (!socket.connected) {
      console.warn('Socket not connected, cannot join round');
      return;
    }
    socket.emit("join:round", roundId);
  },

  joinChat(channelId: string) {
    if (!socket.connected) {
      console.warn('Socket not connected, cannot join chat');
      return;
    }
    socket.emit("join:chat", channelId);
  },

  leaveChat(channelId: string) {
    if (!socket.connected) {
      console.warn('Socket not connected, cannot leave chat');
      return;
    }
    socket.emit("leave:chat", channelId);
  },

  sendChat(payload: any) {
    if (!socket.connected) {
      console.warn('Socket not connected, cannot send chat message');
      return;
    }
    socket.emit("chat:send", payload);
  },

  joinNotifications(userId: string) {
    if (!socket.connected) {
      console.warn('Socket not connected, cannot join notifications');
      return;
    }
    socket.emit("join:notifications", userId);
  },

  // Utility methods
  getSubscriptionCount(event?: string): number {
    return subscriptionManager.getSubscriptionCount(event);
  },

  hasActiveSubscriptions(): boolean {
    return subscriptionManager.hasSubscriptions();
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
    const leaveEvent = channel.startsWith("join:")
      ? channel.replace("join:", "leave:")
      : `leave:${channel}`;
    socket.emit(leaveEvent, payload);
  },
  on(_channel: string, event: string, callback: SocketEventCallback) {
    // Use the enhanced subscription manager for backward compatibility
    if (event === "notification") {
      return socketService.onNotification(callback);
    }
    return subscriptionManager.addSubscription(event, callback);
  },
};

// Export connection status store for components
export { connectionStore };
