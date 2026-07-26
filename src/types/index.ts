export type RoundMode = 'updown' | 'precision';
export type RoundStatus = 'live' | 'new' | 'closing';

export interface MockRound {
  id: number;
  asset: 'BTC' | 'ETH' | 'XLM';
  mode: RoundMode;
  status: RoundStatus;
  startPrice: number;
  poolUp?: number;
  poolDown?: number;
  totalPool?: number;
  predictionCount?: number;
  closesInSeconds: number;
}

export interface MockUserStats {
  balance: number;
  pendingWinnings: number;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
  xp: number;
  rank: string;
}

export interface RankTier {
  name: string;
  minXp: number;
  label: string;
}

export interface RecentActivityItem {
  id: string;
  asset: string;
  result: 'Won' | 'Lost';
  amount: number;
  mode: RoundMode;
}
