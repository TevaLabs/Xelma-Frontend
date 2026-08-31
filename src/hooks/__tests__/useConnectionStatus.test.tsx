import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock socket service
vi.mock('../../lib/socket', () => {
  const mockSocketService = {
    getConnectionState: vi.fn(),
    onConnectionChange: vi.fn(),
    forceReconnect: vi.fn(),
  };
  
  return {
    socketService: mockSocketService,
  };
});

import { useConnectionStatus } from '../useConnectionStatus';
import type { ConnectionState } from '../../lib/socket';
import { socketService } from '../../lib/socket';

describe('useConnectionStatus', () => {
  const mockConnectionState: ConnectionState = {
    status: 'disconnected',
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (socketService.getConnectionState as any).mockReturnValue(mockConnectionState);
    (socketService.onConnectionChange as any).mockReturnValue(() => {});
  });

  it('should return initial connection state', () => {
    const { result } = renderHook(() => useConnectionStatus());
    
    expect(result.current.status).toBe('disconnected');
    expect(result.current.error).toBeNull();
    expect(result.current.reconnectAttempts).toBe(0);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.isDisconnected).toBe(true);
  });

  it('should subscribe to connection changes on mount', () => {
    renderHook(() => useConnectionStatus());
    
    expect(socketService.onConnectionChange).toHaveBeenCalledOnce();
    expect(socketService.onConnectionChange).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('should unsubscribe on unmount', () => {
    const mockUnsubscribe = vi.fn();
    (socketService.onConnectionChange as any).mockReturnValue(mockUnsubscribe);
    
    const { unmount } = renderHook(() => useConnectionStatus());
    
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalledOnce();
  });

  it('should update state when connection changes', () => {
    let connectionChangeCallback: (state: ConnectionState) => void = () => {};
    
    (socketService.onConnectionChange as any).mockImplementation((callback) => {
      connectionChangeCallback = callback;
      return () => {};
    });
    
    const { result } = renderHook(() => useConnectionStatus());
    
    // Simulate connection state change
    act(() => {
      connectionChangeCallback({
        status: 'connected',
        error: null,
        lastConnected: new Date(),
        reconnectAttempts: 0,
      });
    });
    
    expect(result.current.status).toBe('connected');
    expect(result.current.isConnected).toBe(true);
    expect(result.current.isDisconnected).toBe(false);
  });

  it('should provide correct boolean flags for each status', () => {
    let connectionChangeCallback: (state: ConnectionState) => void = () => {};
    
    (socketService.onConnectionChange as any).mockImplementation((callback) => {
      connectionChangeCallback = callback;
      return () => {};
    });
    
    const { result } = renderHook(() => useConnectionStatus());
    
    // Test connecting state
    act(() => {
      connectionChangeCallback({
        status: 'connecting',
        error: null,
        lastConnected: null,
        reconnectAttempts: 0,
      });
    });
    
    expect(result.current.isConnecting).toBe(true);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isReconnecting).toBe(false);
    expect(result.current.isDisconnected).toBe(false);
    
    // Test reconnecting state
    act(() => {
      connectionChangeCallback({
        status: 'reconnecting',
        error: null,
        lastConnected: new Date(),
        reconnectAttempts: 2,
      });
    });
    
    expect(result.current.isReconnecting).toBe(true);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isDisconnected).toBe(false);
  });

  it('should provide reconnect function', () => {
    const { result } = renderHook(() => useConnectionStatus());
    
    act(() => {
      result.current.reconnect();
    });
    
    expect(socketService.forceReconnect).toHaveBeenCalledOnce();
  });

  it('should flag isUnhealthy for connecting and reconnecting states', () => {
    let connectionChangeCallback: (state: ConnectionState) => void = () => {};

    (socketService.onConnectionChange as any).mockImplementation((callback) => {
      connectionChangeCallback = callback;
      return () => {};
    });

    const { result } = renderHook(() => useConnectionStatus());

    // connected is healthy, not unhealthy
    act(() => {
      connectionChangeCallback({ status: 'connected', error: null, lastConnected: new Date(), reconnectAttempts: 0 });
    });
    expect(result.current.isUnhealthy).toBe(false);

    // connecting is flaky-but-not-offline
    act(() => {
      connectionChangeCallback({ status: 'connecting', error: null, lastConnected: null, reconnectAttempts: 0 });
    });
    expect(result.current.isUnhealthy).toBe(true);

    // reconnecting is flaky-but-not-offline
    act(() => {
      connectionChangeCallback({ status: 'reconnecting', error: null, lastConnected: new Date(), reconnectAttempts: 1 });
    });
    expect(result.current.isUnhealthy).toBe(true);

    // disconnected is fully offline, not the amber state
    act(() => {
      connectionChangeCallback({ status: 'disconnected', error: null, lastConnected: null, reconnectAttempts: 0 });
    });
    expect(result.current.isUnhealthy).toBe(false);
    expect(result.current.isDisconnected).toBe(true);
  });

  it('should handle error states', () => {
    let connectionChangeCallback: (state: ConnectionState) => void = () => {};
    
    (socketService.onConnectionChange as any).mockImplementation((callback) => {
      connectionChangeCallback = callback;
      return () => {};
    });
    
    const { result } = renderHook(() => useConnectionStatus());
    
    act(() => {
      connectionChangeCallback({
        status: 'disconnected',
        error: 'Connection failed',
        lastConnected: null,
        reconnectAttempts: 3,
      });
    });
    
    expect(result.current.error).toBe('Connection failed');
    expect(result.current.reconnectAttempts).toBe(3);
    expect(result.current.isDisconnected).toBe(true);
  });
});