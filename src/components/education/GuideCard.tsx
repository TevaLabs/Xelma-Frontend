import ContributorTaskPlaceholder from './ContributorTaskPlaceholder';
import type { Guide } from '../../types/education';
import { cn } from '../../lib/utils';

interface GuideCardProps {
  guide: Guide;
  className?: string;
}

/**
 * STUBBED for Stellar Wave hackathon — rebuild Learn guide card.
 * Keep guide data contract; rebuild image/category/title/read-time chrome.
 */
export const GuideCard = ({ guide, className }: GuideCardProps) => {
  return (
    <article
      className={cn('rounded-2xl', className)}
      aria-labelledby={`guide-title-${guide.id}`}
    >
      <h3 id={`guide-title-${guide.id}`} className="sr-only">
        {guide.title}
      </h3>
      <ContributorTaskPlaceholder
        title="Rebuild Guide Card"
        issueHint={`Restore glass-card layout for guide "${guide.title}" (${guide.category}). Include image/fallback, read time, and hover affordance.`}
      />
    </article>
  );
};
