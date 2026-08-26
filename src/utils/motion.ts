// ── Duration tokens (milliseconds) ──
export const DURATION = {
  FAST: 150,
  NORMAL: 200,
  SLOW: 300,
} as const;

// ── CSS custom property names for use in styles ──
export const CSS_VARS = {
  DURATION_FAST: 'var(--duration-fast, 150ms)',
  DURATION_NORMAL: 'var(--duration-normal, 200ms)',
  DURATION_SLOW: 'var(--duration-slow, 300ms)',
  EASE_OUT: 'var(--ease-out, cubic-bezier(0.16, 1, 0.3, 1))',
  EASE_EXIT: 'var(--ease-exit, cubic-bezier(0.4, 0, 1, 1))',
} as const;

// ── Entrance animation classes ──

/** Fade in + subtle upward motion (8px → 0), normal speed */
export const ENTER: string = 'animate-in fade-in slide-in-from-bottom-2 duration-200';

/** Fast entrance */
export const ENTER_FAST: string = 'animate-in fade-in slide-in-from-bottom-2 duration-150';

/** Slow entrance */
export const ENTER_SLOW: string = 'animate-in fade-in slide-in-from-bottom-2 duration-300';

// ── Modal animation classes ──

/** Modal backdrop overlay */
export const MODAL_OVERLAY: string = 'animate-in fade-in duration-200';

/** Modal content panel (fade + scale 95% → 100%) */
export const MODAL_CONTENT: string = 'animate-in fade-in zoom-in-95 duration-200';

// ── Panel / drawer animation classes ──

/** Slide-in from right (for drawers, side panels) */
export const PANEL_SLIDE_RIGHT: string = 'animate-in slide-in-from-right duration-200';

// ── Transition classes (for hover/interactive states) ──

/** Base transition: colors only (layout-safe) */
export const TRANSITION_COLORS: string = 'transition-colors duration-150';

/** Transform + opacity only (performant, layout-safe) */
export const TRANSFORM_TRANSITION: string = 'transition-transform duration-150';

/** General transition for hover effects */
export const TRANSITION: string = 'transition-all duration-150';

// ── Hover lift effect ──

/** Subtle hover lift for cards */
export const HOVER_LIFT: string = 'transition-all duration-150 hover:-translate-y-0.5';

/** Slightly stronger hover lift */
export const HOVER_LIFT_STRONG: string = 'transition-all duration-200 hover:-translate-y-1 hover:shadow-lg';
