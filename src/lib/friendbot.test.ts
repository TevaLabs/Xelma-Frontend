import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const ADDRESS = 'GCEXAMPLE7ADDRESS7FOR7TESTS7ONLY7AAAAAAAAAAAAAAAAAAAAAAAA';

function mockFetchOnce(value: Partial<Response> & { json?: () => Promise<unknown> }) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(value as Response);
}

describe('friendbot', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_STELLAR_NETWORK', 'TESTNET');
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('friendbotUrl builds a testnet faucet link for the address', async () => {
    const { friendbotUrl, FRIENDBOT_URL } = await import('./friendbot');
    expect(friendbotUrl(ADDRESS)).toBe(`${FRIENDBOT_URL}/?addr=${encodeURIComponent(ADDRESS)}`);
  });

  it('resolves when Friendbot funds the account successfully', async () => {
    const { fundWithFriendbot } = await import('./friendbot');
    mockFetchOnce({ ok: true, status: 200 });

    await expect(fundWithFriendbot(ADDRESS)).resolves.toBeUndefined();
  });

  it('resolves (does not throw) when the account already exists (issue #619)', async () => {
    const { fundWithFriendbot } = await import('./friendbot');
    mockFetchOnce({
      ok: false,
      status: 400,
      json: async () => ({ detail: 'createAccountAlreadyExist' }),
    });

    await expect(fundWithFriendbot(ADDRESS)).resolves.toBeUndefined();
  });

  it('throws a friendly, specific message when Friendbot rate-limits (429)', async () => {
    const { fundWithFriendbot, FriendbotError } = await import('./friendbot');
    mockFetchOnce({ ok: false, status: 429, json: async () => ({}) });

    await expect(fundWithFriendbot(ADDRESS)).rejects.toMatchObject({
      constructor: FriendbotError,
      message: expect.stringMatching(/rate limiting/i),
    });
  });

  it('throws a friendly message when the network request itself fails', async () => {
    const { fundWithFriendbot, FriendbotError } = await import('./friendbot');
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network down'));

    await expect(fundWithFriendbot(ADDRESS)).rejects.toMatchObject({
      constructor: FriendbotError,
      message: expect.stringMatching(/could not reach friendbot/i),
    });
  });

  it('rethrows an AbortError as-is rather than wrapping it', async () => {
    const { fundWithFriendbot } = await import('./friendbot');
    const abortError = new DOMException('aborted', 'AbortError');
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(abortError);

    await expect(fundWithFriendbot(ADDRESS)).rejects.toBe(abortError);
  });

  it('surfaces a non-400/429 failure with the response detail when present', async () => {
    const { fundWithFriendbot, FriendbotError } = await import('./friendbot');
    mockFetchOnce({ ok: false, status: 500, json: async () => ({ detail: 'internal error' }) });

    await expect(fundWithFriendbot(ADDRESS)).rejects.toMatchObject({
      constructor: FriendbotError,
      message: expect.stringMatching(/internal error/i),
    });
  });

  it('falls back to a status-based message when the failure response has no JSON body', async () => {
    const { fundWithFriendbot } = await import('./friendbot');
    mockFetchOnce({
      ok: false,
      status: 503,
      json: async () => {
        throw new Error('not json');
      },
    });

    await expect(fundWithFriendbot(ADDRESS)).rejects.toThrow(/503/);
  });

  it('rejects immediately without calling fetch when Friendbot is disabled (mainnet)', async () => {
    vi.stubEnv('VITE_STELLAR_NETWORK', 'PUBLIC');
    const { fundWithFriendbot, FriendbotError } = await import('./friendbot');

    await expect(fundWithFriendbot(ADDRESS)).rejects.toThrow(FriendbotError);
    await expect(fundWithFriendbot(ADDRESS)).rejects.toThrow(/only available on stellar testnet/i);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
