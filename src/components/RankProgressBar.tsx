import { getRankTiers } from '../data/mockData';

interface RankProgressBarProps {
  xp: number;
}

const TIER_COLORS: Record<string, string> = {
  Rookie: '#9CA3AF',
  Trader: '#22C55E',
  Analyst: '#2C4BFD',
  Strategist: '#A855F7',
  Master: '#F59E0B',
  Legend: '#EC4899',
};

export default function RankProgressBar({ xp }: RankProgressBarProps) {
  const { current, next, progress } = getRankTiers(xp);
  const color = TIER_COLORS[current.name] ?? '#2C4BFD';
  const nextColor = next ? (TIER_COLORS[next.name] ?? '#2C4BFD') : color;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">Rank</span>
        <span
          className="rounded-full px-3 py-1 text-sm font-bold"
          style={{ backgroundColor: `${color}26`, color }}
        >
          {current.name}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Experience</span>
          <span className="font-mono text-sm text-gray-300">{xp} XP</span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={xp - current.minXp}
          aria-valuemin={0}
          aria-valuemax={next ? next.minXp - current.minXp : xp - current.minXp}
          aria-label={
            next
              ? `XP progress toward ${next.name}: ${Math.round(progress)}%`
              : 'Maximum rank reached'
          }
          className="h-2 overflow-hidden rounded-full bg-gray-800"
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, backgroundColor: next ? color : nextColor }}
          />
        </div>

        {next ? (
          <p className="text-xs text-gray-500">
            <span className="font-mono">{xp}</span> /{' '}
            <span className="font-mono">{next.minXp}</span> XP to{' '}
            <span style={{ color: nextColor }}>{next.name}</span>
          </p>
        ) : (
          <p className="text-xs text-amber-400">Maximum rank reached!</p>
        )}
      </div>
    </div>
  );
}
