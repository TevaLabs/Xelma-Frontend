import { useRoundStore } from '../store/useRoundStore';

type SseStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

const STATUS_LABEL: Record<SseStatus, string> = {
  connected: 'Live',
  connecting: 'Connecting…',
  reconnecting: 'Reconnecting…',
  disconnected: 'Updates paused',
};

const STATUS_DOT: Record<SseStatus, string> = {
  connected: 'bg-emerald-500',
  connecting: 'bg-sky-500 animate-pulse',
  reconnecting: 'bg-amber-500 animate-pulse',
  disconnected: 'bg-red-500',
};

const CHIP_CLASS =
  'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-gray-300';

const RETRY_CLASS =
  'ml-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold text-white underline decoration-white/40 underline-offset-2 hover:decoration-white';

/**
 * Compact round-SSE status chip for the Dashboard header.
 *
 * Reads the round event stream state (`sseConnection`) from the round store —
 * the EventSource to /api/rounds/events — so SSE health is always visible,
 * including while the stream is healthy. Deliberately small and inline:
 * unlike OfflineBanner (a fixed full-width alert for the socket connection)
 * this is a chip in the page flow that reports the round stream only.
 */
export function RoundSseStatusChip({ className = '' }: { className?: string }) {
  const sseConnection = useRoundStore((state) => state.sseConnection);
  const reconnectSSE = useRoundStore((state) => state.reconnectSSE);

  // The store always sets sseConnection; tolerate an unset value (e.g. a
  // partial store mock in tests) by rendering nothing instead of a wrong state.
  if (!sseConnection) return null;

  const { status, error, reconnectAttempts } = sseConnection;
  const label =
    status === 'reconnecting'
      ? `Reconnecting… (attempt ${reconnectAttempts})`
      : STATUS_LABEL[status];
  const title = error ? `Round updates: ${status} — ${error}` : `Round updates: ${status}`;

  return (
    <span
      role="status"
      data-testid="round-sse-status-chip"
      title={title}
      className={`${CHIP_CLASS} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`}
      />
      <span>{label}</span>
      {status === 'disconnected' && (
        <button
          type="button"
          onClick={reconnectSSE}
          className={RETRY_CLASS}
        >
          Retry
        </button>
      )}
    </span>
  );
}
