import { useEffect, useState } from 'react';
import { useProfileStore } from '../store/useProfileStore';
import ProfileSettingsModal from './ProfileSettingsModal';
import ContributorTaskPlaceholder from './ContributorTaskPlaceholder';

/**
 * STUBBED for contributor rebuild — store hydrate + settings modal kept.
 * Rebuild as a glass-card terminal profile summary (no light white card).
 */
export default function ProfileSummaryCard() {
  const profile = useProfileStore((s) => s.profile);
  const isLoading = useProfileStore((s) => s.isLoading);
  const error = useProfileStore((s) => s.error);
  const loadProfile = useProfileStore((s) => s.loadProfile);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const displayName = profile?.name?.trim() || 'Anonymous Player';

  return (
    <>
      <section aria-label="Your profile" aria-busy={isLoading && !profile}>
        <ContributorTaskPlaceholder
          title="Rebuild Profile Summary Card"
          issueHint={`Show avatar/initials, name "${displayName}", bio, and Edit CTA opening ProfileSettingsModal. Use glass-card dark terminal styling.`}
        >
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="mt-4 rounded-lg border border-white/20 px-3 py-1.5 text-xs text-gray-200 hover:bg-white/5"
            aria-label="Edit profile settings"
          >
            Edit (stub)
          </button>
          {error ? (
            <p className="mt-2 text-xs text-rose-400" role="alert">
              {error}
            </p>
          ) : null}
        </ContributorTaskPlaceholder>
      </section>

      {settingsOpen && (
        <ProfileSettingsModal
          key="profile-summary-settings-modal"
          onClose={() => setSettingsOpen(false)}
          initialValues={profile ?? undefined}
        />
      )}
    </>
  );
}
