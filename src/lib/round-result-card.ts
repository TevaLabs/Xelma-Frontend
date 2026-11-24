/**
 * Shareable round-result card: a 1200x630 PNG drawn on a canvas (no network,
 * no wallet address, nothing but the outcome, the net amount and the tip).
 */

export interface RoundResultCardInput {
  isWin: boolean;
  amount: number;
  tip: string;
}

export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

const FONT_FAMILY = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const BACKGROUND = '#0A0F1A';
const BORDER = 'rgba(255, 255, 255, 0.12)';
const ACCENT = '#2C4BFD';
const WIN = '#4ADE80';
const LOSS = '#F87171';
const TEXT = '#FFFFFF';
const MUTED = '#9CA3AF';
const TIP_MAX_LINES = 3;

/** Signed, two-decimal amount, e.g. `+$42.00` / `-$15.50`. */
export function formatCardAmount(isWin: boolean, amount: number): string {
  return `${isWin ? '+' : '-'}$${Math.abs(amount).toFixed(2)}`;
}

export function roundResultCardFilename({ isWin, amount }: RoundResultCardInput): string {
  return `xelma-round-${isWin ? 'win' : 'loss'}-${Math.abs(amount).toFixed(2)}.png`;
}

/** Accessible description of the card, used as share text. */
export function roundResultCardText({ isWin, amount, tip }: RoundResultCardInput): string {
  const outcome = isWin ? 'won' : 'lost';
  return `I ${outcome} ${formatCardAmount(isWin, amount)} on Xelma. ${tip}`.trim();
}

/** Greedy word wrap that stops at `maxLines` and ends the last line with an ellipsis. */
export function wrapText(
  measure: (text: string) => number,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  let consumed = 0;

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate) <= maxWidth || !current) {
      current = candidate;
      consumed += 1;
      continue;
    }
    lines.push(current);
    current = word;
    consumed += 1;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && current) lines.push(current);

  const truncated = consumed < words.length || lines.length > maxLines;
  const visible = lines.slice(0, maxLines);
  if (truncated && visible.length > 0) {
    let last = visible[visible.length - 1];
    while (last.length > 1 && measure(`${last}…`) > maxWidth) last = last.slice(0, -1);
    visible[visible.length - 1] = `${last.replace(/[\s.,;:!?]+$/, '')}…`;
  }
  return visible;
}

/** Draws the card onto any 2D context. Pure drawing: easy to test with a fake context. */
export function drawRoundResultCard(
  ctx: CanvasRenderingContext2D,
  input: RoundResultCardInput,
  width = CARD_WIDTH,
  height = CARD_HEIGHT,
): void {
  const { isWin, amount, tip } = input;
  const accent = isWin ? WIN : LOSS;

  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = BORDER;
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, width - 48, height - 48);

  ctx.fillStyle = accent;
  ctx.fillRect(24, 24, 12, height - 48);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = ACCENT;
  ctx.font = `800 40px ${FONT_FAMILY}`;
  ctx.fillText('XELMA', 80, 110);

  ctx.fillStyle = MUTED;
  ctx.font = `600 28px ${FONT_FAMILY}`;
  ctx.fillText('ROUND RESULT', 80, 160);

  ctx.fillStyle = TEXT;
  ctx.font = `900 76px ${FONT_FAMILY}`;
  ctx.fillText(isWin ? 'Spectacular Win!' : 'Tough Break', 80, 270);

  ctx.fillStyle = accent;
  ctx.font = `900 150px ${FONT_FAMILY}`;
  ctx.fillText(formatCardAmount(isWin, amount), 80, 430);

  ctx.fillStyle = MUTED;
  ctx.font = `500 32px ${FONT_FAMILY}`;
  const lines = wrapText((text) => ctx.measureText(text).width, tip, width - 160, TIP_MAX_LINES);
  lines.forEach((line, index) => ctx.fillText(line, 80, 500 + index * 44));
}

/** Renders the card to a PNG blob. Rejects when the canvas cannot produce one. */
export function renderRoundResultCardPng(input: RoundResultCardInput): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas is not available'));
      return;
    }
    drawRoundResultCard(ctx, input);
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not encode the result card'));
    }, 'image/png');
  });
}

export type ShareOutcome = 'shared' | 'downloaded';

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Shares the PNG with the Web Share API when the browser can share files,
 * otherwise saves it. A dismissed share sheet rejects with an `AbortError`.
 */
export async function shareRoundResultCard(
  blob: Blob,
  filename: string,
  text: string,
): Promise<ShareOutcome> {
  const file = new File([blob], filename, { type: 'image/png' });
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    await navigator.share({ files: [file], title: 'Xelma round result', text });
    return 'shared';
  }
  download(blob, filename);
  return 'downloaded';
}
