import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NetworkMismatchCard from './NetworkMismatchCard';
import { useWalletStore } from '../store/useWalletStore';

describe('NetworkMismatchCard', () => {
  beforeEach(() => {
    useWalletStore.setState({
      status: 'idle',
      publicKey: null,
      network: null,
      networkMismatch: false,
      checkConnection: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('renders only when a connected wallet has a network mismatch', () => {
    const { rerender } = render(<NetworkMismatchCard />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    useWalletStore.setState({
      status: 'connected',
      publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      network: 'PUBLIC',
      networkMismatch: true,
    });
    rerender(<NetworkMismatchCard />);

    expect(screen.getByRole('alert')).toHaveTextContent('Freighter is on the wrong network');
    expect(screen.getByRole('button', { name: 'Re-check network' })).toBeInTheDocument();
  });

  it('re-checks the wallet network when requested', () => {
    const checkConnection = vi.fn().mockResolvedValue(undefined);
    useWalletStore.setState({
      status: 'connected',
      publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      network: 'PUBLIC',
      networkMismatch: true,
      checkConnection,
    });
    render(<NetworkMismatchCard />);

    fireEvent.click(screen.getByRole('button', { name: 'Re-check network' }));

    expect(checkConnection).toHaveBeenCalledOnce();
  });

  it('provides help links and dismisses the warning', () => {
    useWalletStore.setState({
      status: 'connected',
      publicKey: 'GTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      network: 'PUBLIC',
      networkMismatch: true,
    });
    render(<NetworkMismatchCard />);

    expect(screen.getByRole('link', { name: 'Freighter network guide' })).toHaveAttribute(
      'target',
      '_blank'
    );
    expect(screen.getByRole('link', { name: 'About Stellar networks' })).toHaveAttribute(
      'target',
      '_blank'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
