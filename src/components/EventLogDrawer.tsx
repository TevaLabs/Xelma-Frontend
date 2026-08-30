import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, ExternalLink, Radio, RefreshCw, X } from 'lucide-react';
import {
  fetchPredictionEvents,
  filterByRound,
  type PredictionEvent,
  type PredictionEventKind,
} from '../lib/prediction-events';
import { txUrl } from '../lib/explorer';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { MODAL_OVERLAY, PANEL_SLIDE_RIGHT } from '../utils/motion';

interface EventLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type LoadState = 'idle' | 'loading' | 'loaded' | 'error';

const KIND_STYLES: Record<PredictionEventKind, string> = {
  settlement: 'border-green-500/40 bg-green-500/10 text-green-400',
  prediction: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
  round: 'border-[#2C4BFD]/40 bg-[#2C4BFD]/10 text-[#BEC7FE]',
  other: 'border-white/10 bg-white/5 text-gray-400',
};

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString();
}

function formatPayload(payload: unknown): string | null {
  if (payload === null || payload === undefined) return null;
  try {
    return JSON.stringify(
      payload,
      (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
      0,
    );
  } catch {
    return null;
  }
}

function EventRow({ event }: { event: PredictionEvent }) {
  const payload = formatPayload(event.payload);

  return (
    <li className="rounded-xl border border-gray-800 bg-gray-950/70 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-mono text-sm font-bold text-white">{event.name}</span>
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${KIND_STYLES[event.kind]}`}
            >
              {event.kind}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {event.roundId ? `Round ${event.roundId} · ` : ''}
            Ledger {event.ledger.toLocaleString()} · {formatTimestamp(event.timestamp)}
          </p>
        </div>

        {event.txHash && (
          <a
            href={txUrl(event.txHash)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-700 px-2 py-1 text-[11px] font-semibold text-gray-300 transition-colors hover:border-gray-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
            aria-label={`View transaction ${event.txHash.slice(0, 8)} on StellarExpert`}
          >
            Explorer
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        )}
      </div>

      {payload && (
        <pre className="mt-2 max-h-20 overflow-auto rounded-lg bg-black/40 p-2 text-[11px]">
          <code className="break-all whitespace-pre-wrap font-mono text-gray-400">{payload}</code>
        </pre>
      )}
    </li>
  );
}

/**
 * Slide-over drawer listing recent on-chain prediction and settlement events,
 * with a round-id filter and explorer links for events that carry a tx hash.
 */
export default function EventLogDrawer({ isOpen, onClose }: EventLogDrawerProps) {
  const [events, setEvents] = useState<PredictionEvent[]>([]);
  const [state, setState] = useState<LoadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [roundFilter, setRoundFilter] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(drawerRef, {
    active: isOpen,
    onEscape: onClose,
    initialFocusRef: closeButtonRef,
  });

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const run = async () => {
      setState('loading');
      setError(null);
      try {
        const result = await fetchPredictionEvents();
        if (cancelled) return;
        setEvents(result);
        setState('loaded');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Could not load events.');
        setState('error');
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [isOpen, reloadKey]);

  const visible = useMemo(() => filterByRound(events, roundFilter), [events, roundFilter]);

  if (!isOpen) return null;

  const isFiltered = roundFilter.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[70] flex">
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${MODAL_OVERLAY}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-log-title"
        className={`relative ml-auto flex h-full w-full max-w-md flex-col border-l border-[#BEC7FE]/10 bg-[#0A0F1A] shadow-2xl ${PANEL_SLIDE_RIGHT}`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/5 p-5">
          <div>
            <h2 id="event-log-title" className="flex items-center gap-2 text-lg font-bold text-white">
              <Radio className="h-4 w-4 text-[#22D3EE]" aria-hidden />
              On-chain events
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Recent prediction and settlement events from the Xelma contract.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
            aria-label="Close event log"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex items-end gap-2 border-b border-white/5 p-4">
          <div className="flex-1">
            <label htmlFor="event-round-filter" className="mb-1 block text-xs font-semibold text-gray-400">
              Filter by round id
            </label>
            <input
              id="event-round-filter"
              type="text"
              inputMode="numeric"
              value={roundFilter}
              onChange={(e) => setRoundFilter(e.target.value)}
              placeholder="All rounds"
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none transition focus:border-[#2C4BFD]"
            />
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={state === 'loading'}
            className="rounded-lg border border-gray-700 p-2 text-gray-400 transition-colors hover:text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD]"
            aria-label="Refresh events"
          >
            <RefreshCw className={`h-4 w-4 ${state === 'loading' ? 'animate-spin' : ''}`} aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {state === 'loading' && (
            <div className="space-y-2" aria-busy="true" aria-label="Loading on-chain events">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          )}

          {state === 'error' && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4" role="alert">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-400">Could not load events</p>
                  <p className="mt-1 break-words text-xs text-red-300/80">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={refresh}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 px-3 py-1.5 text-xs font-bold text-red-100 transition-colors hover:bg-red-400/10"
              >
                <RefreshCw className="h-3 w-3" aria-hidden />
                Retry
              </button>
            </div>
          )}

          {state === 'loaded' && visible.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
              <p className="text-sm font-semibold text-gray-300">
                {isFiltered ? 'No events for that round' : 'No events yet'}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {isFiltered
                  ? 'Clear the filter to see all recent events.'
                  : 'Settlement events will appear here once rounds resolve on-chain.'}
              </p>
              {isFiltered && (
                <button
                  type="button"
                  onClick={() => setRoundFilter('')}
                  className="mt-3 rounded-lg border border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:text-white"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}

          {state === 'loaded' && visible.length > 0 && (
            <ul className="space-y-2">
              {visible.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ul>
          )}
        </div>

        {state === 'loaded' && events.length > 0 && (
          <p className="border-t border-white/5 px-4 py-3 text-xs text-gray-500">
            Showing {visible.length} of {events.length} recent events
          </p>
        )}
      </div>
    </div>
  );
}
