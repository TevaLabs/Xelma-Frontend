import { describe, it, expect } from 'vitest';
import {
  mergePricePoints,
  toCandlestickData,
  type CandlestickData,
  type CandleInterval,
  DEFAULT_CANDLE_INTERVAL,
} from './PriceChart.helpers';
import type { PricePoint } from '../lib/api-client';
import type { UTCTimestamp } from 'lightweight-charts';

const p = (time: number, value: number): PricePoint => ({ time, value });

/** Bucket start for a given timestamp with the default 60s interval */
const bucket = (time: number, interval: CandleInterval = DEFAULT_CANDLE_INTERVAL): number =>
  Math.floor(time / interval) * interval;

describe('mergePricePoints', () => {
  it('returns the existing reference when the incoming batch is empty', () => {
    const existing = [p(1, 10)];
    expect(mergePricePoints(existing, [])).toBe(existing);
  });

  it('returns the existing reference when every incoming point is a duplicate', () => {
    const existing = [p(1, 10), p(2, 11)];
    const result = mergePricePoints(existing, [p(2, 11)]);
    expect(result).toBe(existing);
  });

  it('returns a new array when a new timestamp arrives', () => {
    const existing = [p(1, 10)];
    const result = mergePricePoints(existing, [p(2, 11)]);
    expect(result).not.toBe(existing);
    expect(result).toEqual([p(1, 10), p(2, 11)]);
  });

  it('returns a new array when an existing timestamp changes value', () => {
    const existing = [p(1, 10)];
    const result = mergePricePoints(existing, [p(1, 12)]);
    expect(result).not.toBe(existing);
    expect(result).toEqual([p(1, 12)]);
  });

  it('keeps points sorted and capped at the most recent 500', () => {
    const existing = Array.from({ length: 500 }, (_, i) => p(i, i));
    const result = mergePricePoints(existing, [p(500, 500)]);
    expect(result).toHaveLength(500);
    expect(result[0]).toEqual(p(1, 1));
    expect(result[result.length - 1]).toEqual(p(500, 500));
  });
});

