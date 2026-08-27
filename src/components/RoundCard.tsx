// ISSUE: Wire place_bet() to Xelma TypeScript bindings (xelma-contract)
// ISSUE: Real-time round updates via Soroban event polling

import { forwardRef, useEffect, useRef, useState } from 'react';
import type { MockRound } from '../types';
import CountdownTimer from './CountdownTimer';
import { formatVXLM, formatPercent } from '../lib/utils';
import { TRANSITION } from '../utils/motion';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useRoundCountdown } from '../hooks/useRoundCountdown';

const URGENCY_THRESHOLD_SECONDS = 30;
const URGENCY_THRESHOLD_MS = URGENCY_THRESHOLD_SECONDS * 1000;

const ASSET_ICONS: Record<string, string> = {
  BTC: '₿',
  ETH: 'Ξ',
  XLM: '✦',
};

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
  const upRatio = round.mode === 'updown' && total > 0 ? (round.poolUp ?? 0) / total : 0;
  const upPct = Math.round(upRatio * 100);
  const downPct = round.mode === 'updown' ? 100 - upPct : 0;

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
    <article
      ref={ref}
      className={`glass-card flex min-w-0 flex-col gap-4 rounded-2xl p-4 transition-all duration-300 sm:p-5 ${TRANSITION} ${
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#2C4BFD]/15 text-lg font-bold text-[#BEC7FE]"
            aria-hidden
          >
            {ASSET_ICONS[round.asset]}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-white">{round.asset}/USD</h3>
            <p className="truncate text-xs text-gray-500">
              Reference ${round.startPrice.toLocaleString()}
            </p>
          </div>
        </div>

        <span
          className={`self-start rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide sm:self-auto ${
            round.mode === 'updown'
              ? 'bg-[#2C4BFD]/15 text-[#BEC7FE]'
              : 'bg-cyan-500/15 text-cyan-300'
          }`}
        >
          {round.mode === 'updown' ? 'UP/DOWN' : 'PRECISION'}
        </span>
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
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-rose-300"
              data-testid="round-card-urgency"
            >
              <span className="status-dot status-dot-urgent" aria-hidden="true" />
              Under 30s
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap text-sm text-gray-400">
          <span>Resolves in</span>
          <CountdownTimer endTime={endTime} />
        </div>
      </div>

      <p className="break-words mt-4 text-sm font-semibold text-gray-300" data-testid="round-card-pool">
        Pool: {formatVXLM(total)}
      </p>

      {round.mode === 'updown' ? (
        <div className="mt-1">
          <div className="flex h-2 overflow-hidden rounded-full bg-gray-800">
            <div
              className="bg-[#2C4BFD] transition-all"
              style={{ width: `${upPct}%` }}
              title={`UP ${formatPercent(upPct / 100, 0)}`}
            />
            <div
              className="bg-rose-500 transition-all"
              style={{ width: `${downPct}%` }}
              title={`DOWN ${formatPercent(downPct / 100, 0)}`}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span className="text-[#BEC7FE]">UP {formatPercent(upPct / 100, 0)}</span>
            <span className="text-rose-400">DOWN {formatPercent(downPct / 100, 0)}</span>
          </div>
        </div>
      ) : (
        <p className="mt-1 text-sm text-cyan-300">
          {round.predictionCount ?? 0} forecasts submitted
        </p>
      )}

      <button
        type="button"
        disabled={round.closesInSeconds <= 0}
        onClick={() => onSubmitPrediction(round)}
        className="btn-primary mt-2 flex min-h-[44px] w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="round-card-submit"
      >
        Submit Prediction
      </button>
    </article>
  );
});

export default RoundCard;
