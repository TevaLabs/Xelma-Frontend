import { toast } from 'sonner';

/** Stable id so concurrent 429s update a single toast instead of stacking. */
const RATE_LIMIT_TOAST_ID = 'api-rate-limit';

/**
 * Minimum gap between rate-limit toasts. A burst of 429s firing within this
 * window only surfaces a single toast so we never spam the user.
 */
const RATE_LIMIT_TOAST_COOLDOWN_MS = 5_000;

let lastShownAt = Number.NEGATIVE_INFINITY;

function formatRetryAfter(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  return `${seconds} second${seconds === 1 ? '' : 's'}`;
}

/**
 * Surface a user-facing toast when the backend rate-limits a request (HTTP 429).
 *
 * Repeated calls within {@link RATE_LIMIT_TOAST_COOLDOWN_MS} are suppressed to
 * avoid flooding the user during a burst of throttled requests.
 *
 * @param retryAfterSeconds Parsed `Retry-After` value, or `null` when unknown.
 * @param now Injectable clock for deterministic tests.
 * @returns `true` when a toast was shown, `false` when suppressed by the cooldown.
 */
export function notifyRateLimited(
  retryAfterSeconds: number | null = null,
  now: number = Date.now(),
): boolean {
  if (now - lastShownAt < RATE_LIMIT_TOAST_COOLDOWN_MS) {
    return false;
  }
  lastShownAt = now;

  const description =
    retryAfterSeconds && retryAfterSeconds > 0
      ? `Please wait ${formatRetryAfter(retryAfterSeconds)} before trying again.`
      : 'Please slow down and try again in a moment.';

  toast.error('Too many requests', {
    id: RATE_LIMIT_TOAST_ID,
    description,
  });

  return true;
}

/** Test-only helper to reset the dedupe window between cases. */
export function __resetRateLimitToast(): void {
  lastShownAt = Number.NEGATIVE_INFINITY;
}
