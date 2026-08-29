import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const mockRoundStore: Record<string, unknown> = {
  activeRound: null,
  isRoundActive: false,
  sseConnection: { status: 'connected' },
};

vi.mock('../store/useRoundStore', () => ({
  useRoundStore: vi.fn((selector) => {
    if (typeof selector === 'function') {
      return selector(mockRoundStore);
    }
    return mockRoundStore;
  }),
}));

import RoundTimeline from './RoundTimeline';

function setRoundState(state: Partial<typeof mockRoundStore>) {
  Object.assign(mockRoundStore, state);
}

function getCurrentStateLabel(container?: HTMLElement) {
  const root = container?.querySelector('[data-current-state]') ?? document.querySelector('[data-current-state]');
  return root?.getAttribute('data-current-state');
}

describe('RoundTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    setRoundState({
      activeRound: null,
      isRoundActive: false,
      sseConnection: { status: 'connected' },
    });
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders successfully and shows timeline header', () => {
    render(<RoundTimeline />);

    expect(screen.getByRole('heading', { name: /Round Progress/i })).toBeInTheDocument();
    expect(screen.getByText(/Current state is "upcoming"/i)).toBeInTheDocument();
    expect(screen.getByText(/Upcoming → Live → Resolving → Finished/i)).toBeInTheDocument();
  });

  it('renders upcoming state when there is no active round', () => {
    setRoundState({ activeRound: null, isRoundActive: false, sseConnection: { status: 'connected' } });
    const { container } = render(<RoundTimeline />);

    expect(screen.getByText(/Current state is "upcoming"/i)).toBeInTheDocument();
    expect(getCurrentStateLabel(container)).toBe('upcoming');
  });

  it('renders live state when the active round is live', () => {
    setRoundState({
      activeRound: { id: 'r1', status: 'live', startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 60000).toISOString() },
      isRoundActive: true,
      sseConnection: { status: 'connected' },
    });

    const { container } = render(<RoundTimeline />);

    expect(getCurrentStateLabel(container)).toBe('live');
    expect(screen.getByText(/Current state is "live"/i)).toBeInTheDocument();
  });

  it('renders resolving state for a round with resolving status', () => {
    setRoundState({
      activeRound: { id: 'r2', status: 'resolving', startsAt: new Date().toISOString() },
      isRoundActive: false,
      sseConnection: { status: 'connected' },
    });

    const { container } = render(<RoundTimeline />);

    expect(getCurrentStateLabel(container)).toBe('resolving');
    expect(screen.getByText(/Current state is "resolving"/i)).toBeInTheDocument();
  });

  it('renders finished state when round status is resolved', () => {
    setRoundState({
      activeRound: { id: 'r3', status: 'resolved', resolvedAt: new Date().toISOString() },
      isRoundActive: false,
      sseConnection: { status: 'connected' },
    });

    const { container } = render(<RoundTimeline />);

    expect(getCurrentStateLabel(container)).toBe('finished');
    expect(screen.getByText(/Current state is "finished"/i)).toBeInTheDocument();
  });

  it('updates current stage indicator when round data changes', () => {
    const { container, rerender } = render(<RoundTimeline />);

    expect(getCurrentStateLabel(container)).toBe('upcoming');

    setRoundState({
      activeRound: { id: 'r4', status: 'live', startsAt: new Date().toISOString(), endsAt: new Date(Date.now() + 120000).toISOString() },
      isRoundActive: true,
    });

    rerender(<RoundTimeline />);
    expect(getCurrentStateLabel(container)).toBe('live');
  });

  it('shows loading state when SSE is connecting or reconnecting', () => {
    setRoundState({
      activeRound: null,
      isRoundActive: false,
      sseConnection: { status: 'connecting' },
    });

    const { container } = render(<RoundTimeline />);

    expect(getCurrentStateLabel(container)).toBe('loading');
    expect(screen.getByText(/Current state is "loading"/i)).toBeInTheDocument();
  });

  it('shows disconnected warning when SSE status is disconnected', () => {
    setRoundState({
      activeRound: null,
      isRoundActive: false,
      sseConnection: { status: 'disconnected' },
    });

    const { container } = render(<RoundTimeline />);

    expect(getCurrentStateLabel(container)).toBe('disconnected');
    expect(screen.getByText(/Current state is "disconnected"/i)).toBeInTheDocument();
  });

  it('handles empty round data gracefully', () => {
    setRoundState({ activeRound: null, isRoundActive: false, sseConnection: { status: 'connected' } });

    const renderComponent = () => render(<RoundTimeline />);
    expect(renderComponent).not.toThrow();
    const { container } = renderComponent();
    expect(getCurrentStateLabel(container)).toBe('upcoming');
  });
});