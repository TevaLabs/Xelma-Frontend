import PredictionControls, { type PredictionData } from "./PredictionControls";
import "./PredictionCard.css";

interface PredictionCardProps {
  isWalletConnected?: boolean;
  isRoundActive?: boolean;
  isConnecting?: boolean;
  onPrediction?: (prediction: PredictionData) => void;
}

const PredictionCard = ({
  isWalletConnected = false,
  isRoundActive = true,
  isConnecting = false,
  onPrediction,
}: PredictionCardProps) => {

  const isDisabled = !isWalletConnected || !isRoundActive || isConnecting;

  return (
    <div
      className={`prediction-card ${isDisabled ? "prediction-card--disabled" : ""}`}
      data-testid="prediction-card"
    >
      <PredictionControls
        isWalletConnected={isWalletConnected}
        isRoundActive={isRoundActive}
        isConnecting={isConnecting}
        onPrediction={onPrediction}
      />

    </div>
  );
};

export default PredictionCard;
