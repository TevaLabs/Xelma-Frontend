import { cn } from "../../lib/utils";
import type { ReactNode } from "react";

interface PanelHeaderStatus {
  label: string;
  variant?: "success" | "warning" | "error" | "info" | "default";
}

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  status?: PanelHeaderStatus;
  className?: string;
  variant?: "default" | "hero";
}

const statusStyles: Record<string, string> = {
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",
  error: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
  info: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 ring-cyan-500/30",
  default: "bg-gray-500/15 text-gray-700 dark:text-gray-300 ring-gray-500/30",
};

const statusDotStyles: Record<string, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-400 animate-pulse",
  error: "bg-rose-500",
  info: "bg-cyan-500",
  default: "bg-gray-500",
};

export function PanelHeader({
  title,
  subtitle,
  icon,
  action,
  status,
  className,
  variant = "default",
}: PanelHeaderProps) {
  if (variant === "hero") {
    return (
      <div className={cn("flex flex-col items-center gap-8", className)}>
        <h1 className="hero-headline text-3xl sm:text-4xl font-extrabold text-white text-center tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-gray-400 text-center">{subtitle}</p>
        )}
        {action && <div>{action}</div>}
      </div>
    );
  }

  const statusClass = status ? statusStyles[status.variant ?? "default"] : "";
  const dotClass = status ? statusDotStyles[status.variant ?? "default"] : "";

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg truncate">
              {title}
            </h3>
            {status && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 whitespace-nowrap",
                  statusClass,
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
                {status.label}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex items-center gap-2 shrink-0">{action}</div>
      )}
    </div>
  );
}

export default PanelHeader;
