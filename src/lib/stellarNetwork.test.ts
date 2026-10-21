import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('stellarNetwork', () => {
  beforeEach(() => {
    vi.resetModules();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('isExpectedNetwork', () => {
    describe('when targeting TESTNET (default)', () => {
      beforeEach(() => {
        vi.stubEnv('VITE_STELLAR_NETWORK', 'TESTNET');
      });

      it('returns true for TESTNET', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('TESTNET')).toBe(true);
      });

      it('returns true for lowercase testnet', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('testnet')).toBe(true);
      });

      it('returns true for mixed case Testnet', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('Testnet')).toBe(true);
      });

      it('returns false for PUBLIC', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('PUBLIC')).toBe(false);
      });

      it('returns false for MAINNET', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('MAINNET')).toBe(false);
      });

      it('returns false for FUTURENET', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('FUTURENET')).toBe(false);
      });

      it('returns false for null', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork(null)).toBe(false);
      });

      it('returns false for undefined', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork(undefined)).toBe(false);
      });

      it('returns false for empty string', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('')).toBe(false);
      });

      it('returns false for unknown network', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('UNKNOWN')).toBe(false);
      });

      it('handles whitespace around network name', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('  TESTNET  ')).toBe(true);
      });
    });

    describe('when targeting MAINNET via PUBLIC', () => {
      beforeEach(() => {
        vi.stubEnv('VITE_STELLAR_NETWORK', 'PUBLIC');
      });

      it('returns true for PUBLIC', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('PUBLIC')).toBe(true);
      });

      it('returns true for MAINNET', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('MAINNET')).toBe(true);
      });

      it('returns true for lowercase public', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('public')).toBe(true);
      });

      it('returns true for lowercase mainnet', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('mainnet')).toBe(true);
      });

      it('returns false for TESTNET', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('TESTNET')).toBe(false);
      });

      it('returns false for FUTURENET', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('FUTURENET')).toBe(false);
      });

      it('returns false for null', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork(null)).toBe(false);
      });

      it('returns false for undefined', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork(undefined)).toBe(false);
      });

      it('returns false for empty string', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('')).toBe(false);
      });

      it('handles whitespace around network name', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('  MAINNET  ')).toBe(true);
      });
    });

    describe('when targeting MAINNET via MAINNET', () => {
      beforeEach(() => {
        vi.stubEnv('VITE_STELLAR_NETWORK', 'MAINNET');
      });

      it('returns true for PUBLIC', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('PUBLIC')).toBe(true);
      });

      it('returns true for MAINNET', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('MAINNET')).toBe(true);
      });

      it('returns false for TESTNET', async () => {
        const { isExpectedNetwork } = await import('./stellarNetwork');
        expect(isExpectedNetwork('TESTNET')).toBe(false);
      });
    });
  });

  describe('networkLabel', () => {
    it('returns "Testnet" for TESTNET', async () => {
      const { networkLabel } = await import('./stellarNetwork');
      expect(networkLabel('TESTNET')).toBe('Testnet');
      expect(networkLabel('testnet')).toBe('Testnet');
      expect(networkLabel('Testnet')).toBe('Testnet');
    });

    it('returns "Mainnet" for PUBLIC', async () => {
      const { networkLabel } = await import('./stellarNetwork');
      expect(networkLabel('PUBLIC')).toBe('Mainnet');
      expect(networkLabel('public')).toBe('Mainnet');
    });

    it('returns "Mainnet" for MAINNET', async () => {
      const { networkLabel } = await import('./stellarNetwork');
      expect(networkLabel('MAINNET')).toBe('Mainnet');
      expect(networkLabel('mainnet')).toBe('Mainnet');
    });

    it('returns "Futurenet" for FUTURENET', async () => {
      const { networkLabel } = await import('./stellarNetwork');
      expect(networkLabel('FUTURENET')).toBe('Futurenet');
      expect(networkLabel('futurenet')).toBe('Futurenet');
    });

    it('returns "Unknown" for null', async () => {
      const { networkLabel } = await import('./stellarNetwork');
      expect(networkLabel(null)).toBe('Unknown');
    });

    it('returns "Unknown" for undefined', async () => {
      const { networkLabel } = await import('./stellarNetwork');
      expect(networkLabel(undefined)).toBe('Unknown');
    });

    it('returns capitalized version for unknown networks', async () => {
      const { networkLabel } = await import('./stellarNetwork');
      expect(networkLabel('CUSTOM')).toBe('Custom');
      expect(networkLabel('custom')).toBe('Custom');
    });

    it('handles whitespace', async () => {
      const { networkLabel } = await import('./stellarNetwork');
      expect(networkLabel('  TESTNET  ')).toBe('Testnet');
    });
  });

  describe('networkPassphraseFor', () => {
    describe('when targeting TESTNET', () => {
      beforeEach(() => {
        vi.stubEnv('VITE_STELLAR_NETWORK', 'TESTNET');
      });

      it('returns TESTNET_PASSPHRASE for TESTNET', async () => {
        const { networkPassphraseFor, TESTNET_PASSPHRASE } = await import('./stellarNetwork');
        expect(networkPassphraseFor('TESTNET')).toBe(TESTNET_PASSPHRASE);
      });

      it('returns TESTNET_PASSPHRASE for testnet (lowercase)', async () => {
        const { networkPassphraseFor, TESTNET_PASSPHRASE } = await import('./stellarNetwork');
        expect(networkPassphraseFor('testnet')).toBe(TESTNET_PASSPHRASE);
      });

      it('returns TESTNET_PASSPHRASE for FUTURENET', async () => {
        const { networkPassphraseFor, TESTNET_PASSPHRASE } = await import('./stellarNetwork');
        expect(networkPassphraseFor('FUTURENET')).toBe(TESTNET_PASSPHRASE);
      });

      it('returns TESTNET_PASSPHRASE for null', async () => {
        const { networkPassphraseFor, TESTNET_PASSPHRASE } = await import('./stellarNetwork');
        expect(networkPassphraseFor(null)).toBe(TESTNET_PASSPHRASE);
      });

      it('returns TESTNET_PASSPHRASE for undefined', async () => {
        const { networkPassphraseFor, TESTNET_PASSPHRASE } = await import('./stellarNetwork');
        expect(networkPassphraseFor(undefined)).toBe(TESTNET_PASSPHRASE);
      });

      it('returns TESTNET_PASSPHRASE for unknown network', async () => {
        const { networkPassphraseFor, TESTNET_PASSPHRASE } = await import('./stellarNetwork');
        expect(networkPassphraseFor('UNKNOWN')).toBe(TESTNET_PASSPHRASE);
      });
    });

    describe('when targeting MAINNET', () => {
      beforeEach(() => {
        vi.stubEnv('VITE_STELLAR_NETWORK', 'PUBLIC');
      });

      it('returns PUBLIC_PASSPHRASE for PUBLIC', async () => {
        const { networkPassphraseFor, PUBLIC_PASSPHRASE } = await import('./stellarNetwork');
        expect(networkPassphraseFor('PUBLIC')).toBe(PUBLIC_PASSPHRASE);
      });

      it('returns PUBLIC_PASSPHRASE for MAINNET', async () => {
        const { networkPassphraseFor, PUBLIC_PASSPHRASE } = await import('./stellarNetwork');
        expect(networkPassphraseFor('MAINNET')).toBe(PUBLIC_PASSPHRASE);
      });

      it('returns PUBLIC_PASSPHRASE for public (lowercase)', async () => {
        const { networkPassphraseFor, PUBLIC_PASSPHRASE } = await import('./stellarNetwork');
        expect(networkPassphraseFor('public')).toBe(PUBLIC_PASSPHRASE);
      });

      it('returns PUBLIC_PASSPHRASE for mainnet (lowercase)', async () => {
        const { networkPassphraseFor, PUBLIC_PASSPHRASE } = await import('./stellarNetwork');
        expect(networkPassphraseFor('mainnet')).toBe(PUBLIC_PASSPHRASE);
      });
    });
  });

  describe('EXPECTED_NETWORK and EXPECTED_NETWORK_LABEL', () => {
    describe('when VITE_STELLAR_NETWORK is TESTNET', () => {
      beforeEach(() => {
        vi.stubEnv('VITE_STELLAR_NETWORK', 'TESTNET');
      });

      it('EXPECTED_NETWORK is TESTNET', async () => {
        const { EXPECTED_NETWORK } = await import('./stellarNetwork');
        expect(EXPECTED_NETWORK).toBe('TESTNET');
      });

      it('EXPECTED_NETWORK_LABEL is Testnet', async () => {
        const { EXPECTED_NETWORK_LABEL } = await import('./stellarNetwork');
        expect(EXPECTED_NETWORK_LABEL).toBe('Testnet');
      });
    });

    describe('when VITE_STELLAR_NETWORK is PUBLIC', () => {
      beforeEach(() => {
        vi.stubEnv('VITE_STELLAR_NETWORK', 'PUBLIC');
      });

      it('EXPECTED_NETWORK is PUBLIC', async () => {
        const { EXPECTED_NETWORK } = await import('./stellarNetwork');
        expect(EXPECTED_NETWORK).toBe('PUBLIC');
      });

      it('EXPECTED_NETWORK_LABEL is Mainnet', async () => {
        const { EXPECTED_NETWORK_LABEL } = await import('./stellarNetwork');
        expect(EXPECTED_NETWORK_LABEL).toBe('Mainnet');
      });
    });

    describe('when VITE_STELLAR_NETWORK is MAINNET', () => {
      beforeEach(() => {
        vi.stubEnv('VITE_STELLAR_NETWORK', 'MAINNET');
      });

      it('EXPECTED_NETWORK is PUBLIC', async () => {
        const { EXPECTED_NETWORK } = await import('./stellarNetwork');
        expect(EXPECTED_NETWORK).toBe('PUBLIC');
      });

      it('EXPECTED_NETWORK_LABEL is Mainnet', async () => {
        const { EXPECTED_NETWORK_LABEL } = await import('./stellarNetwork');
        expect(EXPECTED_NETWORK_LABEL).toBe('Mainnet');
      });
    });
  });

  describe('passphrase constants', () => {
    it('TESTNET_PASSPHRASE has the correct value', async () => {
      const { TESTNET_PASSPHRASE } = await import('./stellarNetwork');
      expect(TESTNET_PASSPHRASE).toBe('Test SDF Network ; September 2015');
    });

    it('PUBLIC_PASSPHRASE has the correct value', async () => {
      const { PUBLIC_PASSPHRASE } = await import('./stellarNetwork');
      expect(PUBLIC_PASSPHRASE).toBe('Public Global Stellar Network ; September 2015');
    });
  });

  describe('documentation URLs', () => {
    it('FREIGHTER_NETWORK_DOCS has the correct URL', async () => {
      const { FREIGHTER_NETWORK_DOCS } = await import('./stellarNetwork');
      expect(FREIGHTER_NETWORK_DOCS).toBe('https://docs.freighter.app/docs/guide/usingFreighter');
    });

    it('STELLAR_NETWORKS_DOCS has the correct URL', async () => {
      const { STELLAR_NETWORKS_DOCS } = await import('./stellarNetwork');
      expect(STELLAR_NETWORKS_DOCS).toBe('https://developers.stellar.org/docs/learn/fundamentals/networks');
    });
  });
});