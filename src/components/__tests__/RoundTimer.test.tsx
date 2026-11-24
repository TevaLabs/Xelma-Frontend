import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import RoundTimer from '../RoundTimer';
import {
  ARC_COLORS,
  getArcColour,
  getArcState,
} from '../RoundTimer.helpers';

describe('RoundTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Pin system time so snapshots are deterministic.
    vi.setSystemTime(new Date('2026-06-27T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  /** Helper: a Date `seconds` from the pinned system time. */
  const inSeconds = (s: number) => new Date(Date.now() + s * 1000);

  it('renders a timer with role="timer"', () => {
    render(<RoundTimer endTime={inSeconds(120)} />);
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('displays the formatted countdown in the SVG text', () => {
    render(<RoundTimer endTime={inSeconds(120)} />);
    // 120 s = 02:00
    expect(screen.getByText('02:00')).toBeInTheDocument();
  });

  it('counts down every second', () => {
    render(<RoundTimer endTime={inSeconds(120)} />);
    expect(screen.getByText('02:00')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('01:59')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(59_000);
    });
    expect(screen.getByText('01:00')).toBeInTheDocument();
  });

  it('shows ENDED when time expires', () => {
    render(<RoundTimer endTime={inSeconds(2)} />);
    expect(screen.queryByText('ENDED')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText('ENDED')).toBeInTheDocument();
  });

  it('shows ENDED when endTime is in the past', () => {
    render(<RoundTimer endTime={new Date(Date.now() - 5000)} />);
    expect(screen.getByText('ENDED')).toBeInTheDocument();
  });

  it('renders the players-online label with default value', () => {
    render(<RoundTimer endTime={inSeconds(120)} />);
    expect(screen.getByText(/playing now: 128/i)).toBeInTheDocument();
  });

  it('renders a custom playersOnline value', () => {
    render(<RoundTimer endTime={inSeconds(120)} playersOnline={42} />);
    expect(screen.getByText(/playing now: 42/i)).toBeInTheDocument();
  });

  it('renders a large playersOnline value with locale formatting', () => {
    render(<RoundTimer endTime={inSeconds(120)} playersOnline={1_500} />);
    expect(screen.getByText(/playing now: 1[,]?500/i)).toBeInTheDocument();
  });

  it('hides the players-online label when playersOnline is null', () => {
    render(<RoundTimer endTime={inSeconds(120)} playersOnline={null} />);
    expect(screen.queryByText(/playing now/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId('round-timer-players')).not.toBeInTheDocument();
  });

  it('updates aria-label as time passes', () => {
    render(<RoundTimer endTime={inSeconds(120)} />);
    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-label', 'Time remaining: 02:00');

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(timer).toHaveAttribute('aria-label', 'Time remaining: 01:00');
  });

  it('updates aria-label to ended state when expired', () => {
    render(<RoundTimer endTime={inSeconds(2)} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    const timer = screen.getByRole('timer');
    expect(timer).toHaveAttribute('aria-label', 'Round has ended');
  });

  it('renders an SVG element with accessible hidden attribute', () => {
    render(<RoundTimer endTime={inSeconds(120)} />);
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies custom className', () => {
    render(
      <RoundTimer endTime={inSeconds(120)} className="my-custom-class" />,
    );
    const timer = screen.getByRole('timer');
    expect(timer.className).toMatch(/my-custom-class/);
  });

  it('cleans up intervals on unmount', () => {
    const { unmount } = render(<RoundTimer endTime={inSeconds(120)} />);
    unmount();
    // No error should be thrown after unmount
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    }).not.toThrow();
  });

  describe('SVG arc color thresholds and states', () => {
    it('applies teal open state when time > 2 minutes', () => {
      render(<RoundTimer endTime={inSeconds(150)} />);
      const timer = screen.getByTestId('round-timer');
      const arc = screen.getByTestId('round-timer-arc');

      expect(timer).toHaveAttribute('data-arc-state', 'open');
      expect(arc).toHaveAttribute('stroke', ARC_COLORS.OPEN);
      expect(arc).toHaveAttribute('data-arc-state', 'open');
    });

    it('transitions to amber closing state when time < 2 minutes', () => {
      render(<RoundTimer endTime={inSeconds(125)} />);
      const timer = screen.getByTestId('round-timer');
      const arc = screen.getByTestId('round-timer-arc');

      expect(timer).toHaveAttribute('data-arc-state', 'open');
      expect(arc).toHaveAttribute('stroke', ARC_COLORS.OPEN);

      // Advance 10s -> 115s remaining (< 2 min)
      act(() => {
        vi.advanceTimersByTime(10_000);
      });

      expect(timer).toHaveAttribute('data-arc-state', 'closing');
      expect(arc).toHaveAttribute('stroke', ARC_COLORS.CLOSING);
    });

    it('transitions to red urgent state when time < 30 seconds', () => {
      render(<RoundTimer endTime={inSeconds(40)} />);
      const timer = screen.getByTestId('round-timer');
      const arc = screen.getByTestId('round-timer-arc');

      expect(timer).toHaveAttribute('data-arc-state', 'closing');

      // Advance 15s -> 25s remaining (< 30s)
      act(() => {
        vi.advanceTimersByTime(15_000);
      });

      expect(timer).toHaveAttribute('data-arc-state', 'urgent');
      expect(arc).toHaveAttribute('stroke', ARC_COLORS.URGENT);
    });

    it('transitions to grey ended state and depletes arc when round ends', () => {
      render(<RoundTimer endTime={inSeconds(10)} />);
      const timer = screen.getByTestId('round-timer');
      const arc = screen.getByTestId('round-timer-arc');

      act(() => {
        vi.advanceTimersByTime(11_000);
      });

      expect(timer).toHaveAttribute('data-arc-state', 'ended');
      expect(arc).toHaveAttribute('stroke', ARC_COLORS.ENDED);
      expect(arc).toHaveAttribute('stroke-dashoffset', expect.stringMatching(/^276/));
    });

    it('re-baselines correctly when endTime updates across rounds', () => {
      const { rerender } = render(<RoundTimer endTime={inSeconds(30)} />);
      const timer = screen.getByTestId('round-timer');
      const arc = screen.getByTestId('round-timer-arc');

      expect(timer).toHaveAttribute('data-arc-state', 'closing');

      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(timer).toHaveAttribute('data-arc-state', 'urgent');

      // New round with 3 minutes
      rerender(<RoundTimer endTime={inSeconds(180)} />);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(timer).toHaveAttribute('data-arc-state', 'open');
      expect(arc).toHaveAttribute('stroke', ARC_COLORS.OPEN);
      expect(screen.getByText('02:59')).toBeInTheDocument();
    });
  });

  describe('helper functions', () => {
    it('computes arc states accurately', () => {
      expect(getArcState(150_000, false)).toBe('open');
      expect(getArcState(119_999, false)).toBe('closing');
      expect(getArcState(29_999, false)).toBe('urgent');
      expect(getArcState(0, false)).toBe('ended');
      expect(getArcState(100_000, true)).toBe('ended');
    });

    it('computes arc colours accurately', () => {
      expect(getArcColour(150_000, false)).toBe(ARC_COLORS.OPEN);
      expect(getArcColour(90_000, false)).toBe(ARC_COLORS.CLOSING);
      expect(getArcColour(20_000, false)).toBe(ARC_COLORS.URGENT);
      expect(getArcColour(0, false)).toBe(ARC_COLORS.ENDED);
      expect(getArcColour(100_000, true)).toBe(ARC_COLORS.ENDED);
    });
  });
});
