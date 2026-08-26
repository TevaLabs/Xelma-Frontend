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
});
