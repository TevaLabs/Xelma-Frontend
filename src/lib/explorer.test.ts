import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TX_HASH = 'a'.repeat(64);
const ADDRESS = 'GCEXAMPLE7ADDRESS7FOR7TESTS7ONLY7AAAAAAAAAAAAAAAAAAAAAAAA';

describe('explorer', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_STELLAR_NETWORK', 'TESTNET');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('EXPLORER_NETWORK', () => {
    it('maps the testnet configuration to the testnet network path', async () => {
      const { EXPLORER_NETWORK } = await import('./explorer');
      expect(EXPLORER_NETWORK).toBe('testnet');
    });

    it('maps the public/mainnet configuration to the public network path', async () => {
      vi.stubEnv('VITE_STELLAR_NETWORK', 'PUBLIC');
      const { EXPLORER_NETWORK } = await import('./explorer');
      expect(EXPLORER_NETWORK).toBe('public');
    });
  });

  describe('txUrl', () => {
    it('builds a testnet transaction explorer URL containing the hash', async () => {
      const { txUrl } = await import('./explorer');
      expect(txUrl(TX_HASH)).toBe(`https://stellar.expert/explorer/testnet/tx/${TX_HASH}`);
    });

    it('builds a public transaction explorer URL on the public network', async () => {
      vi.stubEnv('VITE_STELLAR_NETWORK', 'PUBLIC');
      const { txUrl } = await import('./explorer');
      expect(txUrl(TX_HASH)).toBe(`https://stellar.expert/explorer/public/tx/${TX_HASH}`);
    });

    it('does not mix the public configuration into the testnet URL', async () => {
      const { txUrl } = await import('./explorer');
      expect(txUrl(TX_HASH)).not.toContain('/public/');
    });
  });

  describe('accountUrl', () => {
    it('builds a testnet account explorer URL containing the address', async () => {
      const { accountUrl } = await import('./explorer');
      expect(accountUrl(ADDRESS)).toBe(
        `https://stellar.expert/explorer/testnet/account/${ADDRESS}`,
      );
    });

    it('builds a public account explorer URL on the public network', async () => {
      vi.stubEnv('VITE_STELLAR_NETWORK', 'PUBLIC');
      const { accountUrl } = await import('./explorer');
      expect(accountUrl(ADDRESS)).toBe(
        `https://stellar.expert/explorer/public/account/${ADDRESS}`,
      );
    });

    it('does not mix the public configuration into the testnet URL', async () => {
      const { accountUrl } = await import('./explorer');
      expect(accountUrl(ADDRESS)).not.toContain('/public/');
    });
  });
});
