import { useState } from 'react';
import { Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import type { RecentActivityItem } from '../types';

type FilterOption = 'all' | 'correct' | 'incorrect';

const FILTER_OPTIONS: FilterOption[] = ['all', 'correct', 'incorrect'];

const FILTER_LABELS: Record<FilterOption, string> = {
  all: 'All',
  correct: 'Correct',
  incorrect: 'Incorrect',
};

interface RecentActivityProps {
  items: RecentActivityItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function RecentActivity({ items, isLoading, error, onRetry }: RecentActivityProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');

  const filteredItems =
    activeFilter === 'all'
      ? items
      : items.filter((item) =>
          activeFilter === 'correct' ? item.result === 'Won' : item.result === 'Lost',
        );

  // Counts are always derived from the full item set (not filteredItems) so
  // every chip shows its own total regardless of which filter is active.
  const filterCounts: Record<FilterOption, number> = {
    all: items.length,
    correct: items.filter((item) => item.result === 'Won').length,
    incorrect: items.filter((item) => item.result === 'Lost').length,
  };

  // Loading state
  if (isLoading) {
    return (
      <section className="glass-card rounded-2xl p-5" aria-labelledby="recent-activity-title" aria-busy="true">
        <h2 id="recent-activity-title" className="text-lg font-bold text-white animate-pulse">
          Recent Predictions
        </h2>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 animate-pulse"
            >
              <div className="space-y-2">
                <div className="h-4 w-12 rounded bg-white/10" />
                <div className="h-3 w-8 rounded bg-white/10" />
              </div>
              <div className="text-right space-y-2">
                <div className="h-4 w-16 rounded bg-white/10" />
                <div className="h-3.5 w-20 rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="glass-card rounded-2xl p-5" aria-labelledby="recent-activity-title">
        <h2 id="recent-activity-title" className="text-lg font-bold text-white">
          Recent Predictions
        </h2>
        <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-red-500 mb-2">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 w-full rounded-xl border py-2 text-sm font-semibold text-red-200 bg-red-500/20 border-red-400/50 hover:bg-red-500/30"
            >
              Retry
            </button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="glass-card rounded-2xl p-5" aria-labelledby="recent-activity-title">
      <h2 id="recent-activity-title" className="text-lg font-bold text-white">
        Recent Predictions
      </h2>

      <div
        role="tablist"
        aria-label="Filter predictions"
        className="mt-3 flex gap-2"
      >
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            role="tab"
            aria-selected={activeFilter === opt}
            aria-label={`${FILTER_LABELS[opt]} (${filterCounts[opt]})`}
            onClick={() => setActiveFilter(opt)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors',
              activeFilter === opt
                ? 'bg-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                : 'glass-card text-gray-400 hover:text-white hover:border-cyan-500/40',
            )}
          >
            {opt}
            <span
              aria-hidden="true"
              className={cn(
                'inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold normal-case tracking-normal',
                activeFilter === opt ? 'bg-black/20' : 'bg-white/10',
              )}
            >
              {filterCounts[opt]}
            </span>
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div
          role="status"
          aria-label={items.length === 0 ? 'No recent predictions' : 'No matching predictions'}
          className="mt-6 flex flex-col items-center gap-3 py-8 text-center"
        >
          <Activity className="h-10 w-10 text-gray-600" aria-hidden="true" />
          {items.length === 0 ? (
            <>
              <p className="text-sm font-medium text-gray-400">No predictions yet</p>
              <p className="text-xs text-gray-600">
                Make your first prediction to see your activity here.
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-gray-400">
              No {activeFilter === 'correct' ? 'correct' : 'incorrect'} predictions yet
            </p>
          )}
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {filteredItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-white">{item.asset}</p>
                <p className="text-xs uppercase text-gray-500">{item.mode}</p>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-bold ${
                    item.result === 'Won' ? 'text-green-400' :
                    item.result === 'Pending' ? 'text-yellow-400 animate-pulse' :
                    item.result === 'Failed' ? 'text-gray-500 line-through' :
                    'text-rose-400'
                  }`}
                >
                  {item.result === 'Won' ? 'Correct' :
                   item.result === 'Pending' ? 'Pending...' :
                   item.result === 'Failed' ? 'Failed' :
                   'Incorrect'}
                </p>
                <p className="text-xs text-gray-400">{item.amount} vXLM</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
