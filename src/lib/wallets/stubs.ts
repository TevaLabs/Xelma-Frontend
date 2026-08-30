import {
  WalletAdapterError,
  type WalletAdapter,
  type WalletAvailability,
  type WalletConnection,
} from './types';

/**
 * Placeholder adapters for wallets that are planned but not yet wired.
 *
 * They exist so the picker can advertise the roadmap and so adding real support
 * is a matter of filling in these methods — the picker, store, and components
 * need no changes.
 */
function notImplemented(
  id: WalletAdapter['id'],
  name: string,
  description: string,
  comingSoonHint: string,
): WalletAdapter {
  const fail = (): never => {
    throw new WalletAdapterError(id, `${name} support is not available yet.`);
  };

  return {
    id,
    name,
    description,
    isImplemented: false,
    comingSoonHint,

    async isAvailable(): Promise<WalletAvailability> {
      return { isAvailable: false, reason: 'NOT_IMPLEMENTED' };
    },

    async connect(): Promise<WalletConnection> {
      return fail();
    },

    async signMessage(): Promise<string> {
      return fail();
    },

    async signTransaction(): Promise<string> {
      return fail();
    },
  };
}

export const albedoAdapter = notImplemented(
  'albedo',
  'Albedo',
  'Web-based signer — no extension required',
  'Albedo support is planned but not wired up yet — use Freighter for now.',
);

export const lobstrAdapter = notImplemented(
  'lobstr',
  'LOBSTR',
  'Mobile and browser wallet with WalletConnect',
  'LOBSTR support is planned but not wired up yet — use Freighter for now.',
);
