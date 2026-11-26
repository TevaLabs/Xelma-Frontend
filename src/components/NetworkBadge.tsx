import { resolveNetworkBadge } from '../lib/networkBadgeMeta';

type Variant = 'default' | 'compact';

interface NetworkBadgeProps {
  className?: string;
  /** `compact` strips a touch of padding for use inside tight rows / pills. */
  variant?: Variant;
  /** Override the default "Testnet" / "Mainnet" text (e.g. a translated label). */
  label?: string;
  /** Override the default accessible name (e.g. a translated one). */
  ariaLabel?: string;
}

/**
 * Small "Testnet" / "Mainnet" pill rendered in the global navbar. Extracted from
 * Navbar so the Settings page can reuse it for an honest preview of the toggle.
 * Colors come from `networkBadgeMeta` (the single source of truth). Callers that
 * need localized copy (the Navbar) can pass `label`/`ariaLabel`; everyone else
 * gets the English defaults.
 */
export default function NetworkBadge({
  className = '',
  variant = 'default',
  label: labelOverride,
  ariaLabel,
}: NetworkBadgeProps) {
  const { label, colorClasses, networkId } = resolveNetworkBadge();

  const base = `rounded-full border font-bold tracking-wide ${colorClasses}`;

  const sizing =
    variant === 'compact' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`${base} ${sizing} ${className}`.trim()}
      aria-label={ariaLabel ?? 'Settlement network'}
      data-testid="network-badge"
      data-network={networkId}
    >
      {labelOverride ?? label}
    </span>
  );
}
