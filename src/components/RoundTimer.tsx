import ContributorTaskPlaceholder from './ContributorTaskPlaceholder';

interface RoundTimerProps {
  playersOnline?: number;
}

/**
 * STUBBED for Stellar Wave hackathon — rebuild circular round timer.
 * Replace inline styles with Tailwind + brand tokens. Show countdown
 * and players-online label. Respect prefers-reduced-motion.
 */
const RoundTimer: React.FC<RoundTimerProps> = ({ playersOnline = 128 }) => {
  return (
    <ContributorTaskPlaceholder
      title="Rebuild Round Timer"
      issueHint={`Build a circular countdown timer with brand colors and "Playing now: ${playersOnline}". Avoid light-theme inline styles.`}
    />
  );
};

export default RoundTimer;
