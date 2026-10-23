import { describe, expect, it } from 'vitest';
import {
  PRICE_DECIMALS,
  PRICE_MAX,
  PRICE_MIN,
  PREDICTION_HINTS,
  areStakePresetsDisabled,
  computePresetStake,
  getPredictionBlockReason,
  isPredictionSubmittable,
  parseBalance,
  validateExactPrice,
  validateStake,
} from './predictionValidation';

describe('parseBalance', () => {
  it('reads the numeric part of a display balance', () => {
    expect(parseBalance('12.50 XLM')).toBe(12.5);
    expect(parseBalance('7')).toBe(7);
  });

  it('treats a missing or unparseable balance as zero', () => {
    expect(parseBalance(null)).toBe(0);
    expect(parseBalance(undefined)).toBe(0);
    expect(parseBalance('')).toBe(0);
    expect(parseBalance('oops')).toBe(0);
  });
});

describe('computePresetStake', () => {
  it('fills the requested share of the balance', () => {
    expect(computePresetStake('100.00 XLM', 0.25)).toBe('25');
    expect(computePresetStake('100.00 XLM', 0.5)).toBe('50');
    expect(computePresetStake('100.00 XLM', 1)).toBe('100');
  });

  it('truncates down so a preset can never overspend', () => {
    expect(computePresetStake('33.33 XLM', 0.25)).toBe('8.3325');
    expect(Number(computePresetStake('33.33 XLM', 1))).toBeLessThanOrEqual(33.33);
  });

  it('returns an empty string when there is nothing to stake', () => {
    expect(computePresetStake('0.00 XLM', 0.5)).toBe('');
    expect(computePresetStake(null, 0.5)).toBe('');
  });
});

describe('validateStake', () => {
  it('requires a positive amount within the balance', () => {
    expect(validateStake('', '100 XLM')).toBe('Enter a stake amount');
    expect(validateStake('0', '100 XLM')).toBe('Stake must be greater than 0');
    expect(validateStake('-4', '100 XLM')).toBe('Stake must be greater than 0');
    expect(validateStake('abc', '100 XLM')).toBe('Stake must be greater than 0');
    expect(validateStake('150', '100 XLM')).toBe(
      'Stake exceeds available balance (100 XLM)',
    );
    expect(validateStake('40', '100 XLM')).toBeNull();
  });

  it('names a zero balance instead of leaving the player guessing', () => {
    expect(validateStake('1', null)).toBe('Stake exceeds available balance (0.00 XLM)');
  });
});

describe('validateExactPrice', () => {
  it('bounds the price with one shared sentence', () => {
    expect(validateExactPrice('')).toBe('Enter an exact price');
    expect(validateExactPrice('abc')).toBe('Exact price must be a valid number');
    expect(validateExactPrice('0.00001')).toBe(
      `Must be between ${PRICE_MIN} and ${PRICE_MAX.toFixed(1)}`,
    );
    expect(validateExactPrice('11')).toBe(
      `Must be between ${PRICE_MIN} and ${PRICE_MAX.toFixed(1)}`,
    );
  });

  it('limits precision to the contract scale', () => {
    expect(validateExactPrice('0.12345')).toBe(`Maximum ${PRICE_DECIMALS} decimal places`);
    expect(validateExactPrice('0.2297')).toBeNull();
    expect(validateExactPrice(String(PRICE_MIN))).toBeNull();
    expect(validateExactPrice(String(PRICE_MAX))).toBeNull();
  });
});

describe('isPredictionSubmittable', () => {
  it('needs a valid stake, and a valid price once legend mode is on', () => {
    expect(
      isPredictionSubmittable({ stake: '', walletBalance: '100 XLM', isLegend: false, exactPrice: '' }),
    ).toBe(false);
    expect(
      isPredictionSubmittable({ stake: '10', walletBalance: '100 XLM', isLegend: false, exactPrice: '' }),
    ).toBe(true);
    expect(
      isPredictionSubmittable({ stake: '10', walletBalance: '100 XLM', isLegend: true, exactPrice: '' }),
    ).toBe(false);
    expect(
      isPredictionSubmittable({ stake: '10', walletBalance: '100 XLM', isLegend: true, exactPrice: '0.2297' }),
    ).toBe(true);
  });
});

describe('areStakePresetsDisabled', () => {
  it('needs a funded wallet and an unblocked action', () => {
    expect(
      areStakePresetsDisabled({ isWalletConnected: false, walletBalance: '100 XLM', isActionBlocked: false }),
    ).toBe(true);
    expect(
      areStakePresetsDisabled({ isWalletConnected: true, walletBalance: '0.00 XLM', isActionBlocked: false }),
    ).toBe(true);
    expect(
      areStakePresetsDisabled({ isWalletConnected: true, walletBalance: '100 XLM', isActionBlocked: true }),
    ).toBe(true);
    expect(
      areStakePresetsDisabled({ isWalletConnected: true, walletBalance: '100 XLM', isActionBlocked: false }),
    ).toBe(false);
  });
});

describe('getPredictionBlockReason', () => {
  it('reports the first reason that blocks a prediction', () => {
    expect(getPredictionBlockReason({ isWalletConnected: false, isRoundActive: true })).toBe(
      PREDICTION_HINTS.connectWallet,
    );
    expect(getPredictionBlockReason({ isWalletConnected: true, isRoundActive: false })).toBe(
      PREDICTION_HINTS.roundNotActive,
    );
    expect(
      getPredictionBlockReason({ isWalletConnected: true, isRoundActive: true, isConnecting: true }),
    ).toBe(PREDICTION_HINTS.walletConnecting);
    expect(
      getPredictionBlockReason({ isWalletConnected: true, isRoundActive: true, isSubmitting: true }),
    ).toBe(PREDICTION_HINTS.predictionSubmitting);
    expect(getPredictionBlockReason({ isWalletConnected: true, isRoundActive: true })).toBeNull();
  });
});
