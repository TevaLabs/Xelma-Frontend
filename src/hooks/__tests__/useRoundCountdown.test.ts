import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useRoundCountdown } from '../../hooks/useRoundCountdown';

describe('useRoundCountdown Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-27T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 00:00 and expires for past times', () => {
    const past = new Date('2026-06-27T11:00:00Z');
    const { result } = renderHook(() => useRoundCountdown(past));

    expect(result.current.isExpired).toBe(true);
    expect(result.current.formattedTime).toBe('00:00');
    expect(result.current.timeLeftMs).toBe(0);
  });

  it('shows mm:ss formatting for sub-minute countdowns', () => {
    const future = new Date(Date.now() + 30 * 1000);
    const { result } = renderHook(() => useRoundCountdown(future));

    expect(result.current.isExpired).toBe(false);
    expect(result.current.formattedTime).toBe('00:30');

    act(() => {
      vi.advanceTimersByTime(10 * 1000);
    });

    expect(result.current.formattedTime).toBe('00:20');
  });

  it('formats multi-hour countdowns as HH:MM:SS', () => {
    const future = new Date(Date.now() + (1 * 3600 + 2 * 60 + 3) * 1000);
    const { result } = renderHook(() => useRoundCountdown(future));

    expect(result.current.formattedTime).toBe('01:02:03');

    act(() => {
      vi.advanceTimersByTime(62 * 1000);
    });

    expect(result.current.formattedTime).toBe('01:01:01');
  });
});
