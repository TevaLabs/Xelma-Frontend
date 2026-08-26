/**
 * Resolve the visible "Testnet / Mainnet" pill text + flag based on the
 * build-time `VITE_STELLAR_NETWORK` env var. Extracted from the
 * `NetworkBadge` component so it can be reused (Settings preview, Footer,
 * …) without tripping the `react-refresh/only-export-components` rule.
 */
export interface NetworkBadgeMeta {
  label: string;
  isMainnet: boolean;
}

const NETWORK = (import.meta.env.VITE_STELLAR_NETWORK ?? 'TESTNET').toUpperCase();

export function resolveNetworkBadge(): NetworkBadgeMeta {
  const isMainnet = NETWORK === 'PUBLIC' || NETWORK === 'MAINNET';
  return {
    label: isMainnet ? 'Mainnet' : 'Testnet',
    isMainnet,
  };
}
