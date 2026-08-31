import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import EndRoundModal from './EndRoundModal';

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

  it('renders an aria-live region announcing win outcome', async () => {
    render(
      <EndRoundModal isOpen onClose={vi.fn()} result={result} />,
    );
    await waitFor(() => {
      const dialog = screen.getByRole('dialog', { name: /spectacular win/i });
      const winRegion = dialog.querySelector('[aria-live="polite"]');
      expect(winRegion).toBeInTheDocument();
      expect(winRegion).toHaveTextContent(/round result: win/i);
      expect(winRegion).toHaveTextContent(/net gain plus \$42\.00/i);
    });
  });

  it('renders an aria-live region announcing loss outcome', async () => {
    render(
      <EndRoundModal
        isOpen
        onClose={vi.fn()}
        result={{ isWin: false, amount: 15, tip: 'Better luck next round.' }}
      />,
    );
    await waitFor(() => {
      const dialog = screen.getByRole('dialog', { name: /tough break/i });
      const lossRegion = dialog.querySelector('[aria-live="polite"]');
      expect(lossRegion).toBeInTheDocument();
      expect(lossRegion).toHaveTextContent(/round result: loss/i);
      expect(lossRegion).toHaveTextContent(/net loss minus \$15\.00/i);
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
