import { useState } from 'react';
import { RefreshCw, WifiOff, X } from 'lucide-react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

export const OfflineBanner = () => {
  const { isDisconnected, reconnect } = useConnectionStatus();

  if (!isDisconnected) return null;
  return <OfflineAlert reconnect={reconnect} />;
};

function OfflineAlert({ reconnect }: { reconnect: () => void }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 border-b border-red-400/30 bg-[#0A0F1A]/95 text-white shadow-lg shadow-black/30 backdrop-blur-xl"
      role="alert"
      aria-live="assertive"
      data-testid="offline-banner"
    >
      <div className="mx-auto flex h-11 max-w-7xl items-center gap-3 px-4">
        <WifiOff className="h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
        <p className="min-w-0 flex-1 truncate font-mono text-xs tracking-wide text-slate-300">
          <span className="font-semibold uppercase text-red-200">Connection lost</span>
          <span aria-hidden="true"> — </span>
          Live updates are paused. Reconnect to resume.
        </p>
        <button
          type="button"
          onClick={reconnect}
          className="inline-flex shrink-0 items-center gap-1.5 rounded border border-red-300/30 bg-red-400/10 px-2.5 py-1 text-xs font-semibold text-red-100 transition-colors hover:border-red-300/60 hover:bg-red-400/20 focus:outline-none focus:ring-2 focus:ring-red-300/60"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Reconnect
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Dismiss connection alert"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
