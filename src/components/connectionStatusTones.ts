import type { ConnectionStatus } from '../lib/socket';

/**
 * Dark HUD chip tones shared by the full status badge and the compact header
 * indicator (#938). Keeping them in one module means a status can never look
 * different in the two places, and tests can assert against the same source.
 *
 * This lives outside ConnectionStatus.tsx because that file exports React
 * components: react-refresh/only-export-components forbids non-component
 * exports from the same module.
 */
export const STATUS_TONES: Record<ConnectionStatus, { chip: string; dot: string }> = {
  connected: {
    chip: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    dot: 'bg-emerald-400',
  },
  connecting: {
    chip: 'border-sky-500/30 bg-sky-500/10 text-sky-300',
    dot: 'bg-sky-400 animate-pulse',
  },
  reconnecting: {
    chip: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    dot: 'bg-amber-400 animate-pulse',
  },
  disconnected: {
    chip: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    dot: 'bg-rose-500',
  },
};

/** Defensive fallback for an unexpected runtime status value. */
export const DEFAULT_STATUS_TONE = STATUS_TONES.disconnected;

/** Shared reconnect CTA styling; both callers add their own size/text classes. */
export const STATUS_CTA_CLASSES =
  'rounded border border-white/10 bg-white/5 transition-colors hover:bg-white/10';
