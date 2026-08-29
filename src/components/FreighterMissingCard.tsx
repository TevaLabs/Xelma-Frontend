import { Download, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { useWalletStore } from '../store/useWalletStore';

export const FREIGHTER_INSTALL_URL = 'https://www.freighter.app/';
export const FREIGHTER_DOCS_URL = 'https://docs.freighter.app/';

interface FreighterMissingCardProps {
  className?: string;
  onRetry?: () => void;
}

/**
 * Dedicated empty state rendered when the Freighter browser extension is missing or not detected.
 * Distinct from access rejection (`ACCESS_DENIED`) or network mismatches.
 */
export default function FreighterMissingCard({ className, onRetry }: FreighterMissingCardProps) {
  const status = useWalletStore((s) => s.status);
  const errorCode = useWalletStore((s) => s.errorCode);
  const errorMessage = useWalletStore((s) => s.errorMessage);
  const connect = useWalletStore((s) => s.connect);
  const checkConnection = useWalletStore((s) => s.checkConnection);
  const clearError = useWalletStore((s) => s.clearError);

  const isFreighterMissing =
    (status === 'error' && errorCode === 'FREIGHTER_UNAVAILABLE') ||
    (status === 'error' && Boolean(errorMessage?.toLowerCase().includes('freighter is not installed')));

  if (!isFreighterMissing) return null;

  const handleRetry = () => {
    clearError();
    if (onRetry) {
      onRetry();
    } else {
      void checkConnection();
      void connect();
    }
  };

  return (
    <section
      className={`rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 text-white shadow-xl backdrop-blur-md ${className ?? ''}`}
      role="alert"
      aria-labelledby="freighter-missing-heading"
      data-testid="freighter-missing-card"
    >
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400"
          aria-hidden="true"
        >
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 id="freighter-missing-heading" className="text-base font-bold text-white">
            Freighter Extension Required
          </h3>
          <p className="mt-1 text-sm text-gray-300 leading-relaxed">
            The Freighter browser extension was not detected. Please install Freighter to connect your wallet, manage keys, and interact with the Stellar network.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <a
              href={FREIGHTER_INSTALL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2C4BFD] to-[#22D3EE] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
              aria-label="Install Freighter Extension (opens in a new tab)"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Install Freighter Extension</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
            </a>

            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800/80 px-4 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:bg-gray-700 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
            >
              <RefreshCw className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              <span>Re-check Connection</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-amber-500/10 text-xs text-gray-400">
            <span>Need setup assistance? </span>
            <a
              href={FREIGHTER_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-cyan-400 underline hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
            >
              View Freighter Setup & Documentation
              <ExternalLink className="h-3 w-3 inline" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
