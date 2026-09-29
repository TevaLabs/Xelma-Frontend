import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type * as Explorer from './explorer';

const ADDRESS = 'GCEXAMPLE7ADDRESS7FOR7TESTS7ONLY7AAAAAAAAAAAAAAAAAAAAAAAA';
const TX_HASH =
  '3f2b1c9d8e7a6f5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b';

const BASE = 'https://stellar.expert/explorer';

/** Loads a fresh module instance with `VITE_STELLAR_NETWORK` set to `network`. */
async function loadFor(network: string): Promise<typeof Explorer> {
  vi.stubEnv('VITE_STELLAR_NETWORK', network);
  vi.resetModules();
  return import('./explorer');
}

describe('explorer', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_STELLAR_NETWORK', 'TESTNET');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('EXPLORER_NETWORK', () => {
    it('maps testnet to the "testnet" URL segment', async () => {
      const { EXPLORER_NETWORK } = await loadFor('TESTNET');
      expect(EXPLORER_NETWORK).toBe('testnet');
    });

    it('maps public to the "public" URL segment', async () => {
      const { EXPLORER_NETWORK } = await loadFor('PUBLIC');
      expect(EXPLORER_NETWORK).toBe('public');
    });

    it('accepts the MAINNET alias as public', async () => {
      const { EXPLORER_NETWORK } = await loadFor('MAINNET');
      expect(EXPLORER_NETWORK).toBe('public');
    });

    it('is case insensitive, matching the Horizon network switch', async () => {
      const { EXPLORER_NETWORK } = await loadFor('public');
      expect(EXPLORER_NETWORK).toBe('public');
    });

    it('falls back to testnet when the network is unset', async () => {
      vi.stubEnv('VITE_STELLAR_NETWORK', undefined);
      vi.resetModules();
      const { EXPLORER_NETWORK } = await import('./explorer');
      expect(EXPLORER_NETWORK).toBe('testnet');
    });
  });

  describe('txUrl', () => {
    it('builds a testnet transaction link', async () => {
      const { txUrl } = await loadFor('TESTNET');
      expect(txUrl(TX_HASH)).toBe(`${BASE}/testnet/tx/${TX_HASH}`);
    });

    it('builds a public transaction link on mainnet', async () => {
      const { txUrl } = await loadFor('PUBLIC');
      expect(txUrl(TX_HASH)).toBe(`${BASE}/public/tx/${TX_HASH}`);
    });

    it('targets stellar.expert over https with no doubled slashes', async () => {
      const { txUrl } = await loadFor('TESTNET');
      const url = txUrl(TX_HASH);
      expect(url.startsWith('https://')).toBe(true);
      expect(url.slice('https://'.length)).not.toContain('//');
    });

    it('preserves the hash verbatim, including case', async () => {
      const { txUrl } = await loadFor('TESTNET');
      const upper = TX_HASH.toUpperCase();
      expect(txUrl(upper)).toBe(`${BASE}/testnet/tx/${upper}`);
    });
  });

  describe('accountUrl', () => {
    it('builds a testnet account link', async () => {
      const { accountUrl } = await loadFor('TESTNET');
      expect(accountUrl(ADDRESS)).toBe(`${BASE}/testnet/account/${ADDRESS}`);
    });

    it('builds a public account link on mainnet', async () => {
      const { accountUrl } = await loadFor('PUBLIC');
      expect(accountUrl(ADDRESS)).toBe(`${BASE}/public/account/${ADDRESS}`);
    });

    it('targets stellar.expert over https with no doubled slashes', async () => {
      const { accountUrl } = await loadFor('PUBLIC');
      const url = accountUrl(ADDRESS);
      expect(url.startsWith('https://')).toBe(true);
      expect(url.slice('https://'.length)).not.toContain('//');
    });
  });

  describe('input handling', () => {
    it('does not throw on an empty hash and stays on the testnet', async () => {
      const { txUrl } = await loadFor('TESTNET');
      expect(() => txUrl('')).not.toThrow();
      expect(txUrl('')).toBe(`${BASE}/testnet/tx/`);
    });

    it('does not throw on an empty address and stays on the public network', async () => {
      const { accountUrl } = await loadFor('PUBLIC');
      expect(() => accountUrl('')).not.toThrow();
      expect(accountUrl('')).toBe(`${BASE}/public/account/`);
    });

    it('passes a malformed address through unvalidated rather than encoding it', async () => {
      const { accountUrl } = await loadFor('TESTNET');
      expect(accountUrl('not an address')).toBe(`${BASE}/testnet/account/not an address`);
    });

    it('passes a malformed hash through unvalidated rather than encoding it', async () => {
      const { txUrl } = await loadFor('TESTNET');
      expect(txUrl('abc/def')).toBe(`${BASE}/testnet/tx/abc/def`);
    });
  });

  describe('no network I/O', () => {
    it('performs no fetch calls for any helper', async () => {
      const { txUrl, accountUrl } = await loadFor('TESTNET');
      txUrl(TX_HASH);
      accountUrl(ADDRESS);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
