import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  drawRoundResultCard,
  formatCardAmount,
  renderRoundResultCardPng,
  roundResultCardFilename,
  roundResultCardText,
  shareRoundResultCard,
  wrapText,
} from './round-result-card';

const win = { isWin: true, amount: 42, tip: 'Stay patient and size the next prediction carefully.' };
const loss = { isWin: false, amount: -15.5, tip: 'Better luck next round.' };

/** Records drawing calls; text width is 10px per character. */
function fakeContext() {
  const texts: string[] = [];
  const fills: string[] = [];
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    textBaseline: '',
    fillRect: vi.fn(function (this: { fillStyle: string }) {
      fills.push(ctx.fillStyle);
    }),
    strokeRect: vi.fn(),
    fillText: vi.fn((text: string) => {
      texts.push(text);
    }),
    measureText: (text: string) => ({ width: text.length * 10 }),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, texts, fills };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('card text helpers', () => {
  it('formats a signed two-decimal amount from the outcome, not the amount sign', () => {
    expect(formatCardAmount(true, 42)).toBe('+$42.00');
    expect(formatCardAmount(false, 15.5)).toBe('-$15.50');
    expect(formatCardAmount(false, -15.5)).toBe('-$15.50');
    expect(formatCardAmount(true, 0)).toBe('+$0.00');
  });

  it('builds a stable filename and share text', () => {
    expect(roundResultCardFilename(win)).toBe('xelma-round-win-42.00.png');
    expect(roundResultCardFilename(loss)).toBe('xelma-round-loss-15.50.png');
    expect(roundResultCardText(win)).toBe(`I won +$42.00 on Xelma. ${win.tip}`);
    expect(roundResultCardText(loss)).toBe(`I lost -$15.50 on Xelma. ${loss.tip}`);
  });
});

describe('wrapText', () => {
  const measure = (text: string) => text.length * 10;

  it('keeps short text on one line', () => {
    expect(wrapText(measure, 'one two', 200, 3)).toEqual(['one two']);
  });

  it('wraps on word boundaries', () => {
    expect(wrapText(measure, 'aaaa bbbb cccc dddd', 90, 4)).toEqual(['aaaa bbbb', 'cccc dddd']);
  });

  it('truncates with an ellipsis after the maximum number of lines', () => {
    const lines = wrapText(measure, 'aaaa bbbb cccc dddd eeee ffff', 50, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
  });

  it('puts an over-long single word on its own line instead of looping', () => {
    expect(wrapText(measure, 'supercalifragilistic ok', 50, 3)[0]).toBe('supercalifragilistic');
  });

  it('returns no lines for empty text', () => {
    expect(wrapText(measure, '   ', 100, 3)).toEqual([]);
  });
});

describe('drawRoundResultCard', () => {
  it('draws the win title, signed amount and tip', () => {
    const { ctx, texts } = fakeContext();
    drawRoundResultCard(ctx, win);
    expect(texts).toContain('XELMA');
    expect(texts).toContain('Spectacular Win!');
    expect(texts).toContain('+$42.00');
    expect(texts.join(' ')).toContain('Stay patient');
  });

  it('draws the loss title and a negative amount', () => {
    const { ctx, texts } = fakeContext();
    drawRoundResultCard(ctx, loss);
    expect(texts).toContain('Tough Break');
    expect(texts).toContain('-$15.50');
  });

  it('uses a different accent colour for a win and a loss', () => {
    const a = fakeContext();
    const b = fakeContext();
    drawRoundResultCard(a.ctx, win);
    drawRoundResultCard(b.ctx, loss);
    expect(a.fills[a.fills.length - 1]).not.toBe(b.fills[b.fills.length - 1]);
  });

  it('paints the whole canvas background first', () => {
    const { ctx } = fakeContext();
    drawRoundResultCard(ctx, win);
    expect(vi.mocked(ctx.fillRect).mock.calls[0]).toEqual([0, 0, CARD_WIDTH, CARD_HEIGHT]);
  });
});

describe('renderRoundResultCardPng', () => {
  it('resolves with the PNG blob from the canvas at card size', async () => {
    const { ctx } = fakeContext();
    const blob = new Blob(['png'], { type: 'image/png' });
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ctx),
      toBlob: vi.fn((cb: (b: Blob | null) => void, type?: string) => {
        expect(type).toBe('image/png');
        cb(blob);
      }),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement);

    await expect(renderRoundResultCardPng(win)).resolves.toBe(blob);
    expect(canvas.width).toBe(CARD_WIDTH);
    expect(canvas.height).toBe(CARD_HEIGHT);
  });

  it('rejects when no 2D context is available', async () => {
    const canvas = { getContext: () => null };
    vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement);
    await expect(renderRoundResultCardPng(win)).rejects.toThrow(/canvas is not available/i);
  });

  it('rejects when the canvas cannot encode a PNG', async () => {
    const { ctx } = fakeContext();
    const canvas = {
      getContext: () => ctx,
      toBlob: (cb: (b: Blob | null) => void) => cb(null),
    };
    vi.spyOn(document, 'createElement').mockReturnValue(canvas as unknown as HTMLElement);
    await expect(renderRoundResultCardPng(win)).rejects.toThrow(/could not encode/i);
  });
});

describe('shareRoundResultCard', () => {
  const blob = new Blob(['png'], { type: 'image/png' });

  it('shares the file with the Web Share API when files can be shared', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, canShare: () => true });

    await expect(shareRoundResultCard(blob, 'card.png', 'hello')).resolves.toBe('shared');
    const arg = share.mock.calls[0][0];
    expect(arg.files).toHaveLength(1);
    expect(arg.files[0].name).toBe('card.png');
    expect(arg.files[0].type).toBe('image/png');
    expect(arg.text).toBe('hello');
  });

  it('downloads the PNG when the browser cannot share files', async () => {
    vi.stubGlobal('navigator', { share: vi.fn(), canShare: () => false });
    const createUrl = vi.fn(() => 'blob:card');
    const revokeUrl = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: createUrl, revokeObjectURL: revokeUrl });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    let downloadName = '';
    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreate(tag);
      if (tag === 'a') {
        Object.defineProperty(el, 'download', {
          set: (value: string) => {
            downloadName = value;
          },
          get: () => downloadName,
        });
      }
      return el;
    });

    await expect(shareRoundResultCard(blob, 'card.png', 'hello')).resolves.toBe('downloaded');
    expect(createUrl).toHaveBeenCalledWith(blob);
    expect(downloadName).toBe('card.png');
    expect(click).toHaveBeenCalledTimes(1);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(revokeUrl).toHaveBeenCalledWith('blob:card');
  });

  it('propagates an AbortError when the share sheet is dismissed', async () => {
    const abort = new DOMException('cancelled', 'AbortError');
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(abort), canShare: () => true });
    await expect(shareRoundResultCard(blob, 'card.png', 'hello')).rejects.toBe(abort);
  });
});
