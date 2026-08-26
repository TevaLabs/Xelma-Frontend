import {
  isConnected,
  requestAccess,
  getNetwork,
  signMessage as freighterSignMessage,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';
import {
  WalletAdapterError,
  type SignOptions,
  type WalletAdapter,
  type WalletAvailability,
  type WalletConnection,
} from './types';

/** Freighter reports availability only after the extension injects itself. */
const AVAILABILITY_ATTEMPTS = 5;
const AVAILABILITY_DELAY_MS = 100;

async function waitForExtension(): Promise<boolean> {
  for (let attempt = 0; attempt < AVAILABILITY_ATTEMPTS; attempt++) {
    try {
      const { isConnected: available } = await isConnected();
      if (available) return true;
    } catch {
      // Extension not injected yet — retry.
    }
    await new Promise((resolve) => setTimeout(resolve, AVAILABILITY_DELAY_MS));
  }
  return false;
}

export const freighterAdapter: WalletAdapter = {
  id: 'freighter',
  name: 'Freighter',
  description: 'Browser extension by the Stellar Development Foundation',
  isImplemented: true,

  async isAvailable(): Promise<WalletAvailability> {
    const available = await waitForExtension();
    return available ? { isAvailable: true } : { isAvailable: false, reason: 'NOT_INSTALLED' };
  },

  async connect(): Promise<WalletConnection> {
    const available = await waitForExtension();
    if (!available) {
      throw new WalletAdapterError(
        'freighter',
        'Freighter is not installed or not unlocked. Install Freighter and try again.',
      );
    }

    const { address, error } = await requestAccess();
    if (error) {
      throw new WalletAdapterError('freighter', String(error));
    }
    if (!address) {
      throw new WalletAdapterError('freighter', 'User denied access');
    }

    const { network } = await getNetwork();
    return { address, network: (network as string | null) || null };
  },

  async signMessage(message: string, options: SignOptions): Promise<string> {
    const { signedMessage, error } = await freighterSignMessage(message, {
      address: options.address,
      networkPassphrase: options.networkPassphrase,
    });

    if (error) {
      throw new WalletAdapterError('freighter', error.message ?? 'Failed to sign message');
    }
    if (!signedMessage) {
      throw new WalletAdapterError('freighter', 'Signing cancelled or rejected by user.');
    }

    return typeof signedMessage === 'string' ? signedMessage : String(signedMessage);
  },

  async signTransaction(xdr: string, options: SignOptions): Promise<string> {
    const result = await freighterSignTransaction(xdr, {
      networkPassphrase: options.networkPassphrase,
    });

    if (typeof result === 'string') return result;

    if (result && typeof result === 'object') {
      if ('error' in result && result.error) {
        throw new WalletAdapterError('freighter', String(result.error));
      }
      const signed = (result as { signedTxXdr?: string }).signedTxXdr;
      if (signed) return signed;
    }

    throw new WalletAdapterError('freighter', 'Signing cancelled or rejected by user.');
  },
};
