import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Edit3,
  Link as LinkIcon,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import ProfileSettingsModal from '../components/ProfileSettingsModal';
import IdenticonAvatar from '../components/IdenticonAvatar';
import BalancesPanel from '../components/BalancesPanel';
import { useProfileStore } from '../store/useProfileStore';
import { useWalletStore } from '../store/useWalletStore';
import type { ProfileSettingsValues } from '../lib/profileApi';
import { Spinner } from '../components/ui/Spinner';

const defaultProfile: ProfileSettingsValues = {
  avatarUrl: null,
  name: '',
  bio: '',
  twitterLink: '',
  streamerMode: false,
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function normalizeLink(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    return parsed.href;
  } catch {
    return `https://${trimmed.replace(/^\/+/, '')}`;
  }
}

function displayHandle(url: string) {
  const normalized = normalizeLink(url);
  if (!normalized) return '';

  try {
    const parsed = new URL(normalized);
    return parsed.pathname.replace(/^\/+/, '') || parsed.hostname;
  } catch {
    return url;
  }
}

function ProfileAvatar({ profile }: { profile: ProfileSettingsValues }) {
  const displayName = profile.name.trim() || 'Player';
  const walletAddress = useWalletStore((s) => s.publicKey);

  return (
    <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-[#BEC7FE]/20 bg-[#111827] shadow-lg shadow-[#2C4BFD]/10 sm:h-32 sm:w-32">
      {profile.avatarUrl ? (
        <img
          src={profile.avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <IdenticonAvatar address={walletAddress} name={displayName} className="h-full w-full" />
      )}
    </div>
  );
}

export default function Profile() {
  const profile = useProfileStore((s) => s.profile);
  const isLoading = useProfileStore((s) => s.isLoading);
  const error = useProfileStore((s) => s.error);
  const loadProfile = useProfileStore((s) => s.loadProfile);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const resolvedProfile = useMemo<ProfileSettingsValues>(
    () => ({
      ...defaultProfile,
      ...(profile ?? {}),
      avatarUrl: profile?.avatarUrl ?? null,
      name: profile?.name ?? '',
      bio: profile?.bio ?? '',
      twitterLink: profile?.twitterLink ?? '',
      streamerMode: Boolean(profile?.streamerMode),
    }),
    [profile],
  );

  const displayName = resolvedProfile.name.trim() || 'Anonymous Player';
  const bio = resolvedProfile.bio.trim();
  const twitterUrl = normalizeLink(resolvedProfile.twitterLink);
  const hasProfileDetails = Boolean(
    resolvedProfile.name.trim() ||
      bio ||
      resolvedProfile.avatarUrl ||
      resolvedProfile.twitterLink.trim(),
  );

  return (
    <>
      <main className="xelma-grid-bg min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#22D3EE]">
                Player identity
              </p>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Profile</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-400">
                Manage the name, avatar, bio, and public link shown across Xelma.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/settings"
                className="btn-ghost inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold"
                aria-label="Open settings"
                data-testid="profile-open-settings"
              >
                <SettingsIcon className="h-4 w-4" aria-hidden />
                Settings
              </Link>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-bold"
              >
                <Edit3 className="h-4 w-4" aria-hidden />
                Edit profile
              </button>
            </div>
          </div>

          {isLoading && !profile ? (
            <section
              className="glass-card flex min-h-[420px] items-center justify-center rounded-xl p-8"
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <Spinner label="Loading profile" size="lg" />
                <p className="text-sm font-semibold text-gray-300">Loading profile...</p>
              </div>
            </section>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <section className="glass-card rounded-xl p-6 sm:p-8" aria-labelledby="profile-heading">
                {error && (
                  <div
                    className="mb-6 flex flex-col gap-3 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between"
                    role="alert"
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" aria-hidden />
                      <p>{error}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadProfile()}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300/30 px-3 py-2 text-xs font-bold text-red-50 hover:bg-red-400/10"
                    >
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                      Retry
                    </button>
                  </div>
                )}

                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <ProfileAvatar profile={resolvedProfile} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 id="profile-heading" className="break-words text-3xl font-black text-white">
                        {displayName}
                      </h2>
                      {resolvedProfile.streamerMode && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-2.5 py-1 text-xs font-bold text-[#A5F3FC]">
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          Streamer mode
                        </span>
                      )}
                    </div>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
                      {bio || 'Add a short bio so other players can recognize your profile.'}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      {twitterUrl ? (
                        <a
                          href={twitterUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-[#BEC7FE]/15 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-[#BEC7FE] hover:border-[#22D3EE]/40 hover:text-white"
                        >
                          <LinkIcon className="h-4 w-4" aria-hidden />
                          {displayHandle(resolvedProfile.twitterLink)}
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-2 rounded-lg border border-[#BEC7FE]/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-500">
                          <LinkIcon className="h-4 w-4" aria-hidden />
                          No public links yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!hasProfileDetails && (
                  <div className="mt-8 rounded-lg border border-[#2C4BFD]/25 bg-[#2C4BFD]/10 p-4 text-sm text-[#BEC7FE]">
                    Your profile is ready to personalize. Add a display name, avatar, and link to make
                    your account easier to recognize.
                  </div>
                )}
              </section>

              <aside className="space-y-6" aria-label="Profile details">
                <BalancesPanel />

                <section className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2C4BFD]/15 text-[#BEC7FE]">
                      <UserRound className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Identity status</h3>
                      <p className="text-xs text-gray-500">Profile visibility</p>
                    </div>
                  </div>

                  <dl className="mt-5 space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-gray-400">Display name</dt>
                      <dd className={cx('font-semibold', resolvedProfile.name.trim() ? 'text-white' : 'text-gray-500')}>
                        {resolvedProfile.name.trim() ? 'Set' : 'Missing'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-gray-400">Avatar</dt>
                      <dd className={cx('font-semibold', resolvedProfile.avatarUrl ? 'text-white' : 'text-gray-500')}>
                        {resolvedProfile.avatarUrl ? 'Uploaded' : 'Default'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-gray-400">Public link</dt>
                      <dd className={cx('font-semibold', twitterUrl ? 'text-white' : 'text-gray-500')}>
                        {twitterUrl ? 'Connected' : 'Not set'}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section className="glass-card rounded-xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#22D3EE]/10 text-[#67E8F9]">
                      <ShieldCheck className="h-5 w-5" aria-hidden />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Synced settings</h3>
                      <p className="text-xs text-gray-500">Server first, local fallback</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-gray-400">
                    Updates are saved through the profile store. If the server cannot be reached,
                    your latest changes stay available locally.
                  </p>
                </section>
              </aside>
            </div>
          )}
        </div>
      </main>

      {settingsOpen && (
        <ProfileSettingsModal
          key="profile-page-settings-modal"
          onClose={() => setSettingsOpen(false)}
          initialValues={resolvedProfile}
        />
      )}
    </>
  );
}
