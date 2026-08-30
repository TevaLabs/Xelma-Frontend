import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAccountBalances, formatBalance, HorizonError, HORIZON_URL } from './horizon';

const ADDRESS = 'GCEXAMPLE7ADDRESS7FOR7TESTS7ONLY7AAAAAAAAAAAAAAAAAAAAAAAA';

function mockFetchOnce(value: unknown) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(value);
}

describe('horizon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('HORIZON_URL', () => {
    it('defaults to the testnet endpoint and has no trailing slash', () => {
      expect(HORIZON_URL).toBe('https://horizon-testnet.stellar.org');
      expect(HORIZON_URL.endsWith('/')).toBe(false);
    });
  });

  describe('fetchAccountBalances', () => {
    it('requests the account from the configured Horizon URL', async () => {
      mockFetchOnce({ ok: true, status: 200, json: async () => ({ balances: [] }) });

      await fetchAccountBalances(ADDRESS);

      expect(global.fetch).toHaveBeenCalledWith(
        `${HORIZON_URL}/accounts/${ADDRESS}`,
        expect.anything(),
      );
    });

    it('splits the native balance out from trustlines', async () => {
      mockFetchOnce({
        ok: true,
        status: 200,
        json: async () => ({
          balances: [
            { asset_type: 'credit_alphanum4', asset_code: 'USDC', asset_issuer: 'GISSUER', balance: '25.5000000', limit: '1000' },
            { asset_type: 'native', balance: '101.9999999' },
          ],
        }),
      });

      const result = await fetchAccountBalances(ADDRESS);

      expect(result.isUnfunded).toBe(false);
      expect(result.native).toMatchObject({ code: 'XLM', isNative: true, balance: '101.9999999' });
      expect(result.trustlines).toHaveLength(1);
      expect(result.trustlines[0]).toMatchObject({
        code: 'USDC',
        issuer: 'GISSUER',
        isNative: false,
        limit: '1000',
        isAuthorized: true,
      });
    });

    it('treats a 404 as an unfunded account rather than an error', async () => {
      mockFetchOnce({ ok: false, status: 404, json: async () => ({}) });

      const result = await fetchAccountBalances(ADDRESS);

      expect(result).toEqual({ native: null, trustlines: [], isUnfunded: true });
    });

    it('marks a trustline unauthorized when Horizon reports is_authorized false', async () => {
      mockFetchOnce({
        ok: true,
        status: 200,
        json: async () => ({
          balances: [
            { asset_type: 'credit_alphanum4', asset_code: 'EURC', asset_issuer: 'GISSUER', balance: '0', is_authorized: false },
          ],
        }),
      });

      const result = await fetchAccountBalances(ADDRESS);

      expect(result.trustlines[0].isAuthorized).toBe(false);
    });

    it('throws a HorizonError on a non-404 failure status', async () => {
      mockFetchOnce({ ok: false, status: 500, json: async () => ({}) });

      await expect(fetchAccountBalances(ADDRESS)).rejects.toBeInstanceOf(HorizonError);
    });

    it('throws a HorizonError when the network request fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('offline'));

      await expect(fetchAccountBalances(ADDRESS)).rejects.toBeInstanceOf(HorizonError);
    });

    it('returns an empty result when Horizon omits the balances array', async () => {
      mockFetchOnce({ ok: true, status: 200, json: async () => ({}) });

      const result = await fetchAccountBalances(ADDRESS);

      expect(result.native).toBeNull();
      expect(result.trustlines).toEqual([]);
    });
  });

  describe('formatBalance', () => {
    it('formats to two decimal places by default', () => {
      expect(formatBalance('101.9999999')).toBe('102.00');
      expect(formatBalance('0')).toBe('0.00');
    });

    it('falls back to zero for unparseable input', () => {
      expect(formatBalance('not-a-number')).toBe('0.00');
    });
  });
});
