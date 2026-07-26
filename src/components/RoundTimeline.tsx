import { Fragment, useState } from 'react';
import type { Round } from '../lib/api-client';
import { useRoundStore } from '../store/useRoundStore';

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

/**
 * Determines the current round state based on the active round and SSE connection
 */
function getCurrentRoundState(
  activeRound: Round | null,
  isRoundActive: boolean,
  sseStatus: string
): 'upcoming' | 'live' | 'resolving' | 'finished' | 'loading' | 'disconnected' {
  // Handle loading/disconnected states
  if (sseStatus === 'connecting' || sseStatus === 'reconnecting') {
    return 'loading';
  }

  if (sseStatus === 'disconnected') {
    return 'disconnected';
  }

  // If there's no active round, it's upcoming
  if (!activeRound) {
    return 'upcoming';
  }

  // Check round status if available
  if (activeRound.status) {
    const status = activeRound.status.toLowerCase();
    if (status === 'live' || status === 'active') return 'live';
    if (status === 'resolving' || status === 'closing') return 'resolving';
    if (status === 'resolved' || status === 'finished') return 'finished';
  }

  // Fallback: use isRoundActive flag
  if (isRoundActive) {
    return 'live';
  }

  // If we have a round but it's not active, check timestamps
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

/**
 * RoundTimeline Component
 * Displays the progression of round states with visual indicators
 */
const RoundTimeline: React.FC = () => {
  const activeRound = useRoundStore((state) => state.activeRound);
  const isRoundActive = useRoundStore((state) => state.isRoundActive);
  const sseConnection = useRoundStore((state) => state.sseConnection);

  const currentState = getCurrentRoundState(
    activeRound,
    isRoundActive,
    sseConnection?.status || 'disconnected'
  );

  const getStateIndex = (state: string): number => {
    const index = TIMELINE_STATES.findIndex((s) => s.key === state);
    return index !== -1 ? index : -1;
  };

  const currentIndex = getStateIndex(
    currentState as 'upcoming' | 'live' | 'resolving' | 'finished'
  );

  const isLoading = currentState === 'loading';
  const isDisconnected = currentState === 'disconnected';
  const isCurrentLive = currentState === 'live';
  const isCurrentAdvanced = currentState === 'resolving' || currentState === 'finished';

  const [prevCurrentState, setPrevCurrentState] = useState(currentState);
  const [stateAnnouncement, setStateAnnouncement] = useState('');

  useEffect(() => {
    if (prevStateRef.current !== currentState) {
      const label =
        TIMELINE_STATES.find((s) => s.key === currentState)?.label ||
        (currentState === 'disconnected'
          ? 'Disconnected'
          : currentState === 'loading'
            ? 'Connecting'
            : currentState);
      const timer = setTimeout(() => {
        setStateAnnouncement(`Round is now ${label}`);
      }, 0);
      prevStateRef.current = currentState;
      return () => clearTimeout(timer);
    }
  }, [currentState]);

  return (
    <div className="w-full bg-white dark:bg-gray-800 p-4 lg:p-6 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {stateAnnouncement}
      </div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
          Round Progress
        </h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <svg
              className="w-4 h-4 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Connecting to live updates...
          </p>
        </div>
      )}

      {/* Disconnected State */}
      {isDisconnected && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Connection lost - Timeline may not update in real-time
          </p>
        </div>
      )}

      {/* Timeline Container */}
      <div className="flex items-center justify-between gap-2 lg:gap-4">
        {TIMELINE_STATES.map((state, index) => {
          const isActive = currentIndex === index;
          const isCompleted = currentIndex > index;
          const isUpcoming = currentIndex < index;

          return (
            <Fragment key={state.key}>
              {/* State Node */}
              <div className="flex flex-col items-center flex-1">
                {/* Circle Indicator */}
                <div
                  className={`
                    w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center 
                    font-bold text-sm lg:text-base mb-2 transition-all duration-300
                    ${
                      isActive
                        ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/50'
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : isUpcoming
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5 lg:w-6 lg:h-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    text-xs lg:text-sm font-semibold text-center
                    ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-600 dark:text-gray-400'
                    }
                  `}
                >
                  {state.label}
                </span>
              </div>

              {/* Connector Line (between nodes) */}
              {index < TIMELINE_STATES.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mb-6 rounded-full transition-all duration-300
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}
                  `}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      {/* Status Info */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Current State:</span>
          <span
            className={`
              px-3 py-1 rounded-full font-semibold text-white text-xs lg:text-sm
              ${
                isCurrentLive
                  ? 'bg-blue-500'
                  : isCurrentAdvanced
                    ? 'bg-green-500'
                    : 'bg-gray-500'
              }
            `}
          >
            {TIMELINE_STATES.find((s) => s.key === currentState)?.label ||
              'Unknown'}
          </span>
        </div>

        {/* Additional Round Info */}
        {activeRound && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            {activeRound.startsAt && (
              <p>
                Starts: {new Date(activeRound.startsAt).toLocaleTimeString()}
              </p>
            )}
            {activeRound.endsAt && (
              <p>Ends: {new Date(activeRound.endsAt).toLocaleTimeString()}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoundTimeline;
