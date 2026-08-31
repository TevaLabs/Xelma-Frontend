import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfflineBanner } from './OfflineBanner';

// Mock useConnectionStatus hook
vi.mock('../hooks/useConnectionStatus', () => ({
  useConnectionStatus: vi.fn(),
}));

import { useConnectionStatus } from '../hooks/useConnectionStatus';

describe('OfflineBanner', () => {
  const mockReconnect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when connected', () => {
    (useConnectionStatus as any).mockReturnValue({
      isDisconnected: false,
      reconnect: mockReconnect,
      status: 'connected',
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0,
    });

    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner when disconnected', () => {
    (useConnectionStatus as any).mockReturnValue({
      isDisconnected: true,
      reconnect: mockReconnect,
      status: 'disconnected',
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0,
    });

    render(<OfflineBanner />);

    expect(screen.getByText('Connection lost')).toBeInTheDocument();
    expect(screen.getByText('Live updates are paused. Reconnect to resume your session.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reconnect' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss connection alert' })).toBeInTheDocument();
  });

  it('calls reconnect when Reconnect button is clicked', () => {
    (useConnectionStatus as any).mockReturnValue({
      isDisconnected: true,
      reconnect: mockReconnect,
      status: 'disconnected',
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0,
    });

    render(<OfflineBanner />);

    const reconnectButton = screen.getByRole('button', { name: 'Reconnect' });
    fireEvent.click(reconnectButton);

    expect(mockReconnect).toHaveBeenCalledTimes(1);
  });

  it('dismisses banner when dismiss button is clicked', () => {
    (useConnectionStatus as any).mockReturnValue({
      isDisconnected: true,
      reconnect: mockReconnect,
      status: 'disconnected',
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0,
    });

    const { container } = render(<OfflineBanner />);

    // Banner should be visible initially
    expect(screen.getByText('Connection lost')).toBeInTheDocument();

    const dismissButton = screen.getByRole('button', { name: 'Dismiss connection alert' });
    fireEvent.click(dismissButton);

    // Banner should be hidden after dismiss
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('has proper accessibility attributes', () => {
    (useConnectionStatus as any).mockReturnValue({
      isDisconnected: true,
      reconnect: mockReconnect,
      status: 'disconnected',
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      error: null,
      lastConnected: null,
      reconnectAttempts: 0,
    });

    render(<OfflineBanner />);

    const alert = screen.getByRole('alert');
    expect(alert.getAttribute('aria-live')).toBe('assertive');
  });
});
