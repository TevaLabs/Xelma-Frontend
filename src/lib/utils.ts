import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a vXLM balance with consistent decimal places and K/M suffixes.
 * Values >= 1 000 000 are shown as "X.XXM vXLM".
 * Values >= 1 000 are shown as "X.XXK vXLM".
 * Otherwise shown as "X.XX vXLM".
 */
export function formatVXLM(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "0.00 vXLM";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(decimals)}M vXLM`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(decimals)}K vXLM`;
  }
  return `${sign}${abs.toFixed(decimals)} vXLM`;
}

/**
 * Format a ratio (0–1) as a percentage string with a fixed number of decimal
 * places. Pass a plain fraction, e.g. formatPercent(0.4567) → "45.67%".
 */
export function formatPercent(ratio: number, decimals = 2): string {
  if (!Number.isFinite(ratio)) return "0.00%";
  return `${(ratio * 100).toFixed(decimals)}%`;
}

/**
 * Format a large number using K/M suffixes without a currency unit.
 * Useful for generic counts (pool size, prediction counts, etc.).
 */
export function formatCompactNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(decimals)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(decimals)}K`;
  }
  return `${sign}${abs.toFixed(decimals)}`;
}

/**
 * Format a date as a relative time string (e.g. "just now", "5m ago", "3h ago", "2d ago").
 * Falls back to toLocaleDateString for dates older than 30 days.
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return "just now";

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
