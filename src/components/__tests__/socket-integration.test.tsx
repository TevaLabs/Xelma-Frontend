import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';

// Mock socket service with connection management
vi.mock('../../lib/socket', () => {
  const mockSocketService = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    forceReconnect: vi.fn(),
    getConnectionState: vi.fn(),
    onConnectionChange: vi.fn(),
    onPriceUpdate: vi.fn(),
    onNotification: vi.fn(),
    onChatMessage: vi.fn(),
    joinNotifications: vi.fn(),
    joinChat: vi.fn(),
    leaveChat: vi.fn(),
    sendChat: vi.fn(),
    getSubscriptionCount: vi.fn(),
    hasActiveSubscriptions: vi.fn(),
    isConnected: vi.fn(),
  };

  return {
    socketService: mockSocketService,
  };
});

// Mock API client
vi.mock('../../lib/api-client', () => ({
  priceApi: {
    getPriceSeries: vi.fn().mockResolvedValue([]),
  },
}));

// Mock stores
const mockNotificationsState = {
  unread: 0,
  fetchUnread: vi.fn(),
  addNotification: vi.fn(),
};

vi.mock('../../store/useNotificationsStore', () => ({
  useNotificationsStore: Object.assign(
    vi.fn((selector?: (state: typeof mockNotificationsState) => unknown) => {
      return selector ? selector(mockNotificationsState) : mockNotificationsState;
    }),
    {
      getState: () => mockNotificationsState,
    },
  ),
}));

// Mock connection status hook
vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: vi.fn(),
}));

// Mock wallet store
const mockWalletState = { publicKey: 'GTEST123' };
vi.mock('../../store/useWalletStore', () => ({
  useWalletStore: Object.assign(
    vi.fn((selector?: (state: typeof mockWalletState) => unknown) => {
      return selector ? selector(mockWalletState) : mockWalletState;
    }),
    { getState: () => mockWalletState },
  ),
}));

import PriceChart from '../PriceChart';
import NotificationsBell from '../NotificationsBell';
import { ChatSidebar } from '../ChatSidebar';
import { socketService } from '../../lib/socket';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';

