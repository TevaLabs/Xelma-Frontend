import { useEffect, useState, useRef, useCallback } from "react";
import PriceChart from "../components/PriceChart";
import PredictionCard from "../components/PredictionCard";
import PredictionHistory from "../components/PredictionHistory";
import StatsCard from "../components/StatsCard";
import RecentActivity from "../components/RecentActivity";
import type { PredictionData } from "../components/PredictionControls";
import BetModal from "../components/BetModal";
import EndRoundModal from "../components/EndRoundModal";
import RoundTimeline from "../components/RoundTimeline";
import { ChatSidebar } from "../components/ChatSidebar";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import { useRoundStore } from "../store/useRoundStore";
import type { Round, UserPrediction, UserStats } from "../lib/api-client";
import { educationApi, statsApi, predictionsApi } from "../lib/api-client";
import { useWalletStore, selectIsWalletConnected } from "../store/useWalletStore";
import { Link } from "react-router-dom";
import { TipCard } from "../components/education/TipCard";
import type { Tip } from "../types/education";
import EmptyState from '../components/EmptyState';
import DashboardSkeleton from '../components/DashboardSkeleton';
import { mockUserStats } from "../data/mockData";
import type { RecentActivityItem } from "../types";

function mapPredictionToActivityItem(pred: UserPrediction): RecentActivityItem {
  const isWin = typeof pred.isWin === "boolean"
    ? pred.isWin
    : String(pred.outcome ?? pred.result ?? pred.status ?? "").toLowerCase().includes("win") ||
      String(pred.outcome ?? pred.result ?? pred.status ?? "").toUpperCase() === "WON";

  const asset = typeof pred.asset === "string" ? pred.asset : "BTC";
  const mode = (typeof pred.mode === "string" && (pred.mode === "updown" || pred.mode === "precision"))
    ? pred.mode
    : "updown";

  return {
    id: String(pred.id),
    asset,
    result: isWin ? "Won" : "Lost",
    amount: typeof pred.stake === "number" ? pred.stake : parseFloat(String(pred.stake || 0)) || 0,
    mode,
  };
}

const DAILY_TIP_CACHE_KEY = "xelma_daily_tip";

