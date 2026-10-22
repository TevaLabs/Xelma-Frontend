import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Crosshair, RefreshCw, TrendingUp } from 'lucide-react';
import { AssetIcon } from '../components/icons';
import EmptyState from '../components/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import Sparkline from '../components/Sparkline';
import { getTrendLabel } from '../components/Sparkline.helpers';
import { formatCompactNumber } from '../lib/utils';
import { poolsApi, type PoolAsset, type PoolStats } from '../lib/api-client';

function AssetBadge({ asset, size = 44 }: { asset: PoolAsset; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#BEC7FE]"
      style={{ height: size, width: size }}
      aria-hidden
    >
      <AssetIcon asset={asset} size={Math.round(size / 1.9)} />
    </span>
  );
}

function formatPoolAmount(value: number): string {
  return `${formatCompactNumber(value)} vXLM`;
}

function PoolDetail({ pool, isTopYield }: { pool: PoolStats; isTopYield: boolean }) {
  const headingId = `pool-heading-${pool.asset}`;
  const upDownAmount = pool.upDownPool.total;
  const precisionAmount = pool.precisionPool.total;
  const totalPool = upDownAmount + precisionAmount || pool.totalVolume;

  const percentOfPool = (value: number) =>
    totalPool > 0 ? (value / totalPool) * 100 : 0;

  const upDownShare = percentOfPool(upDownAmount);
  const precisionShare = 100 - upDownShare;

  const upPctOfMode =
    upDownAmount > 0 ? Math.round((pool.upDownPool.up / upDownAmount) * 100) : 50;
  const downPctOfMode = 100 - upPctOfMode;

  const averagePrecisionStake =
    pool.precisionPool.predictions > 0
      ? precisionAmount / pool.precisionPool.predictions
      : 0;

  return (
    <article
      aria-labelledby={headingId}
      className="glass-card relative overflow-hidden rounded-2xl border border-white/10 p-6 sm:p-8"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-xelma-teal-bright/50 to-transparent"
      />

      <header className="flex flex-wrap items-center gap-4">
        <AssetBadge asset={pool.asset} />
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-xelma-teal-bright/80">
            Pool transparency
          </p>
          <h2 id={headingId} className="mt-1 text-2xl font-bold text-white">
            {pool.asset} Pool
          </h2>
        </div>
        <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
          <span className="status-dot status-dot-green" aria-hidden="true" />
          Round pools
        </span>
      </header>

      <section aria-label={`${pool.asset} total volume`} className="mt-7">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Total volume
            </p>
            <p className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-black tabular-nums text-white">
                {formatCompactNumber(pool.totalVolume)}
              </span>
              <span className="text-xs font-bold uppercase tracking-wide text-gray-400">
                vXLM
              </span>
            </p>
          </div>
          <Sparkline
            points={pool.volumeTrend}
            label={getTrendLabel(`${pool.asset} total volume`, pool.volumeTrend)}
            width={96}
            height={32}
            className="shrink-0 text-[#22D3EE]"
          />
        </div>
        <p className="mt-2 font-mono text-[11px] text-gray-500">
          {getTrendLabel(`${pool.asset} total volume`, pool.volumeTrend)}
        </p>
      </section>

      <section aria-label={`${pool.asset} pool allocation`} className="mt-7">
        <h3 className="text-sm font-bold text-white">UP/DOWN vs Precision</h3>
        <div
          className="mt-3 flex h-3 overflow-hidden rounded-full border border-white/5 bg-white/5"
          role="img"
          aria-label={`Allocation: ${Math.round(upDownShare)}% UP/DOWN pool, ${Math.round(
            precisionShare,
          )}% precision pool`}
        >
          <div
            className="bg-gradient-to-r from-xelma-blue to-xelma-blue/70"
            style={{ width: `${upDownShare}%` }}
          />
          <div
            className="bg-gradient-to-r from-xelma-teal to-xelma-teal-bright"
            style={{ width: `${precisionShare}%` }}
          />
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <dt className="flex items-center gap-1.5 text-gray-400">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full bg-xelma-blue"
              />
              UP/DOWN pool
            </dt>
            <dd className="mt-1 font-mono font-semibold text-white">
              {formatPoolAmount(upDownAmount)}
              <span className="ml-1.5 text-gray-500">{Math.round(upDownShare)}%</span>
            </dd>
          </div>
          <div className="text-right">
            <dt className="flex items-center justify-end gap-1.5 text-gray-400">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full bg-xelma-teal-bright"
              />
              Precision pool
            </dt>
            <dd className="mt-1 font-mono font-semibold text-white">
              {formatPoolAmount(precisionAmount)}
              <span className="ml-1.5 text-gray-500">{Math.round(precisionShare)}%</span>
            </dd>
          </div>
        </dl>
      </section>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <section
          aria-label={`${pool.asset} UP/DOWN pool`}
          className="rounded-xl border border-white/10 bg-black/30 p-4"
        >
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
            <TrendingUp className="h-4 w-4 text-emerald-400" aria-hidden />
            UP/DOWN Pool
          </h3>
          <div
            className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/5"
            role="img"
            aria-label={`UP/DOWN split: ${upPctOfMode}% UP, ${downPctOfMode}% DOWN`}
          >
            <div className="bg-emerald-400" style={{ width: `${upPctOfMode}%` }} />
            <div className="bg-rose-400" style={{ width: `${downPctOfMode}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between font-mono text-[11px] font-semibold">
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <ArrowUp className="h-3.5 w-3.5" aria-hidden />
              UP {upPctOfMode}%
            </span>
            <span className="inline-flex items-center gap-1 text-rose-400">
              <ArrowDown className="h-3.5 w-3.5" aria-hidden />
              DOWN {downPctOfMode}%
            </span>
          </div>
          <dl className="mt-3 space-y-1 border-t border-white/5 pt-3 font-mono text-[11px]">
            <div className="flex items-center justify-between text-gray-400">
              <dt>UP stake</dt>
              <dd className="text-emerald-300">{formatPoolAmount(pool.upDownPool.up)}</dd>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <dt>DOWN stake</dt>
              <dd className="text-rose-300">{formatPoolAmount(pool.upDownPool.down)}</dd>
            </div>
          </dl>
        </section>

        <section
          aria-label={`${pool.asset} precision pool`}
          className="rounded-xl border border-white/10 bg-black/30 p-4"
        >
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-white">
            <Crosshair className="h-4 w-4 text-xelma-teal-bright" aria-hidden />
            Precision Pool
          </h3>
          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-black tabular-nums text-white">
              {formatCompactNumber(precisionAmount)}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
              vXLM
            </span>
          </p>
          <dl className="mt-3 space-y-1 border-t border-white/5 pt-3 font-mono text-[11px]">
            <div className="flex items-center justify-between text-gray-400">
              <dt>Predictions</dt>
              <dd className="text-white">
                {pool.precisionPool.predictions.toLocaleString()}
              </dd>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <dt>Avg. stake</dt>
              <dd className="text-white">{formatPoolAmount(averagePrecisionStake)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section
        aria-label={`${pool.asset} yield callout`}
        className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
            aria-hidden
          >
            <TrendingUp className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-white">Historical Yield</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              Net payout returned to winning predictors across past rounds.
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {isTopYield && (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
              Highest this cycle
            </span>
          )}
          <p className="font-mono text-2xl font-black tabular-nums text-emerald-300">
            +{pool.historicalYield.toFixed(1)}%
          </p>
        </div>
      </section>
    </article>
  );
}

export default function Pools() {
  const [data, setData] = useState<PoolStats[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedAsset, setSelectedAsset] = useState<PoolAsset | null>(null);
  const tabRefs = useRef<Partial<Record<PoolAsset, HTMLButtonElement | null>>>({});

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  useEffect(() => {
    const controller = new AbortController();

    setIsLoading(true);
    setError(null);

    poolsApi
      .getPools(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Failed to load pools');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [reloadToken]);

  const activeAsset =
    selectedAsset && data?.some((pool) => pool.asset === selectedAsset)
      ? selectedAsset
      : data?.[0]?.asset ?? null;
  const activePool = data?.find((pool) => pool.asset === activeAsset) ?? null;
  const topYield = data?.length
    ? Math.max(...data.map((pool) => pool.historicalYield))
    : null;

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!data?.length) return;

    const lastIndex = data.length - 1;
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1;
    if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = lastIndex;

    if (nextIndex === null) return;

    event.preventDefault();
    const nextAsset = data[nextIndex].asset;
    setSelectedAsset(nextAsset);
    tabRefs.current[nextAsset]?.focus();
  };

  const hasData = Boolean(data && data.length > 0);

  return (
    <main id="main-content" className="xelma-grid-bg min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-xelma-teal-bright/80">
          Transparency
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white">Liquidity Pools</h1>
            <p className="mt-2 text-sm text-gray-400">
              Transparency and historical stats for all active round pools.
            </p>
          </div>
          {hasData && (
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              {data?.length} assets tracked
            </span>
          )}
        </div>

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

        {!isLoading && !error && activePool && (
          <>
            <div
              role="tablist"
              aria-label="Pool assets"
              className="mt-8 flex flex-wrap gap-2"
            >
              {data?.map((pool, index) => {
                const isActive = pool.asset === activePool.asset;

                return (
                  <button
                    key={pool.asset}
                    ref={(node) => {
                      tabRefs.current[pool.asset] = node;
                    }}
                    type="button"
                    role="tab"
                    id={`pool-tab-${pool.asset}`}
                    aria-selected={isActive}
                    aria-controls={`pool-panel-${pool.asset}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setSelectedAsset(pool.asset)}
                    onKeyDown={(event) => handleTabKeyDown(event, index)}
                    className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xelma-teal-bright focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A] ${
                      isActive
                        ? 'border-xelma-blue/60 bg-xelma-blue/15 text-white shadow-[0_0_20px_rgba(44,75,253,0.25)]'
                        : 'border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span aria-hidden="true" className="text-[#BEC7FE]">
                      <AssetIcon asset={pool.asset} size={18} />
                    </span>
                    {pool.asset}
                    <span
                      className={`font-mono text-[10px] font-semibold uppercase tracking-wide ${
                        isActive ? 'text-xelma-teal-bright' : 'text-gray-500'
                      }`}
                    >
                      {formatCompactNumber(pool.totalVolume)}
                    </span>
                  </button>
                );
              })}
            </div>

            <div
              key={activePool.asset}
              role="tabpanel"
              id={`pool-panel-${activePool.asset}`}
              aria-labelledby={`pool-tab-${activePool.asset}`}
              tabIndex={0}
              className="mt-6 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xelma-teal-bright focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
            >
              <PoolDetail
                pool={activePool}
                isTopYield={topYield !== null && activePool.historicalYield === topYield}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
