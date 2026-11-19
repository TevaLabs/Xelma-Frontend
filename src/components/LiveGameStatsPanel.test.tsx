import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LiveGameStatsPanel from './LiveGameStatsPanel';
import { socketService } from '../lib/socket';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useRoundStore } from '../store/useRoundStore';

let mockLiveStatsCallback: ((payload: unknown) => void) | null = null;
let mockPredictionCreatedCallback: ((payload: unknown) => void) | null = null;
const unsubscribeStats = vi.fn();
const unsubscribePrediction = vi.fn();

vi.mock('../lib/socket', () => ({
  socketService: {
    isConnected: vi.fn(() => false),
    connect: vi.fn(),
    onLiveGameStats: vi.fn((cb) => {
      mockLiveStatsCallback = cb;
      return unsubscribeStats;
    }),
    onPredictionCreated: vi.fn((cb) => {
      mockPredictionCreatedCallback = cb;
      return unsubscribePrediction;
    }),
  },
}));

const mockReconnectSocket = vi.fn();
const mockReconnectSSE = vi.fn();

let mockConnectionStatusState = {
  isConnected: true,
  status: 'connected',
  reconnect: mockReconnectSocket,
};

vi.mock('../hooks/useConnectionStatus', () => ({
  useConnectionStatus: () => mockConnectionStatusState,
}));

let mockRoundState = {
  activeRound: { id: 42, status: 'Open', playerCount: 10, predictionsCount: 5 },
  isRoundActive: true,
  isLoading: false,
  sseConnection: { status: 'connected', error: null },
  reconnectSSE: mockReconnectSSE,
};

vi.mock('../store/useRoundStore', () => ({
  useRoundStore: Object.assign(
    vi.fn((selector) => {
      return typeof selector === 'function' ? selector(mockRoundState) : mockRoundState;
    }),
    {
      getState: () => mockRoundState,
    }
  ),
}));

describe('LiveGameStatsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLiveStatsCallback = null;
    mockPredictionCreatedCallback = null;
    mockConnectionStatusState = {
      isConnected: true,
      status: 'connected',
      reconnect: mockReconnectSocket,
    };
    mockRoundState = {
      activeRound: { id: 42, status: 'Open', playerCount: 10, predictionsCount: 5 },
      isRoundActive: true,
      isLoading: false,
      sseConnection: { status: 'connected', error: null },
      reconnectSSE: mockReconnectSSE,
    };
  });

  it('renders Platform Pulse telemetry panel and initial metrics', () => {
    render(<LiveGameStatsPanel />);

    expect(screen.getByTestId('live-game-stats-panel')).toBeInTheDocument();
    expect(screen.getByText('Platform Pulse')).toBeInTheDocument();
    expect(screen.getByText('Active players')).toBeInTheDocument();
    expect(screen.getByText('Recent predictions')).toBeInTheDocument();
    expect(screen.getByText('Round status')).toBeInTheDocument();
    expect(screen.getByText('Round #42')).toBeInTheDocument();
  });

  it('connects to socket and registers listeners on mount', () => {
    render(<LiveGameStatsPanel />);

    expect(socketService.connect).toHaveBeenCalled();
    expect(socketService.onLiveGameStats).toHaveBeenCalled();
    expect(socketService.onPredictionCreated).toHaveBeenCalled();
  });

  it('unsubscribes from socket events on unmount', () => {
    const { unmount } = render(<LiveGameStatsPanel />);

    unmount();

    expect(unsubscribeStats).toHaveBeenCalled();
    expect(unsubscribePrediction).toHaveBeenCalled();
  });

  it('updates telemetry metrics when socket emits live stats payload', () => {
    render(<LiveGameStatsPanel />);

    act(() => {
      mockLiveStatsCallback?.({
        activePlayers: 128,
        recentPredictions: 350,
      });
    });

    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('350')).toBeInTheDocument();
  });

  it('handles nested socket payload shapes', () => {
    render(<LiveGameStatsPanel />);

    act(() => {
      mockLiveStatsCallback?.({
        data: {
          playersOnline: 77,
          predictionsCount: 99,
        },
      });
    });

    expect(screen.getByText('77')).toBeInTheDocument();
    expect(screen.getByText('99')).toBeInTheDocument();
  });

  it('increments recent predictions count when prediction is created', () => {
    render(<LiveGameStatsPanel />);

    act(() => {
      mockLiveStatsCallback?.({
        recentPredictions: 15,
      });
    });

    expect(screen.getByText('15')).toBeInTheDocument();

    act(() => {
      mockPredictionCreatedCallback?.({ id: 'pred-1' });
    });

    expect(screen.getByText('16')).toBeInTheDocument();
  });

  it('displays feed health badge and allows reconnecting when offline', () => {
    mockConnectionStatusState = {
      isConnected: false,
      status: 'disconnected',
      reconnect: mockReconnectSocket,
    };
    mockRoundState = {
      ...mockRoundState,
      sseConnection: { status: 'disconnected', error: 'Connection failed' },
    };

    render(<LiveGameStatsPanel />);

    const badge = screen.getByTestId('live-stats-connection-badge');
    expect(badge).toHaveTextContent(/offline/i);
    expect(screen.getByText(/Live feed offline/i)).toBeInTheDocument();

    const reconnectBtn = screen.getByRole('button', { name: /reconnect/i });
    fireEvent.click(reconnectBtn);

    expect(mockReconnectSocket).toHaveBeenCalled();
    expect(mockReconnectSSE).toHaveBeenCalled();
  });

  it('displays syncing state when SSE is reconnecting', () => {
    mockConnectionStatusState = {
      isConnected: false,
      status: 'disconnected',
      reconnect: mockReconnectSocket,
    };
    mockRoundState = {
      ...mockRoundState,
      sseConnection: { status: 'reconnecting', error: null },
    };

    render(<LiveGameStatsPanel />);

    const badge = screen.getByTestId('live-stats-connection-badge');
    expect(badge).toHaveTextContent(/syncing/i);
    expect(screen.getByText(/Reconnecting to the live feed/i)).toBeInTheDocument();
  });
});
