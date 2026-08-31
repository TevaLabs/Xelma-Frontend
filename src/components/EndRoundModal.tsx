import * as Dialog from '@radix-ui/react-dialog';
import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Sparkles, Share2, ArrowRight } from 'lucide-react';

interface EndRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Retained for callers that opt into the round-resolution sound. */
  playResolveSound?: boolean;
  result?: {
    isWin?: boolean;
    amount?: number;
    tip?: string;
    asset?: string;
    direction?: 'UP' | 'DOWN' | string;
  };
}

export default function EndRoundModal({ isOpen, onClose, result }: EndRoundModalProps) {
  const {
    isWin = false,
    amount = 0,
    tip = 'Stay tuned for the next round.',
    asset = 'BTC',
    direction = 'UP',
  } = result ?? {};
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const resultAmount = `${isWin ? '+' : '-'}$${Math.abs(amount).toFixed(2)}`;
  const accent = isWin ? 'cyan' : 'amber';

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      return;
    }

    const previouslyFocused = previouslyFocusedRef.current;
    if (previouslyFocused?.isConnected) window.setTimeout(() => previouslyFocused.focus(), 0);
  }, [isOpen]);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas context not available');

      const gradient = context.createRadialGradient(600, 315, 20, 600, 315, 760);
      gradient.addColorStop(0, isWin ? '#123849' : '#382b12');
      gradient.addColorStop(1, '#070b12');
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = isWin ? 'rgba(34, 211, 238, 0.45)' : 'rgba(251, 191, 36, 0.45)';
      context.lineWidth = 4;
      context.strokeRect(24, 24, 1152, 582);
      context.fillStyle = '#e5e7eb';
      context.font = '700 28px Inter, sans-serif';
      context.fillText('XELMA // ROUND COMPLETE', 72, 98);
      context.fillStyle = isWin ? '#67e8f9' : '#fcd34d';
      context.font = '900 116px Inter, sans-serif';
      context.fillText(resultAmount, 72, 270);
      context.fillStyle = '#94a3b8';
      context.font = '600 24px Inter, sans-serif';
      context.fillText(`${asset}/USD  ·  ${direction.toUpperCase()}`, 76, 334);
      context.fillText('xelma.network', 76, 550);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSharing(false);
          return;
        }
        try {
          const file = new File([blob], `xelma-round-${asset}-${Date.now()}.png`, { type: 'image/png' });
          const shareData = {
            files: [file],
            title: 'Xelma Round Result',
            text: `My Xelma round result: ${resultAmount} on ${asset}.`,
          };
          if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
            await navigator.share(shareData);
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.name;
          link.click();
          URL.revokeObjectURL(url);
        } catch (error) {
          // A cancelled native share is expected; the dialog remains available.
          console.warn('Unable to share round result.', error);
        } finally {
          setIsSharing(false);
        }
      }, 'image/png');
    } catch (error) {
      console.warn('Unable to create round result card.', error);
      setIsSharing(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-[#030712]/90 backdrop-blur-md motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200" />
        <Dialog.Content
          aria-label={isWin ? 'Spectacular Win!' : 'Tough Break'}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 focus:outline-none"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            continueButtonRef.current?.focus();
          }}
        >
          <section className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700/80 bg-[#0a0f1a] shadow-[0_24px_80px_rgba(0,0,0,0.65)] motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200">
            <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
            <div aria-hidden="true" className={`pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl ${accent === 'cyan' ? 'bg-cyan-400/15' : 'bg-amber-300/15'} motion-safe:animate-pulse`} />

            <div className="relative p-6 sm:p-8">
              <div className="mb-7 flex items-center justify-between border-b border-slate-700/70 pb-4 font-mono text-xs uppercase tracking-[0.18em] text-slate-400">
                <span>Round settled</span>
                <span className={accent === 'cyan' ? 'text-cyan-300' : 'text-amber-300'}>{isWin ? 'Profit recorded' : 'Position closed'}</span>
              </div>

              <div className="text-center">
                <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border bg-[#0d1724] ${accent === 'cyan' ? 'border-cyan-400/50 text-cyan-300' : 'border-amber-300/50 text-amber-300'}`} aria-hidden="true">
                  {isWin ? <TrendingUp size={30} /> : <TrendingDown size={30} />}
                </div>
                <Dialog.Title className="text-3xl font-black tracking-tight text-slate-100">{isWin ? 'Spectacular Win!' : 'Tough Break'}</Dialog.Title>
                <Dialog.Description className="mx-auto mt-2 max-w-sm text-base leading-relaxed text-slate-400">
                  {isWin ? 'You made all the right moves.' : 'The market moved against you.'}
                </Dialog.Description>
              </div>

              <div className="mt-7 rounded-xl border border-slate-700/80 bg-[#070d16]/85 p-5 text-center">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Net result</p>
                <p className={`mt-2 text-5xl font-black tracking-tight tabular-nums ${accent === 'cyan' ? 'text-cyan-300' : 'text-amber-300'}`}>{resultAmount}</p>
              </div>

              <div className="mt-4 flex gap-3 rounded-xl border border-slate-700/80 bg-slate-950/40 p-4 text-left">
                <Sparkles className={`mt-0.5 shrink-0 ${accent === 'cyan' ? 'text-cyan-300' : 'text-amber-300'}`} size={19} aria-hidden="true" />
                <div>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-slate-300">Analyst tip</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">{tip}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => void handleShare()} disabled={isSharing} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-600 bg-slate-800/70 px-4 py-3 font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-700/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none">
                  <Share2 size={18} aria-hidden="true" />
                  {isSharing ? 'Preparing result…' : 'Share result'}
                </button>
                <Dialog.Close asChild>
                  <button ref={continueButtonRef} type="button" className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-[#061018] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transform-none motion-reduce:transition-none ${accent === 'cyan' ? 'bg-cyan-300 hover:bg-cyan-200' : 'bg-amber-300 hover:bg-amber-200'}`}>
                    Continue to Next Round <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </Dialog.Close>
              </div>
            </div>
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
