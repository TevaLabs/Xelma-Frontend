import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StatsCard from './StatsCard';
import { useWalletStore } from '../store/useWalletStore';
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

    it('renders the rank badge', () => {
      renderCard();
      const row = screen.getByText('Rank').closest('div')!;
      expect(within(row).getByText('Analyst')).toBeInTheDocument();
    });

    it('renders the experience points', () => {
      renderCard();
      const row = screen.getByText('Experience').closest('div')!;
      expect(within(row).getByText('1500 XP')).toBeInTheDocument();
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
  });
});
