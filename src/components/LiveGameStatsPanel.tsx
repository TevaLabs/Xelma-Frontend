// LiveGameStatsPanel — data wiring kept; UI stubbed for Stellar Wave rebuild issue.
import { useEffect, useState } from 'react';
import { socketService } from '../lib/socket';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useRoundStore } from '../store/useRoundStore';
import ContributorTaskPlaceholder from './ContributorTaskPlaceholder';

type LiveStatsSnapshot = {
  activePlayers?: number;
  recentPredictions?: number;
  lastUpdated?: Date;
};

type LiveStatsPayload = Record<string, unknown>;

function toFiniteNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed)
    ? Math.max(0, Math.floor(parsed))
    : undefined;
}

function normalizeStatsPayload(payload: unknown): LiveStatsSnapshot {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  const data = payload as LiveStatsPayload;
  const nested =
    data.stats && typeof data.stats === 'object'
      ? (data.stats as LiveStatsPayload)
      : data.data && typeof data.data === 'object'
        ? (data.data as LiveStatsPayload)
        : data;

  return {
    activePlayers:
      toFiniteNumber(nested.activePlayers) ??
      toFiniteNumber(nested.playersOnline) ??
      toFiniteNumber(nested.playerCount) ??
      toFiniteNumber(nested.onlinePlayers),
    recentPredictions:
      toFiniteNumber(nested.recentPredictions) ??
      toFiniteNumber(nested.recentPredictionsCount) ??
      toFiniteNumber(nested.predictionsCount) ??
      toFiniteNumber(nested.predictionCount) ??
      toFiniteNumber(nested.totalPredictions),
    lastUpdated: new Date(),
  };
}

/**
 * STUBBED for Stellar Wave hackathon — rebuild live telemetry panel UI.
 * Socket + round store wiring remains. Restore metrics grid + connection badge.
 */
export default function LiveGameStatsPanel() {
  const activeRound = useRoundStore((state) => state.activeRound);
  const isRoundActive = useRoundStore((state) => state.isRoundActive);
  const isLoading = useRoundStore((state) => state.isLoading);
  const sseConnection = useRoundStore((state) => state.sseConnection);
  const { isConnected: isSocketConnected } = useConnectionStatus();
  const [liveStats, setLiveStats] = useState<LiveStatsSnapshot>({});

  useEffect(() => {
    if (!socketService.isConnected()) {
      socketService.connect();
    }
    const unsubscribeStats = socketService.onLiveGameStats((payload) => {
      const snapshot = normalizeStatsPayload(payload);
      setLiveStats((current) => ({ ...current, ...snapshot }));
    });
    const unsubscribePrediction = socketService.onPredictionCreated(() => {
      setLiveStats((current) => ({
        ...current,
        recentPredictions: (current.recentPredictions ?? 0) + 1,
        lastUpdated: new Date(),
      }));
    });
    return () => {
      unsubscribeStats();
      unsubscribePrediction();
    };
  }, []);

  return (
    <section
      aria-label="Live game stats"
      data-loading={String(isLoading)}
      data-round-active={String(isRoundActive)}
      data-socket-connected={String(isSocketConnected)}
      data-sse-status={sseConnection?.status ?? 'disconnected'}
      data-active-round-id={activeRound?.id ?? ''}
      data-live-players={liveStats.activePlayers ?? ''}
      data-live-predictions={liveStats.recentPredictions ?? ''}
    >
      <ContributorTaskPlaceholder
        title="Rebuild Live Game Stats Panel"
        issueHint="Restore Platform Pulse UI: active players, recent predictions, round status, and realtime connection badge. Use liveStats + round store data attributes above."
      />
    </section>
  );
}
