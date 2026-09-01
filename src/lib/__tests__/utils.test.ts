import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatVXLM, formatPercent, formatCompactNumber, formatRelativeTime } from '../utils';

describe('formatVXLM', () => {
  it('formats values below 1 000 with two decimal places', () => {
    expect(formatVXLM(0)).toBe('0.00 vXLM');
    expect(formatVXLM(1)).toBe('1.00 vXLM');
    expect(formatVXLM(999.5)).toBe('999.50 vXLM');
    expect(formatVXLM(123.456)).toBe('123.46 vXLM');
  });

  it('formats values >= 1 000 with K suffix', () => {
    expect(formatVXLM(1_000)).toBe('1.00K vXLM');
    expect(formatVXLM(1_500)).toBe('1.50K vXLM');
    expect(formatVXLM(999_999)).toBe('1000.00K vXLM');
  });

  it('formats values >= 1 000 000 with M suffix', () => {
    expect(formatVXLM(1_000_000)).toBe('1.00M vXLM');
    expect(formatVXLM(2_500_000)).toBe('2.50M vXLM');
  });

  it('respects custom decimals argument', () => {
    expect(formatVXLM(1_234, 0)).toBe('1K vXLM');
    expect(formatVXLM(1_234.567, 3)).toBe('1.235K vXLM');
  });

  it('handles negative values', () => {
    expect(formatVXLM(-500)).toBe('-500.00 vXLM');
    expect(formatVXLM(-1_500)).toBe('-1.50K vXLM');
  });

  it('handles non-finite values gracefully', () => {
    expect(formatVXLM(NaN)).toBe('0.00 vXLM');
    expect(formatVXLM(Infinity)).toBe('0.00 vXLM');
    expect(formatVXLM(-Infinity)).toBe('0.00 vXLM');
  });
});

describe('formatPercent', () => {
  it('converts a 0-1 ratio to a percentage string', () => {
    expect(formatPercent(0)).toBe('0.00%');
    expect(formatPercent(1)).toBe('100.00%');
    expect(formatPercent(0.5)).toBe('50.00%');
    expect(formatPercent(0.4567)).toBe('45.67%');
  });

  it('respects custom decimals', () => {
    expect(formatPercent(0.3333, 0)).toBe('33%');
    expect(formatPercent(0.3333, 1)).toBe('33.3%');
  });

  it('handles non-finite values gracefully', () => {
    expect(formatPercent(NaN)).toBe('0.00%');
    expect(formatPercent(Infinity)).toBe('0.00%');
  });
});

describe('formatCompactNumber', () => {
  it('formats values below 1 000 as plain numbers', () => {
    expect(formatCompactNumber(0)).toBe('0.00');
    expect(formatCompactNumber(42)).toBe('42.00');
    expect(formatCompactNumber(999)).toBe('999.00');
  });

  it('formats values >= 1 000 with K suffix', () => {
    expect(formatCompactNumber(1_000)).toBe('1.00K');
    expect(formatCompactNumber(2_500)).toBe('2.50K');
  });

  it('formats values >= 1 000 000 with M suffix', () => {
    expect(formatCompactNumber(1_000_000)).toBe('1.00M');
    expect(formatCompactNumber(3_750_000)).toBe('3.75M');
  });

  it('handles negative values', () => {
    expect(formatCompactNumber(-1_500)).toBe('-1.50K');
  });

  it('handles non-finite values gracefully', () => {
    expect(formatCompactNumber(NaN)).toBe('0');
    expect(formatCompactNumber(Infinity)).toBe('0');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-07-28T12:00:00Z');

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Seconds ──

  it('returns "just now" for 1 second ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 1 * 1000))).toBe('just now');
  });

  it('returns "just now" for 30 seconds ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 30 * 1000))).toBe('just now');
  });

  it('returns "just now" for 59 seconds ago (upper boundary)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 59 * 1000))).toBe('just now');
  });

  it('returns "just now" for future dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() + 5000))).toBe('just now');
  });

  // ── Minutes ──

  it('returns "1m ago" at the 60-second boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 60 * 1000))).toBe('1m ago');
  });

  it('returns "Xm ago" for dates minutes ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 5 * 60 * 1000))).toBe('5m ago');
  });

  it('returns "59m ago" at the upper minutes boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 59 * 60 * 1000))).toBe('59m ago');
  });

  // ── Hours ──

  it('returns "1h ago" at the 60-minute boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 60 * 60 * 1000))).toBe('1h ago');
  });

  it('returns "Xh ago" for dates hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 3 * 60 * 60 * 1000))).toBe('3h ago');
  });

  it('returns "23h ago" at the upper hours boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 23 * 60 * 60 * 1000))).toBe('23h ago');
  });

  // ── Days ──

  it('returns "1d ago" at the 24-hour boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 24 * 60 * 60 * 1000))).toBe('1d ago');
  });

  it('returns "Xd ago" for dates days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000))).toBe('5d ago');
  });

  it('returns "29d ago" at the upper days boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000))).toBe('29d ago');
  });

  // ── Date fallback ──

  it('falls back to toLocaleDateString at the 30-day boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(date)).toBe(date.toLocaleDateString());
  });

  it('falls back to toLocaleDateString for dates older than 30 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const date = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(date)).toBe(date.toLocaleDateString());
  });
});
