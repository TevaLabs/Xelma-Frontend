import type { NetworkStats, UserStats } from '../../../lib/api-client';

/**
 * Fixture data for the stats endpoints (`/api/stats/network` and `/api/stats`).
 * Mirrors the shapes produced by `normalizeNetworkStats` / `normalizeUserStats`.
 */

export const mockNetworkStats: NetworkStats = {
  totalRounds: 1247,
  vXlmDistributed: 4_200_000,
  activePlayers: 893,
};

export const mockUserStats: UserStats = {
  balance: 750.5,
  pendingWinnings: 250,
  totalWins: 12,
  totalLosses: 4,
  currentStreak: 3,
  xp: 1500,
  rank: 'Gold',
};
