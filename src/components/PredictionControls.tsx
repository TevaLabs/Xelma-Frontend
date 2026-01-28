import { useState, useCallback } from "react";
import "./PredictionCard.css";

const EXACT_PRICE_MIN = 0.0001;
const EXACT_PRICE_MAX = 10.0;
const EXACT_PRICE_DECIMAL_PLACES = 4;

export interface PredictionData {
  direction: "UP" | "DOWN";
  stake: string;
  exactPrice?: string;
  isLegend: boolean;
}

export interface PredictionControlsProps {
  isWalletConnected?: boolean;
  isRoundActive?: boolean;
  isConnecting?: boolean;
  onPrediction?: (prediction: PredictionData) => void;
}

function validateExactPrice(value: string): string | null {
  if (!value.trim()) return "Enter an exact price";
  const num = parseFloat(value);
  if (Number.isNaN(num)) return "Must be a valid number";
  if (num < EXACT_PRICE_MIN || num > EXACT_PRICE_MAX) {
    return `Must be between ${EXACT_PRICE_MIN} and ${EXACT_PRICE_MAX}`;
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
  onPrediction,
}: PredictionControlsProps) {
  const [stake, setStake] = useState("");
  const [isLegend, setIsLegend] = useState(false);
  const [exactPrice, setExactPrice] = useState("");
  const [exactPriceError, setExactPriceError] = useState<string | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<"UP" | "DOWN" | null>(null);
  const [touchedExactPrice, setTouchedExactPrice] = useState(false);

  const isDisabled = !isWalletConnected || !isRoundActive || isConnecting;

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

  const handleFillClick = () => {
    setStake("1000");
  };

  const handlePrediction = (direction: "UP" | "DOWN") => {
    if (isDisabled || !stake) return;

    if (isLegend) {
      setTouchedExactPrice(true);
      const error = validateExactPrice(exactPrice);
      setExactPriceError(error);
      if (error) return;
    }

    const predictionData: PredictionData = {
      direction,
      stake,
      exactPrice: isLegend ? exactPrice : undefined,
      isLegend,
    };

    setSelectedDirection(direction);
    onPrediction?.(predictionData);

    setTimeout(() => {
      setStake("");
      setExactPrice("");
      setExactPriceError(null);
      setIsLegend(false);
      setSelectedDirection(null);
      setTouchedExactPrice(false);
    }, 500);
  };

  const canSubmit = Boolean(stake) && (!isLegend || (exactPrice && !exactPriceError));

  return (
    <>
      <h2 className="prediction-card__title">Guess price prediction</h2>

      {isConnecting && (
        <p className="prediction-card__connecting" role="status">
          Connecting...
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
            onChange={(e) => setStake(e.target.value)}
            disabled={isDisabled}
            min="0"
            step="0.01"
          />
          <button
            type="button"
            className="prediction-card__fill-button"
            onClick={handleFillClick}
            disabled={isDisabled}
            title="Fill with wallet balance"
          >
            Fill
          </button>
        </div>
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

      {isDisabled && !isConnecting && (
        <div className="prediction-card__disabled-message">
          {!isWalletConnected && <p>Connect your wallet to make predictions</p>}
          {isWalletConnected && !isRoundActive && <p>This round is not active</p>}
        </div>
      )}
    </>
  );
}

export default PredictionControls;
