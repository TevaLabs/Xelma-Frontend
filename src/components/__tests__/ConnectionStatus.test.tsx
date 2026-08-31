import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the useConnectionStatus hook
vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: vi.fn(),
}));

import { ConnectionStatus, ConnectionIndicator, NetworkHealthIndicator } from '../ConnectionStatus';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';

describe('ConnectionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when connected and showWhenConnected is false', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'connected',
      error: null,
      reconnectAttempts: 0,
      reconnect: vi.fn(),
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: false,
    });

    const { container } = render(<ConnectionStatus />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when connected and showWhenConnected is true', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'connected',
      error: null,
      reconnectAttempts: 0,
      reconnect: vi.fn(),
      isConnected: true,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: false,
    });

    render(<ConnectionStatus showWhenConnected={true} />);
    expect(screen.getByText('Live updates active')).toBeInTheDocument();
  });

  it('should render connecting state', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'connecting',
      error: null,
      reconnectAttempts: 0,
      reconnect: vi.fn(),
      isConnected: false,
      isConnecting: true,
      isReconnecting: false,
      isDisconnected: false,
    });

    render(<ConnectionStatus />);
    expect(screen.getByText('Connecting to live updates...')).toBeInTheDocument();
  });

  it('should render reconnecting state with attempt count', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'reconnecting',
      error: null,
      reconnectAttempts: 3,
      reconnect: vi.fn(),
      isConnected: false,
      isConnecting: false,
      isReconnecting: true,
      isDisconnected: false,
    });

    render(<ConnectionStatus />);
    expect(screen.getByText('Reconnecting... (attempt 3)')).toBeInTheDocument();
  });

  it('should render disconnected state with error', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'disconnected',
      error: 'Connection failed',
      reconnectAttempts: 0,
      reconnect: vi.fn(),
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: true,
    });

    render(<ConnectionStatus />);
    expect(screen.getByText('Connection failed')).toBeInTheDocument();
  });

  it('should render disconnected state without error', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'disconnected',
      error: null,
      reconnectAttempts: 0,
      reconnect: vi.fn(),
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: true,
    });

    render(<ConnectionStatus />);
    expect(screen.getByText('Live updates disconnected')).toBeInTheDocument();
  });

  it('should show retry button when disconnected', () => {
    const mockReconnect = vi.fn();
    (useConnectionStatus as any).mockReturnValue({
      status: 'disconnected',
      error: null,
      reconnectAttempts: 0,
      reconnect: mockReconnect,
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: true,
    });

    render(<ConnectionStatus />);
    
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockReconnect).toHaveBeenCalledOnce();
  });

  it('should not show retry button when not disconnected', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'connecting',
      error: null,
      reconnectAttempts: 0,
      reconnect: vi.fn(),
      isConnected: false,
      isConnecting: true,
      isReconnecting: false,
      isDisconnected: false,
    });

    render(<ConnectionStatus />);
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'disconnected',
      error: null,
      reconnectAttempts: 0,
      reconnect: vi.fn(),
      isConnected: false,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: true,
    });

    const { container } = render(<ConnectionStatus className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('ConnectionIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render connected indicator', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'connected',
      reconnect: vi.fn(),
      isDisconnected: false,
    });

    const { container } = render(<ConnectionIndicator />);
    const indicator = container.querySelector('.bg-green-500');
    expect(indicator).toBeInTheDocument();
  });

  it('should render connecting indicator with pulse animation', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'connecting',
      reconnect: vi.fn(),
      isDisconnected: false,
    });

    const { container } = render(<ConnectionIndicator />);
    const indicator = container.querySelector('.bg-blue-500.animate-pulse');
    expect(indicator).toBeInTheDocument();
  });

  it('should render reconnecting indicator with pulse animation', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'reconnecting',
      reconnect: vi.fn(),
      isDisconnected: false,
    });

    const { container } = render(<ConnectionIndicator />);
    const indicator = container.querySelector('.bg-yellow-500.animate-pulse');
    expect(indicator).toBeInTheDocument();
  });

  it('should render disconnected indicator', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'disconnected',
      reconnect: vi.fn(),
      isDisconnected: true,
    });

    const { container } = render(<ConnectionIndicator />);
    const indicator = container.querySelector('.bg-red-500');
    expect(indicator).toBeInTheDocument();
  });

  it('should show reconnect button when disconnected', () => {
    const mockReconnect = vi.fn();
    (useConnectionStatus as any).mockReturnValue({
      status: 'disconnected',
      reconnect: mockReconnect,
      isDisconnected: true,
    });

    render(<ConnectionIndicator />);
    
    const reconnectButton = screen.getByText('Reconnect');
    expect(reconnectButton).toBeInTheDocument();
    
    fireEvent.click(reconnectButton);
    expect(mockReconnect).toHaveBeenCalledOnce();
  });

  it('should not show reconnect button when not disconnected', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'connected',
      reconnect: vi.fn(),
      isDisconnected: false,
    });

    render(<ConnectionIndicator />);
    expect(screen.queryByText('Reconnect')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'connected',
      reconnect: vi.fn(),
      isDisconnected: false,
    });

    const { container } = render(<ConnectionIndicator className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

const baseMock = {
  status: 'connected',
  error: null,
  lastConnected: null,
  reconnectAttempts: 0,
  reconnect: vi.fn(),
  isConnected: false,
  isConnecting: false,
  isReconnecting: false,
  isDisconnected: false,
  isUnhealthy: false,
};

describe('NetworkHealthIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when the socket is healthy', () => {
    (useConnectionStatus as any).mockReturnValue({ ...baseMock, status: 'connected', isUnhealthy: false });

    const { container } = render(<NetworkHealthIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when fully disconnected (OfflineBanner handles that)', () => {
    (useConnectionStatus as any).mockReturnValue({
      ...baseMock,
      status: 'disconnected',
      isDisconnected: true,
      isUnhealthy: false,
    });

    const { container } = render(<NetworkHealthIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('renders an amber dot with a tooltip while reconnecting', () => {
    (useConnectionStatus as any).mockReturnValue({
      ...baseMock,
      status: 'reconnecting',
      reconnectAttempts: 3,
      isReconnecting: true,
      isUnhealthy: true,
    });

    render(<NetworkHealthIndicator />);

    const dot = document.querySelector('.bg-amber-400');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveAttribute('title', 'Reconnecting... (attempt 3)');
  });

  it('renders an amber dot with a connecting tooltip while connecting', () => {
    (useConnectionStatus as any).mockReturnValue({
      ...baseMock,
      status: 'connecting',
      isConnecting: true,
      isUnhealthy: true,
    });

    render(<NetworkHealthIndicator />);

    const dot = document.querySelector('.bg-amber-400');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveAttribute('title', 'Connecting to live updates...');
  });

  it('exposes the status via an accessible aria-label / sr-only text', () => {
    (useConnectionStatus as any).mockReturnValue({
      ...baseMock,
      status: 'reconnecting',
      reconnectAttempts: 1,
      isReconnecting: true,
      isUnhealthy: true,
    });

    render(<NetworkHealthIndicator />);

    expect(screen.getByLabelText('Reconnecting... (attempt 1)')).toBeInTheDocument();
    expect(screen.getByText('Reconnecting... (attempt 1)')).toBeInTheDocument();
  });

  it('applies a custom className to the wrapper', () => {
    (useConnectionStatus as any).mockReturnValue({
      ...baseMock,
      status: 'reconnecting',
      isReconnecting: true,
      isUnhealthy: true,
    });

    const { container } = render(<NetworkHealthIndicator className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});