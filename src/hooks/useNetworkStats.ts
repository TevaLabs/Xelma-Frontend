import { useEffect, useState } from 'react';
import { statsApi, type NetworkStats } from '../lib/api-client';
import { mockLandingStats } from '../data/mockData';

export interface NetworkStatsState {
  /** Stats to render. Seeded with mock data so the UI never shows empty values. */
  stats: NetworkStats;
  /** True while the first request is in flight. */
  loading: boolean;
  /**
   * True when the displayed numbers are the mock fallback because the API was
   * unavailable or returned nothing usable.
   */
  isStale: boolean;
}

/**
 * Fetch live network metrics for the landing page.
 *
 * The hook seeds state with {@link mockLandingStats} so the stat cards render at
 * their final size immediately (no layout shift) while the request resolves. On
 * success the real values replace the mock; on failure the mock is kept and
 * `isStale` is set so the UI can show an offline badge.
 */
export function useNetworkStats(): NetworkStatsState {
  const [stats, setStats] = useState<NetworkStats>(mockLandingStats);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    let active = true;

    statsApi
      .getNetworkStats()
      .then((live) => {
        if (!active) return;
        if (live) {
          setStats(live);
          setIsStale(false);
        } else {
          setIsStale(true);
        }
      })
      .catch(() => {
        if (!active) return;
        setIsStale(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { stats, loading, isStale };
}
