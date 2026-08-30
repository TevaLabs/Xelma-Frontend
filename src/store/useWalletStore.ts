import { create } from 'zustand';
import { isConnected, getAddress, getNetwork } from '@stellar/freighter-api';
import { toast } from 'sonner';
import { freighterAdapter } from '../lib/wallets';
import { useAuthStore } from './useAuthStore';
import { getApiBaseUrl } from '../lib/apiConfig';
import { HORIZON_URL } from '../lib/horizon';
import { FRIENDBOT_ENABLED, LOW_BALANCE_THRESHOLD_XLM } from '../lib/friendbot';
import {
  EXPECTED_NETWORK_LABEL,
  isExpectedNetwork,
  networkPassphraseFor,
} from '../lib/stellarNetwork';

const API_BASE = getApiBaseUrl();

/** Single source of truth for wallet UI + lifecycle (issue #71). */
export type WalletStatus = 'idle' | 'checking' | 'connecting' | 'connected' | 'error';

export type WalletErrorCode =
  | 'FREIGHTER_UNAVAILABLE'
  | 'ACCESS_DENIED'
  | 'TIMEOUT'
  | 'BALANCE_FAILED'
  | 'NETWORK_MISMATCH'
  | 'AUTH_FAILED'
  | 'UNKNOWN';

interface WalletState {
  status: WalletStatus;
  publicKey: string | null;
  network: string | null;
  balance: string | null;
  /** Last user-visible error (cleared on successful connect/check). */
  errorMessage: string | null;
  errorCode: WalletErrorCode | null;
  /** True when Freighter reports a network other than the configured one (still connected). */
  networkMismatch: boolean;
  /** True when viewing an address in watch-only mode (no signing capability). */
  isWatchOnly: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  reset: () => void;
  checkConnection: () => Promise<void>;
  /** Re-reads the native balance from Horizon for the connected address. */
  refreshBalance: () => Promise<void>;
  clearError: () => void;
  /** Set watch-only mode with a specific address (no signing capability). */
  setWatchOnly: (address: string) => Promise<void>;
}

/**
 * Reads the native XLM balance for an address from Horizon and formats it for
 * display. An account Horizon does not know yet (404) reads as `0.00 XLM`.
 */
async function fetchFormattedBalance(address: string): Promise<string> {
  const response = await fetch(`${HORIZON_URL}/accounts/${address}`);
  if (response.status === 404) {
    return '0.00 XLM';
  }
  if (!response.ok) {
    throw new Error(`Horizon returned ${response.status}`);
  }
  const data = await response.json();
  const balances = data.balances as Array<{ asset_type: string; balance: string }>;
  const nativeBalance = balances.find((b) => b.asset_type === 'native');
  return nativeBalance ? `${parseFloat(nativeBalance.balance).toFixed(2)} XLM` : '0.00 XLM';
}

