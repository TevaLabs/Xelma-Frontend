import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  clearAuth,
  setJwt,
  setIsAuthenticating,
  clearNotifications,
  leaveChannel,
} = vi.hoisted(() => ({
  clearAuth: vi.fn(),
  setJwt: vi.fn(),
  setIsAuthenticating: vi.fn(),
  clearNotifications: vi.fn(),
  leaveChannel: vi.fn(),
}));

vi.mock('./useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({
      clearAuth,
      setJwt,
      setIsAuthenticating,
      isAuthenticated: false,
      isAuthenticating: false,
    }),
  },
}));

vi.mock('./useNotificationsStore', () => ({
  useNotificationsStore: {
    getState: () => ({
      clear: clearNotifications,
    }),
  },
}));

vi.mock('../lib/socket', () => ({
  appSocket: {
    leaveChannel,
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
    setIsAuthenticating.mockClear();
    clearNotifications.mockClear();
    leaveChannel.mockClear();
    resetWalletState();
  });

  it('disconnect clears wallet and notification joins and calls clearAuth', () => {
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
    expect(leaveChannel).toHaveBeenCalledWith('join:notifications', 'GKEY');
    expect(clearNotifications).toHaveBeenCalledTimes(1);
  });

  it('reset clears wallet and notification joins and calls clearAuth', () => {
    useWalletStore.setState({
      status: 'connected',
      publicKey: 'GKEY',
      network: 'TESTNET',
      balance: '1.00 XLM',
    });

    useWalletStore.getState().reset();

    const s = useWalletStore.getState();
    expect(s.status).toBe('idle');
    expect(s.publicKey).toBeNull();
    expect(clearAuth).toHaveBeenCalledTimes(1);
    expect(leaveChannel).toHaveBeenCalledWith('join:notifications', 'GKEY');
    expect(clearNotifications).toHaveBeenCalledTimes(1);
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

  it('checkConnection sets idle and clears auth when Freighter is not connected', async () => {
    useWalletStore.setState({
      status: 'connected',
      publicKey: 'GKEY',
    });
    vi.mocked(isConnected).mockResolvedValue({ isConnected: false });

    await useWalletStore.getState().checkConnection();

    const s = useWalletStore.getState();
    expect(s.status).toBe('idle');
    expect(s.publicKey).toBeNull();
    expect(isConnected).toHaveBeenCalled();
    expect(clearAuth).toHaveBeenCalledTimes(1);
    expect(leaveChannel).toHaveBeenCalledWith('join:notifications', 'GKEY');
    expect(clearNotifications).toHaveBeenCalledTimes(1);
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

  it('checkConnection clears auth and notification joins when Freighter returns no address', async () => {
    useWalletStore.setState({
      status: 'connected',
      publicKey: 'GKEY',
    });
    vi.mocked(isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(getAddress).mockResolvedValue({ address: '', error: undefined });

    await useWalletStore.getState().checkConnection();

    const s = useWalletStore.getState();
    expect(s.status).toBe('idle');
    expect(s.publicKey).toBeNull();
    expect(clearAuth).toHaveBeenCalledTimes(1);
    expect(leaveChannel).toHaveBeenCalledWith('join:notifications', 'GKEY');
    expect(clearNotifications).toHaveBeenCalledTimes(1);
  });

  it('checkConnection clears previous auth and notification joins when address changes', async () => {
    useWalletStore.setState({
      status: 'connected',
      publicKey: 'GOLD_KEY',
    });
    vi.mocked(isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(getAddress).mockResolvedValue({ address: 'GNEW_KEY', error: undefined });
    vi.mocked(getNetwork).mockResolvedValue({
      network: 'TESTNET',
      networkPassphrase: 'Test SDF Network ; September 2015',
      error: undefined,
    } as Awaited<ReturnType<typeof getNetwork>>);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        balances: [{ asset_type: 'native', balance: '5.0' }],
      }),
    }) as unknown as typeof fetch;

    await useWalletStore.getState().checkConnection();

    const s = useWalletStore.getState();
    expect(s.status).toBe('connected');
    expect(s.publicKey).toBe('GNEW_KEY');
    expect(clearAuth).toHaveBeenCalledTimes(1);
    expect(leaveChannel).toHaveBeenCalledWith('join:notifications', 'GOLD_KEY');
    expect(clearNotifications).toHaveBeenCalledTimes(1);
  });

  it('checkConnection clears auth and notification joins when checkConnection throws', async () => {
    useWalletStore.setState({
      status: 'connected',
      publicKey: 'GKEY',
    });
    vi.mocked(isConnected).mockRejectedValue(new Error('Freighter extension disconnected'));

    await useWalletStore.getState().checkConnection();

    const s = useWalletStore.getState();
    expect(s.status).toBe('idle');
    expect(s.publicKey).toBeNull();
    expect(clearAuth).toHaveBeenCalledTimes(1);
    expect(leaveChannel).toHaveBeenCalledWith('join:notifications', 'GKEY');
    expect(clearNotifications).toHaveBeenCalledTimes(1);
  });

  it('setWatchOnly clears previous auth and notification joins', async () => {
    useWalletStore.setState({
      status: 'connected',
      publicKey: 'GAUTH_KEY',
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        balances: [{ asset_type: 'native', balance: '0' }],
      }),
    }) as unknown as typeof fetch;

    const watchOnlyAddress = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    await useWalletStore.getState().setWatchOnly(watchOnlyAddress);

    const s = useWalletStore.getState();
    expect(s.isWatchOnly).toBe(true);
    expect(s.publicKey).toBe(watchOnlyAddress);
    expect(clearAuth).toHaveBeenCalledTimes(1);
    expect(leaveChannel).toHaveBeenCalledWith('join:notifications', 'GAUTH_KEY');
    expect(clearNotifications).toHaveBeenCalledTimes(1);
  });
});
