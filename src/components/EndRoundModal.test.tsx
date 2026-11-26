import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import EndRoundModal from './EndRoundModal';
import * as card from '../lib/round-result-card';

vi.mock('../lib/round-result-card', async (importActual) => {
  const actual = await importActual<typeof import('../lib/round-result-card')>();
  return {
    ...actual,
    renderRoundResultCardPng: vi.fn(),
    shareRoundResultCard: vi.fn(),
  };
});

const result = {
  isWin: true,
  amount: 42,
  tip: 'Stay patient and size the next prediction carefully.',
};

describe('EndRoundModal accessibility', () => {
  it('renders an accessible modal dialog with title and description', () => {
    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);

    const dialog = screen.getByRole('dialog', { name: /spectacular win/i });
    expect(dialog).toHaveAttribute('aria-describedby');
    expect(screen.getByText('You made all the right moves.')).toBeInTheDocument();
  });

  it('renders an aria-live region announcing win/loss outcome', async () => {
    const { unmount } = render(
      <EndRoundModal isOpen onClose={vi.fn()} result={result} />,
    );
    await waitFor(() => {
      const winRegion = document.querySelector('[aria-live="polite"]');
      expect(winRegion).toBeInTheDocument();
      expect(winRegion).toHaveTextContent(/net gain plus \$42\.00/i);
    });
    unmount();

    render(
      <EndRoundModal
        isOpen
        onClose={vi.fn()}
        result={{ isWin: false, amount: 15, tip: 'Better luck next round.' }}
      />,
    );
    await waitFor(() => {
      const lossRegion = document.querySelector('[aria-live="polite"]');
      expect(lossRegion).toBeInTheDocument();
      expect(lossRegion).toHaveTextContent(/round result: loss/i);
    });
  });

  it('closes on Escape and restores focus to the trigger', async () => {
    const onClose = vi.fn();

    function EndRoundHarness() {
      const [open, setOpen] = useState(false);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open result
          </button>
          <EndRoundModal
            isOpen={open}
            onClose={() => {
              onClose();
              setOpen(false);
            }}
            result={result}
          />
        </>
      );
    }

    render(<EndRoundHarness />);

    const trigger = screen.getByRole('button', { name: /open result/i });
    trigger.focus();
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue to next round/i })).toHaveFocus();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

describe('EndRoundModal sharing functionality', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      share: vi.fn().mockResolvedValue(undefined),
      canShare: vi.fn().mockReturnValue(true),
    });

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      roundRect: vi.fn(),
      stroke: vi.fn(),
    }) as any;

    HTMLCanvasElement.prototype.toBlob = vi.fn(function (this: HTMLCanvasElement, callback) {
      callback(new Blob(['mock-png'], { type: 'image/png' }));
    } as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a continue button', () => {
    render(<EndRoundModal isOpen onClose={vi.fn()} result={{ ...result, asset: 'ETH', direction: 'DOWN' }} />);
    expect(screen.getByRole('button', { name: /continue to next round/i })).toBeInTheDocument();
  });

  it('renders net result details when modal is open', async () => {
    render(<EndRoundModal isOpen onClose={vi.fn()} result={{ ...result, asset: 'ETH', direction: 'DOWN' }} />);
    expect(screen.getByText('+$42.00')).toBeInTheDocument();
    expect(screen.getByText(result.tip)).toBeInTheDocument();
  });
});

describe('EndRoundModal share card', () => {
  const png = new Blob(['png'], { type: 'image/png' });

  beforeEach(() => {
    vi.mocked(card.renderRoundResultCardPng).mockReset().mockResolvedValue(png);
    vi.mocked(card.shareRoundResultCard).mockReset().mockResolvedValue('downloaded');
  });

  it('offers a share button with an accessible name', () => {
    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);
    expect(screen.getByRole('button', { name: 'Share result card' })).toBeEnabled();
  });

  it('renders the card from the round result and saves it when sharing is unavailable', async () => {
    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share result card' }));

    expect(await screen.findByText('Result card saved as a PNG.')).toBeInTheDocument();
    expect(card.renderRoundResultCardPng).toHaveBeenCalledWith({
      isWin: true,
      amount: 42,
      tip: result.tip,
    });
    expect(card.shareRoundResultCard).toHaveBeenCalledWith(
      png,
      'xelma-round-win-42.00.png',
      expect.stringContaining('I won +$42.00 on Xelma.'),
    );
  });

  it('reports a shared card when the Web Share API is used', async () => {
    vi.mocked(card.shareRoundResultCard).mockResolvedValue('shared');
    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share result card' }));
    expect(await screen.findByText('Result card shared.')).toBeInTheDocument();
  });

  it('builds a loss card with the loss filename', async () => {
    render(
      <EndRoundModal
        isOpen
        onClose={vi.fn()}
        result={{ isWin: false, amount: 15, tip: 'Better luck next round.' }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Share result card' }));
    await screen.findByText('Result card saved as a PNG.');
    expect(card.shareRoundResultCard).toHaveBeenCalledWith(
      png,
      'xelma-round-loss-15.00.png',
      expect.stringContaining('I lost -$15.00 on Xelma.'),
    );
  });

  it('disables the button while the card is being created', async () => {
    let finish: (blob: Blob) => void = () => {};
    vi.mocked(card.renderRoundResultCardPng).mockReturnValue(
      new Promise<Blob>((resolve) => {
        finish = resolve;
      }),
    );
    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share result card' }));

    const busy = await screen.findByRole('button', { name: 'Creating result card…' });
    expect(busy).toBeDisabled();
    fireEvent.click(busy);
    expect(card.renderRoundResultCardPng).toHaveBeenCalledTimes(1);

    finish(png);
    expect(await screen.findByRole('button', { name: 'Share result card' })).toBeEnabled();
  });

  it('announces a failure and stays usable', async () => {
    vi.mocked(card.renderRoundResultCardPng).mockRejectedValueOnce(new Error('no canvas'));
    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share result card' }));

    expect(
      await screen.findByText('Could not create the result card. Please try again.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share result card' })).toBeEnabled();
  });

  it('shows no error when the share sheet is dismissed', async () => {
    vi.mocked(card.shareRoundResultCard).mockRejectedValueOnce(
      new DOMException('cancelled', 'AbortError'),
    );
    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share result card' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Share result card' })).toBeEnabled(),
    );
    expect(screen.queryByText(/could not create/i)).not.toBeInTheDocument();
  });
});
