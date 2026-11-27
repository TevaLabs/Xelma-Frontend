import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProfileSettingsValues } from './profileApi';

const clearAuthMock = vi.fn();
const resetWalletMock = vi.fn();
const notifyRateLimitedMock = vi.fn();
const toastErrorMock = vi.fn(() => 'toast-id');

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({
      jwt: 'store-jwt',
      clearAuth: clearAuthMock,
    }),
  },
}));

vi.mock('../store/useWalletStore', () => ({
  useWalletStore: {
    getState: () => ({
      reset: resetWalletMock,
    }),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: toastErrorMock,
  },
}));

vi.mock('./rate-limit-toast', () => ({
  notifyRateLimited: notifyRateLimitedMock,
}));

const mockProfile: ProfileSettingsValues = {
  avatarUrl: 'https://example.com/avatar.png',
  name: 'Alice',
  bio: 'Stellar trader',
  twitterLink: 'https://twitter.com/alice',
  streamerMode: false,
};

describe('profileApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearAuthMock.mockReset();
    resetWalletMock.mockReset();
    notifyRateLimitedMock.mockReset();
    toastErrorMock.mockReset();
  });

  it('fetches profile via apiFetch with bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockProfile), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { fetchProfile } = await import('./profileApi');
    await expect(fetchProfile('explicit-jwt')).resolves.toEqual(mockProfile);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/user\/profile$/),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer explicit-jwt',
        }),
      }),
    );
  });

  it('updates profile via apiFetch with PATCH and JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(mockProfile), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { updateProfile } = await import('./profileApi');
    await expect(updateProfile('explicit-jwt', mockProfile)).resolves.toEqual(mockProfile);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/user\/profile$/),
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer explicit-jwt',
        }),
        body: JSON.stringify(mockProfile),
      }),
    );
  });

  it('triggers 401 session-expired UX on fetchProfile', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const { fetchProfile } = await import('./profileApi');
    await expect(fetchProfile('expired-jwt')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Unauthorized',
    });

    expect(clearAuthMock).toHaveBeenCalledTimes(1);
    expect(resetWalletMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Session expired',
      expect.objectContaining({ id: 'session-expired', duration: Infinity }),
    );
  });

  it('triggers 401 session-expired UX on updateProfile', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const { updateProfile } = await import('./profileApi');
    await expect(updateProfile('expired-jwt', mockProfile)).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Unauthorized',
    });

    expect(clearAuthMock).toHaveBeenCalledTimes(1);
    expect(resetWalletMock).toHaveBeenCalledTimes(1);
    expect(toastErrorMock).toHaveBeenCalledWith(
      'Session expired',
      expect.objectContaining({ id: 'session-expired', duration: Infinity }),
    );
  });

  it('triggers 429 rate-limit UX on fetchProfile', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 429,
          headers: { 'Retry-After': '15' },
        }),
      ),
    );

    const { fetchProfile } = await import('./profileApi');
    await expect(fetchProfile('valid-jwt')).rejects.toMatchObject({
      name: 'ApiError',
      status: 429,
      retryAfterSeconds: 15,
    });

    expect(notifyRateLimitedMock).toHaveBeenCalledWith(15);
  });
});
