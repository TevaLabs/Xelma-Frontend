import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import NetworkBadge from './NetworkBadge';
import * as networkBadgeMeta from '../lib/networkBadgeMeta';

describe('NetworkBadge', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly with default props', () => {
    render(<NetworkBadge />);
    const badge = screen.getByTestId('network-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('aria-label', 'Settlement network');
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs');
  });

  it('renders correctly with compact variant', () => {
    render(<NetworkBadge variant="compact" />);
    const badge = screen.getByTestId('network-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-[11px]');
  });

  it('applies custom className', () => {
    render(<NetworkBadge className="custom-badge-class" />);
    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveClass('custom-badge-class');
  });

  describe('networkBadgeMeta mapping', () => {
    it('renders TESTNET network mapping with correct label, colors, and data attribute', () => {
      vi.spyOn(networkBadgeMeta, 'resolveNetworkBadge').mockReturnValue({
        label: 'Testnet',
        isMainnet: false,
        colorClasses: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
        networkId: 'testnet',
      });

      render(<NetworkBadge />);
      const badge = screen.getByTestId('network-badge');

      expect(badge).toHaveTextContent('Testnet');
      expect(badge).toHaveAttribute('data-network', 'testnet');
      expect(badge).toHaveClass(
        'rounded-full',
        'border',
        'font-bold',
        'tracking-wide',
        'border-amber-500/40',
        'bg-amber-500/10',
        'text-amber-400',
      );
    });

    it('renders PUBLIC / Mainnet network mapping with correct label, colors, and data attribute', () => {
      vi.spyOn(networkBadgeMeta, 'resolveNetworkBadge').mockReturnValue({
        label: 'Mainnet',
        isMainnet: true,
        colorClasses: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
        networkId: 'mainnet',
      });

      render(<NetworkBadge />);
      const badge = screen.getByTestId('network-badge');

      expect(badge).toHaveTextContent('Mainnet');
      expect(badge).toHaveAttribute('data-network', 'mainnet');
      expect(badge).toHaveClass(
        'rounded-full',
        'border',
        'font-bold',
        'tracking-wide',
        'border-emerald-500/40',
        'bg-emerald-500/10',
        'text-emerald-400',
      );
    });
  });
});
