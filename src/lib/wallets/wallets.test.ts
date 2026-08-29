import { describe, it, expect } from 'vitest';
import { WALLET_ADAPTERS, getWalletAdapter, freighterAdapter } from './index';
import { albedoAdapter, lobstrAdapter } from './stubs';
import { WalletAdapterError } from './types';

describe('wallet adapter registry', () => {
  it('exposes Freighter first so it is the default choice', () => {
    expect(WALLET_ADAPTERS[0].id).toBe('freighter');
  });

  it('has no duplicate wallet ids', () => {
    const ids = WALLET_ADAPTERS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every adapter the full interface', () => {
    for (const adapter of WALLET_ADAPTERS) {
      expect(typeof adapter.name).toBe('string');
      expect(typeof adapter.description).toBe('string');
      expect(typeof adapter.isImplemented).toBe('boolean');
      expect(typeof adapter.isAvailable).toBe('function');
      expect(typeof adapter.connect).toBe('function');
      expect(typeof adapter.signMessage).toBe('function');
      expect(typeof adapter.signTransaction).toBe('function');
    }
  });

  it('looks adapters up by id', () => {
    expect(getWalletAdapter('freighter')).toBe(freighterAdapter);
    expect(getWalletAdapter('albedo')).toBe(albedoAdapter);
  });

  it('marks only Freighter as implemented today', () => {
    expect(freighterAdapter.isImplemented).toBe(true);
    expect(albedoAdapter.isImplemented).toBe(false);
    expect(lobstrAdapter.isImplemented).toBe(false);
  });
});

describe('stub adapters', () => {
  it.each([albedoAdapter, lobstrAdapter])('reports %s as unavailable', async (adapter) => {
    await expect(adapter.isAvailable()).resolves.toEqual({
      isAvailable: false,
      reason: 'NOT_IMPLEMENTED',
    });
  });

  it('throws a WalletAdapterError naming the wallet when connect is attempted', async () => {
    await expect(albedoAdapter.connect()).rejects.toBeInstanceOf(WalletAdapterError);
    await expect(albedoAdapter.connect()).rejects.toThrow(/albedo support is not available yet/i);
  });

  it('throws on signing attempts', async () => {
    const options = { networkPassphrase: 'Test SDF Network ; September 2015' };
    await expect(lobstrAdapter.signMessage('msg', options)).rejects.toBeInstanceOf(
      WalletAdapterError,
    );
    await expect(lobstrAdapter.signTransaction('xdr', options)).rejects.toBeInstanceOf(
      WalletAdapterError,
    );
  });

  it('tags the error with the wallet id', async () => {
    await albedoAdapter.connect().catch((err) => {
      expect(err).toBeInstanceOf(WalletAdapterError);
      expect((err as WalletAdapterError).walletId).toBe('albedo');
    });
  });
});
