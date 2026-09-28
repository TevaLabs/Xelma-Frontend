import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the useConnectionStatus hook
vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: vi.fn(),
}));

import { ConnectionStatus, ConnectionIndicator } from '../ConnectionStatus';
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

    const { container } = render(<ConnectionStatus showWhenConnected={true} />);
    expect(screen.getByText('Live updates active')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('bg-emerald-500/10', 'text-emerald-200', 'border-emerald-400/30');
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
    const indicator = container.querySelector('.bg-emerald-400');
    expect(indicator).toBeInTheDocument();
  });

  it('should render connecting indicator with pulse animation', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'connecting',
      reconnect: vi.fn(),
      isDisconnected: false,
    });

    const { container } = render(<ConnectionIndicator />);
    const indicator = container.querySelector('.bg-sky-400.animate-pulse');
    expect(indicator).toBeInTheDocument();
  });

  it('should render reconnecting indicator with pulse animation', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'reconnecting',
      reconnect: vi.fn(),
      isDisconnected: false,
    });

    const { container } = render(<ConnectionIndicator />);
    const indicator = container.querySelector('.bg-amber-400.animate-pulse');
    expect(indicator).toBeInTheDocument();
  });

  it('should render disconnected indicator', () => {
    (useConnectionStatus as any).mockReturnValue({
      status: 'disconnected',
      reconnect: vi.fn(),
      isDisconnected: true,
    });

    const { container } = render(<ConnectionIndicator />);
    const indicator = container.querySelector('.bg-red-400');
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