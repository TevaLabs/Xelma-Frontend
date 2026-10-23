import '@testing-library/jest-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import HudStatusRow from './HudStatusRow';
import { useRoundStore } from '../../store/useRoundStore';
import { useWalletStore } from '../../store/useWalletStore';

const mocks = vi.hoisted(() => ({ socketStatus: 'connected' }));

vi.mock('../../hooks/useConnectionStatus', () => ({
  useConnectionStatus: () => ({
    status: mocks.socketStatus,
    isConnected: mocks.socketStatus === 'connected',
    reconnect: vi.fn(),
  }),
}));

const chip = (label: string) => screen.getByTestId(`status-chip-${label}`);

/** The chip's assistive text, so we can assert state without relying on colour. */
const spokenText = (label: string) =>
  chip(label)
    .querySelector('.sr-only')
    ?.textContent?.replace(/^\s*:\s*/, '')
    .trim();

describe('HudStatusRow', () => {
  beforeEach(() => {
    mocks.socketStatus = 'connected';
    useRoundStore.setState({ isRoundActive: true, isLoading: false, error: null });
    useWalletStore.setState({ status: 'connected', publicKey: 'GTEST123' });
  });

  afterEach(() => {
    cleanup();
  });

  it('groups the chips under an accessible name', () => {
    render(<HudStatusRow playerCount={24} />);
    expect(screen.getByRole('group', { name: 'Platform status' })).toBeInTheDocument();
  });

  it('renders the Round / Stream / Wallet / Playing chips', () => {
    render(<HudStatusRow playerCount={24} />);
    ['round', 'stream', 'wallet', 'playing'].forEach((label) => {
      expect(chip(label)).toBeInTheDocument();
    });
  });

  it('speaks the live state for every chip', () => {
    render(<HudStatusRow playerCount={24} />);
    expect(spokenText('round')).toBe('Live');
    expect(spokenText('stream')).toBe('Live feed');
    expect(spokenText('wallet')).toBe('Connected');
    expect(spokenText('playing')).toBe('24 playing now');
    expect(chip('playing')).toHaveTextContent('24');
  });

  it('maps a round error onto the error chip', () => {
    useRoundStore.setState({ isRoundActive: false, isLoading: false, error: 'Round lookup failed' });
    render(<HudStatusRow />);
    expect(chip('round')).toHaveAttribute('data-status', 'error');
    expect(spokenText('round')).toBe('Round lookup failed');
  });

  it('maps a loading round onto the syncing chip', () => {
    useRoundStore.setState({ isRoundActive: false, isLoading: true, error: null });
    render(<HudStatusRow />);
    expect(chip('round')).toHaveAttribute('data-status', 'loading');
    expect(spokenText('round')).toBe('Syncing round');
  });

  it('maps an inactive round onto the idle chip', () => {
    useRoundStore.setState({ isRoundActive: false, isLoading: false, error: null });
    render(<HudStatusRow />);
    expect(chip('round')).toHaveAttribute('data-status', 'inactive');
    expect(spokenText('round')).toBe('No active round');
  });

  it('reports a reconnecting stream', () => {
    mocks.socketStatus = 'reconnecting';
    render(<HudStatusRow />);
    expect(chip('stream')).toHaveAttribute('data-status', 'loading');
    expect(spokenText('stream')).toBe('Reconnecting');
  });

  it('reports a disconnected stream as offline', () => {
    mocks.socketStatus = 'disconnected';
    render(<HudStatusRow />);
    expect(chip('stream')).toHaveAttribute('data-status', 'inactive');
    expect(spokenText('stream')).toBe('Offline');
  });

  it('reports a wallet that is still connecting', () => {
    useWalletStore.setState({ status: 'connecting', publicKey: null });
    render(<HudStatusRow />);
    expect(chip('wallet')).toHaveAttribute('data-status', 'loading');
    expect(spokenText('wallet')).toBe('Connecting');
  });

  it('reports a disconnected wallet', () => {
    useWalletStore.setState({ status: 'idle', publicKey: null });
    render(<HudStatusRow />);
    expect(chip('wallet')).toHaveAttribute('data-status', 'inactive');
    expect(spokenText('wallet')).toBe('Not connected');
  });

  it('reports a wallet error', () => {
    useWalletStore.setState({ status: 'error', publicKey: null });
    render(<HudStatusRow />);
    expect(chip('wallet')).toHaveAttribute('data-status', 'error');
    expect(spokenText('wallet')).toBe('Wallet error');
  });

  it('falls back to a spoken placeholder when no live player count exists', () => {
    render(<HudStatusRow />);
    expect(chip('playing')).toHaveAttribute('data-status', 'inactive');
    expect(spokenText('playing')).toBe('Awaiting live count');
  });

  it('does not render a contributor task placeholder', () => {
    render(<HudStatusRow playerCount={24} />);
    expect(screen.queryByText(/contributor task/i)).not.toBeInTheDocument();
    expect(screen.getByTestId('status-chip-wallet')).toBeInTheDocument();
  });

  it('exposes the raw state on the container for integration checks', () => {
    render(<HudStatusRow playerCount={24} />);
    const group = screen.getByRole('group', { name: 'Platform status' });
    expect(group).toHaveAttribute('data-round-active', 'true');
    expect(group).toHaveAttribute('data-wallet-connected', 'true');
    expect(group).toHaveAttribute('data-stream-status', 'connected');
    expect(group).toHaveAttribute('data-player-count', '24');
  });
});
