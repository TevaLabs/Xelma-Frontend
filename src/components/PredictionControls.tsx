import { useState, useCallback, useRef } from "react";
import PredictionHelpTooltip from "./PredictionHelpTooltip";
import "./PredictionCard.css";

const EXACT_PRICE_MIN = 0.0001;
const EXACT_PRICE_MAX = 10.0;
const EXACT_PRICE_DECIMAL_PLACES = 4;

function parseBalance(balance: string | null | undefined): number {
  if (!balance) return 0;
  const numericPart = balance.replace(' XLM', '');
  return parseFloat(numericPart) || 0;
}

function computePresetStake(balanceStr: string | null | undefined, percentage: number): string {
  const available = parseBalance(balanceStr);
  if (available <= 0) return '';
  const raw = available * percentage;
  const factor = 10000;
  const truncated = Math.floor(raw * factor + 1e-9) / factor;
  const safeAmount = Math.min(truncated, available);
  return Number(safeAmount.toFixed(4)).toString();
}

function validateStake(value: string, walletBalance: string | null | undefined): string | null {
  if (!value.trim()) return 'Enter a stake amount';
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return 'Stake must be greater than 0';
  
  const availableBalance = parseBalance(walletBalance);
  if (amount > availableBalance) {
    return `Stake exceeds available balance (${walletBalance || '0.00 XLM'})`;
  }
  
  return null;
}

export interface PredictionData {
  direction: "UP" | "DOWN";
  stake: string;
  exactPrice?: string;
  isLegend: boolean;
  /** Share of the UP/DOWN pool held by each side (0-100). Present only for
   *  UP/DOWN rounds; lets the BetModal surface the pool-imbalance warning. */
  poolUpPct?: number;
  poolDownPct?: number;
}

export interface PredictionControlsProps {
  isWalletConnected?: boolean;
  isRoundActive?: boolean;
  /** Wallet/session connecting (e.g. Freighter flow). */
  isConnecting?: boolean;
  /** Prediction submit in flight (distinct from wallet connecting). */
  isSubmittingPrediction?: boolean;
  onPrediction?: (prediction: PredictionData) => void;
  walletBalance?: string | null;
}

function validateExactPrice(value: string): string | null {
  if (!value.trim()) return "Enter an exact price";
  const num = parseFloat(value);
  if (Number.isNaN(num)) return "Must be a valid number";
  if (num < EXACT_PRICE_MIN || num > EXACT_PRICE_MAX) {
    return `Must be between ${EXACT_PRICE_MIN} and ${EXACT_PRICE_MAX.toFixed(1)}`;
  }
  const parts = value.split(".");
  if (parts.length === 2 && parts[1].length > EXACT_PRICE_DECIMAL_PLACES) {
    return `Maximum ${EXACT_PRICE_DECIMAL_PLACES} decimal places`;
  }
  return null;
}

