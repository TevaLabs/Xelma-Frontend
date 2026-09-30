import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NetworkBadge from './NetworkBadge';
import * as networkBadgeMeta from '../lib/networkBadgeMeta';

describe('NetworkBadge Component (#678)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Testnet badge correctly', () => {
    vi.spyOn(networkBadgeMeta, 'resolveNetworkBadge').mockReturnValue({
      label: 'Testnet',
      isMainnet: false,
      colorClasses: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      networkId: 'testnet',
    });

    render(<NetworkBadge />);

    const badge = screen.getByTestId('network-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Testnet');
    expect(badge).toHaveAttribute('data-network', 'testnet');
    expect(badge).toHaveAttribute('aria-label', 'Settlement network');
    expect(badge.className).toContain('text-amber-400');
  });

  it('renders Mainnet badge correctly', () => {
    vi.spyOn(networkBadgeMeta, 'resolveNetworkBadge').mockReturnValue({
      label: 'Mainnet',
      isMainnet: true,
      colorClasses: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
      networkId: 'mainnet',
    });

    render(<NetworkBadge />);

    const badge = screen.getByTestId('network-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Mainnet');
    expect(badge).toHaveAttribute('data-network', 'mainnet');
    expect(badge.className).toContain('text-emerald-400');
  });

  it('applies compact variant styles', () => {
    vi.spyOn(networkBadgeMeta, 'resolveNetworkBadge').mockReturnValue({
      label: 'Testnet',
      isMainnet: false,
      colorClasses: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      networkId: 'testnet',
    });

    render(<NetworkBadge variant="compact" />);

    const badge = screen.getByTestId('network-badge');
    expect(badge.className).toContain('text-[11px]');
  });

  it('passes additional className props', () => {
    vi.spyOn(networkBadgeMeta, 'resolveNetworkBadge').mockReturnValue({
      label: 'Testnet',
      isMainnet: false,
      colorClasses: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      networkId: 'testnet',
    });

    render(<NetworkBadge className="custom-extra-class" />);

    const badge = screen.getByTestId('network-badge');
    expect(badge.className).toContain('custom-extra-class');
  });
});
