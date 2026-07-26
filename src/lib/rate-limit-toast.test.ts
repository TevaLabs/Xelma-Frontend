import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { notifyRateLimited, __resetRateLimitToast } from './rate-limit-toast';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

const errorToast = vi.mocked(toast.error);

describe('notifyRateLimited', () => {
  beforeEach(() => {
    __resetRateLimitToast();
    errorToast.mockReset();
  });

  it('shows a toast with retry-after guidance in seconds', () => {
    const shown = notifyRateLimited(30, 1_000);

    expect(shown).toBe(true);
    expect(errorToast).toHaveBeenCalledTimes(1);
    expect(errorToast).toHaveBeenCalledWith(
      'Too many requests',
      expect.objectContaining({
        id: 'api-rate-limit',
        description: 'Please wait 30 seconds before trying again.',
      }),
    );
  });

  it('rounds long retry windows up to minutes', () => {
    notifyRateLimited(90, 1_000);

    expect(errorToast).toHaveBeenCalledWith(
      'Too many requests',
      expect.objectContaining({ description: 'Please wait 2 minutes before trying again.' }),
    );
  });

  it('falls back to generic guidance when retry-after is unknown', () => {
    notifyRateLimited(null, 1_000);

    expect(errorToast).toHaveBeenCalledWith(
      'Too many requests',
      expect.objectContaining({ description: 'Please slow down and try again in a moment.' }),
    );
  });

  it('uses a singular unit for a one second window', () => {
    notifyRateLimited(1, 1_000);

    expect(errorToast).toHaveBeenCalledWith(
      'Too many requests',
      expect.objectContaining({ description: 'Please wait 1 second before trying again.' }),
    );
  });

  it('suppresses bursts within the cooldown window', () => {
    expect(notifyRateLimited(5, 1_000)).toBe(true);
    expect(notifyRateLimited(5, 2_000)).toBe(false);
    expect(notifyRateLimited(5, 5_000)).toBe(false);

    expect(errorToast).toHaveBeenCalledTimes(1);
  });

  it('shows again once the cooldown has elapsed', () => {
    expect(notifyRateLimited(5, 1_000)).toBe(true);
    expect(notifyRateLimited(5, 6_001)).toBe(true);

    expect(errorToast).toHaveBeenCalledTimes(2);
  });
});
