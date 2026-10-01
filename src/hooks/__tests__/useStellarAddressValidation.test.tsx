import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStellarAddressValidation } from '../useStellarAddressValidation';
import {
  validateStellarAddress,
  type Network,
  type ValidationResult,
} from '../../utils/validateStellarAddress';

// Mock the Horizon-backed validation helper so tests never touch the network.
vi.mock('../../utils/validateStellarAddress', () => ({
  validateStellarAddress: vi.fn(),
}));

const mockValidate = vi.mocked(validateStellarAddress);

/** A 56-char G-address-shaped fixture (format only — network calls are mocked). */
const VALID_ADDRESS = 'G' + 'A'.repeat(55);
const OTHER_VALID_ADDRESS = 'G' + 'B'.repeat(55);

function okResult(network: Network): ValidationResult {
  return { valid: true, network };
}

describe('useStellarAddressValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockValidate.mockReset();
  });

  afterEach(() => {
    // Discard pending debounce timers without firing them — running them here
    // would trigger setState outside act(). Mock promises resolve harmlessly.
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('debounce', () => {
    it('does not validate before the debounce delay elapses', async () => {
      const { result } = renderHook(() =>
        useStellarAddressValidation(VALID_ADDRESS, 'TESTNET', 300),
      );

      expect(result.current.state).toBe('idle');
      await act(async () => {
        await vi.advanceTimersByTimeAsync(299);
      });
      expect(mockValidate).not.toHaveBeenCalled();
    });

    it('validates after the debounce delay elapses', async () => {
      mockValidate.mockResolvedValue(okResult('TESTNET'));
      const { result } = renderHook(() =>
        useStellarAddressValidation(VALID_ADDRESS, 'TESTNET', 300),
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(mockValidate).toHaveBeenCalledTimes(1);
      expect(mockValidate).toHaveBeenCalledWith(VALID_ADDRESS.toUpperCase(), 'TESTNET');
      expect(result.current.state).toBe('valid');
      expect(result.current.isValid).toBe(true);
    });

    it('collapses rapid address edits into a single validation call', async () => {
      mockValidate.mockResolvedValue(okResult('TESTNET'));

      const initialProps = [VALID_ADDRESS] as const;
      const { rerender } = renderHook(
        ({ address }) => useStellarAddressValidation(address, 'TESTNET', 300),
        { initialProps },
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      await act(async () => {
        rerender({ address: OTHER_VALID_ADDRESS });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
      });
      await act(async () => {
        rerender({ address: VALID_ADDRESS });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(mockValidate).toHaveBeenCalledTimes(1);
      expect(mockValidate).toHaveBeenCalledWith(VALID_ADDRESS, 'TESTNET');
    });

    it('is idle for an empty address without calling validation', async () => {
      const { result } = renderHook(() => useStellarAddressValidation('', 'TESTNET', 300));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(result.current.state).toBe('idle');
      expect(mockValidate).not.toHaveBeenCalled();
    });
  });

  describe('validation outcomes', () => {
    it('maps an invalid-format result to its state and message', async () => {
      mockValidate.mockResolvedValue({ valid: false, error: 'invalid-format' });
      const { result } = renderHook(() =>
        useStellarAddressValidation(VALID_ADDRESS, 'TESTNET', 300),
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(result.current.state).toBe('invalid-format');
      expect(result.current.isValid).toBe(false);
      expect(result.current.errorMessage).toMatch(/invalid stellar address format/i);
    });

    it('maps a network failure (rejected helper) to network-error', async () => {
      mockValidate.mockRejectedValue(new Error('offline'));
      const { result } = renderHook(() =>
        useStellarAddressValidation(VALID_ADDRESS, 'TESTNET', 300),
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(result.current.state).toBe('network-error');
      expect(result.current.errorMessage).toMatch(/network error/i);
    });
  });

  describe('abort behavior', () => {
    it('cancels an in-flight validation when a new one starts', async () => {
      // First call hangs until we resolve it manually; second completes
      // immediately so the newer validation wins while #1 is still pending.
      let resolveFirst!: (r: ValidationResult) => void;
      mockValidate.mockImplementationOnce(
        () =>
          new Promise<ValidationResult>((resolve) => {
            resolveFirst = resolve;
          }),
      );
      mockValidate.mockResolvedValueOnce(okResult('TESTNET'));

      const { result, rerender } = renderHook(
        ({ address }) => useStellarAddressValidation(address, 'TESTNET', 300),
        { initialProps: { address: VALID_ADDRESS } },
      );

      // First validation is in flight and stuck pending.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(mockValidate).toHaveBeenCalledTimes(1);
      expect(result.current.state).toBe('validating');

      // A second address arrives; its validation completes while #1 pends.
      await act(async () => {
        rerender({ address: OTHER_VALID_ADDRESS });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(mockValidate).toHaveBeenCalledTimes(2);
      expect(result.current.state).toBe('valid');

      // The stale (aborted) validation resolves with a *different* outcome —
      // it must be discarded instead of clobbering the newer result.
      await act(async () => {
        resolveFirst({ valid: false, error: 'invalid-format' });
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(result.current.state).toBe('valid');
      expect(result.current.errorMessage).toBe('');
    });
  });

  describe('cache behavior', () => {
    it('serves a fresh cached result without calling validation again', async () => {
      mockValidate.mockResolvedValue(okResult('TESTNET'));

      const { rerender } = renderHook(
        ({ address }) => useStellarAddressValidation(address, 'TESTNET', 300),
        { initialProps: { address: VALID_ADDRESS } },
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(mockValidate).toHaveBeenCalledTimes(1);

      // Away and back — cache hit, no new network call.
      await act(async () => {
        rerender({ address: '' });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      await act(async () => {
        rerender({ address: VALID_ADDRESS });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(mockValidate).toHaveBeenCalledTimes(1);
    });

    it('revalidates after the cache TTL expires', async () => {
      mockValidate.mockResolvedValue(okResult('TESTNET'));

      const { rerender } = renderHook(
        ({ address }) => useStellarAddressValidation(address, 'TESTNET', 300),
        { initialProps: { address: VALID_ADDRESS } },
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(mockValidate).toHaveBeenCalledTimes(1);

      // Past the 5-minute TTL (with the earlier 300ms of debounce included).
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5 * 60 * 1000 + 1);
      });
      await act(async () => {
        rerender({ address: '' });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      await act(async () => {
        rerender({ address: VALID_ADDRESS });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(mockValidate).toHaveBeenCalledTimes(2);
    });

    it('clears the cache when the network changes', async () => {
      mockValidate.mockResolvedValue(okResult('TESTNET'));

      const { rerender } = renderHook(
        ({ address, network }) => useStellarAddressValidation(address, network, 300),
        { initialProps: { address: VALID_ADDRESS, network: 'TESTNET' as Network } },
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(mockValidate).toHaveBeenCalledTimes(1);

      await act(async () => {
        rerender({ address: VALID_ADDRESS, network: 'MAINNET' as Network });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });

      expect(mockValidate).toHaveBeenCalledTimes(2);
      expect(mockValidate).toHaveBeenLastCalledWith(VALID_ADDRESS, 'MAINNET');
    });
  });

  describe('unmount', () => {
    it('aborts an in-flight validation on unmount', async () => {
      let resolveFirst!: (r: ValidationResult) => void;
      mockValidate.mockImplementationOnce(
        () =>
          new Promise<ValidationResult>((resolve) => {
            resolveFirst = resolve;
          }),
      );

      const { result, unmount } = renderHook(() =>
        useStellarAddressValidation(VALID_ADDRESS, 'TESTNET', 300),
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
      expect(result.current.state).toBe('validating');

      unmount();

      resolveFirst(okResult('TESTNET'));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      // No crash, and no way to observe state after unmount — the point is
      // that the aborted promise resolution is swallowed safely.
      expect(mockValidate).toHaveBeenCalledTimes(1);
    });
  });
});
