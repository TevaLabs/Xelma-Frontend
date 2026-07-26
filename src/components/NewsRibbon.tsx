import ContributorTaskPlaceholder from './ContributorTaskPlaceholder';
import './NewsRibbon.css';

export interface NewsRibbonProps {
  onClose?: () => void;
}

/**
 * STUBBED for Stellar Wave hackathon — rebuild dismissible news marquee.
 * Preserve dismiss callback, pause-on-hover, and prefers-reduced-motion.
 */
export function NewsRibbon({ onClose }: NewsRibbonProps) {
  return (
    <div className="news-ribbon" role="region" aria-label="News updates">
      <ContributorTaskPlaceholder
        title="Rebuild News Ribbon"
        issueHint="Implement a dismissible Stellar/market news marquee with pause-on-hover and reduced-motion support. Call onClose when dismissed."
      >
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5"
          >
            Dismiss (stub)
          </button>
        ) : null}
      </ContributorTaskPlaceholder>
    </div>
  );
}

export default NewsRibbon;
