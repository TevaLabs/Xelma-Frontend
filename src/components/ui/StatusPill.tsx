import { cn } from '../../lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

/**
 * Reusable status / mode pill shared across cards (RoundCard, Landing, …).
 * Every tone carries the same border/background/text color triple, so the
 * color strings live here instead of being restated per caller.
 *
 * Usage:
 * ```
 * <StatusPill tone="rose" dot dotClassName="status-dot status-dot-urgent"
 *   className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">
 *   Under 30s
 * </StatusPill>
 * ```
 *
 * Only the color tokens and the pill shell are supplied by the primitive —
 * pass sizing/typography (padding, text size, weight, tracking) via `className`
 * so visual parity with the previous markup is kept.
 */
export type StatusPillTone = 'blue' | 'cyan' | 'rose' | 'amber' | 'brand' | 'neutral';

const STATUS_PILL_BASE = 'inline-flex items-center gap-1.5 rounded-full';

const STATUS_PILL_TONES: Record<StatusPillTone, string> = {
  blue: 'bg-[#2C4BFD]/15 text-[#BEC7FE]',
  cyan: 'bg-cyan-500/15 text-cyan-300',
  rose: 'border border-rose-500/40 bg-rose-500/10 text-rose-300',
  amber: 'border border-amber-400/30 bg-amber-400/10 text-amber-200',
  brand: 'border border-[#BEC7FE]/20 bg-[#2C4BFD]/10 text-cyan-200',
  neutral: 'border border-white/10 bg-white/5 text-gray-300',
};

export interface StatusPillProps extends HTMLAttributes<HTMLElement> {
  /** Semantic element to render: "span" (default) or "p". */
  as?: 'span' | 'p';
  /** Color tone applied to the pill shell. */
  tone: StatusPillTone;
  /** Render a leading status dot. */
  dot?: boolean;
  /** Extra classes for the leading dot (e.g. `status-dot status-dot-urgent`). */
  dotClassName?: string;
  children?: ReactNode;
}

export const StatusPill = ({
  as: Tag = 'span',
  tone,
  dot,
  dotClassName,
  className,
  children,
  ...props
}: StatusPillProps) => {
  return (
    <Tag className={cn(STATUS_PILL_BASE, STATUS_PILL_TONES[tone], className)} {...props}>
      {dot && (
        <span
          aria-hidden="true"
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClassName)}
        />
      )}
      {children}
    </Tag>
  );
};

export default StatusPill;