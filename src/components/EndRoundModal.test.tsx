import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import EndRoundModal from './EndRoundModal';
import { useSettingsStore } from '../store/useSettingsStore';

const result = {
  isWin: true,
  amount: 42,
  tip: 'Stay patient and size the next prediction carefully.',
};

/**
 * Harness that mirrors the Dashboard wiring: a trigger button that opens the
 * modal, plus a live `isOpen` flag so open → close → focus-restore can be
 * exercised end to end.
 */
function EndRoundHarness({
  onClose,
  result: modalResult,
}: {
  onClose: () => void;
  result?: typeof result;
}) {
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
        result={modalResult}
      />
    </>
  );
}

describe('EndRoundModal accessibility', () => {
  it('renders an accessible modal dialog with title and description', () => {
    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);

    const dialog = screen.getByRole('dialog', { name: /spectacular win/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-describedby', 'end-round-modal-description');
    expect(screen.getByText('You made all the right moves.')).toBeInTheDocument();
  });

  it('renders a dark glass terminal card, not a light card', () => {
    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);

    const dialog = screen.getByRole('dialog', { name: /spectacular win/i });
    expect(dialog.className).toContain('glass-card');
    expect(dialog.className).toContain('bg-[#0A0F1A]');
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

  it('opens via the trigger, focuses the Continue CTA, and closes on Escape restoring trigger focus', async () => {
    const onClose = vi.fn();
    render(<EndRoundHarness onClose={onClose} result={result} />);

    const trigger = screen.getByRole('button', { name: /open result/i });
    trigger.focus();
    fireEvent.click(trigger);

    const continueButton = await screen.findByRole('button', {
      name: /continue to next round/i,
    });
    await waitFor(() => expect(continueButton).toHaveFocus());

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('closes via the Continue CTA and restores focus to the trigger', async () => {
    const onClose = vi.fn();
    render(<EndRoundHarness onClose={onClose} result={result} />);

    const trigger = screen.getByRole('button', { name: /open result/i });
    trigger.focus();
    fireEvent.click(trigger);

    const continueButton = await screen.findByRole('button', {
      name: /continue to next round/i,
    });
    fireEvent.click(continueButton);

    expect(onClose).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /open result/i })).toHaveFocus();
    });
  });

  it('closes via the backdrop click', () => {
    const onClose = vi.fn();
    render(<EndRoundModal isOpen onClose={onClose} result={result} />);

    const backdrop = document.querySelector('.bg-black\\/85');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab focus inside the dialog', async () => {
    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);

    const continueButton = screen.getByRole('button', {
      name: /continue to next round/i,
    });
    const shareButton = screen.getByRole('button', { name: /share result/i });
    const closeButton = screen.getByRole('button', { name: /close result/i });

    await waitFor(() => expect(continueButton).toHaveFocus());

    // Tab from the last focusable (share) wraps back to the first (close).
    shareButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    // Shift+Tab from the first focusable wraps back to the last.
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(shareButton).toHaveFocus();
  });

  it('locks body scroll while open and restores it on close', async () => {
    const onClose = vi.fn();
    render(<EndRoundHarness onClose={onClose} result={result} />);

    fireEvent.click(screen.getByRole('button', { name: /open result/i }));
    expect(document.body.style.overflow).toBe('hidden');

    fireEvent.click(
      await screen.findByRole('button', { name: /continue to next round/i }),
    );
    expect(document.body.style.overflow).toBe('');
  });

  it('skips entrance animations under reduced motion', () => {
    useSettingsStore.setState({ motionPreference: 'reduce' });

    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);

    const dialog = screen.getByRole('dialog', { name: /spectacular win/i });
    expect(dialog.className).not.toContain('animate-in');
  });
});

describe('EndRoundModal sharing functionality', () => {
  let shareSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });

    shareSpy = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      share: shareSpy,
      canShare: vi.fn().mockReturnValue(true),
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a continue button', () => {
    render(
      <EndRoundModal
        isOpen
        onClose={vi.fn()}
        result={{ ...result, asset: 'ETH', direction: 'DOWN' }}
      />,
    );
    expect(screen.getByRole('button', { name: /continue to next round/i })).toBeInTheDocument();
  });

  it('renders net result details when modal is open', () => {
    render(
      <EndRoundModal
        isOpen
        onClose={vi.fn()}
        result={{ ...result, asset: 'ETH', direction: 'DOWN' }}
      />,
    );
    expect(screen.getByText('+$42.00')).toBeInTheDocument();
    expect(screen.getByText(result.tip)).toBeInTheDocument();
  });

  it('shares via the Web Share API when available', async () => {
    render(
      <EndRoundModal
        isOpen
        onClose={vi.fn()}
        result={{ ...result, asset: 'ETH', direction: 'DOWN' }}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /share result/i }));

    await waitFor(() => {
      expect(shareSpy).toHaveBeenCalledTimes(1);
    });
    expect(shareSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Xelma',
        text: expect.stringContaining('WIN ETH +$42.00'),
      }),
    );
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
  });

  it('falls back to the clipboard when Web Share is unavailable and shows the copied state', async () => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);

    const shareButton = screen.getByRole('button', { name: /share result/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('WIN +$42.00'),
      );
    });
    expect(await screen.findByText(/copied to clipboard/i)).toBeInTheDocument();
  });

  it('keeps the share label stable when the user dismisses the share sheet', async () => {
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(new Error('user dismissed')),
    });

    render(<EndRoundModal isOpen onClose={vi.fn()} result={result} />);

    fireEvent.click(screen.getByRole('button', { name: /share result/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /share result/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/copied to clipboard/i)).not.toBeInTheDocument();
  });
});
