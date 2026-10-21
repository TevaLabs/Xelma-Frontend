import { describe, it, expect, vi, beforeEach } from 'vitest';
import { txUrl, accountUrl, EXPLORER_NETWORK } from './explorer';

// Mock the horizon module to control IS_MAINNET
vi.mock('./horizon', () => ({
  IS_MAINNET: false, // Default to testnet for tests
}));

describe('Explorer URL Builders', () => {
  describe('txUrl', () => {
    it('builds a transaction URL for testnet', () => {
      const hash = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';
      const url = txUrl(hash);

      expect(url).toContain('https://stellar.expert/explorer');
      expect(url).toContain('/testnet/tx/');
      expect(url).toContain(hash);
    });

    it('includes the transaction hash in the correct URL segment', () => {
      const hash = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';
      const url = txUrl(hash);

      expect(url).toBe(
        `https://stellar.expert/explorer/testnet/tx/${hash}`,
      );
    });

    it('handles transaction hashes of varying lengths', () => {
      const shortHash = 'abc123';
      const longHash = 'a'.repeat(64);

      expect(txUrl(shortHash)).toContain(shortHash);
      expect(txUrl(longHash)).toContain(longHash);
    });
  });

  describe('accountUrl', () => {
    it('builds an account URL for testnet', () => {
      const address = 'GBRPYHIL2CI3WHZDTOOQFC6EB4RRJC5FJRX7IJXXEHYZXIODLNZXWT';
      const url = accountUrl(address);

      expect(url).toContain('https://stellar.expert/explorer');
      expect(url).toContain('/testnet/account/');
      expect(url).toContain(address);
    });

    it('includes the account address in the correct URL segment', () => {
      const address = 'GBRPYHIL2CI3WHZDTOOQFC6EB4RRJC5FJRX7IJXXEHYZXIODLNZXWT';
      const url = accountUrl(address);

      expect(url).toBe(
        `https://stellar.expert/explorer/testnet/account/${address}`,
      );
    });

    it('handles different Stellar account addresses', () => {
      const address1 = 'GBRPYHIL2CI3WHZDTOOQFC6EB4RRJC5FJRX7IJXXEHYZXIODLNZXWT';
      const address2 = 'GB7NZD5E2QMI5NZ4BXLFMNDLW5RRJC5FJRX7IJXXEHYZXIODLNZXWT';

      expect(accountUrl(address1)).toContain(address1);
      expect(accountUrl(address2)).toContain(address2);
    });
  });

  describe('EXPLORER_NETWORK', () => {
    it('is set to testnet when not on mainnet', () => {
      expect(EXPLORER_NETWORK).toBe('testnet');
    });
  });

  describe('URL consistency', () => {
    it('uses the same base URL for both txUrl and accountUrl', () => {
      const txUrlResult = txUrl('abc123');
      const accountUrlResult = accountUrl('GTEST123');

      const txBase = txUrlResult.split('/tx/')[0];
      const accountBase = accountUrlResult.split('/account/')[0];

      expect(txBase).toBe(accountBase);
    });

    it('uses EXPLORER_NETWORK in both URL builders', () => {
      const txUrlResult = txUrl('abc123');
      const accountUrlResult = accountUrl('GTEST123');

      expect(txUrlResult).toContain(EXPLORER_NETWORK);
      expect(accountUrlResult).toContain(EXPLORER_NETWORK);
    });
  });
});
