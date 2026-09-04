import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StatsCard from './StatsCard';
import { useWalletStore } from '../store/useWalletStore';
import { claim_winnings } from '../lib/xelma-contract';
import type { MockUserStats } from '../types';

// Keep the real selectors (selectIsWalletConnected derives from state) and only
// stub the hook itself so we can drive wallet state per test.
vi.mock('../store/useWalletStore', async (importActual) => {
  const actual = await importActual<typeof import('../store/useWalletStore')>();
  return { ...actual, useWalletStore: vi.fn() };
});

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../lib/xelma-contract', () => ({
  claim_winnings: vi.fn(),
}));

vi.mock('./RankProgressBar', () => ({
  default: ({ xp }: { xp: number }) => (
    <div>
      <div>Rank <span>Analyst</span></div>
      <div>Experience <span>{xp} XP</span></div>
    </div>
  ),
}));

const baseStats: MockUserStats = {
  balance: 750.5,
  pendingWinnings: 0,
  totalWins: 12,
  totalLosses: 4,
  currentStreak: 3,
  xp: 1500,
  rank: 'Analyst',
};

interface WalletStateOverrides {
  status?: 'idle' | 'connected';
  publicKey?: string | null;
}

function setWalletState({ status = 'idle', publicKey = null }: WalletStateOverrides = {}) {
  const state = {
    status,
    publicKey,
    checkConnection: vi.fn().mockResolvedValue(undefined),
  };
  vi.mocked(useWalletStore).mockImplementation((selector: any) =>
    typeof selector === 'function' ? selector(state) : state,
  );
}

function renderCard(stats: Partial<MockUserStats> = {}, props: Partial<Parameters<typeof StatsCard>[0]> = {}) {
  return render(<StatsCard stats={{ ...baseStats, ...stats }} {...props} />);
}

