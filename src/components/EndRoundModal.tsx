import { useEffect, useRef, useState } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { MODAL_OVERLAY, MODAL_CONTENT } from '../utils/motion';

export interface EndRoundResult {
  isWin?: boolean;
  amount?: number;
  tip?: string;
  asset?: string;
  direction?: string;
}

interface EndRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  result?: EndRoundResult;
  playResolveSound?: boolean;
}

const DEFAULT_TIP = 'Stay tuned for the next round.';

const WIN_TITLE = 'Spectacular Win!';
const WIN_DESCRIPTION = 'You made all the right moves.';
const LOSS_TITLE = 'Tough Break';
const LOSS_DESCRIPTION = 'The market moved against you.';

function formatNetResult(isWin: boolean, amount: number) {
  return `${isWin ? '+' : '-'}$${Math.abs(amount).toFixed(2)}`;
}

function formatShareText(
  isWin: boolean,
  amount: number,
  tip: string,
  asset?: string,
) {
  const outcome = isWin ? 'WIN' : 'LOSS';
  const assetPart = asset ? ` ${asset}` : '';
  return `Xelma round result: ${outcome}${assetPart} ${formatNetResult(isWin, amount)} — "${tip}"`;
}

/**
 * End-of-round result modal — dark glass terminal theme (no light cards).
 *
 * - Focus is trapped inside the dialog, initial focus lands on the Continue
 *   CTA, Escape closes, and focus returns to the trigger on close.
 * - Win/loss is announced via a polite aria-live region.
 * - Share uses the Web Share API when available and falls back to the
 *   clipboard; decorative motion is skipped for reduced-motion users.
 */
export default function EndRoundModal({
  isOpen,
  onClose,
  result,
  playResolveSound = false,
}: EndRoundModalProps) {
  const {
    isWin = false,
    amount = 0,
    tip = DEFAULT_TIP,
    asset,
    direction,
  } = result ?? {};

  const { reduced } = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const continueRef = useRef<HTMLButtonElement | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');

  // Trap Tab focus, close on Escape, focus the Continue CTA on open, and
  // restore focus to the trigger on close.
  useFocusTrap(dialogRef, {
    active: isOpen,
    onEscape: onClose,
    initialFocusRef: continueRef,
  });

  // Lock background scroll while the modal is open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !playResolveSound) return;
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
    const audio = new Audio('/sounds/round-resolved.mp3');
    audio.play().catch(() => {});
    return () => {
      audio.pause();
    };
  }, [isOpen, playResolveSound]);

  // Reset the transient "Copied" share label when the modal (re)opens.
  useEffect(() => {
    if (isOpen) setShareState('idle');
  }, [isOpen]);

  const shareText = formatShareText(isWin, amount, tip, asset);

  const handleShare = async () => {
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text?: string }) => Promise<void>;
      canShare?: (data: { text?: string }) => boolean;
    };

    try {
      if (typeof nav.share === 'function') {
        const shareData = { title: 'Xelma', text: shareText };
        if (typeof nav.canShare === 'function' && !nav.canShare(shareData)) {
          throw new Error('Web Share not supported for this payload');
        }
        await nav.share(shareData);
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setShareState('copied');
        window.setTimeout(() => setShareState('idle'), 2000);
        return;
      }
    } catch {
      // User dismissed the share sheet or the share failed — fail silently
      // rather than surfacing an error for an optional nicety.
    }
  };

  if (!isOpen) return null;

  const title = isWin ? WIN_TITLE : LOSS_TITLE;
  const description = isWin ? WIN_DESCRIPTION : LOSS_DESCRIPTION;
  const formattedAmount = formatNetResult(isWin, amount);
  const announcement = isOpen
    ? isWin
      ? `Round result: win. Net gain plus $${Math.abs(amount).toFixed(2)}. ${tip}`
      : `Round result: loss. Net loss minus $${Math.abs(amount).toFixed(2)}. ${tip}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="end-round-modal">
      {announcement && (
        <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
          {announcement}
        </div>
      )}

      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/85 backdrop-blur-md ${reduced ? '' : MODAL_OVERLAY}`}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Dark glass terminal card */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="end-round-modal-title"
        aria-describedby="end-round-modal-description"
        tabIndex={-1}
        style={{
          borderColor: isWin ? 'rgba(52, 211, 153, 0.3)' : 'rgba(251, 113, 133, 0.28)',
          boxShadow: isWin
            ? '0 0 40px rgba(16, 185, 129, 0.12), 0 24px 64px rgba(0, 0, 0, 0.6)'
            : '0 0 40px rgba(244, 63, 94, 0.1), 0 24px 64px rgba(0, 0, 0, 0.6)',
        }}
        className={`glass-card relative z-10 w-full max-w-md rounded-2xl bg-[#0A0F1A]/90 p-6 sm:p-8 ${reduced ? '' : MODAL_CONTENT}`}
      >
        {/* Terminal accent hairline */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
          style={{
            background: isWin
              ? 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.6), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(244, 63, 94, 0.55), transparent)',
          }}
        />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close result"
          data-testid="end-round-close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* Terminal header row */}
        <div className="flex items-center justify-between gap-3 pr-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-gray-500">
            round result
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-widest ${
              isWin
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-400/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            <span
              aria-hidden="true"
              className={`status-dot ${isWin ? 'status-dot-live' : 'status-dot-urgent'} ${reduced ? '[animation:none]' : ''}`}
            />
            {isWin ? 'Win' : 'Loss'}
          </span>
        </div>

        <h2
          id="end-round-modal-title"
          className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl"
        >
          {title}
        </h2>
        <p id="end-round-modal-description" className="mt-1.5 text-sm text-gray-400">
          {description}
        </p>

        {/* Net result panel */}
        <div className="mt-6 rounded-xl border border-white/10 bg-black/40 px-4 py-5">
          <p className="text-center font-mono text-[10px] uppercase tracking-[0.3em] text-gray-500">
            net p&amp;l
          </p>
          <p
            className={`mt-2 text-center font-mono text-4xl font-black tabular-nums ${
              isWin ? 'text-emerald-300' : 'text-rose-300'
            }`}
            data-testid="end-round-amount"
          >
            {formattedAmount}
          </p>
          {(asset || direction) && (
            <p className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-gray-500">
              {asset ? <span>asset {asset}</span> : null}
              {asset && direction ? <span aria-hidden="true"> · </span> : null}
              {direction ? <span>dir {direction}</span> : null}
            </p>
          )}
        </div>

        {/* Tip */}
        <p className="mt-4 font-mono text-xs leading-relaxed text-gray-400">
          <span aria-hidden="true" className="text-[#22d3ee]">
            {'> '}
          </span>
          {tip}
        </p>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            ref={continueRef}
            onClick={onClose}
            data-testid="continue-next-round"
            className="btn-primary w-full rounded-xl py-3.5 text-base font-bold min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
          >
            Continue to Next Round
          </button>
          <button
            type="button"
            onClick={() => {
              void handleShare();
            }}
            data-testid="share-result"
            className="btn-ghost w-full rounded-xl py-2.5 font-mono text-xs font-semibold uppercase tracking-widest min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
          >
            {shareState === 'copied' ? 'Copied to clipboard' : 'Share result'}
          </button>
        </div>
      </div>
    </div>
  );
}