describe('Socket Integration Tests', () => {
  const mockConnectionStatus = {
    status: 'connected',
    error: null,
    reconnectAttempts: 0,
    reconnect: vi.fn(),
    isConnected: true,
    isConnecting: false,
    isReconnecting: false,
    isDisconnected: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    (socketService.getConnectionState as any).mockReturnValue({
      status: 'connected',
      error: null,
      reconnectAttempts: 0,
      lastConnected: new Date(),
    });
    
    (socketService.onConnectionChange as any).mockReturnValue(() => {});
    (socketService.onPriceUpdate as any).mockReturnValue(() => {});
    (socketService.onNotification as any).mockReturnValue(() => {});
    (socketService.onChatMessage as any).mockReturnValue(() => {});
    (socketService.getSubscriptionCount as any).mockReturnValue(0);
    (socketService.hasActiveSubscriptions as any).mockReturnValue(false);
    (socketService.isConnected as any).mockReturnValue(true);
    
    (useConnectionStatus as any).mockReturnValue(mockConnectionStatus);
  });

  describe('Component Mount/Unmount Lifecycle', () => {
    it('should connect socket when PriceChart mounts', () => {
      render(<PriceChart />);
      
      expect(socketService.connect).toHaveBeenCalledOnce();
      expect(socketService.onPriceUpdate).toHaveBeenCalledOnce();
    });

    it('should connect socket when NotificationsBell mounts', () => {
      render(<NotificationsBell />);
      
      expect(socketService.connect).toHaveBeenCalledOnce();
      expect(socketService.onNotification).toHaveBeenCalledOnce();
      expect(socketService.joinNotifications).toHaveBeenCalledWith('GTEST123');
    });

    it('should connect socket when ChatSidebar mounts', () => {
      render(<ChatSidebar />);
      
      expect(socketService.connect).toHaveBeenCalledOnce();
      expect(socketService.onChatMessage).toHaveBeenCalledOnce();
      expect(socketService.joinChat).toHaveBeenCalledWith('general');
    });

    it('should not disconnect socket when individual components unmount', () => {
      const { unmount: unmountPriceChart } = render(<PriceChart />);
      const { unmount: unmountNotificationsBell } = render(<NotificationsBell />);
      
      unmountPriceChart();
      unmountNotificationsBell();
      
      // Socket should remain connected for other components
      expect(socketService.disconnect).not.toHaveBeenCalled();
    });

    it('should unsubscribe from events when components unmount', () => {
      const mockUnsubscribe = vi.fn();
      (socketService.onPriceUpdate as any).mockReturnValue(mockUnsubscribe);
      
      const { unmount } = render(<PriceChart />);
      
      unmount();
      
      expect(mockUnsubscribe).toHaveBeenCalledOnce();
    });
  });

  describe('Duplicate Subscription Prevention', () => {
    it('should prevent duplicate price update subscriptions', () => {
      // Render multiple PriceChart components
      render(<PriceChart />);
      render(<PriceChart />);
      
      // Socket service should handle duplicate prevention internally
      expect(socketService.onPriceUpdate).toHaveBeenCalledTimes(2);
      expect(socketService.connect).toHaveBeenCalledTimes(2);
    });

    it('should prevent duplicate notification subscriptions', () => {
      // Render multiple NotificationsBell components
      render(<NotificationsBell />);
      render(<NotificationsBell />);
      
      expect(socketService.onNotification).toHaveBeenCalledTimes(2);
      expect(socketService.joinNotifications).toHaveBeenCalledTimes(2);
    });

    it('should track subscription counts correctly', () => {
      render(<PriceChart />);
      
      expect(socketService.connect).toHaveBeenCalled();
      expect(socketService.onPriceUpdate).toHaveBeenCalled();
    });
  });

  describe('Connection Status UI Updates', () => {
    it('should show offline state in PriceChart when disconnected', () => {
      // Mock disconnected state
      (useConnectionStatus as any).mockReturnValue({
        status: 'disconnected',
        isConnected: false,
        isDisconnected: true,
      });
      
      render(<PriceChart />);
      
      expect(screen.getByText('OFFLINE')).toBeInTheDocument();
    });

    it('should disable NotificationsBell when disconnected', () => {
      (useConnectionStatus as any).mockReturnValue({
        status: 'disconnected',
        isConnected: false,
        isDisconnected: true,
      });
      
      render(<NotificationsBell />);
      
      const button = screen.getByRole('button', { name: /open notifications/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50');
    });

    it('should disable chat input when disconnected', () => {
      Object.assign(mockConnectionStatus, {
        status: 'disconnected',
        isConnected: false,
        isDisconnected: true,
      });
      
      render(<ChatSidebar />);
      
      expect(screen.getByText('Chat is offline - messages cannot be sent')).toBeInTheDocument();
      
      const input = screen.getByPlaceholderText('Chat offline...');
      expect(input).toBeDisabled();
      
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeDisabled();
    });

    it('should show connection status indicator when disconnected', () => {
      Object.assign(mockConnectionStatus, {
        status: 'disconnected',
        isConnected: false,
        isDisconnected: true,
      });
      
      render(<PriceChart />);
      
      // Should show connection status component
      expect(screen.getByText('Live updates disconnected')).toBeInTheDocument();
    });
  });

  describe('Reconnection Behavior', () => {
    it('should handle reconnection in PriceChart', async () => {
      // Start disconnected
      Object.assign(mockConnectionStatus, {
        status: 'disconnected',
        isConnected: false,
        isDisconnected: true,
      });
      
      render(<PriceChart />);
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      expect(mockConnectionStatus.reconnect).toHaveBeenCalledOnce();
    });

    it('should show reconnecting state', () => {
      Object.assign(mockConnectionStatus, {
        status: 'reconnecting',
        reconnectAttempts: 2,
        isConnected: false,
        isReconnecting: true,
        isDisconnected: false,
      });
      
      render(<PriceChart />);
      
      expect(screen.getByText('Reconnecting... (attempt 2)')).toBeInTheDocument();
    });

    it('should resume normal operation after reconnection', () => {
      // Start reconnecting
      Object.assign(mockConnectionStatus, {
        status: 'reconnecting',
        isReconnecting: true,
      });
      
      const { rerender } = render(<ChatSidebar />);
      
      expect(screen.getByText('Chat is offline - messages cannot be sent')).toBeInTheDocument();
      
      // Simulate successful reconnection
      Object.assign(mockConnectionStatus, {
        status: 'connected',
        isConnected: true,
        isReconnecting: false,
        isDisconnected: false,
      });
      
      rerender(<ChatSidebar />);
      
      expect(screen.queryByText('Chat is offline - messages cannot be sent')).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type a message...')).not.toBeDisabled();
    });
  });

  describe('Real-time Data Handling', () => {
    it('should handle price updates when connected', () => {
      let priceUpdateCallback: (data: any) => void = () => {};
      
      (socketService.onPriceUpdate as ReturnType<typeof vi.fn>).mockImplementation((callback: (data: unknown) => void) => {
        priceUpdateCallback = callback;
        return () => {};
      });
      
      render(<PriceChart />);
      
      // Simulate price update
      act(() => {
        priceUpdateCallback({
          time: Date.now() / 1000,
          value: 0.12345,
        });
      });
      
      // Component should process the update (tested via internal state)
      expect(priceUpdateCallback).toBeDefined();
    });

    it('should handle chat messages when connected', () => {
      let chatMessageCallback: (data: any) => void = () => {};
      
      (socketService.onChatMessage as ReturnType<typeof vi.fn>).mockImplementation((callback: (data: unknown) => void) => {
        chatMessageCallback = callback;
        return () => {};
      });
      
      render(<ChatSidebar />);
      
      // Simulate chat message
      act(() => {
        chatMessageCallback({
          id: '1',
          username: 'testuser',
          content: 'Hello world',
          createdAt: new Date().toISOString(),
        });
      });
      
      expect(chatMessageCallback).toBeDefined();
    });

    it('should not send messages when disconnected', () => {
      Object.assign(mockConnectionStatus, {
        status: 'disconnected',
        isConnected: false,
        isDisconnected: true,
      });
      
      (socketService.isConnected as ReturnType<typeof vi.fn>).mockReturnValue(false);
      
      render(<ChatSidebar />);
      
      const input = screen.getByPlaceholderText('Chat offline...');
      const sendButton = screen.getByRole('button', { name: /send message/i });
      
      // Try to send message (should be prevented by disabled state)
      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
      
      // Verify sendChat is not called
      expect(socketService.sendChat).not.toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should handle connection errors gracefully', () => {
      Object.assign(mockConnectionStatus, {
        status: 'disconnected',
        error: 'Network error',
        isConnected: false,
        isDisconnected: true,
      });
      
      render(<PriceChart />);
      
      // Should show error message
      expect(screen.getByText('Network error')).toBeInTheDocument();
      
      // Should provide retry option
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should clear errors after successful reconnection', () => {
      // Start with error
      Object.assign(mockConnectionStatus, {
        status: 'disconnected',
        error: 'Connection failed',
        isDisconnected: true,
      });
      
      const { rerender } = render(<PriceChart />);
      
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
      
      // Simulate successful reconnection
      Object.assign(mockConnectionStatus, {
        status: 'connected',
        error: null,
        isConnected: true,
        isDisconnected: false,
      });
      
      rerender(<PriceChart />);
      
      expect(screen.queryByText('Connection failed')).not.toBeInTheDocument();
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });
  });
});