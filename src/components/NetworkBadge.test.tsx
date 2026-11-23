import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type NetworkBadge from './NetworkBadge';

const TESTNET_CLASSES = [
  'border-amber-500/40',
  'bg-amber-500/10',
  'text-amber-400',
];
const MAINNET_CLASSES = [
  'border-emerald-500/40',
  'bg-emerald-500/10',
  'text-emerald-400',
];

/**
 * `networkBadgeMeta` reads `VITE_STELLAR_NETWORK` once at module load, so
 * each case re-imports the badge (and the meta module) with a fresh module
 * registry, the same way `src/lib/friendbot.test.ts` handles env-dependent
 * modules.
 */
async function renderBadge(
  env: string | undefined,
  props: React.ComponentProps<typeof NetworkBadge> = {}
) {
  vi.resetModules();
  if (env === undefined) {
    vi.unstubAllEnvs();
    delete process.env.VITE_STELLAR_NETWORK;
  } else {
    vi.stubEnv('VITE_STELLAR_NETWORK', env);
  }
  const { default: Badge } = await import('./NetworkBadge');
  return render(<Badge {...props} />);
}

async function resolveBadgeMeta(env: string | undefined) {
  vi.resetModules();
  if (env === undefined) {
    vi.unstubAllEnvs();
    delete process.env.VITE_STELLAR_NETWORK;
  } else {
    vi.stubEnv('VITE_STELLAR_NETWORK', env);
  }
  const { resolveNetworkBadge } = await import('../lib/networkBadgeMeta');
  return resolveNetworkBadge();
}

describe('resolveNetworkBadge', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('resolves Testnet with amber classes for TESTNET', async () => {
    const meta = await resolveBadgeMeta('TESTNET');
    expect(meta).toEqual({
      label: 'Testnet',
      isMainnet: false,
      colorClasses: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
      networkId: 'testnet',
    });
  });

  it('resolves Mainnet with emerald classes for PUBLIC', async () => {
    const meta = await resolveBadgeMeta('PUBLIC');
    expect(meta).toEqual({
      label: 'Mainnet',
      isMainnet: true,
      colorClasses: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
      networkId: 'mainnet',
    });
  });

  it("resolves Mainnet for MAINNET (the other accepted mainnet value)", async () => {
    const meta = await resolveBadgeMeta('MAINNET');
    expect(meta.label).toBe('Mainnet');
    expect(meta.isMainnet).toBe(true);
    expect(meta.networkId).toBe('mainnet');
  });

  it('defaults to Testnet when the env var is unset', async () => {
    const meta = await resolveBadgeMeta(undefined);
    expect(meta.label).toBe('Testnet');
    expect(meta.isMainnet).toBe(false);
    expect(meta.networkId).toBe('testnet');
  });

  it('defaults to Testnet for an unknown network value', async () => {
    const meta = await resolveBadgeMeta('STANDALONE');
    expect(meta.label).toBe('Testnet');
    expect(meta.networkId).toBe('testnet');
  });
});

describe('NetworkBadge', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders the Testnet pill with amber classes on TESTNET', async () => {
    await renderBadge('TESTNET');

    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveTextContent('Testnet');
    expect(badge).toHaveAttribute('data-network', 'testnet');
    expect(badge).toHaveAttribute('aria-label', 'Settlement network');
    expect(badge).toHaveClass(...TESTNET_CLASSES);
    expect(badge).not.toHaveClass(...MAINNET_CLASSES);
  });

  it('renders the Mainnet pill with emerald classes on PUBLIC', async () => {
    await renderBadge('PUBLIC');

    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveTextContent('Mainnet');
    expect(badge).toHaveAttribute('data-network', 'mainnet');
    expect(badge).toHaveClass(...MAINNET_CLASSES);
    expect(badge).not.toHaveClass(...TESTNET_CLASSES);
  });

  it('renders Mainnet for MAINNET', async () => {
    await renderBadge('MAINNET');

    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveTextContent('Mainnet');
    expect(badge).toHaveAttribute('data-network', 'mainnet');
  });

  it('treats the env value case-insensitively (lowercase public)', async () => {
    await renderBadge('public');

    expect(screen.getByTestId('network-badge')).toHaveTextContent('Mainnet');
  });

  it('renders Testnet when the env var is unset', async () => {
    await renderBadge(undefined);

    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveTextContent('Testnet');
    expect(badge).toHaveAttribute('data-network', 'testnet');
  });

  it('renders Testnet for an unknown network value', async () => {
    await renderBadge('STANDALONE');

    expect(screen.getByTestId('network-badge')).toHaveTextContent('Testnet');
  });

  it('uses the default sizing and pill base classes', async () => {
    await renderBadge('TESTNET');

    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveClass(
      'rounded-full',
      'border',
      'font-bold',
      'tracking-wide',
      'px-2.5',
      'py-0.5',
      'text-xs'
    );
  });

  it('uses compact sizing with the compact variant', async () => {
    await renderBadge('TESTNET', { variant: 'compact' });

    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-[11px]');
    expect(badge).not.toHaveClass('px-2.5', 'text-xs');
  });

  it('merges a custom className onto the badge', async () => {
    await renderBadge('TESTNET', { className: 'my-custom-class' });

    const badge = screen.getByTestId('network-badge');
    expect(badge).toHaveClass('my-custom-class');
    expect(badge).toHaveTextContent('Testnet');
  });
});
