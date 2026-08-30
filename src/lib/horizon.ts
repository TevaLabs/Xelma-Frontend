/**
 * Network-aware Horizon configuration and account helpers.
 *
 * The Horizon endpoint is resolved from `VITE_STELLAR_HORIZON_URL` when set.
 * Otherwise it is derived from `VITE_STELLAR_NETWORK` so that a single network
 * switch moves the whole app between testnet and mainnet.
 */

const TESTNET_HORIZON = 'https://horizon-testnet.stellar.org';
const PUBLIC_HORIZON = 'https://horizon.stellar.org';

const NETWORK = (import.meta.env.VITE_STELLAR_NETWORK ?? 'TESTNET').toUpperCase();

export const IS_MAINNET = NETWORK === 'PUBLIC' || NETWORK === 'MAINNET';

/** Root Horizon URL for the configured network, without a trailing slash. */
export const HORIZON_URL: string = (
  import.meta.env.VITE_STELLAR_HORIZON_URL || (IS_MAINNET ? PUBLIC_HORIZON : TESTNET_HORIZON)
).replace(/\/+$/, '');

/** Raw balance entry as returned by Horizon's `/accounts/{id}` endpoint. */
interface HorizonBalance {
  asset_type: string;
  balance: string;
  asset_code?: string;
  asset_issuer?: string;
  limit?: string;
  is_authorized?: boolean;
}

/** A single asset line, normalized for display. */
export interface AssetBalance {
  /** `XLM` for the native asset, otherwise the 4- or 12-character asset code. */
  code: string;
  /** Balance formatted to 7 decimal places (Horizon's native precision). */
  balance: string;
  /** True for the native XLM balance. */
  isNative: boolean;
  /** Issuer G-address for trustlines; null for native. */
  issuer: string | null;
  /** Trustline limit, when Horizon reports one. */
  limit: string | null;
  /** False when the issuer has not authorized this trustline. */
  isAuthorized: boolean;
}

export interface AccountBalances {
  native: AssetBalance | null;
  trustlines: AssetBalance[];
  /** True when the account does not exist on this network yet (Horizon 404). */
  isUnfunded: boolean;
}

export class HorizonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HorizonError';
  }
}

function normalizeBalance(entry: HorizonBalance): AssetBalance {
  const isNative = entry.asset_type === 'native';
  return {
    code: isNative ? 'XLM' : entry.asset_code ?? 'UNKNOWN',
    balance: entry.balance,
    isNative,
    issuer: isNative ? null : entry.asset_issuer ?? null,
    limit: entry.limit ?? null,
    isAuthorized: entry.is_authorized !== false,
  };
}

/**
 * Fetches balances and trustlines for a G-address from Horizon.
 *
 * An unfunded account (Horizon 404) resolves to `isUnfunded: true` rather than
 * throwing, so the UI can render an empty state instead of an error.
 *
 * @throws {HorizonError} when the request fails or the response is unusable.
 */
export async function fetchAccountBalances(
  address: string,
  signal?: AbortSignal,
): Promise<AccountBalances> {
  let response: Response;
  try {
    response = await fetch(`${HORIZON_URL}/accounts/${address}`, { signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new HorizonError('Could not reach Horizon. Check your connection and try again.');
  }

  if (response.status === 404) {
    return { native: null, trustlines: [], isUnfunded: true };
  }

  if (!response.ok) {
    throw new HorizonError(`Horizon returned ${response.status}. Try again in a moment.`);
  }

  let payload: { balances?: HorizonBalance[] };
  try {
    payload = await response.json();
  } catch {
    throw new HorizonError('Received an unreadable response from Horizon.');
  }

  const balances = Array.isArray(payload.balances) ? payload.balances : [];
  const normalized = balances.map(normalizeBalance);

  return {
    native: normalized.find((b) => b.isNative) ?? null,
    trustlines: normalized.filter((b) => !b.isNative),
    isUnfunded: false,
  };
}

/** Formats a raw Horizon balance string for compact display. */
export function formatBalance(raw: string, decimals = 2): string {
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value)) return '0.00';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
