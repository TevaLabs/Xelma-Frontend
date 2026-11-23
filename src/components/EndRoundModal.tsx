import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Share2, TrendingDown, TrendingUp, X } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { MODAL_CONTENT, MODAL_OVERLAY } from '../utils/motion';

interface EndRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  result?: {
    isWin?: boolean;
    amount?: number;
    tip?: string;
    asset?: string;
    direction?: string;
  };
  playResolveSound?: boolean;
}

/**
 * Dark terminal end-of-round modal.
 *
 * Accessibility:
 * - Radix Dialog provides the modal focus trap (Tab and Shift+Tab cycle within
 *   the dialog) and restores focus to the trigger on close.
 * - Win/loss outcomes are announced through a polite `aria-live` region.
 * - Motion is skipped entirely when the user prefers reduced motion.
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
    tip = 'Stay tuned for the next round.',
    asset,
    direction,
  } = result ?? {};
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);
  const [shareStatus, setShareStatus] = useState('');
  const { reduced: prefersReducedMotion } = useReducedMotion();

  const formattedAmount = Math.abs(amount).toFixed(2);
  const outcomeLabel = isWin ? 'win' : 'loss';

  const resultAnnouncement = isOpen
    ? isWin
      ? `Round result: win. Net gain plus $${formattedAmount}. ${tip}`
      : `Round result: loss. Net loss minus $${formattedAmount}. ${tip}`
    : '';

  const shareText = useMemo(() => {
    const position = [asset, direction].filter(Boolean).join(' · ');
    const headline = `Xelma round result: ${outcomeLabel.toUpperCase()} ${
      isWin ? '+' : '-'
    }$${formattedAmount}${position ? ` (${position})` : ''}.`;
    return `${headline} ${tip}`;
  }, [asset, direction, formattedAmount, isWin, outcomeLabel, tip]);

  useEffect(() => {
    if (!isOpen || !playResolveSound) return;
    // TODO: add audio asset
    const audio = new Audio('/sounds/round-resolved.mp3');
    audio.play().catch(() => {});
    return () => {
      audio.pause();
    };
  }, [isOpen, playResolveSound]);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      return;
    }

    const previouslyFocused = previouslyFocusedRef.current;
    if (previouslyFocused?.isConnected) {
      window.setTimeout(() => previouslyFocused.focus(), 0);
    }
  }, [isOpen]);

  const handleShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: 'Xelma round result', text: shareText });
        setShareStatus('Round result shared.');
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setShareStatus('Round result copied to clipboard.');
        return;
      }

      setShareStatus('Sharing is not supported in this browser.');
    } catch (error) {
      // The user dismissing the native share sheet is not an error.
      if (error instanceof Error && error.name === 'AbortError') return;
      setShareStatus('Could not share the round result. Try again.');
    }
  };

  const title = isWin ? 'Spectacular Win!' : 'Tough Break';
  const description = isWin
    ? 'You made all the right moves.'
    : 'The market moved against you.';

  const overlayMotion = prefersReducedMotion ? '' : MODAL_OVERLAY;
  const contentMotion = prefersReducedMotion ? '' : MODAL_CONTENT;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setShareStatus('');
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={`fixed inset-0 z-40 bg-black/85 backdrop-blur-md ${overlayMotion}`}
        />
        <Dialog.Content
          aria-label={title}
          data-outcome={isWin ? 'win' : 'loss'}
          data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
          onOpenAutoFocus={(event) => {
            // Always land on the primary action; Radix still traps focus
            // inside the dialog for subsequent Tab/Shift+Tab presses.
            event.preventDefault();
            continueButtonRef.current?.focus();
          }}
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none ${contentMotion}`}
        >
          {resultAnnouncement && (
            <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
              {resultAnnouncement}
            </div>
          )}

          <div
            className={`relative w-full max-w-md overflow-hidden rounded-2xl border bg-[#050B14] font-mono text-slate-200 shadow-2xl shadow-black/60 ${
              isWin ? 'border-cyan-400/30' : 'border-rose-400/25'
            }`}
          >
            {/* Terminal chrome */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-black/50 px-4 py-2">
              <div className="flex items-center gap-1.5" aria-hidden="true">
                <span className="h-2 w-2 rounded-full bg-rose-500/70" />
                <span className="h-2 w-2 rounded-full bg-amber-400/70" />
                <span className="h-2 w-2 rounded-full bg-cyan-400/70" />
              </div>
              <p className="truncate text-[10px] uppercase tracking-[0.28em] text-slate-500">
                xelma://round-settled
              </p>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label="Close round result"
                  className="rounded-md p-1 text-slate-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </Dialog.Close>
            </div>

            <div className="relative p-6">
              {/* Outcome glow — purely decorative and motion-safe */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl ${
                  isWin ? 'bg-cyan-500/20' : 'bg-rose-500/15'
                } ${prefersReducedMotion ? '' : 'animate-pulse'}`}
              />

              <div className="relative">
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ${
                    isWin
                      ? 'border-cyan-400/30 bg-cyan-500/10 text-cyan-300'
                      : 'border-rose-400/30 bg-rose-500/10 text-rose-300'
                  }`}
                >
                  {isWin ? (
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {isWin ? 'Position settled in profit' : 'Position settled at a loss'}
                </div>

                <Dialog.Title
                  className={`mt-4 text-2xl font-black tracking-tight ${
                    isWin ? 'text-white' : 'text-slate-100'
                  }`}
                >
                  {title}
                </Dialog.Title>

                <Dialog.Description className="mt-2 text-sm text-slate-400">
                  {description}
                </Dialog.Description>

                {/* Labeled net-result readout */}
                <div
                  className={`mt-5 rounded-xl border p-4 ${
                    isWin
                      ? 'border-cyan-400/25 bg-cyan-500/[0.06]'
                      : 'border-rose-400/20 bg-rose-500/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Net result
                    </span>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${
                        isWin ? 'text-cyan-400/80' : 'text-rose-400/80'
                      }`}
                    >
                      {isWin ? 'Payout' : 'Loss'}
                    </span>
                  </div>

                  <p
                    className={`mt-1 text-4xl font-black tabular-nums tracking-tight ${
                      isWin ? 'text-cyan-300' : 'text-rose-300'
                    }`}
                  >
                    {isWin ? '+' : '-'}${formattedAmount}
                  </p>

                  {(asset || direction) && (
                    <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                      {[asset, direction].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-400">{tip}</p>

                <p aria-live="polite" role="status" className="sr-only">
                  {shareStatus}
                </p>

                <div className="mt-6 space-y-2">
                  <Dialog.Close asChild>
                    <button
                      ref={continueButtonRef}
                      type="button"
                      className={`w-full rounded-xl px-4 py-3 text-sm font-bold text-slate-950 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050B14] ${
                        isWin
                          ? 'bg-cyan-400 focus-visible:ring-cyan-300'
                          : 'bg-slate-200 focus-visible:ring-slate-100'
                      }`}
                    >
                      Continue to Next Round
                    </button>
                  </Dialog.Close>

                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:border-cyan-400/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    <Share2 className="h-4 w-4" aria-hidden="true" />
                    Share result
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
