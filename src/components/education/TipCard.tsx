import ContributorTaskPlaceholder from '../ContributorTaskPlaceholder';
import type { Tip } from '../../types/education';
import { cn } from '../../lib/utils';

interface TipCardProps {
  tip: Tip;
  className?: string;
}

/**
 * STUBBED for Stellar Wave hackathon — rebuild daily tip card.
 * Keep tip data contract; rebuild teal accent glass styling.
 */
export const TipCard = ({ tip, className }: TipCardProps) => {
  return (
    <article
      className={cn('rounded-2xl', className)}
      aria-labelledby={`tip-title-${tip.id}`}
    >
      <h3 id={`tip-title-${tip.id}`} className="sr-only">
        {tip.title || 'Daily Alpha Tip'}
      </h3>
      <ContributorTaskPlaceholder
        title="Rebuild Tip Card"
        issueHint={`Restore TipCard chrome for: "${tip.content.slice(0, 80)}${tip.content.length > 80 ? '…' : ''}"`}
      />
    </article>
  );
};
