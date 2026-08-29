import { useReducedMotion } from '../hooks/useReducedMotion';

interface SparklineProps {
  /** Ordered series of mock/real points, oldest first. */
  points: number[];
  /** Accessible text alternative describing the trend (used as the SVG's aria-label). */
  label: string;
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Tiny inline SVG sparkline with no backend dependency (mock points in,
 * line out). Under `prefers-reduced-motion` (or the app's motion override)
 * it renders only a static marker at the last point instead of the full
 * line, per the reduced-motion acceptance criteria.
 */
export default function Sparkline({ points, label, width = 72, height = 24, className }: SparklineProps) {
  const { reduced } = useReducedMotion();

  if (points.length === 0) {
    return null;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const toCoords = (value: number, index: number): [number, number] => {
    const x = points.length === 1 ? width : (index / (points.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return [x, y];
  };

  const [lastX, lastY] = toCoords(points[points.length - 1], points.length - 1);

  return (
    <svg
      role="img"
      aria-label={label}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      data-reduced-motion={reduced}
    >
      {reduced ? (
        <circle cx={lastX} cy={lastY} r={2.5} fill="currentColor" />
      ) : (
        <>
          <polyline
            points={points.map((value, index) => toCoords(value, index).join(',')).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={lastX} cy={lastY} r={2.5} fill="currentColor" />
        </>
      )}
    </svg>
  );
}
