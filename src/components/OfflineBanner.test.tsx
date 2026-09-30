import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OfflineBanner } from './OfflineBanner';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

vi.mock('../hooks/useConnectionStatus');

const mockUseConnectionStatus = vi.mocked(useConnectionStatus);

function mockConnectionStatus(overrides: Partial<ReturnType<typeof useConnectionStatus>> = {}) {
  mockUseConnectionStatus.mockReturnValue({
    status: 'disconnected',
    error: null,
    lastConnected: null,
    reconnectAttempts: 0,
    reconnect: vi.fn(),
    isConnected: false,
    isConnecting: false,
    isReconnecting: false,
    isDisconnected: true,
    ...overrides,
  });
}

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when connected', () => {
    mockConnectionStatus({ isDisconnected: false, isConnected: true });

    const { container } = render(<OfflineBanner />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders the banner when disconnected', () => {
    mockConnectionStatus({ isDisconnected: true });

    render(<OfflineBanner />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Connection lost')).toBeInTheDocument();
  });

  it('invokes reconnect when the Reconnect button is clicked', () => {
    const reconnect = vi.fn();
    mockConnectionStatus({ isDisconnected: true, reconnect });

    render(<OfflineBanner />);
    fireEvent.click(screen.getByRole('button', { name: /reconnect/i }));

    expect(reconnect).toHaveBeenCalledTimes(1);
  });

  it('hides the banner when the dismiss button is clicked', () => {
    mockConnectionStatus({ isDisconnected: true });

    render(<OfflineBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /dismiss connection alert/i }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('exposes an assertive live region for screen readers while disconnected', () => {
    mockConnectionStatus({ isDisconnected: true });

    render(<OfflineBanner />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('does not call reconnect on mount or dismiss', () => {
    const reconnect = vi.fn();
    mockConnectionStatus({ isDisconnected: true, reconnect });

    render(<OfflineBanner />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss connection alert/i }));

    expect(reconnect).not.toHaveBeenCalled();
  });
});
