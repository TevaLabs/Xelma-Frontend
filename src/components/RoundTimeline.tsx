import { useEffect, useRef, useState } from 'react';
import type { Round } from '../lib/api-client';
import { useRoundStore } from '../store/useRoundStore';

interface TimelineState {
  label: string;
  key: 'upcoming' | 'live' | 'resolving' | 'finished';
}

const TIMELINE_STATES: TimelineState[] = [
  { label: 'Next Round', key: 'upcoming' },
  { label: 'Live', key: 'live' },
  { label: 'Resolving', key: 'resolving' },
  { label: 'Finished', key: 'finished' },
];

type RoundTimelineState =
  | 'upcoming'
  | 'live'
  | 'resolving'
  | 'finished'
  | 'loading'
  | 'disconnected';

function getCurrentRoundState(
  activeRound: Round | null,
  isRoundActive: boolean,
  sseStatus: string
): RoundTimelineState {
  // Connection state takes priority so users immediately know
  // whether live round updates are available.
  if (sseStatus === 'connecting' || sseStatus === 'reconnecting') {
    return 'loading';
  }

  if (sseStatus === 'disconnected') {
    return 'disconnected';
  }

  if (!activeRound) {
    return 'upcoming';
  }

  if (activeRound.status) {
    const status = activeRound.status.toLowerCase();

    if (status === 'live' || status === 'active') {
      return 'live';
    }

    if (status === 'resolving' || status === 'closing') {
      return 'resolving';
    }

    if (status === 'resolved' || status === 'finished') {
      return 'finished';
    }
  }

  if (isRoundActive) {
    return 'live';
  }

  if (activeRound.resolvedAt) {
    return 'finished';
  }

  if (activeRound.endsAt) {
    const now = Date.now();
    const endsAt = new Date(activeRound.endsAt).getTime();

    if (now >= endsAt) {
      return 'resolving';
    }
  }

  return 'live';
}

function getStateLabel(state: RoundTimelineState): string {
  return (
    TIMELINE_STATES.find((timelineState) => timelineState.key === state)
      ?.label ??
    (state === 'disconnected'
      ? 'Disconnected'
      : state === 'loading'
        ? 'Connecting'
        : state)
  );
}

const RoundTimeline: React.FC = () => {
  const activeRound = useRoundStore((state) => state.activeRound);
  const isRoundActive = useRoundStore((state) => state.isRoundActive);
  const sseConnection = useRoundStore((state) => state.sseConnection);

  const currentState = getCurrentRoundState(
    activeRound,
    isRoundActive,
    sseConnection?.status || 'disconnected'
  );

  // This only tracks the prior value for the live-region announcement; it does
  // not affect rendering, so keeping it in a ref avoids a cascading render.
  const previousStateRef = useRef(currentState);
  const [stateAnnouncement, setStateAnnouncement] = useState('');

  /*
   * Keep the existing screen-reader announcement behavior.
   *
   * A state transition is announced once, rather than on every render.
   */
  useEffect(() => {
    if (previousStateRef.current !== currentState) {
      const label =
        TIMELINE_STATES.find((s) => s.key === currentState)?.label ||
        (currentState === 'disconnected'
          ? 'Disconnected'
          : currentState === 'loading'
          ? 'Connecting'
          : currentState);
      previousStateRef.current = currentState;
      const timer = setTimeout(() => {
        setStateAnnouncement(`Round is now ${label}`);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentState]);

  const currentIndex = TIMELINE_STATES.findIndex((state) => state.key === currentState);
  const isLoading = currentState === 'loading';
  const isDisconnected = currentState === 'disconnected';
  const currentStateLabel =
    currentState === 'upcoming'
      ? 'Upcoming'
      : currentState === 'disconnected'
        ? 'Unknown'
        : currentState === 'loading'
          ? 'Connecting'
          : TIMELINE_STATES.find((state) => state.key === currentState)?.label ?? currentState;

  return (
    <section
      className="w-full"
      aria-labelledby="round-progress-heading"
      data-current-state={currentState}
      data-round-id={activeRound?.id ?? ''}
      data-round-active={String(isRoundActive)}
    >
      {/* Screen reader announcement */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {stateAnnouncement}
      </div>
      <section className="glass-card rounded-xl p-4 lg:p-6">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white lg:text-xl">
          <span className="status-dot status-dot-live" aria-hidden="true" />
          Round Progress
        </h2>

        {isLoading && (
          <p className="mb-4 rounded-lg border border-cyan-400/25 bg-cyan-400/10 p-3 text-sm text-cyan-100">
            Connecting to live updates...
          </p>
        )}
        {isDisconnected && (
          <p className="mb-4 rounded-lg border border-amber-400/25 bg-amber-400/10 p-3 text-sm text-amber-100">
            Connection lost - Timeline may not update in real-time
          </p>
        )}

        <div className="flex items-start justify-between gap-2">
          {TIMELINE_STATES.map((state, index) => {
            const completed = currentIndex > index;
            const active = currentIndex === index;
            return (
              <div className="flex min-w-0 flex-1 flex-col items-center" key={state.key}>
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${
                    active
                      ? 'border-cyan-300 bg-cyan-300 text-slate-950'
                      : completed
                        ? 'border-cyan-500 bg-cyan-500 text-slate-950'
                        : 'border-slate-600 bg-slate-800 text-slate-400'
                  }`}
                >
                  {completed ? '✓' : index + 1}
                </span>
                <span className={`mt-2 text-center text-xs font-semibold ${active ? 'text-cyan-300' : 'text-slate-400'}`}>
                  {state.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t border-slate-700 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Current State:</span>
            <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-semibold text-white">
              {currentStateLabel}
            </span>
          </div>
          {activeRound && (
            <div className="mt-3 space-y-1 text-xs text-slate-400">
              {activeRound.startsAt && <p>Starts: {new Date(activeRound.startsAt).toLocaleTimeString()}</p>}
              {activeRound.endsAt && <p>Ends: {new Date(activeRound.endsAt).toLocaleTimeString()}</p>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RoundTimeline;