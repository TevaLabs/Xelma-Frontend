import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TxStatusTimeline, { formatTxHash, useTxStatusMachine } from '../TxStatusTimeline';

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
