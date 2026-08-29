import clsx from 'clsx';
import { useProfileStore } from '../store/useProfileStore';
import { useSettingsStore, selectStreamerMode } from '../store/useSettingsStore';

interface MaskedBalanceProps {
  value: string;
  label?: string;
  className?: string;
  maskedText?: string;
}

/**
 * Streamer mode has two independent sources: the persisted profile flag
 * (`useProfileStore`, loaded from the API / saved via the profile modal) and
 * the local settings mirror (`useSettingsStore`, flipped instantly from
 * /settings without a profile save). Precedence: either one being true hides
 * the balance — settings is the fast local override, profile is the
 * source of truth once saved, and neither should be able to "unhide" what
 * the other enabled.
 */
export default function MaskedBalance({
  value,
  label = 'Balance',
  className,
  maskedText = '••••••',
}: MaskedBalanceProps) {
  const profileStreamerMode = useProfileStore((state) => Boolean(state.profile?.streamerMode));
  const settingsStreamerMode = useSettingsStore(selectStreamerMode);
  const streamerMode = profileStreamerMode || settingsStreamerMode;
  const accessibleValue = streamerMode ? `${label} hidden because streamer mode is enabled` : `${label}: ${value}`;

  return (
    <span className={className} aria-label={accessibleValue} title={streamerMode ? 'Hidden by streamer mode' : value}>
      <span aria-hidden className={clsx(streamerMode && 'select-none blur-sm')}>
        {streamerMode ? maskedText : value}
      </span>
    </span>
  );
}
