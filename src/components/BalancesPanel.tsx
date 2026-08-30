import { useCallback, useEffect, useState } from 'react';
import { Coins, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import {
  fetchAccountBalances,
  formatBalance,
  HORIZON_URL,
  type AccountBalances,
} from '../lib/horizon';
import { accountUrl } from '../lib/explorer';
import { useWalletStore } from '../store/useWalletStore';

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

function TrustlineRow({
  code,
  balance,
  issuer,
  isAuthorized,
}: {
  code: string;
  balance: string;
  issuer: string | null;
  isAuthorized: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">
          {code}
          {!isAuthorized && (
            <span className="ml-2 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-400">
              Unauthorized
            </span>
          )}
        </p>
        {issuer && (
          <p className="truncate font-mono text-[11px] text-gray-500">
            {issuer.slice(0, 4)}…{issuer.slice(-4)}
          </p>
        )}
      </div>
      <span className="shrink-0 font-mono text-sm text-gray-300">{formatBalance(balance)}</span>
    </li>
  );
}

/**
 * Compact Horizon balances viewer for the connected wallet.
 *
 * Shows the native XLM balance plus every trustline on the account, reading the
 * Horizon endpoint from env so the panel follows the configured network.
 */
export default function BalancesPanel({ className }: { className?: string }) {
  const publicKey = useWalletStore((s) => s.publicKey);
  const status = useWalletStore((s) => s.status);
  const isConnected = status === 'connected' && Boolean(publicKey);

  /** Address the loaded balances belong to, so a wallet switch never shows stale numbers. */
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [data, setData] = useState<AccountBalances | null>(null);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!publicKey || !isConnected) return;

    const controller = new AbortController();

    const run = async () => {
      setState('loading');
      setError(null);
      try {
        const result = await fetchAccountBalances(publicKey, controller.signal);
        if (controller.signal.aborted) return;
        setData(result);
        setLoadedFor(publicKey);
        setState('loaded');
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : 'Could not load balances.');
        setState('error');
      }
    };

    void run();

    return () => controller.abort();
  }, [publicKey, isConnected, reloadKey]);

  if (!isConnected) return null;

  // Treat data fetched for a different address as not yet loaded.
  const isFresh = loadedFor === publicKey;
  const balances = isFresh ? data : null;
  const viewState: LoadState = state === 'loaded' && !isFresh ? 'loading' : state;
  const hasTrustlines = (balances?.trustlines.length ?? 0) > 0;

  return (
    <section
      className={`glass-card rounded-xl border border-white/10 p-4 ${className ?? ''}`}
      aria-labelledby="balances-panel-heading"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-[#22D3EE]" aria-hidden />
          <h3 id="balances-panel-heading" className="text-sm font-bold text-white">
            Balances
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {publicKey && (
            <a
              href={accountUrl(publicKey)}
              target="_blank"
              rel="noreferrer"
              className="rounded p-1.5 text-gray-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
              aria-label="View account on StellarExpert"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
          <button
            type="button"
            onClick={refresh}
            disabled={viewState === 'loading'}
            className="rounded p-1.5 text-gray-500 transition-colors hover:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
            aria-label="Refresh balances"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${viewState === 'loading' ? 'animate-spin' : ''}`} aria-hidden />
          </button>
        </div>
      </div>

      {viewState === 'loading' && (
        <div className="space-y-2 py-1" aria-busy="true" aria-label="Loading balances">
          <div className="h-8 w-2/3 animate-pulse rounded bg-white/5" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-white/5" />
          <div className="h-4 w-5/12 animate-pulse rounded bg-white/5" />
        </div>
      )}

      {viewState === 'error' && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3" role="alert">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-red-400">Could not load balances</p>
              <p className="mt-1 break-words text-xs text-red-300/80">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-bold text-red-100 transition-colors hover:bg-red-400/10"
          >
            <RefreshCw className="h-3 w-3" aria-hidden />
            Retry
          </button>
        </div>
      )}

      {viewState === 'loaded' && balances?.isUnfunded && (
        <div className="rounded-lg border border-dashed border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="text-sm font-semibold text-gray-300">Account not funded</p>
          <p className="mt-1 text-xs text-gray-500">
            This address does not exist on the network yet. Fund it to see balances.
          </p>
        </div>
      )}

      {viewState === 'loaded' && balances && !balances.isUnfunded && (
        <>
          <div className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">XLM</span>
            <span className="font-mono text-lg font-bold text-white">
              {balances.native ? formatBalance(balances.native.balance) : '0.00'}
            </span>
          </div>

          <div className="mt-3">
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-gray-500">
              Trustlines
            </p>
            {hasTrustlines ? (
              <ul className="divide-y divide-white/5">
                {balances.trustlines.map((line) => (
                  <TrustlineRow
                    key={`${line.code}-${line.issuer ?? 'none'}`}
                    code={line.code}
                    balance={line.balance}
                    issuer={line.issuer}
                    isAuthorized={line.isAuthorized}
                  />
                ))}
              </ul>
            ) : (
              <p className="py-2 text-xs text-gray-500">
                No trustlines yet. Only XLM is held on this account.
              </p>
            )}
          </div>
        </>
      )}

      <p className="mt-3 truncate border-t border-white/5 pt-2 text-[10px] text-gray-600">
        via {HORIZON_URL.replace(/^https?:\/\//, '')}
      </p>
    </section>
  );
}
