import { useState, useEffect } from 'react';
import ContributorTaskPlaceholder from '../components/ContributorTaskPlaceholder';
import { Spinner } from '../components/ui/Spinner';

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
        <Spinner label="Loading pools" size="lg" />
      </div>
    );
  }

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Pools</h1>
      <p className="mt-2 text-sm text-gray-400">
        Liquidity and round pool transparency across prediction markets.
      </p>
      <ContributorTaskPlaceholder
        className="mt-10"
        title="Rebuild Pools Page"
        issueHint={`Render pool cards for ${(data ?? []).map((p) => p.asset).join(', ')} with volume, UP/DOWN split, precision pool, and yield. Use SVG asset icons and glass-card layout. Mock data is ready in this file.`}
      />
    </main>
  );
}
