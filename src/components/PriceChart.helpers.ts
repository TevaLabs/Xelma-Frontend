import type { PricePoint } from "../lib/api-client";
import type { UTCTimestamp } from "lightweight-charts";

/** Candlestick data format for Lightweight Charts */
export interface CandlestickData {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

/** Aggregation interval in seconds for candlestick candles */
export type CandleInterval = 60 | 300 | 900 | 1800 | 3600;

/** Default candlestick interval: 1 minute */
export const DEFAULT_CANDLE_INTERVAL: CandleInterval = 60;

/**
 * Convert price points to OHLC candlestick data by aggregating into
 * time buckets of the specified interval.
 *
 * Each bucket computes:
 *   open  = first price in the bucket
 *   high  = max price in the bucket
 *   low   = min price in the bucket
 *   close = last price in the bucket
 *
 * @param points  – Sorted or unsorted price points (will be sorted by time)
 * @param interval – Bucket size in seconds (default 1 minute)
 */
export function toCandlestickData(
  points: PricePoint[],
  interval: CandleInterval = DEFAULT_CANDLE_INTERVAL,
): CandlestickData[] {
  if (points.length === 0) return [];

  // Sort by time just in case
  const sorted = points.length > 1
    ? [...points].sort((a, b) => a.time - b.time)
    : points;

  const buckets = new Map<number, number[]>();

  for (const point of sorted) {
    const bucketStart = Math.floor(point.time / interval) * interval;
    const existing = buckets.get(bucketStart);
    if (existing) {
      existing.push(point.value);
    } else {
      buckets.set(bucketStart, [point.value]);
    }
  }

  const result: CandlestickData[] = [];
  for (const [bucketStart, prices] of buckets) {
    result.push({
      time: bucketStart as UTCTimestamp,
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
    });
  }

  return result.sort((a, b) => a.time - b.time);
}

export function mergePricePoints(existing: PricePoint[], incoming: PricePoint[]): PricePoint[] {
  if (incoming.length === 0) return existing;

  const merged = new Map<number, PricePoint>();
  for (const point of existing) merged.set(point.time, point);

  let changed = false;
  for (const point of incoming) {
    const current = merged.get(point.time);
    if (!current || current.value !== point.value) {
      merged.set(point.time, point);
      changed = true;
    }
  }

  if (!changed) return existing;

  return Array.from(merged.values())
    .sort((a, b) => a.time - b.time)
    .slice(-500);
}
