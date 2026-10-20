import { getRankTiers } from '../data/mockData';

interface RankProgressBarProps {
  xp: number;
}

const TIER_STYLES: Record<string, { bg: string; text: string; glow: string }> = {
  Rookie: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-400',
    glow: 'shadow-[0_0_12px_rgba(156,163,175,0.3)]',
  },
  Trader: {
    bg: 'bg-green-500/10',
    text: 'text-green-400',
    glow: 'shadow-[0_0_12px_rgba(34,197,94,0.3)]',
  },
  Analyst: {
    bg: 'bg-xelma-blue/10',
    text: 'text-xelma-blue',
    glow: 'shadow-[0_0_12px_rgba(44,75,253,0.3)]',
  },
  Strategist: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]',
  },
  Master: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]',
  },
  Legend: {
    bg: 'bg-pink-500/10',
    text: 'text-pink-400',
    glow: 'shadow-[0_0_12px_rgba(236,72,153,0.3)]',
  },
};

export default function RankProgressBar({ xp }: RankProgressBarProps) {
  const { current, next, progress } = getRankTiers(xp);
  const styles = TIER_STYLES[current.name] ?? TIER_STYLES.Analyst;
  const nextStyles = next ? (TIER_STYLES[next.name] ?? TIER_STYLES.Analyst) : styles;

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Rank</span>
        <span
          className={`rounded-full border px-3 py-1 text-sm font-bold ${styles.bg} ${styles.text} border-current/20 ${styles.glow}`}
        >
          {current.name}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Experience</span>
          <span className="font-mono text-sm text-gray-300">{xp} XP</span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={
            next
              ? `XP progress toward ${next.name}: ${Math.round(progress)}%`
              : 'Maximum rank reached'
          }
          className="h-2.5 overflow-hidden rounded-full bg-gray-800/50 border border-gray-700/50"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${styles.text} bg-current ${styles.glow}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {next ? (
          <p className="text-xs text-gray-500">
            <span className="font-mono">{xp}</span> /{' '}
            <span className="font-mono">{next.minXp}</span> XP to{' '}
            <span className={nextStyles.text}>{next.name}</span>
          </p>
        ) : (
          <p className="text-xs text-amber-400">Maximum rank reached!</p>
        )}
      </div>
    </div>
  );
}
