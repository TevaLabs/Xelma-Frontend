import type { PoolStats } from '../../../lib/api-client';

/**
 * Fixture data for the pools endpoint (`/api/pools`).
 * Matches the `PoolStats` shape consumed by the Pools page.
 */
export const mockPools: PoolStats[] = [
  {
    asset: 'BTC',
    totalVolume: 1250000,
    upDownPool: { total: 850000, up: 450000, down: 400000 },
    precisionPool: { total: 400000, predictions: 124 },
    historicalYield: 4.2,
  },
  {
    asset: 'ETH',
    totalVolume: 820000,
    upDownPool: { total: 600000, up: 350000, down: 250000 },
    precisionPool: { total: 220000, predictions: 89 },
    historicalYield: 3.8,
  },
  {
    asset: 'XLM',
    totalVolume: 450000,
    upDownPool: { total: 300000, up: 100000, down: 200000 },
    precisionPool: { total: 150000, predictions: 45 },
    historicalYield: 5.1,
  },
];
