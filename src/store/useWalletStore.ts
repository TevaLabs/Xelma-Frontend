import { create } from 'zustand';
import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
  signMessage,
} from '@stellar/freighter-api';
import { toast } from 'sonner';
import { useAuthStore } from './useAuthStore';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

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
  /** True when Freighter reports a network other than TESTNET (still connected). */
  networkMismatch: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  checkConnection: () => Promise<void>;
  clearError: () => void;
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

export const useWalletStore = create<WalletState>((set, get) => ({
  status: 'idle',
  publicKey: null,
  network: null,
  balance: null,
  errorMessage: null,
  errorCode: null,
  networkMismatch: false,

  clearError: () => set({ errorMessage: null, errorCode: null }),

  disconnect: () => {
    set({
      status: 'idle',
      publicKey: null,
      network: null,
      balance: null,
      errorMessage: null,
      errorCode: null,
      networkMismatch: false,
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
        const networkMismatch = net !== 'TESTNET';

        let formattedBalance: string | null = null;
        try {
          const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
          if (response.status === 404) {
            formattedBalance = '0.00 XLM';
          } else if (!response.ok) {
            throw new Error('Fetch failed');
          } else {
            const data = await response.json();
            const balances = data.balances as Array<{ asset_type: string; balance: string }>;
            const nativeBalance = balances.find((b) => b.asset_type === 'native');
            formattedBalance = nativeBalance
              ? `${parseFloat(nativeBalance.balance).toFixed(2)} XLM`
              : '0.00 XLM';
          }
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
          toast.error('Please switch to Stellar Testnet in Freighter for full compatibility.');
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

  connect: async () => {
    if (get().status === 'connecting') return;

    set({
      status: 'connecting',
      errorMessage: null,
      errorCode: null,
      networkMismatch: false,
    });

    try {
      let connected = false;
      for (let i = 0; i < 5; i++) {
        const { isConnected: isFreighterConnected } = await isConnected();
        if (isFreighterConnected) {
          connected = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!connected) {
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

      const accessResult = await Promise.race([requestAccess(), timeoutPromise]);
      const { address, error } = accessResult;

      if (error) {
        throw new Error(String(error));
      }
      if (!address) {
        throw new Error('User denied access');
      }

      const { network } = await getNetwork();
      const net = (network as string | null) || null;
      const networkMismatch = net !== 'TESTNET';

      let formattedBalance: string | null = null;
      try {
        const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
        if (response.status === 404) {
          formattedBalance = '0.00 XLM';
        } else if (!response.ok) {
          throw new Error('Failed to fetch account data');
        } else {
          const data = await response.json();
          const balances = data.balances as Array<{ asset_type: string; balance: string }>;
          const nativeBalance = balances.find((b) => b.asset_type === 'native');
          formattedBalance = nativeBalance
            ? `${parseFloat(nativeBalance.balance).toFixed(2)} XLM`
            : '0.00 XLM';
        }
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
        toast.error('Please switch to Stellar Testnet in Freighter');
      }

      try {
        const challengeRes = await fetch(`${API_BASE}/api/auth/challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicKey: address }),
        });

        if (!challengeRes.ok) throw new Error('Failed to get auth challenge');

        const { challenge } = await challengeRes.json();

        const { signedMessage, error: signError } = await signMessage(challenge, {
          address,
          networkPassphrase:
            network === 'TESTNET'
              ? 'Test SDF Network ; September 2015'
              : 'Public Global Stellar Network ; September 2015',
        });

        if (signError) throw new Error(signError.message ?? 'Failed to sign challenge');

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
