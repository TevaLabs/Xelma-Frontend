import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ValidationResult } from '../../utils/validateStellarAddress';

vi.mock('../../utils/validateStellarAddress', () => ({
  validateStellarAddress: vi.fn(),
}));

import { validateStellarAddress } from '../../utils/validateStellarAddress';
import { useStellarAddressValidation } from '../useStellarAddressValidation';

const mockValidate = vi.mocked(validateStellarAddress);

const ADDR_A = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const ADDR_B = 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';

const VALID: ValidationResult = { valid: true, network: 'TESTNET' };

/** Creates a promise whose resolution is controlled by the test. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Advances fake timers and flushes the resulting microtasks inside act(). */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

type Props = { address: string; network: 'MAINNET' | 'TESTNET'; debounceMs?: number };

function renderValidation(initial: Props) {
  return renderHook(
    ({ address, network, debounceMs }: Props) =>
      useStellarAddressValidation(address, network, debounceMs),
    { initialProps: initial },
  );
}

describe('useStellarAddressValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockValidate.mockReset();
    mockValidate.mockResolvedValue(VALID);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial and empty states', () => {
    it('starts idle with no error', () => {
      const { result } = renderValidation({ address: '', network: 'TESTNET' });

      expect(result.current.state).toBe('idle');
      expect(result.current.isValid).toBe(false);
      expect(result.current.isValidating).toBe(false);
      expect(result.current.errorMessage).toBe('');
    });

    it('stays idle and skips validation for whitespace-only input', async () => {
      const { result } = renderValidation({ address: '   ', network: 'TESTNET' });

      await advance(300);

      expect(result.current.state).toBe('idle');
      expect(mockValidate).not.toHaveBeenCalled();
    });

    it('returns to idle when the address is cleared after a result', async () => {
      const { result, rerender } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);
      expect(result.current.state).toBe('valid');

      rerender({ address: '', network: 'TESTNET' });
      await advance(300);

      expect(result.current.state).toBe('idle');
      expect(result.current.errorMessage).toBe('');
    });
  });

  describe('debounce', () => {
    it('does not validate before the default 300ms debounce elapses', async () => {
      renderValidation({ address: ADDR_A, network: 'TESTNET' });

      await advance(299);
      expect(mockValidate).not.toHaveBeenCalled();

      await advance(1);
      expect(mockValidate).toHaveBeenCalledTimes(1);
      expect(mockValidate).toHaveBeenCalledWith(ADDR_A, 'TESTNET');
    });

    it('honours a custom debounce delay', async () => {
      renderValidation({ address: ADDR_A, network: 'TESTNET', debounceMs: 1000 });

      await advance(999);
      expect(mockValidate).not.toHaveBeenCalled();

      await advance(1);
      expect(mockValidate).toHaveBeenCalledTimes(1);
    });

    it('collapses rapid keystrokes into a single validation of the latest value', async () => {
      const { rerender } = renderValidation({ address: 'G', network: 'TESTNET' });

      await advance(100);
      rerender({ address: 'GA', network: 'TESTNET' });
      await advance(100);
      rerender({ address: 'GAB', network: 'TESTNET' });
      await advance(100);
      rerender({ address: ADDR_A, network: 'TESTNET' });

      expect(mockValidate).not.toHaveBeenCalled();

      await advance(300);

      expect(mockValidate).toHaveBeenCalledTimes(1);
      expect(mockValidate).toHaveBeenCalledWith(ADDR_A, 'TESTNET');
    });

    it('normalizes the address (trim + uppercase) before validating', async () => {
      renderValidation({ address: `  ${ADDR_A.toLowerCase()}  `, network: 'TESTNET' });

      await advance(300);

      expect(mockValidate).toHaveBeenCalledWith(ADDR_A, 'TESTNET');
    });

    it('clears the pending debounce timer on unmount', async () => {
      const { unmount } = renderValidation({ address: ADDR_A, network: 'TESTNET' });

      unmount();
      await advance(1000);

      expect(mockValidate).not.toHaveBeenCalled();
    });
  });

  describe('validation results', () => {
    it('reports "validating" while the request is in flight, then "valid"', async () => {
      const pending = deferred<ValidationResult>();
      mockValidate.mockReturnValueOnce(pending.promise);

      const { result } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);

      expect(result.current.state).toBe('validating');
      expect(result.current.isValidating).toBe(true);
      expect(result.current.isValid).toBe(false);

      await act(async () => {
        pending.resolve(VALID);
      });

      expect(result.current.state).toBe('valid');
      expect(result.current.isValid).toBe(true);
      expect(result.current.isValidating).toBe(false);
      expect(result.current.errorMessage).toBe('');
    });

    it.each([
      ['invalid-format', 'TESTNET', /Invalid Stellar address format/],
      ['wrong-network', 'TESTNET', /use a Testnet address/],
      ['wrong-network', 'MAINNET', /use a Mainnet address/],
      ['not-found', 'TESTNET', /Account not found/],
      ['network-error', 'TESTNET', /Network error/],
    ] as const)(
      'maps "%s" on %s to the matching state and message',
      async (error, network, message) => {
        mockValidate.mockResolvedValueOnce({ valid: false, error });

        const { result } = renderValidation({ address: ADDR_A, network });
        await advance(300);

        expect(result.current.state).toBe(error);
        expect(result.current.isValid).toBe(false);
        expect(result.current.errorMessage).toMatch(message);
      },
    );

    it('falls back to "network-error" when the validator throws', async () => {
      mockValidate.mockRejectedValueOnce(new Error('boom'));

      const { result } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);

      expect(result.current.state).toBe('network-error');
      expect(result.current.errorMessage).toMatch(/Network error/);
    });
  });

  describe('cache', () => {
    it('reuses a cached result for a previously validated address', async () => {
      mockValidate.mockImplementation(async (addr) =>
        addr === ADDR_A ? VALID : { valid: false, error: 'not-found' },
      );

      const { result, rerender } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);
      expect(result.current.state).toBe('valid');

      rerender({ address: ADDR_B, network: 'TESTNET' });
      await advance(300);
      expect(result.current.state).toBe('not-found');

      rerender({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);

      expect(result.current.state).toBe('valid');
      expect(mockValidate).toHaveBeenCalledTimes(2);
    });

    it('serves cached error results with the correct message', async () => {
      mockValidate.mockImplementation(async (addr) =>
        addr === ADDR_A ? { valid: false, error: 'invalid-format' } : VALID,
      );

      const { result, rerender } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);
      rerender({ address: ADDR_B, network: 'TESTNET' });
      await advance(300);
      rerender({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);

      expect(mockValidate).toHaveBeenCalledTimes(2);
      expect(result.current.state).toBe('invalid-format');
      expect(result.current.errorMessage).toMatch(/Invalid Stellar address format/);
    });

    it('treats differently-formatted input as the same cache key', async () => {
      const { result, rerender } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);
      rerender({ address: ADDR_B, network: 'TESTNET' });
      await advance(300);
      rerender({ address: ` ${ADDR_A.toLowerCase()} `, network: 'TESTNET' });
      await advance(300);

      expect(result.current.state).toBe('valid');
      expect(mockValidate).toHaveBeenCalledTimes(2);
    });

    it('re-validates once the 5 minute TTL has expired', async () => {
      const { rerender } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);
      expect(mockValidate).toHaveBeenCalledTimes(1);

      rerender({ address: ADDR_B, network: 'TESTNET' });
      await advance(300);
      expect(mockValidate).toHaveBeenCalledTimes(2);

      // Move past the TTL for ADDR_A.
      await advance(5 * 60 * 1000);

      rerender({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);

      expect(mockValidate).toHaveBeenCalledTimes(3);
      expect(mockValidate).toHaveBeenLastCalledWith(ADDR_A, 'TESTNET');
    });

    it('does not cache results from thrown errors', async () => {
      mockValidate.mockRejectedValueOnce(new Error('offline'));

      const { result, rerender } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);
      expect(result.current.state).toBe('network-error');

      rerender({ address: ADDR_B, network: 'TESTNET' });
      await advance(300);
      rerender({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);

      expect(mockValidate).toHaveBeenCalledTimes(3);
      expect(result.current.state).toBe('valid');
    });

    it('clears the cache and re-validates when the network changes', async () => {
      const { rerender } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);
      expect(mockValidate).toHaveBeenCalledTimes(1);

      rerender({ address: ADDR_A, network: 'MAINNET' });
      await advance(300);
      expect(mockValidate).toHaveBeenCalledTimes(2);
      expect(mockValidate).toHaveBeenLastCalledWith(ADDR_A, 'MAINNET');

      // Switching back must not reuse the old TESTNET entry (cache was cleared).
      rerender({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);
      expect(mockValidate).toHaveBeenCalledTimes(3);
    });
  });

  describe('abort / stale responses', () => {
    it('ignores a stale response that resolves after a newer validation started', async () => {
      const first = deferred<ValidationResult>();
      const second = deferred<ValidationResult>();
      mockValidate.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

      const { result, rerender } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);
      rerender({ address: ADDR_B, network: 'TESTNET' });
      await advance(300);

      await act(async () => {
        second.resolve({ valid: false, error: 'not-found' });
      });
      expect(result.current.state).toBe('not-found');

      // The older request finishing late must not overwrite the newer result.
      await act(async () => {
        first.resolve(VALID);
      });
      expect(result.current.state).toBe('not-found');
    });

    it('does not cache a response from an aborted validation', async () => {
      const first = deferred<ValidationResult>();
      mockValidate
        .mockReturnValueOnce(first.promise)
        .mockResolvedValueOnce({ valid: false, error: 'not-found' })
        .mockResolvedValue(VALID);

      const { result, rerender } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);
      rerender({ address: ADDR_B, network: 'TESTNET' });
      await advance(300);

      await act(async () => {
        first.resolve({ valid: false, error: 'invalid-format' });
      });

      // ADDR_A must be validated again rather than served from cache.
      rerender({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);

      expect(mockValidate).toHaveBeenCalledTimes(3);
      expect(result.current.state).toBe('valid');
    });

    it('ignores a stale rejection after a newer validation started', async () => {
      const first = deferred<ValidationResult>();
      mockValidate.mockReturnValueOnce(first.promise).mockResolvedValueOnce(VALID);

      const { result, rerender } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);
      rerender({ address: ADDR_B, network: 'TESTNET' });
      await advance(300);
      expect(result.current.state).toBe('valid');

      await act(async () => {
        first.reject(new Error('late failure'));
      });

      expect(result.current.state).toBe('valid');
      expect(result.current.errorMessage).toBe('');
    });

    it('drops the in-flight result after unmount', async () => {
      const pending = deferred<ValidationResult>();
      mockValidate.mockReturnValueOnce(pending.promise);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result, unmount } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);
      expect(result.current.state).toBe('validating');

      unmount();
      await act(async () => {
        pending.resolve(VALID);
      });

      expect(result.current.state).toBe('validating');
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('manual validate()', () => {
    it('validates immediately without waiting for the debounce', async () => {
      const { result } = renderValidation({ address: ADDR_A, network: 'TESTNET', debounceMs: 10_000 });

      await act(async () => {
        await result.current.validate();
      });

      expect(mockValidate).toHaveBeenCalledTimes(1);
      expect(result.current.state).toBe('valid');
    });

    it('uses the cache populated by a previous validation', async () => {
      const { result } = renderValidation({ address: ADDR_A, network: 'TESTNET' });
      await advance(300);
      expect(mockValidate).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.validate();
      });

      expect(mockValidate).toHaveBeenCalledTimes(1);
      expect(result.current.state).toBe('valid');
    });
  });
});
