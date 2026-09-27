import { beforeEach, describe, expect, it, vi } from 'vitest';

const clearAuth = vi.fn();
const setJwt = vi.fn();

vi.mock('./useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({
      clearAuth,
      setJwt,
      isAuthenticated: false,
    }),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  getAddress: vi.fn(),
  getNetwork: vi.fn(),
  signMessage: vi.fn(),
}));

import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
  signMessage,
} from '@stellar/freighter-api';
import { toast } from 'sonner';
import { useWalletStore, selectIsWalletConnected } from './useWalletStore';

function resetWalletState() {
  useWalletStore.setState({
    status: 'idle',
    publicKey: null,
    network: null,
    balance: null,
    errorMessage: null,
    errorCode: null,
    networkMismatch: false,
    isWatchOnly: false,
  });
}

describe('selectIsWalletConnected', () => {
  beforeEach(() => {
    resetWalletState();
  });

  it('is true only when status is connected and publicKey is set', () => {
    useWalletStore.setState({ status: 'connected', publicKey: 'GABC' });
    expect(selectIsWalletConnected(useWalletStore.getState())).toBe(true);

    useWalletStore.setState({ status: 'connecting', publicKey: 'GABC' });
    expect(selectIsWalletConnected(useWalletStore.getState())).toBe(false);

    useWalletStore.setState({ status: 'connected', publicKey: null });
    expect(selectIsWalletConnected(useWalletStore.getState())).toBe(false);
  });
});