describe('StatsCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setWalletState();
  });

  describe('primary stat rows', () => {
    it('renders the section with an accessible heading', () => {
      renderCard();
      expect(screen.getByRole('heading', { name: /your record/i })).toBeInTheDocument();
    });

    it('renders the formatted practice balance', () => {
      renderCard();
      const row = screen.getByText('Practice Balance').closest('div')!;
      expect(within(row).getByText('750.50 vXLM')).toBeInTheDocument();
    });

    it('renders the current accuracy streak', () => {
      renderCard();
      const row = screen.getByText('Accuracy Streak').closest('div')!;
      expect(within(row).getByText('3 rounds')).toBeInTheDocument();
    });

    it('renders the correct and incorrect counts', () => {
      renderCard();
      const row = screen.getByText('Correct / Incorrect').closest('div')!;
      expect(within(row).getByText('12')).toBeInTheDocument();
      expect(within(row).getByText('4')).toBeInTheDocument();
    });

    it('renders rank progress bar mock', () => {
      renderCard();
      // Rank/XP section now renders RankProgressBar component
      expect(screen.getByText(/Analyst/i)).toBeInTheDocument();
      expect(screen.getByText(/1500 XP/i)).toBeInTheDocument();
      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('Analyst')).toBeInTheDocument();
    });

    it('renders experience points in mock', () => {
      renderCard();
      // XP is now displayed via RankProgressBar component
      expect(screen.getByText(/1500 XP/i)).toBeInTheDocument();
      expect(screen.getByText('Experience')).toBeInTheDocument();
      expect(screen.getByText('1500 XP')).toBeInTheDocument();
    });

    it('shows the pending winnings row only when there are winnings', () => {
      renderCard();
      expect(screen.queryByText('Pending Winnings')).not.toBeInTheDocument();

      renderCard({ pendingWinnings: 2500 });
      const row = screen.getByText('Pending Winnings').closest('div')!;
      expect(within(row).getByText('2,500 vXLM')).toBeInTheDocument();
    });
  });

  describe('Claim Rewards button', () => {
    it('is disabled when the wallet is disconnected even with pending winnings', () => {
      setWalletState({ status: 'idle', publicKey: null });
      renderCard({ pendingWinnings: 1000 });

      const button = screen.getByRole('button', { name: /claim rewards/i });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('title', 'Connect wallet to claim');
    });

    it('is disabled when connected but there are no pending winnings', () => {
      setWalletState({ status: 'connected', publicKey: 'GTEST' });
      renderCard({ pendingWinnings: 0 });

      const button = screen.getByRole('button', { name: /claim rewards/i });
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('title', 'No pending rewards');
    });

    it('is enabled when connected and there are pending winnings', () => {
      setWalletState({ status: 'connected', publicKey: 'GTEST' });
      renderCard({ pendingWinnings: 1000 });

      const button = screen.getByRole('button', { name: /claim rewards/i });
      expect(button).toBeEnabled();
      expect(button).toHaveAttribute('title', 'Claim your rewards');
    });
  });

  describe('loading and error states', () => {
    it('renders a loading state without the stat rows', () => {
      renderCard({}, { isLoading: true });
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
      expect(screen.queryByText('Practice Balance')).not.toBeInTheDocument();
    });

    it('renders the error message and a retry button when onRetry is provided', () => {
      const onRetry = vi.fn();
      renderCard({}, { error: 'Failed to load stats', onRetry });

      expect(screen.getByText('Failed to load stats')).toBeInTheDocument();
      const retry = screen.getByRole('button', { name: /retry/i });
      retry.click();
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('omits the retry button when no onRetry handler is provided', () => {
      renderCard({}, { error: 'Failed to load stats' });
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });

    it('renders an empty/unavailable state when stats is null', () => {
      render(<StatsCard stats={null} />);
      expect(screen.getByText('User stats unavailable')).toBeInTheDocument();
      expect(screen.queryByText('Practice Balance')).not.toBeInTheDocument();
    });
  });

  describe('claim flow status machine', () => {
    it('shows the shared status timeline and a truncated tx hash on success', async () => {
      setWalletState({ status: 'connected', publicKey: 'GTEST' });
      vi.mocked(claim_winnings).mockResolvedValue({
        txHash: '0123456789abcdef',
        ledger: 1,
      });
      renderCard({ pendingWinnings: 1000 });

      fireEvent.click(screen.getByRole('button', { name: /claim rewards/i }));

      await waitFor(() => {
        expect(screen.getByText('Preparing Claim...')).toBeInTheDocument();
      });
      expect(screen.queryByRole('button', { name: /claim rewards/i })).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Rewards Claimed!')).toBeInTheDocument();
      });
      expect(screen.getByText('Tx: 012345…abcdef')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /view on stellarexpert/i })).toHaveAttribute(
        'href',
        expect.stringContaining('0123456789abcdef'),
      );
    });

    it('prevents double-submit while a claim is in-flight', async () => {
      setWalletState({ status: 'connected', publicKey: 'GTEST' });
      let resolveClaim!: (value: { txHash: string; ledger: number }) => void;
      vi.mocked(claim_winnings).mockImplementation(
        () =>
          new Promise<{ txHash: string; ledger: number }>((resolve) => {
            resolveClaim = resolve;
          }),
      );
      renderCard({ pendingWinnings: 1000 });

      fireEvent.click(screen.getByRole('button', { name: /claim rewards/i }));
      await waitFor(() => {
        expect(screen.getByText('Preparing Claim...')).toBeInTheDocument();
      });

      // Button is replaced by the timeline while in-flight, so it cannot be re-clicked.
      expect(screen.queryByRole('button', { name: /claim rewards/i })).not.toBeInTheDocument();

      resolveClaim({ txHash: 'abc', ledger: 1 });
      await waitFor(() => {
        expect(screen.getByText('Rewards Claimed!')).toBeInTheDocument();
      });
      expect(claim_winnings).toHaveBeenCalledTimes(1);
    });

    it('shows an inline error and retry action when the claim fails', async () => {
      setWalletState({ status: 'connected', publicKey: 'GTEST' });
      vi.mocked(claim_winnings).mockRejectedValue(new Error('Freighter signing rejected'));
      renderCard({ pendingWinnings: 1000 });

      fireEvent.click(screen.getByRole('button', { name: /claim rewards/i }));

      await waitFor(() => {
        expect(screen.getByText(/transaction failed/i)).toBeInTheDocument();
      });
      expect(screen.getByText('Freighter signing rejected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });
});
