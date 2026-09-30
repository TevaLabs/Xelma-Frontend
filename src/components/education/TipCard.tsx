import { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';
import type { Tip } from '../../types/education';
import { cn } from '../../lib/utils';

interface TipCardProps {
  tip: Tip;
  className?: string;
  /**
   * Optional parent-owned dismissal. When provided, the dismiss button calls
   * this instead of (in addition to) hiding locally — lets a caller persist
   * "dismissed today" however it likes. When omitted, dismissal is purely
   * local component state (current Dashboard call site doesn't pass one; the
   * card unmounts anyway next time `DailyTip re-fetches a different tip).
   */
  onDismiss?: () => void;
}

const READ_MORE_THRESHOLD = 180;

/**
 * Glass "daily alpha tip" card. Mirrors the app's established glass-panel
 * aesthetic (see `SorobanInspectorPanel` / `.glass-card` + `.accent-border-teal`
 * in index.css) with a teal accent, since the tip surface already opts into
 * `accent-border-teal` at its Dashboard call site (`DailyTip`'s loading
 * skeleton uses the same classes).
 */
export const TipCard = ({ tip, className, onDismiss }: TipCardProps) => {
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed) return null;

  const isLong = tip.content.length > READ_MORE_THRESHOLD;
  const body = expanded || !isLong ? tip.content : `${tip.content.slice(0, READ_MORE_THRESHOLD).trimEnd()}…`;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <article
      className={cn(
        'glass-card accent-border-teal relative rounded-2xl p-6',
        className,
      )}
      aria-labelledby={`tip-title-${tip.id}`}
    >
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss daily tip"
        className="absolute right-3 top-3 rounded-md p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-xelma-teal-bright"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-xelma-teal/15 text-xelma-teal-bright">
          <Lightbulb className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-xelma-teal-bright">
            Daily alpha tip
          </p>
          <h3 id={`tip-title-${tip.id}`} className="mt-1 text-sm font-bold text-white">
            {tip.title || 'Daily Alpha Tip'}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">{body}</p>

          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-2 text-xs font-semibold text-xelma-teal-bright underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-xelma-teal-bright"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
