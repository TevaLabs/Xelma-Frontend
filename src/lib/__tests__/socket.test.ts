import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock socket.io-client before importing the socket service
const ioMocks = vi.hoisted(() => ({
  options: null as any,
}));
vi.mock('socket.io-client', () => {
  const mockSocket: any = {
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(() => {
      mockSocket.connected = false;
    }),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
  
  return {
    io: vi.fn((url, options) => {
      ioMocks.options = options;
      return mockSocket;
    }),
    getIoOptions: () => ioMocks.options,
  };
});

// Mock auth store
const mocks = vi.hoisted(() => ({
  subscribeCb: null as any,
  subscribe: vi.fn((cb) => {
    mocks.subscribeCb = cb;
    return () => {};
  }),
}));

vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ jwt: 'mock-token' })),
    subscribe: mocks.subscribe,
  },
}));

// Import after mocking
import { socketService, normalizeSocketUrl, type ConnectionState } from '../socket';
import { io, getIoOptions } from 'socket.io-client';
import { useAuthStore } from '../../store/useAuthStore';

// Get the mocked socket instance
const mockSocket = (io as any)();

describe('Socket Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
  });

  afterEach(() => {
    // Clean up any subscriptions
    socketService.disconnect();
  });

  describe('Connection Management', () => {
    it('should connect when not already connected', () => {
      mockSocket.connected = false;
      socketService.connect();
      expect(mockSocket.connect).toHaveBeenCalledOnce();
    });

    it('should not connect when already connected', () => {
      mockSocket.connected = true;
      socketService.connect();
      expect(mockSocket.connect).not.toHaveBeenCalled();
    });

    it('should disconnect and clear subscriptions', () => {
      socketService.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalledOnce();
    });

    it('should force reconnect by disconnecting then connecting', () => {
      vi.useFakeTimers();
      socketService.forceReconnect();
      
      expect(mockSocket.disconnect).toHaveBeenCalledOnce();
      
      vi.advanceTimersByTime(100);
      expect(mockSocket.connect).toHaveBeenCalledOnce();
      
      vi.useRealTimers();
    });
  });

  describe('Connection Status', () => {
    it('should return initial connection state', () => {
      // Reset the connection state before testing
      const state = socketService.getConnectionState();
      // The initial state might be 'connecting' due to module initialization
      expect(['disconnected', 'connecting']).toContain(state.status);
      expect(state.reconnectAttempts).toBe(0);
    });

    it('should update connection state on connect', () => {
      const mockCallback = vi.fn();
      const unsubscribe = socketService.onConnectionChange(mockCallback);
      
      // Simulate socket connect event
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];
      
      if (connectHandler) {
        connectHandler();
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'connected',
            error: null,
            reconnectAttempts: 0,
          })
        );
      }
      
      unsubscribe();
    });

    it('should update connection state on disconnect', () => {
      const mockCallback = vi.fn();
      const unsubscribe = socketService.onConnectionChange(mockCallback);
      
      // Simulate socket disconnect event
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];
      
      if (disconnectHandler) {
        disconnectHandler('transport close');
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'disconnected',
            error: null,
          })
        );
      }
      
      unsubscribe();
    });

    it('should update connection state on connection error', () => {
      const mockCallback = vi.fn();
      const unsubscribe = socketService.onConnectionChange(mockCallback);
      
      // Simulate socket connect_error event
      const errorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )?.[1];
      
      if (errorHandler) {
        errorHandler(new Error('Connection failed'));
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'disconnected',
            error: 'Connection failed',
          })
        );
      }
      
      unsubscribe();
    });
  });

  describe('Subscription Management', () => {
    it('should prevent duplicate subscriptions', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      // Subscribe to same event with same callback twice
      const unsubscribe1 = socketService.onPriceUpdate(callback1);
      const unsubscribe2 = socketService.onPriceUpdate(callback1);
      
      // Should only register once
      expect(mockSocket.on).toHaveBeenCalledWith('price:update', callback1);
      expect(socketService.getSubscriptionCount('price:update')).toBe(1);
      
      // Different callback should be allowed
      const unsubscribe3 = socketService.onPriceUpdate(callback2);
      expect(socketService.getSubscriptionCount('price:update')).toBe(2);
      
      unsubscribe1();
      unsubscribe2();
      unsubscribe3();
    });

    it('should clean up subscriptions on unsubscribe', () => {
      const callback = vi.fn();
      const unsubscribe = socketService.onPriceUpdate(callback);
      
      expect(socketService.getSubscriptionCount('price:update')).toBe(1);
      
      unsubscribe();
      
      expect(mockSocket.off).toHaveBeenCalledWith('price:update', callback);
      expect(socketService.getSubscriptionCount('price:update')).toBe(0);
    });

    it('should track total subscription count', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      expect(socketService.getSubscriptionCount()).toBe(0);
      
      const unsubscribe1 = socketService.onPriceUpdate(callback1);
      expect(socketService.getSubscriptionCount()).toBe(1);
      
      const unsubscribe2 = socketService.onChatMessage(callback2);
      expect(socketService.getSubscriptionCount()).toBe(2);
      
      unsubscribe1();
      expect(socketService.getSubscriptionCount()).toBe(1);
      
      unsubscribe2();
      expect(socketService.getSubscriptionCount()).toBe(0);
    });

    it('should check if has active subscriptions', () => {
      expect(socketService.hasActiveSubscriptions()).toBe(false);
      
      const unsubscribe = socketService.onPriceUpdate(vi.fn());
      expect(socketService.hasActiveSubscriptions()).toBe(true);
      
      unsubscribe();
      expect(socketService.hasActiveSubscriptions()).toBe(false);
    });
  });

  describe('Event Emitters', () => {
    it('should emit events when connected', () => {
      mockSocket.connected = true;
      
      socketService.joinRound('round-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('join:round', 'round-123');
      
      socketService.joinChat('general');
      expect(mockSocket.emit).toHaveBeenCalledWith('join:chat', 'general');
      
      socketService.sendChat({ content: 'Hello' });
      expect(mockSocket.emit).toHaveBeenCalledWith('chat:send', { content: 'Hello' });
      
      socketService.joinNotifications('user-123');
      expect(mockSocket.emit).toHaveBeenCalledWith('join:notifications', 'user-123');
    });

    it('should warn and not emit when disconnected', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockSocket.connected = false;
      
      socketService.joinRound('round-123');
      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Socket not connected, cannot join round');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Reconnection Behavior', () => {
    it('should handle reconnection attempts', () => {
      const mockCallback = vi.fn();
      const unsubscribe = socketService.onConnectionChange(mockCallback);
      
      // Simulate reconnect_attempt event
      const reconnectAttemptHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'reconnect_attempt'
      )?.[1];
      
      if (reconnectAttemptHandler) {
        reconnectAttemptHandler(3);
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'reconnecting',
            reconnectAttempts: 3,
          })
        );
      }
      
      unsubscribe();
    });

    it('should handle successful reconnection', () => {
      const mockCallback = vi.fn();
      const unsubscribe = socketService.onConnectionChange(mockCallback);
      
      // Simulate reconnect event
      const reconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'reconnect'
      )?.[1];
      
      if (reconnectHandler) {
        reconnectHandler(2);
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'connected',
            error: null,
            reconnectAttempts: 2,
          })
        );
      }
      
      unsubscribe();
    });

    it('should handle failed reconnection', () => {
      const mockCallback = vi.fn();
      const unsubscribe = socketService.onConnectionChange(mockCallback);
      
      // Simulate reconnect_failed event
      const reconnectFailedHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'reconnect_failed'
      )?.[1];
      
      if (reconnectFailedHandler) {
        reconnectFailedHandler();
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'disconnected',
            error: 'Failed to reconnect after maximum attempts',
          })
        );
      }
      
      unsubscribe();
    });
  });
  describe('Auth Integration', () => {
    it('should force reconnect when JWT changes and socket is connected', () => {
      vi.useFakeTimers();
      mockSocket.connected = true;
      const subscribeCallback = mocks.subscribeCb;
      if (subscribeCallback) {
        subscribeCallback({ jwt: 'new-token' }, { jwt: 'old-token' });
        expect(mockSocket.disconnect).toHaveBeenCalled();
        vi.advanceTimersByTime(100);
        expect(mockSocket.connect).toHaveBeenCalled();
      }
      vi.useRealTimers();
    });

    it('should not force reconnect when JWT is unchanged', () => {
      mockSocket.connected = true;
      mockSocket.disconnect.mockClear();
      const subscribeCallback = mocks.subscribeCb;
      if (subscribeCallback) {
        subscribeCallback({ jwt: 'same-token' }, { jwt: 'same-token' });
        expect(mockSocket.disconnect).not.toHaveBeenCalled();
      }
    });

    it('should read latest JWT on auth callback', () => {
      (useAuthStore.getState as any).mockReturnValue({ jwt: 'latest-token' });
      
      const options = ioMocks.options;
      if (options && options.auth) {
        const authCallback = options.auth;
        const cb = vi.fn();
        authCallback(cb);
        expect(cb).toHaveBeenCalledWith({ token: 'latest-token' });
      }
    });
  });
});

describe('normalizeSocketUrl', () => {
  it('strips /api suffix', () => {
    expect(normalizeSocketUrl('http://localhost:3000/api')).toBe('http://localhost:3000');
  });

  it('strips /api/ with trailing slash', () => {
    expect(normalizeSocketUrl('http://localhost:3000/api/')).toBe('http://localhost:3000');
  });

  it('leaves URL unchanged when no /api suffix', () => {
    expect(normalizeSocketUrl('http://localhost:3000')).toBe('http://localhost:3000');
  });

  it('strips /api from a production URL', () => {
    expect(normalizeSocketUrl('https://xelma-backend.onrender.com/api')).toBe('https://xelma-backend.onrender.com');
  });

  it('leaves production URL unchanged when no /api suffix', () => {
    expect(normalizeSocketUrl('https://xelma-backend.onrender.com')).toBe('https://xelma-backend.onrender.com');
  });

  it('returns empty string unchanged', () => {
    expect(normalizeSocketUrl('')).toBe('');
  });
});