const DailyTip = () => {
  const [tip, setTip] = useState<Tip | null>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cached = localStorage.getItem(DAILY_TIP_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { date: string; tip: Tip };
        if (parsed.date === today && parsed.tip) {
          return parsed.tip;
        }
      } catch {
        // corrupted cache
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cached = localStorage.getItem(DAILY_TIP_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { date: string; tip: Tip };
        if (parsed.date === today && parsed.tip) {
          return parsed.tip;
        }
      } catch {
        // corrupted cache
      }
    }
    return true;
  });

  useEffect(() => {
    if (tip !== null) return;

    const today = new Date().toISOString().slice(0, 10);
    void educationApi.getTip().then((fetched) => {
      if (fetched) {
        localStorage.setItem(
          DAILY_TIP_CACHE_KEY,
          JSON.stringify({ date: today, tip: fetched })
        );
        setTip(fetched);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [tip]);

  if (loading) {
    return (
      <div
        className="rounded-2xl glass-card accent-border-teal p-6 animate-pulse"
        aria-busy="true"
        aria-label="Loading daily tip"
      >
        <div className="h-4 w-24 rounded bg-white/10 mb-3" />
        <div className="h-3 w-full rounded bg-white/10 mb-2" />
        <div className="h-3 w-4/5 rounded bg-white/10" />
      </div>
    );
  }

  if (!tip) {
    return null;
  }

  return (
    <div>
      <TipCard tip={tip} />
      <div className="mt-3 text-right">
        <Link
          to="/learn"
          className="text-xs font-semibold text-xelma-teal-bright hover:underline"
        >
          View all guides &rarr;
        </Link>
      </div>
    </div>
  );
};


const Dashboard = () => {
  const isRoundActive = useRoundStore((state) => state.isRoundActive);
  const isLoading = useRoundStore((state) => state.isLoading);
  const sseConnection = useRoundStore((state) => state.sseConnection);
  const isWalletConnected = useWalletStore(selectIsWalletConnected);
  const isWalletConnecting = useWalletStore(
    (s) => s.status === "connecting" || s.status === "checking"
  );
  const resolvedRound = useRoundStore((state) => state.resolvedRound);
  const dismissResolvedRound = useRoundStore((state) => state.dismissResolvedRound);
  const publicKey = useWalletStore((s) => s.publicKey);
  const { isConnected: isSocketConnected } = useConnectionStatus();
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [pendingPrediction, setPendingPrediction] = useState<PredictionData | null>(null);
  // Community chat is opt-in so the default terminal stays uncluttered.
  const [isChatOpen, setIsChatOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!isWalletConnected) {
      setStats(null);
      return;
    }
    setIsStatsLoading(true);
    setStatsError(null);
    try {
      const data = await statsApi.getUserStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch user stats:", err);
      setStatsError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setIsStatsLoading(false);
    }
  }, [isWalletConnected]);

  const fetchActivities = useCallback(async () => {
    if (!isWalletConnected || !publicKey) {
      setActivities([]);
      return;
    }
    setIsActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const data = await predictionsApi.getUserHistory(publicKey);
      setActivities(data.map(mapPredictionToActivityItem));
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
      setActivitiesError(err instanceof Error ? err.message : "Failed to load predictions");
    } finally {
      setIsActivitiesLoading(false);
    }
  }, [isWalletConnected, publicKey]);

  useEffect(() => {
    void fetchStats();
    void fetchActivities();
  }, [fetchStats, fetchActivities]);

  useEffect(() => {
    const { fetchActiveRound, subscribeToRoundEvents } = useRoundStore.getState();
    void fetchActiveRound();
    const unsubscribe = subscribeToRoundEvents();
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const currentTimeout = timeoutRef.current;
      if (currentTimeout !== null) {
        clearTimeout(currentTimeout);
      }
    };
  }, []);

  const handlePrediction = (data: PredictionData) => {
    setPendingPrediction(data);
    setIsBetModalOpen(true);
  };

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

  return (
    <div className="xelma-grid-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      {/* Opt-in community chat (ported from the legacy /play view). Self-positions
          as a fixed slide-over, so mounting it does not shift the terminal layout. */}
      {isChatOpen && <ChatSidebar />}

      <div className="mx-auto max-w-7xl">
        {isLoading && <DashboardSkeleton />}

        {!isLoading && (
          <div className="mb-4 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsChatOpen((open) => !open)}
              aria-pressed={isChatOpen}
              className="btn-ghost inline-flex min-h-[40px] items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            >
              {isChatOpen ? "Hide community chat" : "Community chat"}
            </button>
          </div>
        )}

        {/* Round-update connectivity, ported from /play so users see SSE/socket health. */}
        {!isLoading &&
          (!isSocketConnected ||
            (sseConnection && sseConnection.status !== "connected")) && (
            <div className="mb-4">
              <ConnectionStatus />
              {sseConnection &&
                sseConnection.status !== "connected" &&
                sseConnection.error && (
                  <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Round updates: {sseConnection.error}
                    </p>
                  </div>
                )}
            </div>
          )}

        {/* Round lifecycle timeline, ported from /play. */}
        {!isLoading && (
          <div className="mb-6">
            <RoundTimeline />
          </div>
        )}

        {!isLoading && !isWalletConnected && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#2C4BFD]/30 bg-[#2C4BFD]/10 p-4 text-sm text-[#BEC7FE] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
            <p className="leading-relaxed" data-testid="dashboard-wallet-prompt">
              Connect your wallet to submit predictions.
            </p>
            <Link
              to="/connect"
              data-testid="dashboard-connect-now"
              className="btn-primary no-underline inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-5 py-2 text-sm font-bold sm:w-auto"
            >
              Connect now
            </Link>
          </div>
        )}

        {!isLoading && !isRoundActive && (
          <EmptyState
            title="No Active Rounds"
            description="Learn how the game works or refresh to check for new rounds."
            action={
              <button
                type="button"
                className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
                onClick={() => {
                  void useRoundStore.getState().fetchActiveRound();
                }}
              >
                Refresh
              </button>
            }
          />
        )}

        {!isLoading && isRoundActive && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="dashboard__center lg:col-span-1 flex flex-col gap-6">
              <PredictionCard
                isWalletConnected={isWalletConnected}
                isRoundActive={isRoundActive}
                isConnecting={isWalletConnecting}
                isSubmittingPrediction={isBetModalOpen}
                onPrediction={handlePrediction}
                walletBalance={balance}
              />
              {isWalletConnected && (
                <StatsCard
                  stats={stats || mockUserStats}
                  isLoading={isStatsLoading}
                  error={statsError || undefined}
                  onRetry={fetchStats}
                />
              )}
              <DailyTip />
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="min-h-[350px] bg-white dark:bg-gray-800 p-6 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700">
                <PriceChart height={280} />
              </div>
              {isWalletConnected && (
                <RecentActivity
                  items={activities}
                  isLoading={isActivitiesLoading}
                  error={activitiesError}
                  onRetry={fetchActivities}
                />
              )}
              <PredictionHistory userId={publicKey} />
            </div>
          </div>
        )}
      </div>

      <BetModal
        isOpen={isBetModalOpen}
        onClose={() => {
          setIsBetModalOpen(false);
          setPendingPrediction(null);
        }}
        predictionData={pendingPrediction}
        onSuccess={(txHash: string) => {
          console.log("Prediction confirmed on-chain. TxHash:", txHash);
          void fetchStats();
          void fetchActivities();
        }}
      />
      <EndRoundModal
        isOpen={Boolean(resolvedRound)}
        onClose={dismissResolvedRound}
        result={endRoundResult}
      />
    </div>
  );
};

export default Dashboard;
