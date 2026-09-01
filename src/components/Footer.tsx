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
  'inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-white min-h-[44px]';

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
        'border-t border-white/10 bg-[#0A0F1A]/80 backdrop-blur-sm overflow-x-hidden',
        isCompact ? 'px-3 py-6 sm:px-4' : 'px-3 py-8 sm:px-6 lg:px-8 sm:py-10',
        className
      )}
    >
      <div
        className={cn(
          'mx-auto max-w-6xl min-w-0',
          isCompact ? 'flex flex-col gap-4' : 'flex flex-col gap-8 sm:gap-10'
        )}
      >
        {!isCompact && (
          <div className="grid gap-8 sm:gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {/* Brand block */}
            <div className="min-w-0">
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
                  className="h-8 w-8 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-lg font-bold tracking-tight text-white">
                  Xelma
                </span>
              </Link>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400 break-words">
                Collective market intelligence on the Stellar blockchain —
                trustless predictions that settle on-chain.
              </p>
              <p className="mt-4 text-xs text-gray-400 whitespace-nowrap">
                © {CURRENT_YEAR} Xelma · MIT License
              </p>
            </div>

            {/* Resources */}
            <nav aria-label="Footer resources" className="min-w-0">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Resources
              </h2>
              <ul className="mt-3 space-y-1 sm:space-y-2.5">
                <li>
                  <Link to="/learn" className={cn(linkBase, focusRing)}>
                    <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">Learn &amp; Docs</span>
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
                <li className="min-w-0">
                  <a
                    href="https://github.com/TevaLabs/Xelma-Frontend"
                    {...externalLinkProps}
                    className={cn(linkBase, focusRing, 'max-w-full')}
                  >
                    <Github className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">GitHub</span>
                    <ExternalLink
                      className="h-3 w-3 shrink-0 text-gray-500"
                      aria-hidden="true"
                    />
                  </a>
                </li>
                <li className="min-w-0">
                  <a
                    href="https://github.com/TevaLabs/Xelma-Frontend/blob/main/README.md"
                    {...externalLinkProps}
                    className={cn(linkBase, focusRing, 'max-w-full')}
                  >
                    <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">Documentation</span>
                    <ExternalLink
                      className="h-3 w-3 shrink-0 text-gray-500"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              </ul>
            </nav>

            {/* Network */}
            <div className="min-w-0">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Settlement Network
              </h2>
              <p
                className={cn(
                  'mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold max-w-full',
                  meta.badgeClass
                )}
              >
                <span
                  className={cn(
                    'h-2 w-2 rounded-full shrink-0',
                    activeNetwork === 'TESTNET'
                      ? // Reuse the global pulse keyframes (already `motion-reduce`-aware).
                        'status-dot-live bg-emerald-400'
                      : 'status-dot bg-cyan-400'
                  )}
                  aria-hidden="true"
                />
                <span className="whitespace-nowrap">{meta.label}</span>
              </p>
              <p className="mt-3 text-xs leading-relaxed text-gray-400 break-words">
                {meta.description}
              </p>
              <p className="mt-4 text-xs text-gray-400 break-words">
                vXLM is virtual — no real funds move on this network.
              </p>
            </div>
          </div>
        )}

        {/* Bottom row */}
        <div
          className={cn(
            'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0',
            isCompact ? '' : 'border-t border-white/5 pt-5 sm:pt-6'
          )}
        >
          <p className="inline-flex flex-wrap items-center gap-1.5 text-xs text-gray-400 min-w-0">
            <Heart
              className="h-3.5 w-3.5 shrink-0 text-pink-400/80"
              aria-hidden="true"
            />
            <span className="whitespace-nowrap">Built open-source for the Stellar community.</span>
          </p>
          <div className="flex flex-col gap-2 min-w-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
            <a
              href="https://www.stellar.org/"
              {...externalLinkProps}
              className={cn(
                'inline-flex items-center gap-1 text-cyan-400 transition-colors hover:text-cyan-300 min-h-[44px] text-xs',
                focusRing
              )}
            >
              <span className="truncate">Powered by Stellar</span>
              <ExternalLink
                className="h-3 w-3 shrink-0"
                aria-hidden="true"
              />
            </a>
            <a
              href="https://github.com/TevaLabs/Xelma-Frontend/blob/main/LICENSE"
              {...externalLinkProps}
              className={cn(
                'inline-flex items-center min-h-[44px] text-xs transition-colors hover:text-gray-300',
                focusRing
              )}
            >
              <span className="truncate">View license</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}