// ISSUE: Wire place_bet() to Xelma TypeScript bindings (xelma-contract)
// ISSUE: Real-time round updates via Soroban event polling

import { forwardRef, useEffect, useRef, useState } from 'react';
import type { MockRound } from '../types';
import CountdownTimer from './CountdownTimer';
import AssetIcon from './icons/AssetIcon';
import { formatVXLM } from '../lib/utils';
import { TRANSITION } from '../utils/motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useRoundCountdown } from '../hooks/useRoundCountdown';
import { GlassCard } from './ui/GlassCard';
import { StatusPill } from './ui/StatusPill';
import { PoolSplitWidget } from './PoolSplitWidget';

const URGENCY_THRESHOLD_SECONDS = 30;
const URGENCY_THRESHOLD_MS = URGENCY_THRESHOLD_SECONDS * 1000;

interface RoundCardProps {
  round: MockRound;
  onSubmitPrediction: (round: MockRound) => void;
  isHighlighted?: boolean;
}

function getStatusMeta(round: MockRound, secondsLeft: number) {
  if (secondsLeft > 0 && secondsLeft < 120) {
    return { label: 'CLOSING SOON', dotClass: 'status-dot-yellow' };
  }
  if (round.status === 'new') {
    return { label: 'OPEN', dotClass: 'status-dot-green' };
  }
  return { label: 'LIVE', dotClass: 'status-dot-live' };
}

function poolSize(round: MockRound): number {
  if (round.mode === 'updown') {
    return (round.poolUp ?? 0) + (round.poolDown ?? 0);
  }
  return round.totalPool ?? 0;
}

const RoundCard = forwardRef<HTMLElement, RoundCardProps>(function RoundCard(
  { round, onSubmitPrediction, isHighlighted = false },
  ref,
) {
  const { reduced } = useReducedMotion();
  const [endTime, setEndTime] = useState(() => new Date(Date.now() + round.closesInSeconds * 1000));
  // Live ticking countdown so the urgency state (secondsLeft < 30) updates
  // between server round refreshes, matching the displayed countdown timer.
  const { isExpired, timeLeftMs } = useRoundCountdown(endTime);
  const isUrgent = !isExpired && timeLeftMs < URGENCY_THRESHOLD_MS;
  const total = poolSize(round);

  const statusMeta = getStatusMeta(round, round.closesInSeconds);
  const prevStatus = useRef(statusMeta.label);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEndTime(new Date(Date.now() + round.closesInSeconds * 1000));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [round.closesInSeconds]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (round.closesInSeconds <= 0) {
        setStatusAnnouncement('Round has ended');
      } else if (prevStatus.current !== statusMeta.label) {
        setStatusAnnouncement(`Round status: ${statusMeta.label}`);
        prevStatus.current = statusMeta.label;
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [round.closesInSeconds, statusMeta.label]);

  const prevUrgent = useRef(isUrgent);
  const [urgencyAnnouncement, setUrgencyAnnouncement] = useState('');

  // Announce the urgency state transition (under 30s) politely, distinct from
  // the CLOSING SOON status announcement above.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (prevUrgent.current !== isUrgent) {
        prevUrgent.current = isUrgent;
        setUrgencyAnnouncement(isUrgent ? 'Round closing in under 30 seconds' : '');
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isUrgent]);

  return (
    <GlassCard
      as="article"
      ref={ref}
      className={`flex min-w-0 flex-col gap-4 rounded-2xl p-4 transition-all duration-300 sm:p-5 ${TRANSITION} ${
        isHighlighted ? 'accent-border-teal' : ''
      } ${isHighlighted && !reduced ? 'accent-pulse' : ''}`}
      data-testid="round-card"
      data-highlighted={isHighlighted ? 'true' : 'false'}
    >
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {[statusAnnouncement, urgencyAnnouncement].filter(Boolean).join(' ')}
      </div>

      <header className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2C4BFD]/15 text-[#BEC7FE]"
            aria-hidden
          >
            <AssetIcon asset={round.asset} size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-white">{round.asset}/USD</h3>
            <p className="truncate text-xs text-gray-500">
              Reference ${round.startPrice.toLocaleString()}
            </p>
          </div>
        </div>

        <StatusPill
          tone={round.mode === 'updown' ? 'blue' : 'cyan'}
          className="self-start px-3 py-1 text-xs font-bold uppercase tracking-wide sm:self-auto"
        >
          {round.mode === 'updown' ? 'UP/DOWN' : 'PRECISION'}
        </StatusPill>
      </header>

      <div
        className="flex min-w-0 flex-col gap-2 text-sm text-gray-400 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3"
        data-testid="round-card-meta"
      >
        <div className="flex items-center gap-2">
          <span
            className={`status-dot ${getStatusMeta(round, round.closesInSeconds).dotClass}`}
            aria-hidden="true"
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {getStatusMeta(round, round.closesInSeconds).label}
          </span>
          {isUrgent && (
            <StatusPill
              tone="rose"
              dot
              dotClassName="status-dot status-dot-urgent"
              className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
              data-testid="round-card-urgency"
            >
              Under 30s
            </StatusPill>
          )}
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap text-sm text-gray-400">
          <span>Resolves in</span>
          <CountdownTimer endTime={endTime} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="break-words text-sm font-semibold text-gray-300" data-testid="round-card-pool">
          Pool: {formatVXLM(total)}
        </p>

        {round.mode === 'updown' ? (
          <PoolSplitWidget poolUp={round.poolUp} poolDown={round.poolDown} />
        ) : (
          <p className="text-sm text-cyan-300">
            {round.predictionCount ?? 0} forecasts submitted
          </p>
        )}
      </div>

      <button
        type="button"
        disabled={round.closesInSeconds <= 0}
        onClick={() => onSubmitPrediction(round)}
        className="btn-primary flex min-h-[44px] w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="round-card-submit"
      >
        Submit Prediction
      </button>
    </GlassCard>
  );
});

export default RoundCard;
