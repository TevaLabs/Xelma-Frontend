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

vi.mock('../utils/validateStellarAddress', () => ({
  validateStellarAddressFormat: vi.fn(),
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
import { useWalletStore, selectIsWalletConnected } from './useWalletStore';
import { validateStellarAddressFormat } from '../utils/validateStellarAddress';
import { toast } from 'sonner';

function resetWalletState() {
  useWalletStore.setState({
    status: 'idle',
    publicKey: null,
    network: null,
    balance: null,
    errorMessage: null,
    errorCode: null,
    networkMismatch: false,
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

  describe('setWatchOnly', () => {
    const VALID_ADDRESS = 'GBZUCH67MSLCTGVCIEZ4OX24Y6OOAWNXKFNZAVTSLDSML2ZVMCIP6ATT';

    beforeEach(() => {
      vi.mocked(validateStellarAddressFormat).mockReturnValue(true);
    });

    it('connects in watch-only mode only for a valid, funded address', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ balances: [{ asset_type: 'native', balance: '12.5' }] }),
      }) as unknown as typeof fetch;

      await useWalletStore.getState().setWatchOnly(VALID_ADDRESS);

      const s = useWalletStore.getState();
      expect(s.status).toBe('connected');
      expect(s.isWatchOnly).toBe(true);
      expect(s.publicKey).toBe(VALID_ADDRESS);
      expect(s.network).toBe('testnet');
      expect(s.balance).toBe('12.50 XLM');
      expect(s.errorMessage).toBeNull();
      expect(toast.success).toHaveBeenCalledWith(
        'Watch-only mode activated. Viewing address without signing capability.',
      );
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('rejects a malformed address without reaching Horizon or faking Connected', async () => {
      const fetchSpy = vi.fn();
      globalThis.fetch = fetchSpy as unknown as typeof fetch;
      vi.mocked(validateStellarAddressFormat).mockReturnValue(false);

      await useWalletStore.getState().setWatchOnly('NOT-A-STELLAR-ADDRESS');

      const s = useWalletStore.getState();
      expect(s.status).toBe('error');
      expect(s.publicKey).toBeNull();
      expect(s.isWatchOnly).toBe(false);
      expect(s.errorMessage).toMatch(/invalid stellar address/i);
      expect(toast.error).toHaveBeenCalledWith(s.errorMessage);
      expect(toast.success).not.toHaveBeenCalled();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('rejects an address that does not exist on the network instead of faking Connected', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({}),
      }) as unknown as typeof fetch;

      await useWalletStore.getState().setWatchOnly(VALID_ADDRESS);

      const s = useWalletStore.getState();
      expect(s.status).toBe('error');
      expect(s.publicKey).toBeNull();
      expect(s.isWatchOnly).toBe(false);
      expect(s.errorMessage).toBe('Account not found on Testnet.');
      expect(toast.error).toHaveBeenCalledWith('Account not found on Testnet.');
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('rejects when Horizon is unreachable instead of faking Connected', async () => {
      globalThis.fetch = vi
        .fn()
        .mockRejectedValue(new Error('offline')) as unknown as typeof fetch;

      await useWalletStore.getState().setWatchOnly(VALID_ADDRESS);

      const s = useWalletStore.getState();
      expect(s.status).toBe('error');
      expect(s.publicKey).toBeNull();
      expect(s.isWatchOnly).toBe(false);
      expect(s.errorMessage).toMatch(/horizon/i);
      expect(toast.error).toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });

    it('normalizes the stored address to trimmed uppercase', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ balances: [{ asset_type: 'native', balance: '0' }] }),
      }) as unknown as typeof fetch;

      await useWalletStore.getState().setWatchOnly(`  ${VALID_ADDRESS.toLowerCase()}  `);

      expect(useWalletStore.getState().publicKey).toBe(VALID_ADDRESS);
    });
  });
});
