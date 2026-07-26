import { describe, it, expect } from 'vitest';
import { mergePricePoints } from './PriceChart.helpers';
import type { PricePoint } from '../lib/api-client';

const p = (time: number, value: number): PricePoint => ({ time, value });

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
