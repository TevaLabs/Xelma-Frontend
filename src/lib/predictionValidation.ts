/**
 * Single source of truth for the prediction form rules shared by the dashboard
 * prediction card and the bet confirmation modal. Both surfaces used to keep
 * their own copy of these checks, which drifted into two different sets of
 * error wording for the same mistake.
 */

export const PRICE_MIN = 0.0001;
export const PRICE_MAX = 10;
export const PRICE_DECIMALS = 4;

/** Copy shared by every surface that blocks a prediction. */
export const PREDICTION_HINTS = {
  connectWallet: 'Connect your wallet to make predictions',
  roundNotActive: 'This round is not active',
  walletConnecting: 'Connecting wallet...',
  predictionSubmitting: 'Submitting prediction...',
  incompleteForm: 'Enter a valid stake amount to place a prediction',
} as const;

export interface PredictionData {
  direction: 'UP' | 'DOWN';
  stake: string;
  isLegend: boolean;
  exactPrice?: string;
  /** Share of the UP/DOWN pool held by each side (0-100). Present only for
   *  UP/DOWN rounds; lets the BetModal surface the pool-imbalance warning. */
  poolUpPct?: number;
  poolDownPct?: number;
}

/** Wallet balances are carried as display strings like `"12.50 XLM"`. */export function parseBalance(balance: string | null | undefined): number {
  if (!balance) return 0;
  return parseFloat(balance.replace(' XLM', '')) || 0;
}

/**
 * Presets truncate down to the account's 7-decimal precision instead of
 * rounding up, so a "Max" click can never overspend the balance.
 */
export function computePresetStake(
  balance: string | null | undefined,
  percentage: number,
): string {
  const available = parseBalance(balance);
  if (available <= 0) return '';
  const raw = available * percentage;
  const factor = 10_000;
  const truncated = Math.floor(raw * factor + 1e-9) / factor;
  const safeAmount = Math.min(truncated, available);
  return Number(safeAmount.toFixed(4)).toString();
}

export function validateStake(
  value: string,
  walletBalance: string | null | undefined,
): string | null {
  if (!value.trim()) return 'Enter a stake amount';
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Stake must be greater than 0';
  if (amount > parseBalance(walletBalance)) {
    return `Stake exceeds available balance (${walletBalance || '0.00 XLM'})`;
  }
  return null;
}

export function validateExactPrice(value: string): string | null {
  if (!value.trim()) return 'Enter an exact price';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Exact price must be a valid number';
  if (amount < PRICE_MIN || amount > PRICE_MAX) {
    return `Must be between ${PRICE_MIN} and ${PRICE_MAX.toFixed(1)}`;
  }
  const decimals = value.split('.')[1];
  if (decimals && decimals.length > PRICE_DECIMALS) {
    return `Maximum ${PRICE_DECIMALS} decimal places`;
  }
  return null;
}

/** True when every field the chosen mode needs is present and valid. */
export function isPredictionSubmittable({
  stake,
  walletBalance,
  isLegend,
  exactPrice,
}: {
  stake: string;
  walletBalance: string | null | undefined;
  isLegend: boolean;
  exactPrice: string;
}): boolean {
  if (validateStake(stake, walletBalance)) return false;
  if (isLegend && validateExactPrice(exactPrice)) return false;
  return true;
}

/**
 * Presets need a funded, usable wallet session. `isActionBlocked` covers the
 * per-surface reasons that differ (round closed, wallet connecting, a submit or
 * transaction already in flight).
 */
export function areStakePresetsDisabled({
  isWalletConnected,
  walletBalance,
  isActionBlocked,
}: {
  isWalletConnected: boolean;
  walletBalance: string | null | undefined;
  isActionBlocked: boolean;
}): boolean {
  return !isWalletConnected || isActionBlocked || parseBalance(walletBalance) <= 0;
}

/** Why the prediction cannot be placed right now, or null when it can. */
export function getPredictionBlockReason({
  isWalletConnected,
  isRoundActive,
  isConnecting,
  isSubmitting,
}: {
  isWalletConnected: boolean;
  isRoundActive?: boolean;
  isConnecting?: boolean;
  isSubmitting?: boolean;
}): string | null {
  if (!isWalletConnected) return PREDICTION_HINTS.connectWallet;
  if (isRoundActive === false) return PREDICTION_HINTS.roundNotActive;
  if (isConnecting) return PREDICTION_HINTS.walletConnecting;
  if (isSubmitting) return PREDICTION_HINTS.predictionSubmitting;
  return null;
}
