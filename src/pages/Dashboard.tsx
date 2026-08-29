import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PriceChart from "../components/PriceChart";
import PredictionCard from "../components/PredictionCard";
import PredictionHistory from "../components/PredictionHistory";
import StatsCard from "../components/StatsCard";
import RecentActivity from "../components/RecentActivity";
import RoundCard from "../components/RoundCard";
import AssetTabs from "../components/AssetTabs";
import { ASSETS } from "../constants/assets";
import type { Asset } from "../types/asset";

import type { PredictionData } from "../components/PredictionControls";
import BetModal from "../components/BetModal";
import EndRoundModal from "../components/EndRoundModal";
import RoundTimeline from "../components/RoundTimeline";
import EventLogDrawer from "../components/EventLogDrawer";
import { Radio } from "lucide-react";
import { ChatSidebar } from "../components/ChatSidebar";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import { useRoundStore } from "../store/useRoundStore";
import type { Round, UserPrediction, UserStats } from "../lib/api-client";
import { educationApi, statsApi, predictionsApi } from "../lib/api-client";
import { useWalletStore, selectIsWalletConnected } from "../store/useWalletStore";
import { useSettingsStore, selectSoundEnabled } from "../store/useSettingsStore";
import {
  bindSoundPreference,
  clearSoundPreferenceBinding,
  playRoundResolutionCue,
} from "../utils/audioController";
import { TipCard } from "../components/education/TipCard";
import type { Tip } from "../types/education";
import EmptyState from '../components/EmptyState';
import { NoRoundsIllustration } from '../components/icons/StellarIllustrations';
import DashboardSkeleton from '../components/DashboardSkeleton';
import FriendbotFundCard from '../components/FriendbotFundCard';
import NetworkMismatchCard from '../components/NetworkMismatchCard';
import ProfileSummaryCard from '../components/ProfileSummaryCard';
import { useReducedMotion } from '../hooks/useReducedMotion';

import { inspectSorobanState, type SorobanInspectorSnapshot } from "../lib/xelma-contract";
import { mockUserStats, mockRounds } from "../data/mockData";

import type { RecentActivityItem } from "../types";
import { toast } from "sonner";
import { Share2 } from "lucide-react";

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
        role="status"
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
  const { t } = useTranslation();
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
  const balance = useWalletStore((s) => s.balance);
  const { isConnected: isSocketConnected } = useConnectionStatus();
