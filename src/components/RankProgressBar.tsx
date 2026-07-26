import ContributorTaskPlaceholder from './ContributorTaskPlaceholder';

interface RankProgressBarProps {
  xp: number;
}

/**
 * STUBBED for Stellar Wave hackathon — rebuild XP / rank progress UI.
 * Use `getRankTiers(xp)` from `src/data/mockData.ts` for tier math.
 * Must expose a proper progressbar ARIA pattern.
 */
export default function RankProgressBar({ xp }: RankProgressBarProps) {
  return (
    <ContributorTaskPlaceholder
      title="Rebuild Rank Progress Bar"
      issueHint={`Render rank badge + XP progress for xp=${xp}. Use getRankTiers() and accessible progressbar semantics.`}
    />
  );
}
