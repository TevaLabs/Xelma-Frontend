import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Check, Copy, Share2, Trophy, TrendingUp, Activity, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import IdenticonAvatar from '../components/IdenticonAvatar';

export default function PublicProfile() {
  const { handle = 'player' } = useParams<{ handle: string }>();
  const [copied, setCopied] = useState(false);

  const cleanHandle = handle.replace(/^@+/, '') || 'player';
  const displayName = cleanHandle.charAt(0).toUpperCase() + cleanHandle.slice(1);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Profile URL copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <main
      id="main-content"
      className="xelma-grid-bg flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-16 sm:px-6 lg:px-8"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-[#2C4BFD]/8 blur-3xl" />
      </div>

      <div className="relative flex w-full max-w-md flex-col items-center text-center">
        {/* Profile Card Container */}
        <div
          data-testid="public-profile-card"
          className="glass-card relative w-full overflow-hidden rounded-2xl border border-[#BEC7FE]/15 bg-[#0D1527]/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          {/* Top Decorative Banner */}
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-cyan-400 via-[#2C4BFD] to-indigo-500" />

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-3 py-1 text-xs font-bold text-cyan-300">
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            Public Trader Card
          </div>

          {/* Avatar & Identity */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-2xl border-2 border-[#2C4BFD]/40 bg-[#111827] shadow-lg shadow-[#2C4BFD]/20">
              <IdenticonAvatar name={cleanHandle} className="h-full w-full" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              {displayName}
            </h1>
            <p data-testid="profile-handle" className="mt-1 text-sm font-semibold text-cyan-400">
              @{cleanHandle}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Xelma Prediction Market Trader &bull; Stellar Testnet
            </p>
          </div>

          {/* Mock Stats Grid */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-y border-white/10 py-5">
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                <TrendingUp className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                Win Rate
              </span>
              <span className="mt-1 text-base font-bold text-emerald-400">68.4%</span>
            </div>
            <div className="flex flex-col items-center border-x border-white/10">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                <Activity className="h-3 w-3 text-cyan-400" aria-hidden="true" />
                Rounds
              </span>
              <span className="mt-1 text-base font-bold text-white">142</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                <Trophy className="h-3 w-3 text-yellow-400" aria-hidden="true" />
                Rank
              </span>
              <span className="mt-1 text-base font-bold text-yellow-400">Top 5%</span>
            </div>
          </div>

          {/* Action: Copy URL Button */}
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              data-testid="copy-profile-url"
              onClick={handleCopyUrl}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-lg transition-transform hover:scale-[1.02]"
              aria-label="Copy profile URL"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                  <span>URL Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  <span>Copy Profile Link</span>
                </>
              )}
            </button>

            <Link
              to="/dashboard"
              className="btn-ghost flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-gray-300 hover:text-white"
            >
              <span>Trade on Xelma Terminal</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
