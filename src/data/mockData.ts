import type { MockRound, MockUserStats, RankTier, RecentActivityItem, PricePoint } from '../types';

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
  // BTC rounds
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
    id: 4,
    asset: 'BTC',
    mode: 'precision',
    status: 'live',
    startPrice: 67850,
    totalPool: 3200,
    predictionCount: 45,
    closesInSeconds: 540,
  },
  {
    id: 7,
    asset: 'BTC',
    mode: 'updown',
    status: 'new',
    startPrice: 67210,
    poolUp: 0,
    poolDown: 0,
    closesInSeconds: 2400,
  },
  // ETH rounds
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
    id: 5,
    asset: 'ETH',
    mode: 'updown',
    status: 'live',
    startPrice: 3180,
    poolUp: 900,
    poolDown: 1200,
    closesInSeconds: 350,
  },
  {
    id: 8,
    asset: 'ETH',
    mode: 'updown',
    status: 'new',
    startPrice: 3255,
    poolUp: 0,
    poolDown: 0,
    closesInSeconds: 1800,
  },
  // XLM rounds
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
  {
    id: 6,
    asset: 'XLM',
    mode: 'precision',
    status: 'live',
    startPrice: 0.2915,
    totalPool: 650,
    predictionCount: 12,
    closesInSeconds: 890,
  },
  {
    id: 9,
    asset: 'XLM',
    mode: 'updown',
    status: 'live',
    startPrice: 0.2878,
    poolUp: 350,
    poolDown: 180,
    closesInSeconds: 420,
  },
];

/** Generate mock price points for a given asset, simulating realistic price movements */
export function generateMockPriceData(
  asset: 'BTC' | 'ETH' | 'XLM',
  points: number = 80,
): PricePoint[] {
  const basePrices: Record<string, number> = {
    BTC: 67420,
    ETH: 3241,
    XLM: 0.2891,
  };

  const volatilities: Record<string, number> = {
    BTC: 250,
    ETH: 18,
    XLM: 0.004,
  };

  const basePrice = basePrices[asset] ?? 1;
  const volatility = volatilities[asset] ?? 0.01;
  const now = Math.floor(Date.now() / 1000);
  const interval = 60; // 1 minute intervals

  let price = basePrice;
  const data: PricePoint[] = [];

  for (let i = points; i >= 0; i--) {
    const time = now - i * interval;
    // Random walk with mean reversion
    const drift = (basePrice - price) * 0.01;
    const shock = (Math.random() - 0.5) * volatility * 2;
    price = price + drift + shock;
    if (price < basePrice * 0.95) price = basePrice * 0.95;
    if (price > basePrice * 1.05) price = basePrice * 1.05;

    data.push({
      time: time as unknown as number,
      value: Number(price.toFixed(asset === 'XLM' ? 4 : 2)),
    });
  }

  return data;
}

export const mockPriceData: Record<string, PricePoint[]> = {
  BTC: generateMockPriceData('BTC'),
  ETH: generateMockPriceData('ETH'),
  XLM: generateMockPriceData('XLM'),
};

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
  { id: '5', asset: 'ETH', result: 'Won', amount: 200, mode: 'updown' },
  { id: '6', asset: 'XLM', result: 'Lost', amount: 30, mode: 'precision' },
];

export const mockLandingStats = {
  totalRounds: 1247,
  vXlmDistributed: 4_200_000,
  activePlayers: 893,
};