describe('toCandlestickData', () => {
  it('returns an empty array when given an empty array', () => {
    const result = toCandlestickData([]);
    expect(result).toEqual([]);
  });

  it('aggregates a single price point into one candle at the bucket start', () => {
    const input = [p(1000, 42.5)];
    const result = toCandlestickData(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual<CandlestickData>({
      time: bucket(1000) as UTCTimestamp,
      open: 42.5,
      high: 42.5,
      low: 42.5,
      close: 42.5,
    });
  });

  it('places points at different timestamps into separate buckets', () => {
    const input = [p(1000, 10), p(2000, 20), p(3000, 15)];
    const result = toCandlestickData(input);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual<CandlestickData>({
      time: bucket(1000) as UTCTimestamp,
      open: 10, high: 10, low: 10, close: 10,
    });
    expect(result[1]).toEqual<CandlestickData>({
      time: bucket(2000) as UTCTimestamp,
      open: 20, high: 20, low: 20, close: 20,
    });
    expect(result[2]).toEqual<CandlestickData>({
      time: bucket(3000) as UTCTimestamp,
      open: 15, high: 15, low: 15, close: 15,
    });
  });

  it('handles zero values correctly', () => {
    const input = [p(100, 0)];
    const result = toCandlestickData(input);

    expect(result[0]).toEqual<CandlestickData>({
      time: bucket(100) as UTCTimestamp,
      open: 0, high: 0, low: 0, close: 0,
    });
  });

  it('handles negative values correctly', () => {
    const input = [p(500, -5.75)];
    const result = toCandlestickData(input);

    expect(result[0]).toEqual<CandlestickData>({
      time: bucket(500) as UTCTimestamp,
      open: -5.75, high: -5.75, low: -5.75, close: -5.75,
    });
  });

  it('handles large decimal precision correctly', () => {
    const input = [p(1, 0.12345678)];
    const result = toCandlestickData(input);

    expect(result[0].open).toBeCloseTo(0.12345678);
    expect(result[0].high).toBeCloseTo(0.12345678);
    expect(result[0].low).toBeCloseTo(0.12345678);
    expect(result[0].close).toBeCloseTo(0.12345678);
  });

  it('does not mutate the input array', () => {
    const input = [p(1, 10), p(2, 20)];
    const copy = [...input];
    toCandlestickData(input);
    expect(input).toEqual(copy);
  });

  // ── OHLC aggregation tests ──────────────────────────────────────

  it('aggregates multiple price points in the same bucket into proper OHLC', () => {
    // All points fall within the same 60s bucket (t=0)
    const input = [p(1, 10), p(15, 25), p(30, 5), p(45, 20)];
    const result = toCandlestickData(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual<CandlestickData>({
      time: 0 as UTCTimestamp,
      open: 10,   // first price
      high: 25,   // max
      low: 5,     // min
      close: 20,  // last price
    });
  });

  it('computes OHLC correctly across multiple buckets', () => {
    // Bucket 0 (t=0..59):   prices 10, 15, 8  → O:10 H:15 L:8 C:8
    // Bucket 60 (t=60..119): prices 20, 30, 25 → O:20 H:30 L:20 C:25 (sorted input: 20, 25, 30)
    // But the input is unsorted within bucket 60: [p(60, 20), p(90, 30), p(75, 25)]
    // actually the input is points with t=60 (value 20), t=75 (value 25), t=90 (value 30)
    // After sorting by time: (60,20), (75,25), (90,30) → prices = [20, 25, 30]
    const input = [
      p(10, 10),   // bucket 0
      p(30, 15),   // bucket 0
      p(55, 8),    // bucket 0
      p(60, 20),   // bucket 60
      p(75, 25),   // bucket 60
      p(90, 30),   // bucket 60
    ];
    const result = toCandlestickData(input);

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual<CandlestickData>({
      time: 0 as UTCTimestamp,
      open: 10,
      high: 15,
      low: 8,
      close: 8,
    });

    expect(result[1]).toEqual<CandlestickData>({
      time: 60 as UTCTimestamp,
      open: 20,
      high: 30,
      low: 20,
      close: 30,
    });
  });

  it('uses a custom interval when provided', () => {
    // 5-minute interval = 300 seconds
    const input = [
      p(100, 10),   // bucket 0
      p(400, 20),   // bucket 300
      p(200, 30),   // bucket 0 (t=200 → floor(200/300)*300 = 0)
    ];
    const result = toCandlestickData(input, 300);

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual<CandlestickData>({
      time: 0 as UTCTimestamp,
      open: 10,
      high: 30,
      low: 10,
      close: 30,
    });

    expect(result[1]).toEqual<CandlestickData>({
      time: 300 as UTCTimestamp,
      open: 20,
      high: 20,
      low: 20,
      close: 20,
    });
  });

  it('sorts input points before bucketing', () => {
    // Unsorted input — time order: 50, 10, 30  (all within same 60s bucket 0)
    // t=50 → bucket 0, t=10 → bucket 0, t=30 → bucket 0
    const input = [p(50, 20), p(10, 10), p(30, 30)];
    const result = toCandlestickData(input);

    expect(result).toHaveLength(1);
    // Sorted by time: (10,10), (30,30), (50,20)
    // open = 10 (first), high = 30 (max), low = 10 (min), close = 20 (last)
    expect(result[0]).toEqual<CandlestickData>({
      time: 0 as UTCTimestamp,
      open: 10,
      high: 30,
      low: 10,
      close: 20,
    });
  });

  it('returns candles sorted by time', () => {
    const input = [
      p(90, 15),   // bucket 60
      p(10, 5),    // bucket 0
      p(150, 25),  // bucket 120
    ];
    const result = toCandlestickData(input);

    expect(result[0].time).toBe(0 as UTCTimestamp);
    expect(result[1].time).toBe(60 as UTCTimestamp);
    expect(result[2].time).toBe(120 as UTCTimestamp);
  });

  it('handles many points in a single bucket correctly', () => {
    const manyPrices = [3, 7, 1, 9, 4, 8, 2, 6, 5, 10];
    const input = manyPrices.map((v, i) => p(i * 5, v)); // all t=0..45, same bucket
    const result = toCandlestickData(input);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual<CandlestickData>({
      time: 0 as UTCTimestamp,
      open: 3,
      high: 10,
      low: 1,
      close: 10,
    });
  });

  it('handles singleton input without copying unnecessarily', () => {
    // Edge case: single element array shouldn't trigger the sort branch
    const input = [p(100, 42)];
    const result = toCandlestickData(input);
    expect(result).toHaveLength(1);
    expect(result[0].open).toBe(42);
  });

  it('exposes DEFAULT_CANDLE_INTERVAL', () => {
    expect(DEFAULT_CANDLE_INTERVAL).toBe(60);
  });
});
