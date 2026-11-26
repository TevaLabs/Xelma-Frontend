import { cn } from "../../lib/utils";
import type { ReactNode } from "react";

/**
 * Canonical panel header for dashboard modules.
 *
 * This is the ONLY PanelHeader implementation in the codebase — import it from
 * `src/components/ui/PanelHeader`. A legacy root-level
 * `src/components/PanelHeader.tsx` (with an `actions` prop) used to exist; its
 * API is folded in here (`actions` is accepted as a deprecated alias of
 * `action`) so there is a single API to maintain.
 *
 * Variants:
 * - `default`: icon + title (+ optional status pill) + subtitle on the left,
 *   action slot on the right.
 * - `hero`: centered page-level headline with optional subtitle and action.
 */

export type PanelHeaderStatusVariant =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "default";

export interface PanelHeaderStatus {
  label: string;
  variant?: PanelHeaderStatusVariant;
}

export type PanelHeaderHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface PanelHeaderProps {
  /** Main title displayed prominently. */
  title: string;
  /** Optional secondary line rendered beneath the title. */
  subtitle?: string;
  /** Optional leading visual (asset badge, icon, …). Ignored by `hero`. */
  icon?: ReactNode;
  /** Optional trailing slot for buttons, menus, filters, … */
  action?: ReactNode;
  /**
   * @deprecated Use `action`. Kept for compatibility with the removed
   * root-level PanelHeader API. `action` wins when both are provided.
   */
  actions?: ReactNode;
  /** Optional status pill rendered next to the title. Ignored by `hero`. */
  status?: PanelHeaderStatus;
  className?: string;
  variant?: "default" | "hero";
  /**
   * Heading level used for the title. Defaults to `3` for `default` and `1`
   * for `hero`, preserving existing document outlines.
   */
  headingLevel?: PanelHeaderHeadingLevel;
}

const statusStyles: Record<PanelHeaderStatusVariant, string> = {
  success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-amber-500/30",
  error: "bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-rose-500/30",
  info: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 ring-cyan-500/30",
  default: "bg-gray-500/15 text-gray-700 dark:text-gray-300 ring-gray-500/30",
};

const statusDotStyles: Record<PanelHeaderStatusVariant, string> = {
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
  actions,
  status,
  className,
  variant = "default",
  headingLevel,
}: PanelHeaderProps) {
  const actionSlot = action ?? actions;

  if (variant === "hero") {
    const Heading = `h${headingLevel ?? 1}` as const;
    return (
      <div className={cn("flex flex-col items-center gap-8", className)}>
        <Heading className="hero-headline text-3xl sm:text-4xl font-extrabold text-white text-center tracking-tight">
          {title}
        </Heading>
        {subtitle && (
          <p className="text-sm text-gray-400 text-center">{subtitle}</p>
        )}
        {actionSlot && <div>{actionSlot}</div>}
      </div>
    );
  }

  const Heading = `h${headingLevel ?? 3}` as const;
  const statusVariant = status?.variant ?? "default";

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Heading className="font-bold text-gray-900 dark:text-white text-lg truncate">
              {title}
            </Heading>
            {status && (
              <span
                data-testid="panel-header-status"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 whitespace-nowrap",
                  statusStyles[statusVariant],
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("h-1.5 w-1.5 rounded-full", statusDotStyles[statusVariant])}
                />
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
      {actionSlot && (
        <div className="flex items-center gap-2 shrink-0">{actionSlot}</div>
      )}
    </div>
  );
}

export default PanelHeader;
