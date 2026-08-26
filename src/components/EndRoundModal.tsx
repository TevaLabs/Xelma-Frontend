import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef } from 'react';
import ContributorTaskPlaceholder from './ContributorTaskPlaceholder';

interface EndRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  result?: {
    isWin?: boolean;
    amount?: number;
    tip?: string;
  };
  playResolveSound?: boolean;
}

/**
 * STUBBED for contributor rebuild — dialog wiring + result copy kept for tests.
 * Rebuild dark terminal win/loss celebration (no light emerald/rose cards).
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
  } = result ?? {};
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen || !playResolveSound) return;
    // TODO: add audio asset
    const audio = new Audio('/sounds/round-resolved.mp3');
    audio.play().catch(() => {});
    return () => { audio.pause(); };
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

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/90 backdrop-blur-md" />
        <Dialog.Content
          aria-label={isWin ? 'Spectacular Win!' : 'Tough Break'}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 focus:outline-none"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0F1A] p-6">
            <Dialog.Title className="text-2xl font-black text-white">
              {isWin ? 'Spectacular Win!' : 'Tough Break'}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-base text-gray-300">
              {isWin ? 'You made all the right moves.' : 'The market moved against you.'}
            </Dialog.Description>

            <ContributorTaskPlaceholder
              className="mt-6"
              title="Rebuild End Round Modal"
              issueHint={`Net result ${isWin ? '+' : '-'}$${Math.abs(amount).toFixed(2)}. Tip: "${tip}". Rebuild celebration UI for dark terminal theme with Continue CTA.`}
            />

            <p className="mt-4 text-center text-3xl font-black text-white tabular-nums">
              {isWin ? '+' : '-'}${Math.abs(amount).toFixed(2)}
            </p>
            <p className="mt-2 text-center text-sm text-gray-400">{tip}</p>

            <Dialog.Close asChild>
              <button
                type="button"
                className="mt-6 w-full rounded-xl bg-[#2C4BFD] py-3 text-lg font-bold text-white hover:opacity-95"
              >
                Continue to Next Round
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
