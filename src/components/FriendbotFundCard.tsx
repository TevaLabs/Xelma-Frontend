import { useState } from 'react';
import { Droplets, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  FRIENDBOT_ENABLED,
  LOW_BALANCE_THRESHOLD_XLM,
  friendbotUrl,
  fundWithFriendbot,
} from '../lib/friendbot';
import { useWalletStore, selectNeedsFunding, parseXlmBalance } from '../store/useWalletStore';

/**
 * Testnet-only faucet prompt.
 *
 * An unfunded account cannot pay Soroban fees, so a new tester gets stuck at the
 * first prediction with no explanation. This card appears only on testnet, only
 * while connected, and only while the native balance is under
 * `LOW_BALANCE_THRESHOLD_XLM` — it disappears on its own once funding lands.
 */
export default function FriendbotFundCard({ className }: { className?: string }) {
  const publicKey = useWalletStore((s) => s.publicKey);
  const balance = useWalletStore((s) => s.balance);
  const needsFunding = useWalletStore(selectNeedsFunding);
  const refreshBalance = useWalletStore((s) => s.refreshBalance);
  const [isFunding, setIsFunding] = useState(false);

  if (!FRIENDBOT_ENABLED || !needsFunding || !publicKey) return null;

  const xlm = parseXlmBalance(balance) ?? 0;

  const handleFund = async () => {
    setIsFunding(true);
    try {
      await fundWithFriendbot(publicKey);
      toast.success('Testnet account funded. Friendbot topped up your XLM balance.');
      await refreshBalance();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Friendbot funding failed. Try again.');
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <section
      className={`rounded-xl border border-amber-500/30 bg-amber-500/[0.07] p-4 ${className ?? ''}`}
      aria-labelledby="friendbot-fund-heading"
      data-testid="friendbot-fund-card"
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300"
          aria-hidden
        >
          <Droplets className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 id="friendbot-fund-heading" className="text-sm font-bold text-white">
            Fund this testnet account
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
            This wallet holds{' '}
            <span className="font-mono font-semibold text-amber-200">{xlm.toFixed(2)} XLM</span> —
            below the {LOW_BALANCE_THRESHOLD_XLM} XLM needed to cover Soroban transaction fees.
            Friendbot funds testnet accounts for free.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleFund()}
              disabled={isFunding}
              aria-busy={isFunding}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-[#1A1206] transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              {isFunding ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  Funding…
                </>
              ) : (
                <>
                  <Droplets className="h-3.5 w-3.5" aria-hidden />
                  Fund with Friendbot
                </>
              )}
            </button>

            <a
              href={friendbotUrl(publicKey)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-amber-400/30 px-3 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              Open Friendbot
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
