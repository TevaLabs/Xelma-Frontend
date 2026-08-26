import { useState } from 'react';
import { Clock, BookOpen } from 'lucide-react';
import type { Guide } from '../../types/education';
import { cn } from '../../lib/utils';

interface GuideCardProps {
  guide: Guide;
  className?: string;
}

/**
 * Learn page guide card displaying full guide metadata.
 *
 * Renders:
 * - Image thumbnail with gradient fallback on load error or missing URL
 * - Category chip with brand teal styling
 * - Guide title (linked via accessible `aria-labelledby`)
 * - Description excerpt
 * - Read time with Clock icon
 * - Hover lift with enhanced glow and keyboard focus ring
 *
 * The `aria-labelledby` reference matches the title element so assistive
 * tech can identify each card naturally.
 */
export const GuideCard = ({ guide, className }: GuideCardProps) => {
  const [imageError, setImageError] = useState(false);

  const hasImage = Boolean(guide.imageUrl) && !imageError;

  return (
    <article
      tabIndex={0}
      className={cn(
        'glass-card group relative flex flex-col rounded-2xl p-5 transition-all duration-300',
        'hover:-translate-y-1 hover:border-xelma-teal/35 hover:shadow-[0_8px_32px_rgba(6,182,212,0.12)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xelma-teal focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]',
        className,
      )}
      aria-labelledby={`guide-title-${guide.id}`}
    >
      {/* Image / Fallback */}
      <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-xl bg-[#111827]/60">
        {hasImage ? (
          <img
            src={guide.imageUrl}
            alt=""
            loading="lazy"
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-xelma-blue/10 via-xelma-teal/5 to-transparent"
            aria-hidden="true"
          >
            <BookOpen className="h-8 w-8 text-xelma-teal/40" />
          </div>
        )}
      </div>

      {/* Category chip */}
      <span className="inline-block w-fit rounded-full border border-xelma-teal/20 bg-xelma-teal/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-xelma-teal">
        {guide.category}
      </span>

      {/* Title */}
      <h3
        id={`guide-title-${guide.id}`}
        className="mt-3 text-lg font-bold leading-snug text-white"
      >
        {guide.title}
      </h3>

      {/* Description */}
      {guide.description ? (
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-400">
          {guide.description}
        </p>
      ) : null}

      {/* Spacer pushes read time to the bottom */}
      <div className="flex-1" />

      {/* Read time */}
      <div className="mt-4 flex items-center gap-1.5 text-sm text-gray-400">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{guide.readTime}</span>
      </div>
    </article>
  );
};
