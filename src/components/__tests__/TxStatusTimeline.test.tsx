import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { toast } from 'sonner';
import TxStatusTimeline, { formatTxHash, useTxStatusMachine } from '../TxStatusTimeline';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('formatTxHash', () => {
  it('returns the hash unchanged when shorter than the truncation window', () => {
    expect(formatTxHash('TXABC')).toBe('TXABC');
  });

  it('truncates long hashes with leading and trailing segments', () => {
    expect(formatTxHash('0123456789abcdef')).toBe('012345…abcdef');
  });

  it('supports custom leading/trailing lengths', () => {
    expect(formatTxHash('abcdefghijklmnop', 4, 4)).toBe('abcd…mnop');
  });

  it('returns an empty string for empty input', () => {
    expect(formatTxHash('')).toBe('');
  });
});

describe('useTxStatusMachine', () => {
  it('starts in idle with no in-flight transaction', () => {
    const { result } = renderHook(() => useTxStatusMachine());
    expect(result.current.step).toBe('idle');
    expect(result.current.isInFlight).toBe(false);
  });

  it('guards against double-starts while a transaction is in-flight', () => {
    const { result } = renderHook(() => useTxStatusMachine());

    act(() => {
      expect(result.current.start()).toBe(true);
    });
    expect(result.current.step).toBe('preparing');
    expect(result.current.isInFlight).toBe(true);

    // Second start must be blocked while in-flight
    act(() => {
      expect(result.current.start()).toBe(false);
    });
    expect(result.current.isInFlight).toBe(true);

    act(() => result.current.succeed('TXHASH'));
    expect(result.current.step).toBe('success');
    expect(result.current.isInFlight).toBe(false);

    // Machine can be started again after completing
    act(() => {
      expect(result.current.start()).toBe(true);
    });
  });

  it('advances through progress steps and stores the tx hash on success', () => {
    const { result } = renderHook(() => useTxStatusMachine());

    act(() => result.current.start());
    act(() => result.current.updateStatus('signing'));
    expect(result.current.step).toBe('signing');
    act(() => result.current.updateStatus('submitting'));
    expect(result.current.step).toBe('submitting');

    act(() => result.current.succeed('0xHASH'));
    expect(result.current.step).toBe('success');
    expect(result.current.txHash).toBe('0xHASH');
  });

  it('records an error message on failure and allows retry', () => {
    const { result } = renderHook(() => useTxStatusMachine());

    act(() => result.current.start());
    act(() => result.current.fail('User rejected'));
    expect(result.current.step).toBe('error');
    expect(result.current.errorMessage).toBe('User rejected');
    expect(result.current.isInFlight).toBe(false);

    // Retry works after a failure
    act(() => {
      expect(result.current.start()).toBe(true);
    });
  });

  it('resets to idle', () => {
    const { result } = renderHook(() => useTxStatusMachine());

    act(() => result.current.start());
    act(() => result.current.succeed('TX'));
    act(() => result.current.reset());
    expect(result.current.step).toBe('idle');
    expect(result.current.txHash).toBe('');
    expect(result.current.errorMessage).toBe('');
  });
});

describe('TxStatusTimeline', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  it('renders nothing when idle', () => {
    const { container } = render(<TxStatusTimeline step="idle" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders clear copy for each Freighter step', () => {
    const { rerender } = render(<TxStatusTimeline step="preparing" />);
    expect(screen.getByText(/preparing transaction/i)).toBeInTheDocument();
    expect(screen.getByText(/assembling the contract call/i)).toBeInTheDocument();

    rerender(<TxStatusTimeline step="signing" />);
    expect(screen.getByText(/waiting for freighter signature/i)).toBeInTheDocument();
    expect(screen.getByText(/approve the transaction/i)).toBeInTheDocument();

    rerender(<TxStatusTimeline step="submitting" />);
    expect(screen.getByText(/submitting transaction/i)).toBeInTheDocument();
    expect(screen.getByText(/broadcasting the signed transaction/i)).toBeInTheDocument();

    rerender(<TxStatusTimeline step="syncing" />);
    expect(screen.getByText(/syncing prediction/i)).toBeInTheDocument();
  });

  it('honours per-step copy overrides', () => {
    render(
      <TxStatusTimeline
        step="preparing"
        stepCopy={{ preparing: 'Preparing Claim...' }}
      />,
    );
    expect(screen.getByText('Preparing Claim...')).toBeInTheDocument();
  });

  it('shows truncated tx hash and explorer link on success', () => {
    render(
      <TxStatusTimeline
        step="success"
        txHash="0123456789abcdef"
        successTitle="Prediction Submitted!"
      />,
    );

    expect(screen.getByText('Prediction Submitted!')).toBeInTheDocument();
    expect(screen.getByText('Tx: 012345…abcdef')).toBeInTheDocument();
    expect(screen.getByText('Tx: 012345…abcdef')).toHaveAttribute('title', '0123456789abcdef');

    const link = screen.getByRole('link', { name: /view on stellarexpert/i });
    expect(link).toHaveAttribute('href', 'https://stellarexpert.org/tx/0123456789abcdef');
  });

  it('copies the full transaction hash and confirms success without replacing the explorer link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    render(<TxStatusTimeline step="success" txHash="0123456789abcdef" />);

    const copyButton = screen.getByRole('button', { name: 'Copy transaction hash' });
    expect(copyButton.closest('a')).toBeNull();
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('0123456789abcdef');
      expect(toast.success).toHaveBeenCalledWith('Transaction hash copied');
    });
    expect(screen.getByRole('link', { name: /view on stellarexpert/i })).toHaveAttribute(
      'href',
      'https://stellarexpert.org/tx/0123456789abcdef',
    );
  });

  it('shows an error toast when clipboard access is unavailable', async () => {
    vi.stubGlobal('navigator', {});
    render(<TxStatusTimeline step="success" txHash="0123456789abcdef" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy transaction hash' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Copy failed', {
        description: 'Your browser may be blocking clipboard access.',
      });
    });
  });

  it('shows an error toast when copying is rejected', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    render(<TxStatusTimeline step="success" txHash="0123456789abcdef" />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy transaction hash' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Copy failed', {
        description: 'Your browser may be blocking clipboard access.',
      });
    });
  });

  it('renders the Done button when onDone is provided', () => {
    const onDone = vi.fn();
    render(<TxStatusTimeline step="success" txHash="abc" onDone={onDone} />);
    screen.getByRole('button', { name: /close/i }).click();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('renders error message with Retry and Cancel actions', () => {
    const onRetry = vi.fn();
    const onDone = vi.fn();
    render(
      <TxStatusTimeline
        step="error"
        errorMessage="User rejected"
        onRetry={onRetry}
        onDone={onDone}
      />,
    );

    expect(screen.getByText(/transaction failed/i)).toBeInTheDocument();
    expect(screen.getByText('User rejected')).toBeInTheDocument();

    screen.getByRole('button', { name: /retry/i }).click();
    expect(onRetry).toHaveBeenCalledTimes(1);

    screen.getByRole('button', { name: /cancel/i }).click();
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
