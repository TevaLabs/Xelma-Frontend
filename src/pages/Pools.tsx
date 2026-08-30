import { useCallback, useEffect, useState } from 'react';
import { ArrowUp, ArrowDown, Target, TrendingUp, RefreshCw } from 'lucide-react';
import { AssetIcon } from '../components/icons';
import EmptyState from '../components/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import Sparkline from '../components/Sparkline';
import { getTrendLabel } from '../components/Sparkline.helpers';
import { formatCompactNumber } from '../lib/utils';

type PoolAsset = 'BTC' | 'ETH' | 'XLM';

interface PoolStats {
  asset: PoolAsset;
  totalVolume: number;
  /** Mock recent-volume series, oldest first, last point matches totalVolume. */
  volumeTrend: number[];
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
    volumeTrend: [980000, 1010000, 1040000, 1120000, 1180000, 1210000, 1250000],
    upDownPool: { total: 850000, up: 450000, down: 400000 },
    precisionPool: { total: 400000, predictions: 124 },
    historicalYield: 4.2,
  },
  {
    asset: 'ETH',
    totalVolume: 820000,
    volumeTrend: [860000, 840000, 800000, 780000, 795000, 810000, 820000],
    upDownPool: { total: 600000, up: 350000, down: 250000 },
    precisionPool: { total: 220000, predictions: 89 },
    historicalYield: 3.8,
  },
  {
    asset: 'XLM',
    totalVolume: 450000,
    volumeTrend: [520000, 500000, 480000, 470000, 460000, 455000, 450000],
    upDownPool: { total: 300000, up: 100000, down: 200000 },
    precisionPool: { total: 150000, predictions: 45 },
    historicalYield: 5.1,
  },
];

/**
 * Stand-in for a real `/pools` API call. Kept as a promise-returning function
 * (rather than inlining the timeout in the effect) so the loading/error
 * states below are structured the same way they'd be once this is wired to
 * a real endpoint — swap this one function out and the rest of the page
 * keeps working.
 */
function fetchPoolStats(signal: AbortSignal): Promise<PoolStats[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(mockPoolData), 800);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}

function AssetBadge({ asset }: { asset: PoolAsset }) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-[#BEC7FE]"
      aria-hidden
    >
      <AssetIcon asset={asset} size={22} />
    </span>
  );
}

function VolumeStat({
  label,
  value,
  trendPoints,
  trendLabel,
}: {
  label: string;
  value: number;
  trendPoints: number[];
  trendLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-white tabular-nums">
            {formatCompactNumber(value)}
          </span>
          <span className="text-xs font-bold uppercase tracking-wide text-gray-400">vXLM</span>
        </p>
      </div>
      <Sparkline points={trendPoints} label={trendLabel} className="shrink-0 text-[#22D3EE]" />
    </div>
  );
}

function UpDownSplit({ up, down }: { up: number; down: number }) {
  const total = up + down;
  const upPct = total > 0 ? Math.round((up / total) * 100) : 50;
  const downPct = 100 - upPct;

  return (
    <div>
      <h3 className="text-sm font-bold text-white">UP/DOWN Pool</h3>
      <div
        className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-white/5"
        role="img"
        aria-label={`Split: ${upPct}% UP, ${downPct}% DOWN`}
      >
        <div className="bg-emerald-400" style={{ width: `${upPct}%` }} />
        <div className="bg-rose-400" style={{ width: `${downPct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs font-semibold">
        <span className="inline-flex items-center gap-1 text-emerald-400">
          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
          UP {upPct}%
        </span>
        <span className="inline-flex items-center gap-1 text-rose-400">
          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
          DOWN {downPct}%
        </span>
      </div>
    </div>
  );
}

function PoolCard({ pool }: { pool: PoolStats }) {
  const headingId = `pool-heading-${pool.asset}`;

  return (
    <article
      aria-labelledby={headingId}
      className="glass-card flex flex-col gap-5 rounded-2xl border border-white/10 p-6 sm:p-7"
    >
      <header className="flex items-center gap-3">
        <AssetBadge asset={pool.asset} />
        <h2 id={headingId} className="text-lg font-bold text-white">
          {pool.asset} Pool
        </h2>
      </header>

      <VolumeStat
        label="Total volume"
        value={pool.totalVolume}
        trendPoints={pool.volumeTrend}
        trendLabel={getTrendLabel(`${pool.asset} total volume`, pool.volumeTrend)}
      />

      <UpDownSplit up={pool.upDownPool.up} down={pool.upDownPool.down} />

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
          <Target className="h-4 w-4 text-[#22D3EE]" aria-hidden />
          Precision Pool
        </h3>
        <p className="mt-2 flex items-baseline gap-1.5">
          <span className="text-lg font-black text-white tabular-nums">
            {formatCompactNumber(pool.precisionPool.total)}
          </span>
          <span className="text-xs font-bold uppercase tracking-wide text-gray-400">vXLM</span>
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          {pool.precisionPool.predictions.toLocaleString()} predictions
        </p>
      </div>

      <div>
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
          <TrendingUp className="h-4 w-4 text-emerald-400" aria-hidden />
          Historical Yield
        </h3>
        <p className="mt-2 text-lg font-black text-emerald-400 tabular-nums">
          +{pool.historicalYield.toFixed(1)}%
        </p>
      </div>
    </article>
  );
}

export default function Pools() {
  const [data, setData] = useState<PoolStats[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setError(null);

    fetchPoolStats(controller.signal)
      .then((result) => setData(result))
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load pools');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [reloadToken]);

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Liquidity Pools</h1>
      <p className="mt-2 text-sm text-gray-400">
        Transparency and historical stats for all active round pools.
      </p>

      {isLoading && (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Spinner label="Loading pools" size="lg" />
        </div>
      )}

      {!isLoading && error && (
        <EmptyState
          className="mt-10"
          title="Couldn't load pools"
          description={error}
          action={
            <button
              type="button"
              onClick={reload}
              className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Retry
            </button>
          }
        />
      )}

      {!isLoading && !error && data && data.length === 0 && (
        <EmptyState
          className="mt-10"
          title="No pools available"
          description="There are no active round pools right now. Check back once a round opens."
        />
      )}

      {!isLoading && !error && data && data.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((pool) => (
            <PoolCard key={pool.asset} pool={pool} />
          ))}
        </div>
      )}
    </main>
  );
}
