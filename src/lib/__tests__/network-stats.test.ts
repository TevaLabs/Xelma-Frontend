import { describe, it, expect } from 'vitest';
import { normalizeNetworkStats } from '../api-client';

describe('normalizeNetworkStats', () => {
  it('reads the canonical key names', () => {
    expect(
      normalizeNetworkStats({
        totalRounds: 1200,
        vXlmDistributed: 4_200_000,
        activePlayers: 893,
      }),
    ).toEqual({ totalRounds: 1200, vXlmDistributed: 4_200_000, activePlayers: 893 });
  });

  it('accepts alias key names from the backend', () => {
    expect(
      normalizeNetworkStats({
        roundsResolved: 50,
        practiceVolume: 1000,
        activePredictors: 12,
      }),
    ).toEqual({ totalRounds: 50, vXlmDistributed: 1000, activePlayers: 12 });
  });

  it('unwraps a { data } envelope', () => {
    expect(
      normalizeNetworkStats({ data: { totalRounds: 7 } }),
    ).toEqual({ totalRounds: 7, vXlmDistributed: 0, activePlayers: 0 });
  });

  it('coerces numeric strings', () => {
    expect(normalizeNetworkStats({ totalRounds: '42' })?.totalRounds).toBe(42);
  });

  it('returns null when no usable field is present', () => {
    expect(normalizeNetworkStats({})).toBeNull();
    expect(normalizeNetworkStats({ unrelated: 'x' })).toBeNull();
  });
});
