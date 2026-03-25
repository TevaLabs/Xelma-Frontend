import { Lightbulb, Sparkles } from "lucide-react";
import type { Tip } from "../../types/education";
import { cn } from "../../lib/utils";

interface TipCardProps {
    tip: Tip;
    className?: string;
}

export const TipCard = ({ tip, className }: TipCardProps) => {
    return (
        <article
            className={cn(
                "relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-600 to-blue-700 p-6 text-white shadow-lg",
                className
            )}
            aria-labelledby={`tip-title-${tip.id}`}
        >
            <div className="absolute -right-4 -top-4 text-white/10 pointer-events-none" aria-hidden>
                <Sparkles size={120} />
            </div>

            <div className="relative flex flex-col gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm" aria-hidden>
                    <Lightbulb className="h-6 w-6 text-yellow-300" />
                </div>

                <div>
                    <h3
                        id={`tip-title-${tip.id}`}
                        className="text-lg font-bold text-white uppercase tracking-wider mb-1"
                    >
                        {tip.title || "Daily Alpha Tip"}
                    </h3>
                    <p className="text-xl font-medium leading-relaxed text-white">
                        <span className="sr-only">Tip: </span>
                        &ldquo;{tip.content}&rdquo;
                    </p>
                </div>

                {tip.category && (
                    <div className="mt-2">
                        <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                            #{tip.category}
                        </span>
                    </div>
                )}
            </div>
        </article>
    );
};
