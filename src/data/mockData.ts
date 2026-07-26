import type { MockRound, MockUserStats, RankTier, RecentActivityItem } from '../types';

export const RANK_TIERS: RankTier[] = [
  { name: 'Rookie', minXp: 0, label: 'Getting Started' },
  { name: 'Trader', minXp: 500, label: 'Active Trader' },
  { name: 'Analyst', minXp: 1000, label: 'Market Analyst' },
  { name: 'Strategist', minXp: 2000, label: 'Trading Strategist' },
  { name: 'Master', minXp: 4000, label: 'Trading Master' },
  { name: 'Legend', minXp: 8000, label: 'Trading Legend' },
];

export function getRankTiers(xp: number): {
  current: RankTier;
  next: RankTier | null;
  progress: number;
} {
  const current = [...RANK_TIERS].reverse().find((t) => xp >= t.minXp) ?? RANK_TIERS[0];
  const currentIndex = RANK_TIERS.indexOf(current);
  const next = currentIndex < RANK_TIERS.length - 1 ? RANK_TIERS[currentIndex + 1] : null;

  let progress = 100;
  if (next) {
    const range = next.minXp - current.minXp;
    const earned = xp - current.minXp;
    progress = Math.min((earned / range) * 100, 100);
  }

  return { current, next, progress };
}

export const mockRounds: MockRound[] = [
  {
    id: 1,
    asset: 'BTC',
    mode: 'updown',
    status: 'live',
    startPrice: 67420,
    poolUp: 2800,
    poolDown: 1400,
    closesInSeconds: 194,
  },
  {
    id: 2,
    asset: 'ETH',
    mode: 'precision',
    status: 'live',
    startPrice: 3241,
    totalPool: 1800,
    predictionCount: 22,
    closesInSeconds: 760,
  },
  {
    id: 3,
    asset: 'XLM',
    mode: 'updown',
    status: 'new',
    startPrice: 0.2891,
    poolUp: 200,
    poolDown: 0,
    closesInSeconds: 1200,
  },
];

export const mockUserStats: MockUserStats = {
  balance: 1000,
  pendingWinnings: 0,
  totalWins: 3,
  totalLosses: 1,
  currentStreak: 3,
  xp: 410,
  rank: 'Rookie',
};

export const mockRecentActivity: RecentActivityItem[] = [
  { id: '1', asset: 'BTC', result: 'Won', amount: 150, mode: 'updown' },
  { id: '2', asset: 'ETH', result: 'Lost', amount: 50, mode: 'precision' },
  { id: '3', asset: 'XLM', result: 'Won', amount: 80, mode: 'updown' },
  { id: '4', asset: 'BTC', result: 'Won', amount: 120, mode: 'updown' },
];

export const mockLandingStats = {
  totalRounds: 1247,
  vXlmDistributed: 4_200_000,
  activePlayers: 893,
};
