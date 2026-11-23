import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, cleanup, render, screen, within } from '@testing-library/react';

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

// PredictionPulse (rendered inside RoundTimeline) uses useConnectionStatus and
// useReducedMotion — mock them so the socket singleton is never touched in tests.
vi.mock('../hooks/useConnectionStatus', () => ({
  useConnectionStatus: () => ({
    status: 'connected',
    isConnected: true,
    isConnecting: false,
    isReconnecting: false,
    isDisconnected: false,
    error: null,
    reconnectAttempts: 0,
    lastConnected: null,
    reconnect: vi.fn(),
  }),
}));

vi.mock('../hooks/useReducedMotion', () => ({
  useReducedMotion: () => ({ reduced: false, systemPreference: false, override: 'system' }),
}));

// usePredictionPulse itself calls socketService — mock the whole hook so no
// socket side-effects leak into the timeline tests.
vi.mock('../hooks/usePredictionPulse', () => ({
  usePredictionPulse: () => ({ count: 0, flashing: false, isLive: true }),
  usePredictionPulseMock: () => ({ count: 0, flashing: false, isLive: true }),
}));

import RoundTimeline from './RoundTimeline';

function setRoundState(state: Partial<typeof mockRoundStore>) {
  Object.assign(mockRoundStore, state);
}

function getRoot(container?: HTMLElement) {
  const root = container?.querySelector('[data-current-state]') ?? document.querySelector('[data-current-state]');
  return root as HTMLElement | null;
}

function getCurrentState(container?: HTMLElement) {
  return getRoot(container)?.getAttribute('data-current-state');
}

function getCurrentStep(container?: HTMLElement) {
  return getRoot(container)?.getAttribute('data-current-step');
}

function getLiveRegion() {
  return document.querySelector('[aria-live="polite"]') as HTMLElement | null;
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

  it('renders successfully and shows the lifecycle header', () => {
    render(<RoundTimeline />);

    expect(screen.getByRole('heading', { name: /Round Progress/i })).toBeInTheDocument();
    expect(
      screen.getByText(/Round lifecycle stages: Open, Betting, Locked, Settled/i),
    ).toBeInTheDocument();
  });

  it('renders the four lifecycle steps in order', () => {
    render(<RoundTimeline />);

    const steps = within(screen.getByRole('list', { name: /round lifecycle/i })).getAllByRole(
      'listitem',
    );

    expect(steps).toHaveLength(4);
    expect(steps.map((step) => step.getAttribute('data-step'))).toEqual([
      'open',
      'betting',
      'locked',
      'settled',
    ]);
    expect(steps.map((step) => step.textContent)).toEqual([
      expect.stringContaining('Open'),
      expect.stringContaining('Betting'),
      expect.stringContaining('Locked'),
      expect.stringContaining('Settled'),
    ]);
  });

  it('renders the open step as current when there is no active round', () => {
    setRoundState({ activeRound: null, isRoundActive: false, sseConnection: { status: 'connected' } });
    const { container } = render(<RoundTimeline />);

    expect(getCurrentState(container)).toBe('upcoming');
    expect(getCurrentStep(container)).toBe('open');

    const openStep = container.querySelector('[data-step="open"]');
    expect(openStep).toHaveAttribute('data-step-status', 'current');
    expect(within(openStep as HTMLElement).getByText('Current')).toBeInTheDocument();
  });

  it('renders betting as current when the active round is live', () => {
    setRoundState({
      activeRound: {
        id: 'r1',
        status: 'live',
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 60000).toISOString(),
      },
      isRoundActive: true,
      sseConnection: { status: 'connected' },
    });

    const { container } = render(<RoundTimeline />);

    expect(getCurrentState(container)).toBe('live');
    expect(getCurrentStep(container)).toBe('betting');
    expect(container.querySelector('[data-step="betting"]')).toHaveAttribute(
      'data-step-status',
      'current',
    );
    expect(container.querySelector('[data-step="open"]')).toHaveAttribute(
      'data-step-status',
      'completed',
    );
  });

  it('renders locked as current for a round with resolving status', () => {
    setRoundState({
      activeRound: { id: 'r2', status: 'resolving', startsAt: new Date().toISOString() },
      isRoundActive: false,
      sseConnection: { status: 'connected' },
    });

    const { container } = render(<RoundTimeline />);

    expect(getCurrentState(container)).toBe('resolving');
    expect(getCurrentStep(container)).toBe('locked');
    expect(container.querySelector('[data-step="locked"]')).toHaveAttribute(
      'data-step-status',
      'current',
    );
  });

  it('renders settled as current when round status is resolved', () => {
    setRoundState({
      activeRound: { id: 'r3', status: 'resolved', resolvedAt: new Date().toISOString() },
      isRoundActive: false,
      sseConnection: { status: 'connected' },
    });

    const { container } = render(<RoundTimeline />);

    expect(getCurrentState(container)).toBe('finished');
    expect(getCurrentStep(container)).toBe('settled');
    expect(container.querySelector('[data-step="settled"]')).toHaveAttribute(
      'data-step-status',
      'current',
    );
    expect(screen.getByTestId('round-timeline-current-stage')).toHaveTextContent('Settled');
  });

  it('updates the current step indicator when round data changes', () => {
    const { container, rerender } = render(<RoundTimeline />);

    expect(getCurrentStep(container)).toBe('open');

    setRoundState({
      activeRound: {
        id: 'r4',
        status: 'live',
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 120000).toISOString(),
      },
      isRoundActive: true,
    });

    rerender(<RoundTimeline />);
    expect(getCurrentStep(container)).toBe('betting');
  });

  it('announces lifecycle transitions through a polite aria-live region', () => {
    const { rerender } = render(<RoundTimeline />);

    expect(getLiveRegion()).toHaveAttribute('aria-live', 'polite');
    expect(getLiveRegion()).not.toHaveTextContent(/Round is now Betting/i);

    setRoundState({
      activeRound: {
        id: 'r5',
        status: 'live',
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 120000).toISOString(),
      },
      isRoundActive: true,
    });

    rerender(<RoundTimeline />);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(getLiveRegion()).toHaveTextContent(/Round is now Betting/i);
    expect(getLiveRegion()).toHaveTextContent(/Lifecycle: Open/);
  });

  it('shows loading state when SSE is connecting or reconnecting', () => {
    setRoundState({
      activeRound: null,
      isRoundActive: false,
      sseConnection: { status: 'connecting' },
    });

    const { container } = render(<RoundTimeline />);

    expect(getCurrentState(container)).toBe('loading');
    // Connection states are not lifecycle steps — keep the last meaningful step.
    expect(getCurrentStep(container)).toBe('open');
    expect(screen.getByText(/Connecting to live round updates/i)).toBeInTheDocument();
  });

  it('shows disconnected warning when SSE status is disconnected', () => {
    setRoundState({
      activeRound: null,
      isRoundActive: false,
      sseConnection: { status: 'disconnected' },
    });

    const { container } = render(<RoundTimeline />);

    expect(getCurrentState(container)).toBe('disconnected');
    expect(getCurrentStep(container)).toBe('open');
    expect(
      screen.getByText(/Live round updates are currently unavailable/i),
    ).toBeInTheDocument();
  });

  it('handles empty round data gracefully', () => {
    setRoundState({ activeRound: null, isRoundActive: false, sseConnection: { status: 'connected' } });

    const renderComponent = () => render(<RoundTimeline />);
    expect(renderComponent).not.toThrow();
    const { container } = renderComponent();
    expect(getCurrentStep(container)).toBe('open');
  });
});
