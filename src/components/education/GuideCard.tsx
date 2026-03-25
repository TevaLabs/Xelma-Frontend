import { BookOpen, Clock, ChevronRight } from "lucide-react";
import type { Guide } from "../../types/education";
import { cn } from "../../lib/utils";

interface GuideCardProps {
    guide: Guide;
    className?: string;
}

export const GuideCard = ({ guide, className }: GuideCardProps) => {
    return (
        <article
            className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-[#2C4BFD]/30 dark:hover:border-[#2C4BFD]/50",
                className
            )}
            aria-labelledby={`guide-title-${guide.id}`}
        >
            <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                {guide.imageUrl ? (
                    <img
                        src={guide.imageUrl}
                        alt={guide.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                        <BookOpen className="h-10 w-10 text-blue-500/50" aria-hidden />
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-5">
                <div className="mb-3 flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                        {guide.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Clock className="h-3 w-3 shrink-0" aria-hidden />
                        {guide.readTime}
                    </span>
                </div>

                <h3
                    id={`guide-title-${guide.id}`}
                    className="mb-2 text-xl font-bold text-gray-900 dark:text-white group-hover:text-[#2C4BFD] transition-colors"
                >
                    {guide.title}
                </h3>

                <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {guide.description}
                </p>

                <div className="mt-auto flex items-center justify-between gap-2">
                    <a
                        href={guide.externalLink || "#"}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#2C4BFD] hover:underline rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                        aria-label={guide.externalLink ? `Read guide: ${guide.title} (opens in a new tab)` : `Read guide: ${guide.title}`}
                        target={guide.externalLink ? "_blank" : undefined}
                        rel={guide.externalLink ? "noopener noreferrer" : undefined}
                    >
                        Read Guide
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </a>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-500 font-bold tabular-nums">
                        {new Date(guide.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </span>
                </div>
            </div>
        </article>
    );
};
