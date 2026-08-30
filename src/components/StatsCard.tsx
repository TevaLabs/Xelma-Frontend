// ISSUE: Replace mock stats with live API call to backend /api/stats

import type { MockUserStats } from '../types';
import { useWalletStore, selectIsWalletConnected } from '../store/useWalletStore';
import { claim_winnings } from '../lib/xelma-contract';
import { formatVXLM } from '../lib/utils';
import RankProgressBar from './RankProgressBar';
import PanelHeader from './ui/PanelHeader';
import GlassCard from './ui/GlassCard';
import TxStatusTimeline, { useTxStatusMachine } from './TxStatusTimeline';
import MaskedBalance from './MaskedBalance';

interface StatsCardProps {
  stats: MockUserStats;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export default function StatsCard({ stats, isLoading, error, onRetry }: StatsCardProps) {
  const isWalletConnected = useWalletStore(selectIsWalletConnected);
  const publicKey = useWalletStore((s) => s.publicKey);
  const checkConnection = useWalletStore((s) => s.checkConnection);

  // Shared transaction status machine (preparing → signing → submitting)
  const tx = useTxStatusMachine();

  const pendingWinnings = stats.pendingWinnings || 0;
  const canClaim = isWalletConnected && pendingWinnings > 0 && !tx.isInFlight;

  const handleClaim = async () => {
    // Guard against double-submits while a claim is already in-flight.
    if (!canClaim || !publicKey || !tx.start()) return;

    try {
      const result = await claim_winnings(publicKey, tx.updateStatus);
      tx.succeed(result.txHash);

      // Refresh wallet balance/state
      await checkConnection();
    } catch (error) {
      console.error('Claim failed:', error);
      const msg = error instanceof Error ? error.message : 'Failed to claim rewards.';
      tx.fail(msg);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <GlassCard as="section" className="rounded-2xl p-5" aria-labelledby="your-stats-title" aria-busy="true">
        <h2 id="your-stats-title" className="text-lg font-bold text-white animate-pulse">
          Your Record
        </h2>
        <span className="sr-only">Loading user statistics...</span>
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between animate-pulse">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-5 w-20 rounded bg-white/10" />
          </div>
          <div className="flex items-center justify-between animate-pulse">
            <div className="h-4 w-28 rounded bg-white/10" />
            <div className="h-5 w-16 rounded bg-white/10" />
          </div>
          <div className="flex items-center justify-between animate-pulse">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-5 w-12 rounded bg-white/10" />
          </div>
          <div className="border-t border-white/10 pt-4 space-y-2 animate-pulse">
            <div className="h-3 w-16 rounded bg-white/10" />
            <div className="h-2 w-full rounded bg-white/10" />
          </div>
          <div className="h-11 w-full rounded-xl bg-white/5 border border-white/5 animate-pulse mt-6" />
        </div>
      </GlassCard>
    );
  }

  // Error state
  if (error) {
    return (
      <GlassCard as="section" className="rounded-2xl p-5" aria-labelledby="your-stats-title">
        <p className="text-red-500 mb-2">{error}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 w-full rounded-xl border py-2 text-sm font-semibold text-red-200 bg-red-500/20 border-red-400/50 hover:bg-red-500/30"
          >
            Retry
          </button>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard as="section" className="rounded-2xl p-5" aria-labelledby="your-stats-title">
      <PanelHeader title="Your Record" />

      <dl className="mt-5 space-y-4">
        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-400">Practice Balance</dt>
          <dd>
            <MaskedBalance
              value={formatVXLM(stats.balance)}
              label="Practice balance"
              className="text-lg font-bold text-cyan-300"
            />
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-400">Accuracy Streak</dt>
          <dd className="text-lg font-bold text-[#BEC7FE]">{stats.currentStreak} rounds</dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-400">Correct / Incorrect</dt>
          <dd className="font-semibold text-white">
            <span className="text-green-400">{stats.totalWins}</span>
            <span className="text-gray-500"> / </span>
            <span className="text-rose-400">{stats.totalLosses}</span>
          </dd>
        </div>

        <div className="border-t border-white/10 pt-4">
          <RankProgressBar xp={stats.xp} />
        </div>
        
        {pendingWinnings > 0 && (
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <dt className="text-sm text-gray-400 text-amber-200">Pending Winnings</dt>
            <dd>
              <MaskedBalance
                value={`${pendingWinnings.toLocaleString()} vXLM`}
                label="Pending winnings"
                className="font-mono text-sm font-bold text-amber-300"
              />
            </dd>
          </div>
        )}
      </dl>

      {tx.step === 'idle' ? (
        <>
          <button
            type="button"
            disabled={!canClaim}
            onClick={handleClaim}
            title={!isWalletConnected ? "Connect wallet to claim" : pendingWinnings === 0 ? "No pending rewards" : "Claim your rewards"}
            className={`mt-6 w-full rounded-xl border py-3 text-sm font-semibold transition-colors
              ${canClaim 
                ? 'border-amber-400/50 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30' 
                : 'cursor-not-allowed border-white/10 bg-white/5 text-gray-500'}`}
          >
            Claim Rewards
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">
            {!isWalletConnected ? "Connect wallet to claim" : pendingWinnings === 0 ? "No pending rewards" : "Ready to claim"}
          </p>
        </>
      ) : (
        <div className="mt-6">
          <TxStatusTimeline
            step={tx.step}
            txHash={tx.txHash}
            errorMessage={tx.errorMessage}
            successTitle="Rewards Claimed!"
            successMessage="Your pending winnings have been claimed on-chain."
            stepCopy={{
              preparing: 'Preparing Claim...',
              submitting: 'Submitting Claim to Network...',
              syncing: 'Syncing Claim to Backend...',
            }}
            onRetry={handleClaim}
            onDone={tx.reset}
          />
        </div>
      )}
    </GlassCard>
  );
}
