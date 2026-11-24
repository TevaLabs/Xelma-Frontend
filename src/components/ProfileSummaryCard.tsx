import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Edit3, RefreshCw } from 'lucide-react';
import { useProfileStore } from '../store/useProfileStore';
import { useWalletStore } from '../store/useWalletStore';
import { avatarAltText } from '../utils/avatarAlt';
import IdenticonAvatar from './IdenticonAvatar';
import ProfileSettingsModal from './ProfileSettingsModal';
import GlassCard from './ui/GlassCard';

const FALLBACK_NAME = 'Anonymous Player';

/**
 * Compact profile summary for the dashboard: avatar, display name, bio and a
 * shortcut into the profile settings modal. Uses the shared glass card shell.
 */
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

  const displayName = profile?.name?.trim() || FALLBACK_NAME;
  const bio = profile?.bio?.trim();

  if (isLoading && !profile) {
    return (
      <GlassCard
        as="section"
        className="rounded-2xl p-5"
        aria-labelledby="profile-summary-title"
        aria-busy="true"
        data-testid="profile-summary-card"
      >
        <h2 id="profile-summary-title" className="sr-only">Your profile</h2>
        <span className="sr-only">Loading profile…</span>
        <div className="flex items-center gap-4 animate-pulse">
          <div className="h-16 w-16 shrink-0 rounded-xl bg-white/10" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="h-3 w-48 rounded bg-white/10" />
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <>
      <GlassCard
        as="section"
        className="rounded-2xl p-5"
        aria-labelledby="profile-summary-title"
        data-testid="profile-summary-card"
      >
        <h2 id="profile-summary-title" className="sr-only">Your profile</h2>

        {error && (
          <div
            className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200"
            role="alert"
          >
            <p className="min-w-0">{error}</p>
            <button
              type="button"
              onClick={() => void loadProfile()}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-rose-300/30 px-2 py-1 font-bold text-rose-50 hover:bg-rose-400/10"
            >
              <RefreshCw className="h-3 w-3" aria-hidden />
              Retry
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#BEC7FE]/20 bg-[#111827] shadow-lg shadow-[#2C4BFD]/10">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={avatarAltText(displayName)}
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
            <p
              className="truncate text-base font-bold text-white"
              data-testid="profile-summary-name"
            >
              {displayName}
            </p>
            <p
              className={
                bio
                  ? 'mt-1 line-clamp-2 text-sm text-gray-300'
                  : 'mt-1 line-clamp-2 text-sm italic text-gray-500'
              }
              data-testid="profile-summary-bio"
            >
              {bio || 'No bio yet. Add one so other players can recognize you.'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <Link
            to="/profile"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#BEC7FE] hover:text-white"
          >
            View profile
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-colors hover:border-white/30 hover:bg-white/5 hover:text-white"
            aria-haspopup="dialog"
          >
            <Edit3 className="h-3.5 w-3.5" aria-hidden />
            Edit profile
          </button>
        </div>
      </GlassCard>

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
