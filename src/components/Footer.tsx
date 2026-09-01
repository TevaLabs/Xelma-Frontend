import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Github, BookOpen, ExternalLink, Heart, Copy, Check, Info } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '../assets/logo.svg';
import { cn } from '../lib/utils';
import { XELMA_CONTRACT_ID } from '../lib/stellarConfig';
import { FREIGHTER_NETWORK_DOCS, STELLAR_NETWORKS_DOCS } from '../lib/stellarNetwork';

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

async function writeToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function truncate(str: string, head = 8, tail = 8): string {
  if (str.length <= head + tail + 3) return str;
  return `${str.slice(0, head)}…${str.slice(-tail)}`;
}

interface InfoTooltipProps {
  id: string;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
}

function InfoTooltip({
  id,
  ariaLabel,
  children,
  className = '',
}: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setIsOpen((prev) => !prev);

  const handleClose = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        handleClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative inline-block align-middle ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-controls={id}
        className={cn(
          'inline-flex items-center justify-center rounded-full text-gray-400 hover:text-white transition-colors',
          'min-h-[20px] min-w-[20px]',
          focusRing
        )}
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          id={id}
          role="tooltip"
          className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl bg-gray-900 border border-gray-700 p-4 text-xs text-gray-200 shadow-xl space-y-3"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function Footer({
  network,
  variant = 'default',
  className,
}: FooterProps) {
  const activeNetwork = resolveNetwork(network);
  const meta = NETWORK_META[activeNetwork];
  const isCompact = variant === 'compact';
  const isTestnet = activeNetwork === 'TESTNET';
  const [contractCopied, setContractCopied] = useState(false);

  const handleCopyContractId = useCallback(async () => {
    const ok = await writeToClipboard(XELMA_CONTRACT_ID);
    if (ok) {
      setContractCopied(true);
      toast.success('Contract ID copied');
      window.setTimeout(() => setContractCopied(false), 1500);
    } else {
      toast.error('Copy failed', {
        description: 'Your browser may be blocking clipboard access.',
      });
    }
  }, []);

  const freighterTestnetSteps = [
    'Open the Freighter browser extension.',
    'Click the network name in the top bar (usually "Mainnet").',
    'Select "Testnet" from the dropdown list.',
    'Switch back to Xelma — predictions will now settle here.',
  ];

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
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                  Settlement Network
                </h2>
                <InfoTooltip
                  id="network-info-tooltip"
                  ariaLabel="What does the settlement network badge mean?"
                >
                  <div>
                    <span className="font-semibold text-cyan-400 block mb-1">
                      What this badge means
                    </span>
                    <p className="text-gray-300 leading-relaxed">
                      Every prediction you create and every payout you claim is
                      recorded on a public Stellar blockchain. The network badge
                      tells you which chain your transactions settle on.
                    </p>
                  </div>

                  <div>
                    <span
                      className={cn(
                        'font-semibold block mb-1',
                        isTestnet ? 'text-emerald-400' : 'text-cyan-400'
                      )}
                    >
                      {isTestnet ? 'Stellar Testnet' : 'Stellar Mainnet'}
                    </span>
                    <p className="text-gray-300 leading-relaxed">
                      {isTestnet
                        ? "Testnet is a free sandbox. Funds here are virtual (vXLM) and have no real value — it's perfect for learning, practicing predictions, and testing wallet setup before anything real is at stake."
                        : 'Mainnet is the production Stellar network. Transactions settled here use real XLM and are irreversible.'}
                    </p>
                  </div>

                  {isTestnet && (
                    <div className="border-t border-gray-800 pt-3">
                      <span className="font-semibold text-amber-400 block mb-2">
                        Setting up Freighter for Testnet
                      </span>
                      <ol className="space-y-1.5 text-gray-300">
                        {freighterTestnetSteps.map((step, idx) => (
                          <li key={step} className="flex gap-2">
                            <span
                              className="font-mono text-amber-300/70 shrink-0"
                              aria-hidden="true"
                            >
                              {idx + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
                        <a
                          href={FREIGHTER_NETWORK_DOCS}
                          {...externalLinkProps}
                          className="text-emerald-300 underline underline-offset-2 hover:text-emerald-200 transition-colors"
                        >
                          Freighter guide
                        </a>
                        <a
                          href={STELLAR_NETWORKS_DOCS}
                          {...externalLinkProps}
                          className="text-gray-300 underline underline-offset-2 hover:text-white transition-colors"
                        >
                          About Stellar networks
                        </a>
                      </div>
                    </div>
                  )}
                </InfoTooltip>
              </div>
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

              <div className="mt-5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Contract ID
                  </h3>
                  <InfoTooltip
                    id="contract-id-tooltip"
                    ariaLabel="What is a contract ID?"
                  >
                    <div>
                      <span className="font-semibold text-purple-400 block mb-1">
                        What is a Contract ID?
                      </span>
                      <p className="text-gray-300 leading-relaxed">
                        A Soroban smart contract lives on-chain at a unique
                        address, just like a wallet account. The Contract ID
                        (always starts with <span className="font-mono">C…</span>)
                        is that address.
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-purple-400 block mb-1">
                        Why it matters
                      </span>
                      <ul className="text-gray-300 space-y-1 leading-relaxed list-disc list-inside">
                        <li>
                          Every prediction, stake, and payout runs through this
                          contract — not through a server.
                        </li>
                        <li>
                          You can verify the deployed code and all transactions
                          in any Stellar block explorer.
                        </li>
                        <li>
                          Your wallet will show this contract ID when it asks
                          you to approve a transaction — always confirm it
                          matches before signing.
                        </li>
                      </ul>
                    </div>
                  </InfoTooltip>
                </div>
                <div className="mt-2 flex items-center gap-2 min-w-0 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                  <code
                    className="text-xs text-gray-300 font-mono truncate min-w-0 flex-1"
                    title={XELMA_CONTRACT_ID}
                  >
                    {truncate(XELMA_CONTRACT_ID, 6, 6)}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyContractId}
                    aria-label={contractCopied ? 'Contract ID copied' : 'Copy contract ID'}
                    aria-live="polite"
                    className={cn(
                      'shrink-0 inline-flex items-center justify-center rounded p-1.5 transition-colors',
                      'text-gray-400 hover:text-white hover:bg-white/10',
                      focusRing
                    )}
                  >
                    {contractCopied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
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