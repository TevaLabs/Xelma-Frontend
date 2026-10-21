import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LiveGameStatsPanel from '../LiveGameStatsPanel';
import { socketService } from '../../lib/socket';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import { useRoundStore } from '../../store/useRoundStore';

vi.mock('../../lib/socket', () => ({
  socketService: {
    isConnected: vi.fn(),
    connect: vi.fn(),
    onLiveGameStats: vi.fn(),
    onPredictionCreated: vi.fn(),
  },
}));

vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: vi.fn(),
}));

vi.mock('../../store/useRoundStore', () => ({
  useRoundStore: vi.fn(),
}));

describe('LiveGameStatsPanel', () => {
  const mockReconnectSocket = vi.fn();
  const mockReconnectSSE = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(socketService.isConnected).mockReturnValue(true);
    vi.mocked(socketService.onLiveGameStats).mockReturnValue(() => {});
    vi.mocked(socketService.onPredictionCreated).mockReturnValue(() => {});

    vi.mocked(useConnectionStatus).mockReturnValue({
      isConnected: true,
      reconnect: mockReconnectSocket,
      status: 'connected',
      error: null,
      reconnectAttempts: 0,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: false,
    });

    vi.mocked(useRoundStore).mockImplementation(((selector: (state: unknown) => unknown) => {
      const state = {
        activeRound: { id: '42', status: 'In Progress' },
        isRoundActive: true,
        isLoading: false,
        sseConnection: { status: 'connected' },
        reconnectSSE: mockReconnectSSE,
      };
      return selector(state);
    }) as never);
  });

  it('renders the telemetry panel with title and connection badge', () => {
    render(<LiveGameStatsPanel />);

    expect(screen.getByText('Platform Pulse')).toBeInTheDocument();
    expect(screen.getByTestId('live-stats-connection-badge')).toHaveTextContent('Live');
    expect(screen.getByText('Active players')).toBeInTheDocument();
    expect(screen.getByText('Recent predictions')).toBeInTheDocument();
    expect(screen.getByText('Round status')).toBeInTheDocument();
  });

  it('renders offline warning and handles reconnect CTA when streams are offline', () => {
    vi.mocked(useConnectionStatus).mockReturnValue({
      isConnected: false,
      reconnect: mockReconnectSocket,
      status: 'disconnected',
      error: null,
      reconnectAttempts: 0,
      isConnecting: false,
      isReconnecting: false,
      isDisconnected: true,
    });

    vi.mocked(useRoundStore).mockImplementation(((selector: (state: unknown) => unknown) => {
      const state = {
        activeRound: null,
        isRoundActive: false,
        isLoading: false,
        sseConnection: { status: 'disconnected' },
        reconnectSSE: mockReconnectSSE,
      };
      return selector(state);
    }) as never);

    render(<LiveGameStatsPanel />);

    expect(screen.getByTestId('live-stats-connection-badge')).toHaveTextContent('Offline');
    const reconnectBtn = screen.getByRole('button', { name: /reconnect/i });
    expect(reconnectBtn).toBeInTheDocument();

    fireEvent.click(reconnectBtn);
    expect(mockReconnectSocket).toHaveBeenCalledTimes(1);
    expect(mockReconnectSSE).toHaveBeenCalledTimes(1);
  });
});
