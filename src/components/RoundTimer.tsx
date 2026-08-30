import { useState, useEffect } from 'react';
import { useRoundCountdown } from '../hooks/useRoundCountdown';

interface RoundTimerProps {
  /** Target end time for the countdown. */
  endTime: string | number | Date;
  /** Label shown below the timer. */
  playersOnline?: number;
  className?: string;
}

// SVG circle constants — circumference = 2 * π * r
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 276.46
const VIEWBOX_SIZE = 120;

/** Returns a hex colour keyed to how much time is left. */
function getArcColour(timeLeftMs: number, isExpired: boolean): string {
  if (isExpired) return '#6B7280';
  if (timeLeftMs < 30_000) return '#EF4444'; // red — < 30 s
  if (timeLeftMs < 120_000) return '#FBBF24'; // amber — < 2 min
  return '#06B6D4'; // teal — > 2 min
}

/**
 * Circular countdown timer with brand-token colours, SVG progress arc,
 * and a "Playing now" players-online label.
 *
 * Dark-fintech theme. Respects `prefers-reduced-motion` via the global CSS
 * rule that strips transitions when the user opts in.
 */
export default function RoundTimer({
  endTime,
  playersOnline = 128,
  className = '',
}: RoundTimerProps) {
  const { formattedTime, isExpired, timeLeftMs } = useRoundCountdown(endTime);

  // Store the initial duration (in ms) once so we can compute the arc
  // percentage. Computed synchronously so the arc is correct from the
  // first paint — no flicker. Re‑computed only when `endTime` changes.
  const resolveTimestamp = (t: string | number | Date): number => {
    if (t instanceof Date) return t.getTime();
    if (typeof t === 'string') return new Date(t).getTime();
    return Number(t);
  };

  const [initialDurationMs, setInitialDurationMs] = useState(() => {
    const diff = resolveTimestamp(endTime) - Date.now();
    return diff > 0 ? diff : 1;
  });

  useEffect(() => {
    const diff = resolveTimestamp(endTime) - Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setInitialDurationMs(diff > 0 ? diff : 1);
  }, [endTime]);

  const progress =
    initialDurationMs > 0
      ? Math.min(timeLeftMs / initialDurationMs, 1)
      : 1;

  const offset = CIRCUMFERENCE * (1 - progress);
  const arcColour = getArcColour(timeLeftMs, isExpired);

  return (
    <div
      className={`glass-card inline-flex flex-col items-center rounded-2xl p-5 sm:p-6 ${className}`}
      role="timer"
      aria-label={
        isExpired
          ? 'Round has ended'
          : `Time remaining: ${formattedTime}`
      }
    >
      {/* Circular countdown */}
      <svg
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="h-28 w-28 sm:h-32 sm:w-32"
        aria-hidden="true"
      >
        {/* Track circle */}
        <circle
          cx={VIEWBOX_SIZE / 2}
          cy={VIEWBOX_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(190,199,254,0.12)"
          strokeWidth="5"
        />

        {/* Progress arc */}
        <circle
          cx={VIEWBOX_SIZE / 2}
          cy={VIEWBOX_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={arcColour}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${VIEWBOX_SIZE / 2} ${VIEWBOX_SIZE / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
          }}
        />

        {/* Centre text */}
        <text
          x={VIEWBOX_SIZE / 2}
          y={VIEWBOX_SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-white font-mono text-sm font-bold tabular-nums sm:text-base"
        >
          {isExpired ? 'ENDED' : formattedTime}
        </text>
      </svg>

      {/* Players-online label */}
      <p className="mt-2 text-xs font-medium text-gray-400 sm:text-sm">
        Playing now: {playersOnline.toLocaleString()}
      </p>
    </div>
  );
}
