import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import clsx from 'clsx';
import Avatar from '../assets/avatar.svg';
import { leaderboardApi, type LeaderboardEntry } from '../lib/api-client';
import { useWalletStore, selectIsWalletConnected } from '../store/useWalletStore';
import { LoadingState, ErrorState, EmptyState } from './ui/StatusStates';
import { PanelHeader } from './ui/PanelHeader';
import { formatVXLM } from '../lib/utils';
import { TRANSITION, TRANSITION_COLORS, TRANSFORM_TRANSITION } from '../utils/motion';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

const FILTER_OPTIONS = ['all', 'daily', 'weekly', 'monthly'] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

const FILTER_PARAM = 'filter';
const ROW_HEIGHT = 80; // px – fixed height for every virtualised row
const OVERSCAN = 5;

function isValidFilter(value: string | null): value is FilterOption {
  return FILTER_OPTIONS.includes(value as FilterOption);
}

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  xlm: number;
}

function mapEntryToUser(entry: LeaderboardEntry, index: number): LeaderboardUser {
  const id = String(entry.id ?? entry.userId ?? index);
  const name = entry.username ?? entry.name ?? 'Anonymous';
  const xlm = Number(entry.xlm ?? entry.score ?? 0);
  const avatar = entry.avatar && typeof entry.avatar === 'string' ? entry.avatar : Avatar;
  return { id, name, avatar, xlm };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Leaderboard = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── #203: URL query param for filter ──────────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams();
  const rawFilter = searchParams.get(FILTER_PARAM);
  const activeFilter: FilterOption = isValidFilter(rawFilter) ? rawFilter : 'all';

  const setFilter = useCallback(
    (next: FilterOption) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          updated.set(FILTER_PARAM, next);
          return updated;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leaderboardApi.getLeaderboard('UP_DOWN');
      const mapped = (Array.isArray(data) ? data : []).map(mapEntryToUser);
      setUsers(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLeaderboard();
  }, [fetchLeaderboard]);

  // ── Wallet ─────────────────────────────────────────────────────────────────
  const walletPublicKey = useWalletStore((s) => s.publicKey);
  const isWalletConnected = useWalletStore(selectIsWalletConnected);

  // ── Sorting & derived data ─────────────────────────────────────────────────
  const sortedUsers = useMemo(() => [...users].sort((a, b) => b.xlm - a.xlm), [users]);

  const currentUser = useMemo(() => {
    if (!walletPublicKey) return null;
    return sortedUsers.find((u) => u.id === walletPublicKey) ?? null;
  }, [sortedUsers, walletPublicKey]);

  const currentUserRank = currentUser
    ? sortedUsers.findIndex((u) => u.id === currentUser.id) + 1
    : null;

  const walletShortAddress = walletPublicKey
    ? `${walletPublicKey.slice(0, 4)}...${walletPublicKey.slice(-4)}`
    : 'Your wallet';

  const topThree = sortedUsers.slice(0, 3);
  const restUsers = sortedUsers.slice(3);
  const [rank1, rank2, rank3] = topThree;
  const podiumSlots = [
    { rank: 2, user: rank2, order: 'order-2 md:order-1', medal: 'Silver', avatarSize: 'w-24 h-24', border: 'border-4 border-[#C0C0C0]', barHeight: 'h-28' },
    { rank: 1, user: rank1, order: 'order-1 md:order-2 -mt-6 md:-mt-12 z-10', medal: 'Gold', avatarSize: 'w-32 h-32', border: 'border-[5px] border-[#FFD700]', barHeight: 'h-36' },
    { rank: 3, user: rank3, order: 'order-3 md:order-3', medal: 'Bronze', avatarSize: 'w-24 h-24', border: 'border-4 border-[#CD7F32]', barHeight: 'h-20' },
  ] as const;

  // ── #202: Virtualizer setup ────────────────────────────────────────────────
  const listRef = useRef<HTMLDivElement | null>(null);

  // eslint-disable-next-line react-hooks/incompatible-library -- useVirtualizer intentionally returns functions; React Compiler memoization skip is expected
  const rowVirtualizer = useVirtualizer({
    count: restUsers.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------

  const containerWrapper = (children: React.ReactNode) => (
    <div className="xelma-grid-bg min-h-screen text-[#F3F4F6] relative overflow-hidden px-4 pb-12 pt-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(44,75,253,0.15),_transparent_60%)]" />
      <div className="relative w-full max-w-4xl mx-auto">
        <h1 className="hero-headline text-3xl sm:text-4xl font-extrabold text-white text-center mb-16 tracking-tight">
          Leaderboard
        </h1>
        {children}
      </div>
    </div>
  );

  if (loading) {
    return containerWrapper(
      <LoadingState message="Loading leaderboard..." className="min-h-[40vh]" />
    );
  }

  if (error) {
    return containerWrapper(
      <ErrorState message={error} onRetry={fetchLeaderboard} className="min-h-[40vh]" />
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="xelma-grid-bg min-h-screen text-[#F3F4F6] relative overflow-hidden px-4 pb-12 pt-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(44,75,253,0.15),_transparent_60%)]" />
      <div className="pointer-events-none absolute -left-24 top-32 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-16 h-96 w-96 rounded-full bg-[#2C4BFD]/5 blur-3xl" />

      <div className="relative w-full max-w-4xl mx-auto">
        <PanelHeader
          variant="hero"
          className="mb-10"
          title="Leaderboard"
          action={
            <div
              role="tablist"
              aria-label="Time range filter"
              className="flex justify-center gap-2 flex-wrap"
            >
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  role="tab"
                  aria-selected={activeFilter === opt}
                  onClick={() => setFilter(opt)}
                  className={clsx(
                    'rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors',
                    activeFilter === opt
                      ? 'bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                      : 'glass-card text-gray-400 hover:text-white hover:border-cyan-500/40'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          }
        />

        {/* ── Sticky current-user summary (#202 preserved) ── */}
        {isWalletConnected && (
          <div
            className={clsx(
              `mb-8 rounded-2xl glass-card p-5 lg:sticky lg:top-20 lg:z-20 ${TRANSITION}`,
              currentUser ? 'accent-border-teal' : ''
            )}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#22d3ee]">
                  Current wallet summary
                </p>
                <p className="mt-2 text-lg font-bold text-white">
                  {currentUser ? currentUser.name : walletShortAddress}
                </p>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm font-semibold text-cyan-200">
                  {currentUser ? `Rank #${currentUserRank}` : 'Unranked'}
                </p>
                <p className="text-sm text-gray-400">
                  {currentUser
                    ? formatVXLM(currentUser.xlm)
                    : 'Predictions will place you on the leaderboard.'}
                </p>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400 border-t border-white/5 pt-3">
              {currentUser
                ? 'Keep making accurate predictions to move up the leaderboard.'
                : 'Your connected wallet has not yet appeared on the leaderboard. Continue playing to earn a rank.'}
            </div>
          </div>
        )}

        {/* ── Podium ── */}
        <div
          className="flex flex-col md:flex-row items-end justify-center gap-6 mb-16 mt-24"
          aria-label="Top three leaderboard podium"
        >
          {podiumSlots.map(({ rank, user, order, medal, avatarSize, border, barHeight }) => user && (
            <div key={rank} className={`${order} flex flex-col items-center w-full md:w-1/3 group`}>
              <div className={`relative ${rank === 1 ? 'mb-5' : 'mb-4'} ${TRANSFORM_TRANSITION} md:group-hover:-translate-y-2`}>
                <div className={`${avatarSize} ${border} rounded-full overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.2)] z-10 relative bg-[#111827] ring-2 ring-cyan-400/20 ring-offset-2 ring-offset-[#0A0F1A]`}>
                  <img src={user.avatar} alt={`${medal} medal: ${user.name}`} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-cyan-500 text-white text-sm font-extrabold py-1 px-3.5 rounded-full shadow-[0_0_14px_rgba(6,182,212,0.45)] z-20 whitespace-nowrap min-w-[32px] text-center border-2 border-[#0A0F1A]">
                  #{rank}
                </div>
                {rank === 1 && <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-4xl" aria-hidden="true">👑</div>}
              </div>
              <p className={`font-bold text-white ${rank === 1 ? 'text-2xl' : 'text-lg'} mb-1 group-hover:text-cyan-200 ${TRANSITION_COLORS}`}>
                {user.name}
              </p>
              <p className="text-cyan-300 font-bold text-sm bg-cyan-500/10 border border-cyan-500/25 px-3.5 py-1 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.08)]">
                {formatVXLM(user.xlm)}
              </p>
              <div className={`w-full ${barHeight} glass-card bg-gradient-to-t from-cyan-500/20 via-cyan-500/5 to-slate-900/40 rounded-t-2xl border-b-0 border-cyan-500/20 mt-4 hidden md:block shadow-[0_-4px_20px_rgba(6,182,212,0.08)]`} />
            </div>
          ))}
        </div>

        {/* ── #202: Virtualised ranked list ── */}
        {restUsers.length > 0 ? (
          <div
            ref={listRef}
            className="max-w-3xl mx-auto overflow-auto"
            style={{ height: Math.min(restUsers.length * ROW_HEIGHT, 600) }}
            aria-label="Leaderboard ranked list"
          >
            <ul
              style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const user = restUsers[virtualRow.index];
                const isCurrent = currentUser?.id === user.id;

                return (
                  <li
                    key={user.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      padding: '0 0 12px 0',
                    }}
                  >
                    <div
                      className={clsx(
                        `flex flex-col items-center gap-3 md:flex-row md:justify-between md:gap-0 rounded-2xl p-4 shadow-sm group h-full ${TRANSITION}`,
                        isCurrent
                          ? 'glass-card accent-border-teal bg-cyan-500/5'
                          : 'glass-card hover:bg-white/5 hover:border-cyan-500/30 hover:shadow-[0_0_15px_rgba(6,182,212,0.08)] transform hover:-translate-y-0.5'
                      )}
                    >
                      <div className="flex items-center gap-6 w-full justify-center md:justify-start">
                        <span className="text-cyan-400/60 font-bold text-lg w-8 text-center tabular-nums">
                          {virtualRow.index + 4}
                        </span>
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-900 border border-white/10 group-hover:border-cyan-500/30 transition-colors shrink-0">
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-bold text-white text-lg group-hover:text-cyan-200 transition-colors truncate">
                          {user.name}
                        </span>
                      </div>
                      <div className="text-center md:text-right w-full md:w-auto mt-2 md:mt-0 bg-cyan-950/30 border border-cyan-500/20 px-4 py-2 rounded-xl shadow-[0_0_12px_rgba(6,182,212,0.05)] shrink-0">
                        <span className="font-bold text-cyan-300 text-lg tabular-nums">
                          {formatVXLM(user.xlm)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : sortedUsers.length === 0 ? (
          <EmptyState
            title="No leaderboard data yet"
            message="Be the first to make a prediction and claim the top spot."
            className="max-w-xl mx-auto"
          />
        ) : null}
      </div>
    </div>
  );
};

export default Leaderboard;