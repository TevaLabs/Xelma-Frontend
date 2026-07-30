import { useEffect, useState } from "react";
import { useProfileStore } from "../store/useProfileStore";
import { useWalletStore } from "../store/useWalletStore";
import ProfileSettingsModal from "./ProfileSettingsModal";
import IdenticonAvatar from "./IdenticonAvatar";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const cardShell = cx(
  "bg-white dark:bg-gray-800 p-4 shadow-sm rounded-xl",
  "border border-gray-100 dark:border-gray-700 transition-colors"
);

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

  // Loading skeleton — shown only on the first load before any data is present.
  if (isLoading && !profile) {
    return (
      <div className={cardShell} aria-busy="true" aria-label="Loading profile">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="h-14 w-14 rounded-2xl bg-gray-200 dark:bg-gray-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile?.name?.trim() || "Anonymous Player";
  const avatarUrl = profile?.avatarUrl ?? null;

  return (
    <>
      <section className={cardShell} aria-label="Your profile">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
            ) : (
              <IdenticonAvatar address={walletAddress} name={displayName} className="h-full w-full" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-800 dark:text-gray-100">
              {displayName}
            </p>
            {profile?.bio?.trim() ? (
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                {profile.bio}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                Predictions player
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className={cx(
              "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold",
              "bg-[#2C4BFD] text-white cursor-pointer hover:opacity-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C4BFD] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800"
            )}
            aria-label="Edit profile settings"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z"
              />
            </svg>
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
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
