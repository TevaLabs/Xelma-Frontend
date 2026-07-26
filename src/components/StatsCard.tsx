// ISSUE: Replace mock stats with live API call to backend /api/stats

import { useState } from 'react';
import type { MockUserStats } from '../types';
import { useWalletStore, selectIsWalletConnected } from '../store/useWalletStore';
import { claim_winnings } from '../lib/xelma-contract';
import { toast } from 'sonner';
import { formatVXLM } from '../lib/utils';
import RankProgressBar from './RankProgressBar';
import PanelHeader from './PanelHeader';

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
  
  const [isClaiming, setIsClaiming] = useState(false);

  const pendingWinnings = stats.pendingWinnings || 0;
  const canClaim = isWalletConnected && pendingWinnings > 0 && !isClaiming;

  const handleClaim = async () => {
    if (!canClaim || !publicKey) return;
    
    try {
      setIsClaiming(true);
      toast.loading('Claiming rewards...', { id: 'claim-rewards' });
      
      const result = await claim_winnings(publicKey);
      
      toast.success(`Successfully claimed rewards! Tx: ${result.txHash.slice(0, 8)}...`, { id: 'claim-rewards' });
      
      // Refresh wallet balance/state
      await checkConnection();
    } catch (error) {
      console.error('Claim failed:', error);
      const msg = error instanceof Error ? error.message : 'Failed to claim rewards.';
      toast.error(msg, { id: 'claim-rewards' });
    } finally {
      setIsClaiming(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="glass-card rounded-2xl p-5" aria-labelledby="your-stats-title" aria-busy="true">
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
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="glass-card rounded-2xl p-5" aria-labelledby="your-stats-title">
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
      </section>
    );
  }

  return (
    <section className="glass-card rounded-2xl p-5" aria-labelledby="your-stats-title">
      <PanelHeader title="Your Record" />

      <dl className="mt-5 space-y-4">
        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-400">Practice Balance</dt>
          <dd className="text-lg font-bold text-cyan-300">
            {formatVXLM(stats.balance)}
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
            <dd className="font-mono text-sm font-bold text-amber-300">
              {pendingWinnings.toLocaleString()} vXLM
            </dd>
          </div>
        )}
      </dl>

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
        {isClaiming ? 'Claiming...' : 'Claim Rewards'}
      </button>
      <p className="mt-2 text-center text-xs text-gray-400">
        {!isWalletConnected ? "Connect wallet to claim" : pendingWinnings === 0 ? "No pending rewards" : "Ready to claim"}
      </p>
    </section>
  );
}
