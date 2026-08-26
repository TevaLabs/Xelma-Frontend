import clsx from 'clsx';
import { useProfileStore } from '../store/useProfileStore';

interface MaskedBalanceProps {
  value: string;
  label?: string;
  className?: string;
  maskedText?: string;
}

export default function MaskedBalance({
  value,
  label = 'Balance',
  className,
  maskedText = '••••••',
}: MaskedBalanceProps) {
  const streamerMode = useProfileStore((state) => Boolean(state.profile?.streamerMode));
  const accessibleValue = streamerMode ? `${label} hidden because streamer mode is enabled` : `${label}: ${value}`;

  return (
    <span className={className} aria-label={accessibleValue} title={streamerMode ? 'Hidden by streamer mode' : value}>
      <span aria-hidden className={clsx(streamerMode && 'select-none blur-sm')}>
        {streamerMode ? maskedText : value}
      </span>
    </span>
  );
}
