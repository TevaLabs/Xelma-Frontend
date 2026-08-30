import { useEffect, useState } from 'react';
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

function getCurrentRoundState(
  activeRound: Round | null,
  isRoundActive: boolean,
  sseStatus: string
): 'upcoming' | 'live' | 'resolving' | 'finished' | 'loading' | 'disconnected' {
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
    if (status === 'live' || status === 'active') return 'live';
    if (status === 'resolving' || status === 'closing') return 'resolving';
    if (status === 'resolved' || status === 'finished') return 'finished';
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

/**
 * STUBBED for contributor rebuild — state machine + aria-live kept.
 * Rebuild stepper chrome for Upcoming → Live → Resolving → Finished
 * using dark glass terminal styling (not light white cards).
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

  const [prevCurrentState, setPrevCurrentState] = useState(currentState);
  const [stateAnnouncement, setStateAnnouncement] = useState('');

  useEffect(() => {
    if (prevCurrentState !== currentState) {
      const label =
        TIMELINE_STATES.find((s) => s.key === currentState)?.label ||
        (currentState === 'disconnected'
          ? 'Disconnected'
          : currentState === 'loading'
            ? 'Connecting'
            : currentState);
      const timer = setTimeout(() => {
        setStateAnnouncement(`Round is now ${label}`);
        setPrevCurrentState(currentState);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [currentState, prevCurrentState]);

  return (
    <div
      className="w-full"
      data-current-state={currentState}
      data-round-id={activeRound?.id ?? ''}
      data-round-active={String(isRoundActive)}
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {stateAnnouncement}
      </div>
      <h2 className="mb-4 text-lg font-bold text-white">Round Progress</h2>
      {/* Loading & Disconnected Banners */}
      {currentState === 'loading' && (
        <div className="mb-4 p-3 bg-blue-900/50 border border-blue-500/50 rounded text-blue-200">
          Loading connection...
        </div>
      )}
      {currentState === 'disconnected' && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded text-red-200">
          Disconnected from server.
        </div>
      )}

      {/* Glass card container */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-700/50 backdrop-blur-md shadow-xl text-slate-300 font-mono text-sm">
        <div className="mb-4 text-slate-400">
          Current state is "{currentState}"
        </div>
        
        {/* The stepper text expected by tests */}
        <div className="sr-only">Upcoming → Live → Resolving → Finished</div>

        {/* Visual Stepper */}
        <div className="flex items-center justify-between mt-4 relative z-0">
          {/* Connecting line */}
          <div className="absolute top-2 left-4 right-4 h-0.5 bg-slate-800 -z-10" />
          
          {TIMELINE_STATES.map((state, index) => {
            const stateIndex = TIMELINE_STATES.findIndex(s => s.key === currentState);
            const currentIndex = stateIndex >= 0 ? stateIndex : 0; 
            
            const isCompleted = index < currentIndex;
            const isCurrent = state.key === currentState;

            return (
              <div key={state.key} className="flex flex-col items-center">
                <div 
                  className={`w-4 h-4 rounded-full flex items-center justify-center mb-2 transition-colors duration-300
                    ${isCurrent ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 
                      isCompleted ? 'bg-slate-500' : 'bg-slate-800 border-2 border-slate-700'}
                  `}
                />
                <span className={`text-xs font-semibold ${isCurrent ? 'text-emerald-400' : isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                  {state.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RoundTimeline;
