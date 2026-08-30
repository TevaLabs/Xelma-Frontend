/**
 * Stellar Friendbot (testnet faucet) helpers.
 *
 * Friendbot only exists on testnet — a mainnet build must never surface a
 * "fund me" CTA, so `FRIENDBOT_ENABLED` is derived from the same
 * `VITE_STELLAR_NETWORK` switch that drives Horizon and the explorer links.
 */

import { IS_MAINNET } from './horizon';

const DEFAULT_FRIENDBOT_URL = 'https://friendbot.stellar.org';

/** Root Friendbot URL for the configured network, without a trailing slash. */
export const FRIENDBOT_URL: string = (
  import.meta.env.VITE_STELLAR_FRIENDBOT_URL || DEFAULT_FRIENDBOT_URL
).replace(/\/+$/, '');

/** True only when the app is pointed at testnet, where Friendbot exists. */
export const FRIENDBOT_ENABLED = !IS_MAINNET;

/** Below this native balance (XLM) an account cannot pay Soroban fees comfortably. */
export const LOW_BALANCE_THRESHOLD_XLM = 1;

/** Friendbot deep link for an address, usable as a plain `href` fallback. */
export function friendbotUrl(address: string): string {
  return `${FRIENDBOT_URL}/?addr=${encodeURIComponent(address)}`;
}

export class FriendbotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FriendbotError';
  }
}

/** Friendbot returns this detail when the account already exists on testnet. */
function isAlreadyFunded(detail: unknown): boolean {
  return typeof detail === 'string' && detail.toLowerCase().includes('alreadyexist');
}

/**
 * Asks Friendbot to create and fund `address` on testnet.
 *
 * Resolves when the account is funded (or already existed); throws a
 * `FriendbotError` with a user-readable message otherwise.
 */
export async function fundWithFriendbot(address: string, signal?: AbortSignal): Promise<void> {
  if (!FRIENDBOT_ENABLED) {
    throw new FriendbotError('Friendbot is only available on Stellar testnet.');
  }

  let response: Response;
  try {
    response = await fetch(friendbotUrl(address), { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new FriendbotError('Could not reach Friendbot. Check your connection and try again.');
  }

  if (response.ok) return;

  let detail: unknown;
  try {
    const payload = (await response.json()) as { detail?: unknown };
    detail = payload?.detail;
  } catch {
    detail = undefined;
  }

  // A 400 for an existing account is a no-op, not a failure.
  if (response.status === 400 && isAlreadyFunded(detail)) return;

  if (response.status === 429) {
    throw new FriendbotError('Friendbot is rate limiting requests. Try again in a minute.');
  }

  throw new FriendbotError(
    typeof detail === 'string' && detail
      ? `Friendbot could not fund this account: ${detail}`
      : `Friendbot returned ${response.status}. Try again in a moment.`,
  );
}