const activeRoundId = useRoundStore((state) => state.activeRound?.id ?? null);
  const [isBetModalOpen, setIsBetModalOpen] = useState(false);
  const [pendingPrediction, setPendingPrediction] = useState<PredictionData | null>(null);
  const [optimisticPrediction, setOptimisticPrediction] = useState<UserPrediction | null>(null);
  // Community chat is opt-in so the default terminal stays uncluttered.
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isEventLogOpen, setIsEventLogOpen] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  // Latest live price from the chart, held in a ref to avoid re-renders on every tick.
  const currentPriceRef = useRef<number | null>(null);
  // Price that was live when the user's prediction succeeded; marks the chart.
  const [entryPrice, setEntryPrice] = useState<number | null>(null);

  const handlePriceUpdate = useCallback((price: number) => {
    currentPriceRef.current = price;
  }, []);

  // Clear the entry marker whenever the active round changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setEntryPrice(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeRoundId]);

  const [stats, setStats] = useState<UserStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [inspector, setInspector] = useState<SorobanInspectorSnapshot | null>(null);
  const [isInspectorLoading, setIsInspectorLoading] = useState(false);
  const soundEnabled = useSettingsStore(selectSoundEnabled);

  // Asset tab state from URL query param
  const [searchParams] = useSearchParams();
  const selectedAsset = (searchParams.get("asset") as Asset) || "XLM";
  const normalizedAsset = ASSETS.includes(selectedAsset) ? selectedAsset : "XLM";

  // Round deep-link: read ?round=<id>, find matching mock round, highlight it
  const deepLinkedRoundId = useMemo(() => {
    const raw = searchParams.get("round");
    if (raw === null) return null;
    const id = Number(raw);
    if (!Number.isFinite(id) || id < 1) return null;
    return id;
  }, [searchParams]);

  // Show toast for unknown round ids (non-numeric or out of range)
  useEffect(() => {
    const raw = searchParams.get("round");
    if (raw === null) return;
    const id = Number(raw);
    if (Number.isFinite(id) && id >= 1 && mockRounds.some((r) => r.id === id)) return;
    // Raw string exists but doesn't match any round
    toast.error(`Round "${raw}" not found — showing all rounds`, {
      id: "round-deeplink-unknown",
    });
  }, [searchParams]);

  // Filter mock rounds by the selected asset
  const filteredRounds = useMemo(
    () => mockRounds.filter((r) => r.asset === normalizedAsset),
    [normalizedAsset],
  );

  // Scroll the deep-linked RoundCard into view once it's actually rendered
  // (it may be filtered out by the selected asset tab, so we only scroll
  // when it resolves to a visible card).
  const roundCardRefs = useRef(new Map<number, HTMLElement>());
  const { reduced: prefersReducedMotion } = useReducedMotion();

  useEffect(() => {
    if (deepLinkedRoundId === null) return;
    if (!filteredRounds.some((r) => r.id === deepLinkedRoundId)) return;

    const card = roundCardRefs.current.get(deepLinkedRoundId);
    if (!card) return;

    card.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  }, [deepLinkedRoundId, filteredRounds, prefersReducedMotion]);

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
    const timer = setTimeout(() => {
      void fetchStats();
      void fetchActivities();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchStats, fetchActivities]);

  const refreshInspector = useCallback(async () => {
    if (!isWalletConnected || !publicKey) {
      setInspector(null);
      return;
    }
    setIsInspectorLoading(true);
    try {
      setInspector(await inspectSorobanState(publicKey));
    } catch (err) {
      setInspector({
        position: null,
        round: null,
        source: 'mock',
        error: err instanceof Error ? err.message : 'Unable to inspect Soroban state',
        inspectedAt: new Date().toISOString(),
      });
    } finally {
      setIsInspectorLoading(false);
    }
  }, [isWalletConnected, publicKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refreshInspector();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshInspector]);

  // Bind the audio controller to the settings store so round-resolution cues
  // respect the same preference as the Settings "Test sound" tone, even
  // though this page never mounts Settings.tsx.
  useEffect(() => {
    bindSoundPreference(() => useSettingsStore.getState().soundEnabled);
    return () => clearSoundPreferenceBinding();
  }, []);

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

    const asset = typeof round.asset === 'string'
      ? round.asset
      : 'BTC';

    const prediction = round.prediction as Record<string, unknown> | undefined;
    const userPrediction = round.userPrediction as Record<string, unknown> | undefined;

    const direction = typeof round.direction === 'string'
      ? round.direction
      : typeof prediction?.direction === 'string'
      ? prediction.direction
      : typeof userPrediction?.direction === 'string'
      ? userPrediction.direction
      : 'UP';

    return { isWin, amount, tip, asset, direction };
  };

  const endRoundResult = getEndRoundResult(resolvedRound);

  // Play the round-resolution cue exactly once per resolved round.
  useEffect(() => {
    if (!resolvedRound) return;
    if (!soundEnabled) return;
    playRoundResolutionCue(endRoundResult.isWin);
  }, [resolvedRound, endRoundResult.isWin, soundEnabled]);

  return (
    <div className="xelma-grid-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      {/* Opt-in community chat (ported from the legacy /play view). Self-positions
          as a fixed slide-over, so mounting it does not shift the terminal layout. */}
      {isChatOpen && <ChatSidebar />}

      <div className="mx-auto max-w-7xl">
        {isLoading && <DashboardSkeleton />}

        {!isLoading && (
          <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
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
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEventLogOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-400 transition-colors hover:border-[#2C4BFD]/40 hover:text-white"
              >
                <Radio className="h-4 w-4" aria-hidden />
                On-chain events
              </button>
            </div>
            <RoundTimeline />
          </div>
        )}

        {/* Asset filter tabs — always visible when content is loaded */}
        {!isLoading && (
          <div className="mb-6" role="tabpanel" id={`asset-panel-${normalizedAsset}`} aria-labelledby={`asset-tab-${normalizedAsset}`}>
            <AssetTabs className="mb-6" />

            {/* Rounds grid filtered by selected asset */}
            {filteredRounds.length > 0 ? (
              <>
                {/* Share button for deep-linking */}
                <div className="mb-4 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={async () => {
                      const url = new URL(window.location.href);
                      try {
                        await navigator.clipboard.writeText(url.toString());
                        toast.success(t('dashboard.share.copied'), {
                          id: "share-round-url",
                        });
                      } catch {
                        toast.error(t('dashboard.share.copyError'), {
                          id: "share-round-url",
                        });
                      }
                    }}
                    data-testid="share-rounds-btn"
                    className="btn-ghost inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold"
                    aria-label={t('dashboard.share.copyAriaLabel')}
                  >
                    <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {t('dashboard.share.button')}
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRounds.map((round) => (
                  <RoundCard
                    key={round.id}
                    ref={(el) => {
                      if (el) {
                        roundCardRefs.current.set(round.id, el);
                      } else {
                        roundCardRefs.current.delete(round.id);
                      }
                    }}
                    round={round}
                    isHighlighted={deepLinkedRoundId === round.id}
                    onSubmitPrediction={() => {
                      setPendingPrediction({
                        direction: "UP",
                        stake: "0",
                        isLegend: false,
                      });
                      setIsBetModalOpen(true);
                    }}
                  />
                ))}
              </div>
              </>
            ) : (
              <EmptyState
                title={t('dashboard.emptyState.noAssetRounds.title', { asset: normalizedAsset })}
                description={t('dashboard.emptyState.noAssetRounds.description', {
                  assetName: t(`dashboard.assetNames.${normalizedAsset}`),
                })}
                action={
                  <button
                    type="button"
                    className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
                    onClick={() => {
                      void useRoundStore.getState().fetchActiveRound();
                    }}
                  >
                    {t('dashboard.refresh')}
                  </button>
                }
              />
            )}
          </div>
        )}

        {!isWalletConnected && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-[#2C4BFD]/30 bg-[#2C4BFD]/10 p-4 text-sm text-[#BEC7FE] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4">
            <p className="leading-relaxed" data-testid="dashboard-wallet-prompt">
              {t('dashboard.walletPrompt.message')}
            </p>
            <Link
              to="/connect"
              data-testid="dashboard-connect-now"
              className="btn-primary no-underline inline-flex min-h-[44px] w-full items-center justify-center rounded-lg px-5 py-2 text-sm font-bold sm:w-auto"
            >
              {t('dashboard.walletPrompt.connectNow')}
            </Link>
          </div>
        )}

        {!isLoading && isWalletConnected && <NetworkMismatchCard className="mb-6" />}

        {!isLoading && isWalletConnected && <FriendbotFundCard className="mb-6" />}

        {!isLoading && !isRoundActive && (
          <EmptyState
            title={t('dashboard.emptyState.noActiveRounds.title')}
            description={t('dashboard.emptyState.noActiveRounds.description')}
            icon={<NoRoundsIllustration className="mb-4" />}
            action={
              <button
                type="button"
                className="btn-primary rounded-lg px-4 py-2 text-sm font-semibold"
                onClick={() => {
                  void useRoundStore.getState().fetchActiveRound();
                }}
              >
                {t('dashboard.refresh')}
              </button>
            }
          />
        )}

        {!isLoading && isRoundActive && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="dashboard__center lg:col-span-1 flex flex-col gap-6">
              {isWalletConnected && <ProfileSummaryCard />}
              <PredictionCard
                isWalletConnected={isWalletConnected}
                isRoundActive={isRoundActive}
                isConnecting={isWalletConnecting}
                isSubmittingPrediction={isBetModalOpen}
                onPrediction={handlePrediction}
                walletBalance={balance}
              />
              {isWalletConnected && (
                <section className="rounded-2xl border border-cyan-500/20 bg-black/40 p-5 font-mono text-xs text-cyan-100 shadow-inner shadow-cyan-950/30" aria-labelledby="soroban-inspector-title">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h2 id="soroban-inspector-title" className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">{t('dashboard.sorobanInspector.title')}</h2>
                      <p className="mt-1 text-[11px] text-cyan-100/70">{t('dashboard.sorobanInspector.description')}</p>
                    </div>
                    <button type="button" onClick={() => void refreshInspector()} disabled={isInspectorLoading} className="rounded border border-cyan-400/30 px-3 py-1 text-[11px] font-semibold text-cyan-200 disabled:opacity-60">
                      {isInspectorLoading ? t('dashboard.sorobanInspector.loading') : t('dashboard.refresh')}
                    </button>
                  </div>
                  {inspector?.error && (
                    <p className="mb-3 rounded border border-amber-400/30 bg-amber-500/10 p-2 text-amber-200" role="status">
                      {t('dashboard.sorobanInspector.rpcFallback', { error: inspector.error })}
                    </p>
                  )}
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-white/10 bg-[#020617] p-3" aria-live="polite">
                    {JSON.stringify(inspector ?? { status: isInspectorLoading ? 'loading' : 'not connected' }, null, 2)}
                  </pre>
                </section>
              )}

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
<div className="min-h-[350px] glass-card rounded-2xl p-5">
                <PriceChart height={280} asset={normalizedAsset} entryPrice={entryPrice} onPriceUpdate={handlePriceUpdate} />
              </div>
              {isWalletConnected && (
                <RecentActivity
                  items={
                    optimisticPrediction
                      ? [
                          {
                            ...mapPredictionToActivityItem(optimisticPrediction),
                            result: optimisticPrediction.status === 'FAILED' ? 'Failed' : 'Pending',
                          } as RecentActivityItem,
                          ...activities.filter((a) => a.id !== String(optimisticPrediction.id)),
                        ]
                      : activities
                  }
                  isLoading={isActivitiesLoading}
                  error={activitiesError}
                  onRetry={fetchActivities}
                />
              )}
              <PredictionHistory userId={publicKey} optimisticPrediction={optimisticPrediction} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky predict action bar — visible only on small screens */}
      {!isLoading && isRoundActive && (
        <div
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0F1A]/95 backdrop-blur-md border-t border-[#2C4BFD]/20 px-4 py-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          data-testid="mobile-predict-bar"
        >
          <button
            type="button"
            onClick={() => {
              setPendingPrediction({
                direction: 'UP',
                stake: '',
                isLegend: false,
              });
              setIsBetModalOpen(true);
            }}
            className="w-full py-3.5 bg-[#2C4BFD] hover:bg-[#2C4BFD]/90 rounded-xl font-bold text-sm transition active:scale-[0.98] min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
          >
            Make Prediction
          </button>
        </div>
      )}

      <BetModal
        isOpen={isBetModalOpen}
        onClose={() => {
          setIsBetModalOpen(false);
          setPendingPrediction(null);
          if (optimisticPrediction?.status === 'FAILED') {
            setOptimisticPrediction(null);
          }
        }}
        predictionData={pendingPrediction}
        onPending={(prediction) => setOptimisticPrediction(prediction)}
        onPredictionError={() => setOptimisticPrediction(prev => prev ? { ...prev, status: 'FAILED' } : null)}
        onSuccess={(txHash: string) => {
          console.log("Prediction confirmed on-chain. TxHash:", txHash);
setOptimisticPrediction(null);
          if (currentPriceRef.current !== null) {
            setEntryPrice(currentPriceRef.current);
          }
          void fetchStats();
          void fetchActivities();
        }}
      />
      <EndRoundModal
        isOpen={Boolean(resolvedRound)}
        onClose={dismissResolvedRound}
        result={endRoundResult}
      />
      <EventLogDrawer isOpen={isEventLogOpen} onClose={() => setIsEventLogOpen(false)} />
    </div>
  );
};

export default Dashboard;
