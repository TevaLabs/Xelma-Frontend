import { TrendingUp } from 'lucide-react';
import { usePredictionPulse } from '../hooks/usePredictionPulse';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface PredictionPulseProps {
  className?: string;
}

/**
 * Small live counter that increments each time a `prediction:created` (or
 * `prediction:submitted`) event arrives over the socket.
 *
 * Placement: beside the live-state indicator inside RoundTimeline.
 *
 * Behaviour:
 * - When socket is connected: real count + brief flash on each new prediction.
 * - When socket is offline: count is frozen, badge shows "—" with muted styling,
 *   no animation fires (graceful offline fallback).
 * - When `prefers-reduced-motion: reduce` is active: flash class is never applied,
 *   so no animation runs at all.
 */
export default function PredictionPulse({ className = '' }: PredictionPulseProps) {
  const { count, flashing, isLive } = usePredictionPulse();
  const { reduced } = useReducedMotion();

  // Animate only when connected AND the user hasn't requested reduced motion.
  const shouldFlash = flashing && isLive && !reduced;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-bold tabular-nums select-none transition-colors ${
        isLive
          ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
          : 'border-white/10 bg-white/5 text-gray-500'
      } ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={
        isLive
          ? `${count} recent prediction${count !== 1 ? 's' : ''} this session`
          : 'Prediction feed offline'
      }
      data-testid="prediction-pulse"
      data-live={String(isLive)}
      data-count={count}
    >
      <TrendingUp
        className={`h-3 w-3 shrink-0 ${
          shouldFlash ? 'animate-[prediction-pulse-icon_0.6s_ease-out]' : ''
        }`}
        aria-hidden
      />
      <span
        className={
          shouldFlash ? 'animate-[prediction-pulse-count_0.6s_ease-out]' : undefined
        }
      >
        {isLive ? count.toLocaleString() : '—'}
      </span>
      {isLive && (
        <span className="sr-only">recent predictions</span>
      )}
    </div>
  );
}
