import { resolveNetworkBadge } from '../lib/networkBadgeMeta';

type Variant = 'default' | 'compact';

interface NetworkBadgeProps {
  className?: string;
  /** `compact` strips a touch of padding for use inside tight rows / pills. */
  variant?: Variant;
}

/**
 * Small "Testnet" / "Mainnet" pill rendered in the global navbar. Extracted from
 * Navbar so the Settings page can reuse it for an honest preview of the toggle.
 */
export default function NetworkBadge({ className = '', variant = 'default' }: NetworkBadgeProps) {
  const { label, isMainnet } = resolveNetworkBadge();

  const base =
    'rounded-full border font-bold tracking-wide ' +
    (isMainnet
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 '
      : 'border-amber-500/40 bg-amber-500/10 text-amber-400 ');

  const sizing =
    variant === 'compact' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`${base} ${sizing} ${className}`.trim()}
      aria-label="Settlement network"
      data-testid="network-badge"
      data-network={isMainnet ? 'mainnet' : 'testnet'}
    >
      {label}
    </span>
  );
}
