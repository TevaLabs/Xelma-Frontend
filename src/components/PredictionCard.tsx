import PredictionControls, { type PredictionData } from "./PredictionControls";
import "./PredictionCard.css";

interface PredictionCardProps {
  isWalletConnected?: boolean;
  isRoundActive?: boolean;
  isConnecting?: boolean;
  isSubmittingPrediction?: boolean;
  onPrediction?: (prediction: PredictionData) => void;
}

const PredictionCard = ({
  isWalletConnected = false,
  isRoundActive = true,
  isConnecting = false,
  isSubmittingPrediction = false,
  onPrediction,
}: PredictionCardProps) => {

  const isDisabled =
    !isWalletConnected || !isRoundActive || isConnecting || isSubmittingPrediction;

  return (
    <div
      className={`prediction-card ${isDisabled ? "prediction-card--disabled" : ""}`}
      data-testid="prediction-card"
    >
      <PredictionControls
        isWalletConnected={isWalletConnected}
        isRoundActive={isRoundActive}
        isConnecting={isConnecting}
        isSubmittingPrediction={isSubmittingPrediction}
        onPrediction={onPrediction}
      />

    </div>
  );
};

export default PredictionCard;
