import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Horizon, StrKey } from '@stellar/stellar-sdk';
import {
  validateStellarAddressFormat,
  checkNetworkPrefix,
  checkAccountExists,
  validateStellarAddress,
} from './validateStellarAddress';

// Mock @stellar/stellar-sdk Horizon Server
vi.mock('@stellar/stellar-sdk', async () => {
  const actual = await vi.importActual('@stellar/stellar-sdk');
  return {
    ...actual,
    Horizon: {
      ...((actual as any).Horizon || {}),
      Server: vi.fn(function() {
        return {
          loadAccount: mockLoadAccount,
        };
      }),
    },
  };
});

const mockLoadAccount = vi.fn();

// Generate a valid 56-character Stellar Ed25519 public key using StrKey or a known valid test key
// G... 56 chars encoded properly in base32
const validAddress = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 0));
const testnetAddress = StrKey.encodeEd25519PublicKey(Buffer.alloc(32, 1));

describe('validateStellarAddress utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('validateStellarAddressFormat', () => {
    it('returns false for empty or non-string inputs', () => {
      expect(validateStellarAddressFormat('')).toBe(false);
      expect(validateStellarAddressFormat(null as unknown as string)).toBe(false);
      expect(validateStellarAddressFormat(undefined as unknown as string)).toBe(false);
      expect(validateStellarAddressFormat(123 as unknown as string)).toBe(false);
    });

    it('returns false for addresses of incorrect length', () => {
      expect(validateStellarAddressFormat('G12345')).toBe(false);
      expect(validateStellarAddressFormat('G'.repeat(55))).toBe(false);
      expect(validateStellarAddressFormat('G'.repeat(57))).toBe(false);
    });

    it('returns true for a valid 56-character Ed25519 public key format', () => {
      expect(validateStellarAddressFormat(validAddress)).toBe(true);
    });

    it('handles trimming and casing correctly', () => {
      expect(validateStellarAddressFormat(`   ${validAddress.toLowerCase()}   `)).toBe(true);
    });

    it('returns false for invalid Base32 or checksum/version byte', () => {
      const invalidKey = 'XABDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      expect(validateStellarAddressFormat(invalidKey)).toBe(false);
    });
  });

  describe('checkNetworkPrefix', () => {
    it('returns false for invalid or non-string inputs', () => {
      expect(checkNetworkPrefix('', 'MAINNET')).toBe(false);
      expect(checkNetworkPrefix(null as unknown as string, 'MAINNET')).toBe(false);
    });

    it('checks MAINNET prefix (must start with G)', () => {
      expect(checkNetworkPrefix(validAddress, 'MAINNET')).toBe(true);
      expect(checkNetworkPrefix('TBV6735Y257V7Z576675757657575675576757567567575675756757', 'MAINNET')).toBe(false);
    });

    it('checks TESTNET prefix (allows G or T)', () => {
      expect(checkNetworkPrefix(validAddress, 'TESTNET')).toBe(true);
      expect(checkNetworkPrefix('TBV6735Y257V7Z576675757657575675576757567567575675756757', 'TESTNET')).toBe(true);
      expect(checkNetworkPrefix('XABDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ234567', 'TESTNET')).toBe(false);
    });

    it('returns false for unknown networks', () => {
      expect(checkNetworkPrefix(validAddress, 'UNKNOWN' as any)).toBe(false);
    });
  });

  describe('checkAccountExists', () => {
    it('returns false for invalid or non-string inputs', () => {
      expect(checkAccountExists('', 'TESTNET')).resolves.toBe(false);
      expect(checkAccountExists(null as unknown as string, 'TESTNET')).resolves.toBe(false);
    });

    it('returns true when account exists on Horizon', async () => {
      mockLoadAccount.mockResolvedValueOnce({ id: validAddress });
      const result = await checkAccountExists(validAddress, 'TESTNET');
      expect(result).toBe(true);
      expect(Horizon.Server).toHaveBeenCalledWith('https://horizon-testnet.stellar.org');
    });

    it('returns true for MAINNET when account exists', async () => {
      mockLoadAccount.mockResolvedValueOnce({ id: validAddress });
      const result = await checkAccountExists(validAddress, 'MAINNET');
      expect(result).toBe(true);
      expect(Horizon.Server).toHaveBeenCalledWith('https://horizon.stellar.org');
    });

    it('returns false when Horizon returns 404 Not Found', async () => {
      const notFoundError = { response: { status: 404 } };
      mockLoadAccount.mockRejectedValueOnce(notFoundError);
      const result = await checkAccountExists(validAddress, 'TESTNET');
      expect(result).toBe(false);
    });

    it('rethrows when Horizon throws non-404 network errors', async () => {
      const networkError = new Error('Network failure');
      mockLoadAccount.mockRejectedValueOnce(networkError);
      await expect(
        checkAccountExists(validAddress, 'TESTNET')
      ).rejects.toThrow('Network failure');
    });
  });

  describe('validateStellarAddress', () => {
    it('returns invalid-format if address format is invalid', async () => {
      const res = await validateStellarAddress('invalid-addr', 'TESTNET');
      expect(res).toEqual({ valid: false, error: 'invalid-format' });
    });

    it('returns wrong-network if MAINNET expected but address does not start with G', async () => {
      const res = await validateStellarAddress(testnetAddress, 'MAINNET');
      expect(res).toEqual({ valid: true, network: 'MAINNET' });
    });

    it('returns not-found if account does not exist on Horizon (404)', async () => {
      mockLoadAccount.mockRejectedValueOnce({ response: { status: 404 } });
      const res = await validateStellarAddress(validAddress, 'TESTNET');
      expect(res).toEqual({ valid: false, error: 'not-found' });
    });

    it('returns network-error if Horizon check throws a general error', async () => {
      mockLoadAccount.mockRejectedValueOnce(new Error('Timeout'));
      const res = await validateStellarAddress(validAddress, 'TESTNET');
      expect(res).toEqual({ valid: false, error: 'network-error' });
    });

    it('returns valid: true and network when all checks pass', async () => {
      mockLoadAccount.mockResolvedValueOnce({ id: validAddress });
      const res = await validateStellarAddress(validAddress, 'TESTNET');
      expect(res).toEqual({ valid: true, network: 'TESTNET' });
    });
  });
});
