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
import { useWalletStore, selectIsWalletConnected } from './useWalletStore';
import { toast } from 'sonner';

const VALID_G_ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

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
});

describe('useWalletStore setWatchOnly', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearAuth.mockClear();
    setJwt.mockClear();
    resetWalletState();
  });

  it('activates watch-only mode with the address, balance and no signing', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ balances: [{ asset_type: 'native', balance: '7.25' }] }),
    }) as unknown as typeof fetch;

    await useWalletStore.getState().setWatchOnly(VALID_G_ADDRESS);

    const s = useWalletStore.getState();
    expect(s.isWatchOnly).toBe(true);
    expect(s.status).toBe('connected');
    expect(s.publicKey).toBe(VALID_G_ADDRESS);
    expect(s.balance).toBe('7.25 XLM');
    expect(s.errorMessage).toBeNull();
  });

  it('normalizes casing and surrounding whitespace before storing the address', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ balances: [{ asset_type: 'native', balance: '1' }] }),
    }) as unknown as typeof fetch;

    await useWalletStore.getState().setWatchOnly(`  ${VALID_G_ADDRESS.toLowerCase()}  `);

    expect(useWalletStore.getState().publicKey).toBe(VALID_G_ADDRESS);
  });

  it('toasts watch-only copy, never a Freighter connection', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ balances: [{ asset_type: 'native', balance: '1' }] }),
    }) as unknown as typeof fetch;

    await useWalletStore.getState().setWatchOnly(VALID_G_ADDRESS);

    expect(toast.success).toHaveBeenCalledWith(expect.stringMatching(/watch-only/i));
    const messages = vi.mocked(toast.success).mock.calls.flat().join(' ');
    expect(messages).not.toMatch(/wallet connected|freighter/i);
  });

  it('rejects a non-G-address and leaves no watch-only state behind', async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    await useWalletStore.getState().setWatchOnly('S'.repeat(56));

    const s = useWalletStore.getState();
    expect(s.isWatchOnly).toBe(false);
    expect(s.status).toBe('error');
    expect(s.publicKey).toBeNull();
    expect(s.errorMessage).toMatch(/g-address/i);
    expect(toast.error).toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('rejects a 56-character string that is not a real Stellar address', async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;

    await useWalletStore.getState().setWatchOnly('G'.repeat(56));

    const s = useWalletStore.getState();
    expect(s.isWatchOnly).toBe(false);
    expect(s.status).toBe('error');
    expect(s.publicKey).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('still activates watch-only when the balance cannot be read', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

    await useWalletStore.getState().setWatchOnly(VALID_G_ADDRESS);

    const s = useWalletStore.getState();
    expect(s.isWatchOnly).toBe(true);
    expect(s.status).toBe('connected');
    expect(s.publicKey).toBe(VALID_G_ADDRESS);
    expect(s.balance).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(expect.stringMatching(/balance/i));
  });
});
