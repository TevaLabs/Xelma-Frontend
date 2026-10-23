import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import RoundTimer from '../RoundTimer';

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

  describe('circular progress arc', () => {
    /** The second circle is the animated progress arc; the first is the track. */
    const arc = () => document.querySelectorAll('circle')[1];
    const arcOffset = () => Number(arc().getAttribute('stroke-dashoffset'));

    it('stays teal while the round has time to run', () => {
      render(<RoundTimer endTime={inSeconds(300)} playersOnline={null} />);
      expect(screen.getByRole('timer')).toHaveAttribute('data-arc-state', 'open');
      expect(arc()).toHaveAttribute('stroke', '#06B6D4');
    });

    it('turns amber inside two minutes', () => {
      render(<RoundTimer endTime={inSeconds(100)} playersOnline={null} />);
      expect(screen.getByRole('timer')).toHaveAttribute('data-arc-state', 'closing');
      expect(arc()).toHaveAttribute('stroke', '#FBBF24');
    });

    it('turns red inside thirty seconds', () => {
      render(<RoundTimer endTime={inSeconds(20)} playersOnline={null} />);
      expect(screen.getByRole('timer')).toHaveAttribute('data-arc-state', 'urgent');
      expect(arc()).toHaveAttribute('stroke', '#EF4444');
    });

    it('greys out and reads as ended once time runs out', () => {
      render(<RoundTimer endTime={inSeconds(2)} playersOnline={null} />);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.getByRole('timer')).toHaveAttribute('data-arc-state', 'ended');
      expect(arc()).toHaveAttribute('stroke', '#6B7280');
      expect(arcOffset()).toBeCloseTo(2 * Math.PI * 44, 1);
    });

    it('sweeps the arc as the round burns down', () => {
      render(<RoundTimer endTime={inSeconds(60)} playersOnline={null} />);
      expect(arcOffset()).toBeLessThan(5);

      act(() => {
        vi.advanceTimersByTime(30_000);
      });
      // Half the round gone: the arc sits at ~half its circumference.
      expect(arcOffset()).toBeGreaterThan(100);
    });

    it('re-baselines the arc when endTime moves to the next round', () => {
      const { rerender } = render(<RoundTimer endTime={inSeconds(30)} playersOnline={null} />);
      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(arcOffset()).toBeGreaterThan(50);

      rerender(<RoundTimer endTime={inSeconds(120)} playersOnline={null} />);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('timer')).toHaveAttribute('data-arc-state', 'closing');
      // A fresh round means a full arc again.
      expect(arcOffset()).toBeLessThan(5);
    });

    it('hides the players line when no live count is available', () => {
      render(<RoundTimer endTime={inSeconds(120)} playersOnline={null} />);
      expect(screen.queryByText(/playing now/i)).not.toBeInTheDocument();
    });
  });
});
