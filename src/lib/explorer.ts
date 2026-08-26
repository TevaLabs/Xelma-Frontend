/**
 * Network-aware StellarExpert explorer links.
 */

import { IS_MAINNET } from './horizon';

const EXPLORER_BASE = 'https://stellar.expert/explorer';

/** `public` or `testnet`, matching StellarExpert's URL segment. */
export const EXPLORER_NETWORK = IS_MAINNET ? 'public' : 'testnet';

/** Explorer URL for a transaction hash. */
export function txUrl(hash: string): string {
  return `${EXPLORER_BASE}/${EXPLORER_NETWORK}/tx/${hash}`;
}

/** Explorer URL for an account address. */
export function accountUrl(address: string): string {
  return `${EXPLORER_BASE}/${EXPLORER_NETWORK}/account/${address}`;
}
