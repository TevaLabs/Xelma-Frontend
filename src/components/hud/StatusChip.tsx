import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type ChipStatus = 'active' | 'inactive' | 'loading' | 'error' | 'warning' | 'info';

export interface StatusChipProps {
  label: string;
  value?: string;
  status: ChipStatus;
  /** Overrides the spoken state, e.g. "Live" or "Not connected". */
  statusText?: string;
  icon?: ReactNode;
  className?: string;
}

/**
 * Dark terminal glass palette. Colour is never the only carrier of meaning:
 * every chip also speaks its state to assistive tech.
 */
const CHIP_META: Record<ChipStatus, { shell: string; dot: string; text: string }> = {
  active: {
    shell: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300',
    dot: 'status-dot status-dot-live',
    text: 'Active',
  },
  inactive: {
    shell: 'border-white/10 bg-white/5 text-gray-400',
    dot: 'status-dot bg-gray-500',
    text: 'Idle',
  },
  loading: {
    shell: 'border-[#2C4BFD]/40 bg-[#2C4BFD]/15 text-[#BEC7FE]',
    dot: 'status-dot status-dot-yellow',
    text: 'Working',
  },
  error: {
    shell: 'border-rose-500/40 bg-rose-500/10 text-rose-300',
    dot: 'status-dot status-dot-urgent',
    text: 'Error',
  },
  warning: {
    shell: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    dot: 'status-dot status-dot-yellow',
    text: 'Warning',
  },
  info: {
    shell: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300',
    dot: 'status-dot status-dot-green',
    text: 'Info',
  },
};

export const StatusChip = ({
  label,
  value,
  status,
  statusText,
  icon,
  className = '',
}: StatusChipProps) => {
  const meta = CHIP_META[status];
  const spokenStatus = statusText ?? meta.text;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-200',
        meta.shell,
        className,
      )}
      data-status={status}
      data-testid={`status-chip-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {icon ? (
        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      ) : (
        <span className={cn('shrink-0', meta.dot)} aria-hidden="true" />
      )}
      <span className="text-[11px] font-semibold uppercase tracking-wide">{label}</span>
      {value && <span className="font-mono text-[11px] font-semibold">{value}</span>}
      <span className="sr-only">{`: ${spokenStatus}`}</span>
    </span>
  );
};

export default StatusChip;
