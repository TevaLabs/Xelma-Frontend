import { Link } from 'react-router-dom';
import { Github, BookOpen, ExternalLink, Heart } from 'lucide-react';
import Logo from '../assets/logo.svg';
import { cn } from '../lib/utils';

export type FooterNetwork = 'TESTNET' | 'PUBLIC';

export interface FooterProps {
  /**
   * Override the auto-detected network from `VITE_STELLAR_NETWORK_PASSPHRASE`.
   * Use this when the footer is rendered outside the wallet context (tests, storybook).
   */
  network?: FooterNetwork;
  /**
   * Render a slimmer "compact" variant for tight layouts (e.g. sidebar footers).
   */
  variant?: 'default' | 'compact';
  /**
   * Additional class names for the outer `<footer>` element.
   */
  className?: string;
}

/**
 * Resolve the active Stellar network purely from the build-time env var.
 * Defaults to TESTNET (matches xelma-contract.ts fallback).
 */
function resolveNetwork(override?: FooterNetwork): FooterNetwork {
  if (override) return override;
  const passphrase =
    import.meta.env.VITE_STELLAR_NETWORK_PASSPHRASE ??
    // Build-time default mirrors xelma-contract.ts
    'Test SDF Network ; September 2015';
  return passphrase.toLowerCase().includes('test') ? 'TESTNET' : 'PUBLIC';
}

const NETWORK_META: Record<
  FooterNetwork,
  { label: string; description: string; badgeClass: string }
> = {
  TESTNET: {
    label: 'Stellar Testnet',
    description: 'Sandbox network — no real funds settle here.',
    badgeClass:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  },
  PUBLIC: {
    label: 'Stellar Mainnet',
    description: 'Public Stellar network (production).',
    badgeClass:
      'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  },
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A] rounded';

const linkBase =
  'inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white';

const externalLinkProps = {
  target: '_blank',
  rel: 'noreferrer noopener',
} as const;

// Computed once at module load to keep renders pure (avoids snapshot/year-boundary flakes).
const CURRENT_YEAR = new Date().getFullYear();

export default function Footer({
  network,
  variant = 'default',
  className,
}: FooterProps) {
  const activeNetwork = resolveNetwork(network);
  const meta = NETWORK_META[activeNetwork];
  const isCompact = variant === 'compact';

  return (
    <footer
      role="contentinfo"
      aria-label="Site footer"
      className={cn(
        'border-t border-white/10 bg-[#0A0F1A]/80 backdrop-blur-sm',
        isCompact ? 'px-4 py-6' : 'px-4 py-10 sm:px-6 lg:px-8',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto max-w-6xl',
          isCompact ? 'flex flex-col gap-4' : 'flex flex-col gap-10'
        )}
      >
        {!isCompact && (
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {/* Brand block */}
            <div>
              <Link
                to="/"
                className={cn(
                  'inline-flex items-center gap-2.5',
                  focusRing
                )}
                aria-label="Xelma home"
              >
                <img
                  src={Logo}
                  alt=""
                  className="h-8 w-8"
                  aria-hidden="true"
                />
                <span className="text-lg font-bold tracking-tight text-white">
                  Xelma
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
                Collective market intelligence on the Stellar blockchain —
                trustless predictions that settle on-chain.
              </p>
              <p className="mt-4 text-xs text-gray-600">
                © {CURRENT_YEAR} Xelma · MIT License
              </p>
            </div>

            {/* Resources */}
            <nav aria-label="Footer resources">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Resources
              </h2>
              <ul className="mt-3 space-y-2.5">
                <li>
                  <Link to="/learn" className={cn(linkBase, focusRing)}>
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    Learn &amp; Docs
                  </Link>
                </li>
                <li>
                  <Link
                    to="/leaderboard"
                    className={cn(linkBase, focusRing)}
                  >
                    Leaderboard
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/TevaLabs/Xelma-Frontend"
                    {...externalLinkProps}
                    className={cn(linkBase, focusRing)}
                  >
                    <Github className="h-4 w-4" aria-hidden="true" />
                    GitHub
                    <ExternalLink
                      className="h-3 w-3 text-gray-500"
                      aria-hidden="true"
                    />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/TevaLabs/Xelma-Frontend/blob/main/README.md"
                    {...externalLinkProps}
                    className={cn(linkBase, focusRing)}
                  >
                    <BookOpen className="h-4 w-4" aria-hidden="true" />
                    Documentation
                    <ExternalLink
                      className="h-3 w-3 text-gray-500"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              </ul>
            </nav>

            {/* Network */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Settlement Network
              </h2>
              <p
                className={cn(
                  'mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold',
                  meta.badgeClass
                )}
              >
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    activeNetwork === 'TESTNET'
                      ? // Reuse the global pulse keyframes (already `motion-reduce`-aware).
                        'status-dot-live bg-emerald-400'
                      : 'status-dot bg-cyan-400'
                  )}
                  aria-hidden="true"
                />
                {meta.label}
              </p>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                {meta.description}
              </p>
              <p className="mt-4 text-xs text-gray-600">
                vXLM is virtual — no real funds move on this network.
              </p>
            </div>
          </div>
        )}

        {/* Bottom row */}
        <div
          className={cn(
            'flex flex-col gap-3 border-white/5 sm:flex-row sm:items-center sm:justify-between',
            isCompact ? '' : 'border-t pt-6'
          )}
        >
          <p className="inline-flex items-center gap-1.5 text-xs text-gray-500">
            <Heart
              className="h-3.5 w-3.5 text-pink-400/80"
              aria-hidden="true"
            />
            Built open-source for the Stellar community.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
            <a
              href="https://www.stellar.org/"
              {...externalLinkProps}
              className={cn(
                'inline-flex items-center gap-1 text-cyan-400 transition-colors hover:text-cyan-300',
                focusRing
              )}
            >
              Powered by Stellar
              <ExternalLink
                className="h-3 w-3"
                aria-hidden="true"
              />
            </a>
            <a
              href="https://github.com/TevaLabs/Xelma-Frontend/blob/main/LICENSE"
              {...externalLinkProps}
              className={cn(
                'transition-colors hover:text-gray-300',
                focusRing
              )}
            >
              View license
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
