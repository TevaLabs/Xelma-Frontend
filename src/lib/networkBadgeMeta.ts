/**
 * Resolve the visible "Testnet / Mainnet" pill text + flag based on the
 * build-time `VITE_STELLAR_NETWORK` env var. Extracted from the
 * `NetworkBadge` component so it can be reused (Settings preview, Footer,
 * …) without tripping the `react-refresh/only-export-components` rule.
 *
 * This module is the single source of truth for network pill colors.
 * Badge colors (Tailwind classes):
 *   - Mainnet -> emerald (border/bg/text)
 *   - Testnet -> amber (border/bg/text)
 * All network pills (Navbar `NetworkBadge`, Footer, local pills) must
 * derive their colors from `here` to avoid one-off hex drift.
 */
export interface NetworkBadgeMeta {
  label: string;
  isMainnet: boolean;
  /** Tailwind classes for the network pill (border + bg + text). */
  colorClasses: string;
  /** Machine-readable network identifier for data attributes. */
  networkId: 'mainnet' | 'testnet';
}

const NETWORK = (import.meta.env.VITE_STELLAR_NETWORK ?? 'TESTNET').toUpperCase();

/** Color classes for each network — the single source of truth. */
const COLOR_CLASSES = {
  mainnet: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
  testnet: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
} as const;

/**
 * Per-network badge metadata keyed by the network identifiers the UI uses
 * (`TESTNET` / `PUBLIC`). Consumers that need to style a pill for *both*
 * networks at once — e.g. the Footer, which documents what each network means
 * regardless of which one is active — read from here instead of re-deriving
 * color classes, which is what caused the one-off hex drift this module
 * exists to prevent.
 */
export const networkBadgeMeta = {
  TESTNET: { badgeClass: COLOR_CLASSES.testnet },
  PUBLIC: { badgeClass: COLOR_CLASSES.mainnet },
} as const satisfies Record<string, { badgeClass: string }>;

export function resolveNetworkBadge(): NetworkBadgeMeta {
  const isMainnet = NETWORK === 'PUBLIC' || NETWORK === 'MAINNET';
  return {
    label: isMainnet ? 'Mainnet' : 'Testnet',
    isMainnet,
    colorClasses: isMainnet ? COLOR_CLASSES.mainnet : COLOR_CLASSES.testnet,
    networkId: isMainnet ? 'mainnet' : 'testnet',
  };
}
