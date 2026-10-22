import { useEffect, useState } from 'react';
import { RefreshCw, WifiOff, X } from 'lucide-react';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

const DISMISSED_KEY = 'stellar:offline-banner:dismissed';

function readDismissed(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeDismissed(value: boolean) {
  try {
    if (value) {
      window.localStorage.setItem(DISMISSED_KEY, 'true');
    } else {
      window.localStorage.removeItem(DISMISSED_KEY);
    }
  } catch {
    /* localStorage unavailable */
  }
}

export const OfflineBanner = () => {
  const { isDisconnected, reconnect } = useConnectionStatus();

  if (!isDisconnected) return null;
  return <OfflineAlert reconnect={reconnect} />;
};

function OfflineAlert({ reconnect }: { reconnect: () => void }) {
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    writeDismissed(dismissed);
  }, [dismissed]);

  if (dismissed) return null;

  const handleRetry = () => {
    setDismissed(false);
    reconnect();
  };

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 border-b border-red-400/25 bg-[#0A0F1A]/95 text-white backdrop-blur-xl"
      role="alert"
      aria-live="assertive"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
        <div className="h-8 w-1 shrink-0 rounded-full bg-red-400" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <WifiOff className="h-4 w-4 shrink-0 text-red-300" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-red-200">
              Connection lost
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-300">
              Live updates are paused. Reconnect to resume your session.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1.5 rounded-md border border-red-300/30 bg-red-400/10 px-2.5 py-1.5 text-xs font-semibold text-red-100 transition-colors hover:border-red-300/60 hover:bg-red-400/20 focus:outline-none focus:ring-2 focus:ring-red-300/60"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Retry
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Dismiss connection alert"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
