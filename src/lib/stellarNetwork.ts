/**
 * Which Stellar network this build expects, and how to talk about the one the
 * wallet is actually on.
 *
 * The app targets a single network per build (`VITE_STELLAR_NETWORK`), the same
 * switch that selects Horizon, Friendbot, and the explorer. Freighter picks its
 * network independently, so the two can disagree — everything needed to detect
 * and explain that lives here.
 */

import { IS_MAINNET } from './horizon';

/** Network identifiers as reported by `@stellar/freighter-api`. */
export type StellarNetworkId = 'TESTNET' | 'PUBLIC';

/** The network Freighter must be on for this build to work. */
export const EXPECTED_NETWORK: StellarNetworkId = IS_MAINNET ? 'PUBLIC' : 'TESTNET';

/** Human label for the expected network, e.g. for CTA copy. */
export const EXPECTED_NETWORK_LABEL = IS_MAINNET ? 'Mainnet' : 'Testnet';

export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
export const PUBLIC_PASSPHRASE = 'Public Global Stellar Network ; September 2015';

/** Docs deep links surfaced from the mismatch card. */
export const FREIGHTER_NETWORK_DOCS = 'https://docs.freighter.app/docs/guide/usingFreighter';
export const STELLAR_NETWORKS_DOCS =
  'https://developers.stellar.org/docs/learn/fundamentals/networks';

/** Normalizes a wallet-reported network to upper case, or null when unknown. */
function normalize(network: string | null | undefined): string | null {
  const trimmed = network?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

/** True when the wallet is on the network this build targets. */
export function isExpectedNetwork(network: string | null | undefined): boolean {
  const normalized = normalize(network);
  if (!normalized) return false;
  if (EXPECTED_NETWORK === 'PUBLIC') {
    return normalized === 'PUBLIC' || normalized === 'MAINNET';
  }
  return normalized === 'TESTNET';
}

/** Display label for any wallet-reported network. */
export function networkLabel(network: string | null | undefined): string {
  const normalized = normalize(network);
  switch (normalized) {
    case null:
      return 'Unknown';
    case 'PUBLIC':
    case 'MAINNET':
      return 'Mainnet';
    case 'TESTNET':
      return 'Testnet';
    case 'FUTURENET':
      return 'Futurenet';
    default:
      return normalized.charAt(0) + normalized.slice(1).toLowerCase();
  }
}

/** Network passphrase matching the network the wallet reports. */
export function networkPassphraseFor(network: string | null | undefined): string {
  const normalized = normalize(network);
  return normalized === 'PUBLIC' || normalized === 'MAINNET'
    ? PUBLIC_PASSPHRASE
    : TESTNET_PASSPHRASE;
}
