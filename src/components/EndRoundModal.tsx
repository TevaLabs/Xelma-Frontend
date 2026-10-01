import * as Dialog from '@radix-ui/react-dialog';
import { useEffect, useRef, useState, useCallback } from 'react';

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

const CARD_WIDTH = 800;
const CARD_HEIGHT = 500;

const generateResultCard = (
  canvas: HTMLCanvasElement,
  isWin: boolean,
  amount: number,
  tip: string,
  asset: string,
  direction: string
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = CARD_WIDTH * dpr;
  canvas.height = CARD_HEIGHT * dpr;
  canvas.style.width = `${CARD_WIDTH}px`;
  canvas.style.height = `${CARD_HEIGHT}px`;
  ctx.scale(dpr, dpr);

  const bgColor = '#0A0F1A';
  const borderColor = '#FFFFFF1A';
  const winColor = '#22C55E';
  const lossColor = '#EF4444';
  const textPrimary = '#FFFFFF';
  const textSecondary = '#9CA3AF';
  const textMuted = '#6B7280';
  const accentColor = isWin ? winColor : lossColor;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, CARD_WIDTH - 1, CARD_HEIGHT - 1);

  const gradient = ctx.createLinearGradient(0, 0, CARD_WIDTH, 0);
  gradient.addColorStop(0, '#2C4BFD33');
  gradient.addColorStop(0.5, 'transparent');
  gradient.addColorStop(1, '#06B6D433');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.fillStyle = 'rgba(44, 75, 253, 0.05)';
  for (let i = 0; i < CARD_WIDTH; i += 40) {
    for (let j = 0; j < CARD_HEIGHT; j += 40) {
      ctx.beginPath();
      ctx.arc(i, j, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const centerX = CARD_WIDTH / 2;
  let y = 80;

  ctx.font = '700 24px "JetBrains Mono", monospace';
  ctx.fillStyle = textSecondary;
  ctx.textAlign = 'center';
  ctx.fillText('XELMA PREDICTION TERMINAL', centerX, y);

  y += 50;

  const title = isWin ? 'SPECTACULAR WIN!' : 'TOUGH BREAK';
  ctx.font = '900 48px "JetBrains Mono", monospace';
  ctx.fillStyle = textPrimary;
  ctx.fillText(title, centerX, y);

  y += 16;

  ctx.font = '500 18px "JetBrains Mono", monospace';
  ctx.fillStyle = textSecondary;
  const subtitle = isWin ? 'You made all the right moves.' : 'The market moved against you.';
  ctx.fillText(subtitle, centerX, y);

  y += 40;

  ctx.strokeStyle = `${accentColor}4D`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 120, y);
  ctx.lineTo(centerX + 120, y);
  ctx.stroke();

  y += 30;

  const amountText = `${isWin ? '+' : '-'}$${Math.abs(amount).toFixed(2)}`;
  ctx.font = '900 72px "JetBrains Mono", monospace';
  ctx.fillStyle = accentColor;
  ctx.fillText(amountText, centerX, y);

  y += 50;

  ctx.font = '500 16px "JetBrains Mono", monospace';
  ctx.fillStyle = textMuted;
  ctx.fillText(`${asset} • ${direction}`, centerX, y);

  y += 50;

  ctx.strokeStyle = `${accentColor}4D`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX - 120, y);
  ctx.lineTo(centerX + 120, y);
  ctx.stroke();

  y += 30;

  ctx.font = '400 16px "JetBrains Mono", monospace';
  ctx.fillStyle = textSecondary;
  const maxTipWidth = CARD_WIDTH - 100;
  const words = tip.split(' ');
  let line = '';
  const lines: string[] = [];

  for (const word of words) {
    const testLine = line + word + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxTipWidth && line !== '') {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  for (const lineText of lines.slice(0, 3)) {
    ctx.fillText(lineText, centerX, y);
    y += 24;
  }

  y = CARD_HEIGHT - 60;

  ctx.font = '500 12px "JetBrains Mono", monospace';
  ctx.fillStyle = textMuted;
  ctx.fillText('xelma.fun', centerX, y);
};

const toBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
};

const downloadImage = async (blob: Blob, filename: string): Promise<void> => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const shareImage = async (blob: Blob, title: string): Promise<boolean> => {
  if (!navigator.share) return false;

  const file = new File([blob], 'round-result.png', { type: 'image/png' });
  try {
    await navigator.share({ title, files: [file] });
    return true;
  } catch {
    return false;
  }
};

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
    asset = 'BTC',
    direction = 'UP',
  } = result ?? {};

  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const formattedAmount = Math.abs(amount).toFixed(2);
  const resultAnnouncement = isOpen
    ? isWin
      ? `Round result: win. Net gain plus $${formattedAmount}. ${tip}`
      : `Round result: loss. Net loss minus $${formattedAmount}. ${tip}`
    : '';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen || !playResolveSound) return;
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

  const generateCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    generateResultCard(canvas, isWin, amount, tip, asset, direction);
  }, [isWin, amount, tip, asset, direction]);

  useEffect(() => {
    if (isOpen) {
      generateCard();
    }
  }, [isOpen, generateCard]);

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    try {
      const blob = await toBlob(canvas);
      if (!blob) throw new Error('Failed to generate image');

      const title = isWin ? 'My Xelma Win!' : 'My Xelma Round Result';
      const shared = await shareImage(blob, title);

      if (!shared) {
        await navigator.clipboard.writeText(window.location.href);
        console.log('Link copied to clipboard (share not available)');
      } else {
        console.log('Shared successfully!');
      }
    } catch (error) {
      console.error('Share failed:', error);
      console.error('Could not share result');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    try {
      const blob = await toBlob(canvas);
      if (!blob) throw new Error('Failed to generate image');

      const filename = `xelma-round-${isWin ? 'win' : 'loss'}-${Date.now()}.png`;
      await downloadImage(blob, filename);
      console.log('Image downloaded!');
    } catch (error) {
      console.error('Download failed:', error);
      console.error('Could not download image');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

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
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            continueButtonRef.current?.focus();
          }}
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

            <p className="mt-4 text-center text-3xl font-black text-white tabular-nums">
              {isWin ? '+' : '-'}${Math.abs(amount).toFixed(2)}
            </p>
            <p className="mt-2 text-center text-sm text-gray-400">{tip}</p>

            <div className="mt-6 relative">
              <canvas
                ref={canvasRef}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                className="w-full h-auto rounded-lg border border-white/10 bg-[#0A0F1A] opacity-50 pointer-events-none"
                aria-hidden="true"
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleShare}
                disabled={isGenerating}
                className="btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Share result"
              >
                {isGenerating ? 'Sharing...' : 'Share'}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isGenerating}
                className="btn-ghost inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Download result image"
              >
                {isGenerating ? 'Downloading...' : 'Download'}
              </button>
            </div>

            <Dialog.Close asChild>
              <button
                ref={continueButtonRef}
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
