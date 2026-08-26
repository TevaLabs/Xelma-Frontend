import { useState, useEffect } from 'react';
import { AssetIcon } from '../components/icons';

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

/**
 * STUBBED for contributor rebuild — mock data + loading kept.
 * Rebuild full pools transparency UI with SVG icons (no emoji) and glass cards.
 */
export default function Pools() {
  const [data, setData] = useState<PoolStats[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(mockPoolData);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-[#2C4BFD] border-t-transparent"
          aria-label="Loading pools"
        />
      </div>
    );
  }

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Liquidity Pools</h1>
        <p className="mt-2 text-gray-400">Transparency and historical stats for all active round pools.</p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data?.map((pool) => <PoolCard key={pool.asset} pool={pool} />)}
      </div>
    </main>
  );
}

function PoolCard({ pool }: { pool: PoolStats }) {
  const upPercent = Math.round((pool.upDownPool.up / pool.upDownPool.total) * 100);
  const downPercent = 100 - upPercent;

  return (
    <article className="glass-card rounded-2xl p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2C4BFD]/15 text-[#BEC7FE]">
          <AssetIcon asset={pool.asset} size={20} />
        </span>
        <h2 className="text-xl font-bold text-white">{pool.asset} Pool</h2>
      </div>

      <div className="mb-5">
        <p className="text-sm text-gray-400">Total Volume</p>
        <p className="text-2xl font-bold text-white">
          {pool.totalVolume.toLocaleString()} <span className="text-sm font-normal text-gray-500">vXLM</span>
        </p>
      </div>

      <div className="space-y-4">
        <section className="rounded-xl bg-white/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-300">UP/DOWN Pool</h3>
          <p className="mb-2 text-lg font-bold text-[#BEC7FE]">
            {pool.upDownPool.total.toLocaleString()} <span className="text-xs font-normal text-gray-500">vXLM</span>
          </p>
          <div className="flex h-2 overflow-hidden rounded-full bg-slate-800">
            <span className="bg-cyan-400" style={{ width: `${upPercent}%` }} />
            <span className="bg-amber-400" style={{ width: `${downPercent}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-xs">
            <span className="text-cyan-300">UP {upPercent}%</span>
            <span className="text-amber-300">DOWN {downPercent}%</span>
          </div>
        </section>
        <section className="rounded-xl bg-white/5 p-4">
          <h3 className="mb-2 text-sm font-semibold text-gray-300">Precision Pool</h3>
          <p className="text-lg font-bold text-cyan-300">
            {pool.precisionPool.total.toLocaleString()} <span className="text-xs font-normal text-gray-500">vXLM</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">{pool.precisionPool.predictions} predictions</p>
        </section>
        <section className="rounded-xl border border-white/5 p-4">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Historical Yield</h3>
          <p className="text-lg font-bold text-cyan-300">+{pool.historicalYield}% <span className="text-xs font-normal text-gray-500">avg/round</span></p>
        </section>
      </div>
    </article>
  );
}
