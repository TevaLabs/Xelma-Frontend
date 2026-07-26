import { useState, useEffect } from 'react';
import { TRANSITION } from '../utils/motion';

// Typed mock data
type PoolAsset = 'BTC' | 'ETH' | 'XLM';

interface PoolStats {
  asset: PoolAsset;
  totalVolume: number;
  upDownPool: {
    total: number;
    up: number;
    down: number;
  };
  precisionPool: {
    total: number;
    predictions: number;
  };
  historicalYield: number;
}

const mockPoolData: PoolStats[] = [
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

const ASSET_ICONS: Record<string, string> = {
  BTC: '₿',
  ETH: 'Ξ',
  XLM: '✦',
};

export default function Pools() {
  const [data, setData] = useState<PoolStats[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Simulate successful fetch
      setData(mockPoolData);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#2C4BFD] border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 text-center text-rose-400">
          <p className="text-lg font-bold">{error}</p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition-colors"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="glass-card rounded-2xl p-8 text-center text-gray-400">
          <p className="text-lg">No active pools found.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Liquidity Pools</h1>
        <p className="mt-2 text-gray-400">
          Transparency and historical stats for all active round pools.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.map((pool) => (
          <PoolCard key={pool.asset} pool={pool} />
        ))}
      </div>
    </main>
  );
}

function PoolCard({ pool }: { pool: PoolStats }) {
  const upPct =
    pool.upDownPool.total > 0
      ? Math.round((pool.upDownPool.up / pool.upDownPool.total) * 100)
      : 0;
  const downPct = pool.upDownPool.total > 0 ? 100 - upPct : 0;

  return (
    <article className={`glass-card rounded-2xl p-6 ${TRANSITION}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2C4BFD]/15 text-lg font-bold text-[#BEC7FE]">
            {ASSET_ICONS[pool.asset] || '?'}
          </span>
          <h2 className="text-xl font-bold text-white">{pool.asset} Pool</h2>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm font-medium text-gray-400">Total Volume</p>
        <p className="text-2xl font-bold text-white">
          {pool.totalVolume.toLocaleString()} <span className="text-sm font-normal text-gray-500">vXLM</span>
        </p>
      </div>

      <div className="space-y-4">
        {/* UP/DOWN Pool */}
        <div className="rounded-xl bg-white/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-300">UP/DOWN Pool</h3>
          <p className="mb-2 text-lg font-bold text-[#BEC7FE]">
            {pool.upDownPool.total.toLocaleString()} <span className="text-xs font-normal text-gray-500">vXLM</span>
          </p>
          <div className="flex h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="bg-[#2C4BFD] transition-all"
              style={{ width: `${upPct}%` }}
              title={`UP ${upPct}%`}
            />
            <div
              className="bg-rose-500 transition-all"
              style={{ width: `${downPct}%` }}
              title={`DOWN ${downPct}%`}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs font-medium">
            <span className="text-[#BEC7FE]">UP {upPct}%</span>
            <span className="text-rose-400">DOWN {downPct}%</span>
          </div>
        </div>

        {/* Precision Pool */}
        <div className="rounded-xl bg-white/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-300">Precision Pool</h3>
          <div className="flex items-end justify-between">
            <p className="text-lg font-bold text-cyan-300">
              {pool.precisionPool.total.toLocaleString()} <span className="text-xs font-normal text-gray-500">vXLM</span>
            </p>
            <p className="text-xs text-gray-400">{pool.precisionPool.predictions} predictions</p>
          </div>
        </div>

        {/* Historical Stats */}
        <div className="rounded-xl border border-white/5 bg-transparent p-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Historical Yield
          </h3>
          <p className="text-lg font-bold text-emerald-400">
            +{pool.historicalYield}% <span className="text-xs font-normal text-gray-500">avg/round</span>
          </p>
        </div>
      </div>
    </article>
  );
}
