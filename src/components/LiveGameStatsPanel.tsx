// LiveGameStatsPanel — Platform Pulse telemetry over the round store + socket feed.
import { useEffect, useState } from 'react';
import { Activity, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { socketService } from '../lib/socket';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useRoundStore } from '../store/useRoundStore';

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

/** Feed health, collapsing the socket and SSE streams into one verdict. */
type FeedHealth = 'live' | 'syncing' | 'offline';

function resolveFeedHealth(
  isSocketConnected: boolean,
  sseStatus: string | undefined,
): FeedHealth {
  if (isSocketConnected || sseStatus === 'connected') return 'live';
  if (sseStatus === 'connecting' || sseStatus === 'reconnecting') return 'syncing';
  return 'offline';
}

const FEED_LABELS: Record<FeedHealth, string> = {
  live: 'Live',
  syncing: 'Syncing',
  offline: 'Offline',
};

const FEED_STYLES: Record<FeedHealth, string> = {
  live: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  syncing: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  offline: 'border-gray-600/60 bg-white/5 text-gray-400',
};

const DOT_STYLES: Record<FeedHealth, string> = {
  live: 'bg-emerald-400 animate-pulse',
  syncing: 'bg-amber-400 animate-pulse',
  offline: 'bg-gray-500',
};

const numberFormat = new Intl.NumberFormat();

function formatMetric(value: number | undefined): string {
  return typeof value === 'number' ? numberFormat.format(value) : '—';
}

function formatClock(date: Date | undefined): string {
  if (!date) return 'awaiting first packet';
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function Metric({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/30 p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
        <span className="text-cyan-400/80" aria-hidden>
          {icon}
        </span>
        {label}
      </div>
      <p className="mt-2 font-mono text-2xl font-bold leading-none text-white">{value}</p>
      <p className="mt-1.5 truncate text-[11px] text-gray-500">{hint}</p>
    </div>
  );
}

/**
 * Platform Pulse — active players, recent predictions, and round state, fed by
 * the `live_game_stats` socket channel with the round store as the fallback
 * source of truth for round status.
 */
export default function LiveGameStatsPanel() {
  const activeRound = useRoundStore((state) => state.activeRound);
  const isRoundActive = useRoundStore((state) => state.isRoundActive);
  const isLoading = useRoundStore((state) => state.isLoading);
  const sseConnection = useRoundStore((state) => state.sseConnection);
  const reconnectSSE = useRoundStore((state) => state.reconnectSSE);
  const { isConnected: isSocketConnected, reconnect: reconnectSocket } = useConnectionStatus();
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

  const sseStatus = sseConnection?.status;
  const feedHealth = resolveFeedHealth(isSocketConnected, sseStatus);

  const roundStatus = isLoading
    ? 'Syncing'
    : isRoundActive
      ? String(activeRound?.status ?? 'Open')
      : 'Idle';
  const roundHint = activeRound?.id ? `Round #${activeRound.id}` : 'No active round';

  const handleReconnect = () => {
    reconnectSocket();
    reconnectSSE();
  };

  return (
    <section
      aria-label="Live game stats"
      className="rounded-2xl border border-cyan-500/20 bg-black/40 p-5 shadow-inner shadow-cyan-950/30"
      data-loading={String(isLoading)}
      data-round-active={String(isRoundActive)}
      data-socket-connected={String(isSocketConnected)}
      data-sse-status={sseConnection?.status ?? 'disconnected'}
      data-active-round-id={activeRound?.id ?? ''}
      data-live-players={liveStats.activePlayers ?? ''}
      data-live-predictions={liveStats.recentPredictions ?? ''}
      data-feed-health={feedHealth}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            Platform Pulse
          </h2>
          <p className="mt-1 text-[11px] text-gray-500">
            Realtime telemetry from the prediction feed.
          </p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${FEED_STYLES[feedHealth]}`}
          role="status"
          aria-label={`Live feed ${FEED_LABELS[feedHealth]}`}
          data-testid="live-stats-connection-badge"
        >
          <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[feedHealth]}`} aria-hidden />
          {FEED_LABELS[feedHealth]}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric
          label="Active players"
          value={formatMetric(liveStats.activePlayers)}
          hint={liveStats.activePlayers === undefined ? 'Awaiting feed' : 'Connected right now'}
          icon={<Users className="h-3 w-3" />}
        />
        <Metric
          label="Recent predictions"
          value={formatMetric(liveStats.recentPredictions)}
          hint={
            liveStats.recentPredictions === undefined ? 'Awaiting feed' : 'Submitted this session'
          }
          icon={<TrendingUp className="h-3 w-3" />}
        />
        <Metric
          label="Round status"
          value={roundStatus}
          hint={roundHint}
          icon={<Activity className="h-3 w-3" />}
        />
      </div>

      {feedHealth !== 'live' && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="text-[11px] text-amber-100/80">
            {feedHealth === 'syncing'
              ? 'Reconnecting to the live feed — numbers may lag behind.'
              : 'Live feed offline. Showing the last values received.'}
          </p>
          <button
            type="button"
            onClick={handleReconnect}
            className="inline-flex items-center gap-1.5 rounded border border-amber-400/30 px-2.5 py-1 text-[11px] font-bold text-amber-200 transition-colors hover:bg-amber-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            <RefreshCw className="h-3 w-3" aria-hidden />
            Reconnect
          </button>
        </div>
      )}

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3 font-mono text-[10px] uppercase tracking-wide text-gray-600">
        <span>socket: {isSocketConnected ? 'connected' : 'down'}</span>
        <span>sse: {sseStatus ?? 'disconnected'}</span>
        <span aria-live="polite">updated {formatClock(liveStats.lastUpdated)}</span>
      </footer>
    </section>
  );
}
