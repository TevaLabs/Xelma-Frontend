import { useRoundCountdown } from '../hooks/useRoundCountdown';
import {
  CIRCUMFERENCE,
  RADIUS,
  VIEWBOX_SIZE,
  getArcColour,
  getArcState,
} from './RoundTimer.helpers';

export interface RoundTimerProps {
  /** Target end time for the countdown. */
  endTime: string | number | Date;
  /** Label shown below the timer. When null, the players online count is hidden. */
  playersOnline?: number | null;
  className?: string;
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
  const { formattedTime, isExpired, timeLeftMs, initialTimeLeftMs } = useRoundCountdown(endTime);

  const arcState = getArcState(timeLeftMs, isExpired);
  const arcColour = getArcColour(timeLeftMs, isExpired);

  const progress = isExpired
    ? 0
    : initialTimeLeftMs > 0
      ? Math.min(Math.max(timeLeftMs / initialTimeLeftMs, 0), 1)
      : 1;

  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <div
      className={`glass-card inline-flex flex-col items-center rounded-2xl p-5 sm:p-6 ${className}`}
      role="timer"
      aria-label={
        isExpired
          ? 'Round has ended'
          : `Time remaining: ${formattedTime}`
      }
      data-testid="round-timer"
      data-arc-state={arcState}
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
          data-testid="round-timer-arc"
          data-arc-state={arcState}
        />

        {/* Centre text */}
        <text
          x={VIEWBOX_SIZE / 2}
          y={VIEWBOX_SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-white font-mono text-sm font-bold tabular-nums sm:text-base"
          data-testid="round-timer-text"
        >
          {isExpired ? 'ENDED' : formattedTime}
        </text>
      </svg>

      {/* Players-online label */}
      {playersOnline !== null && (
        <p
          className="mt-2 text-xs font-medium text-gray-400 sm:text-sm"
          data-testid="round-timer-players"
        >
          Playing now: {playersOnline.toLocaleString()}
        </p>
      )}
    </div>
  );
}
