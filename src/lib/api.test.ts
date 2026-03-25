import { beforeEach, describe, expect, it, vi } from 'vitest';

const clearAuthMock = vi.fn();

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: {
    getState: () => ({
      jwt: 'test-jwt',
      clearAuth: clearAuthMock,
    }),
  },
}));

describe('apiFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearAuthMock.mockReset();
  });

  it('returns JSON on 200', async () => {
    const payload = { ok: true };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(payload), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    const { apiFetch } = await import('./api');
    await expect(apiFetch('/api/test')).resolves.toEqual(payload);
  });

  it('throws typed error on 400 with backend message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Bad request payload', code: 'BAD_REQUEST' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    const { apiFetch } = await import('./api');
    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      message: 'Bad request payload',
      status: 400,
      code: 'BAD_REQUEST',
    });
  });

  it('clears auth and throws on 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    const { apiFetch } = await import('./api');
    await expect(apiFetch('/api/test')).rejects.toMatchObject({ status: 401 });
    expect(clearAuthMock).toHaveBeenCalledTimes(1);
  });

  it('uses actionable fallback message on 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('Internal Error', { status: 500 }))
    );
    const { apiFetch } = await import('./api');
    await expect(apiFetch('/api/test')).rejects.toMatchObject({
      status: 500,
      message: 'Server error. Please try again shortly.',
    });
  });

  it('throws timeout code on aborted request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      })
    );
    const { apiFetch } = await import('./api');
    await expect(apiFetch('/api/test', { timeoutMs: 1 })).rejects.toMatchObject({
      code: 'TIMEOUT',
      message: 'Request timed out. Please try again.',
    });
  });
});

