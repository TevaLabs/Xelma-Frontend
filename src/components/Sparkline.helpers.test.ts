import { describe, it, expect } from 'vitest';
import { getTrendLabel } from './Sparkline.helpers';

describe('getTrendLabel', () => {
  it('reports an upward trend with a percentage', () => {
    expect(getTrendLabel('BTC total volume', [100, 110, 120])).toBe(
      'BTC total volume trend: up 20.0% over the period',
    );
  });

  it('reports a downward trend with a percentage', () => {
    expect(getTrendLabel('XLM total volume', [200, 150, 100])).toBe(
      'XLM total volume trend: down 50.0% over the period',
    );
  });

  it('reports a flat trend when start and end are equal', () => {
    expect(getTrendLabel('ETH total volume', [500, 480, 500])).toBe(
      'ETH total volume trend: flat over the period',
    );
  });

  it('reports insufficient data for fewer than two points', () => {
    expect(getTrendLabel('BTC total volume', [500])).toBe(
      'BTC total volume trend: not enough data',
    );
    expect(getTrendLabel('BTC total volume', [])).toBe(
      'BTC total volume trend: not enough data',
    );
  });
});
