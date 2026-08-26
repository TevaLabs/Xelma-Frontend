import { Loader2, AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  NoRoundsIllustration,
  NoHistoryIllustration,
  OfflineIllustration,
} from "../icons/StellarIllustrations";

interface LoadingProps {
    message?: string;
    className?: string;
    variant?: "spinner" | "skeleton";
    skeletonLines?: number;
    dark?: boolean;
}

export const LoadingState = ({ message = "Loading content...", className, variant = "spinner", skeletonLines = 3 }: LoadingProps) => {
    if (variant === "skeleton") {
        return (
            <div className={cn("space-y-4 p-4", className)}>
                <div className={cn("h-4 rounded-full animate-pulse bg-white/5 border border-white/5")} style={{ width: "50%" }} />
                {Array.from({ length: skeletonLines }).map((_, i) => (
                    <div
                        key={i}
                        className={cn("h-4 rounded animate-pulse bg-white/5 border border-white/5")}
                        style={{ width: i === skeletonLines - 1 ? "75%" : "100%" }}
                    />
                ))}
                {message ? (
                    <p className="mt-2 text-sm text-gray-400">{message}</p>
                ) : null}
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col items-center justify-center p-12 text-center min-h-[200px]", className)}>
            <Loader2 className={cn("h-10 w-10 animate-spin mb-4 text-xelma-blue")} />
            <p className="font-medium text-gray-400">{message}</p>
        </div>
    );
};

interface ErrorProps {
    message: string;
    onRetry?: () => void;
    className?: string;
    title?: string;
    variant?: "default" | "dark";
}

export const ErrorState = ({ message, onRetry, className, title = "Oops! Something went wrong" }: ErrorProps) => {
    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-12 text-center rounded-2xl min-h-[200px] border border-red-500/20 bg-red-950/10 backdrop-blur-sm shadow-[0_0_24px_rgba(239,68,68,0.05)]",
            className
        )}>
            <AlertCircle className="h-10 w-10 mb-4 text-red-400" />
            <h3 className="text-lg font-bold mb-2 text-white">{title}</h3>
            <p className="mb-6 max-w-md text-red-200/80 text-sm">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 rounded-xl bg-white text-gray-950 px-6 py-2.5 text-sm font-bold transition-all hover:scale-[1.02] hover:bg-gray-100 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                </button>
            )}
        </div>
    );
};

const variantIllustrations = {
  "no-rounds": NoRoundsIllustration,
  "no-history": NoHistoryIllustration,
  offline: OfflineIllustration,
} as const;

type EmptyVariant = keyof typeof variantIllustrations;

interface EmptyProps {
    title: string;
    message: string;
    icon?: React.ReactNode;
    className?: string;
    variant?: EmptyVariant;
}

export const EmptyState = ({ title, message, icon, className, variant }: EmptyProps) => {
    const Illustration = variant ? variantIllustrations[variant] : null;
    const iconElement = icon ?? (
      Illustration
        ? <Illustration className="mb-4" />
        : <Inbox className="h-12 w-12 text-gray-500 mb-4" />
    );

    return (
        <div className={cn("flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-white/10 bg-[#111827]/40 backdrop-blur-sm min-h-[200px]", className)}>
            {iconElement}
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 max-w-sm text-sm">{message}</p>
        </div>
    );
};
