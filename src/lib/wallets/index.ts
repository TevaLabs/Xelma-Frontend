import { freighterAdapter } from './freighter';
import { albedoAdapter, lobstrAdapter } from './stubs';
import type { WalletAdapter, WalletId } from './types';

/**
 * Registry of every wallet the picker offers, in display order.
 *
 * Adding a wallet: implement a `WalletAdapter` and append it here.
 */
export const WALLET_ADAPTERS: readonly WalletAdapter[] = [
  freighterAdapter,
  albedoAdapter,
  lobstrAdapter,
];

export function getWalletAdapter(id: WalletId): WalletAdapter | undefined {
  return WALLET_ADAPTERS.find((adapter) => adapter.id === id);
}

export { freighterAdapter, albedoAdapter, lobstrAdapter };
export * from './types';
