import type { Tip } from '../../types/education';
import { cn } from '../../lib/utils';
import GlassCard from '../ui/GlassCard';

interface TipCardProps {
  tip: Tip;
  className?: string;
}

/**
 * Daily tip card matching the existing dark terminal glass design system.
 * Displays educational tip with teal accent border styling.
 */
export const TipCard = ({ tip, className }: TipCardProps) => {
  return (
    <GlassCard
      as="article"
      className={cn('rounded-2xl accent-border-teal p-6', className)}
      aria-labelledby={`tip-title-${tip.id}`}
    >
      <h3 id={`tip-title-${tip.id}`} className="sr-only">
        {tip.title || 'Daily Alpha Tip'}
      </h3>
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-2xl" aria-hidden>
          💡
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-300">Daily Alpha Tip</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">{tip.content}</p>
        </div>
      </div>
    </GlassCard>
  );
};
