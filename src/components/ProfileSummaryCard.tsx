import { useEffect, useState } from 'react';
import { Edit3 } from 'lucide-react';
import { useProfileStore } from '../store/useProfileStore';
import { useWalletStore } from '../store/useWalletStore';
import IdenticonAvatar from './IdenticonAvatar';
import ProfileSettingsModal from './ProfileSettingsModal';

export default function ProfileSummaryCard() {
  const profile = useProfileStore((s) => s.profile);
  const isLoading = useProfileStore((s) => s.isLoading);
  const error = useProfileStore((s) => s.error);
  const loadProfile = useProfileStore((s) => s.loadProfile);
  const walletAddress = useWalletStore((s) => s.publicKey);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const displayName = profile?.name?.trim() || 'Anonymous Player';
  const bio = profile?.bio?.trim();

  if (isLoading && !profile) {
    return (
      <section className="glass-card rounded-2xl p-5" aria-label="Your profile" aria-busy="true">
        <span className="sr-only">Loading profile…</span>
        <div className="flex items-center gap-4 animate-pulse">
          <div className="h-16 w-16 shrink-0 rounded-xl bg-white/10" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-3 w-48 rounded bg-white/10" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="glass-card rounded-2xl p-5" aria-label="Your profile">
        <p className="text-sm text-rose-400" role="alert">{error}</p>
      </section>
    );
  }

  return (
    <>
      <section className="glass-card rounded-2xl p-5" aria-label="Your profile">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#BEC7FE]/20 bg-[#111827]">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <IdenticonAvatar
                address={walletAddress}
                name={displayName}
                className="h-full w-full"
                size={64}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold text-white">{displayName}</h2>
            {bio && (
              <p className="mt-1 line-clamp-2 text-sm text-gray-400">{bio}</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="shrink-0 rounded-lg border border-white/20 p-2 text-gray-400 transition-colors hover:border-white/30 hover:bg-white/5 hover:text-white"
            aria-label="Edit profile settings"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
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
