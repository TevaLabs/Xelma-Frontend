import { useEffect, useState, useRef } from "react";
import { ChatSidebar } from "../components/ChatSidebar";
import PriceChart from "../components/PriceChart";
import PredictionCard from "../components/PredictionCard";
import EndRoundModal from "../components/EndRoundModal";
import type { PredictionData } from "../components/PredictionControls";
import type { Round } from "../lib/api-client";
import { useRoundStore } from "../store/useRoundStore";
import PredictionHistory from "../components/PredictionHistory";
import { useWalletStore, selectIsWalletConnected } from "../store/useWalletStore";
import { predictionsApi, ApiError } from "../lib/api-client";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import RoundTimeline from "../components/RoundTimeline";
import { HudStatusRow } from "../components/hud/HudStatusRow";
import ProfileSummaryCard from "../components/ProfileSummaryCard";
import LiveGameStatsPanel from "../components/LiveGameStatsPanel";

interface DashboardProps {
  showNewsRibbon?: boolean;
}

const Dashboard = ({ showNewsRibbon = true }: DashboardProps) => {
  const isRoundActive = useRoundStore((state) => state.isRoundActive);
  const sseConnection = useRoundStore((state) => state.sseConnection);
  const isWalletConnected = useWalletStore(selectIsWalletConnected);
  const isWalletConnecting = useWalletStore(
    (s) => s.status === "connecting" || s.status === "checking"
  );
  const publicKey = useWalletStore((s) => s.publicKey);
  const balance = useWalletStore((s) => s.balance);
  const resolvedRound = useRoundStore((state) => state.resolvedRound);
  const dismissResolvedRound = useRoundStore((state) => state.dismissResolvedRound);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const { isConnected: isSocketConnected } = useConnectionStatus();

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

  const getEndRoundResult = (round: Round | null) => {
    const defaultTip = 'Stay tuned for the next round.';

    if (!round) {
      return {
        isWin: false,
        amount: 0,
        tip: defaultTip,
      };
    }

    const isWin = typeof round.isWin === 'boolean'
      ? round.isWin
      : String(round.outcome ?? round.result ?? '').toLowerCase() === 'win';

    const amount = typeof round.netChange === 'number'
      ? round.netChange
      : typeof round.profit === 'number'
      ? round.profit
      : typeof round.score === 'number'
      ? round.score
      : 0;

    const tip = typeof round.tip === 'string'
      ? round.tip
      : typeof round.note === 'string'
      ? round.note
      : defaultTip;

    return { isWin, amount, tip };
  };

  const endRoundResult = getEndRoundResult(resolvedRound);

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
        {/* HUD status row */}
        <HudStatusRow playerCount={142} className="mb-4" />

        {/* Connection Status Banner */}
        {(!isSocketConnected || (sseConnection && sseConnection.status !== 'connected')) && (
          <div className="mb-4">
            <ConnectionStatus />
            {sseConnection && sseConnection.status !== 'connected' && sseConnection.error && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Round updates: {sseConnection.error}
                </p>
              </div>
            )}
          </div>
        )}

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

        {/* Round State Timeline */}
        <div className="mb-6">
          <RoundTimeline />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prediction controls */}
          <div className="dashboard__center lg:col-span-1 flex flex-col gap-6">
            <ProfileSummaryCard />
            <PredictionCard
              isWalletConnected={isWalletConnected}
              isRoundActive={isRoundActive}
              isConnecting={isWalletConnecting}
              isSubmittingPrediction={isSubmitting}
              onPrediction={handlePrediction}
              walletBalance={balance}
            />
          </div>


          {/* Right: Price chart and live stats */}
          {/* Price chart + prediction history */}

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="min-h-[350px] bg-white dark:bg-gray-800 p-6 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700">
              <PriceChart height={280} />
            </div>


            <LiveGameStatsPanel />



            <PredictionHistory userId={publicKey} />
          </div>
        </div>
      </div>
      <EndRoundModal
        isOpen={Boolean(resolvedRound)}
        onClose={dismissResolvedRound}
        result={endRoundResult}
      />
    </div>
  );
};

export default Dashboard;