describe('useWalletStore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearAuth.mockClear();
    setJwt.mockClear();
    resetWalletState();
  });

  it('disconnect clears wallet and calls clearAuth', () => {
    useWalletStore.setState({
      status: 'connected',
      publicKey: 'GKEY',
      network: 'TESTNET',
      balance: '1.00 XLM',
    });

    useWalletStore.getState().disconnect();

    const s = useWalletStore.getState();
    expect(s.status).toBe('idle');
    expect(s.publicKey).toBeNull();
    expect(clearAuth).toHaveBeenCalledTimes(1);
  });

  it('clearError removes error fields', () => {
    useWalletStore.setState({
      status: 'error',
      errorMessage: 'oops',
      errorCode: 'UNKNOWN',
    });
    useWalletStore.getState().clearError();
    expect(useWalletStore.getState().errorMessage).toBeNull();
    expect(useWalletStore.getState().errorCode).toBeNull();
  });

  it('checkConnection sets idle when Freighter is not connected', async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: false });

    await useWalletStore.getState().checkConnection();

    const s = useWalletStore.getState();
    expect(s.status).toBe('idle');
    expect(s.publicKey).toBeNull();
    expect(isConnected).toHaveBeenCalled();
  });

  it('checkConnection restores connected state with address and TESTNET', async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(getAddress).mockResolvedValue({ address: 'GADDR', error: undefined });
    vi.mocked(getNetwork).mockResolvedValue({
      network: 'TESTNET',
      networkPassphrase: 'Test SDF Network ; September 2015',
      error: undefined,
    } as Awaited<ReturnType<typeof getNetwork>>);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        balances: [{ asset_type: 'native', balance: '10.5' }],
      }),
    }) as unknown as typeof fetch;

    await useWalletStore.getState().checkConnection();

    const s = useWalletStore.getState();
    expect(s.status).toBe('connected');
    expect(s.publicKey).toBe('GADDR');
    expect(s.networkMismatch).toBe(false);
    expect(s.balance).toBe('10.50 XLM');
  });

  it('dedupes concurrent checkConnection into one Freighter round-trip', async () => {
    let resolveConnected!: (v: { isConnected: boolean }) => void;
    const connectedPromise = new Promise<{ isConnected: boolean }>((res) => {
      resolveConnected = res;
    });

    vi.mocked(isConnected).mockReturnValue(connectedPromise as never);
    vi.mocked(getAddress).mockResolvedValue({ address: 'G1', error: undefined });
    vi.mocked(getNetwork).mockResolvedValue({
      network: 'TESTNET',
      networkPassphrase: 'Test SDF Network ; September 2015',
      error: undefined,
    } as Awaited<ReturnType<typeof getNetwork>>);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        balances: [{ asset_type: 'native', balance: '1' }],
      }),
    }) as unknown as typeof fetch;

    const p1 = useWalletStore.getState().checkConnection();
    const p2 = useWalletStore.getState().checkConnection();
    resolveConnected({ isConnected: true });
    await Promise.all([p1, p2]);

    expect(isConnected).toHaveBeenCalledTimes(1);
    expect(useWalletStore.getState().publicKey).toBe('G1');
  });

  it('connect sets error when Freighter never becomes available', async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: false });

    await useWalletStore.getState().connect();

    const s = useWalletStore.getState();
    expect(s.status).toBe('error');
    expect(s.errorCode).toBe('FREIGHTER_UNAVAILABLE');
    expect(s.publicKey).toBeNull();
  });

  it('connect reaches connected and authenticates when APIs succeed', async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(requestAccess).mockResolvedValue({
      address: 'GSIGNER',
      error: undefined,
    });
    vi.mocked(getNetwork).mockResolvedValue({
      network: 'TESTNET',
      networkPassphrase: 'Test SDF Network ; September 2015',
      error: undefined,
    } as Awaited<ReturnType<typeof getNetwork>>);
    vi.mocked(signMessage).mockResolvedValue({
      signedMessage: 'sig',
      signerAddress: 'GSIGNER',
      error: undefined,
    } as Awaited<ReturnType<typeof signMessage>>);

    const fetchMock = vi.fn((url: string) => {
      if (url.includes('horizon-testnet')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            balances: [{ asset_type: 'native', balance: '2' }],
          }),
        });
      }
      if (url.includes('/api/auth/challenge')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ challenge: 'challenge-bytes' }),
        });
      }
      if (url.includes('/api/auth/connect')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ token: 'jwt-1' }),
        });
      }
      return Promise.reject(new Error(`unexpected fetch ${url}`));
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await useWalletStore.getState().connect();

    const s = useWalletStore.getState();
    expect(s.status).toBe('connected');
    expect(s.publicKey).toBe('GSIGNER');
    expect(setJwt).toHaveBeenCalledWith('jwt-1');
    expect(s.errorCode).not.toBe('AUTH_FAILED');
  });

  it('connect keeps wallet connected but sets AUTH_FAILED when backend rejects', async () => {
    vi.mocked(isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(requestAccess).mockResolvedValue({
      address: 'GSIGNER',
      error: undefined,
    });
    vi.mocked(getNetwork).mockResolvedValue({
      network: 'TESTNET',
      networkPassphrase: 'Test SDF Network ; September 2015',
      error: undefined,
    } as Awaited<ReturnType<typeof getNetwork>>);
    vi.mocked(signMessage).mockResolvedValue({
      signedMessage: 'sig',
      signerAddress: 'GSIGNER',
      error: undefined,
    } as Awaited<ReturnType<typeof signMessage>>);

    const fetchMock = vi.fn((url: string) => {
      if (url.includes('horizon-testnet')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            balances: [{ asset_type: 'native', balance: '2' }],
          }),
        });
      }
      if (url.includes('/api/auth/challenge')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ challenge: 'challenge-bytes' }),
        });
      }
      if (url.includes('/api/auth/connect')) {
        return Promise.resolve({ ok: false, status: 401 });
      }
      return Promise.reject(new Error(`unexpected fetch ${url}`));
    });

    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await useWalletStore.getState().connect();

    const s = useWalletStore.getState();
    expect(s.status).toBe('connected');
    expect(s.publicKey).toBe('GSIGNER');
    expect(clearAuth).toHaveBeenCalled();
    expect(s.errorCode).toBe('AUTH_FAILED');
    expect(s.errorMessage).toMatch(/sign-in/i);
  });

  describe('setWatchOnly (manual G-address path, issue #579)', () => {
    const MANUAL_ADDRESS = 'GBH4QFZVFSLJL4VXK2XEFJGR4D3IUBEN2LO2W3KL6XRB5YVLXUBVQXLH';

    beforeEach(() => {
      vi.resetAllMocks();
      clearAuth.mockClear();
      setJwt.mockClear();
      resetWalletState();
    });

    it('activates watch-only without any Freighter connection round-trip', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          balances: [{ asset_type: 'native', balance: '3.21' }],
        }),
      }) as unknown as typeof fetch;

      await useWalletStore.getState().setWatchOnly(MANUAL_ADDRESS);

      const s = useWalletStore.getState();
      expect(s.status).toBe('connected');
      expect(s.isWatchOnly).toBe(true);
      expect(s.publicKey).toBe(MANUAL_ADDRESS);
      // Regression guard: the manual path must stay free of Freighter calls
      expect(isConnected).not.toHaveBeenCalled();
      expect(requestAccess).not.toHaveBeenCalled();
      expect(getAddress).not.toHaveBeenCalled();
    });

    it('never toasts a false "Wallet connected!" on the manual path', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          balances: [{ asset_type: 'native', balance: '1' }],
        }),
      }) as unknown as typeof fetch;

      await useWalletStore.getState().setWatchOnly(MANUAL_ADDRESS);

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).not.toHaveBeenCalledWith('Wallet connected!');
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/watch-only/i),
      );
    });

    it('announces accurate watch-only copy without signing capability', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ balances: [] }),
      }) as unknown as typeof fetch;

      await useWalletStore.getState().setWatchOnly(MANUAL_ADDRESS);

      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Viewing address without signing capability'),
      );
    });

    it('does not start backend authentication for a watch-only address', async () => {
      const fetchMock = vi.fn((url: string) => {
        if (url.includes('horizon-testnet')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              balances: [{ asset_type: 'native', balance: '5' }],
            }),
          });
        }
        return Promise.reject(new Error(`unexpected fetch ${url}`));
      });
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      await useWalletStore.getState().setWatchOnly(MANUAL_ADDRESS);

      expect(fetchMock).not.toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/'),
        expect.anything(),
      );
      expect(setJwt).not.toHaveBeenCalled();
    });

    it('rejects non-G addresses with a clear validation error and no success toast', async () => {
      globalThis.fetch = vi.fn() as unknown as typeof fetch;

      await useWalletStore.getState().setWatchOnly('SBOG3USROPBWQAHERR3FBWDM3OVSCYJZ2LAYGZNVVTPVJ62V23GZJNCE');

      const s = useWalletStore.getState();
      expect(s.status).toBe('error');
      expect(s.errorCode).toBe('UNKNOWN');
      expect(s.errorMessage).toMatch(/invalid stellar address/i);
      expect(s.errorMessage).toMatch(/G-address/i);
      expect(toast.error).toHaveBeenCalledWith(
        expect.stringMatching(/invalid stellar address/i),
      );
      expect(toast.success).not.toHaveBeenCalled();
      expect(s.isWatchOnly).toBe(false);
      expect(s.publicKey).toBeNull();
    });

    it('rejects addresses that are not exactly 56 characters', async () => {
      globalThis.fetch = vi.fn() as unknown as typeof fetch;

      await useWalletStore.getState().setWatchOnly('GABC');

      const s = useWalletStore.getState();
      expect(s.status).toBe('error');
      expect(s.errorMessage).toMatch(/invalid stellar address/i);
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('clears error state and keeps the address watch-only after a failed attempt recovers', async () => {
      // First: a failed manual attempt
      await useWalletStore.getState().setWatchOnly('GABC');
      expect(useWalletStore.getState().status).toBe('error');

      // Then: a successful retry must leave no stale error fields behind
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          balances: [{ asset_type: 'native', balance: '2' }],
        }),
      }) as unknown as typeof fetch;

      await useWalletStore.getState().setWatchOnly(MANUAL_ADDRESS);

      const s = useWalletStore.getState();
      expect(s.status).toBe('connected');
      expect(s.isWatchOnly).toBe(true);
      expect(s.errorMessage).toBeNull();
      expect(s.errorCode).toBeNull();
    });

    it('shows a balance warning toast but still activates watch-only when Horizon fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Horizon down')) as unknown as typeof fetch;

      await useWalletStore.getState().setWatchOnly(MANUAL_ADDRESS);

      const s = useWalletStore.getState();
      expect(s.status).toBe('connected');
      expect(s.isWatchOnly).toBe(true);
      expect(s.balance).toBeNull();
      expect(toast.error).toHaveBeenCalledWith(
        'Could not load balance. The address may not exist on the network.',
      );
      // The activation toast must still be the accurate watch-only copy
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/watch-only mode activated/i),
      );
    });
  });
});
