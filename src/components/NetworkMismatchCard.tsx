import { AlertCircle, ArrowRight, BookOpen, ExternalLink, RefreshCw } from 'lucide-react';
/* eslint-disable react-refresh/only-export-components -- shared constants/CTA routes for network-mismatch guidance (issue #618). */
import { Link } from 'react-router-dom';
import {
  EXPECTED_NETWORK_LABEL,
  isExpectedNetwork,
  FREIGHTER_NETWORK_DOCS,
  STELLAR_NETWORKS_DOCS,
  networkLabel,
} from '../lib/stellarNetwork';
import { useWalletStore } from '../store/useWalletStore';

const STEPS = [
  'Open the Freighter extension.',
  'Click the network name in the top bar.',
  `Select ${EXPECTED_NETWORK_LABEL}.`,
  'Come back and press "Re-check network" below.',
];

/** In-app deep links surfaced as CTAs on the mismatch card (issue #618). */
export const NETWORK_SETTINGS_ROUTE = '/settings#network';
export const LEARN_GUIDE_ROUTE = '/learn';

/** The copy used for the desktop-aligned wallet badge (same CTA trigger as card). */
export const NETWORK_MISMATCH_BANNER = {
  label: 'Switch to {expected} in Freighter',
  hint: `Your wallet is on {wallet}. Use Freighter’s network menu to switch to {expected}, then come back and press “Re-check network” below.`,
};

/**
 * Actionable guidance when Freighter is on a different network than this build
 * targets (`VITE_STELLAR_NETWORK`).
 *
 * On the wrong network, funding and signing both fail with opaque wallet
 * errors, so this card states the mismatch, explains exactly how to fix it,
 * and offers in-app deep links to the Settings network section and the Learn
 * guide. It renders nothing on the happy path.
 */
export default function NetworkMismatchCard({ className }: { className?: string }) {
  const status = useWalletStore((s) => s.status);
  const publicKey = useWalletStore((s) => s.publicKey);
  const network = useWalletStore((s) => s.network);
  const networkMismatch = useWalletStore((s) => s.networkMismatch);
  const checkConnection = useWalletStore((s) => s.checkConnection);

  const isConnected = status === 'connected' && Boolean(publicKey);
  const networkMismatchBanner = Boolean(network) && !isExpectedNetwork(network);
  if (!isConnected || !networkMismatch || !networkMismatchBanner) return null;

  return (
    <section
      className={`rounded-xl border border-red-500/30 bg-red-500/[0.07] p-4 ${className ?? ''}`}
      role="alert"
      aria-labelledby="network-mismatch-heading"
      data-testid="network-mismatch-card"
      data-wallet-network={network ?? 'unknown'}
      data-expected-network={EXPECTED_NETWORK_LABEL}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-300"
          aria-hidden
        >
          <AlertCircle className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <h3 id="network-mismatch-heading" className="text-sm font-bold text-white">
            Freighter is on the wrong network
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-red-100/80">
            This app settles on{' '}
            <span className="font-semibold text-red-100">{EXPECTED_NETWORK_LABEL}</span>, but your
            wallet reports{' '}
            <span className="font-semibold text-red-100">{networkLabel(network)}</span>. Funding and
            prediction signing will fail until both are on the same network.
          </p>

          <ol className="mt-3 space-y-1.5 text-xs text-red-100/80" aria-label="How to fix it">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-2">
                <span className="font-mono text-red-300/70" aria-hidden>
                  {index + 1}.
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>

          <p className="mt-2 text-xs italic text-red-200/70">
            Switching networks is safe — your accounts and keys stay put; Freighter just talks to{' '}
            {EXPECTED_NETWORK_LABEL} instead.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Link
              to={NETWORK_SETTINGS_ROUTE}
              data-testid="network-mismatch-settings-link"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-red-500/80 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <span className="mr-1">Open network settings</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>

            <button
              type="button"
              onClick={() => void checkConnection()}
              data-testid="network-mismatch-recheck"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-100 transition-colors hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Re-check network
            </button>

            <Link
              to={LEARN_GUIDE_ROUTE}
              data-testid="network-mismatch-learn-link"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-red-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              Read the network guide
            </Link>
          </div>

          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-red-200/70">
            <span>Need more detail?</span>
            <a
              href={FREIGHTER_NETWORK_DOCS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-red-200 underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              Freighter docs
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
            <span aria-hidden>·</span>
            <a
              href={STELLAR_NETWORKS_DOCS}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-red-200 underline underline-offset-2 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              About Stellar networks
              <ExternalLink className="h-3 w-3" aria-hidden />
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
