import { useEffect, useState } from 'react';
import type { Round } from '../lib/api-client';
import { useRoundStore } from '../store/useRoundStore';
import PredictionPulse from './PredictionPulse';

interface TimelineState {
  label: string;
  key: 'upcoming' | 'live' | 'resolving' | 'finished';
}

const TIMELINE_STATES: TimelineState[] = [
  { label: 'Upcoming', key: 'upcoming' },
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

  const [previousState, setPreviousState] =
    useState<RoundTimelineState>(currentState);
  const [stateAnnouncement, setStateAnnouncement] = useState('');

  /*
   * Keep the existing screen-reader announcement behavior.
   *
   * A state transition is announced once, rather than on every render.
   */
  useEffect(() => {
    if (previousState === currentState) {
      return;
    }

    const label = getStateLabel(currentState);

    const timer = window.setTimeout(() => {
      setStateAnnouncement(`Round is now ${label}`);
      setPreviousState(currentState);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [currentState, previousState]);

  /*
   * Loading/disconnected are connection states, not timeline steps.
   *
   * When either occurs, keep the visual timeline anchored to the
   * last meaningful round state where possible. For the initial
   * connection state, Upcoming is the safest visual baseline.
   */
  const timelineState =
    currentState === 'loading' || currentState === 'disconnected'
      ? previousState === 'loading' || previousState === 'disconnected'
        ? 'upcoming'
        : previousState
      : currentState;

  const currentIndex = Math.max(
    0,
    TIMELINE_STATES.findIndex((state) => state.key === timelineState)
  );

  const isConnectionIssue =
    currentState === 'loading' || currentState === 'disconnected';

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
        Current state is &quot;{currentState}&quot;. Sequence: Upcoming &rarr; Live &rarr; Resolving &rarr; Finished. {stateAnnouncement}
      </div>

      {/* Header */}
      <div className="mb-4">
        <h2
          id="round-progress-heading"
          className="text-lg font-bold tracking-tight text-white"
        >
          Round Progress
        </h2>

        <p className="mt-1 text-sm text-slate-400">
          Follow the current round state.
        </p>
      </div>

      {/* Loading banner */}
      {currentState === 'loading' && (
        <div
          role="status"
          className="mb-4 flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-cyan-400/5 px-4 py-3 text-sm text-cyan-200 backdrop-blur-md"
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-cyan-400"
          />

          <span>
            Connecting to live round updates…
          </span>
        </div>
      )}

      {/* Disconnected banner */}
      {currentState === 'disconnected' && (
        <div
          role="alert"
          className="mb-4 flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-200 backdrop-blur-md"
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full bg-red-400"
          />

          <span>
            Live round updates are currently unavailable.
          </span>
        </div>
      )}

      {/* Dark glass timeline */}
      <div
        className={`rounded-2xl border border-slate-700/50 bg-slate-950/70 p-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:p-6 ${
          isConnectionIssue
            ? 'ring-1 ring-slate-800/50'
            : ''
        }`}
      >
        {/* Accessible description of the sequence */}
        <p className="sr-only">
          Round stages: Upcoming, Live, Resolving, Finished.
          Current stage: {getStateLabel(timelineState)}.
        </p>

        {/* Timeline */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[440px]">
            <div className="relative">
              {/* Base connecting line */}
              <div
                aria-hidden="true"
                className="absolute left-[12.5%] right-[12.5%] top-4 h-px bg-slate-700"
              />

              {/* Completed connecting line */}
              {currentIndex > 0 && (
                <div
                  aria-hidden="true"
                  className="absolute left-[12.5%] top-4 h-px bg-cyan-500/70 transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      75,
                      currentIndex * 25
                    )}%`,
                  }}
                />
              )}

              <ol
                aria-label="Round progress"
                className="relative grid grid-cols-4"
              >
                {TIMELINE_STATES.map((state, index) => {
                  const isCurrent = index === currentIndex;
                  const isCompleted = index < currentIndex;

                  return (
                    <li
                      key={state.key}
                      className="flex min-w-0 flex-col items-center text-center"
                    >
                      {/* Step indicator */}
                      <div
                        aria-current={
                          isCurrent ? 'step' : undefined
                        }
                        className={[
                          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300',
                          isCurrent
                            ? 'border-cyan-300 bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.35)]'
                            : isCompleted
                              ? 'border-cyan-500/60 bg-cyan-500/20 text-cyan-300'
                              : 'border-slate-700 bg-slate-900 text-slate-600',
                        ].join(' ')}
                      >
                        {isCompleted ? (
                          <svg
                            aria-hidden="true"
                            viewBox="0 0 16 16"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              d="M3 8.5 6.5 12 13 4.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <span
                            aria-hidden="true"
                            className={[
                              'h-2 w-2 rounded-full',
                              isCurrent
                                ? 'bg-slate-950'
                                : 'bg-current',
                            ].join(' ')}
                          />
                        )}
                      </div>

                      {/* Step label */}
                      <span
                        className={[
                          'mt-3 text-xs font-semibold uppercase tracking-wide transition-colors duration-300 sm:text-sm',
                          isCurrent
                            ? 'text-cyan-300'
                            : isCompleted
                              ? 'text-slate-300'
                              : 'text-slate-600',
                        ].join(' ')}
                      >
                        {state.label}
                      </span>

                      {/* Current-state indicator */}
                      {isCurrent && (
                        <span className="mt-1 text-[10px] font-medium uppercase tracking-widest text-cyan-500/80">
                          Current
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>

        {/* Current state summary */}
        <div className="mt-6 border-t border-slate-800/80 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Current stage
            </span>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-3 py-1 text-xs font-semibold text-cyan-300">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-cyan-400"
              />
              {getStateLabel(timelineState)}
            </span>
          </div>
        </div>

        {/* Prediction pulse — shown when round is live or resolving */}
        {(currentState === 'live' || currentState === 'resolving') && (
          <div className="mt-4 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Predictions
            </span>
            <PredictionPulse />
          </div>
        )}
      </div>
    </section>
  );
};

export default RoundTimeline;