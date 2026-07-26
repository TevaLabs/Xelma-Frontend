import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import CountdownTimer from './CountdownTimer';

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('formats time as MM:SS for multi-minute values', () => {
    render(<CountdownTimer endTime={new Date(Date.now() + 150 * 1000)} />);

    expect(screen.getByText('02:30')).toBeInTheDocument();
  });

  it('formats time as M:SS when seconds are below 10', () => {
    render(<CountdownTimer endTime={new Date(Date.now() + 65 * 1000)} />);

    expect(screen.getByText('01:05')).toBeInTheDocument();
  });

  it('shows Ended when endTime is in the past', () => {
    render(<CountdownTimer endTime={new Date(Date.now() - 1000)} />);

    expect(screen.getByText('Ended')).toBeInTheDocument();
  });

  it('shows Ended after the timer expires and calls onExpire once', () => {
    const onExpire = vi.fn();
    vi.useFakeTimers();

    const startTime = new Date('2026-06-27T12:00:00Z');
    vi.setSystemTime(startTime);

    const endTime = new Date(startTime.getTime() + 2 * 1000);
    render(<CountdownTimer endTime={endTime} onExpire={onExpire} />);

    expect(screen.queryByText('Ended')).not.toBeInTheDocument();
    expect(screen.getByText('00:02')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('00:01')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('Ended')).toBeInTheDocument();
  });

  it('cleans up interval timers on unmount', () => {
    vi.useFakeTimers();
    const endTime = new Date(Date.now() + 10 * 1000);
    const { unmount } = render(<CountdownTimer endTime={endTime} />);

    unmount();

    expect(() => {
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    }).not.toThrow();
  });
});
