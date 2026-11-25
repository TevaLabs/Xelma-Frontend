import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

vi.mock('../hooks/useConnectionStatus', () => ({
  useConnectionStatus: vi.fn(),
}));

import { OfflineBanner } from './OfflineBanner';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

function mockConnectionStatus(isDisconnected: boolean, reconnect = vi.fn()) {
  vi.mocked(useConnectionStatus).mockReturnValue({
    status: isDisconnected ? 'disconnected' : 'connected',
    error: null,
    reconnectAttempts: 0,
    lastConnected: null,
    reconnect,
    isConnected: !isDisconnected,
    isConnecting: false,
    isReconnecting: false,
    isDisconnected,
  });
  return reconnect;
}

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when connected', () => {
    mockConnectionStatus(false);

    const { container } = render(<OfflineBanner />);

    expect(container.firstChild).toBeNull();
  });

  it('shows the alert and allows it to be dismissed when disconnected', () => {
    mockConnectionStatus(true);
    render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Connection lost')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss connection alert' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls reconnect when the reconnect button is clicked', () => {
    const reconnect = mockConnectionStatus(true);
    render(<OfflineBanner />);

    fireEvent.click(screen.getByRole('button', { name: 'Reconnect' }));

    expect(reconnect).toHaveBeenCalledOnce();
  });

  it('shows the alert again after the connection recovers and is lost again', () => {
    mockConnectionStatus(true);
    const { rerender } = render(<OfflineBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss connection alert' }));

    mockConnectionStatus(false);
    rerender(<OfflineBanner />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    mockConnectionStatus(true);
    rerender(<OfflineBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
