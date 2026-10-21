import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStellarAddressValidation } from './useStellarAddressValidation';
import * as validateModule from '../utils/validateStellarAddress';

// Mock the validateStellarAddress utility
vi.mock('../utils/validateStellarAddress', () => ({
  validateStellarAddress: vi.fn(),
}));

const mockValidateStellarAddress = vi.mocked(validateModule.validateStellarAddress);

describe('useStellarAddressValidation', () => {
  beforeEach(() => {
    mockValidateStellarAddress.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns idle state on mount', () => {
    const { result } = renderHook(() =>
      useStellarAddressValidation('', 'MAINNET')
    );

    expect(result.current.state).toBe('idle');
    expect(result.current.isValid).toBe(false);
    expect(result.current.isValidating).toBe(false);
  });

  describe('debouncing', () => {
    it('debounces validation requests', async () => {
      mockValidateStellarAddress.mockResolvedValue({
        valid: true,
        network: 'MAINNET',
      });

      const { rerender } = renderHook(
        ({ address }) => useStellarAddressValidation(address, 'MAINNET', 50),
        { initialProps: { address: '' } }
      );

      // Trigger multiple rapid changes
      rerender({ address: 'G' });
      rerender({ address: 'GA' });
      rerender({ address: 'GAB' });

      // Wait less than debounce time
      await new Promise(resolve => setTimeout(resolve, 30));
      expect(mockValidateStellarAddress).not.toHaveBeenCalled();

      // Wait for debounce to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mockValidateStellarAddress).toHaveBeenCalledTimes(1);
    });

    it('respects custom debounce delay', async () => {
      mockValidateStellarAddress.mockResolvedValue({
        valid: true,
        network: 'MAINNET',
      });

      const { rerender } = renderHook(
        ({ address }) =>
          useStellarAddressValidation(address, 'MAINNET', 100),
        { initialProps: { address: '' } }
      );

      rerender({ address: 'GTEST' });
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mockValidateStellarAddress).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 80));
      expect(mockValidateStellarAddress).toHaveBeenCalledTimes(1);
    });
  });

  describe('caching', () => {
    it('caches validation results and reuses them', async () => {
      mockValidateStellarAddress.mockResolvedValue({
        valid: true,
        network: 'MAINNET',
      });

      const { rerender } = renderHook(
        ({ address }) => useStellarAddressValidation(address, 'MAINNET', 10),
        { initialProps: { address: '' } }
      );

      // First validation
      rerender({ address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF' });
      await waitFor(() => expect(mockValidateStellarAddress).toHaveBeenCalledTimes(1));

      // Change to different address
      rerender({ address: 'GBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF' });
      await waitFor(() => expect(mockValidateStellarAddress).toHaveBeenCalledTimes(2));

      // Change back to first address (should use cache)
      rerender({ address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF' });
      await waitFor(() => expect(mockValidateStellarAddress).toHaveBeenCalledTimes(2)); // No new call
    });

    it('clears cache when network changes', async () => {
      mockValidateStellarAddress.mockResolvedValue({
        valid: true,
        network: 'MAINNET',
      });

      const { rerender } = renderHook(
        ({ address, network }) => useStellarAddressValidation(address, network, 10),
        { initialProps: { address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', network: 'MAINNET' as const } }
      );

      await waitFor(() => expect(mockValidateStellarAddress).toHaveBeenCalledTimes(1));

      // Change network
      rerender({ address: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', network: 'TESTNET' });
      await waitFor(() => expect(mockValidateStellarAddress).toHaveBeenCalledTimes(2)); // Cache was cleared
    });
  });

  describe('request cancellation', () => {
    it('aborts previous in-flight requests when new validation is triggered', async () => {
      const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
      
      mockValidateStellarAddress.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { rerender } = renderHook(
        ({ address }) => useStellarAddressValidation(address, 'MAINNET', 10),
        { initialProps: { address: '' } }
      );

      rerender({ address: 'GTEST1' });
      await waitFor(() => expect(mockValidateStellarAddress).toHaveBeenCalledTimes(1));

      rerender({ address: 'GTEST2' });
      await waitFor(() => expect(abortSpy).toHaveBeenCalled());

      abortSpy.mockRestore();
    });
  });

  describe('error mapping', () => {
    it('maps invalid-format error correctly', async () => {
      mockValidateStellarAddress.mockResolvedValue({
        valid: false,
        error: 'invalid-format',
      });

      const { result } = renderHook(() =>
        useStellarAddressValidation('INVALID', 'MAINNET', 10)
      );

      await waitFor(() => expect(result.current.state).toBe('invalid-format'));
      expect(result.current.errorMessage).toContain('Invalid Stellar address format');
    });

    it('maps wrong-network error correctly', async () => {
      mockValidateStellarAddress.mockResolvedValue({
        valid: false,
        error: 'wrong-network',
      });

      const { result } = renderHook(() =>
        useStellarAddressValidation('TTEST', 'MAINNET', 10)
      );

      await waitFor(() => expect(result.current.state).toBe('wrong-network'));
      expect(result.current.errorMessage).toContain("doesn't match selected network");
    });

    it('maps not-found error correctly', async () => {
      mockValidateStellarAddress.mockResolvedValue({
        valid: false,
        error: 'not-found',
      });

      const { result } = renderHook(() =>
        useStellarAddressValidation('GTEST', 'MAINNET', 10)
      );

      await waitFor(() => expect(result.current.state).toBe('not-found'));
      expect(result.current.errorMessage).toContain('Account not found');
    });

    it('maps network-error correctly', async () => {
      mockValidateStellarAddress.mockResolvedValue({
        valid: false,
        error: 'network-error',
      });

      const { result } = renderHook(() =>
        useStellarAddressValidation('GTEST', 'MAINNET', 10)
      );

      await waitFor(() => expect(result.current.state).toBe('network-error'));
      expect(result.current.errorMessage).toContain('Network error');
    });

    it('handles unexpected exceptions as network-error', async () => {
      mockValidateStellarAddress.mockRejectedValue(new Error('Unexpected'));

      const { result } = renderHook(() =>
        useStellarAddressValidation('GTEST', 'MAINNET', 10)
      );

      await waitFor(() => expect(result.current.state).toBe('network-error'));
    });
  });

  describe('validation states', () => {
    it('transitions to validating state during validation', async () => {
      let resolveValidation: any;
      mockValidateStellarAddress.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveValidation = resolve;
          })
      );

      const { result } = renderHook(() =>
        useStellarAddressValidation('GTEST', 'MAINNET', 10)
      );

      await waitFor(() => expect(result.current.state).toBe('validating'));
      expect(result.current.isValidating).toBe(true);

      act(() => {
        resolveValidation({ valid: true, network: 'MAINNET' });
      });

      await waitFor(() => expect(result.current.state).toBe('valid'));
      expect(result.current.isValidating).toBe(false);
    });

    it('transitions to valid state on successful validation', async () => {
      mockValidateStellarAddress.mockResolvedValue({
        valid: true,
        network: 'MAINNET',
      });

      const { result } = renderHook(() =>
        useStellarAddressValidation('GTEST', 'MAINNET', 10)
      );

      await waitFor(() => expect(result.current.state).toBe('valid'));
      expect(result.current.isValid).toBe(true);
    });

    it('resets to idle when address is cleared', async () => {
      mockValidateStellarAddress.mockResolvedValue({
        valid: true,
        network: 'MAINNET',
      });

      const { rerender, result } = renderHook(
        ({ address }) => useStellarAddressValidation(address, 'MAINNET', 10),
        { initialProps: { address: 'GTEST' } }
      );

      await waitFor(() => expect(result.current.state).toBe('valid'));
      
      rerender({ address: '' });
      await waitFor(() => expect(result.current.state).toBe('idle'));
      expect(result.current.errorMessage).toBe('');
    });
  });

  describe('cleanup', () => {
    it('cleans up timers on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { unmount } = renderHook(() =>
        useStellarAddressValidation('GTEST', 'MAINNET')
      );

      unmount();
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });
  });
});
