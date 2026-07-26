import { Activity } from 'lucide-react';
import type { RecentActivityItem } from '../types';

interface RecentActivityProps {
  items: RecentActivityItem[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export default function RecentActivity({ items, isLoading, error, onRetry }: RecentActivityProps) {
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

      {items.length === 0 ? (
        <div
          role="status"
          aria-label="No recent predictions"
          className="mt-6 flex flex-col items-center gap-3 py-8 text-center"
        >
          <Activity className="h-10 w-10 text-gray-600" aria-hidden="true" />
          <p className="text-sm font-medium text-gray-400">No predictions yet</p>
          <p className="text-xs text-gray-600">
            Make your first prediction to see your activity here.
          </p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
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
                    item.result === 'Won' ? 'text-green-400' : 'text-rose-400'
                  }`}
                >
                  {item.result === 'Won' ? 'Correct' : 'Incorrect'}
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
