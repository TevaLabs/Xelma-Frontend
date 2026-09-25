export type Direction = 'UP' | 'DOWN';

interface DirectionIconProps {
  direction: Direction;
  className?: string;
}

const TRIANGLE_POINTS: Record<Direction, string> = {
  UP: '12,4 22,20 2,20',
  DOWN: '2,4 22,4 12,20',
};

/**
 * Filled triangle that points up for UP and down for DOWN.
 *
 * It is decorative (aria-hidden): the visible "UP" / "DOWN" text and the
 * buttons' aria-labels already carry the meaning. The shape exists so the
 * direction can be read without relying on colour alone.
 */
export function DirectionIcon({ direction, className }: DirectionIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      data-direction={direction.toLowerCase()}
    >
      <polygon points={TRIANGLE_POINTS[direction]} />
    </svg>
  );
}

export default DirectionIcon;
