import { Clock, Lightbulb } from 'lucide-react';
import type { Tip } from '../../types/education';
import { cn } from '../../lib/utils';

interface TipCardProps {
  tip: Tip;
  className?: string;
}

/**
 * Daily alpha tip card — the glass education surface shared by the Dashboard
 * sidebar and the Learn page.
 *
 * Renders:
 * - Glass card chrome with the teal accent border (dark terminal system)
 * - Lightbulb badge, "Daily Alpha" eyebrow and optional category chip
 * - Tip title as the accessible `aria-labelledby` target (falls back to
 *   "Daily Alpha Tip" when the API omits a title)
 * - Tip content and, when `createdAt` parses, a publication date
 *
 * Loading/empty/error chrome for this surface lives in the caller
 * (Dashboard's DailyTip), which owns the educationApi fetch + cache.
 */
export const TipCard = ({ tip, className }: TipCardProps) => {
  const heading = tip.title?.trim() || 'Daily Alpha Tip';
  const publishedAt = new Date(tip.createdAt);
  const hasDate = !Number.isNaN(publishedAt.getTime());

  return (
    <article
      data-testid="tip-card"
      className={cn('glass-card accent-border-teal rounded-2xl p-5', className)}
      aria-labelledby={`tip-title-${tip.id}`}
    >
      <div className="flex items-center gap-3">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-xelma-teal/25 bg-xelma-teal/10 text-xelma-teal-bright"
          aria-hidden="true"
        >
          <Lightbulb className="h-4 w-4" />
        </span>
        <p className="min-w-0 flex-1 text-xs font-semibold uppercase tracking-wider text-xelma-teal">
          Daily Alpha
        </p>
        {tip.category ? (
          <span className="shrink-0 rounded-full border border-xelma-teal/20 bg-xelma-teal/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-xelma-teal">
            {tip.category}
          </span>
        ) : null}
      </div>

      <h3
        id={`tip-title-${tip.id}`}
        className="mt-3 text-base font-bold leading-snug text-white"
      >
        {heading}
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-gray-300">{tip.content}</p>

      {hasDate ? (
        <div className="mt-4 flex items-center gap-1.5 border-t border-white/5 pt-3 text-xs text-gray-400">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <time dateTime={tip.createdAt}>
            {publishedAt.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </time>
        </div>
      ) : null}
    </article>
  );
};
