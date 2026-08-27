import { useEffect, useState } from 'react';
import type { Round } from '../lib/api-client';
import { useRoundStore } from '../store/useRoundStore';
import ContributorTaskPlaceholder from './ContributorTaskPlaceholder';

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
      <ContributorTaskPlaceholder
        title="Rebuild Round Timeline Stepper"
        issueHint={`Current state is "${currentState}". Restore Upcoming → Live → Resolving → Finished stepper with loading/disconnected banners. Use glass-card dark theme.`}
      />
    </div>
  );
};

export default RoundTimeline;