/** Parses a stored balance string such as `12.50 XLM` into a number. */
export function parseXlmBalance(balance: string | null): number | null {
  if (!balance) return null;
  const parsed = Number.parseFloat(balance.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Dedupe concurrent checkConnection calls (remount / multiple headers). */
let checkConnectionInFlight: Promise<void> | null = null;

function mapConnectError(err: unknown): { message: string; code: WalletErrorCode } {
  const msg = err instanceof Error ? err.message : String(err);
  const lower = msg.toLowerCase();
  if (lower.includes('denied') || lower.includes('rejected') || lower.includes('user denied')) {
    return { message: 'Wallet access was denied. Click Connect and approve in Freighter.', code: 'ACCESS_DENIED' };
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return { message: 'Connection timed out. Check Freighter and try again.', code: 'TIMEOUT' };
  }
  return { message: 'Could not connect wallet. Try again or reinstall Freighter.', code: 'UNKNOWN' };
}

export const selectIsWalletConnected = (s: WalletState): boolean =>
  s.status === 'connected' && Boolean(s.publicKey);

/**
 * True when a connected testnet account is too poor to pay Soroban fees, so the
 * Friendbot CTA should be offered. Never true on mainnet, and never while the
 * balance is unknown (Horizon unreachable) — guessing would only add noise.
 */
export const selectNeedsFunding = (s: WalletState): boolean => {
  if (!FRIENDBOT_ENABLED || !selectIsWalletConnected(s)) return false;
  const xlm = parseXlmBalance(s.balance);
  return xlm !== null && xlm < LOW_BALANCE_THRESHOLD_XLM;
};

export const useWalletStore = create<WalletState>((set, get) => ({
  status: 'idle',
  publicKey: null,
  network: null,
  balance: null,
  errorMessage: null,
  errorCode: null,
  networkMismatch: false,
  isWatchOnly: false,

  clearError: () => set({ errorMessage: null, errorCode: null }),

  reset: () => {
    set({
      status: 'idle',
      publicKey: null,
      network: null,
      balance: null,
      errorMessage: null,
      errorCode: null,
      networkMismatch: false,
      isWatchOnly: false,
    });
  },

  disconnect: () => {
    set({
      status: 'idle',
      publicKey: null,
      network: null,
      balance: null,
      errorMessage: null,
      errorCode: null,
      networkMismatch: false,
      isWatchOnly: false,
    });
    useAuthStore.getState().clearAuth();
    toast.success('Wallet disconnected');
  },

  checkConnection: async () => {
    if (checkConnectionInFlight) {
      return checkConnectionInFlight;
    }

    checkConnectionInFlight = (async () => {
      const prev = get();
      if (prev.status === 'connecting') return;

      set({ status: 'checking', errorMessage: null, errorCode: null });

      try {
        const { isConnected: freighterConnected } = await isConnected();
        if (!freighterConnected) {
          set({
            status: 'idle',
            publicKey: null,
            network: null,
            balance: null,
            networkMismatch: false,
          });
          return;
        }

        const { address } = await getAddress();
        if (!address) {
          set({
            status: 'idle',
            publicKey: null,
            network: null,
            balance: null,
            networkMismatch: false,
          });
          return;
        }

        const { network } = await getNetwork();
        const net = (network as string | null) || null;
        const networkMismatch = !isExpectedNetwork(net);

        let formattedBalance: string | null = null;
        try {
          formattedBalance = await fetchFormattedBalance(address);
        } catch {
          formattedBalance = null;
          toast.error('Could not load balance. You can still use the app; try reconnecting if needed.');
        }

        set({
          status: 'connected',
          publicKey: address,
          network: net,
          balance: formattedBalance,
          networkMismatch,
          errorMessage: null,
          errorCode: null,
        });

        if (networkMismatch) {
          toast.error(`Please switch to Stellar ${EXPECTED_NETWORK_LABEL} in Freighter for full compatibility.`);
        }
      } catch {
        set({
          status: 'idle',
          publicKey: null,
          network: null,
          balance: null,
          networkMismatch: false,
        });
      } finally {
        checkConnectionInFlight = null;
      }
    })();

    return checkConnectionInFlight;
  },

  refreshBalance: async () => {
    const { publicKey } = get();
    if (!publicKey) return;

    try {
      set({ balance: await fetchFormattedBalance(publicKey) });
    } catch {
      toast.error('Could not refresh balance. Try again in a moment.');
    }
  },

  setWatchOnly: async (address: string) => {
    set({
      status: 'connecting',
      errorMessage: null,
      errorCode: null,
      networkMismatch: false,
    });

    try {
      // Validate Stellar G-address format
      if (!address.startsWith('G') || address.length !== 56) {
        throw new Error('Invalid Stellar address. Must be a G-address (56 characters starting with G).');
      }

      let formattedBalance: string | null = null;
      try {
        formattedBalance = await fetchFormattedBalance(address);
      } catch {
        formattedBalance = null;
        toast.error('Could not load balance. The address may not exist on the network.');
      }

      set({
        publicKey: address,
        network: EXPECTED_NETWORK_LABEL.toLowerCase(),
        balance: formattedBalance,
        status: 'connected',
        networkMismatch: false,
        errorMessage: null,
        errorCode: null,
        isWatchOnly: true,
      });

      toast.success('Watch-only mode activated. Viewing address without signing capability.');
    } catch (error) {
      console.error('Watch-only setup error:', error);
      const message = error instanceof Error ? error.message : 'Could not set up watch-only mode.';
      set({
        status: 'error',
        publicKey: null,
        network: null,
        balance: null,
        networkMismatch: false,
        isWatchOnly: false,
        errorMessage: message,
        errorCode: 'UNKNOWN',
      });
      toast.error(message);
    }
  },

  connect: async () => {
    if (get().status === 'connecting') return;

    set({
      status: 'connecting',
      errorMessage: null,
      errorCode: null,
      networkMismatch: false,
    });

    try {
      const { isAvailable } = await freighterAdapter.isAvailable();
      if (!isAvailable) {
        set({
          status: 'error',
          errorMessage: 'Freighter is not installed or not unlocked. Install Freighter and try again.',
          errorCode: 'FREIGHTER_UNAVAILABLE',
        });
        toast.error('Freighter wallet not available');
        return;
      }

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 30000);
      });

      const { address, network } = await Promise.race([
        freighterAdapter.connect(),
        timeoutPromise,
      ]);

      const net = network;
      const networkMismatch = !isExpectedNetwork(net);

      let formattedBalance: string | null = null;
      try {
        formattedBalance = await fetchFormattedBalance(address);
      } catch {
        formattedBalance = null;
        toast.error('Connected, but balance could not be loaded. Try again later.');
      }

      set({
        publicKey: address,
        network: net,
        balance: formattedBalance,
        status: 'connected',
        networkMismatch,
        errorMessage: null,
        errorCode: null,
      });

      toast.success('Wallet connected!');

      if (networkMismatch) {
        toast.error(`Please switch to Stellar ${EXPECTED_NETWORK_LABEL} in Freighter`);
      }

      try {
        const challengeRes = await fetch(`${API_BASE}/api/auth/challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicKey: address }),
        });

        if (!challengeRes.ok) throw new Error('Failed to get auth challenge');

        const { challenge } = await challengeRes.json();

        const signedMessage = await freighterAdapter.signMessage(challenge, {
          address,
          networkPassphrase: networkPassphraseFor(net),
        });

        const connectRes = await fetch(`${API_BASE}/api/auth/connect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicKey: address, signedChallenge: signedMessage }),
        });

        if (connectRes.status === 401) {
          useAuthStore.getState().clearAuth();
          throw new Error('Authentication rejected by server');
        }

        if (!connectRes.ok) throw new Error('Failed to authenticate with backend');

        const { token } = await connectRes.json();
        useAuthStore.getState().setJwt(token);
        toast.success('Authenticated with backend!');
      } catch (authError) {
        console.error('Backend auth error:', authError);
        useAuthStore.getState().clearAuth();
        set({
          errorMessage:
            'Wallet is connected, but sign-in to the server failed. Try Disconnect and Connect again.',
          errorCode: 'AUTH_FAILED',
        });
        toast.error('Wallet connected but backend auth failed');
      }
    } catch (error) {
      console.error('Connection error:', error);
      const mapped = mapConnectError(error);
      const code: WalletErrorCode =
        error instanceof Error && error.message === 'TIMEOUT' ? 'TIMEOUT' : mapped.code;
      const message =
        error instanceof Error && error.message === 'TIMEOUT'
          ? 'Connection timed out. Unlock Freighter and try again.'
          : mapped.message;

      set({
        status: 'error',
        publicKey: null,
        network: null,
        balance: null,
        networkMismatch: false,
        errorMessage: message,
        errorCode: code,
      });
      toast.error(message);
    }
  },
}));
