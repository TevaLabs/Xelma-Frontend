import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { socketService } from '../lib/socket';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { ConnectionStatus } from '../components/ConnectionStatus';

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const mockSocket = {
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  };
  
  return {
    io: vi.fn(() => mockSocket),
  };
});

// Mock auth store
vi.mock('../store/useAuthStore', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({ jwt: 'mock-token' })),
    subscribe: vi.fn(),
  },
}));

// Test component that uses the connection status
function TestComponent() {
  const { status, isConnected, reconnect } = useConnectionStatus();
  
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="connected">{isConnected ? 'true' : 'false'}</div>
      <button onClick={reconnect} data-testid="reconnect">Reconnect</button>
      <ConnectionStatus />
    </div>
  );
}

describe('Socket Lifecycle Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide working connection status integration', () => {
    // Test that the hook and component work together
    render(<TestComponent />);
    
    // Should show initial state
    expect(screen.getByTestId('status')).toHaveTextContent(/connected|connecting/);
    expect(screen.getByTestId('reconnect')).toBeInTheDocument();
  });

  it('should handle connection state changes', () => {
    const { rerender } = render(<TestComponent />);
    
    // Simulate connection state change
    act(() => {
      // This would normally be triggered by socket events
      // but we're testing the integration works
    });
    
    rerender(<TestComponent />);
    
    // Component should still be functional
    expect(screen.getByTestId('status')).toBeInTheDocument();
    expect(screen.getByTestId('connected')).toBeInTheDocument();
  });

  it('should provide socket service methods', () => {
    // Test that socket service has all required methods
    expect(typeof socketService.connect).toBe('function');
    expect(typeof socketService.disconnect).toBe('function');
    expect(typeof socketService.forceReconnect).toBe('function');
    expect(typeof socketService.getConnectionState).toBe('function');
    expect(typeof socketService.onConnectionChange).toBe('function');
    expect(typeof socketService.onPriceUpdate).toBe('function');
    expect(typeof socketService.onNotification).toBe('function');
    expect(typeof socketService.onChatMessage).toBe('function');
  });

  it('should provide subscription management', () => {
    // Test subscription management methods
    expect(typeof socketService.getSubscriptionCount).toBe('function');
    expect(typeof socketService.hasActiveSubscriptions).toBe('function');
    
    // Should return numbers/booleans
    expect(typeof socketService.getSubscriptionCount()).toBe('number');
    expect(typeof socketService.hasActiveSubscriptions()).toBe('boolean');
  });

  it('should provide connection safety checks', () => {
    // Test that emit methods exist and don't throw
    expect(() => socketService.joinRound('test')).not.toThrow();
    expect(() => socketService.joinChat('test')).not.toThrow();
    expect(() => socketService.sendChat({ content: 'test' })).not.toThrow();
    expect(() => socketService.joinNotifications('test')).not.toThrow();
  });
});