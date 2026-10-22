import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Minus, Share2, TrendingDown, Trophy, type LucideIcon } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { MODAL_CONTENT, MODAL_OVERLAY } from '../utils/motion';

export type RoundOutcome = 'win' | 'loss' | 'push';

interface EndRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  result?: {
    isWin?: boolean;
    isPush?: boolean;
    outcome?: RoundOutcome;
    amount?: number;
    tip?: string;
    asset?: string;
    direction?: string;
  };
  playResolveSound?: boolean;
}

interface OutcomePresentation {
  title: string;
  description: string;
  label: string;
  icon: LucideIcon;
  badge: string;
  iconWrap: string;
  amount: string;
  glow: string;
}

/**
 * Dark terminal presentation for a resolved round. Wins lean on the teal /
 * emerald accent, losses stay muted rose, and pushes sit in neutral cyan so the
 * three states are distinguishable without light "celebration" cards.
 */
const OUTCOME_PRESENTATION: Record<RoundOutcome, OutcomePresentation> = {
  win: {
    title: 'Spectacular Win!',
    description: 'You made all the right moves.',
    label: 'Win',
    icon: Trophy,
    badge: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    iconWrap: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    amount: 'text-emerald-300',
    glow: 'bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_62%)]',
  },
  loss: {
    title: 'Tough Break',
    description: 'The market moved against you.',
    label: 'Loss',
    icon: TrendingDown,
    badge: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
    iconWrap: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
    amount: 'text-rose-300',
    glow: 'bg-[radial-gradient(circle_at_top,rgba(244,63,94,0.14),transparent_62%)]',
  },
  push: {
    title: 'Round Pushed',
    description: 'The round closed right at your line.',
    label: 'Push',
    icon: Minus,
    badge: 'border-xelma-teal-bright/30 bg-xelma-teal-bright/10 text-xelma-teal-bright',
    iconWrap: 'border-xelma-teal-bright/30 bg-xelma-teal-bright/10 text-xelma-teal-bright',
    amount: 'text-xelma-teal-bright',
    glow: 'bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_62%)]',
  },
};

function resolveOutcome(
  result: EndRoundModalProps['result'],
  amount: number,
): RoundOutcome {
  if (result?.outcome) return result.outcome;
  if (result?.isPush) return 'push';
  if (amount === 0) return 'push';
  return result?.isWin ? 'win' : 'loss';
}

export default function EndRoundModal({
  isOpen,
  onClose,
  result,
  playResolveSound = false,
}: EndRoundModalProps) {
  const { amount = 0, tip = 'Stay tuned for the next round.' } = result ?? {};
  const outcome = resolveOutcome(result, amount);
  const presentation = OUTCOME_PRESENTATION[outcome];
  const OutcomeIcon = presentation.icon;
  const { reduced } = useReducedMotion();

  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const continueRef = useRef<HTMLButtonElement | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'shared' | 'copied' | 'failed'>(
    'idle',
  );

  const formattedAmount = Math.abs(amount).toFixed(2);
  const signedAmount =
    outcome === 'push'
      ? `$${formattedAmount}`
      : `${outcome === 'win' ? '+' : '-'}$${formattedAmount}`;

  const resultAnnouncement = isOpen
    ? outcome === 'win'
      ? `Round result: win. Net gain plus $${formattedAmount}. ${tip}`
      : outcome === 'loss'
        ? `Round result: loss. Net loss minus $${formattedAmount}. ${tip}`
        : `Round result: push. Net result flat. ${tip}`
    : '';

  const shareText = [
    `Xelma round result — ${presentation.label}: ${signedAmount}`,
    result?.asset ? `on ${result.asset}` : null,
    result?.direction ? `(${result.direction})` : null,
    tip,
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    if (!isOpen || !playResolveSound) return;
    const audio = new Audio('/sounds/round-resolved.mp3');
    audio.play().catch(() => {});
    return () => {
      audio.pause();
    };
  }, [isOpen, playResolveSound]);

  useEffect(() => {
    if (!isOpen) {
      setShareState('idle');
      return;
    }

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    // Keep the primary CTA as the entry point even though the share action is
    // also focusable inside the dialog.
    const focusTimer = window.setTimeout(() => continueRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      const previouslyFocused = previouslyFocusedRef.current;
      if (previouslyFocused?.isConnected) {
        window.setTimeout(() => previouslyFocused.focus(), 0);
      }
    };
  }, [isOpen]);

  const handleShare = async () => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: 'Xelma round result', text: shareText });
        setShareState('shared');
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setShareState('copied');
        return;
      }

      setShareState('failed');
    } catch (error) {
      // A dismissed native share sheet is a cancel, not a failure.
      if (error instanceof Error && error.name === 'AbortError') return;
      setShareState('failed');
    }
  };

  const shareLabel =
    shareState === 'shared'
      ? 'Shared'
      : shareState === 'copied'
        ? 'Copied to clipboard'
        : 'Share result';

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={`fixed inset-0 z-40 bg-black/85 backdrop-blur-md ${
            reduced ? '' : MODAL_OVERLAY
          }`}
        />
        <Dialog.Content
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none ${
            reduced ? '' : MODAL_CONTENT
          }`}
        >
          {resultAnnouncement && (
            <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
              {resultAnnouncement}
            </div>
          )}

          <div
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F1A] shadow-2xl shadow-black/60"
            data-outcome={outcome}
          >
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute inset-0 ${presentation.glow} ${
                reduced ? '' : 'opacity-90'
              }`}
            />

            <div className="relative p-6 sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-500">
                  Round resolved
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] ${presentation.badge}`}
                >
                  <OutcomeIcon className="h-3 w-3" aria-hidden="true" />
                  {presentation.label}
                </span>
              </div>

              <div className="mt-6 flex flex-col items-center text-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${presentation.iconWrap} ${
                    reduced ? '' : 'shadow-[0_0_32px_rgba(44,75,253,0.12)]'
                  }`}
                >
                  <OutcomeIcon className="h-7 w-7" aria-hidden="true" />
                </div>

                <Dialog.Title className="mt-4 text-2xl font-black text-white">
                  {presentation.title}
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-gray-400">
                  {presentation.description}
                </Dialog.Description>

                <div className="mt-6 w-full rounded-xl border border-white/10 bg-black/40 p-4">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                    Net result
                  </p>
                  <p
                    className={`mt-1 font-mono text-4xl font-black tabular-nums ${presentation.amount}`}
                  >
                    {signedAmount}
                  </p>
                  {(result?.asset || result?.direction) && (
                    <p className="mt-3 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gray-500">
                      {result?.asset && <span>{result.asset}</span>}
                      {result?.asset && result?.direction && (
                        <span aria-hidden="true">·</span>
                      )}
                      {result?.direction && <span>{result.direction}</span>}
                    </p>
                  )}
                </div>

                <p className="mt-4 text-sm text-gray-400">{tip}</p>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <Dialog.Close asChild>
                  <button
                    ref={continueRef}
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2C4BFD] py-3 text-base font-bold text-white transition-colors duration-150 hover:bg-[#2C4BFD]/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
                  >
                    Continue to Next Round
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </Dialog.Close>

                <button
                  type="button"
                  onClick={handleShare}
                  className="btn-ghost inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22D3EE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1A]"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  {shareLabel}
                </button>

                <p
                  aria-live="polite"
                  className="min-h-[1rem] text-center font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500"
                >
                  {shareState === 'failed'
                    ? 'Sharing unavailable — copy the result manually.'
                    : shareState === 'copied'
                      ? 'Result copied to clipboard.'
                      : ''}
                </p>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
