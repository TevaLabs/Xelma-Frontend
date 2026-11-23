import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import EndRoundModal from './EndRoundModal';
import { useReducedMotion } from '../hooks/useReducedMotion';

vi.mock('../hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(),
}));

const result = {
  isWin: true,
  amount: 42,
  tip: 'Stay patient and size the next prediction carefully.',
};

const defaultMotionPreference = {
  reduced: false,
  systemPreference: false,
  override: 'system' as const,
};

beforeEach(() => {
  vi.mocked(useReducedMotion).mockReturnValue(defaultMotionPreference);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it('traps keyboard focus inside the dialog', async () => {
    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);

    const closeButton = await screen.findByRole('button', { name: /close round result/i });
    const continueButton = screen.getByRole('button', { name: /continue to next round/i });
    const shareButton = screen.getByRole('button', { name: /share result/i });

    await waitFor(() => expect(continueButton).toHaveFocus());

    // Tab from the last focusable element wraps to the first.
    shareButton.focus();
    fireEvent.keyDown(shareButton, { key: 'Tab' });
    await waitFor(() => expect(closeButton).toHaveFocus());

    // Shift+Tab from the first focusable element wraps to the last.
    fireEvent.keyDown(closeButton, { key: 'Tab', shiftKey: true });
    await waitFor(() => expect(shareButton).toHaveFocus());

    // Focus never escapes the dialog.
    expect(document.activeElement).not.toBe(document.body);
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
  });

  it('respects prefers-reduced-motion by dropping entrance animations', () => {
    vi.mocked(useReducedMotion).mockReturnValue({
      reduced: true,
      systemPreference: true,
      override: 'reduce',
    });

    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-reduced-motion', 'true');
    expect(dialog.className).not.toContain('animate-in');
  });

  it('applies entrance animations when motion is allowed', () => {
    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-reduced-motion', 'false');
    expect(dialog.className).toContain('animate-in');
  });
});

describe('EndRoundModal dark terminal presentation', () => {
  it('renders a distinct win presentation with labeled net result', () => {
    render(
      <EndRoundModal
        isOpen
        onClose={vi.fn()}
        result={{ ...result, asset: 'XLM', direction: 'UP' }}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('data-outcome', 'win');
    expect(screen.getByText(/position settled in profit/i)).toBeInTheDocument();
    expect(screen.getByText('Net result')).toBeInTheDocument();
    expect(screen.getByText('Payout')).toBeInTheDocument();
    expect(screen.getByText('+$42.00')).toBeInTheDocument();
    expect(screen.getByText('XLM · UP')).toBeInTheDocument();
  });

  it('renders a distinct loss presentation', () => {
    render(
      <EndRoundModal
        isOpen
        onClose={vi.fn()}
        result={{ isWin: false, amount: 15, tip: 'Better luck next round.' }}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: /tough break/i });
    expect(dialog).toHaveAttribute('data-outcome', 'loss');
    expect(screen.getByText(/position settled at a loss/i)).toBeInTheDocument();
    expect(screen.getByText('Loss')).toBeInTheDocument();
    expect(screen.getByText('-$15.00')).toBeInTheDocument();
    expect(screen.getByText('Better luck next round.')).toBeInTheDocument();
  });

  it('no longer renders the contributor placeholder', () => {
    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);

    expect(screen.queryByText(/contributor task/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rebuild end round modal/i)).not.toBeInTheDocument();
  });
});

describe('EndRoundModal sharing functionality', () => {
  it('renders a continue button', () => {
    render(<EndRoundModal isOpen onClose={vi.fn()} result={{ ...result, asset: 'ETH', direction: 'DOWN' }} />);
    expect(screen.getByRole('button', { name: /continue to next round/i })).toBeInTheDocument();
  });

  it('renders net result details when modal is open', () => {
    render(<EndRoundModal isOpen onClose={vi.fn()} result={{ ...result, asset: 'ETH', direction: 'DOWN' }} />);
    expect(screen.getByText('+$42.00')).toBeInTheDocument();
    expect(screen.getByText(result.tip)).toBeInTheDocument();
  });

  it('shares the result through the Web Share API when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, canShare: vi.fn().mockReturnValue(true) });

    render(
      <EndRoundModal
        isOpen
        onClose={vi.fn()}
        result={{ ...result, asset: 'ETH', direction: 'DOWN' }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /share result/i }));

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const payload = share.mock.calls[0][0] as { title: string; text: string };
    expect(payload.title).toBe('Xelma round result');
    expect(payload.text).toContain('WIN +$42.00');
    expect(payload.text).toContain('ETH · DOWN');
    expect(payload.text).toContain(result.tip);
  });

  it('falls back to the clipboard when the Web Share API is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(
      <EndRoundModal
        isOpen
        onClose={vi.fn()}
        result={{ isWin: false, amount: 15, tip: 'Better luck next round.' }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /share result/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('LOSS -$15.00'));
    expect(await screen.findByText(/copied to clipboard/i)).toBeInTheDocument();
  });

  it('announces when sharing is not supported', async () => {
    vi.stubGlobal('navigator', {});

    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);

    fireEvent.click(screen.getByRole('button', { name: /share result/i }));

    expect(
      await screen.findByText(/sharing is not supported in this browser/i),
    ).toBeInTheDocument();
  });
});
