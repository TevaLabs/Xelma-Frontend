import type { Guide, Tip } from '../../types/education';
import type { NetworkStats, PoolStats, UserStats } from '../../lib/api-client';

export const mockGuides: Guide[] = [
  {
    id: 'guide-1',
    title: 'How UP/DOWN rounds work',
    description: 'Learn how to predict whether the XLM price will rise or fall.',
    category: 'Basics',
    readTime: '4 min',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'guide-2',
    title: 'Precision predictions explained',
    description: 'Call the exact closing price and earn a larger share of the pool.',
    category: 'Strategy',
    readTime: '6 min',
    createdAt: '2026-01-12T09:00:00.000Z',
  },
  {
    id: 'guide-3',
    title: 'Connecting Freighter',
    description: 'Step-by-step wallet setup for the Stellar testnet.',
    category: 'Wallet',
    readTime: '3 min',
    createdAt: '2026-01-15T09:00:00.000Z',
  },
];

export const mockTip: Tip = {
  id: 'tip-1',
  title: 'Pro tip',
  content: 'Watch the pool split before you predict: a lopsided pool pays out more when you are right.',
  category: 'Strategy',
  createdAt: '2026-01-20T09:00:00.000Z',
};

export const mockNetworkStats: NetworkStats = {
  totalRounds: 1247,
  vXlmDistributed: 4_200_000,
  activePlayers: 893,
};

export const mockUserStats: UserStats = {
  balance: 1000,
  pendingWinnings: 42,
  totalWins: 18,
  totalLosses: 11,
  currentStreak: 3,
  xp: 640,
  rank: 'Rookie',
};

export const mockPools: PoolStats[] = [
  {
    asset: 'BTC',
    totalVolume: 1250000,
    volumeTrend: [980000, 1010000, 1040000, 1120000, 1180000, 1210000, 1250000],
    upDownPool: { total: 850000, up: 450000, down: 400000 },
    precisionPool: { total: 400000, predictions: 124 },
    historicalYield: 4.2,
  },
  {
    asset: 'ETH',
    totalVolume: 820000,
    volumeTrend: [860000, 840000, 800000, 780000, 795000, 810000, 820000],
    upDownPool: { total: 600000, up: 350000, down: 250000 },
    precisionPool: { total: 220000, predictions: 89 },
    historicalYield: 3.8,
  },
  {
    asset: 'XLM',
    totalVolume: 450000,
    volumeTrend: [520000, 500000, 480000, 470000, 460000, 455000, 450000],
    upDownPool: { total: 300000, up: 100000, down: 200000 },
    precisionPool: { total: 150000, predictions: 45 },
    historicalYield: 5.1,
  },
];
