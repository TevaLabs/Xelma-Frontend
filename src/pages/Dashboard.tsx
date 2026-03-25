import { useEffect, useState, useRef } from "react";
import { ChatSidebar } from "../components/ChatSidebar";
import PriceChart from "../components/PriceChart";
import PredictionCard from "../components/PredictionCard";
import type { PredictionData } from "../components/PredictionControls";
import { useRoundStore } from "../store/useRoundStore";
import PredictionHistory from "../components/PredictionHistory";
import { useWalletStore, selectIsWalletConnected } from "../store/useWalletStore";
import { predictionsApi, ApiError } from "../lib/api-client";

interface DashboardProps {
  showNewsRibbon?: boolean;
}

const Dashboard = ({ showNewsRibbon = true }: DashboardProps) => {
  const isRoundActive = useRoundStore((state) => state.isRoundActive);
  const isWalletConnected = useWalletStore(selectIsWalletConnected);
  const isWalletConnecting = useWalletStore(
    (s) => s.status === "connecting" || s.status === "checking"
  );
  const publicKey = useWalletStore((s) => s.publicKey);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const { fetchActiveRound, subscribeToRoundEvents } = useRoundStore.getState();

    void fetchActiveRound();
    const unsubscribe = subscribeToRoundEvents();

    return () => {
      unsubscribe();
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handlePrediction = async (data: PredictionData) => {
    setIsSubmitting(true);
    setMessage(null);

    // Clear any existing timeout
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      await predictionsApi.submit({
        direction: data.direction,
        stake: data.stake,
        exactPrice: data.exactPrice,
        isLegend: data.isLegend,
      });

      setMessage({ type: 'success', text: 'Prediction Sent!' });
      
      // Clear message after 3 seconds
      timeoutRef.current = window.setTimeout(() => {
        setMessage(null);
        timeoutRef.current = null;
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to submit prediction. Please try again.';
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard flex min-h-full">
      <ChatSidebar showNewsRibbon={showNewsRibbon} />

      <div className="flex-1 ml-0 md:ml-80 transition-[margin] duration-300 ease-in-out p-4 lg:p-6">
        {/* Message display */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
            role="alert"
          >
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Center: Prediction controls (Issue: core prediction area) */}
          <div className="dashboard__center lg:col-span-1 flex flex-col gap-6">
            <PredictionCard
              isWalletConnected={isWalletConnected}
              isRoundActive={isRoundActive}
              isConnecting={isWalletConnecting}
              isSubmittingPrediction={isSubmitting}
              onPrediction={handlePrediction}
            />
          </div>

          {/* Right: Price chart and placeholder */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Price Chart */}
            <div className="min-h-[350px] bg-white dark:bg-gray-800 p-6 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700">
              <PriceChart height={280} />
            </div>

            <div className="mt-5 p-4 bg-black/5 rounded-lg text-center">
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                142 Playing Now
              </p>
            </div>

            <PredictionHistory userId={publicKey} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
