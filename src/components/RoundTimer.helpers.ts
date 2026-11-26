export type ArcState = 'open' | 'closing' | 'urgent' | 'ended';

// SVG circle constants — circumference = 2 * π * r
export const RADIUS = 44;
export const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ≈ 276.46
export const VIEWBOX_SIZE = 120;

/** Thresholds for arc color and state. */
export const ARC_THRESHOLDS = {
  URGENT_MS: 30_000, // < 30 s: urgent (red)
  CLOSING_MS: 120_000, // < 2 min: closing (amber)
} as const;

export const ARC_COLORS = {
  OPEN: '#06B6D4', // teal — >= 2 min
  CLOSING: '#FBBF24', // amber — < 2 min
  URGENT: '#EF4444', // red — < 30 s
  ENDED: '#6B7280', // grey — expired
} as const;

/** Determines the lifecycle state of the timer arc based on time remaining. */
export function getArcState(timeLeftMs: number, isExpired: boolean): ArcState {
  if (isExpired || timeLeftMs <= 0) return 'ended';
  if (timeLeftMs < ARC_THRESHOLDS.URGENT_MS) return 'urgent';
  if (timeLeftMs < ARC_THRESHOLDS.CLOSING_MS) return 'closing';
  return 'open';
}

/** Returns a hex colour keyed to how much time is left. */
export function getArcColour(timeLeftMs: number, isExpired: boolean): string {
  const state = getArcState(timeLeftMs, isExpired);
  switch (state) {
    case 'ended':
      return ARC_COLORS.ENDED;
    case 'urgent':
      return ARC_COLORS.URGENT;
    case 'closing':
      return ARC_COLORS.CLOSING;
    case 'open':
    default:
      return ARC_COLORS.OPEN;
  }
}
