import { CalendarDays, Lightbulb, Sparkles } from 'lucide-react';
import type { Tip } from '../../types/education';
import { cn } from '../../lib/utils';

export interface TipCardProps {
  /** Daily tip payload from `GET /api/education/tip`. `null` renders the empty state. */
  tip?: Tip | null;
  /** Shows the skeleton surface while the tip request is in flight. */
  isLoading?: boolean;
  className?: string;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatTipDate(createdAt: string | undefined): string | null {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return null;
  return DATE_FORMATTER.format(date);
}

/**
 * Daily alpha tip card for the Learn page and dashboard sidebar.
 *
 * Renders a teal-accented glass surface for the tip returned by the education
 * API. The component owns its presentation states so callers can render it
 * unconditionally:
 * - `isLoading` → pulsing skeleton with an accessible busy status
 * - missing/`null` tip → friendly empty state
 *
 * The tip data contract (`Tip` from `../../types/education`) is unchanged.
 */
export const TipCard = ({ tip, isLoading = false, className }: TipCardProps) => {
  if (isLoading) {
    return (
      <article
        className={cn(
          'glass-card accent-border-teal relative overflow-hidden rounded-2xl p-6',
          className,
        )}
        role="status"
        aria-busy="true"
        aria-label="Loading daily tip"
      >
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 animate-pulse rounded-xl bg-xelma-teal/10" />
          <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="mt-5 space-y-2.5">
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/10" />
          <div className="h-3 w-full animate-pulse rounded-full bg-white/5" />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-white/5" />
        </div>
        <span className="sr-only">Loading daily tip…</span>
      </article>
    );
  }

  if (!tip) {
    return (
      <article
        className={cn(
          'glass-card relative overflow-hidden rounded-2xl border-dashed p-6 text-center',
          className,
        )}
        aria-label="Daily tip unavailable"
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-xl border border-xelma-teal/20 bg-xelma-teal/10">
          <Lightbulb className="size-6 text-xelma-teal" aria-hidden="true" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-white">No tip today</h3>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-400">
          The daily alpha is on its way. Check back soon for a fresh insight from the Xelma
          educators.
        </p>
      </article>
    );
  }

  const title = tip.title?.trim() || 'Daily Alpha Tip';
  const formattedDate = formatTipDate(tip.createdAt);
  const titleId = `tip-title-${tip.id}`;

  return (
    <article
      className={cn(
        'glass-card accent-border-teal group relative overflow-hidden rounded-2xl p-6',
        'transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(6,182,212,0.16)]',
        className,
      )}
      aria-labelledby={titleId}
    >
      {/* Accent top line */}
      <div
        aria-hidden="true"
        className="absolute -inset-x-px -top-px h-1 bg-gradient-to-r from-xelma-teal via-xelma-teal/60 to-transparent"
      />

      <header className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-xelma-teal/20 bg-xelma-teal/10 text-xelma-teal transition-transform duration-300 group-hover:scale-105">
          <Sparkles className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-xelma-teal">
            Daily Alpha Tip
          </p>
          <h3 id={titleId} className="mt-1 text-lg font-bold leading-snug text-white">
            {title}
          </h3>
        </div>
        {tip.category ? (
          <span className="shrink-0 rounded-full border border-xelma-teal/20 bg-xelma-teal/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-xelma-teal">
            {tip.category}
          </span>
        ) : null}
      </header>

      <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-300">
        {tip.content}
      </p>

      {formattedDate ? (
        <footer className="mt-5 flex items-center gap-1.5 border-t border-white/5 pt-3 text-xs text-gray-400">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          <time dateTime={tip.createdAt}>{formattedDate}</time>
        </footer>
      ) : null}
    </article>
  );
};

export default TipCard;
