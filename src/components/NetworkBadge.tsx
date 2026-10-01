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
 * Colors come from `networkBadgeMeta` (the single source of truth).
 */
export default function NetworkBadge({ className = '', variant = 'default' }: NetworkBadgeProps) {
  const { label, colorClasses, networkId } = resolveNetworkBadge();

  const base = `rounded-full border font-bold tracking-wide ${colorClasses}`;

  const sizing =
    variant === 'compact' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`${base} ${sizing} ${className}`.trim()}
      aria-label="Settlement network"
      data-testid="network-badge"
      data-network={networkId}
    >
      {label}
    </span>
  );
}
