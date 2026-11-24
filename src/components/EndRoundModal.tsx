import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState } from 'react';
import ContributorTaskPlaceholder from './ContributorTaskPlaceholder';
import {
  renderRoundResultCardPng,
  roundResultCardFilename,
  roundResultCardText,
  shareRoundResultCard,
} from '../lib/round-result-card';

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
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const formattedAmount = Math.abs(amount).toFixed(2);
  const resultAnnouncement = isOpen
    ? isWin
      ? `Round result: win. Net gain plus $${formattedAmount}. ${tip}`
      : `Round result: loss. Net loss minus $${formattedAmount}. ${tip}`
    : '';

  useEffect(() => {
    if (!isOpen) {
      setShareStatus('');
      setSharing(false);
    }
  }, [isOpen]);

  const handleShare = async () => {
    if (sharing) return;
    const card = { isWin, amount, tip };
    setSharing(true);
    setShareStatus('');
    try {
      const blob = await renderRoundResultCardPng(card);
      const outcome = await shareRoundResultCard(
        blob,
        roundResultCardFilename(card),
        roundResultCardText(card),
      );
      setShareStatus(outcome === 'shared' ? 'Result card shared.' : 'Result card saved as a PNG.');
    } catch (err) {
      // Dismissing the share sheet is not an error.
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setShareStatus('Could not create the result card. Please try again.');
      }
    } finally {
      setSharing(false);
    }
  };

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
          {resultAnnouncement && (
            <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
              {resultAnnouncement}
            </div>
          )}
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
            <button
              type="button"
              onClick={() => void handleShare()}
              disabled={sharing}
              className="mt-3 w-full rounded-xl border border-white/15 py-3 text-base font-bold text-white hover:bg-white/5 disabled:opacity-60"
            >
              {sharing ? 'Creating result card…' : 'Share result card'}
            </button>
            <p role="status" aria-live="polite" className="mt-2 min-h-5 text-center text-sm text-gray-400">
              {shareStatus}
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