export function PredictionControls({
  isWalletConnected = false,
  isRoundActive = true,
  isConnecting = false,
  isSubmittingPrediction = false,
  onPrediction,
  walletBalance,
}: PredictionControlsProps) {
  const [stake, setStake] = useState("");
  const [isLegend, setIsLegend] = useState(false);
  const [exactPrice, setExactPrice] = useState("");
  const [exactPriceError, setExactPriceError] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<"UP" | "DOWN" | null>(null);
  const [touchedExactPrice, setTouchedExactPrice] = useState(false);
  const [stakeError, setStakeError] = useState<string | null>(null);

  // Internal idempotency guard: blocks a second prediction submit while the
  // first is still in flight (before the parent's isSubmittingPrediction state
  // has propagated). Prevents double-submit races on rapid/cluster clicks.
  const inFlightRef = useRef(false);
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);

  const isSubmitting = isSubmittingPrediction || isSubmittingInternal;

  const isDisabled =
    !isWalletConnected || !isRoundActive || isConnecting || isSubmitting;
  const availableBalance = parseBalance(walletBalance);
  const arePresetsDisabled = isDisabled || !isWalletConnected || availableBalance <= 0;

  const validateExactPriceField = useCallback(() => {
    if (!isLegend) return;
    const error = validateExactPrice(exactPrice);
    setExactPriceError(error);
  }, [isLegend, exactPrice]);

  const handleExactPriceBlur = () => {
    setTouchedExactPrice(true);
    validateExactPriceField();
  };

  const handleExactPriceChange = (value: string) => {
    setExactPrice(value);
    if (touchedExactPrice) {
      setExactPriceError(validateExactPrice(value));
    }
  };

  const handleStakeChange = (value: string) => {
    setStake(value);
    const error = validateStake(value, walletBalance);
    setStakeError(error);
  };

  const handlePresetClick = (percentage: number) => {
    const calculatedStake = computePresetStake(walletBalance, percentage);
    handleStakeChange(calculatedStake);
  };

  const handlePrediction = (direction: "UP" | "DOWN") => {
    if (isDisabled || !stake) return;

    // Acquire the internal in-flight lock. If a submit is already in progress
    // (or hasn't been released yet), drop the duplicate click immediately.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    const stakeValidationError = validateStake(stake, walletBalance);
    if (stakeValidationError) {
      setStakeError(stakeValidationError);
      inFlightRef.current = false;
      return;
    }

    if (isLegend) {
      setTouchedExactPrice(true);
      const error = validateExactPrice(exactPrice);
      setExactPriceError(error);
      if (error) {
        inFlightRef.current = false;
        return;
      }
    }

    const predictionData: PredictionData = {
      direction,
      stake,
      exactPrice: isLegend ? exactPrice : undefined,
      isLegend,
    };

    setSelectedDirection(direction);
    setIsSubmittingInternal(true);
    onPrediction?.(predictionData);

    setTimeout(() => {
      inFlightRef.current = false;
      setIsSubmittingInternal(false);
      setStake("");
      setExactPrice("");
      setExactPriceError(null);
      setStakeError(null);
      setIsLegend(false);
      setSelectedDirection(null);
      setTouchedExactPrice(false);
    }, 500);
  };

  const canSubmit = Boolean(stake) && !stakeError && (!isLegend || (exactPrice && !exactPriceError));

  return (
    <>
      <div className="flex items-center justify-center gap-2 mb-7">
        <h2 className="prediction-card__title" style={{ margin: 0 }}>Guess price prediction</h2>
        <PredictionHelpTooltip />
      </div>

      {isConnecting && (
        <p className="prediction-card__connecting" role="status">
          Connecting wallet...
        </p>
      )}
      {isSubmitting && !isConnecting && (
        <p className="prediction-card__connecting" role="status">
          Submitting prediction...
        </p>
      )}

      <div className="prediction-card__buttons">
        <button
          type="button"
          className={`prediction-card__button prediction-card__button--up ${
            selectedDirection === "UP" ? "prediction-card__button--active" : ""
          }`}
          onClick={() => handlePrediction("UP")}
          disabled={isDisabled || !canSubmit}
          aria-label="Predict price goes UP"
        >
          <span className="prediction-card__button-arrow">↑</span>
          <span className="prediction-card__button-text">UP</span>
        </button>

        <button
          type="button"
          className={`prediction-card__button prediction-card__button--down ${
            selectedDirection === "DOWN" ? "prediction-card__button--active" : ""
          }`}
          onClick={() => handlePrediction("DOWN")}
          disabled={isDisabled || !canSubmit}
          aria-label="Predict price goes DOWN"
        >
          <span className="prediction-card__button-arrow">↓</span>
          <span className="prediction-card__button-text">DOWN</span>
        </button>
      </div>

      <div className="prediction-card__stake-section">
        <label htmlFor="stake-input" className="prediction-card__label">
          Stake Amount
        </label>
        <div className="prediction-card__input-group">
          <input
            id="stake-input"
            type="number"
            className="prediction-card__input"
            placeholder="Enter amount"
            value={stake}
            onChange={(e) => handleStakeChange(e.target.value)}
            disabled={isDisabled}
            min="0"
            step="0.01"
          />
          <div className="prediction-card__preset-buttons" role="group" aria-label="Stake presets">
            <button
              type="button"
              className="prediction-card__preset-button"
              onClick={() => handlePresetClick(0.25)}
              disabled={arePresetsDisabled}
              aria-label="Set stake to 25% of balance"
            >
              25%
            </button>
            <button
              type="button"
              className="prediction-card__preset-button"
              onClick={() => handlePresetClick(0.5)}
              disabled={arePresetsDisabled}
              aria-label="Set stake to 50% of balance"
            >
              50%
            </button>
            <button
              type="button"
              className="prediction-card__preset-button"
              onClick={() => handlePresetClick(1.0)}
              disabled={arePresetsDisabled}
              aria-label="Set stake to Max available balance"
            >
              Max
            </button>
          </div>
        </div>
        {stakeError && (
          <p className="prediction-card__exact-price-error" role="alert">
            {stakeError}
          </p>
        )}
      </div>

      <div className="prediction-card__toggle-section">
        <label className="prediction-card__toggle">
          <input
            type="checkbox"
            className="prediction-card__toggle-input"
            checked={isLegend}
            onChange={(e) => {
              setIsLegend(e.target.checked);
              if (!e.target.checked) {
                setExactPriceError(null);
                setTouchedExactPrice(false);
              }
            }}
            disabled={isDisabled}
            aria-describedby="legend-toggle-desc"
          />
          <span className="prediction-card__toggle-switch" aria-hidden />
          <span className="prediction-card__toggle-label" id="legend-toggle-desc">
            I am a legend
          </span>
        </label>
      </div>

      {isLegend && (
        <div className="prediction-card__exact-price-section" role="region" aria-labelledby="exact-price-label">
          <label id="exact-price-label" htmlFor="exact-price-input" className="prediction-card__label">
            Exact Price Prediction
          </label>
          <input
            id="exact-price-input"
            type="number"
            className={`prediction-card__input ${exactPriceError ? "prediction-card__input--error" : ""}`}
            placeholder="0.2297"
            value={exactPrice}
            onChange={(e) => handleExactPriceChange(e.target.value)}
            onBlur={handleExactPriceBlur}
            disabled={isDisabled}
            step="0.0001"
            min={EXACT_PRICE_MIN}
            max={EXACT_PRICE_MAX}
            aria-invalid={Boolean(exactPriceError)}
            aria-describedby={exactPriceError ? "exact-price-error" : undefined}
          />
          {exactPriceError && (
            <p id="exact-price-error" className="prediction-card__exact-price-error" role="alert">
              {exactPriceError}
            </p>
          )}
          <p className="prediction-card__legend-hint">
            Predict the exact price for a chance to win the legend bonus!
          </p>
        </div>
      )}

      {isDisabled && !isConnecting && !isSubmitting && (
        <div className="prediction-card__disabled-message">
          {!isWalletConnected && <p>Connect your wallet to make predictions</p>}
          {isWalletConnected && !isRoundActive && <p>This round is not active</p>}
        </div>
      )}
    </>
  );
}

export default PredictionControls;
