import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoundSseStatusChip } from './RoundSseStatusChip';

type SseStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

interface MockSseConnection {
  status: SseStatus;
  error: string | null;
  reconnectAttempts: number;
  lastConnected: Date | null;
}

const mockRoundSseStore: {
  sseConnection: MockSseConnection | undefined;
  reconnectSSE: () => void;
} = {
  sseConnection: {
    status: 'connected',
    error: null,
    reconnectAttempts: 0,
    lastConnected: null,
  },
  reconnectSSE: vi.fn(),
};

vi.mock('../store/useRoundStore', () => ({
  useRoundStore: vi.fn((selector: unknown) => {
    if (typeof selector === 'function') {
      return (selector as (state: typeof mockRoundSseStore) => unknown)(mockRoundSseStore);
    }
    return mockRoundSseStore;
  }),
}));

describe('RoundSseStatusChip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoundSseStore.sseConnection = {
      status: 'connected',
      error: null,
      reconnectAttempts: 0,
      lastConnected: null,
    };
  });

  it('shows Live when the round stream is connected', () => {
    render(<RoundSseStatusChip />);

    const chip = screen.getByTestId('round-sse-status-chip');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent('Live');
    expect(chip).toHaveAttribute('title', 'Round updates: connected');
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('shows Connecting while the round stream is connecting', () => {
    mockRoundSseStore.sseConnection = {
      status: 'connecting',
      error: null,
      reconnectAttempts: 0,
      lastConnected: null,
    };
    render(<RoundSseStatusChip />);

    expect(screen.getByTestId('round-sse-status-chip')).toHaveTextContent(/connecting/i);
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
  });

  it('shows the attempt count while reconnecting', () => {
    mockRoundSseStore.sseConnection = {
      status: 'reconnecting',
      error: 'Round event stream disconnected',
      reconnectAttempts: 3,
      lastConnected: new Date('2026-01-01T00:00:00.000Z'),
    };
    render(<RoundSseStatusChip />);

    const chip = screen.getByTestId('round-sse-status-chip');
    expect(chip).toHaveTextContent(/reconnecting/i);
    expect(chip).toHaveTextContent(/attempt 3/);
    expect(chip).toHaveAttribute(
      'title',
      'Round updates: reconnecting — Round event stream disconnected',
    );
  });

  it('shows Updates paused with a Retry button when disconnected, and retries on click', () => {
    mockRoundSseStore.sseConnection = {
      status: 'disconnected',
      error: 'Round event stream disconnected',
      reconnectAttempts: 5,
      lastConnected: null,
    };
    render(<RoundSseStatusChip />);

    const chip = screen.getByTestId('round-sse-status-chip');
    expect(chip).toHaveTextContent('Updates paused');
    expect(chip).toHaveAttribute(
      'title',
      'Round updates: disconnected — Round event stream disconnected',
    );

    const retry = screen.getByRole('button', { name: /retry/i });
    fireEvent.click(retry);
    expect(mockRoundSseStore.reconnectSSE).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when the store has no SSE connection state', () => {
    mockRoundSseStore.sseConnection = undefined;
    render(<RoundSseStatusChip />);

    expect(screen.queryByTestId('round-sse-status-chip')).not.toBeInTheDocument();
  });
});
