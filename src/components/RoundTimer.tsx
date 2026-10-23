import { useRoundCountdown } from '../hooks/useRoundCountdown';

interface RoundTimerProps {
  /** Target end time for the countdown. */
  endTime: string | number | Date;
  /** Players shown on the "Playing now" line. Pass `null` to hide it when no
   *  live count is available. */
  playersOnline?: number | null;
  className?: string;
}

// SVG circle constants — circumference = 2 * π * r
const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 276.46
const VIEWBOX_SIZE = 120;

const URGENT_MS = 30_000;
const WARNING_MS = 120_000;

/** Countdown colour band, keyed to how much time is left. */
type ArcState = 'ended' | 'urgent' | 'closing' | 'open';

const ARC_COLOURS: Record<ArcState, string> = {
  ended: '#6B7280',
  urgent: '#EF4444',
  closing: '#FBBF24',
  open: '#06B6D4',
};

function getArcState(timeLeftMs: number, isExpired: boolean): ArcState {
  if (isExpired) return 'ended';
  if (timeLeftMs < URGENT_MS) return 'urgent';
  if (timeLeftMs < WARNING_MS) return 'closing';
  return 'open';
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
  const {
    formattedTime,
    isExpired,
    timeLeftMs,
    initialTimeLeftMs,
  } = useRoundCountdown(endTime);

  // The hook re-baselines `initialTimeLeftMs` whenever `endTime` moves to the
  // next round, so the arc always sweeps a full turn for the current round.
  const progress =
    initialTimeLeftMs > 0
      ? Math.min(Math.max(timeLeftMs / initialTimeLeftMs, 0), 1)
      : 1;

  const offset = CIRCUMFERENCE * (1 - progress);
  const arcState = getArcState(timeLeftMs, isExpired);

  return (
    <div
      className={`glass-card inline-flex flex-col items-center rounded-2xl p-5 sm:p-6 ${className}`}
      role="timer"
      aria-label={
        isExpired
          ? 'Round has ended'
          : `Time remaining: ${formattedTime}`
      }
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
          stroke={ARC_COLOURS[arcState]}
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
      {playersOnline !== null && (
        <p className="mt-2 text-xs font-medium text-gray-400 sm:text-sm">
          Playing now: {playersOnline.toLocaleString()}
        </p>
      )}
    </div>
  );
}
