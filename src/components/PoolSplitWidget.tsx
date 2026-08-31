/**
 * PoolSplitWidget — Issue #312
 *
 * Visualises the UP vs DOWN pool split for an active updown round.
 * Accessibility requirements:
 *   - Both color AND diagonal-stripe pattern distinguish the two sides
 *     (WCAG 1.4.1 — Use of Color: info is never conveyed by color alone).
 *   - An sr-only `<p>` provides a plain-text summary for screen readers.
 *   - The visual bar uses `role="img"` + `aria-label` so AT announces it as
 *     a single image rather than reading each `<div>` slice.
 *
 * Usage (standalone):
 *   <PoolSplitWidget poolUp={2500} poolDown={1500} />
 *
 * Usage with a MockRound:
 *   <PoolSplitWidget poolUp={round.poolUp} poolDown={round.poolDown} />
 */

import { clsx } from 'clsx';
import { formatVXLM } from '../lib/utils';

// ─── Inline SVG pattern data URIs ──────────────────────────────────────────
//
// A diagonal-stripe pattern (45° stripes) is embedded as a tiny SVG data-URI
// and layered over the solid background colour via `background-image`. This
// keeps the component self-contained (no external assets, no CSS class
// collisions with Tailwind JIT, no extra svg elements polluting the DOM).
//
// UP  → blue (#2C4BFD) fill + lighter-blue (#BEC7FE) diagonal stripes
// DOWN → rose (#F43F5E) fill + lighter-rose (#FDA4AF) diagonal stripes

const STRIPE_UP =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='8' height='8' fill='%232C4BFD'/%3E%3Cpath d='M0 8L8 0M-2 2L2 -2M6 10L10 6' stroke='%23BEC7FE' stroke-width='2' opacity='0.5'/%3E%3C/svg%3E\")";

const STRIPE_DOWN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='8' height='8' fill='%23F43F5E'/%3E%3Cpath d='M0 8L8 0M-2 2L2 -2M6 10L10 6' stroke='%23FDA4AF' stroke-width='2' opacity='0.5'/%3E%3C/svg%3E\")";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PoolSplitWidgetProps {
  /** vXLM committed to the UP side. */
  poolUp?: number;
  /** vXLM committed to the DOWN side. */
  poolDown?: number;
  /**
   * Extra classes applied to the outermost wrapper element.
   * Useful for spacing adjustments at the call-site.
   */
  className?: string;
  /**
   * Height in pixels of the split bar.
   * Defaults to 16 px — large enough to see the stripe pattern clearly.
   */
  barHeight?: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * UP vs DOWN pool-split bar with colour + diagonal-stripe dual encoding and
 * an accessible plain-text fallback.
 */
export function PoolSplitWidget({
  poolUp = 0,
  poolDown = 0,
  className,
  barHeight = 16,
}: PoolSplitWidgetProps) {
  const safeUp = Math.max(0, poolUp);
  const safeDown = Math.max(0, poolDown);
  const total = safeUp + safeDown;

  // When there is no pool yet show an empty/indeterminate state.
  const isEmpty = total === 0;

  const upRatio = isEmpty ? 0.5 : safeUp / total;

  // Percentage integers for widths — downPct is derived from upPct so
  // they always sum to exactly 100 (avoids 1-pixel gaps due to rounding).
  const upPct = isEmpty ? 50 : Math.round(upRatio * 100);
  const downPct = isEmpty ? 50 : 100 - upPct;

  // Consistent readable strings for both the sr-only text and the visual labels.
  const upPctStr = `${upPct}%`;
  const downPctStr = `${downPct}%`;
  const totalStr = formatVXLM(total);

  const barLabel = isEmpty
    ? 'Pool split: no predictions yet'
    : `Pool split: UP ${upPctStr} (${formatVXLM(safeUp)}), DOWN ${downPctStr} (${formatVXLM(safeDown)}), total ${totalStr}`;

  return (
    <div className={clsx('flex flex-col gap-1.5', className)} data-testid="pool-split-widget">
      {/* ── Screen-reader summary ─────────────────────────────────────────── */}
      <p className="sr-only" data-testid="pool-split-sr-summary">
        {barLabel}
      </p>

      {/* ── Visual split bar ─────────────────────────────────────────────── */}
      <div
        role="img"
        aria-label={barLabel}
        aria-hidden="false"
        className="flex w-full overflow-hidden rounded-full bg-gray-800"
        style={{ height: `${barHeight}px` }}
        data-testid="pool-split-bar"
      >
        {isEmpty ? (
          // Empty state: single neutral segment with a subtle shimmer
          <div
            className="h-full w-full animate-pulse rounded-full bg-gray-700"
            aria-hidden="true"
          />
        ) : (
          <>
            {/* UP segment — blue + diagonal-stripe pattern */}
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${upPct}%`,
                backgroundImage: STRIPE_UP,
                backgroundSize: '8px 8px',
              }}
              aria-hidden="true"
              data-testid="pool-split-up-bar"
              data-pattern="stripe-up"
            />
            {/* DOWN segment — rose + diagonal-stripe pattern */}
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${downPct}%`,
                backgroundImage: STRIPE_DOWN,
                backgroundSize: '8px 8px',
              }}
              aria-hidden="true"
              data-testid="pool-split-down-bar"
              data-pattern="stripe-down"
            />
          </>
        )}
      </div>

      {/* ── Percentage labels ─────────────────────────────────────────────── */}
      <div
        className="flex justify-between text-xs font-medium"
        aria-hidden="true"
        data-testid="pool-split-labels"
      >
        <span className="flex items-center gap-1.5 text-[#BEC7FE]">
          {/* UP legend dot */}
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
            style={isEmpty ? { backgroundColor: '#2C4BFD' } : { backgroundImage: STRIPE_UP, backgroundSize: '8px 8px' }}
            aria-hidden="true"
          />
          <span data-testid="pool-split-up-label">UP {isEmpty ? '—' : upPctStr}</span>
        </span>

        <span className="flex items-center gap-1.5 text-rose-400">
          <span data-testid="pool-split-down-label">DOWN {isEmpty ? '—' : downPctStr}</span>
          {/* DOWN legend dot */}
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
            style={isEmpty ? { backgroundColor: '#F43F5E' } : { backgroundImage: STRIPE_DOWN, backgroundSize: '8px 8px' }}
            aria-hidden="true"
          />
        </span>
      </div>

      {/* ── Pool totals sub-line ─────────────────────────────────────────── */}
      {!isEmpty && (
        <div
          className="flex justify-between text-[11px] text-gray-500"
          aria-hidden="true"
          data-testid="pool-split-totals"
        >
          <span>{formatVXLM(safeUp)}</span>
          <span>Total {totalStr}</span>
          <span>{formatVXLM(safeDown)}</span>
        </div>
      )}
    </div>
  );
}

export default PoolSplitWidget;
